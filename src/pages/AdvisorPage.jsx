import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlusCircle, Search, Save, CheckCircle, X } from 'lucide-react';

export default function AdvisorPage() {
  const [advisorName, setAdvisorName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data);
  }

  async function handleAddSubject() {
    if (!newSubject.trim()) return;
    const { data, error } = await supabase.from('subjects').insert([{ name: newSubject.trim() }]).select();
    if (data && data[0]) {
      setSubjects([...subjects, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedSubjects([...selectedSubjects, data[0].id]);
      setNewSubject('');
    } else if (error) {
      alert('خطأ في إضافة المادة: ' + error.message);
    }
  }

  function toggleSubject(id) {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!advisorName || !studentName || !studentId || !specialty || selectedSubjects.length === 0) {
      return alert('الرجاء إكمال جميع الحقول واختيار مادة واحدة على الأقل');
    }
    
    setIsSubmitting(true);
    const inserts = selectedSubjects.map(subId => ({
      student_name: studentName,
      student_id: studentId,
      specialty: specialty,
      subject_id: subId,
      advisor_name: advisorName
    }));

    const { data: insertedDeps, error } = await supabase.from('deprivations').insert(inserts).select();
    setIsSubmitting(false);

    if (error) {
      alert('حدث خطأ: ' + error.message);
    } else {
      if (insertedDeps) {
        const auditLogs = insertedDeps.map(dep => {
          const sub = subjects.find(s => s.id === dep.subject_id);
          return { action_type: 'إضافة', student_name: dep.student_name, student_id: dep.student_id, subject_name: sub ? sub.name : 'غير معروف', editor_name: advisorName, details: 'إضافة حرمان جديد' };
        });
        supabase.from('audit_logs').insert(auditLogs).then();
      }
      setMessage('تم تسجيل الحرمان بنجاح!');
      setStudentName('');
      setStudentId('');
      setSelectedSubjects([]);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedSubjectObjects = subjects.filter(s => selectedSubjects.includes(s.id));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
          <h1 className="text-xl sm:text-2xl font-bold text-indigo-900">تسجيل حرمان طالب</h1>
          <p className="text-sm text-indigo-700 mt-1">نموذج الإرشاد الأكاديمي لإضافة الطلاب المحرومين</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {message && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-200">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="font-bold text-sm sm:text-base">{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">اسم المرشد الأكاديمي</label>
              <input type="text" value={advisorName} onChange={e => setAdvisorName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="أدخل اسمك هنا..." />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">اسم الطالب</label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="اسم الطالب الثلاثي" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">الرقم الجامعي</label>
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="مثال: 2023101" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">التخصص</label>
              <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="مثال: محاسبة" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-700 block">المواد المحروم منها <span className="text-red-500">*</span></label>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm outline-none" placeholder="ابحث عن مادة..." />
              </div>
            </div>

            <div className="h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
              {filteredSubjects.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">لا توجد مواد مطابقة</div>
              ) : (
                filteredSubjects.map(sub => (
                  <label key={sub.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${selectedSubjects.includes(sub.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-100 border border-transparent'}`}>
                    <input type="checkbox" checked={selectedSubjects.includes(sub.id)} onChange={() => toggleSubject(sub.id)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className={`text-sm font-medium ${selectedSubjects.includes(sub.id) ? 'text-indigo-900 font-bold' : 'text-slate-700'}`}>{sub.name}</span>
                  </label>
                ))
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
              <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="اسم المادة الجديدة..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())} />
              <button type="button" onClick={handleAddSubject} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                <PlusCircle className="w-4 h-4" /> إضافة مادة
              </button>
            </div>
          </div>

          {selectedSubjectObjects.length > 0 && (
            <div className="pt-4 border-t border-slate-100 bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-4">
              <label className="text-sm font-bold text-indigo-900 block mb-3">المواد التي تم اختيارها للحرمان ({selectedSubjectObjects.length}):</label>
              <div className="flex flex-wrap gap-2">
                {selectedSubjectObjects.map(sub => (
                  <span key={sub.id} className="bg-white text-indigo-700 border border-indigo-200 shadow-sm text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                    {sub.name}
                    <button type="button" onClick={() => toggleSubject(sub.id)} className="text-indigo-400 hover:text-red-500 transition-colors focus:outline-none">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-lg">
              <Save className="w-5 h-5" />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
