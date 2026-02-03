
import { GoogleGenAI, Modality } from "@google/genai";
import { LessonDetail } from '../types';

// --- Request Queue System ---
interface QueueItem { task: () => Promise<any>; resolve: (value: any) => void; reject: (reason?: any) => void; }
const requestQueue: QueueItem[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;
  const item = requestQueue.shift();
  if (item) {
    try {
      const result = await item.task();
      item.resolve(result);
    } catch (e: any) {
      item.reject(e);
    } finally {
      setTimeout(() => { isProcessing = false; processQueue(); }, 10);
    }
  } else {
    isProcessing = false;
  }
};

const addToQueue = <T>(task: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ task, resolve, reject });
    if (!isProcessing) processQueue();
  });
};

const cleanJsonString = (str: string) => str.replace(/```json/g, '').replace(/```/g, '').trim();

// --- AI ARCHITECT PROMPT ---
const getSystemInstruction = (lang: string, subject: string, detail: LessonDetail) => `
You are **SmartBoard AI**, a World-Class Instructional Designer and Visual Architect.
**Goal:** Create a deeply structured, professional, and visually stunning educational board.
**Audience:** Students who need clear visualization, not just plain text.

**CONTEXT:**
- Language: ${lang}
- Subject: ${subject}
- Detail Level: ${detail} (If 'detailed', go deep into sub-concepts).

**DESIGN RULES (STRICT):**
1.  **HTML FORMATTING:** Always use HTML tags inside content strings for notes and text elements. Use <b>, <i>, <br/>, and <ul><li> for lists.
2.  **NO PLAIN TEXT DUMPS:** Never just create 10 notes of text. Use a variety of elements.
3.  **VISUAL HIERARCHY:**
    -   **Main Title:** ALWAYS use 'addWordArt' (Big, Center, Top).
    -   **Key Concepts:** Use 'addNote' with **BOLD** headers (HTML <b>) and list items.
    -   **Interactive Elements:** Use 'addGame' to create small interactive tools (Calculators, Simulations, Quizzes).
    -   **Comparisons:** If comparing two things (e.g., Animal vs Plant cell), MUST use 'addComparison'.
    -   **Process/History:** If the topic is chronological or a sequence, MUST use 'addTimeline'.
    -   **Imagery:** Always generate an 'addImage' for the central concept.
4.  **COLOR PALETTE (Professional):**
    -   Use soft, professional pastels for backgrounds.
    -   Primary: #E0F2F1, #F3E5F5, #E3F2FD, #FFF3E0.
    -   Avoid neon or clashing colors.
5.  **SPATIAL LAYOUT (GRID-BASED & AUTOMATED):**
    -   Your primary goal is a clean, structured, grid-based layout. Avoid overlapping elements.
    -   **Title ('addWordArt'):** Center at x: 0, y: -400.
    -   **Main Image ('addImage'):** Place directly below the title at x: 0, y: -150.
    -   **Primary Concepts ('addNote'):** Arrange in a horizontal row starting at y: 150.
        -   For 1 note: x: 0.
        -   For 2 notes: x: -250 and x: 250.
        -   For 3 notes: x: -500, x: 0, x: 500.
        -   Adjust widths to fit without overlapping. Default note width is 350.
    -   **Secondary Elements ('addComparison', 'addTimeline', 'addGame'):** Place these in a new row below the primary notes, starting at y: 450. Center them horizontally.
    -   **Connections ('connect'):** After placing nodes, use 'connect' to draw lines between the main image and its related concept notes to show relationships.

**AVAILABLE TOOLS (USE THESE):**
-   **addWordArt**: { text: string, x: number, y: number, color: string } -> For the Lesson Title.
-   **addNote**: { content: string (HTML allowed), x: number, y: number, color: string, width: number, height: number } -> For explanations.
-   **addImage**: { description: string, x: number, y: number, width: number, height: number } -> For visual context.
-   **addComparison**: { title: string, columns: [{title: string, items: string[]}], x: number, y: number } -> For Vs. / Pros & Cons.
-   **addTimeline**: { timelineEvents: [{date: string, title: string, description: string}], x: number, y: number } -> For history/steps.
-   **addMindMap**: { title: string, nodes: [{id: string, label: string}], x: number, y: number } -> For connecting ideas.
-   **addGame**: { 
        gameType: 'custom', 
        htmlGameCode: string, // COMPLETE, SELF-CONTAINED HTML/CSS/JS string for a mini-app (e.g., a calculator, a simple physics sim, a matching game). NO external resources. Inline CSS/JS.
        x: number, y: number, width: number, height: number 
    } -> For checking understanding or simulation.
-   **connect**: { from: id, to: id } -> To link related notes.

**EXAMPLE JSON RESPONSE:**
[
  { "action": "addWordArt", "text": "PHOTOSYNTHESIS", "x": 0, "y": -400, "color": "#2E7D32" },
  { "action": "addImage", "description": "Vector illustration of a sun shining on a green leaf, photosynthesis process, flat design", "x": 0, "y": -150, "width": 400, "height": 300, "id": "img1" },
  { "action": "addNote", "content": "<b>Process:</b><br/>1. Light Absorption<br/>2. Water Splitting<br/>3. Carbon Fixation", "x": -250, "y": 150, "color": "#E8F5E9", "width": 350, "height": 200, "id": "note1" },
  { "action": "addNote", "content": "<b>Outputs:</b><br/>- Oxygen (O₂)<br/>- Glucose (C₆H₁₂O₆)", "x": 250, "y": 150, "color": "#E3F2FD", "width": 350, "height": 200, "id": "note2" },
  { "action": "connect", "from": "img1", "to": "note1" },
  { "action": "connect", "from": "img1", "to": "note2" }
]
`;

