import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Table, Spinner, Button, Modal, Form } from 'react-bootstrap';
import API_URL from '../apiConfig';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const FraudAlertPanel = () => {
  const [revoked, setRevoked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAthlete, setModalAthlete] = useState(null);
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

    const fetchRevoked = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/revoked-athletes`);
        if (!response.ok) throw new Error('Failed to fetch revoked athletes');
        const data = await response.json();
        setRevoked(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchRevoked();
  }, []);

  const handleOpenModal = (athlete) => {
    setModalAthlete(athlete);
    setReason('');
    setEvidenceUrl('');
    setShowModal(true);
    setSuccessMsg(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalAthlete(null);
    setReason('');
    setEvidenceUrl('');
    setSubmitting(false);
    setSuccessMsg(null);
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!modalAthlete) return;
    setSubmitting(true);
    setSuccessMsg(null);
    try {
      const response = await fetch(`${API_URL}/flag-athlete/${modalAthlete.did}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, evidence_url: evidenceUrl, actor_id: 'admin' })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke athlete');
      }
      setSuccessMsg('Athlete credential revoked successfully.');
      await fetchRevoked();
      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err) {
      setSuccessMsg(null);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="bg-deep-navy min-vh-100 py-4">
      <Alert variant="danger" className="mb-4 shadow-sm">
        <div className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-3 display-6 text-alert-red" />
          <div>
            <h4 className="mb-1">Fraud Detected</h4>
            <p className="mb-0">This panel lists athletes whose credentials are flagged for review. <strong>Reason:</strong> Possible duplicate biometrics, forged documents, or other anomalies. <br /> <strong>Next Steps:</strong> Contact your school or the Ministry for appeal and further investigation.</p>
          </div>
        </div>
      </Alert>
      <Row>
        <Col>
          <Card className="shadow-sm bg-charcoal-gray text-clean-white border-alert-red">
            <Card.Header as="h4" className="bg-alert-red text-clean-white">Fraud Alert Panel</Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="danger" />
                  <p className="mt-2 text-alert-red">Loading revoked athletes...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="bg-neon-pink text-clean-white border-neon-pink">{error}</Alert>
              ) : revoked.length === 0 ? (
                <Alert variant="info" className="bg-accent-yellow text-deep-navy border-alert-red">No revoked/flagged athletes found.</Alert>
              ) : (
                <Table responsive striped hover className="border border-alert-red rounded-3">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>DID</th>
                      <th>Reason</th>
                      <th>Evidence</th>
                      <th>Actor</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revoked.map((athlete) => (
                      <tr key={athlete.did}>
                        <td>
                          <OverlayTrigger
                            placement="right"
                            overlay={<Tooltip>Why was this flagged? Our AI checks for duplicate faces and document tampering. All actions are logged for transparency.</Tooltip>}
                          >
                            <span className="text-neon-blue">
                              {athlete.name}
                              <i className="bi bi-info-circle ms-2 text-accent-yellow" />
                            </span>
                          </OverlayTrigger>
                        </td>
                        <td style={{ fontSize: '0.85em' }}><code>{athlete.did}</code></td>
                        <td>{athlete.reason ? <span className="badge bg-neon-pink text-clean-white">{athlete.reason}</span> : <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.evidence_url ? <a className="text-neon-blue" href={athlete.evidence_url} target="_blank" rel="noopener noreferrer">View</a> : <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.actor_id || <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.timestamp ? new Date(athlete.timestamp).toLocaleString() : <span className="text-muted">N/A</span>}</td>
                        <td>
                          {/* Only show revoke button if not already revoked (simulate for demo) */}
                          {!athlete.reason && (
                            <Button variant="danger" size="sm" onClick={() => handleOpenModal(athlete)}>
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Revoke Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="bg-alert-red text-clean-white">
          <Modal.Title>Revoke Athlete Credential</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRevoke}>
          <Modal.Body className="bg-charcoal-gray text-clean-white">
            <p>Enter the reason for revoking this athlete's credential:</p>
            <Form.Group className="mb-3">
              <Form.Label>Reason <span className="text-alert-red">*</span></Form.Label>
              <Form.Control
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. Document forgery, duplicate biometric, etc."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Evidence URL (optional)</Form.Label>
              <Form.Control
                type="url"
                value={evidenceUrl}
                onChange={e => setEvidenceUrl(e.target.value)}
                disabled={submitting}
                placeholder="Link to evidence (IPFS, doc, etc.)"
              />
            </Form.Group>
            {successMsg && <Alert variant="success">{successMsg}</Alert>}
          </Modal.Body>
          <Modal.Footer className="bg-charcoal-gray">
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={submitting || !reason}>
              {submitting ? 'Revoking...' : 'Confirm Revoke'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FraudAlertPanel; 