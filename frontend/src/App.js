import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import VerificationPage from './components/VerificationPage'; // Will be created next

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-light">
        <header className="bg-dark text-white p-3 shadow-sm">
          <div className="container d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0">
              <i className="bi bi-shield-check me-2"></i> AgeTrust Zimbabwe
            </h1>
            <nav>
              <NavLink 
                to="/" 
                className={({ isActive }) => `nav-link d-inline text-white me-3 ${isActive ? 'fw-bold border-bottom border-2' : ''}`}
              >
                Register Athlete
              </NavLink>
              <NavLink 
                to="/verify" 
                className={({ isActive }) => `nav-link d-inline text-white ${isActive ? 'fw-bold border-bottom border-2' : ''}`}
              >
                Verify Credentials
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="container py-5 flex-grow-1">
          <div className="p-4 p-md-5 bg-white rounded-3 shadow-lg">
            <Routes>
              <Route path="/" element={<RegistrationForm />} />
              <Route path="/verify" element={<VerificationPage />} />
            </Routes>
          </div>
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
