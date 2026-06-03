import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { 
  Plus, Edit, Trash2, Kanban, List, Search, Filter, 
  ArrowUpDown, ChevronLeft, ChevronRight, User, DollarSign, RefreshCw, CheckCircle 
} from 'lucide-react';

interface LeadItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  leadSource: string;
  estimatedDealValue: number;
  assignedUser?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  leadStage: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  notes: string[];
  createdAt: string;
}

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Other'];
const SOURCES = ['Website', 'Referral', 'Cold Outreach', 'LinkedIn', 'Partner', 'Event', 'Other'];

export const Leads: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Layout mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  // Leads state
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState('');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  
  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Technology',
    leadSource: 'Website',
    estimatedDealValue: 0,
    assignedUser: '',
    leadStage: 'New' as LeadItem['leadStage'],
    notes: ''
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Load leads and users
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        search,
        stage: stageFilter,
        industry: industryFilter,
        source: sourceFilter,
        assignedUser: assigneeFilter,
        sortBy,
        sortOrder
      };
      
      const res = await api.get<any>('/api/leads', params);
      setLeads(res.leads || []);
      setTotalLeads(res.pagination?.total || 0);
      setTotalPages(res.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get<any[]>('/api/users');
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, stageFilter, industryFilter, sourceFilter, assigneeFilter, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Check URL query parameters (Spotlight search redirect handler)
  useEffect(() => {
    const leadId = searchParams.get('id');
    if (leadId) {
      // Pull that lead and open editing dialog
      api.get<any>(`/api/leads/${leadId}`)
        .then((res) => {
          handleEditClick(res.lead);
          setSearchParams({}); // Clear query parameter
        })
        .catch(err => console.error(err));
    }
  }, [searchParams]);

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stage: LeadItem['leadStage']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    // Optimistic Update locally
    const originalLeads = [...leads];
    setLeads(prev => prev.map(lead => 
      lead._id === leadId ? { ...lead, leadStage: stage } : lead
    ));

    try {
      await api.patch(`/api/leads/${leadId}/stage`, { leadStage: stage });
      fetchLeads(); // Sync with DB activity logs
    } catch (err) {
      console.error(err);
      setLeads(originalLeads); // Rollback
    }
  };

  // Form handlers
  const handleOpenCreate = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      industry: 'Technology',
      leadSource: 'Website',
      estimatedDealValue: 15000,
      assignedUser: user?.role === 'executive' ? user.id : users[0]?._id || '',
      leadStage: 'New',
      notes: ''
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleEditClick = (lead: LeadItem) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company,
      industry: lead.industry,
      leadSource: lead.leadSource,
      estimatedDealValue: lead.estimatedDealValue,
      assignedUser: lead.assignedUser?._id || '',
      leadStage: lead.leadStage,
      notes: ''
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company) {
      setFormError('Name and Company fields are required');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      if (editingLead) {
        await api.put(`/api/leads/${editingLead._id}`, formData);
      } else {
        await api.post('/api/leads', formData);
      }
      setDialogOpen(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead? This action is permanent.')) return;
    try {
      await api.del(`/api/leads/${id}`);
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConvertCustomer = async (id: string) => {
    if (!window.confirm('Convert this Closed Won lead to an active Customer? This sets up a Customer Profile.')) return;
    try {
      await api.post(`/api/leads/${id}/convert`);
      alert('Lead successfully converted to Customer! 🚀');
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Bulk selectors
  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l._id));
    }
  };

  const toggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete all ${selectedIds.length} selected leads?`)) return;

    try {
      await api.post('/api/leads/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkStageChange = async () => {
    if (selectedIds.length === 0 || !bulkStage) return;
    try {
      await api.post('/api/leads/bulk-update-stage', { ids: selectedIds, leadStage: bulkStage });
      setSelectedIds([]);
      setBulkStage('');
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Kanban Stage Stats calculator
  const getStageTotalValue = (stageName: string) => {
    return leads
      .filter(l => l.leadStage === stageName)
      .reduce((sum, lead) => sum + lead.estimatedDealValue, 0);
  };

  const getStageCount = (stageName: string) => {
    return leads.filter(l => l.leadStage === stageName).length;
  };

  const getBadgeVariant = (stage: LeadItem['leadStage']) => {
    switch (stage) {
      case 'New': return 'primary';
      case 'Contacted': return 'info';
      case 'Qualified': return 'warning';
      case 'Proposal Sent': return 'warning';
      case 'Negotiation': return 'warning';
      case 'Closed Won': return 'success';
      default: return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads & Opportunities</h2>
          <p className="text-sm text-muted-foreground">Manage opportunity pipelines, pipeline stages, and promote conversions</p>
        </div>
        <div className="flex items-center gap-3">
          
          {/* View toggle */}
          <div className="bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg flex items-center shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-150 transition-all ${
                viewMode === 'table' ? 'bg-card text-foreground shadow-sm' : ''
              }`}
              title="Table View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-150 transition-all ${
                viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : ''
              }`}
              title="Kanban Board"
            >
              <Kanban className="h-4.5 w-4.5" />
            </button>
          </div>

          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            <Plus className="h-4.5 w-4.5" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Query Search / Filter Panel */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads, companies..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md border-border bg-transparent focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <Select
          label="Stage"
          options={[{ value: '', label: 'All Stages' }, ...STAGES.map(s => ({ value: s, label: s }))]}
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="text-xs py-1"
        />

        <Select
          label="Industry"
          options={[{ value: '', label: 'All Industries' }, ...INDUSTRIES.map(i => ({ value: i, label: i }))]}
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="text-xs py-1"
        />

        <Select
          label="Outreach Source"
          options={[{ value: '', label: 'All Sources' }, ...SOURCES.map(s => ({ value: s, label: s }))]}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-xs py-1"
        />

        {user?.role !== 'executive' && (
          <Select
            label="Assigned Agent"
            options={[{ value: '', label: 'All Agents' }, ...users.map(u => ({ value: u._id, label: u.name }))]}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs py-1"
          />
        )}
      </Card>

      {/* Bulk actions banner */}
      {selectedIds.length > 0 && viewMode === 'table' && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {selectedIds.length} leads selected
          </span>
          <div className="flex items-center gap-2">
            <Select
              options={[{ value: '', label: 'Bulk Update Stage' }, ...STAGES.map(s => ({ value: s, label: s }))]}
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value)}
              className="py-1 text-xs max-w-[160px] bg-card"
            />
            <Button variant="secondary" size="sm" onClick={handleBulkStageChange} disabled={!bulkStage}>
              Apply
            </Button>
            {user?.role !== 'executive' && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                Bulk Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Core Layout Display */}
      {viewMode === 'table' ? (
        
        /* Table View */
        <Card className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground font-semibold">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('name')}>
                  Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('company')}>
                  Company <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="p-4">Industry</th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('estimatedDealValue')}>
                  Deal Value <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="p-4">Pipeline Stage</th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-4"><TableRowSkeleton /></td></tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">No leads found. Create a new opportunity to get started.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead._id)}
                        onChange={() => toggleSelectId(lead._id)}
                      />
                    </td>
                    <td className="p-4 font-semibold text-foreground">{lead.name}</td>
                    <td className="p-4 text-muted-foreground">{lead.company}</td>
                    <td className="p-4">{lead.industry}</td>
                    <td className="p-4 font-bold text-foreground">₹{lead.estimatedDealValue.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={getBadgeVariant(lead.leadStage)}>
                        {lead.leadStage}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-500">
                          {lead.assignedUser?.name.charAt(0) || 'U'}
                        </div>
                        <span>{lead.assignedUser?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      {lead.leadStage === 'Closed Won' && (
                        <button
                          onClick={() => handleConvertCustomer(lead._id)}
                          className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded transition-all"
                          title="Convert to Customer Profile"
                        >
                          <CheckCircle className="h-4.5 w-4.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(lead)}
                        className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                        title="Edit Details"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </button>
                      {user?.role !== 'executive' && (
                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                          title="Delete Lead"
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Showing lead records</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <span className="px-3 font-semibold">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-start select-none">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.leadStage === stage);
            return (
              <div 
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-3 border border-border flex flex-col gap-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold leading-none">{stage}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                      {getStageCount(stage)} opportunities
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    ₹{(getStageTotalValue(stage) / 1000).toFixed(0)}k
                  </span>
                </div>
                
                {/* Card Items */}
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[60vh] pr-0.5">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead._id)}
                      onClick={() => handleEditClick(lead)}
                      className="bg-card text-card-foreground border border-border rounded-lg p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all border-l-2"
                      style={{ borderLeftColor: stage === 'Closed Won' ? '#10b981' : stage === 'Closed Lost' ? '#f43f5e' : '#6366f1' }}
                    >
                      <p className="font-semibold text-xs leading-snug truncate">{lead.name}</p>
                      <p className="text-[10px] text-slate-400 leading-snug truncate mb-2">{lead.company}</p>
                      
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-border/60">
                        <span className="text-[10px] font-extrabold text-foreground">
                          ₹{lead.estimatedDealValue.toLocaleString()}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[9px]">
                            {lead.assignedUser?.name.charAt(0) || 'U'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[10px] border border-dashed border-border rounded-lg">
                      Drop lead here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog Form */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingLead ? `Update Lead: ${editingLead.name}` : 'Provision New Sales Lead Opportunity'}
        size="lg"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-500 rounded-lg text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Representative Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Elena Rostova"
            />
            <Input
              label="Target Company Name *"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="e.g. Snowflake Analytics"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="name@company.com"
            />
            <Input
              label="Direct Call Phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 019-2834"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Sector Industry"
              options={INDUSTRIES.map(i => ({ value: i, label: i }))}
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            />
            <Select
              label="Outreach Source"
              options={SOURCES.map(s => ({ value: s, label: s }))}
              value={formData.leadSource}
              onChange={(e) => setFormData(prev => ({ ...prev, leadSource: e.target.value }))}
            />
            <Input
              label="Estimated Deal Value (₹) *"
              type="number"
              value={formData.estimatedDealValue}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDealValue: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role !== 'executive' ? (
              <Select
                label="Assign Sales Representative"
                options={users.map(u => ({ value: u._id, label: u.name }))}
                value={formData.assignedUser}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedUser: e.target.value }))}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-350">Assigned Agent</span>
                <span className="p-2 border border-border bg-slate-50 dark:bg-slate-900 text-muted-foreground rounded-md">{user.name}</span>
              </div>
            )}

            <Select
              label="Pipeline Stage"
              options={STAGES.map(s => ({ value: s, label: s }))}
              value={formData.leadStage}
              onChange={(e) => setFormData(prev => ({ ...prev, leadStage: e.target.value as any }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-350">
              {editingLead ? 'Append Activity Log or Outreach Note' : 'Introductory Note'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={editingLead ? "Type here to add a new dated activity log..." : "Add initial context regarding this deal opportunity..."}
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-transparent focus:ring-1 focus:ring-ring focus:border-ring outline-none"
              rows={3}
            />
          </div>

          {editingLead && editingLead.notes.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block mb-2">Past Opportunity Notes</span>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg max-h-32 overflow-y-auto space-y-1.5">
                {editingLead.notes.map((n, i) => (
                  <p key={i} className="text-[11px] border-b border-border/40 pb-1.5 last:border-0 last:pb-0">{n}</p>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingLead ? 'Update Lead Opportunity' : 'Launch Deal Opportunity'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
