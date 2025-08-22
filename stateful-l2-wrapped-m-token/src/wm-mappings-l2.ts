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
    CheckpointSnapshot,
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

const M_TOKEN_ADDRESS = '0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b';
const WRAPPED_M_TOKEN_ADDRESS = '0x437cc33344a0b27a429f795ff6b469c72698b291';
const FIRST_WRAPPED_M_TOKEN_IMPLEMENTATION_ADDRESS = '0x813B926B1D096e117721bD1Eb017FbA122302DA0';

/* ============ Handlers ============ */

export function handleTransfer(event: TransferEvent): void {
    const wrappedMToken = getWrappedMToken();
    const sender = getHolder(event.params.sender);
    const recipient = getHolder(event.params.recipient);
    const timestamp = event.block.timestamp.toI32();
    const amount = event.params.amount;
    const zeroAddress = Address.fromString('0x0000000000000000000000000000000000000000');

    if (event.params.sender.equals(zeroAddress)) {
        _mint(wrappedMToken, recipient, amount, timestamp);
    } else if (event.params.recipient.equals(zeroAddress)) {
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
    const account = getHolder(event.params.account);
    const timestamp = event.block.timestamp.toI32();

    _startEarning(wrappedMToken, account, timestamp);
    updateCheckpointSnapshot(
        account,
        timestamp,
        event.block.number,
        event.logIndex,
        event.transaction.hash.toHexString()
    );

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
    updateCheckpointSnapshot(
        account,
        timestamp,
        event.block.number,
        event.logIndex,
        event.transaction.hash.toHexString()
    );

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
    const account = getHolder(event.params.account);
    const recipient = getHolder(event.params.recipient);
    const timestamp = event.block.timestamp.toI32();

    _claim(wrappedMToken, account, event.params.amount, timestamp);
    updateCheckpointSnapshot(
        account,
        timestamp,
        event.block.number,
        event.logIndex,
        event.transaction.hash.toHexString()
    );

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

function updateCheckpointSnapshot(
    holder: Holder,
    timestamp: Timestamp,
    blockNumber: BigInt,
    logIndex: BigInt,
    txHash: string
): void {
    const id = `checkpoint-${holder.address}-${txHash}-${logIndex.toString()}`;
    const mToken = getMToken();

    let snapshot = CheckpointSnapshot.load(id);

    if (!snapshot) {
        snapshot = new CheckpointSnapshot(id);
    }

    snapshot.timestamp = timestamp;
    snapshot.account = holder.id;
    snapshot.balance = holder.balance;
    snapshot.blockNumber = blockNumber;
    snapshot.logIndex = logIndex;
    snapshot.mLatestIndex = mToken.latestIndex;
    snapshot.mLatestUpdateTimestamp = mToken.latestUpdateTimestamp;

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
        _subtractEarningAmount(wrappedMToken, account, amount, timestamp);
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
        _addEarningAmount(wrappedMToken, recipient, amount, timestamp);
    } else {
        _addNonEarningAmount(wrappedMToken, recipient, amount, timestamp);
    }

    recipient.received = recipient.received.plus(amount);
    updateReceivedSnapshot(recipient, timestamp, recipient.received);

    wrappedMToken.totalMinted = wrappedMToken.totalMinted.plus(amount);
    updateTotalMintedSnapshot(timestamp, wrappedMToken.totalMinted);
}

function _startEarning(wrappedMToken: WrappedMToken, account: Holder, timestamp: Timestamp): void {
    account.isEarning = true;

    updateIsEarningSnapshot(account, timestamp, account.isEarning);

    if (account.balance.equals(BigInt.fromI32(0))) return;

    wrappedMToken.totalNonEarningSupply = wrappedMToken.totalNonEarningSupply.minus(account.balance);
    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.plus(account.balance);

    updateTotalNonEarningSupplySnapshot(timestamp, wrappedMToken.totalNonEarningSupply);
    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);
}

function _stopEarning(wrappedMToken: WrappedMToken, account: Holder, timestamp: Timestamp): void {
    account.isEarning = false;

    updateIsEarningSnapshot(account, timestamp, account.isEarning);

    if (account.balance.equals(BigInt.fromI32(0))) return;

    wrappedMToken.totalNonEarningSupply = wrappedMToken.totalNonEarningSupply.plus(account.balance);
    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.minus(account.balance);

    updateTotalNonEarningSupplySnapshot(timestamp, wrappedMToken.totalNonEarningSupply);
    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);
}

function _claim(wrappedMToken: WrappedMToken, account: Holder, amount: BigInt, timestamp: Timestamp): void {
    account.claimed = account.claimed.plus(amount);

    updateClaimedSnapshot(account, timestamp, account.claimed);

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
        _subtractEarningAmount(wrappedMToken, sender, amount, timestamp);
        _addNonEarningAmount(wrappedMToken, recipient, amount, timestamp);
    } else {
        _subtractNonEarningAmount(wrappedMToken, sender, amount, timestamp);
        _addEarningAmount(wrappedMToken, recipient, amount, timestamp);
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

function _addEarningAmount(wrappedMToken: WrappedMToken, account: Holder, amount: BigInt, timestamp: Timestamp): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    account.balance = account.balance.plus(amount);

    updateBalanceSnapshot(account, timestamp, account.balance);

    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.plus(amount);

    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);
}

function _subtractEarningAmount(
    wrappedMToken: WrappedMToken,
    account: Holder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return;

    account.balance = account.balance.minus(amount);

    updateBalanceSnapshot(account, timestamp, account.balance);

    wrappedMToken.totalEarningSupply = wrappedMToken.totalEarningSupply.minus(amount);

    updateTotalEarningSupplySnapshot(timestamp, wrappedMToken.totalEarningSupply);
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
