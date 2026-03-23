import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Users, Store, Package, Truck, Shield, Trash2, ChevronDown,
  BarChart3, RefreshCw,
} from 'lucide-react';

const ROLE_CONFIG = {
  USER: { label: 'Customer', color: 'bg-blue-500/20 text-blue-400', icon: Users },
  RESTAURANT: { label: 'Restaurant', color: 'bg-emerald-500/20 text-emerald-400', icon: Store },
  DELIVERY: { label: 'Delivery', color: 'bg-purple-500/20 text-purple-400', icon: Truck },
  ADMIN: { label: 'Admin', color: 'bg-red-500/20 text-red-400', icon: Shield },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      setUsers(users.filter((u) => u.id !== id));
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      const res = await api.put(`/admin/users/${id}/role?role=${newRole}`);
      setUsers(users.map((u) => (u.id === id ? res.data : u)));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
    setChangingRole(null);
  };

  const filteredUsers = roleFilter
    ? users.filter((u) => u.role === roleFilter)
    : users;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Admin <span className="text-brand-500">Dashboard</span>
          </h1>
          <p className="mt-1 text-surface-400">System overview & user management</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border border-surface-700 px-4 py-2.5 text-sm font-medium text-surface-300 transition hover:bg-surface-800/60 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats.totalUsers} />
          <StatCard icon={<Store className="h-5 w-5" />} label="Restaurants" value={stats.totalRestaurants} />
          <StatCard icon={<Package className="h-5 w-5" />} label="Total Orders" value={stats.totalOrders} />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Delivery Partners" value={stats.usersByRole?.DELIVERY || 0} />
        </div>
      )}

      {/* Role distribution */}
      {stats?.usersByRole && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">Users by Role</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(stats.usersByRole).map(([role, count]) => {
              const config = ROLE_CONFIG[role];
              const Icon = config?.icon || Users;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                    roleFilter === role
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-surface-800/60 bg-surface-900/60 hover:border-surface-700'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config?.color || 'bg-surface-700 text-surface-300'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">{count}</p>
                    <p className="text-xs text-surface-400">{config?.label || role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-400" />
            Users
            {roleFilter && (
              <span className="text-sm text-surface-400 font-normal">
                — filtered by {ROLE_CONFIG[roleFilter]?.label}
              </span>
            )}
          </h2>
          {roleFilter && (
            <button
              onClick={() => setRoleFilter('')}
              className="text-xs text-brand-400 hover:text-brand-300"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-800/60">
          <table className="w-full text-sm">
            <thead className="bg-surface-900/80 text-left text-surface-400">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {filteredUsers.map((u) => {
                const config = ROLE_CONFIG[u.role];
                return (
                  <tr key={u.id} className="bg-surface-900/40 hover:bg-surface-800/40 transition">
                    <td className="px-5 py-3 text-surface-500">#{u.id}</td>
                    <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-3 text-surface-300">{u.email}</td>
                    <td className="px-5 py-3 text-surface-400">{u.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setChangingRole(changingRole === u.id ? null : u.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config?.color || 'bg-surface-700 text-surface-300'}`}
                        >
                          {config?.label || u.role}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {changingRole === u.id && (
                          <div className="absolute left-0 top-8 z-10 rounded-xl border border-surface-700 bg-surface-900 py-1 shadow-xl min-w-[140px]">
                            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                              <button
                                key={role}
                                onClick={() => handleChangeRole(u.id, role)}
                                className={`w-full px-4 py-2 text-left text-xs hover:bg-surface-800 ${
                                  u.role === role ? 'text-brand-400 font-semibold' : 'text-surface-300'
                                }`}
                              >
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
        {icon}
      </div>
      <div>
        <p className="text-sm text-surface-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
