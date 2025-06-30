import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from './Button';
import { LogIn, UserPlus, Mail } from 'lucide-react';

interface AppWrapperProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: User | null;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
  isLoading: boolean;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({
  children,
  isAuthenticated,
  isInitializing,
  user,
  error,
  onLogin,
  onSignup,
  onPasswordReset,
  isLoading,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (authMode === 'login') {
        await onLogin(email, password);
      } else if (authMode === 'signup') {
        await onSignup(email, password, firstName, lastName);
      } else if (authMode === 'reset') {
        await onPasswordReset(email);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent mb-2">
                ReelSkills
              </h1>
              <p className="text-slate-400">
                {authMode === 'login' && 'Welcome back! Sign in to continue.'}
                {authMode === 'signup' && 'Create your account to get started.'}
                {authMode === 'reset' && 'Reset your password.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>

              {authMode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <>
                    {authMode === 'login' && <LogIn size={16} className="mr-2" />}
                    {authMode === 'signup' && <UserPlus size={16} className="mr-2" />}
                    {authMode === 'reset' && <Mail size={16} className="mr-2" />}
                  </>
                )}
                {authMode === 'login' && 'Sign In'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'reset' && 'Send Reset Email'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {authMode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                  <br />
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                    className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                  >
                    Forgot your password?
                  </button>
                </>
              )}
              {authMode === 'signup' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Already have an account? Sign in
                </button>
              )}
              {authMode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};