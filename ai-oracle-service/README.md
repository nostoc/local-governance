# AI Oracle Service

Python service layer for the Local Governance Platform's AI-assisted moderation flow. This package contains:

- A small FastAPI app for text moderation over HTTP
- Oracle worker scripts that listen for `ReportCreated` events on the `Reporting` smart contract
- Per-oracle voting logic that submits validation votes back on-chain

## What It Does

When a new report is created on-chain, the oracle workers poll for the `ReportCreated` event, analyze the report text, and submit a vote to `voteOnReport(...)` during the validation phase.

The repository now uses a package layout:

- `api/app.py`: FastAPI app with `POST /moderate/text`
- `oracles/simple.py`: basic keyword-based moderation oracle
- `oracles/gov.py`: government oracle using `unitary/toxic-bert`
- `oracles/ngo.py`: NGO oracle using NLTK VADER sentiment analysis
- `oracles/intl.py`: international oracle using `cardiffnlp/twitter-roberta-base-hate`
- `scripts/run_*.py`: runnable entrypoints for each oracle

The old top-level files (`main.py`, `oracle.py`, etc.) are kept as thin wrappers for backward compatibility.

## Prerequisites

- Python 3.10+
- A running local EVM node, typically Hardhat at `http://127.0.0.1:8545`
- The `Reporting` contract deployed locally
- Private keys for the oracle accounts that will submit votes

## Installation

From the repository root:

```bash
cd ai-oracle-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Notes:

- `transformers` models are downloaded the first time the ML-backed oracle scripts run.
- `oracle_ngo.py` downloads the VADER lexicon on first startup.

## Docker Deployment (Recommended for VPS)

For deploying on a VPS with Docker, all 3 oracle instances run as separate containers:

1. **Prepare environment file:**

```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your PoA RPC, contract address, and oracle private keys
```

2. **Build and run:**

```bash
# Build the image
docker-compose build

# Start all 3 oracles in the background
docker-compose up -d

# View logs
docker-compose logs -f oracle-gov
docker-compose logs -f oracle-ngo
docker-compose logs -f oracle-intl

# Stop all oracles
docker-compose down
```

3. **For production on VPS:**

- Replace `ORACLE_RPC_URL` with your PoA node's public IP or internal network address.
- Mount the contract ABI as a read-only volume if it changes frequently.
- Use `restart: unless-stopped` to auto-recover from crashes.

## Configuration

Create `ai-oracle-service/.env` with the variables below:

```env
ORACLE_RPC_URL=http://127.0.0.1:8545
ORACLE_WS_URL=ws://127.0.0.1:8545
ORACLE_CONTRACT_ADDRESS=0xYourReportingContractAddress
ORACLE_ABI_PATH=/absolute/path/to/smart-contracts/artifacts/contracts/Reporting.sol/Reporting.json

ORACLE_PRIVATE_KEY=0x...
ORACLE_GOV_PRIVATE_KEY=0x...
ORACLE_NGO_PRIVATE_KEY=0x...
ORACLE_INTL_PRIVATE_KEY=0x...
```

Variable reference:

- `ORACLE_RPC_URL`: JSON-RPC endpoint for the local chain. Defaults to `http://127.0.0.1:8545`
- `ORACLE_WS_URL`: optional WebSocket endpoint used for real-time event streaming. If set, the oracles prefer this provider over HTTP.
- `ORACLE_CONTRACT_ADDRESS`: deployed `Reporting` contract address. Required
- `ORACLE_ABI_PATH`: path to the contract artifact JSON containing the ABI. If omitted, the service defaults to `../smart-contracts/artifacts/contracts/Reporting.sol/Reporting.json`
- `ORACLE_PRIVATE_KEY`: required for `oracle.py`
- `ORACLE_GOV_PRIVATE_KEY`: required for `oracle_gov.py`
- `ORACLE_NGO_PRIVATE_KEY`: required for `oracle_ngo.py`
- `ORACLE_INTL_PRIVATE_KEY`: required for `oracle_intl.py`

The config loader reads `ai-oracle-service/.env` automatically. If `python-dotenv` is installed it uses that, otherwise it falls back to a small local parser.

## Running The HTTP API

Start the FastAPI moderation service:

```bash
cd ai-oracle-service
source venv/bin/activate
uvicorn api.app:app --reload --port 8000
```

Test it with:

```bash
curl -X POST http://127.0.0.1:8000/moderate/text \
  -H "Content-Type: application/json" \
  -d '{"report_id":"demo-1","text":"This looks like a scam and spam post"}'
```

Example response:

```json
{
  "report_id": "demo-1",
  "trust_score": 10,
  "is_spam": true
}
```

## Running The Oracle Workers

Each oracle worker should run in its own terminal:

```bash
cd ai-oracle-service
source venv/bin/activate
python scripts/run_gov_oracle.py
```

```bash
cd ai-oracle-service
source venv/bin/activate
python scripts/run_ngo_oracle.py
```

```bash
cd ai-oracle-service
source venv/bin/activate
python scripts/run_intl_oracle.py
```

Optional simple oracle:

```bash
cd ai-oracle-service
source venv/bin/activate
python scripts/run_simple_oracle.py
```

