import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users, Store, Package, Truck, Trash2, ChevronDown, RefreshCw } from 'lucide-react';

const ROLE_CONFIG = {
  USER: { label: 'Customer', cls: 'bg-blue-100 text-blue-800 border-2 border-blue-200' },
  RESTAURANT: { label: 'Restaurant Owner', cls: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200' },
  DELIVERY: { label: 'Delivery Agent', cls: 'bg-purple-100 text-purple-800 border-2 border-purple-200' },
  ADMIN: { label: 'Admin', cls: 'bg-red-100 text-red-800 border-2 border-red-200' },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const [s, u] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')]); setStats(s.data); setUsers(u.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/admin/users/${id}`); setUsers(users.filter((u) => u.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleChangeRole = async (id, role) => {
    try { const r = await api.put(`/admin/users/${id}/role?role=${role}`); setUsers(users.map((u) => (u.id === id ? r.data : u))); toast.success('Updated'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setChangingRole(null);
  };

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  if (loading) return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#e6e3d2] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-brand-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
              <h1 className="font-headline-lg text-3xl text-[#1c1c12] uppercase italic">Admin Panel</h1>
            </div>
            <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide">System overview & user management</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 rounded-full border-4 border-[#e6e3d2] px-6 py-2.5 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] bg-white shadow-md hover:bg-[#f7f4e3] transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-4 mb-8">
            <Stat icon={<Users className="h-5 w-5" />} label="Total Users" value={stats.totalUsers} />
            <Stat icon={<Store className="h-5 w-5" />} label="Restaurants" value={stats.totalRestaurants} />
            <Stat icon={<Package className="h-5 w-5" />} label="Orders Placed" value={stats.totalOrders} />
            <Stat icon={<Truck className="h-5 w-5" />} label="Delivery Agents" value={stats.usersByRole?.DELIVERY || 0} />
          </div>
        )}

        {/* Role filter */}
        {stats?.usersByRole && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => setRoleFilter('')} 
              className={`rounded-full px-5 py-2 text-xs font-label-caps uppercase tracking-wider transition-all border-2 ${
                !roleFilter ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'bg-white border-[#e6e3d2] text-[#5b4040] hover:text-brand-500'
              }`}
            >
              All ({users.length})
            </button>
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <button 
                key={role} 
                onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
                className={`rounded-full px-5 py-2 text-xs font-label-caps uppercase tracking-wider transition-all border-2 ${
                  roleFilter === role ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'bg-white border-[#e6e3d2] text-[#5b4040] hover:text-brand-500'
                }`}
              >
                {ROLE_CONFIG[role]?.label || role} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Users list / table */}
        <div className="rounded-[28px] border-4 border-[#e6e3d2] bg-white shadow-xl overflow-hidden">
          {/* Card list for mobile */}
          <div className="block md:hidden divide-y divide-[#e6e3d2]">
            {filtered.map((u) => (
              <div key={u.id} className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[#5b4040]">#{u.id}</span>
                  <button onClick={() => handleDelete(u.id, u.name)} className="text-red-500 hover:bg-red-50 rounded-xl border-2 border-transparent hover:border-red-100 p-2 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-headline-md text-sm text-[#1c1c12] uppercase">{u.name}</h3>
                  <p className="text-[#5b4040] font-semibold text-xs mt-1">{u.email}</p>
                </div>
                <div className="relative pt-1">
                  <button onClick={() => setChangingRole(changingRole === u.id ? null : u.id)}
                    className={`inline-flex items-center gap-1 text-[10px] font-label-caps uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm ${ROLE_CONFIG[u.role]?.cls}`}>
                    {ROLE_CONFIG[u.role]?.label || u.role} <ChevronDown className="h-3 w-3" />
                  </button>
                  {changingRole === u.id && (
                    <div className="absolute left-0 top-12 z-50 rounded-2xl border-4 border-[#e6e3d2] py-2 min-w-[150px] bg-white shadow-2xl overflow-hidden">
                      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                        <button key={role} onClick={() => handleChangeRole(u.id, role)}
                          className={`w-full px-4 py-2 text-left text-xs font-label-caps uppercase tracking-wider transition-colors hover:bg-[#fdfae9] ${u.role === role ? 'text-brand-500 font-bold bg-[#f7f4e3]' : 'text-[#1c1c12]'}`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table for desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f1eedd] border-b-4 border-[#e6e3d2]">
                  <th className="px-5 py-4 text-left font-label-caps uppercase tracking-wider text-[#1c1c12]">ID</th>
                  <th className="px-5 py-4 text-left font-label-caps uppercase tracking-wider text-[#1c1c12]">Name</th>
                  <th className="px-5 py-4 text-left font-label-caps uppercase tracking-wider text-[#1c1c12]">Email</th>
                  <th className="px-5 py-4 text-left font-label-caps uppercase tracking-wider text-[#1c1c12]">Role</th>
                  <th className="px-5 py-4 text-left font-label-caps uppercase tracking-wider text-[#1c1c12]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-[#e6e3d2] hover:bg-[#f7f4e3]/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-[#5b4040]">#{u.id}</td>
                    <td className="px-5 py-4 font-headline-md text-sm text-[#1c1c12] uppercase">{u.name}</td>
                    <td className="px-5 py-4 text-[#5b4040] font-semibold">{u.email}</td>
                    <td className="px-5 py-4 relative">
                      <button onClick={() => setChangingRole(changingRole === u.id ? null : u.id)}
                        className={`inline-flex items-center gap-1 text-[10px] font-label-caps uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm ${ROLE_CONFIG[u.role]?.cls}`}>
                        {ROLE_CONFIG[u.role]?.label || u.role} <ChevronDown className="h-3 w-3" />
                      </button>
                      {changingRole === u.id && (
                        <div className="absolute left-5 top-12 z-40 rounded-2xl border-4 border-[#e6e3d2] py-2 min-w-[150px] bg-white shadow-2xl overflow-hidden">
                          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                            <button key={role} onClick={() => handleChangeRole(u.id, role)}
                              className={`w-full px-4 py-2 text-left text-xs font-label-caps uppercase tracking-wider transition-colors hover:bg-[#fdfae9] ${u.role === role ? 'text-brand-500 font-bold bg-[#f7f4e3]' : 'text-[#1c1c12]'}`}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(u.id, u.name)} className="text-red-500 hover:bg-red-50 rounded-xl border-2 border-transparent hover:border-red-100 p-2 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] border-4 border-[#e6e3d2] p-5 bg-white shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 border-2 border-brand-500/20">{icon}</div>
      <div>
        <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">{label}</p>
        <p className="text-xl font-headline-md text-[#1c1c12] mt-0.5">{value}</p>
      </div>
    </div>
  );
}
