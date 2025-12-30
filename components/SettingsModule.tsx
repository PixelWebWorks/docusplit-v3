
import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';
import { Save, Info, Key, FolderOpen, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Copy, ListChecks, ShieldAlert, PlusCircle } from 'lucide-react';

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
            IA configurada para procesamiento logístico. Asegúrese de que su API Key tenga facturación en Google AI Studio.
          </p>
          <button
            onClick={onKeyChange}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar Clave Gemini
          </button>
        </div>

        {/* DATA ACCESS / SCOPES GUIDE (IMPORTANT FIX FOR USER) */}
        <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <h3 className="font-bold flex items-center gap-2 text-red-400 mb-4">
            <ShieldAlert className="w-5 h-5" />
            Acceso a los Datos (PENDIENTE)
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Tu captura muestra que las tablas de permisos están vacías. Sigue estos pasos en la pestaña <strong>"Acceso a los datos"</strong> de Google Cloud:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="bg-[#f84827] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0">1</div>
              <div className="text-[11px] text-slate-300">
                Haz clic en el botón azul <strong>"Agregar o quitar permisos"</strong>.
              </div>
            </div>
            <div className="flex gap-4 items-start bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="bg-[#f84827] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0">2</div>
              <div className="text-[11px] text-slate-300">
                Busca <strong>"Google Drive API"</strong> y marca la casilla de: <br/>
                <code className="text-[#f84827] bg-black/40 px-1 py-0.5 rounded block mt-1">.../auth/drive.file</code>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="bg-[#f84827] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0">3</div>
              <div className="text-[11px] text-slate-300">
                Haz clic en <strong>Actualizar</strong> en el panel y luego en <strong>GUARDAR (Save)</strong> al final de la página principal.
              </div>
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
              placeholder="ID de cliente de Google Cloud"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <FolderOpen className="w-4 h-4 text-[#f84827]" />
              ID Carpeta Raíz de Drive
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={e => setFormData({ ...formData, driveFolderId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white font-mono text-sm"
              placeholder="ID de la carpeta donde se guardarán las auditorías"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#f84827] text-white py-4 rounded-xl font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#f84827]/20 mt-4"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </form>
      </section>

      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-400" />
          <span className="text-[10px] text-slate-400">URI autorizado para esta sesión: <strong className="text-white">{window.location.origin}</strong></span>
        </div>
        <button onClick={copyOrigin} className="text-[10px] bg-white/5 px-3 py-1 rounded hover:bg-white/10 transition-colors">
          {copied ? 'Copiado' : 'Copiar URI'}
        </button>
      </div>
    </div>
  );
};

export default SettingsModule;
