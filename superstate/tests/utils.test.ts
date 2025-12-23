import { BigInt } from "@graphprotocol/graph-ts";
import { assert, describe, test } from "matchstick-as";
import { dayBucket, hourBucket, toMicroseconds } from "../src/utils";

describe("Utils", () => {
  describe("dayBucket", () => {
    test("should return the start of the day for a given timestamp", () => {
      const timestamp = BigInt.fromI32(1698412800); // 2023-10-27 12:00:00
      const startOfDay = dayBucket(timestamp);
      assert.stringEquals(startOfDay.toString(), "1698364800"); // 2023-10-27 00:00:00
    });
  });

  describe("hourBucket", () => {
    test("should return the closest of three daily snapshot times", () => {
      // 03:59:59 -> 00:00
      const timestamp1 = BigInt.fromI32(1698379199);
      const snapshot1 = hourBucket(timestamp1);
      assert.stringEquals(snapshot1.toString(), "1698364800");

      // 04:00:00 -> 08:00
      const timestamp2 = BigInt.fromI32(1698379200);
      const snapshot2 = hourBucket(timestamp2);
      assert.stringEquals(snapshot2.toString(), "1698393600");

      // 11:59:59 -> 08:00
      const timestamp3 = BigInt.fromI32(1698407999);
      const snapshot3 = hourBucket(timestamp3);
      assert.stringEquals(snapshot3.toString(), "1698393600");

      // 12:00:00 -> 16:00
      const timestamp4 = BigInt.fromI32(1698408000);
      const snapshot4 = hourBucket(timestamp4);
      assert.stringEquals(snapshot4.toString(), "1698422400");
    });
  });

  describe("toMicroseconds", () => {
    test("should convert seconds to microseconds", () => {
      const timestamp = BigInt.fromI32(1698412800);
      const microseconds = toMicroseconds(timestamp);
      assert.stringEquals(microseconds.toString(), "1698412800000000");
    });
  });
});