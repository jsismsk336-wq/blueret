import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPartnerModal({ isOpen, onClose }: AddPartnerModalProps) {
  const { addPartner } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      addPartner(username, password);
      setUsername('');
      setPassword('');
      onClose();
      toast.success(`เพิ่มพาร์ทเนอร์ "${username}" สำเร็จแล้ว!`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                  <h2 className="text-xl font-bold text-white mb-1">ลงทะเบียนพาร์ทเนอร์</h2>
                  <p className="text-xs text-gray-400">เพิ่มบัญชีพาร์ทเนอร์ใหม่เข้าสู่ระบบ</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[#1C1F2E] text-gray-400 hover:text-white transition-colors border border-gray-800/60"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-400 mb-2">ชื่อผู้ใช้งาน (Username)</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="กรอกชื่อพาร์ทเนอร์" 
                    className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-400 mb-2">รหัสผ่าน (Password)</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน" 
                    className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.3)] flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  ยืนยันการลงทะเบียน
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
