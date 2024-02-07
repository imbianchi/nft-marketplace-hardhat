// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract NFT is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("DApp NFT", "DAPP") {}

    function mint(string memory _tokenURI) external returns(uint) {
        uint256 tokenId = _nextTokenId + 1;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        _nextTokenId = tokenId;

        console.log("Minted token with ID %s and URI %s ---------------------------------------", tokenId, _tokenURI);
        return tokenId;
    }

    function tokensCount() external view returns(uint) {
        return _nextTokenId;
    }
}