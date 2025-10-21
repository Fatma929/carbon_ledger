// demo/run_full_demo.js

import { createEmissionsTopic, submitEmissionsReport } from '../src/hedera_services/hcs_tracker.js';
import { createCarbonOffsetToken, sellCarbonOffsets } from '../src/hedera_services/hts_tokenization.js';

async function runDemo() {
    console.log("==========================================");
    console.log("CARBON LEDGER DLT DEMO: HCS & HTS EXECUTION");
    console.log("==========================================\n");

    // STEP 1: HCS - Create Audit Trail Topic
    const topicId = await createEmissionsTopic();

    // STEP 2: HCS - Log Immutable Emissions Data
    const emissionsData = {
        company: "Eco-Tech Industries",
        scope1_tCO2e: 500,
        scope2_tCO2e: 250,
        verification_status: "Verified OK",
        verifier_id: "CertBodyXYZ"
    };
    await submitEmissionsReport(topicId, emissionsData);

    // Calculate total required offsets
    const requiredOffsets = emissionsData.scope1_tCO2e + emissionsData.scope2_tCO2e;

    // STEP 3: HTS - Create Offset Token
    const tokenId = await createCarbonOffsetToken();

    // STEP 4: HTS - sell Offsets (Solve Double Counting)
    console.log(`\n>>> Emissions Total: ${requiredOffsets} tCO2e. Retiring equal amount of vCO2 tokens...`);
    await retireCarbonOffsets(tokenId, requiredOffsets);

    console.log("\n==========================================");
    console.log("DEMO COMPLETE! Hedera DLT utilized for full integrity.");
    console.log("==========================================");
}

runDemo().catch(err => {
    console.error("FATAL ERROR DURING DEMO:", err);
    process.exit(1);
});

