import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { AdminLayout } from './components/layout/AdminLayout';
import { ResellerLayout } from './components/layout/ResellerLayout';
import { Overview } from './pages/Overview';
import { Partners } from './pages/Partners';
import { Keys } from './pages/Keys';
import { Settings } from './pages/Settings';
import { ResellerDashboard } from './pages/ResellerDashboard';
import { ResellerHistory } from './pages/ResellerHistory';
import { ResetRequests } from './pages/ResetRequests';
import { initFirebaseSync } from './store/useStore';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    initFirebaseSync();
  }, []);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#161925',
            color: '#fff',
            border: '1px solid rgba(31, 41, 55, 0.6)',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Admin routes */}
          <Route path="/dashboard" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="partners" element={<Partners />} />
            <Route path="keys" element={<Keys />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reset-requests" element={<ResetRequests />} />
          </Route>
          
          {/* Reseller routes */}
          <Route path="/reseller" element={<ResellerLayout />}>
            <Route index element={<Navigate to="/reseller/dashboard" replace />} />
            <Route path="dashboard" element={<ResellerDashboard />} />
            <Route path="history" element={<ResellerHistory />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
