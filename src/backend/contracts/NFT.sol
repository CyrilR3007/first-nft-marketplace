// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount = 0;

    constructor() ERC721("DApp NFT", "DAPP"){}

    function mint(string memory _tokenURI) external returns (uint) { //Needs to be called on the outside => external.
      tokenCount ++;
      _safeMint(msg.sender, tokenCount); 
      _setTokenURI(tokenCount, _tokenURI);//Set a metadata for the new NFT minted. 
      return(tokenCount);
    }
}