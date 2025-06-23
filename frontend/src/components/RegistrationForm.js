import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import API_URL from '../apiConfig';

const RegistrationForm = () => {
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    school_id: '',
    sport: '',
  });
  const [files, setFiles] = useState({
    birthCertificate: null,
    selfie: null,
  });
  const [message, setMessage] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_URL}/schools`);
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
        } else {
          setMessage({ type: 'danger', text: 'Failed to load schools.' });
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setMessage({ type: 'danger', text: 'System unavailable: Could not load schools.' });
      }
    };
    fetchSchools();
  }, []);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setRegistrationResult(null);
    setIsLoading(true);

    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    data.append('birthCertificate', files.birthCertificate);
    data.append('selfie', files.selfie);

    try {
      const response = await fetch(`${API_URL}/register-athlete`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setRegistrationResult(result);
        setFormData({ name: '', dob: '', gender: 'Male', school_id: '', sport: '' });
        setFiles({ birthCertificate: null, selfie: null });
        e.target.reset();
      } else {
        setMessage({ type: 'danger', text: result.message || 'An error occurred.' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'danger', text: 'An unexpected error occurred during submission.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header as="h3" className="text-center bg-dark text-white">
              Athlete Registration
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h4 className="card-title mb-1">Create a Secure Digital Identity</h4>
                <p className="text-muted">
                  Register an athlete to generate a tamper-proof digital ID on the blockchain.
                </p>
              </div>

              {message && <Alert variant={message.type}>{message.text}</Alert>}

              {registrationResult && (
                <Alert variant="success" className="text-center">
                  <Alert.Heading>
                    <i className="bi bi-check-circle-fill me-2"></i>Registration Complete!
                  </Alert.Heading>
                  <p>The athlete's digital identity has been created successfully.</p>
                  <hr />
                  <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
                    <div className="p-2 border rounded me-md-3 mb-3 mb-md-0 bg-white">
                      <QRCode value={registrationResult.did} size={140} />
                    </div>
                    <div className="text-start">
                      <p className="mb-2">
                        <strong>Athlete DID:</strong>
                      </p>
                      <code className="d-block bg-light p-2 rounded mb-3" style={{ wordBreak: 'break-all' }}>
                        {registrationResult.did}
                      </code>
                      <p className="mb-2">
                        <strong>Proof (IPFS Hash):</strong>
                      </p>
                      <code className="d-block bg-light p-2 rounded" style={{ wordBreak: 'break-all' }}>
                        {registrationResult.ipfs_hash}
                      </code>
                    </div>
                  </div>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="fullName">
                      <Form.Label>
                        <i className="bi bi-person-fill me-2"></i>Full Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleTextChange}
                        required
                        placeholder="e.g., John Doe"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="dob">
                      <Form.Label>
                        <i className="bi bi-calendar-event-fill me-2"></i>Date of Birth
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleTextChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="sport">
                      <Form.Label>
                        <i className="bi bi-trophy-fill me-2"></i>Sport
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="sport"
                        value={formData.sport}
                        onChange={handleTextChange}
                        required
                        placeholder="e.g., Soccer, Rugby"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="school">
                      <Form.Label>
                        <i className="bi bi-building-fill me-2"></i>School
                      </Form.Label>
                      <Form.Select
                        name="school_id"
                        value={formData.school_id}
                        onChange={handleTextChange}
                        required
                      >
                        <option value="" disabled>
                          Select a school...
                        </option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="birthCertificate">
                      <Form.Label>
                        <i className="bi bi-file-earmark-text-fill me-2"></i>Birth Certificate (PDF)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="birthCertificate"
                        onChange={handleFileChange}
                        accept="application/pdf"
                        required
                      />
                      <Form.Text>Upload a clear, official PDF copy.</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="selfie">
                      <Form.Label>
                        <i className="bi bi-camera-fill me-2"></i>Athlete's Selfie
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="selfie"
                        onChange={handleFileChange}
                        accept="image/jpeg, image/png"
                        required
                      />
                      <Form.Text>A clear, forward-facing photo for biometric verification.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid mt-4">
                  <Button variant="primary" type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Generating Secure ID...
                      </>
                    ) : (
                      'Create Secure ID'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegistrationForm; 