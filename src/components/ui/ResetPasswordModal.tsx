import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

interface ResetPasswordModalProps {
  partnerId: string | null;
  onClose: () => void;
}

export function ResetPasswordModal({ partnerId, onClose }: ResetPasswordModalProps) {
  const { partners, updatePartnerPassword } = useStore();
  const [newPassword, setNewPassword] = useState('');
  
  const partner = partners.find(p => p.id === partnerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerId && newPassword.trim() !== '') {
      updatePartnerPassword(partnerId, newPassword.trim());
      onClose();
      toast.success(`รีเซ็ตรหัสผ่านของ ${partner?.username} สำเร็จ!\nรหัสผ่านใหม่: ${newPassword.trim()}`, { duration: 5000 });
      setNewPassword(''); // clear after success
    } else {
      toast.error('กรุณากรอกรหัสผ่านใหม่');
    }
  };

  if (!partner) return null;

  return (
    <AnimatePresence>
      {partnerId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#161925] border border-gray-800/60 w-full max-w-md p-6 rounded-2xl pointer-events-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">รีเซ็ตรหัสผ่าน</h2>
                  <p className="text-xs text-gray-400">ตั้งรหัสผ่านใหม่สำหรับพาร์ทเนอร์: <span className="text-white font-bold">{partner.username}</span></p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[#1C1F2E] text-gray-400 hover:text-white transition-colors border border-gray-800/60"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-400 mb-2">รหัสผ่านใหม่ (New Password)</label>
                  <input 
                    type="text" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านที่ต้องการตั้ง..." 
                    className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.3)] flex items-center justify-center gap-2"
                >
                  <KeyRound size={18} />
                  บันทึกรหัสผ่านใหม่
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
