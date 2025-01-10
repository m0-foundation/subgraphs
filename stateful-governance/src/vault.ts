import { BigInt, Timestamp } from '@graphprotocol/graph-ts';
import {
    ZeroHolder,
    Claim,
    ClaimedEpoch,
    Claimed,
    ClaimedSnapshot,
    Distribution,
    LastTokenBalance,
    LastTokenBalanceSnapshot,
    EpochDistributed,
    EpochDistributedSnapshot,
    TotalDistributed,
    TotalDistributedSnapshot,
    TotalClaimed,
    TotalClaimedSnapshot,
    DistributionVault,
} from '../generated/schema';
import {
    Distribution as DistributionEvent,
    Claim as ClaimEvent,
} from '../generated/DistributionVault/DistributionVault';

import { getZeroHolder } from './utils';

const VAULT_ADDRESS = '0xd7298f620B0F752Cf41BD818a16C756d9dCAA34f';

/* ============ Handlers ============ */

export function handleDistribution(event: DistributionEvent): void {
    const vault = getDistributionVault();

    const token = event.params.token.toHexString();
    const epoch = event.params.epoch.toI32();
    const amount = event.params.amount;
    const timestamp = event.block.timestamp.toI32();

    vault.lastUpdate = timestamp;

    vault.save();

    const lastTokenBalance = getLastTokenBalance(token);

    lastTokenBalance.balance = lastTokenBalance.balance.plus(amount);
    lastTokenBalance.lastUpdate = timestamp;

    updateLastTokenBalanceSnapshot(token, timestamp, lastTokenBalance.balance);

    const epochDistributed = getEpochDistributed(token, epoch);

    epochDistributed.amount = epochDistributed.amount.plus(amount);
    epochDistributed.lastUpdate = timestamp;

    epochDistributed.save();

    updateEpochDistributedSnapshot(token, epoch, timestamp, epochDistributed.amount);

    const totalDistributed = getTotalDistributed(token);

    totalDistributed.amount = totalDistributed.amount.plus(amount);
    totalDistributed.lastUpdate = timestamp;

    totalDistributed.save();

    updateTotalDistributedSnapshot(token, timestamp, totalDistributed.amount);

    const distribution = new Distribution(
        `distribution-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`
    );

    distribution.token = token;
    distribution.epoch = epoch;
    distribution.amount = amount;
    distribution.timestamp = timestamp;
    distribution.logIndex = event.logIndex;
    distribution.transactionHash = event.transaction.hash.toHexString();

    distribution.save();
}

export function handleClaim(event: ClaimEvent): void {
    const vault = getDistributionVault();

    const token = event.params.token.toHexString();
    const zeroHolder = getZeroHolder(event.params.account);
    const startEpoch = event.params.startEpoch.toI32();
    const endEpoch = event.params.endEpoch.toI32();
    const amount = event.params.amount;
    const timestamp = event.block.timestamp.toI32();

    vault.lastUpdate = timestamp;

    vault.save();

    const lastTokenBalance = getLastTokenBalance(token);

    lastTokenBalance.balance = lastTokenBalance.balance.minus(amount);
    lastTokenBalance.lastUpdate = timestamp;

    updateLastTokenBalanceSnapshot(token, timestamp, lastTokenBalance.balance);

    const totalClaimed = getTotalClaimed(token);

    totalClaimed.amount = totalClaimed.amount.plus(amount);
    totalClaimed.lastUpdate = timestamp;

    totalClaimed.save();

    updateTotalClaimedSnapshot(token, timestamp, totalClaimed.amount);

    const claim = new Claim(`claim-${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`);

    claim.token = token;
    claim.claimant = zeroHolder.id;
    claim.startEpoch = startEpoch;
    claim.endEpoch = endEpoch;
    claim.amount = amount;
    claim.timestamp = timestamp;
    claim.logIndex = event.logIndex;
    claim.transactionHash = event.transaction.hash.toHexString();

    claim.save();

    for (let epoch = startEpoch; epoch <= endEpoch; ++epoch) {
        const id = `claimedEpoch-${zeroHolder.address}-${token}-${epoch}`;

        const claimedEpoch = new ClaimedEpoch(id);

        claimedEpoch.token = token;
        claimedEpoch.epoch = epoch;
        claimedEpoch.claimant = zeroHolder.id;
        claimedEpoch.claim = claim.id;

        claimedEpoch.save();
    }

    const claimed = getClaimed(zeroHolder, token);

    claimed.amount = claimed.amount.plus(amount);
    claimed.lastUpdate = timestamp;

    claimed.save();

    updateClaimedSnapshot(zeroHolder, token, timestamp, claimed.amount);
}

