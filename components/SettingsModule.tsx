
import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';
import { Save, Info, Key, FolderOpen, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Copy, ShieldCheck, Globe } from 'lucide-react';

interface SettingsModuleProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onKeyChange: () => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSave, onKeyChange }) => {
  const [formData, setFormData] = useState<SettingsType>({ ...settings });
  const [copied, setCopied] = useState(false);

  // Detectar si los valores vienen del sistema (VPS)
  const isSystemClientId = (process.env as any).DRIVE_CLIENT_ID === settings.driveClientId && !!settings.driveClientId;
  const isSystemFolderId = (process.env as any).DRIVE_FOLDER_ID === settings.driveFolderId && !!settings.driveFolderId;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configuración guardada localneath.');
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
          Configuración Global
        </h2>
        
        <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-3">
          <h3 className="font-bold flex items-center gap-2 text-blue-400 text-sm">
            <Globe className="w-4 h-4" />
            Configuración del Servidor (VPS)
          </h3>
          <p className="text-[11px] text-slate-400">
            Si configuras las variables en Coolify, estos campos aparecerán llenos automáticamente para todos los usuarios que entren a la web.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#f84827]" />
                Google Drive Client ID
              </span>
              {isSystemClientId && (
                <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SISTEMA
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.driveClientId}
              onChange={e => setFormData({ ...formData, driveClientId: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg p-3 outline-none transition-colors text-white font-mono text-sm ${isSystemClientId ? 'border-green-500/30' : 'border-white/10 focus:border-[#f84827]'}`}
              placeholder="Inyectado desde Coolify..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#f84827]" />
                ID Carpeta Raíz
              </span>
              {isSystemFolderId && (
                <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SISTEMA
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={e => setFormData({ ...formData, driveFolderId: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg p-3 outline-none transition-colors text-white font-mono text-sm ${isSystemFolderId ? 'border-green-500/30' : 'border-white/10 focus:border-[#f84827]'}`}
              placeholder="Inyectado desde Coolify..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#f84827] text-white py-4 rounded-xl font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#f84827]/20 mt-4"
          >
            <Save className="w-4 h-4" />
            Guardar Overrides (Local)
          </button>
        </form>
      </section>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] text-slate-400">URI de la app: <strong className="text-white">{window.location.origin}</strong></span>
        </div>
        <button onClick={copyOrigin} className="text-[10px] bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors">
          {copied ? 'Copiado' : 'Copiar URI'}
        </button>
      </div>
    </div>
  );
};

export default SettingsModule;
