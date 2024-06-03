import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Claim } from "../generated/schema"
import { Claim as ClaimEvent } from "../generated/DistributionVault/DistributionVault"
import { handleClaim } from "../src/distribution-vault"
import { createClaimEvent } from "./distribution-vault-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let token = Address.fromString("0x0000000000000000000000000000000000000001")
    let account = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let startEpoch = BigInt.fromI32(234)
    let endEpoch = BigInt.fromI32(234)
    let amount = BigInt.fromI32(234)
    let newClaimEvent = createClaimEvent(
      token,
      account,
      startEpoch,
      endEpoch,
      amount
    )
    handleClaim(newClaimEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Claim created and stored", () => {
    assert.entityCount("Claim", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Claim",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "token",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Claim",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "account",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Claim",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "startEpoch",
      "234"
    )
    assert.fieldEquals(
      "Claim",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "endEpoch",
      "234"
    )
    assert.fieldEquals(
      "Claim",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
