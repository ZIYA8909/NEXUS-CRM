import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  Plus, Edit, Trash2, Calendar, CheckCircle2, Play, AlertCircle, Clock, Link as LinkIcon
} from 'lucide-react';

interface TaskItem {
  _id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assignedUser?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  status: 'Pending' | 'In Progress' | 'Completed';
  relatedTo?: {
    modelType: 'Lead' | 'Customer';
    modelId?: {
      _id: string;
      name: string;
      company: string;
    };
  };
}

const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'] as const;
const PRIORITIES = ['Low', 'Medium', 'High'] as const;

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Selector inputs options
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TaskItem['priority'],
    dueDate: '',
    assignedUser: '',
    status: 'Pending' as TaskItem['status'],
    relatedType: '' as 'Lead' | 'Customer' | '',
    relatedId: ''
  });
  
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchTasksAndStats = async () => {
    try {
      setLoading(true);
      const [tasksData, statsData] = await Promise.all([
        api.get<TaskItem[]>('/api/tasks'),
        api.get<any>('/api/tasks/stats')
      ]);
      setTasks(tasksData || []);
      setStats(statsData || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [usersData, leadsData, customersData] = await Promise.all([
        api.get<any[]>('/api/users'),
        api.get<any>('/api/leads', { limit: 100 }),
        api.get<any>('/api/customers', { limit: 100 })
      ]);
      setUsers(usersData || []);
      setLeads(leadsData.leads || []);
      setCustomers(customersData.customers || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasksAndStats();
    fetchFormOptions();
  }, [user]);

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskItem['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Optimistic Update
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => 
      t._id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasksAndStats();
    } catch (err) {
      console.error(err);
      setTasks(originalTasks); // Rollback
    }
  };

  // Form Handlers
  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      assignedUser: user?.role === 'executive' ? user.id : users[0]?._id || '',
      status: 'Pending',
      relatedType: '',
      relatedId: ''
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleEditClick = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      assignedUser: task.assignedUser?._id || '',
      status: task.status,
      relatedType: task.relatedTo?.modelType || '',
      relatedId: task.relatedTo?.modelId?._id || ''
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      setFormError('Title and Due Date are required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    const payload: any = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      dueDate: formData.dueDate,
      assignedUser: formData.assignedUser,
      status: formData.status
    };

    if (formData.relatedType && formData.relatedId) {
      payload.relatedTo = {
        modelType: formData.relatedType,
        modelId: formData.relatedId
      };
    }

    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/api/tasks', payload);
      }
      setDialogOpen(false);
      fetchTasksAndStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task checklist item?')) return;
    try {
      await api.del(`/api/tasks/${id}`);
      fetchTasksAndStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Helper due status checking
  const isDueSoon = (dueDateStr: string, status: string) => {
    if (status === 'Completed') return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const diffHours = diff / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  };

  const isOverdue = (dueDateStr: string, status: string) => {
    if (status === 'Completed') return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return due.getTime() < now.getTime();
  };

  const getPriorityBadgeVariant = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Scheduling</h2>
          <p className="text-sm text-muted-foreground font-medium">Coordinate client action lists, calendar updates, and milestones</p>
        </div>
        <div>
          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            <Plus className="h-4.5 w-4.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* KPI Stats widgets */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tasks</span>
            <p className="text-lg font-bold text-foreground mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4 text-center">
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Pending</span>
            <p className="text-lg font-bold text-indigo-500 mt-1">{stats.pending}</p>
          </Card>
          <Card className="p-4 text-center">
            <span className="text-[10px] font-bold text-sky-400 uppercase">In Progress</span>
            <p className="text-lg font-bold text-sky-500 mt-1">{stats.inProgress}</p>
          </Card>
          <Card className="p-4 text-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Completed</span>
            <p className="text-lg font-bold text-emerald-500 mt-1">{stats.completed}</p>
          </Card>
          <Card className="p-4 text-center bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900 col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-rose-500 dark:text-rose-450 uppercase flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" /> Due soon (48h)
            </span>
            <p className="text-lg font-bold text-rose-500 dark:text-rose-450 mt-1">{stats.dueSoon}</p>
          </Card>
        </div>
      )}

      {/* Columns Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {TASK_STATUSES.map((status) => {
          const colTasks = tasks.filter(t => t.status === status);
          
          return (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className="bg-slate-100/50 dark:bg-slate-900/50 border border-border p-4 rounded-xl flex flex-col gap-3 min-h-[500px]"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    status === 'Completed' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-sky-500' : 'bg-indigo-500'
                  }`} />
                  <h4 className="font-bold text-sm leading-none">{status}</h4>
                </div>
                <span className="bg-card text-muted-foreground px-2 py-0.5 rounded font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks Cards list */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[65vh] pr-0.5">
                {loading ? (
                  [...Array(2)].map((_, idx) => <Skeleton key={idx} className="h-24 rounded-lg" />)
                ) : colTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-border rounded-lg">
                    No tasks in this column
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const soon = isDueSoon(task.dueDate, task.status);
                    const over = isOverdue(task.dueDate, task.status);
                    
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => handleEditClick(task)}
                        className={`bg-card text-card-foreground border border-border p-4 rounded-lg shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing space-y-3 border-t-2 ${
                          soon ? 'border-t-rose-400 bg-rose-500/[0.02]' : over ? 'border-t-rose-600 bg-rose-600/[0.04]' : 'border-t-slate-300 dark:border-t-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-foreground leading-snug">{task.title}</p>
                          <button
                            onClick={(e) => handleDeleteTask(task._id, e)}
                            className="text-slate-400 hover:text-rose-500 rounded p-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {task.description || 'No descriptive overview supplied.'}
                        </p>

                        {/* Associated Lead or Customer link */}
                        {task.relatedTo?.modelId && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded flex items-center gap-1.5 text-[10px] text-slate-500">
                            <LinkIcon className="h-3 w-3 shrink-0" />
                            <span className="font-semibold truncate">
                              {task.relatedTo.modelId.name} ({task.relatedTo.modelId.company})
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                          <span className={`text-[10px] font-bold flex items-center gap-1 ${
                            soon || over ? 'text-rose-500' : 'text-slate-400'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                            {soon && <span className="animate-pulse">●</span>}
                          </span>
                          <Badge variant={getPriorityBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation/Editing Form Modal */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingTask ? `Modify Checklist Task: ${editingTask.title}` : 'Provision Scheduled Action Item'}
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-500 rounded-lg text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <Input
            label="Checklist Action Title *"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Call procurement to negotiate subscription terms"
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-350">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Supply extra context regarding tasks..."
              className="w-full px-3 py-2 text-xs border rounded-md border-border bg-transparent outline-none focus:ring-1 focus:ring-ring"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority Label"
              options={PRIORITIES.map(p => ({ value: p, label: `${p} Priority` }))}
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
            />
            <Input
              label="Deadline Date *"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {user?.role !== 'executive' ? (
              <Select
                label="Assign Agent"
                options={users.map(u => ({ value: u._id, label: u.name }))}
                value={formData.assignedUser}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedUser: e.target.value }))}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-350">Assigned Agent</span>
                <span className="p-2 border border-border bg-slate-50 dark:bg-slate-900 rounded-md">{user.name}</span>
              </div>
            )}
            <Select
              label="Task Progress Status"
              options={TASK_STATUSES.map(s => ({ value: s, label: s }))}
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            />
          </div>

          {/* Linking layout */}
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Link to Lead or Customer"
              options={[
                { value: '', label: 'Unlinked' },
                { value: 'Lead', label: 'Lead Contact' },
                { value: 'Customer', label: 'Active Customer' }
              ]}
              value={formData.relatedType}
              onChange={(e) => setFormData(prev => ({ ...prev, relatedType: e.target.value as any, relatedId: '' }))}
            />
            {formData.relatedType && (
              <Select
                label={`Select ${formData.relatedType}`}
                options={
                  formData.relatedType === 'Lead'
                    ? leads.map(l => ({ value: l._id, label: `${l.name} (${l.company})` }))
                    : customers.map(c => ({ value: c._id, label: `${c.name} (${c.company})` }))
                }
                value={formData.relatedId}
                onChange={(e) => setFormData(prev => ({ ...prev, relatedId: e.target.value }))}
              />
            )}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingTask ? 'Save Changes' : 'Schedule Action Item'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
