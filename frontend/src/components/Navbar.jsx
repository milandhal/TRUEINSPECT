import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Car, 
  PlusCircle, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo - TRUEINSPECT only, NO subtitle */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded bg-red-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Car className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                TRUEINSPECT
              </span>
            </Link>

            {/* Main Navigation Links */}
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'text-red-700 bg-red-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link
                  to="/inspection/new"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/inspection/new')
                      ? 'text-red-700 bg-red-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Inspection
                </Link>

                <Link
                  to="/settings"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/settings')
                      ? 'text-red-700 bg-red-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Cost Master Settings
                </Link>
              </nav>
            )}
          </div>

          {/* User Profile & Actions */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.full_name}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  user.role === 'MANAGER' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-slate-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
