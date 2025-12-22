import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
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
} from "../generated/Superstate/Superstate"

export function createAccountingPausedEvent(admin: Address): AccountingPaused {
  let accountingPausedEvent = changetype<AccountingPaused>(newMockEvent())

  accountingPausedEvent.parameters = new Array()

  accountingPausedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return accountingPausedEvent
}

export function createAccountingUnpausedEvent(
  admin: Address
): AccountingUnpaused {
  let accountingUnpausedEvent = changetype<AccountingUnpaused>(newMockEvent())

  accountingUnpausedEvent.parameters = new Array()

  accountingUnpausedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return accountingUnpausedEvent
}

export function createAdminBurnEvent(
  burner: Address,
  src: Address,
  amount: BigInt
): AdminBurn {
  let adminBurnEvent = changetype<AdminBurn>(newMockEvent())

  adminBurnEvent.parameters = new Array()

  adminBurnEvent.parameters.push(
    new ethereum.EventParam("burner", ethereum.Value.fromAddress(burner))
  )
  adminBurnEvent.parameters.push(
    new ethereum.EventParam("src", ethereum.Value.fromAddress(src))
  )
  adminBurnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return adminBurnEvent
}

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createBridgeEvent(
  caller: Address,
  src: Address,
  amount: BigInt,
  ethDestinationAddress: Address,
  otherDestinationAddress: string,
  chainId: BigInt
): Bridge {
  let bridgeEvent = changetype<Bridge>(newMockEvent())

  bridgeEvent.parameters = new Array()

  bridgeEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  bridgeEvent.parameters.push(
    new ethereum.EventParam("src", ethereum.Value.fromAddress(src))
  )
  bridgeEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bridgeEvent.parameters.push(
    new ethereum.EventParam(
      "ethDestinationAddress",
      ethereum.Value.fromAddress(ethDestinationAddress)
    )
  )
  bridgeEvent.parameters.push(
    new ethereum.EventParam(
      "otherDestinationAddress",
      ethereum.Value.fromString(otherDestinationAddress)
    )
  )
  bridgeEvent.parameters.push(
    new ethereum.EventParam(
      "chainId",
      ethereum.Value.fromUnsignedBigInt(chainId)
    )
  )

  return bridgeEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createMintEvent(
  minter: Address,
  to: Address,
  amount: BigInt
): Mint {
  let mintEvent = changetype<Mint>(newMockEvent())

  mintEvent.parameters = new Array()

  mintEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return mintEvent
}

export function createOffchainRedeemEvent(
  burner: Address,
  src: Address,
  amount: BigInt
): OffchainRedeem {
  let offchainRedeemEvent = changetype<OffchainRedeem>(newMockEvent())

  offchainRedeemEvent.parameters = new Array()

  offchainRedeemEvent.parameters.push(
    new ethereum.EventParam("burner", ethereum.Value.fromAddress(burner))
  )
  offchainRedeemEvent.parameters.push(
    new ethereum.EventParam("src", ethereum.Value.fromAddress(src))
  )
  offchainRedeemEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return offchainRedeemEvent
}

export function createOwnershipTransferStartedEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferStarted {
  let ownershipTransferStartedEvent =
    changetype<OwnershipTransferStarted>(newMockEvent())

  ownershipTransferStartedEvent.parameters = new Array()

  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferStartedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createSetChainIdSupportEvent(
  chainId: BigInt,
  oldSupported: boolean,
  newSupported: boolean
): SetChainIdSupport {
  let setChainIdSupportEvent = changetype<SetChainIdSupport>(newMockEvent())

  setChainIdSupportEvent.parameters = new Array()

  setChainIdSupportEvent.parameters.push(
    new ethereum.EventParam(
      "chainId",
      ethereum.Value.fromUnsignedBigInt(chainId)
    )
  )
  setChainIdSupportEvent.parameters.push(
    new ethereum.EventParam(
      "oldSupported",
      ethereum.Value.fromBoolean(oldSupported)
    )
  )
  setChainIdSupportEvent.parameters.push(
    new ethereum.EventParam(
      "newSupported",
      ethereum.Value.fromBoolean(newSupported)
    )
  )

  return setChainIdSupportEvent
}

export function createSetMaximumOracleDelayEvent(
  oldMaxOracleDelay: BigInt,
  newMaxOracleDelay: BigInt
): SetMaximumOracleDelay {
  let setMaximumOracleDelayEvent =
    changetype<SetMaximumOracleDelay>(newMockEvent())

  setMaximumOracleDelayEvent.parameters = new Array()

  setMaximumOracleDelayEvent.parameters.push(
    new ethereum.EventParam(
      "oldMaxOracleDelay",
      ethereum.Value.fromUnsignedBigInt(oldMaxOracleDelay)
    )
  )
  setMaximumOracleDelayEvent.parameters.push(
    new ethereum.EventParam(
      "newMaxOracleDelay",
      ethereum.Value.fromUnsignedBigInt(newMaxOracleDelay)
    )
  )

  return setMaximumOracleDelayEvent
}

export function createSetOracleEvent(
  oldOracle: Address,
  newOracle: Address
): SetOracle {
  let setOracleEvent = changetype<SetOracle>(newMockEvent())

  setOracleEvent.parameters = new Array()

  setOracleEvent.parameters.push(
    new ethereum.EventParam("oldOracle", ethereum.Value.fromAddress(oldOracle))
  )
  setOracleEvent.parameters.push(
    new ethereum.EventParam("newOracle", ethereum.Value.fromAddress(newOracle))
  )

  return setOracleEvent
}

export function createSetRedemptionContractEvent(
  oldRedemptionContract: Address,
  newRedemptionContract: Address
): SetRedemptionContract {
  let setRedemptionContractEvent =
    changetype<SetRedemptionContract>(newMockEvent())

  setRedemptionContractEvent.parameters = new Array()

  setRedemptionContractEvent.parameters.push(
    new ethereum.EventParam(
      "oldRedemptionContract",
      ethereum.Value.fromAddress(oldRedemptionContract)
    )
  )
  setRedemptionContractEvent.parameters.push(
    new ethereum.EventParam(
      "newRedemptionContract",
      ethereum.Value.fromAddress(newRedemptionContract)
    )
  )

  return setRedemptionContractEvent
}

export function createSetStablecoinConfigEvent(
  stablecoin: Address,
  oldSweepDestination: Address,
  newSweepDestination: Address,
  oldFee: BigInt,
  newFee: BigInt
): SetStablecoinConfig {
  let setStablecoinConfigEvent = changetype<SetStablecoinConfig>(newMockEvent())

  setStablecoinConfigEvent.parameters = new Array()

  setStablecoinConfigEvent.parameters.push(
    new ethereum.EventParam(
      "stablecoin",
      ethereum.Value.fromAddress(stablecoin)
    )
  )
  setStablecoinConfigEvent.parameters.push(
    new ethereum.EventParam(
      "oldSweepDestination",
      ethereum.Value.fromAddress(oldSweepDestination)
    )
  )
  setStablecoinConfigEvent.parameters.push(
    new ethereum.EventParam(
      "newSweepDestination",
      ethereum.Value.fromAddress(newSweepDestination)
    )
  )
  setStablecoinConfigEvent.parameters.push(
    new ethereum.EventParam("oldFee", ethereum.Value.fromUnsignedBigInt(oldFee))
  )
  setStablecoinConfigEvent.parameters.push(
    new ethereum.EventParam("newFee", ethereum.Value.fromUnsignedBigInt(newFee))
  )

  return setStablecoinConfigEvent
}

export function createSubscribeV2Event(
  subscriber: Address,
  to: Address,
  stablecoin: Address,
  stablecoinInAmountAfterFee: BigInt,
  stablecoinInAmountBeforeFee: BigInt,
  superstateTokenOutAmount: BigInt
): SubscribeV2 {
  let subscribeV2Event = changetype<SubscribeV2>(newMockEvent())

  subscribeV2Event.parameters = new Array()

  subscribeV2Event.parameters.push(
    new ethereum.EventParam(
      "subscriber",
      ethereum.Value.fromAddress(subscriber)
    )
  )
  subscribeV2Event.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  subscribeV2Event.parameters.push(
    new ethereum.EventParam(
      "stablecoin",
      ethereum.Value.fromAddress(stablecoin)
    )
  )
  subscribeV2Event.parameters.push(
    new ethereum.EventParam(
      "stablecoinInAmountAfterFee",
      ethereum.Value.fromUnsignedBigInt(stablecoinInAmountAfterFee)
    )
  )
  subscribeV2Event.parameters.push(
    new ethereum.EventParam(
      "stablecoinInAmountBeforeFee",
      ethereum.Value.fromUnsignedBigInt(stablecoinInAmountBeforeFee)
    )
  )
  subscribeV2Event.parameters.push(
    new ethereum.EventParam(
      "superstateTokenOutAmount",
      ethereum.Value.fromUnsignedBigInt(superstateTokenOutAmount)
    )
  )

  return subscribeV2Event
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
