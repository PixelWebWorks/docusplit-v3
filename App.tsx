import React, { useState, useEffect } from 'react';
import { Module, Settings } from './types.ts';
import Navigation from './components/Navigation.tsx';
import SplitModule from './components/SplitModule.tsx';
import ReconcileModule from './components/ReconcileModule.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import { Layout, Lock, Key, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<Module>(Module.SPLIT);
  // Inicializamos basado en localStorage para evitar parpadeos
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(() => {
    return localStorage.getItem('brady_key_verified') === 'true' ? true : null;
  });
  
  const [settings, setSettings] = useState<Settings>({
    driveClientId: localStorage.getItem('driveClientId') || '',
    driveFolderId: localStorage.getItem('driveFolderId') || '',
  });

  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
        if (hasKey) {
          localStorage.setItem('brady_key_verified', 'true');
        }
      } else {
        // Si no estamos en el entorno de AI Studio (desarrollo local), permitimos el paso
        setIsKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // REGLA: Asumir éxito inmediatamente para evitar condiciones de carrera
      setIsKeySelected(true);
      localStorage.setItem('brady_key_verified', 'true');
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('driveClientId', newSettings.driveClientId);
    localStorage.setItem('driveFolderId', newSettings.driveFolderId);
  };

  // Estado de carga inicial silencioso
  if (isKeySelected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b18]">
        <Loader2 className="w-10 h-10 text-[#f84827] animate-spin" />
      </div>
    );
  }

  if (isKeySelected === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020b18]">
        <div className="max-w-md w-full glass p-10 rounded-3xl border border-white/10 text-center space-y-8 animate-in zoom-in duration-500">
          <div className="mx-auto w-20 h-20 bg-[#f84827]/10 rounded-full flex items-center justify-center border border-[#f84827]/20 shadow-[0_0_30px_rgba(248,72,39,0.2)]">
            <Lock className="w-10 h-10 text-[#f84827]" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">PAID TIER REQUIRED</h1>
            <p className="text-slate-400 text-sm">
              Para usar las funciones avanzadas con <span className="text-white font-medium">Gemini 3 Pro</span>, debes seleccionar tu propia API Key de pago.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-left text-xs text-slate-500 space-y-3">
            <p className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-[#f84827] mt-0.5 flex-shrink-0" />
              Acceso a modelos de alta precisión (Pro).
            </p>
            <p className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-[#f84827] mt-0.5 flex-shrink-0" />
              Procesamiento de documentos a escala empresarial.
            </p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="flex items-center gap-1 text-[#f84827] hover:underline font-bold mt-2"
            >
              Documentación de Facturación <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-[#f84827] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#f84827]/30"
          >
            <Key className="w-5 h-5" />
            Seleccionar API Key
          </button>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case Module.SPLIT:
        return <SplitModule settings={settings} />;
      case Module.RECONCILE:
        return <ReconcileModule />;
      case Module.SETTINGS:
        return <SettingsModule settings={settings} onSave={saveSettings} onKeyChange={handleSelectKey} />;
      default:
        return <SplitModule settings={settings} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 glass sticky top-0 z-50 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f84827] rounded-lg shadow-[0_0_15px_rgba(248,72,39,0.5)]">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            BRADY <span className="text-[#f84827]">AUDIT</span>
            <span className="ml-2 px-1.5 py-0.5 bg-white/10 rounded text-[10px] uppercase tracking-tighter border border-white/10">Pro</span>
          </h1>
        </div>
        <Navigation currentModule={currentModule} setModule={setCurrentModule} />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {renderModule()}
      </main>

      <footer className="p-6 text-center text-slate-500 text-xs mt-auto border-t border-white/5">
        <div>&copy; {new Date().getFullYear()} Brady Audit Suite. Versión Pro con Gemini 3.</div>
      </footer>
    </div>
  );
};

export default App;