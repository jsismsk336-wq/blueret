import { useState } from 'react';
import { useStore } from '../store/useStore';
import { RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AddPartnerModal } from '../components/ui/AddPartnerModal';
import { ManageCreditModal } from '../components/ui/ManageCreditModal';
import { ResetPasswordModal } from '../components/ui/ResetPasswordModal';
import toast from 'react-hot-toast';

export function Partners() {
  const { partners, togglePartnerStatus, deletePartner, updatePartnerPassword } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [managingCreditFor, setManagingCreditFor] = useState<string | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('อัปเดตข้อมูลพาร์ทเนอร์ล่าสุดแล้ว');


  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">จัดการและควบคุมพาร์ทเนอร์</h1>
          <p className="text-gray-400 text-sm">ตั้งค่าบัญชีพาร์ทเนอร์, ปรับเครดิต, สิทธิ์ระบบ และระงับบัญชีชั่วคราว</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(66,133,244,0.3)] flex items-center gap-2"
        >
          <Plus size={18} />
          <span>ลงทะเบียนพาร์ทเนอร์</span>
        </button>
      </div>

      <div className="bg-[#161925] border border-gray-800/60 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800/60 flex items-center justify-between">
          <h3 className="text-white font-medium">รายชื่อพาร์ทเนอร์ในระบบ</h3>
          <button 
            onClick={handleRefresh}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1C1F2E] text-gray-400 text-xs tracking-wider border-b border-gray-800/60">
              <tr>
                <th className="px-6 py-4 font-medium">ชื่อผู้ใช้งาน (USERNAME)</th>
                <th className="px-6 py-4 font-medium">สิทธิ์เข้าใช้งาน</th>
                <th className="px-6 py-4 font-medium text-center">ยอดเครดิตคงเหลือ</th>
                <th className="px-6 py-4 font-medium text-center">สถานะใช้งาน</th>
                <th className="px-6 py-4 font-medium text-right">การควบคุมจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {partners.map((partner, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={partner.id} 
                  className="hover:bg-[#1C1F2E]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-200">{partner.username}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
                        ใช้งานปกติ
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{partner.role}</td>
                  <td className="px-6 py-4 text-center font-bold text-primary">
                    {partner.balance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      partner.status === 'active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${partner.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {partner.status === 'active' ? 'ปกติ (ACTIVE)' : 'ระงับ (SUSPEND)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setManagingCreditFor(partner.id)}
                        className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-medium"
                      >
                        จัดการเครดิต
                      </button>
                      <button 
                        onClick={() => setResettingPasswordFor(partner.id)}
                        className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-xs font-medium"
                      >
                        รีเซ็ตรหัส
                      </button>
                      <button 
                        onClick={() => {
                          togglePartnerStatus(partner.id);
                          toast.success(partner.status === 'active' ? 'ระงับบัญชีสำเร็จ' : 'ปลดระงับบัญชีสำเร็จ');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all text-xs font-medium"
                      >
                        {partner.status === 'active' ? 'สั่งระงับบัญชี' : 'ปลดระงับบัญชี'}
                      </button>
                      <button 
                        onClick={() => {
                          deletePartner(partner.id);
                          toast.success('ลบพาร์ทเนอร์ออกจากระบบแล้ว');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {partners.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              ไม่พบข้อมูลพาร์ทเนอร์
            </div>
          )}
        </div>
      </div>
      
      <AddPartnerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      <ManageCreditModal 
        partnerId={managingCreditFor}
        onClose={() => setManagingCreditFor(null)}
      />
      
      <ResetPasswordModal
        partnerId={resettingPasswordFor}
        onClose={() => setResettingPasswordFor(null)}
      />
    </div>
  );
}
