const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting RouteX deployment to Monad Testnet...\n");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH\n");
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.warn("⚠️  Warning: Low balance detected. Make sure you have enough ETH for gas fees.\n");
  }

  // Get contract addresses from environment
  const SWAP_ROUTER = process.env.UNISWAP_V2_ROUTER;
  const WETH = process.env.WETH_ADDRESS;
  const USDC = process.env.USDC_ADDRESS;
  const DAI = process.env.DAI_ADDRESS;

  console.log("📋 Using contract addresses:");
  console.log("   Uniswap Router:", SWAP_ROUTER);
  console.log("   WETH:", WETH);
  console.log("   USDC:", USDC);
  console.log("   DAI:", DAI);
  console.log("");

  // Deployment results storage
  const deployedContracts = {};

  try {
    // 1. Deploy TraderAgent
    console.log("📈 Deploying TraderAgent...");
    const TraderAgent = await ethers.getContractFactory("TraderAgent");
    const traderAgent = await TraderAgent.deploy(SWAP_ROUTER);
    await traderAgent.deployed();
    
    const traderAgentAddress = traderAgent.address;
    deployedContracts.TraderAgent = traderAgentAddress;
    console.log("✅ TraderAgent deployed to:", traderAgentAddress);

    // 2. Deploy RouterDefense
    console.log("\n🛡️  Deploying RouterDefense...");
    const RouterDefense = await ethers.getContractFactory("RouterDefense");
    const routerDefense = await RouterDefense.deploy(SWAP_ROUTER);
    await routerDefense.deployed();
    
    const routerDefenseAddress = routerDefense.address;
    deployedContracts.RouterDefense = routerDefenseAddress;
    console.log("✅ RouterDefense deployed to:", routerDefenseAddress);

    // 3. Deploy CrossChainRouter
    console.log("\n🌉 Deploying CrossChainRouter...");
    const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
    const crossChainRouter = await CrossChainRouter.deploy();
    await crossChainRouter.deployed();
    
    const crossChainRouterAddress = crossChainRouter.address;
    deployedContracts.CrossChainRouter = crossChainRouterAddress;
    console.log("✅ CrossChainRouter deployed to:", crossChainRouterAddress);

    // 4. Deploy AIStrategyOptimizer
    console.log("\n🤖 Deploying AIStrategyOptimizer...");
    const AIStrategyOptimizer = await ethers.getContractFactory("AIStrategyOptimizer");
    const aiStrategyOptimizer = await AIStrategyOptimizer.deploy();
    await aiStrategyOptimizer.deployed();
    
    const aiStrategyOptimizerAddress = aiStrategyOptimizer.address;
    deployedContracts.AIStrategyOptimizer = aiStrategyOptimizerAddress;
    console.log("✅ AIStrategyOptimizer deployed to:", aiStrategyOptimizerAddress);

    // 5. Deploy QuantGuardPro
    console.log("\n🏆 Deploying QuantGuardPro...");
    const QuantGuardPro = await ethers.getContractFactory("QuantGuardPro");
    const quantGuardPro = await QuantGuardPro.deploy(
      traderAgentAddress,
      routerDefenseAddress,
      crossChainRouterAddress,
      aiStrategyOptimizerAddress
    );
    await quantGuardPro.deployed();
    
    const quantGuardProAddress = quantGuardPro.address;
    deployedContracts.QuantGuardPro = quantGuardProAddress;
    console.log("✅ QuantGuardPro deployed to:", quantGuardProAddress);

    // Post-deployment configuration
    console.log("\n⚙️  Configuring contracts...");
    
    // Add some basic pools to RouterDefense
    console.log("🔧 Adding token pairs to RouterDefense...");
    try {
      // Add WETH-USDC pool
      await routerDefense.addPool(WETH, USDC, "0x0000000000000000000000000000000000000001");
      console.log("   ✅ Added WETH-USDC pool");
      
      // Add WETH-DAI pool  
      await routerDefense.addPool(WETH, DAI, "0x0000000000000000000000000000000000000002");
      console.log("   ✅ Added WETH-DAI pool");
      
      // Add USDC-DAI pool
      await routerDefense.addPool(USDC, DAI, "0x0000000000000000000000000000000000000003");
      console.log("   ✅ Added USDC-DAI pool");
    } catch (error) {
      console.log("   ⚠️  Pool configuration skipped:", error.message);
    }

    // Add tracked tokens to AI optimizer
    console.log("🧠 Adding tracked tokens to AI optimizer...");
    try {
      await aiStrategyOptimizer.addTrackedToken(WETH);
      await aiStrategyOptimizer.addTrackedToken(USDC);
      await aiStrategyOptimizer.addTrackedToken(DAI);
      console.log("   ✅ Added tracked tokens");
    } catch (error) {
      console.log("   ⚠️  Token tracking setup skipped:", error.message);
    }

    // Set authorized executor for QuantGuardPro
    console.log("👤 Setting authorized executor...");
    try {
      await quantGuardPro.setAuthorizedExecutor(deployer.address, true);
      console.log("   ✅ Set deployer as authorized executor");
    } catch (error) {
      console.log("   ⚠️  Executor setup skipped:", error.message);
    }

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`📍 ${name.padEnd(20)} : ${address}`);
    });

    console.log("\n🔗 Network Information:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🌐 Network                : Monad Testnet`);
    console.log(`🆔 Chain ID               : 10143`);
    console.log(`🔍 Explorer               : https://testnet.monadexplorer.com/`);
    console.log(`👤 Deployer               : ${deployer.address}`);

    console.log("\n💼 External Contract References:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🔄 Uniswap Router         : ${SWAP_ROUTER}`);
    console.log(`💎 WETH                   : ${WETH}`);
    console.log(`💵 USDC                   : ${USDC}`);
    console.log(`💰 DAI                    : ${DAI}`);

    console.log("\n🚀 Next Steps:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Verify contracts on block explorer (optional)");
    console.log("2. Update frontend configuration with new contract addresses");
    console.log("3. Configure API endpoints to use these contracts");
    console.log("4. Test basic functionality with small amounts first");
    console.log("5. Set up monitoring and alerts for the deployed contracts");

    console.log("\n📝 Configuration File Generated:");
    const configData = {
      network: "monad_testnet",
      chainId: 10143,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      external: {
        uniswapRouter: SWAP_ROUTER,
        weth: WETH,
        usdc: USDC,
        dai: DAI
      }
    };

    // Save deployment info to file
    const fs = require('fs');
    fs.writeFileSync(
      './deployments.json', 
      JSON.stringify(configData, null, 2)
    );
    console.log("💾 Deployment information saved to: ./deployments.json");

    console.log("\n" + "=".repeat(60));
    console.log("✨ RouteX is now live on Monad Testnet! ✨");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error:", error.message);
    
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
    
    console.error("\n🔧 Troubleshooting tips:");
    console.error("1. Check your wallet balance");
    console.error("2. Verify network connectivity");
    console.error("3. Ensure contract compilation is successful");
    console.error("4. Check gas price settings");
    
    process.exit(1);
  }
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });