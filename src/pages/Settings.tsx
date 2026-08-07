import { useState } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน!');
      return;
    }
    toast.success('เปลี่ยนรหัสผ่านสำเร็จ!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">ศูนย์ตั้งค่าความปลอดภัย</h1>
        <p className="text-gray-400 text-sm">จัดการรหัสผ่านและรักษาความปลอดภัยบัญชีผู้ดูแลระบบหลัก</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161925] border border-gray-800/60 rounded-2xl p-6 max-w-xl">
        <div className="flex items-center gap-2 text-white font-medium mb-6">
          <Lock size={18} className="text-primary" />
          <span>เปลี่ยนรหัสผ่านหลัก</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">รหัสผ่านปัจจุบัน</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านปัจจุบัน" 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">รหัสผ่านใหม่</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่" 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">ยืนยันรหัสผ่านใหม่</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง" 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <button 
            type="submit"
            className="mt-2 w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.3)]"
          >
            ยืนยันการเปลี่ยนรหัสผ่าน
          </button>
        </form>
      </motion.div>
    </div>
  );
}
