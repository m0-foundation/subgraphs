import {
  AccountingPaused as AccountingPausedEvent,
  AccountingUnpaused as AccountingUnpausedEvent,
  AdminBurn as AdminBurnEvent,
  Approval as ApprovalEvent,
  Bridge as BridgeEvent,
  Initialized as InitializedEvent,
  Mint as MintEvent,
  OffchainRedeem as OffchainRedeemEvent,
  OwnershipTransferStarted as OwnershipTransferStartedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  SetChainIdSupport as SetChainIdSupportEvent,
  SetMaximumOracleDelay as SetMaximumOracleDelayEvent,
  SetOracle as SetOracleEvent,
  SetRedemptionContract as SetRedemptionContractEvent,
  SetStablecoinConfig as SetStablecoinConfigEvent,
  SubscribeV2 as SubscribeV2Event,
  Transfer as TransferEvent,
  Unpaused as UnpausedEvent
} from "../generated/Superstate/Superstate"
import {
  AccountingPaused,
  AccountingUnpaused,
  AdminBurn,
  Approval,
  Bridge,
  Initialized,
  Mint,
  OffchainRedeem,
  OwnershipTransferStarted,
  OwnershipTransferred,
  Paused,
  SetChainIdSupport,
  SetMaximumOracleDelay,
  SetOracle,
  SetRedemptionContract,
  SetStablecoinConfig,
  SubscribeV2,
  Transfer,
  Unpaused
} from "../generated/schema"

export function handleAccountingPaused(event: AccountingPausedEvent): void {
  let entity = new AccountingPaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAccountingUnpaused(event: AccountingUnpausedEvent): void {
  let entity = new AccountingUnpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAdminBurn(event: AdminBurnEvent): void {
  let entity = new AdminBurn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.burner = event.params.burner
  entity.src = event.params.src
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBridge(event: BridgeEvent): void {
  let entity = new Bridge(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.caller = event.params.caller
  entity.src = event.params.src
  entity.amount = event.params.amount
  entity.ethDestinationAddress = event.params.ethDestinationAddress
  entity.otherDestinationAddress = event.params.otherDestinationAddress
  entity.chainId = event.params.chainId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMint(event: MintEvent): void {
  let entity = new Mint(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.to = event.params.to
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOffchainRedeem(event: OffchainRedeemEvent): void {
  let entity = new OffchainRedeem(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.burner = event.params.burner
  entity.src = event.params.src
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferStarted(
  event: OwnershipTransferStartedEvent
): void {
  let entity = new OwnershipTransferStarted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetChainIdSupport(event: SetChainIdSupportEvent): void {
  let entity = new SetChainIdSupport(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.chainId = event.params.chainId
  entity.oldSupported = event.params.oldSupported
  entity.newSupported = event.params.newSupported

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetMaximumOracleDelay(
  event: SetMaximumOracleDelayEvent
): void {
  let entity = new SetMaximumOracleDelay(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldMaxOracleDelay = event.params.oldMaxOracleDelay
  entity.newMaxOracleDelay = event.params.newMaxOracleDelay

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetOracle(event: SetOracleEvent): void {
  let entity = new SetOracle(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldOracle = event.params.oldOracle
  entity.newOracle = event.params.newOracle

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetRedemptionContract(
  event: SetRedemptionContractEvent
): void {
  let entity = new SetRedemptionContract(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldRedemptionContract = event.params.oldRedemptionContract
  entity.newRedemptionContract = event.params.newRedemptionContract

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetStablecoinConfig(
  event: SetStablecoinConfigEvent
): void {
  let entity = new SetStablecoinConfig(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.stablecoin = event.params.stablecoin
  entity.oldSweepDestination = event.params.oldSweepDestination
  entity.newSweepDestination = event.params.newSweepDestination
  entity.oldFee = event.params.oldFee
  entity.newFee = event.params.newFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSubscribeV2(event: SubscribeV2Event): void {
  let entity = new SubscribeV2(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.subscriber = event.params.subscriber
  entity.to = event.params.to
  entity.stablecoin = event.params.stablecoin
  entity.stablecoinInAmountAfterFee = event.params.stablecoinInAmountAfterFee
  entity.stablecoinInAmountBeforeFee = event.params.stablecoinInAmountBeforeFee
  entity.superstateTokenOutAmount = event.params.superstateTokenOutAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
