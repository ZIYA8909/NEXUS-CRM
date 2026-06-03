import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  LayoutDashboard, Users, CheckSquare, LineChart, Settings, UserCheck, 
  Briefcase, Sparkles, ChevronRight, Zap, Trophy, Bell, Clock, ShieldCheck
} from 'lucide-react';

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

export const Hub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(300); // Default fallback

  const fetchHubData = async () => {
    try {
      setLoading(true);
      // Fetch KPI metrics
      const kpisData = await api.get<DashboardKPIs>('/api/reports/dashboard-stats');
      setKpis(kpisData);

      // Fetch pending tasks to show accurate count
      const tasksData = await api.get<any[]>('/api/tasks', { status: 'Pending' });
      setPendingTasksCount(tasksData.length);

      // Fetch customer count
      const customersData = await api.get<any[]>('/api/customers');
      setCustomersCount(customersData.length || 300);
    } catch (e) {
      console.error('Failed to load hub stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, [user]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const navDecks = [
    {
      name: 'Sales Dashboard',
      description: 'Analytics, revenue trends, and forecast bento control',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'executive'],
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      badge: kpis ? `₹${Number(kpis.revenue.value).toLocaleString()}` : '₹14,85,000',
      subtext: kpis ? `${kpis.revenue.change} Wins MoM` : '+12.4% trend'
    },
    {
      name: 'Leads Pipeline',
      description: 'Kanban board and details table of outreach deals',
      path: '/leads',
      icon: Briefcase,
      roles: ['admin', 'manager', 'executive'],
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      badge: kpis ? `${kpis.activeDeals.value} Active` : '24 Qualified',
      subtext: 'Kanban pipeline deals'
    },
    {
      name: 'Customers Database',
      description: 'Corporate client profiles and log activity histories',
      path: '/customers',
      icon: Users,
      roles: ['admin', 'manager', 'executive'],
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      badge: `${customersCount} Accounts`,
      subtext: 'Managed accounts'
    },
    {
      name: 'Tasks Board',
      description: 'Critical deal followups, priorities, and action lists',
      path: '/tasks',
      icon: CheckSquare,
      roles: ['admin', 'manager', 'executive'],
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      badge: `${pendingTasksCount} Action Items`,
      subtext: 'Due follow-ups today'
    },
    {
      name: 'Reports & Analytics',
      description: 'Acquisition channel tables, win ratios, and exports',
      path: '/reports',
      icon: LineChart,
      roles: ['admin', 'manager'],
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      badge: kpis ? `${kpis.conversionRate.value} Win Rate` : '24.8% Conv.',
      subtext: 'Funnel attribution reports'
    },
    {
      name: 'Team Members',
      description: 'Ranks, status controls, and assigned sales representatives',
      path: '/team',
      icon: UserCheck,
      roles: ['admin'],
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      badge: 'Manage Reps',
      subtext: 'Team structure allocation'
    },
    {
      name: 'Settings & Security',
      description: 'Profile configurations, theme, and dashboard presets',
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'manager', 'executive'],
      color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
      badge: 'Config',
      subtext: 'Theme & Profile specs'
    }
  ];

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100 pb-12 select-none">
      
      {/* 1. Hub Welcome Banner */}
      <div className="bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900/60 backdrop-blur-md rounded-2xl p-8 shadow-premium relative overflow-hidden transition-all">
        {/* Glow ambient light */}
        <div className="absolute top-0 right-0 w-[450px] h-[300px] rounded-full bg-gradient-to-l from-indigo-500/5 to-purple-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Control Dashboard Hub
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white mt-1">
            {getGreeting()}, {user?.name.split(' ')[0] || 'Aarav'}.
          </h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            Welcome to the Nexus CRM workspace portal. Select an active navigation deck card below to review deal charts, log follow-up calls, promotions pipelines, or team allocations.
          </p>
        </div>
      </div>

      {/* 2. Grid Deck of Flashcards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {navDecks
          .filter(deck => deck.roles.includes(user?.role || ''))
          .map((deck) => (
            <div 
              key={deck.name}
              onClick={() => navigate(deck.path)}
              className="bg-white/80 dark:bg-[#0c0721]/30 border border-slate-200 dark:border-slate-900 shadow-premium p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer relative group overflow-hidden"
            >
              {/* Card Ambient Hover Light */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 blur-xl transition-all duration-500 pointer-events-none" />
              
              <div className="space-y-4">
                {/* Header Icon & Title */}
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${deck.color}`}>
                    <deck.icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-1.5 transition-all" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-white leading-snug group-hover:text-indigo-400 transition-colors">
                    {deck.name}
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 font-medium leading-relaxed">
                    {deck.description}
                  </p>
                </div>
              </div>

              {/* Real-time Badge Summary Section */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-900/60 flex items-center justify-between text-xs">
                {loading ? (
                  <>
                    <Skeleton className="h-4.5 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </>
                ) : (
                  <>
                    <span className="font-extrabold text-indigo-500 dark:text-indigo-400">
                      {deck.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold uppercase tracking-wider">
                      {deck.subtext}
                    </span>
                  </>
                )}
              </div>

            </div>
          ))}
      </div>

    </div>
  );
};