What happens at runtime:

- The worker connects to the configured RPC endpoint
- It loads the `Reporting` contract ABI and address
- It creates a filter for `ReportCreated`
- For each new event, it runs its local text analysis function
- It submits `voteOnReport(reportId, voteDirection, nullifier, 0)`

## Local End-To-End Flow

1. Start the local blockchain:

```bash
cd smart-contracts
npx hardhat node
```

2. Deploy the `Reporting` contract:

```bash
cd smart-contracts
npx hardhat ignition deploy ignition/modules/Reporting.ts --network localhost
```

3. Update `ai-oracle-service/.env` with the deployed contract address if it changed.

4. Start the oracle workers in separate terminals.

5. Trigger a test report:

```bash
cd smart-contracts
npx tsx scripts/test-trigger.ts
```

The trigger script:

- loads `../ai-oracle-service/.env`
- checks the deployed contract exists at `ORACLE_CONTRACT_ADDRESS`
- grants `RELAYER_ROLE` to the configured oracle wallets if needed
- submits a test report to emit `ReportCreated`

After that, the oracle terminals should detect the event and submit their votes.

## DApp + Smart Contract Integration Notes

These steps assume your team is deploying the `Reporting` contract and the DApp is calling into it. The oracle service only needs the contract address, ABI, and IPFS access to fetch the report text.

1. Ensure the DApp stores report content on IPFS and submits the resulting CID on-chain.
  - The `ReportCreated` event must include `ipfsCID` (or equivalent) for the oracle workers to fetch and analyze.

2. Confirm the deployed `Reporting` contract ABI matches the artifact path you provide.
  - Default: `../smart-contracts/artifacts/contracts/Reporting.sol/Reporting.json`
  - If you deploy to a different network or rebuild contracts, update `ORACLE_ABI_PATH` and `ORACLE_CONTRACT_ADDRESS`.

3. Configure the oracle service with the DApp/contract environment:
  - `ORACLE_RPC_URL` / `ORACLE_WS_URL` should point to the chain the DApp uses (Hardhat, testnet, or private PoA network).
  - `ORACLE_CONTRACT_ADDRESS` should match the DApp’s deployed `Reporting` contract.

4. Ensure each oracle wallet has the required role and funds.
  - The on-chain role must be allowed to call `voteOnReport` during the validation phase.
  - Fund the oracle accounts if using a dev chain or testnet.

5. Confirm IPFS access paths:
  - If using a local IPFS daemon: set `IPFS_API_URL=/ip4/127.0.0.1/tcp/5001` and run the daemon.
  - If using a remote IPFS gateway: set `IPFS_GATEWAY=https://<your-gateway>/ipfs`.

6. Start the oracles and submit a report from the DApp:
  - The oracles should log the incoming `ReportCreated` event, fetch the report text from IPFS, and submit votes.
  - If IPFS fetch fails, the oracles log a warning and fall back to simulated text (for now).

## Current Limitations / Recent Improvements

- Workers now attempt to fetch report text from IPFS CIDs emitted in `ReportCreated` events. If a local IPFS daemon is available and `ipfshttpclient` is installed, the service will use it; otherwise the worker will try the configured HTTP gateway. If fetching fails the scripts fall back to simulated text for testing.
- Event listening still uses a short poll loop, but the oracles now prefer a WebSocket provider (if configured) for more responsive event delivery.
- A `requirements.txt` was added to help reproducible environments.
- Model-backed workers still take time on first run while models / lexica download.

## Troubleshooting

- `Missing required environment variable`: add the missing key to `ai-oracle-service/.env`
- `Invalid ORACLE_CONTRACT_ADDRESS`: check that the address is a valid hex address (0x...) and matches the deployed `Reporting` contract
- `Contract ABI not found`: verify `ORACLE_ABI_PATH` points to a built artifact JSON containing an `abi` field
- `No contract code found at ...`: redeploy the contract and update `ORACLE_CONTRACT_ADDRESS`
- Transaction submission failures: make sure the oracle wallet has funds on the local chain and the account has the required contract role
- Slow first startup: expected for `transformers` models and the NLTK lexicon download

## Related Files

- [api/app.py](/home/nostoc/dev/local-governance/ai-oracle-service/api/app.py)
- [shared/config.py](/home/nostoc/dev/local-governance/ai-oracle-service/shared/config.py)
- [shared/ipfs_client.py](/home/nostoc/dev/local-governance/ai-oracle-service/shared/ipfs_client.py)
- [oracles/simple.py](/home/nostoc/dev/local-governance/ai-oracle-service/oracles/simple.py)
- [oracles/gov.py](/home/nostoc/dev/local-governance/ai-oracle-service/oracles/gov.py)
- [oracles/ngo.py](/home/nostoc/dev/local-governance/ai-oracle-service/oracles/ngo.py)
- [oracles/intl.py](/home/nostoc/dev/local-governance/ai-oracle-service/oracles/intl.py)
- [scripts/run_simple_oracle.py](/home/nostoc/dev/local-governance/ai-oracle-service/scripts/run_simple_oracle.py)
- [test-trigger.ts](/home/nostoc/dev/local-governance/smart-contracts/scripts/test-trigger.ts)
