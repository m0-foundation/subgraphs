import { StablecoinContract } from 'generated'
import {
  getHolder,
  getHoldersSnapshot,
  getStablecoin,
  getSupplySnapshot,
  getTransferSnapshot,
  Operation,
} from './entity'

StablecoinContract.Transfer.handler(async ({ event, context }) => {
  // context.log.info(`Processing event with block hash: ${event.block.hash} (info)`)
  // context.log.warn(`Processing event with block hash: ${event.block.hash} (warn)`)
  // context.log.debug(`Processing event with block hash: ${event.block.hash} (debug)`)

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'.toLowerCase()

  const amount = event.params.amount
  const txTimestamp = BigInt(event.block.timestamp) * 1000000n
  const txHash = (event.transaction as { hash: string }).hash

  if (amount <= 0n) {
    return
  }

  const [stablecoin, sender, recipient] = await Promise.all([
    getStablecoin(context, event.srcAddress, event.chainId),
    getHolder(context, event.params.sender, event.chainId),
    getHolder(context, event.params.recipient, event.chainId),
  ])

  if (event.params.sender.toLowerCase() === ZERO_ADDRESS) {
    const recipientBalancePrev = recipient.balance
    recipient.received += amount
    recipient.balance += amount
    // createReceivedSnapshot({
    //   account: recipient.id,
    //   amount,
    //   blockNumber: event.block.number,
    //   transactionHash: event.transaction.hash,
    //   logIndex: event.logIndex,
    // });

    // if (event.block.number == 23393824) {
    //   context.log.info(`Processing amount: ${amount}`)
    //   context.log.info(`Previous supply: ${stablecoin.supply}`)
    // }

    stablecoin.minted += amount
    stablecoin.supply = stablecoin.minted - stablecoin.burned

    // if (event.block.number == 23393824) {
    //   context.log.info(`New supply: ${stablecoin.supply}`)
    // }

    const supplySnapshot = await getSupplySnapshot(context, stablecoin, txHash, event.logIndex)
    supplySnapshot.amount = stablecoin.supply
    supplySnapshot.blockNumber = event.block.number
    supplySnapshot.timestamp = txTimestamp
    supplySnapshot.delta = amount
    supplySnapshot.operation = Operation.MINT
    context.SupplySnapshot.set(supplySnapshot)

    if (recipientBalancePrev === 0n && recipient.balance > 0n) {
      stablecoin.holdersCount += 1

      const holderSnapshot = await getHoldersSnapshot(
        context,
        event.chainId,
        txHash,
        event.logIndex,
      )
      holderSnapshot.blockNumber = event.block.number
      holderSnapshot.timestamp = txTimestamp
      holderSnapshot.amount = stablecoin.holdersCount
      context.HoldersSnapshot.set(holderSnapshot)
    }
  } else if (event.params.recipient.toLowerCase() === ZERO_ADDRESS) {
    const senderBalancePrev = sender.balance

    sender.sent += amount
    sender.balance -= amount
    // createSentSnapshot({
    //   account: sender.id,
    //   amount,
    //   blockNumber: event.block.number,
    //   transactionHash: event.transaction.hash,
    //   logIndex: event.logIndex,
    // })

    stablecoin.burned += amount
    stablecoin.supply = stablecoin.minted - stablecoin.burned

    const supplySnapshot = await getSupplySnapshot(context, stablecoin, txHash, event.logIndex)
    supplySnapshot.amount = stablecoin.supply
    supplySnapshot.blockNumber = event.block.number
    supplySnapshot.timestamp = txTimestamp
    supplySnapshot.delta = -amount
    supplySnapshot.operation = Operation.BURN
    context.SupplySnapshot.set(supplySnapshot)

    if (senderBalancePrev > 0n && sender.balance === 0n) {
      stablecoin.holdersCount -= 1

      const holderSnapshot = await getHoldersSnapshot(
        context,
        event.chainId,
        txHash,
        event.logIndex,
      )
      holderSnapshot.blockNumber = event.block.number
      holderSnapshot.timestamp = txTimestamp
      holderSnapshot.amount = stablecoin.holdersCount
      context.HoldersSnapshot.set(holderSnapshot)
    }
  } else {
    const senderBalancePrev = sender.balance
    const recipientBalancePrev = recipient.balance

    sender.sent += amount
    sender.balance -= amount

    recipient.received += amount
    recipient.balance += amount

    // createSentSnapshot({
    //   account: sender.id,
    //   amount,
    //   blockNumber: event.block.number,
    //   transactionHash: event.transaction.hash,
    //   logIndex: event.logIndex,
    // })

    // createReceivedSnapshot({
    //   account: recipient.id,
    //   amount,
    //   blockNumber: event.block.number,
    //   transactionHash: event.transaction.hash,
    //   logIndex: event.logIndex,
    // })

    let delta = 0
    if (senderBalancePrev > 0n && sender.balance === 0n) {
      delta -= 1
    }
    if (recipientBalancePrev === 0n && recipient.balance > 0n) {
      delta += 1
    }
    if (delta !== 0) {
      stablecoin.holdersCount += delta

      const holderSnapshot = await getHoldersSnapshot(
        context,
        event.chainId,
        txHash,
        event.logIndex,
      )
      holderSnapshot.blockNumber = event.block.number
      holderSnapshot.timestamp = txTimestamp
      holderSnapshot.amount = stablecoin.holdersCount
      context.HoldersSnapshot.set(holderSnapshot)
    }
  }

  // if (event.block.number < 23393824 && event.block.number >= 23393076) {
  //   context.log.info(
  //     `Supply for ${event.block.number}: ${stablecoin.supply}. Minted: ${stablecoin.minted}, Burned:  ${stablecoin.burned}, Amount: ${amount}`,
  //   )
  // }

  stablecoin.lastUpdate = txTimestamp
  sender.lastUpdate = txTimestamp
  recipient.lastUpdate = txTimestamp

  context.Stablecoin.set(stablecoin)
  context.Holder.set(sender)
  context.Holder.set(recipient)

  const transferSnapshot = await getTransferSnapshot(context, event.chainId, txHash, event.logIndex)
  transferSnapshot.sender = event.params.sender
  transferSnapshot.recipient = event.params.recipient
  transferSnapshot.amount = amount
  transferSnapshot.blockNumber = event.block.number
  transferSnapshot.timestamp = txTimestamp
  context.TransferSnapshot.set(transferSnapshot)
})

//  pnpm run codegen && pnpm run dev
//  pnpm run codegen && TUI_OFF=true LOG_LEVEL="uwarn" pnpm run dev
