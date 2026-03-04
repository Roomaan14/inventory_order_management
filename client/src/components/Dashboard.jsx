import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, createProduct, deleteProduct } from '../features/productsSlice';
import { fetchOrders, createOrder } from '../features/ordersSlice';
import { logout } from '../features/authSlice';

const fmt = (n) => Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const { items: products, status: productStatus, error: productError } = useSelector((state) => state.products);
  const { items: orders, status: orderStatus, error: orderError } = useSelector((state) => state.orders);

  const [activeTab, setActiveTab] = useState('inventory');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [orderMessage, setOrderMessage] = useState('');
  const [productMessage, setProductMessage] = useState('');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProductMessage('');
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;
    try {
      await dispatch(
        createProduct({
          name: newProduct.name,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
          category: newProduct.category || 'General'
        })
      ).unwrap();
      setNewProduct({ name: '', price: '', stock: '', category: '' });
      setProductMessage('Product added!');
      setTimeout(() => setProductMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderMessage('');
    if (!selectedProductId) { setOrderMessage('Please select a product'); return; }
    if (!orderQty || orderQty <= 0) { setOrderMessage('Quantity must be > 0'); return; }
    try {
      await dispatch(
        createOrder({ items: [{ productId: selectedProductId, qty: Number(orderQty) }] })
      ).unwrap();
      dispatch(fetchProducts());
      setOrderMessage('Order placed successfully!');
      setOrderQty(1);
      setSelectedProductId('');
      setTimeout(() => setOrderMessage(''), 3000);
    } catch (err) {
      setOrderMessage(err || 'Failed to place order');
    }
  };

  const lowStockThreshold = 5;

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length;
    return { totalProducts, totalStock, totalOrders, totalRevenue, lowStockCount };
  }, [products, orders]);

  const error = productError || orderError;
  const isNetworkError = error === 'Network Error' || error === 'Error';
  const errorMessage = isNetworkError ? null : error;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar-style top nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-900">Inventory Portal</span>
              </div>

              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    activeTab === 'inventory'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.5 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                    Products
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    activeTab === 'orders'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    Orders
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-full pl-1 pr-3 py-1">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-gray-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="sm:hidden flex gap-1 pb-2">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'inventory' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >Products</button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >Orders</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Error */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Products</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.5 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</p>
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25 6.43 14.25m11.141 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalStock}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</p>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{fmt(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock</p>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStockCount}</p>
          </div>
        </div>

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Product Table */}
            <section className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">Products</h2>
                  <span className="text-xs text-gray-400">{products.length} items</span>
                </div>
                {productStatus === 'loading' ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-16 px-5">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.5 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No products yet</p>
                    <p className="text-gray-400 text-xs mt-1">Add your first product to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50/80">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-5 py-3">Product</th>
                          <th className="px-3 py-3 text-right">Price</th>
                          <th className="px-3 py-3 text-right">Stock</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p) => (
                          <tr key={p._id} className="hover:bg-blue-50/40 transition-colors group">
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.category || 'General'}</p>
                            </td>
                            <td className="px-3 py-3.5 text-right font-medium text-gray-700">{fmt(p.price)}</td>
                            <td className="px-3 py-3.5 text-right font-medium text-gray-700">{p.stock}</td>
                            <td className="px-3 py-3.5 text-center">
                              {p.stock <= 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Out
                                </span>
                              ) : p.stock <= lowStockThreshold ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Low
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  OK
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => dispatch(deleteProduct(p._id))}
                                className="text-xs text-red-500 hover:text-white bg-red-50 hover:bg-red-500 px-2.5 py-1 rounded-md transition font-medium"
                              >
                                Delete
                              </button>
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
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Add New Product</h2>
                </div>
                <form className="p-5 space-y-4" onSubmit={handleCreateProduct}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-400"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-400"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-400"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-400"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="e.g. Electronics"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-blue-700 active:bg-blue-800 transition shadow-sm">
                    Add Product
                  </button>
                  {productMessage && (
                    <p className="text-xs text-center text-emerald-600 font-medium">{productMessage}</p>
                  )}
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
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Place New Order</h2>
                </div>
                <form className="p-5 space-y-4" onSubmit={handlePlaceOrder}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Product</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-emerald-700 active:bg-emerald-800 transition shadow-sm">
                    Place Order
                  </button>
                  {orderMessage && (
                    <p className={`text-xs text-center font-medium ${orderMessage.includes('successfully') ? 'text-emerald-600' : 'text-red-600'}`}>
                      {orderMessage}
                    </p>
                  )}
                </form>
              </div>
            </section>

            {/* Order History */}
            <section className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">Order History</h2>
                  <span className="text-xs text-gray-400">{orders.length} orders</span>
                </div>
                {orderStatus === 'loading' ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 px-5">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No orders yet</p>
                    <p className="text-gray-400 text-xs mt-1">Place your first order to see it here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {orders.map((o) => (
                      <div key={o._id} className="px-5 py-4 hover:bg-gray-50/50 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">#{o._id.slice(-6).toUpperCase()}</span>
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                o.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : o.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              }`}>{o.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              {o.items.map((it, idx) => (
                                <p key={idx}>{it.productId?.name || 'Product'} x {it.qty} @ {fmt(it.productId?.price || 0)}</p>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{fmt(o.totalAmount)}</span>
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
