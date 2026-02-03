
import React, { useRef, useState, useMemo, createContext, useEffect, memo, useCallback } from 'react';
import { 
    ReactFlow, 
    Background, 
    Controls, 
    MiniMap, 
    ConnectionMode, 
    Panel,
    useReactFlow,
    BackgroundVariant,
    useNodesState,
    useEdgesState
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { getStroke } from 'perfect-freehand';
import { ToolType, ElementData, BoardTheme, ViewMode, LessonData } from '../types';
import { 
  NoteNode, 
  ListNode, 
  ImageNode, 
  WordArtNode, 
  ShapeNode, 
  CodeNode, 
  SketchNode,
  ComparisonNode,
  TextNode,
  ThreeDNode,
  GameNode,
  BookNode,
  FlashcardNode,
  TimelineNode,
  LessonHeaderNode
} from './BoardElements';

// --- Board Context ---
interface BoardContextType {
    viewMode: ViewMode;
}
export const BoardContext = createContext<BoardContextType>({ viewMode: 'standard' });

const nodeTypes: Record<string, any> = {
  note: NoteNode,
  list: ListNode,
  image: ImageNode,
  wordArt: WordArtNode,
  shape: ShapeNode,
  code: CodeNode,
  sketch: SketchNode,
  comparison: ComparisonNode,
  text: TextNode,
  threeD: ThreeDNode,
  game: GameNode,
  book: BookNode,
  flashcard: FlashcardNode,
  timeline: TimelineNode,
  lessonHeader: LessonHeaderNode
};

const getSvgPathFromStroke = (stroke: any[]) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
};

interface InteractionLayerProps {
    activeTool: ToolType;
    penColor: string;
    penSize: number;
    onAddSketch: (node: Node<ElementData>) => void;
}

const InteractionLayer = memo(({ activeTool, penColor, penSize, onAddSketch }: InteractionLayerProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState<number[][]>([]);
    const svgRef = useRef<SVGSVGElement>(null);
    const { getViewport } = useReactFlow();

    const isDrawTool = activeTool === 'pen' || activeTool === 'highlighter';

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isDrawTool) return;
        e.preventDefault();
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        
        const bbox = svgRef.current?.getBoundingClientRect();
        if(!bbox) return;
        const x = e.clientX - bbox.left;
        const y = e.clientY - bbox.top;
        const pressure = e.pressure !== undefined && e.pressure !== 0 ? e.pressure : 0.5;

        setIsDrawing(true);
        setPoints([[x, y, pressure]]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || !isDrawTool) return;
        const bbox = svgRef.current?.getBoundingClientRect();
        if(!bbox) return;

        const nativeEvent = e.nativeEvent as PointerEvent;
        const events = nativeEvent.getCoalescedEvents ? nativeEvent.getCoalescedEvents() : [nativeEvent];
        
        const newPoints = events.map((evt: PointerEvent) => {
            const x = evt.clientX - bbox.left;
            const y = evt.clientY - bbox.top;
            const pressure = evt.pressure !== undefined && evt.pressure !== 0 ? evt.pressure : 0.5;
            return [x, y, pressure];
        });

        setPoints(prev => [...prev, ...newPoints]);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        (e.target as Element).releasePointerCapture(e.pointerId);
        setIsDrawing(false);

        if (points.length > 2) {
            const { x: vpX, y: vpY, zoom } = getViewport();
            const worldPoints = points.map(([x, y, p]) => [(x - vpX) / zoom, (y - vpY) / zoom, p]);

            const currentSize = activeTool === 'highlighter' ? 24 : penSize;
            const options = {
                size: currentSize / zoom, 
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
                simulatePressure: true,
                last: true
            };
            
            const stroke = getStroke(worldPoints, options);
            const xs = stroke.map(p => p[0]);
            const ys = stroke.map(p => p[1]);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            
            const relativeStroke = stroke.map(([x, y]) => [x - minX, y - minY]);
            const pathData = getSvgPathFromStroke(relativeStroke);

            onAddSketch({
                id: `sketch-${Date.now()}`,
                type: 'sketch',
                position: { x: minX, y: minY }, 
                data: {
                    id: `sketch-${Date.now()}`,
                    type: 'sketch',
                    svgPath: pathData,
                    strokeColor: activeTool === 'highlighter' ? 'rgba(255, 235, 59, 0.5)' : penColor,
                    width: Math.max(Math.max(...xs) - minX, 1),
                    height: Math.max(Math.max(...ys) - minY, 1),
                    isHighlighter: activeTool === 'highlighter',
                    isFilled: true
                }
            });
        }
        setPoints([]);
    };

    const currentDrawPath = useMemo(() => {
        if (points.length < 2) return '';
        const currentSize = activeTool === 'highlighter' ? 24 : penSize;
        const stroke = getStroke(points, { size: currentSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 });
        return getSvgPathFromStroke(stroke);
    }, [points, activeTool, penSize]);

    if (!isDrawTool) return null;

    return (
        <div 
            className="absolute inset-0 z-[100] pointer-events-none"
        >
             <svg 
                className="w-full h-full overflow-visible pointer-events-auto cursor-crosshair touch-none"
                ref={svgRef as any}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
             >
                {currentDrawPath && (
                    <path 
                        d={currentDrawPath}
                        fill={activeTool === 'highlighter' ? 'rgba(255, 235, 59, 0.4)' : penColor}
                        stroke="none"
                    />
                )}
            </svg>
        </div>
    );
});

