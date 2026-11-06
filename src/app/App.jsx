import { BrowserRouter, Route, Routes } from 'react-router';

// Route table placeholder (AD-10). Story 1.2+ replaces the catch-all with the
// real table built from src/lib/paths.js (/login, /dashboard, placeholders).
// Until then every location — including "/" — renders an empty app root.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </BrowserRouter>
  );
}
