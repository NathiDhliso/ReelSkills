import React, { useEffect, useState } from 'react'
import { useAuthStore, initializeSupabase } from './lib/auth'
import { AppWrapper } from './components/ui/AppWrapper'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import ReelSkillsDashboard from './components/ReelSkillsDashboard'
import './index.css'

function App() {
  const {
    initialize,
    isLoading,
    isInitializing,
    isAuthenticated,
    user,
    profile,
    login,
    signup,
    sendPasswordResetEmail,
    error,
  } = useAuthStore();
  const [localInitializing, setLocalInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Missing Supabase configuration. Please check your environment variables.');
        }
        
        initializeSupabase(supabaseUrl, supabaseAnonKey);
        await initialize();
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize application');
      } finally {
        setLocalInitializing(false);
      }
    };
    init();
  }, [initialize]);

  if (localInitializing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading ReelSkills...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="max-w-md w-full p-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Initialization Failed</h2>
            <p className="text-red-300 mb-6">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppWrapper
          isAuthenticated={isAuthenticated}
          isInitializing={isInitializing ?? false}
          user={user}
          error={error ?? null}
          onLogin={login}
          onSignup={signup}
          onPasswordReset={sendPasswordResetEmail}
          isLoading={isLoading ?? false}
        >
          {profile?.role === 'recruiter' ? (
            <div className="min-h-screen flex items-center justify-center" style={{ 
              background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
              backgroundAttachment: 'fixed'
            }}>
              <div className="text-center max-w-md mx-auto p-6">
                <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">Access Restricted</h2>
                  <p className="text-slate-400">
                    ReelSkills is designed for candidates to showcase their skills. 
                    Recruiters can view candidate profiles through the main ReelApps platform.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ReelSkillsDashboard />
          )}
        </AppWrapper>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App