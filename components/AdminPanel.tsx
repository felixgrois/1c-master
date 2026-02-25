
import React, { useState } from 'react';
import { Lesson, Exercise, UserRole, UserSpecialization, ExerciseType, KBItem } from '../types';
import { generateAIQuestion, parseKBToExercises } from '../services/geminiService';
import { Save, Plus, Trash2, Download, Upload, ChevronDown, ChevronUp, Edit3, BookOpen, Sparkles, Loader2, Database, ShieldCheck, Tag } from 'lucide-react';

interface AdminPanelProps {
  lessons: Lesson[];
  onUpdateLessons: (updatedLessons: Lesson[]) => void;
  aiDifficulty: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ lessons, onUpdateLessons, aiDifficulty }) => {
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'kb'>('lessons');
  const [kbItems, setKbItems] = useState<KBItem[]>([]);
  const [newKbText, setNewKbText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ lessons, kbItems }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "master_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const addAIQuestion = async (lesson: Lesson) => {
    setIsProcessing(true);
    try {
      const context = kbItems.length > 0 ? kbItems[0].content : undefined;
      const aiEx = await generateAIQuestion(lesson.role, lesson.specialization, lesson.level, aiDifficulty, context);
      const newEx: Exercise = {
        id: 'ai-' + Date.now(),
        type: ExerciseType.MULTIPLE_CHOICE,
        question: aiEx.question!,
        options: aiEx.options,
        correctAnswer: aiEx.correctAnswer!,
        explanation: aiEx.explanation,
        xp: aiEx.xp || 50
      };
      
      const newLessons = lessons.map(l => l.id === lesson.id ? { ...l, exercises: [...l.exercises, newEx] } : l);
      onUpdateLessons(newLessons);
    } catch (e) {
      alert("Ошибка ИИ генерации");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddKB = async () => {
    if (!newKbText.trim()) return;
    setIsProcessing(true);
    const newItem: KBItem = {
      id: 'kb-' + Date.now(),
      title: 'Источник от ' + new Date().toLocaleDateString(),
      content: newKbText,
      tags: []
    };
    setKbItems([newItem, ...kbItems]);
    setNewKbText('');
    setIsProcessing(false);
  };

  const generateFromKB = async (kbItem: KBItem, role: UserRole, specialization: UserSpecialization) => {
    setIsProcessing(true);
    try {
      const parsed = await parseKBToExercises(kbItem.content, role, specialization);
      const newLesson: Lesson = {
        id: 'lesson-' + Date.now(),
        role: role,
        specialization: specialization,
        level: 1,
        title: `Урок (${specialization})`,
        narrative: 'Автоматически сформированный урок из ваших материалов.',
        exercises: parsed.map((p, i) => ({
          id: `ex-kb-${Date.now()}-${i}`,
          type: ExerciseType.MULTIPLE_CHOICE,
          question: p.question!,
          options: p.options,
          correctAnswer: p.correctAnswer!,
          explanation: p.explanation,
          xp: p.xp || 30
        }))
      };
      onUpdateLessons([newLesson, ...lessons]);
      setActiveTab('lessons');
      setEditingLessonId(newLesson.id);
    } catch (e) {
      alert("Ошибка обработки БЗ");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateLessonField = (lessonId: string, field: keyof Lesson, value: any) => {
    onUpdateLessons(lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l));
  };

  const updateExercise = (lessonId: string, exId: string, field: keyof Exercise, value: any) => {
    const newLessons = lessons.map(l => {
      if (l.id !== lessonId) return l;
      return {
        ...l,
        exercises: l.exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex)
      };
    });
    onUpdateLessons(newLessons);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-100 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase">Админ-панель</h2>
            <div className="flex space-x-2 mt-1">
              <button 
                onClick={() => setActiveTab('lessons')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${activeTab === 'lessons' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                Уроки
              </button>
              <button 
                onClick={() => setActiveTab('kb')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${activeTab === 'kb' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                База знаний
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-600 rounded-xl font-black text-xs transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>СКАЧАТЬ КОНФИГ</span>
        </button>
      </div>

      {activeTab === 'kb' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-black text-gray-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-sky-500" />
              <span>NoteBookLM Экспорт</span>
            </h3>
            <textarea 
              value={newKbText}
              onChange={(e) => setNewKbText(e.target.value)}
              placeholder="Вставьте технический текст здесь..."
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none h-40 font-medium"
            />
            <button 
              onClick={handleAddKB}
              disabled={isProcessing || !newKbText.trim()}
              className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-sky-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>ДОБАВИТЬ В БАЗУ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kbItems.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-gray-800">{item.title}</h4>
                  <button onClick={() => setKbItems(kbItems.filter(i => i.id !== item.id))} className="text-red-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(UserSpecialization).slice(0, 4).map(spec => (
                    <button 
                      key={spec}
                      onClick={() => generateFromKB(item, UserRole.DEVELOPER, spec)}
                      className="text-[8px] font-black uppercase bg-sky-50 text-sky-600 p-2 rounded-lg hover:bg-sky-100"
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <button 
             onClick={() => {
                const newLesson: Lesson = {
                   id: 'lesson-'+Date.now(),
                   role: UserRole.DEVELOPER,
                   specialization: UserSpecialization.COMMON,
                   level: 1,
                   title: 'Новый урок',
                   narrative: 'Описание урока...',
                   exercises: []
                };
                onUpdateLessons([newLesson, ...lessons]);
                setEditingLessonId(newLesson.id);
             }}
             className="w-full py-4 bg-gray-900 text-white rounded-3xl font-black flex items-center justify-center space-x-3 hover:brightness-110 transition-all"
          >
             <Plus className="w-6 h-6" />
             <span>СОЗДАТЬ НОВЫЙ УРОК</span>
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
                  <div>
                    <h3 className="font-black text-gray-900">{lesson.title}</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Заголовок урока</label>
                      <input 
                        type="text" 
                        value={lesson.title}
                        onChange={(e) => updateLessonField(lesson.id, 'title', e.target.value)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Специализация</label>
                       <select 
                          value={lesson.specialization}
                          onChange={(e) => updateLessonField(lesson.id, 'specialization', e.target.value)}
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                       >
                          {Object.values(UserSpecialization).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => addAIQuestion(lesson)}
                      disabled={isProcessing}
                      className="flex-grow py-3 bg-purple-600 text-white rounded-2xl font-black text-xs flex items-center justify-center space-x-2 hover:bg-purple-700 shadow-md transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>СГЕНЕРИРОВАТЬ ИИ-ВОПРОС</span>
                    </button>
                    <button 
                       onClick={() => onUpdateLessons(lessons.filter(l => l.id !== lesson.id))}
                       className="p-3 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {lesson.exercises.map((ex, idx) => (
                    <div key={ex.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                       {/* Exercise editing UI as before... */}
                       <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Упражнение {idx + 1}</span>
                        <button 
                          onClick={() => {
                            const newExs = lesson.exercises.filter(e => e.id !== ex.id);
                            onUpdateLessons(lessons.map(l => l.id === lesson.id ? { ...l, exercises: newExs } : l));
                          }}
                          className="text-red-300 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea 
                        value={ex.question}
                        onChange={(e) => updateExercise(lesson.id, ex.id, 'question', e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                        placeholder="Вопрос..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
