import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, X, Shield, Users, Award, Lock, Sparkles } from 'lucide-react';

// --- Particle Orb Canvas Component ---
const ParticleOrb: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Handle high DPI displays
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      width = canvas.width;
      height = canvas.height;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Particle structure
    interface Particle {
      x: number;
      y: number;
      z: number;
      color: string;
      size: number;
    }

    const particles: Particle[] = [];
    const particleCount = 260;
    const sphereRadius = 145;

    // Generate particles on a sphere using Fibonacci lattice
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      particles.push({
        x: sphereRadius * Math.sin(phi) * Math.cos(theta),
        y: sphereRadius * Math.sin(phi) * Math.sin(theta),
        z: sphereRadius * Math.cos(phi),
        color: i % 3 === 0 
          ? 'rgba(196, 181, 253, ' // light purple
          : i % 3 === 1 
            ? 'rgba(147, 197, 253, ' // light blue
            : 'rgba(255, 255, 255, ', // white
        size: Math.random() * 1.6 + 0.8,
      });
    }

    // Default slow rotation angles
    let angleX = 0.0015;
    let angleY = 0.0025;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Speed up or adjust rotation based on mouse coordinates relative to center
      angleY = x * 0.00003;
      angleX = y * 0.00003;
    };

    const handleMouseLeave = () => {
      angleX = 0.0015;
      angleY = 0.0025;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const perspective = 300;
    const renderWidth = width / window.devicePixelRatio;
    const renderHeight = height / window.devicePixelRatio;
    const centerX = renderWidth / 2;
    const centerY = renderHeight / 2;

    const render = () => {
      ctx.clearRect(0, 0, renderWidth, renderHeight);

      // Core glow gradient
      const glow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, sphereRadius * 0.7);
      glow.addColorStop(0, 'rgba(124, 58, 237, 0.28)'); // deep purple core
      glow.addColorStop(0.35, 'rgba(59, 130, 246, 0.12)'); // soft blue halo
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Math for 3D rotations
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Depth sort particles using painter's algorithm
      const sorted = particles.map(p => {
        // Rotate around Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate around X axis
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Store back rotated coordinates
        p.x = x1;
        p.y = y2;
        p.z = z2;

        return { p, z: z2 };
      }).sort((a, b) => b.z - a.z);

      sorted.forEach(({ p, z }) => {
        const scale = perspective / (perspective + z);
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        // Fade out particles that are in the background
        const alpha = Math.min(Math.max((perspective - z) / (perspective * 1.4), 0.15), 0.9);
        const size = p.size * scale;

        ctx.fillStyle = `${p.color}${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();

        // Twinkle effects for closer particles
        if (z < -80 && Math.random() < 0.03) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.fillRect(px - size * 2.5, py, size * 5, 0.4);
          ctx.fillRect(px, py - size * 2.5, 0.4, size * 5);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative w-full h-[320px] md:h-[450px] lg:h-[500px] flex items-center justify-center overflow-visible">
      {/* Background glow rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing max-w-[420px] max-h-[420px] md:max-w-full md:max-h-full"
      />
    </div>
  );
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Landing states
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Ensure body scroll resets when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      setIsModalOpen(false);
      navigate('/hub');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-[#080313] text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[130px] border-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[130px] border-0 pointer-events-none" />
      
      {/* 1. Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full border border-blue-500/80 flex items-center justify-center bg-blue-950/20">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide">Nexus CRM</span>
        </div>

        {/* Action Button */}
        <div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-white border border-slate-800 hover:border-slate-600 bg-slate-950/40 px-5 py-2.5 rounded-lg transition-all hover:bg-slate-900/60 shadow-lg cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* 2. Main Hero Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 flex-1 flex flex-col justify-center py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 font-bold">Nexus CRM</span> <br />
              <span className="text-2xl sm:text-3xl font-light text-slate-350 tracking-tight block mt-2">Where relationships become growth.</span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              Discover cutting-edge breakthroughs in customer relations, track leads, and manage deals all in one enterprise-grade platform.
            </p>

            <div className="flex flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white hover:bg-slate-100 text-slate-950 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
              >
                Get started
              </button>
            </div>
          </div>

          {/* Right Particle Orb Column */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <ParticleOrb />
          </div>

        </div>
      </main>

      {/* Footer Branding Notes */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Nexus CRM. Where relationships become growth.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-350 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a>
        </div>
      </footer>

      {/* 3. Credentials & Log-In Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-2xl shadow-2xl p-8 overflow-hidden z-10 animate-scale-up">
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-900/60 p-1.5 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="mx-auto h-11 w-11 rounded-full border border-blue-500/80 flex items-center justify-center bg-blue-950/20 mb-3 shadow-md shadow-blue-500/5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
                Sign In to Nexus CRM <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your work credentials to open pipeline dashboards
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-350 rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Work Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-600 focus:ring-purple-500 focus:border-purple-500"
                required
              />
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-350">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-slate-900/40 border rounded-md border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 py-2.5 font-semibold text-sm"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-4">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                onClick={() => setIsModalOpen(false)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Register here
              </Link>
            </p>

            {/* Quick Access Credentials Portals */}
            <div className="mt-6 pt-5 border-t border-slate-900/80 space-y-3">
              <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-widest text-center">
                Reviewer Quick Access Portals
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePreFill('admin@enterprise.com', 'admin123')}
                  className="py-1.5 px-1 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/40 rounded-lg text-center cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <Shield className="h-3.5 w-3.5 text-indigo-400" />
                  <p className="text-[10px] font-bold text-slate-200">Admin</p>
                  <span className="text-[8px] text-slate-500">Sarah J.</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFill('manager1@enterprise.com', 'manager123')}
                  className="py-1.5 px-1 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/40 rounded-lg text-center cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-[10px] font-bold text-slate-200">Manager</p>
                  <span className="text-[8px] text-slate-500">East Coast</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFill('exec1@enterprise.com', 'exec123')}
                  className="py-1.5 px-1 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/40 rounded-lg text-center cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <Award className="h-3.5 w-3.5 text-amber-450" />
                  <p className="text-[10px] font-bold text-slate-200">Executive</p>
                  <span className="text-[8px] text-slate-500">Rep Account</span>
                </button>
              </div>
              
              <div className="bg-slate-900/20 border border-slate-900/60 p-2 rounded-lg text-center flex items-center justify-center gap-1">
                <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                <p className="text-[8px] text-slate-450">
                  Auto-fills credentials. Passwords are <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded font-mono">admin123</code> / <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded font-mono">manager123</code>
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
