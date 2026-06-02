const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Leer direcciones desplegadas
  if (!fs.existsSync("deployments.json")) {
    console.error("❌ deployments.json not found. Run: npx hardhat run scripts/deploy.js --network sepolia");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  const { deployer } = deployments;

  console.log("🔍 Verifying contracts on Etherscan...\n");

  // ===== 1. Verify ConservatoryAcademy =====
  console.log("--- Verifying ConservatoryAcademy ---");
  try {
    await hre.run("verify:verify", {
      address: deployments.contracts.ConservatoryAcademy,
      constructorArguments: [deployer]
    });
    console.log("✅ ConservatoryAcademy verified!");
  } catch (error) {
    console.error("❌ ConservatoryAcademy verification failed:", error.message);
  }

  // ===== 2. Verify CompositionRegistry =====
  console.log("\n--- Verifying CompositionRegistry ---");
  try {
    await hre.run("verify:verify", {
      address: deployments.contracts.CompositionRegistry,
      constructorArguments: [
        deployments.contracts.ConservatoryAcademy,
        hre.ethers.parseEther("0.01").toString(),
        deployer
      ]
    });
    console.log("✅ CompositionRegistry verified!");
  } catch (error) {
    console.error("❌ CompositionRegistry verification failed:", error.message);
  }

  // ===== 3. Verify ConservatoryDiploma =====
  console.log("\n--- Verifying ConservatoryDiploma ---");
  try {
    await hre.run("verify:verify", {
      address: deployments.contracts.ConservatoryDiploma,
      constructorArguments: [
        deployments.contracts.ConservatoryAcademy,
        deployer
      ]
    });
    console.log("✅ ConservatoryDiploma verified!");
  } catch (error) {
    console.error("❌ ConservatoryDiploma verification failed:", error.message);
  }

  console.log("\n========== VERIFICATION COMPLETE ==========");
  console.log("Visit https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS> to check verification status");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
