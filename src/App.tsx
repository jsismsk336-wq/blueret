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
import { ResellerAnnouncements } from './pages/ResellerAnnouncements';
import { ResetRequests } from './pages/ResetRequests';
import { Announcements } from './pages/Announcements';
import { CategoriesProducts } from './pages/CategoriesProducts';
import { initFirebaseSync, useStore } from './store/useStore';
import { useEffect, useState } from 'react';

function App() {
  const maintenanceMode = useStore((state) => state.maintenanceMode);
  const toggleMaintenance = useStore((state) => state.toggleMaintenance);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    initFirebaseSync();
  }, []);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 7) {
      setClickCount(0);
      const pwd = window.prompt("Enter Admin Password to override:");
      if (pwd) {
        const success = toggleMaintenance(pwd);
        if (success) alert("Maintenance mode disabled.");
        else alert("Incorrect password.");
      }
    }
  };

  return (
    <>
      {/* MAINTENANCE MODE */}
      {maintenanceMode ? (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
          <div className="text-center p-10 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full mx-4">
             <div className="flex justify-center mb-6" onClick={handleSecretClick} style={{cursor: 'default'}}>
                <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                </div>
             </div>
             <h1 className="text-3xl font-bold text-white mb-4">ระบบกำลังปิดปรับปรุง</h1>
             <p className="text-gray-400 text-lg leading-relaxed">
               ขออภัยในความไม่สะดวก<br/>
               ระบบกำลังปิดปรับปรุงชั่วคราวเพื่อพัฒนาระบบ<br/>
               กรุณากลับมาใช้งานใหม่ในภายหลัง
             </p>
          </div>
        </div>
      ) : (
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
            <Route path="products" element={<CategoriesProducts />} />
            <Route path="partners" element={<Partners />} />
            <Route path="keys" element={<Keys />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reset-requests" element={<ResetRequests />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>
          
          {/* Reseller routes */}
          <Route path="/reseller" element={<ResellerLayout />}>
            <Route index element={<Navigate to="/reseller/dashboard" replace />} />
            <Route path="dashboard" element={<ResellerDashboard />} />
            <Route path="history" element={<ResellerHistory />} />
            <Route path="announcements" element={<ResellerAnnouncements />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </>
      )}
    </>
  );
}

export default App;
