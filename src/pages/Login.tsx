import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpaceBackground } from '../components/ui/SpaceBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonLogo } from '../components/ui/NeonLogo';
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

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(0);
  const navigate = useNavigate();
  const { login } = useStore();

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
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <SpaceBackground />
      
      <GlassCard className="w-full max-w-[420px] p-8 md:p-10 flex flex-col items-center">
        <div className="mb-4">
          <NeonLogo />
        </div>
        
        <h1 className="text-2xl font-bold tracking-wider text-white mb-1">BLUERET</h1>
        <p className="text-xs text-gray-400 tracking-[0.2em] mb-8 font-medium">VOLUMETRIC GATEWAY</p>
        
        <div className="w-full flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-800 flex-1"></div>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Secure Authentication</span>
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
            placeholder="Enter username"
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
            className="py-3 mt-2"
            disabled={loading || isLocked}
          >
            {loading ? 'กำลังตรวจสอบ...' : isLocked ? `ล็อก ${lockSeconds}s` : 'Sign In'}
          </GradientButton>
        </form>

        <p className="mt-8 text-[11px] text-gray-600 tracking-wide">
          © 2026 <span className="text-gray-400">Blueret Corp</span> · Security Layer
        </p>
      </GlassCard>
    </div>
  );
}
