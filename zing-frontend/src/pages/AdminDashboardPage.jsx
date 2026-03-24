import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users, Store, Package, Truck, Shield, Trash2, ChevronDown, RefreshCw } from 'lucide-react';

const ROLE_CONFIG = {
  USER: { label: 'Customer', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  RESTAURANT: { label: 'Restaurant', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  DELIVERY: { label: 'Delivery', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  ADMIN: { label: 'Admin', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>System overview & user management</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <Stat icon={<Users className="h-4 w-4" />} label="Users" value={stats.totalUsers} />
          <Stat icon={<Store className="h-4 w-4" />} label="Restaurants" value={stats.totalRestaurants} />
          <Stat icon={<Package className="h-4 w-4" />} label="Orders" value={stats.totalOrders} />
          <Stat icon={<Truck className="h-4 w-4" />} label="Delivery" value={stats.usersByRole?.DELIVERY || 0} />
        </div>
      )}

      {/* Role filter */}
      {stats?.usersByRole && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setRoleFilter('')} className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${!roleFilter ? 'bg-brand-500 text-white' : ''}`} style={!roleFilter ? {} : { color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>All ({users.length})</button>
          {Object.entries(stats.usersByRole).map(([role, count]) => (
            <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${roleFilter === role ? 'bg-brand-500 text-white' : ''}`}
              style={roleFilter !== role ? { color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' } : {}}>
              {ROLE_CONFIG[role]?.label || role} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>ID</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                <td className="px-3 py-2" style={{ color: 'var(--text-faint)' }}>#{u.id}</td>
                <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td className="px-3 py-2 relative">
                  <button onClick={() => setChangingRole(changingRole === u.id ? null : u.id)}
                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_CONFIG[u.role]?.cls}`}>
                    {ROLE_CONFIG[u.role]?.label || u.role} <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                  {changingRole === u.id && (
                    <div className="absolute left-3 top-8 z-10 rounded-md border py-0.5 min-w-[110px]" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                        <button key={role} onClick={() => handleChangeRole(u.id, role)}
                          className={`w-full px-3 py-1 text-left text-[11px] hover:bg-brand-50 dark:hover:bg-brand-500/10 ${u.role === role ? 'text-brand-500 font-semibold' : ''}`}
                          style={u.role !== role ? { color: 'var(--text-secondary)' } : {}}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(u.id, u.name)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded p-1 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{icon}</div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}
