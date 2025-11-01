 🌍 Carbon Ledger — Hedera Hackathon Project

A transparent carbon accounting and offset platform powered by **Hedera Hashgraph (HCS + HTS)**.  
Track emissions, tokenize carbon offsets, and trade them securely on-chain.

---

## 🚀 Live Demo
🔗 https://carbon-ledger-ten.vercel.app  

🎬 Watch project demo video →  https://youtu.be/0KyzUaYAn0U?si=rlS2TFE0k_sGOery
---

## 🧠 Project Overview

Carbon Ledger enables transparent and auditable carbon tracking using Hedera Consensus Service (HCS) and Hedera Token Service (HTS).  
It allows organizations to:

- Record verified carbon emission reports on HCS  
- Mint and manage carbon offset tokens via HTS  
- Sell offsets directly through an integrated API  
- Visualize the process in real time through a live dashboard  

This project was built as part of the **Hedera Global Hackathon 2025**, focusing on sustainability, traceability, and blockchain-driven environmental accountability.

---

## 🧩 Architecture

**Backend:** Node.js and Express – REST API interacting with Hedera HCS and HTS  
**Frontend:** Static web dashboard (from `/public`) for data visualization  
**Ledger:** Hedera Hashgraph for distributed, tamper-proof recording  
**Integration:** Server-Sent Events (SSE) for real-time logs and updates  

---

## 📖 Features

- 🌿 Track verified carbon emissions transparently  
- 🔗 Tokenize carbon offsets using Hedera Token Service  
- 💰 Trade offsets securely between participants  
- 📊 Visualize live transactions on a dashboard  
- ♻️ Promote sustainable, auditable climate action  

---

## 🛠 Local Setup

**1️⃣ Clone the repository**
```bash
git clone https://github.com/Fatma929/carbon_ledger.git
cd carbon_ledger
2️⃣ Create .env file in the root directory

MY_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
MY_PRIVATE_KEY_DER=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet
PORT=4000
3️⃣ Install dependencies

npm install
4️⃣ Run the project

npm start
Then open your browser and visit:
👉 http://localhost:4000

🔌 API Endpoints Overview
GET /status – Check if the server is running
GET /events – Stream real-time logs (SSE)
GET /logs – Retrieve last known logs
POST /create-topic – Create new Hedera HCS topic
POST /submit-report – Submit a carbon emission report
POST /create-token – Create a carbon offset token (HTS)
POST /sell-offsets – Sell or transfer offsets between accounts

🌱 Why Carbon Ledger?
Traditional carbon markets are often opaque and fragmented.
Carbon Ledger introduces transparency and automation by recording all actions on Hedera Hashgraph — making carbon offsets auditable, traceable, and trustworthy.

Our mission is to enable organizations to verify and offset their emissions efficiently, supporting a greener planet through open and reliable technology.

👩‍💻 Team
Developed by Fatma Elzahraa and collaborators
for the Hedera Global Hackathon 2025.

Special thanks to mentors and the open-source Hedera community for their continuous support.

🪪 License
This project is licensed under the MIT License.
You are free to fork, modify, and build upon it while crediting the original source.

🌍 Connect
💬 Questions or feedback?
Open an issue on GitHub or reach out through the project page.

🚀 Let’s build a transparent, verifiable, and green carbon economy together.


