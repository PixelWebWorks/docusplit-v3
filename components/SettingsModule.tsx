import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';
import { Save, Info, Key, FolderOpen, ExternalLink, RefreshCw } from 'lucide-react';

interface SettingsModuleProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onKeyChange: () => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSave, onKeyChange }) => {
  const [formData, setFormData] = useState<SettingsType>({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          Configuración Corporativa
        </h2>
        
        <div className="mb-8 p-6 bg-[#f84827]/5 border border-[#f84827]/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <Key className="w-4 h-4 text-[#f84827]" />
              Paid API Tier (Gemini Pro)
            </h3>
            <span className="text-[10px] bg-[#f84827]/20 text-[#f84827] px-2 py-1 rounded-full font-black">ACTIVO</span>
          </div>
          <p className="text-sm text-slate-400">
            Estás utilizando una clave de API gestionada por el usuario. Esto habilita el modelo <span className="text-white font-medium">Gemini 3 Pro</span> con razonamiento avanzado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onKeyChange}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Cambiar API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white transition-all"
            >
              Ver Facturación <ExternalLink className="w-4 h-4" />
            </a>
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
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white"
              placeholder="000000000000-xxxxx.apps.googleusercontent.com"
            />
            <p className="text-[10px] text-slate-500">
              Necesario para OAuth 2.0. Crea este ID en <a href="https://console.cloud.google.com/" target="_blank" className="underline hover:text-white">Google Cloud Console</a>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <FolderOpen className="w-4 h-4 text-[#f84827]" />
              Folder ID Destino (Split)
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={e => setFormData({ ...formData, driveFolderId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white"
              placeholder="ID de la carpeta desde la URL de Google Drive"
            />
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-xs text-blue-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">Nota de Seguridad</p>
              <p>Tus credenciales y claves se almacenan localmente. El procesamiento de facturas utiliza cifrado de extremo a extremo con los servicios de Google.</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#f84827] text-white py-4 rounded-xl font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#f84827]/20"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </form>
      </section>
      
      <section className="p-6 text-slate-500 text-sm">
        <h3 className="font-bold mb-2">Información de la Cuenta Pro</h3>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Modelo: Gemini 3 Pro (Reasoning Enabled)</li>
          <li>Thinking Budget: 4,000 tokens per request</li>
          <li>Origin: <strong>{window.location.origin}</strong> (URI Autorizado para OAuth)</li>
        </ul>
      </section>
    </div>
  );
};

export default SettingsModule;