
import React, { useState, useRef, useEffect } from 'react';
import { ProjectData, Task, Meeting, Note, Priority } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { TasksIcon } from './icons/TasksIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TASK_COLORS } from '../constants';

interface AIAssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
}

type ToolWidgetType = 'create_task' | 'schedule_meeting' | 'create_note';

interface ToolCall {
    id: string;
    type: ToolWidgetType;
    args: any;
    status: 'pending' | 'confirmed' | 'cancelled';
    result?: any;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text?: string;
    toolCall?: ToolCall;
}

const CreateTaskWidget: React.FC<{ args: any, onConfirm: (task: Task) => void, onCancel: () => void, people: any[] }> = ({ args, onConfirm, onCancel, people }) => {
    const [name, setName] = useState(args.name || '');
    const [date, setDate] = useState(args.due_date || new Date().toISOString().split('T')[0]);
    const [assigneeName, setAssigneeName] = useState(args.assignee_name || '');
    const [priority, setPriority] = useState<Priority>(args.priority || Priority.Medium);

    const handleConfirm = () => {
        const assignee = people.find(p => p.name.toLowerCase().includes(assigneeName.toLowerCase()))?.id;
        const newTask: Task = {
            id: `t-${Date.now()}`,
            name,
            startDate: new Date(date),
            endDate: new Date(date),
            assignedTo: assignee ? [assignee] : [],
            color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)],
            completion: 0,
            priority,
            tags: []
        };
        onConfirm(newTask);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 mt-2 w-full max-w-xs">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <TasksIcon className="w-5 h-5" />
                <span className="font-semibold text-sm">Create Task</span>
            </div>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Task Name" className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
            <div className="flex gap-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-1/2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-1/2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm">
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <input type="text" value={assigneeName} onChange={e => setAssigneeName(e.target.value)} placeholder="Assignee (optional)" className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
            <div className="flex gap-2 pt-2">
                <button onClick={onCancel} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleConfirm} className="flex-1 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700">Create Task</button>
            </div>
        </div>
    );
}

const ScheduleMeetingWidget: React.FC<{ args: any, onConfirm: (meeting: Meeting) => void, onCancel: () => void, people: any[] }> = ({ args, onConfirm, onCancel, people }) => {
    const [title, setTitle] = useState(args.title || '');
    const [date, setDate] = useState(args.date || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(args.time || '09:00');

    const handleConfirm = () => {
        const newMeeting: Meeting = {
            id: `m-${Date.now()}`,
            title,
            date: new Date(date),
            startTime: time,
            endTime: time, // Default 1h or same for simplicity
            attendees: [], // Could parse args for attendees
            color: '#818cf8',
            agenda: ''
        };
        onConfirm(newMeeting);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 mt-2 w-full max-w-xs">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                <CalendarDaysIcon className="w-5 h-5" />
                <span className="font-semibold text-sm">Schedule Meeting</span>
            </div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting Title" className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
            <div className="flex gap-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-2/3 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-1/3 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
                <button onClick={onCancel} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleConfirm} className="flex-1 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700">Schedule</button>
            </div>
        </div>
    )
}

const CreateNoteWidget: React.FC<{ args: any, onConfirm: (note: Note) => void, onCancel: () => void }> = ({ args, onConfirm, onCancel }) => {
    const [title, setTitle] = useState(args.title || '');
    const [content, setContent] = useState(args.content || '');

    const handleConfirm = () => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title,
            content,
            tags: [],
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        onConfirm(newNote);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 mt-2 w-full max-w-xs">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <DocumentTextIcon className="w-5 h-5" />
                <span className="font-semibold text-sm">Create Note</span>
            </div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note Title" className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Note Content" className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm h-20 resize-none" />
            <div className="flex gap-2 pt-2">
                <button onClick={onCancel} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleConfirm} className="flex-1 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded hover:bg-amber-700">Create Note</button>
            </div>
        </div>
    )
}


