import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { History, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setLogs(data);
    setLoading(false);
  }

  const filteredLogs = logs.filter(log => 
    log.editor_name?.includes(search) || 
    log.student_name?.includes(search) || 
    log.student_id?.includes(search)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-500" />
            سجل التغييرات
          </h2>
          <p className="text-slate-500 mt-1">يعرض كافة عمليات الإضافة، التعديل، والحذف التي تمت على النظام</p>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute right-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none" 
            placeholder="ابحث باسم المُعدِّل، الطالب، أو الرقم الجامعي..." 
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center p-8 text-slate-500 font-bold">جاري التحميل...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center p-8 text-slate-500">لا توجد سجلات.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold border-b">الوقت والتاريخ</th>
                  <th className="p-4 font-bold border-b">المُعدِّل (صاحب الإجراء)</th>
                  <th className="p-4 font-bold border-b">نوع الإجراء</th>
                  <th className="p-4 font-bold border-b">الطالب</th>
                  <th className="p-4 font-bold border-b">المادة</th>
                  <th className="p-4 font-bold border-b">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-600 text-xs" dir="ltr">{new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-4 font-bold text-slate-800">{log.editor_name}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        log.action_type === 'إضافة' ? 'bg-green-100 text-green-700' :
                        log.action_type === 'تعديل' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{log.student_name} <br/><span className="text-xs text-slate-500 font-mono">{log.student_id}</span></td>
                    <td className="p-4 text-slate-600 font-bold text-xs">{log.subject_name}</td>
                    <td className="p-4 text-slate-500 text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
