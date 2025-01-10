import { BigInt, Timestamp } from '@graphprotocol/graph-ts';
import {
    EmergencyNoWeightSnapshot,
    EmergencyYesWeightSnapshot,
    EmergencyVote,
    EmergencyProposal,
    EmergencyThresholdRatioSnapshot,
    EmergencyGovernor,
    ZeroNoWeightSnapshot,
    ZeroYesWeightSnapshot,
    ZeroVote,
    ZeroProposal,
    ZeroThresholdRatioSnapshot,
    ZeroGovernor,
    StandardNoWeightSnapshot,
    StandardYesWeightSnapshot,
    StandardVote,
    StandardProposal,
    StandardGovernorCashTokenSnapshot,
    ProposalFeeSnapshot,
    StandardProposalCount,
    StandardGovernor,
} from '../generated/schema';
import {
    VoteCast as VoteCastEvent,
    ProposalExecuted as ProposalExecutedEvent,
    ProposalCreated as ProposalCreatedEvent,
    ProposalFeeSentToVault as ProposalFeeSentToVaultEvent,
    HasVotedOnAllProposals as HasVotedOnAllProposalsEvent,
    CashTokenSet as CashTokenSetEvent,
    ProposalFeeSet as ProposalFeeSetEvent,
} from '../generated/StandardGovernor/StandardGovernor';
import { ThresholdRatioSet as ThresholdRatioSetEvent } from '../generated/EmergencyGovernor/EmergencyGovernor';
import { ResetExecuted as ResetExecutedEvent } from '../generated/ZeroGovernor/ZeroGovernor';

import { getPowerDelegatee, getZeroDelegatee } from './utils';

const EMERGENCY_GOVERNOR_ADDRESS = '0x886d405949F709bC3f4451491bDd07ff51Cdf90A';
const STANDARD_GOVERNOR_ADDRESS = '0xB024aC5a7c6bC92fbACc8C3387E628a07e1Da016';
const ZERO_GOVERNOR_ADDRESS = '0xa0DAFaEEA4A1d44534e1b9227e19CAE6358b80FE';

// TODO: More can be done to parse/decode `proposal.callData` into the underlying calls and arguments to be indexed
//       more explicitly.

/* ============ Handlers ============ */

export function handleEmergencyGovernorThresholdRatioSet(event: ThresholdRatioSetEvent): void {
    const governor = getEmergencyGovernor();

    const thresholdRatio = event.params.thresholdRatio;
    const timestamp = event.block.timestamp.toI32();

    governor.thresholdRatio = thresholdRatio;
    governor.lastUpdate = timestamp;

    governor.save();

    updateEmergencyThresholdRatioSnapshot(governor, timestamp, thresholdRatio);
}

export function handleZeroGovernorThresholdRatioSet(event: ThresholdRatioSetEvent): void {
    const governor = getZeroGovernor();

    const thresholdRatio = event.params.thresholdRatio;
    const timestamp = event.block.timestamp.toI32();

    governor.thresholdRatio = thresholdRatio;
    governor.lastUpdate = timestamp;

    governor.save();

    updateZeroThresholdRatioSnapshot(governor, timestamp, thresholdRatio);
}

export function handleEmergencyVoteCast(event: VoteCastEvent): void {
    const proposal = EmergencyProposal.load(`emergencyProposal-${event.params.proposalId.toString()}`);

    if (!proposal) throw new Error('Proposal not found');

    const voter = getPowerDelegatee(event.params.voter);
    const support = event.params.support != 0;
    const weight = event.params.weight;
    const reason = event.params.reason;
    const timestamp = event.block.timestamp.toI32();

    if (support) {
        updateEmergencyYesWeightSnapshot(proposal, timestamp, (proposal.yesWeight = proposal.yesWeight.plus(weight)));
    } else {
        updateEmergencyNoWeightSnapshot(proposal, timestamp, (proposal.noWeight = proposal.noWeight.plus(weight)));
    }

    proposal.save();

    const vote = new EmergencyVote(`emergencyVote-${proposal.id}-${voter.address}`);

    vote.voter = voter.id;
    vote.proposal = proposal.id;
    vote.support = support;
    vote.weight = weight;
    vote.reason = reason;
    vote.timestamp = timestamp;
    vote.transactionHash = event.transaction.hash.toHexString();
    vote.logIndex = event.logIndex;

    vote.save();
}

