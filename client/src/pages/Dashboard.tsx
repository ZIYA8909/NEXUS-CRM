import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, DollarSign, Target, Award,
  ArrowUpRight, ArrowDownRight, Briefcase, Calendar, CheckCircle2, 
  MessageSquare, Clock, Phone, Mail, Sparkles, Zap, Layers, Plus, 
  ChevronRight, Info, Award as Trophy, ChevronRightIcon, CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot
} from 'recharts';

interface KPIItem {
  value: string | number;
  change: string;
  trend: 'up' | 'down';
}

interface DashboardKPIs {
  leads: KPIItem;
  activeDeals: KPIItem;
  revenue: KPIItem;
  conversionRate: KPIItem;
  dealsWon: KPIItem;
  dealsLost: KPIItem;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [topReps, setTopReps] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Toast notifications or alerts simulator
  const [alertDismissed, setAlertDismissed] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpisData, trendData, funnelData, sourcesData, tasksData, activitiesData] = await Promise.all([
        api.get<DashboardKPIs>('/api/reports/dashboard-stats'),
        api.get<any[]>('/api/reports/revenue-trend'),
        api.get<any[]>('/api/reports/conversion-funnel'),
        api.get<any[]>('/api/reports/lead-sources'),
        api.get<any[]>('/api/tasks', { limit: 5, status: 'Pending' }),
        api.get<any[]>('/api/reports/recent-activities')
      ]);

      setKpis(kpisData);
      setRevenueTrend(trendData);
      setFunnel(funnelData);
      setSources(sourcesData);
      setRecentTasks(tasksData);
      setActivities(activitiesData);

      // Fetch top reps if manager or admin
      if (user?.role !== 'executive') {
        const repsData = await api.get<any[]>('/api/reports/team-performance');
        setTopReps(repsData.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const completeTask = async (taskId: string) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: 'Completed' });
      // Refresh tasks list
      const tasksData = await api.get<any[]>('/api/tasks', { limit: 5, status: 'Pending' });
      setRecentTasks(tasksData);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for rendering greeting based on local time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Generates smooth SVG path coordinate string based on actual trend numbers
  const generateSparkline = (data: any[]) => {
    if (!data || data.length < 2) return 'M 0 15 L 100 15';
    const values = data.map(d => d.revenue || 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const stepX = 100 / (data.length - 1);
    return data.map((d, idx) => {
      const val = d.revenue || 0;
      const y = 28 - ((val - min) / range) * 23 - 2; // Bound points within 2px to 28px
      const x = idx * stepX;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  // Computes forecasted future months based on growth coefficients and database trend
  const buildForecastData = () => {
    if (revenueTrend.length === 0) return [];
    
    // Add historic data
    const baseData = revenueTrend.map(item => ({
      month: item.month,
      revenue: item.revenue,
      forecast: null as number | null,
      lowerConfidence: null as number | null,
      upperConfidence: null as number | null,
    }));
    
    const lastItem = revenueTrend[revenueTrend.length - 1];
    const lastRev = lastItem.revenue;
    
    // Calculate average growth rate
    let growthRate = 0.07;
    if (revenueTrend.length >= 2) {
      const firstRev = revenueTrend[0].revenue || 1;
      growthRate = Math.min(Math.max((lastRev / firstRev - 1) / (revenueTrend.length - 1), -0.05), 0.2);
    }
    
    const monthSequence = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let startIdx = monthSequence.indexOf(lastItem.month);
    if (startIdx === -1) startIdx = 5; // Default to June

    // Connect forecast line directly to final actual month
    baseData[baseData.length - 1].forecast = lastRev;
    baseData[baseData.length - 1].lowerConfidence = lastRev;
    baseData[baseData.length - 1].upperConfidence = lastRev;
    
    // Project 3 future months
    const extended = [...baseData];
    for (let i = 1; i <= 3; i++) {
      const monthName = monthSequence[(startIdx + i) % 12];
      // Add slight sin seasonality to mock realistic dips
      const multiplier = 1 + growthRate * i + (Math.sin(i * 1.5) * 0.04);
      const forecastVal = Math.round(lastRev * multiplier);
      
      extended.push({
        month: `${monthName} (F)`,
        revenue: null as any,
        forecast: forecastVal,
        lowerConfidence: Math.round(forecastVal * (1 - 0.08 * i)),
        upperConfidence: Math.round(forecastVal * (1 + 0.09 * i)),
      });
    }
    
    return extended;
  };

  // Maps lead sources to cost and attribution table columns
  const getChannelPerformance = () => {
    if (sources.length === 0) return [];
    const totalRev = typeof kpis?.revenue?.value === 'number' ? kpis.revenue.value : 1485000;
    
    return sources.map((src, idx) => {
      const name = src.name || src._id || 'Inbound';
      let convRate = 4.8;
      let cpl = 320;
      
      if (name.includes('Referral')) { convRate = 18.2; cpl = 0; }
      else if (name.includes('Website')) { convRate = 6.4; cpl = 180; }
      else if (name.includes('LinkedIn')) { convRate = 8.1; cpl = 550; }
      else if (name.includes('Partner')) { convRate = 12.3; cpl = 400; }
      else if (name.includes('Cold Outreach')) { convRate = 3.2; cpl = 260; }
      
      // Calculate realistic channel revenue
      const revRatio = (src.value / (Math.max(src.value, 1) * 2.8 + 1)) * (convRate / 10);
      const channelRevenue = Math.round(totalRev * Math.min(Math.max(revRatio, 0.08), 0.45));

      return {
        channel: name,
        leads: src.value,
        convRate,
        cpl,
        revenue: channelRevenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'Call': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Meeting': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Email': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Note': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'Status Change': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Call': return <Phone className="h-3 w-3" />;
      case 'Meeting': return <Calendar className="h-3 w-3" />;
      case 'Email': return <Mail className="h-3 w-3" />;
      case 'Note': return <MessageSquare className="h-3 w-3" />;
      case 'Status Change': return <TrendingUp className="h-3 w-3" />;
      default: return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-[420px] lg:col-span-8 rounded-2xl" />
          <Skeleton className="h-[420px] lg:col-span-4 rounded-2xl" />
        </div>
      </div>
    );
  }

  const forecastChartData = buildForecastData();
  const channelPerformance = getChannelPerformance();
  const attentionDealsCount = (recentTasks.length) + (kpis ? Number(kpis.activeDeals.value) % 5 : 4);

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-12">
      
      {/* 1. Command-Center Dashboard Header */}
      <div className="bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium relative overflow-hidden transition-all">
        {/* Decorative backdrop light */}
        <div className="absolute top-0 right-0 w-80 h-32 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full">
              Command Center
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-2.5 flex items-center gap-2">
              {getGreeting()}, {user?.name.split(' ')[0] || 'Aarav'}.
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {attentionDealsCount} deals require active followup attention in your pipeline today.
            </p>
          </div>
          
          {/* Dashboard Header Activity Summary */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 px-3.5 py-2 rounded-xl text-center shrink-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Approvals</p>
              <p className="text-sm font-bold text-indigo-400 mt-0.5">3 Pending</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 px-3.5 py-2 rounded-xl text-center shrink-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Follow-Ups</p>
              <p className="text-sm font-bold text-amber-500 mt-0.5">{recentTasks.length} Due</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 px-3.5 py-2 rounded-xl text-center shrink-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Meetings</p>
              <p className="text-sm font-bold text-sky-400 mt-0.5">2 Scheduled</p>
            </div>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-900/80 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/leads')}
                className="bg-transparent text-slate-350 hover:text-white border-slate-200 dark:border-slate-900 hover:bg-slate-900/40 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Quick Lead
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={fetchDashboardData}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
              >
                Sync Metrics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Asymmetric Rich KPI Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Revenue Target & Sparkline Widget (Span 2) */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-5 shadow-premium flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                ₹{kpis ? Number(kpis.revenue.value).toLocaleString() : '14,85,000'}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {kpis?.revenue.trend === 'up' ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className={`text-xs font-bold ${kpis?.revenue.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {kpis?.revenue.change || '+12.4%'}
                </span>
                <span className="text-[10px] text-slate-450 font-medium">vs last month</span>
              </div>
            </div>
            
            {/* Sparkline Graphic */}
            <div className="pt-2">
              <svg viewBox="0 0 100 30" className="h-10 w-28 text-emerald-500 shrink-0 stroke-2 fill-none overflow-visible">
                <path 
                  d={generateSparkline(revenueTrend)} 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                />
              </svg>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-900/40 space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Q3 Target Accomplishment</span>
              <span className="font-bold text-slate-300">74%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full" style={{ width: '74%' }} />
            </div>
          </div>
        </div>

        {/* Active Opportunities Widget (Span 1) */}
        <div className="bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-5 shadow-premium flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Opportunities
              </span>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                {kpis ? kpis.activeDeals.value : '24'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 font-medium">
                Win probability rate is <span className="font-bold text-indigo-400">68%</span>
              </p>
            </div>
            <div className="p-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/10 rounded-lg">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>

          {/* Simple Stage density indicator */}
          <div className="mt-4">
            <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Weighted distribution</span>
            <div className="flex h-1.5 gap-0.5 mt-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 w-[25%]" title="New" />
              <div className="bg-purple-500 w-[50%]" title="Qualified" />
              <div className="bg-blue-500 w-[25%]" title="Negotiation" />
            </div>
          </div>
        </div>

        {/* Win Rate Dynamics Widget (Span 1) */}
        <div className="bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-5 shadow-premium flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Win Rate
              </span>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                {kpis ? kpis.conversionRate.value : '24.8%'}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500">
                <ArrowUpRight className="h-3 w-3" />
                <span>+3.2% vs last week</span>
              </div>
            </div>
            <div className="p-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/10 rounded-lg">
              <Target className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>High conversion momentum</span>
          </div>
        </div>

        {/* Won vs Lost Comparative Widget (Span 1) */}
        <div className="bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-5 shadow-premium flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ratio Won vs Lost
              </span>
              <h3 className="text-lg font-bold text-foreground tracking-tight mt-1">
                <span className="text-emerald-500 font-black">{kpis ? kpis.dealsWon.value : '142'} Won</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                against {kpis ? kpis.dealsLost.value : '18'} Lost leads
              </p>
            </div>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>

          {/* Stacked indicator bar */}
          <div className="mt-4 space-y-1">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-900">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full" style={{ width: '86%' }} />
              <div className="bg-rose-500 h-full" style={{ width: '14%' }} />
            </div>
            <div className="flex justify-between text-[8px] text-slate-450 font-bold">
              <span>86% Won</span>
              <span>14% Lost</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bento Grid - Primary Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Panel 1: Revenue Forecast Area (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Revenue Analysis & Projection</h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical cumulative sales wins mapped against Q3 forecast confidence ranges</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>Actual Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-indigo-400 border-dashed" />
                <span className="text-indigo-450 dark:text-indigo-300">Projected Forecast</span>
              </div>
            </div>
          </div>

          <div className="h-76">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  style={{ fontSize: '10px', fill: 'currentColor', fontWeight: '600' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: '10px', fill: 'currentColor', fontWeight: '600' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    if (val === null) return [null];
                    return [`₹${val.toLocaleString()}`, name === 'revenue' ? 'Actual Revenue' : 'Projected Forecast'];
                  }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                />

                {/* Shaded Confidence Intervals for projected segment */}
                <Area 
                  type="monotone" 
                  dataKey="upperConfidence" 
                  stroke="none"
                  fill="rgba(99, 102, 241, 0.03)"
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerConfidence" 
                  stroke="none"
                  fill="rgba(99, 102, 241, 0.03)"
                />

                {/* Actual Revenue Line */}
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#actualGlow)" 
                />

                {/* Projected Forecast Dotted Line */}
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#a855f7" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#forecastGlow)" 
                />

                {/* Benchmarks Annotations */}
                <ReferenceLine 
                  x="Mar" 
                  stroke="rgba(99, 102, 241, 0.4)" 
                  strokeDasharray="3 3"
                  label={{ value: 'Campaign Launched', fill: '#818cf8', fontSize: 9, position: 'top', fontWeight: 'bold' }} 
                />
                <ReferenceLine 
                  y={1000000} 
                  stroke="rgba(16, 185, 129, 0.3)" 
                  strokeDasharray="3 3"
                  label={{ value: '₹10L Target Achieved', fill: '#34d399', fontSize: 9, position: 'right', fontWeight: 'bold' }} 
                />
                <ReferenceDot 
                  x="Jun" 
                  y={revenueTrend[revenueTrend.length - 1]?.revenue || 1200000} 
                  r={4} 
                  fill="#10b981" 
                  stroke="#fff" 
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento Panel 2: Sales Funnel Health (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base tracking-tight">Pipeline Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">Drop-off ratios between successive opportunities stages</p>
          </div>

          <div className="mt-6 flex-1 flex flex-col justify-center">
            {funnel.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No funnel metrics seeded</p>
            ) : (
              <div className="space-y-3">
                {funnel.map((item, idx) => {
                  const maxCount = Math.max(...funnel.map(f => f.count), 1);
                  const percent = Math.round((item.count / maxCount) * 100);
                  
                  // Compute conversions drop-offs
                  let dropOff = null;
                  if (idx > 0 && funnel[idx - 1].count > 0) {
                    const prev = funnel[idx - 1].count;
                    const curr = item.count;
                    dropOff = Math.round(((prev - curr) / prev) * 100);
                  }

                  return (
                    <div key={item.stage} className="space-y-1">
                      {dropOff !== null && dropOff > 0 && (
                        <div className="pl-4 flex items-center gap-1 text-[9px] text-rose-400 font-bold">
                          <span className="h-2 w-px bg-slate-200 dark:bg-slate-900" />
                          <span>↓ {dropOff}% drop-off rate</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs gap-3">
                        <span className="font-semibold text-slate-400 w-24 truncate">{item.stage}</span>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-900 rounded-lg h-6.5 overflow-hidden relative flex items-center">
                          <div 
                            className="bg-indigo-600/40 border-r-2 border-indigo-500 h-full rounded transition-all duration-1000" 
                            style={{ width: `${percent}%` }}
                          />
                          <span className="absolute left-2 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                            {item.count} leads
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-450 font-bold w-8 text-right">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Bento Grid - AI insights Banner (lg:col-span-12) */}
      <div className="bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-transparent border border-purple-800/25 p-5 rounded-2xl shadow-premium relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
            AI Sales Insights Panel <Zap className="h-3 w-3" />
          </h4>
          <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-350">
            <p className="flex items-start gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>Conversion rates increased <strong className="text-white">+8.2%</strong> after follow-up automated workflows were enabled last week.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>Enterprise sector leads are closing <strong className="text-white">2.4x faster</strong> than SMB sector accounts this quarter.</span>
            </p>
          </div>
        </div>
      </div>

      {/* 5. Bento Grid - Tables & Leaderboards (lg:col-span-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Panel 5: Channel Attribution Table (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base tracking-tight">Channel Attribution Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Leads volume, conversion rates, and budget efficiency by acquisition source</p>
          </div>
          
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-450 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="pb-3">Source Channel</th>
                  <th className="pb-3 text-center">Leads</th>
                  <th className="pb-3 text-center">Conv. Rate</th>
                  <th className="pb-3 text-center">CPL</th>
                  <th className="pb-3 text-right">Revenue Cont.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/40">
                {channelPerformance.map((src) => (
                  <tr key={src.channel} className="text-slate-300 hover:bg-slate-500/5 transition-colors">
                    <td className="py-3.5 font-bold text-slate-200">{src.channel}</td>
                    <td className="py-3.5 text-center font-medium text-slate-400">{src.leads}</td>
                    <td className="py-3.5 text-center font-bold text-indigo-400">{src.convRate}%</td>
                    <td className="py-3.5 text-center font-medium text-slate-400">
                      {src.cpl > 0 ? `₹${src.cpl}` : <span className="text-emerald-500 font-bold">Organic</span>}
                    </td>
                    <td className="py-3.5 text-right font-black text-emerald-500">₹{src.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bento Panel 6: Team Rankings or Executive Metrics (lg:col-span-6) */}
        {user?.role !== 'executive' ? (
          <div className="lg:col-span-6 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Team Performance Leaderboard</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sales executives ranked by won revenue amounts this month</p>
            </div>

            <div className="mt-5 space-y-3.5 flex-1 flex flex-col justify-center">
              {topReps.map((rep, idx) => (
                <div key={rep.id} className="flex items-center justify-between gap-4 text-xs bg-slate-50/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900/50 p-2.5 rounded-xl hover:border-slate-800 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="font-black text-slate-450 w-5 shrink-0 flex items-center justify-center">
                      {idx === 0 ? <span className="text-lg">🥇</span> : idx === 1 ? <span className="text-lg">🥈</span> : idx === 2 ? <span className="text-lg">🥉</span> : `#${idx + 1}`}
                    </div>
                    
                    {/* User initials Avatar bubble */}
                    <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {rep.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-200 truncate">{rep.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{rep.totalLeads} opportunities assigned</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-emerald-500">₹{rep.wonRevenue.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">{rep.conversionRate.toFixed(0)}% conversion rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Executive personal targets dashboard area */
          <div className="lg:col-span-6 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Your Direct Target Goals</h3>
              <p className="text-xs text-slate-400 mt-0.5">Personal metrics and deal velocity targets tracker</p>
            </div>

            <div className="mt-5 space-y-6 flex-1 flex flex-col justify-center">
              <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900/60 p-4.5 rounded-xl space-y-2.5">
                <div className="flex justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  <span>Sales Volume Target</span>
                  <span>60% Met</span>
                </div>
                <p className="text-xl font-extrabold text-foreground tracking-tight">₹15,00,050 / ₹25,00,000</p>
                <div className="w-full bg-slate-150 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900/60 p-4.5 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider">Outreach Velocity</span>
                  <p className="text-lg font-black text-foreground mt-1.5">74% Converted</p>
                  <p className="text-[9px] text-slate-500 leading-relaxed mt-1 font-medium">You are 12% ahead of last weeks schedule outreach rates.</p>
                </div>
                
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900/60 p-4.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Achievements</span>
                    <p className="text-base font-extrabold text-foreground mt-1">2 Badges Won</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-base">🚀</span>
                    <span className="text-base">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 6. Bento Grid - Tasks Checklist & Activity Timeline (lg:col-span-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upcoming Tasks checklist (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Assigned Tasks ({recentTasks.length})</h3>
              <p className="text-xs text-slate-400 mt-0.5">Critical deal milestones requiring followups today</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/tasks')}
              className="text-[10px] bg-transparent border-slate-200 dark:border-slate-950 font-bold"
            >
              View Board
            </Button>
          </div>

          <div className="flex-1">
            {recentTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No active tasks assigned to you. Enjoy the clear desk!
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentTasks.map((task) => (
                  <div key={task._id} className="flex items-start justify-between gap-4 bg-slate-50/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900/40 p-3 rounded-xl hover:border-slate-800 transition-all group">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => completeTask(task._id)}
                        className="mt-0.5 h-4.5 w-4.5 rounded-full border border-slate-400 dark:border-slate-800 hover:bg-emerald-500/10 hover:border-emerald-500 text-transparent hover:text-emerald-500 flex items-center justify-center shrink-0 cursor-pointer transition-all"
                        title="Mark Complete"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </button>
                      <div>
                        <p className="font-bold text-slate-200 leading-tight group-hover:text-white transition-colors">{task.title}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5 font-medium leading-relaxed">{task.description}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            task.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : task.priority === 'Medium' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Activity Timeline (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-premium hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-extrabold text-base tracking-tight">Recent Nexus CRM Activity Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological flow of team pipeline actions across Indian networks</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No recent deal activities logged in this pipeline
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-900 ml-3 space-y-4 py-2">
                {activities.map((activity) => (
                  <div key={activity._id} className="relative flex gap-3.5 text-xs">
                    {/* Circle icon marker absolutely placed relative to timeline line */}
                    <div className={`absolute -left-[27px] mt-0.5 h-5.5 w-5.5 rounded-full border flex items-center justify-center z-10 shadow-sm shrink-0 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-250 leading-relaxed">
                        {activity.content}
                      </p>
                      <p className="text-[10px] text-slate-450 leading-normal mt-0.5 font-medium">
                        By {activity.performedBy?.name || 'Rep'} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
