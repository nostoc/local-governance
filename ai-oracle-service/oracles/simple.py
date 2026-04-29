import json
import time
from web3 import Web3

from shared.config import (
    ABI_PATH,
    ORACLE_CONTRACT_ADDRESS,
    DEFAULT_PRIVATE_KEY,
    RPC_URL,
    ORACLE_WS_URL,
)
from shared.ipfs_client import fetch_text_from_cid
from shared.moderation import analyze_text


def run():
    private_key = DEFAULT_PRIVATE_KEY

    if not private_key:
        raise RuntimeError("Missing ORACLE_PRIVATE_KEY for oracles/simple.py")

    if not Web3.is_address(ORACLE_CONTRACT_ADDRESS):
        raise RuntimeError(
            f"Invalid ORACLE_CONTRACT_ADDRESS: {ORACLE_CONTRACT_ADDRESS}. "
            "Check ai-oracle-service/.env."
        )

    if not ABI_PATH.exists():
        raise RuntimeError(
            f"Contract ABI not found at {ABI_PATH}. "
            "Set ORACLE_ABI_PATH or build smart contracts."
        )

    if ORACLE_WS_URL:
        w3 = Web3(Web3.WebsocketProvider(ORACLE_WS_URL))
        print(f"Using WebSocket provider: {ORACLE_WS_URL}")
    else:
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        print(f"Using HTTP provider: {RPC_URL}")

    if not w3.is_connected():
        print("[WARN] Web3 provider is not connected. Check RPC/WS URL.")

    account = w3.eth.account.from_key(private_key)
    w3.eth.default_account = account.address

    print(f"Connected to Hardhat: {w3.is_connected()}")
    print(f"Oracle Wallet Address: {account.address}")

    try:
        with open(ABI_PATH, "r") as file:
            contract_json = json.load(file)
            contract_abi = contract_json["abi"]
    except FileNotFoundError as exc:
        raise RuntimeError(f"ABI file not found: {ABI_PATH}") from exc
    except (json.JSONDecodeError, KeyError) as exc:
        raise RuntimeError(
            f"Invalid ABI JSON at {ABI_PATH}. Expected top-level 'abi' field."
        ) from exc

    contract = w3.eth.contract(address=ORACLE_CONTRACT_ADDRESS, abi=contract_abi)

    def submit_vote(report_id, vote_direction):
        print(f"[*] Submitting vote: {vote_direction} for Report {report_id}...")

        dummy_nullifier = w3.to_bytes(text=f"oracle_vote_{report_id}").ljust(32, b"\0")

        try:
            tx = contract.functions.voteOnReport(
                report_id, vote_direction, dummy_nullifier, 0
            ).build_transaction(
                {
                    "from": account.address,
                    "nonce": w3.eth.get_transaction_count(account.address),
                }
            )

            signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            print(f"[SUCCESS] Vote submitted! TX Hash: {tx_hash.hex()}")
        except Exception as exc:
            print(f"[ERROR] Failed to submit vote: {exc}")

    def handle_new_report(event):
        report_id = event["args"]["reportId"]
        ipfs_cid = event["args"]["ipfsCID"]
        print(f"\n[!] New Report Detected! ID: {report_id} | CID: {ipfs_cid}")

        fetched = fetch_text_from_cid(ipfs_cid)

        if fetched:
            print("[*] Fetched text from IPFS")
            to_analyze = fetched
        else:
            to_analyze = "This is a fake spam report."
            print(
                "[WARN] Could not fetch from IPFS; using simulated text. "
                "Check IPFS_API_URL/IPFS_GATEWAY."
            )

        print(f"[*] Analyzing text: '{to_analyze}'")

        result = analyze_text(to_analyze)
        print(
            f"[*] AI Result: Trust Score: {result['trust_score']}, "
            f"Spam: {result['is_spam']}"
        )

        vote_direction = not result["is_spam"]
        submit_vote(report_id, vote_direction)

    print("Listening for ReportCreated events...")
    event_filter = contract.events.ReportCreated.create_filter(from_block="latest")

    while True:
        for event in event_filter.get_new_entries():
            handle_new_report(event)
        time.sleep(2)


if __name__ == "__main__":
    run()
