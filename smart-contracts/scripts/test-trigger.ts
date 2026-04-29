import { ethers } from "ethers";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

const oracleEnvPath = resolve(process.cwd(), "../ai-oracle-service/.env");

if (existsSync(oracleEnvPath)) {
    loadEnvFile(oracleEnvPath);
}

function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. ` +
            `Add it to ai-oracle-service/.env or export it before running this script.`
        );
    }

    return value;
}

async function main() {
    console.log("Connecting to local Hardhat node...");
    const rpcUrl = process.env.ORACLE_RPC_URL ?? "http://127.0.0.1:8545";
    const privateKey = requireEnv("ORACLE_PRIVATE_KEY");
    const contractAddress = requireEnv("ORACLE_CONTRACT_ADDRESS");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const deployer = new ethers.NonceManager(new ethers.Wallet(privateKey, provider));
    const deployerAddress = await deployer.getAddress();

    const minimalAbi = [
        "function RELAYER_ROLE() view returns (bytes32)",
        "function hasRole(bytes32 role, address account) view returns (bool)",
        "function grantRole(bytes32 role, address account) external",
        "function createReport(string _ipfsCID, bytes32 _submissionNullifier) external"
    ];

    const contract = new ethers.Contract(contractAddress, minimalAbi, deployer);

    const contractCode = await provider.getCode(contractAddress);
    if (contractCode === "0x") {
        throw new Error(
            `No contract code found at ${contractAddress} on ${rpcUrl}. ` +
            `Your localhost chain likely doesn't have Reporting deployed yet, or ORACLE_CONTRACT_ADDRESS points to an old deployment. ` +
            `Redeploy the contract to the running local node and update ai-oracle-service/.env if the address changes.`
        );
    }

    console.log("1. Checking permissions...");

    const RELAYER_ROLE = await contract.RELAYER_ROLE();
    const alreadyHasRole = await contract.hasRole(RELAYER_ROLE, deployerAddress);

    // Derive oracle addresses from the configured private keys so the script
    // always matches the active oracle service configuration.
    const oracleAddresses = [
        requireEnv("ORACLE_GOV_PRIVATE_KEY"),
        requireEnv("ORACLE_NGO_PRIVATE_KEY"),
        requireEnv("ORACLE_INTL_PRIVATE_KEY"),
    ].map((key) => new ethers.Wallet(key).address);

    console.log(`Using contract: ${contractAddress}`);
    console.log(`Using deployer: ${deployerAddress}`);

    console.log("Authorizing the 3 Oracle Nodes...");
    for (const address of oracleAddresses) {
        const hasRole = await contract.hasRole(RELAYER_ROLE, address);
        if (!hasRole) {
            const tx = await contract.grantRole(RELAYER_ROLE, address);
            await tx.wait();
            console.log(`Granted access to ${address}`);
        } else {
            console.log(`Already authorized: ${address}`);
        }
    }

    if (!alreadyHasRole) {
        console.log("   Granting RELAYER_ROLE to deployer...");
        const grantTx = await contract.grantRole(RELAYER_ROLE, deployerAddress);
        await grantTx.wait();
    } else {
        console.log("   Deployer already has RELAYER_ROLE. Skipping grant.");
    }

    console.log("2. Submitting a test report to the blockchain...");
    const fakeIpfsCID = "QmFakeIpfsHashForTesting123";
    const fakeNullifier = ethers.id("test-nullifier-" + Date.now());

    const tx = await contract.createReport(fakeIpfsCID, fakeNullifier);
    await tx.wait();

    console.log("✅ Transaction confirmed! Look at your oracle.py terminals now.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
