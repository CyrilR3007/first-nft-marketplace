import { useState } from "react";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";
import { create as ipfsHttpClient } from "ipfs-http-client";
import "../components/Styles/App.css";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const Create = ({ marketplace, nft }) => {
	// Keep track of
	const [image, setImage] = useState("");
	const [price, setPrice] = useState(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	// Triggered when there is a change to the file input field on the Create form.
	const uploadToIPFS = async (event) => {
		event.preventDefault();
		const file = event.target.files[0];
		if (typeof file !== "undefined") {
			try {
				// Upload the image to ipfs
				const result = await client.add(file);
				console.log(result);
				setImage(`https://ipfs.infura.io/ipfs/${result.path}`);
			} catch (error) {
				console.log("ipfs image upload error : ", error);
			}
		}
	};

	const createNFT = async () => {
		// Check if all is filled out
		if (!image || !price || !name || !description) return;
		try {
			const result = await client.add(
				JSON.stringify({ image, price, name, description })
			);
			mintThenList(result);
		} catch (error) {
			console.log("ipfs uri upload error: ", error);
		}
	};

	const mintThenList = async (result) => {
		const uri = `https://ipfs.infura.io/ipfs/${result.path}`;
		// Mint nft
		await (await nft.mint(uri)).wait();
		// get tokenId of new nft
		const id = await nft.tokenCount();
		// approve marketplace to spend nft
		await (await nft.setApprovalForAll(marketplace.address, true)).wait();
		// add nft to marketplace
		const listingPrice = ethers.utils.parseEther(price.toString());
		await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
	};

	return (
		<div className="container-fluid mt-5">
			<div className="row">
				<main
					role="main"
					className="col-lg-12 mx-auto"
					style={{ maxWidth: "1000px" }}
				>
					<div
						className="content mx-auto"
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							paddingLeft: "10px",
							paddingRight: "10px",
						}}
					>
						<Row className="g-4">
							<Form.Control // Users will uploads there NFT images
								type="file"
								required
								name="file"
								onChange={uploadToIPFS} // Whenever there is a change to this field -> ipfs function triggered
							/>
							<Form.Control
								onChange={(e) => setName(e.target.value)}
								size="lg"
								required
								type="text"
								placeholder="Name"
							/>
							<Form.Control
								onChange={(e) => setDescription(e.target.value)}
								size="lg"
								required
								as="textarea"
								placeholder="Description"
							/>
							<Form.Control
								onChange={(e) => setPrice(e.target.value)}
								size="lg"
								required
								type="number"
								placeholder="Price in ETH"
							/>
							<div className="d-grid px-0">
								<Button
									className="spinner"
									style={{
										display: "flex",
										justifyContent: "center",
										border: "5px",
									}}
									onClick={createNFT}
									size="lg"
								>
									Create & List NFT!
								</Button>
							</div>
						</Row>
					</div>
				</main>
			</div>
		</div>
	);
};
export default Create;
