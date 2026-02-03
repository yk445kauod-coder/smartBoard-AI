import React, { memo, useState, useEffect, useRef, useContext } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { ElementData, ViewMode } from '../types';
import { speakText } from '../services/tts';
import { BoardContext } from './Board';

const getFontClass = (text: string) => {
    const isArabic = /[\u0600-\u06FF]/.test(text || "");
    return isArabic ? 'font-ar' : 'font-en';
};

// Helper to strip HTML for cases where we need plain text but receive AI markup
const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

// --- UNIVERSAL NODE WRAPPER ---
// Provides Resizing, Full Screen, Deleting, and Edit Gestures for ALL nodes
interface UniversalNodeWrapperProps {
    id: string;
    data: ElementData;
    selected: boolean;
    minWidth?: number;
    minHeight?: number;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onFullScreenCustom?: () => void;
}

const UniversalNodeWrapper: React.FC<UniversalNodeWrapperProps> = ({ 
    id, data, selected, minWidth = 100, minHeight = 50, children, className = '', style, onFullScreenCustom 
}) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ((window as any).editNode) (window as any).editNode(id);
    };

    const handleFullScreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onFullScreenCustom) onFullScreenCustom();
        else setIsFullScreen(!isFullScreen);
    };

    const FullScreenOverlay = () => {
        if (!isFullScreen) return null;
        return (
            <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col animate-fade-in" onClick={() => setIsFullScreen(false)}>
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">{data.type} View</h2>
                     <button onClick={() => setIsFullScreen(false)} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                         <i className="fa-solid fa-xmark text-2xl text-gray-500"></i>
                     </button>
                </div>
                <div className="flex-1 p-10 overflow-auto flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full h-full max-w-6xl flex items-center justify-center">
                         {children}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div 
                className={`relative group animate-zoom-in ${selected ? 'selected z-50' : 'z-10'} ${className}`} 
                style={{ width: data.width, height: data.height, ...style }} 
            >
                <NodeResizer 
                    minWidth={minWidth} 
                    minHeight={minHeight} 
                    isVisible={selected} 
                    handleClassName="bg-indigo-500 w-3 h-3 rounded-full border-2 border-white shadow-md z-50" 
                    lineClassName="border-indigo-400 opacity-30"
                />

                <Handle type="target" position={Position.Top} className="opacity-0" />
                <Handle type="target" position={Position.Left} className="opacity-0" />
                <Handle type="target" position={Position.Right} className="opacity-0" />
                <Handle type="target" position={Position.Bottom} className="opacity-0" />
                
                {/* Float Controls */}
                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 z-50 ${selected ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-2 pointer-events-none'}`}>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                        onClick={handleFullScreen}
                        title="Expand"
                    >
                        <i className={`fa-solid ${isFullScreen ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
                    </button>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                        onClick={handleEdit}
                        title="Edit"
                    >
                        <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={(e) => { e.stopPropagation(); if((window as any).deleteNode) (window as any).deleteNode(id); }}
                        title="Delete"
                    >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>

                <div className="w-full h-full node-content-wrapper rounded-[inherit]">
                    {children}
                </div>

                <Handle type="source" position={Position.Bottom} className="opacity-0" />
                <Handle type="source" position={Position.Left} className="opacity-0" />
                <Handle type="source" position={Position.Right} className="opacity-0" />
                <Handle type="source" position={Position.Top} className="opacity-0" />
            </div>
            <FullScreenOverlay />
        </>
    );
};


// --- NODE IMPLEMENTATIONS ---

export const LessonHeaderNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const details = data.lessonDetails || { 
        lessonName: 'New Lesson', subject: 'General', startTime: '08:00', endTime: '09:00',
        gregorianDateEn: '', gregorianDateAr: '', hijriDate: ''
    };
    const fontAr = "font-ar-title";
    
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={500} className="rounded-2xl">
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row overflow-hidden w-full h-full shadow-sm">
                <div className="bg-indigo-600 text-white p-8 flex flex-col justify-center min-w-[240px]">
                    <span className="text-xs uppercase tracking-[0.2em] opacity-80 mb-2 font-bold">{details.subject}</span>
                    <h2 className={`text-3xl font-bold mb-6 ${fontAr}`}>{details.lessonName}</h2>
                    <div className="flex items-center gap-3 text-indigo-100 bg-white/10 px-4 py-2 rounded-xl text-sm self-start">
                        <i className="fa-regular fa-clock"></i>
                        <span className="font-mono">{details.startTime} - {details.endTime}</span>
                    </div>
                </div>
                <div className="flex-1 p-8 flex items-center justify-around bg-slate-50 dark:bg-gray-900/50">
                    <div className="text-center px-6">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Gregorian</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-200 text-lg">{details.gregorianDateEn}</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="text-center px-6">
                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Hijri</div>
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 font-ar text-xl" dir="rtl">{details.hijriDate}</div>
                    </div>
                </div>
            </div>
        </UniversalNodeWrapper>
    );
});

export const NoteNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const [content, setContent] = useState(data.content || '');
    const fontClass = getFontClass(content);
    
    useEffect(() => { setContent(data.content || ''); }, [data.content]);
    
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={180} minHeight={120} style={{ transform: `rotate(${data.rotation || 0}deg)` }}>
            <div 
                className="w-full h-full p-6 flex flex-col items-center justify-center text-center relative overflow-hidden rounded-sm border border-black/5 shadow-inner"
                style={{ backgroundColor: data.color || '#fff9c4', borderBottomRightRadius: '40px' }}
            >
                 <div className="absolute bottom-0 right-0 w-12 h-12 bg-black/5" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}></div>
                 <div className="absolute top-0 left-0 right-0 h-4 bg-black/5 blur-[3px]"></div>
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-500 shadow-md z-20 border-2 border-white"></div>
                 <div 
                    className={`text-xl md:text-2xl font-medium break-words w-full text-gray-800 ${fontClass} outline-none leading-relaxed`}
                    dangerouslySetInnerHTML={{ __html: content }}
                 />
            </div>
        </UniversalNodeWrapper>
    );
});

export const ImageNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={150} minHeight={150} style={{ transform: `rotate(${data.rotation || 0}deg)` }} className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 p-2 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-full h-full relative rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 group/img">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            )}
            <img 
                src={data.url} 
                alt={data.description}
                className={`w-full h-full object-cover transition-all duration-500 group-hover/img:scale-105 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
            />
        </div>
    </UniversalNodeWrapper>
  );
});

export const GameNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const [key, setKey] = useState(0); 

    const renderGameContent = () => {
        if (data.htmlGameCode) {
            const htmlContent = `
                <html>
                <head><style>body{margin:0;overflow:hidden;background:transparent;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#333;}</style></head>
                <body>${data.htmlGameCode}</body>
                </html>
            `;
            return (
                <iframe 
                    key={key}
                    srcDoc={htmlContent}
                    title="Interactive Game"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                />
            );
        }
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 dark:bg-gray-800 p-8 text-center">
                <i className="fa-solid fa-puzzle-piece text-4xl text-indigo-300 mb-4 animate-bounce"></i>
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">Interactive Activity</h3>
                <p className="text-xs text-gray-500 mt-2">No code loaded</p>
            </div>
        );
    };

    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={350} minHeight={300} className="rounded-2xl">
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm">
                <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <i className="fa-solid fa-gamepad text-indigo-400"></i> Interactive Frame
                    </span>
                    <button onClick={() => setKey(k => k + 1)} className="text-gray-400 hover:text-indigo-500 transition-colors"><i className="fa-solid fa-rotate-right text-xs"></i></button>
                </div>
                <div className="flex-1 relative">
                    {renderGameContent()}
                </div>
            </div>
        </UniversalNodeWrapper>
    );
});

