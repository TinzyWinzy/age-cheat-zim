// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TeamCardNFT is ERC721URIStorage, Ownable {
    event CardRevoked(uint256 indexed tokenId, string reason, uint256 revokedAt);

    uint256 private _totalSupply = 0;

    constructor() ERC721("TeamCardNFT", "TCARD") Ownable(msg.sender) {}

    function mintCard(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _totalSupply + 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _totalSupply += 1;
        return tokenId;
    }

    function revokeCard(uint256 tokenId, string memory reason) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        emit CardRevoked(tokenId, reason, block.timestamp);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
} 