// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// errors
error RandomIpfsNft_RangrOutOfBounds();
error RandomIpfsNft_NeedMoreEth();
error RandomIpfsNft_TransFerFail();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // when we mint an NFT, we trigger a chailink VRF call to get us a random number
    // using that random number we will get an random nft
    // pug, shiba Inu, st . Benaard
    // pug super rare
    // shiba sort of rare
    // st beneard very common

    // users have to pay to mint an nft
    // owner of the contract can withdraw payment for nft
    VRFCoordinatorV2Interface immutable i_vrfCordinator;
    uint64 private immutable i_suscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[3] internal s_dogTokenUris;
    uint256 immutable i_mintFee;
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBrees, address minter);

    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BENEARD
    }

    constructor(
        address vrfCoordinatorV2,
        uint64 suscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_suscriptionId = suscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        dogTokenUris = s_dogTokenUris;
        i_mintFee = mintFee;
    }

    // request a random number for our random nft
    function requestNft() public payable returns (uint256 requestId) {
        //    ensures users pay a swcific amount before minting
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft_NeedMoreEth();
        }

        requestId = i_vrfCordinator.requestRandomWords(
            i_gasLane,
            i_suscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        // mapping eachuser that mint based on the random number generated
        s_requestIdToSender[requestId] = msg.sender;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomwords
    ) internal override {
        // make each owner the owner of the inted nft
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        // mint each nft based on random words developed

        // what does this token loookes like
        uint256 moddedRng = randomwords[0] % MAX_CHANCE_VALUE;

        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        s_tokenCounter += s_tokenCounter;
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
        emit NftMinted(dogBreed, dogOwner);
    }

    // function that gets the structure of distribution of several dogs nft;
    function getBreedFromModdedRng(
        uint256 moddedRng
    ) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedRng >= cumulativeSum &&
                moddedRng < cumulativeSum + chanceArray[i]
            ) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft_RangrOutOfBounds();
    }

    // a function that give structures of array of diffrent nfts
    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft_TransFerFail();
        }
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getTokenURi(uint256 indexId) public view returns (string memory) {
        return s_dogTokenUris[indexId];
    }

    // function tokenURI(uint256) public view override returns (string memory) {}
}
