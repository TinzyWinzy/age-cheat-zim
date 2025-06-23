import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const AppNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <i className="bi bi-shield-check me-2"></i>
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar; 