const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose, projectData, onSetData }) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'audio'>('chat');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Tool Definitions
    const tools: any[] = [{
        functionDeclarations: [
            {
                name: "create_task",
                description: "Create a new task in the project.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The name of the task" },
                        due_date: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
                        assignee_name: { type: Type.STRING, description: "Name of the person to assign" },
                        priority: { type: Type.STRING, description: "Priority: Low, Medium, High, Urgent" }
                    },
                    required: ["name"]
                }
            },
            {
                name: "schedule_meeting",
                description: "Schedule a new meeting.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Meeting title" },
                        date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                        time: { type: Type.STRING, description: "Start time in HH:MM format" }
                    },
                    required: ["title"]
                }
            },
            {
                name: "create_note",
                description: "Create a new note.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Note title" },
                        content: { type: Type.STRING, description: "Content of the note" }
                    },
                    required: ["title"]
                }
            }
        ]
    }];

    const formatProjectContext = () => {
        const { tasks, notes, meetings, people } = projectData;
        let context = "Project Context:\n";
        context += `Current Date: ${new Date().toDateString()}\n`;
        
        context += "\nTasks:\n";
        tasks.forEach(t => {
            const assignees = people.filter(p => t.assignedTo.includes(p.id)).map(p => p.name).join(', ');
            context += `- ${t.name} (Status: ${t.completion}%, Assigned: ${assignees || 'Unassigned'}, Due: ${t.endDate.toDateString()})\n`;
        });

        context += "\nMeetings:\n";
        meetings.forEach(m => {
            context += `- ${m.title} on ${m.date.toDateString()} at ${m.startTime}\n`;
        });

        context += "\nPeople:\n";
        people.forEach(p => {
            context += `- ${p.name}\n`;
        });

        return context;
    };

    const handleSendMessage = async () => {
        if (!query.trim()) return;

        const userMessage = query;
        setQuery('');
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const context = formatProjectContext();
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: `System: You are a helpful project assistant. Use the provided tools to help the user manage their project. Context:\n\n${context}` }] },
                    // Simplify history for demo - ideally pass full history
                    { role: 'user', parts: [{ text: userMessage }] }
                ],
                config: { tools }
            });

            const call = response.functionCalls?.[0];
            
            if (call) {
                const toolCallMessage: Message = {
                    id: `m-${Date.now()}`,
                    role: 'model',
                    toolCall: {
                        id: call.id || `tc-${Date.now()}`,
                        type: call.name as ToolWidgetType,
                        args: call.args,
                        status: 'pending'
                    }
                };
                setMessages(prev => [...prev, toolCallMessage]);
            } else {
                setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: 'model', text: response.text || "I'm not sure how to help with that." }]);
            }

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'model', text: "Sorry, I encountered an error connecting to the AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToolAction = (messageId: string, status: 'confirmed' | 'cancelled', data?: any) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.toolCall) {
                return {
                    ...msg,
                    toolCall: {
                        ...msg.toolCall,
                        status,
                        result: data
                    }
                };
            }
            return msg;
        }));

        if (status === 'confirmed' && data) {
            onSetData(prev => {
                if (!prev) return null;
                // Determine what to add based on data type
                if ('completion' in data) return { ...prev, tasks: [...prev.tasks, data] };
                if ('startTime' in data) return { ...prev, meetings: [...prev.meetings, data] };
                if ('content' in data) return { ...prev, notes: [...prev.notes, data] };
                return prev;
            });
        }
    };

    // ... Audio generation logic remains same ...
    const handleGenerateAudioOverview = async () => {
        setIsGeneratingAudio(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const context = formatProjectContext();
            const prompt = `Generate a short, engaging audio conversation (podcast style) between two hosts discussing the current status of this project. Highlight key tasks, upcoming deadlines, and any risks based on the data. Keep it under 2 minutes.\n${context}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                contents: [{ parts: [{ text: prompt }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const binaryString = atob(base64Audio);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                
                // Simple WAV header construction for browser playback
                const wavHeader = getWavHeader(len, 24000, 1, 16);
                const wavBlob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
                setAudioUrl(URL.createObjectURL(wavBlob));
            }
        } catch (error) {
            console.error("Audio Generation Error:", error);
            alert("Failed to generate audio overview.");
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    function getWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitDepth: number) {
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);
        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
        };
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
        view.setUint16(32, numChannels * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);
        return buffer;
    }

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 h-full w-[480px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col animate-slide-in-right">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-yellow-300" />
                    <div><h2 className="text-lg font-bold">Project Assistant</h2><p className="text-xs text-blue-100 opacity-90">Powered by Gemini 2.5</p></div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><XCircleIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Chat</button>
                <button onClick={() => setActiveTab('audio')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audio' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Audio Overview</button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800/50">
                {activeTab === 'chat' ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                                    <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p>Ask me to create tasks, meetings, or notes!</p>
                                    <p className="text-xs mt-2">"Add a task for Bob to update the UI tomorrow"</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.toolCall ? (
                                        <div className="max-w-[85%]">
                                            {msg.toolCall.status === 'pending' ? (
                                                <>
                                                    <p className="text-sm text-gray-500 mb-1 ml-1">I can help with that:</p>
                                                    {msg.toolCall.type === 'create_task' && <CreateTaskWidget args={msg.toolCall.args} onConfirm={(task) => handleToolAction(msg.id, 'confirmed', task)} onCancel={() => handleToolAction(msg.id, 'cancelled')} people={projectData.people} />}
                                                    {msg.toolCall.type === 'schedule_meeting' && <ScheduleMeetingWidget args={msg.toolCall.args} onConfirm={(meeting) => handleToolAction(msg.id, 'confirmed', meeting)} onCancel={() => handleToolAction(msg.id, 'cancelled')} people={projectData.people} />}
                                                    {msg.toolCall.type === 'create_note' && <CreateNoteWidget args={msg.toolCall.args} onConfirm={(note) => handleToolAction(msg.id, 'confirmed', note)} onCancel={() => handleToolAction(msg.id, 'cancelled')} />}
                                                </>
                                            ) : (
                                                <div className={`p-3 rounded-xl border text-sm ${msg.toolCall.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-700 dark:border-gray-600'}`}>
                                                    <div className="flex items-center gap-2">
                                                        {msg.toolCall.status === 'confirmed' ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                                                        <span className="font-semibold">{msg.toolCall.status === 'confirmed' ? 'Action Completed' : 'Action Cancelled'}</span>
                                                    </div>
                                                    {msg.toolCall.status === 'confirmed' && <p className="mt-1 text-xs opacity-80">Created: {msg.toolCall.result.name || msg.toolCall.result.title}</p>}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600'}`}>
                                            {msg.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && <div className="flex justify-start"><div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-600"><div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} /></div></div></div>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="relative">
                                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                                <button onClick={handleSendMessage} disabled={!query.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-xl relative group">
                            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-pulse"></div>
                            <SparklesIcon className="w-16 h-16 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Audio Overview</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">Generate a "Deep Dive" audio conversation between two AI hosts summarizing your project's current status.</p>
                        {audioUrl ? (
                            <div className="w-full max-w-sm bg-white dark:bg-gray-700 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 animate-fade-in">
                                <audio controls src={audioUrl} className="w-full" autoPlay />
                                <button onClick={() => setAudioUrl(null)} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Generate New Overview</button>
                            </div>
                        ) : (
                            <button onClick={handleGenerateAudioOverview} disabled={isGeneratingAudio} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-70 disabled:scale-100 flex items-center gap-2">
                                {isGeneratingAudio ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Generating...</> : <><span className="text-xl">▶</span> Generate</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssistantPanel;
