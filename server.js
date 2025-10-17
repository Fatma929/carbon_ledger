// server.js
// Simple Express server to run the demo script and stream logs via Server-Sent Events (SSE)

import express from 'express';
import cors from 'cors';
import { Client } from '@hashgraph/sdk';
import dotenv from 'dotenv';
// Load environment early
dotenv.config();
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createEmissionsTopic, submitEmissionsReport } from './src/hedera_services/hcs_tracker.js';
import { createCarbonOffsetToken, sellCarbonOffsets } from './src/hedera_services/hts_tokenization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to mask secret values in logs
function maskValue(v) {
  if (!v || typeof v !== 'string') return v;
  if (v.length <= 8) return '****';
  return `${v.slice(0,6)}...${v.slice(-4)}`;
}

function maskEnvSecrets(s) {
  if (!s || typeof s !== 'string') return s;
  const keys = ['MY_PRIVATE_KEY_DER', 'MY_PRIVATE_KEY_HEX', 'MY_PRIVATE_KEY', 'MY_ACCOUNT_ID'];
  for (const k of keys) {
    const v = process.env[k];
    if (v) s = s.split(v).join(maskValue(v));
  }
  return s;
}

// Configure Hedera client for server-side operations and validate env
const client = Client.forName(process.env.HEDERA_NETWORK || 'testnet');
const accountId = process.env.MY_ACCOUNT_ID;
const privKey = process.env.MY_PRIVATE_KEY_DER || process.env.MY_PRIVATE_KEY_HEX || process.env.MY_PRIVATE_KEY;

if (!accountId || !privKey) {
  console.error('FATAL: Missing required Hedera credentials. Please set MY_ACCOUNT_ID and either MY_PRIVATE_KEY_DER or MY_PRIVATE_KEY_HEX in your .env file.');
  process.exit(1);
}

try {
  client.setOperator(accountId, privKey);
} catch (e) {
  console.error('FATAL: Failed to set operator on Hedera client. Check your MY_ACCOUNT_ID and private key format.');
  // log masked details for debugging
  console.error(`AccountId: ${maskValue(accountId)}  PrivateKey: ${maskValue(privKey)}`);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

let clients = [];
let lastLogs = [];
let busy = false; // prevent concurrent demo/sell operations
const logFile = path.join(__dirname, 'server.log');

function appendToFile(line) {
  try { fs.appendFileSync(logFile, line + '\n'); } catch (e) { /* ignore file errors */ }
}

function sendEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

app.get('/status', (req, res) => {
  res.json({ up: true, busy });
});

app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // send existing logs
  for (const line of lastLogs) {
    res.write(`data: ${JSON.stringify(line)}\n\n`);
  }

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter((c) => c !== res);
  });
});

app.post('/run-demo', (req, res) => {
  if (busy) return res.status(409).json({ error: 'Server busy' });
  busy = true;
  // spawn a node process to run the demo script
  const demoPath = path.join(__dirname, 'demo', 'run_full_demo.js');

  const child = spawn(process.execPath, [demoPath], {
    env: process.env,
  });

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const entry = { level: 'info', text };
    lastLogs.push(entry);
    sendEvent(entry);
    console.log(text.trim());
    appendToFile(`[OUT] ${text.trim()}`);
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const entry = { level: 'error', text };
    lastLogs.push(entry);
    sendEvent(entry);
    console.error(text.trim());
    appendToFile(`[ERR] ${text.trim()}`);
  });

  child.on('close', (code) => {
    const entry = { level: 'info', text: `Demo process exited with code ${code}` };
    lastLogs.push(entry);
    sendEvent(entry);
    appendToFile(`[DONE] Demo exited ${code}`);
    busy = false;
  });

  res.json({ started: true });
});

// Create HCS topic
app.post('/create-topic', async (req, res) => {
  try {
    const topicId = await createEmissionsTopic();
    const entry = { level: 'info', text: `Created HCS topic: ${topicId.toString()}` };
    lastLogs.push(entry);
    sendEvent(entry);
  appendToFile(`[API] Created topic ${entry.text}`);
    res.json({ topicId: topicId.toString() });
  } catch (err) {
    const entry = { level: 'error', text: `Error creating topic: ${err.message || err}` };
    lastLogs.push(entry);
    sendEvent(entry);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Submit emissions report to a topic
app.post('/submit-report', async (req, res) => {
  const { topicId, report } = req.body;
  try {
    const ts = await submitEmissionsReport(topicId, report);
    const entry = { level: 'info', text: `Submitted report to ${topicId}. Consensus ts: ${ts}` };
    lastLogs.push(entry);
    sendEvent(entry);
  appendToFile(`[API] Submitted report ${entry.text}`);
    res.json({ consensusTimestamp: ts });
  } catch (err) {
    const entry = { level: 'error', text: `Error submitting report: ${err.message || err}` };
    lastLogs.push(entry);
    sendEvent(entry);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Create HTS token
app.post('/create-token', async (req, res) => {
  try {
    const tokenId = await createCarbonOffsetToken();
    const entry = { level: 'info', text: `Created token: ${tokenId}` };
    lastLogs.push(entry);
    sendEvent(entry);
  appendToFile(`[API] Created token ${entry.text}`);
    res.json({ tokenId });
  } catch (err) {
    const entry = { level: 'error', text: `Error creating token: ${err.message || err}` };
    lastLogs.push(entry);
    sendEvent(entry);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Sell (transfer) offsets to buyer
app.post('/sell-offsets', async (req, res) => {
  if (busy) return res.status(409).json({ error: 'Server busy' });
  busy = true;
  const { tokenId, amount, buyerAccountId } = req.body;
  try {
    const result = await sellCarbonOffsets(tokenId, Number(amount), buyerAccountId, client);
    // result: { status, treasuryBalance }
    const entry = { level: 'info', text: `Sold ${amount} of token ${tokenId} to ${buyerAccountId}. Status: ${result.status}` };
    lastLogs.push(entry);
    sendEvent(entry);
    appendToFile(`[API] Sold ${amount} ${tokenId} -> ${buyerAccountId} (status: ${result.status})`);
    res.json({ status: result.status, treasuryBalance: result.treasuryBalance });
  } catch (err) {
    const entry = { level: 'error', text: `Error selling offsets: ${err.message || err}` };
    lastLogs.push(entry);
    sendEvent(entry);
    appendToFile(`[API-ERR] ${err.message || String(err)}`);
    res.status(500).json({ error: err.message || String(err) });
  } finally {
    busy = false;
  }
});

app.get('/logs', (req, res) => {
  res.json(lastLogs);
});

// Serve static frontend from public
app.use('/', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API server listening on http://localhost:${port}`));
console.log('Reminder: If you update .env, restart the server (Ctrl+C then npm run api) to pick up changes.');