export function handleStandardVoteCast(event: VoteCastEvent): void {
    const proposal = StandardProposal.load(`standardProposal-${event.params.proposalId.toString()}`);

    if (!proposal) throw new Error('Proposal not found');

    const voter = getPowerDelegatee(event.params.voter);
    const support = event.params.support != 0;
    const weight = event.params.weight;
    const reason = event.params.reason;
    const timestamp = event.block.timestamp.toI32();

    if (support) {
        updateStandardYesWeightSnapshot(proposal, timestamp, (proposal.yesWeight = proposal.yesWeight.plus(weight)));
    } else {
        updateStandardNoWeightSnapshot(proposal, timestamp, (proposal.noWeight = proposal.noWeight.plus(weight)));
    }

    proposal.save();

    const vote = new StandardVote(`standardVote-${proposal.id}-${voter.address}`);

    vote.voter = voter.id;
    vote.proposal = proposal.id;
    vote.support = support;
    vote.weight = weight;
    vote.reason = reason;
    vote.timestamp = timestamp;
    vote.transactionHash = event.transaction.hash.toHexString();
    vote.logIndex = event.logIndex;

    vote.save();
}

export function handleZeroVoteCast(event: VoteCastEvent): void {
    const proposal = ZeroProposal.load(`zeroProposal-${event.params.proposalId.toString()}`);

    if (!proposal) throw new Error('Proposal not found');

    const voter = getZeroDelegatee(event.params.voter);
    const support = event.params.support != 0;
    const weight = event.params.weight;
    const reason = event.params.reason;
    const timestamp = event.block.timestamp.toI32();

    if (support) {
        updateZeroYesWeightSnapshot(proposal, timestamp, (proposal.yesWeight = proposal.yesWeight.plus(weight)));
    } else {
        updateZeroNoWeightSnapshot(proposal, timestamp, (proposal.noWeight = proposal.noWeight.plus(weight)));
    }

    proposal.save();

    const vote = new ZeroVote(`zeroVote-${proposal.id}-${voter.address}`);

    vote.voter = voter.id;
    vote.proposal = proposal.id;
    vote.support = support;
    vote.weight = weight;
    vote.reason = reason;
    vote.timestamp = timestamp;
    vote.transactionHash = event.transaction.hash.toHexString();
    vote.logIndex = event.logIndex;

    vote.save();
}

export function handleEmergencyProposalExecuted(event: ProposalExecutedEvent): void {
    const proposal = EmergencyProposal.load(`emergencyProposal-${event.params.proposalId.toString()}`);

    if (!proposal) throw new Error('Proposal not found');

    proposal.executedTimestamp = event.block.timestamp.toI32();
    proposal.executedTransactionHash = event.transaction.hash.toHexString();
    proposal.executedLogIndex = event.logIndex;

    proposal.save();
}

export function handleStandardProposalExecuted(event: ProposalExecutedEvent): void {
    const proposal = StandardProposal.load(`standardProposal-${event.params.proposalId.toString()}`);

    if (!proposal) throw new Error('Proposal not found');

    proposal.executedTimestamp = event.block.timestamp.toI32();
    proposal.executedTransactionHash = event.transaction.hash.toHexString();
    proposal.executedLogIndex = event.logIndex;

    proposal.save();
}

export function handleZeroProposalExecuted(event: ProposalExecutedEvent): void {
    const proposal = ZeroProposal.load(`zeroProposal-${event.params.proposalId.toString()}`);

    if (!proposal) throw new Error('Proposal not found');

    proposal.executedTimestamp = event.block.timestamp.toI32();
    proposal.executedTransactionHash = event.transaction.hash.toHexString();
    proposal.executedLogIndex = event.logIndex;

    proposal.save();
}

export function handleEmergencyProposalCreated(event: ProposalCreatedEvent): void {
    const governor = getEmergencyGovernor();

    const proposalId = event.params.proposalId;
    const timestamp = event.block.timestamp.toI32();

    const proposal = new EmergencyProposal(`emergencyProposal-${proposalId.toString()}`);

    proposal.proposalId = proposalId;
    proposal.governor = governor.id;
    proposal.proposer = event.params.proposer.toHexString();
    proposal.voteStart = event.params.voteStart.toI32();
    proposal.voteEnd = event.params.voteEnd.toI32();
    proposal.callData = event.params.callDatas[0].toHexString(); // TODO: check if this decoding is correct.
    proposal.description = event.params.description;
    proposal.noWeight = BigInt.fromI32(0);
    proposal.yesWeight = BigInt.fromI32(0);
    proposal.thresholdRatio = governor.thresholdRatio;
    proposal.createdTimestamp = timestamp;
    proposal.createdTransactionHash = event.transaction.hash.toHexString();
    proposal.createdLogIndex = event.logIndex;
    proposal.lastUpdate = timestamp;

    proposal.save();
}

