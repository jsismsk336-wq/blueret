import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { NeonLogo } from '../ui/NeonLogo';
import { useStore } from '../../store/useStore';
import { Navigate } from 'react-router-dom';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useStore(s => s.currentUser);

  if (currentUser !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B0E14] border-b border-gray-800/60 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8">
              <NeonLogo className="w-full h-full" />
            </div>
            <span className="font-bold text-white tracking-wider text-sm">BLUERET แอดมิน</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#161925] border border-gray-800/60 text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-10 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
