const { ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const DECIMALS = "18";
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether")

module.exports = async function (hre) {
    const { deployments, getNamedAccounts, network } = hre;
    const BASE_FEE = "250000000000000000";
    const GAS_PRICE_LINK = 1e9;

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts(); // Get the actual address from the deployer object
    // console.log("Deployer:", deployer); // Add this line to log deployer

    const args = [BASE_FEE, GAS_PRICE_LINK];

    if (developmentChains.includes(network.name)) {
        log("Local network detected deploying mocks...");
        await deploy('VRFCoordinatorV2Mock', {
            from: deployer,
            log: true,
            args: args,
        });
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE]
        })
        log("Mocks Deployed!!");
        log("----------------------------------------------------");
    }
}

module.exports.tags = ["all", "mocks"];
