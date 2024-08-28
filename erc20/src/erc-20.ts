import { BigDecimal, store } from "@graphprotocol/graph-ts";
import {
  Approval as ApprovalEvent,
  Transfer as TransferEvent,
  ERC20
} from "../generated/MTokenERC20/ERC20"
import {
  Holder, 
  TokenBalance, 
  TokenTotalSupply, 
  TokenTransfer, 
  TokenApproval
} from "../generated/schema"
import {
  fetchTokenDetails,
  fetchBalance,
  getFromAddress,
  getToAddress,
  zeroAddress,
} from "./utils"

export function handleApproval(event: ApprovalEvent): void {
  let token = fetchTokenDetails(event);
  if (!token) { //if token == null
    return
  }
  let entity = new TokenApproval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = token.id;
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let token = fetchTokenDetails(event);
  if (!token) { //if token == null
    return
  }
  let entity = new TokenTransfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = token.id;
  entity.from = event.params.sender
  entity.to = event.params.recipient
  entity.value = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // saves the balance on every transfer event
  handleTokenBalance(event);

  // update the balance of a holder on every transfer event
  handleHolderBalance(event);

  // saves the total supply on every transfer event
  handleTotalSupply(event);
}

function handleTokenBalance(event: TransferEvent): void {
  let fromAddress = getFromAddress(event)
  let toAddress = getToAddress(event)
  let token = fetchTokenDetails(event);
  if (!token) { //if token == null
      return
  }
  // setting tokenbalance by blocknumber/timestamp
  let fromTokenBalance = new TokenBalance(event.block.timestamp.toString() + "-" + fromAddress);
  fromTokenBalance.token = token.id;
  fromTokenBalance.address = fromAddress;
  fromTokenBalance.balance = fetchBalance(event.address,event.params.sender) //balance at the time of the transfer event
  fromTokenBalance.blockNumber = event.block.number;
  fromTokenBalance.blockTimestamp = event.block.timestamp;
  if(fromTokenBalance.address != zeroAddress.toString()){
    fromTokenBalance.save();
  }

  let toTokenBalance = new TokenBalance(event.block.timestamp.toString() + "-" + toAddress);
  toTokenBalance.token = token.id;
  toTokenBalance.address = toAddress;
  toTokenBalance.balance = fetchBalance(event.address,event.params.recipient) //balance at the time of the transfer event
  toTokenBalance.blockNumber = event.block.number;
  toTokenBalance.blockTimestamp = event.block.timestamp;
  toTokenBalance.save();
}

function handleHolderBalance(event: TransferEvent): void {
  let token = fetchTokenDetails(event);
  if (!token) { //if token == null
      return
  }

  //get account addresses from event
  let fromAddress = getFromAddress(event)
  let toAddress = getToAddress(event)

  //setting the holder of the 'from' account
  let fromHolder = Holder.load(token.id + "-" + fromAddress);
  if (!fromHolder) { //if balance is not already saved
        fromHolder = new Holder(token.id + "-" + fromAddress);
        fromHolder.token = token.id;
        fromHolder.address = fromAddress;
  }

  fromHolder.balance = fetchBalance(event.address,event.params.from)
  //filtering out zero-balance tokens - optional
  if(fromHolder.balance != BigDecimal.fromString("0")){
    fromHolder.save();
  }
  
  //setting the token balance of the 'to' account
  let toHolder = Holder.load(token.id + "-" + toAddress);
  if (!toHolder) {
      toHolder = new Holder(token.id + "-" + toAddress);
      toHolder.token = token.id;
      toHolder.address = toAddress;
    }
  toHolder.balance = fetchBalance(event.address,event.params.to)
   //filtering out zero-balance tokens - optional
  if(toHolder.balance != BigDecimal.fromString("0")){
    toHolder.save();
  }
}

function handleTotalSupply(event: TransferEvent): void {
  // supply is updated only when the transfer is mint or burn
  if (event.params.from.equals(zeroAddress) || event.params.to.equals(zeroAddress)) {
    let totalSupply = new TokenTotalSupply(event.transaction.hash.concatI32(event.logIndex.toI32()))

    let token = fetchTokenDetails(event);
    if (!token) { //if token == null
        return
    }

    let contract = ERC20.bind(event.address)
    let totalSupplyResult = contract.try_totalSupply()
    if (!totalSupplyResult.reverted) {
      totalSupply.value = totalSupplyResult.value
      totalSupply.blockNumber = event.block.number
      totalSupply.blockTimestamp = event.block.timestamp
      totalSupply.token = token.id
      totalSupply.save()
    }
  }
}