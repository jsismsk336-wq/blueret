import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Search, RefreshCw, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { PinModal } from '../components/ui/PinModal';

export function Keys() {
  const { keys, resetHwid, deleteKey, deleteAllKeys } = useStore();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false); // ควบคุม Modal PIN
  const itemsPerPage = 10;

  const searchTerm = search.trim().toLowerCase();
  let filteredKeys = keys.filter(k => 
    k.keyString.toLowerCase().includes(searchTerm) ||
    (k.hwid && k.hwid.toLowerCase().includes(searchTerm)) ||
    k.createdBy.toLowerCase().includes(searchTerm)
  );

  // Collapse identical keys into a single row when searching
  if (searchTerm) {
    const seen = new Set();
    filteredKeys = filteredKeys.filter(k => {
      const isDuplicate = seen.has(k.keyString);
      seen.add(k.keyString);
      return !isDuplicate;
    });
  }

  const totalPages = Math.max(1, Math.ceil(filteredKeys.length / itemsPerPage));
  const paginatedKeys = filteredKeys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status: 'active' | 'unused') => {
    return status === 'active' 
      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* PIN Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <PinModal 
            isOpen={isPinModalOpen} 
            onClose={() => setIsPinModalOpen(false)} 
            onSuccess={() => {
              deleteAllKeys();
              toast.success('ล้างคีย์ทั้งหมดออกจากระบบแล้ว');
            }}
          />
        )}
      </AnimatePresence>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">ระบบควบคุมคีย์ลิขสิทธิ์</h1>
        <p className="text-gray-400 text-sm">ตรวจสอบความสมบูรณ์คีย์ระบบ, ผู้ร่วมสร้าง และจัดการล้างข้อมูลรหัสเครื่อง (HWID)</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาตาม คีย์ลิขสิทธิ์, ชื่อพาร์ทเนอร์ หรือ HWID ของลูกค้า..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#161925] border border-gray-800/60 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPinModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl font-medium transition-colors"
          >
            <AlertTriangle size={18} />
            ล้างคีย์ทั้งหมด
          </button>
          <button 
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => {
                setIsRefreshing(false);
                toast.success('อัปเดตข้อมูลคีย์ล่าสุดแล้ว');
              }, 600);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-[#161925] text-gray-300 border border-gray-800/60 hover:text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      <div className="bg-[#161925] border border-gray-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1C1F2E] text-gray-400 text-xs tracking-wider border-b border-gray-800/60">
              <tr>
                <th className="px-6 py-4 font-medium">คีย์ลิขสิทธิ์ (LICENSE KEY)</th>
                <th className="px-6 py-4 font-medium text-center">อายุคีย์</th>
                <th className="px-6 py-4 font-medium text-center">สร้างโดย</th>
                <th className="px-6 py-4 font-medium text-center">สถานะคีย์</th>
                <th className="px-6 py-4 font-medium">รหัสประจำเครื่องลูกค้า (HWID)</th>
                <th className="px-6 py-4 font-medium text-right">การจัดการคีย์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {paginatedKeys.map((key, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={key.id} 
                  className="hover:bg-[#1C1F2E]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-200">{key.keyString}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-primary">{key.durationDays}D</td>
                  <td className="px-6 py-4 text-center text-gray-400">{key.createdBy}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(key.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${key.status === 'active' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                      {key.status === 'active' ? 'กำลังใช้งาน' : 'ยังไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-xs ${key.hwid ? 'text-green-400' : 'text-gray-600'}`}>
                      {key.hwid || 'NOT BOUND'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          resetHwid(key.id);
                          toast.success('ล้าง HWID สำเร็จ');
                        }}
                        disabled={!key.hwid}
                        className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                          key.hwid 
                            ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20' 
                            : 'border-transparent text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        ล้าง HWID
                      </button>
                      <button
                        onClick={() => {
                          deleteKey(key.id);
                          toast.success('ลบคีย์ออกจากระบบแล้ว');
                        }}
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredKeys.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#1C1F2E] flex items-center justify-center mb-4 text-gray-500">
                <Search size={24} />
              </div>
              <h3 className="text-white font-bold mb-1">ไม่พบข้อมูลคีย์ลิขสิทธิ์</h3>
              <p className="text-sm text-gray-400 max-w-[250px]">
                {search ? 'ลองค้นหาด้วยคำอื่นดูอีกครั้ง' : 'ยังไม่มีการสร้างคีย์ลิขสิทธิ์ในระบบ'}
              </p>
            </div>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/60 bg-[#1C1F2E]/30">
            <span className="text-xs text-gray-400">
              แสดง <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, filteredKeys.length)}</span> จากทั้งหมด <span className="text-white font-medium">{filteredKeys.length}</span> รายการ
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-800 bg-[#161925] text-gray-300 hover:text-white disabled:opacity-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-gray-400 px-2">
                หน้าที่ {currentPage} จาก {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-800 bg-[#161925] text-gray-300 hover:text-white disabled:opacity-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
