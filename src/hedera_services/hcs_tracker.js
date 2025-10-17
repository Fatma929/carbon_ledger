// src/hedera_services/hcs_tracker.js
import { TopicCreateTransaction, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { client, operatorKey } from './src_utils.js';
export async function createEmissionsTopic() {
    console.log(`\n-- Creating HCS Topic for Emissions Audit Trail...`);

    const transaction = new TopicCreateTransaction()
        .setAdminKey(operatorKey) 
        .setSubmitKey(operatorKey) 
        .setTopicMemo("Carbon Ledger Emissions Report Topic");

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`- New HCS Topic ID: ${topicId.toString()}`);
    return topicId;
}

export async function submitEmissionsReport(topicId, reportData) {
    const reportJSON = JSON.stringify(reportData);
    console.log(`-- Submitting Emissions Report to Topic ${topicId.toString()}...`);
    
    const submitMessage = new TopicMessageSubmitTransaction({
        topicId: topicId,
        message: reportJSON,
    });

    const txResponse = await submitMessage.execute(client);
    const record = await txResponse.getRecord(client); 
    const consensusTimestamp = record.consensusTimestamp.toString();

    console.log(`- Message submitted successfully!`);
    console.log(`- Consensus Timestamp (Immutable Proof): ${consensusTimestamp}`);
    return consensusTimestamp;
}