import { Address, BigInt, Timestamp } from '@graphprotocol/graph-ts';
import {
    BalanceSnapshot,
    Claim,
    ClaimedSnapshot,
    DisableIndexSnapshot,
    EnableMIndexSnapshot,
    ExcessClaim,
    Holder,
    ImplementationSnapshot,
    IsEarningSnapshot,
    LastIndexSnapshot,
    LatestIndexSnapshot,
    LatestUpdateTimestampSnapshot,
    Migration,
    MToken,
    PrincipalOfTotalEarningSupplySnapshot,
    ReceivedSnapshot,
    SentSnapshot,
    TotalBurnedSnapshot,
    TotalClaimedSnapshot,
    TotalEarningSupplySnapshot,
    TotalExcessClaimedSnapshot,
    TotalMintedSnapshot,
    TotalNonEarningSupplySnapshot,
    Transfer,
    WrappedMToken,
} from '../generated/schema';
import {
    Claimed as ClaimedEvent,
    EarningDisabled as EarningDisabledEvent,
    EarningEnabled as EarningEnabledEvent,
    ExcessClaimed as ExcessClaimedEvent,
    Migrated as MigratedEvent,
    StartedEarning as StartedEarningEvent,
    StoppedEarning as StoppedEarningEvent,
    Transfer as TransferEvent,
} from '../generated/WrappedMToken/WrappedMToken';
import { IndexUpdated as IndexUpdatedEvent } from '../generated/MToken/MToken';

const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000');
const M_TOKEN_ADDRESS = '0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b';
const WRAPPED_M_TOKEN_ADDRESS = '0x437cc33344a0b27a429f795ff6b469c72698b291';
const FIRST_WRAPPED_M_TOKEN_IMPLEMENTATION_ADDRESS = '0x813B926B1D096e117721bD1Eb017FbA122302DA0';

const EXP_SCALED_ONE = BigInt.fromI32(10).pow(12);
const BPS_SCALED_ONE = BigInt.fromI32(10).pow(4);
const SECONDS_PER_YEAR = BigInt.fromI32(31_536_000);

const LATEST_RATE_BPS = BigInt.fromI32(415); // 4.15% per year in basis points

/* ============ Handlers ============ */

