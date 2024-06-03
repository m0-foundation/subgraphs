import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { BurnExecuted } from "../generated/schema"
import { BurnExecuted as BurnExecutedEvent } from "../generated/MinterGateway/MinterGateway"
import { handleBurnExecuted } from "../src/minter-gateway"
import { createBurnExecutedEvent } from "./minter-gateway-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let minter = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let payer = Address.fromString("0x0000000000000000000000000000000000000001")
    let newBurnExecutedEvent = createBurnExecutedEvent(minter, amount, payer)
    handleBurnExecuted(newBurnExecutedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BurnExecuted created and stored", () => {
    assert.entityCount("BurnExecuted", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BurnExecuted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "minter",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BurnExecuted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "BurnExecuted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "payer",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
