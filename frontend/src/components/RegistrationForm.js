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
  ProgressBar,
  OverlayTrigger,
  Tooltip,
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
    sport: 'Soccer',
  });
  const [files, setFiles] = useState({
    birthCertificate: null,
    selfie: null,
  });
  const [message, setMessage] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(null);
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

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
    setConsentError(null);
    if (!consent) {
      setConsentError('You must consent to the Privacy Policy to register.');
      setIsLoading(false);
      return;
    }
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
        setFormData({ name: '', dob: '', gender: 'Male', school_id: '', sport: 'Soccer' });
        setFiles({ birthCertificate: null, selfie: null });
        e.target.reset();
        setShowSuccess(true);
      } else {
        if (response.status === 409) {
          setMessage({ type: 'danger', text: result.message });
        } else {
          setMessage({ type: 'danger', text: result.message || 'An error occurred.', detail: result.detail });
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'danger', text: 'An unexpected error occurred during submission.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Progress bar info
  const stepLabels = [
    'Enter Details',
    'Upload Documents',
    'Review & Submit',
  ];

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm bg-charcoal-gray text-clean-white border-neon-blue">
            <Card.Header as="h3" className="text-center bg-neon-blue text-deep-navy">
              <i className="bi bi-person-fill me-2 text-neon-pink"></i> Athlete Registration
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h4 className="card-title mb-1 text-neon-blue">Create a Secure Digital Identity</h4>
                <p className="text-muted">
                  Register an athlete to generate a tamper-proof digital ID on the blockchain.
                </p>
              </div>

              {message && (
                <Alert className={message.type === 'success' ? 'bg-neon-green text-deep-navy border-neon-green' : 'bg-neon-pink text-clean-white border-neon-pink'}>
                  {message.text}
                  {message.detail && (
                    <details className="mt-2">
                      <summary>Details (for developers)</summary>
                      <pre className="mb-0">{message.detail}</pre>
                    </details>
                  )}
                </Alert>
              )}

              {registrationResult && (
                <Alert variant="success" className="text-center bg-neon-green text-deep-navy border-neon-green">
                  <Alert.Heading>
                    <i className="bi bi-check-circle-fill me-2 text-neon-blue"></i>Registration Complete!
                  </Alert.Heading>
                  <p>The athlete's digital identity has been created successfully.</p>
                  <hr />
                  <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
                    <div className="p-2 border rounded me-md-3 mb-3 mb-md-0 bg-white border-neon-blue">
                      <QRCode value={registrationResult.vc_jwt || registrationResult.did} size={140} />
                      <div className="mt-2 text-muted" style={{ fontSize: '0.95em' }}>
                        <i className="bi bi-info-circle me-1"></i>
                        This QR encodes the full Verifiable Credential and can be scanned & verified offline.
                      </div>
                    </div>
                    <div className="text-start">
                      <p className="mb-2">
                        <strong className="text-neon-blue">Athlete DID:</strong>
                      </p>
                      <code className="d-block bg-light p-2 rounded mb-3 text-neon-blue" style={{ wordBreak: 'break-all' }}>
                        {registrationResult.did}
                      </code>
                      <p className="mb-2">
                        <strong className="text-neon-blue">Proof (IPFS Hash):</strong>
                      </p>
                      <code className="d-block bg-light p-2 rounded text-neon-blue" style={{ wordBreak: 'break-all' }}>
                        {registrationResult.ipfs_hash}
                      </code>
                    </div>
                  </div>
                </Alert>
              )}

              <ProgressBar now={step * 33.33} label={stepLabels[step - 1]} className="mb-4" style={{ height: '1.5rem', fontWeight: 600 }} />

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Full Name
                        <OverlayTrigger placement="right" overlay={<Tooltip>Enter the athlete's legal name as on their birth certificate.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Control type="text" name="name" value={formData.name} onChange={handleTextChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Date of Birth
                        <OverlayTrigger placement="right" overlay={<Tooltip>Your date of birth is cryptographically verified to prevent age fraud.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Control type="date" name="dob" value={formData.dob} onChange={handleTextChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Gender
                        <OverlayTrigger placement="right" overlay={<Tooltip>Gender is used for eligibility and compliance with sports policy.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Select name="gender" value={formData.gender} onChange={handleTextChange} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        School
                        <OverlayTrigger placement="right" overlay={<Tooltip>Select the school registered with the Ministry of Education.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Select name="school_id" value={formData.school_id} onChange={handleTextChange} required>
                        <option value="">Select School</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Sport
                        <OverlayTrigger placement="right" overlay={<Tooltip>Choose the sport for which the athlete is registering.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Control type="text" name="sport" value={formData.sport} onChange={handleTextChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Selfie Upload
                        <OverlayTrigger placement="right" overlay={<Tooltip>Your photo is converted to a secure biometric hash—no raw images are stored.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Control type="file" name="selfie" accept="image/*" onChange={handleFileChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Birth Certificate Upload
                        <OverlayTrigger placement="right" overlay={<Tooltip>Only authorized officials can view your documents. Data is encrypted and privacy-protected.</Tooltip>}>
                          <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                        </OverlayTrigger>
                      </Form.Label>
                      <Form.Control type="file" name="birthCertificate" accept="application/pdf" onChange={handleFileChange} required />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3" controlId="consentCheckbox">
                  <Form.Check
                    type="checkbox"
                    label={<span>I consent to the processing of my data according to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-blue">Privacy Policy</a>.</span>}
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    required
                  />
                  {consentError && <div className="text-alert-red mt-2">{consentError}</div>}
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button
                    className="bg-neon-blue text-deep-navy border-neon-blue px-4 py-2"
                    type="submit"
                    size="lg"
                    disabled={isLoading || !consent}
                  >
                    {isLoading ? (
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="text-neon-pink" />
                    ) : (
                      <i className="bi bi-person-plus-fill me-2"></i>
                    )}
                    Register Athlete
                  </Button>
                </div>
              </Form>

              {showSuccess && (
                <Alert variant="success" className="mt-4">
                  <h5>Success!</h5>
                  <p>Your digital ID (DID) and verifiable credential are being created. You'll receive a QR code for future verification.</p>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegistrationForm; 