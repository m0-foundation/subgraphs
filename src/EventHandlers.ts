/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  MToken,
  MToken_IndexUpdated,
  MToken_StartedEarning,
  MToken_StoppedEarning,
  MToken_Transfer,
  USDHL,
  USDHL_YieldClaimed,
} from "generated";

MToken.IndexUpdated.handler(async ({ event, context }) => {
  const entity: MToken_IndexUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    index: event.params.index,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };

  context.MToken_IndexUpdated.set(entity);
});

MToken.StartedEarning.handler(async ({ event, context }) => {
  const entity: MToken_StartedEarning = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };

  context.MToken_StartedEarning.set(entity);
});

MToken.StoppedEarning.handler(async ({ event, context }) => {
  const entity: MToken_StoppedEarning = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };

  context.MToken_StoppedEarning.set(entity);
});

MToken.Transfer.handler(async ({ event, context }) => {
  const entity: MToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    recipient: event.params.recipient,
    amount: event.params.amount,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };

  context.MToken_Transfer.set(entity);
});

USDHL.YieldClaimed.handler(async ({ event, context }) => {
  const entity: USDHL_YieldClaimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    amount: event.params.yield,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };

  context.USDHL_YieldClaimed.set(entity);
});
