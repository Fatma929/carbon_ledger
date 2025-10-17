// src/utils.js
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import * as dotenv from 'dotenv';

dotenv.config();

const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);

const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY_DER); 

const client = Client.forTestnet();
client.setOperator(operatorId, operatorKey);

export { client, operatorId, operatorKey };



