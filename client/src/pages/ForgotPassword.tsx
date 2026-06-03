import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your work email address');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSuccess(res.message || 'Simulated reset link created!');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Reset link generation failed. Email not found.');
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
            Reset Nexus CRM Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Recover access to your enterprise dashboard account
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                <span className="font-semibold">Reset Link Generated!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-350">
                {success}
              </p>
              {resetToken && (
                <div className="pt-2 border-t border-emerald-500/20">
                  <p className="text-[10px] text-slate-450 mb-2">Simulated Email Inbox:</p>
                  <Link 
                    to={`/reset-password?token=${resetToken}`}
                    className="inline-block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors"
                  >
                    Click to Reset Password Link ➜
                  </Link>
                </div>
              )}
            </div>
          )}

          {!success && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Registered Work Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 py-2.5 font-semibold text-sm"
                loading={loading}
              >
                Send Recovery Instructions
              </Button>
            </form>
          )}

          <div className="text-center text-xs">
            <Link to="/login" className="text-slate-400 hover:text-slate-300 font-semibold">
              ← Return to login portal
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
