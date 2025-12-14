
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { StudentResult } from './types';
import { utils, writeFile } from 'xlsx';

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

// Close Icon
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.16,3.16a.5.5,0,0,0-.57-.16l-18,4A.5.5,0,0,0,2.5,8v8a.5.5,0,0,0,.16.37.5.5,0,0,0,.38.13l18,4a.5.5,0,0,0,.57-.6V3.5A.5.5,0,0,0,21.16,3.16ZM11,12.1,7.26,14.28,3.5,12.5,7.1,10.59Zm8.5,3.31-3.6-1.74,3.6-1.92ZM18,7.91,14.25,10,11,8.1,14.65,6Z"/></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


interface DetailsModalProps {
    title: string;
    students: StudentResult[];
    onClose: () => void;
    contextTitle?: string;
}

const PAGE_SIZE = 50; // Number of students per page

const DetailsModal: React.FC<DetailsModalProps> = ({ title, students, onClose, contextTitle }) => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isSavingImage, setIsSavingImage] = useState(false);
    const modalContentRef = useRef<HTMLDivElement>(null);
    
    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const displayedStudents = useMemo(() => {
        return students.slice(0, visibleCount);
    }, [students, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    };

    const handleExport = () => {
        const dataToExport = students.map(s => ({
            'الكود': s.code,
            'الاسم': s.name,
            'الخدمة': s.service,
            'الكورس': s.courseName,
            'الدرجة': s.score,
            'الحضور': `${Math.round(s.attendance <= 1 ? s.attendance * 100 : s.attendance)}%`
        }));
    
        const worksheet = utils.json_to_sheet(dataToExport);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Details");
        writeFile(workbook, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
    };

    const handleSaveImage = () => {
        if (!modalContentRef.current || !window.html2canvas) return;
        setIsSavingImage(true);
        
        // Ensure all content is visible for capture if possible, or just capture what's loaded
        // For large lists, html2canvas might clip if not handled carefully, but standard usage captures scrollHeight often.
        // To be safe, we capture the currently rendered view.
        
        const isDark = document.documentElement.classList.contains('dark');

        window.html2canvas(modalContentRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: isDark ? '#0f172a' : '#ffffff', // slate-900 or white
            ignoreElements: (element) => element.classList.contains('no-print-modal'), // Add class to elements to hide
            onclone: (clonedDoc) => {
                const element = clonedDoc.querySelector('[data-modal-content]') as HTMLElement;
                if (element) {
                    element.style.direction = 'rtl';
                    // Force normal spacing and ligatures - essential for Arabic
                    element.style.fontFamily = "'Cairo', 'Arial', sans-serif";
                    element.style.letterSpacing = 'normal'; 
                    element.style.fontVariantLigatures = 'normal';

                    // Target header cells specifically
                    const headers = element.querySelectorAll('th');
                    headers.forEach((th: any) => {
                        th.style.letterSpacing = '0px';
                        th.style.fontVariantLigatures = 'normal';
                        th.style.fontFamily = "'Cairo', 'Arial', sans-serif";
                    });
                }
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            // Sanitize filename: replace special chars with underscore
            const cleanTitle = title.replace(/[^a-z0-9\u0600-\u06FF \-_]/gi, '_');
            const cleanContext = contextTitle ? contextTitle.replace(/[^a-z0-9\u0600-\u06FF \-_]/gi, '_').substring(0, 50) : '';
            link.download = `${cleanContext}_${cleanTitle}.png`;
            link.click();
        }).catch(err => {
            console.error("Error capturing modal:", err);
            alert("حدث خطأ أثناء حفظ الصورة.");
        }).finally(() => {
            setIsSavingImage(false);
        });
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
        >
            <div
                className="bg-white dark:bg-slate-900 p-0 rounded-2xl shadow-xl w-full max-w-4xl m-4 flex flex-col h-[90vh] animate-fade-in-up"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <header className="flex-shrink-0 flex justify-between items-center border-b border-gray-200 dark:border-slate-700 p-4 md:p-6">
                    <div>
                        <h2 id="details-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">{title} ({students.length})</h2>
                        {contextTitle && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">{contextTitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                        aria-label="إغلاق"
                    >
                        <CloseIcon />
                    </button>
                </header>
                
                <main className="flex-grow overflow-y-auto p-4 md:p-6" ref={modalContentRef} data-modal-content dir="rtl">
                    {/* Header for Image Capture Only (can be hidden in normal view if desired, but good to show) */}
                    <div className="mb-4 text-center border-b border-gray-100 dark:border-slate-800 pb-2">
                         <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                         {contextTitle && <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold">{contextTitle}</p>}
                    </div>

                    {students.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                                    <tr>
                                        {/* Removed tracking-wider class which breaks Arabic letters */}
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الاسم</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الخدمة</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الدرجة</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحضور</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الكود</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                    {displayedStudents.map((student, index) => {
                                        const normalizedAttendance = student.attendance <= 1 ? student.attendance * 100 : student.attendance;
                                        return (
                                        <tr key={`${student.code}-${student.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.service}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${student.score === 'غائب' ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{student.score}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${normalizedAttendance < 50 ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200'}`}>{Math.round(normalizedAttendance)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.code || 'N/A'}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات لعرضها لهذه الفئة.</p>
                        </div>
                    )}
                </main>
                <footer className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6 gap-3">
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
                        {students.length > 0 && (
                            <>
                                <button onClick={handleExport} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm">
                                    <ExcelIcon /> تصدير Excel
                                </button>
                                <button onClick={handleSaveImage} disabled={isSavingImage} className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition text-sm disabled:opacity-50">
                                    <CameraIcon /> {isSavingImage ? 'جاري الحفظ...' : 'حفظ كصورة'}
                                </button>
                            </>
                        )}
                    </div>
                    {visibleCount < students.length && (
                        <div className="flex w-full sm:w-auto justify-center sm:justify-end no-print-modal">
                            <button
                                onClick={handleLoadMore}
                                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                تحميل المزيد ({students.length - visibleCount} متبقي)
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>,
        document.body
    );
};

export default DetailsModal;
