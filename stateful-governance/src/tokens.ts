import { Address, BigInt, Timestamp } from '@graphprotocol/graph-ts';
import {
    ZeroVotingWeightSnapshots,
    ZeroDelegateVotesChanged,
    ZeroDelegatee,
    ZeroBalanceSnapshot,
    ZeroDelegateeSnapshot,
    ZeroTransfer,
    ZeroDelegateChanged,
    ZeroReceivedSnapshot,
    ZeroSentSnapshot,
    ZeroHolder,
    ZeroTotalSupplySnapshot,
    ZeroTotalMintedSnapshot,
    ZeroToken,
    PowerVotingWeightSnapshots,
    PowerDelegateVotesChanged,
    PowerDelegatee,
    PowerBalanceSnapshot,
    PowerDelegateeSnapshot,
    PowerTransfer,
    PowerDelegateChanged,
    PowerReceivedSnapshot,
    PowerSentSnapshot,
    Sync,
    InflationSyncedSnapshot,
    PowerHolder,
    PowerTotalSupplySnapshot,
    PowerTotalMintedSnapshot,
    NextCashTokenStartingEpochSnapshot,
    PowerCashTokenSnapshot,
    NextCashTokenSnapshot,
    NextTargetSupplyStartingEpochSnapshot,
    TargetSupplySnapshot,
    NextTargetSupplySnapshot,
    TotalInflationSnapshot,
    TotalSyncedInflationSnapshot,
    AuctionBuy,
    TotalBoughtSnapshot,
    PowerToken,
} from '../generated/schema';
import {
    DelegateChanged as DelegateChangedEvent,
    DelegateVotesChanged as DelegateVotesChangedEvent,
    Transfer as TransferEvent,
    Buy as BuyEvent,
    NextCashTokenSet as NextCashTokenSetEvent,
    Sync as SyncEvent,
    TargetSupplyInflated as TargetSupplyInflatedEvent,
} from '../generated/PowerToken/PowerToken';

import { getPowerHolder, getPowerDelegatee, getZeroHolder, getZeroDelegatee } from './utils';

const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000');
const BOOTSTRAP_TOKEN_ADDRESS = Address.fromString('0x2eF826926087614ab4779FF8dbCF7B98573719F2');
const POWER_TOKEN_ADDRESS = '0x5983B89FA184f14917013B9C3062afD9434C5b03';
const ZERO_TOKEN_ADDRESS = '0x988567FE094570cCE1FFdA29D1f2d842B70492be';
const WETH_TOKEN_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const INITIAL_SUPPLY = BigInt.fromI32(1_000_000);

/* ============ Handlers ============ */

