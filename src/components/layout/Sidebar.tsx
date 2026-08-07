import { NavLink } from 'react-router-dom';
import { ShieldAlert, Users, Key, Lock, X, RefreshCw } from 'lucide-react';
import { NeonLogo } from '../ui/NeonLogo';
import { useStore } from '../../store/useStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const resetRequests = useStore(state => state.resetRequests || []);
  const pendingCount = resetRequests.filter(r => r.status === 'pending').length;

  const menuItems = [
    { path: '/dashboard', label: 'ภาพรวมระบบ', icon: ShieldAlert },
    { path: '/dashboard/partners', label: 'จัดการพาร์ทเนอร์', icon: Users },
    { path: '/dashboard/keys', label: 'ประวัติคีย์ใช้งาน', icon: Key },
    { path: '/dashboard/settings', label: 'ตั้งค่าความปลอดภัย', icon: Lock },
    { path: '/dashboard/reset-requests', label: 'คำขอรีเซ็ตคีย์', icon: RefreshCw, badge: pendingCount > 0 ? pendingCount : null },
  ];

  return (
    <aside
      className={`w-64 bg-[#0B0E14] border-r border-gray-800/60 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Brand & Profile */}
      <div className="p-6 flex items-center gap-4 border-b border-gray-800/40">
        <div className="w-12 h-12 flex-shrink-0">
          <NeonLogo className="w-full h-full scale-110" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-white font-bold tracking-wider">BLUERET แอดมิน</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-green-500 text-[10px] font-bold">ผู้ดูแลระบบหลัก</span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-white border border-primary/30 shadow-[0_0_15px_rgba(123,97,255,0.15)]'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className="opacity-80" />
              <span className="text-sm">{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/20 font-num">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
