# RouteX 合约部署和测试 Makefile

# 环境变量
-include .env

# 默认网络配置
NETWORK ?= monad
RPC_URL ?= https://monad-rpc-endpoint

# 编译合约
build:
	forge build

# 清理构建文件
clean:
	forge clean

# 运行测试
test:
	forge test -vvv

# 部署到本地测试网络
deploy-local:
	forge script script/Deploy.s.sol:DeployScript --fork-url http://localhost:8545 --broadcast

# 部署到 Monad 测试网
deploy-testnet:
	forge script script/Deploy.s.sol:DeployScript --rpc-url $(RPC_URL) --broadcast --verify

# 部署到 Monad 主网
deploy-mainnet:
	@echo "WARNING: 这将部署到主网！请确认您已经准备好。"
	@read -p "继续部署到主网？(y/N): " confirm && [ "$$confirm" = "y" ]
	forge script script/Deploy.s.sol:DeployScript --rpc-url $(RPC_URL) --broadcast --verify

# 格式化代码
fmt:
	forge fmt

# 检查代码格式
fmt-check:
	forge fmt --check

# 安装依赖
install:
	forge install OpenZeppelin/openzeppelin-contracts@v4.9.0
	forge install Uniswap/v3-core
	forge install Uniswap/v3-periphery
	forge install foundry-rs/forge-std

# 更新依赖
update:
	forge update

# 生成 Gas 报告
gas-report:
	forge test --gas-report

# 检查合约大小
size-check:
	forge build --sizes

# 运行安全审计工具（如果安装了 slither）
audit:
	@which slither > /dev/null || (echo "请先安装 slither: pip install slither-analyzer" && exit 1)
	slither .

# 生成文档
docs:
	forge doc

# 快速开发工作流
dev: clean build test

# 完整部署流程（测试网）
full-deploy-testnet: clean build test deploy-testnet

.PHONY: build clean test deploy-local deploy-testnet deploy-mainnet fmt fmt-check install update gas-report size-check audit docs dev full-deploy-testnet