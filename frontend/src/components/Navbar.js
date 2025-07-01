import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Modal, Button } from 'react-bootstrap';

const HelpModal = ({ show, handleClose }) => (
  <Modal show={show} onHide={handleClose} centered>
    <Modal.Header closeButton>
      <Modal.Title>Help & FAQ</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h5>What is AgeTrust?</h5>
      <p>AgeTrust Zimbabwe is a national platform to verify athlete age and identity, ensuring fair play and compliance with Ministry of Sport policy. Powered by blockchain and biometrics.</p>
      <h5>What is a DID?</h5>
      <p>A Decentralized Identifier (DID) is a digital ID you control, secured by blockchain.</p>
      <h5>What is a Verifiable Credential?</h5>
      <p>A digital certificate proving your age, identity, and eligibility—cryptographically signed and tamper-proof.</p>
      <h5>How is my privacy protected?</h5>
      <p>We use encryption and only store biometric hashes, never raw images. Only authorized officials can access your data.</p>
      <h5>What if my credential is revoked?</h5>
      <p>You'll see a red status. Contact your school or the Ministry for support.</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleClose}>Close</Button>
    </Modal.Footer>
  </Modal>
);

const AppNavbar = () => {
  const [showHelp, setShowHelp] = useState(false);
  const handleHelpOpen = () => setShowHelp(true);
  const handleHelpClose = () => setShowHelp(false);

  return (
    <Navbar className="bg-deep-navy" variant="dark" expand="lg" sticky="top">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="text-neon-blue">
            <i className="bi bi-shield-check me-2 text-neon-pink"></i>
            AgeTrust Zimbabwe
          </Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <LinkContainer to="/register">
              <Nav.Link>Register Athlete</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/verify">
              <Nav.Link>Verify ID</Nav.Link>
            </LinkContainer>
            <NavDropdown title="Monitoring" id="monitoring-dropdown">
                <LinkContainer to="/dashboard">
                    <NavDropdown.Item>Dashboard</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to="/logs">
                    <NavDropdown.Item>Blockchain Logs</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to="/fraud-alerts">
                    <NavDropdown.Item>Fraud Alerts</NavDropdown.Item>
                </LinkContainer>
            </NavDropdown>
            <Nav.Link onClick={handleHelpOpen} className="d-flex align-items-center">
              <i className="bi bi-question-circle-fill me-1 text-accent-yellow" /> Help
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
      <HelpModal show={showHelp} handleClose={handleHelpClose} />
    </Navbar>
  );
};

export default AppNavbar; 