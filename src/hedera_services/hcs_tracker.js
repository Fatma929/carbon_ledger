// src/hedera_services/hcs_tracker.js

import {
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicId
} from "@hashgraph/sdk";
import { client, operatorKey } from "./src_utils.js";

/**
 * Create a new Hedera Consensus Service topic
 * for immutable emissions reporting.
 */
export async function createEmissionsTopic() {
    console.log("\n-- Creating HCS Topic for Emissions Audit Trail...");

    const transaction = new TopicCreateTransaction()
        .setAdminKey(operatorKey)
        .setSubmitKey(operatorKey)
        .setTopicMemo("Carbon Ledger Emissions Report Topic");

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`- New HCS Topic ID: ${topicId.toString()}`);

    // Return as string for compatibility
    return topicId.toString();
}

/**
 * Submit verified emissions data as an immutable message to the HCS topic.
 */
export async function submitEmissionsReport(topicId, reportData) {
    // Ensure valid TopicId instance
    const topic = TopicId.fromString(topicId);

    const reportJSON = JSON.stringify(reportData);
    console.log(`-- Submitting Emissions Report to Topic ${topic.toString()}...`);

    const submitMessage = new TopicMessageSubmitTransaction()
        .setTopicId(topic)
        .setMessage(reportJSON);

    const txResponse = await submitMessage.execute(client);
    const record = await txResponse.getRecord(client);
    const consensusTimestamp = record.consensusTimestamp.toString();

    console.log("- Message submitted successfully!");
    console.log(`- Consensus Timestamp (Immutable Proof): ${consensusTimestamp}`);

    return consensusTimestamp;
}