/* ============ Entity Getters ============ */

function getDistributionVault(): DistributionVault {
    const id = `distributionVault-${VAULT_ADDRESS}`;

    let vault = DistributionVault.load(id);

    if (vault) return vault;

    vault = new DistributionVault(id);

    vault.lastUpdate = 0;

    return vault;
}

function getLastTokenBalance(token: string): LastTokenBalance {
    const id = `lastTokenBalance-${token}`;

    let lastTokenBalance = LastTokenBalance.load(id);

    if (lastTokenBalance) return lastTokenBalance;

    lastTokenBalance = new LastTokenBalance(id);

    lastTokenBalance.token = token;
    lastTokenBalance.balance = BigInt.fromI32(0);
    lastTokenBalance.lastUpdate = 0;

    return lastTokenBalance;
}

function getEpochDistributed(token: string, epoch: i32): EpochDistributed {
    const id = `epochDistributed-${token}-${epoch}`;

    let epochDistributed = EpochDistributed.load(id);

    if (epochDistributed) return epochDistributed;

    epochDistributed = new EpochDistributed(id);

    epochDistributed.token = token;
    epochDistributed.epoch = epoch;
    epochDistributed.amount = BigInt.fromI32(0);
    epochDistributed.lastUpdate = 0;

    return epochDistributed;
}

function getTotalDistributed(token: string): TotalDistributed {
    const id = `totalDistributed-${token}`;

    let totalDistributed = TotalDistributed.load(id);

    if (totalDistributed) return totalDistributed;

    totalDistributed = new TotalDistributed(id);

    totalDistributed.token = token;
    totalDistributed.amount = BigInt.fromI32(0);
    totalDistributed.lastUpdate = 0;

    return totalDistributed;
}

function getTotalClaimed(token: string): TotalClaimed {
    const id = `totalClaimed-${token}`;

    let totalClaimed = TotalClaimed.load(id);

    if (totalClaimed) return totalClaimed;

    totalClaimed = new TotalClaimed(id);

    totalClaimed.token = token;
    totalClaimed.amount = BigInt.fromI32(0);
    totalClaimed.lastUpdate = 0;

    return totalClaimed;
}

function getClaimed(claimant: ZeroHolder, token: string): Claimed {
    const id = `claimed-${claimant.address}-${token}`;

    let claimed = Claimed.load(id);

    if (claimed) return claimed;

    claimed = new Claimed(id);

    claimed.token = token;
    claimed.claimant = claimant.id;
    claimed.amount = BigInt.fromI32(0);
    claimed.lastUpdate = 0;

    return claimed;
}

/* ============ Snapshot Updaters ============ */

function updateLastTokenBalanceSnapshot(token: string, timestamp: Timestamp, value: BigInt): void {
    const id = `lastTokenBalance-${token}-${timestamp.toString()}`;

    let snapshot = LastTokenBalanceSnapshot.load(id);

    if (!snapshot) {
        snapshot = new LastTokenBalanceSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.token = token;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateEpochDistributedSnapshot(token: string, epoch: i32, timestamp: Timestamp, value: BigInt): void {
    const id = `epochDistributed-${token}-${epoch}-${timestamp.toString()}`;

    let snapshot = EpochDistributedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new EpochDistributedSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.token = token;
        snapshot.epoch = epoch;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalDistributedSnapshot(token: string, timestamp: Timestamp, value: BigInt): void {
    const id = `totalDistributed-${token}-${timestamp.toString()}`;

    let snapshot = TotalDistributedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalDistributedSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.token = token;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateTotalClaimedSnapshot(token: string, timestamp: Timestamp, value: BigInt): void {
    const id = `totalClaimed-${token}-${timestamp.toString()}`;

    let snapshot = TotalClaimedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new TotalClaimedSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.token = token;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateClaimedSnapshot(claimant: ZeroHolder, token: string, timestamp: Timestamp, value: BigInt): void {
    const id = `claimed-${claimant.address}-${token}-${timestamp.toString()}`;

    let snapshot = ClaimedSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ClaimedSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.token = token;
        snapshot.claimant = claimant.id;
    }

    snapshot.value = value;

    snapshot.save();
}
