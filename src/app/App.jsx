import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { paths, routePatterns } from '../lib/paths.js';
import LoginPage from '../pages/Login/LoginPage.jsx';

// Route table (AD-10). Story 1.2: `/login` renders the Login page and every
// other app path — `/`, `/dashboard`, anything else — redirects to it (FR-11).
// Story 1.3 adds the Session guard, `/dashboard` and the remembered return path.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routePatterns.login} element={<LoginPage />} />
        <Route path="*" element={<Navigate to={paths.login()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
