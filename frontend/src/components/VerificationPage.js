import React, { useState } from 'react';
import API_URL from '../apiConfig';

const VerificationPage = () => {
  const [did, setDid] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage(null);
    setVerificationResult(null);
    setIsLoading(true);

    if (!did) {
      setMessage({ type: 'warning', text: 'Please enter a DID to verify.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/verify/${did}`);
      const result = await response.json();

      if (response.ok) {
        setVerificationResult(result);
        setMessage({ type: 'success', text: 'Credential verified successfully.'})
      } else {
        setMessage({ type: 'danger', text: result.message || 'Verification failed.' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage({ type: 'danger', text: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="card-title mb-2">Verify Athlete Credentials</h2>
        <p className="lead text-muted">Instantly verify an athlete's age and status using their DID.</p>
      </div>
      
      <form onSubmit={handleVerify}>
        <div className="mb-3">
          <label className="form-label" htmlFor="did">
            <i className="bi bi-person-vcard-fill me-2"></i>Athlete's Digital ID (DID)
          </label>
          <input
            type="text"
            id="did"
            value={did}
            onChange={(e) => setDid(e.target.value)}
            className="form-control form-control-lg"
            placeholder="did:key:mock:..."
            required
          />
        </div>
        <div className="d-grid">
            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Verifying...
                    </>
                ) : (
                    'Verify'
                )}
            </button>
        </div>
      </form>

      {message && (
        <div className={`alert alert-${message.type} mt-4`} role="alert">
          {message.text}
        </div>
      )}

      {verificationResult && (
        <div className="mt-4 p-4 border-start border-5 border-success rounded bg-light">
            <h3 className="h5 mb-3">
                <i className="bi bi-patch-check-fill text-success me-2"></i>
                Verification Result: <span className="text-success fw-bold">Verified</span>
            </h3>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    <p><strong>Name:</strong> {verificationResult.name}</p>
                    <p><strong>Age:</strong> {calculateAge(verificationResult.dob)}</p>
                    <p className="mb-md-0"><strong>Sport:</strong> {verificationResult.sport}</p>
                </div>
                <div className="col-md-6">
                    <p><strong>Date of Birth:</strong> {new Date(verificationResult.dob).toLocaleDateString()}</p>
                    <p className="mb-0"><strong>DID:</strong> <code>{verificationResult.did}</code></p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage; 