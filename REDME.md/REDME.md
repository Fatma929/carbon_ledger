# 🌍 Carbon Ledger — Hedera Hackathon Project

A transparent carbon accounting and offset platform** powered by Hedera Hashgraph (HCS + HTS).  
Track emissions, tokenize carbon offsets, and trade them securely on-chain.

---

# 🚀 Live Demo

 https://carbon-ledger-ten.vercel.app  
 
---

# 🧠 Project Overview

Carbon Ledger enables transparent and auditable carbon tracking using Hedera Consensus Service (HCS) and Hedera Token Service (HTS).  
It allows organizations to:
- Record verified carbon emission reports on HCS  
- Mint and manage carbon offset tokens via HTS  
- Sell offsets directly through an integrated API  
- Visualize the process in real time via a live dashboard

---

##🧩 Architecture

| Layer | Technology | Description |
|-------|-------------|-------------|
| *Backend* | Node.js + Express | REST API to interact with Hedera HCS/HTS |
| *Frontend*| Static (served from `/public`) | User interface and visualization |
|  | Hedera Hashgraph | Distributed ledger for auditability |
| *Integration* | Server-Sent Events (SSE) | Real-time streaming of process logs |

---

## 🛠 Local Setup

# 1️⃣ Clone the repository
```bash
git clone https://github.com/Fatma929/carbon_ledger.git
cd carbon_ledger
2️⃣env 
 MY_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
MY_PRIVATE_KEY_DER=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet
PORT=4000

3️⃣Install dependencies
npm install
then open your  browser 

http://localhost:4000

Method Endpoint Description GET /status Check if the server is up GET /events Stream real-time logs (SSE) GET /logs Retrieve last known logs POST /create-topic Create new Hedera HCS topic POST /submit-report Submit a carbon emission report POST /create-token Create a carbon offset token (HTS) POST /sell-offsets Sell or transfer offsets to another account
