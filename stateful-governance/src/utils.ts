import { Address, BigInt } from '@graphprotocol/graph-ts';
import { PowerHolder, PowerDelegatee, ZeroHolder, ZeroDelegatee } from '../generated/schema';

/* ============ Entity Getters ============ */

export function getZeroHolder(address: Address): ZeroHolder {
    const id = `zeroHolder-${address.toHexString()}`;

    let holder = ZeroHolder.load(id);

    if (holder) return holder;

    holder = new ZeroHolder(id);

    const delegatee = getZeroDelegatee(address);

    delegatee.save();

    holder.address = address.toHexString();
    holder.balance = BigInt.fromI32(0);
    holder.delegatee = delegatee.id;
    holder.received = BigInt.fromI32(0);
    holder.sent = BigInt.fromI32(0);
    holder.lastUpdate = 0;

    return holder;
}

export function getZeroDelegatee(address: Address): ZeroDelegatee {
    const id = `zeroDelegatee-${address.toHexString()}`;

    let delegatee = ZeroDelegatee.load(id);

    if (delegatee) return delegatee;

    delegatee = new ZeroDelegatee(id);

    delegatee.address = address.toHexString();
    delegatee.votingWeight = BigInt.fromI32(0);
    delegatee.lastUpdate = 0;

    return delegatee;
}

export function getPowerHolder(address: Address): PowerHolder {
    const id = `powerHolder-${address.toHexString()}`;

    let holder = PowerHolder.load(id);

    if (holder) return holder;

    holder = new PowerHolder(id);

    const delegatee = getPowerDelegatee(address);

    delegatee.save();

    holder.address = address.toHexString();
    holder.balance = BigInt.fromI32(0);
    holder.delegatee = delegatee.id;
    holder.received = BigInt.fromI32(0);
    holder.sent = BigInt.fromI32(0);
    holder.inflationSynced = BigInt.fromI32(0);
    holder.lastUpdate = 0;

    return holder;
}

export function getPowerDelegatee(address: Address): PowerDelegatee {
    const id = `powerDelegatee-${address.toHexString()}`;

    let delegatee = PowerDelegatee.load(id);

    if (delegatee) return delegatee;

    delegatee = new PowerDelegatee(id);

    delegatee.address = address.toHexString();
    delegatee.votingWeight = BigInt.fromI32(0);
    delegatee.lastUpdate = 0;

    return delegatee;
}
