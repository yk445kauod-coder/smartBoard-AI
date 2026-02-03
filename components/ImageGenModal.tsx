
import React, { useState } from 'react';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, options: { style: string, aspectRatio: string }) => void;
}

const ImageGenModal: React.FC<ImageGenModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  if (!isOpen) return null;

  const handleGenerate = () => {
      if (!prompt.trim()) { alert('Please enter a description'); return; }
      onGenerate(prompt, { style, aspectRatio });
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[201] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <i className="fa-solid fa-palette text-indigo-500"></i> AI Image Studio
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>

        <div className="p-6 space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Image Description</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none h-32 resize-none text-gray-700"
                    placeholder="Describe the image you want to create (e.g. A futuristic city on Mars)..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Art Style</label>
                    <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    >
                        <option value="photorealistic">Photorealistic</option>
                        <option value="cartoon">Cartoon / Comic</option>
                        <option value="vector art">Vector Illustration</option>
                        <option value="3d render">3D Render</option>
                        <option value="watercolor">Watercolor</option>
                        <option value="sketch">Pencil Sketch</option>
                    </select>
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dimensions</label>
                    <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    >
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                        <option value="4:3">Standard (4:3)</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
            <button 
                onClick={handleGenerate}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
                <i className="fa-solid fa-wand-magic-sparkles"></i> Generate Image
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageGenModal;
