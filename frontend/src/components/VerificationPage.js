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
} from 'react-bootstrap';
import API_URL from '../apiConfig';

const VerificationPage = () => {
  const [did, setDid] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage(null);
    setVerificationResult(null);
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
        <Card className="mt-4 shadow-sm" border="danger">
          <Card.Header className="bg-danger text-white">
            <h5 className="mb-0">
              <i className="bi bi-x-octagon-fill me-2"></i>Verification Failed
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="danger" className="mb-0">{message.text}</Alert>
          </Card.Body>
        </Card>
      );
    }

    if (verificationResult) {
      return (
        <Card className="mt-4 shadow-sm" border="success">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-patch-check-fill me-2"></i>Credential Verified
            </h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Name:</strong> {verificationResult.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Age:</strong> {calculateAge(verificationResult.dob)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Date of Birth:</strong> {new Date(verificationResult.dob).toLocaleDateString()}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Sport:</strong> {verificationResult.sport}
              </ListGroup.Item>
              <ListGroup.Item className="text-muted">
                <small><strong>DID:</strong> <code className="bg-light p-1 rounded">{verificationResult.did}</code></small>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      );
    }
    
    return null;
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header as="h3" className="text-center bg-dark text-white">
              Verify Athlete Credential
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-center text-muted mb-4">
                Instantly verify an athlete's age and status using their Digital ID.
              </p>
              <Form onSubmit={handleVerify}>
                <InputGroup className="mb-3">
                  <Form.Control
                    size="lg"
                    type="text"
                    id="did"
                    value={did}
                    onChange={(e) => setDid(e.target.value)}
                    placeholder="did:key:..."
                    aria-label="Athlete's Digital ID"
                    required
                  />
                  <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </Button>
                </InputGroup>
              </Form>

              {message && message.type === 'warning' && (
                  <Alert variant="warning" className="mt-3">
                      {message.text}
                  </Alert>
              )}

            </Card.Body>
          </Card>
          
          {renderResult()}

        </Col>
      </Row>
    </Container>
  );
};

export default VerificationPage; 