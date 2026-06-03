import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { 
  User, Lock, Bell, Moon, Sun, CheckCircle2, AlertCircle 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateProfile, theme, toggleTheme } = useAuth();
  
  // Profile settings
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emailPref, setEmailPref] = useState(user?.notificationPreferences?.email ?? true);
  const [pushPref, setPushPref] = useState(user?.notificationPreferences?.push ?? true);
  const [smsPref, setSmsPref] = useState(user?.notificationPreferences?.sms ?? false);
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Security settings
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      await updateProfile({
        name,
        phone,
        notificationPreferences: {
          email: emailPref,
          push: pushPref,
          sms: smsPref
        }
      });
      setProfileSuccess('Profile preferences updated successfully.');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update settings');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccess('');
    setSecurityError('');

    if (!password) {
      setSecurityError('Please write a new password');
      return;
    }
    if (password.length < 6) {
      setSecurityError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setSecurityError('Passwords do not match');
      return;
    }

    setSecurityLoading(true);
    try {
      await updateProfile({ password });
      setSecuritySuccess('Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to change password');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personal Profile Settings</h2>
        <p className="text-sm text-muted-foreground font-medium">Update account properties, credentials, and notification channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Navigation Sidebar indicators */}
        <Card className="p-4 space-y-2 shrink-0">
          <div className="p-3 bg-primary/10 text-primary font-bold rounded-lg flex items-center gap-2.5">
            <User className="h-4.5 w-4.5" /> General Configuration
          </div>
          <div className="p-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg flex items-center gap-2.5 cursor-pointer" onClick={() => document.getElementById('security-card')?.scrollIntoView({ behavior: 'smooth' })}>
            <Lock className="h-4.5 w-4.5" /> Security & Passwords
          </div>
          <div className="p-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg flex items-center gap-2.5 cursor-pointer" onClick={() => document.getElementById('theme-card')?.scrollIntoView({ behavior: 'smooth' })}>
            <Moon className="h-4.5 w-4.5" /> Theme Preferences
          </div>
        </Card>

        {/* Content Panel */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile settings Form */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-sm">General Profile Settings</h3>
            </CardHeader>
            <CardContent>
              {profileSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-500 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-500 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Corporate Email (Restricted)"
                    value={user?.email || ''}
                    disabled
                    helperText="Corporate email address cannot be changed."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Direct Phone Line"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">Enterprise Role</span>
                    <span className="p-2 border border-border bg-slate-50 dark:bg-slate-900 rounded-md text-muted-foreground capitalize font-bold">{user?.role}</span>
                  </div>
                </div>

                {/* Notifications preferences checkboxes */}
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="font-bold text-xs flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-400" /> Notification Alert Preferences
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-normal mb-2">Configure when Aura sends system alerts</p>
                  
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPref}
                        onChange={(e) => setEmailPref(e.target.checked)}
                      />
                      <div>
                        <span className="font-bold block">Outreach Email Digests</span>
                        <span className="text-[10px] text-slate-400">Receive reports and deal assignment alerts via email.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushPref}
                        onChange={(e) => setPushPref(e.target.checked)}
                      />
                      <div>
                        <span className="font-bold block">Desktop Banner Notifications</span>
                        <span className="text-[10px] text-slate-400">Permit browser push notifications for tasks and lead assignments.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsPref}
                        onChange={(e) => setSmsPref(e.target.checked)}
                      />
                      <div>
                        <span className="font-bold block">Mobile SMS Reminders (Alpha)</span>
                        <span className="text-[10px] text-slate-400">Send mobile SMS updates when deals close.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit" variant="primary" loading={profileLoading}>
                    Save Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security details Form */}
          <Card id="security-card">
            <CardHeader>
              <h3 className="font-bold text-sm">Security & Credentials Update</h3>
            </CardHeader>
            <CardContent>
              {securitySuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-500 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {securitySuccess}
                </div>
              )}
              {securityError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-500 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {securityError}
                </div>
              )}

              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="New Account Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit" variant="primary" loading={securityLoading}>
                    Update Password credentials
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Theme card */}
          <Card id="theme-card">
            <CardHeader>
              <h3 className="font-bold text-sm">Theme Settings</h3>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <span className="font-bold block">Aura Workspace Skin</span>
                <span className="text-[11px] text-muted-foreground leading-normal">Configure the Nexus CRM theme styling.</span>
              </div>
              <Button variant="outline" onClick={toggleTheme} className="gap-2 font-bold select-none">
                {theme === 'light' ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" /> Light Mode skin
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-indigo-500" /> Dark Mode skin
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};
