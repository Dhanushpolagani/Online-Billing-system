/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  TrendingUp, 
  Lock, 
  Table as TableIcon, 
  Clock, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronLeft,
  X,
  CheckCircle2,
  Printer,
  FileText,
  Search,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Types ---

interface Table {
  id: number;
  table_number: string;
  status: 'AVAILABLE' | 'OCCUPIED';
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  is_veg: number;
}

interface BillItem {
  id: number;
  bill_id: number;
  item_id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Bill {
  id: number;
  table_id: number;
  created_at: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  order_type: 'DINE_IN' | 'TAKE_AWAY';
  status: 'OPEN' | 'CLOSED';
  items: BillItem[];
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const base = "px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-md",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-900 shadow-md",
    outline: "border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    ghost: "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    danger: "bg-rose-100 text-rose-600 hover:bg-rose-200",
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [screen, setScreen] = useState<'MAIN' | 'PASSWORD' | 'SEATING' | 'ORDER' | 'REVENUE' | 'SETTING'>('MAIN');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Starters');
  const [orderSearch, setOrderSearch] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_AWAY'>('DINE_IN');
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueTab, setRevenueTab] = useState<'TODAY' | 'HISTORY' | 'ANALYTICS'>('TODAY');
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);

  // Settings State
  const [settingsTab, setSettingsTab] = useState<'TABLES' | 'MENU' | 'SECURITY'>('TABLES');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: 'Starters', price: '', is_veg: 1 });
  const [posPassword, setPosPassword] = useState('1234');
  const [prevPasswordInput, setPrevPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);

  const [connectionError, setConnectionError] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === 'ORDER') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [screen]);

  useEffect(() => {
    fetchPosPassword();
  }, []);

  useEffect(() => {
    if (screen === 'SEATING' || screen === 'SETTING') fetchTables();
    if (screen === 'ORDER' || screen === 'SETTING') fetchMenu();
    if (screen === 'REVENUE') fetchRevenue();
  }, [screen, settingsTab, revenueTab]);

  const fetchPosPassword = async () => {
    try {
      const res = await fetch('/api/settings/password');
      if (!res.ok) throw new Error('Failed to fetch password');
      const data = await res.json();
      setPosPassword(data.password);
      setConnectionError(false);
    } catch (e) {
      console.error("Failed to fetch password:", e);
      setConnectionError(true);
      setTimeout(fetchPosPassword, 3000);
    }
  };

  const updatePosPassword = async () => {
    try {
      await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      setPosPassword(newPassword);
      setNewPassword('');
      setPrevPasswordInput('');
      setShowPasswordConfirmModal(false);
      setScreen('PASSWORD'); // Redirect to login page
      alert('Password updated successfully. Please login with your new pin.');
    } catch (e) {
      alert('Failed to update password');
    }
  };

  const handlePasswordUpdateClick = () => {
    if (!newPassword || !prevPasswordInput) {
      alert('Please fill in all fields');
      return;
    }
    if (prevPasswordInput !== posPassword) {
      alert('Previous password is incorrect');
      return;
    }
    setShowPasswordConfirmModal(true);
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTables(data);
      setConnectionError(false);
    } catch (e) {
      console.error("Failed to fetch tables:", e);
      setConnectionError(true);
      setTimeout(fetchTables, 3000);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMenu(data);
      setConnectionError(false);
    } catch (e) {
      console.error("Failed to fetch menu:", e);
      setConnectionError(true);
      setTimeout(fetchMenu, 3000);
    }
  };

  const fetchRevenue = async () => {
    try {
      if (revenueTab === 'ANALYTICS') {
        const [dailyRes, monthlyRes] = await Promise.all([
          fetch('/api/revenue/analytics/daily'),
          fetch('/api/revenue/analytics/monthly')
        ]);
        
        if (!dailyRes.ok || !monthlyRes.ok) throw new Error('Failed to fetch analytics');
        
        const dailyData = await dailyRes.json();
        const monthlyData = await monthlyRes.json();
        
        setDailyRevenue(dailyData);
        setMonthlyRevenue(monthlyData);
      } else {
        const endpoint = revenueTab === 'TODAY' ? '/api/revenue/today' : '/api/revenue/history';
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        
        if (revenueTab === 'HISTORY') {
          // For history, we calculate stats manually or just show the list
          const total_revenue = data.reduce((acc: number, b: any) => acc + b.grand_total, 0);
          const total_bills = data.length;
          const total_tax = data.reduce((acc: number, b: any) => acc + b.tax, 0);
          setRevenueData({ stats: { total_revenue, total_bills, total_tax }, bills: data });
        } else {
          setRevenueData(data);
        }
      }
      setConnectionError(false);
    } catch (e) {
      console.error("Failed to fetch revenue:", e);
      setConnectionError(true);
      setTimeout(fetchRevenue, 3000);
    }
  };

  const addTable = async () => {
    if (!newTableNumber) return;
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: newTableNumber })
    });
    if (res.ok) {
      setNewTableNumber('');
      fetchTables();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const deleteTable = async (id: number) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    await fetch(`/api/tables/${id}`, { method: 'DELETE' });
    fetchTables();
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: Number(newItem.price) })
    });
    setNewItem({ name: '', category: 'Starters', price: '', is_veg: 1 });
    fetchMenu();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === posPassword) {
      setScreen('SEATING');
      setPassword('');
      setError('');
    } else {
      setError('Invalid Password');
    }
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    const res = await fetch('/api/bills/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: table.id })
    });
    const { bill_id } = await res.json();
    fetchBill(bill_id);
    setScreen('ORDER');
  };

  const fetchBill = async (billId: number) => {
    const res = await fetch(`/api/bills/${billId}`);
    const data = await res.json();
    setCurrentBill(data);
  };

  const addToOrder = async (item: MenuItem) => {
    if (!currentBill) return;
    await fetch(`/api/bills/${currentBill.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: item.id,
        name: item.name,
        quantity: 1,
        price: item.price
      })
    });
    fetchBill(currentBill.id);
  };

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (!currentBill) return;
    await fetch(`/api/bills/${currentBill.id}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
    fetchBill(currentBill.id);
  };

  const closeBill = async () => {
    if (!currentBill || currentBill.items.length === 0) return;
    await fetch(`/api/bills/${currentBill.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discount_percent: discountPercent,
        order_type: orderType
      })
    });
    setScreen('SEATING');
    setCurrentBill(null);
    setSelectedTable(null);
    setDiscountPercent(0);
  };

  const printKOT = () => {
    if (!currentBill) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>KOT - Table ${selectedTable?.table_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 1.2em; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>KOT</h2>
            <p>Table: ${selectedTable?.table_number}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Type: ${orderType.replace('_', ' ')}</p>
          </div>
          
          <div class="items">
            ${currentBill.items.map(item => `
              <div class="item">
                <span>${item.name}</span>
                <span>x${item.quantity}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Kitchen Copy</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const printBill = () => {
    if (!currentBill) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Receipt - Bill #${currentBill.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .totals { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grand-total { font-weight: bold; font-size: 1.2em; margin-top: 10px; border-top: 2px solid #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>GourmetPOS</h2>
            <p>Table: ${selectedTable?.table_number}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Bill ID: #${currentBill.id}</p>
            <p>Type: ${orderType.replace('_', ' ')}</p>
          </div>
          
          <div class="items">
            ${currentBill.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>₹${item.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="row">
              <span>Subtotal:</span>
              <span>₹${totals.subtotal.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>Discount (${discountPercent}%):</span>
              <span>-₹${totals.discount.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>Tax (5%):</span>
              <span>₹${totals.tax.toFixed(2)}</span>
            </div>
            <div class="row grand-total">
              <span>Grand Total:</span>
              <span>₹${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for dining with us!</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map((item: any) => item.category)));
    return cats.sort();
  }, [menu]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const calculateTotals = () => {
    if (!currentBill) return { subtotal: 0, discount: 0, tax: 0, total: 0 };
    const subtotal = currentBill.subtotal;
    const discount = (subtotal * discountPercent) / 100;
    const taxable = subtotal - discount;
    const tax = taxable * 0.05;
    const total = taxable + tax;
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-rose-500 text-white px-4 py-2 text-center font-bold text-sm fixed top-0 left-0 right-0 z-50 shadow-md animate-pulse">
          Connection lost. Attempting to reconnect...
        </div>
      )}
      
      {/* Main Screen */}
      {screen === 'MAIN' && (
        <div className="h-screen flex flex-col items-center justify-center gap-8 p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-2">GourmetPOS</h1>
            <p className="text-zinc-500">Premium Restaurant Management System</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen('PASSWORD')}
              className="h-64 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-200 flex flex-col items-center justify-center gap-4 transition-all"
            >
              <LayoutDashboard size={48} />
              <span className="text-2xl font-bold uppercase tracking-widest">POS</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen('SETTING')}
              className="h-64 bg-zinc-800 text-white rounded-3xl shadow-xl shadow-zinc-200 flex flex-col items-center justify-center gap-4 transition-all"
            >
              <Settings size={48} />
              <span className="text-2xl font-bold uppercase tracking-widest">Setting</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen('REVENUE')}
              className="h-64 bg-zinc-800 text-white rounded-3xl shadow-xl shadow-zinc-200 flex flex-col items-center justify-center gap-4 transition-all"
            >
              <TrendingUp size={48} />
              <span className="text-2xl font-bold uppercase tracking-widest">Revenue</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Password Screen */}
      {screen === 'PASSWORD' && (
        <div className="h-screen flex items-center justify-center bg-zinc-900 p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center"
          >
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Access POS</h2>
            <p className="text-zinc-500 mb-8">Enter your security pin to continue</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-4xl tracking-[1em] py-4 bg-zinc-100 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white outline-none transition-all"
                autoFocus
              />
              {error && <p className="text-red-500 font-medium">{error}</p>}
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setScreen('MAIN')}>Cancel</Button>
                <Button variant="primary" className="flex-1" type="submit">Login</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Seating Screen */}
      {screen === 'SEATING' && (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <button onClick={() => setScreen('MAIN')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-2 transition-colors">
                <ChevronLeft size={20} /> Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold tracking-tight">SEATING</h1>
            </div>
            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-zinc-100">
              <Clock size={20} className="text-red-500" />
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setOrderType('DINE_IN')}
              className={`px-8 py-3 rounded-2xl font-bold text-lg transition-all border-2 ${orderType === 'DINE_IN' ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200'}`}
            >
              Dine In
            </button>
            <button 
              onClick={() => setOrderType('TAKE_AWAY')}
              className={`px-8 py-3 rounded-2xl font-bold text-lg transition-all border-2 ${orderType === 'TAKE_AWAY' ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200'}`}
            >
              Take Away
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {tables.map((table) => (
              <motion.button
                key={table.id}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTableClick(table)}
                className={`h-48 rounded-[2rem] shadow-lg flex flex-col items-center justify-center gap-4 transition-all border-2 ${
                  table.status === 'AVAILABLE' 
                    ? 'bg-white border-transparent hover:border-red-500' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <TableIcon size={40} className={table.status === 'AVAILABLE' ? 'text-zinc-400' : 'text-red-500'} />
                <span className="text-xl font-bold">{table.table_number}</span>
                <span className={`text-sm font-semibold uppercase tracking-wider ${
                  table.status === 'AVAILABLE' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {table.status}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Order Screen */}
      {screen === 'ORDER' && (
        <div className="h-screen flex flex-col md:flex-row overflow-hidden">
          
          {/* CENTER PANEL: Menu (Now on Left) */}
          <div className="flex-1 bg-zinc-50 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-zinc-200 flex flex-col gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 outline-none rounded-xl pl-10 pr-4 py-3 text-sm font-medium transition-all"
                />
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setOrderSearch(''); }}
                    className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                      activeCategory === cat && !orderSearch
                        ? 'bg-red-600 text-white shadow-lg shadow-red-100' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menu
                  .filter(item => {
                    if (orderSearch) return item.name.toLowerCase().includes(orderSearch.toLowerCase());
                    return item.category === activeCategory;
                  })
                  .map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToOrder(item)}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 text-left flex flex-col justify-between h-48 hover:shadow-xl hover:border-red-100 transition-all"
                  >
                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
                      <Plus size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight mb-1 flex items-start gap-2">
                        <span className={`mt-1.5 min-w-[10px] h-[10px] rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {item.name}
                      </h3>
                      <p className="text-red-600 font-black">₹{item.price}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* LEFT PANEL: Order Summary (Now on Right) */}
          <div className="w-full md:w-[32rem] bg-white border-l border-zinc-200 flex flex-col h-full shadow-xl z-10">
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{selectedTable?.table_number}</p>
              </div>
              <button 
                onClick={() => setScreen('SEATING')} 
                className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span className="flex-1">Item</span>
                <span className="w-20 text-center">Qty</span>
                <span className="w-16 text-right">Price</span>
                <span className="w-8"></span>
              </div>
              {currentBill?.items.map((item) => (
                <div key={item.id} className="bg-white p-2 rounded-lg border border-zinc-100 shadow-sm hover:border-red-100 transition-colors group flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-zinc-800 leading-tight flex-1 truncate" title={item.name}>{item.name}</span>
                  
                  <div className="flex items-center gap-1 bg-zinc-50 rounded-md p-0.5 border border-zinc-100">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-white hover:shadow-sm rounded text-zinc-500 transition-all"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-bold w-5 text-center text-xs">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-white hover:shadow-sm rounded text-zinc-500 transition-all"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <span className="font-bold text-sm text-zinc-900 w-16 text-right">₹{item.total}</span>

                  <button 
                    onClick={() => updateQuantity(item.id, 0)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {currentBill?.items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-4">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center border-2 border-dashed border-zinc-200">
                    <Plus size={32} />
                  </div>
                  <p className="font-medium">Add items to start order</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Discount (%)</label>
                <input 
                  type="number" 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 focus:bg-white outline-none rounded-lg px-2 py-1.5 font-bold text-xs transition-all"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-medium text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-zinc-800">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-zinc-500 items-center">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="text-emerald-600">- ₹{totals.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-zinc-500">
                  <span>GST (5%)</span>
                  <span className="text-zinc-800">₹{totals.tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-zinc-100 my-1" />
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-800">Grand Total</span>
                  <span className="text-xl font-black text-red-600 leading-none">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 py-2 text-xs border-zinc-200"
                  disabled={!currentBill || currentBill.items.length === 0}
                  onClick={printKOT}
                >
                  <FileText size={14} /> KOT
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 py-2 text-xs border-zinc-200"
                  disabled={!currentBill || currentBill.items.length === 0}
                  onClick={printBill}
                >
                  <Printer size={14} /> Print
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-[2] py-2 text-sm shadow-lg shadow-red-100"
                  disabled={!currentBill || currentBill.items.length === 0}
                  onClick={closeBill}
                >
                  <CheckCircle2 size={16} /> CLOSE BILL
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Screen */}
      {screen === 'SETTING' && (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <button onClick={() => setScreen('MAIN')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-2 transition-colors">
                <ChevronLeft size={20} /> Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold tracking-tight">SETTINGS</h1>
            </div>
            <div className="flex gap-4 bg-white p-1 rounded-2xl shadow-sm border border-zinc-100">
              <button 
                onClick={() => setSettingsTab('TABLES')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${settingsTab === 'TABLES' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Tables
              </button>
              <button 
                onClick={() => setSettingsTab('MENU')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${settingsTab === 'MENU' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Menu Items
              </button>
              <button 
                onClick={() => setSettingsTab('SECURITY')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${settingsTab === 'SECURITY' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Security
              </button>
            </div>
          </div>

          {settingsTab === 'TABLES' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 h-fit sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <h2 className="text-2xl font-bold">Add Table</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Table Identity</label>
                    <div className="relative">
                      <TableIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="text" 
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        placeholder="e.g. Table 5"
                        className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-red-500 focus:bg-white outline-none rounded-2xl pl-12 pr-4 py-3.5 font-bold transition-all"
                      />
                    </div>
                  </div>
                  <Button variant="primary" className="w-full py-4 shadow-lg shadow-red-100" onClick={addTable}>
                    Create Table
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                  <h2 className="text-2xl font-bold">Active Tables</h2>
                  <span className="px-4 py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    {tables.length} Total
                  </span>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {tables.map(table => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={table.id} 
                        className="flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-100 hover:border-red-200 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shadow-inner group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                            <TableIcon size={24} />
                          </div>
                          <div>
                            <span className="font-bold text-lg block">{table.table_number}</span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Available</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteTable(table.id)}
                          className="p-3 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'MENU' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 h-fit sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <h2 className="text-2xl font-bold">Add Item</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Item Name</label>
                    <input 
                      type="text" 
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="e.g. Garlic Bread"
                      className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-red-500 focus:bg-white outline-none rounded-2xl px-4 py-3.5 font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Category</label>
                    <div className="relative">
                      <select 
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-red-500 focus:bg-white outline-none rounded-2xl px-4 py-3.5 font-bold appearance-none transition-all"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewItem({...newItem, is_veg: 1})}
                        className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${newItem.is_veg ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}
                      >
                        Veg
                      </button>
                      <button
                        onClick={() => setNewItem({...newItem, is_veg: 0})}
                        className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${!newItem.is_veg ? 'bg-red-50 border-red-500 text-red-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}
                      >
                        Non-Veg
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">₹</span>
                      <input 
                        type="number" 
                        value={newItem.price}
                        onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-red-500 focus:bg-white outline-none rounded-2xl pl-10 pr-4 py-3.5 font-bold transition-all"
                      />
                    </div>
                  </div>
                  <Button variant="primary" className="w-full py-4 shadow-lg shadow-red-100" onClick={addMenuItem}>
                    Add to Menu
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-50/50">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Menu Catalog</h2>
                    <span className="px-4 py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {menu.length} Items
                    </span>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text" 
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search items..."
                      className="w-full bg-white border border-zinc-200 focus:border-red-500 outline-none rounded-xl pl-10 pr-4 py-2 text-sm font-medium transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[10px] font-black tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-5">Item Details</th>
                        <th className="px-8 py-5">Category</th>
                        <th className="px-8 py-5 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {menu
                        .filter(item => item.name.toLowerCase().includes(menuSearch.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors group">
                          <td className="px-8 py-6">
                            <span className="font-bold text-zinc-800 block group-hover:text-red-600 transition-colors flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {item.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">ID: #{item.id}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="font-black text-zinc-900">₹{item.price.toFixed(2)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'SECURITY' && (
            <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 text-center">
              <div className="w-20 h-20 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Reset POS Password</h2>
              <p className="text-zinc-500 mb-8">Change the pin used to access the POS system</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 text-left">Previous Password</label>
                  <input 
                    type="password" 
                    value={prevPasswordInput}
                    onChange={(e) => setPrevPasswordInput(e.target.value)}
                    placeholder="Enter current pin"
                    className="w-full text-center text-2xl py-4 bg-zinc-100 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 text-left">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new pin"
                    className="w-full text-center text-2xl py-4 bg-zinc-100 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <Button variant="primary" className="w-full py-4" onClick={handlePasswordUpdateClick}>
                  Update Password
                </Button>
              </div>

              <AnimatePresence>
                {showPasswordConfirmModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
                    >
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Confirm Change</h3>
                      <p className="text-zinc-500 mb-8">Are you sure you want to update the POS password? You will be logged out.</p>
                      <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowPasswordConfirmModal(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" className="flex-1" onClick={updatePosPassword}>
                          Confirm
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Revenue Screen */}
      {screen === 'REVENUE' && (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <button onClick={() => setScreen('MAIN')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-2 transition-colors">
                <ChevronLeft size={20} /> Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold tracking-tight">REVENUE</h1>
            </div>
            <div className="flex gap-4 bg-white p-1 rounded-2xl shadow-sm border border-zinc-100">
              <button 
                onClick={() => setRevenueTab('TODAY')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${revenueTab === 'TODAY' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setRevenueTab('HISTORY')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${revenueTab === 'HISTORY' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                All History
              </button>
              <button 
                onClick={() => setRevenueTab('ANALYTICS')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${revenueTab === 'ANALYTICS' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Analytics
              </button>
            </div>
          </div>

          {revenueTab === 'ANALYTICS' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <h2 className="text-2xl font-bold mb-6">Daily Revenue Trend</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyRevenue}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#71717a', fontSize: 12}} 
                          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#71717a', fontSize: 12}}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          formatter={(value: number) => [`₹${value}`, 'Revenue']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                        />
                        <Area type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <h2 className="text-2xl font-bold mb-6">Monthly Comparison</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#71717a', fontSize: 12}}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#71717a', fontSize: 12}}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip 
                          cursor={{fill: '#f4f4f5'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          formatter={(value: number) => [`₹${value}`, 'Revenue']}
                        />
                        <Bar dataKey="total" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {revenueTab !== 'ANALYTICS' && revenueData && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm mb-2">
                    {revenueTab === 'TODAY' ? 'Revenue Today' : 'Total Revenue'}
                  </p>
                  <h3 className="text-4xl font-black text-red-600">₹{revenueData.stats.total_revenue?.toFixed(2) || 0}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm mb-2">
                    {revenueTab === 'TODAY' ? 'Bills Today' : 'Total Bills'}
                  </p>
                  <h3 className="text-4xl font-black text-zinc-900">{revenueData.stats.total_bills || 0}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm mb-2">Tax Collected</p>
                  <h3 className="text-4xl font-black text-emerald-600">₹{revenueData.stats.total_tax?.toFixed(2) || 0}</h3>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-8 border-b border-zinc-100">
                  <h2 className="text-2xl font-bold">
                    {revenueTab === 'TODAY' ? "Today's Closed Bills" : "All Closed Bills"}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-bold tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Bill ID</th>
                        <th className="px-8 py-4">Table</th>
                        <th className="px-8 py-4">Type</th>
                        <th className="px-8 py-4">Date & Time</th>
                        <th className="px-8 py-4">Subtotal</th>
                        <th className="px-8 py-4 text-emerald-600">Discount</th>
                        <th className="px-8 py-4">Tax</th>
                        <th className="px-8 py-4 text-right">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {revenueData.bills.map((bill: any) => (
                        <tr key={bill.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-8 py-6 font-bold">#{bill.id}</td>
                          <td className="px-8 py-6">{bill.table_number}</td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold">{bill.order_type}</span>
                          </td>
                          <td className="px-8 py-6 text-zinc-500">
                            {new Date(bill.created_at).toLocaleDateString()} {new Date(bill.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-8 py-6">₹{bill.subtotal.toFixed(2)}</td>
                          <td className="px-8 py-6 text-emerald-600">-₹{bill.discount.toFixed(2)}</td>
                          <td className="px-8 py-6">₹{bill.tax.toFixed(2)}</td>
                          <td className="px-8 py-6 text-right font-black text-red-600">₹{bill.grand_total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
