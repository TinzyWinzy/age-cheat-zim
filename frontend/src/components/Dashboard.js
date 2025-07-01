import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import API_URL from '../apiConfig';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const StatCard = ({ title, value, icon, color, tooltip }) => (
  <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
    <div className={`card shadow-sm mb-4 border-0 bg-white`} style={{ minWidth: 220 }}>
      <div className="card-body d-flex align-items-center">
        <div className={`me-3 display-5`}>
          {icon}
        </div>
        <div>
          <h6 className="mb-1 text-muted">{title}</h6>
          <h3 className="mb-0 fw-bold">{value}</h3>
        </div>
      </div>
    </div>
  </OverlayTrigger>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [teamCards, setTeamCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse, teamCardsResponse] = await Promise.all([
          fetch(`${API_URL}/dashboard-stats`),
          fetch(`${API_URL}/activity-log`),
          fetch(`${API_URL}/athletes`),
        ]);

        if (!statsResponse.ok || !activityResponse.ok || !teamCardsResponse.ok) {
          throw new Error('Failed to fetch dashboard data from the server.');
        }

        const statsData = await statsResponse.json();
        const activityData = await activityResponse.json();
        const teamCardsData = await teamCardsResponse.json();

        setStats(statsData);
        setActivities(activityData);
        setTeamCards(teamCardsData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActionBadge = (action) => {
    if (action.startsWith('Registered')) {
      return <Badge className="bg-neon-green text-deep-navy">Registration</Badge>;
    }
    if (action.startsWith('Verified')) {
      return <Badge className="bg-neon-blue text-deep-navy">Verification</Badge>;
    }
    return <Badge className="bg-neon-pink text-clean-white">System</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger"><strong>Error:</strong> {error}</Alert>;
  }

  return (
    <Container fluid className="bg-deep-navy min-vh-100 py-4">
      <Alert variant="primary" className="mb-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div>
            <h3 className="mb-1 text-primary">Welcome to AgeTrust Zimbabwe</h3>
            <p className="mb-2 mb-md-0">A tamper-proof digital ID system for fair youth sports. Powered by blockchain, biometrics, and government trust.</p>
          </div>
          <a href="#" onClick={() => window.scrollTo(0, 0)} className="btn btn-outline-primary mt-2 mt-md-0" data-bs-toggle="modal" data-bs-target="#helpModal">
            <i className="bi bi-info-circle me-1" /> Learn More
          </a>
        </div>
      </Alert>
      <Row className="mb-4">
        <Col md={12}>
            <h2 className="h4">System Overview</h2>
        </Col>
      </Row>
      <Row>
        <Col md={4} className="mb-4">
          <StatCard
            title="Total Athletes"
            value={stats?.totalAthletes ?? '...'}
            icon={<i className="bi bi-people-fill text-accent-yellow" />}
            tooltip="Total number of athletes registered in the system."
          />
        </Col>
        <Col md={4} className="mb-4">
          <StatCard
            title="Total Verifications"
            value={stats?.totalVerifications ?? '...'}
            icon={<i className="bi bi-patch-check-fill text-neon-green" />}
            tooltip="Total number of verifications completed."
          />
        </Col>
        <Col md={4} className="mb-4">
          <StatCard
            title="Registered Schools"
            value={stats?.totalSchools ?? '...'}
            icon={<i className="bi bi-building text-info" />}
            tooltip="Total number of schools registered in the system."
          />
        </Col>
      </Row>
      
      <Row>
          <Col>
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-dark text-white">Recent Activity</Card.Header>
                <Card.Body>
                    <Table responsive striped hover>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Timestamp</th>
                                <th>Actor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((activity) => (
                                <tr key={activity.id}>
                                    <td>
                                        {getActionBadge(activity.action)}
                                        <span className="ms-2">{activity.action}</span>
                                    </td>
                                    <td>{new Date(activity.timestamp).toLocaleString()}</td>
                                    <td>{activity.actor}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
          </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header as="h4" className="bg-neon-blue text-deep-navy">Team Cards (NFTs)</Card.Header>
            <Card.Body>
              {teamCards.length === 0 ? (
                <Alert variant="info" className="bg-charcoal-gray text-clean-white border-neon-blue">No team cards issued yet.</Alert>
              ) : (
                <Table responsive striped hover className="border border-neon-blue rounded-3">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>DID</th>
                      <th>Status</th>
                      <th>Sport</th>
                      <th>School ID</th>
                      <th>Registered</th>
                      <th>NFT Token ID</th>
                      <th>NFT Metadata URI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamCards.map((athlete) => (
                      <tr key={athlete.did}>
                        <td>
                          <a href={`/team-card/${athlete.did}`}>{athlete.name}</a>
                        </td>
                        <td style={{ fontSize: '0.85em' }}><code>{athlete.did}</code></td>
                        <td>{athlete.status || <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.sport || <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.school_id || <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.registered_at ? new Date(athlete.registered_at).toLocaleString() : <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.nft_token_id || <span className="text-muted">N/A</span>}</td>
                        <td>{athlete.nft_metadata_uri ? <a href={athlete.nft_metadata_uri.replace('ipfs://', 'https://ipfs.io/ipfs/')} target="_blank" rel="noopener noreferrer">View</a> : <span className="text-muted">N/A</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <style type="text/css">
        {`
          .icon-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
          }
        `}
      </style>
    </Container>
  );
};

export default Dashboard; 