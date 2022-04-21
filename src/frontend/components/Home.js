import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import "../components/Styles/App.css";

const Home = ({ marketplace, nft }) => {
	// List all the marketplace items

	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);
	const loadMarketplaceItems = async () => {
		const itemCount = await marketplace.itemCount();
		let items = [];
		for (let i = 1; i <= itemCount; i++) {
			const item = await marketplace.items(i);
			if (!item.sold) {
				// Fetch unsold items
				// Get the uri url from the nft
				const uri = await nft.tokenURI(item.tokenId);
				// Use the uri to fetch the nft metadata stored on ipfs
				const response = await fetch(uri);
				const metadata = await response.json();
				// Get total price of item (price + fees)
				const totalPrice = await marketplace.getTotalPrice(item.itemId);
				// Add item to items array
				items.push({
					totalPrice,
					itemId: item.itemId,
					seller: item.seller,
					name: metadata.name,
					description: metadata.description,
					image: metadata.image,
				});
			}
		}
		setLoading(false);
		setItems(items);
	};

	const buyMarketItems = async (item) => {
		await (
			await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })
		).wait(); // Wait for the transaction to be confirmed
		loadMarketplaceItems();
	};

	useEffect(() => {
		loadMarketplaceItems();
	});

	if (loading)
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "80vh",
				}}
			>
				<Spinner
					className="spinner"
					as="span"
					animation="grow"
					size="lg"
					role="status"
					aria-hidden="true"
				/>
				Loading...
			</div>
		);

	return (
		<div className="flex justify-content">
			{items.length > 0 ? (
				<div className="px-5 container">
					<Row xs={1} md={2} lg={4} className="g-4 py-5">
						{items.map((item, idx) => (
							<Col key={idx} className="overflow-hidden">
								<Card border="light" bg="dark">
									<Card.Img variant="top" src={item.image} />
									<Card.Body color="secondary">
										<Card.Title style={{ color: "#eee" }}>
											{item.name}
										</Card.Title>
										<Card.Text style={{ color: "#eee" }}>
											{item.description}
										</Card.Text>
									</Card.Body>
									<Card.Footer>
										<div className="d-grid">
											<Button
												onClick={() => buyMarketItems(item)}
												variant="secondary"
												size="md"
											>
												Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
											</Button>
										</div>
									</Card.Footer>
								</Card>
							</Col>
						))}
					</Row>
				</div>
			) : (
				<main style={{ padding: "1rem 0" }}>
					<h2>No listed assets</h2>
				</main>
			)}
		</div>
	);
};
export default Home;
