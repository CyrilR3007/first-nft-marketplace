const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function () {
	let deployer, addr1, addr2, nft, marketplace;
	let feePercent = 1;
	let URI = "Sample URI";

	beforeEach(async function () {
		//Get contracts factories
		const NFT = await ethers.getContractFactory("NFT");
		const Marketplace = await ethers.getContractFactory("Marketplace");

		//Get signers of each test accounts. Signed and send transactions to the ETH network
		[deployer, addr1, addr2] = await ethers.getSigners();

		//Deploy contracts
		nft = await NFT.deploy();
		marketplace = await Marketplace.deploy(feePercent);
	});
	describe("Deployment", function () {
		it("Should track name and symbol of the nft collection", async function () {
			expect(await nft.name()).to.equal("DApp NFT");
			expect(await nft.symbol()).to.equal("DAPP");
		});
		it("Should track feeAccount and feePercent of the marketplace", async function () {
			expect(await marketplace.feePercent()).to.equal(feePercent);
			expect(await marketplace.feeAccount()).to.equal(deployer.address);
		});
	});
	describe("Minting NFTs", function () {
		//Test the minting function of the NFT contract
		it("Should track each minting NFT", async function () {
			//addr1 will mints an nft
			await nft.connect(addr1).mint(URI); //Connect their account to the NFT contract and call the mint function passing the URI for it
			expect(await nft.tokenCount()).to.equal(1);
			expect(await nft.balanceOf(addr1.address)).to.equal(1);
			expect(await nft.tokenURI(1)).to.equal(URI); //First token equal to the URI I set in the variable

			//addr2 mints an nft
			await nft.connect(addr2).mint(URI);
			expect(await nft.tokenCount()).to.equal(2); //Token count increases to two
			expect(await nft.balanceOf(addr2.address)).to.equal(1);
			expect(await nft.tokenURI(2)).to.equal(URI);
		});
	});
	describe("Making marketplace items", function () {
		let price = 1;
		beforeEach(async function () {
			//addr1 mints an nft
			await nft.connect(addr1).mint(URI);
			//addr1 approves marketplace to spend nft
			await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
		});
		it("Should track newly created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
			//adrr1 offers their nft at a price of one ETH
			await expect(
				marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price))
			)
				.to.emit(marketplace, "Offered")
				.withArgs(1, nft.address, 1, toWei(price), addr1.address);
			//Owner of NFT should be the marketplace
			expect(await nft.ownerOf(1)).to.equal(marketplace.address);
			//Item count on the marketplace = 1
			expect(await marketplace.itemCount()).to.equal(1);
			//Get item from items mapping then check fields to ensure they are correct
			const item = await marketplace.items(1);
			expect(item.itemId).to.equal(1);
			expect(item.nft).to.equal(nft.address);
			expect(item.tokenId).to.equal(1);
			expect(item.price).to.equal(toWei(price));
			expect(item.sold).to.equal(false);
		});
		it("Should fail if the price is equal to zero", async function () {
			await expect(
				marketplace.connect(addr1).makeItem(nft.address, 1, 0)
			).to.be.revertedWith("Price should be greater than zero");
		});
	});
	describe("Purchasing marketplace item", function () {
		let price = 2;
		let totalPriceInWei;
		const fee = (feePercent / 100) * price;
		beforeEach(async function () {
			//addr1 mints an nft
			await nft.connect(addr1).mint(URI);
			//addr1 approves marketplace to spend nft
			await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
			//addr 1 makes the nft a marketplace item
			await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price));
		});
		it("Should update item as sold, pay the seller, transfer the NFT to the buyer, charge fees and emit a Bought event", async function () {
			const sellerInitialEthBal = await addr1.getBalance();
			const feeAccountInitialEthBal = await deployer.getBalance();
			//Fetch total price of the item (marketfees + itemprice)
			totalPriceInWei = await marketplace.getTotalPrice(1); //1 = ItemId
			//addr 2 purchases the item
			await expect(
				marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei })
			)
				.to.emit(marketplace, "Bought")
				.withArgs(
					1, //ItemId
					toWei(price),
					1, //TokenId
					nft.address,
					addr1.address, //seller
					addr2.address //buyer
				);
			const sellerFinalEthBal = await addr1.getBalance();
			const feeAccountFinalBal = await deployer.getBalance();
			//Seller should receive payment for the price of the NFT sold
			expect(+fromWei(sellerFinalEthBal)).to.equal(
				+price + +fromWei(sellerInitialEthBal)
			);
			//feeAccount should receive fee
			expect(+fromWei(feeAccountFinalBal)).to.equal(
				+fee + +fromWei(feeAccountInitialEthBal)
			);
			// The buyer is the new owner of the nft
			expect(await nft.ownerOf(1)).to.equal(addr2.address);
			// Item should be marked as sold
			expect((await marketplace.items(1)).sold).to.equal(true);
		});
		it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
			// Fails invali itemId
			await expect(
				marketplace.connect(addr2).purchaseItem(2, { value: totalPriceInWei })
			).to.be.revertedWith("item doesn't exist");
			await expect(
				marketplace.connect(addr2).purchaseItem(0, { value: totalPriceInWei })
			).to.be.revertedWith("item doesn't exist");
			// Not enough ether is paid with the transaction
			await expect(
				marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
			).to.be.revertedWith(
				"not enough ether to cover item price and market fees"
			);
			// addr2 purchases item 1
			await marketplace
				.connect(addr2)
				.purchaseItem(1, { value: totalPriceInWei });
			// deployer tries purchasing item 1 after its been sold
			await expect(
				marketplace
					.connect(deployer)
					.purchaseItem(1, { value: totalPriceInWei })
			).to.be.revertedWith("item already sold");
		});
	});
});