export const BookNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const bookData = data.bookData || { title: "New Book", pages: [{ content: "Start writing..." }] };
    const [currentPage, setCurrentPage] = useState(0);
    const page = bookData.pages[currentPage] || { content: "" };

    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={300} minHeight={400} className="rounded-r-xl">
             <div className="w-full h-full bg-[#fdfaf1] rounded-r-xl rounded-l-sm border-l-[10px] border-[#5d4037] shadow-xl flex flex-col overflow-hidden">
                 <div className="h-12 bg-[#efebe9] border-b border-[#d7ccc8] flex items-center justify-between px-5 shrink-0">
                     <span className="text-xs font-bold text-[#5d4037] truncate max-w-[140px]">{bookData.title}</span>
                     <span className="text-[10px] font-bold text-[#8d6e63] font-mono">{currentPage + 1} / {bookData.pages.length}</span>
                 </div>
                 <div className="flex-1 p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] font-serif">
                     {page.imageUrl && <img src={page.imageUrl} className="w-full h-auto rounded-lg mb-6 shadow-sm border border-black/5" />}
                     <div className="text-lg leading-relaxed text-[#3e2723]" dangerouslySetInnerHTML={{ __html: page.content }} />
                 </div>
                 <div className="h-14 bg-[#efebe9] border-t border-[#d7ccc8] flex items-center justify-between px-4 shrink-0">
                     <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[#d7ccc8] rounded-full transition-colors"><i className="fa-solid fa-chevron-left text-[#5d4037]"></i></button>
                     <button onClick={() => speakText(stripHtml(page.content), 'English', false)} className="w-8 h-8 flex items-center justify-center bg-[#d7ccc8] rounded-full text-[#5d4037] hover:bg-[#bcaaa4] transition-colors"><i className="fa-solid fa-volume-high text-xs"></i></button>
                     <button onClick={() => setCurrentPage(Math.min(bookData.pages.length - 1, currentPage + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[#d7ccc8] rounded-full transition-colors"><i className="fa-solid fa-chevron-right text-[#5d4037]"></i></button>
                 </div>
             </div>
        </UniversalNodeWrapper>
    );
});

export const WordArtNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const fontClass = getFontClass(data.text || "");
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={200} minHeight={80}>
             <div className="w-full h-full flex items-center justify-center p-4">
                <h1 className={`text-6xl md:text-7xl font-bold text-center drop-shadow-sm select-none transition-transform duration-200 group-hover:scale-105 ${fontClass}`} style={{ color: data.color || '#1e293b' }}>
                    {data.text}
                </h1>
             </div>
        </UniversalNodeWrapper>
    );
});

