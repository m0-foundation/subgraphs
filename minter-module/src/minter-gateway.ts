import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';
import { ActiveMinterList, DailyAccruedMinterRate } from '../generated/schema';
import {
    BurnExecuted as InactiveBurnExecutedEvent,
    BurnExecuted1 as ActiveBurnExecutedEvent,
    MinterActivated as MinterActivatedEvent,
    MinterDeactivated as MinterDeactivatedEvent,
    MintExecuted as MintExecutedEvent,
    MissedIntervalsPenaltyImposed as MissedIntervalsPenaltyImposedEvent,
    UndercollateralizedPenaltyImposed as UndercollateralizedPenaltyImposedEvent,
    MinterGateway as MinterGatewayContract,
} from '../generated/MinterGateway/MinterGateway';

const MINTER_GATEWAY_ADDRESS = '0xf7f9638cb444D65e5A40bF5ff98ebE4ff319F04E';

const ACTIVE_MINTER_LIST_ID = 'active_minter_list';

/* ============ Handlers ============ */

export function handleMintExecuted(event: MintExecutedEvent): void {
    updateDailyAccruedMinterRateMintAmount(event.params.minter, event.block.timestamp, event.params.amount);
}

export function handleActiveBurn(event: ActiveBurnExecutedEvent): void {
    updateDailyAccruedMinterRateBurnAmount(event.params.minter, event.block.timestamp, event.params.amount);
}

export function handleInactiveBurn(event: InactiveBurnExecutedEvent): void {
    updateDailyAccruedMinterRateBurnAmount(event.params.minter, event.block.timestamp, event.params.amount);
}

export function handleMinterActivated(event: MinterActivatedEvent): void {
    const minterAddress = event.params.minter.toHexString();
    const minterList = getMinterList();

    const filteredList = minterList.minterAddresses;
    //Array.includes() does not exist here
    for (let i = 0; i < filteredList.length; i++) {
        if (filteredList[i] == minterAddress) {
            return;
        }
    }

    log.info('addMinterToList: #{}', [minterAddress]);

    // be aware that changing the array directly on the entity has no effect.
    // the changed array has to be set/assigned to the entity property, for the change to be persisted
    filteredList.push(minterAddress);
    minterList.minterAddresses = filteredList;
    minterList.save();
}

export function handleMinterDeactivated(event: MinterDeactivatedEvent): void {
    const minterAddress = event.params.minter.toHexString();
    const minterList = getMinterList();

    const filteredList: string[] = new Array<string>();
    //Array.includes() does not exist here
    for (let i = 0; i < minterList.minterAddresses.length; i++) {
        if (minterList.minterAddresses[i] != minterAddress) {
            filteredList.push(minterList.minterAddresses[i]);
        }
    }

    log.info('removeMinterFromList: #{}', [minterAddress]);

    // be aware that changing the array directly on the entity has no effect.
    // the changed array has to be set/assigned to the entity property, for the change to be persisted
    minterList.minterAddresses = filteredList;
    minterList.save();
}

export function handleMissedIntervalsPenaltyImposed(event: MissedIntervalsPenaltyImposedEvent): void {
    updateDailyAccruedMinterRatePenaltyAmount(event.params.minter, event.block.timestamp, event.params.penaltyAmount);
}

export function handleUndercollateralizedPenaltyImposed(event: UndercollateralizedPenaltyImposedEvent): void {
    updateDailyAccruedMinterRatePenaltyAmount(event.params.minter, event.block.timestamp, event.params.penaltyAmount);
}

export function handleBlock(block: ethereum.Block): void {
    const blockDate = blockTimeToDate(block.timestamp);
    const todayIsoString = blockDate.toISOString();
    const currentTime = todayIsoString.substring(11, 19);
    if (currentTime > '00:01:00') {
        // we only care about the first block of the day
        // so if the blocktime is greater than 1 minute past midnight - exit
        return;
    }

    log.info('handleBlock: #{} - #{}', [todayIsoString, block.number.toString()]);

    const currentDay = todayIsoString.substring(0, 10); //YYYY-MM-DD
    // since we only run this the first minute of the day - an hour ago is always yesterday
    const yesterdayDay = blockTimeToDate(block.timestamp.minus(BigInt.fromI32(3600)))
        .toISOString()
        .substring(0, 10); //YYYY-MM-DD

    const minterList = getMinterList();
    log.info('loopOverMinters: #{}', [minterList.minterAddresses.length.toString()]);

    if (minterList.minterAddresses.length === 0) {
        return;
    }

    for (let i = 0; i < minterList.minterAddresses.length; i++) {
        const minter = Address.fromString(minterList.minterAddresses[i]);

        const currentDayEntityId = `${currentDay}-${minter.toHexString()}`;
        let currentDayEntity = DailyAccruedMinterRate.load(currentDayEntityId);
        if (currentDayEntity) {
            // there is already an entity for this minter and date - nothing to do
            continue;
        }

        log.info('createDailyEntry: #{}', [minter.toHexString()]);

        const owedM = _getActiveOwedMOf(minter);
        currentDayEntity = new DailyAccruedMinterRate(currentDayEntityId);
        currentDayEntity.date = currentDay;
        currentDayEntity.minter = minter.toHexString();
        currentDayEntity.owedMStartOfDay = owedM;
        currentDayEntity.owedMEndOfDay = owedM; //will be overwritten later
        currentDayEntity.dailyTotalBurnAmount = BigInt.fromI32(0);
        currentDayEntity.dailyTotalMintAmount = BigInt.fromI32(0);
        currentDayEntity.dailyTotalPenaltyAmount = BigInt.fromI32(0);
        currentDayEntity.accruedMinterRate = BigInt.fromI32(0);
        currentDayEntity.save();

        let yesterdayDayEntity = DailyAccruedMinterRate.load(`${yesterdayDay}-${minter.toHexString()}`);
        if (!yesterdayDayEntity) {
            // there is no entity for this minter yesterday
            continue;
        }

        // yesterdays end owedM = todays start owedM
        yesterdayDayEntity.owedMEndOfDay = owedM;
        yesterdayDayEntity.accruedMinterRate = owedM
            .minus(yesterdayDayEntity.owedMStartOfDay)
            .minus(yesterdayDayEntity.dailyTotalMintAmount)
            .minus(yesterdayDayEntity.dailyTotalPenaltyAmount)
            .plus(yesterdayDayEntity.dailyTotalBurnAmount);
        yesterdayDayEntity.save();
    }
}

