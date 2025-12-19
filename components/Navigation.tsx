
import React from 'react';
import { Module } from '../types';
import { Scissors, FileSearch, Settings as SettingsIcon } from 'lucide-react';

interface NavigationProps {
  currentModule: Module;
  setModule: (module: Module) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentModule, setModule }) => {
  const tabs = [
    { id: Module.SPLIT, label: 'Split & Upload', icon: Scissors },
    { id: Module.RECONCILE, label: 'Reconcile', icon: FileSearch },
    { id: Module.SETTINGS, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="flex gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentModule === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setModule(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
              isActive 
                ? 'bg-[#f84827] text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