export const TextNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const fontClass = getFontClass(data.text || "");
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={150} minHeight={40}>
            <div 
                className={`w-full h-full p-4 text-xl leading-relaxed text-gray-800 dark:text-gray-100 ${fontClass} whitespace-pre-wrap`}
                dangerouslySetInnerHTML={{ __html: data.text || "Type something..." }}
            />
        </UniversalNodeWrapper>
    );
});

export const ShapeNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
  const bg = data.color || '#4ECDC4';
  return (
    <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={50} minHeight={50}>
      <div className="w-full h-full flex items-center justify-center transition-transform duration-300 hover:scale-105">
        {data.shapeType === 'rectangle' && <div className="w-full h-full rounded-xl border-2 border-white shadow-sm" style={{ backgroundColor: bg }}></div>}
        {data.shapeType === 'circle' && <div className="w-full h-full rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: bg }}></div>}
        {data.shapeType === 'triangle' && <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[100px] border-l-transparent border-r-transparent filter drop-shadow-sm" style={{ borderBottomColor: bg }}></div>}
      </div>
    </UniversalNodeWrapper>
  );
});

export const CodeNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
  return (
    <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={350} minHeight={200} className="rounded-xl overflow-hidden border border-gray-700 bg-[#282c34] shadow-2xl">
         <div className="flex items-center px-4 py-3 bg-[#21252b] border-b border-black/20">
            <div className="flex gap-1.5 mr-4">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{data.language || 'code'}</span>
         </div>
         <div className="p-6 overflow-auto custom-scrollbar font-mono text-sm text-[#abb2bf] leading-relaxed">
             <pre><code>{data.code}</code></pre>
         </div>
    </UniversalNodeWrapper>
  );
});

