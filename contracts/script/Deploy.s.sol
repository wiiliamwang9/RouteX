// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/TraderAgent.sol";
import "../src/core/RouterDefense.sol";

contract DeployScript is Script {
    address constant MONAD_SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564; // 替换为 Monad 上的实际地址
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        TraderAgent traderAgent = new TraderAgent(MONAD_SWAP_ROUTER);
        console.log("TraderAgent deployed at:", address(traderAgent));
        
        RouterDefense routerDefense = new RouterDefense(MONAD_SWAP_ROUTER);
        console.log("RouterDefense deployed at:", address(routerDefense));
        
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
        console.log("TraderAgent address:", address(traderAgent));
        console.log("RouterDefense address:", address(routerDefense));
    }
}