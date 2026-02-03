import React from 'react';
import { TeacherPersona } from '../types';

interface SettingsModalProps {
  settings: TeacherPersona;
  onSave: (s: TeacherPersona) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleApiKeySelection = async () => {
    try {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            alert("API Key updated. Please try your request again.");
        } else {
            alert("API Key selection is not available in this environment.");
        }
    } catch (e) {
        console.error("Failed to select API key", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/50">
        <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <i className="fa-solid fa-sliders"></i> 
            </div>
            Session Settings
          </h2>
          <button onClick={onClose} className="hover:bg-gray-200 text-gray-500 p-2 rounded-full transition"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-robot"></i> Assistant Name
            </label>
            <input 
              type="text" 
              value={localSettings.name}
              onChange={e => setLocalSettings({...localSettings, name: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all"
              placeholder="e.g. Smart Tutor"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-language"></i> Response Language
            </label>
            <input 
              type="text" 
              value={localSettings.language}
              onChange={e => setLocalSettings({...localSettings, language: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all"
              placeholder="e.g., Arabic, English"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-wave-square"></i> Vocal Style
            </label>
            <div className="flex gap-4">
              <button 
                onClick={() => setLocalSettings({...localSettings, voice: 'female'})}
                className={`flex-1 p-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${localSettings.voice === 'female' ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <i className="fa-solid fa-venus"></i> Female
              </button>
              <button 
                onClick={() => setLocalSettings({...localSettings, voice: 'male'})}
                className={`flex-1 p-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${localSettings.voice === 'male' ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                 <i className="fa-solid fa-mars"></i> Male
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-key"></i> API Access
            </label>
            <button 
                onClick={handleApiKeySelection}
                className="w-full py-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all flex justify-center items-center gap-2 shadow-sm"
            >
                <i className="fa-brands fa-google text-lg"></i> Manage Google Cloud Project
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={() => { onSave(localSettings); onClose(); }}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;