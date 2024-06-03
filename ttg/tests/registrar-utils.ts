import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  AddressAddedToList,
  AddressRemovedFromList,
  KeySet
} from "../generated/Registrar/Registrar"

export function createAddressAddedToListEvent(
  list: Bytes,
  account: Address
): AddressAddedToList {
  let addressAddedToListEvent = changetype<AddressAddedToList>(newMockEvent())

  addressAddedToListEvent.parameters = new Array()

  addressAddedToListEvent.parameters.push(
    new ethereum.EventParam("list", ethereum.Value.fromFixedBytes(list))
  )
  addressAddedToListEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return addressAddedToListEvent
}

export function createAddressRemovedFromListEvent(
  list: Bytes,
  account: Address
): AddressRemovedFromList {
  let addressRemovedFromListEvent = changetype<AddressRemovedFromList>(
    newMockEvent()
  )

  addressRemovedFromListEvent.parameters = new Array()

  addressRemovedFromListEvent.parameters.push(
    new ethereum.EventParam("list", ethereum.Value.fromFixedBytes(list))
  )
  addressRemovedFromListEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return addressRemovedFromListEvent
}

export function createKeySetEvent(key: Bytes, value: Bytes): KeySet {
  let keySetEvent = changetype<KeySet>(newMockEvent())

  keySetEvent.parameters = new Array()

  keySetEvent.parameters.push(
    new ethereum.EventParam("key", ethereum.Value.fromFixedBytes(key))
  )
  keySetEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromFixedBytes(value))
  )

  return keySetEvent
}
