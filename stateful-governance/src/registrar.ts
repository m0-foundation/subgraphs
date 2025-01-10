import { Timestamp } from '@graphprotocol/graph-ts';
import {
    ValueSnapshot,
    KeyValuePair,
    IncludedAddressSnapshot,
    IncludedAddress,
    AddressList,
} from '../generated/schema';
import {
    AddressAddedToList as AddressAddedToListEvent,
    AddressRemovedFromList as AddressRemovedFromListEvent,
    KeySet as KeySetEvent,
} from '../generated/Registrar/Registrar';

/* ============ Handlers ============ */

export function handleKeySet(event: KeySetEvent): void {
    const key = event.params.key.toHexString();
    const value = event.params.value.toHexString();
    const timestamp = event.block.timestamp.toI32();

    const keyValuePair = getKeyValuePair(key);

    keyValuePair.value = value;
    keyValuePair.lastUpdate = timestamp;

    keyValuePair.save();

    updateKeyValueSnapshot(keyValuePair, timestamp);
}

export function handleAddressAddedToList(event: AddressAddedToListEvent): void {
    const listName = event.params.list.toString();
    const address = event.params.account.toHexString();
    const timestamp = event.block.timestamp.toI32();

    const list = getAddressList(listName);

    list.lastUpdate = timestamp;

    list.save();

    const includedAddress = getIncludedAddress(listName, address);

    includedAddress.included = true;
    includedAddress.lastUpdate = timestamp;

    includedAddress.save();

    updateIncludedAddressSnapshot(includedAddress, timestamp);
}

export function handleAddressRemovedFromList(event: AddressRemovedFromListEvent): void {
    const listName = event.params.list.toString();
    const address = event.params.account.toHexString();
    const timestamp = event.block.timestamp.toI32();

    const list = getAddressList(listName);

    list.lastUpdate = timestamp;

    list.save();

    const includedAddress = getIncludedAddress(listName, address);

    includedAddress.included = false;
    includedAddress.lastUpdate = timestamp;

    includedAddress.save();

    updateIncludedAddressSnapshot(includedAddress, timestamp);
}

/* ============ Entity Getters ============ */

function getKeyValuePair(key: string): KeyValuePair {
    const id = `keyValuePair-${key}`;

    let keyValuePair = KeyValuePair.load(id);

    if (keyValuePair) return keyValuePair;

    keyValuePair = new KeyValuePair(id);

    keyValuePair.key = key;
    keyValuePair.value = '';
    keyValuePair.lastUpdate = 0;

    return keyValuePair;
}

function getAddressList(name: string): AddressList {
    const id = `addressList-${name}`;

    let list = AddressList.load(id);

    if (list) return list;

    list = new AddressList(id);

    list.name = name;

    return list;
}

function getIncludedAddress(listName: string, address: string): IncludedAddress {
    const id = `includedAddress-${listName}-${address}`;

    let includedAddress = IncludedAddress.load(id);

    if (includedAddress) return includedAddress;

    includedAddress = new IncludedAddress(id);

    includedAddress.address = address;
    includedAddress.list = listName;
    includedAddress.included = false;

    return includedAddress;
}

/* ============ Snapshot Updaters ============ */

function updateKeyValueSnapshot(keyValuePair: KeyValuePair, timestamp: Timestamp): void {
    const id = `keyValuePair-${keyValuePair.key}-${timestamp.toString()}`;

    let snapshot = ValueSnapshot.load(id);

    if (!snapshot) {
        snapshot = new ValueSnapshot(id);

        snapshot.keyValuePair = keyValuePair.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = keyValuePair.value;

    snapshot.save();
}

function updateIncludedAddressSnapshot(includedAddress: IncludedAddress, timestamp: Timestamp): void {
    const id = `includedAddress-${includedAddress.list}-${includedAddress.address}-${timestamp.toString()}`;

    let snapshot = IncludedAddressSnapshot.load(id);

    if (!snapshot) {
        snapshot = new IncludedAddressSnapshot(id);

        snapshot.includedAddress = includedAddress.id;
        snapshot.timestamp = timestamp;
    }

    snapshot.value = includedAddress.included;

    snapshot.save();
}
