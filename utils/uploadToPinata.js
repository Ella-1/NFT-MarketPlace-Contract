const fs = require('fs');
const path = require('path');
const pinataSDK = require('@pinata/sdk');
require('dotenv').config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
    const fullImagePath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(fullImagePath);
    let responses = [];

    console.log('Uploading To IPFS');

    for (const file of files) {
        const filePath = path.join(fullImagePath, file);

        try {
            const readableStreamForFile = fs.createReadStream(filePath);
            const response = await pinata.pinFileToIPFS(readableStreamForFile, { pinataMetadata: { name: file } });
            responses.push(response);
        } catch (error) {
            console.error(`Error uploading file ${file}: ${error}`);
        }
    }

    return { responses, files };
}

async function storeTokenUriMetaData(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response.IpfsHash;
    } catch (error) {
        console.error(`Error uploading metadata: ${error}`);
    }

    return null;
}

module.exports = { storeImages, storeTokenUriMetaData };
