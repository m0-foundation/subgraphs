import { Address, BigInt, Bytes, Timestamp } from '@graphprotocol/graph-ts';
import {
    Burn,
    BurnedSnapshot,
    CollateralSnapshot,
    CollateralUpdate,
    Freeze,
    FrozenUntilTimestampSnapshot,
    InactiveOwedMSnapshot,
    LatestIndexSnapshot,
    LatestProposedRetrievalTimestampSnapshot,
    LatestRateSnapshot,
    LatestUpdateTimestampSnapshot,
    Mint,
    MintDelaySnapshot,
    MintedSnapshot,
    Minter,
    MinterFreezeTimeSnapshot,
    MinterGateway,
    MintRatioSnapshot,
    MintTTLSnapshot,
    MissedIntervalPenalty,
    PenalizedUntilTimestampSnapshot,
    PenaltyRateSnapshot,
    PrincipalOfActiveOwedMSnapshot,
    PrincipalOfTotalActiveOwedMSnapshot,
    RateModelSnapshot,
    Retrieval,
    SumOfMissedIntervalPenaltiesSnapshot,
    SumOfPendingRetrievalsSnapshot,
    SumOfUndercollateralizedPenaltiesSnapshot,
    TotalBurnedSnapshot,
    TotalCollateralSnapshot,
    TotalInactiveOwedMSnapshot,
    TotalMintedSnapshot,
    TotalMissedIntervalPenaltiesSnapshot,
    TotalPendingRetrievalsSnapshot,
    TotalUndercollateralizedPenaltiesSnapshot,
    UndercollateralizedPenalty,
    UpdateCollateralIntervalSnapshot,
    UpdateCollateralValidatorThresholdSnapshot,
    UpdateTimestampSnapshot,
    Validator,
} from '../generated/schema';
import {
    BurnExecuted as InactiveBurnExecutedEvent,
    BurnExecuted1 as ActiveBurnExecutedEvent,
    CollateralUpdated as CollateralUpdatedEvent,
    IndexUpdated as IndexUpdatedEvent,
    MintCanceled as MintCanceledEvent,
    MinterActivated as MinterActivatedEvent,
    MinterDeactivated as MinterDeactivatedEvent,
    MinterFrozen as MinterFrozenEvent,
    MintExecuted as MintExecutedEvent,
    MintProposed as MintProposedEvent,
    MissedIntervalsPenaltyImposed as MissedIntervalsPenaltyImposedEvent,
    RetrievalCreated as RetrievalCreatedEvent,
    RetrievalResolved as RetrievalResolvedEvent,
    UndercollateralizedPenaltyImposed as UndercollateralizedPenaltyImposedEvent,
} from '../generated/MinterGateway/MinterGateway';
import { KeySet as KeySetEvent } from '../generated/Registrar/Registrar';

const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000');
const MINTER_GATEWAY_ADDRESS = '0xf7f9638cb444D65e5A40bF5ff98ebE4ff319F04E';

const MINT_DELAY_KEY = 'mint_delay';
const MINT_RATIO_KEY = 'mint_ratio';
const MINT_TTL_KEY = 'mint_ttl';
const MINTER_FREEZE_TIME_KEY = 'minter_freeze_time';
const MINTER_RATE_MODEL_KEY = 'minter_rate_model';
const PENALTY_RATE_KEY = 'penalty_rate';
const UPDATE_COLLATERAL_INTERVAL_KEY = 'update_collateral_interval';
const UPDATE_COLLATERAL_VALIDATOR_THRESHOLD_KEY = 'update_collateral_threshold';

const ONE = BigInt.fromI32(10_000);
const EXP_SCALED_ONE = BigInt.fromI32(10).pow(12);
const BPS_SCALED_ONE = BigInt.fromI32(10).pow(4);
const SECONDS_PER_YEAR = BigInt.fromI32(31_536_000);

/* ============ Handlers ============ */