export function handleTransfer(event: TransferEvent): void {
    const wrappedMToken = getWrappedMToken();
    const sender = getHolder(event.params.sender);
    const recipient = getHolder(event.params.recipient);
    const timestamp = event.block.timestamp.toI32();
    const amount = event.params.amount;

    if (event.params.sender.equals(ZERO_ADDRESS)) {
        _mint(wrappedMToken, recipient, amount, timestamp);
    } else if (event.params.recipient.equals(ZERO_ADDRESS)) {
        _burn(wrappedMToken, sender, amount, timestamp);
    } else {
        _transfer(wrappedMToken, sender, recipient, amount, timestamp);
    }

    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    sender.lastUpdate = timestamp;
    sender.save();

    recipient.lastUpdate = timestamp;
    recipient.save();

    const transfer = new Transfer(
        `transfer-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    transfer.sender = sender.id;
    transfer.recipient = recipient.id;
    transfer.amount = amount;
    transfer.timestamp = timestamp;
    transfer.logIndex = event.logIndex;
    transfer.transactionHash = event.transaction.hash.toHexString();

    transfer.save();
}

export function handleStartedEarning(event: StartedEarningEvent): void {
    const wrappedMToken = getWrappedMToken();
    const mToken = getMToken();
    const account = getHolder(event.params.account);
    const timestamp = event.block.timestamp.toI32();

    _startEarning(wrappedMToken, mToken, account, timestamp);

    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    account.lastUpdate = timestamp;
    account.save();
}

export function handleStoppedEarning(event: StoppedEarningEvent): void {
    const wrappedMToken = getWrappedMToken();
    const account = getHolder(event.params.account);
    const timestamp = event.block.timestamp.toI32();

    _stopEarning(wrappedMToken, account, timestamp);

    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    account.lastUpdate = timestamp;
    account.save();
}

export function handleExcessClaimed(event: ExcessClaimedEvent): void {
    const wrappedMToken = getWrappedMToken();
    const timestamp = event.block.timestamp.toI32();
    const amount = event.params.excess;

    wrappedMToken.totalExcessClaimed = wrappedMToken.totalExcessClaimed.plus(amount);
    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    updateTotalExcessClaimedSnapshot(timestamp, wrappedMToken.totalExcessClaimed);

    const excessClaim = new ExcessClaim(
        `excessClaim-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    excessClaim.amount = amount;
    excessClaim.timestamp = timestamp;
    excessClaim.logIndex = event.logIndex;
    excessClaim.transactionHash = event.transaction.hash.toHexString();

    excessClaim.save();
}

export function handleEarningEnabled(event: EarningEnabledEvent): void {
    const wrappedMToken = getWrappedMToken();
    const timestamp = event.block.timestamp.toI32();
    const index = event.params.index;

    wrappedMToken.enableMIndex = index;
    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    updateEnableMIndexSnapshot(timestamp, wrappedMToken.enableMIndex);
}

export function handleEarningDisabled(event: EarningDisabledEvent): void {
    const wrappedMToken = getWrappedMToken();
    const timestamp = event.block.timestamp.toI32();
    const index = event.params.index;

    wrappedMToken.disableIndex = index;
    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    updateDisableIndexSnapshot(timestamp, wrappedMToken.disableIndex);
}

export function handleClaimed(event: ClaimedEvent): void {
    const wrappedMToken = getWrappedMToken();
    const mToken = getMToken();
    const account = getHolder(event.params.account);
    const recipient = getHolder(event.params.recipient);
    const timestamp = event.block.timestamp.toI32();

    _claim(wrappedMToken, mToken, account, event.params.amount, timestamp);

    account.lastUpdate = timestamp;
    account.save();

    wrappedMToken.lastUpdate = timestamp;
    wrappedMToken.save();

    const claim = new Claim(`claim-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`);

    claim.account = account.id;
    claim.recipient = recipient.id;
    claim.amount = event.params.amount;
    claim.timestamp = timestamp;
    claim.logIndex = event.logIndex;
    claim.transactionHash = event.transaction.hash.toHexString();

    claim.save();
}

export function handleMigrated(event: MigratedEvent): void {
    const wrappedMToken = getWrappedMToken();
    const timestamp = event.block.timestamp.toI32();

    wrappedMToken.implementation = event.params.newImplementation.toHexString();
    wrappedMToken.save();

    updateImplementationSnapshot(timestamp, event.params.newImplementation.toHexString());

    const migration = new Migration(
        `migration-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    migration.migrator = event.params.migrator.toHexString();
    migration.oldImplementation = event.params.oldImplementation.toHexString();
    migration.newImplementation = event.params.newImplementation.toHexString();
    migration.timestamp = timestamp;
    migration.logIndex = event.logIndex;
    migration.transactionHash = event.transaction.hash.toHexString();

    migration.save();
}

export function handleIndexUpdated(event: IndexUpdatedEvent): void {
    const mToken = getMToken();
    const timestamp = event.block.timestamp.toI32();

    _updateIndex(mToken, timestamp, event.params.index);

    mToken.lastUpdate = timestamp;
    mToken.save();
}

/* ============ Entity Helpers ============ */

function getWrappedMToken(): WrappedMToken {
    const id = `wrappedMToken-${WRAPPED_M_TOKEN_ADDRESS}`;

    let wrappedMToken = WrappedMToken.load(id);

    if (wrappedMToken) return wrappedMToken;

    wrappedMToken = new WrappedMToken(id);

    wrappedMToken.totalNonEarningSupply = BigInt.fromI32(0);
    wrappedMToken.principalOfTotalEarningSupply = BigInt.fromI32(0);
    wrappedMToken.totalEarningSupply = BigInt.fromI32(0);
    wrappedMToken.enableMIndex = BigInt.fromI32(0);
    wrappedMToken.disableIndex = BigInt.fromI32(0);
    wrappedMToken.totalMinted = BigInt.fromI32(0);
    wrappedMToken.totalBurned = BigInt.fromI32(0);
    wrappedMToken.totalClaimed = BigInt.fromI32(0);
    wrappedMToken.totalExcessClaimed = BigInt.fromI32(0);
    wrappedMToken.implementation = FIRST_WRAPPED_M_TOKEN_IMPLEMENTATION_ADDRESS;
    wrappedMToken.lastUpdate = 0;

    return wrappedMToken;
}

function getHolder(address: Address): Holder {
    const id = `holder-${address.toHexString()}`;

    let holder = Holder.load(id);

    if (holder) return holder;

    holder = new Holder(id);

    holder.address = address.toHexString();
    holder.balance = BigInt.fromI32(0);
    holder.lastIndex = BigInt.fromI32(0);
    holder.isEarning = false;
    holder.claimed = BigInt.fromI32(0);
    holder.received = BigInt.fromI32(0);
    holder.sent = BigInt.fromI32(0);
    holder.lastUpdate = 0;

    return holder;
}

function getMToken(): MToken {
    const id = `mToken-${M_TOKEN_ADDRESS}`;

    let mToken = MToken.load(id);

    if (mToken) return mToken;

    mToken = new MToken(id);

    mToken.latestIndex = BigInt.fromI32(0);
    mToken.latestUpdateTimestamp = 0;
    mToken.lastUpdate = 0;

    return mToken;
}

function updateBalanceSnapshot(holder: Holder, timestamp: Timestamp, value: BigInt): void {
    const id = `balance-${holder.address}-${timestamp.toString()}`;

    let snapshot = BalanceSnapshot.load(id);

    if (!snapshot) {
        snapshot = new BalanceSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateLastIndexSnapshot(holder: Holder, timestamp: Timestamp, value: BigInt): void {
    const id = `lastIndex-${holder.address}-${timestamp.toString()}`;

    let snapshot = LastIndexSnapshot.load(id);

    if (!snapshot) {
        snapshot = new LastIndexSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateIsEarningSnapshot(holder: Holder, timestamp: Timestamp, value: boolean): void {
    const id = `isEarning-${holder.address}-${timestamp.toString()}`;

    let snapshot = IsEarningSnapshot.load(id);

    if (!snapshot) {
        snapshot = new IsEarningSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateClaimedSnapshot(holder: Holder, timestamp: Timestamp, value: BigInt): void {
    const id = `claimed-${holder.address}-${timestamp.toString()}`;

    let snapshot = ClaimedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ClaimedSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateReceivedSnapshot(holder: Holder, timestamp: Timestamp, value: BigInt): void {
    const id = `received-${holder.address}-${timestamp.toString()}`;

    let snapshot = ReceivedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ReceivedSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateSentSnapshot(holder: Holder, timestamp: Timestamp, value: BigInt): void {
    const id = `sent-${holder.address}-${timestamp.toString()}`;

    let snapshot = SentSnapshot.load(id);

    if (!snapshot) {
        snapshot = new SentSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalNonEarningSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalNonEarningSupply-${timestamp.toString()}`;

    let snapshot = TotalNonEarningSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalNonEarningSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePrincipalOfTotalEarningSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `principalOfTotalEarningSupply-${timestamp.toString()}`;

    let snapshot = PrincipalOfTotalEarningSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new PrincipalOfTotalEarningSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalEarningSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalEarningSupply-${timestamp.toString()}`;

    let snapshot = TotalEarningSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalEarningSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateEnableMIndexSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `enableMIndex-${timestamp.toString()}`;

    let snapshot = EnableMIndexSnapshot.load(id);

    if (!snapshot) {
        snapshot = new EnableMIndexSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateDisableIndexSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `disableIndex-${timestamp.toString()}`;

    let snapshot = DisableIndexSnapshot.load(id);

    if (!snapshot) {
        snapshot = new DisableIndexSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalMintedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalWrapped-${timestamp.toString()}`;

    let snapshot = TotalMintedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalMintedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalBurnedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalUnwrapped-${timestamp.toString()}`;

    let snapshot = TotalBurnedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalBurnedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalClaimedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalClaimed-${timestamp.toString()}`;

    let snapshot = TotalClaimedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalClaimedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalExcessClaimedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalExcessClaimed-${timestamp.toString()}`;

    let snapshot = TotalExcessClaimedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalExcessClaimedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateImplementationSnapshot(timestamp: Timestamp, value: string): void {
    const id = `implementation-${timestamp.toString()}`;

    let snapshot = ImplementationSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ImplementationSnapshot(id);

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

/* ============ Contract Stateful Tracking ============ */

function _burn(wrappedMToken: WrappedMToken, account: Holder, amount: BigInt, timestamp: Timestamp): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    if (account.isEarning) {
        _subtractEarningAmount(wrappedMToken, account, amount, account.lastIndex, timestamp);
    } else {
        _subtractNonEarningAmount(wrappedMToken, account, amount, timestamp);
    }

    account.sent = account.sent.plus(amount);
    updateSentSnapshot(account, timestamp, account.sent);

    wrappedMToken.totalBurned = wrappedMToken.totalBurned.plus(amount);
    updateTotalBurnedSnapshot(timestamp, wrappedMToken.totalBurned);
}

function _mint(wrappedMToken: WrappedMToken, recipient: Holder, amount: BigInt, timestamp: Timestamp): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    if (recipient.isEarning) {
        _addEarningAmount(wrappedMToken, recipient, amount, recipient.lastIndex, timestamp);
    } else {
        _addNonEarningAmount(wrappedMToken, recipient, amount, timestamp);
    }

    recipient.received = recipient.received.plus(amount);
    updateReceivedSnapshot(recipient, timestamp, recipient.received);

    wrappedMToken.totalMinted = wrappedMToken.totalMinted.plus(amount);
    updateTotalMintedSnapshot(timestamp, wrappedMToken.totalMinted);
}

function _startEarning(wrappedMToken: WrappedMToken, mToken: MToken, account: Holder, timestamp: Timestamp): void {
    account.isEarning = true;
    account.lastIndex = _getCurrentIndex(mToken, timestamp);

    updateIsEarningSnapshot(account, timestamp, account.isEarning);
    updateLastIndexSnapshot(account, timestamp, account.lastIndex);

    if (account.balance.equals(BigInt.fromI32(0))) return;

    wrappedMToken.totalNonEarningSupply = wrappedMToken.totalNonEarningSupply.minus(account.balance);
    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.plus(account.balance);

    updateTotalNonEarningSupplySnapshot(timestamp, wrappedMToken.totalNonEarningSupply);
    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);

    const principal = _getPrincipalAmountRoundedUp(account.balance, account.lastIndex);

    if (principal.equals(BigInt.fromI32(0))) return;

    wrappedMToken.principalOfTotalEarningSupply = wrappedMToken.principalOfTotalEarningSupply.plus(principal);

    updatePrincipalOfTotalEarningSupplySnapshot(timestamp, wrappedMToken.principalOfTotalEarningSupply);
}

function _stopEarning(wrappedMToken: WrappedMToken, account: Holder, timestamp: Timestamp): void {
    account.isEarning = false;
    account.lastIndex = BigInt.fromI32(0);

    updateIsEarningSnapshot(account, timestamp, account.isEarning);
    updateLastIndexSnapshot(account, timestamp, account.lastIndex);

    if (account.balance.equals(BigInt.fromI32(0))) return;

    wrappedMToken.totalNonEarningSupply = wrappedMToken.totalNonEarningSupply.plus(account.balance);
    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.minus(account.balance);

    updateTotalNonEarningSupplySnapshot(timestamp, wrappedMToken.totalNonEarningSupply);
    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);

    const principal = wrappedMToken.totalEarningSupply.equals(BigInt.fromI32(0))
        ? wrappedMToken.principalOfTotalEarningSupply
        : _getPrincipalAmountRoundedDown(account.balance, account.lastIndex);

    if (principal.equals(BigInt.fromI32(0))) return;

    wrappedMToken.principalOfTotalEarningSupply = wrappedMToken.principalOfTotalEarningSupply.minus(principal);

    updatePrincipalOfTotalEarningSupplySnapshot(timestamp, wrappedMToken.principalOfTotalEarningSupply);
}

function _claim(
    wrappedMToken: WrappedMToken,
    mToken: MToken,
    account: Holder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    account.claimed = account.claimed.plus(amount);
    account.lastIndex = _getCurrentIndex(mToken, timestamp);

    updateClaimedSnapshot(account, timestamp, account.claimed);
    updateLastIndexSnapshot(account, timestamp, account.lastIndex);

    wrappedMToken.totalClaimed = wrappedMToken.totalClaimed.plus(amount);

    updateTotalClaimedSnapshot(timestamp, wrappedMToken.totalClaimed);
}

function _transfer(
    wrappedMToken: WrappedMToken,
    sender: Holder,
    recipient: Holder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    if (sender.isEarning == recipient.isEarning) {
        if (sender.address != recipient.address) {
            sender.balance = sender.balance.minus(amount);
            recipient.balance = recipient.balance.plus(amount);

            updateBalanceSnapshot(sender, timestamp, sender.balance);
            updateBalanceSnapshot(recipient, timestamp, recipient.balance);
        }
    } else if (sender.isEarning) {
        _subtractEarningAmount(wrappedMToken, sender, amount, sender.lastIndex, timestamp);
        _addNonEarningAmount(wrappedMToken, recipient, amount, timestamp);
    } else {
        _subtractNonEarningAmount(wrappedMToken, sender, amount, timestamp);
        _addEarningAmount(wrappedMToken, recipient, amount, recipient.lastIndex, timestamp);
    }

    sender.sent = sender.sent.plus(amount);
    recipient.received = recipient.received.plus(amount);

    updateSentSnapshot(sender, timestamp, sender.sent);
    updateReceivedSnapshot(recipient, timestamp, recipient.received);
}

function _updateIndex(mToken: MToken, timestamp: Timestamp, index: BigInt): void {
    mToken.latestIndex = index;
    mToken.latestUpdateTimestamp = timestamp;

    updateLatestIndexSnapshot(timestamp, mToken.latestIndex);
    updateLatestUpdateTimestampSnapshot(timestamp, mToken.latestUpdateTimestamp);
}

function _getCurrentIndex(mToken: MToken, timestamp: Timestamp): BigInt {
    return _multiplyIndicesDown(
        mToken.latestIndex,
        _getContinuousIndex(_convertFromBasisPoints(LATEST_RATE_BPS), timestamp - mToken.latestUpdateTimestamp)
    );
}

function _addEarningAmount(
    wrappedMToken: WrappedMToken,
    account: Holder,
    amount: BigInt,
    index: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    account.balance = account.balance.plus(amount);

    updateBalanceSnapshot(account, timestamp, account.balance);

    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.plus(amount);

    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);

    const principal = _getPrincipalAmountRoundedUp(amount, index);

    wrappedMToken.principalOfTotalEarningSupply = wrappedMToken.principalOfTotalEarningSupply.plus(principal);

    updatePrincipalOfTotalEarningSupplySnapshot(timestamp, wrappedMToken.principalOfTotalEarningSupply);
}

function _subtractEarningAmount(
    wrappedMToken: WrappedMToken,
    account: Holder,
    amount: BigInt,
    index: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    account.balance = account.balance.minus(amount);

    updateBalanceSnapshot(account, timestamp, account.balance);

    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.minus(amount);

    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);

    const principal = wrappedMToken.totalEarningSupply.equals(BigInt.fromI32(0))
        ? wrappedMToken.principalOfTotalEarningSupply
        : _getPrincipalAmountRoundedDown(amount, index);

    if (principal.equals(BigInt.fromI32(0))) return;

    wrappedMToken.principalOfTotalEarningSupply = wrappedMToken.principalOfTotalEarningSupply.minus(principal);

    updatePrincipalOfTotalEarningSupplySnapshot(timestamp, wrappedMToken.principalOfTotalEarningSupply);
}

function _addNonEarningAmount(
    wrappedMToken: WrappedMToken,
    account: Holder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    account.balance = account.balance.plus(amount);

    updateBalanceSnapshot(account, timestamp, account.balance);

    wrappedMToken.totalNonEarningSupply = wrappedMToken.totalNonEarningSupply.plus(amount);

    updateTotalNonEarningSupplySnapshot(timestamp, wrappedMToken.totalNonEarningSupply);
}

function _subtractNonEarningAmount(
    wrappedMToken: WrappedMToken,
    account: Holder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    account.balance = account.balance.minus(amount);

    updateBalanceSnapshot(account, timestamp, account.balance);

    wrappedMToken.totalNonEarningSupply = wrappedMToken.totalNonEarningSupply.minus(amount);

    updateTotalNonEarningSupplySnapshot(timestamp, wrappedMToken.totalNonEarningSupply);
}

/* ============ Contract Helpers ============ */

function _getPrincipalAmountRoundedUp(presentAmount: BigInt, index: BigInt): BigInt {
    return _divideUp(presentAmount, index);
}

function _getPrincipalAmountRoundedDown(presentAmount: BigInt, index: BigInt): BigInt {
    return _divideDown(presentAmount, index);
}

function _divideUp(x: BigInt, index: BigInt): BigInt {
    return x.times(EXP_SCALED_ONE).plus(index).minus(BigInt.fromI32(1)).div(index);
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

function _multiplyIndicesDown(index: BigInt, deltaIndex: BigInt): BigInt {
    return index.times(deltaIndex).div(EXP_SCALED_ONE);
}
