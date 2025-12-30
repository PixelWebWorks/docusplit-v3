
import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';
import { Save, Info, Key, FolderOpen, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

interface SettingsModuleProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onKeyChange: () => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSave, onKeyChange }) => {
  const [formData, setFormData] = useState<SettingsType>({ ...settings });
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configuración guardada localmente.');
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          Configuración del Sistema
        </h2>
        
        {/* API KEY SECTION */}
        <div className="mb-8 p-6 bg-[#f84827]/5 border border-[#f84827]/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <Key className="w-4 h-4 text-[#f84827]" />
              Motor de IA (Gemini 3 Pro)
            </h3>
            <span className="text-[10px] bg-[#f84827]/20 text-[#f84827] px-2 py-1 rounded-full font-black">ACTIVO</span>
          </div>
          <p className="text-sm text-slate-400">
            Utilizando razonamiento avanzado para la extracción de metadatos en facturas complejas.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onKeyChange}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar Clave Gemini
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Información sobre facturación y cuotas de API
            </a>
          </div>
        </div>

        {/* DRIVE TROUBLESHOOTING GUIDE */}
        <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <h3 className="font-bold flex items-center gap-2 text-amber-400 mb-3">
            <AlertTriangle className="w-4 h-4" />
            ¿Error "Access Blocked" en Drive?
          </h3>
          <div className="text-xs text-slate-400 space-y-3">
            <p>Si recibes un error 403 o "App not verified", sigue estos pasos en tu <a href="https://console.cloud.google.com/" target="_blank" className="text-amber-400 underline">Google Console</a>:</p>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li>Ve a <strong>OAuth Consent Screen</strong> y añade <code className="text-white bg-white/10 px-1 rounded">docusplit@gmail.com</code> a la lista de <strong>Test Users</strong>.</li>
              <li>En <strong>Credentials</strong>, edita tu OAuth Client ID.</li>
              <li>En <strong>Authorized JavaScript origins</strong>, debes añadir esta URL exactamente:</li>
            </ol>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 p-2 bg-black/40 rounded border border-white/10 text-[#f84827] font-mono truncate">
                {window.location.origin}
              </code>
              <button 
                onClick={copyOrigin}
                className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-300"
                title="Copiar URL"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <Key className="w-4 h-4 text-[#f84827]" />
              Google Drive Client ID
            </label>
            <input
              type="text"
              value={formData.driveClientId}
              onChange={e => setFormData({ ...formData, driveClientId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white font-mono text-sm"
              placeholder="000000000000-xxxxx.apps.googleusercontent.com"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <FolderOpen className="w-4 h-4 text-[#f84827]" />
              Carpeta Raíz (Folder ID)
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={e => setFormData({ ...formData, driveFolderId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white font-mono text-sm"
              placeholder="ID de la carpeta de destino"
            />
            <p className="text-[10px] text-slate-500 italic">
              El sistema creará subcarpetas por cliente automáticamente dentro de este ID.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#f84827] text-white py-4 rounded-xl font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#f84827]/20 mt-4"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </form>
      </section>

      <div className="p-4 flex gap-3 text-[10px] text-slate-500 border border-white/5 rounded-xl bg-white/2">
        <Info className="w-3 h-3 flex-shrink-0" />
        <p>
          Los datos de configuración se almacenan únicamente en el almacenamiento local de su navegador (LocalStorage). 
          Brady Audit Suite no almacena sus credenciales en servidores externos.
        </p>
      </div>
    </div>
  );
};

export default SettingsModule;
