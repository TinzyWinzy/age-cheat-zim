const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://age-fraud-api-production.up.railway.app/api'
  : 'http://localhost:3001/api';

export default API_URL; 