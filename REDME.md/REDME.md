 #  Carbon Ledger: An Immutable Emissions and Offset Platform on Hedera

##  Project Summary

**Carbon Ledger** is a decentralized solution tackling the challenges of **transparency** and **double-counting** in the carbon offset market. We leverage **Hedera Hashgraph's** Distributed Ledger Technology (DLT) to provide an immutable audit trail for both emissions reporting and offset token retirement.

**Core Hedera Services Used:**
1. **Hedera Consensus Service (HCS):** For logging immutable emissions reports with cryptographically secure consensus timestamps.
2. **Hedera Token Service (HTS):** For creating, minting, and permanently retiring (burning) carbon offset tokens to prevent fraudulent reuse (double-counting).

---

## 🛠️ Local Execution Guide (For Judges)

Follow these steps to run the **Carbon Ledger** demo on the Hedera **Testnet**.

### Prerequisites

* **Node.js** (v18 or newer)
* **Git**
* **Hedera Testnet Account** (Account ID and Private Key are required).

### Step 1: Setup and Dependencies

1. **Clone/Download Repository** (Already done).
2. **Setup Environment:** Create a file named **`.env`** in the root directory and populate it with your actual Testnet credentials (Account ID and Private Key).
3. **Install Libraries:** Open the project's Terminal (in VS Code) and run the install command:
    ```bash
    npm install
    ```

### Step 2: Run the Full Demo

The primary script executes a full lifecycle demonstration:
1. Creates a new HCS Topic.
2. Submits an immutable Emissions Report to the Topic.
3. Creates a new HTS Fungible Token (VCO2).
4. **Retires (Burns) a specific amount of VCO2 tokens** matching the reported emissions, thus preventing double-counting.

**Execute the command in your Terminal:**

```bash
npm start


---

## Serve & Frontend

A simple static frontend has been added under the `public/` folder. It can be served locally with `http-server` so you can open the UI in your browser while running the demo in a separate terminal.

1. Install http-server globally or use npx (no install required):

```powershell
npx http-server public -p 8080
```

2. Open http://localhost:8080 in your browser to view the UI.

Note: The frontend is static and does not directly execute Hedera transactions from the browser. Run `npm start` in another terminal to execute the Hedera demo.

## API Server & Live Logs

A minimal Express API server is provided to run the demo script from the server and stream logs to the browser using Server-Sent Events (SSE). This enables a two-terminal workflow where the browser shows live demo output.

1. Install new dependencies (express, cors):

```powershell
npm install
```

2. Start the API server (this serves the frontend and the API):

```powershell
npm run api
```

3. Open http://localhost:3000 in your browser. Click "Run Demo" to start the demo on the server. Logs will stream into the page.

Notes:
- The API server spawns the existing `demo/run_full_demo.js` Node script. Ensure your `.env` file with Hedera credentials is present if you want the demo to perform real Hedera operations.
- If you prefer to serve the frontend separately (http-server), you can still run `npm start` in another terminal and `npm run api` just for the API endpoints.

Important: if you change `.env` (for example to add `HEDERA_PORTAL_TOKEN`), you must restart the API server for changes to take effect:

- Stop the running server (Ctrl+C in the terminal where `npm run api` is running).
- Start it again: `npm run api`


## Smoke test and Sell Offsets

Quick smoke test (PowerShell) to ensure the API server is responding:

```powershell
.\scripts\smoke_test.ps1
```

Sell offsets via the UI or API:

- UI: open http://localhost:3000, fill tokenId, amount and buyerAccountId, click Sell.
- API: POST to `/sell-offsets` with JSON body:

```json
{ "tokenId": "0.0.x", "amount": 100, "buyerAccountId": "0.0.y" }
```

The server will validate treasury balance and return a status indicating success or an error message.

