import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CheckSquare, LineChart, Settings, LogOut, 
  Bell, Sun, Moon, Search, Menu, X, ShieldAlert, UserCheck, ChevronsUpDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await api.get<any>('/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Global spotlight hotkey keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle global search queries
  useEffect(() => {
    if (!isSpotlightOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await api.get<any[]>('/api/search', { q: searchQuery });
        setSearchResults(results || []);
        setSelectedIndex(0);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isSpotlightOpen]);

  const markNotificationRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'executive'] },
    { name: 'Leads Pipeline', path: '/leads', icon: BriefcaseIcon, roles: ['admin', 'manager', 'executive'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'executive'] },
    { name: 'Tasks Board', path: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'executive'] },
    { name: 'Reports & Analytics', path: '/reports', icon: LineChart, roles: ['admin', 'manager'] },
    { name: 'Team Members', path: '/team', icon: UserCheck, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'executive'] },
  ];

  const getQuickActions = () => {
    const list = [
      { type: 'action', action: 'theme', title: 'Toggle Light / Dark Theme', subtitle: 'Toggle between dark and light appearance modes', icon: theme === 'light' ? Moon : Sun },
      { type: 'nav', path: '/hub', title: 'Go to Central Workspace Hub', subtitle: 'Main deck navigation panel', icon: LayoutDashboard },
      { type: 'nav', path: '/dashboard', title: 'Open Sales Dashboard', subtitle: 'Analytics and revenue trends bento grid', icon: LineChart },
      { type: 'nav', path: '/leads', title: 'Open Leads Pipeline', subtitle: 'Outreach deal pipeline board', icon: BriefcaseIcon },
      { type: 'nav', path: '/customers', title: 'Open Customers Database', subtitle: 'Corporate accounts and history logs', icon: Users },
      { type: 'nav', path: '/tasks', title: 'Open Tasks Board', subtitle: 'Deal followups and priorities', icon: CheckSquare },
    ];

    if (user?.role === 'admin') {
      list.push({ type: 'nav', path: '/team', title: 'Open Team Management', subtitle: 'Manage reps and corporate roles', icon: UserCheck });
    } else if (user?.role === 'manager') {
      list.push({ type: 'nav', path: '/reports', title: 'Open Reports & Analytics', subtitle: 'Funnel win rates and exports', icon: LineChart });
    }

    list.push({ type: 'nav', path: '/settings', title: 'Open Settings', subtitle: 'Preference options and profile configurations', icon: Settings });
    return list;
  };

  const activeList = searchQuery.trim().length >= 2 ? searchResults : getQuickActions();

  const handleItemSelect = (item: any) => {
    setIsSpotlightOpen(false);
    setSearchQuery('');
    
    if (item.type === 'action') {
      if (item.action === 'theme') {
        toggleTheme();
      }
    } else if (item.type === 'nav') {
      navigate(item.path);
    } else {
      if (item.type === 'lead') {
        navigate(`/leads?id=${item.id}`);
      } else if (item.type === 'customer') {
        navigate(`/customers?id=${item.id}`);
      } else if (item.type === 'task') {
        navigate('/tasks');
      } else if (item.type === 'user') {
        navigate('/team');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % activeList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + activeList.length) % activeList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeList[selectedIndex]) {
        handleItemSelect(activeList[selectedIndex]);
      }
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Sales Dashboard';
      case '/leads': return 'Leads Pipeline';
      case '/customers': return 'Customers Database';
      case '/tasks': return 'Tasks Board';
      case '/reports': return 'Reports & Analytics';
      case '/team': return 'Team Members';
      case '/settings': return 'Settings & Profiles';
      default: return 'Nexus CRM';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
      
      {/* Top Header Navbar */}
      <header className="h-16 border-b border-border bg-white dark:bg-[#0c0721]/30 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        
        {/* Left Actions */}
        <div className="flex items-center gap-4 flex-1">
          {location.pathname !== '/hub' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-[11px] font-bold text-slate-750 dark:text-slate-305 bg-slate-50 dark:bg-slate-900/40 transition-all shadow-sm cursor-pointer animate-fade-in"
              >
                ← Back to Hub
              </button>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <span className="text-xs font-bold text-foreground">{getPageTitle()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border border-blue-500/80 flex items-center justify-center bg-blue-950/20">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <span className="font-extrabold text-sm text-foreground tracking-wide">Nexus CRM Workspace</span>
            </div>
          )}            {/* Global Search Trigger */}
            <div className="relative w-full max-w-sm hidden md:block">
              <button
                onClick={() => setIsSpotlightOpen(true)}
                className="w-full flex items-center justify-between pl-3 pr-2 py-1.5 text-xs text-slate-400 hover:text-slate-500 bg-slate-100 dark:bg-slate-900/40 border border-transparent dark:border-slate-900 rounded-lg transition-all hover:bg-slate-200/50 dark:hover:bg-slate-900/80 cursor-pointer text-left font-sans select-none"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>Search leads, tasks, team...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[9px] font-sans font-extrabold text-slate-500 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                      <span className="font-semibold text-sm">Notifications ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif._id}
                            className={`p-4 border-b border-border flex items-start justify-between gap-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-850 ${
                              !notif.isRead ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-semibold mb-0.5">{notif.title}</p>
                              <p className="text-slate-400 text-[11px] leading-relaxed mb-1">{notif.message}</p>
                              <span className="text-[9px] text-slate-400">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!notif.isRead && (
                              <button 
                                onClick={(e) => markNotificationRead(notif._id, e)}
                                className="h-5 w-5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0"
                                title="Mark as read"
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown Indicator */}
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 flex items-center justify-center font-bold text-xs">
                {user?.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold leading-tight">{user?.name.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Direct Sign Out Button */}
            <button
              onClick={logout}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-450 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </header>

      {/* Content Body */}
      <main className="flex-1 p-4 lg:p-8 bg-slate-50/50 dark:bg-slate-950/20 overflow-y-auto">
        {children}
      </main>

      {/* 3. Command Menu Spotlight Search Modal */}
      {isSpotlightOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={() => setIsSpotlightOpen(false)} />
          
          <div 
            className="relative w-full max-w-xl bg-white dark:bg-[#0b061e] border border-slate-200 dark:border-slate-800/85 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[70vh] animate-scale-up"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-slate-50/50 dark:bg-slate-900/10">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, customers, tasks, settings..."
                className="w-full text-sm bg-transparent outline-none border-none text-foreground placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              />
              {searchLoading ? (
                <svg className="animate-spin h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <button 
                  onClick={() => setIsSpotlightOpen(false)}
                  className="text-[10px] font-sans font-bold text-slate-450 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ESC
                </button>
              )}
            </div>

            {/* Results / Suggestions Scroll Box */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No records found matching "<span className="text-foreground font-semibold">{searchQuery}</span>"
                </div>
              ) : (
                <>
                  {/* Category Header */}
                  <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {searchQuery.trim().length >= 2 ? 'Search Results' : 'Suggestions & Quick Actions'}
                  </div>

                  {activeList.map((item, index) => {
                    const Icon = item.icon || (
                      item.type === 'lead' ? BriefcaseIcon :
                      item.type === 'customer' ? Users :
                      item.type === 'task' ? CheckSquare :
                      UserCheck
                    );
                    const isSelected = index === selectedIndex;

                    return (
                      <div
                        key={item.id || item.title || item.path}
                        onClick={() => handleItemSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-l-2 border-indigo-500 text-indigo-900 dark:text-indigo-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-850/40 text-slate-750 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md border ${
                            isSelected 
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-500' 
                              : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-400'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold leading-normal">{item.title}</p>
                            <p className={`text-[10px] leading-normal mt-0.5 ${
                              isSelected ? 'text-indigo-400/80 dark:text-indigo-355/80' : 'text-slate-400'
                            }`}>{item.subtitle}</p>
                          </div>
                        </div>

                        {/* Right tags / controls */}
                        <div className="flex items-center gap-2">
                          {item.type && item.type !== 'nav' && item.type !== 'action' && (
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                              item.type === 'lead' ? 'bg-sky-500/10 text-sky-500' :
                              item.type === 'customer' ? 'bg-emerald-500/10 text-emerald-500' :
                              item.type === 'task' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {item.type}
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] text-slate-400 dark:text-indigo-400/60 font-semibold">
                              Enter ↵
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer Hotkey Legend */}
            <div className="px-4 py-2 border-t border-border bg-slate-50/50 dark:bg-[#0c0721]/30 flex items-center justify-between text-[10px] text-slate-405">
              <div className="flex items-center gap-4">
                <span><kbd className="font-mono bg-slate-200 dark:bg-slate-800 border border-border px-1 py-0.5 rounded">↑↓</kbd> Navigate</span>
                <span><kbd className="font-mono bg-slate-200 dark:bg-slate-800 border border-border px-1 py-0.5 rounded">Enter</kbd> Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Close</span>
                <kbd className="font-mono bg-slate-200 dark:bg-slate-800 border border-border px-1 py-0.5 rounded">ESC</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable SVG Briefcase icon wrapper since Lucide Briefcase might sometimes need import variations
const BriefcaseIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
