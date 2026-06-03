import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton, TableRowSkeleton } from '../components/ui/Skeleton';
import { 
  Plus, Edit, Trash2, ShieldAlert, Users, Award, Shield, CheckCircle2, UserX 
} from 'lucide-react';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'executive';
  status: 'active' | 'inactive';
  phone?: string;
  createdAt: string;
}

export const Team: React.FC = () => {
  const { user } = useAuth();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog controls
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'executive' as TeamMember['role'],
    status: 'active' as TeamMember['status']
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get<TeamMember[]>('/api/users');
      setMembers(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchMembers();
    }
  }, [user]);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'executive',
      status: 'active'
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleEditClick = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      password: '', // blank by default (only filled to change password)
      role: member.role,
      status: member.status
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and Email are required');
      return;
    }

    if (!editingMember && !formData.password) {
      setFormError('Password is required for new users');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      if (editingMember) {
        // Edit User
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password; // Do not update password if blank
        await api.put(`/api/users/${editingMember._id}`, payload);
      } else {
        // Create User
        await api.post('/api/users', formData);
      }
      setDialogOpen(false);
      fetchMembers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save team member profile');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (id === user?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${name}? This will remove their credentials.`)) return;

    try {
      await api.del(`/api/users/${id}`);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs">
        <Card className="max-w-md p-6 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold">Access Restrained</h3>
          <p className="text-muted-foreground leading-relaxed">
            Only System Administrators have permissions to manage users, configure role-based permissions, or delete accounts.
          </p>
        </Card>
      </div>
    );
  }

  // Count Statistics
  const totalReps = members.length;
  const activeReps = members.filter(m => m.status === 'active').length;
  const adminReps = members.filter(m => m.role === 'admin').length;
  const managerReps = members.filter(m => m.role === 'manager').length;
  const execReps = members.filter(m => m.role === 'executive').length;

  return (
    <div className="space-y-6 text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Management Center</h2>
          <p className="text-sm text-muted-foreground font-medium">Create team reps accounts, edit permissions, and assign corporate roles</p>
        </div>
        <div>
          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            <Plus className="h-4.5 w-4.5" />
            Provision User
          </Button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <span className="text-[10px] font-bold text-slate-450 uppercase flex items-center justify-center gap-1.5">
            <Users className="h-3 w-3 text-slate-400" /> Total Users
          </span>
          <p className="text-lg font-extrabold text-foreground mt-1">{totalReps}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-450" /> Active Users
          </span>
          <p className="text-lg font-extrabold text-emerald-500 mt-1">{activeReps}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3 text-indigo-405" /> Administrators
          </span>
          <p className="text-lg font-extrabold text-indigo-500 mt-1">{adminReps}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center justify-center gap-1.5">
            <Award className="h-3 w-3 text-emerald-450" /> Managers
          </span>
          <p className="text-lg font-extrabold text-emerald-500 mt-1">{managerReps}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] font-bold text-sky-400 uppercase flex items-center justify-center gap-1.5">
            <Users className="h-3 w-3 text-sky-450" /> Executives
          </span>
          <p className="text-lg font-extrabold text-sky-500 mt-1">{execReps}</p>
        </Card>
      </div>

      {/* Index table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground font-semibold">
              <th className="p-4">Representative Name</th>
              <th className="p-4">Work Email</th>
              <th className="p-4">Phone Line</th>
              <th className="p-4">Business Role</th>
              <th className="p-4">Account Status</th>
              <th className="p-4">Registered Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-4"><TableRowSkeleton /></td></tr>
              ))
            ) : (
              members.map((member) => (
                <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-foreground flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-500">
                      {member.name.charAt(0)}
                    </div>
                    <span>{member.name} {member._id === user?.id && <span className="text-[9px] text-primary">(You)</span>}</span>
                  </td>
                  <td className="p-4 text-slate-450">{member.email}</td>
                  <td className="p-4 text-slate-400">{member.phone || '-'}</td>
                  <td className="p-4 capitalize">
                    <Badge variant={member.role === 'admin' ? 'primary' : member.role === 'manager' ? 'success' : 'secondary'}>
                      {member.role === 'executive' ? 'Sales Executive' : member.role === 'manager' ? 'Sales Manager' : 'Admin'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right space-x-2 shrink-0">
                    <button
                      onClick={() => handleEditClick(member)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-105 rounded"
                      title="Edit Profile"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    {member._id !== user?.id && (
                      <button
                        onClick={() => handleDeleteMember(member._id, member.name)}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                        title="Delete User"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* User Setup form dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingMember ? `Modify User Profile: ${editingMember.name}` : 'Provision New Aura Member'}
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-500 rounded-lg text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <Input
            label="Representative Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Sarah Jenkins"
          />

          <Input
            label="Work Email Address *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="s.jenkins@nexus-crm.com"
          />

          <Input
            label="Direct Phone Line"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 (555) 012-3456"
          />

          <Input
            label={editingMember ? "Override Account Password" : "Set Initial Password *"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder={editingMember ? "Leave blank to preserve password..." : "••••••••"}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Corporate Role"
              options={[
                { value: 'executive', label: 'Sales Executive' },
                { value: 'manager', label: 'Sales Manager' },
                { value: 'admin', label: 'Administrator' }
              ]}
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
            />

            <Select
              label="Account Status"
              options={[
                { value: 'active', label: 'Active User' },
                { value: 'inactive', label: 'Deactivated' }
              ]}
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingMember ? 'Save Profile changes' : 'Provision User Credentials'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
