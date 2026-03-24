import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../features/productsSlice';
import { fetchOrders, createOrder } from '../features/ordersSlice';
import { logout } from '../features/authSlice';

const fmt = (n) => Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/* ── Toast System ── */
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-slide-up ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : t.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {t.type === 'success' && (
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          )}
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 opacity-50 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price,
    stock: product.stock,
    category: product.category || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category || 'General'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name</label>
            <input className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Price (INR)</label>
              <input type="number" min="0" step="0.01" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Qty</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
            <input className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: products, status: productStatus, error: productError } = useSelector((state) => state.products);
  const { items: orders, status: orderStatus, error: orderError } = useSelector((state) => state.orders);

  const [activeTab, setActiveTab] = useState('inventory');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState(1);

  // New features
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low, out
  const [editingProduct, setEditingProduct] = useState(null);
  const [toasts, setToasts] = useState([]);

  const lowStockThreshold = 5;

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
  }, [dispatch]);

  // Toast helpers
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
    }
    if (stockFilter === 'in-stock') list = list.filter((p) => p.stock > lowStockThreshold);
    else if (stockFilter === 'low') list = list.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
    else if (stockFilter === 'out') list = list.filter((p) => p.stock <= 0);
    return list;
  }, [products, searchQuery, stockFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length;
    return { totalProducts, totalStock, totalOrders, totalRevenue, lowStockCount };
  }, [products, orders]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;
    try {
      await dispatch(createProduct({
        name: newProduct.name,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        category: newProduct.category || 'General'
      })).unwrap();
      setNewProduct({ name: '', price: '', stock: '', category: '' });
      addToast('Product added successfully');
    } catch (err) {
      addToast(err || 'Failed to add product', 'error');
    }
  };

  const handleEditSave = async (data) => {
    try {
      await dispatch(updateProduct({ id: editingProduct._id, data })).unwrap();
      setEditingProduct(null);
      addToast('Product updated successfully');
    } catch (err) {
      addToast(err || 'Failed to update product', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
      addToast(`"${name}" deleted`);
    } catch (err) {
      addToast(err || 'Failed to delete product', 'error');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedProductId) { addToast('Please select a product', 'error'); return; }
    if (!orderQty || orderQty <= 0) { addToast('Quantity must be > 0', 'error'); return; }
    try {
      await dispatch(createOrder({ items: [{ productId: selectedProductId, qty: Number(orderQty) }] })).unwrap();
      dispatch(fetchProducts());
      addToast('Order placed successfully');
      setOrderQty(1);
      setSelectedProductId('');
    } catch (err) {
      addToast(err || 'Failed to place order', 'error');
    }
  };

  const error = productError || orderError;
  const isNetworkError = error === 'Network Error' || error === 'Error';
  const errorMessage = isNetworkError ? null : error;

  const filterCounts = useMemo(() => ({
    all: products.length,
    'in-stock': products.filter((p) => p.stock > lowStockThreshold).length,
    low: products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length,
    out: products.filter((p) => p.stock <= 0).length,
  }), [products]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Edit Modal */}
      {editingProduct && (
        <EditModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={handleEditSave} />
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>

      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900 hidden sm:inline">Inventory Portal</span>
              </div>

              <div className="hidden sm:flex items-center bg-gray-100/80 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'inventory'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.5 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                    Products
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'orders'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    Orders
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-full pl-1.5 pr-3.5 py-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-gray-200 hover:border-red-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="sm:hidden flex gap-1 pb-3">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'inventory' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >Products</button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >Orders</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Products', value: stats.totalProducts, color: 'blue', icon: 'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.5 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z' },
            { label: 'Total Stock', value: stats.totalStock, color: 'violet', icon: 'M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25 6.43 14.25m11.141 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25' },
            { label: 'Orders', value: stats.totalOrders, color: 'amber', icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z' },
            { label: 'Revenue', value: fmt(stats.totalRevenue), color: 'emerald', isRevenue: true, icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
            { label: 'Low Stock', value: stats.lowStockCount, color: 'red', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
                <div className={`w-9 h-9 bg-${s.color}-50 rounded-xl flex items-center justify-center`}>
                  <svg className={`w-4.5 h-4.5 text-${s.color}-500`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
              </div>
              <p className={`text-2xl font-bold mt-3 ${s.isRevenue ? 'text-emerald-600' : 'text-gray-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Product Table */}
            <section className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header with Search & Filter */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-gray-400"
                      />
                    </div>
                    {/* Stock Filter */}
                    <div className="flex items-center gap-1 bg-gray-100/80 rounded-lg p-0.5">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'in-stock', label: 'In Stock' },
                        { key: 'low', label: 'Low' },
                        { key: 'out', label: 'Out' },
                      ].map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setStockFilter(f.key)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                            stockFilter === f.key
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {f.label}
                          <span className="ml-1 text-gray-400">{filterCounts[f.key]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {productStatus === 'loading' ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20 px-5">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.5 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{searchQuery || stockFilter !== 'all' ? 'No products match your filters' : 'No products yet'}</p>
                    <p className="text-gray-400 text-xs mt-1">{searchQuery || stockFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add your first product to get started'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">
                          <th className="px-5 py-3.5">Product</th>
                          <th className="px-3 py-3.5 text-right">Price</th>
                          <th className="px-3 py-3.5 text-right">Stock</th>
                          <th className="px-3 py-3.5 text-center">Status</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((p) => (
                          <tr key={p._id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.category || 'General'}</p>
                            </td>
                            <td className="px-3 py-4 text-right font-semibold text-gray-700">{fmt(p.price)}</td>
                            <td className="px-3 py-4 text-right font-semibold text-gray-700">{p.stock}</td>
                            <td className="px-3 py-4 text-center">
                              {p.stock <= 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Out
                                </span>
                              ) : p.stock <= lowStockThreshold ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Low
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />In Stock
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  className="text-xs font-medium text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(p._id, p.name)}
                                  className="text-xs font-medium text-red-500 hover:text-white bg-red-50 hover:bg-red-500 px-3 py-1.5 rounded-lg transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Add Product Form */}
            <section>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Add New Product</h2>
                </div>
                <form className="p-5 space-y-4" onSubmit={handleCreateProduct}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-gray-400"
                      placeholder="e.g. Wireless Mouse"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Price (INR)</label>
                      <input
                        type="number" min="0" step="0.01"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-gray-400"
                        placeholder="0"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Qty</label>
                      <input
                        type="number" min="0"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-gray-400"
                        placeholder="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-gray-400"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="e.g. Electronics"
                    />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl py-3 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20">
                    Add Product
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Place Order Form */}
            <section>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Place New Order</h2>
                </div>
                <form className="p-5 space-y-4" onSubmit={handlePlaceOrder}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Product</label>
                    <select
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.filter(p => p.stock > 0).map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {fmt(p.price)} ({p.stock} in stock)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity</label>
                    <input
                      type="number" min="1"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl py-3 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20">
                    Place Order
                  </button>
                </form>
              </div>
            </section>

            {/* Order History */}
            <section className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">Order History</h2>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{orders.length} orders</span>
                </div>
                {orderStatus === 'loading' ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 px-5">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No orders yet</p>
                    <p className="text-gray-400 text-xs mt-1">Place your first order to see it here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {orders.map((o) => (
                      <div key={o._id} className="px-5 py-4 hover:bg-gray-50/50 transition group">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <span className="text-sm font-bold text-gray-900">#{o._id.slice(-6).toUpperCase()}</span>
                              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                o.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : o.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              }`}>{o.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              {o.items.map((it, idx) => (
                                <p key={idx}>{it.productId?.name || 'Product'} x {it.qty} @ {fmt(it.productId?.price || 0)}</p>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gray-900 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-lg">{fmt(o.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
