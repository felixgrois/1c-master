
import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseType } from '../types';
import { CheckCircle2, XCircle, ChevronRight, GripVertical } from 'lucide-react';

interface ExerciseRendererProps {
  exercise: Exercise;
  onComplete: (isCorrect: boolean, xp: number) => void;
  isAI?: boolean;
}

const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({ exercise, onComplete, isAI }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dragItems, setDragItems] = useState<string[]>(exercise.snippets || []);
  const [userCode, setUserCode] = useState(exercise.initialCode || '');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    setSelectedOption(null);
    setDragItems(exercise.snippets || []);
    setUserCode(exercise.initialCode || '');
    setIsChecked(false);
    setIsCorrect(null);
  }, [exercise]);

  const handleCheck = () => {
    let correct = false;
    if (exercise.type === ExerciseType.MULTIPLE_CHOICE || exercise.type === ExerciseType.AI_GEN) {
      correct = selectedOption === exercise.correctAnswer;
    } else if (exercise.type === ExerciseType.DRAG_AND_DROP) {
      correct = JSON.stringify(dragItems) === JSON.stringify(exercise.correctAnswer);
    } else if (exercise.type === ExerciseType.CODE_SIMULATOR) {
      correct = userCode.toLowerCase().includes('добавить');
    }

    setIsCorrect(correct);
    setIsChecked(true);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...dragItems];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setDragItems(newItems);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-2">
        {isAI && (
          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100 uppercase tracking-wider">
            Вопрос от ИИ
          </span>
        )}
        <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
          {exercise.question}
        </h2>
      </div>

      <div className="flex-grow space-y-3">
        {(exercise.type === ExerciseType.MULTIPLE_CHOICE || exercise.type === ExerciseType.AI_GEN) && (
          <div className="grid grid-cols-1 gap-3">
            {exercise.options?.map((option, idx) => (
              <button
                key={idx}
                disabled={isChecked}
                onClick={() => setSelectedOption(option)}
                className={`w-full p-4 text-left border-2 rounded-2xl font-bold transition-all duration-150 
                  ${selectedOption === option ? 'border-[#FFD200] bg-yellow-50 text-black shadow-sm' : 'border-gray-100 hover:border-gray-200 text-gray-700'}
                  ${isChecked && option === exercise.correctAnswer ? 'border-sky-500 bg-sky-50' : ''}
                  ${isChecked && selectedOption === option && option !== exercise.correctAnswer ? 'border-red-500 bg-red-50' : ''}
                `}
              >
                <div className="flex items-center">
                  <span className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center mr-3 shrink-0 text-xs text-gray-500">
                    {idx + 1}
                  </span>
                  {option}
                </div>
              </button>
            ))}
          </div>
        )}

        {exercise.type === ExerciseType.DRAG_AND_DROP && (
          <div className="space-y-2">
            {dragItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center bg-white border-2 border-gray-100 rounded-xl p-3 shadow-sm"
              >
                <GripVertical className="text-gray-300 mr-2 shrink-0" />
                <code className="flex-grow text-xs font-mono text-gray-800 break-all">{item}</code>
                {!isChecked && (
                  <div className="flex space-x-1 shrink-0 ml-2">
                    <button onClick={() => moveItem(idx, 'up')} className="p-1 hover:bg-gray-100 rounded text-gray-400">↑</button>
                    <button onClick={() => moveItem(idx, 'down')} className="p-1 hover:bg-gray-100 rounded text-gray-400">↓</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6">
        {isChecked && (
          <div className={`p-4 rounded-2xl mb-4 flex items-start space-x-3 border-2 ${isCorrect ? 'bg-sky-50 border-sky-100' : 'bg-red-50 border-red-100'}`}>
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-sky-600 mt-1 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mt-1 shrink-0" />
            )}
            <div>
              <p className={`font-black text-lg ${isCorrect ? 'text-sky-800' : 'text-red-800'}`}>
                {isCorrect ? 'Отлично!' : 'Не совсем...'}
              </p>
              <p className="text-sm text-gray-600 font-bold">{exercise.explanation}</p>
            </div>
          </div>
        )}

        {!isChecked ? (
          <button
            onClick={handleCheck}
            disabled={
              (exercise.type === ExerciseType.MULTIPLE_CHOICE && !selectedOption) ||
              (exercise.type === ExerciseType.CODE_SIMULATOR && !userCode)
            }
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-md transition-all active:scale-[0.98]
              ${(!selectedOption && exercise.type === ExerciseType.MULTIPLE_CHOICE) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FFD200] text-black hover:brightness-95'}
            `}
          >
            ПРОВЕРИТЬ
          </button>
        ) : (
          <button
            onClick={() => onComplete(isCorrect!, exercise.xp)}
            className={`w-full py-4 rounded-2xl font-black text-white text-lg shadow-md flex items-center justify-center space-x-2 transition-all
              ${isCorrect ? 'bg-sky-600 hover:bg-sky-700' : 'bg-sky-500 hover:brightness-110'}
            `}
          >
            <span>ПРОДОЛЖИТЬ</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseRenderer;
