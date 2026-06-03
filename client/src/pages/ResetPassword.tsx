import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      setError('Invalid reset link: Missing verification token');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Verification token is missing. Please request a new link.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Token might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080313] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] border-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] border-0 pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border border-blue-500/80 flex items-center justify-center bg-blue-950/20 mb-3 shadow-md shadow-blue-500/5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Secure your credentials profile
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg space-y-2 text-sm text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-1 animate-bounce" />
              <p className="font-semibold">Password Reset Successful!</p>
              <p className="text-[11px] text-slate-300">
                Your credentials are updated. Redirecting to login portal...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="New Secure Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 py-2.5 font-semibold text-sm"
                loading={loading}
              >
                Save New Password
              </Button>
            </form>
          )}

          <div className="text-center text-xs">
            <Link to="/login" className="text-slate-400 hover:text-slate-350 font-semibold">
              Return to login portal
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
