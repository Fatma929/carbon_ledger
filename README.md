# Carbon Ledger — Local Demo

Minimal instructions to run the demo locally and the required `.env` variables.

## Minimal `.env` example
Create a file named `.env` in the project root and add the following (replace the placeholder values):

```env
# Hedera account used as operator / treasury (example format: 0.0.12345)
MY_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID

# Private key for the above account. Provide either DER or HEX representation.
# Use `MY_PRIVATE_KEY_DER` for DER, or `MY_PRIVATE_KEY_HEX` / `MY_PRIVATE_KEY` for hex/raw.
MY_PRIVATE_KEY_DER=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# Hedera network to target: testnet | mainnet | previewnet
HEDERA_NETWORK=testnet

# Optional: port for the API server
PORT=3000

# Optional: portal token for external services (if used)
HEDERA_PORTAL_TOKEN=
```

Notes:
- Keep your `.env` out of version control. `.gitignore` should already ignore `.env`.
- The server will validate presence of `MY_ACCOUNT_ID` and one of the private key vars at startup and exit if missing.

## Quick run (PowerShell)
Start the API server (runs server.js):

```powershell
npm run api
```

Serve the frontend (in a separate terminal):

```powershell
npx http-server public -p 8080
```

Open the UI at http://localhost:8080 and use the Quick Sell modal to test HTS transfers (requires a funded testnet account and the appropriate token). The API server will handle Hedera calls and stream logs to the UI.

---
If you want a more secure production setup, consider using a secrets manager instead of `.env`.

## About

🌍 **Carbon Ledger on Hedera**

Carbon Ledger on Hedera is a transparent registry for verified carbon emission certificates and offset tokens. It enables organizations and individuals to issue, track, and trade carbon offset tokens (vCO₂) on the Hedera Testnet, ensuring accountability and trust through distributed ledger technology.

The system connects two main registries —
- an emission certificate ledger, recording verified carbon emissions, and
- an offset certificate ledger, representing verified carbon compensation efforts.

When an organization generates more offset credits than emissions, the surplus can be tokenized and traded, creating a sustainable carbon economy.

Built with Hedera Hashgraph, this project demonstrates how transparent, efficient, and eco-friendly digital infrastructure can accelerate climate action. 🌿
