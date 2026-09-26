import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Product, ProductPlan, LicenseKey } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Coins, 
  KeyRound, 
  ShoppingCart, 
  Copy, 
  CheckCircle, 
  X, 
  Package, 
  Flame, 
  ArrowLeft, 
  Check, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCsrfToken, initSecurityHardening } from '../utils/security';
import { AnnouncementPopupModal } from '../components/ui/AnnouncementPopupModal';

// ─── Key Result Modal (Supports single or multiple pulled keys) ──────────────────
function KeyResultModal({ keysData, productName, planLabel, onClose }: { keysData: LicenseKey[]; productName: string; planLabel: string; onClose: () => void }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyOne = (keyStr: string, idx: number) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedIndex(idx);
    toast.success(`คัดลอกคีย์ #${idx + 1} เรียบร้อยแล้ว!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allKeysText = keysData.map(k => k.keyString).join('\n');
    navigator.clipboard.writeText(allKeysText);
    setCopiedAll(true);
    toast.success(`คัดลอกทั้ง ${keysData.length} คีย์เรียบร้อยแล้ว!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#12141F] border border-red-500/40 w-full max-w-lg p-6 rounded-2xl shadow-[0_0_60px_rgba(230,0,0,0.25)] relative max-h-[90vh] flex flex-col"
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 shadow-[0_0_20px_rgba(230,0,0,0.3)]">
              <CheckCircle size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">สั่งซื้อสินค้าสำเร็จ!</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                คุณได้รับคีย์สินค้า <span className="text-red-400 font-bold">{productName}</span> ({planLabel}) จำนวน <span className="text-emerald-400 font-bold">{keysData.length} คีย์</span>
              </p>
            </div>
          </div>

          {/* Copy All Button */}
          <div className="mb-3 shrink-0">
            <button
              onClick={handleCopyAll}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copiedAll
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white shadow-[0_0_15px_rgba(230,0,0,0.4)]'
              }`}
            >
              {copiedAll ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedAll ? 'คัดลอกคีย์ทั้งหมดแล้ว!' : `คัดลอกคีย์ทั้งหมด (${keysData.length} คีย์)`}</span>
            </button>
          </div>

          {/* Key List container */}
          <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-3 mb-4 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar">
            {keysData.map((k, idx) => (
              <div key={k.id || idx} className="flex items-center justify-between gap-3 bg-[#161925] border border-red-500/20 rounded-lg p-2.5 font-mono text-xs text-red-300 font-bold tracking-wider">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-gray-500 font-sans">#{idx + 1}</span>
                  <span className="select-all break-all text-xs">{k.keyString}</span>
                </div>
                <button
                  onClick={() => handleCopyOne(k.keyString, idx)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                    copiedIndex === idx
                      ? 'bg-emerald-500 text-black'
                      : 'bg-red-600/80 hover:bg-red-500 text-white'
                  }`}
                >
                  {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === idx ? 'แล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
          >
            ตกลง / ปิดหน้าต่าง
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Reseller Dashboard Page ─────────────────────────────────────────────
export function ResellerDashboard() {
  const { categories, products, keys, currentReseller, purchaseProductKey } = useStore();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasing, setPurchasing] = useState(false);
  const [boughtKeys, setBoughtKeys] = useState<LicenseKey[]>([]);

  useEffect(() => {
    const cleanup = initSecurityHardening();
    return cleanup;
  }, []);

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === selectedCategory);

  // Helper: calculate total stock count across all plans for a product
  const getProductTotalStock = (product: Product) => {
    if (!product.plans || product.plans.length === 0) return 0;
    return keys.filter(k => {
      if (k.status !== 'unused') return false;
      if (k.productId === product.id) return true;
      if (!k.productId) {
        return product.plans.some(plan => plan.days === k.durationDays);
      }
      return false;
    }).length;
  };

  // Helper: calculate stock count for a specific plan
  const getPlanStock = (productId: string, planId: string, planDays?: number) => {
    return keys.filter(k => 
      k.status === 'unused' && (
        (k.productId === productId && k.planId === planId) ||
        (k.productId === productId && planDays !== undefined && k.durationDays === planDays) ||
        (!k.productId && planDays !== undefined && k.durationDays === planDays)
      )
    ).length;
  };

  // Get price display (e.g. ฿200 or ฿25 - ฿150)
  const getProductPriceLabel = (product: Product) => {
    if (!product.plans || product.plans.length === 0) return '฿0';
    const costs = product.plans.map(p => p.cost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    if (minCost === maxCost) return `฿${minCost}`;
    return `฿${minCost} - ฿${maxCost}`;
  };

  const handleOpenProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    if (product.plans && product.plans.length > 0) {
      setSelectedPlanId(product.plans[0].id);
    } else {
      setSelectedPlanId('');
    }
  };

  const handleSelectPlan = (plan: ProductPlan) => {
    setSelectedPlanId(plan.id);
    const stock = selectedProduct ? getPlanStock(selectedProduct.id, plan.id, plan.days) : 0;
    if (quantity > stock && stock > 0) {
      setQuantity(stock);
    } else if (stock === 0) {
      setQuantity(1);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !selectedPlanId) {
      toast.error('กรุณาเลือกแพ็กเกจสินค้าที่ต้องการสั่งซื้อ');
      return;
    }

    const selectedPlan = selectedProduct.plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    const planStock = getPlanStock(selectedProduct.id, selectedPlan.id, selectedPlan.days);
    if (planStock <= 0) {
      toast.error('สินค้าแพ็กเกจนี้หมดสต็อกแล้ว');
      return;
    }

    const pullQty = Math.min(50, Math.max(1, quantity));
    if (pullQty > planStock) {
      toast.error(`สินค้าคงเหลือไม่เพียงพอ (มีเพียง ${planStock} ชิ้น)`);
      return;
    }

    const totalCost = selectedPlan.cost * pullQty;
    if ((currentReseller?.balance || 0) < totalCost) {
      toast.error(`เครดิตไม่เพียงพอ (ต้องการ ${totalCost} เครดิต แต่คุณมี ${currentReseller?.balance || 0} เครดิต)`);
      return;
    }

    setPurchasing(true);
    try {
      const csrfToken = getCsrfToken();
      const res = await purchaseProductKey(selectedProduct.id, selectedPlan.id, csrfToken, pullQty);

      if (res.success && (res.keys || res.key)) {
        const receivedKeys = res.keys || [res.key!];
        setBoughtKeys(receivedKeys);
        toast.success(`สั่งซื้อ ${selectedProduct.title} (${selectedPlan.label}) จำนวน ${receivedKeys.length} คีย์ สำเร็จ!`);
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการดึงคีย์');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (err?.message || ''));
    } finally {
      setPurchasing(false);
    }
  };

  const selectedPlan = selectedProduct?.plans.find(p => p.id === selectedPlanId);
  const currentPlanStock = selectedProduct && selectedPlan 
    ? getPlanStock(selectedProduct.id, selectedPlan.id, selectedPlan.days) 
    : 0;

  return (
    <div className="space-y-8 font-sans pb-16 text-white select-none">
      <AnnouncementPopupModal />

      {/* Credit Status Card Header */}
      <div className="bg-[#12141F]/90 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(230,0,0,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 p-0.5 shadow-[0_0_25px_rgba(230,0,0,0.5)]">
            <div className="w-full h-full bg-[#0B0E14] rounded-[14px] flex items-center justify-center text-red-500">
              <Coins size={28} />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold tracking-wider uppercase mb-1">
              เครดิตคงเหลือของคุณ
            </div>
            <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-red-500">{currentReseller?.balance?.toLocaleString() || 0}</span>
              <span className="text-xs font-bold text-gray-400">เครดิต (THB)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-red-950/40 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>ระดับบัญชี: ตัวแทนจำหน่าย (Reseller)</span>
          </div>
        </div>
      </div>

      {/* Category Pills (Filter) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-red-500" />
            <span>หมวดหมู่สินค้า</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">ทั้งหมด {products.length} รายการ</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-2 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-[0_0_20px_rgba(230,0,0,0.4)]'
                : 'bg-[#12141F] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>ทั้งหมด ({products.length})</span>
          </button>

          {categories.map((cat) => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-[0_0_20px_rgba(230,0,0,0.4)]'
                    : 'bg-[#12141F] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredProducts.map((prod) => {
          const totalStock = getProductTotalStock(prod);
          const isOutStock = totalStock <= 0;
          const priceLabel = getProductPriceLabel(prod);

          return (
            <motion.div
              key={prod.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              onClick={() => handleOpenProductDetail(prod)}
              className="bg-[#12141F] border border-gray-800 hover:border-red-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(230,0,0,0.2)] flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Product Cover Image */}
                <div className="w-full aspect-[4/3] bg-[#0B0E14] relative overflow-hidden">
                  {prod.imageUrl ? (
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      ไม่มีรูปภาพ
                    </div>
                  )}

                  {/* Badges */}
                  {prod.isPopular && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                      <Flame size={11} />
                      <span>ขายดี</span>
                    </div>
                  )}

                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md ${
                    isOutStock 
                      ? 'bg-red-900/90 text-red-200 border border-red-500/40' 
                      : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {isOutStock ? 'หมด' : `พร้อมส่ง`}
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-3.5">
                  <h3 className="text-xs font-bold text-white tracking-wide truncate mb-2">{prod.title}</h3>
                  
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="text-red-500 font-bold text-sm">{priceLabel}</span>
                    <span className={isOutStock ? 'text-red-400 font-medium' : 'text-gray-400 font-medium'}>
                      {isOutStock ? 'สินค้าหมด' : `เหลือ ${totalStock} ชิ้น`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button & Sold Count */}
              <div className="p-3.5 pt-0 space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProductDetail(prod);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isOutStock
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(230,0,0,0.4)] active:scale-95'
                  }`}
                >
                  <ShoppingCart size={13} />
                  <span>ซื้อเลย</span>
                </button>

                <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <Flame size={11} className="text-amber-500" />
                  <span>ขายไปแล้ว {(prod.soldCount || 0).toLocaleString()} ชิ้น</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-[#12141F] border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 opacity-30 text-red-500" />
          <p className="text-sm">ไม่มีสินค้าในหมวดหมู่นี้</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT DETAIL & SELECTION MODAL                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0E14] border border-gray-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8"
            >
              {/* Top Navigation & Breadcrumbs */}
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <span>หน้าแรก</span>
                  <ChevronRight size={13} />
                  <span>ร้านค้า</span>
                  <ChevronRight size={13} />
                  <span>{categories.find(c => c.id === selectedProduct.categoryId)?.name || 'หมวดหมู่'}</span>
                  <ChevronRight size={13} />
                  <span className="text-white font-bold">{selectedProduct.title}</span>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12141F] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>ย้อนกลับ</span>
                </button>
              </div>

              {/* Product Header Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">{selectedProduct.title}</h2>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'GENERAL'}
                  </span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Large Cover Image */}
                <div className="md:col-span-5">
                  <div className="w-full aspect-square bg-[#12141F] border border-gray-800 rounded-2xl overflow-hidden relative shadow-xl">
                    {selectedProduct.imageUrl ? (
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                        ไม่มีรูปภาพ
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Plans Selector & Details */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                  <div>
                    {/* Header Title & Price starting tag */}
                    <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                      <h3 className="text-lg font-bold text-white">{selectedProduct.title}</h3>
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400 block">ราคาต่อชิ้น</span>
                        <span className="text-red-500 font-bold text-base">
                          {selectedPlan
                            ? `฿${selectedPlan.cost} บาท`
                            : getProductPriceLabel(selectedProduct)}
                        </span>
                      </div>
                    </div>

                    {/* Plan Options Selector Grid */}
                    <div className="space-y-2 mb-6">
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                        เลือกแผนราคา
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        {selectedProduct.plans.map((plan) => {
                          const planStock = getPlanStock(selectedProduct.id, plan.id, plan.days);
                          const isSelected = selectedPlanId === plan.id;
                          const isOutOfStock = planStock <= 0;

                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => !isOutOfStock && handleSelectPlan(plan)}
                              disabled={isOutOfStock}
                              className={`p-3.5 rounded-xl border text-left relative transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(230,0,0,0.3)]'
                                  : isOutOfStock
                                  ? 'bg-[#12141F]/40 border-gray-800/40 opacity-50 cursor-not-allowed'
                                  : 'bg-[#12141F] border-gray-800 hover:border-gray-700'
                              }`}
                            >
                              {/* Selected Checkmark Badge */}
                              {isSelected && (
                                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                                  <Check size={11} />
                                </span>
                              )}

                              <div className="text-xs font-bold text-white mb-1">{plan.label}</div>
                              <div className="text-sm font-bold text-red-400">฿{plan.cost}</div>
                              <div className={`text-[10px] mt-1.5 font-medium ${isOutOfStock ? 'text-red-400' : 'text-gray-400'}`}>
                                {isOutOfStock ? 'สินค้าหมด' : `เหลือ ${planStock} ชิ้น`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity Selection Box (Multi-key pull up to 50 keys) */}
                    {selectedPlan && (
                      <div className="space-y-2 mb-6 bg-[#12141F] border border-gray-800 rounded-xl p-3.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap size={14} className="text-red-500" />
                            <span>ระบุจำนวนคีย์ที่ต้องการดึง (สูงสุด 50 คีย์)</span>
                          </label>
                          <span className={`text-xs font-bold ${currentPlanStock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            สต็อกคงเหลือ: {currentPlanStock} ชิ้น
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {/* Minus / Plus Stepper */}
                          <div className="flex items-center bg-[#0B0E14] border border-gray-700 rounded-xl overflow-hidden p-1 shadow-inner">
                            <button
                              type="button"
                              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                              disabled={quantity <= 1 || currentPlanStock <= 0}
                              className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-gray-800 text-white font-bold text-base rounded-lg transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={Math.min(50, currentPlanStock)}
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const maxAllowed = Math.min(50, currentPlanStock > 0 ? currentPlanStock : 1);
                                setQuantity(Math.min(maxAllowed, Math.max(1, val)));
                              }}
                              disabled={currentPlanStock <= 0}
                              className="w-16 text-center bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantity(prev => Math.min(50, Math.min(currentPlanStock, prev + 1)))}
                              disabled={quantity >= Math.min(50, currentPlanStock) || currentPlanStock <= 0}
                              className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-gray-800 text-white font-bold text-base rounded-lg transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[1, 5, 10, 50].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setQuantity(Math.min(preset, Math.min(50, currentPlanStock)))}
                                disabled={currentPlanStock < preset}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  quantity === preset
                                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(230,0,0,0.4)]'
                                    : 'bg-[#0B0E14] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                                } disabled:opacity-30 cursor-pointer`}
                              >
                                {preset} คีย์
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setQuantity(Math.min(50, currentPlanStock))}
                              disabled={currentPlanStock <= 0}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600/30 to-rose-600/30 border border-red-500/40 text-red-300 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                            >
                              สูงสุด
                            </button>
                          </div>
                        </div>

                        {/* Total Price Summary Line */}
                        <div className="flex items-center justify-between pt-2 text-xs border-t border-gray-800/60 mt-2">
                          <span className="text-gray-400">ราคารวม ({quantity} คีย์):</span>
                          <span className="text-red-400 font-bold text-sm">
                            ฿{(selectedPlan.cost * quantity).toLocaleString()} เครดิต
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Product Description */}
                    <div className="bg-[#12141F] border border-gray-800/80 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">รายละเอียด</span>
                      <p className="text-xs text-gray-300 leading-relaxed font-light whitespace-pre-line">
                        {selectedProduct.description || '• บริการระบบอัตโนมัติ 24 ชั่วโมง\n• ปลอดภัย ใช้งานง่าย ได้รับของทันที'}
                      </p>
                    </div>
                  </div>

                  {/* Purchase Action Button */}
                  <div className="pt-4 border-t border-gray-800">
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={purchasing || !selectedPlanId || currentPlanStock <= 0}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_25px_rgba(230,0,0,0.5)] hover:shadow-[0_0_35px_rgba(230,0,0,0.8)] active:scale-95 disabled:opacity-50 cursor-pointer tracking-wider flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={15} />
                      <span>
                        {purchasing 
                          ? 'กำลังดึงคีย์...' 
                          : selectedPlan 
                            ? `สั่งซื้อ ${quantity} คีย์ (฿${(selectedPlan.cost * quantity).toLocaleString()} เครดิต) ➔` 
                            : 'สั่งซื้อสินค้า / ดึงคีย์ ➔'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extracted Key Result Modal */}
      {boughtKeys.length > 0 && selectedProduct && (
        <KeyResultModal
          keysData={boughtKeys}
          productName={selectedProduct.title}
          planLabel={selectedProduct.plans.find(p => p.id === boughtKeys[0]?.planId)?.label || 'แพ็กเกจ'}
          onClose={() => setBoughtKeys([])}
        />
      )}
    </div>
  );
}
