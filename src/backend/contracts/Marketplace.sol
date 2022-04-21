// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {

  //State variables
  //Keep track of
  address payable public immutable feeAccount; //the account that receives fees. Payable => can receive the ether fees
  uint public immutable feePercent; //the fee percentage on sales. 
  uint public itemCount;

  struct Item {
    uint itemId;
    IERC721 nft;
    uint tokenId;
    uint price;
    address payable seller;
    bool sold;
  }

  event Offered (
    uint itemId,
    address indexed nft,
    uint tokenId,
    uint price,
    address indexed seller
  );

  event Bought (
    uint itemId,
    uint tokenId,
    uint price,
    address indexed nft,
    address indexed buyer,
    address indexed seller
  );

  //ItemId -> Item
  mapping(uint => Item) public items;

  constructor(uint _feePercent) {
    feeAccount = payable (msg.sender); //Only the deployer can call this constructor.
    feePercent = _feePercent;
  }

  function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
    require(_price > 0, "Price should be greater than zero");
    
    itemCount ++;
    //transfer NFT
    _nft.transferFrom(msg.sender, address(this), _tokenId);
    //add new item to items mapping
    items[itemCount] = Item (
      itemCount,
      _nft,
      _tokenId,
      _price,
      payable (msg.sender),
      false
    );
    //emit Offered event
    emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
  }

  function purchaseItem(uint _itemId) external payable nonReentrant {
    uint _totalPrice = getTotalPrice(_itemId);
    Item storage item = items[_itemId];
    require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
    require(msg.value >= _totalPrice, "not enough ether to cover item price and market fees");
    require(!item.sold, "item already sold");
    //pay seller and feeAccount
    item.seller.transfer(item.price);
    feeAccount.transfer(_totalPrice - item.price);
    //update the item
    item.sold = true;
    //transfer nft to the buyer
    item.nft.transferFrom(address(this), msg.sender, item.tokenId);
    //emit a bought event
    emit Bought(_itemId, item.price, item.tokenId, address(item.nft), item.seller, msg.sender);
  }

  function getTotalPrice(uint _itemId) view public returns(uint) {//Price of the item set by the seller + the market fees. 
    return ((items[_itemId].price*(100 + feePercent)) / 100);
  }
}