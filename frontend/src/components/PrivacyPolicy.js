import React from 'react';
import { Container, Card } from 'react-bootstrap';

const PrivacyPolicy = () => (
  <Container className="py-4">
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h2 className="mb-3 text-primary">Privacy Policy</h2>
        <p>
          <strong>Data Security:</strong> We use strong encryption to protect all sensitive data, including your biometric hash and documents. Only authorized officials can access your information.
        </p>
        <p>
          <strong>Biometric Privacy:</strong> Your selfie is converted to a secure biometric hash—no raw images are stored. This ensures your privacy while enabling fraud prevention.
        </p>
        <p>
          <strong>Document Protection:</strong> Uploaded birth certificates and other documents are encrypted and only accessible to authorized personnel for verification purposes.
        </p>
        <p>
          <strong>Audit Logging:</strong> All actions (registration, verification, revocation) are immutably logged for transparency and compliance. You can view your audit trail at any time.
        </p>
        <p>
          <strong>Consent:</strong> By using AgeTrust Zimbabwe, you consent to the secure processing of your data for the purpose of age and identity verification in youth sports.
        </p>
      </Card.Body>
    </Card>
  </Container>
);

export default PrivacyPolicy; 