

export type Language = string;
export type LayoutMode = 'freestyle' | 'diagram' | 'timeline';
// Theme can now be 'default' or 'dark'
export type BoardTheme = 'default' | 'dark'; 
export type ViewMode = 'standard' | 'timeline' | 'panorama';

export type ToolType = 
  | 'pointer' 
  | 'pan' 
  | 'pen' 
  | 'highlighter' 
  | 'eraser'
  | 'add-note'
  | 'add-text'
  | 'add-image'
  | 'ai-image'
  | 'add-shape'
  | 'add-game' 
  | 'add-book'
  | 'add-flashcard';

export type LessonDetail = 'brief' | 'detailed';
export type ToolbarPosition = 'top' | 'left';

export interface TeacherPersona {
  name: string;
  language: Language;
  subject: string; 
  personality: string;
  voice: 'male' | 'female';
}

export type ElementType = 
  | 'note' 
  | 'list' 
  | 'image' 
  | 'wordArt' 
  | 'shape' 
  | 'sketch' 
  | 'code'
  | 'comparison'
  | 'text'
  | 'threeD'
  | 'game' 
  | 'book'
  | 'flashcard' 
  | 'timeline'
  | 'video';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

export interface BookPage {
    content: string; // Text content
    imagePrompt?: string; // For generating images on the fly if needed
    imageUrl?: string;
    audioText?: string; // Specific text for narration
    quiz?: QuizQuestion; // Optional quiz on this page
}

export interface LessonData {
    lessonName: string;
    subject: string;
    startTime: string;
    endTime: string;
    gregorianDateAr: string;
    gregorianDateEn: string;
    hijriDate: string;
}

// React Flow Data Interface
export interface ElementData {
  id: string;
  type: ElementType;
  content?: string;
  items?: string[];
  title?: string;
  url?: string;
  description?: string;
  text?: string;
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  shape3DType?: 'cube' | 'cylinder' | 'button'; 
  code?: string;
  language?: string;
  style?: 'normal' | 'bold' | 'highlight';
  color?: string;
  rotation?: number;
  width?: number;
  height?: number;
  
  // For sketches
  points?: {x: number, y: number}[];
  strokeColor?: string;
  strokeWidth?: number;
  isHighlighter?: boolean;
  svgPath?: string;
  isFilled?: boolean;

  // For comparison tables
  columns?: { title: string; items: string[] }[];

  // For Games
  gameType?: 'math' | 'quiz';
  quizQuestions?: QuizQuestion[];
  htmlGameCode?: string; // Added for HTML Frame support

  // For Books
  bookData?: {
      title: string;
      author?: string;
      coverColor?: string;
      pages: BookPage[];
  };

  // For Flashcards
  frontText?: string;
  backText?: string;

  // For Timelines
  timelineEvents?: { date: string; title: string; description?: string }[];

  // For 3D Elements
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  videoUrl?: string; 
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}