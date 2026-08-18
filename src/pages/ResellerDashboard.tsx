import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { Coins, KeyRound, ShoppingCart, Copy, CheckCircle, X, Package, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCsrfToken, initSecurityHardening } from '../utils/security';
import { AnnouncementPopupModal } from '../components/ui/AnnouncementPopupModal';
import type { LicenseKey } from '../store/useStore';

// ─── Result Modal (multi-key) ─────────────────────────────────────────────────
function KeyResultModal({ keys, onClose }: { keys: LicenseKey[]; onClose: () => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleCopy = (id: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedId(id);
    toast.success(t('reseller.copySuccess'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allKeys = keys.map(k => k.keyString).join('\n');
    navigator.clipboard.writeText(allKeys);
    toast.success(t('reseller.copyAllSuccess', { qty: keys.length }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-[#13151E] border border-green-500/30 w-full max-w-lg p-6 rounded-2xl pointer-events-auto shadow-[0_0_60px_rgba(34,197,94,0.15)] flex flex-col max-h-[85vh]"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5 shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl border border-green-500/20">
              <CheckCircle size={26} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('reseller.pullSuccess')}</h2>
              <p className="text-gray-400 text-xs">
                {t('reseller.receivedKeys')} <span className="text-green-400 font-bold">{keys.length} {t('reseller.keys')}</span> · 
                {keys[0] ? (keys[0].durationDays < 0 ? `${Math.abs(keys[0].durationDays)} Hour(s)` : `${keys[0].durationDays} ${t('reseller.days')}`) : ''}/Device
              </p>
            </div>
          </div>

          {/* Key list - scrollable */}
          <div className="overflow-y-auto flex-1 space-y-2 mb-4 pr-1">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-2.5 gap-3">
                <span className="font-mono text-green-300 text-sm tracking-wide truncate flex-1">{k.keyString}</span>
                <button
                  onClick={() => handleCopy(k.id, k.keyString)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copiedId === k.id
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-[#1C1F2E] text-gray-400 hover:text-white'
                  }`}
                >
                  {copiedId === k.id ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copiedId === k.id ? t('reseller.copied') : t('reseller.copy')}
                </button>
              </div>
            ))}
          </div>

          {/* Copy all button */}
          {keys.length > 1 && (
            <button
              onClick={handleCopyAll}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all text-sm bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(66,133,244,0.3)] shrink-0"
            >
              <Copy size={16} />
              {t('reseller.copyAll', { qty: keys.length })}
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Quantity Picker ──────────────────────────────────────────────────────────
function QuantityPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const decrement = () => onChange(Math.max(1, value - 1));
  const increment = () => onChange(Math.min(50, value + 1));

  return (
    <div className="flex items-center gap-1 bg-[#0F111A] border border-gray-800/60 rounded-xl px-1 py-1">
      <button
        onClick={decrement}
        disabled={value <= 1}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        min={1}
        max={50}
        value={value}
        onChange={(e) => {
          const v = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
          onChange(v);
        }}
        className="w-10 text-center bg-transparent text-white text-sm font-bold focus:outline-none"
      />
      <button
        onClick={increment}
        disabled={value >= 50}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function ResellerDashboard() {
  const { currentReseller, packages, keys, redeemKey } = useStore();
  const { t } = useTranslation();
  const [resultKeys, setResultKeys] = useState<LicenseKey[] | null>(null);
  const [redeemingDays, setRedeemingDays] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    const cleanup = initSecurityHardening();
    return cleanup;
  }, []);

  const partner = currentReseller;
  if (!partner) return null;

  const getStock = (days: number) => keys.filter(k => k.durationDays === days && k.status === 'unused').length;
  const getQty = (days: number) => quantities[days] ?? 1;
  const setQty = (days: number, v: number) => setQuantities(prev => ({ ...prev, [days]: v }));

  const isGlobalLocked = redeemingDays !== null || Date.now() < cooldownUntil;

  const handleRedeem = async (days: number) => {
    if (isGlobalLocked) {
      toast.error(t('reseller.waitPrevious'));
      return;
    }

    const token = getCsrfToken();
    if (!token) {
      toast.error(t('reseller.invalidSession'));
      return;
    }

    const qty = getQty(days);
    setRedeemingDays(days);
    const result = await redeemKey(days, qty, token);
    setRedeemingDays(null);

    if (result === 'no_credit') {
      toast.error(t('reseller.notEnoughCredit'));
    } else if (result === 'no_stock') {
      toast.error(t('reseller.stockEmpty'));
    } else if (result === 'csrf_error') {
      toast.error(t('reseller.securityError'));
    } else if (result === 'locked') {
      toast.error(t('reseller.processing'));
    } else if (typeof result === 'string' && result.startsWith('transaction_error:')) {
      toast.error(`ระบบขัดข้อง: ${result.split(':')[1]}`);
    } else if (Array.isArray(result)) {
      if (result.length < qty) {
        toast(t('reseller.partialKeys', { received: result.length, requested: qty }), { icon: '⚠️' });
      }
      setCooldownUntil(Date.now() + 2000);
      setResultKeys(result);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative min-h-full">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[500px] bg-gradient-to-bl from-blue-600/20 to-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[400px] bg-gradient-to-tr from-emerald-600/10 to-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-bold text-blue-400">RESELLER PORTAL</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          สวัสดี, <span className="text-primary">{partner.username}</span> 👋
        </h1>
        <p className="text-gray-400 text-sm">เลือกแพ็กเกจ กำหนดจำนวน และกดดึงคีย์ได้เลย</p>
      </div>

      {/* Credit Card - Enhanced Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1c2135] via-[#12141D] to-[#0a0c13] border border-blue-500/20 rounded-3xl p-8 mb-10 relative overflow-hidden z-10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] group"
      >
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-[-50%] left-10 w-48 h-48 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        <div className="flex flex-col relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Coins size={22} className="text-blue-400" />
            </div>
            <span className="text-blue-100/70 font-medium tracking-wide">{t('reseller.creditBalance')}</span>
          </div>
          <div className="text-5xl font-bold text-white tracking-tight flex items-baseline gap-2">
            {partner.balance.toLocaleString()}
            <span className="text-lg font-medium text-blue-200/50">{t('reseller.credit')}</span>
          </div>
        </div>
      </motion.div>

      {/* Packages */}
      <div className="mb-4 flex items-center gap-2 z-10 relative">
        <Package size={18} className="text-gray-400" />
        <h2 className="text-white font-bold">{t('reseller.selectPackage')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {packages.map((pkg) => {
          const stock = getStock(pkg.days);
          const qty = getQty(pkg.days);
          const unitCost = partner.customPrices?.[pkg.days] ?? pkg.cost;
          const totalCost = unitCost * qty;
          const canAfford = partner.balance >= unitCost; 
          const canAffordQty = partner.balance >= totalCost;
          const available = stock > 0 && canAfford;

          const accentClass = 
            pkg.days === 1 ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/5 border-blue-500/30 text-blue-400' :
            pkg.days === 3 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/5 border-green-500/30 text-green-400' :
            pkg.days === 7 ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/5 border-orange-500/30 text-orange-400' :
            'bg-gradient-to-br from-purple-500/20 to-pink-500/5 border-purple-500/30 text-purple-400';

          const textGradient = 
            pkg.days === 1 ? 'from-blue-400 via-cyan-300 to-blue-200' :
            pkg.days === 3 ? 'from-green-400 via-emerald-300 to-green-200' :
            pkg.days === 7 ? 'from-orange-400 via-amber-300 to-orange-200' :
            'from-purple-400 via-pink-300 to-purple-200';

          const glowHoverClass =
            pkg.days === 1 ? 'hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)] hover:border-blue-500/40' :
            pkg.days === 3 ? 'hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/40' :
            pkg.days === 7 ? 'hover:shadow-[0_10px_40px_rgba(249,115,22,0.15)] hover:border-orange-500/40' :
            'hover:shadow-[0_10px_40px_rgba(168,85,247,0.15)] hover:border-purple-500/40';

          const buttonGradient = 
            pkg.days === 1 ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_5px_20px_rgba(59,130,246,0.3)] border-blue-400/20' :
            pkg.days === 3 ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-[0_5px_20px_rgba(16,185,129,0.3)] border-emerald-400/20' :
            pkg.days === 7 ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-[0_5px_20px_rgba(249,115,22,0.3)] border-orange-400/20' :
            'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_5px_20px_rgba(168,85,247,0.3)] border-purple-400/20';

          return (
            <motion.div
              key={pkg.days}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-b from-[#1A1D2A] to-[#12141D] rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden group ${
                available ? `border border-gray-700/50 hover:-translate-y-1 ${glowHoverClass}` : 'border border-gray-800/30 opacity-70'
              }`}
            >
              {available && <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>}
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${textGradient} text-2xl drop-shadow-sm tracking-normal`}>
                    {pkg.label}
                  </div>
                  <div className={`text-xs mt-1.5 font-bold ${accentClass} inline-block px-2.5 py-1 rounded-md shadow-inner`}>
                    {unitCost} {t('reseller.keyPerCredit')}
                  </div>
                </div>
                <div className={`text-xs px-2.5 py-1.5 rounded-xl font-bold shadow-sm ${
                  stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {stock > 0 ? `${t('reseller.stock')} ${stock}` : t('reseller.outOfStock')}
                </div>
              </div>

              <div className="bg-[#0B0D14]/80 rounded-2xl p-4 border border-gray-800/50 mt-1 relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 bg-gray-800/50 rounded-lg">
                    <KeyRound size={14} className="text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-300 font-medium">{pkg.label}</span>
                </div>
                {/* Quantity picker */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('reseller.quantity')}</span>
                  <QuantityPicker
                    value={qty}
                    onChange={(v) => setQty(pkg.days, v)}
                  />
                </div>
                {/* Total cost */}
                <div className="mt-3 text-right">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${
                    canAffordQty ? accentClass : 'bg-red-500/10 text-red-400 border border-red-500/10'
                  }`}>
                    {t('reseller.total', { cost: totalCost.toLocaleString() })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRedeem(pkg.days)}
                disabled={!available || isGlobalLocked}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all select-none relative z-10 ${
                  redeemingDays === pkg.days
                    ? 'bg-gray-800/50 text-white cursor-not-allowed animate-pulse border border-gray-700/30'
                    : available && !isGlobalLocked
                      ? canAffordQty
                        ? `${buttonGradient} text-white active:scale-[0.98] border`
                        : 'bg-red-500/80 hover:bg-red-500 text-white active:scale-[0.98] border border-red-400/20 shadow-[0_5px_20px_rgba(239,68,68,0.3)]'
                      : 'bg-gray-800/40 text-gray-500 cursor-not-allowed border border-gray-700/30'
                }`}
              >
                {redeemingDays === pkg.days ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {t('reseller.pulling')}
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    {!canAfford ? t('reseller.noCredit') : stock === 0 ? t('reseller.outOfStock') : !canAffordQty ? t('reseller.pullKeys', { qty: Math.min(qty, Math.floor(partner.balance / unitCost), stock) }) : t('reseller.pullKeys', { qty })}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* API Token Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#1c2135] via-[#12141D] to-[#0a0c13] border border-blue-500/20 rounded-3xl p-8 mt-10 relative overflow-hidden z-10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <KeyRound size={22} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">API ดึงคีย์อัตโนมัติ (สำหรับร้านค้า/Bot)</h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-6 max-w-2xl">
          ใช้ API Token นี้นำไปเชื่อมกับระบบอัตโนมัติของตัวแทน (เช่น Discord Bot หรือ เว็บขายคีย์) 
          ระบบจะหักเครดิตตามจริง (รองรับราคาส่ง) และไม่อนุญาตให้ดึงถ้าไม่มีของในสต็อก
        </p>
        
        <div className="bg-[#0B0D14]/80 rounded-2xl p-5 border border-gray-800/50 relative mb-6">
          <div className="text-xs text-gray-500 mb-2 font-medium">API TOKEN ของคุณ (ห้ามให้ใครเด็ดขาด)</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="font-mono text-purple-300 text-sm tracking-wide bg-[#161925] px-4 py-3 rounded-xl border border-gray-800 flex-1 overflow-x-auto whitespace-nowrap">
              {partner.apiToken || 'ยังไม่มี API Token (ติดต่อแอดมินให้รีเซ็ตให้ 1 ครั้ง)'}
            </div>
            {partner.apiToken && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(partner.apiToken || '');
                  toast.success('คัดลอก API Token แล้ว');
                }}
                className="shrink-0 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-medium transition-all text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
              >
                <Copy size={16} /> คัดลอก
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-[#161925] rounded-2xl p-5 border border-gray-800/50">
           <div className="text-xs text-gray-400 mb-3 font-medium">ตัวอย่างการเรียกใช้งาน (Endpoint URL) แยกตามแพ็กเกจ</div>
           <div className="space-y-3">
             {packages.map(pkg => (
               <div key={pkg.days} className="bg-[#0F111A] p-3 rounded-xl border border-gray-800">
                 <div className="text-xs text-purple-400 mb-1.5 font-bold">▶ ลิงก์ดึงคีย์ {pkg.label}</div>
                 <code className="text-[12px] text-green-400 font-mono break-all block select-all">
                   GET /api/pull?token={partner.apiToken || 'YOUR_TOKEN'}&days={pkg.days}&qty=1
                 </code>
               </div>
             ))}
           </div>
        </div>
      </motion.div>

      {resultKeys && (
        <KeyResultModal keys={resultKeys} onClose={() => setResultKeys(null)} />
      )}

      <AnnouncementPopupModal />
    </div>
  );
}