export const ComparisonNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const fontClass = getFontClass(data.title || "");
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={450} minHeight={300} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
             <div className="w-full h-full flex flex-col">
                 <div className={`p-5 border-b text-center font-bold text-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ${fontClass}`}>{data.title}</div>
                 <div className="flex-1 flex divide-x divide-gray-100 dark:divide-gray-700">
                     {data.columns?.map((col, i) => (
                         <div key={i} className={`flex-1 flex flex-col ${i === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                             <div className={`p-4 border-b font-bold text-center text-gray-700 dark:text-gray-300 ${fontClass}`}>{col.title}</div>
                             <ul className="flex-1 p-6 space-y-3">
                                 {col.items?.map((item, idx) => (
                                     <li key={idx} className={`flex items-start gap-3 text-gray-600 dark:text-gray-400 ${fontClass}`}>
                                         <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                         <span className="leading-snug" dangerouslySetInnerHTML={{ __html: item }} />
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     ))}
                 </div>
             </div>
        </UniversalNodeWrapper>
    );
});

export const FlashcardNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={260} minHeight={160}>
             <div className="w-full h-full [perspective:1000px] cursor-pointer" onClick={() => setFlipped(!flipped)}>
                 <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
                     {/* Front */}
                     <div className="absolute inset-0 [backface-visibility:hidden] bg-white border-2 border-indigo-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-md">
                         <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Question</div>
                         <div className="text-xl font-bold text-gray-800 font-ar" dangerouslySetInnerHTML={{ __html: data.frontText || "" }} />
                         <div className="absolute bottom-3 text-[8px] text-gray-300 font-bold uppercase tracking-widest">Click to flip</div>
                     </div>
                     {/* Back */}
                     <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-indigo-600 border-2 border-indigo-700 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white shadow-xl">
                         <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Answer</div>
                         <div className="text-xl font-medium font-ar" dangerouslySetInnerHTML={{ __html: data.backText || "" }} />
                     </div>
                 </div>
             </div>
        </UniversalNodeWrapper>
    );
});

export const TimelineNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={400} minHeight={120} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
             <div className="flex items-center gap-6 overflow-x-auto py-2 custom-scrollbar">
                 {data.timelineEvents?.map((evt, i) => (
                     <div key={i} className="flex flex-col items-center min-w-[140px] group/item">
                         <div className="text-[10px] font-black text-indigo-500 mb-2 uppercase tracking-tighter" dangerouslySetInnerHTML={{ __html: evt.date }} />
                         <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-gray-800 shadow-md transition-transform group-hover/item:scale-125"></div>
                         <div className="h-0.5 w-full bg-indigo-100 dark:bg-gray-700 -mt-2 -z-10"></div>
                         <div className="text-sm font-bold text-gray-700 dark:text-gray-200 text-center mt-3 leading-tight" dangerouslySetInnerHTML={{ __html: evt.title }} />
                     </div>
                 ))}
             </div>
        </UniversalNodeWrapper>
    );
});

export const ListNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    const fontClass = getFontClass(data.title || "");
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={250} minHeight={200} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className={`p-4 border-b bg-gray-50/50 dark:bg-gray-900/50 font-bold text-lg text-gray-800 dark:text-gray-100 ${fontClass}`}>{data.title}</div>
            <ul className="p-6 space-y-2">
                {data.items?.map((item, i) => (
                    <li key={i} className={`flex items-start gap-3 text-gray-600 dark:text-gray-400 ${fontClass}`}>
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                        <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item }}></span>
                    </li>
                ))}
            </ul>
        </UniversalNodeWrapper>
    );
});

export const SketchNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    return (
        <div className={`relative group pointer-events-none transition-opacity duration-200 ${selected ? 'opacity-100 z-50' : 'opacity-90'}`} style={{ width: data.width, height: data.height }}>
             {selected && (
                <button 
                    className="absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-white rounded-full shadow-xl border border-red-50 text-red-400 hover:text-red-600 pointer-events-auto"
                    onClick={() => (window as any).deleteNode?.(id)}
                >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
             )}
             <svg width="100%" height="100%" viewBox={`0 0 ${data.width} ${data.height}`} preserveAspectRatio="none" className="pointer-events-auto filter drop-shadow-sm">
                 <path d={data.svgPath} fill={data.strokeColor || '#333'} stroke="none" opacity={data.isHighlighter ? 0.4 : 1}/>
             </svg>
        </div>
    );
});

export const ThreeDNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={200} minHeight={200} className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
             <div className="text-center p-8">
                 <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500">
                     <i className="fa-solid fa-cube text-3xl"></i>
                 </div>
                 <h4 className="text-gray-500 font-bold text-sm uppercase tracking-widest">{data.content || "3D Object"}</h4>
                 <p className="text-[10px] text-gray-400 mt-1">Experimental View</p>
             </div>
        </UniversalNodeWrapper>
    );
});

export const VideoNode = memo(({ id, data, selected }: NodeProps<ElementData>) => {
    return (
        <UniversalNodeWrapper id={id} data={data} selected={selected} minWidth={320} minHeight={180} className="rounded-2xl overflow-hidden bg-black shadow-2xl">
             {data.videoUrl ? (
                 <video src={data.videoUrl} controls className="w-full h-full object-contain" />
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                     <i className="fa-solid fa-video-slash text-3xl opacity-30"></i>
                     <span className="text-[10px] font-bold uppercase tracking-widest">No video data</span>
                 </div>
             )}
        </UniversalNodeWrapper>
    );
});