import { Address, BigInt, Timestamp } from '@graphprotocol/graph-ts';
import { LatestIndexSnapshot, LatestUpdateTimestampSnapshot, MToken } from '../generated/schema';
import { IndexUpdated as IndexUpdatedEvent } from '../generated/MToken/MToken';

const M_TOKEN_ADDRESS = '0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b';

/* ============ Handlers ============ */

export function handleIndexUpdated(event: IndexUpdatedEvent): void {
  const mToken = getMToken();
  const timestamp = event.block.timestamp.toI32();

  _updateIndex(mToken, timestamp, event.params.index);

  mToken.lastUpdate = timestamp;
  mToken.save();
}

/* ============ Entity Helpers ============ */

function getMToken(): MToken {
  const id = `mToken-${M_TOKEN_ADDRESS}`;

  let mToken = MToken.load(id);

  if (mToken) return mToken;

  mToken = new MToken(id);

  mToken.latestIndex = BigInt.fromI32(0);
  mToken.latestUpdateTimestamp = 0;
  mToken.lastUpdate = 0;

  return mToken;
}

function updateLatestIndexSnapshot(timestamp: Timestamp, value: BigInt): void {
  const id = `latestIndex-${timestamp.toString()}`;

  let snapshot = LatestIndexSnapshot.load(id);

  if (!snapshot) {
    snapshot = new LatestIndexSnapshot(id);

    snapshot.timestamp = timestamp;
  }

  snapshot.value = value;

  snapshot.save();
}

function updateLatestUpdateTimestampSnapshot(timestamp: Timestamp, value: Timestamp): void {
  const id = `latestUpdateTimestamp-${timestamp.toString()}`;

  let snapshot = LatestUpdateTimestampSnapshot.load(id);

  if (!snapshot) {
    snapshot = new LatestUpdateTimestampSnapshot(id);

    snapshot.timestamp = timestamp;
  }

  snapshot.value = value;

  snapshot.save();
}

/* ============ Contract Stateful Tracking ============ */

function _updateIndex(mToken: MToken, timestamp: Timestamp, index: BigInt): void {
  mToken.latestIndex = index;
  mToken.latestUpdateTimestamp = timestamp;

  updateLatestIndexSnapshot(timestamp, mToken.latestIndex);
  updateLatestUpdateTimestampSnapshot(timestamp, mToken.latestUpdateTimestamp);
}
