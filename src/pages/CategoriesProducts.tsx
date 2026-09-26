import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Category, Product, ProductPlan } from '../store/useStore';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { 
  FolderPlus, 
  PackagePlus, 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit, 
  Flame, 
  Check, 
  Layers, 
  Image as ImageIcon,
  Tag,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export function CategoriesProducts() {
  const { 
    categories, 
    products, 
    keys, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    addKeysToProductPlan 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'stock'>('products');

  // --- CATEGORY MODAL STATE ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // --- PRODUCT MODAL STATE ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productIsPopular, setProductIsPopular] = useState(false);
  const [productPlans, setProductPlans] = useState<ProductPlan[]>([
    { id: 'plan_12h', days: 0.5, label: '12 ชั่วโมง', cost: 20 },
    { id: 'plan_1d', days: 1, label: '1 วัน', cost: 35 },
    { id: 'plan_7d', days: 7, label: '7 วัน', cost: 120 },
  ]);

  // Temporary plan row form inside product modal
  const [newPlanLabel, setNewPlanLabel] = useState('');
  const [newPlanDays, setNewPlanDays] = useState('1');
  const [newPlanCost, setNewPlanCost] = useState('10');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('ไฟล์ภาพขนาดใหญ่เกิน 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 800;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setProductImageUrl(compressedBase64);
        toast.success('อัปโหลดรูปภาพสินค้าสำเร็จ!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- STOCK UPLOAD STATE ---
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [stockInputText, setStockInputText] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  // Helper: calculate total unused stock for a product
  const getProductStock = (productId: string) => {
    return keys.filter(k => k.productId === productId && k.status === 'unused').length;
  };

  // Helper: calculate stock for a specific plan
  const getPlanStock = (productId: string, planId: string) => {
    return keys.filter(k => k.productId === productId && k.planId === planId && k.status === 'unused').length;
  };

  // Category Handlers
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryName);
      toast.success('อัปเดตหมวดหมู่เรียบร้อยแล้ว');
    } else {
      addCategory(categoryName);
      toast.success('สร้างหมวดหมู่ใหม่เรียบร้อยแล้ว');
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (cat: Category) => {
    const linkedCount = products.filter(p => p.categoryId === cat.id).length;
    if (linkedCount > 0) {
      if (!window.confirm(`หมวดหมู่นี้มีสินค้าผูกอยู่ ${linkedCount} รายการ ยืนยันที่จะลบหรือไม่?`)) return;
    } else if (!window.confirm(`ยืนยันการลบหมวดหมู่ "${cat.name}"?`)) return;

    deleteCategory(cat.id);
    toast.success('ลบหมวดหมู่เรียบร้อยแล้ว');
  };

  // Product Handlers
  const handleOpenProductModal = (prod?: Product) => {
    if (categories.length === 0) {
      toast.error('กรุณาสร้างหมวดหมู่อย่างน้อย 1 หมวดหมู่ก่อนเพิ่มสินค้า!');
      setActiveTab('categories');
      return;
    }

    if (prod) {
      setEditingProduct(prod);
      setProductTitle(prod.title);
      setProductDesc(prod.description);
      setProductImageUrl(prod.imageUrl);
      setProductCategoryId(prod.categoryId);
      setProductIsPopular(prod.isPopular || false);
      setProductPlans(prod.plans || []);
    } else {
      setEditingProduct(null);
      setProductTitle('');
      setProductDesc('');
      setProductImageUrl('');
      setProductCategoryId(categories[0]?.id || '');
      setProductIsPopular(false);
      setProductPlans([
        { id: 'plan_' + Date.now() + '_12h', days: 0.5, label: '12 ชั่วโมง', cost: 20 },
        { id: 'plan_' + Date.now() + '_1d', days: 1, label: '1 วัน', cost: 35 },
        { id: 'plan_' + Date.now() + '_7d', days: 7, label: '7 วัน', cost: 120 },
      ]);
    }
    setShowProductModal(true);
  };

  const handleAddPlanRow = () => {
    if (!newPlanLabel.trim()) {
      toast.error('กรุณากรอกชื่อแพ็กเกจ (เช่น 1 วัน, 7 วัน)');
      return;
    }
    const days = parseFloat(newPlanDays) || 1;
    const cost = parseFloat(newPlanCost) || 0;
    const planId = 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);

    setProductPlans(prev => [...prev, { id: planId, days, label: newPlanLabel.trim(), cost }]);
    setNewPlanLabel('');
    setNewPlanDays('1');
    setNewPlanCost('10');
  };

  const handleRemovePlanRow = (planId: string) => {
    setProductPlans(prev => prev.filter(p => p.id !== planId));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim()) return toast.error('กรุณากรอกชื่อสินค้า');
    if (!productCategoryId) return toast.error('กรุณาเลือกหมวดหมู่สินค้า');
    if (productPlans.length === 0) return toast.error('กรุณาเพิ่มตัวเลือกแพ็กเกจราคาอย่างน้อย 1 รายการ');

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        title: productTitle.trim(),
        description: productDesc.trim(),
        imageUrl: productImageUrl.trim(),
        categoryId: productCategoryId,
        isPopular: productIsPopular,
        plans: productPlans,
      });
      toast.success('อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว');
    } else {
      addProduct({
        title: productTitle.trim(),
        description: productDesc.trim(),
        imageUrl: productImageUrl.trim(),
        categoryId: productCategoryId,
        isPopular: productIsPopular,
        plans: productPlans,
      });
      toast.success('เพิ่มสินค้าใหม่เรียบร้อยแล้ว');
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = (prod: Product) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${prod.title}"?`)) return;
    deleteProduct(prod.id);
    toast.success('ลบสินค้าเรียบร้อยแล้ว');
  };

  // Stock Upload Handler
  const handleUploadStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return toast.error('กรุณาเลือกสินค้า');
    if (!selectedPlanId) return toast.error('กรุณาเลือกแพ็กเกจ');
    if (!stockInputText.trim()) return toast.error('กรุณาวางรายการคีย์ที่ต้องการนำเข้า');

    const keyList = stockInputText
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keyList.length === 0) return toast.error('ไม่พบคีย์ที่ถูกต้อง');

    const selectedProd = products.find(p => p.id === selectedProductId);
    const selectedPlan = selectedProd?.plans.find(p => p.id === selectedPlanId);

    if (!selectedProd || !selectedPlan) return toast.error('ข้อมูลสินค้าหรือแพ็กเกจไม่ถูกต้อง');

    setStockLoading(true);
    try {
      const addedCount = await addKeysToProductPlan(
        selectedProductId,
        selectedPlanId,
        selectedPlan.days,
        keyList,
        'admin'
      );
      toast.success(`เติมสต็อกคีย์เรียบร้อยแล้วจำนวน ${addedCount} คีย์!`);
      setStockInputText('');
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการเติมสต็อก: ' + (err?.message || ''));
    } finally {
      setStockLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">จัดการสินค้า & หมวดหมู่</h1>
          <p className="text-xs text-gray-400 mt-1">
            สร้างหมวดหมู่ เพิ่มรายการสินค้า กำหนดแพ็กเกจวัน และเติมสต็อกคีย์เข้าสู่ระบบ
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-2 bg-[#12141F] p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(230,0,0,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PackagePlus size={14} />
            <span>รายการสินค้า ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(230,0,0,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderPlus size={14} />
            <span>หมวดหมู่ ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(230,0,0,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <KeyRound size={14} />
            <span>เติมสต็อกคีย์</span>
          </button>
        </div>
      </div>

      {/* Warning Alert if no categories exist */}
      {categories.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-300 text-xs">
            <AlertCircle size={18} className="shrink-0" />
            <span>คุณยังไม่มีหมวดหมู่สินค้าในระบบ! กรุณาสร้างหมวดหมู่ก่อนเพิ่มรายการสินค้า</span>
          </div>
          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
          >
            + สร้างหมวดหมู่แรก
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS LIST                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">รายการสินค้าทั้งหมด</h2>
            <button
              onClick={() => handleOpenProductModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(230,0,0,0.4)] transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>เพิ่มสินค้าใหม่</span>
            </button>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => {
                const category = categories.find(c => c.id === prod.categoryId);
                const totalStock = getProductStock(prod.id);
                return (
                  <GlassCard key={prod.id} className="p-4 flex flex-col justify-between border-gray-800/80 hover:border-red-500/30 transition-all">
                    <div>
                      {/* Product Header & Image */}
                      <div className="relative w-full h-40 bg-[#0B0E14] rounded-xl overflow-hidden mb-3 border border-gray-800">
                        {prod.imageUrl ? (
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                            ไม่มีรูปภาพ
                          </div>
                        )}
                        {prod.isPopular && (
                          <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <Flame size={12} />
                            ยอดฮิต
                          </span>
                        )}
                        <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-gray-700 text-gray-300 text-[10px] font-semibold">
                          {category?.name || 'ไม่มีหมวดหมู่'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1 tracking-wide">{prod.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                        {prod.description || 'ไม่มีคำอธิบาย'}
                      </p>

                      {/* Plans Pill Preview */}
                      <div className="space-y-1.5 mb-4">
                        <span className="text-[11px] font-semibold text-gray-400">แพ็กเกจ & สต็อกคงเหลือ:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {prod.plans.map((p) => {
                            const pStock = getPlanStock(prod.id, p.id);
                            return (
                              <div key={p.id} className="bg-[#0B0E14] border border-gray-800 rounded-lg p-1.5 flex items-center justify-between text-[11px]">
                                <span className="text-gray-300 font-medium">{p.label}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-red-400 font-bold">฿{p.cost}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${pStock > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {pStock} ชิ้น
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                      <div className="text-gray-400">
                        <span>ขายแล้ว: <strong className="text-white">{prod.soldCount || 0}</strong> ชิ้น</span>
                        <span className="mx-2">•</span>
                        <span>สต็อกรวม: <strong className={totalStock > 0 ? 'text-emerald-400' : 'text-red-400'}>{totalStock}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            if (prod.plans[0]) setSelectedPlanId(prod.plans[0].id);
                            setActiveTab('stock');
                          }}
                          className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          + เติมคีย์
                        </button>

                        <button
                          onClick={() => handleOpenProductModal(prod)}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard className="p-12 text-center text-gray-500">
              <PackagePlus size={40} className="mx-auto mb-3 opacity-30 text-red-500" />
              <p className="text-sm">ยังไม่มีรายการสินค้าในระบบ</p>
              <button
                onClick={() => handleOpenProductModal()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                + เพิ่มสินค้าชิ้นแรก
              </button>
            </GlassCard>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATEGORIES LIST                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">หมวดหมู่สินค้าทั้งหมด</h2>
            <button
              onClick={() => handleOpenCategoryModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(230,0,0,0.4)] transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>สร้างหมวดหมู่ใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const productCount = products.filter(p => p.categoryId === cat.id).length;
              return (
                <GlassCard key={cat.id} className="p-5 flex items-center justify-between border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{productCount} สินค้าผูกอยู่</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STOCK KEY UPLOAD                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <GlassCard className="p-6 max-w-2xl mx-auto border-red-500/20">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">เติมสต็อกคีย์ตามสินค้าและแพ็กเกจวัน</h2>
              <p className="text-xs text-gray-400">เลือกสินค้าและระยะเวลาที่ต้องการ แล้ววางรายการคีย์ในช่องล่าง</p>
            </div>
          </div>

          <form onSubmit={handleUploadStock} className="space-y-5">
            {/* Step 1: Select Product */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">1. เลือกรายการสินค้า</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod && prod.plans[0]) {
                    setSelectedPlanId(prod.plans[0].id);
                  } else {
                    setSelectedPlanId('');
                  }
                }}
                className="w-full px-4 py-2.5 bg-[#0B0E14] border border-gray-800 rounded-xl text-white text-xs focus:border-red-500 focus:outline-none"
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Duration Plan */}
            {selectedProductId && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">2. เลือกระยะเวลาแพ็กเกจ (วัน)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {products.find(p => p.id === selectedProductId)?.plans.map(plan => {
                    const currentStock = getPlanStock(selectedProductId, plan.id);
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-950/50 border-red-500 shadow-[0_0_15px_rgba(230,0,0,0.3)] text-white'
                            : 'bg-[#0B0E14] border-gray-800 hover:border-gray-700 text-gray-400'
                        }`}
                      >
                        <div className="text-xs font-bold">{plan.label}</div>
                        <div className="text-[11px] text-red-400 mt-0.5">฿{plan.cost} เครดิต</div>
                        <div className="text-[10px] text-gray-500 mt-1">สต็อกปัจจุบัน: {currentStock} ชิ้น</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Key List Input Textarea */}
            {selectedPlanId && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  3. รายการคีย์ (วาง 1 คีย์ต่อ 1 บรรทัด)
                </label>
                <textarea
                  rows={8}
                  value={stockInputText}
                  onChange={(e) => setStockInputText(e.target.value)}
                  placeholder={`KEY-XXXX-XXXX-XXXX\nKEY-YYYY-YYYY-YYYY\nKEY-ZZZZ-ZZZZ-ZZZZ`}
                  className="w-full p-4 bg-[#0B0E14] border border-gray-800 rounded-xl text-white font-mono text-xs focus:border-red-500 focus:outline-none leading-relaxed"
                />
              </div>
            )}

            <GradientButton
              type="submit"
              disabled={stockLoading || !selectedProductId || !selectedPlanId || !stockInputText.trim()}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_20px_rgba(230,0,0,0.4)]"
            >
              {stockLoading ? 'กำลังบันทึกคีย์ลงสต็อก...' : 'บันทึกเติมคีย์เข้าสต็อก'}
            </GradientButton>
          </form>
        </GlassCard>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY EDIT/CREATE MODAL                                                */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12141F] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="เช่น FIVEM, PANEL IOS, APPS"
                  className="w-full px-4 py-2.5 bg-[#0B0E14] border border-gray-800 rounded-xl text-white text-xs focus:border-red-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 shadow-[0_0_15px_rgba(230,0,0,0.4)] transition-all"
                >
                  บันทึกหมวดหมู่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT EDIT/CREATE MODAL                                                 */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#12141F] border border-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingProduct ? 'แก้ไขรายการสินค้า' : 'เพิ่มสินค้าใหม่'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">ชื่อสินค้า *</label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="เช่น RLZXTEAM, UNBAN FIVEM"
                    className="w-full px-4 py-2.5 bg-[#0B0E14] border border-gray-800 rounded-xl text-white text-xs focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">หมวดหมู่สินค้า *</label>
                  <select
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0B0E14] border border-gray-800 rounded-xl text-white text-xs focus:border-red-500 focus:outline-none"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  รูปภาพสินค้า (Image Cover) *
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />

                {productImageUrl ? (
                  <div className="relative w-full h-44 bg-[#0B0E14] border border-gray-800 rounded-xl overflow-hidden group">
                    <img 
                      src={productImageUrl} 
                      alt="Product preview" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg cursor-pointer"
                      >
                        เปลี่ยนรูปภาพ
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductImageUrl('')}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-red-400 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        ลบรูปภาพ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-700 hover:border-red-500 bg-[#0B0E14] hover:bg-red-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon size={22} />
                    </div>
                    <p className="text-xs font-bold text-white mb-1">
                      📁 กดเลือกรูปภาพสินค้าจากเครื่อง
                    </p>
                    <p className="text-[11px] text-gray-400 font-light">
                      รองรับไฟล์ JPG, PNG, WEBP (แปลงความละเอียดสูงลงฐานข้อมูลโดยตรง)
                    </p>
                  </div>
                )}

                {/* Optional URL input */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 shrink-0">หรือระบุ URL:</span>
                  <input
                    type="url"
                    value={productImageUrl.startsWith('data:') ? '' : productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1 bg-[#0B0E14] border border-gray-800 rounded-lg text-white text-[11px] focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">รายละเอียดสินค้า (Bullet points/Description)</label>
                <textarea
                  rows={3}
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="รายละเอียดสินค้าการใช้งาน..."
                  className="w-full p-3 bg-[#0B0E14] border border-gray-800 rounded-xl text-white text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={productIsPopular}
                  onChange={(e) => setProductIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-800 bg-[#0B0E14] text-red-600 focus:ring-red-500"
                />
                <label htmlFor="popularCheck" className="text-xs text-gray-300 font-semibold cursor-pointer">
                  ติดป้าย "ยอดฮิต 🔥" ที่หน้าสินค้า
                </label>
              </div>

              {/* Dynamic Duration Plans Builder */}
              <div className="pt-3 border-t border-gray-800">
                <label className="block text-xs font-bold text-gray-200 mb-2">กำหนดตัวเลือกวัน & ราคาแพ็กเกจ (Duration Plans)</label>
                
                {/* List of plans */}
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                  {productPlans.map(plan => (
                    <div key={plan.id} className="bg-[#0B0E14] border border-gray-800 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{plan.label}</span>
                        <span className="text-gray-400">({plan.days} วัน)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 font-bold">฿{plan.cost} เครดิต</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlanRow(plan.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new plan form */}
                <div className="bg-[#0B0E14] p-3 rounded-xl border border-gray-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 block">เพิ่มตัวเลือกแพ็กเกจวัน & ราคา:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] text-gray-400 mb-1 font-semibold">ชื่อแพ็กเกจ (เช่น 12ชั่วโมง, 1วัน):</label>
                      <input
                        type="text"
                        value={newPlanLabel}
                        onChange={(e) => setNewPlanLabel(e.target.value)}
                        placeholder="เช่น 12ชั่วโมง, 1วัน"
                        className="w-full px-3 py-2 bg-[#12141F] border border-gray-800 rounded-lg text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-gray-400 mb-1 font-semibold">จำนวน วัน/ชม. :</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newPlanDays}
                        onChange={(e) => setNewPlanDays(e.target.value)}
                        placeholder="เช่น 1 หรือ 0.5"
                        className="w-full px-3 py-2 bg-[#12141F] border border-gray-800 rounded-lg text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1 font-semibold">ราคา (เครดิต):</label>
                      <input
                        type="number"
                        value={newPlanCost}
                        onChange={(e) => setNewPlanCost(e.target.value)}
                        placeholder="ราคา"
                        className="w-full px-3 py-2 bg-[#12141F] border border-gray-800 rounded-lg text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddPlanRow}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-md"
                      >
                        + เพิ่มตัวเลือก
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 shadow-[0_0_15px_rgba(230,0,0,0.4)] transition-all"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
