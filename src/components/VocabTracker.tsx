import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Trash2, Edit2, Search, Filter, X, CheckCircle2, BookMarked, Sparkles, TrendingUp, Users, ChevronDown, Wand2, Loader2 } from 'lucide-react';
import { getGenerativeModel } from 'firebase/ai';
import { ai, vocabDb } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Student, VocabWord } from '../types';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { getAvatarColor } from './StudentManagementUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  students: Student[];
  vocab: VocabWord[];
  addVocab: (word: VocabWord) => Promise<void>;
  updateVocab: (word: VocabWord) => Promise<void>;
  deleteVocab: (id: string) => Promise<void>;
}

type VocabLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type VocabStatus = 'new' | 'learning' | 'mastered';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS: VocabLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_COLORS: Record<VocabLevel, string> = {
  A1: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  A2: 'bg-green-100 text-green-800 border-green-200',
  B1: 'bg-sky-100 text-sky-800 border-sky-200',
  B2: 'bg-blue-100 text-blue-800 border-blue-200',
  C1: 'bg-violet-100 text-violet-800 border-violet-200',
  C2: 'bg-purple-100 text-purple-800 border-purple-200',
};

const STATUS_CONFIG: Record<VocabStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new:      { label: 'Từ mới',    color: 'bg-amber-100 text-amber-800 border-amber-200',   icon: <Sparkles className="w-3 h-3" /> },
  learning: { label: 'Đang học',  color: 'bg-sky-100 text-sky-800 border-sky-200',         icon: <BookOpen className="w-3 h-3" /> },
  mastered: { label: 'Đã thuộc', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
};

