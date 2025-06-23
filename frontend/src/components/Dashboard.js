import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import API_URL from '../apiConfig';

const StatCard = ({ title, value, icon, color }) => (
  <Card className="shadow-sm">
    <Card.Body>
      <div className="d-flex align-items-center">
        <div className={`icon-circle bg-${color} text-white me-3`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <h5 className="mb-0">{value}</h5>
          <p className="text-muted mb-0">{title}</p>
        </div>
      </div>
    </Card.Body>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse] = await Promise.all([
          fetch(`${API_URL}/dashboard-stats`),
          fetch(`${API_URL}/activity-log`),
        ]);

        if (!statsResponse.ok || !activityResponse.ok) {
          throw new Error('Failed to fetch dashboard data from the server.');
        }

        const statsData = await statsResponse.json();
        const activityData = await activityResponse.json();

        setStats(statsData);
        setActivities(activityData);
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
      return <Badge bg="success">Registration</Badge>;
    }
    if (action.startsWith('Verified')) {
      return <Badge bg="info">Verification</Badge>;
    }
    return <Badge bg="secondary">System</Badge>;
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
    <Container fluid>
      <Row className="mb-4">
        <Col md={12}>
            <h2 className="h4">System Overview</h2>
        </Col>
      </Row>
      <Row>
        <Col md={4} className="mb-4">
          <StatCard title="Total Athletes" value={stats?.totalAthletes ?? '...'} icon="bi-people-fill" color="primary" />
        </Col>
        <Col md={4} className="mb-4">
          <StatCard title="Total Verifications" value={stats?.totalVerifications ?? '...'} icon="bi-patch-check-fill" color="success" />
        </Col>
        <Col md={4} className="mb-4">
          <StatCard title="Registered Schools" value={stats?.totalSchools ?? '...'} icon="bi-building" color="info" />
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