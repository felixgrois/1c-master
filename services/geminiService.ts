import { UserRole, UserSpecialization, Exercise, KBItem } from "../types";

export interface EvaluationResult {
  score: number;
  explanation: string;
  reaction: string;
  isExcellent: boolean;
}

export const generateAIQuestion = async (
  role: UserRole, 
  specialization: UserSpecialization, 
  level: number, 
  difficulty: number = 5, 
  context?: string
): Promise<Partial<Exercise>> => {
  try {
    const res = await fetch("/api/gemini/generate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, specialization, level, difficulty, context }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Client AI Generation Error:", error);
    return {
      question: "Какое основное назначение транзакций в СУБД при работе с платформой 1С?",
      options: [
        "Обеспечение целостности данных",
        "Увеличение дискового пространства",
        "Выгрузка конфигурации",
        "Создание бэкапа"
      ],
      correctAnswer: "Обеспечение целостности данных",
      explanation: "Транзакции гарантируют свойства ACІD (атомарность, согласованность, изолированность, долговечность), защищая данные от частичной или некорректной записи.",
      xp: 40
    };
  }
};

export const parseKBToExercises = async (
  kbText: string, 
  role: UserRole, 
  specialization: UserSpecialization
): Promise<Partial<Exercise>[]> => {
  try {
    const res = await fetch("/api/gemini/parse-kb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kbText, role, specialization }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Client parseKBToExercises Error:", e);
    return [];
  }
};

export const generateBusinessSituation = async (
  role: UserRole,
  specialization: UserSpecialization,
  gradation: string,
  difficulty: number,
  kbItems: KBItem[]
): Promise<string> => {
  try {
    const res = await fetch("/api/gemini/generate-situation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, specialization, gradation, difficulty, kbItems }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    return data.text;
  } catch (error) {
    console.error("Client generateBusinessSituation Error:", error);
    return "Привет! Давай разберем классическую ситуацию: в режиме управляемых блокировок для СУБД Postgres при проведении документов розничных продаж возникает дедлок (Deadlock). Как ты решишь эту проблему?";
  }
};

export const evaluateSituationResponse = async (
  situation: string,
  userResponse: string,
  role: UserRole,
  specialization: UserSpecialization
): Promise<EvaluationResult> => {
  try {
    const res = await fetch("/api/gemini/evaluate-situation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ situation, userResponse, role, specialization }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Client evaluateSituationResponse Error:", error);
    const score = (userResponse || '').length > 30 ? 85 : 55;
    return {
      score,
      explanation: "Эталонное решение заключается в правильной расстановке приоритетов блокировок объектов, использовании метода 'Заблокировать()' перед изменением данных транзакции и дроблении крупных транзакций.",
      reaction: score >= 85 
        ? "Отличный ответ! Ты ухватил самую суть оптимизации таблиц и индексов. Отличная работа!"
        : "Смотри, твой ответ концептуально верен, но стоит детальнее расписать работу с блокировками в транзакции. Давай двигаться дальше!",
      isExcellent: score >= 85
    };
  }
};

export const getIdealSolution = async (
  situation: string,
  role: UserRole,
  specialization: UserSpecialization
): Promise<EvaluationResult> => {
  try {
    const res = await fetch("/api/gemini/ideal-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ situation, role, specialization }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Client getIdealSolution Error:", e);
    return {
      score: 100,
      explanation: "Эталонное решение заключается в правильной расстановке приоритетов блокировок объектов, использовании метода 'Заблокировать()' перед изменением данных транзакции.",
      reaction: "Смотри, эталонное решение этой задачи заключается в добавлении явных управляемых блокировок перед проведением розничных продаж.",
      isExcellent: true
    };
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  // Returns empty string to let browser fallback safely on built-in SpeechSynthesis
  return "";
};

export const searchKnowledgeBase = async (query: string, kbItems: KBItem[]): Promise<string | null> => {
  if (kbItems.length === 0) return null;
  const match = kbItems.find(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
    item.content.toLowerCase().includes(query.toLowerCase())
  );
  return match ? match.content : null;
};

export const searchExpertAi = async (query: string): Promise<string> => {
  try {
    const res = await fetch("/api/gemini/search-expert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    return data.text;
  } catch (e) {
    console.error("Client searchExpertAi Error:", e);
    return "Смотри, твой вопрос отличный! Мы можем оптимизировать этот алгоритм через доработку общего модуля или перенос расчетов на серверную сторону.";
  }
};

export const chatWithMax = async (
  history: { role: 'user' | 'model', content: string }[]
): Promise<string> => {
  try {
    const res = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    return data.text;
  } catch (e) {
    console.error("Client chatWithMax Error:", e);
    return "Смотри, отличная тема для обсуждения! В 1С это реализуется с помощью подписки на события.";
  }
};

export const localKeywordSearch = (query: string, kbItems: KBItem[]): string | null => {
  if (kbItems.length === 0) return null;
  const lowercaseQuery = query.toLowerCase();
  for (const item of kbItems) {
    if (item.title.toLowerCase().includes(lowercaseQuery)) {
      return item.content;
    }
    for (const tag of item.tags) {
      if (tag.toLowerCase().includes(lowercaseQuery)) {
        return item.content;
      }
    }
  }
  return null;
};
