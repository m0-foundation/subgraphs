import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index"
import { Address, BigInt, ethereum, Bytes } from "@graphprotocol/graph-ts"
import { handleBlock, handleTransfer } from "../src/superstate"
import { createTransferEvent } from "./superstate-utils"
import { MINTERS } from "../src/utils"

describe("Describe entity assertions", () => {
  beforeAll(() => {
    const from = Address.fromString("0x0000000000000000000000000000000000000001");
    const to = Address.fromString(MINTERS[0]);
    const amount = BigInt.fromI32(100);
    const newTransferEvent = createTransferEvent(from, to, amount);
    handleTransfer(newTransferEvent);
  });

  afterAll(() => {
    clearStore()
  });

  test("Holder balance updated after transfer", () => {
    assert.entityCount("Holder", 2);
    const to = Address.fromString(MINTERS[0]);
    assert.fieldEquals("Holder", to.toHexString(), "balance", "100");
    assert.entityCount("BalanceSnapshot", 2);
  });

  test("Balance snapshot created after block", () => {
    const timestamp = BigInt.fromI32(3601);
    // Mock a block
    const block = new ethereum.Block(
      Bytes.fromHexString("0x01"),
      Bytes.fromHexString("0x01"),
      Bytes.fromHexString("0x01"),
      Address.fromString("0x0000000000000000000000000000000000000001"),
      Bytes.fromHexString("0x01"),
      Bytes.fromHexString("0x01"),
      Bytes.fromHexString("0x01"),
      timestamp,
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1)
    );

    handleBlock(block);
    assert.entityCount("BalanceSnapshot", 2 + MINTERS.length);
  });
});
