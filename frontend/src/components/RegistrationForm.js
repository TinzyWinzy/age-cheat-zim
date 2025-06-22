import React, { useState, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const RegistrationForm = () => {
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    school_id: '',
    sport: '',
  });
  const [files, setFiles] = useState({
    birthCertificate: null,
    selfie: null,
  });
  const [message, setMessage] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch schools from the API
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/schools');
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
        } else {
          setMessage({ type: 'danger', text: 'Failed to load schools.' });
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setMessage({ type: 'danger', text: 'Failed to load schools.' });
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
    setIsLoading(true);

    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    data.append('birthCertificate', files.birthCertificate);
    data.append('selfie', files.selfie);

    try {
      const response = await fetch('/api/register-athlete', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setRegistrationResult(result);
        setFormData({ name: '', dob: '', gender: 'Male', school_id: '', sport: '' });
        setFiles({ birthCertificate: null, selfie: null });
        e.target.reset();
      } else {
        setMessage({ type: 'danger', text: result.message || 'An error occurred.' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'danger', text: 'An unexpected error occurred during submission.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="card-title mb-2">Register a New Athlete</h2>
        <p className="lead text-muted">Create a secure digital identity to prevent age fraud in sports.</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      
      {registrationResult && (
        <div className="alert alert-success text-center">
            <h4 className="alert-heading">
                <i className="bi bi-check-circle-fill me-2"></i>Registration Complete!
            </h4>
            <p>The athlete's digital identity has been created and is ready for verification.</p>
            <hr />
            <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
                <div className="p-2 border rounded me-md-3 mb-3 mb-md-0">
                    <QRCode value={registrationResult.did} size={128} />
                </div>
                <div className="text-start">
                    <p className="mb-1"><strong>Athlete DID:</strong></p>
                    <code className="d-block bg-white p-2 rounded mb-2">{registrationResult.did}</code>
                    <p className="mb-1"><strong>Proof (IPFS Hash):</strong></p>
                    <code className="d-block bg-white p-2 rounded">{registrationResult.ipfs_hash}</code>
                </div>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="name"><i className="bi bi-person-fill me-2"></i>Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
              className="form-control"
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="dob"><i className="bi bi-calendar-event-fill me-2"></i>Date of Birth</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleTextChange}
              className="form-control"
              required
            />
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="sport"><i className="bi bi-trophy-fill me-2"></i>Sport</label>
            <input
              type="text"
              id="sport"
              name="sport"
              value={formData.sport}
              onChange={handleTextChange}
              className="form-control"
              placeholder="e.g., Soccer, Rugby"
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="school_id"><i className="bi bi-building-fill me-2"></i>School</label>
            <select
              id="school_id"
              name="school_id"
              value={formData.school_id}
              onChange={handleTextChange}
              className="form-select"
              required
            >
              <option value="" disabled>Select a school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="birthCertificate"><i className="bi bi-file-earmark-text-fill me-2"></i>Birth Certificate</label>
            <input
              type="file"
              id="birthCertificate"
              name="birthCertificate"
              onChange={handleFileChange}
              className="form-control"
              accept="application/pdf"
              required
            />
             <div className="form-text">Upload a clear, official PDF copy.</div>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="selfie"><i className="bi bi-camera-fill me-2"></i>Athlete's Selfie</label>
            <input
              type="file"
              id="selfie"
              name="selfie"
              onChange={handleFileChange}
              className="form-control"
              accept="image/jpeg, image/png"
              required
            />
            <div className="form-text">A clear, forward-facing photo for biometric verification.</div>
          </div>
        </div>

        <div className="d-grid mt-4">
            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                {isLoading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating Secure ID...
                </>
                ) : (
                'Create Secure ID'
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm; 