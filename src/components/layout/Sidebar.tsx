import { NavLink } from 'react-router-dom';
import { ShieldAlert, Users, Key, Lock, X, RefreshCw, Globe } from 'lucide-react';
import { NeonLogo } from '../ui/NeonLogo';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const resetRequests = useStore(state => state.resetRequests || []);
  const pendingCount = resetRequests.filter(r => r.status === 'pending').length;
  const { t, language, toggleLanguage } = useTranslation();

  const menuItems = [
    { path: '/dashboard', label: t('sidebar.overview'), icon: ShieldAlert },
    { path: '/dashboard/partners', label: t('sidebar.partners'), icon: Users },
    { path: '/dashboard/keys', label: t('sidebar.keys'), icon: Key },
    { path: '/dashboard/settings', label: t('sidebar.settings'), icon: Lock },
    { path: '/dashboard/reset-requests', label: t('sidebar.resetRequests'), icon: RefreshCw, badge: pendingCount > 0 ? pendingCount : null },
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
          <h1 className="text-white font-bold tracking-wider">{t('sidebar.adminTitle')}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-green-500 text-[10px] font-bold">{t('sidebar.adminRole')}</span>
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

      {/* Language Switcher */}
      <div className="p-4 border-t border-gray-800/40">
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1C1F2E] text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800/60 transition-all font-bold tracking-wide"
        >
          <Globe size={18} className={language === 'th' ? 'text-blue-400' : 'text-purple-400'} />
          <span>{language.toUpperCase()}</span>
        </button>
      </div>
    </aside>
  );
}