export function handleStandardProposalCreated(event: ProposalCreatedEvent): void {
    const governor = getStandardGovernor();

    const proposalId = event.params.proposalId;
    const voteStart = event.params.voteStart.toI32();
    const timestamp = event.block.timestamp.toI32();

    const proposalCount = getStandardProposalCount(voteStart);

    proposalCount.count = proposalCount.count.plus(BigInt.fromI32(1));
    proposalCount.lastUpdate = timestamp;

    proposalCount.save();

    const proposal = new StandardProposal(`standardProposal-${proposalId.toString()}`);

    proposal.proposalId = proposalId;
    proposal.governor = governor.id;
    proposal.proposer = event.params.proposer.toHexString();
    proposal.voteStart = voteStart;
    proposal.voteEnd = event.params.voteEnd.toI32();
    proposal.callData = event.params.callDatas[0].toHexString(); // TODO: check if this decoding is correct.
    proposal.description = event.params.description;
    proposal.noWeight = BigInt.fromI32(0);
    proposal.yesWeight = BigInt.fromI32(0);
    proposal.cashToken = governor.cashToken;
    proposal.proposalFee = governor.proposalFee;
    proposal.createdTimestamp = timestamp;
    proposal.createdTransactionHash = event.transaction.hash.toHexString();
    proposal.createdLogIndex = event.logIndex;
    proposal.lastUpdate = timestamp;

    proposal.save();
}

export function handleZeroProposalCreated(event: ProposalCreatedEvent): void {
    const governor = getZeroGovernor();

    const proposalId = event.params.proposalId;
    const timestamp = event.block.timestamp.toI32();

    const proposal = new EmergencyProposal(`zeroProposal-${proposalId.toString()}`);

    proposal.proposalId = proposalId;
    proposal.governor = governor.id;
    proposal.proposer = event.params.proposer.toHexString();
    proposal.voteStart = event.params.voteStart.toI32();
    proposal.voteEnd = event.params.voteEnd.toI32();
    proposal.callData = event.params.callDatas[0].toHexString(); // TODO: check if this decoding is correct.
    proposal.description = event.params.description;
    proposal.noWeight = BigInt.fromI32(0);
    proposal.yesWeight = BigInt.fromI32(0);
    proposal.thresholdRatio = governor.thresholdRatio;
    proposal.createdTimestamp = timestamp;
    proposal.createdTransactionHash = event.transaction.hash.toHexString();
    proposal.createdLogIndex = event.logIndex;
    proposal.lastUpdate = timestamp;

    proposal.save();
}

export function handleResetExecuted(event: ResetExecutedEvent): void {
    // TODO: implement and use templates to watch new contracts.
}

export function handleProposalFeeSentToVault(event: ProposalFeeSentToVaultEvent): void {
    // TODO: Implement with immutable entity, but Cash Token transfers to the vault have the same information.
}

export function handleHasVotedOnAllProposals(event: HasVotedOnAllProposalsEvent): void {
    // TODO: Implement if needed, but Zero Token mints already reveals the same information.
}

export function handleCashTokenSet(event: CashTokenSetEvent): void {
    const governor = getStandardGovernor();

    const timestamp = event.block.timestamp.toI32();

    governor.cashToken = event.params.cashToken.toHexString();
    governor.lastUpdate = timestamp;

    governor.save();

    updateStandardGovernorCashTokenSnapshot(governor, timestamp, governor.cashToken);
}

export function handleProposalFeeSet(event: ProposalFeeSetEvent): void {
    const governor = getStandardGovernor();

    const timestamp = event.block.timestamp.toI32();

    governor.proposalFee = event.params.proposalFee;
    governor.lastUpdate = timestamp;

    governor.save();

    updateProposalFeeSnapshot(governor, timestamp, governor.proposalFee);
}

/* ============ Entity Getters ============ */

function getEmergencyGovernor(): EmergencyGovernor {
    const id = `emergencyGovernor-${EMERGENCY_GOVERNOR_ADDRESS}`;

    let governor = EmergencyGovernor.load(id);

    if (governor) return governor;

    governor = new EmergencyGovernor(id);

    governor.thresholdRatio = 0;
    governor.lastUpdate = 0;

    return governor;
}

function getStandardGovernor(): StandardGovernor {
    const id = `standardGovernor-${STANDARD_GOVERNOR_ADDRESS}`;

    let governor = StandardGovernor.load(id);

    if (governor) return governor;

    governor = new StandardGovernor(id);

    governor.cashToken = '';
    governor.proposalFee = BigInt.fromI32(0);
    governor.lastUpdate = 0;

    return governor;
}

