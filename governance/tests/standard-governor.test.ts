import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { CashTokenSet } from "../generated/schema"
import { CashTokenSet as CashTokenSetEvent } from "../generated/StandardGovernor/StandardGovernor"
import { handleCashTokenSet } from "../src/standard-governor"
import { createCashTokenSetEvent } from "./standard-governor-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let cashToken = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newCashTokenSetEvent = createCashTokenSetEvent(cashToken)
    handleCashTokenSet(newCashTokenSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CashTokenSet created and stored", () => {
    assert.entityCount("CashTokenSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CashTokenSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "cashToken",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
