/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  MToken,
  MToken_Approval,
  MToken_AuthorizationCanceled,
  MToken_AuthorizationUsed,
  MToken_EIP712DomainChanged,
  MToken_IndexUpdated,
  MToken_Initialized,
  MToken_Migrated,
  MToken_StartedEarning,
  MToken_StoppedEarning,
  MToken_Transfer,
  MToken_Upgraded,
} from "generated";

MToken.Approval.handler(async ({ event, context }) => {
  const entity: MToken_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    spender: event.params.spender,
    amount: event.params.amount,
  };

  context.MToken_Approval.set(entity);
});

MToken.AuthorizationCanceled.handler(async ({ event, context }) => {
  const entity: MToken_AuthorizationCanceled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    authorizer: event.params.authorizer,
    nonce: event.params.nonce,
  };

  context.MToken_AuthorizationCanceled.set(entity);
});

MToken.AuthorizationUsed.handler(async ({ event, context }) => {
  const entity: MToken_AuthorizationUsed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    authorizer: event.params.authorizer,
    nonce: event.params.nonce,
  };

  context.MToken_AuthorizationUsed.set(entity);
});

MToken.EIP712DomainChanged.handler(async ({ event, context }) => {
  const entity: MToken_EIP712DomainChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.MToken_EIP712DomainChanged.set(entity);
});

MToken.IndexUpdated.handler(async ({ event, context }) => {
  const entity: MToken_IndexUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    index: event.params.index,
  };

  context.MToken_IndexUpdated.set(entity);
});

MToken.Initialized.handler(async ({ event, context }) => {
  const entity: MToken_Initialized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    version: event.params.version,
  };

  context.MToken_Initialized.set(entity);
});

MToken.Migrated.handler(async ({ event, context }) => {
  const entity: MToken_Migrated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    migrator: event.params.migrator,
    oldImplementation: event.params.oldImplementation,
    newImplementation: event.params.newImplementation,
  };

  context.MToken_Migrated.set(entity);
});

MToken.StartedEarning.handler(async ({ event, context }) => {
  const entity: MToken_StartedEarning = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
  };

  context.MToken_StartedEarning.set(entity);
});

MToken.StoppedEarning.handler(async ({ event, context }) => {
  const entity: MToken_StoppedEarning = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
  };

  context.MToken_StoppedEarning.set(entity);
});

MToken.Transfer.handler(async ({ event, context }) => {
  const entity: MToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    recipient: event.params.recipient,
    amount: event.params.amount,
  };

  context.MToken_Transfer.set(entity);
});

MToken.Upgraded.handler(async ({ event, context }) => {
  const entity: MToken_Upgraded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    implementation: event.params.implementation,
  };

  context.MToken_Upgraded.set(entity);
});
