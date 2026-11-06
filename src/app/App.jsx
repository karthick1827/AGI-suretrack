import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { paths, routePatterns } from '../lib/paths.js';
import { getSession, subscribe } from '../lib/session.js';
import LoginPage from '../pages/Login/LoginPage.jsx';
import Placeholder from '../pages/Placeholder/Placeholder.jsx';
import RequireSession from './RequireSession.jsx';

// Route table (AD-10). `/login` is public and redirects a signed-in user to
// `/dashboard` (FR-33). Every other app path is guarded by RequireSession
// (FR-11) and renders the Placeholder until its epic lands (`/dashboard`
// until Epic 2). `/` and unknown paths go to `/dashboard`, so a signed-out
// visitor still ends up on `/login`.

const PROTECTED_PATTERNS = [
  routePatterns.dashboard,
  routePatterns.equipment,
  routePatterns.equipmentDetail,
  routePatterns.alertAction,
  routePatterns.alerts,
];

function LoginRoute() {
  // Reads storage on every render, so the React Compiler must not memoize it.
  'use no memo';
  if (getSession()) return <Navigate to={paths.dashboard()} replace />;
  return <LoginPage />;
}

/**
 * FR-35: when the Session ends in this tab or any other tab, leave the
 * signed-in page for `/login` at once. Also covers a page restored from the
 * back-forward cache after sign-out.
 */
function SessionSync() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const check = () => {
      if (pathname !== paths.login() && !getSession()) {
        navigate(paths.login(), { replace: true });
      }
    };
    // A page restored from the back-forward cache never re-runs the guards.
    const onPageShow = (event) => {
      if (!event.persisted) return;
      if (pathname === paths.login() && getSession()) navigate(paths.dashboard(), { replace: true });
      else check();
    };
    const unsubscribe = subscribe(check);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      unsubscribe();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [navigate, pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionSync />
      <Routes>
        <Route path={routePatterns.login} element={<LoginRoute />} />
        {PROTECTED_PATTERNS.map((pattern) => (
          <Route
            key={pattern}
            path={pattern}
            element={
              <RequireSession>
                <Placeholder />
              </RequireSession>
            }
          />
        ))}
        <Route path="*" element={<Navigate to={paths.dashboard()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