function getZeroGovernor(): ZeroGovernor {
    const id = `zeroGovernor-${ZERO_GOVERNOR_ADDRESS}`;

    let governor = ZeroGovernor.load(id);

    if (governor) return governor;

    governor = new ZeroGovernor(id);

    governor.thresholdRatio = 0;
    governor.lastUpdate = 0;

    return governor;
}

function getStandardProposalCount(epoch: i32): StandardProposalCount {
    const id = `standardProposalCount-${epoch}`;

    let proposalCount = StandardProposalCount.load(id);

    if (proposalCount) return proposalCount;

    proposalCount = new StandardProposalCount(id);

    proposalCount.epoch = epoch;
    proposalCount.count = BigInt.fromI32(0);
    proposalCount.lastUpdate = 0;

    return proposalCount;
}

/* ============ Snapshot Updaters ============ */

function updateEmergencyThresholdRatioSnapshot(governor: EmergencyGovernor, timestamp: Timestamp, value: i32): void {
    const id = `emergencyThresholdRatio-${timestamp.toString()}`;

    let snapshot = EmergencyThresholdRatioSnapshot.load(id);

    if (!snapshot) {
        snapshot = new EmergencyThresholdRatioSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.governor = governor.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroThresholdRatioSnapshot(governor: ZeroGovernor, timestamp: Timestamp, value: i32): void {
    const id = `zeroThresholdRatio-${timestamp.toString()}`;

    let snapshot = ZeroThresholdRatioSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroThresholdRatioSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.governor = governor.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateEmergencyYesWeightSnapshot(proposal: EmergencyProposal, timestamp: Timestamp, value: BigInt): void {
    const id = `emergencyYesWeight-${proposal.id}-${timestamp.toString()}`;

    let snapshot = EmergencyYesWeightSnapshot.load(id);

    if (!snapshot) {
        snapshot = new EmergencyYesWeightSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.proposal = proposal.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateStandardYesWeightSnapshot(proposal: StandardProposal, timestamp: Timestamp, value: BigInt): void {
    const id = `standardYesWeight-${proposal.id}-${timestamp.toString()}`;

    let snapshot = StandardYesWeightSnapshot.load(id);

    if (!snapshot) {
        snapshot = new StandardYesWeightSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.proposal = proposal.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroYesWeightSnapshot(proposal: ZeroProposal, timestamp: Timestamp, value: BigInt): void {
    const id = `zeroYesWeight-${proposal.id}-${timestamp.toString()}`;

    let snapshot = ZeroYesWeightSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroYesWeightSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.proposal = proposal.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateEmergencyNoWeightSnapshot(proposal: EmergencyProposal, timestamp: Timestamp, value: BigInt): void {
    const id = `emergencyNoWeight-${proposal.id}-${timestamp.toString()}`;

    let snapshot = EmergencyNoWeightSnapshot.load(id);

    if (!snapshot) {
        snapshot = new EmergencyNoWeightSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.proposal = proposal.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateStandardNoWeightSnapshot(proposal: StandardProposal, timestamp: Timestamp, value: BigInt): void {
    const id = `standardNoWeight-${proposal.id}-${timestamp.toString()}`;

    let snapshot = StandardNoWeightSnapshot.load(id);

    if (!snapshot) {
        snapshot = new StandardNoWeightSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.proposal = proposal.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateZeroNoWeightSnapshot(proposal: ZeroProposal, timestamp: Timestamp, value: BigInt): void {
    const id = `zeroNoWeight-${proposal.id}-${timestamp.toString()}`;

    let snapshot = ZeroNoWeightSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ZeroNoWeightSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.proposal = proposal.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateStandardGovernorCashTokenSnapshot(
    governor: StandardGovernor,
    timestamp: Timestamp,
    value: string
): void {
    const id = `standardGovernorCashToken-${timestamp.toString()}`;

    let snapshot = StandardGovernorCashTokenSnapshot.load(id);

    if (!snapshot) {
        snapshot = new StandardGovernorCashTokenSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.governor = governor.id;
    }

    snapshot.value = value;

    snapshot.save();
}

function updateProposalFeeSnapshot(governor: StandardGovernor, timestamp: Timestamp, value: BigInt): void {
    const id = `proposalFee-${timestamp.toString()}`;

    let snapshot = ProposalFeeSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ProposalFeeSnapshot(id);

        snapshot.timestamp = timestamp;
        snapshot.governor = governor.id;
    }

    snapshot.value = value;

    snapshot.save();
}