/* ============ Entity Helpers ============ */

function getMinterList(): ActiveMinterList {
    let minterList = ActiveMinterList.load(ACTIVE_MINTER_LIST_ID);
    if (!minterList) {
        minterList = new ActiveMinterList(ACTIVE_MINTER_LIST_ID);
        minterList.minterAddresses = new Array<string>();

        return minterList;
    }

    return minterList;
}

function updateDailyAccruedMinterRateBurnAmount(minter: Address, timestamp: BigInt, amount: BigInt): void {
    const entity = getDailyAccruedMinterRate(minter, timestamp);
    if (!entity) {
        return;
    }

    entity.dailyTotalBurnAmount = entity.dailyTotalBurnAmount.plus(amount);
    entity.save();
}

function updateDailyAccruedMinterRateMintAmount(minter: Address, timestamp: BigInt, amount: BigInt): void {
    const entity = getDailyAccruedMinterRate(minter, timestamp);
    if (!entity) {
        return;
    }

    entity.dailyTotalMintAmount = entity.dailyTotalMintAmount.plus(amount);
    entity.save();
}

function updateDailyAccruedMinterRatePenaltyAmount(minter: Address, timestamp: BigInt, amount: BigInt): void {
    const entity = getDailyAccruedMinterRate(minter, timestamp);
    if (!entity) {
        return;
    }

    entity.dailyTotalPenaltyAmount = entity.dailyTotalPenaltyAmount.plus(amount);
    entity.save();
}

function getDailyAccruedMinterRate(minter: Address, timestamp: BigInt): DailyAccruedMinterRate | null {
    const currentDay = blockTimeToDate(timestamp).toISOString().substring(0, 10);
    const currentDayEntityId = `${currentDay}-${minter.toHexString()}`;
    const entity = DailyAccruedMinterRate.load(currentDayEntityId);
    if (!entity) {
        // this should technically not happen - the block handler should precede the event handlers
        const currentDayEntity = new DailyAccruedMinterRate(currentDayEntityId);
        currentDayEntity.date = currentDay;
        currentDayEntity.minter = minter.toHexString();
        currentDayEntity.owedMStartOfDay = BigInt.fromI32(0);
        currentDayEntity.owedMEndOfDay = BigInt.fromI32(0); //will be overwritten later
        currentDayEntity.dailyTotalBurnAmount = BigInt.fromI32(0);
        currentDayEntity.dailyTotalMintAmount = BigInt.fromI32(0);
        currentDayEntity.dailyTotalPenaltyAmount = BigInt.fromI32(0);
        currentDayEntity.accruedMinterRate = BigInt.fromI32(0);

        return currentDayEntity;
    }

    return entity;
}

/* ============ Contract Helpers ============ */

function _getActiveOwedMOf(minter: Address): BigInt {
    const contract = MinterGatewayContract.bind(Address.fromString(MINTER_GATEWAY_ADDRESS));

    let minterOwedM: BigInt;
    const callResult = contract.try_activeOwedMOf(minter);

    if (callResult.reverted) {
        minterOwedM = BigInt.fromI32(0);
    } else {
        minterOwedM = callResult.value;
    }

    return minterOwedM;
}

/* ============ Util ============ */

function blockTimeToDate(blockTimestampSeconds: BigInt): Date {
    // 2. Convert seconds to milliseconds (multiply by 1000)
    const blockTimestampMilliseconds: BigInt = blockTimestampSeconds.times(BigInt.fromI32(1000));
    return new Date(blockTimestampMilliseconds.toI64());
}
