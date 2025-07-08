// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract AthleteCredential is ERC721URIStorage, Ownable {
    enum Status { Active, Revoked, Ineligible }

    struct CredentialData {
        string did;
        string vcIpfsHash;
        bytes32 biometricHash;
        Status status;
        string revokeReason;
    }

    event CredentialMinted(uint256 indexed tokenId, address indexed to, string did, string vcIpfsHash, bytes32 biometricHash, string tokenURI);
    event CredentialRevoked(uint256 indexed tokenId, string reason, uint256 revokedAt);
    event StatusChanged(uint256 indexed tokenId, Status newStatus, string reason, uint256 changedAt);

    uint256 private _totalSupply = 0;
    mapping(uint256 => CredentialData) private _credentials;

    constructor() ERC721("AthleteCredential", "ATHCRED") Ownable(msg.sender) {}

    function mintCredential(
        address to,
        string memory did,
        string memory vcIpfsHash,
        bytes32 biometricHash,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _totalSupply + 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _credentials[tokenId] = CredentialData({
            did: did,
            vcIpfsHash: vcIpfsHash,
            biometricHash: biometricHash,
            status: Status.Active,
            revokeReason: ""
        });
        _totalSupply += 1;
        emit CredentialMinted(tokenId, to, did, vcIpfsHash, biometricHash, tokenURI);
        return tokenId;
    }

    function revokeCredential(uint256 tokenId, string memory reason) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(_credentials[tokenId].status == Status.Active, "Credential not active");
        _credentials[tokenId].status = Status.Revoked;
        _credentials[tokenId].revokeReason = reason;
        emit CredentialRevoked(tokenId, reason, block.timestamp);
        emit StatusChanged(tokenId, Status.Revoked, reason, block.timestamp);
    }

    function setStatus(uint256 tokenId, Status newStatus, string memory reason) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _credentials[tokenId].status = newStatus;
        _credentials[tokenId].revokeReason = reason;
        emit StatusChanged(tokenId, newStatus, reason, block.timestamp);
    }

    function getCredential(uint256 tokenId) public view returns (
        string memory did,
        string memory vcIpfsHash,
        bytes32 biometricHash,
        Status status,
        string memory revokeReason
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        CredentialData memory cred = _credentials[tokenId];
        return (cred.did, cred.vcIpfsHash, cred.biometricHash, cred.status, cred.revokeReason);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    // --- Soulbound/Non-transferable logic ---
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Block all transfers except mint (from == 0) and admin (owner)
        if (from != address(0) && from != owner()) {
            revert("Transfers are disabled (soulbound)");
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address to, uint256 tokenId) public override(ERC721, IERC721) {
        revert("Approvals are disabled (soulbound)");
    }

    function setApprovalForAll(address operator, bool approved) public override(ERC721, IERC721) {
        revert("Approvals are disabled (soulbound)");
    }
} 