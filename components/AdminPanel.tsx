import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Download, Plus, Trash2, Loader2, BookOpen, 
  ChevronUp, ChevronDown, Sparkles, Database, FolderOpen, 
  FileText, Check, Edit3, Save, Search, Settings, HelpCircle, RefreshCw, FolderPlus, X
} from 'lucide-react';
import { UserRole, UserSpecialization, Lesson, Exercise, ExerciseType, KBItem } from '../types';
import { generateAIQuestion, parseKBToExercises } from '../services/geminiService';
import { exportKBToWord } from '../services/wordExportService';
import MarkdownRenderer from './MarkdownRenderer';

interface KBSection {
  id: string;
  title: string;
  parentId: string | null;
  order?: number;
  is_published?: boolean;
  word_url?: string | null;
  mp3_url?: string | null;
  video_url?: string | null;
  content_url?: string | null;
  kb_item_id?: string | null;
}


const getKbSnippet = (html: string) => {
  if (!html) return '';
  // Strip HTML tags using regex
  const clean = html.replace(/<[^>]*>/g, ' ');
  // Unescape common HTML entities
  const unescaped = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  // Return truncated
  return unescaped.length > 180 ? unescaped.substring(0, 180).trim() + '...' : unescaped.trim();
};

interface AdminPanelProps {
  lessons: Lesson[];
  onUpdateLessons: (updatedLessons: Lesson[]) => void;
  aiDifficulty?: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  lessons, 
  onUpdateLessons,
  aiDifficulty = 5 
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'kb_items' | 'sections'>('lessons');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // States for database-managed sections/items
  const [sections, setSections] = useState<KBSection[]>([]);
  const [kbItems, setKbItems] = useState<KBItem[]>([]);
  const [loadingKB, setLoadingKB] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms states
  const [newKbText, setNewKbText] = useState('');
  const [newKbTitle, setNewKbTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [editingKbItem, setEditingKbItem] = useState<KBItem | null>(null);
  const [viewingKbItem, setViewingKbItem] = useState<KBItem | null>(null);

  // Section Form states
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionParentId, setNewSectionParentId] = useState<string>('');
  const [editingSection, setEditingSection] = useState<KBSection | null>(null);

  // Level & filters for test generation
  const [genTargetRole, setGenTargetRole] = useState<UserRole>(UserRole.DEVELOPER);
  const [genTargetSpec, setGenTargetSpec] = useState<UserSpecialization>(UserSpecialization.COMMON);
  const [genLevel, setGenLevel] = useState<number>(1);

  // Notification toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch KB Items & Sections from server on mount & tab changes
  const fetchKBCache = async () => {
    setLoadingKB(true);
    try {
      const [secResp, kbResp] = await Promise.all([
        fetch('/api/kb_sections'),
        fetch('/api/kb')
      ]);
      
      if (secResp.ok) {
        const secData = await secResp.json();
        if (Array.isArray(secData)) setSections(secData);
      }
      
      if (kbResp.ok) {
        const kbData = await kbResp.json();
        if (Array.isArray(kbData)) setKbItems(kbData);
      }
    } catch (err) {
      console.error("Failed to load knowledge base cache:", err);
      showToast("Ошибка при синхронизации с сервером");
    } finally {
      setLoadingKB(false);
    }
  };

  useEffect(() => {
    fetchKBCache();
  }, []);

