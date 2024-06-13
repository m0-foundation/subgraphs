import {Transfer} from "../generated/ERC20/ERC20"
import {Holder, TokenBalance} from "../generated/schema"
import {
  fetchTokenDetails,
  fetchBalance
} from "./utils"
import { BigDecimal} from "@graphprotocol/graph-ts";

export function handleTransfer(event: Transfer): void {
    let token = fetchTokenDetails(event);
    if (!token) { //if token == null
        return
      }

    //get account addresses from event
    let fromAddress = event.params.from.toHex();
    let toAddress = event.params.to.toHex();

    // saves the balance on every transfer event
    // setting tokenbalance by blocknumber/timestamp
    let fromTokenBalance = new TokenBalance(event.block.timestamp.toString() + "-" + fromAddress);
    fromTokenBalance.token = token.id;
    fromTokenBalance.address = fromAddress;
    fromTokenBalance.balance = fetchBalance(event.address,event.params.from) //balance at the time of the transfer event
    fromTokenBalance.blockNumber = event.block.number;
    fromTokenBalance.blockTimestamp = event.block.timestamp;
    if(fromTokenBalance.address != "0x0000000000000000000000000000000000000000"){
      fromTokenBalance.save();
    }

    let toTokenBalance = new TokenBalance(event.block.timestamp.toString() + "-" + toAddress);
    toTokenBalance.token = token.id;
    toTokenBalance.address = toAddress;
    toTokenBalance.balance = fetchBalance(event.address,event.params.to) //balance at the time of the transfer event
    toTokenBalance.blockNumber = event.block.number;
    toTokenBalance.blockTimestamp = event.block.timestamp;
    toTokenBalance.save();



    // update the balance of a holder on every transfer event
    //setting the holder of the 'from' account
    let fromHolder = Holder.load(token.id + "-" + fromAddress);
    if (!fromHolder) { //if balance is not already saved
					//create a new Holder instance
					// while creating the new token balance,
					// the combination of the token address 
					// and the account address is  
					// passed as the identifier value
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
    if(toHolder.balance != BigDecimal.fromString("0")){
      toHolder.save();
    }
}