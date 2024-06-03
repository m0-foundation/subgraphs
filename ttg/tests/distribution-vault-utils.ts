import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Claim,
  Distribution,
  EIP712DomainChanged
} from "../generated/DistributionVault/DistributionVault"

export function createClaimEvent(
  token: Address,
  account: Address,
  startEpoch: BigInt,
  endEpoch: BigInt,
  amount: BigInt
): Claim {
  let claimEvent = changetype<Claim>(newMockEvent())

  claimEvent.parameters = new Array()

  claimEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  claimEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  claimEvent.parameters.push(
    new ethereum.EventParam(
      "startEpoch",
      ethereum.Value.fromUnsignedBigInt(startEpoch)
    )
  )
  claimEvent.parameters.push(
    new ethereum.EventParam(
      "endEpoch",
      ethereum.Value.fromUnsignedBigInt(endEpoch)
    )
  )
  claimEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return claimEvent
}

export function createDistributionEvent(
  token: Address,
  epoch: BigInt,
  amount: BigInt
): Distribution {
  let distributionEvent = changetype<Distribution>(newMockEvent())

  distributionEvent.parameters = new Array()

  distributionEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  distributionEvent.parameters.push(
    new ethereum.EventParam("epoch", ethereum.Value.fromUnsignedBigInt(epoch))
  )
  distributionEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return distributionEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}
