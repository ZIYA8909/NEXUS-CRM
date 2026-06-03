import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Skeleton, TableRowSkeleton } from '../components/ui/Skeleton';
import { 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, Phone, Mail, 
  MapPin, Calendar, DollarSign, MessageSquare, Plus, Clock, History, FileText, UserPlus
} from 'lucide-react';

interface CustomerItem {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  industry: string;
  revenueGenerated: number;
  customerSince: string;
  assignedManager?: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  notes: string[];
}

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // List vs Profile Detail View
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const custId = searchParams.get('id');
    if (custId) {
      setSelectedCustomerId(custId);
      setSearchParams({}); // Clear query parameter
    }
  }, [searchParams]);

  // Index List states
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Activity Form Fields
  const [activityType, setActivityType] = useState<'Call' | 'Meeting' | 'Email' | 'Note'>('Call');
  const [activityContent, setActivityContent] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);

  // Note log state
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        search,
        industry: industryFilter,
        sortBy,
        sortOrder
      };
      const res = await api.get<any>('/api/customers', params);
      setCustomers(res.customers || []);
      setTotalCustomers(res.pagination?.total || 0);
      setTotalPages(res.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async (id: string) => {
    try {
      setProfileLoading(true);
      const res = await api.get<any>(`/api/customers/${id}`);
      setSelectedCustomer(res.customer);
      setTimeline(res.activities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, industryFilter, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerProfile(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const handleRowClick = (id: string) => {
    setSelectedCustomerId(id);
  };

  const handleBackToList = () => {
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
    setTimeline([]);
  };

  const handleLogActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityContent || !selectedCustomerId) return;

    setActivityLoading(true);
    try {
      // Direct activity logging via POST
      await api.post('/api/activities', {
        type: activityType,
        content: activityContent,
        relatedTo: {
          modelType: 'Customer',
          modelId: selectedCustomerId
        }
      });
      setActivityContent('');
      // Refresh profile timeline
      fetchCustomerProfile(selectedCustomerId);
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote || !selectedCustomerId) return;

    setNoteLoading(true);
    try {
      await api.put(`/api/customers/${selectedCustomerId}`, { notes: newNote });
      setNewNote('');
      fetchCustomerProfile(selectedCustomerId);
    } catch (err) {
      console.error(err);
    } finally {
      setNoteLoading(false);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Call': return <Phone className="h-3.5 w-3.5 text-blue-500" />;
      case 'Meeting': return <Calendar className="h-3.5 w-3.5 text-indigo-500" />;
      case 'Email': return <Mail className="h-3.5 w-3.5 text-amber-500" />;
      case 'Note': return <FileText className="h-3.5 w-3.5 text-slate-500" />;
      default: return <History className="h-3.5 w-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Active Customer Accounts</h2>
        <p className="text-sm text-muted-foreground font-medium">Evaluate won client portfolios, history logs, and billing details</p>
      </div>

      {/* Main split display */}
      {!selectedCustomerId ? (
        
        /* 1. Customers Table Listing Mode */
        <>
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search query</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, corporate..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md border-border bg-transparent focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
            </div>

            <Select
              label="Sector Industry"
              options={[
                { value: '', label: 'All Industries' },
                { value: 'Technology', label: 'Technology' },
                { value: 'Healthcare', label: 'Healthcare' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Manufacturing', label: 'Manufacturing' },
                { value: 'Retail', label: 'Retail' },
                { value: 'Energy', label: 'Energy' }
              ]}
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="text-xs py-1"
            />
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground font-semibold">
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('name')}>
                    Client Owner <ArrowUpDown className="inline h-3 w-3 ml-1" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('company')}>
                    Company <ArrowUpDown className="inline h-3 w-3 ml-1" />
                  </th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Industry</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('revenueGenerated')}>
                    Revenue Won <ArrowUpDown className="inline h-3 w-3 ml-1" />
                  </th>
                  <th className="p-4">Customer Since</th>
                  <th className="p-4">Portfolio Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="p-4"><TableRowSkeleton /></td></tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No active customers found in database. Promote Closed Won leads to register customers.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr 
                      key={cust._id}
                      onClick={() => handleRowClick(cust._id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 cursor-pointer transition-all"
                    >
                      <td className="p-4 font-bold text-foreground">{cust.name}</td>
                      <td className="p-4 text-muted-foreground font-medium">{cust.company}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span>{cust.email}</span>
                          <span className="text-[10px] text-slate-400">{cust.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">{cust.industry}</td>
                      <td className="p-4 font-bold text-emerald-500">₹{cust.revenueGenerated.toLocaleString()}</td>
                      <td className="p-4">{new Date(cust.customerSince).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[9px]">
                            {cust.assignedManager?.name.charAt(0) || 'M'}
                          </div>
                          <span className="font-medium text-foreground">{cust.assignedManager?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total of {totalCustomers} active accounts</span>
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
        </>
      ) : (
        
        /* 2. Customer Profile Detail Mode */
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={handleBackToList}>
            ← Back to Customer Index
          </Button>

          {profileLoading || !selectedCustomer ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs">
              
              {/* Profile Details Left Panel */}
              <div className="space-y-6">
                
                {/* Core profile card */}
                <Card className="p-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold leading-none">{selectedCustomer.name}</h3>
                      <p className="text-[10px] font-bold text-slate-450 uppercase mt-1 tracking-widest">{selectedCustomer.company}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-3 text-[11px] leading-relaxed">
                    <div className="flex items-center gap-3.5">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedCustomer.phone || 'No direct phone logged'}</span>
                    </div>
                    <div className="flex items-start gap-3.5">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p>{selectedCustomer.address.street || 'No street logged'}</p>
                        <p>{selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zip}</p>
                        <p className="text-[10px] text-slate-450">{selectedCustomer.address.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5 border-t border-border/60 pt-3">
                      <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex justify-between w-full">
                        <span className="font-semibold">Revenue Won:</span>
                        <span className="font-extrabold text-emerald-500">₹{selectedCustomer.revenueGenerated.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex justify-between w-full">
                        <span className="font-semibold">Customer Since:</span>
                        <span>{new Date(selectedCustomer.customerSince).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5 border-t border-border/60 pt-3">
                      <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex justify-between w-full">
                        <span className="font-semibold">Account Manager:</span>
                        <span className="font-bold">{selectedCustomer.assignedManager?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Direct Notes Logger */}
                <Card className="p-5">
                  <h4 className="font-bold text-xs mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Account Manager Notes
                  </h4>
                  <form onSubmit={handleAddNoteSubmit} className="space-y-3.5">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal portfolio note..."
                      className="w-full px-3 py-2 text-xs border border-border bg-transparent rounded-md outline-none focus:ring-1 focus:ring-ring"
                      rows={3}
                    />
                    <Button type="submit" variant="secondary" size="sm" className="w-full" loading={noteLoading}>
                      Append Log Note
                    </Button>
                  </form>
                  
                  {selectedCustomer.notes.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Logged Notes</span>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                        {selectedCustomer.notes.map((note, index) => (
                          <div key={index} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] border border-border/40">
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

              </div>

              {/* Timeline Right Panel */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Quick Timeline outreach logger */}
                <Card className="p-5">
                  <h4 className="font-bold text-xs mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" /> Log Client Interaction Activity
                  </h4>
                  <form onSubmit={handleLogActivitySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Interaction Channels"
                        options={[
                          { value: 'Call', label: 'Call Log' },
                          { value: 'Meeting', label: 'Meeting Outcome' },
                          { value: 'Email', label: 'Email Followup' },
                          { value: 'Note', label: 'Outreach Note' }
                        ]}
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as any)}
                        className="py-1"
                      />
                    </div>
                    <Input
                      label="Outreach Summary / Discussion Highlights *"
                      value={activityContent}
                      onChange={(e) => setActivityContent(e.target.value)}
                      placeholder="e.g. Discussed subscription scaling plan. Agreed on 15 seats update."
                      className="py-2.5"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="primary" size="sm" loading={activityLoading}>
                        Submit Activity History
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Historical Timeline Timeline */}
                <Card className="p-5">
                  <h4 className="font-bold text-xs mb-5 flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-400" /> Customer Engagement History Timeline
                  </h4>
                  {timeline.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No outreach activities recorded for this customer yet.
                    </div>
                  ) : (
                    <div className="relative timeline-line pl-8 space-y-4">
                      {timeline.map((act) => (
                        <div key={act._id} className="relative flex gap-3 text-xs">
                          {/* Circle icon */}
                          <div className="absolute -left-[25px] mt-0.5 h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center z-10 shadow-sm shrink-0">
                            {getActivityIcon(act.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground leading-normal">
                              {act.content}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                              Logged by {act.performedBy?.name || 'Representative'} • {new Date(act.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
