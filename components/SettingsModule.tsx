
import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';
import { Save, Info, Key, FolderOpen, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Copy, ListChecks } from 'lucide-react';

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
            Extracción de datos inteligente activa. Asegúrese de que su API Key tenga facturación habilitada si excede los límites gratuitos.
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
              Ver límites y facturación de Google AI
            </a>
          </div>
        </div>

        {/* CLOUD CONFIGURATION CHECKLIST (Based on User Screenshots) */}
        <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
          <h3 className="font-bold flex items-center gap-2 text-blue-400 mb-4">
            <ListChecks className="w-5 h-5" />
            Checklist de Configuración Cloud
          </h3>
          <ul className="space-y-3 text-xs">
            <li className="flex gap-3">
              <div className="mt-0.5"><CheckCircle className="w-3 h-3 text-green-500" /></div>
              <div className="text-slate-300">
                <strong>Orígenes de JavaScript:</strong> Confirmado en captura. Asegúrese de que <code className="bg-white/10 px-1 rounded">{window.location.origin}</code> esté en la lista de URIs autorizados.
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5"><AlertTriangle className="w-3 h-3 text-amber-500" /></div>
              <div className="text-slate-300">
                <strong>Usuarios de Prueba (CRÍTICO):</strong> Ve a "Pantalla de consentimiento de OAuth" y añade tu correo <code>docusplit@gmail.com</code> en la sección <strong>"Test Users"</strong>. Sin esto, verás el error de "Access Blocked".
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5"><Info className="w-3 h-3 text-blue-500" /></div>
              <div className="text-slate-300">
                <strong>Modo de Aplicación:</strong> Mientras esté en "Testing", solo los correos en la lista de Test Users podrán loguearse.
              </div>
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-black/30 rounded-lg flex items-center justify-between border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono truncate mr-2">{window.location.origin}</span>
            <button 
              onClick={copyOrigin}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#f84827]/10 hover:bg-[#f84827]/20 text-[#f84827] rounded text-[10px] font-bold transition-colors"
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar URL'}
            </button>
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
              placeholder="Ej: 547798216882-ebs0l632mnm2el90ikefob722bju1asn.apps.googleusercontent.com"
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
              placeholder="ID de la carpeta de destino en Drive"
            />
            <p className="text-[10px] text-slate-500 italic">
              Las facturas se organizarán en subcarpetas por cliente dentro de esta carpeta.
            </p>
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

      <footer className="text-center">
        <p className="text-[10px] text-slate-600">
          Brady Audit Suite Pro • Built for docusplit@gmail.com
        </p>
      </footer>
    </div>
  );
};

export default SettingsModule;
