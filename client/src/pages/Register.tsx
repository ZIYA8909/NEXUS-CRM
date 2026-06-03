import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'executive'>('executive');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, role, phone });
      navigate('/hub');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different email.');
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
        
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border border-blue-500/80 flex items-center justify-center bg-blue-950/20 mb-3 shadow-md shadow-blue-500/5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Nexus CRM Register
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Join the corporate deal pipeline network
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Representative Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Jenkins"
              className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
            />
            
            <Input
              label="Corporate Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="s.jenkins@company.com"
              className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
            />

            <Input
              label="Password (min. 6 characters) *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Business Role"
                options={[
                  { value: 'executive', label: 'Sales Executive' },
                  { value: 'manager', label: 'Sales Manager' },
                  { value: 'admin', label: 'Admin Controller' }
                ]}
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-slate-900/40 border-slate-800 text-white"
              />

              <Input
                label="Direct Work Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 012-3456"
                className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-650"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 py-2.5 font-semibold text-sm"
              loading={loading}
            >
              Configure Profile Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already registered on this instance?{' '}
            <Link to="/login" className="text-indigo-450 hover:text-indigo-300 font-semibold">
              Sign in instead
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
