import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';

export default function StudentSearchPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal State
  const [modal, setModal] = useState({ show: false, type: '', dep: null });
  const [editorName, setEditorName] = useState('');
  const [editData, setEditData] = useState({ student_name: '', student_id: '', specialty: '', advisor_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setHasSearched(true);
    const { data, error } = await supabase
      .from('deprivations')
      .select('*, subjects(name)')
      .or(`student_name.ilike.%${search}%,student_id.ilike.%${search}%`)
      .order('created_at', { ascending: false });
    
    if (data) setResults(data);
    setLoading(false);
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
    if (!editorName.trim()) return;
    setIsSubmitting(true);

    try {
      if (modal.type === 'DELETE') {
        await supabase.from('deprivations').delete().eq('id', modal.dep.id);
        await supabase.from('audit_logs').insert([{
          action_type: 'حذف',
          student_name: modal.dep.student_name,
          student_id: modal.dep.student_id,
          subject_name: modal.dep.subjects?.name || 'غير معروف',
          editor_name: editorName,
          details: 'تم حذف الحرمان من صفحة البحث'
        }]);
        setResults(results.filter(d => d.id !== modal.dep.id));
      } else if (modal.type === 'EDIT') {
        await supabase.from('deprivations').update(editData).eq('id', modal.dep.id);
        await supabase.from('audit_logs').insert([{
          action_type: 'تعديل',
          student_name: editData.student_name,
          student_id: editData.student_id,
          subject_name: modal.dep.subjects?.name || 'غير معروف',
          editor_name: editorName,
          details: `تعديل بيانات الطالب (الاسم القديم: ${modal.dep.student_name})`
        }]);
        setResults(results.map(d => d.id === modal.dep.id ? { ...d, ...editData, subjects: d.subjects } : d));
      }
      setModal({ show: false, type: '', dep: null });
    } catch (err) {
      alert('حدث خطأ');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Search className="w-6 h-6 text-indigo-500" />
          البحث عن طالب
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none" 
            placeholder="أدخل اسم الطالب أو الرقم الجامعي للبحث..." 
          />
          <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:bg-indigo-400">
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search className="w-16 h-16 mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-600">ابحث عن أي طالب</h3>
            <p className="mt-2">يمكنك البحث بالاسم أو الرقم الجامعي لمعرفة مواد الحرمان وتعديلها.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertCircle className="w-16 h-16 mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-600">لم يتم العثور على نتائج</h3>
            <p className="mt-2">تأكد من كتابة الاسم أو الرقم الجامعي بشكل صحيح.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold border-b">وقت الإضافة</th>
                  <th className="p-4 font-bold border-b">الرقم الجامعي</th>
                  <th className="p-4 font-bold border-b">اسم الطالب</th>
                  <th className="p-4 font-bold border-b">المادة</th>
                  <th className="p-4 font-bold border-b">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map(dep => (
                  <tr key={dep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-medium text-xs" dir="ltr">{new Date(dep.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-4 font-mono font-bold text-slate-600">{dep.student_id}</td>
                    <td className="p-4 font-bold text-slate-800">{dep.student_name}</td>
                    <td className="p-4 font-bold text-indigo-700 bg-indigo-50 px-3 py-1 my-3 inline-block rounded-lg text-xs">{dep.subjects?.name}</td>
                    <td className="p-4">
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

      {/* Edit/Delete Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                  هل أنت متأكد من حذف حرمان <strong>{modal.dep.subjects?.name}</strong> للطالب <strong>{modal.dep.student_name}</strong>؟ لا يمكن التراجع.
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
