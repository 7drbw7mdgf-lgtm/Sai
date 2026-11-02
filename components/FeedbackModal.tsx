import React, { useState, useEffect, useRef } from 'react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    screenshotUrl: string | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, screenshotUrl }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [brushColor, setBrushColor] = useState('#ef4444'); // default red
    const [brushSize, setBrushSize] = useState(4);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<string[]>([]); // For undo

    // Draw initial screenshot on canvas
    useEffect(() => {
        if (isOpen && screenshotUrl && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.src = screenshotUrl;
            img.onload = () => {
                // Set canvas size to match image dimensions
                canvas.width = img.naturalWidth || 1280;
                canvas.height = img.naturalHeight || 800;
                
                // Draw screenshot as background
                ctx.drawImage(img, 0, 0);
                
                // Save initial state to history
                setHistory([canvas.toDataURL()]);
            };
            
            // Reset state
            setMessage('');
            setSubmitStatus('idle');
            setStatusMessage('');
        }
    }, [isOpen, screenshotUrl]);

    if (!isOpen) return null;

    // Drawing helpers
    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        // Handle touch events vs mouse events
        let clientX = 0;
        let clientY = 0;
        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const coords = getCoordinates(e);
        if (!coords) return;

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!canvas || !ctx) return;

        const coords = getCoordinates(e);
        if (!coords) return;

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        // Save history state
        const canvas = canvasRef.current;
        if (canvas) {
            setHistory(prev => [...prev, canvas.toDataURL()]);
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!canvas || !ctx) return;

        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        
        const prevImgSrc = newHistory[newHistory.length - 1];
        const img = new Image();
        img.src = prevImgSrc;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    };

    const handleClear = () => {
        if (!screenshotUrl) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!canvas || !ctx) return;

        const img = new Image();
        img.src = screenshotUrl;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHistory([canvas.toDataURL()]);
        };
    };

    const handleSubmit = async () => {
        if (!message.trim()) {
            setSubmitStatus('error');
            setStatusMessage('Please enter a feedback message.');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const canvas = canvasRef.current;
            const annotatedScreenshot = canvas ? canvas.toDataURL('image/png') : null;

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message.trim(),
                    screenshot: annotatedScreenshot,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setSubmitStatus('success');
                setStatusMessage('Feedback successfully saved to project disk!');
                setTimeout(() => {
                    onClose();
                }, 1800);
            } else {
                setSubmitStatus('error');
                setStatusMessage(result.error || 'Failed to submit feedback.');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setSubmitStatus('error');
            setStatusMessage('Failed to communicate with dev server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fade-in p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <header className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-850">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.25.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 9.72c-.773-.56-.375-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                            </svg>
                            Feedback & Bug Annotation
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Draw directly on the screen preview to annotate areas needing updates.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full p-2 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Drawing Area */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 flex flex-col items-center justify-center overflow-hidden">
                        {screenshotUrl ? (
                            <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg overflow-auto max-w-full max-h-full shadow-inner flex items-center justify-center bg-white dark:bg-gray-800">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="cursor-crosshair block max-w-full h-auto object-contain"
                                    style={{ maxHeight: '50vh' }}
                                />
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm">Capturing screenshot...</div>
                        )}
                        
                        {/* Drawing Controls */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md border border-gray-250 dark:border-gray-700">
                            {/* Color selectors */}
                            <div className="flex gap-1.5">
                                {[
                                    { color: '#ef4444', name: 'Red' },
                                    { color: '#3b82f6', name: 'Blue' },
                                    { color: '#10b981', name: 'Green' },
                                    { color: '#eab308', name: 'Yellow' }
                                ].map(item => (
                                    <button
                                        key={item.color}
                                        onClick={() => setBrushColor(item.color)}
                                        className={`w-6 h-6 rounded-full border transition-all ${brushColor === item.color ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: item.color, borderColor: 'rgba(0,0,0,0.1)' }}
                                        title={item.name}
                                    />
                                ))}
                            </div>
                            
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                            
                            {/* Brush size slider */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Size</span>
                                <input
                                    type="range"
                                    min="2"
                                    max="12"
                                    value={brushSize}
                                    onChange={e => setBrushSize(Number(e.target.value))}
                                    className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-xs font-mono text-gray-400 w-4">{brushSize}</span>
                            </div>
                            
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                            
                            {/* Undo / Clear */}
                            <button
                                onClick={handleUndo}
                                disabled={history.length <= 1}
                                className="px-2.5 py-1 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Undo
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-2.5 py-1 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Inputs & Submit Panel */}
                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 p-6 flex flex-col bg-white dark:bg-gray-800">
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Feedback / Annotations Message
                                </label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Explain what is wrong or what needs to be changed in the annotated screenshot..."
                                    className="w-full flex-1 min-h-[150px] md:min-h-[250px] p-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:bg-gray-950 resize-none"
                                />
                            </div>
                        </div>

                        {/* Submission status alerts */}
                        {submitStatus !== 'idle' && (
                            <div className={`mt-4 p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                                submitStatus === 'success' 
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                            }`}>
                                {submitStatus === 'success' ? (
                                    <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>Submit</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
