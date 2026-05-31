import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Printer, Search, Users, Calendar, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ControlPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deprivations, setDeprivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    const { data: subs, error } = await supabase.from('subjects').select('*').order('name');
    if (subs) setSubjects(subs);
    setLoading(false);
  }

  async function fetchDeprivations(subjectId) {
    setLoading(true);
    const { data, error } = await supabase
      .from('deprivations')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });
    
    if (data) setDeprivations(data);
    setLoading(false);
  }

  const handleSubjectSelect = (sub) => {
    setSelectedSubject(sub);
    fetchDeprivations(sub.id);
  };

  const filteredDeps = deprivations.filter(d => 
    d.student_name.includes(search) || d.student_id.includes(search)
  );

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const exportToExcel = () => {
    if (filteredDeps.length === 0) return;
    const data = filteredDeps.map((dep, index) => ({
      'م': index + 1,
      'الرقم الجامعي': dep.student_id,
      'اسم الطالب': dep.student_name,
      'التخصص': dep.specialty,
      'اسم المرشد': dep.advisor_name,
      'تاريخ الإضافة': new Date(dep.created_at).toLocaleDateString('ar-EG')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب المحرومين");
    XLSX.writeFile(wb, `تقرير_الحرمان_${selectedSubject.name}.xlsx`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Subject List */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)] print:hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            المواد الدراسية
          </h2>
        </div>
        
        {/* Subject Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              value={subjectSearch} 
              onChange={e => setSubjectSearch(e.target.value)} 
              className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="ابحث عن مادة..." 
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2 flex-1">
          {loading && !selectedSubject ? (
            <div className="text-center p-4 text-slate-400">جاري التحميل...</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center p-4 text-slate-400 text-sm font-bold">لا توجد مادة مطابقة</div>
          ) : (
            filteredSubjects.map(sub => (
              <button 
                key={sub.id}
                onClick={() => handleSubjectSelect(sub)}
                className={`w-full text-right p-3 rounded-xl mb-1 text-sm font-bold transition-colors ${selectedSubject?.id === sub.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {sub.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Report */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)] print:shadow-none print:border-none print:h-auto">
        {!selectedSubject ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center print:hidden">
            <Users className="w-16 h-16 mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">اختر مادة لعرض التقرير</h3>
            <p>اختر إحدى المواد من القائمة الجانبية لعرض قائمة الطلاب المحرومين فيها.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 rounded-t-2xl print:bg-white print:border-b-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">تقرير الحرمان: {selectedSubject.name}</h2>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                  <Users className="w-4 h-4" /> إجمالي المحرومين: <span className="font-bold text-indigo-600">{deprivations.length} طالب</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <button className="bg-green-600 text-white hover:bg-green-700 border border-green-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2" onClick={exportToExcel}>
                  <FileSpreadsheet className="w-4 h-4" /> تصدير إكسيل
                </button>
                <button className="bg-slate-800 text-white hover:bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> طباعة
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 print:hidden">
              <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute right-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none" 
                  placeholder="ابحث بالاسم أو الرقم الجامعي..." 
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 print:overflow-visible print:p-0">
              {loading ? (
                <div className="text-center p-8 text-slate-500 font-bold">جاري التحميل...</div>
              ) : filteredDeps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <AlertCircle className="w-12 h-12 mb-3 text-slate-200" />
                  <p className="font-bold">لا يوجد طلاب محرومين في هذه المادة.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-none print:rounded-none">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 print:bg-white print:text-black">
                      <tr>
                        <th className="p-4 font-bold border-b">الرقم الجامعي</th>
                        <th className="p-4 font-bold border-b">اسم الطالب</th>
                        <th className="p-4 font-bold border-b">التخصص</th>
                        <th className="p-4 font-bold border-b">اسم المرشد</th>
                        <th className="p-4 font-bold border-b">تاريخ الإضافة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {filteredDeps.map(dep => (
                        <tr key={dep.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-600 print:text-black">{dep.student_id}</td>
                          <td className="p-4 font-bold text-slate-800 print:text-black">{dep.student_name}</td>
                          <td className="p-4 text-slate-600 font-medium print:text-black">{dep.specialty}</td>
                          <td className="p-4">
                            <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold text-xs print:bg-transparent print:p-0 print:text-black">
                              {dep.advisor_name}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium text-xs print:text-black">{new Date(dep.created_at).toLocaleDateString('ar-EG')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
