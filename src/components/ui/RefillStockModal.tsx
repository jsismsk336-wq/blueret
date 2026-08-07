import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

interface RefillStockModalProps {
  packageData: { days: number; label: string; cost: number } | null;
  onClose: () => void;
}

export function RefillStockModal({ packageData, onClose }: RefillStockModalProps) {
  const { importKeys } = useStore();
  const [separator, setSeparator] = useState('enter');
  const [stockData, setStockData] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (packageData && stockData.trim() !== '') {
      let sep = '\n';
      if (separator === 'comma') sep = ',';
      
      // Parse keys
      const keys = stockData
        .split(sep)
        .map(k => k.trim())
        .filter(k => k.length > 0);
        
      if (keys.length > 0) {
        importKeys(packageData.days, keys, 'แอดมินหลัก');
        toast.success(`เพิ่มสต็อกสำเร็จ จำนวน ${keys.length} รายการ`);
        setStockData('');
        onClose();
      } else {
        toast.error('ไม่พบข้อมูลสต็อกที่ถูกต้อง');
      }
    }
  };

  if (!packageData) return null;

  return (
    <AnimatePresence>
      {packageData && (
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
              className="bg-[#13151E] border border-gray-800/60 w-full max-w-md p-6 rounded-2xl pointer-events-auto shadow-2xl"
            >
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">เพิ่มสต็อก ({packageData.label})</h2>
                  </div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ตัวคั่นข้อมูล</label>
                  <div className="relative">
                    <select 
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      className="w-full appearance-none bg-[#1C1F2E] border border-gray-800/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="enter">เว้นบรรทัด (Enter)</option>
                      <option value="comma">ลูกน้ำ (Comma ,)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-300">ข้อมูลสต็อก</label>
                    {stockData.trim() !== '' && (
                      <div className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg animate-in fade-in zoom-in duration-200">
                        กำลังเพิ่ม <span className="font-num text-[13px]">{
                          stockData
                            .split(separator === 'comma' ? ',' : '\n')
                            .map(k => k.trim())
                            .filter(k => k.length > 0).length
                        }</span> รายการ
                      </div>
                    )}
                  </div>
                  <textarea 
                    required
                    rows={6}
                    value={stockData}
                    onChange={(e) => setStockData(e.target.value)}
                    placeholder="username1:password1&#10;username2:password2&#10;license_key_1" 
                    className="w-full bg-[#1C1F2E] border border-gray-800/60 rounded-xl px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none font-mono text-sm leading-relaxed"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors text-sm font-medium"
                  >
                    ปิด
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#8A2535] hover:bg-[#A32B3E] text-white transition-colors text-sm font-medium"
                  >
                    เพิ่มสต็อก
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
