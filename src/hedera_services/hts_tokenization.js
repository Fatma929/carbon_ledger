// src/hedera_services/hts_tokenization.js
import {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenId,
    TransferTransaction,
    AccountId,
    AccountBalanceQuery
} from "@hashgraph/sdk";
import { client, operatorId, operatorKey } from "./src_utils.js"; 

export async function createCarbonOffsetToken() {
    console.log(`\n-- Creating HTS Fungible Carbon Offset Token...`);

    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("Verified Carbon Offset")
        .setTokenSymbol("vCO2")
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Finite)
    .setInitialSupply(1000000)
        .setMaxSupply(1000000000)
        .setDecimals(0)
        .setTreasuryAccountId(operatorId)
        .setSupplyKey(operatorKey)
        .setAdminKey(operatorKey)
        .setFreezeKey(operatorKey)
        .setWipeKey(operatorKey)
        .setKycKey(operatorKey)
        .freezeWith(client);

    const tokenCreateSign = await tokenCreateTx.sign(operatorKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId;

    console.log(`- New Token ID (vCO2): ${tokenId.toString()}`);

    return tokenId.toString(); 
}

// New signature: accept client as argument for flexibility
export async function sellCarbonOffsets(tokenId, amount, buyerAccountId, localClient = client) {
    console.log(`\n-- Selling ${amount} vCO2 Offsets from treasury to ${buyerAccountId}...`);

    if (!tokenId) throw new Error('tokenId is required');
    if (!buyerAccountId) throw new Error('buyerAccountId is required');
    const qty = Math.abs(Number(amount));
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('amount must be a positive number');

    const tokenToTransfer = TokenId.fromString(tokenId);

    // Validate buyer AccountId
    let buyerId;
    try {
        buyerId = AccountId.fromString(buyerAccountId);
    } catch (err) {
        throw new Error('Invalid buyerAccountId format');
    }

    // Determine operator account id from env (explicit) and check balance
    const opAccount = AccountId.fromString(process.env.MY_ACCOUNT_ID);
    const balance = await new AccountBalanceQuery().setAccountId(opAccount).execute(localClient);
    const tokenKey = tokenToTransfer.toString();
    let available = 0;
    try {
        if (balance.tokens instanceof Map) {
            available = Number(balance.tokens.get(tokenKey) || 0);
        } else if (balance.tokens && typeof balance.tokens._map !== 'undefined') {
            available = Number(balance.tokens._map.get(tokenKey) || 0);
        } else {
            available = Number(balance.tokens[tokenKey] || 0);
        }
    } catch (err) {
        available = 0;
    }

    if (available < qty) {
        throw new Error(`Insufficient treasury balance for token ${tokenKey}. Available: ${available}, requested: ${qty}`);
    }

    console.log(`- Treasury balance OK. Available ${available}, transferring ${qty}...`);

    const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenToTransfer, opAccount, -qty)
        .addTokenTransfer(tokenToTransfer, buyerId, qty)
        .freezeWith(localClient);

    const signed = await transferTx.sign(operatorKey);
    const submitTx = await signed.execute(localClient);
    const receipt = await submitTx.getReceipt(localClient);

    console.log(`- Token transfer completed. Status: ${receipt.status.toString()}`);

    // Query treasury balance again to return updated amount
    const balanceAfter = await new AccountBalanceQuery().setAccountId(opAccount).execute(localClient);
    let availableAfter = 0;
    try {
        if (balanceAfter.tokens instanceof Map) {
            availableAfter = Number(balanceAfter.tokens.get(tokenKey) || 0);
        } else if (balanceAfter.tokens && typeof balanceAfter.tokens._map !== 'undefined') {
            availableAfter = Number(balanceAfter.tokens._map.get(tokenKey) || 0);
        } else {
            availableAfter = Number(balanceAfter.tokens[tokenKey] || 0);
        }
    } catch (err) {
        availableAfter = 0;
    }

    return { status: receipt.status.toString(), treasuryBalance: availableAfter };
}

