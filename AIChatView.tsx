
import React, { useState, useRef, useEffect } from 'react';
import type { StudentResult } from './types';
import { useToast } from './ToastProvider';

// --- SVG Icons (New & Polished) ---
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform -rotate-45" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7a1 1 0 10-2 0v1h-1z" clipRule="evenodd" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>;
const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

interface AIChatViewProps {
    students: StudentResult[];
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

// --- Text Formatter Component ---
// This component parses the raw text from AI and renders it beautifully
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    
    return (
        <div className="space-y-1.5 text-[15px] leading-relaxed">
            {lines.map((line, index) => {
                const trimmedLine = line.trim();
                
                // 1. Handle Bullet Points (starts with - or *)
                if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                    const content = trimmedLine.substring(2);
                    return (
                        <div key={index} className="flex items-start gap-2 mr-1">
                            <span className="text-indigo-400 mt-2 text-[10px]">●</span>
                            <span className="flex-1" dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
                        </div>
                    );
                }
                
                // 2. Handle Headings (ends with :) or Numbered Lists (1. )
                if (trimmedLine.endsWith(':') || /^\d+\./.test(trimmedLine)) {
                     return (
                        <p key={index} className="font-bold text-indigo-700 dark:text-indigo-300 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: parseBold(trimmedLine) }} />
                     );
                }
                
                // 3. Empty lines
                if (trimmedLine === '') return <div key={index} className="h-1"></div>;

                // 4. Regular Paragraphs
                return <p key={index} dangerouslySetInnerHTML={{ __html: parseBold(line) }} />;
            })}
        </div>
    );
};

// Helper to replace **text** with <strong>text</strong> safely
const parseBold = (text: string) => {
    // Basic sanitization
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Replace **bold** markers with HTML strong tags
    return safeText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-900 dark:text-indigo-100">$1</strong>');
};

