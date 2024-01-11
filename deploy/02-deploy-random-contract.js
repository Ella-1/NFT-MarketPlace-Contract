const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { storeImages, storeTokenUriMetaData } = require('../utils/uploadToPinata');
// const { TASK_ETHERSCAN_VERIFY } = require("hardhat-deploy");

const { deployments, getNamedAccounts } = require("hardhat");
const { verify } = require('../utils/verify')
let tokenUris = [
    'ipfs://QmTvL9ZejjXfAWnNwkeyC81xsgZpJj1VN3quq5mQBGgNXR',
    'ipfs://QmTeZbkzWNh2RZvDwFM9VnAF8qKD1nnmYCxsyUtAiJhJmh',
    'ipfs://QmdRSGptdHW2vt8CF4XmFr1yS4mFmDovmErAGW4kQ5Z6WG'
]


const imagesLocation = './images/randomNft'
// metadata for token URI
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "cuteness",
            value: 100,
        }
    ]
}

FUND_AMOUNT = "1000000000000000000000"

module.exports = async function () {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }


    let vrfCoordinatorV2Address, suscriptionId
    // grt the IPFS hashes of our image
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        // console.log("VRFCoordinatorV2Mock Address:", vrfCoordinatorV2Mock.address);
        if (!networkConfig[chainId]) {
            throw new Error(`No configuration found for chainId ${chainId}`);
        }
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        // console.log("Transaction Hash:", tx.hash);

        const txReceipt = await tx.wait(1);
        // console.log("Transaction Receipt:", txReceipt);

        suscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(suscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        suscriptionId = networkConfig[chainId].subscriptionId;
    }

    // console.log("VRF Coordinator Address:", vrfCoordinatorV2Address);
    // console.log("Subscription ID:", suscriptionId);


    log("-----------------------------------------")
    const argguments = [
        vrfCoordinatorV2Address,
        suscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].mintFee,
        tokenUris,
        networkConfig[chainId].callbackGasLimit
    ]
    // await storeImages(imagesLocation)

    const { randomIpfsNft } = await deploy("RandomIpfsNft", {
        from: deployer,
        args: argguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    console
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifing...");
        await verify(randomIpfsNft,);
    }
    log("---------------------------------------  ")
}


async function handleTokenUris() {
    tokenUris = [];
    let imageUploadResponsesIndex

    // store the image in IPFS
    // store the metsdata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponsesIndex in imageUploadResponses) {
        // create metadata
        // upload metadata
        let tokenUriMetadata = { ...metadataTemplate } // syntax sugar which means unpack
        tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} Pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        // store the json to pinata IPFS
        const metadataUploadResponse = await storeTokenUriMetaData(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse}`)
    }
    console.log("Token UIS Uploaded! they are");
    console.log(tokenUris)
    return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"]