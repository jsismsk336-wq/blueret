import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Save, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

interface CustomPriceModalProps {
  partnerId: string | null;
  onClose: () => void;
}

export function CustomPriceModal({ partnerId, onClose }: CustomPriceModalProps) {
  const { partners, packages, updatePartnerCustomPrices } = useStore();
  const [localPrices, setLocalPrices] = useState<Record<number, string>>({});
  
  const partner = partners.find(p => p.id === partnerId);

  useEffect(() => {
    if (partnerId && partner) {
      // Initialize local state with current custom prices, or empty string if using default
      const initialPrices: Record<number, string> = {};
      packages.forEach(pkg => {
        initialPrices[pkg.days] = partner.customPrices?.[pkg.days] !== undefined 
          ? String(partner.customPrices[pkg.days])
          : '';
      });
      setLocalPrices(initialPrices);
    }
  }, [partnerId, partner, packages]);

  const handlePriceChange = (days: number, val: string) => {
    setLocalPrices(prev => ({ ...prev, [days]: val }));
  };

  const handleReset = (days: number) => {
    setLocalPrices(prev => ({ ...prev, [days]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return;

    const newCustomPrices: Record<number, number> = {};
    Object.entries(localPrices).forEach(([daysStr, val]) => {
      const days = parseInt(daysStr, 10);
      if (val !== '' && !isNaN(parseInt(val, 10))) {
        newCustomPrices[days] = parseInt(val, 10);
      }
    });

    updatePartnerCustomPrices(partnerId, newCustomPrices);
    toast.success(`อัปเดตราคาพิเศษให้ ${partner?.username} สำเร็จ`);
    onClose();
  };

  if (!partnerId || !partner) return null;

  return (
    <AnimatePresence>
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
          className="bg-[#13151E] border border-gray-800/60 w-full max-w-lg p-6 rounded-2xl pointer-events-auto shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center mb-6 border-b border-gray-800/60 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <Tag size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">ตั้งราคาพิเศษ</h2>
                <p className="text-xs text-gray-400">กำหนดราคาสำหรับพาร์ทเนอร์ <span className="text-purple-400 font-bold">{partner.username}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1C1F2E] text-gray-400 hover:text-white transition-colors border border-gray-800/60"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto pr-2 flex-1 min-h-0 mb-6 custom-scrollbar">
            <form id="custom-price-form" onSubmit={handleSubmit} className="space-y-3">
              {packages.length === 0 ? (
                 <div className="text-center text-sm text-gray-500 py-4">ไม่มีแพ็กเกจในระบบ</div>
              ) : (
                packages.map((pkg) => {
                  const isCustom = localPrices[pkg.days] !== '';
                  return (
                    <div key={pkg.days} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isCustom ? 'bg-purple-500/5 border-purple-500/30' : 'bg-[#1C1F2E] border-gray-800/60'}`}>
                      <div>
                        <div className="font-bold text-white text-sm">{pkg.label}</div>
                        <div className="text-xs text-gray-400 mt-1">ราคาปกติ: {pkg.cost} เครดิต</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          placeholder={String(pkg.cost)}
                          value={localPrices[pkg.days] ?? ''}
                          onChange={(e) => handlePriceChange(pkg.days, e.target.value)}
                          className={`w-20 bg-[#0F111A] border rounded-lg px-2 py-1.5 text-white text-center font-bold text-sm focus:outline-none focus:border-purple-500/50 transition-colors ${isCustom ? 'border-purple-500/50 text-purple-400' : 'border-gray-700'}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleReset(pkg.days)}
                          disabled={!isCustom}
                          className="p-1.5 ml-1 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                          title="ใช้ราคาปกติ"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </form>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300">
                <strong className="text-blue-400">💡 คำแนะนำ:</strong> หากช่องไหนปล่อยว่างไว้ (หรือกดรีเซ็ต) ระบบจะไปใช้ราคาปกติตามแผงหลักแทนครับ
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800/60 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button 
              form="custom-price-form"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              <Save size={16} />
              บันทึกราคาพิเศษ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