export const AIChatView: React.FC<AIChatViewProps> = ({ students }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'أهلاً بك يا خادم الرب! ✝️\nأنا مساعدك الذكي لتحليل بيانات الخدمة.\n\nيمكنك سؤالي عن:\n- **إحصائيات الحضور والغياب** 📊\n- **أداء الخدام في الكورسات** ⭐\n- **مقارنات بين الخدمات** ⚖️\n\nكيف يمكنني مساعدتك اليوم؟' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
        if (e) e.preventDefault();
        const textToSend = customInput || input;
        
        if (!textToSend.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        try {
            const systemInstruction = `
            أنت "مساعد الخدمة الذكي"، خبير تحليل بيانات ومشرف روحي في "مجتمع يسوع".
            دورك ليس فقط سرد البيانات، بل تحليلها بعمق لتقديم رؤية شاملة تساعد في بناء الخدام.
            
            **البيانات المتاحة:**
            لديك قائمة بنتائج الكورسات (StudentResult). كل سطر يمثل كورس واحد أخذه الخادم. الخادم الواحد قد يكون له عدة أسطر (عدة كورسات).
            
            **مهامك عند السؤال عن خادم معين:**
            1.  **تجميع البيانات:** ابحث عن كل الكورسات التي أخذها هذا الخادم واجمعها ذهنياً.
            2.  **تحليل الأداء (نقاط القوة):**
                * هل درجاته مرتفعة (فوق 85%)؟ -> هذا يدل على اجتهاد واستيعاب ممتاز.
                * هل حضوره كامل أو شبه كامل؟ -> هذا يدل على التزام وجدية في الخدمة.
            3.  **تحليل الفجوات (نقاط الضعف):**
                * هل هناك غياب متكرر؟ -> مشكلة في الالتزام بالوقت أو ظروف خاصة.
                * هل درجاته منخفضة في كورسات معينة؟ -> ربما يحتاج مساعدة في هذه الموضوعات.
                * هل هو "غائب" في الامتحان؟ -> يحتاج لمتابعة لعمل تعويض.
            4.  **تقديم الحلول:** اقترح حلولاً عملية (مثلاً: "يحتاج لمكالمة افتقاد لمعرفة سبب الغياب"، "نقترح عليه مراجعة مادة العقيدة").
            5.  **التشجيع:** قدم كلمة تشجيعية أو آية تناسب حالته.
            
            **هيكل الإجابة المطلوب (استخدم هذا التنسيق دائماً):**
            
            👤 **تحليل شامل للخادم: [اسم الخادم]**
            
            📊 **ملخص الأداء:**
            * **عدد الكورسات:** [العدد]
            * **متوسط الدرجات:** [حساب المتوسط]%
            * **نسبة الالتزام بالحضور:** [حساب متوسط الحضور]%
            
            ⭐ **نقاط القوة:**
            * (استخرج نقاط القوة هنا، مثلاً: "ملتزم جداً بالحضور"، "درجات متميزة في اللاهوت")
            
            ⚠️ **ملاحظات تحتاج تطوير:**
            * (استخرج السلبيات بأسلوب لطيف، مثلاً: "انخفاض في درجات كورس كذا"، "تغيب عن الامتحان")
            
            💡 **التوصيات والحلول:**
            * (قدم نصائح عملية للمسؤول عنه، مثلاً: "يُفضل تكليفه بمهام بحثية لتنمية معرفته"، "يجب الاتصال به للاطمئنان")
            
            🌟 **رسالة للخادم:**
            * (اكتب رسالة قصيرة موجهة للخادم نفسه تشجعه فيها بناءً على مستواه)
            
            ---
            **قواعد عامة:**
            * إذا كان الاسم ثنائياً في السؤال (مثل "مينا مجدي") والبيانات ثلاثية، اعتبره نفس الشخص.
            * تغاضَ عن أخطاء الهمزات والياء (ي/ى).
            * كن مشجعاً ومحترفاً في نفس الوقت.
            
            البيانات: ${JSON.stringify(students)}`;
            
            // Using the proxy function directly (same as App.tsx logic)
            const response = await fetch('/.netlify/functions/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: `${systemInstruction}\n\nسؤال المستخدم: ${userMessage.text}` }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const text = data.text;

            if (!text) throw new Error("No text found");

            setMessages(prev => [...prev, { sender: 'ai', text }]);

        } catch (err: any) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { sender: 'ai', text: "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleShareWhatsApp = (text: string) => {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast("تم نسخ النص!", "success");
        });
    };

    const handleSaveImage = (index: number) => {
        const element = document.getElementById(`msg-content-${index}`);
        if (!element || !window.html2canvas) return;

        // Force a specific font stack and text direction for proper rendering
        const isDark = document.documentElement.classList.contains('dark');
        const backgroundColor = isDark ? '#1e293b' : '#ffffff';

        window.html2canvas(element, {
            scale: 2, // High quality
            useCORS: true,
            backgroundColor: backgroundColor,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById(`msg-content-${index}`);
                if (el) {
                    el.style.direction = 'rtl';
                    el.style.fontFamily = "'Cairo', 'Tajawal', sans-serif";
                    // Ensure text is visible
                    el.style.color = isDark ? '#e2e8f0' : '#374151';
                }
            },
            ignoreElements: (node) => {
                // Ignore the buttons container
                return node.classList.contains('actions-bar');
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `analysis-result-${index}.png`;
            link.click();
        });
    };
    
    const suggestedPrompts = [
        "من هم أعلى 5 خدام في الدرجات؟ 🏆",
        "كم عدد الخدام في كل خدمة؟ 📊",
        "أعطني قائمة بالخدام الغائبين ⚠️",
        "ما هو متوسط الحضور العام؟ 📉",
    ];

    return (
        <div className="flex flex-col h-[600px] max-h-[75vh] bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3 shadow-sm z-10">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                    <SparklesIcon />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">المساعد الذكي</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">متاح لتحليل البيانات فورياً</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900 scroll-smooth">
                {messages.map((msg, index) => (
                     <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-up`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-slate-700 ${msg.sender === 'ai' ? 'bg-white dark:bg-slate-800 text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                            {msg.sender === 'ai' ? <BotIcon/> : <UserIcon/>}
                        </div>
                        
                        <div 
                            id={`msg-content-${index}`} 
                            className={`px-5 py-3.5 rounded-2xl max-w-[85%] md:max-w-xl shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-gray-200 dark:border-slate-700'
                        }`}>
                            {msg.sender === 'ai' ? (
                                <>
                                    <FormattedText text={msg.text} />
                                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 actions-bar">
                                        <button onClick={() => handleSaveImage(index)} title="حفظ كصورة" className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                            <CameraIcon />
                                        </button>
                                        <button onClick={() => handleCopy(msg.text)} title="نسخ" className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                            <ClipboardIcon />
                                        </button>
                                        <button onClick={() => handleShareWhatsApp(msg.text)} title="إرسال عبر واتس آب" className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                            <WhatsAppIcon />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-[15px]">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex items-start gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200 dark:border-slate-700">
                            <BotIcon/>
                        </div>
                        <div className="px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 rounded-tl-none shadow-sm border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
            {/* Suggested Prompts (Chips) */}
            {!isLoading && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient">
                        {suggestedPrompts.map((prompt, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSendMessage(undefined, prompt)} 
                                className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full border border-indigo-100 dark:border-slate-600 transition-colors shadow-sm whitespace-nowrap"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اكتب سؤالك هنا..." 
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-black focus:border-indigo-500 rounded-xl focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-gray-400 transition-all shadow-inner text-sm"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()} 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <SendIcon />}
                    </button>
                </form>
            </div>
        </div>
    );
};
