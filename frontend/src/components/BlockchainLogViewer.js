import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';

const BlockchainLogViewer = () => {
  return (
    <Container fluid>
      <Row>
        <Col>
          <Card>
            <Card.Header as="h4" className="bg-secondary text-white">Blockchain Log Viewer</Card.Header>
            <Card.Body>
                <Alert variant="info">
                    <Alert.Heading>
                        <i className="bi bi-info-circle-fill me-2"></i>Under Construction
                    </Alert.Heading>
                    <p>
                        This section will display a searchable and filterable log of all blockchain transactions related to identity verification. Each entry will show the transaction hash, timestamp, and the result of the verification.
                    </p>
                </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BlockchainLogViewer; 