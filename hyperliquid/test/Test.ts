import assert from "assert";
import { 
  TestHelpers,
  MToken_Approval
} from "generated";
const { MockDb, MToken } = TestHelpers;

describe("MToken contract Approval event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for MToken contract Approval event
  const event = MToken.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("MToken_Approval is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await MToken.Approval.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualMTokenApproval = mockDbUpdated.entities.MToken_Approval.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedMTokenApproval: MToken_Approval = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      account: event.params.account,
      spender: event.params.spender,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualMTokenApproval, expectedMTokenApproval, "Actual MTokenApproval should be the same as the expectedMTokenApproval");
  });
});
