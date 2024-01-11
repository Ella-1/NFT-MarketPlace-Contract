const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { storeImages, storeTokenUriMetaData } = require('../utils/uploadToPinata');
const fs = require('fs')
const path = require('path');

const { deployments, getNamedAccounts } = require("hardhat");
const { verify } = require('../utils/verify')


module.exports = async function () {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    log("----------------------------------------")
    const lowSvg = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf-8" });
    const highSvg = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf-8" });
    args = [ethUsdPriceFeedAddress, lowSvg, highSvg];
    const dynamicSvgNft = await deploy("DyamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifiying...")
        await verify(dynamicSvgNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicsvg", "tags"];
