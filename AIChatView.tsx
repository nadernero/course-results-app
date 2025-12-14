import React, { useState, useRef, useEffect } from 'react';
import type { StudentResult } from './types';

// --- SVG Icons (New & Polished) ---
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform -rotate-45" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7a1 1 0 10-2 0v1h-1z" clipRule="evenodd" /></svg>;

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
                        
                        <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] md:max-w-xl shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-gray-200 dark:border-slate-700'
                        }`}>
                            {msg.sender === 'ai' ? (
                                <FormattedText text={msg.text} />
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

