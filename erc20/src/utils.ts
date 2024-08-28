//import smart contract class from generated files
import { ERC20, Transfer } from "../generated/MTokenERC20/ERC20";
//import entities
import {  Token } from "../generated/schema";
//import datatypes
import { BigDecimal, ethereum, Address } from "@graphprotocol/graph-ts";
//fetch token details
export function fetchTokenDetails(event: ethereum.Event): Token | null {
  //check if token details are already saved
  let token = Token.load(event.address.toHex());
  if (!token) {
    //if token details are not available
    //create a new token
    token = new Token(event.address.toHex());

    //set some default values
    token.name = "N/A";
    token.symbol = "N/A";
    token.decimals = BigDecimal.fromString("0");

    //bind the contract
    let erc20 = ERC20.bind(event.address);

    //fetch name
    let tokenName = erc20.try_name();
    if (!tokenName.reverted) {
      token.name = tokenName.value;
    }

    //fetch symbol
    let tokenSymbol = erc20.try_symbol();
    if (!tokenSymbol.reverted) {
      token.symbol = tokenSymbol.value;
    }

    //fetch decimals
    let tokenDecimal = erc20.try_decimals();
    if (!tokenDecimal.reverted) {
      token.decimals = BigDecimal.fromString(tokenDecimal.value.toString());
    }

    //save the details
    token.save();
  }
  return token;
}


//fetch the current balance of a particular token
//in the given account
export function fetchBalance(
  tokenAddress: Address,
  accountAddress: Address
): BigDecimal {
  let erc20 = ERC20.bind(tokenAddress); //bind token
  //set default value
  let amount = BigDecimal.fromString("0");
  //get balance
  let tokenBalance = erc20.try_balanceOf(accountAddress);
  if (!tokenBalance.reverted) {
    amount = tokenBalance.value.toBigDecimal();
  }
  return amount;
}


export function getFromAddress(event: Transfer): string {
  return event.params.sender.toHex();
}
export function getToAddress(event: Transfer): string {
  return event.params.recipient.toHex();
}

export let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")