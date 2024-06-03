import {
  AddressAddedToList as AddressAddedToListEvent,
  AddressRemovedFromList as AddressRemovedFromListEvent,
  KeySet as KeySetEvent,
} from "../generated/Registrar/Registrar"
import {
  AddressAddedToList,
  AddressRemovedFromList,
  KeySet,
} from "../generated/schema"

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
}
