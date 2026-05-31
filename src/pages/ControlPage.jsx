import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Printer, Search, Users, Calendar, AlertCircle, FileSpreadsheet, Edit, Trash2, X, History } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ControlPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deprivations, setDeprivations] = useState([]);
  const [subjectLogs, setSubjectLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Modal State
  const [modal, setModal] = useState({ show: false, type: '', dep: null });
  const [editorName, setEditorName] = useState('');
  const [editData, setEditData] = useState({ student_name: '', student_id: '', specialty: '', advisor_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function fetchSubjectLogs(subjectName) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('subject_name', subjectName)
      .order('created_at', { ascending: false });
    if (data) setSubjectLogs(data);
  }

  const handleSubjectSelect = (sub) => {
    setSelectedSubject(sub);
    fetchDeprivations(sub.id);
    fetchSubjectLogs(sub.name);
  };

  const openModal = (type, dep) => {
    setModal({ show: true, type, dep });
    setEditorName('');
    if (type === 'EDIT') {
      setEditData({
        student_name: dep.student_name,
        student_id: dep.student_id,
        specialty: dep.specialty,
        advisor_name: dep.advisor_name
      });
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!editorName.trim()) {
      alert('يجب إدخال اسمك لتسجيل الإجراء');
      return;
    }
    setIsSubmitting(true);

    try {
      if (modal.type === 'DELETE') {
        const { error: delError } = await supabase.from('deprivations').delete().eq('id', modal.dep.id);
        if (!delError) {
          const newLog = {
            action_type: 'حذف',
            student_name: modal.dep.student_name,
            student_id: modal.dep.student_id,
            subject_name: selectedSubject.name,
            editor_name: editorName,
            details: 'تم حذف الحرمان من التقرير'
          };
          const { data: logData } = await supabase.from('audit_logs').insert([newLog]).select();
          setDeprivations(deprivations.filter(d => d.id !== modal.dep.id));
          if (logData) setSubjectLogs([logData[0], ...subjectLogs]);
        }
      } else if (modal.type === 'EDIT') {
        const { error: editError } = await supabase.from('deprivations').update(editData).eq('id', modal.dep.id);
        if (!editError) {
          const newLog = {
            action_type: 'تعديل',
            student_name: editData.student_name,
            student_id: editData.student_id,
            subject_name: selectedSubject.name,
            editor_name: editorName,
            details: `تعديل بيانات الطالب (الاسم القديم: ${modal.dep.student_name})`
          };
          const { data: logData } = await supabase.from('audit_logs').insert([newLog]).select();
          setDeprivations(deprivations.map(d => d.id === modal.dep.id ? { ...d, ...editData } : d));
          if (logData) setSubjectLogs([logData[0], ...subjectLogs]);
        }
      }
      setModal({ show: false, type: '', dep: null });
    } catch (err) {
      alert('حدث خطأ');
    }
    setIsSubmitting(false);
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
      'تاريخ ووقت الإضافة': new Date(dep.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
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
          <div className="flex-1 overflow-y-auto flex flex-col print:block">
            {/* Report Header */}
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

            {/* Search Deprivations */}
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

            {/* Students Table */}
            <div className="p-4 print:p-0">
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
                        <th className="p-4 font-bold border-b">تاريخ ووقت الإضافة</th>
                        <th className="p-4 font-bold border-b">الرقم الجامعي</th>
                        <th className="p-4 font-bold border-b">اسم الطالب</th>
                        <th className="p-4 font-bold border-b">التخصص</th>
                        <th className="p-4 font-bold border-b">اسم المرشد</th>
                        <th className="p-4 font-bold border-b print:hidden">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {filteredDeps.map(dep => (
                        <tr key={dep.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-500 font-medium text-xs print:text-black" dir="ltr">{new Date(dep.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="p-4 font-mono font-bold text-slate-600 print:text-black">{dep.student_id}</td>
                          <td className="p-4 font-bold text-slate-800 print:text-black">{dep.student_name}</td>
                          <td className="p-4 text-slate-600 font-medium print:text-black">{dep.specialty}</td>
                          <td className="p-4">
                            <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold text-xs print:bg-transparent print:p-0 print:text-black">
                              {dep.advisor_name}
                            </span>
                          </td>
                          <td className="p-4 print:hidden">
                            <div className="flex gap-2">
                              <button onClick={() => openModal('EDIT', dep)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                              <button onClick={() => openModal('DELETE', dep)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Audit Logs Section inside the Report */}
            {!loading && subjectLogs.length > 0 && (
              <div className="mt-8 p-4 border-t-4 border-slate-100 print:hidden bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-indigo-500" />
                  سجل التغييرات لهذه المادة
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold border-b">الوقت</th>
                        <th className="p-3 font-bold border-b">نوع الإجراء</th>
                        <th className="p-3 font-bold border-b">المُعدِّل</th>
                        <th className="p-3 font-bold border-b">الطالب</th>
                        <th className="p-3 font-bold border-b">تفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjectLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-500 text-xs" dir="ltr">{new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              log.action_type === 'إضافة' ? 'bg-green-100 text-green-700' :
                              log.action_type === 'تعديل' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-700 text-xs">{log.editor_name}</td>
                          <td className="p-3 font-bold text-slate-700 text-xs">{log.student_name} <br/><span className="font-mono text-slate-400">{log.student_id}</span></td>
                          <td className="p-3 text-slate-500 text-xs">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* Edit/Delete Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className={`p-4 border-b ${modal.type === 'DELETE' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'} flex justify-between items-center`}>
              <h3 className={`font-bold ${modal.type === 'DELETE' ? 'text-red-800' : 'text-blue-800'}`}>
                {modal.type === 'DELETE' ? 'تأكيد الحذف' : 'تعديل بيانات الحرمان'}
              </h3>
              <button onClick={() => setModal({show: false})} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAction} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">اسمك (صاحب التعديل/الحذف) <span className="text-red-500">*</span></label>
                <input required type="text" value={editorName} onChange={e=>setEditorName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="أدخل اسمك لتسجيل العملية..." />
              </div>
              
              {modal.type === 'EDIT' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">اسم الطالب</label>
                    <input required type="text" value={editData.student_name} onChange={e=>setEditData({...editData, student_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">الرقم الجامعي</label>
                      <input required type="text" value={editData.student_id} onChange={e=>setEditData({...editData, student_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">التخصص</label>
                      <input required type="text" value={editData.specialty} onChange={e=>setEditData({...editData, specialty: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                  </div>
                </>
              )}
              
              {modal.type === 'DELETE' && (
                <p className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  هل أنت متأكد من حذف الحرمان للطالب <strong>{modal.dep.student_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              )}

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={isSubmitting} className={`flex-1 font-bold py-2.5 rounded-xl text-white ${modal.type === 'DELETE' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}>
                  {isSubmitting ? 'جاري التنفيذ...' : (modal.type === 'DELETE' ? 'تأكيد الحذف' : 'حفظ التعديلات')}
                </button>
                <button type="button" onClick={() => setModal({show: false})} className="px-5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
