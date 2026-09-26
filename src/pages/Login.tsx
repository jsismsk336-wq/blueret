import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonLogo } from '../components/ui/NeonLogo';
import dnaBg from '../assets/dna-bg.png';
import { NeonInput } from '../components/ui/NeonInput';
import { GradientButton } from '../components/ui/GradientButton';
import { useStore } from '../store/useStore';
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
  formatLockoutTime,
  loginDelay,
  initSecurityHardening,
} from '../utils/security';
import toast from 'react-hot-toast';
import { ShieldCheck, Zap, Sparkles, ArrowRight, ShoppingBag, ArrowLeft, PackageCheck } from 'lucide-react';

export function Login() {
  const [showLanding, setShowLanding] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(0);
  const navigate = useNavigate();
  const { login, globalLogoUrl, landingBgUrl, packages, products, keys } = useStore();

  // Init security hardening (right-click, devtools keys)
  useEffect(() => {
    const cleanup = initSecurityHardening();
    return cleanup;
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutMs <= 0) return;
    const interval = setInterval(() => {
      setLockoutMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutMs]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || lockoutMs > 0) return;

    // 1. Rate limit check
    const { allowed, remainingMs } = checkLoginAllowed(username);
    if (!allowed) {
      setLockoutMs(remainingMs);
      toast.error(`บัญชีถูกล็อก กรุณารอ ${formatLockoutTime(remainingMs)}`);
      return;
    }

    setLoading(true);

    // 2. Anti-bot delay
    const result = login(username, password);
    await loginDelay(result !== 'error');

    setLoading(false);

    if (result === 'admin') {
      recordLoginSuccess(username);
      toast.success('ยินดีต้อนรับ Admin!');
      navigate('/dashboard');
    } else if (result === 'reseller') {
      recordLoginSuccess(username);
      toast.success(`ยินดีต้อนรับ ${username}!`);
      navigate('/reseller');
    } else {
      // 3. Record failure + check if now locked
      const { locked, attemptsLeft } = recordLoginFailure(username);
      if (locked) {
        setLockoutMs(5 * 60 * 1000);
        toast.error('เข้าสู่ระบบผิดพลาดเกินกำหนด บัญชีถูกล็อก 5 นาที!');
      } else {
        toast.error(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${attemptsLeft} ครั้ง)`);
      }
      setPassword('');
    }
  };

  const isLocked = lockoutMs > 0;
  const lockSeconds = Math.ceil(lockoutMs / 1000);

  return (
    <div className="min-h-screen flex flex-col justify-between items-center relative px-4 overflow-hidden bg-black font-sans text-white select-none">
      {/* Dynamic Background Image / Pitch Black Red Atmospheric Glow */}
      {landingBgUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity scale-105 transition-all duration-1000"
          style={{ backgroundImage: `url('${landingBgUrl}')` }}
        />
      )}
      
      {/* Red Glowing Orbs (Exact X2SQUAD Store Style) */}
      <div 
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(230, 0, 0, 0.35) 0%, transparent 65%)" }} 
        className="pointer-events-none absolute top-0 left-1/2 z-0 h-[100vh] w-[100vw] -translate-x-1/2" 
      />
      <div 
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(230, 0, 0, 0.25) 0%, transparent 70%)" }} 
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-[40vh] w-[120vw] -translate-x-1/2 opacity-20" 
      />

      {/* Grid Lines Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_25%,#000_60%,transparent_100%)]" 
      />

      <AnimatePresence mode="wait">
        {showLanding ? (
          /* ========================================================================= */
          /* LANDING INTRO PAGE (EXACT X2SQUAD STORE STYLING)                          */
          /* ========================================================================= */
          <motion.div
            key="landing-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 flex-1 flex flex-col items-center justify-between w-full max-w-[980px] mx-auto pt-[clamp(40px,8vh,100px)] pb-4 text-center select-none"
          >
            {/* Center Main Content Container */}
            <div className="my-auto flex flex-col items-center w-full">
              {/* Dynamic Logo (Connected to Admin Backend Settings) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-6 relative cursor-pointer group"
                onClick={() => setShowLanding(false)}
              >
                {globalLogoUrl ? (
                  <div className="relative p-2">
                    <div className="absolute inset-0 bg-red-600/30 rounded-2xl blur-xl group-hover:bg-red-600/50 transition-all duration-500" />
                    <img 
                      src={globalLogoUrl} 
                      alt="LUCKY STORE Logo" 
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 filter drop-shadow-[0_0_20px_rgba(230,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <NeonLogo size="lg" />
                )}
              </motion.div>

              {/* Red Live Pill Badge (Exact X2SQUAD Pill) */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="mb-6 inline-flex cursor-default items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 shadow-[0_0_15px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e60000] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e60000] shadow-[0_0_10px_#e60000]"></span>
                </span>
                <p className="m-0 text-xs sm:text-sm font-medium tracking-[0.04em] text-white/70">
                  WELCOME TO <span className="font-semibold text-white">LUCKY STORE</span>
                </p>
              </motion.div>

              {/* Hero Main Heading (Exact X2SQUAD Typography & Color) */}
              <motion.h1 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                className="text-3xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-sm"
              >
                ยินดีต้อนรับสู่{' '}
                <span 
                  style={{ backgroundImage: "linear-gradient(135deg, #e60000 0%, #ff4d4d 50%, #cc0000 100%)" }}
                  className="bg-clip-text text-transparent bg-gradient-to-r drop-shadow-[0_0_25px_rgba(230,0,0,0.45)]"
                >
                  LUCKY STORE
                </span>
              </motion.h1>

              {/* Subtitle / Description (Exact X2SQUAD Text Size & Color) */}
              <motion.p 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
                className="mx-auto mt-4 max-w-[620px] text-sm sm:text-base font-normal leading-relaxed text-white/60 sm:mt-5"
              >
                LUCKY STORE — ร้านบริการจำหน่ายคีย์และสินค้าดิจิทัลอัตโนมัติ
                <br className="hidden md:inline" />
                ตอบโจทย์ทุกการใช้งาน ปลอดภัย ใช้งานง่าย ได้รับของทันที 24 ชั่วโมง
              </motion.p>

              {/* Feature Badges (Exact X2SQUAD Pill Buttons) */}
              <motion.div 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.32 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-white/55 sm:gap-3"
              >
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1 backdrop-blur-md">
                  <Zap className="size-3.5 text-[#e60000]" />
                  <span>ระบบอัตโนมัติ 24 ชม.</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1 backdrop-blur-md">
                  <ShieldCheck className="size-3.5 text-[#e60000]" />
                  <span>ปลอดภัย มั่นใจได้ 100%</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1 backdrop-blur-md">
                  <Sparkles className="size-3.5 text-[#e60000]" />
                  <span>บริการรวดเร็วทันใจ</span>
                </div>
              </motion.div>

              {/* Action Buttons (Exact X2SQUAD Gradient & Border Style) */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
                className="mt-8 flex w-full flex-col items-center justify-center gap-3.5 sm:mt-9 sm:w-auto sm:flex-row"
              >
                <button
                  onClick={() => setShowLanding(false)}
                  style={{ background: "linear-gradient(135deg, #e60000 0%, #ff3333 100%)" }}
                  className="group relative inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl px-7 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(230,0,0,0.6)] active:scale-[0.98] sm:w-auto shadow-[0_0_30px_rgba(230,0,0,0.4)]"
                >
                  <span>เข้าสู่เว็บไซต์</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => setShowStockModal(true)}
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 text-sm font-medium text-white/90 transition-all duration-200 hover:scale-[1.02] hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.98] sm:w-auto"
                >
                  <ShoppingBag className="size-4 text-white/70" />
                  <span>ดูสินค้าทั้งหมด</span>
                </button>
              </motion.div>
            </div>

            {/* Footer Text (Anchored naturally at bottom of the full screen height) */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 text-xs tracking-wide text-white/40 pointer-events-none whitespace-nowrap z-20 pb-2"
            >
              © 2026 LUCKY STORE — All rights reserved.
            </motion.p>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* LOGIN FORM MODAL CARD                                                     */
          /* ========================================================================= */
          <motion.div
            key="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[420px] relative z-10 my-8"
          >
            <button
              onClick={() => setShowLanding(true)}
              className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-black/40 border border-gray-800 backdrop-blur-md cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>ย้อนกลับหน้าแรก</span>
            </button>

            <GlassCard className="w-full p-8 md:p-10 flex flex-col items-center border-red-500/10 bg-[#0B0E14]/80 backdrop-blur-xl shadow-[0_0_50px_rgba(230,0,0,0.15)]">
              {/* Dynamic Logo inside Login Card */}
              <div className="mb-4 relative">
                {globalLogoUrl ? (
                  <img 
                    src={globalLogoUrl} 
                    alt="LUCKY Logo" 
                    className="w-20 h-20 object-contain filter drop-shadow-[0_0_15px_rgba(230,0,0,0.6)]" 
                  />
                ) : (
                  <NeonLogo size="lg" />
                )}
              </div>
              
              <h1 className="text-2xl font-bold tracking-wider text-white mb-1">LUCKY STORE</h1>
              <p className="text-xs text-gray-400 tracking-[0.2em] mb-6 font-medium uppercase">VOLUMETRIC GATEWAY</p>
              
              <div className="w-full flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-800 flex-1"></div>
                <span className="text-[10px] uppercase tracking-widest text-red-400/80 font-semibold">เข้าสู่ระบบหลังบ้าน</span>
                <div className="h-px bg-gray-800 flex-1"></div>
              </div>

              {isLocked && (
                <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                  <p className="text-red-400 text-sm font-medium">🔒 บัญชีถูกล็อกชั่วคราว</p>
                  <p className="text-red-300 text-xs mt-1">รอ {lockSeconds} วินาที</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
                <NeonInput
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  disabled={isLocked}
                />
                
                <NeonInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLocked}
                />

                <GradientButton
                  type="submit"
                  className="py-3.5 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_20px_rgba(230,0,0,0.4)]"
                  disabled={loading || isLocked}
                >
                  {loading ? 'กำลังตรวจสอบ...' : isLocked ? `ล็อก ${lockSeconds}s` : 'เข้าสู่ระบบ (Sign In)'}
                </GradientButton>
              </form>

              <p className="mt-8 text-[11px] text-gray-500 tracking-wide text-center">
                © 2026 <span className="text-gray-400 font-semibold">LUCKY STORE</span> · All rights reserved.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Preview Modal */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#12141F] border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <PackageCheck className="text-red-500" />
                  <span>รายการแพ็กเกจสินค้า (LUCKY STORE)</span>
                </div>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                รายการแพ็กเกจสินค้าพร้อมระบบส่งของอัตโนมัติ 24 ชั่วโมง
              </p>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {products.length > 0 ? (
                  products.map((prod) => {
                    const totalStock = keys.filter(k => k.productId === prod.id && k.status === 'unused').length;
                    return (
                      <div key={prod.id} className="bg-[#0B0E14] border border-gray-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.title} className="w-12 h-12 object-cover rounded-lg border border-gray-800" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-xs text-gray-400">สินค้า</div>
                          )}
                          <div>
                            <h4 className="text-white font-bold text-sm">{prod.title}</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{prod.description || 'ระบบเบิกสินค้าอัตโนมัติ 24 ชม.'}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${totalStock > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                            {totalStock > 0 ? `สต็อก ${totalStock} ชิ้น` : 'สินค้าหมด'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 text-sm py-8">ไม่มีรายการสินค้าในขณะนี้</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setShowLanding(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white font-bold text-xs"
                >
                  เข้าสู่ระบบเพื่อสั่งซื้อ ➔
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
