import { Users, KeyRound, CheckCircle, Coins, Plus, Search, Shield, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RefillStockModal } from '../components/ui/RefillStockModal';
import { PackageSettingsModal } from '../components/ui/PackageSettingsModal';
import { PinModal } from '../components/ui/PinModal';
import { useTranslation } from '../hooks/useTranslation';

export function Overview() {
  const { partners, keys, packages, clearStockByDuration } = useStore();
  const { t } = useTranslation();
  const [refillingPackage, setRefillingPackage] = useState<{ days: number; label: string; cost: number } | null>(null);
  const [isPackageSettingsModalOpen, setIsPackageSettingsModalOpen] = useState(false);
  const [packageToClear, setPackageToClear] = useState<{ days: number; label: string; count: number } | null>(null);
  
  const totalPartners = partners.length;
  const totalKeys = keys.length;
  const activeKeys = keys.filter(k => k.status === 'active').length;
  const totalCirculatingCredit = partners.reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="animate-in fade-in duration-500 relative overflow-x-hidden">
      {/* Global Background Glow */}
      <div className="fixed top-[10%] left-[20%] w-[50%] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="mb-8 flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{t('admin.overviewTitle')}</h1>
          <p className="text-gray-400 text-sm">{t('admin.overviewDesc')}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        {/* Card 1: Partners (Team - Orange) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#12141D] border border-gray-800/40 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/20 rounded-full blur-[30px] group-hover:bg-orange-500/30 transition-colors duration-500 pointer-events-none"></div>
          <div className="absolute top-4 right-4 p-2 bg-orange-500/10 rounded-xl text-orange-500 z-10"><Users size={20} /></div>
          
          <div className="z-10 mt-auto">
            <div className="text-4xl font-bold font-num text-white mb-1">{totalPartners}</div>
            <div className="text-gray-400 text-sm font-medium">{t('admin.totalPartners')}</div>
          </div>
        </motion.div>

        {/* Card 2: Total Keys (Purple) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#12141D] border border-gray-800/40 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-[30px] group-hover:bg-purple-500/30 transition-colors duration-500 pointer-events-none"></div>
          <div className="absolute top-4 right-4 p-2 bg-purple-500/10 rounded-xl text-purple-400 z-10"><KeyRound size={20} /></div>
          
          <div className="z-10 mt-auto">
            <div className="text-4xl font-bold font-num text-white mb-1">{totalKeys}</div>
            <div className="text-gray-400 text-sm font-medium">{t('admin.totalGeneratedKeys')}</div>
          </div>
        </motion.div>

        {/* Card 3: Active Keys (Green) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#12141D] border border-gray-800/40 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/20 rounded-full blur-[30px] group-hover:bg-green-500/30 transition-colors duration-500 pointer-events-none"></div>
          <div className="absolute top-4 right-4 p-2 bg-green-500/10 rounded-xl text-green-400 z-10"><CheckCircle size={20} /></div>
          
          <div className="z-10 mt-auto">
            <div className="text-4xl font-bold font-num text-white mb-1">{activeKeys}</div>
            <div className="text-gray-400 text-sm font-medium">{t('admin.activeKeys')}</div>
          </div>
        </motion.div>

        {/* Card 4: Credit (Cyan/Blue) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#12141D] border border-gray-800/40 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-[30px] group-hover:bg-cyan-500/30 transition-colors duration-500 pointer-events-none"></div>
          <div className="absolute top-4 right-4 p-2 bg-cyan-500/10 rounded-xl text-cyan-400 z-10"><Coins size={20} /></div>
          
          <div className="z-10 mt-auto">
            <div className="text-4xl font-bold font-num text-white mb-1 truncate" title={totalCirculatingCredit.toString()}>
              {totalCirculatingCredit.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm font-medium">{t('admin.totalCredit')}</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Commands */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#161925]/80 backdrop-blur-md border border-gray-800/60 rounded-2xl p-6 mb-8 shadow-lg">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-primary rounded-full"></div>
          {t('admin.quickCommand')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Link to="/dashboard/partners" className="flex items-center justify-center gap-3 bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:from-green-500/20 hover:to-emerald-500/10 text-green-400 hover:text-green-300 border border-green-500/20 hover:border-green-500/40 p-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group">
            <div className="p-1.5 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Plus size={16} />
            </div>
            <span className="text-sm font-medium">{t('admin.addPartner')}</span>
          </Link>
          <Link to="/dashboard/keys" className="flex items-center justify-center gap-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:from-blue-500/20 hover:to-cyan-500/10 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 p-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group">
            <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Search size={16} />
            </div>
            <span className="text-sm font-medium">{t('admin.manageKeys')}</span>
          </Link>
          <Link to="/dashboard/settings" className="flex items-center justify-center gap-3 bg-gradient-to-br from-purple-500/10 to-pink-500/5 hover:from-purple-500/20 hover:to-pink-500/10 text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 p-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
            <div className="p-1.5 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Shield size={16} />
            </div>
            <span className="text-sm font-medium">{t('admin.securitySettings')}</span>
          </Link>
          <button 
            onClick={() => setIsPackageSettingsModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-br from-orange-500/10 to-amber-500/5 hover:from-orange-500/20 hover:to-amber-500/10 text-orange-400 hover:text-orange-300 border border-orange-500/20 hover:border-orange-500/40 p-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] group"
          >
            <div className="p-1.5 bg-orange-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Settings2 size={16} />
            </div>
            <span className="text-sm font-medium">{t('admin.packageSettings')}</span>
          </button>
        </div>
      </motion.div>

      {/* Stock Refill System */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#161925]/80 backdrop-blur-md border border-gray-800/60 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
          <div>
            <h2 className="text-white font-bold mb-1 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-purple-400 to-primary rounded-full"></div>
              {t('admin.masterStock')}
            </h2>
            <p className="text-sm text-gray-400 pl-3.5">{t('admin.masterStockDesc')}</p>
          </div>
          <div className="text-right bg-[#1C1F2E]/50 px-5 py-3 rounded-2xl border border-gray-800/60">
            <div className="text-xs font-medium text-gray-400 mb-1">{t('admin.yourCredit')}</div>
            <div className="text-2xl font-bold font-num bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">{useStore(s => s.adminBalance).toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => {
            const stockRemaining = keys.filter(k => k.durationDays === pkg.days && k.status === 'unused').length;
            
            // Generate a soft accent color for backgrounds and borders
            const accentClass = 
              pkg.days === 1 ? 'from-blue-500/20 to-cyan-500/5 border-blue-500/30 text-blue-400' :
              pkg.days === 3 ? 'from-green-500/20 to-emerald-500/5 border-green-500/30 text-green-400' :
              pkg.days === 7 ? 'from-orange-500/20 to-amber-500/5 border-orange-500/30 text-orange-400' :
              'from-purple-500/20 to-pink-500/5 border-purple-500/30 text-purple-400';

            // Generate a bright, fully opaque gradient for the text
            const textGradient = 
              pkg.days === 1 ? 'from-blue-400 to-cyan-300' :
              pkg.days === 3 ? 'from-green-400 to-emerald-300' :
              pkg.days === 7 ? 'from-orange-400 to-amber-300' :
              'from-purple-400 to-pink-300';

            return (
              <div key={pkg.days} className="bg-gradient-to-b from-[#1A1D2A] to-[#12141D] border border-gray-800/60 p-5 rounded-2xl hover:border-primary/50 transition-all duration-300 group flex flex-col justify-between h-full hover:shadow-[0_0_30px_rgba(123,97,255,0.1)] hover:-translate-y-1">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`font-extrabold font-num text-xl bg-gradient-to-br ${textGradient} bg-clip-text text-transparent drop-shadow-sm`}>
                      {pkg.label}
                    </div>
                    <div className={`bg-gradient-to-br font-num ${accentClass} px-3 py-1.5 rounded-lg text-xs font-bold border shadow-inner`}>
                      -{pkg.cost} {t('reseller.credit')}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 font-medium">{t('admin.keyUsage', { days: pkg.days })}</p>
                  
                  <div className="bg-black/20 rounded-xl p-4 mb-5 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-xs text-gray-400 mb-1 font-medium relative z-10">{t('admin.stockReady')}</div>
                    <div className="text-2xl font-bold font-num text-white relative z-10 flex items-baseline gap-1">
                      {stockRemaining} <span className="text-sm font-normal font-sans text-gray-500">{t('admin.keysUnit')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRefillingPackage(pkg)}
                    className="flex-1 py-3 bg-gradient-to-r from-[#2A2E40] to-[#1C1F2E] hover:from-primary hover:to-blue-600 text-gray-300 hover:text-white rounded-xl font-medium transition-all text-sm shadow-md hover:shadow-[0_0_20px_rgba(123,97,255,0.4)]"
                  >
                    {t('admin.refillStock')}
                  </button>
                  <button 
                    onClick={() => {
                      if(stockRemaining === 0) {
                        toast.error(t('admin.noStockToClear', { label: pkg.label }));
                        return;
                      }
                      setPackageToClear({ days: pkg.days, label: pkg.label, count: stockRemaining });
                    }}
                    className={`px-3 py-3 rounded-xl border transition-all flex-shrink-0 ${
                      stockRemaining > 0 
                        ? 'bg-[#1C1F2E] hover:bg-red-500/10 text-gray-400 hover:text-red-400 border-transparent hover:border-red-500/20' 
                        : 'bg-[#1C1F2E]/30 text-gray-600 border-transparent cursor-not-allowed'
                    }`}
                    title="ล้างสต็อก"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
      
      <RefillStockModal 
        packageData={refillingPackage}
        onClose={() => setRefillingPackage(null)}
      />
      
      <PackageSettingsModal 
        isOpen={isPackageSettingsModalOpen}
        onClose={() => setIsPackageSettingsModalOpen(false)}
      />

      <PinModal
        isOpen={packageToClear !== null}
        onClose={() => setPackageToClear(null)}
        title={t('admin.clearStockConfirmTitle', { label: packageToClear?.label || '' })}
        subtitle={t('admin.clearStockConfirmDesc', { count: packageToClear?.count || 0 })}
        onSuccess={() => {
          if (packageToClear) {
            clearStockByDuration(packageToClear.days);
            toast.success(t('admin.stockCleared', { label: packageToClear.label }));
          }
        }}
      />
    </div>
  );
}
