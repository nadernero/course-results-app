
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StudentResult, Servant } from './types';
import { utils, writeFile } from 'xlsx';
import ServantProfileModal from './ServantProfileModal';

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.16,3.16a.5.5,0,0,0-.57-.16l-18,4A.5.5,0,0,0,2.5,8v8a.5.5,0,0,0,.16.37.5.5,0,0,0,.38.13l18,4a.5.5,0,0,0,.57-.6V3.5A.5.5,0,0,0,21.16,3.16ZM11,12.1,7.26,14.28,3.5,12.5,7.1,10.59Zm8.5,3.31-3.6-1.74,3.6-1.92ZM18,7.91,14.25,10,11,8.1,14.65,6Z"/></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const gradeOptions = [
    { id: 'all', label: 'الكل' },
    { id: 'perfect', label: 'الدرجة النهائية (100)' },
    { id: 'excellent', label: 'ممتاز (90-99)' },
    { id: 'very_good', label: 'جيد جداً (80-89)' },
    { id: 'good', label: 'جيد (70-79)' },
    { id: 'pass', label: 'مقبول (60-69)' },
    { id: 'below_pass', label: 'راسب (أقل من 60)' },
];

const attendanceOptions = [
    { id: 'all', label: 'الكل' },
    { id: 'absent', label: 'غائب (لم يحضر الامتحان)' },
    { id: '100', label: 'حضور كامل (100%)' },
    { id: '90-99', label: 'حضور ممتاز (90-99%)' },
    { id: '80-89', label: 'حضور جيد جداً (80-89%)' },
    { id: '70-79', label: 'حضور جيد (70-79%)' },
    { id: '60-69', label: 'حضور مقبول (60-69%)' },
    { id: 'below_60', label: 'حضور ضعيف (أقل من 60%)' },
];

interface AdvancedFilterViewProps {
    courseRegistrations: StudentResult[];
    courses: string[];
    services: string[];
}

const PAGE_SIZE = 50;

