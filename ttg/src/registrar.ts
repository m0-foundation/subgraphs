import {
  AddressAddedToList as AddressAddedToListEvent,
  AddressRemovedFromList as AddressRemovedFromListEvent,
  KeySet as KeySetEvent,
} from "../generated/Registrar/Registrar"
import {
  AddressAddedToList,
  AddressRemovedFromList,
  KeySet,
  ProtocolConfig,
} from "../generated/schema"
import { decodeUint256, safeDecodeBytes } from "./utils"

export function handleAddressAddedToList(event: AddressAddedToListEvent): void {
  let entity = new AddressAddedToList(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.list = event.params.list
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAddressRemovedFromList(
  event: AddressRemovedFromListEvent,
): void {
  let entity = new AddressRemovedFromList(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.list = event.params.list
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleKeySet(event: KeySetEvent): void {
  let entity = new KeySet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.key = event.params.key
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  createProtocolConfig(event)
}

const protocolUint256Keys = [
  "update_collateral_interval",
  "update_collateral_threshold",
  "penalty_rate",
  "mint_delay",
  "mint_ttl",
  "mint_ratio",
  "minter_freeze_time",
  "base_minter_rate",
  "max_earner_rate",
]

const protocolAddressKeys = ["minter_rate_model", "earner_rate_model"]

function createProtocolConfig(event: KeySetEvent): void {
  let entity = new ProtocolConfig(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.key = safeDecodeBytes(event.params.key)

  if (protocolUint256Keys.includes(entity.key)) {
    entity.value = decodeUint256(event.params.value).toString()
  } else if (protocolAddressKeys.includes(entity.key)) {
    entity.value = event.params.value.toHexString().slice(26)
  } else {
    entity.value = event.params.value.toHex()
  }

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
