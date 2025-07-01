import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
  InputGroup,
  ListGroup,
  OverlayTrigger,
  Tooltip,
  Accordion,
} from 'react-bootstrap';
import API_URL from '../apiConfig';

const VerificationPage = () => {
  const [did, setDid] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage(null);
    setVerificationResult(null);
    setConsentError(null);
    if (!consent) {
      setConsentError('You must consent to the Privacy Policy to verify.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    if (!did) {
      setMessage({ type: 'warning', text: 'Please enter a DID to verify.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/verify/${did}`);
      const result = await response.json();

      if (response.ok) {
        setVerificationResult(result);
        setMessage(null);
      } else {
        setVerificationResult(null);
        setMessage({ type: 'danger', text: result.message || 'Verification failed.' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage({ type: 'danger', text: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const renderResult = () => {
    if (!verificationResult && !message) return null;

    if (message && message.type === 'danger') {
      return (
        <Card className="mt-4 shadow-sm border-neon-pink" border="danger">
          <Card.Header className="bg-neon-pink text-clean-white">
            <h5 className="mb-0">
              <i className="bi bi-x-octagon-fill me-2 text-alert-red"></i>Verification Failed
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="danger" className="mb-0 bg-neon-pink text-clean-white border-neon-pink">{message.text}</Alert>
          </Card.Body>
        </Card>
      );
    }

    if (verificationResult) {
      // Determine badge color
      let badgeVariant = 'bg-neon-green text-deep-navy';
      if (verificationResult.eligibility === 'Ineligible') badgeVariant = 'bg-neon-pink text-clean-white';
      if (verificationResult.eligibility === 'Revoked') badgeVariant = 'bg-alert-red text-clean-white';
      return (
        <Card className="mt-4 shadow-sm border-neon-blue">
          <Card.Header className="bg-neon-blue text-deep-navy">
            <h5 className="mb-0">
              <i className="bi bi-patch-check-fill me-2 text-neon-green"></i>Credential Verified
            </h5>
          </Card.Header>
          <Card.Body className="bg-charcoal-gray text-clean-white">
            <ListGroup variant="flush">
              <ListGroup.Item className="bg-charcoal-gray text-clean-white"><strong>Name:</strong> {verificationResult.name}</ListGroup.Item>
              <ListGroup.Item className="bg-charcoal-gray text-clean-white"><strong>Age:</strong> {verificationResult.age}</ListGroup.Item>
              <ListGroup.Item className="bg-charcoal-gray text-clean-white"><strong>Date of Birth:</strong> {new Date(verificationResult.dob).toLocaleDateString()}</ListGroup.Item>
              <ListGroup.Item className="bg-charcoal-gray text-clean-white"><strong>Sport:</strong> {verificationResult.sport}</ListGroup.Item>
              <ListGroup.Item className="bg-charcoal-gray text-clean-white"><strong>Eligibility Status:</strong> {' '}
                <span className={`badge ${badgeVariant} ms-2`} style={{ fontSize: '1em' }}>
                  {verificationResult.eligibility}
                </span>
                {verificationResult.eligibility === 'Eligible' && (
                  <div className="mt-2 text-neon-green">
                    <i className="bi bi-patch-check-fill me-1"></i>
                    This athlete's age and identity are verified and compliant with national policy.
                  </div>
                )}
                {verificationResult.eligibility === 'Ineligible' && (
                  <div className="mt-2 text-alert-red">
                    <i className="bi bi-x-octagon-fill me-1"></i>
                    This credential is ineligible. Please check the details or contact an official.
                  </div>
                )}
                {verificationResult.eligibility === 'Revoked' && verificationResult.revocationReason && (
                  <div className="mt-2 text-alert-red">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    <strong>Revocation Reason:</strong> {verificationResult.revocationReason}
                  </div>
                )}
              </ListGroup.Item>
              <ListGroup.Item className="bg-charcoal-gray text-clean-white text-muted">
                <small><strong className="text-neon-blue">DID:</strong> <code className="bg-light p-1 rounded text-neon-blue">{verificationResult.did}</code></small>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="text-center py-5 bg-deep-navy min-vh-100">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-neon-blue">Loading Verification...</p>
      </div>
    );
  }

  return (
    <Container className="my-5 bg-deep-navy min-vh-100 py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm bg-charcoal-gray text-clean-white border-neon-blue">
            <Card.Header as="h3" className="text-center bg-neon-blue text-deep-navy">
              <i className="bi bi-search me-2 text-neon-pink"></i> Verify Athlete Credential
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-center text-muted mb-4">
                Instantly verify an athlete's age and status using their Digital ID.
              </p>
              <Form onSubmit={handleVerify}>
                <InputGroup className="mb-3">
                  <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip id="did-tooltip">A Decentralized Identifier (DID) is a digital ID you control, secured by blockchain. Enter or scan the athlete's DID to verify their credential.</Tooltip>}
                  >
                    <Form.Control
                      size="lg"
                      type="text"
                      id="did"
                      value={did}
                      onChange={(e) => setDid(e.target.value)}
                      placeholder="did:key:..."
                      aria-label="Athlete's Digital ID"
                      required
                      style={{ zIndex: 2 }}
                    />
                  </OverlayTrigger>
                  <Button className="bg-neon-blue text-deep-navy border-neon-blue" type="submit" size="lg" disabled={isLoading || !consent} style={{ fontWeight: 600 }}>
                    {isLoading ? (
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="text-neon-pink" />
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </Button>
                </InputGroup>
                <Form.Group className="mb-3" controlId="consentCheckbox">
                  <Form.Check
                    type="checkbox"
                    label={<span>I consent to the processing of this DID according to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-blue">Privacy Policy</a>.</span>}
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    required
                  />
                  {consentError && <div className="text-alert-red mt-2">{consentError}</div>}
                </Form.Group>
              </Form>

              {message && message.type === 'warning' && (
                  <Alert variant="warning" className="mt-3 bg-accent-yellow text-deep-navy border-neon-pink">
                      {message.text}
                  </Alert>
              )}

            </Card.Body>
          </Card>
          {renderResult()}
          <Accordion className="mt-4" defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>How It Works</Accordion.Header>
              <Accordion.Body>
                <ul>
                  <li><strong>Blockchain Security:</strong> Every athlete receives a tamper-proof digital ID (DID) and verifiable credential, cryptographically signed and stored on IPFS.</li>
                  <li><strong>Biometric Uniqueness:</strong> Your selfie is converted to a secure biometric hash—no raw images are stored. This prevents duplicate or fraudulent registrations.</li>
                  <li><strong>Audit Logs:</strong> All verifications, issuances, and revocations are immutably logged for transparency and compliance.</li>
                  <li><strong>Privacy First:</strong> Only authorized officials can access your data, and all sensitive information is encrypted.</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
};

export default VerificationPage; 