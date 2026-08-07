import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Save, Plus, Trash2 } from 'lucide-react';
import { useStore, type Package } from '../../store/useStore';
import toast from 'react-hot-toast';

interface PackageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PackageSettingsModal({ isOpen, onClose }: PackageSettingsModalProps) {
  const { packages, updatePackageCost, addPackage, deletePackage } = useStore();
  const [localPackages, setLocalPackages] = useState<Package[]>([]);
  
  // State for new package form
  const [newDays, setNewDays] = useState('');
  const [newCost, setNewCost] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalPackages(packages);
    }
  }, [isOpen, packages]);

  const handleCostChange = (days: number, costStr: string) => {
    setLocalPackages(prev => 
      prev.map(p => p.days === days ? { ...p, cost: parseInt(costStr || '0', 10) } : p)
    );
  };

  const handleDelete = (days: number) => {
    if(window.confirm(`ยืนยันการลบแพ็กเกจ ${days} Day ออกจากระบบ?`)) {
      deletePackage(days);
      setLocalPackages(prev => prev.filter(p => p.days !== days));
      toast.success(`ลบแพ็กเกจ ${days} Day เรียบร้อยแล้ว`);
    }
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(newDays, 10);
    const cost = parseInt(newCost, 10);
    
    if (days > 0 && cost >= 0) {
      if (localPackages.find(p => p.days === days)) {
        toast.error('มีแพ็กเกจเวลานี้อยู่ในระบบแล้ว');
        return;
      }
      
      const newPkg: Package = {
        days,
        label: `${days} Day${days > 1 ? 's' : ''}`,
        cost
      };
      
      addPackage(newPkg);
      setLocalPackages(prev => [...prev, newPkg].sort((a, b) => a.days - b.days));
      toast.success('เพิ่มแพ็กเกจใหม่เรียบร้อยแล้ว');
      setNewDays('');
      setNewCost('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localPackages.forEach(pkg => {
      updatePackageCost(pkg.days, pkg.cost);
    });
    toast.success('บันทึกการตั้งค่าราคาแพ็กเกจคีย์สำเร็จ');
    onClose();
  };

  if (!isOpen) return null;

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
              className="bg-[#13151E] border border-gray-800/60 w-full max-w-lg p-6 rounded-2xl pointer-events-auto shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-800/60 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 text-primary rounded-lg">
                    <Settings2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">จัดการแพ็กเกจระบบ</h2>
                    <p className="text-xs text-gray-400">เพิ่ม/ลบแพ็กเกจ และกำหนดราคาที่จะหักเครดิต</p>
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
                {/* Form to edit existing packages */}
                <form id="save-packages-form" onSubmit={handleSubmit} className="space-y-3 mb-6">
                  {localPackages.map((pkg) => (
                    <div key={pkg.days} className="flex items-center justify-between bg-[#1C1F2E] p-3 rounded-xl border border-gray-800/60">
                      <div className="font-bold text-white text-sm">{pkg.label}</div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={pkg.cost}
                          onChange={(e) => handleCostChange(pkg.days, e.target.value)}
                          className="w-16 bg-[#0F111A] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-center font-bold text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        />
                        <span className="text-xs text-gray-400">เครดิต</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(pkg.days)}
                          className="p-1.5 ml-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="ลบแพ็กเกจ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {localPackages.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-4">ไม่มีแพ็กเกจในระบบ</div>
                  )}
                </form>

                {/* Form to add a new package */}
                <div className="bg-[#1C1F2E]/50 border border-gray-800/60 p-4 rounded-xl">
                  <div className="text-sm font-bold text-white mb-3">เพิ่มแพ็กเกจใหม่</div>
                  <form onSubmit={handleAddPackage} className="flex gap-2">
                    <div className="flex-1">
                      <input 
                        type="number"
                        min="1"
                        required
                        value={newDays}
                        onChange={(e) => setNewDays(e.target.value)}
                        placeholder="จำนวนวัน (Days)"
                        className="w-full bg-[#0F111A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number"
                        min="0"
                        required
                        value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        placeholder="ราคาเครดิต"
                        className="w-full bg-[#0F111A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                    >
                      <Plus size={18} />
                    </button>
                  </form>
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
                  form="save-packages-form"
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(66,133,244,0.3)]"
                >
                  <Save size={16} />
                  บันทึกราคา
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
