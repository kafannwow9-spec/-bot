import React, { useState, useEffect } from 'react';
import { Layout, LogOut, Shield, Zap, MessageSquare, History, Settings, User, Server, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GUILD_ID = '1477677044790722791';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    fetch('/api/user')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-slate-700 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">لوحة التحكم</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem active={activeTab === 'status'} onClick={() => setActiveTab('status')} icon={<Activity size={20} />} label="حالة البوت" />
          <NavItem active={activeTab === 'abbreviations'} onClick={() => setActiveTab('abbreviations')} icon={<Zap size={20} />} label="المشغلات" />
          <NavItem active={activeTab === 'streak'} onClick={() => setActiveTab('streak')} icon={<MessageSquare size={20} />} label="الستريك" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History size={20} />} label="السجلات" />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-10 h-10 rounded-full" alt="avatar" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.username}</p>
              <p className="text-xs text-slate-400">مسؤول</p>
            </div>
            <a href="/api/logout" className="text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'status' && <StatusTab key="status" />}
          {activeTab === 'abbreviations' && <AbbreviationsTab key="abbreviations" />}
          {activeTab === 'streak' && <StreakTab key="streak" />}
          {activeTab === 'logs' && <LogsTab key="logs" />}
        </AnimatePresence>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const Login = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card max-w-md w-full text-center space-y-8"
    >
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform -rotate-6">
          <Shield className="text-white w-10 h-10" />
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">مرحباً بك</h1>
        <p className="text-slate-400">يرجى تسجيل الدخول باستخدام ديسكورد للوصول إلى لوحة التحكم</p>
      </div>
      <a 
        href="/auth/discord" 
        className="flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/20 w-full"
      >
        <Server size={24} />
        تسجيل الدخول عبر ديسكورد
      </a>
    </motion.div>
  </div>
);

const StatusTab = () => {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/bot/status').then(res => res.json()).then(setStatus);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">حالة البوت</h2>
        <p className="text-slate-400">نظرة عامة على أداء البوت الحالي</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="الحالة" value={status?.ready ? 'متصل' : 'جاري الاتصال...'} color="text-green-400" />
        <StatCard label="السيرفرات" value={status?.guilds || 0} color="text-blue-400" />
        <StatCard label="المستخدمين" value={status?.users || 0} color="text-purple-400" />
      </div>
    </motion.div>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <div className="card">
    <p className="text-slate-400 text-sm mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const AbbreviationsTab = () => {
  const [abbrevs, setAbbrevs] = useState<any>({});
  const [newAlias, setNewAlias] = useState('');
  const [newCmd, setNewCmd] = useState('');

  const fetchAbbrevs = () => fetch('/api/abbreviations').then(res => res.json()).then(setAbbrevs);
  
  useEffect(() => { fetchAbbrevs(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/abbreviations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: newAlias, commandName: newCmd })
    });
    setNewAlias('');
    setNewCmd('');
    fetchAbbrevs();
  };

  const handleDelete = async (alias: string) => {
    await fetch(`/api/abbreviations/${alias}`, { method: 'DELETE' });
    fetchAbbrevs();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">إدارة المشغلات</h2>
        <p className="text-slate-400">إضافة أو حذف اختصارات الأوامر</p>
      </header>

      <form onSubmit={handleAdd} className="card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-slate-400 mb-2">الاختصار (Alias)</label>
          <input 
            value={newAlias} 
            onChange={e => setNewAlias(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="مثال: b"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-slate-400 mb-2">الأمر (Command)</label>
          <input 
            value={newCmd} 
            onChange={e => setNewCmd(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="مثال: ban"
          />
        </div>
        <button type="submit" className="btn-primary h-[50px] px-8">إضافة</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(abbrevs).map(([alias, cmd]: any) => (
          <div key={alias} className="card flex justify-between items-center group">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">مشغل</p>
              <p className="text-xl font-bold text-blue-400">{alias}</p>
              <p className="text-sm text-slate-400">ينفذ: {cmd}</p>
            </div>
            <button 
              onClick={() => handleDelete(alias)}
              className="p-2 text-slate-600 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const StreakTab = () => {
  const [streak, setStreak] = useState<any>(null);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    fetch('/api/streak').then(res => res.json()).then(data => {
      setStreak(data);
      setChannelId(data.channelId || '');
    });
  }, []);

  const handleSave = async () => {
    await fetch('/api/streak/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId })
    });
    alert('تم الحفظ بنجاح');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">إعدادات الستريك</h2>
        <p className="text-slate-400">تحديد قناة الستريك وإدارة المستخدمين</p>
      </header>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2">معرف القناة (Channel ID)</label>
          <div className="flex gap-4">
            <input 
              value={channelId} 
              onChange={e => setChannelId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <button onClick={handleSave} className="btn-primary">حفظ</button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700">
          <h3 className="font-bold mb-4">المستخدمين النشطين ({Object.keys(streak?.users || {}).length})</h3>
          <div className="space-y-3">
            {Object.entries(streak?.users || {}).slice(0, 5).map(([id, data]: any) => (
              <div key={id} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/50">
                <span className="font-mono text-sm text-slate-400">{id}</span>
                <div className="flex gap-4">
                  <span className="text-blue-400 font-bold">{data.count} ستريك</span>
                  <span className="text-slate-500">{data.shields} دروع</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/logs').then(res => res.json()).then(setLogs);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">سجلات العمليات</h2>
        <p className="text-slate-400">آخر 100 عملية قام بها البوت</p>
      </header>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-right">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">النوع</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">التفاصيل</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">الوقت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                    log.type === 'ban' ? 'bg-red-500/20 text-red-400' :
                    log.type === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {log.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">
                  {log.reason || log.content || 'لا يوجد تفاصيل'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(log.timestamp).toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default App;
