import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Construct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("🚀 Starting Vanilla Deployment (Bypassing Hardhat Runner)...");

    // Connect directly to the local node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Standard Hardhat Account #0 (Deployer)
    const deployer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    // Standard Hardhat Accounts #1 and #2 (For the Multi-Sig)
    const admin2 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
    const admin3 = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);

    const AI_ORACLE_ADDRESS = "0x55132Cc173CF552E3732f1e37Ba5a2cFD2686bF2";

    // Helper to read compiled artifacts
    const getArtifact = (name: string) => {
        const filePath = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    };

    try {
        // 🔥 MANUALLY FETCH AND TRACK THE NONCE 🔥
        let currentNonce = await provider.getTransactionCount(deployer.address);

        // 1. Deploy Reporting
        console.log("\n1️⃣ Deploying Reporting...");
        const reportingArtifact = getArtifact("Reporting");
        const ReportingFactory = new ethers.ContractFactory(reportingArtifact.abi, reportingArtifact.bytecode, deployer);
        // Inject the exact nonce, then increment it for the next transaction
        const reporting = await ReportingFactory.deploy({ nonce: currentNonce++ });
        await reporting.waitForDeployment();
        const reportingAddress = await reporting.getAddress();
        console.log(`✅ Reporting deployed to: ${reportingAddress}`);

        // 2. Deploy MultiSig
        console.log("\n2️⃣ Deploying AuthorityMultiSig...");
        const multiSigArtifact = getArtifact("AuthorityMultiSig");
        const MultiSigFactory = new ethers.ContractFactory(multiSigArtifact.abi, multiSigArtifact.bytecode, deployer);
        const initialAdmins = [deployer.address, admin2.address, admin3.address];
        // Inject nonce
        const multiSig = await MultiSigFactory.deploy(initialAdmins, reportingAddress, { nonce: currentNonce++ });
        await multiSig.waitForDeployment();
        const multiSigAddress = await multiSig.getAddress();
        console.log(`✅ MultiSig deployed to: ${multiSigAddress}`);

        // 3. Transfer Ownership
        console.log("\n3️⃣ Transferring Reporting Ownership...");
        const reportingContract = new ethers.Contract(reportingAddress, reportingArtifact.abi, deployer);
        // Inject nonce
        const tx = await reportingContract.transferOwnership(multiSigAddress, { nonce: currentNonce++ });
        await tx.wait();
        console.log(`✅ Ownership transferred to MultiSig.`);

        // 4. Deploy OpinionPolling
        console.log("\n4️⃣ Deploying OpinionPolling...");
        const pollingArtifact = getArtifact("OpinionPolling");
        const PollingFactory = new ethers.ContractFactory(pollingArtifact.abi, pollingArtifact.bytecode, deployer);
        // Inject nonce
        const polling = await PollingFactory.deploy(reportingAddress, AI_ORACLE_ADDRESS, { nonce: currentNonce++ });
        await polling.waitForDeployment();
        const pollingAddress = await polling.getAddress();
        console.log(`✅ OpinionPolling deployed to: ${pollingAddress}`);

        console.log("\n🎯 All contracts deployed successfully!");
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
    }
}

main();