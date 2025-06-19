import { BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import { Token, IndexUpdate, TotalSupplySnapshot, Transfer } from '../generated/schema'
import { IndexUpdated, Transfer as TransferEvent, M } from '../generated/MToken/M'

const TOKEN_ID = 'M-TOKEN-ARBITRUM'
const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')
const CONTRACT_ADDRESS = Address.fromString('0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b')

function createTotalSupplySnapshot(
  token: Token,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  transactionHash: Bytes,
  logIndex: BigInt,
  reason: string
): void {
  const contract = M.bind(CONTRACT_ADDRESS)
  const totalSupplyResult = contract.try_totalSupply()
  
  if (!totalSupplyResult.reverted) {
    let snapshot = new TotalSupplySnapshot(transactionHash.concatI32(logIndex.toI32()))
    
    snapshot.token = token.id
    snapshot.totalSupply = totalSupplyResult.value
    snapshot.blockNumber = blockNumber
    snapshot.blockTimestamp = blockTimestamp
    snapshot.transactionHash = transactionHash
    snapshot.reason = reason
    
    // Update token's totalSupply
    token.totalSupply = totalSupplyResult.value
    token.save()
    
    snapshot.save()
  }
}

export function handleTransfer(event: TransferEvent): void {
  const isMint = event.params.from.equals(ZERO_ADDRESS)
  const isBurn = event.params.to.equals(ZERO_ADDRESS)
  
  let transferType: string
  if (isMint) {
    transferType = 'mint'
  } else if (isBurn) {
    transferType = 'burn'
  } else {
    transferType = 'transfer'
  }

  // Ensure token exists
  let token = Token.load(TOKEN_ID)
  if (token == null) {
    token = new Token(TOKEN_ID)
    const contract = M.bind(event.address)
    
    token.name = contract.try_name().reverted ? 'M' : contract.try_name().value
    token.symbol = contract.try_symbol().reverted ? 'M' : contract.try_symbol().value
    token.decimals = contract.try_decimals().reverted ? 6 : contract.try_decimals().value
    token.totalSupply = contract.try_totalSupply().reverted ? BigInt.fromI32(0) : contract.try_totalSupply().value
    
    token.save()
  }

  // Create Transfer entity for ALL transfers
  let transfer = new Transfer(event.transaction.hash.concatI32(event.logIndex.toI32()))
  transfer.token = token.id
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.value = event.params.value
  transfer.blockNumber = event.block.number
  transfer.blockTimestamp = event.block.timestamp
  transfer.transactionHash = event.transaction.hash
  transfer.transferType = transferType

  transfer.save()

  // Create totalSupply snapshot only for mints and burns
  if (isMint || isBurn) {
    createTotalSupplySnapshot(
      token,
      event.block.number,
      event.block.timestamp,
      event.transaction.hash,
      event.logIndex,
      transferType
    )
  }
}

export function handleIndexUpdated(event: IndexUpdated): void {
  // Ensure token exists
  let token = Token.load(TOKEN_ID)
  if (token == null) {
    token = new Token(TOKEN_ID)
    const contract = M.bind(event.address)
    
    token.name = contract.try_name().reverted ? 'M' : contract.try_name().value
    token.symbol = contract.try_symbol().reverted ? 'M' : contract.try_symbol().value
    token.decimals = contract.try_decimals().reverted ? 6 : contract.try_decimals().value
    token.totalSupply = contract.try_totalSupply().reverted ? BigInt.fromI32(0) : contract.try_totalSupply().value
    
    token.save()
  }

  // Create IndexUpdate entity
  let indexUpdate = new IndexUpdate(event.transaction.hash.concatI32(event.logIndex.toI32()))
  indexUpdate.token = token.id
  indexUpdate.index = event.params.index
  indexUpdate.blockNumber = event.block.number
  indexUpdate.blockTimestamp = event.block.timestamp
  indexUpdate.transactionHash = event.transaction.hash

  indexUpdate.save()

  // Create totalSupply snapshot
  createTotalSupplySnapshot(
    token,
    event.block.number,
    event.block.timestamp,
    event.transaction.hash,
    event.logIndex,
    'index_update'
  )
} 