import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Plus, Minus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

interface ManageCreditModalProps {
  partnerId: string | null;
  onClose: () => void;
}

export function ManageCreditModal({ partnerId, onClose }: ManageCreditModalProps) {
  const { partners, updatePartnerBalance } = useStore();
  const [amount, setAmount] = useState('');
  
  const partner = partners.find(p => p.id === partnerId);

  useEffect(() => {
    if (partner) {
      // Remove decimals (satang)
      setAmount(Math.floor(partner.balance).toString());
    }
  }, [partner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerId && amount !== '') {
      updatePartnerBalance(partnerId, parseInt(amount, 10));
      onClose();
      toast.success('อัปเดตยอดเครดิตสำเร็จ!');
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
                  <h2 className="text-xl font-bold text-white mb-1">จัดการเครดิต</h2>
                  <p className="text-xs text-gray-400">ปรับยอดเครดิตของพาร์ทเนอร์: <span className="text-white font-bold">{partner.username}</span></p>
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
                  <label className="block text-xs font-medium text-gray-400 mb-2">ยอดเครดิต (Credit Balance)</label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setAmount(prev => Math.max(0, parseInt(prev || '0') - 1).toString())}
                      className="bg-[#1C1F2E] p-3 rounded-xl border border-gray-800/60 hover:bg-[#252A3D] text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <Minus size={20} />
                    </button>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} // only digits
                      placeholder="0" 
                      className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white text-center font-bold text-lg placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={() => setAmount(prev => (parseInt(prev || '0') + 1).toString())}
                      className="bg-[#1C1F2E] p-3 rounded-xl border border-gray-800/60 hover:bg-[#252A3D] text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.3)] flex items-center justify-center gap-2"
                >
                  <Coins size={18} />
                  บันทึกเครดิต
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
