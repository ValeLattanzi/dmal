const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // ===== 1. Deploy ConservatoryAcademy =====
  console.log("\n--- Deploying ConservatoryAcademy ---");
  const ConservatoryAcademy = await hre.ethers.getContractFactory("ConservatoryAcademy");
  const academy = await ConservatoryAcademy.deploy(deployer.address);
  await academy.waitForDeployment();
  const academyAddress = await academy.getAddress();
  console.log("ConservatoryAcademy deployed to:", academyAddress);

  // ===== 2. Deploy CompositionRegistry =====
  console.log("\n--- Deploying CompositionRegistry ---");
  const CompositionRegistry = await hre.ethers.getContractFactory("CompositionRegistry");
  const registry = await CompositionRegistry.deploy(
    academyAddress,
    hre.ethers.parseEther("0.01"), // 0.01 ETH fee for external composers
    deployer.address
  );
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("CompositionRegistry deployed to:", registryAddress);

  // ===== 3. Deploy ConservatoryDiploma =====
  console.log("\n--- Deploying ConservatoryDiploma ---");
  const ConservatoryDiploma = await hre.ethers.getContractFactory("ConservatoryDiploma");
  const diploma = await ConservatoryDiploma.deploy(academyAddress, deployer.address);
  await diploma.waitForDeployment();
  const diplomaAddress = await diploma.getAddress();
  console.log("ConservatoryDiploma deployed to:", diplomaAddress);

  // ===== Summary =====
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("Network:", (await hre.ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("ConservatoryAcademy:", academyAddress);
  console.log("CompositionRegistry:", registryAddress);
  console.log("ConservatoryDiploma:", diplomaAddress);
  console.log("\n✅ All contracts deployed successfully!");

  // ===== Save deployment info to file =====
  const fs = require("fs");
  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    contracts: {
      ConservatoryAcademy: academyAddress,
      CompositionRegistry: registryAddress,
      ConservatoryDiploma: diplomaAddress
    },
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
