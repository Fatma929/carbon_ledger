// demo/run_full_demo.js

import dotenv from "dotenv";
import { Client } from "@hashgraph/sdk";
import { createEmissionsTopic, submitEmissionsReport } from "../src/hedera_services/hcs_tracker.js";
import { createCarbonOffsetToken, sellCarbonOffsets } from "../src/hedera_services/hts_tokenization.js";

dotenv.config();

async function runDemo() {
    console.log("==========================================");
    console.log("CARBON LEDGER DLT DEMO: HCS & HTS EXECUTION");
    console.log("==========================================\n");

    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY_DER;

    // ✅ نستخدم نفس الحساب كمشتري مؤقت
    const buyerAccountId = process.env.BUYER_ACCOUNT_ID || myAccountId;

    if (!myAccountId || !myPrivateKey) {
        throw new Error("Missing MY_ACCOUNT_ID or MY_PRIVATE_KEY_DER in your .env file.");
    }

    // ✅ الاتصال بـ Hedera Testnet
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);
    console.log(`Connected to Hedera testnet as ${myAccountId}`);

    // ✅ STEP 1: إنشاء موضوع HCS لتتبع الانبعاثات
    const topicId = await createEmissionsTopic();
    const emissionsData = {
        company: "Eco-Tech Industries",
        scope1_tCO2e: 500,
        scope2_tCO2e: 250,
        verification_status: "Verified OK",
        verifier_id: "CertBodyXYZ",
    };

    await submitEmissionsReport(topicId, emissionsData);

    // ✅ STEP 2: إنشاء رمز HTS للفروقات الكربونية
    const tokenId = await createCarbonOffsetToken(client);

    // ✅ STEP 3: بيع الانبعاثات الرمزية (اختبار داخلي)
    const requiredOffsets = emissionsData.scope1_tCO2e + emissionsData.scope2_tCO2e;
    console.log(`\n>>> Emissions Total: ${requiredOffsets} tCO2e. Selling equal amount of vCO2 tokens...`);

    await sellCarbonOffsets(tokenId, requiredOffsets, buyerAccountId, client);

    console.log("\n==========================================");
    console.log("✅ DEMO COMPLETE! All HCS & HTS operations succeeded.");
    console.log("==========================================");
}

runDemo().catch((err) => {
    console.error("FATAL ERROR DURING DEMO:", err);
    process.exit(1);
});
