import React, { useState, useEffect } from 'react';
import { ElementData, ElementType } from '../types';
import { Node } from 'reactflow';

interface EditNodeModalProps {
  node: Node<ElementData> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<ElementData> & { position?: { x: number, y: number } }) => void;
}

const EditNodeModal: React.FC<EditNodeModalProps> = ({ node, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'layout'>('content');

  useEffect(() => {
    if (node) {
      setFormData({
        ...node.data,
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        width: node.width || node.data.width,
        height: node.height || node.data.height,
      });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    const { x, y, ...dataRest } = formData;
    
    // Construct updates
    const updates: any = { ...dataRest };
    
    // Handle position separately as it lives on the node object, not data
    const positionUpdate = (x !== undefined && y !== undefined) ? { x: Number(x), y: Number(y) } : undefined;
    
    onSave(node.id, {
        ...updates,
        position: positionUpdate
    });
    onClose();
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderContentInputs = () => {
    switch (node.type as ElementType) {
      case 'note':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content</label>
              <textarea 
                value={formData.content || ''} 
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none min-h-[120px]"
              />
            </div>
          </div>
        );
      case 'text':
      case 'wordArt':
        return (
          <div className="space-y-4">
             <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Text</label>
              <textarea 
                value={formData.text || ''} 
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none min-h-[120px]"
              />
            </div>
          </div>
        );
      case 'list':
      case 'comparison':
        return (
           <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
              <input 
                type="text" 
                value={formData.title || ''} 
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              />
            </div>
             <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-sm">
                <i className="fa-solid fa-info-circle mr-2"></i>
                List items are best edited directly on the board for now.
            </div>
          </div>
        );
      case 'image':
         return (
             <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Image URL</label>
                    <input 
                        type="text" 
                        value={formData.url || ''} 
                        onChange={(e) => handleChange('url', e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-mono"
                    />
                 </div>
                 <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                     {formData.url ? (
                         <img src={formData.url} className="h-full object-contain" alt="preview" />
                     ) : (
                         <span className="text-gray-400">No Image</span>
                     )}
                 </div>
             </div>
         );
       case 'game':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Game Type</label>
                        <select 
                            value={formData.gameType || 'math'}
                            onChange={(e) => handleChange('gameType', e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        >
                            <option value="math">Speed Math</option>
                            <option value="quiz">Quiz</option>
                        </select>
                    </div>
                </div>
            );
       case 'book':
            return (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Book Title</label>
                         <input 
                            type="text" 
                            value={formData.bookData?.title || ''} 
                            onChange={(e) => handleChange('bookData', { ...formData.bookData, title: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        />
                    </div>
                    {/* Simple Page Content Editor */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Page 1 Content</label>
                        <textarea 
                            value={formData.bookData?.pages?.[0]?.content || ''}
                            onChange={(e) => {
                                const newPages = [...(formData.bookData?.pages || [])];
                                if(!newPages[0]) newPages[0] = { content: '' };
                                newPages[0].content = e.target.value;
                                handleChange('bookData', { ...formData.bookData, pages: newPages });
                            }}
                             className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none min-h-[100px]"
                        />
                    </div>
                 </div>
            );
       case 'threeD':
           return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Label Content</label>
                        <input 
                            type="text" 
                            value={formData.content || ''} 
                            onChange={(e) => handleChange('content', e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                             <label className="text-xs text-gray-500">Rotate X</label>
                             <input type="range" min="-180" max="180" value={formData.rotateX || 0} onChange={e => handleChange('rotateX', Number(e.target.value))} className="w-full"/>
                             <div className="text-center text-xs">{formData.rotateX}°</div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Rotate Y</label>
                             <input type="range" min="-180" max="180" value={formData.rotateY || 0} onChange={e => handleChange('rotateY', Number(e.target.value))} className="w-full"/>
                             <div className="text-center text-xs">{formData.rotateY}°</div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Rotate Z</label>
                             <input type="range" min="-180" max="180" value={formData.rotateZ || 0} onChange={e => handleChange('rotateZ', Number(e.target.value))} className="w-full"/>
                             <div className="text-center text-xs">{formData.rotateZ}°</div>
                        </div>
                    </div>
                     <div>
                             <label className="text-xs text-gray-500">Perspective (Depth)</label>
                             <input type="range" min="200" max="2000" step="50" value={formData.perspective || 1000} onChange={e => handleChange('perspective', Number(e.target.value))} className="w-full"/>
                             <div className="text-center text-xs">{formData.perspective}px</div>
                        </div>
                </div>
           );
      default:
        return <div className="text-gray-400 text-center py-4">No content fields available for this element.</div>;
    }
  };

  const renderStyleInputs = () => {
      return (
          <div className="space-y-6">
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                      {['#F7FFF7', '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F3F4F6', '#2d3436'].map(color => (
                          <button 
                            key={color}
                            onClick={() => handleChange('color', color)}
                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-indigo-400 border-white shadow-md scale-110' : 'border-gray-200'}`}
                            style={{ backgroundColor: color }}
                          />
                      ))}
                      <input 
                        type="color" 
                        value={formData.color || '#ffffff'}
                        onChange={(e) => handleChange('color', e.target.value)}
                        className="w-10 h-10 rounded-full overflow-hidden border-0 p-0 cursor-pointer"
                      />
                  </div>
              </div>

               {node.type === 'shape' && (
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shape Type</label>
                       <select 
                            value={formData.shapeType || 'rectangle'}
                            onChange={(e) => handleChange('shapeType', e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        >
                            <option value="rectangle">Rectangle</option>
                            <option value="circle">Circle</option>
                            <option value="triangle">Triangle</option>
                        </select>
                  </div>
               )}
          </div>
      )
  };

  const renderLayoutInputs = () => {
      return (
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Position X</label>
                  <input 
                    type="number" 
                    value={formData.x || 0}
                    onChange={(e) => handleChange('x', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Position Y</label>
                  <input 
                    type="number" 
                    value={formData.y || 0}
                    onChange={(e) => handleChange('y', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rotation (°)</label>
                  <input 
                    type="number" 
                    value={formData.rotation || 0}
                    onChange={(e) => handleChange('rotation', Number(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
              </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Size</label>
                  <div className="flex gap-2">
                       <input 
                        type="number" 
                        placeholder="W"
                        value={formData.width || ''}
                        onChange={(e) => handleChange('width', Number(e.target.value))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                       <input 
                        type="number" 
                        placeholder="H"
                        value={formData.height || ''}
                        onChange={(e) => handleChange('height', Number(e.target.value))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                  </div>
              </div>
          </div>
      )
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white/50 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm"><i className="fa-solid fa-pen-to-square"></i></span>
                Edit Element
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-gray-50 border-b border-gray-100 gap-1">
            {(['content', 'style', 'layout'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {activeTab === 'content' && renderContentInputs()}
            {activeTab === 'style' && renderStyleInputs()}
            {activeTab === 'layout' && renderLayoutInputs()}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all">
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditNodeModal;