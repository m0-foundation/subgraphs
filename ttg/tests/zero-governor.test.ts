import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { AllowedCashTokensSet } from "../generated/schema"
import { AllowedCashTokensSet as AllowedCashTokensSetEvent } from "../generated/ZeroGovernor/ZeroGovernor"
import { handleAllowedCashTokensSet } from "../src/zero-governor"
import { createAllowedCashTokensSetEvent } from "./zero-governor-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let allowedCashTokens = [
      Address.fromString("0x0000000000000000000000000000000000000001")
    ]
    let newAllowedCashTokensSetEvent =
      createAllowedCashTokensSetEvent(allowedCashTokens)
    handleAllowedCashTokensSet(newAllowedCashTokensSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AllowedCashTokensSet created and stored", () => {
    assert.entityCount("AllowedCashTokensSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AllowedCashTokensSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "allowedCashTokens",
      "[0x0000000000000000000000000000000000000001]"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
