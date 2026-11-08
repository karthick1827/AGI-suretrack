import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { paths, routePatterns } from '../lib/paths.js';
import { getSession, getSessionState, purgeInvalidSession, subscribe } from '../lib/session.js';
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
  // Reads storage on every render (a pure read; SessionSync purges), so the React Compiler must not memoize it.
  'use no memo';
  if (getSession()) return <Navigate to={paths.dashboard()} replace />;
  return <LoginPage />;
}

const MAX_TIMEOUT_MS = 2147483647; // setTimeout's maximum delay

/**
 * Keeps every tab in step with the Session (FR-34, FR-35, FR-33). It
 * subscribes once and reads the current location from a ref.
 *  (a) Session lost (sign-out here or in another tab, or found invalid):
 *      leave a signed-in page for /login with `{ from, reason }`.
 *  (b) Session appears while this tab shows /login (sign-in in another tab,
 *      or a restored page): go to /dashboard. A sign-in in THIS tab is left to
 *      the Login form, which sends the user to the remembered page.
 *  (c) Session expires while the page is open: a timer at `expiresAt`, plus a
 *      re-check when the tab becomes visible or gains focus.
 *  (d) A page restored from the back-forward cache never re-runs the guards,
 *      so `pageshow` with `persisted` re-checks too.
 * It is also the only caller of purgeInvalidSession(), so reads during render
 * stay pure.
 */
function SessionSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const expiry = { timer: undefined };

    const schedule = (session) => {
      clearTimeout(expiry.timer);
      expiry.timer = undefined;
      if (!session) return;
      const delay = Math.min(Math.max(session.expiresAt - Date.now(), 0), MAX_TIMEOUT_MS);
      expiry.timer = setTimeout(() => check({ external: true }), delay);
    };

    const check = ({ external, initial = false }) => {
      const now = Date.now();
      const { session, reason } = getSessionState(now);
      purgeInvalidSession(now);
      schedule(session);
      if (initial) return; // the route guards handle the first render
      const { pathname, search, hash } = locationRef.current;
      const onLogin = pathname === paths.login();
      if (session) {
        if (onLogin && external) navigate(paths.dashboard(), { replace: true });
        return;
      }
      if (!onLogin) {
        navigate(paths.login(), { replace: true, state: { from: `${pathname}${search}${hash}`, reason } });
      }
    };

    const onChange = ({ crossTab }) => check({ external: crossTab });
    const onPageShow = (event) => {
      if (event.persisted) check({ external: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check({ external: true });
    };
    const onFocus = () => check({ external: true });

    check({ external: false, initial: true });
    const unsubscribe = subscribe(onChange);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(expiry.timer);
      unsubscribe();
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [navigate]);

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
