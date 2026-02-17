import { Stablecoin, Holder, SupplySnapshot, TransferSnapshot, HoldersSnapshot } from 'generated'
import { HandlerContext } from 'generated/src/Types'

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export enum Operation {
  MINT = 'MINT',
  BURN = 'BURN',
}

export const getStablecoin = async (
  context: HandlerContext,
  address: string,
  chainId: number,
): Promise<Mutable<Stablecoin>> => {
  return await context.Stablecoin.getOrCreate({
    id: `${chainId}_${address}`,
    chainId,
    minted: 0n,
    burned: 0n,
    claimed: 0n,
    accruedYield: 0n,
    supply: 0n,
    holdersCount: 0,
    lastUpdate: 0n,
  })
}

export const getHolder = async (
  context: HandlerContext,
  address: string,
  chainId: number,
): Promise<Mutable<Holder>> => {
  return await context.Holder.getOrCreate({
    id: `${chainId}_${address}`,
    chainId,
    received: 0n,
    balance: 0n,
    sent: 0n,
    lastUpdate: 0n,
  })
}

export const getTransferSnapshot = async (
  context: HandlerContext,
  chainId: number,
  txHash: string,
  logIndex: number,
): Promise<Mutable<TransferSnapshot>> => {
  return await context.TransferSnapshot.getOrCreate({
    id: `${chainId}_${txHash}_${logIndex}`,
    chainId,
    timestamp: 0n,
    sender: '',
    recipient: '',
    amount: 0n,
    blockNumber: 0,
    transactionHash: txHash,
    logIndex,
  })
}

export const getSupplySnapshot = async (
  context: HandlerContext,
  stablecoin: Stablecoin,
  txHash: string,
  logIndex: number,
): Promise<Mutable<SupplySnapshot>> => {
  return await context.SupplySnapshot.getOrCreate({
    id: `${stablecoin.chainId}_${txHash}_${logIndex}`,
    chainId: stablecoin.chainId,
    timestamp: 0n,
    amount: 0n,
    stablecoin_id: stablecoin.id,
    blockNumber: 0,
    transactionHash: txHash,
    logIndex,
    delta: 0n,
    operation: Operation.MINT,
  })
}

export const getHoldersSnapshot = async (
  context: HandlerContext,
  chainId: number,
  txHash: string,
  logIndex: number,
): Promise<Mutable<HoldersSnapshot>> => {
  return await context.HoldersSnapshot.getOrCreate({
    id: `${chainId}_${txHash}_${logIndex}`,
    chainId,
    timestamp: 0n,
    amount: 0,
    blockNumber: 0,
    transactionHash: txHash,
    logIndex,
  })
}
