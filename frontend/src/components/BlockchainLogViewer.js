import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import API_URL from '../apiConfig';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Accordion from 'react-bootstrap/Accordion';

const BlockchainLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/activity-log`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredLogs(logs);
    } else {
      const s = search.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (log) =>
            (log.action && log.action.toLowerCase().includes(s)) ||
            (log.actor && log.actor.toLowerCase().includes(s))
        )
      );
    }
  }, [search, logs]);

  const getActionBadge = (action) => {
    if (action.startsWith('Registered')) {
      return <span className="badge bg-neon-green text-deep-navy">Registration</span>;
    }
    if (action.startsWith('Verified')) {
      return <span className="badge bg-neon-blue text-deep-navy">Verification</span>;
    }
    if (action.startsWith('Revoked')) {
      return <span className="badge bg-alert-red text-clean-white">Revocation</span>;
    }
    return <span className="badge bg-neon-pink text-clean-white">System</span>;
  };

  // Try to extract DID from action string (e.g., 'Registered athlete X with DID did:ethr:...')
  const extractDid = (action) => {
    const didMatch = action.match(/DID ([a-zA-Z0-9:]+)/);
    return didMatch ? didMatch[1] : null;
  };

  return (
    <Container fluid className="bg-deep-navy min-vh-100 py-4">
      <Row>
        <Col>
          <Card className="shadow-sm bg-charcoal-gray text-clean-white border-neon-blue">
            <Card.Header as="h4" className="bg-neon-blue text-deep-navy">Blockchain Log Viewer</Card.Header>
            <Card.Body>
              <Form className="mb-3 d-flex align-items-center">
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip id="search-tooltip">Search by DID, name, or event. All actions (issue, verify, revoke) are immutably logged.</Tooltip>}
                >
                  <Form.Control
                    type="text"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="me-2"
                    style={{ maxWidth: 300 }}
                  />
                </OverlayTrigger>
                <Button variant="primary" onClick={() => setSearch('')} disabled={!search}>Clear</Button>
              </Form>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-neon-blue">Loading logs...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="bg-neon-pink text-clean-white border-neon-pink">{error}</Alert>
              ) : filteredLogs.length === 0 ? (
                <Alert variant="info" className="bg-charcoal-gray text-clean-white border-neon-blue">No log entries found for this filter.</Alert>
              ) : (
                <Table responsive striped hover className="border border-neon-blue rounded-3">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>DID</th>
                      <th>Timestamp</th>
                      <th>Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const did = extractDid(log.action);
                      return (
                      <tr key={log.id}>
                        <td>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{`This entry is cryptographically signed and timestamped for audit integrity.`}</Tooltip>}
                          >
                            <span className={`badge bg-${getActionBadge(log.action)} me-2`}>
                              {getActionBadge(log.action)}
                            </span>
                          </OverlayTrigger>
                          <span className="ms-2">{log.action}</span>
                        </td>
                          <td>
                            {did ? (
                              <Link to={`/team-card/${did}`} className="text-neon-blue">
                                <code style={{ fontSize: '0.85em' }}>{did}</code>
                              </Link>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.actor}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className="shadow-sm bg-charcoal-gray text-clean-white border-neon-blue">
            <Card.Header as="h4" className="bg-neon-blue text-deep-navy">Log Details</Card.Header>
            <Card.Body>
              <Accordion className="mb-2">
                {filteredLogs.map((log, idx) => (
                  <Accordion.Item eventKey={String(idx)} key={log.id}>
                    <Accordion.Header>Log #{idx + 1} Details</Accordion.Header>
                    <Accordion.Body>
                      <ul className="mb-0">
                        <li><strong>Action:</strong> {log.action}</li>
                        <li><strong>Actor:</strong> {log.actor}</li>
                        <li><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</li>
                        {log.evidence_url && <li><strong>Evidence:</strong> <a href={log.evidence_url} target="_blank" rel="noopener noreferrer">View</a></li>}
                        {log.reason && <li><strong>Reason:</strong> {log.reason}</li>}
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BlockchainLogViewer;