export const sendMessageToGemini = async (
  message: string,
  language: string,
  subject: string,
  lessonDetail: LessonDetail,
  onToolCall: (name: string, args: any, originalMessage: string) => Promise<any>
) => {
  return addToQueue(async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return "Please configure your API Key in environment variables.";

      const ai = new GoogleGenAI({ apiKey });
      // Update model to gemini-3-pro-preview for complex reasoning tasks
      const chat = ai.chats.create({ 
        model: "gemini-3-pro-preview",
        config: { 
            systemInstruction: getSystemInstruction(language, subject, lessonDetail),
            responseMimeType: "application/json",
            temperature: 0.4, // Lower temperature for more structured JSON
        },
      });

      const response = await chat.sendMessage({ message });
      const rawText = response.text || "";
      
      let processed = false;
      let replyText = "";
      let commands: any[] = [];

      try {
        const cleanedText = cleanJsonString(rawText);
        
        try {
            const parsed = JSON.parse(cleanedText);
            if (Array.isArray(parsed)) {
                commands = parsed;
            }
        } catch (e) {
            const jsonStart = cleanedText.indexOf('[');
            const jsonEnd = cleanedText.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = cleanedText.substring(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    commands = parsed;
                }
            }
        }

        if (commands.length > 0) {
            processed = true;
            
            const tempIdMap: Record<string, string> = {};
            const edgeCommands: any[] = [];
            const nodeCommands: any[] = [];
            const envCommands: any[] = [];

            // Sort commands
            commands.forEach(cmd => {
                if (['setTheme', 'setViewMode'].includes(cmd.action)) {
                    envCommands.push(cmd);
                } else if (cmd.action === 'connect') {
                    edgeCommands.push(cmd);
                } else if (cmd.action) {
                    nodeCommands.push(cmd);
                }
            });

            // 1. Execute Environment Commands
            for (const env of envCommands) {
                await onToolCall(env.action, env, message);
            }

            // 2. Create Nodes
            for (const node of nodeCommands) {
                const isMove = node.action === 'moveElement';
                const finalId = isMove ? node.id : `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                
                if (node.id && !isMove) {
                    tempIdMap[node.id] = finalId;
                }
                const toolArgs = { ...node, id: finalId };
                await onToolCall(node.action, toolArgs, message);
            }

            // 3. Create Edges
            for (const cmd of edgeCommands) {
                const sourceId = tempIdMap[cmd.from];
                const targetId = tempIdMap[cmd.to];
                if (sourceId && targetId) {
                    await onToolCall('connect', { ...cmd, from: sourceId, to: targetId }, message);
                }
            }
            
            replyText = language.startsWith('ar') ? "تم بناء الهيكل التعليمي." : "Educational structure built.";
        }
      } catch (e) {
          console.warn("Failed to parse JSON commands from response:", rawText, e);
      }

      if (!processed) {
        replyText = rawText;
        if (!replyText.trim()) {
            replyText = language.startsWith('ar') ? "لم أفهم الطلب." : "I didn't understand that.";
        }
      }
      return replyText;

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
         return "I've run out of thinking power (Quota Exceeded). Please check your API Key settings.";
      }
      return `Sorry, an error occurred. (${error.message || 'Error'})`;
    }
  });
};

export const generateImage = async (description: string, options?: { style?: string, aspectRatio?: string }): Promise<string | null> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API Key missing");
            return null;
        }
        const ai = new GoogleGenAI({ apiKey });
        
        const { style = 'educational illustration', aspectRatio = '1:1' } = options || {};
        const enhancedDescription = `${style}, ${description}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: enhancedDescription }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                },
            },
        });

        // Iterate to find the image part, as the response might contain text too.
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }

        console.error("No image data found in Gemini response.");
        return null;

    } catch (error) {
        console.error("Gemini Image Generation Error:", error);
        return null;
    }
};


export const getSpeechAudioData = (text: string, language: string): Promise<string | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: language.startsWith('ar') ? 'Zephyr' : 'Puck' } } }
        }
      });
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      resolve(audioData || null);
    } catch (error: any) {
      if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
          resolve(null);
      } else {
          reject(error);
      }
    }
  });
};
