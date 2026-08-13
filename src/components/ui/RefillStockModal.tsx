import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CloudLightning, Keyboard, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface RefillStockModalProps {
  packageData: { days: number; label: string; cost: number } | null;
  onClose: () => void;
}

export function RefillStockModal({ packageData, onClose }: RefillStockModalProps) {
  const { importKeys, apiEndpoint, apiToken } = useStore();
  const [activeTab, setActiveTab] = useState<'api' | 'manual'>('api');
  
  // API Tab State
  const [apiQty, setApiQty] = useState<number | ''>(1);
  
  // Manual Tab State
  const [separator, setSeparator] = useState('enter');
  const [stockData, setStockData] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (packageData && stockData.trim() !== '') {
      let sep = '\n';
      if (separator === 'comma') sep = ',';
      
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

  const handleApiGenerate = async () => {
    if (!apiQty || apiQty < 1 || apiQty > 100) {
      toast.error('กรุณาระบุจำนวน 1-100 คีย์');
      return;
    }
    
    if (!apiEndpoint || !apiToken) {
      toast.error('กรุณาตั้งค่า API Endpoint และ Token ในเมนูตั้งค่าก่อน');
      return;
    }

    const confirm = await MySwal.fire({
      title: 'ยืนยันการสร้างคีย์?',
      text: `คุณต้องการดึงคีย์จำนวน ${apiQty} คีย์ สำหรับแพ็กเกจ ${packageData?.label} ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#1F2937',
      background: '#13151E',
      color: '#fff',
    });

    if (confirm.isConfirmed) {
      let planValue: string | number = 'custom';
      const days = packageData!.days;
      
      // Use standard plans if they match exactly to avoid expensive custom pricing
      if (days === 1 || days === 7 || days === 30) {
        planValue = days.toString();
      }
      
      const daysParam = days > 0 ? days : 0;
      const hoursParam = days < 0 ? Math.abs(days) : 0;

      // Construct payload
      const payload: any = {
        plan: planValue,
        qty: apiQty
      };

      // Only attach custom days/hours if plan is custom
      if (planValue === 'custom') {
        payload.days = daysParam;
        payload.hours = hoursParam;
      }

      MySwal.fire({
        title: 'กำลังสร้างคีย์...',
        html: 'โปรดรอสักครู่ ระบบกำลังเชื่อมต่อกับแผงหลัก',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        },
        background: '#13151E',
        color: '#fff',
      });

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'X-Api-Token': apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok && data.ok) {
          const newKeys = data.keys.map((k: any) => k.key);
          if (newKeys.length > 0) {
            importKeys(packageData!.days, newKeys, 'API (แผงหลัก)');
            
            MySwal.fire({
              title: 'สำเร็จ!',
              text: `สร้างและนำเข้าสต็อกเรียบร้อยแล้ว จำนวน ${newKeys.length} คีย์`,
              icon: 'success',
              background: '#13151E',
              color: '#fff',
              confirmButtonColor: '#10B981',
            });
            onClose();
          } else {
             throw new Error('ไม่พบคีย์ใน Response');
          }
        } else {
          throw new Error(data.message || 'เกิดข้อผิดพลาดจาก API');
        }
      } catch (error: any) {
        MySwal.fire({
          title: 'ผิดพลาด',
          text: error.message || 'ไม่สามารถเชื่อมต่อ API ได้',
          icon: 'error',
          background: '#13151E',
          color: '#fff',
          confirmButtonColor: '#EF4444',
        });
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
              className="bg-[#13151E] border border-gray-800/60 w-full max-w-md rounded-2xl pointer-events-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-800/60 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">เพิ่มสต็อก ({packageData.label})</h2>
                  <p className="text-xs text-gray-400">เลือกวิธีเพิ่มคีย์เข้าสู่สต็อกสำหรับตัวแทนจำหน่าย</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[#1C1F2E] text-gray-400 hover:text-white transition-colors border border-gray-800/60"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6 pt-4 gap-4 border-b border-gray-800/60 shrink-0">
                <button
                  onClick={() => setActiveTab('api')}
                  className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors font-medium text-sm ${
                    activeTab === 'api' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <CloudLightning size={16} />
                  ดึงจาก API
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors font-medium text-sm ${
                    activeTab === 'manual' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Keyboard size={16} />
                  เพิ่มเอง (Manual)
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto">
                {activeTab === 'api' ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-[#1C1F2E]/50 border border-gray-800/60 p-5 rounded-xl text-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(123,97,255,0.2)]">
                        <CloudLightning size={24} />
                      </div>
                      <h3 className="text-white font-bold mb-1">เชื่อมต่อกับแผงหลัก</h3>
                      <p className="text-xs text-gray-400 mb-4">ระบบจะสร้างคีย์และหักเครดิตจากแผงหลักอัตโนมัติ</p>
                      
                      <div className="text-left">
                        <label className="block text-sm font-medium text-gray-300 mb-2">จำนวนคีย์ที่ต้องการสร้าง (1-100)</label>
                        <input 
                          type="number" 
                          min="1"
                          max="100"
                          value={apiQty}
                          onChange={(e) => setApiQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full bg-[#0F111A] border border-gray-700 rounded-xl px-4 py-3 text-white text-center font-bold focus:outline-none focus:border-primary/50 transition-colors text-lg shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleApiGenerate}
                      className="w-full relative group overflow-hidden rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-primary to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      <div className="relative px-6 py-4 flex items-center justify-center gap-2 drop-shadow-md">
                        <CloudLightning size={20} className="text-blue-200" />
                        ⚡ เจนคีย์เข้าคลัง
                      </div>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleManualSubmit} className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="mb-4">
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
                        <label className="block text-sm font-medium text-gray-300">ข้อมูลสต็อก (Text)</label>
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
                        placeholder="วางข้อมูลคีย์ตรงนี้..." 
                        className="w-full bg-[#1C1F2E] border border-gray-800/60 rounded-xl px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none font-mono text-sm leading-relaxed"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      className="w-full px-6 py-3.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors text-sm font-bold shadow-md"
                    >
                      บันทึก (Manual)
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