const TimelineView = ({ nodes }: { nodes: Node<ElementData>[] }) => {
    const validNodes = [...nodes]
        .filter(n => n.type !== 'sketch' && n.type !== 'lessonHeader')
        .sort((a, b) => a.position.y - b.position.y);

    return (
        <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-gray-900 px-8 py-24 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-16 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-indigo-100 dark:bg-gray-800 -translate-x-1/2"></div>
                {validNodes.map((node, i) => {
                    const NodeComponent = nodeTypes[node.type || 'note'];
                    return (
                        <div key={node.id} className={`flex items-center gap-12 group ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                            <div className="flex-1">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 scale-90 group-hover:scale-100 transition-transform duration-300 overflow-hidden">
                                    <NodeComponent id={node.id} data={node.data} selected={false} type={node.type} dragging={false} zIndex={0} xPos={0} yPos={0} />
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-indigo-500 shadow-xl z-10 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0">
                                {i + 1}
                            </div>
                            <div className="flex-1 px-4">
                                <div className={`text-[10px] font-black uppercase tracking-widest text-gray-400 ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>{node.type}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface SmartBoardProps {
  nodes: Node<ElementData>[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  activeTool: ToolType;
  onAddSketch: (node: Node<ElementData>) => void;
  setNodes: any;
  onPaneClick: (event: React.MouseEvent) => void;
  penColor?: string;
  penSize?: number;
  onDeleteNode?: (id: string) => void;
  boardTheme: BoardTheme;
  viewMode: ViewMode;
  lessonDetails?: LessonData;
}

const SmartBoard: React.FC<SmartBoardProps> = ({ 
  nodes, edges, onNodesChange, onEdgesChange, onConnect, activeTool, onAddSketch, onPaneClick, penColor = '#000000', penSize = 6, onDeleteNode, boardTheme, viewMode, lessonDetails 
}) => {
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(true); };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
      if (activeTool === 'eraser' && onDeleteNode) onDeleteNode(node.id);
  };

  const handleNodeMouseEnter = (e: React.MouseEvent, node: Node) => {
      if (activeTool === 'eraser' && e.buttons === 1 && onDeleteNode) onDeleteNode(node.id);
  };

  if (viewMode === 'timeline') return <TimelineView nodes={nodes} />;

  const isPanActive = activeTool === 'pan' || isSpacePressed;

  return (
    <BoardContext.Provider value={{ viewMode }}>
    <div className={`w-full h-full relative touch-none bg-white dark:bg-gray-950`} dir="ltr">
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            panOnDrag={isPanActive}
            panOnScroll={false}
            zoomOnScroll={true}
            selectionOnDrag={activeTool === 'pointer'}
            nodesDraggable={activeTool === 'pointer'}
            elementsSelectable={activeTool === 'pointer' || activeTool === 'eraser'}
            onPaneClick={onPaneClick}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            className={`${activeTool === 'pen' ? 'cursor-pen' : activeTool === 'highlighter' ? 'cursor-highlighter' : activeTool === 'eraser' ? 'cursor-eraser' : isPanActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            proOptions={{ hideAttribution: true }}
            defaultViewport={{ x: window.innerWidth / 4, y: 100, zoom: 0.9 }}
        >
            <Background 
                variant={BackgroundVariant.Dots}
                gap={24} 
                size={1.5}
                color={boardTheme === 'dark' ? '#334155' : '#cbd5e1'} 
            />
            <Controls className="!m-6" />
            <MiniMap style={{ height: 100, width: 140 }} zoomable pannable className="!bottom-6 !left-6 border border-gray-200 shadow-xl rounded-xl overflow-hidden" />
            
            {lessonDetails && (
                <Panel position="top-left" className="animate-fade-in-down mt-20 ml-6 pointer-events-none">
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">{lessonDetails.subject}</div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm font-ar-title">{lessonDetails.lessonName}</h1>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                             <span className="flex items-center gap-1"><i className="fa-regular fa-calendar"></i> {lessonDetails.gregorianDateEn}</span>
                             <span className="flex items-center gap-1 font-ar"><i className="fa-regular fa-moon"></i> {lessonDetails.hijriDate}</span>
                        </div>
                    </div>
                </Panel>
            )}
        </ReactFlow>

        <InteractionLayer activeTool={activeTool} penColor={penColor} penSize={penSize} onAddSketch={onAddSketch} />
    </div>
    </BoardContext.Provider>
  );
};

export default SmartBoard;
