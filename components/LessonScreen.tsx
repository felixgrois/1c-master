
import React, { useState, useEffect } from 'react';
import { Lesson, Exercise, ExerciseType } from '../types';
import ExerciseRenderer from './ExerciseRenderer';
import { generateAIQuestion } from '../services/geminiService';
import { OneCLogo } from '../constants';
import { X, Award, Loader2, Sparkles, Brain } from 'lucide-react';

interface LessonScreenProps {
  lesson: Lesson;
  aiDifficulty: number;
  onFinish: (xpEarned: number, coinsEarned: number, heartChange: number) => void;
  onExit: () => void;
}

const LessonScreen: React.FC<LessonScreenProps> = ({ lesson, aiDifficulty, onFinish, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>(lesson.exercises);
  const [xpTotal, setXpTotal] = useState(0);
  const [coinsTotal, setCoinsTotal] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showNarrative, setShowNarrative] = useState(true);

  const handleExerciseComplete = async (isCorrect: boolean, xp: number) => {
    if (isCorrect) {
      setXpTotal(prev => prev + xp);
      setCoinsTotal(prev => prev + 10);
    } else {
      setHeartsLost(prev => prev + 1);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= exercises.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleBonusAI = async () => {
    setIsLoadingAI(true);
    try {
      const aiEx = await generateAIQuestion(lesson.role, lesson.specialization, lesson.level, aiDifficulty);
      const newEx: Exercise = {
        id: 'ai-gen-bonus-' + Date.now(),
        type: ExerciseType.AI_GEN,
        question: aiEx.question || "Бонусный вопрос",
        options: aiEx.options || [],
        correctAnswer: aiEx.correctAnswer || "",
        explanation: aiEx.explanation || "",
        xp: (aiEx.xp || 50) * 1.5 // Бонусный множитель
      };
      
      setExercises([...exercises, newEx]);
      setIsFinished(false);
      setCurrentIndex(exercises.length);
    } catch (e) {
      alert("Не удалось вызвать ИИ-помощника");
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (showNarrative) {
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col p-6 items-center justify-center text-center space-y-6">
        <OneCLogo className="w-20 h-20" />
        <h1 className="text-3xl font-black text-gray-900">{lesson.title}</h1>
        <p className="text-lg text-gray-600 font-bold max-w-sm">"{lesson.narrative}"</p>
        <button
          onClick={() => setShowNarrative(false)}
          className="w-full max-w-xs py-4 bg-[#FFD200] text-black rounded-2xl font-black text-xl shadow-md hover:brightness-95 transition-all"
        >
          ПОЕХАЛИ!
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col p-6 items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-gray-900 leading-tight">УРОК ЗАВЕРШЕН!</h2>
          <p className="text-gray-500 font-bold">Отличный результат!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col items-center shadow-sm">
            <span className="text-sky-600 font-black text-3xl">+{xpTotal}</span>
            <span className="text-gray-400 font-black text-[10px] uppercase mt-1">XP Опыт</span>
          </div>
          <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col items-center shadow-sm">
            <span className="text-yellow-600 font-black text-3xl">+{coinsTotal}</span>
            <span className="text-gray-400 font-black text-[10px] uppercase mt-1">Монеты</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 w-full max-w-xs">
          <button
            onClick={handleBonusAI}
            disabled={isLoadingAI}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg shadow-md hover:bg-purple-700 transition-all flex items-center justify-center space-x-2"
          >
            {isLoadingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>БОНУСНЫЙ ИИ-ВОПРОС</span>
          </button>
          
          <button
            onClick={() => onFinish(xpTotal, coinsTotal, -heartsLost)}
            className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black text-lg shadow-md hover:bg-sky-700 transition-all"
          >
            ЗАВЕРШИТЬ
          </button>
        </div>
      </div>
    );
  }

  const progress = (currentIndex / exercises.length) * 100;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 flex items-center space-x-4">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-7 h-7" />
        </button>
        <div className="flex-grow bg-gray-100 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-[#FFD200] h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-2 md:px-8 max-w-2xl mx-auto w-full">
        {isLoadingAI ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="relative">
                <Brain className="w-16 h-16 text-purple-600 animate-pulse" />
                <Sparkles className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-bounce" />
             </div>
             <p className="text-xl font-black text-gray-800">ИИ анализирует ваш уровень...</p>
          </div>
        ) : (
          <ExerciseRenderer 
            exercise={exercises[currentIndex]} 
            onComplete={handleExerciseComplete}
            isAI={exercises[currentIndex].type === ExerciseType.AI_GEN}
          />
        )}
      </div>
    </div>
  );
};

export default LessonScreen;