const CATEGORIES = ['Giao tiếp', 'Học thuật', 'Công việc', 'Du lịch', 'Gia đình', 'Thực phẩm', 'Thể thao', 'Công nghệ', 'Khác'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorClass }: { label: string; value: number; sub?: string; colorClass: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 flex flex-col gap-1 ${colorClass}`}
    >
      <p className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </motion.div>
  );
}

const VocabCard: React.FC<{
  word: VocabWord;
  student?: Student;
  onEdit: () => void;
  onDelete: () => void;
  onStatusCycle: () => void;
}> = ({
  word,
  student,
  onEdit,
  onDelete,
  onStatusCycle,
}) => {
  const statusCfg = STATUS_CONFIG[word.status as VocabStatus];
  const levelColor = LEVEL_COLORS[word.level as VocabLevel] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  const avatarClass = student ? getAvatarColor(student.id) : 'bg-sky-100 text-sky-700';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/70 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 shadow-[0_2px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_4px_20px_rgba(14,165,233,0.12)] hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Word + level */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-lg font-extrabold text-sky-950 tracking-tight">{word.word}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${levelColor}`}>{word.level}</span>
          </div>
          {/* Meaning */}
          <p className="text-sm text-sky-700/80 font-medium mb-2 line-clamp-2">{word.meaning}</p>
          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge — clickable to cycle */}
            <button
              onClick={onStatusCycle}
              title="Nhấn để đổi trạng thái"
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.color}`}
            >
              {statusCfg.icon}
              {statusCfg.label}
            </button>
            {word.category && (
              <span className="text-[11px] text-sky-500 font-medium bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">{word.category}</span>
            )}
            {student && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${avatarClass}`}>
                {student.name}
              </span>
            )}
          </div>
          {word.notes && (
            <p className="text-xs text-sky-400 mt-1.5 italic line-clamp-1">💬 {word.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-sky-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="Xóa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Vocab Form Modal ─────────────────────────────────────────────────────────

function VocabFormModal({
  isOpen,
  onClose,
  onSave,
  students,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: VocabWord) => Promise<void>;
  students: Student[];
  initial?: VocabWord;
}) {
  const [form, setForm] = useState<Partial<VocabWord>>(
    initial ?? { level: 'B1', status: 'new', category: '' }
  );
  const [saving, setSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleAutoFill = async () => {
    if (!form.word?.trim()) {
      toast.warning("Vui lòng nhập từ vựng trước khi tự động điền");
      return;
    }
    const word = form.word.trim().toLowerCase();
    setIsAutoFilling(true);
    toast.loading("Đang tra cứu và dịch nghĩa...", { id: "autofill" });
    
    try {
      let foundInGlobal = false;
      try {
        console.log("Checking global dictionary for:", word);
        const globalRef = collection(vocabDb, 'global_dictionary');
        const q = query(globalRef, where('word', '==', word));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setForm(prev => ({
            ...prev,
            meaning: data.meaning || prev.meaning,
            level: data.level || prev.level,
            category: data.category || prev.category,
            notes: data.notes || prev.notes,
          }));
          foundInGlobal = true;
          toast.success("Tìm thấy từ vựng trong kho Global!", { id: "autofill" });
        }
      } catch (err: any) {
        console.error("Error reading global dictionary:", err);
        // Do not crash the process, we will try to use AI next
      }

      if (!foundInGlobal) {
        console.log("Not found in global dictionary, generating with AI...");
        const model = getGenerativeModel(ai, {
          model: 'gemini-1.5-flash',
          systemInstruction: `Bạn là một chuyên gia ngôn ngữ tiếng Anh. Trả về ĐÚNG MỘT chuỗi JSON hợp lệ, không giải thích gì thêm. Format:
{"meaning": "nghĩa tiếng Việt ngắn gọn, dễ hiểu", "level": "B1" (chỉ chọn A1/A2/B1/B2/C1/C2), "category": "Khác" (chọn Giao tiếp/Học thuật/Công việc/Du lịch/Gia đình/Thực phẩm/Thể thao/Công nghệ/Khác), "notes": "một ví dụ đặt câu ngắn"}`
        });
        
        const result = await model.generateContent(`Từ vựng cần phân tích: "${word}"`);
        let reply = result.response.text() || '';
        console.log("AI reply:", reply);
        
        // Clean JSON formatting
        if (reply.includes('{')) {
          const startIdx = reply.indexOf('{');
          const endIdx = reply.lastIndexOf('}') + 1;
          reply = reply.substring(startIdx, endIdx);
        }
        
        const parsed = JSON.parse(reply.trim());
        setForm(prev => ({
          ...prev,
          meaning: parsed.meaning || prev.meaning,
          level: parsed.level || prev.level,
          category: parsed.category || prev.category,
          notes: parsed.notes || prev.notes,
        }));
        
        toast.success("Dịch nghĩa từ vựng thành công!", { id: "autofill" });

        // Save back to global dictionary
        try {
          const newDocRef = doc(collection(vocabDb, 'global_dictionary'));
          await setDoc(newDocRef, {
            word: word,
            meaning: parsed.meaning || '',
            level: parsed.level || 'B1',
            category: parsed.category || '',
            notes: parsed.notes || '',
            createdAt: new Date().toISOString()
          });
          console.log("Saved to global dictionary");
        } catch (err: any) {
          console.error("Error saving to global dictionary:", err);
        }
      }
    } catch (err: any) {
      console.error("Auto fill error:", err);
      toast.error(`Lỗi tự động điền: ${err?.message || err}`, { id: "autofill" });
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Reset when opening/closing
  React.useEffect(() => {
    setForm(initial ?? { level: 'B1', status: 'new', category: '' });
  }, [initial, isOpen]);

  const set = (key: keyof VocabWord, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.word?.trim() || !form.meaning?.trim() || !form.studentId) return;
    setSaving(true);
    const word: VocabWord = {
      id: initial?.id ?? `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentId: form.studentId!,
      word: form.word!.trim(),
      meaning: form.meaning!.trim(),
      level: (form.level ?? 'B1') as VocabLevel,
      status: (form.status ?? 'new') as VocabStatus,
      notes: form.notes?.trim() ?? '',
      category: form.category ?? '',
      dateAdded: initial?.dateAdded ?? new Date().toISOString(),
    };
    await onSave(word);
    setSaving(false);
    onClose();
  };

  const isValid = !!form.word?.trim() && !!form.meaning?.trim() && !!form.studentId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
      maxWidth="md"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Thêm từ'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Student */}
        <div>
          <label className="block text-sm font-semibold text-sky-900 mb-1.5">Học viên *</label>
          <select
            value={form.studentId ?? ''}
            onChange={e => set('studentId', e.target.value)}
            className="w-full rounded-2xl border border-sky-200 bg-white/70 px-4 py-2.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="">— Chọn học viên —</option>
            {students.filter(s => s.status !== 'inactive').map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Word */}
        <div>
          <label className="block text-sm font-semibold text-sky-900 mb-1.5">Từ vựng *</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. ubiquitous"
                value={form.word ?? ''}
                onChange={e => set('word', e.target.value)}
              />
            </div>
            <Button 
              type="button"
              variant="secondary" 
              onClick={handleAutoFill} 
              disabled={!form.word?.trim() || isAutoFilling}
              className="px-3 border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-2xl"
              title="Tự động điền bằng AI"
            >
              {isAutoFilling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Meaning */}
        <div>
          <label className="block text-sm font-semibold text-sky-900 mb-1.5">Nghĩa / Giải thích *</label>
          <Input
            placeholder="e.g. có mặt khắp nơi, phổ biến"
            value={form.meaning ?? ''}
            onChange={e => set('meaning', e.target.value)}
          />
        </div>

        {/* Level + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-sky-900 mb-1.5">Cấp độ</label>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => set('level', l)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                    form.level === l
                      ? LEVEL_COLORS[l] + ' shadow-sm scale-105'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-sky-900 mb-1.5">Trạng thái</label>
            <div className="flex flex-col gap-1">
              {(Object.entries(STATUS_CONFIG) as [VocabStatus, typeof STATUS_CONFIG['new']][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => set('status', key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all text-left ${
                    form.status === key ? cfg.color + ' shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cfg.icon}{cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-sky-900 mb-1.5">Chủ đề</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => set('category', form.category === c ? '' : c)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  form.category === c
                    ? 'bg-sky-100 text-sky-800 border-sky-200 shadow-sm'
                    : 'bg-white text-sky-600 border-sky-100 hover:bg-sky-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-sky-900 mb-1.5">Ghi chú</label>
          <textarea
            placeholder="Ví dụ sử dụng, ngữ cảnh..."
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-sky-200 bg-white/70 px-4 py-2.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VocabTracker({ students, vocab, addVocab, updateVocab, deleteVocab }: Props) {
  const [search, setSearch] = useState('');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingWord, setEditingWord] = useState<VocabWord | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = vocab.length;
    const mastered = vocab.filter(v => v.status === 'mastered').length;
    const learning = vocab.filter(v => v.status === 'learning').length;
    const newWords = vocab.filter(v => v.status === 'new').length;
    return { total, mastered, learning, newWords };
  }, [vocab]);

  // Per-student word count (for the student filter dropdown)
  const studentWordCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vocab.forEach(v => { counts[v.studentId] = (counts[v.studentId] ?? 0) + 1; });
    return counts;
  }, [vocab]);

  // Filtered list
  const filtered = useMemo<VocabWord[]>(() => {
    const q = search.toLowerCase();
    return vocab.filter(v => {
      if (filterStudent !== 'all' && v.studentId !== filterStudent) return false;
      if (filterLevel !== 'all' && v.level !== filterLevel) return false;
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      if (q && !v.word.toLowerCase().includes(q) && !v.meaning.toLowerCase().includes(q) && !(v.notes ?? '').toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [vocab, filterStudent, filterLevel, filterStatus, search]);

  // Group by student
  const grouped = useMemo<Record<string, VocabWord[]> | null>(() => {
    if (filterStudent !== 'all') return null; // flat view when filtered
    const map: Record<string, VocabWord[]> = {};
    filtered.forEach(v => {
      if (!map[v.studentId]) map[v.studentId] = [];
      map[v.studentId].push(v);
    });
    return map;
  }, [filtered, filterStudent]);

  const handleStatusCycle = useCallback(async (word: VocabWord) => {
    const cycle: Record<VocabStatus, VocabStatus> = { new: 'learning', learning: 'mastered', mastered: 'new' };
    await updateVocab({ ...word, status: cycle[word.status as VocabStatus] });
  }, [updateVocab]);

  const openAdd = () => { setEditingWord(undefined); setIsFormOpen(true); };
  const openEdit = (w: VocabWord) => { setEditingWord(w); setIsFormOpen(true); };

  const studentMap = useMemo(() => Object.fromEntries(students.map(s => [s.id, s])), [students]);

  const hasFilters = filterStudent !== 'all' || filterLevel !== 'all' || filterStatus !== 'all' || !!search;

  const activeStudents = students.filter(s => s.status !== 'inactive');

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-950 dark:text-sky-50 tracking-tight">Từ vựng Học viên</h1>
          <p className="text-sky-700/80 font-medium text-lg">Quản lý và theo dõi từ vựng của từng học viên</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white border border-white dark:border-slate-700/40 shadow-[0_4px_16px_rgba(56,189,248,0.3)] hover:shadow-[0_8px_24px_rgba(56,189,248,0.4)] hover:-translate-y-0.5 transition-all duration-300 rounded-[20px] h-12 px-6 backdrop-blur-md group shrink-0"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
          <span className="font-semibold text-[15px]">Thêm từ mới</span>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tổng từ" value={stats.total} sub="trong kho" colorClass="bg-sky-50 text-sky-900 border-sky-100" />
        <StatCard label="Từ mới" value={stats.newWords} sub="chưa học" colorClass="bg-amber-50 text-amber-900 border-amber-100" />
        <StatCard label="Đang học" value={stats.learning} sub="đang ôn tập" colorClass="bg-blue-50 text-blue-900 border-blue-100" />
        <StatCard label="Đã thuộc" value={stats.mastered} sub="hoàn thành" colorClass="bg-emerald-50 text-emerald-900 border-emerald-100" />
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-700 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden p-6 space-y-4"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
          <input
            placeholder="Tìm từ vựng, nghĩa, ghi chú..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-100 bg-white/70 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-300 hover:text-sky-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex gap-2 flex-wrap">
          {/* Student filter */}
          <select
            value={filterStudent}
            onChange={e => setFilterStudent(e.target.value)}
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-1.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="all">Tất cả học viên</option>
            {activeStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({studentWordCounts[s.id] ?? 0})</option>
            ))}
          </select>

          {/* Level filter */}
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-1.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="all">Tất cả cấp độ</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-1.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="all">Tất cả trạng thái</option>
            {(Object.entries(STATUS_CONFIG) as [VocabStatus, typeof STATUS_CONFIG['new']][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setFilterStudent('all'); setFilterLevel('all'); setFilterStatus('all'); setSearch(''); }}
              className="ml-auto text-xs text-sky-500 hover:text-sky-700 underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-sky-50/50 rounded-[32px] border border-sky-100/50"
        >
          <BookMarked className="w-14 h-14 text-sky-200 mx-auto mb-3" />
          <p className="text-sky-800 font-semibold text-lg">
            {hasFilters ? 'Không tìm thấy từ vựng nào.' : 'Chưa có từ vựng nào.'}
          </p>
          <p className="text-sky-500/70 text-sm mt-1">
            {hasFilters ? 'Thử thay đổi bộ lọc.' : 'Nhấn "Thêm từ mới" để bắt đầu xây dựng kho từ vựng.'}
          </p>
        </motion.div>
      )}

      {/* Grouped by student (default view) */}
      {filtered.length > 0 && grouped && (
        <div className="space-y-8">
          {(Object.entries(grouped as Record<string, VocabWord[]>)).map(([studentId, words]) => {
            const student = studentMap[studentId];
            const avatarClass = student ? getAvatarColor(studentId) : 'bg-sky-100 text-sky-700';
            const masteredCount = words.filter(w => w.status === 'mastered').length;
            return (
              <motion.section
                key={studentId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Student header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${avatarClass}`}>
                    {student?.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-extrabold text-sky-950">{student?.name ?? 'Không rõ'}</h2>
                      <span className="text-xs text-sky-500 font-medium">{student?.currentLevel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-sky-500">
                      <span>{words.length} từ</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-semibold">{masteredCount} đã thuộc</span>
                      {words.length > 0 && (
                        <>
                          <span>·</span>
                          {/* Progress bar */}
                          <span className="flex items-center gap-1.5">
                            <div className="h-1.5 w-24 rounded-full bg-sky-100 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${(masteredCount / words.length) * 100}%` }}
                              />
                            </div>
                            {Math.round((masteredCount / words.length) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Word grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {words.map(word => (
                      <VocabCard
                        key={word.id}
                        word={word}
                        student={student}
                        onEdit={() => openEdit(word)}
                        onDelete={() => setConfirmDeleteId(word.id)}
                        onStatusCycle={() => handleStatusCycle(word)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* Flat view when student filter is active */}
      {filtered.length > 0 && !grouped && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(word => (
              <VocabCard
                key={word.id}
                word={word}
                student={studentMap[word.studentId]}
                onEdit={() => openEdit(word)}
                onDelete={() => setConfirmDeleteId(word.id)}
                onStatusCycle={() => handleStatusCycle(word)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit form */}
      <VocabFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={editingWord ? updateVocab : addVocab}
        students={students}
        initial={editingWord}
      />

      {/* Confirm delete */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xác nhận xóa từ vựng"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 font-semibold rounded-[16px]">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={async () => { if (confirmDeleteId) { await deleteVocab(confirmDeleteId); setConfirmDeleteId(null); } }}
              className="flex-1 font-semibold rounded-[16px]"
            >
              Xóa
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-50 to-red-50 border border-white dark:border-slate-700 shadow-[0_4px_16px_rgba(244,63,94,0.1)] ring-1 ring-rose-100 mb-6 relative">
            <div className="absolute inset-0 bg-rose-400/20 rounded-full animate-ping opacity-50"></div>
            <Trash2 className="w-8 h-8 text-rose-500 relative z-10" />
          </div>
          <p className="text-sky-800 dark:text-sky-200/90 text-center text-[15px] leading-relaxed max-w-[260px]">
            Bạn có chắc chắn muốn xóa từ vựng này? Hành động này <span className="font-bold text-rose-600">không thể hoàn tác</span>.
          </p>
        </div>
      </Modal>
    </div>
  );
}
