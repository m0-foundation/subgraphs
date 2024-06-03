import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, Address } from "@graphprotocol/graph-ts"
import { AddressAddedToList } from "../generated/schema"
import { AddressAddedToList as AddressAddedToListEvent } from "../generated/Registrar/Registrar"
import { handleAddressAddedToList } from "../src/registrar"
import { createAddressAddedToListEvent } from "./registrar-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let list = Bytes.fromI32(1234567890)
    let account = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newAddressAddedToListEvent = createAddressAddedToListEvent(
      list,
      account
    )
    handleAddressAddedToList(newAddressAddedToListEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AddressAddedToList created and stored", () => {
    assert.entityCount("AddressAddedToList", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AddressAddedToList",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "list",
      "1234567890"
    )
    assert.fieldEquals(
      "AddressAddedToList",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "account",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
