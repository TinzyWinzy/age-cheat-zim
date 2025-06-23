import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';

const FraudAlertPanel = () => {
  return (
    <Container fluid>
      <Row>
        <Col>
          <Card>
            <Card.Header as="h4" className="bg-danger text-white">Fraud Alert Panel</Card.Header>
            <Card.Body>
                <Alert variant="info">
                    <Alert.Heading>
                        <i className="bi bi-info-circle-fill me-2"></i>Under Construction
                    </Alert.Heading>
                    <p>
                        This panel will display a list of all identities that have been flagged for potential age fraud. Administrators will be able to review the details and take appropriate action.
                    </p>
                </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FraudAlertPanel; 