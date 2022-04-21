import { Link } from "react-router-dom";
import { Navbar, Nav, Button, Container, NavbarBrand } from "react-bootstrap";
import NavbarToggle from "react-bootstrap/esm/NavbarToggle";
import NavbarCollapse from "react-bootstrap/esm/NavbarCollapse";
import logo from "../components/Assets/alien.png";
import "../components/Styles/Darkmode.css";
import DarkMode from "./DarkMode";

const Navigation = ({ web3Handler, account }) => {
	return (
		<Navbar expand="lg" variant="dark">
			<Container>
				<NavbarBrand>
					<img src={logo} width="50" height="50" className="" alt="logo" />
					Marketplace
				</NavbarBrand>
				<NavbarToggle aria-controls="responsive-navbar-nav" />
				<NavbarCollapse id="responsive-navbar-nav">
					<Nav className="me-auto">
						<Nav.Link as={Link} to="/">
							Home
						</Nav.Link>
						<Nav.Link as={Link} to="/create">
							Create
						</Nav.Link>
						<Nav.Link as={Link} to="/my-listed-items">
							My Listed Items
						</Nav.Link>

						<DarkMode />
					</Nav>
					<Nav>
						{account ? (
							<Nav.Link
								href={`https://etherscan.io/address/${account}`}
								target="_blank"
								rel="noopener noreferrer"
								className="button nav-button btn-sm mx-4"
							>
								<Button variant="outline-light">
									{account.slice(0, 5) + "..." + account.slice(38, 42)}
								</Button>
							</Nav.Link>
						) : (
							<Button onClick={web3Handler} variant="outline-light">
								Connect Wallet
							</Button>
						)}
					</Nav>
				</NavbarCollapse>
			</Container>
		</Navbar>
	);
};
export default Navigation;