export function handleKeySet(event: KeySetEvent): void {
    const minterGateway = getMinterGateway();
    const key = event.params.key.toString();
    const timestamp = event.block.timestamp.toI32();

    if (key == MINT_DELAY_KEY) {
        const value = toBigInt(event.params.value);
        updateMintDelaySnapshot(timestamp, value);
        minterGateway.mintDelay = value;
    } else if (key == MINT_RATIO_KEY) {
        const value = toBigInt(event.params.value);
        updateMintRatioSnapshot(timestamp, value);
        minterGateway.mintRatio = value;
    } else if (key == MINT_TTL_KEY) {
        const value = toBigInt(event.params.value);
        updateMintTTLSnapshot(timestamp, value);
        minterGateway.mintTTL = value;
    } else if (key == MINTER_FREEZE_TIME_KEY) {
        const value = toBigInt(event.params.value);
        updateMinterFreezeTimeSnapshot(timestamp, value);
        minterGateway.minterFreezeTime = value;
    } else if (key == MINTER_RATE_MODEL_KEY) {
        const value = `0x${event.params.value.toHexString().slice(26)}`;
        updateRateModelSnapshot(timestamp, value);
        minterGateway.rateModel = value;
    } else if (key == PENALTY_RATE_KEY) {
        const value = toBigInt(event.params.value);
        updatePenaltyRateSnapshot(timestamp, value);
        minterGateway.penaltyRate = value;
    } else if (key == UPDATE_COLLATERAL_INTERVAL_KEY) {
        const value = toBigInt(event.params.value);
        updateUpdateCollateralIntervalSnapshot(timestamp, value);
        minterGateway.updateCollateralInterval = value;
    } else if (key == UPDATE_COLLATERAL_VALIDATOR_THRESHOLD_KEY) {
        const value = toBigInt(event.params.value);
        updateUpdateCollateralValidatorThresholdSnapshot(timestamp, value);
        minterGateway.updateCollateralValidatorThreshold = value;
    } else {
        return;
    }

    minterGateway.lastUpdate = timestamp;

    minterGateway.save();
}

