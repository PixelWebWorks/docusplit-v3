import React, { useState, useEffect } from 'react';
import { Module, Settings } from './types';
import Navigation from './components/Navigation';
import UnifiedModule from './components/UnifiedModule';
import SearchModule from './components/SearchModule';
import { Layout, Loader2, Info, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';

const AppContent: React.FC = () => {
  const { user, loading, logout, branchId } = useAuth();
  const [currentModule, setCurrentModule] = useState<Module>(Module.UNIFIED);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
  
  // Settings
  const [settings] = useState<Settings>({});

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const envKey = process.env.API_KEY;
        if (envKey && envKey.length > 5) {
          setIsKeySelected(true);
          return;
        }
      } catch (e) {
        console.warn("App: API_KEY not detected in process.env");
      }

      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
        setIsKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  const handleReset = () => {
    window.location.href = window.location.pathname + window.location.search;
  };

  if (loading || isKeySelected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b18]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 glass sticky top-0 z-50 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              BRADY <span className="text-blue-500">AUDIT</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold uppercase tracking-tighter border border-blue-500/20">v3 (Firebase)</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <User className="w-3 h-3" />
                {branchId}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Navigation 
            currentModule={currentModule} 
            setModule={setCurrentModule} 
            onReset={handleReset}
          />
          <button 
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {currentModule === Module.UNIFIED && <UnifiedModule settings={settings} />}
        {currentModule === Module.SEARCH && <SearchModule />}
      </main>

      <footer className="p-6 text-center text-slate-500 text-xs mt-auto border-t border-white/5 space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <Info className="w-4 h-4"/> 
           Secure Enterprise Cloud Mode Active
        </div>
        <div>&copy; {new Date().getFullYear()} Brady Audit Suite. Automated Logistics Logistics.</div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
