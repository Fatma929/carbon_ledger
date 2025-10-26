// src/hedera_services/hts_tokenization.js
import {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenId,
    TransferTransaction,
    TokenGrantKycTransaction,
    TokenAssociateTransaction,
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

export async function sellCarbonOffsets(tokenId, amount, buyerAccountId, localClient = client) {
    console.log(`\n-- Selling ${amount} vCO2 Offsets from treasury to ${buyerAccountId}...`);

    if (!tokenId) throw new Error("tokenId is required");
    if (!buyerAccountId) throw new Error("buyerAccountId is required");
    const qty = Math.abs(Number(amount));
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("amount must be a positive number");

    const tokenToTransfer = TokenId.fromString(tokenId);

    // Validate buyer AccountId
    let buyerId;
    try {
        buyerId = AccountId.fromString(buyerAccountId);
    } catch {
        throw new Error("Invalid buyerAccountId format");
    }

    const opAccount = AccountId.fromString(process.env.MY_ACCOUNT_ID);

    // ✅ Step 1: Ensure token is associated with buyer
    console.log(`- Associating token ${tokenId} with buyer account ${buyerAccountId}...`);
    try {
        const associateTx = await new TokenAssociateTransaction()
            .setAccountId(buyerId)
            .setTokenIds([tokenToTransfer])
            .freezeWith(localClient)
            .sign(operatorKey);

        const associateSubmit = await associateTx.execute(localClient);
        const associateReceipt = await associateSubmit.getReceipt(localClient);
        console.log(`- Association status: ${associateReceipt.status.toString()}`);
    } catch (err) {
        if (err.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")) {
            console.log("- Token already associated with buyer, skipping.");
        } else {
            throw err;
        }
    }

    // ✅ Step 2: Grant KYC to buyer
    console.log(`- Granting KYC permission for ${buyerAccountId} on token ${tokenId}...`);
    const grantKycTx = await new TokenGrantKycTransaction()
        .setAccountId(buyerId)
        .setTokenId(tokenToTransfer)
        .freezeWith(localClient)
        .sign(operatorKey);

    const grantResponse = await grantKycTx.execute(localClient);
    const grantReceipt = await grantResponse.getReceipt(localClient);
    console.log(`- KYC grant status: ${grantReceipt.status.toString()}`);

    // ✅ Step 3: Check treasury balance
    const balance = await new AccountBalanceQuery().setAccountId(opAccount).execute(localClient);
    const tokenKey = tokenToTransfer.toString();
    const available = balance.tokens.get(tokenKey) ? Number(balance.tokens.get(tokenKey)) : 0;

    if (available < qty) {
        throw new Error(
            `Insufficient treasury balance for token ${tokenKey}. Available: ${available}, requested: ${qty}`
        );
    }

    console.log(`- Treasury balance OK. Available ${available}, transferring ${qty}...`);

    // ✅ Step 4: Transfer tokens
    const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenToTransfer, opAccount, -qty)
        .addTokenTransfer(tokenToTransfer, buyerId, qty)
        .freezeWith(localClient)
        .sign(operatorKey);

    const signed = await transferTx.sign(operatorKey);
    const submitTx = await signed.execute(localClient);
    const receipt = await submitTx.getReceipt(localClient);
    console.log(`- Token transfer completed. Status: ${receipt.status.toString()}`);

    // ✅ Step 5: Check updated treasury balance
    const balanceAfter = await new AccountBalanceQuery().setAccountId(opAccount).execute(localClient);
    const availableAfter = balanceAfter.tokens.get(tokenKey)
        ? Number(balanceAfter.tokens.get(tokenKey))
        : 0;

    return { status: receipt.status.toString(), treasuryBalance: availableAfter };
}