export function handleCollateralUpdated(event: CollateralUpdatedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();
    const minTimestamp = event.params.timestamp.toI32();

    _collateralUpdate(minterGateway, minter, event.params.collateral, minTimestamp, timestamp);

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const collateralUpdate = new CollateralUpdate(
        `collateralUpdate-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    collateralUpdate.minter = minter.id;
    collateralUpdate.collateral = event.params.collateral;
    collateralUpdate.totalResolvedRetrieval = event.params.totalResolvedCollateralRetrieval;
    collateralUpdate.metadataHash = event.params.metadataHash.toHexString();
    collateralUpdate.minTimestamp = minTimestamp;
    collateralUpdate.timestamp = timestamp;
    collateralUpdate.logIndex = event.logIndex;
    collateralUpdate.transactionHash = event.transaction.hash.toHexString();

    collateralUpdate.save();
}

export function handleRetrievalCreated(event: RetrievalCreatedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _proposeRetrieval(minterGateway, minter, event.params.amount, timestamp);

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.retrievalNonce = event.params.retrievalId;
    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const retrieval = new Retrieval(`retrieval-${event.params.retrievalId.toString()}`);

    retrieval.minter = minter.id;
    retrieval.amount = event.params.amount;
    retrieval.proposedTimestamp = timestamp;
    retrieval.proposedTransactionHash = event.transaction.hash.toHexString();
    retrieval.proposedLogIndex = event.logIndex;

    retrieval.save();
}

export function handleMintProposed(event: MintProposedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    const mint = new Mint(`mint-${event.params.mintId.toString()}`);

    mint.minter = minter.id;
    mint.amount = event.params.amount;
    mint.destination = event.params.destination.toHexString();
    mint.proposedTimestamp = event.block.timestamp.toI32();
    mint.proposedTransactionHash = event.transaction.hash.toHexString();
    mint.proposedLogIndex = event.logIndex;

    mint.save();

    minterGateway.mintNonce = event.params.mintId;
    minterGateway.lastUpdate = timestamp;
    minterGateway.save();
}

export function handleMintExecuted(event: MintExecutedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _mintM(minterGateway, minter, event.params.principalAmount, event.params.amount, timestamp);

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const mint = getMint(event.params.mintId);

    mint.principalAmount = event.params.principalAmount;
    mint.executedTimestamp = timestamp;
    mint.executedTransactionHash = event.transaction.hash.toHexString();
    mint.executedLogIndex = event.logIndex;

    mint.save();
}

export function handleActiveBurn(event: ActiveBurnExecutedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _activeBurn(minterGateway, minter, event.params.principalAmount, event.params.amount, timestamp);

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const burn = new Burn(`burn-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`);

    if (!burn) throw new Error('Mint not found');

    burn.minter = minter.id;
    burn.principalAmount = event.params.principalAmount;
    burn.amount = event.params.amount;
    burn.payer = event.params.payer.toHexString();
    burn.timestamp = timestamp;
    burn.transactionHash = event.transaction.hash.toHexString();
    burn.logIndex = event.logIndex;

    burn.save();
}

export function handleInactiveBurn(event: InactiveBurnExecutedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _inactiveBurn(minterGateway, minter, event.params.amount, timestamp);

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const burn = new Burn(`burn-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`);

    if (!burn) throw new Error('Mint not found');

    burn.minter = minter.id;
    burn.amount = event.params.amount;
    burn.payer = event.params.payer.toHexString();
    burn.timestamp = timestamp;
    burn.transactionHash = event.transaction.hash.toHexString();
    burn.logIndex = event.logIndex;

    burn.save();
}

export function handleMintCanceled(event: MintCanceledEvent): void {
    const mint = getMint(event.params.mintId);

    mint.cancelledTimestamp = event.block.timestamp.toI32();
    mint.cancelledBy = getValidator(event.params.canceller).id;
    mint.cancelledTransactionHash = event.transaction.hash.toHexString();
    mint.cancelledLogIndex = event.logIndex;

    mint.save();
}

export function handleMinterFrozen(event: MinterFrozenEvent): void {
    const minter = getMinter(event.params.minter);
    const frozenUntil = event.params.frozenUntil.toI32();
    const timestamp = event.block.timestamp.toI32();

    updateFrozenUntilTimestampSnapshot(minter, timestamp, frozenUntil);

    minter.frozenUntilTimestamp = frozenUntil;
    minter.lastUpdate = timestamp;
    minter.save();

    const freeze = new Freeze(`freeze-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`);

    freeze.minter = minter.id;
    freeze.frozenUntilTimestamp = frozenUntil;
    freeze.timestamp = timestamp;
    freeze.transactionHash = event.transaction.hash.toHexString();
    freeze.logIndex = event.logIndex;

    freeze.save();
}

export function handleMinterActivated(event: MinterActivatedEvent): void {
    const minter = new Minter(`minter-${event.params.minter.toHexString()}`);
    const timestamp = event.block.timestamp.toI32();

    minter.address = event.params.minter.toHexString();
    minter.isActive = true;
    minter.activationTimestamp = timestamp;
    minter.activationTransactionHash = event.transaction.hash.toHexString();
    minter.activationLogIndex = event.logIndex;
    minter.isDeactivated = false;
    minter.collateral = BigInt.fromI32(0);
    minter.sumOfPendingRetrievals = BigInt.fromI32(0);
    minter.updateTimestamp = 0;
    minter.penalizedUntilTimestamp = 0;
    minter.frozenUntilTimestamp = 0;
    minter.latestProposedRetrievalTimestamp = 0;
    minter.minted = BigInt.fromI32(0);
    minter.burned = BigInt.fromI32(0);
    minter.principalOfActiveOwedM = BigInt.fromI32(0);
    minter.inactiveOwedM = BigInt.fromI32(0);
    minter.sumOfMissedIntervalPenalties = BigInt.fromI32(0);
    minter.sumOfUndercollateralizedPenalties = BigInt.fromI32(0);
    minter.lastUpdate = timestamp;

    minter.save();
}

export function handleMinterDeactivated(event: MinterDeactivatedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _deactivateMinter(minterGateway, minter, event.params.inactiveOwedM, timestamp);

    minter.deactivationTimestamp = timestamp;
    minter.deactivationTransactionHash = event.transaction.hash.toHexString();
    minter.deactivationLogIndex = event.logIndex;

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();
}

export function handleMissedIntervalsPenaltyImposed(event: MissedIntervalsPenaltyImposedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _imposeMissedIntervalsPenalty(
        minterGateway,
        minter,
        event.params.missedIntervals,
        event.params.penaltyAmount,
        timestamp
    );

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const penalty = new MissedIntervalPenalty(
        `missedIntervalPenalty-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    penalty.minter = minter.id;
    penalty.missedIntervals = event.params.missedIntervals;
    penalty.amount = event.params.penaltyAmount;
    penalty.timestamp = timestamp;
    penalty.transactionHash = event.transaction.hash.toHexString();
    penalty.logIndex = event.logIndex;

    penalty.save();
}

export function handleUndercollateralizedPenaltyImposed(event: UndercollateralizedPenaltyImposedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const timestamp = event.block.timestamp.toI32();

    _imposeUndercollateralizedPenalty(
        minterGateway,
        minter,
        event.params.timeSpan,
        event.params.penaltyAmount,
        timestamp
    );

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    const penalty = new UndercollateralizedPenalty(
        `undercollateralizedPenalty-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    penalty.minter = minter.id;
    penalty.excessOwedM = event.params.excessOwedM;
    penalty.timeSpan = event.params.timeSpan;
    penalty.amount = event.params.penaltyAmount;
    penalty.timestamp = timestamp;
    penalty.transactionHash = event.transaction.hash.toHexString();
    penalty.logIndex = event.logIndex;

    penalty.save();
}

export function handleRetrievalResolved(event: RetrievalResolvedEvent): void {
    const minterGateway = getMinterGateway();
    const minter = getMinter(event.params.minter);
    const retrieval = Retrieval.load(`retrieval-${event.params.retrievalId.toString()}`);

    if (!retrieval) throw new Error('Retrieval not found');

    const timestamp = event.block.timestamp.toI32();

    _resolvePendingRetrieval(minterGateway, minter, retrieval.amount, timestamp);

    minter.lastUpdate = timestamp;
    minter.save();

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();

    retrieval.resolvedTimestamp = timestamp;
    retrieval.resolvedTransactionHash = event.transaction.hash.toHexString();
    retrieval.resolvedLogIndex = event.logIndex;

    retrieval.save();
}

export function handleIndexUpdated(event: IndexUpdatedEvent): void {
    const minterGateway = getMinterGateway();
    const timestamp = event.block.timestamp.toI32();

    _updateIndex(minterGateway, timestamp, event.params.index, event.params.rate);

    minterGateway.lastUpdate = timestamp;
    minterGateway.save();
}

/* ============ Entity Helpers ============ */

function getMinter(address: Address): Minter {
    const minter = Minter.load(`minter-${address.toHexString()}`);

    if (!minter) throw new Error('Minter not found');

    return minter;
}

function getMinterGateway(): MinterGateway {
    const id = `minterGateway-${MINTER_GATEWAY_ADDRESS}`;

    let minterGateway = MinterGateway.load(id);

    if (minterGateway) return minterGateway;

    minterGateway = new MinterGateway(id);

    minterGateway.totalCollateral = BigInt.fromI32(0);
    minterGateway.totalPendingRetrievals = BigInt.fromI32(0);
    minterGateway.totalInactiveOwedM = BigInt.fromI32(0);
    minterGateway.principalOfTotalActiveOwedM = BigInt.fromI32(0);
    minterGateway.mintNonce = BigInt.fromI32(0);
    minterGateway.retrievalNonce = BigInt.fromI32(0);
    minterGateway.latestIndex = BigInt.fromI32(0);
    minterGateway.latestRate = BigInt.fromI32(0);
    minterGateway.latestUpdateTimestamp = 0;
    minterGateway.totalMinted = BigInt.fromI32(0);
    minterGateway.totalBurned = BigInt.fromI32(0);
    minterGateway.totalMissedIntervalPenalties = BigInt.fromI32(0);
    minterGateway.totalUndercollateralizedPenalties = BigInt.fromI32(0);
    minterGateway.mintDelay = BigInt.fromI32(0);
    minterGateway.mintRatio = BigInt.fromI32(0);
    minterGateway.mintTTL = BigInt.fromI32(0);
    minterGateway.minterFreezeTime = BigInt.fromI32(0);
    minterGateway.penaltyRate = BigInt.fromI32(0);
    minterGateway.rateModel = ZERO_ADDRESS.toHexString();
    minterGateway.updateCollateralInterval = BigInt.fromI32(0);
    minterGateway.updateCollateralValidatorThreshold = BigInt.fromI32(0);
    minterGateway.lastUpdate = 0;

    return minterGateway;
}

function getValidator(address: Address): Validator {
    const id = `validator-${address.toHexString()}`;

    let validator = Validator.load(id);

    if (validator) return validator;

    validator = new Validator(id);

    validator.address = address.toHexString();

    return validator;
}

function getMint(mintId: BigInt): Mint {
    const mint = Mint.load(`mint-${mintId.toString()}`);

    if (!mint) throw new Error('Mint not found');

    return mint;
}

function updateCollateralSnapshots(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `collateral-${minter.id}-${timestamp.toString()}`;

    let snapshot = CollateralSnapshot.load(id);

    if (!snapshot) {
        snapshot = new CollateralSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateSumOfPendingRetrievalsSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `sumOfPendingRetrievals-${minter.id}-${timestamp.toString()}`;

    let snapshot = SumOfPendingRetrievalsSnapshot.load(id);

    if (!snapshot) {
        snapshot = new SumOfPendingRetrievalsSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateUpdateTimestampSnapshot(minter: Minter, timestamp: Timestamp, value: Timestamp): void {
    const id = `updateTimestamp-${minter.id}-${timestamp.toString()}`;

    let snapshot = UpdateTimestampSnapshot.load(id);

    if (!snapshot) {
        snapshot = new UpdateTimestampSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateLatestProposedRetrievalTimestampSnapshot(minter: Minter, timestamp: Timestamp, value: Timestamp): void {
    const id = `latestProposedRetrievalTimestamp-${minter.id}-${timestamp.toString()}`;

    let snapshot = LatestProposedRetrievalTimestampSnapshot.load(id);

    if (!snapshot) {
        snapshot = new LatestProposedRetrievalTimestampSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePrincipalOfActiveOwedMSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `principalOfActiveOwedM-${minter.id}-${timestamp.toString()}`;

    let snapshot = PrincipalOfActiveOwedMSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PrincipalOfActiveOwedMSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateMintedSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `minted-${minter.id}-${timestamp.toString()}`;

    let snapshot = MintedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new MintedSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateBurnedSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `burned-${minter.id}-${timestamp.toString()}`;

    let snapshot = BurnedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new BurnedSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateInactiveOwedMSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `inactiveOwedM-${minter.id}-${timestamp.toString()}`;

    let snapshot = InactiveOwedMSnapshot.load(id);

    if (!snapshot) {
        snapshot = new InactiveOwedMSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateFrozenUntilTimestampSnapshot(minter: Minter, timestamp: Timestamp, value: Timestamp): void {
    const id = `frozenUntilTimestamp-${minter.id}-${timestamp.toString()}`;

    let snapshot = FrozenUntilTimestampSnapshot.load(id);

    if (!snapshot) {
        snapshot = new FrozenUntilTimestampSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePenalizedUntilTimestampSnapshot(minter: Minter, timestamp: Timestamp, value: Timestamp): void {
    const id = `penalizedUntilTimestamp-${minter.id}-${timestamp.toString()}`;

    let snapshot = PenalizedUntilTimestampSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PenalizedUntilTimestampSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateSumOfMissedIntervalPenaltiesSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `sumOfMissedIntervalPenalties-${minter.id}-${timestamp.toString()}`;

    let snapshot = SumOfMissedIntervalPenaltiesSnapshot.load(id);

    if (!snapshot) {
        snapshot = new SumOfMissedIntervalPenaltiesSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateSumOfUndercollateralizedPenaltiesSnapshot(minter: Minter, timestamp: Timestamp, value: BigInt): void {
    const id = `sumOfUndercollateralizedPenalties-${minter.id}-${timestamp.toString()}`;

    let snapshot = SumOfUndercollateralizedPenaltiesSnapshot.load(id);

    if (!snapshot) {
        snapshot = new SumOfUndercollateralizedPenaltiesSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.minter = minter.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalCollateralSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalCollateral-${timestamp.toString()}`;

    let snapshot = TotalCollateralSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalCollateralSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalPendingRetrievalsSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalPendingRetrievals-${timestamp.toString()}`;

    let snapshot = TotalPendingRetrievalsSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalPendingRetrievalsSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePrincipalOfTotalActiveOwedMSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `principalOfTotalActiveOwedM-${timestamp.toString()}`;

    let snapshot = PrincipalOfTotalActiveOwedMSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PrincipalOfTotalActiveOwedMSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalMintedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalMinted-${timestamp.toString()}`;

    let snapshot = TotalMintedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalMintedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalBurnedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalBurned-${timestamp.toString()}`;

    let snapshot = TotalBurnedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalBurnedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalInactiveOwedMSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalInactiveOwedM-${timestamp.toString()}`;

    let snapshot = TotalInactiveOwedMSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalInactiveOwedMSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalMissedIntervalPenaltiesSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalMissedIntervalPenalties-${timestamp.toString()}`;

    let snapshot = TotalMissedIntervalPenaltiesSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalMissedIntervalPenaltiesSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalUndercollateralizedPenaltiesSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalUndercollateralizedPenalties-${timestamp.toString()}`;

    let snapshot = TotalUndercollateralizedPenaltiesSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalUndercollateralizedPenaltiesSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateLatestIndexSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `latestIndex-${timestamp.toString()}`;

    let snapshot = LatestIndexSnapshot.load(id);

    if (!snapshot) {
        snapshot = new LatestIndexSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateLatestRateSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `latestRate-${timestamp.toString()}`;

    let snapshot = LatestRateSnapshot.load(id);

    if (!snapshot) {
        snapshot = new LatestRateSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateLatestUpdateTimestampSnapshot(timestamp: Timestamp, value: Timestamp): void {
    const id = `latestUpdateTimestamp-${timestamp.toString()}`;

    let snapshot = LatestUpdateTimestampSnapshot.load(id);

    if (!snapshot) {
        snapshot = new LatestUpdateTimestampSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateMintDelaySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `mintDelay-${timestamp.toString()}`;

    let snapshot = MintDelaySnapshot.load(id);

    if (!snapshot) {
        snapshot = new MintDelaySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateMintRatioSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `mintRatio-${timestamp.toString()}`;

    let snapshot = MintRatioSnapshot.load(id);

    if (!snapshot) {
        snapshot = new MintRatioSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateMintTTLSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `mintTTL-${timestamp.toString()}`;

    let snapshot = MintTTLSnapshot.load(id);

    if (!snapshot) {
        snapshot = new MintTTLSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateMinterFreezeTimeSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `minterFreezeTime-${timestamp.toString()}`;

    let snapshot = MinterFreezeTimeSnapshot.load(id);

    if (!snapshot) {
        snapshot = new MinterFreezeTimeSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePenaltyRateSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `penaltyRate-${timestamp.toString()}`;

    let snapshot = PenaltyRateSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PenaltyRateSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateRateModelSnapshot(timestamp: Timestamp, value: string): void {
    const id = `rateModel-${timestamp.toString()}`;

    let snapshot = RateModelSnapshot.load(id);

    if (!snapshot) {
        snapshot = new RateModelSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateUpdateCollateralIntervalSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `updateCollateralInterval-${timestamp.toString()}`;

    let snapshot = UpdateCollateralIntervalSnapshot.load(id);

    if (!snapshot) {
        snapshot = new UpdateCollateralIntervalSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateUpdateCollateralValidatorThresholdSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `updateCollateralValidatorThreshold-${timestamp.toString()}`;

    let snapshot = UpdateCollateralValidatorThresholdSnapshot.load(id);

    if (!snapshot) {
        snapshot = new UpdateCollateralValidatorThresholdSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

/* ============ Contract Stateful Tracking ============ */

function _collateralUpdate(
    minterGateway: MinterGateway,
    minter: Minter,
    collateral: BigInt,
    newTimestamp: Timestamp,
    timestamp: Timestamp
): void {
    if (collateral != minter.collateral) {
        // NOTE: Do this first as it relies on the old value of `minter.collateral`.
        minterGateway.totalCollateral = minterGateway.totalCollateral.minus(minter.collateral).plus(collateral);

        minter.collateral = collateral;

        updateCollateralSnapshots(minter, timestamp, collateral);
        updateTotalCollateralSnapshot(timestamp, minterGateway.totalCollateral);
    }

    minter.updateTimestamp = newTimestamp;
    updateUpdateTimestampSnapshot(minter, timestamp, minter.updateTimestamp);
}

function _proposeRetrieval(minterGateway: MinterGateway, minter: Minter, amount: BigInt, timestamp: Timestamp): void {
    minter.sumOfPendingRetrievals = minter.sumOfPendingRetrievals.plus(amount);
    minter.latestProposedRetrievalTimestamp = timestamp;

    minterGateway.totalPendingRetrievals = minterGateway.totalPendingRetrievals.plus(amount);

    updateSumOfPendingRetrievalsSnapshot(minter, timestamp, minter.sumOfPendingRetrievals);
    updateLatestProposedRetrievalTimestampSnapshot(minter, timestamp, timestamp);

    updateTotalPendingRetrievalsSnapshot(timestamp, minterGateway.totalPendingRetrievals);
}

function _mintM(
    minterGateway: MinterGateway,
    minter: Minter,
    principalAmount: BigInt,
    amount: BigInt,
    timestamp: Timestamp
): void {
    minter.principalOfActiveOwedM = minter.principalOfActiveOwedM.plus(principalAmount);
    minter.minted = minter.minted.plus(amount);

    updatePrincipalOfActiveOwedMSnapshot(minter, timestamp, minter.principalOfActiveOwedM);
    updateMintedSnapshot(minter, timestamp, minter.minted);

    minterGateway.principalOfTotalActiveOwedM = minterGateway.principalOfTotalActiveOwedM.plus(principalAmount);
    minterGateway.totalMinted = minterGateway.totalMinted.plus(amount);

    updatePrincipalOfTotalActiveOwedMSnapshot(timestamp, minterGateway.principalOfTotalActiveOwedM);
    updateTotalMintedSnapshot(timestamp, minterGateway.totalMinted);
}

function _activeBurn(
    minterGateway: MinterGateway,
    minter: Minter,
    principalAmount: BigInt,
    amount: BigInt,
    timestamp: Timestamp
): void {
    minter.principalOfActiveOwedM = minter.principalOfActiveOwedM.minus(principalAmount);
    minter.burned = minter.burned.plus(amount);

    updatePrincipalOfActiveOwedMSnapshot(minter, timestamp, minter.principalOfActiveOwedM);
    updateBurnedSnapshot(minter, timestamp, minter.burned);

    minterGateway.principalOfTotalActiveOwedM = minterGateway.principalOfTotalActiveOwedM.minus(principalAmount);
    minterGateway.totalBurned = minterGateway.totalBurned.plus(amount);

    updatePrincipalOfTotalActiveOwedMSnapshot(timestamp, minterGateway.principalOfTotalActiveOwedM);
    updateTotalBurnedSnapshot(timestamp, minterGateway.totalBurned);
}

function _inactiveBurn(minterGateway: MinterGateway, minter: Minter, amount: BigInt, timestamp: Timestamp): void {
    minter.inactiveOwedM = minter.inactiveOwedM.minus(amount);
    minter.burned = minter.burned.plus(amount);

    updateInactiveOwedMSnapshot(minter, timestamp, minter.inactiveOwedM);
    updateBurnedSnapshot(minter, timestamp, minter.burned);

    minterGateway.totalInactiveOwedM = minterGateway.totalInactiveOwedM.minus(amount);
    minterGateway.totalBurned = minterGateway.totalBurned.plus(amount);

    updateTotalInactiveOwedMSnapshot(timestamp, minterGateway.totalInactiveOwedM);
    updateTotalBurnedSnapshot(timestamp, minterGateway.totalBurned);
}

function _deactivateMinter(
    minterGateway: MinterGateway,
    minter: Minter,
    inactiveOwedM: BigInt,
    timestamp: Timestamp
): void {
    minterGateway.totalCollateral = minterGateway.totalCollateral.minus(minter.collateral);
    minterGateway.totalPendingRetrievals = minterGateway.totalPendingRetrievals.minus(minter.sumOfPendingRetrievals);
    minterGateway.totalInactiveOwedM = minterGateway.totalInactiveOwedM.plus(inactiveOwedM);
    minterGateway.principalOfTotalActiveOwedM = minterGateway.principalOfTotalActiveOwedM.minus(
        minter.principalOfActiveOwedM
    );

    minter.isActive = false;
    minter.isDeactivated = true;
    minter.collateral = BigInt.fromI32(0);
    minter.sumOfPendingRetrievals = BigInt.fromI32(0);
    minter.updateTimestamp = 0;
    minter.penalizedUntilTimestamp = 0;
    minter.frozenUntilTimestamp = 0;
    minter.latestProposedRetrievalTimestamp = 0;
    minter.inactiveOwedM = inactiveOwedM;
    minter.principalOfActiveOwedM = BigInt.fromI32(0);
}

function _imposeMissedIntervalsPenalty(
    minterGateway: MinterGateway,
    minter: Minter,
    missedIntervals: BigInt,
    penaltyAmount: BigInt,
    timestamp: Timestamp
): void {
    const penaltyPrincipal = minter.principalOfActiveOwedM
        .times(missedIntervals)
        .times(minterGateway.penaltyRate)
        .div(ONE);

    minter.principalOfActiveOwedM = minter.principalOfActiveOwedM.plus(penaltyPrincipal);
    minter.sumOfMissedIntervalPenalties = minter.sumOfMissedIntervalPenalties.plus(penaltyAmount);

    minter.penalizedUntilTimestamp =
        max(minter.updateTimestamp, minter.penalizedUntilTimestamp) +
        missedIntervals.toI32() * minterGateway.updateCollateralInterval.toI32();

    minterGateway.principalOfTotalActiveOwedM = minterGateway.principalOfTotalActiveOwedM.plus(penaltyPrincipal);
    minterGateway.totalMissedIntervalPenalties = minterGateway.totalMissedIntervalPenalties.plus(penaltyAmount);

    updatePrincipalOfActiveOwedMSnapshot(minter, timestamp, minter.principalOfActiveOwedM);
    updateSumOfMissedIntervalPenaltiesSnapshot(minter, timestamp, minter.sumOfMissedIntervalPenalties);
    updatePenalizedUntilTimestampSnapshot(minter, timestamp, minter.penalizedUntilTimestamp);

    updatePrincipalOfTotalActiveOwedMSnapshot(timestamp, minterGateway.principalOfTotalActiveOwedM);
    updateTotalMissedIntervalPenaltiesSnapshot(timestamp, minterGateway.totalMissedIntervalPenalties);
}

function _imposeUndercollateralizedPenalty(
    minterGateway: MinterGateway,
    minter: Minter,
    timeSpan: BigInt,
    penaltyAmount: BigInt,
    timestamp: Timestamp
): void {
    const updateCollateralInterval = minterGateway.updateCollateralInterval;

    const collateral =
        timestamp >= minter.updateTimestamp + updateCollateralInterval.toI32()
            ? BigInt.fromI32(0)
            : minter.collateral.gt(minter.sumOfPendingRetrievals)
              ? minter.collateral.minus(minter.sumOfPendingRetrievals)
              : BigInt.fromI32(0);

    const maxAllowedActiveOwedM = collateral.times(minterGateway.mintRatio).div(ONE);
    const index = _getCurrentIndex(minterGateway, timestamp);
    const principalOfMaxAllowedActiveOwedM = _getPrincipalAmountRoundedDown(maxAllowedActiveOwedM, index);

    if (principalOfMaxAllowedActiveOwedM.ge(minter.principalOfActiveOwedM)) {
        throw new Error('Undercollateralized penalty imposed despite state indicating fully collateralized.');
    }

    const principalOfExcessOwedM = minter.principalOfActiveOwedM.minus(principalOfMaxAllowedActiveOwedM);
    const principalOfPenaltyBase = principalOfExcessOwedM.times(timeSpan).div(updateCollateralInterval);
    const penaltyPrincipal = principalOfPenaltyBase.times(minterGateway.penaltyRate).div(ONE);

    minter.principalOfActiveOwedM = minter.principalOfActiveOwedM.plus(penaltyPrincipal);
    minter.sumOfUndercollateralizedPenalties = minter.sumOfUndercollateralizedPenalties.plus(penaltyAmount);

    minterGateway.principalOfTotalActiveOwedM = minterGateway.principalOfTotalActiveOwedM.plus(penaltyPrincipal);

    minterGateway.totalUndercollateralizedPenalties =
        minterGateway.totalUndercollateralizedPenalties.plus(penaltyAmount);

    updatePrincipalOfActiveOwedMSnapshot(minter, timestamp, minter.principalOfActiveOwedM);
    updateSumOfUndercollateralizedPenaltiesSnapshot(minter, timestamp, minter.sumOfUndercollateralizedPenalties);

    updatePrincipalOfTotalActiveOwedMSnapshot(timestamp, minterGateway.principalOfTotalActiveOwedM);
    updateTotalUndercollateralizedPenaltiesSnapshot(timestamp, minterGateway.totalUndercollateralizedPenalties);
}

function _resolvePendingRetrieval(
    minterGateway: MinterGateway,
    minter: Minter,
    amount: BigInt,
    timestamp: Timestamp
): void {
    minter.sumOfPendingRetrievals = minter.sumOfPendingRetrievals.minus(amount);
    minterGateway.totalPendingRetrievals = minterGateway.totalPendingRetrievals.minus(amount);

    updateSumOfPendingRetrievalsSnapshot(minter, timestamp, minter.sumOfPendingRetrievals);
    updateTotalPendingRetrievalsSnapshot(timestamp, minterGateway.totalPendingRetrievals);
}

function _updateIndex(minterGateway: MinterGateway, timestamp: Timestamp, index: BigInt, rate: BigInt): void {
    minterGateway.latestIndex = index;
    minterGateway.latestRate = rate;
    minterGateway.latestUpdateTimestamp = timestamp;

    updateLatestIndexSnapshot(timestamp, minterGateway.latestIndex);
    updateLatestRateSnapshot(timestamp, minterGateway.latestRate);
    updateLatestUpdateTimestampSnapshot(timestamp, minterGateway.latestUpdateTimestamp);
}

function _getCurrentIndex(minterGateway: MinterGateway, timestamp: Timestamp): BigInt {
    return _multiplyIndicesUp(
        minterGateway.latestIndex,
        _getContinuousIndex(
            _convertFromBasisPoints(minterGateway.latestRate),
            timestamp - minterGateway.latestUpdateTimestamp
        )
    );
}

/* ============ Contract Helpers ============ */

function _getPrincipalAmountRoundedDown(presentAmount: BigInt, index: BigInt): BigInt {
    return _divideDown(presentAmount, index);
}

function _divideDown(x: BigInt, index: BigInt): BigInt {
    return x.times(EXP_SCALED_ONE).div(index);
}

function _convertFromBasisPoints(rate: BigInt): BigInt {
    return EXP_SCALED_ONE.times(rate).div(BPS_SCALED_ONE);
}

function _getContinuousIndex(yearlyRate: BigInt, time: Timestamp): BigInt {
    return _exponent(yearlyRate.times(BigInt.fromI64(time)).div(SECONDS_PER_YEAR));
}

function _exponent(x: BigInt): BigInt {
    const x2 = x.times(x);

    const _84e27 = BigInt.fromI32(84).times(BigInt.fromI32(10).pow(27));
    const _9e3 = BigInt.fromI32(9).times(BigInt.fromI32(10).pow(3));
    const _2e11 = BigInt.fromI32(2).times(BigInt.fromI32(10).pow(11));
    const _1e11 = BigInt.fromI32(10).pow(11);
    const _42e15 = BigInt.fromI32(42).times(BigInt.fromI32(10).pow(15));
    const _1e9 = BigInt.fromI32(10).pow(9);
    const _1e12 = BigInt.fromI32(10).pow(12);

    const additiveTerms = _84e27.plus(x2.times(_9e3)).plus(x2.div(_2e11).times(x2.div(_1e11)));

    const differentTerms = x.times(_42e15.plus(x2.div(_1e9)));

    return additiveTerms.plus(differentTerms).times(_1e12).div(additiveTerms.minus(differentTerms));
}

function _multiplyIndicesUp(index: BigInt, deltaIndex: BigInt): BigInt {
    return index
        .times(deltaIndex)
        .plus(EXP_SCALED_ONE.minus(BigInt.fromI32(1)))
        .div(EXP_SCALED_ONE);
}

/* ============ AssemblyScript Helpers ============ */

function toBigInt(value: Bytes): BigInt {
    return BigInt.fromUnsignedBytes(Bytes.fromUint8Array(value.reverse()));
}
