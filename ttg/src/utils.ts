import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { PowerToken } from "../generated/PowerToken/PowerToken"
import { ZeroToken } from "../generated/ZeroToken/ZeroToken"


interface Token {
    balanceOf(account_: Address): BigInt;
    try_balanceOf(account_: Address): ethereum.CallResult<BigInt>;
}

export function powerToken_balanceOf(tokenAddress: Address,accountAddress: Address): BigInt {
    let token = PowerToken.bind(tokenAddress); //bind token
    return balanceOf<PowerToken>(token, accountAddress);
}

export function zeroToken_balanceOf(tokenAddress: Address,accountAddress: Address): BigInt {
    let token = ZeroToken.bind(tokenAddress); //bind token
    return balanceOf<ZeroToken>(token, accountAddress);
}

export function balanceOf<T extends Token>(token: T, accountAddress: Address): BigInt {
    return token.balanceOf(accountAddress);
}