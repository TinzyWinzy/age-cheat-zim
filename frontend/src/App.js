import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import VerificationPage from './components/VerificationPage'; // Will be created next
import AppNavbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BlockchainLogViewer from './components/BlockchainLogViewer';
import FraudAlertPanel from './components/FraudAlertPanel';
import TeamCardPage from './components/TeamCardPage';
import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-light">
        <AppNavbar />

        <main className="container py-5 flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/logs" element={<BlockchainLogViewer />} />
            <Route path="/fraud-alerts" element={<FraudAlertPanel />} />
            <Route path="/team-card/:did" element={<TeamCardPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </main>

        <footer className="bg-dark text-white text-center p-3 mt-auto">
          <div className="container">
            &copy; {new Date().getFullYear()} Radbit Inc. All Rights Reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
