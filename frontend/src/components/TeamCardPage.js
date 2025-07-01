import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Modal, Table } from 'react-bootstrap';
import API_URL from '../apiConfig';
import sha256 from 'js-sha256';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const TeamCardPage = () => {
  const { did } = useParams();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [verifyStates, setVerifyStates] = useState({});
  const cardRef = useRef();

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/athlete/${did}`);
        if (!response.ok) throw new Error('Athlete not found');
        const data = await response.json();
        setAthlete(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAthlete();
  }, [did]);

  const handleShowHistory = async () => {
    setShowHistory(true);
    setHistory([]);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/logs/${did}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleVerifyIntegrity = async (log) => {
    if (!log.ipfs_cid) return;
    setVerifyStates((prev) => ({ ...prev, [log.id]: 'loading' }));
    try {
      const ipfsUrl = `https://ipfs.io/ipfs/${log.ipfs_cid}`;
      const response = await fetch(ipfsUrl);
      if (!response.ok) throw new Error('Failed to fetch from IPFS');
      const ipfsLog = await response.json();
      const localLog = { ...log };
      delete localLog.ipfs_cid;
      delete localLog.id;
      const localHash = sha256(JSON.stringify(localLog));
      if (ipfsLog.hash === localHash) {
        setVerifyStates((prev) => ({ ...prev, [log.id]: 'valid' }));
      } else {
        setVerifyStates((prev) => ({ ...prev, [log.id]: 'tampered' }));
      }
    } catch (err) {
      setVerifyStates((prev) => ({ ...prev, [log.id]: 'error' }));
    }
  };

  const handleDownloadPDF = async () => {
    const input = cardRef.current;
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
    pdf.save(`${athlete.name || 'team-card'}.pdf`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading Team Card...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger"><strong>Error:</strong> {error}</Alert>;
  }

  if (!athlete) return null;

  let photoUrl = '';
  if (athlete.selfie_ipfs_hash) {
    photoUrl = `https://ipfs.io/ipfs/${athlete.selfie_ipfs_hash}`;
  } else if (athlete.ipfs_hash) {
    photoUrl = `https://ipfs.io/ipfs/${athlete.ipfs_hash}/selfie`;
  }

  return (
    <Container className="my-5">
      <Container className="py-4">
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h4 className="mb-2 text-primary">Athlete Team Card</h4>
            <p className="mb-0">
              This page displays the athlete's digital ID, verifiable credential status, and verification history. Officials can scan the QR code or check the DID to instantly verify eligibility and integrity.
            </p>
            <Button variant="outline-primary" className="mt-3" onClick={handleDownloadPDF}>
              <i className="bi bi-download me-2" /> Download Card (PDF)
            </Button>
          </Card.Body>
        </Card>
      </Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div ref={cardRef}>
            <Card className="shadow-lg bg-charcoal-gray text-clean-white border-neon-blue">
              <Card.Header as="h3" className="bg-neon-blue text-deep-navy text-center">
                Team Card: {athlete.name}
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={5} className="text-center mb-3 mb-md-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Athlete Selfie" className="img-fluid rounded border border-neon-blue" style={{ maxHeight: 220 }} />
                    ) : (
                      <div className="bg-light border rounded p-4">No Photo</div>
                    )}
                    <div className="mt-3">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Scan this QR code to verify this athlete's DID and credential.</Tooltip>}
                      >
                        <div className="d-inline-block bg-white p-2 rounded">
                          <QRCode value={athlete.did || ''} size={120} />
                        </div>
                      </OverlayTrigger>
                      <div className="text-muted mt-1" style={{ fontSize: '0.9em' }}>
                        <i className="bi bi-qr-code me-1"></i>
                        Scan to verify
                      </div>
                    </div>
                  </Col>
                  <Col md={7}>
                    <h4 className="text-neon-blue">{athlete.name}</h4>
                    <p><strong>DID:</strong> <code style={{ wordBreak: 'break-all' }}>{athlete.did}</code></p>
                    <p><strong>Status:</strong> 
                      <OverlayTrigger
                        placement="right"
                        overlay={<Tooltip>This credential is cryptographically signed and stored on IPFS for tamper-proof verification.</Tooltip>}
                      >
                        <Badge bg={athlete.status === 'Revoked' ? 'danger' : 'success'} className="ms-2">
                          {athlete.status}
                        </Badge>
                      </OverlayTrigger>
                    </p>
                    <p><strong>Sport:</strong> {athlete.sport}</p>
                    <p><strong>School ID:</strong> {athlete.school_id}</p>
                    <p><strong>Registered:</strong> {athlete.registered_at ? new Date(athlete.registered_at).toLocaleString() : 'N/A'}</p>
                    <p><strong>NFT Token ID:</strong> {athlete.nft_token_id || <span className="text-muted">N/A</span>}</p>
                    <p><strong>NFT Metadata URI:</strong> {athlete.nft_metadata_uri ? (
                      <a className="text-neon-blue" href={athlete.nft_metadata_uri.replace('ipfs://', 'https://ipfs.io/ipfs/')} target="_blank" rel="noopener noreferrer">View on IPFS</a>
                    ) : <span className="text-muted">N/A</span>}</p>
                    <Button variant="info" className="mt-3 me-2" onClick={handleShowHistory}>View History</Button>
                    <Button variant="secondary" href="/dashboard" className="mt-3">Back to Dashboard</Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
      <Modal show={showHistory} onHide={handleCloseHistory} size="lg" centered>
        <Modal.Header closeButton className="bg-neon-blue text-deep-navy">
          <Modal.Title>Verification & Audit History</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-charcoal-gray text-clean-white">
          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-neon-blue">Loading history...</p>
            </div>
          ) : historyError ? (
            <Alert variant="danger" className="bg-neon-pink text-clean-white border-neon-pink">{historyError}</Alert>
          ) : history.length === 0 ? (
            <Alert variant="info" className="bg-accent-yellow text-deep-navy border-neon-blue">No history found for this athlete.</Alert>
          ) : (
            <Table responsive striped hover className="border border-neon-blue rounded-3">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Reason</th>
                  <th>Integrity</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td>{log.action}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.actor_id || log.actor || <span className="text-muted">N/A</span>}</td>
                    <td>{log.reason || <span className="text-muted">N/A</span>}</td>
                    <td>
                      {log.ipfs_cid ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => handleVerifyIntegrity(log)}
                            disabled={verifyStates[log.id] === 'loading'}
                          >
                            Verify Integrity
                          </Button>
                          {verifyStates[log.id] === 'loading' && <span className="ms-2 text-accent-yellow">Checking...</span>}
                          {verifyStates[log.id] === 'valid' && <span className="ms-2 badge bg-neon-green text-deep-navy">Valid</span>}
                          {verifyStates[log.id] === 'tampered' && <span className="ms-2 badge bg-alert-red text-clean-white">Tampered</span>}
                          {verifyStates[log.id] === 'error' && <span className="ms-2 badge bg-accent-yellow text-deep-navy">Error</span>}
                        </>
                      ) : (
                        <span className="badge bg-accent-yellow text-deep-navy">Not Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-charcoal-gray">
          <Button variant="secondary" onClick={handleCloseHistory}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeamCardPage; 