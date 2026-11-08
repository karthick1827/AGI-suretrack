// The only route guard (AD-9). Without a valid Session it sends the user to
// /login with router state `{ from, reason }`: `from` is the requested path,
// query and hash (FR-11), `reason` is 'expired' when the Session ran out (FR-34)
// and 'required' otherwise. The return path travels only in that state.
import { Navigate, useLocation } from 'react-router';
import { paths } from '../lib/paths.js';
import { getSessionState } from '../lib/session.js';

export default function RequireSession({ children }) {
  // Reads storage on every render (a pure read; SessionSync purges), so the React Compiler must not memoize it.
  'use no memo';
  const location = useLocation();
  const { session, reason } = getSessionState();
  if (session) return children;
  const from = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={paths.login()} replace state={{ from, reason }} />;
}