export function handlePowerDelegateChanged(event: DelegateChangedEvent): void {
    const holder = getPowerHolder(event.params.delegator);
    const delegatee = getPowerDelegatee(event.params.toDelegatee);
    const timestamp = event.block.timestamp.toI32();

    holder.delegatee = delegatee.id;
    holder.lastUpdate = timestamp;

    holder.save();

    updatePowerDelegateeSnapshot(holder, timestamp, delegatee);

    const delegateChanged = new PowerDelegateChanged(
        `powerDelegateChanged-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    delegateChanged.delegator = holder.id;
    delegateChanged.delegatee = delegatee.id;
    delegateChanged.timestamp = timestamp;
    delegateChanged.logIndex = event.logIndex;
    delegateChanged.transactionHash = event.transaction.hash.toHexString();

    delegateChanged.save();
}

export function handlePowerDelegateVotesChanged(event: DelegateVotesChangedEvent): void {
    const delegatee = getPowerDelegatee(event.params.delegatee);
    const amount = event.params.newBalance;
    const timestamp = event.block.timestamp.toI32();

    delegatee.votingWeight = amount;
    delegatee.lastUpdate = timestamp;

    delegatee.save();

    updatePowerVotingWeightSnapshots(delegatee, timestamp, amount);

    const delegateVotesChanged = new PowerDelegateVotesChanged(
        `powerDelegateVotesChanged-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    delegateVotesChanged.delegatee = delegatee.id;
    delegateVotesChanged.amount = amount;
    delegateVotesChanged.timestamp = timestamp;
    delegateVotesChanged.logIndex = event.logIndex;
    delegateVotesChanged.transactionHash = event.transaction.hash.toHexString();

    delegateVotesChanged.save();
}

export function handlePowerTransfer(event: TransferEvent): void {
    const token = getPowerToken();
    const sender = getPowerHolder(event.params.sender);
    const recipient = getPowerHolder(event.params.recipient);
    const timestamp = event.block.timestamp.toI32();
    const amount = event.params.amount;

    if (event.params.sender.equals(ZERO_ADDRESS)) {
        _mintPower(token, recipient, amount, timestamp);
    } else if (event.params.recipient.equals(ZERO_ADDRESS)) {
        throw new Error('Burns are not supported');
    } else {
        _transferPower(token, sender, recipient, amount, timestamp);
    }

    token.lastUpdate = timestamp;
    token.save();

    sender.lastUpdate = timestamp;
    sender.save();

    recipient.lastUpdate = timestamp;
    recipient.save();

    const transfer = new PowerTransfer(
        `powerTransfer-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    transfer.sender = sender.id;
    transfer.recipient = recipient.id;
    transfer.amount = amount;
    transfer.timestamp = timestamp;
    transfer.logIndex = event.logIndex;
    transfer.transactionHash = event.transaction.hash.toHexString();

    transfer.save();
}

export function handleBuy(event: BuyEvent): void {
    const token = getPowerToken();

    const buyer = event.params.buyer.toHexString();
    const amount = event.params.amount;
    const cost = event.params.cost;
    const timestamp = event.block.timestamp.toI32();

    updateTotalBoughtSnapshot(timestamp, (token.totalBought = token.totalBought.plus(amount)));

    const auctionBuy = new AuctionBuy(
        `auctionBuy-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    auctionBuy.buyer = buyer;
    auctionBuy.amount = amount;
    auctionBuy.cost = cost;
    auctionBuy.cashToken = token.cashToken;
    auctionBuy.timestamp = timestamp;
    auctionBuy.logIndex = event.logIndex;
    auctionBuy.transactionHash = event.transaction.hash.toHexString();

    auctionBuy.save();
}

export function handleNextCashTokenSet(event: NextCashTokenSetEvent): void {
    const token = getPowerToken();

    const startingEpoch = event.params.startingEpoch;
    const nextCashToken = event.params.nextCashToken.toHexString();
    const timestamp = event.block.timestamp.toI32();

    updatePowerCashTokenSnapshot(timestamp, (token.cashToken = token.nextCashToken));
    updateNextCashTokenStartingEpochSnapshot(timestamp, (token.nextCashTokenStartingEpoch = startingEpoch));
    updateNextCashTokenSnapshot(timestamp, (token.nextCashToken = nextCashToken));

    token.lastUpdate = timestamp;

    token.save();
}

export function handleSync(event: SyncEvent): void {
    const account = getPowerHolder(event.params.account);
    const timestamp = event.block.timestamp.toI32();

    const sync = new Sync(`sync-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`);

    // NOTE: Technically, one could compute a `sync.inflation`, but it would already eb captured in the account's
    // `inflationSynced` data.

    sync.account = account.id;
    sync.timestamp = timestamp;
    sync.logIndex = event.logIndex;
    sync.transactionHash = event.transaction.hash.toHexString();

    sync.save();
}

export function handleTargetSupplyInflated(event: TargetSupplyInflatedEvent): void {
    const token = getPowerToken();

    const targetEpoch = event.params.targetEpoch;
    const targetSupply = event.params.targetSupply;
    const timestamp = event.block.timestamp.toI32();

    updateTargetSupplySnapshot(timestamp, (token.targetSupply = token.nextTargetSupply));
    updateNextTargetSupplyStartingEpochSnapshot(timestamp, (token.nextTargetSupplyStartingEpoch = targetEpoch));
    updateNextTargetSupplySnapshot(timestamp, (token.nextTargetSupply = targetSupply));

    token.lastUpdate = timestamp;

    token.save();
}

export function handleZeroDelegateChanged(event: DelegateChangedEvent): void {
    const holder = getZeroHolder(event.params.delegator);
    const delegatee = getZeroDelegatee(event.params.toDelegatee);
    const timestamp = event.block.timestamp.toI32();

    holder.delegatee = delegatee.id;
    holder.lastUpdate = timestamp;

    holder.save();

    updateZeroDelegateeSnapshot(holder, timestamp, delegatee);

    const delegateChanged = new ZeroDelegateChanged(
        `zeroDelegateChanged-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    delegateChanged.delegator = holder.id;
    delegateChanged.delegatee = delegatee.id;
    delegateChanged.timestamp = timestamp;
    delegateChanged.logIndex = event.logIndex;
    delegateChanged.transactionHash = event.transaction.hash.toHexString();

    delegateChanged.save();
}

export function handleZeroDelegateVotesChanged(event: DelegateVotesChangedEvent): void {
    const delegatee = getZeroDelegatee(event.params.delegatee);
    const amount = event.params.newBalance;
    const timestamp = event.block.timestamp.toI32();

    delegatee.votingWeight = amount;
    delegatee.lastUpdate = timestamp;

    delegatee.save();

    updateZeroVotingWeightSnapshots(delegatee, timestamp, amount);

    const delegateVotesChanged = new ZeroDelegateVotesChanged(
        `zeroDelegateVotesChanged-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    delegateVotesChanged.delegatee = delegatee.id;
    delegateVotesChanged.amount = amount;
    delegateVotesChanged.timestamp = timestamp;
    delegateVotesChanged.logIndex = event.logIndex;
    delegateVotesChanged.transactionHash = event.transaction.hash.toHexString();

    delegateVotesChanged.save();
}

export function handleZeroTransfer(event: TransferEvent): void {
    const token = getZeroToken();
    const sender = getZeroHolder(event.params.sender);
    const recipient = getZeroHolder(event.params.recipient);
    const timestamp = event.block.timestamp.toI32();
    const amount = event.params.amount;

    if (event.params.sender.equals(ZERO_ADDRESS)) {
        _mintZero(token, recipient, amount, timestamp);
    } else if (event.params.recipient.equals(ZERO_ADDRESS)) {
        throw new Error('Burns are not supported');
    } else {
        _transferZero(token, sender, recipient, amount, timestamp);
    }

    token.lastUpdate = timestamp;
    token.save();

    sender.lastUpdate = timestamp;
    sender.save();

    recipient.lastUpdate = timestamp;
    recipient.save();

    const transfer = new ZeroTransfer(
        `zeroTransfer-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    transfer.sender = sender.id;
    transfer.recipient = recipient.id;
    transfer.amount = amount;
    transfer.timestamp = timestamp;
    transfer.logIndex = event.logIndex;
    transfer.transactionHash = event.transaction.hash.toHexString();

    transfer.save();
}

/* ============ Entity Getters ============ */

function getPowerToken(): PowerToken {
    const id = `powerToken-${POWER_TOKEN_ADDRESS}`;

    let token = PowerToken.load(id);

    if (token) return token;

    token = new PowerToken(id);

    token.totalSupply = BigInt.fromI32(0);
    token.totalMinted = BigInt.fromI32(0);
    token.nextCashTokenStartingEpoch = 0;
    token.cashToken = '';
    token.nextCashToken = WETH_TOKEN_ADDRESS;
    token.nextTargetSupplyStartingEpoch = 0;
    token.targetSupply = BigInt.fromI32(0);
    token.nextTargetSupply = INITIAL_SUPPLY;
    token.totalInflation = BigInt.fromI32(0);
    token.totalSyncedInflation = BigInt.fromI32(0);
    token.totalBought = BigInt.fromI32(0);
    token.lastUpdate = 0;

    return token;
}

function getZeroToken(): ZeroToken {
    const id = `zeroToken-${ZERO_TOKEN_ADDRESS}`;

    let token = ZeroToken.load(id);

    if (token) return token;

    token = new ZeroToken(id);

    token.totalSupply = BigInt.fromI32(0);
    token.totalMinted = BigInt.fromI32(0);
    token.lastUpdate = 0;

    return token;
}

/* ============ Power Snapshot Updaters ============ */

function updatePowerBalanceSnapshot(holder: PowerHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `powerBalance-${holder.address}-${timestamp.toString()}`;

    let snapshot = PowerBalanceSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerBalanceSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePowerDelegateeSnapshot(holder: PowerHolder, timestamp: Timestamp, value: PowerDelegatee): void {
    const id = `powerDelegatee-${holder.address}-${timestamp.toString()}`;

    let snapshot = PowerDelegateeSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerDelegateeSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value.id;

    snapshot.save();
}

function updatePowerReceivedSnapshot(holder: PowerHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `powerReceived-${holder.address}-${timestamp.toString()}`;

    let snapshot = PowerReceivedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerReceivedSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePowerSentSnapshot(holder: PowerHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `powerSent-${holder.address}-${timestamp.toString()}`;

    let snapshot = PowerSentSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerSentSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateInflationSyncedSnapshot(holder: PowerHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `inflationSynced-${holder.address}-${timestamp.toString()}`;

    let snapshot = InflationSyncedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new InflationSyncedSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePowerVotingWeightSnapshots(delegatee: PowerDelegatee, timestamp: Timestamp, value: BigInt): void {
    const id = `powerVotingWeight-${delegatee.address}-${timestamp.toString()}`;

    let snapshot = PowerVotingWeightSnapshots.load(id);

    if (!snapshot) {
        snapshot = new PowerVotingWeightSnapshots(id);

        snapshot.delegatee = delegatee.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePowerTotalSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `powerTotalSupply-${timestamp.toString()}`;

    let snapshot = PowerTotalSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerTotalSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePowerTotalMintedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `powerTotalMinted-${timestamp.toString()}`;

    let snapshot = PowerTotalMintedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerTotalMintedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalInflationSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalInflation-${timestamp.toString()}`;

    let snapshot = TotalInflationSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalInflationSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalSyncedInflationSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalSyncedInflation-${timestamp.toString()}`;

    let snapshot = TotalSyncedInflationSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalSyncedInflationSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateNextTargetSupplyStartingEpochSnapshot(timestamp: Timestamp, value: i32): void {
    const id = `nextTargetSupplyStartingEpoch-${timestamp.toString()}`;

    let snapshot = NextTargetSupplyStartingEpochSnapshot.load(id);

    if (!snapshot) {
        snapshot = new NextTargetSupplyStartingEpochSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTargetSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `targetSupply-${timestamp.toString()}`;

    let snapshot = TargetSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new TargetSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateNextTargetSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `nextTargetSupply-${timestamp.toString()}`;

    let snapshot = NextTargetSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new NextTargetSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateNextCashTokenStartingEpochSnapshot(timestamp: Timestamp, value: i32): void {
    const id = `nextCashTokenStartingEpoch-${timestamp.toString()}`;

    let snapshot = NextCashTokenStartingEpochSnapshot.load(id);

    if (!snapshot) {
        snapshot = new NextCashTokenStartingEpochSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updatePowerCashTokenSnapshot(timestamp: Timestamp, value: string): void {
    const id = `powerCashToken-${timestamp.toString()}`;

    let snapshot = PowerCashTokenSnapshot.load(id);

    if (!snapshot) {
        snapshot = new PowerCashTokenSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateNextCashTokenSnapshot(timestamp: Timestamp, value: string): void {
    const id = `nextCashToken-${timestamp.toString()}`;

    let snapshot = NextCashTokenSnapshot.load(id);

    if (!snapshot) {
        snapshot = new NextCashTokenSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalBoughtSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `totalBought-${timestamp.toString()}`;

    let snapshot = TotalBoughtSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalBoughtSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

/* ============ Zero Snapshot Updaters ============ */

function updateZeroBalanceSnapshot(holder: ZeroHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `zeroBalance-${holder.address}-${timestamp.toString()}`;

    let snapshot = ZeroBalanceSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroBalanceSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroDelegateeSnapshot(holder: ZeroHolder, timestamp: Timestamp, value: ZeroDelegatee): void {
    const id = `zeroDelegatee-${holder.address}-${timestamp.toString()}`;

    let snapshot = ZeroDelegateeSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroDelegateeSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value.id;

    snapshot.save();
}

function updateZeroReceivedSnapshot(holder: ZeroHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `zeroReceived-${holder.address}-${timestamp.toString()}`;

    let snapshot = ZeroReceivedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroReceivedSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroSentSnapshot(holder: ZeroHolder, timestamp: Timestamp, value: BigInt): void {
    const id = `zeroSent-${holder.address}-${timestamp.toString()}`;

    let snapshot = ZeroSentSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroSentSnapshot(id);

        snapshot.account = holder.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroVotingWeightSnapshots(delegatee: ZeroDelegatee, timestamp: Timestamp, value: BigInt): void {
    const id = `zeroVotingWeight-${delegatee.address}-${timestamp.toString()}`;

    let snapshot = ZeroVotingWeightSnapshots.load(id);

    if (!snapshot) {
        snapshot = new ZeroVotingWeightSnapshots(id);

        snapshot.delegatee = delegatee.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroTotalSupplySnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `zeroTotalSupply-${timestamp.toString()}`;

    let snapshot = ZeroTotalSupplySnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroTotalSupplySnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroTotalMintedSnapshot(timestamp: Timestamp, value: BigInt): void {
    const id = `zeroTotalMinted-${timestamp.toString()}`;

    let snapshot = ZeroTotalMintedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroTotalMintedSnapshot(id);

        snapshot.timestamp = timestamp;
    }

    snapshot.value = value;

    snapshot.save();
}

/* ============ Power Contract Stateful Tracking ============ */

function _mintPower(token: PowerToken, recipient: PowerHolder, amount: BigInt, timestamp: Timestamp): void {
    if (amount.equals(BigInt.fromI32(0))) return; // Not possible due to `InsufficientAmount` revert in contract.

    // NOTE: If recipient is BOOTSTRAP_TOKEN_ADDRESS, then this is the initial supply mint to the bootstrap token
    // holders, but there is not yet a need to uniquely handle or index this.

    updatePowerBalanceSnapshot(recipient, timestamp, (recipient.balance = recipient.balance.plus(amount)));
    updatePowerReceivedSnapshot(recipient, timestamp, (recipient.received = recipient.received.plus(amount)));

    updatePowerTotalSupplySnapshot(timestamp, (token.totalSupply = token.totalSupply.plus(amount)));
    updatePowerTotalMintedSnapshot(timestamp, (token.totalMinted = token.totalMinted.plus(amount)));

    // If recipient is the PowerToken contract itself, then this is the minting of inflation.
    if (recipient.address != POWER_TOKEN_ADDRESS) return;

    updateTotalInflationSnapshot(timestamp, (token.totalInflation = token.totalInflation.plus(amount)));
}

function _transferPower(
    token: PowerToken,
    sender: PowerHolder,
    recipient: PowerHolder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return; // Not possible due to `InsufficientAmount` revert in contract.

    // NOTE: If sender is BOOTSTRAP_TOKEN_ADDRESS, then this is the bootstrap mint for a PowerHolder's initial balance,
    // but there is not yet a need to uniquely handle or index this.

    updatePowerBalanceSnapshot(sender, timestamp, (sender.balance = sender.balance.minus(amount)));
    updatePowerSentSnapshot(sender, timestamp, (sender.sent = sender.sent.plus(amount)));

    updatePowerBalanceSnapshot(recipient, timestamp, (recipient.balance = recipient.balance.plus(amount)));
    updatePowerReceivedSnapshot(recipient, timestamp, (recipient.received = recipient.received.plus(amount)));

    // If sender is the PowerToken contract itself, then this is the minting of synced inflation.
    if (sender.address != POWER_TOKEN_ADDRESS) return;

    updateInflationSyncedSnapshot(
        recipient,
        timestamp,
        (recipient.inflationSynced = recipient.inflationSynced.plus(amount))
    );

    updateTotalSyncedInflationSnapshot(
        timestamp,
        (token.totalSyncedInflation = token.totalSyncedInflation.plus(amount))
    );
}

/* ============ Zero Contract Stateful Tracking ============ */

function _mintZero(token: ZeroToken, recipient: ZeroHolder, amount: BigInt, timestamp: Timestamp): void {
    if (amount.equals(BigInt.fromI32(0))) return; // Not possible due to `InsufficientAmount` revert in contract.

    updateZeroBalanceSnapshot(recipient, timestamp, (recipient.balance = recipient.balance.plus(amount)));
    updateZeroReceivedSnapshot(recipient, timestamp, (recipient.received = recipient.received.plus(amount)));

    updateZeroTotalSupplySnapshot(timestamp, (token.totalSupply = token.totalSupply.plus(amount)));
    updateZeroTotalMintedSnapshot(timestamp, (token.totalMinted = token.totalMinted.plus(amount)));
}

function _transferZero(
    token: ZeroToken,
    sender: ZeroHolder,
    recipient: ZeroHolder,
    amount: BigInt,
    timestamp: Timestamp
): void {
    if (amount.equals(BigInt.fromI32(0))) return; // Not possible due to `InsufficientAmount` revert in contract.

    updateZeroBalanceSnapshot(sender, timestamp, (sender.balance = sender.balance.minus(amount)));
    updateZeroSentSnapshot(sender, timestamp, (sender.sent = sender.sent.plus(amount)));

    updateZeroBalanceSnapshot(recipient, timestamp, (recipient.balance = recipient.balance.plus(amount)));
    updateZeroReceivedSnapshot(recipient, timestamp, (recipient.received = recipient.received.plus(amount)));
}