  // Save sections back to the server
  const saveSectionsToServer = async (updatedSections: KBSection[]) => {
    try {
      const resp = await fetch('/api/kb_sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSections)
      });
      if (!resp.ok) throw new Error("Server error saving sections");
      setSections(updatedSections);
    } catch (err) {
      console.error(err);
      showToast("Ошибка при сохранении разделов");
    }
  };

  // Save KB items back to the server
  const saveKBItemsToServer = async (updatedItems: KBItem[]) => {
    try {
      const resp = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems)
      });
      if (!resp.ok) throw new Error("Server error saving items");
      setKbItems(updatedItems);
    } catch (err) {
      console.error(err);
      showToast("Ошибка во время сохранения статей");
    }
  };

  // Add/Update KB Item
  const handleSaveKBItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim() || !newKbText.trim()) return;

    setIsProcessing(true);
    try {
      let updatedItems: KBItem[] = [];
      if (editingKbItem) {
        // Edit mode
        updatedItems = kbItems.map(item => item.id === editingKbItem.id ? {
          ...item,
          title: newKbTitle,
          content: newKbText,
          // @ts-ignore
          sectionId: selectedSectionId || null
        } : item);
        showToast("Статья успешно обновлена!");
      } else {
        // Add mode
        const newItem: KBItem = {
          id: 'kb-' + Date.now(),
          title: newKbTitle,
          content: newKbText,
          tags: ['Интерфейс', 'Разработка'],
          // @ts-ignore
          sectionId: selectedSectionId || null
        };
        updatedItems = [newItem, ...kbItems];
        showToast("Статья успешно создана!");
      }

      await saveKBItemsToServer(updatedItems);

      // Clean up inputs
      setNewKbTitle('');
      setNewKbText('');
      setSelectedSectionId('');
      setEditingKbItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete KB Item
  const handleDeleteKBItem = async (id: string) => {
    if (!window.confirm("Удалить эту статью из БЗ?")) return;
    const filtered = kbItems.filter(item => item.id !== id);
    await saveKBItemsToServer(filtered);
    showToast("Статья удалена.");
  };

  // Add/Update Section
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    setIsProcessing(true);
    try {
      let updatedSections: KBSection[] = [];
      if (editingSection) {
        updatedSections = sections.map(s => s.id === editingSection.id ? {
          ...s,
          title: newSectionTitle,
          parentId: newSectionParentId || null
        } : s);
        showToast("Раздел успешно переименован!");
      } else {
        const newSec: KBSection = {
          id: 'sec-' + Date.now(),
          title: newSectionTitle,
          parentId: newSectionParentId || null,
          order: sections.length + 1,
          is_published: true
        };
        updatedSections = [...sections, newSec];
        showToast("Новый раздел создан!");
      }

      await saveSectionsToServer(updatedSections);

      // Clean up
      setNewSectionTitle('');
      setNewSectionParentId('');
      setEditingSection(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (id: string) => {
    if (!window.confirm("Вы уверены, что хотите удалить выбранный раздел? Все поддиапазоны будут переподключены к корню.")) return;
    try {
      const resp = await fetch(`/api/kb_sections/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setSections(sections.filter(s => s.id !== id));
        showToast("Раздел удален.");
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("Ошибка удаления раздела");
    }
  };

  // Generate test questions based on selected sections content!
  const handleGenerateTestBySection = async (section: KBSection) => {
    // 1. Gather all articles belonging to this section or parent
    const affiliatedItems = kbItems.filter(item => {
      // @ts-ignore
      return item.sectionId === section.id || section.kb_item_id === item.id;
    });

    if (affiliatedItems.length === 0) {
      showToast(`В разделе "${section.title}" нет прикрепленных статей с контентом!`);
      return;
    }

    setIsProcessing(true);
    showToast("ИИ анализирует статьи раздела и формирует тест...");

    try {
      // Concatenate content
      const mergedText = affiliatedItems.map(i => `Статья: ${i.title}\n${i.content}`).join("\n\n");
      
      // Parse content into exercises (generate tests)
      const parsed = await parseKBToExercises(mergedText, genTargetRole, genTargetSpec);
      
      if (!parsed || parsed.length === 0) {
        throw new Error("AI did not return any valid exercises");
      }

      // Generate a new Lesson and append to database configuration
      const newLesson: Lesson = {
        id: 'lesson-' + Date.now(),
        role: genTargetRole,
        specialization: genTargetSpec,
        level: genLevel,
        title: `Тест: ${section.title}`,
        narrative: `Автоматическое тестирование по материалам базы знаний из раздела "${section.title}".`,
        exercises: parsed.map((p, idx) => ({
          id: `ex-gen-${Date.now()}-${idx}`,
          type: ExerciseType.MULTIPLE_CHOICE,
          question: p.question || "Встроенный вопрос по 1С",
          options: p.options || ["Вариант A", "Вариант B", "Вариант C"],
          correctAnswer: p.correctAnswer || "Вариант A",
          explanation: p.explanation || "Объяснение отсутствует",
          xp: p.xp || 40
        }))
      };

      const updatedLessons = [newLesson, ...lessons];
      
      // Save lessons using API
      const resp = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLessons)
      });

      if (resp.ok) {
        onUpdateLessons(updatedLessons);
        showToast("Тест успешно создан и добавлен во вкладку 'Уроки'!");
        setActiveTab('lessons');
        setEditingLessonId(newLesson.id);
      } else {
        throw new Error("Failed to save generated lesson");
      }

    } catch (err) {
      console.error(err);
      showToast("ИИ не смог сгенерировать вопросы по этому контенту. Попробуйте еще раз.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate individual AI-Powered question inside standard Lesson
  const addAIQuestion = async (lesson: Lesson) => {
    setIsProcessing(true);
    try {
      const associatedKbItems = kbItems.filter(item => {
        // @ts-ignore
        return item.sectionId === lesson.id || lesson.title.includes(item.title);
      });
      const context = associatedKbItems.length > 0 ? associatedKbItems[0].content : undefined;
      const aiEx = await generateAIQuestion(lesson.role, lesson.specialization, lesson.level, aiDifficulty, context);
      
      const newEx: Exercise = {
        id: 'ai-' + Date.now(),
        type: ExerciseType.MULTIPLE_CHOICE,
        question: aiEx.question || "Новый сгенерированный вопрос по 1С?",
        options: aiEx.options || ["Вариант A", "Вариант B"],
        correctAnswer: aiEx.correctAnswer || "Вариант A",
        explanation: aiEx.explanation,
        xp: aiEx.xp || 50
      };
      
      const newLessons = lessons.map(l => l.id === lesson.id ? { ...l, exercises: [...l.exercises, newEx] } : l);
      
      // Save to server
      await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLessons)
      });

      onUpdateLessons(newLessons);
      showToast("Новый ИИ-вопрос добавлен!");
    } catch (e) {
      showToast("Ошибка ИИ генерации");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateLessonField = async (lessonId: string, field: keyof Lesson, value: any) => {
    const updated = lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l);
    onUpdateLessons(updated);
    
    // Save to server
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  const updateExercise = async (lessonId: string, exId: string, field: keyof Exercise, value: any) => {
    const newLessons = lessons.map(l => {
      if (l.id !== lessonId) return l;
      return {
        ...l,
        exercises: l.exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex)
      };
    });
    onUpdateLessons(newLessons);

    // Save to server
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLessons)
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ lessons, kbItems, sections }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "1c_master_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Конфигурация выгружена!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-xl font-bold text-xs animate-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-100 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase">Админ-панель</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <button 
                onClick={() => setActiveTab('lessons')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${activeTab === 'lessons' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                Уроки
              </button>
              <button 
                onClick={() => setActiveTab('sections')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${activeTab === 'sections' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                Разделы БЗ
              </button>
              <button 
                onClick={() => setActiveTab('kb_items')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${activeTab === 'kb_items' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                Статьи БЗ
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-xl font-black text-xs transition-all shrink-0 border border-sky-100"
        >
          <Download className="w-4 h-4" />
          <span>СКАЧАТЬ КОНФИГ</span>
        </button>
      </div>

      {loadingKB && (
        <div className="flex items-center justify-center space-x-3 py-8 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
          <span className="font-bold text-gray-500 text-sm">Синхронизация данных базы знаний...</span>
          <button onClick={fetchKBCache} className="text-sky-600 hover:underline text-xs ml-4 font-black">
            ОБНОВИТЬ
          </button>
        </div>
      )}

      {/* TAB 1: Lessons Management */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <button 
             onClick={async () => {
                const newLesson: Lesson = {
                   id: 'lesson-'+Date.now(),
                   role: UserRole.DEVELOPER,
                   specialization: UserSpecialization.COMMON,
                   level: 1,
                   title: 'Новый урок',
                   narrative: 'Описание урока...',
                   exercises: []
                };
                const updated = [newLesson, ...lessons];
                onUpdateLessons(updated);
                setEditingLessonId(newLesson.id);

                // Save
                await fetch('/api/lessons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updated)
                });
                showToast("Урок успешно создан!");
             }}
             className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-3xl font-black flex items-center justify-center space-x-3 transition-all shadow-lg"
          >
             <Plus className="w-6 h-6" />
             <span>СОЗДАТЬ НОВЫЙ УРОК МАНУАЛЬНО</span>
          </button>

          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setEditingLessonId(editingLessonId === lesson.id ? null : lesson.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-900">{lesson.title}</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                      {lesson.specialization} • {lesson.role} • Уровень {lesson.level}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="bg-gray-100 px-2 py-1 rounded-lg text-[10px] font-black text-gray-400">{lesson.exercises.length} вопр.</span>
                  {editingLessonId === lesson.id ? <ChevronUp className="text-gray-300" /> : <ChevronDown className="text-gray-300" />}
                </div>
              </div>

              {editingLessonId === lesson.id && (
                <div className="p-5 border-t border-gray-50 space-y-6 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Заголовок урока</label>
                      <input 
                        type="text" 
                        value={lesson.title}
                        onChange={(e) => updateLessonField(lesson.id, 'title', e.target.value)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none"
                      />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Специализация</label>
                       <select 
                          value={lesson.specialization}
                          onChange={(e) => updateLessonField(lesson.id, 'specialization', e.target.value as any)}
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none"
                       >
                          {Array.from(new Set(Object.values(UserSpecialization))).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => addAIQuestion(lesson)}
                      disabled={isProcessing}
                      className="flex-grow py-3 bg-purple-600 text-white rounded-2xl font-black text-xs flex items-center justify-center space-x-2 hover:bg-purple-750 shadow-md transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>СГЕНЕРИРОВАТЬ ИИ-ВОПРОС ДЛЯ ЭТОГО УРОКА</span>
                    </button>
                    <button 
                       onClick={async () => {
                         if (!window.confirm("Удалить этот урок?")) return;
                         const filtered = lessons.filter(l => l.id !== lesson.id);
                         onUpdateLessons(filtered);
                         await fetch('/api/lessons', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify(filtered)
                         });
                         showToast("Урок удален.");
                       }}
                       className="p-3 bg-red-100 text-red-650 rounded-2xl hover:bg-red-200"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {lesson.exercises.map((ex, idx) => (
                    <div key={ex.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
                       <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Упражнение {idx + 1} ({ex.xp} XP)</span>
                        <button 
                          onClick={async () => {
                            const newExs = lesson.exercises.filter(e => e.id !== ex.id);
                            const updated = lessons.map(l => l.id === lesson.id ? { ...l, exercises: newExs } : l);
                            onUpdateLessons(updated);
                            await fetch('/api/lessons', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updated)
                            });
                          }}
                          className="text-red-300 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Вопрос</span>
                        <textarea 
                          value={ex.question}
                          onChange={(e) => updateExercise(lesson.id, ex.id, 'question', e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                          placeholder="Текст вопроса..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Правильный ответ</span>
                        <input 
                          type="text"
                          value={Array.isArray(ex.correctAnswer) ? ex.correctAnswer.join(', ') : ex.correctAnswer}
                          onChange={(e) => updateExercise(lesson.id, ex.id, 'correctAnswer', e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black"
                          placeholder="Правильный ответ..."
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Объяснение ответа</span>
                        <textarea 
                          value={ex.explanation || ''}
                          onChange={(e) => updateExercise(lesson.id, ex.id, 'explanation', e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500"
                          placeholder="Почему этот ответ верен..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Sections (Разделы) Management */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Section Create New Form */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
            <h3 className="font-black text-gray-900 flex items-center space-x-2 mb-4">
              <FolderPlus className="w-5 h-5 text-indigo-500" />
              <span>{editingSection ? 'Редактировать раздел БЗ' : 'Новый раздел базы знаний'}</span>
            </h3>
            
            <form onSubmit={handleSaveSection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Название раздела</label>
                  <input 
                    type="text"
                    required
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="Пример: 1С:Запросы и компоновка"
                    className="w-full p-3.5 bg-gray-55 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Родительский раздел (Опционально)</label>
                  <select 
                    value={newSectionParentId}
                    onChange={(e) => setNewSectionParentId(e.target.value)}
                    className="w-full p-3.5 bg-gray-55 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Нет (Корневой раздел) --</option>
                    {sections.filter(s => editingSection ? s.id !== editingSection.id : true).map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-sky-650 hover:bg-sky-700 text-white rounded-2xl font-black flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span>{editingSection ? 'ОБНОВИТЬ РАЗДЕЛ' : 'ДОБАВИТЬ РАЗДЕЛ БЗ'}</span>
                </button>
                {editingSection && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingSection(null);
                      setNewSectionTitle('');
                      setNewSectionParentId('');
                    }}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-xs transition-all"
                  >
                    ОТМЕНА
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Test Generation Config & Sections List */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
            <h3 className="font-black text-gray-900 flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-sky-500" />
              <span>Параметры интеллектуальной генерации тестов</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Роль для тестов</label>
                <select 
                  value={genTargetRole}
                  onChange={(e) => setGenTargetRole(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black shadow-sm"
                >
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Специализация</label>
                <select 
                  value={genTargetSpec}
                  onChange={(e) => setGenTargetSpec(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black shadow-sm"
                >
                  {Array.from(new Set(Object.values(UserSpecialization))).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Уровень сложности (1-10)</label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={genLevel}
                  onChange={(e) => setGenLevel(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="w-full p-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black shadow-sm outline-none"
                />
              </div>
            </div>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">Список доступных разделов в базе знаний</p>
            
            {sections.length === 0 ? (
              <div className="py-8 text-center text-gray-400 font-bold border border-dashed border-gray-200 rounded-2xl">
                Разделы БЗ не найдены. Создайте свой первый раздел выше!
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map(section => {
                  const itemsCount = kbItems.filter(item => {
                    // @ts-ignore
                    return item.sectionId === section.id || section.kb_item_id === item.id;
                  }).length;

                  return (
                    <div key={section.id} className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all gap-3">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="p-3 bg-sky-100 rounded-xl text-sky-600">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-800 text-sm leading-tight">{section.title}</h4>
                          <span className="text-[9px] font-black text-sky-500 uppercase tracking-tighter">
                            {itemsCount} статей прикреплено
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => handleGenerateTestBySection(section)}
                          disabled={isProcessing}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-black text-[10px] uppercase shadow-md transition-all disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          <span>Сгенерировать тест по разделу</span>
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSection(section);
                            setNewSectionTitle(section.title);
                            setNewSectionParentId(section.parentId || '');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            showToast(`Раздел «${section.title}» загружен в форму редактирования вверху!`);
                          }}
                          className="p-2 text-gray-400 hover:text-sky-600 bg-white border border-gray-100 rounded-xl shadow-sm transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-2 text-red-300 hover:text-red-500 bg-white border border-gray-100 rounded-xl shadow-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KB Items (Статьи БЗ) Management */}
      {activeTab === 'kb_items' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
            <h3 className="font-black text-gray-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-sky-500" />
              <span>{editingKbItem ? 'Редактировать статью базы' : 'NoteBookLM / Текстовый Экспорт'}</span>
            </h3>
            
            <form onSubmit={handleSaveKBItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Название статьи</label>
                  <input 
                    id="kb-title-input"
                    type="text"
                    required
                    value={newKbTitle}
                    onChange={(e) => setNewKbTitle(e.target.value)}
                    placeholder="Пример: Механизм передачи параметров по значению"
                    className="w-full p-3.5 bg-gray-55 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Привязать к разделу БЗ</label>
                  <select 
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full p-3.5 bg-gray-55 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Не выбрано (Статья без раздела) --</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase font-bold">Обучающий Текст / Содержимое (HTML или Сплошной текст)</label>
                <textarea 
                  value={newKbText}
                  onChange={(e) => setNewKbText(e.target.value)}
                  placeholder="Вставьте сюда учебный материал, лекцию, документацию или импортированный справочник для обучения..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none h-48 font-medium leading-relaxed"
                />
              </div>

              <div className="flex space-x-3">
                <button 
                  type="submit"
                  disabled={isProcessing || !newKbTitle.trim() || !newKbText.trim()}
                  className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>{editingKbItem ? 'ОБНОВИТЬ СТАТЬЮ БЗ' : 'ДОБАВИТЬ В БАЗУ ЗНАНИЙ'}</span>
                </button>
                {editingKbItem && (
                  <button 
                    type="button"
                    onClick={() => {
                      setNewKbTitle('');
                      setNewKbText('');
                      setSelectedSectionId('');
                      setEditingKbItem(null);
                    }}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-xs transition-all"
                  >
                    ОТМЕНА
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Search Query Filter */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-300" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по статьям базы знаний..."
              className="w-full bg-transparent border-none text-sm outline-none font-semibold text-gray-700"
            />
          </div>

          {/* Items Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kbItems
              .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(item => {
                // Find matching section name
                // @ts-ignore
                const sec = sections.find(s => s.id === item.sectionId);
                return (
                  <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-black text-gray-800 text-sm leading-snug">{item.title}</h4>
                      </div>
                      
                      {sec ? (
                        <div className="inline-flex items-center space-x-1 bg-sky-50 text-sky-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase mb-3">
                          <FolderOpen className="w-2.5 h-2.5" />
                          <span>Раздел: {sec.title}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center bg-gray-100 text-gray-400 px-2 py-1 rounded-lg text-[8px] font-black uppercase mb-3">
                          <span>Вне разделов</span>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 line-clamp-3 font-medium overflow-hidden border-t border-gray-55 pt-2 max-h-24 leading-relaxed">
                        {getKbSnippet(item.content)}
                      </div>
                    </div>

                    {/* Integrated Separate Actions Block with No Delay */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto gap-2">
                      <div className="flex items-center gap-2">
                        {/* VIEW/READING BUTTON (Word style viewer modal trigger) */}
                        <button 
                          onClick={() => {
                            setViewingKbItem(item);
                            showToast(`Статья «${item.title}» открыта в полноэкранном просмотре!`);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-sky-50 text-sky-750 hover:bg-sky-100 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Читать (Word)</span>
                        </button>

                        {/* EDIT BUTTON (Load into editing form instantly) */}
                        <button 
                          onClick={() => {
                            setEditingKbItem(item);
                            setNewKbTitle(item.title);
                            setNewKbText(item.content);
                            // @ts-ignore
                            setSelectedSectionId(item.sectionId || '');
                            window.scrollTo({ top: 0, behavior: 'instant' as any });
                            setTimeout(() => {
                              const input = document.getElementById('kb-title-input');
                              if (input) {
                                input.focus();
                                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 50);
                            showToast(`Статья «${item.title}» загружена в редактор вверху!`);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-gray-50 text-gray-650 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Редактировать</span>
                        </button>
                      </div>

                      {/* DELETE BUTTON */}
                      <button 
                        onClick={() => handleDeleteKBItem(item.id)} 
                        className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Удалить статью"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* FULL SCREEN MODULE ARTICLE READER (Word doc canvas overlay) */}
      {viewingKbItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] overflow-hidden flex flex-col h-screen animate-in fade-in duration-300">
          <style>{`
            .word-document-content {
              word-wrap: break-word !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              white-space: normal !important;
            }
            .word-document-content * {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            .word-document-content h1 {
              font-size: 1.8rem;
              font-weight: 850;
              color: #0f172a;
              margin-top: 1.5rem;
              margin-bottom: 1rem;
              border-bottom: 2px solid #e2e8f5;
              padding-bottom: 0.5rem;
              line-height: 1.3;
            }
            .word-document-content h2 {
              font-size: 1.4rem;
              font-weight: 800;
              color: #1e293b;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              line-height: 1.35;
            }
            .word-document-content h3 {
              font-size: 1.15rem;
              font-weight: 750;
              color: #334155;
              margin-top: 1.25rem;
              margin-bottom: 0.5rem;
            }
            .word-document-content p {
              font-size: 1rem;
              line-height: 1.625;
              color: #334155;
              margin-bottom: 1rem;
            }
            .word-document-content ul {
              list-style-type: disc !important;
              margin-left: 1.5rem;
              margin-bottom: 1rem;
              font-size: 1rem;
              color: #334155;
            }
            .word-document-content ol {
              list-style-type: decimal !important;
              margin-left: 1.5rem;
              margin-bottom: 1rem;
              font-size: 1rem;
              color: #334155;
            }
            .word-document-content li {
              margin-bottom: 0.35rem;
              display: list-item !important;
              padding-left: 0.25rem;
            }
            .word-document-content strong {
              font-weight: 700;
              color: #0f172a;
            }
            .word-document-content blockquote {
              border-left: 4px solid #3b82f6;
              padding-left: 1rem;
              color: #475569;
              font-style: italic;
              margin: 1rem 0;
            }
            .word-document-content pre, .word-document-content code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 0.85em;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 0.375rem;
              padding: 0.2rem 0.4rem;
              color: #0f172a;
            }
            .word-document-content pre {
              padding: 1rem;
              margin-top: 1.25rem;
              margin-bottom: 1.25rem;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-all;
              background-color: #1e293b !important;
              color: #f8fafc !important;
              border-radius: 0.75rem;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            }
            .word-document-content pre code {
              background-color: transparent !important;
              border: none !important;
              padding: 0 !important;
              font-size: inherit !important;
              color: inherit !important;
            }
            .word-document-content table {
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse;
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              font-size: 0.9rem;
            }
            .word-document-content th, .word-document-content td {
              border: 1px solid #cbd5e1;
              padding: 0.6rem 0.85rem;
              text-align: left;
              word-wrap: break-word !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
            }
            .word-document-content th {
              background-color: #f1f5f9;
              font-weight: 700;
              color: #1e293b;
            }
          `}</style>
          
          {/* Document Topbar toolbar */}
          <div className="bg-slate-900 border-b border-slate-800 text-white px-4 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0 shadow-lg">
            <div className="flex items-center space-x-3 text-left">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block">Microsoft Word</span>
                <span className="text-sm font-black text-white">{viewingKbItem.title}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  exportKBToWord(viewingKbItem);
                  showToast("Документ экспортирован в Word формат!");
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Скачать в формате Microsoft Word (.docx)"
              >
                <Download className="w-4 h-4" />
                <span>Скачать .DOCX</span>
              </button>
              
              <button
                onClick={() => {
                  const item = viewingKbItem;
                  setViewingKbItem(null);
                  setEditingKbItem(item);
                  setNewKbTitle(item.title);
                  setNewKbText(item.content);
                  // @ts-ignore
                  setSelectedSectionId(item.sectionId || '');
                  window.scrollTo({ top: 0, behavior: 'instant' as any });
                  setTimeout(() => {
                    const input = document.getElementById('kb-title-input');
                    if (input) {
                      input.focus();
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 50);
                  showToast(`Статья «${item.title}» загружена в редактор!`);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Редактировать</span>
              </button>
              
              <button
                onClick={() => setViewingKbItem(null)}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-705 hover:bg-slate-700 text-gray-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Закрыть</span>
              </button>
            </div>
          </div>

          {/* Full Screen Scroll Workspace */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 flex justify-center bg-slate-100/80">
            {/* Simulation of Word A4 Page block */}
            <div className="bg-white w-full max-w-4xl min-h-[11.69in] rounded-2xl shadow-xl border border-gray-200/50 p-6 md:p-16 flex flex-col justify-between text-left transition-all my-4 self-start relative">
              <div>
                {/* Visual A4 internal header watermark */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono tracking-widest border-b border-gray-150 pb-4 mb-8">
                  <span>БАЗА ЗНАНИЙ • 1С-МАСТЕР</span>
                  <span>MS WORD DOCUMENT VIEW</span>
                </div>

                <div className="space-y-6">
                  {/* Styled Document Content wrapper */}
                  <div className="word-document-content">
                    <div dangerouslySetInnerHTML={{ __html: viewingKbItem.content }} />
                  </div>
                </div>
              </div>

              {/* Document A4 Footer */}
              <div className="border-t border-gray-100 pt-6 mt-16 flex justify-between items-center text-[9px] text-gray-400 font-mono tracking-wider">
                <span>© 1С-МАСТЕР • АВТОМАТИЗАЦИЯ И РАЗРАБОТКА</span>
                <span>Формат: MS Word A4 • Страница 1 из 1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
