import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck, Scan } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid login credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT PANEL: Hero Image with Gradient Overlay ── */}
      <div
        className="hidden lg:flex lg:w-3/5 relative flex-col justify-between"
        style={{
          backgroundImage: 'url(/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      >
        {/* Multi-layer gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(10,10,18,0.82) 0%, rgba(20,10,10,0.55) 40%, rgba(10,10,18,0.20) 70%, rgba(0,0,0,0.10) 100%)',
          }}
        />

        {/* Bottom fade to connect with the right card edge */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, transparent 75%, rgba(248,250,252,1) 100%)',
          }}
        />

        {/* Top-left brand + tagline */}
        <div className="relative z-10 flex flex-col items-start justify-start h-full px-10 pt-10">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'rgba(220,38,38,0.92)' }}
            >
              <Scan className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <span
              className="text-3xl font-black tracking-widest"
              style={{
                color: '#fff',
                textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                letterSpacing: '0.14em',
              }}
            >
              <span style={{ color: '#ef4444' }}>TRUE</span>INSPECT
            </span>
          </div>

          {/* Tagline */}
          <p
            className="text-lg font-semibold"
            style={{
              color: 'rgba(255,255,255,0.75)',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              letterSpacing: '0.03em',
            }}
          >
            Smart Car Inspection
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 px-6 py-12 relative">

        {/* Subtle radial glow behind the card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 60% 40%, rgba(239,68,68,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="w-full max-w-md relative z-10">

          {/* Mobile-only branding (hidden on lg+) */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-md mb-3">
              <Scan className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <span className="text-2xl font-black tracking-widest text-slate-900">
              <span className="text-red-600">TRUE</span>INSPECT
            </span>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden"
            style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(239,68,68,0.08)' }}
          >
            {/* Card header stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

            <div className="px-8 py-8">

              {/* Heading */}
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-red-600">
                    Secure Access
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sign In to Your Account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your inspector or manager credentials
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      id="login-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="inspector@trueinspect.local"
                      className="input-field pl-10 text-sm"
                      style={{ transition: 'box-shadow 0.2s' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-10 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    id="login-submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 text-sm font-semibold rounded-xl"
                    style={{
                      background: loading
                        ? '#fca5a5'
                        : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      boxShadow: loading
                        ? 'none'
                        : '0 4px 14px -2px rgba(220,38,38,0.45)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Authenticating...
                      </span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  New to TRUEINSPECT?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Create New Account
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-400 mt-5">
            TRUEINSPECT · Independent Vehicle Inspection Platform · Academic Project
          </p>
        </div>
      </div>
    </div>
  );
};
