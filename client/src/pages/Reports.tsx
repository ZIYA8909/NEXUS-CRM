import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  Download, Calendar, TrendingUp, BarChart2, Briefcase, Award, ShieldAlert 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [funnelData, trendData, teamData] = await Promise.all([
        api.get<any[]>('/api/reports/conversion-funnel'),
        api.get<any[]>('/api/reports/revenue-trend'),
        api.get<any[]>('/api/reports/team-performance')
      ]);
      setFunnel(funnelData || []);
      setTrend(trendData || []);
      setTeamStats(teamData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'executive') {
      fetchReportsData();
    }
  }, [user]);

  const handleExport = async (type: 'leads' | 'customers' | 'performance') => {
    setExportLoading(type);
    try {
      // The API helper handles the header check for text/csv and auto-triggers file download
      await api.get(`/api/reports/export/${type}`);
    } catch (err) {
      console.error(err);
      alert('Report download failed');
    } finally {
      setExportLoading(null);
    }
  };

  if (user?.role === 'executive') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs">
        <Card className="max-w-md p-6 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold">Access Restrained</h3>
          <p className="text-muted-foreground leading-relaxed">
            Only Sales Managers and Administrators have credentials to run global corporate analytical audits and reports.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Business Intelligence</h2>
          <p className="text-sm text-muted-foreground font-medium">Export raw spreadsheets, evaluate conversion ratios, and track revenue goals</p>
        </div>
      </div>

      {/* Exporter triggers grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-indigo-500" /> Leads Pipeline Audits
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Downloads a comma-separated spreadsheet detailing all active sales pipeline entries, contact details, deal stages, and estimated deal valuation.
            </p>
          </div>
          <div className="pt-4 border-t border-border mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              loading={exportLoading === 'leads'}
              onClick={() => handleExport('leads')}
            >
              <Download className="h-3.5 w-3.5" /> Export Leads CSV
            </Button>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-500" /> Customer Account Portfolios
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Export data for all won customer profiles, company billing locations, billing addresses, conversion dates, and total accumulated revenue.
            </p>
          </div>
          <div className="pt-4 border-t border-border mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              loading={exportLoading === 'customers'}
              onClick={() => handleExport('customers')}
            >
              <Download className="h-3.5 w-3.5" /> Export Customers CSV
            </Button>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-amber-500" /> Team Performance League
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Run audits on your sales representatives, checking assignment volumes, conversion ratios, and total sales revenue won.
            </p>
          </div>
          <div className="pt-4 border-t border-border mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              loading={exportLoading === 'performance'}
              onClick={() => handleExport('performance')}
            >
              <Download className="h-3.5 w-3.5" /> Export Reps Stats CSV
            </Button>
          </div>
        </Card>

      </div>

      {/* Analytical charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deal Conversion Rates */}
        <Card>
          <CardHeader>
            <div>
              <h3 className="font-bold text-sm">Conversion Pipeline Metrics</h3>
              <p className="text-[11px] text-muted-foreground">Cumulative deals count groupings by stage</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="stage" tickLine={false} style={{ fontSize: '9px', fill: 'currentColor' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'currentColor' }} />
                  <Tooltip formatter={(value) => [`${value} Leads`, 'Volume']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Projection Line */}
        <Card>
          <CardHeader>
            <div>
              <h3 className="font-bold text-sm">Historical Growth Track</h3>
              <p className="text-[11px] text-muted-foreground">Won contracts revenue trend analysis</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="month" tickLine={false} style={{ fontSize: '10px', fill: 'currentColor' }} />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    style={{ fontSize: '10px', fill: 'currentColor' }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Closed Won Value']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Team Performance Table summary */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="font-bold text-sm">Team Representatives Performance</h3>
            <p className="text-[11px] text-muted-foreground">Comparison matrix of leads volume, conversion rates, and revenue contributions</p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground font-semibold">
                <th className="p-4">Representative Name</th>
                <th className="p-4">Business Email</th>
                <th className="p-4">Leads Assigned</th>
                <th className="p-4">Deals Won</th>
                <th className="p-4">Deals Lost</th>
                <th className="p-4">Conversion Rate</th>
                <th className="p-4 text-right">Revenue Contributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamStats.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-foreground flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[9px]">
                      {rep.name.charAt(0)}
                    </div>
                    <span>{rep.name}</span>
                  </td>
                  <td className="p-4 text-slate-450">{rep.email}</td>
                  <td className="p-4 font-bold">{rep.totalLeads}</td>
                  <td className="p-4 text-emerald-500 font-bold">{rep.wonDeals}</td>
                  <td className="p-4 text-rose-500 font-bold">{rep.lostDeals}</td>
                  <td className="p-4 font-bold">{rep.conversionRate.toFixed(1)}%</td>
                  <td className="p-4 text-right font-extrabold text-emerald-500">₹{rep.wonRevenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
};
