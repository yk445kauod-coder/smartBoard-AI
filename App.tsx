
import React, { useState, useCallback, useEffect, useRef } from 'react';
import SmartBoard from './components/Board';
import Chat from './components/Chat';
import SettingsModal from './components/SettingsModal';
import VisualizeTextModal from './components/VisualizeTextModal';
import EditNodeModal from './components/EditNodeModal';
import ImageGenModal from './components/ImageGenModal'; 
import { TeacherPersona, ToolType, ElementData, LessonDetail, ToolbarPosition, ChatMessage, BoardTheme, ViewMode, LessonData } from './types';
import { speakText, cancelSpeech } from './services/tts';
import { generateImage, sendMessageToGemini } from './services/geminiService';
import { useNodesState, useEdgesState, addEdge, useReactFlow, ReactFlowProvider } from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import { toJpeg } from 'html-to-image';

const AppContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, getNodes } = useReactFlow();

  // App State
  const [activeTool, setActiveTool] = useState<ToolType>('pointer');
  const [view, setView] = useState<'home' | 'language-select' | 'board'>('home');
  const [settings, setSettings] = useState<TeacherPersona>({ name: 'Smart Tutor', language: 'Arabic', subject: 'General Knowledge', personality: 'Encouraging', voice: 'female' });
  const [isMuted, setIsMuted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVisualizeModalOpen, setIsVisualizeModalOpen] = useState(false);
  const [isImageGenModalOpen, setIsImageGenModalOpen] = useState(false); 
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node<ElementData> | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [customSubjects, setCustomSubjects] = useState<string[]>(['Mathematics', 'Physics', 'History', 'Biology', 'Literature', 'Programming']);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [lessonName, setLessonName] = useState('Introduction to AI');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [lessonDetails, setLessonDetails] = useState<LessonData | undefined>(undefined);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome to SmartBoard AI. What subject shall we explore today?', timestamp: Date.now() }
  ]);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail>('brief');
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(6);
  
  // Set language and direction
  useEffect(() => {
    const lang = settings.language.toLowerCase();
    document.documentElement.lang = lang.startsWith('ar') ? 'ar' : 'en';
    document.documentElement.dir = lang.startsWith('ar') ? 'rtl' : 'ltr';
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.language, isDarkMode]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedNodes = getNodes().filter(n => n.selected);
            selectedNodes.forEach(n => handleDeleteNode(n.id));
        }
        if (e.key === 'v') setActiveTool('pointer');
        if (e.key === 'p') setActiveTool('pen');
        if (e.key === 'h') setActiveTool('highlighter');
        if (e.key === 'e') setActiveTool('eraser');
        if (e.key === 'm') setViewMode(prev => prev === 'timeline' ? 'standard' : 'timeline');
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [getNodes]);

  const handleAddSubject = () => {
    if (newSubjectInput.trim()) {
      const uniqueSubjects = Array.from(new Set([...customSubjects, newSubjectInput.trim()]));
      setCustomSubjects(uniqueSubjects);
      setSettings(s => ({ ...s, subject: newSubjectInput.trim() }));
      setNewSubjectInput('');
    }
  };

  const handleLaunchSession = () => {
      const now = new Date();
      const gregEn = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      setLessonDetails({
          lessonName: lessonName || 'New Lesson',
          subject: settings.subject,
          startTime, endTime,
          gregorianDateEn: gregEn,
          gregorianDateAr: gregEn,
          hijriDate: hijri
      });
      
      // Auto-add Header
      const headerId = 'lesson-header-main';
      setNodes([{
          id: headerId,
          type: 'lessonHeader',
          position: { x: 400, y: -100 },
          data: { id: headerId, type: 'lessonHeader', lessonDetails: {
              lessonName: lessonName || 'New Lesson', subject: settings.subject, startTime, endTime, gregorianDateEn: gregEn, gregorianDateAr: gregEn, hijriDate: hijri
          }}
      }]);
      setView('board');
  };

  const handleExportJpg = useCallback(() => {
    const viewport = document.querySelector('.react-flow') as HTMLElement;
    if (viewport) {
        toJpeg(viewport, { quality: 0.95, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `smartboard-${Date.now()}.jpg`;
                link.href = dataUrl; link.click();
            });
    }
  }, [isDarkMode]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Fix: Added missing onAddSketch handler to handle new sketches added to the board
  const onAddSketch = useCallback((node: Node<ElementData>) => {
    setNodes((nds) => [...nds, node]);
  }, [setNodes]);

  const handleDeleteNode = useCallback((id: string) => { 
    setNodes((nds) => nds.filter((n) => n.id !== id)); 
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id)); 
  }, [setNodes, setEdges]);
  
  const handleEditNode = useCallback((id: string, newData: Partial<ElementData>) => {
      setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
  }, [setNodes]);

  const handleToolCall = useCallback(async (name: string, args: any) => {
      const id = args.id || `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const defaultPos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      
      let textToSpeak = "";
      switch (name) {
        case 'addWordArt':
            setNodes(nds => [...nds, { id, type: 'wordArt', position: { x: args.x || defaultPos.x, y: args.y || defaultPos.y }, data: { ...args, type: 'wordArt' } }]);
            textToSpeak = args.text; break;
        case 'addNote':
            setNodes(nds => [...nds, { id, type: 'note', position: { x: args.x || defaultPos.x, y: args.y || defaultPos.y }, data: { ...args, type: 'note' } }]);
            textToSpeak = args.content; break;
        case 'addImage':
            const imageUrl = args.url || await generateImage(args.description);
            setNodes(nds => [...nds, { id, type: 'image', position: { x: args.x || defaultPos.x, y: args.y || defaultPos.y }, data: { ...args, type: 'image', url: imageUrl || 'https://via.placeholder.com/512x512.png?text=Generation+Failed' } }]);
            break;
        case 'addComparison':
            setNodes(nds => [...nds, { id, type: 'comparison', position: { x: args.x || defaultPos.x, y: args.y || defaultPos.y }, data: { ...args, type: 'comparison' } }]);
            break;
        case 'addTimeline':
            setNodes(nds => [...nds, { id, type: 'timeline', position: { x: args.x || defaultPos.x, y: args.y || defaultPos.y }, data: { ...args, type: 'timeline' } }]);
            break;
        case 'addGame':
            setNodes(nds => [...nds, { id, type: 'game', position: { x: args.x || defaultPos.x, y: args.y || defaultPos.y }, data: { ...args, type: 'game' } }]);
            break;
        case 'connect':
            setEdges((eds) => addEdge({ source: args.from, target: args.to, animated: true, style: { strokeWidth: 2 } }, eds));
            break;
      }
      if (textToSpeak) speakText(textToSpeak, settings.language, isMuted);
  }, [setNodes, setEdges, settings.language, isMuted, screenToFlowPosition]);

  const submitPromptToAI = useCallback(async (prompt: string) => {
      cancelSpeech();
      setChatMessages(prev => [...prev, { role: 'user', text: prompt, timestamp: Date.now() }]);
      setIsAiLoading(true);
      try {
        const responseText = await sendMessageToGemini(prompt, settings.language, settings.subject, lessonDetail, handleToolCall);
        setChatMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
      } finally { setIsAiLoading(false); }
  }, [settings, lessonDetail, handleToolCall]);

  useEffect(() => { 
      (window as any).deleteNode = handleDeleteNode; 
      (window as any).editNode = (id: string) => setEditingNode(getNodes().find(n => n.id === id) || null);
      (window as any).submitPromptToAI = submitPromptToAI;
  }, [handleDeleteNode, getNodes, submitPromptToAI]);

  const Toolbar = () => {
    const ToolBtn = ({ id, icon, label, onClick, active }: any) => (
        <button 
            onClick={(e) => { e.preventDefault(); if (onClick) onClick(e); else setActiveTool(id); }}
            className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${active || activeTool === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} 
        >
            <i className={`fa-solid ${icon} text-sm`}></i>
            <span className="absolute top-12 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
                {label}
            </span>
        </button>
    );

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-2xl rounded-2xl p-2 border border-gray-200 dark:border-gray-700 flex items-center gap-1 animate-fade-in-down">
                <ToolBtn id="pointer" icon="fa-arrow-pointer" label="Select (V)" />
                <ToolBtn id="pan" icon="fa-hand" label="Pan (Space)" />
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <ToolBtn id="pen" icon="fa-pen" label="Pen (P)" />
                <ToolBtn id="highlighter" icon="fa-highlighter" label="Highlighter (H)" />
                <ToolBtn id="eraser" icon="fa-eraser" label="Eraser (E)" />
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <ToolBtn id="add-note" icon="fa-note-sticky" label="Sticky" />
                <ToolBtn id="add-text" icon="fa-font" label="Text" />
                <ToolBtn id="add-shape" icon="fa-shapes" label="Shape" />
                <ToolBtn id="ai-image" icon="fa-image" label="AI Image" onClick={() => setIsImageGenModalOpen(true)} />
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <ToolBtn id="clear" icon="fa-trash-can" label="Clear All" onClick={() => setIsClearConfirmOpen(true)} />
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={handleExportJpg} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"><i className="fa-solid fa-camera"></i></button>
                <button onClick={() => setViewMode(v => v === 'timeline' ? 'standard' : 'timeline')} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'timeline' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-600 dark:text-gray-400'}`}><i className="fa-solid fa-timeline"></i></button>
            </div>
            
            {(activeTool === 'pen' || activeTool === 'highlighter') && (
                 <div className="bg-white/90 dark:bg-gray-800 shadow-xl rounded-full px-4 py-2 flex items-center gap-4 border border-gray-200 animate-fade-in-down">
                    <div className="flex gap-2">
                        {['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308'].map(c => (
                            <button key={c} onClick={() => setPenColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${penColor === c ? 'ring-2 ring-indigo-500' : 'border-white'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <input type="range" min="2" max="24" value={penSize} onChange={(e) => setPenSize(parseInt(e.target.value))} className="w-24 accent-indigo-600" />
                </div>
            )}
        </div>
    );
  };

  if (view === 'home') {
    return (
        <div className="w-full h-screen relative bg-[#fdfdfd] dark:bg-gray-950 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
            <div className="z-10 text-center px-6">
                <i className="fa-solid fa-brain text-7xl text-indigo-600 mb-8 transition-transform hover:scale-110"></i>
                <h1 className="text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">SmartBoard <span className="text-indigo-600">AI</span></h1>
                <p className="text-2xl text-gray-500 mb-12 font-medium">The Visual Architect for Future Classrooms.</p>
                <button onClick={() => setView('language-select')} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">Enter Workspace</button>
            </div>
        </div>
    );
  }

  if (view === 'language-select') {
    return (
      <div className="w-full h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl w-full max-w-5xl p-10 grid md:grid-cols-2 gap-10 animate-zoom-in border border-white/50">
           <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Setup Session</h2>
                <p className="text-gray-500">Configure your digital environment.</p>
              </div>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                  {['Arabic', 'English'].map(l => (
                    <button key={l} onClick={() => setSettings(s => ({...s, language: l}))} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${settings.language === l ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}>{l === 'Arabic' ? 'العربية' : 'English'}</button>
                  ))}
              </div>
              <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lesson Title</label>
                    <input type="text" value={lessonName} onChange={(e) => setLessonName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-indigo-500 outline-none text-xl font-bold transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Start</label>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">End</label>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl outline-none" />
                      </div>
                  </div>
              </div>
              <button onClick={handleLaunchSession} className="w-full py-5 bg-indigo-600 text-white rounded-[20px] text-xl font-black shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-98">Launch Board</button>
           </div>
           <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-[24px] p-8 border border-indigo-100 dark:border-indigo-900/30 flex flex-col">
              <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-200 mb-6 uppercase tracking-wider">Select Subject</h3>
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-3 mb-6">
                  {customSubjects.map(sub => (
                      <button key={sub} onClick={() => setSettings(s => ({...s, subject: sub}))} className={`p-4 rounded-2xl text-left font-bold transition-all border-2 ${settings.subject === sub ? 'bg-white dark:bg-gray-800 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-md scale-[1.02]' : 'bg-white/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-200'}`}>{sub}</button>
                  ))}
              </div>
              <div className="flex gap-2">
                  <input type="text" value={newSubjectInput} onChange={(e) => setNewSubjectInput(e.target.value)} className="flex-1 p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl outline-none" placeholder="Add custom..." />
                  <button onClick={handleAddSubject} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-plus"></i></button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#fafafa] dark:bg-gray-950 flex flex-col transition-colors duration-500 overflow-hidden">
      <div className="absolute z-[101] top-8 left-1/2 -translate-x-1/2">
          <Toolbar />
      </div>
      <SmartBoard
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} activeTool={activeTool} onAddSketch={onAddSketch} setNodes={setNodes} onPaneClick={(e) => {}} penColor={penColor} penSize={penSize} onDeleteNode={handleDeleteNode} boardTheme={isDarkMode ? 'dark' : 'default'} viewMode={viewMode} lessonDetails={lessonDetails}
      />
      <Chat messages={chatMessages} onSendMessage={submitPromptToAI} isLoading={isAiLoading} />
      <ImageGenModal 
        isOpen={isImageGenModalOpen} 
        onClose={() => setIsImageGenModalOpen(false)} 
        onGenerate={async (p, o) => {
            const id = `img-${Date.now()}`;
            const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            
            setNodes(nds => [...nds, { 
                id, 
                type: 'image', 
                position: pos, 
                data: { 
                    id, 
                    type: 'image', 
                    url: '', 
                    description: `Generating: "${p}"` 
                } 
            }]);

            const imageUrl = await generateImage(p, o);

            setNodes(nds => nds.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            url: imageUrl || 'https://via.placeholder.com/512x512.png?text=Generation+Failed',
                            description: imageUrl ? p : `Failed to generate: "${p}"`,
                        }
                    };
                }
                return node;
            }));
        }} 
      />
      {editingNode && <EditNodeModal node={editingNode} isOpen={!!editingNode} onClose={() => setEditingNode(null)} onSave={(id, updates) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, position: updates.position || n.position, data: { ...n.data, ...updates } } : n));
      }} />}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center">
                <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500 mb-6"></i>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Clear Board?</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">All progress on the canvas will be permanently removed.</p>
                <div className="flex gap-4">
                    <button onClick={() => setIsClearConfirmOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-100 font-bold text-gray-400">Cancel</button>
                    <button onClick={() => { setNodes([]); setEdges([]); setIsClearConfirmOpen(false); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200">Clear All</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ReactFlowProvider>
    <AppContent />
  </ReactFlowProvider>
);

export default App;