const AdvancedFilterView: React.FC<AdvancedFilterViewProps> = ({ courseRegistrations, courses, services }) => {
    const [nameSearch, setNameSearch] = useState('');
    const [selectedCourses, setSelectedCourses] = useState<string[]>(['الكل']);
    const [selectedServices, setSelectedServices] = useState<string[]>(['الكل']);
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedAttendance, setSelectedAttendance] = useState('all');
    const [excludedCodes, setExcludedCodes] = useState<Set<string>>(new Set());
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [isExclusionSectionOpen, setIsExclusionSectionOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [selectedServant, setSelectedServant] = useState<Servant | null>(null);

    const handleMultiSelect = (type: 'course' | 'service', value: string) => {
        const currentList = type === 'course' ? selectedCourses : selectedServices;
        const fullList = type === 'course' ? courses : services;
        const setSetter = type === 'course' ? setSelectedCourses : setSelectedServices;

        if (value === 'الكل') {
            setSetter(currentList.includes('الكل') ? [] : [...fullList]);
            return;
        }

        let newSelection = currentList.filter(i => i !== 'الكل');
        if (newSelection.includes(value)) {
            newSelection = newSelection.filter(i => i !== value);
        } else {
            newSelection = [...newSelection, value];
        }

        if (newSelection.length === fullList.length - 1) {
            setSetter([...fullList]);
        } else {
            setSetter(newSelection);
        }
    };

    // Helper function to check if a single record matches current grade/attendance filters
    const matchesFilters = (record: StudentResult, gradeFilter: string, attFilter: string) => {
        // Attendance Filter
        if (attFilter !== 'all') {
            if (attFilter === 'absent') {
                if (record.score !== 'غائب') return false;
            } else {
                if (record.score === 'غائب') return false;
                const att = record.attendance <= 1 ? record.attendance * 100 : record.attendance;
                if (attFilter === '100' && att !== 100) return false;
                if (attFilter === '90-99' && (att < 90 || att >= 100)) return false;
                if (attFilter === '80-89' && (att < 80 || att >= 90)) return false;
                if (attFilter === '70-79' && (att < 70 || att >= 80)) return false;
                if (attFilter === '60-69' && (att < 60 || att >= 70)) return false;
                if (attFilter === 'below_60' && att >= 60) return false;
            }
        }

        // Grade Filter
        if (gradeFilter !== 'all') {
            if (typeof record.score !== 'number') return false;
            const sc = record.score;
            if (gradeFilter === 'perfect' && sc !== 100) return false;
            if (gradeFilter === 'excellent' && (sc < 90 || sc >= 100)) return false;
            if (gradeFilter === 'very_good' && (sc < 80 || sc >= 90)) return false;
            if (gradeFilter === 'good' && (sc < 70 || sc >= 80)) return false;
            if (gradeFilter === 'pass' && (sc < 60 || sc >= 70)) return false;
            if (gradeFilter === 'below_pass' && sc >= 60) return false;
        }

        return true;
    };

    const baseMatches = useMemo(() => {
        // 1. Group registrations by servant code
        const byServant = new Map<string, StudentResult[]>();
        courseRegistrations.forEach(reg => {
            if (!byServant.has(reg.code)) byServant.set(reg.code, []);
            byServant.get(reg.code)!.push(reg);
        });

        const results: (StudentResult & { matchedCourses: string[] })[] = [];
        const isAllCoursesSelected = selectedCourses.includes('الكل');
        const specificCourses = selectedCourses.filter(c => c !== 'الكل');

        byServant.forEach((servantRegs, code) => {
            // Filter by name search
            if (nameSearch && !servantRegs[0].name.toLowerCase().includes(nameSearch.toLowerCase().trim())) return;

            // Filter by service
            const recordServices = servantRegs[0].service.split(' / ').map(s => s.trim());
            const matchesService = selectedServices.includes('الكل') || recordServices.some(s => selectedServices.includes(s));
            if (!matchesService) return;

            if (isAllCoursesSelected) {
                // OR Logic: Find ANY registration that matches filters
                const matchingRegs = servantRegs.filter(r => matchesFilters(r, selectedGrade, selectedAttendance));
                if (matchingRegs.length > 0) {
                    results.push({
                        ...matchingRegs[0], // Represent with first matching
                        matchedCourses: matchingRegs.map(r => r.courseName)
                    });
                }
            } else {
                // AND Logic: Must match in ALL selected specific courses
                const servantCourseMap = new Map(servantRegs.map(r => [r.courseName, r]));
                
                // Check if servant has all selected courses AND each matches filters
                const allMatch = specificCourses.every(courseName => {
                    const reg = servantCourseMap.get(courseName);
                    return reg && matchesFilters(reg, selectedGrade, selectedAttendance);
                });

                if (allMatch) {
                    results.push({
                        ...servantRegs[0], // Use basic info
                        matchedCourses: specificCourses // They matched all of these
                    });
                }
            }
        });

        return results.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }, [courseRegistrations, nameSearch, selectedCourses, selectedServices, selectedGrade, selectedAttendance]);

    const filteredData = useMemo(() => {
        return baseMatches.filter(servant => !excludedCodes.has(servant.code));
    }, [baseMatches, excludedCodes]);

    const displayedData = filteredData.slice(0, visibleCount);

    const toggleExclusion = (code: string) => {
        setExcludedCodes(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const handleExportExcel = () => {
        const dataToExport = filteredData.map(s => ({
            'الكود': s.code,
            'الاسم': s.name,
            'الخدمة': s.service,
            'الكورسات المطابقة': s.matchedCourses.join(' - '),
            'الدرجة (آخر كورس)': s.score,
            'الحضور': `${Math.round(s.attendance <= 1 ? s.attendance * 100 : s.attendance)}%`
        }));
        const worksheet = utils.json_to_sheet(dataToExport);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "UniqueResults");
        writeFile(workbook, `Filtered_Advanced_Results_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleSaveAsImage = () => {
        if (!containerRef.current || !window.html2canvas) return;
        setIsExportingImage(true);

        const activeGradeLabel = gradeOptions.find(o => o.id === selectedGrade)?.label || '';
        const activeAttendanceLabel = attendanceOptions.find(o => o.id === selectedAttendance)?.label || '';
        const activeCourseLabel = selectedCourses.includes('الكل') ? 'جميع الكورسات' : selectedCourses.join(', ');
        const activeServiceLabel = selectedServices.includes('الكل') ? 'جميع الخدمات' : selectedServices.join(', ');
        
        const exportTitle = document.createElement('div');
        exportTitle.className = 'export-title-header';
        exportTitle.innerHTML = `
            <div style="text-align:center; padding: 20px; border-bottom: 2px solid #e2e8f0; margin-bottom: 20px; font-family: 'Cairo', sans-serif;">
                <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 8px;">نتائج البحث المتقدم (مطابقة الكل)</h2>
                <div style="font-size: 14px; color: #64748b; line-height: 1.6; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: right; direction: rtl;">
                    <span><strong>الكورسات:</strong> ${activeCourseLabel}</span>
                    <span><strong>الخدمات:</strong> ${activeServiceLabel}</span>
                    <span><strong>فلتر التقدير:</strong> ${activeGradeLabel}</span>
                    <span><strong>فلتر الحضور:</strong> ${activeAttendanceLabel}</span>
                </div>
                ${!selectedCourses.includes('الكل') ? '<p style="color: #e11d48; font-size: 12px; margin-top: 5px;">* النتائج تشمل من حقق الشروط في كافة الكورسات المحددة معاً.</p>' : ''}
            </div>
        `;
        
        const targetElement = containerRef.current;
        targetElement.prepend(exportTitle);

        window.html2canvas(targetElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            onclone: (clonedDoc) => {
                const elements = clonedDoc.querySelectorAll('th, td, h2, span, p, div');
                elements.forEach((el: any) => {
                    el.style.letterSpacing = 'normal';
                    el.style.fontFamily = "'Cairo', 'Arial', sans-serif";
                    el.style.fontVariantLigatures = 'normal';
                });
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `Advanced_AND_Filter_Results_${Date.now()}.png`;
            link.click();
        }).finally(() => {
            exportTitle.remove();
            setIsExportingImage(false);
        });
    };

    const openProfile = (row: any) => {
        const servantObj: Servant = {
            code: row.code,
            name: row.name,
            mobileNumber: row.mobileNumber || '',
            primaryService: row.service.split(' / ')[0],
            allServices: row.service.split(' / ')
        };
        setSelectedServant(servantObj);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Filters Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-gray-200/80 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <SearchIcon /> بحث وتصفية متقدمة
                    </h2>
                    {!selectedCourses.includes('الكل') && selectedCourses.length > 1 && (
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-xs font-bold rounded-full border border-rose-200">
                            وضع الفلترة الصارمة (AND) مُفعل
                        </span>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Name Search */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">البحث بالاسم</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={nameSearch}
                                onChange={e => setNameSearch(e.target.value)}
                                placeholder="اكتب اسم الخادم..."
                                className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon /></div>
                        </div>
                    </div>

                    {/* Course Filter */}
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">تصفية بالكورس</label>
                        <button 
                            onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                            className="w-full flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        >
                            <span className="truncate">{selectedCourses.length === courses.length ? 'جميع الكورسات' : `محدد (${selectedCourses.filter(c => c !== 'الكل').length})`}</span>
                            <svg className={`h-4 w-4 transform transition-transform ${isCourseDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isCourseDropdownOpen && (
                            <div className="absolute z-30 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto p-2">
                                {courses.map(course => (
                                    <label key={course} className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer text-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedCourses.includes(course)} 
                                            onChange={() => handleMultiSelect('course', course)}
                                            className="h-4 w-4 text-indigo-600 rounded"
                                        />
                                        <span className="mr-3 text-slate-700 dark:text-slate-200">{course}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Service Filter */}
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">تصفية بالخدمة</label>
                        <button 
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                            className="w-full flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        >
                            <span className="truncate">{selectedServices.length === services.length ? 'جميع الخدمات' : `محدد (${selectedServices.filter(s => s !== 'الكل').length})`}</span>
                            <svg className={`h-4 w-4 transform transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isServiceDropdownOpen && (
                            <div className="absolute z-30 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto p-2">
                                {services.map(service => (
                                    <label key={service} className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer text-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedServices.includes(service)} 
                                            onChange={() => handleMultiSelect('service', service)}
                                            className="h-4 w-4 text-indigo-600 rounded"
                                        />
                                        <span className="mr-3 text-slate-700 dark:text-slate-200">{service}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Attendance Filter */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">تصفية بالحضور</label>
                        <select
                            value={selectedAttendance}
                            onChange={e => setSelectedAttendance(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer"
                        >
                            {attendanceOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Grade Filter */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">تصفية بالتقدير</label>
                        <select
                            value={selectedGrade}
                            onChange={e => setSelectedGrade(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer"
                        >
                            {gradeOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Exclusions Sub-section */}
                <div className="mt-6">
                    <button 
                        onClick={() => setIsExclusionSectionOpen(!isExclusionSectionOpen)}
                        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                    >
                        <UserGroupIcon /> تخصيص قائمة الخدام المستبعدين ({excludedCodes.size})
                    </button>
                    {isExclusionSectionOpen && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-3">الخدام الذين تم العثور عليهم (ألغِ تحديد الخادم لاستبعاده من النتائج):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
                                {baseMatches.map(servant => (
                                    <label key={servant.code} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={!excludedCodes.has(servant.code)}
                                            onChange={() => toggleExclusion(servant.code)}
                                            className="h-4 w-4 text-indigo-600 rounded"
                                        />
                                        <span className={`text-xs truncate ${excludedCodes.has(servant.code) ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{servant.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        تم العثور على <span className="font-bold text-indigo-600">{filteredData.length}</span> خادم {selectedCourses.length > 1 && !selectedCourses.includes('الكل') ? 'حققوا الشروط في كافة الكورسات المحددة' : 'يطابق الشروط'}.
                    </p>
                    <div className="flex gap-2">
                        <button onClick={handleExportExcel} className="flex items-center px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-semibold rounded-lg hover:bg-green-200 text-sm transition-all">
                            <ExcelIcon /> تصدير Excel
                        </button>
                        <button onClick={handleSaveAsImage} disabled={isExportingImage} className="flex items-center px-4 py-2 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-semibold rounded-lg hover:bg-sky-200 text-sm transition-all">
                            <CameraIcon /> {isExportingImage ? 'جاري الحفظ...' : 'حفظ كصورة'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div ref={containerRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200/80 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" style={{ letterSpacing: '0' }}>الخادم</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" style={{ letterSpacing: '0' }}>الخدمة</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" style={{ letterSpacing: '0' }}>الكورسات المطابقة</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" style={{ letterSpacing: '0' }}>الحالة والتقدير</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {displayedData.length > 0 ? displayedData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => openProfile(row)} className="text-right group focus:outline-none">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors underline decoration-dotted underline-offset-4">{row.name}</p>
                                            <p className="text-xs text-slate-500 font-mono">{row.code}</p>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[150px] truncate">{row.service}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {row.matchedCourses.map((c, ci) => (
                                                <span key={ci} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] rounded border border-indigo-100 dark:border-indigo-800">{c}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                                row.score === 'غائب' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 
                                                row.score === 100 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30' :
                                                row.score >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-700'
                                            }`}>
                                                {row.score === 'غائب' ? 'غائب' : `الدرجة: ${row.score}`}
                                            </span>
                                            <span className="text-[9px] text-slate-400">
                                                حضور: {Math.round(row.attendance <= 1 ? row.attendance * 100 : row.attendance)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">لا توجد سجلات تطابق فلاتر البحث الحالية.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {visibleCount < filteredData.length && (
                <div className="text-center pb-8">
                    <button 
                        onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                    >
                        تحميل المزيد ({filteredData.length - visibleCount})
                    </button>
                </div>
            )}

            {selectedServant && <ServantProfileModal servant={selectedServant} onClose={() => setSelectedServant(null)} />}
        </div>
    );
};

export default AdvancedFilterView;
