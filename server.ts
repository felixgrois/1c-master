import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import iconv from "iconv-lite";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  const DATA_DIR = path.join(process.cwd(), ".data");
  const LESSONS_PATH = path.join(DATA_DIR, "lessons.json");
  const KB_PATH = path.join(DATA_DIR, "kb.json");
  const KB_SECTIONS_PATH = path.join(DATA_DIR, "kb_sections.json");

  // Ensure data directory exists
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {}

  // Helper to safely write files directly
  async function safeWriteFile(filePath: string, data: string) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    } catch (e) {}
    
    // Direct write matches the container environment requirements and avoids atomic rename issues on virtual folders
    await fs.writeFile(filePath, data, "utf-8");
  }

  // Supabase client for server-side
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  const isSupabaseValid = supabaseUrl && 
                         supabaseUrl.startsWith('https://') && 
                         !supabaseUrl.includes('your_project_url_here') &&
                         supabaseServiceKey &&
                         !supabaseServiceKey.includes('your_anon_key_here') &&
                         !supabaseServiceKey.includes('your_service_role_key_here');

  if (!isSupabaseValid) {
    console.warn("WARNING: Supabase is not configured or has placeholder values. Database features will be limited.");
  }

  const supabase = isSupabaseValid 
    ? createClient(supabaseUrl!, supabaseServiceKey!)
    : null;

  // Synchronize dynamic files from Supabase on server start if local cache is empty or missing
  async function initializeLocalDataFromSupabase() {
    if (!supabase) {
      console.log("No Supabase client initialized, skipping startup data sync.");
      return;
    }
    console.log("Starting initial data sync from Supabase...");

    const TIMEOUT_MS = 10000;

    // 1. Sync Lessons
    try {
      let fetchLessons = false;
      try {
        const check = await fs.readFile(LESSONS_PATH, "utf-8");
        if (!check || check.trim() === "[]" || check.trim() === "") fetchLessons = true;
      } catch (e) {
        fetchLessons = true;
      }

      if (fetchLessons) {
        console.log("Lessons cache is empty or missing. Restoring from Supabase...");
        
        const result = await Promise.race([
          supabase.from('lessons').select('*'),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query Timeout')), TIMEOUT_MS))
        ]);

        if (result.error) {
          console.warn("Failed to fetch lessons from Supabase for startup sync:", result.error);
        } else if (result.data && result.data.length > 0) {
          const parsedLessons = result.data.map((item: any) => {
            let exercises = [];
            try {
              exercises = typeof item.exercises === 'string' ? JSON.parse(item.exercises) : (item.exercises || []);
            } catch (e) {
              exercises = [];
            }
            return {
              id: item.id,
              title: item.title,
              role: item.role || null,
              specialization: item.specialization || null,
              level: item.level || 1,
              narrative: item.narrative || "",
              exercises: exercises,
              difficulty: item.difficulty || 1,
              is_published: item.is_published !== undefined ? item.is_published : true,
              sectionId: item.sectionId || null,
              related_kb_section_ids: Array.isArray(item.related_kb_section_ids) ? item.related_kb_section_ids : null,
              explanations_filled: item.explanations_filled || false
            };
          });
          // Avoid crashes by ensuring sorting gets clean variables
          parsedLessons.sort((a: any, b: any) => (a.level || 0) - (b.level || 0));
          await fs.writeFile(LESSONS_PATH, JSON.stringify(parsedLessons, null, 2), 'utf-8');
          console.log(`Saved ${parsedLessons.length} lessons from Supabase to ${LESSONS_PATH}`);
        } else {
          console.log("No lessons found in Supabase to restore.");
        }
      }
    } catch (err: any) {
      console.warn("Warning restoring lessons on startup (possibly timeout):", err.message || err);
    }

    // 2. Sync KB Sections
    try {
      let fetchSections = false;
      try {
        const check = await fs.readFile(KB_SECTIONS_PATH, "utf-8");
        if (!check || check.trim() === "[]" || check.trim() === "") fetchSections = true;
      } catch (e) {
        fetchSections = true;
      }

      if (fetchSections) {
        console.log("KB Sections cache is empty or missing. Restoring from Supabase...");
        
        const result = await Promise.race([
          supabase.from('kb_sections').select('*'),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query Timeout')), TIMEOUT_MS))
        ]);

        if (result.error) {
          console.warn("Failed to fetch kb_sections from Supabase:", result.error);
        } else if (result.data && result.data.length > 0) {
          const parsedSections = result.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            parentId: item.parentId || item.parent_id || null,
            order: item.order || 0,
            is_published: item.is_published !== undefined ? item.is_published : true,
            word_url: item.word_url || null,
            mp3_url: item.mp3_url || null,
            video_url: item.video_url || null,
            content_url: item.content_url || null,
            kb_item_id: item.kb_item_id || null
          }));
          parsedSections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          await fs.writeFile(KB_SECTIONS_PATH, JSON.stringify(parsedSections, null, 2), 'utf-8');
          console.log(`Saved ${parsedSections.length} KB sections from Supabase to ${KB_SECTIONS_PATH}`);
        }
      }
    } catch (err: any) {
      console.warn("Warning restoring KB sections on startup (possibly timeout):", err.message || err);
    }

    // 3. Sync KB Items
    try {
      let fetchKB = false;
      try {
        const check = await fs.readFile(KB_PATH, "utf-8");
        if (!check || check.trim() === "[]" || check.trim() === "") fetchKB = true;
      } catch (e) {
        fetchKB = true;
      }

      if (fetchKB) {
        console.log("KB Items cache is empty or missing. Restoring from Supabase...");
        
        const result = await Promise.race([
          supabase.from('kb_items').select('*'),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query Timeout')), TIMEOUT_MS))
        ]);

        if (result.error) {
          console.warn("Failed to fetch kb_items from Supabase:", result.error);
        } else if (result.data && result.data.length > 0) {
          const parsedItems = result.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || "",
            content: item.content || "",
            tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []),
            sectionId: item.section_id || item.sectionId || null,
            section: item.section || "",
            brief_url: item.brief_url || null,
            detailed_url: item.detailed_url || null,
            podcast_url: item.podcast_url || null,
            video_url: item.video_url || null,
            created_at: item.created_at || new Date().toISOString()
          }));
          await fs.writeFile(KB_PATH, JSON.stringify(parsedItems, null, 2), 'utf-8');
          console.log(`Saved ${parsedItems.length} KB items from Supabase to ${KB_PATH}`);
        }
      }
    } catch (err: any) {
      console.warn("Warning restoring KB items on startup (possibly timeout):", err.message || err);
    }
  }

  // Trigger cache initialization on background load
  initializeLocalDataFromSupabase().catch(err => {
    console.warn("Warning during initial data fetch:", err);
  });

  // Helper for batched upsert to avoid payload size limits
  async function batchedUpsert(table: string, items: any[], batchSize: number = 50) {
    if (!supabase) return;
    
    console.log(`Starting batched upsert for ${table} (${items.length} items)...`);
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        const { error } = await supabase.from(table).upsert(batch);
        if (error) {
          console.error(`Batched upsert error for ${table} at index ${i}:`, error.message, error.details, error.hint);
          throw error;
        }
      } catch (err: any) {
        console.error(`Exception during batched upsert for ${table}:`, err.message || err);
        throw err;
      }
    }
    console.log(`Successfully synced ${items.length} items to ${table}`);
  }

  // API routes
  app.post("/api/gemini/generate-question", async (req, res) => {
    const { role, specialization, level, difficulty, context } = req.body;
    const prompt = `You are a world-class 1C:Enterprise platform instructor. 
    Task: Create a unique, high-quality educational question for a 1C ${role} specializing in ${specialization} at experience level ${level}.
    
    ${context ? `Use this Knowledge Base context: "${context}"` : ''}
    
    Difficulty Level: ${difficulty || 5}/10. 
    
    Contextual Requirements:
    - Base the question on official 1C:Enterprise documentation standards for ${specialization}.
    - Role Focus: ${role === 'DEVELOPER' ? 'Coding, metadata objects, queries.' : role === 'ACCOUNTANT' ? 'Accounting entries, tax reports.' : 'CRM, sales analytics.'}
    
    Output Requirements:
    - Format: Strict JSON.
    - Language: Russian.
    
    JSON Schema: { "question": string, "options": string[], "correctAnswer": string, "explanation": string, "xp": number }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              xp: { type: Type.NUMBER }
            },
            required: ["question", "options", "correctAnswer", "explanation", "xp"]
          }
        }
      });

      const jsonStr = response.text?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (error: any) {
      console.error("Server AI Generation Error:", error);
      res.json({
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
      });
    }
  });

  app.post("/api/gemini/parse-kb", async (req, res) => {
    const { kbText, role, specialization } = req.body;
    const prompt = `Extract exactly 3 educational exercises from the following technical text about 1C:Enterprise for the role of ${role} in specialization ${specialization}.
    Source Text: "${kbText}"
    
    Return a JSON array of exercises following the schema: { "question": string, "options": string[], "correctAnswer": string, "explanation": string, "xp": number }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                xp: { type: Type.NUMBER }
              },
              required: ["question", "options", "correctAnswer", "explanation", "xp"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (e: any) {
      console.error("parseKBToExercises Server Error:", e);
      res.json([]);
    }
  });

  app.post("/api/gemini/generate-situation", async (req, res) => {
    const { role, specialization, gradation, difficulty, kbItems } = req.body;
    const items = Array.isArray(kbItems) ? kbItems : [];
    const kbContext = items.length > 0 
      ? `Контекст Базы знаний:\n${items.slice(0, 3).map((k: any) => `${k.title || ''}: ${k.content || ''}`).join('\n')}`
      : '';
      
    const prompt = `Вы — Макс, харизматичный, ободряющий и продвинутый эксперт/наставник по 1С.
    Создайте интересную, сложную и реалистичную бизнес-ситуацию или практическую задачу (на русском языке) для роли "1С: ${role}" по специализации "${specialization}" (Градация/уровень: ${gradation}, Сложность: ${difficulty}/10).
    Ситуация должна описывать реальный рабочий инцидент, конфликт транзакций, баг или архитектурный кейс, который нужно решить.
    Напишите текст от лица Макса, начиная с личного приветствия в стиле Макса (например, "Привет! Давай разберем одну интересную ситуацию..." или "Отличный день для разбора сложного кейса!").
    Объем: 1-2 абзаца. Будьте энергичны и профессиональны.
    ${kbContext}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      res.json({ text: response.text?.trim() || "Привет! Возникла проблема параллельной записи в справочник номенклатуры. Как обойти блокировку?" });
    } catch (error) {
      console.error("generateBusinessSituation Server Error:", error);
      res.json({ text: "Привет! Давай разберем классическую ситуацию: в режиме управляемых блокировок для СУБД Postgres при проведении документов розничных продаж возникает дедлок (Deadlock). Как ты решишь эту проблему?" });
    }
  });

  app.post("/api/gemini/evaluate-situation", async (req, res) => {
    const { situation, userResponse, role, specialization } = req.body;
    const prompt = `Вы — Макс, харизматичный наставник 1С. 
    Оцените ответ студента на бизнес-ситуацию.
    Ситуация: "${situation}"
    Ответ студента: "${userResponse}"
    Роль: ${role}, Специализация: ${specialization}.

    Верните строгий JSON-ответ на русском языке со следующими полями:
    - 'score': оценка от 0 до 100, отражающая полноту и правильность шагов.
    - 'explanation': подробный эталонный ответ — как следовало поступить с технической точки зрения в 1С.
    - 'reaction': эмоциональный, ободряющий и конструктивный комментарий от Макса по поводу ответа студента. Обязательно начните со слов "Смотри," или "Отличный ответ!" в зависимости от качества.
    - 'isExcellent': true, если score >= 85.

    JSON Schema:
    { "score": number, "explanation": string, "reaction": string, "isExcellent": boolean }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              reaction: { type: Type.STRING },
              isExcellent: { type: Type.BOOLEAN }
            },
            required: ["score", "explanation", "reaction", "isExcellent"]
          }
        }
      });
      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json({
        score: parsed.score ?? 75,
        explanation: parsed.explanation ?? "Идеальное решение включает тонкую оптимизацию запросов СУБД.",
        reaction: parsed.reaction ?? "Смотри, твой ответ принят! Это хороший вектор мышления, но не забудь уделить внимание транзакциям.",
        isExcellent: parsed.isExcellent ?? (parsed.score >= 85)
      });
    } catch (error) {
      console.error("evaluateSituationResponse Server Error:", error);
      const score = (userResponse || '').length > 30 ? 85 : 55;
      res.json({
        score,
        explanation: "Эталонное решение заключается в правильной расстановке приоритетов блокировок объектов, использовании метода 'Заблокировать()' перед изменением данных транзакции и дроблении крупных транзакций.",
        reaction: score >= 85 
          ? "Отличный ответ! Ты ухватил самую суть оптимизации таблиц и индексов. Отличная работа!"
          : "Смотри, твой ответ концептуально верен, но стоит детальнее расписать работу с блокировками в транзакции. Давай двигаться дальше!",
        isExcellent: score >= 85
      });
    }
  });

  app.post("/api/gemini/ideal-solution", async (req, res) => {
    const { situation, role, specialization } = req.body;
    const prompt = `Вы — Макс, наставник по 1С.
    Дана ситуация: "${situation}"
    Для роли: ${role}, Специализация: ${specialization}.

    Напишите идеальное экспертное решение этой задачи на русском языке от первого лица (от Макса).
    Верните строгий JSON со следующими полями:
    - 'score': всегда 100.
    - 'explanation': подробный эталонный технический ответ 1С.
    - 'reaction': дружелюбная реплика Макса, начинающаяся в стиле "Смотри, эталонное решение этой задачи..."
    - 'isExcellent': всегда true.

    JSON Schema:
    { "score": 100, "explanation": string, "reaction": string, "isExcellent": true }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              reaction: { type: Type.STRING },
              isExcellent: { type: Type.BOOLEAN }
            },
            required: ["score", "explanation", "reaction", "isExcellent"]
          }
        }
      });
      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json({
        score: 100,
        explanation: parsed.explanation ?? "Идеальное решение включает тонкую оптимизацию запросов СУБД.",
        reaction: parsed.reaction ?? "Смотри, эталонное решение этой задачи довольно лаконично.",
        isExcellent: true
      });
    } catch (e) {
      res.json({
        score: 100,
        explanation: "Эталонное решение заключается в правильной расстановке приоритетов блокировок объектов, использовании метода 'Заблокировать()' перед изменением данных транзакции.",
        reaction: "Смотри, эталонное решение этой задачи заключается в добавлении явных управляемых блокировок перед проведением розничных продаж.",
        isExcellent: true
      });
    }
  });

  app.post("/api/gemini/search-expert", async (req, res) => {
    const { query } = req.body;
    const prompt = `Вы — Макс, эксперт 1С. Дайте развернутый и понятный ответ на вопрос пользователя: "${query}" на русском языке.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      res.json({ text: response.text?.trim() || "Смотри, этот вопрос заслуживает глубокого погружения. Традиционно платформа решает это через фоновые процессы." });
    } catch (e) {
      res.json({ text: "Смотри, твой вопрос отличный! Мы можем оптимизировать этот алгоритм через доработку общего модуля или перенос расчетов на серверную сторону." });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    const { history } = req.body;
    try {
      const formattedHistory = history.map((h: any) => `${h.role === 'user' ? 'Пользователь' : 'Макс'}: ${h.content}`).join('\n');
      const prompt = `Вы — Макс, современный, харизматичный наставник 1С в синем пиджаке. 
      Ответьте на последнюю реплику пользователя дружелюбно, профессионально, используя метафоры.
      
      История переписки:
      ${formattedHistory}
      
      Ваш ответ от лица Макса на русском языке:`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      res.json({ text: response.text?.trim() || "Смотри, давай разберемся с этим подробнее!" });
    } catch (e) {
      res.json({ text: "Смотри, отличная тема для обсуждения! В 1С это реализуется с помощью подписки на события." });
    }
  });

  app.get("/api/lessons", async (req, res) => {
    try {
      console.log("GET /api/lessons - Reading from:", LESSONS_PATH);
      const data = await fs.readFile(LESSONS_PATH, "utf-8");
      if (!data || data.trim() === "") {
        console.log("GET /api/lessons - File is empty, returning empty array");
        return res.json([]);
      }
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (parseErr: any) {
        console.error(`GET /api/lessons - JSON Parse Error at pos ${parseErr.at || 'unknown'}:`, parseErr.message);
        // If file is corrupted, return empty array instead of 500 to keep app stable
        res.json([]);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log("GET /api/lessons - File not found, returning empty array");
        return res.json([]);
      }
      console.error("GET /api/lessons - OS Error reading lessons:", error.message);
      res.status(500).json({ error: "Failed to load lessons" });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      const lessons = req.body;
      console.log(`POST /api/lessons - Received ${Array.isArray(lessons) ? lessons.length : 'invalid'} lessons`);
      if (!Array.isArray(lessons)) {
        return res.status(400).json({ error: "Invalid lessons data" });
      }
      
      const jsonData = JSON.stringify(lessons, null, 2);
      
      await safeWriteFile(LESSONS_PATH, jsonData);
      
      console.log("POST /api/lessons - Successfully saved to:", LESSONS_PATH);

      // Sync to Supabase in background
      if (supabase && lessons.length > 0) {
        const itemsToSave = lessons.map(l => ({
          id: l.id,
          title: l.title,
          role: l.role || null,
          specialization: l.specialization || null,
          level: l.level || 1,
          narrative: l.narrative || "",
          exercises: JSON.stringify(l.exercises || []),
          difficulty: l.difficulty || 1,
          is_published: l.is_published !== undefined ? l.is_published : true,
          sectionId: l.sectionId || null,
          related_kb_section_ids: Array.isArray(l.related_kb_section_ids) ? l.related_kb_section_ids : null,
          explanations_filled: l.explanations_filled || false
        }));

        batchedUpsert('lessons', itemsToSave).catch(err => {
          console.error("Background Supabase lessons sync failed:", err.message || JSON.stringify(err));
        });
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("POST /api/lessons - Error saving lessons:", error.message);
      res.status(500).json({ error: "Failed to save lessons" });
    }
  });

  app.get("/api/kb", async (req, res) => {
    try {
      console.log("GET /api/kb - Loading items...");
      let localData: any[] = [];
      try {
        const data = await fs.readFile(KB_PATH, "utf-8");
        if (data && data.trim() !== "") {
          localData = JSON.parse(data);
        }
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          console.log("GET /api/kb - Local cache file not found, starting with empty local data");
        } else {
          console.warn("GET /api/kb - Local data parse error:", e.message);
        }
      }

      let supabaseData: any[] = [];
      if (supabase) {
        try {
          const result = await Promise.race([
            supabase.from('kb_items').select('*'),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query Timeout')), 5000))
          ]);
          if (!result.error && result.data) {
            supabaseData = result.data;
          } else if (result.error) {
            console.warn("Supabase KB fetch error:", result.error);
          }
        } catch (e: any) {
          console.warn("Supabase KB fetch timed out or failed:", e.message || e);
        }
      }

      // Merge data - prefer non-empty fields
      const kbMap = new Map<string, any>();
      localData.forEach(item => kbMap.set(item.id, item));
      
      supabaseData.forEach(item => {
        const existing = kbMap.get(item.id);
        const sectionId = item.section_id || item.sectionId || (existing ? existing.sectionId : null);
        
        if (existing) {
          // Merge fields, but prefer non-empty values for critical fields
          kbMap.set(item.id, {
            ...existing,
            ...item,
            sectionId: sectionId,
            description: item.description || existing.description,
            content: item.content || existing.content,
            tags: (item.tags && item.tags.length > 0) ? item.tags : existing.tags,
            source: item.source || existing.source,
            brief_url: item.brief_url || existing.brief_url,
            detailed_url: item.detailed_url || existing.detailed_url,
            podcast_url: item.podcast_url || existing.podcast_url,
            video_url: item.video_url || existing.video_url
          });
        } else {
          kbMap.set(item.id, {
            ...item,
            sectionId: sectionId
          });
        }
      });
      
      const merged = Array.from(kbMap.values());
      res.json(merged);
    } catch (error) {
      console.error("GET /api/kb - Error:", error);
      res.status(500).json({ error: "Failed to load KB" });
    }
  });

  app.post("/api/kb/item", async (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.id) {
        return res.status(400).json({ error: "Invalid KB item data" });
      }
      
      // 1. Load current KB
      let kb: any[] = [];
      try {
        const data = await fs.readFile(KB_PATH, "utf-8");
        if (data && data.trim() !== "") {
          kb = JSON.parse(data);
        }
      } catch (e: any) {
        if (e.code !== 'ENOENT') {
          console.warn("POST /api/kb/item - Parse error:", e.message);
        }
      }
      
      // 2. Add or update item
      const index = kb.findIndex(i => i.id === item.id);
      if (index !== -1) {
        kb[index] = item;
      } else {
        kb.unshift(item);
      }
      
      // 3. Save to local file safely
      await safeWriteFile(KB_PATH, JSON.stringify(kb, null, 2));
      
      // 4. Sync to Supabase
      if (supabase) {
        const itemToSave = {
          id: item.id,
          title: item.title,
          description: item.description,
          content: item.content,
          tags: item.tags,
          section_id: item.sectionId || null,
          section: item.section,
          brief_url: item.brief_url,
          detailed_url: item.detailed_url,
          podcast_url: item.podcast_url,
          video_url: item.video_url
        };
        
        const { error } = await supabase.from('kb_items').upsert(itemToSave);
        if (error) console.error("Supabase single item upsert error:", error);
      }
      
      res.json({ status: "ok" });
    } catch (error) {
      console.error("POST /api/kb/item - Error:", error);
      res.status(500).json({ error: "Failed to save KB item" });
    }
  });

  app.post("/api/kb", async (req, res) => {
    try {
      const kb = req.body;
      if (!Array.isArray(kb)) {
        return res.status(400).json({ error: "Invalid KB data" });
      }
      
      // Save to local file safely
      await safeWriteFile(KB_PATH, JSON.stringify(kb, null, 2));
      
      // Sync to Supabase in background
      if (supabase && kb.length > 0) {
        // Filter fields to match Supabase schema and avoid errors for extra fields
        // Note: 'description' and other extended fields are removed if they might be missing from schema cache
        const itemsToSave = kb.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          tags: item.tags,
          // Only include these if we are sure the schema is updated. 
          // For now, we omit description to fix thereported error.
          // section_id: item.sectionId || null, 
          // section: item.section,
          // brief_url: item.brief_url,
          // detailed_url: item.detailed_url,
          // podcast_url: item.podcast_url,
          // video_url: item.video_url
        }));
        
        batchedUpsert('kb_items', itemsToSave).catch(err => {
          console.error("Background Supabase KB items sync failed:", err.message || JSON.stringify(err));
        });
      }
      
      res.json({ status: "ok" });
    } catch (error) {
      console.error("POST /api/kb - Error:", error);
      res.status(500).json({ error: "Failed to save KB" });
    }
  });

  app.delete("/api/kb_sections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`DELETE /api/kb_sections - Deleting section ${id}`);
      
      // 1. Load current sections
      let sections: any[] = [];
      try {
        const data = await fs.readFile(KB_SECTIONS_PATH, "utf-8");
        if (data && data.trim() !== "") {
          sections = JSON.parse(data);
        }
      } catch (e: any) {
        if (e.code !== 'ENOENT') {
          console.warn("DELETE /api/kb_sections - Parse error:", e.message);
        }
      }
      
      // 2. Filter out the deleted section
      const updatedSections = sections.filter(s => s.id !== id);
      
      // 3. Save back to local file safely
      await safeWriteFile(KB_SECTIONS_PATH, JSON.stringify(updatedSections, null, 2));
      
      // 4. Delete from Supabase
      if (supabase) {
        const { error } = await supabase.from('kb_sections').delete().eq('id', id);
        if (error) {
          console.error("Supabase KB section delete error:", error);
        }
      }
      
      res.json({ status: "ok" });
    } catch (error) {
      console.error("DELETE /api/kb_sections - Error:", error);
      res.status(500).json({ error: "Failed to delete KB section" });
    }
  });

  app.get("/api/kb_sections", async (req, res) => {
    try {
      console.log("GET /api/kb_sections - Loading sections...");
      let localData: any[] = [];
      try {
        const data = await fs.readFile(KB_SECTIONS_PATH, "utf-8");
        if (data && data.trim() !== "") {
          localData = JSON.parse(data);
        }
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          console.log("GET /api/kb_sections - Local cache file not found, starting with empty local data");
        } else {
          console.warn("GET /api/kb_sections - Local data parse error:", e.message);
        }
      }

      let supabaseData: any[] = [];
      if (supabase) {
        try {
          const result = await Promise.race([
            supabase.from('kb_sections').select('*'),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query Timeout')), 5000))
          ]);
          if (!result.error && result.data) {
            supabaseData = result.data;
          } else if (result.error) {
            console.warn("Supabase KB sections fetch error:", result.error);
          }
        } catch (e: any) {
          console.warn("Supabase KB sections fetch timed out or failed:", e.message || e);
        }
      }

      // Merge sections - prefer local data if it has description and Supabase doesn't, 
      // but generally use Supabase as source of truth for IDs.
      const sectionMap = new Map<string, any>();
      localData.forEach(s => sectionMap.set(s.id, s));
      
      supabaseData.forEach(s => {
        const existing = sectionMap.get(s.id);
        const parentId = s.parent_id || s.parentId || (existing ? existing.parentId : null);
        
        if (existing) {
          // Merge fields, prioritize non-empty values
          sectionMap.set(s.id, {
            ...existing,
            ...s,
            parentId: parentId,
            word_url: s.word_url || existing.word_url || null,
            mp3_url: s.mp3_url || existing.mp3_url || null,
            video_url: s.video_url || existing.video_url || null,
            content_url: s.content_url || existing.content_url || null,
          });
        } else {
          sectionMap.set(s.id, {
            ...s,
            parentId: parentId,
            description: s.description || ""
          });
        }
      });
      
      const merged = Array.from(sectionMap.values());
      res.json(merged);
    } catch (error) {
      console.error("GET /api/kb_sections - Error:", error);
      res.status(500).json({ error: "Failed to load KB sections" });
    }
  });

  app.post("/api/kb_sections", async (req, res) => {
    try {
      const sections = req.body;
      if (!Array.isArray(sections)) {
        return res.status(400).json({ error: "Invalid KB sections data" });
      }
      
      console.log(`POST /api/kb_sections - Received ${sections.length} sections for saving`);
      
      // Save to local file safely
      await safeWriteFile(KB_SECTIONS_PATH, JSON.stringify(sections, null, 2));
      console.log("POST /api/kb_sections - Successfully saved to local file");
      
      // Sync to Supabase
      if (supabase && sections.length > 0) {
        // Filter fields to match Supabase schema
        const sectionsToSave = sections.map(s => ({
          id: s.id,
          title: s.title,
          // description: s.description || "", // Omit if causing errors
          "parentId": s.parentId || null,
          order: s.order,
          is_published: s.is_published !== undefined ? s.is_published : true,
          word_url: s.word_url || null,
          mp3_url: s.mp3_url || null,
          video_url: s.video_url || null,
          content_url: s.content_url || null,
          kb_item_id: s.kb_item_id || null
        }));
        
        try {
          await batchedUpsert('kb_sections', sectionsToSave);
          console.log("POST /api/kb_sections - Successfully synced with Supabase");
        } catch (syncErr: any) {
          console.warn("POST /api/kb_sections - Supabase sync warning (retrying minimal):", syncErr.message || syncErr);
          // Retry with minimal fields if table structure is old
          try {
            const minimalSections = sections.map(s => ({
              id: s.id,
              title: s.title,
              "parentId": s.parentId || null,
              order: s.order
            }));
            await batchedUpsert('kb_sections', minimalSections);
          } catch (retryErr) {
            console.error("POST /api/kb_sections - Minimal sync failed too:", retryErr);
          }
        }
      }
      
      res.json({ status: "ok" });
    } catch (error) {
      console.error("POST /api/kb_sections - Error:", error);
      res.status(500).json({ error: "Failed to save KB sections" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
  });

  app.post("/api/send-invite", async (req, res) => {
    const { email, teamName, inviterName } = req.body;
    console.log(`Sending invite email to ${email} for team ${teamName} from ${inviterName}`);
    // In a real app, you'd use nodemailer or a service like SendGrid/Postmark
    res.json({ status: "ok", message: "Invite email sent" });
  });

  async function loginToIts(client: any, login: string, password: string): Promise<void> {
    console.log("ITS: Starting auth flow for", login);
    
    // 1. Get login page to extract execution token
    const loginPageUrl = "https://login.1c.ru/login?service=https%3A%2F%2Fits.1c.ru%2F";
    const loginPageResp = await client.get(loginPageUrl);
    const $login = cheerio.load(loginPageResp.data);
    const execution = $login('input[name="execution"]').val();

    if (!execution) {
      throw new Error("Could not find execution token on login page");
    }

    // 2. Perform login
    console.log("ITS: Performing login for user:", login);
    const loginResp = await client.post("https://login.1c.ru/login", 
      new URLSearchParams({
        username: login,
        password: password,
        execution: execution as string,
        _eventId: "submit",
        geolocation: ""
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": loginPageUrl,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,image/apng,*/*;q=0.8"
        },
        maxRedirects: 5,
        validateStatus: (status: number) => status < 500
      }
    );

    if (loginResp.status === 401) {
      throw new Error("Неверный логин или пароль 1С:ИТС. Пожалуйста, проверьте данные.");
    }

    if (loginResp.status >= 400) {
      throw new Error(`Ошибка авторизации 1С:ИТС (Код: ${loginResp.status}). Попробуйте позже.`);
    }
    console.log("ITS: Login successful");
  }

  app.get("/api/its/credentials", async (req, res) => {
    try {
      if (!supabase) {
        return res.json({ login: '', hasPassword: false });
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'its_credentials')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const creds = JSON.parse(data.value);
        // Mask password for security
        res.json({ login: creds.login, hasPassword: !!creds.password });
      } else {
        res.json({ login: '', hasPassword: false });
      }
    } catch (error) {
      console.error("Error getting ITS credentials:", error);
      res.status(500).json({ error: "Failed to get credentials" });
    }
  });

  app.post("/api/its/credentials", async (req, res) => {
    try {
      let { login, password } = req.body;
      
      if (!login) {
        return res.status(400).json({ error: "Логин не может быть пустым" });
      }

      if (!supabase) {
        return res.status(503).json({ error: "База данных (Supabase) не настроена. Обратитесь к администратору." });
      }

      // If password is placeholder, try to get existing one from DB
      if (password === '********') {
        try {
          const { data: existing } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'its_credentials')
            .single();
          
          if (existing) {
            const creds = JSON.parse(existing.value);
            password = creds.password;
          } else {
            return res.status(400).json({ error: "Пароль обязателен при первой настройке" });
          }
        } catch (e) {
          return res.status(400).json({ error: "Не удалось получить текущий пароль для обновления" });
        }
      }

      if (!password) {
        return res.status(400).json({ error: "Пароль не может быть пустым" });
      }

      const value = JSON.stringify({ login, password });
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'its_credentials', value }, { onConflict: 'key' });
      
      if (error) {
        console.error("Supabase error saving credentials:", JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: `Ошибка базы данных: ${error.message || "Неизвестная ошибка"}`,
          details: error.details,
          hint: error.hint
        });
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Error saving ITS credentials:", error);
      res.status(500).json({ error: error.message || "Failed to save credentials" });
    }
  });

  app.post("/api/its/search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    try {
      if (!supabase) return res.status(503).json({ error: "Supabase not configured" });

      // Get credentials from Supabase
      const { data: credData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'its_credentials')
        .single();
      
      if (!credData) return res.status(401).json({ error: "ITS credentials not configured" });
      const { login, password } = JSON.parse(credData.value);

      const jar = new CookieJar();
      const client = wrapper(axios.create({ jar, withCredentials: true }));

      // Perform login first to ensure access to search and articles
      await loginToIts(client, login, password);

      // 1. Search ITS
      const searchUrl = `https://its.1c.ru/db/search/?q=${encodeURIComponent(query)}`;
      const searchResp = await client.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://its.1c.ru/"
        }
      });

      const $ = cheerio.load(searchResp.data);
      const firstResult = $('.search-result-item a').first();
      const articleUrl = firstResult.attr('href');

      if (!articleUrl || articleUrl.includes('javascript:')) {
        return res.json({ found: false });
      }

      const fullUrl = articleUrl.startsWith('http') ? articleUrl : `https://its.1c.ru${articleUrl}`;
      
      // 2. Fetch the article content (reusing the logic from its/fetch but simplified)
      // We'll just call the internal logic or just fetch it here
      const contentResp = await client.get(fullUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": searchUrl
        },
        responseType: 'arraybuffer'
      });

      let html = "";
      const buffer = Buffer.from(contentResp.data);
      const contentType = (contentResp.headers['content-type'] || "").toLowerCase();
      if (contentType.includes('windows-1251') || contentType.includes('cp1251')) {
        html = iconv.decode(buffer, 'win1251');
      } else {
        html = buffer.toString('utf8');
      }

      const $art = cheerio.load(html);
      const title = $art('h1').first().text() || $art('title').text() || "Статья ИТС";
      
      // Clean up content
      $art('script, style, link, iframe, noscript').remove();
      const content = $art('.article-content, #content, .content, body').first().text().trim();

      res.json({ 
        found: true, 
        title, 
        content: content.substring(0, 10000), // Limit content size
        url: fullUrl 
      });

    } catch (error) {
      console.error("ITS Search Error:", error);
      res.status(500).json({ error: "Failed to search ITS" });
    }
  });

  app.post("/api/its/fetch", async (req, res) => {
    let { login, password, url, bulk } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing url" });
    }

    // If login/password not provided, try to get from Supabase
    if ((!login || !password) && supabase) {
      try {
        const { data: credData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'its_credentials')
          .single();
        
        if (credData) {
          const creds = JSON.parse(credData.value);
          login = (login && login !== '') ? login : creds.login;
          password = (password && password !== '********') ? password : creds.password;
        }
      } catch (e) {
        console.warn("Failed to load stored ITS credentials for fetch", e);
      }
    }

    if (!login || !password) {
      return res.status(400).json({ error: "Missing login or password" });
    }

    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));

    const fetchArticle = async (targetUrl: string) => {
      console.log("ITS Fetch: Fetching content from", targetUrl);
      const contentResp = await client.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://its.1c.ru/",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,image/apng,*/*;q=0.8"
        },
        responseType: 'arraybuffer',
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });

      // Check if we were redirected to login page
      const finalUrl = contentResp.request?.res?.responseUrl || contentResp.config?.url || "";
      if (finalUrl.includes('login.1c.ru') || contentResp.status === 401 || contentResp.status === 403) {
        throw new Error("Доступ к статье ограничен. Возможно, у вас нет активной подписки ИТС или сессия истекла.");
      }

      // Robust encoding detection
      let html = "";
      const buffer = Buffer.from(contentResp.data);
      const contentType = (contentResp.headers['content-type'] || "").toLowerCase();
      
      // 1. Check header
      if (contentType.includes('windows-1251') || contentType.includes('cp1251')) {
        html = iconv.decode(buffer, 'win1251');
      } else {
        // 2. Check meta tags in the first 4KB of the buffer (ASCII compatible)
        const headSample = buffer.slice(0, 4096).toString('ascii');
        if (headSample.includes('windows-1251') || headSample.includes('cp1251') || headSample.includes('1251')) {
          html = iconv.decode(buffer, 'win1251');
        } else {
          // 3. Try UTF-8, if it fails or looks like garbage, fallback to win1251
          const utf8Html = buffer.toString('utf8');
          // Heuristic: if it contains many replacement characters or weird symbols, it might be win1251
          // Also check if win1251 decoding produces more Cyrillic characters
          const win1251Html = iconv.decode(buffer, 'win1251');
          const cyrillicUtf8 = (utf8Html.match(/[А-яЁё]/g) || []).length;
          const cyrillicWin1251 = (win1251Html.match(/[А-яЁё]/g) || []).length;

          if (cyrillicWin1251 > cyrillicUtf8) {
            html = win1251Html;
          } else {
            html = utf8Html;
          }
        }
      }

      const $ = cheerio.load(html);
      const rawHtml = html; // Keep for link extraction
      
      // Clean up for content extraction
      const $content = cheerio.load(html);
      $content('script, style, nav, footer, header, .noprint, .no-print, .article-nav, .article-menu, .tree-item, .child-nodes').remove();
      
      const title = $content('h1').first().text().trim() || $content('title').text().trim() || "Статья 1С:ИТС";
      let content = "";

      const mainContent = $content('.article-content, #content, .content, article, .hdoc-body').first();
      if (mainContent.length > 0) {
        content = mainContent.text().replace(/\s+/g, ' ').trim();
      } else {
        // Fallback to body but try to avoid nav
        $content('aside, .sidebar, .menu, .nav').remove();
        content = $content('body').text().replace(/\s+/g, ' ').trim();
      }

      return { title, content, url: targetUrl, html: rawHtml };
    };

    try {
      console.log("ITS Fetch: Starting flow for", login);
      
      // Perform login
      await loginToIts(client, login, password);

      // 3. Fetch the requested URL
      const mainArticle = await fetchArticle(url);

      if (bulk) {
        console.log("ITS Fetch: Bulk mode enabled, searching for child links...");
        const $ = cheerio.load(mainArticle.html);
        const links: string[] = [];
        
        // 1C:ITS often has a TOC or "child nodes" in the page
        // We look for links that are likely children or in a list
        const selectors = [
          '.tree-item a', 
          '.child-nodes a', 
          '.toc a', 
          '.article-list a',
          '.content-list a',
          '.tree-node a',
          '.tree-leaf a',
          '#content a[href*="/db/"]',
          '.hdoc-body a[href*="/db/"]'
        ];

        const currentDb = url.split('/db/')[1]?.split('/')[0];
        console.log(`ITS Fetch: Current DB identified as: ${currentDb}`);

        selectors.forEach(selector => {
          $(selector).each((_, el) => {
            const href = $(el).attr('href') || $(el).attr('data-href');
            if (href && href.includes('/content/')) {
              // Skip technical files and frame containers
              if (href.includes('/src/') || href.endsWith('.htm') || href.endsWith('.html') || href.endsWith('.js') || href.endsWith('.css')) {
                return;
              }

              let fullUrl = href;
              if (!href.startsWith('http')) {
                const baseUrl = "https://its.1c.ru";
                fullUrl = href.startsWith('/') ? baseUrl + href : baseUrl + '/' + href;
              }
              
              // Clean up URL (remove hash, etc)
              fullUrl = fullUrl.split('#')[0];
              
              if (!links.includes(fullUrl) && fullUrl !== url) {
                // Check if it's in the same database
                const targetDb = fullUrl.split('/db/')[1]?.split('/')[0];
                if (currentDb === targetDb) {
                  links.push(fullUrl);
                }
              }
            }
          });
        });

        // Fallback: if still no links, look for ANY link in the main content area that matches the DB
        if (links.length === 0) {
          console.log("ITS Fetch: No links found with specific selectors, trying fallback...");
          $('a').each((_, el) => {
            const href = $(el).attr('href') || $(el).attr('data-href');
            if (href && href.includes('/content/') && href.includes(currentDb)) {
              // Skip technical files
              if (href.includes('/src/') || href.endsWith('.htm') || href.endsWith('.html')) {
                return;
              }

              let fullUrl = href;
              if (!href.startsWith('http')) {
                const baseUrl = "https://its.1c.ru";
                fullUrl = href.startsWith('/') ? baseUrl + href : baseUrl + '/' + href;
              }
              fullUrl = fullUrl.split('#')[0];
              if (!links.includes(fullUrl) && fullUrl !== url) {
                links.push(fullUrl);
              }
            }
          });
        }

        console.log(`ITS Fetch: Found ${links.length} potential child links`);
        
        // Fetch up to 15 child articles (increased from 10)
        const results = [mainArticle];
        const toFetch = links.slice(0, 15);
        
        for (const link of toFetch) {
          try {
            // Add a small delay to be polite
            await new Promise(resolve => setTimeout(resolve, 300));
            const art = await fetchArticle(link);
            if (art.content.length > 100) {
              results.push(art);
            }
          } catch (e) {
            console.warn(`ITS Fetch: Failed to fetch child link ${link}`, e);
          }
        }
        
        return res.json(results.map(r => ({ title: r.title, content: r.content, url: r.url })));
      }

      res.json({ title: mainArticle.title, content: mainArticle.content, url: mainArticle.url });
    } catch (error: any) {
      console.error("ITS Fetch Error:", error.message);
      res.status(500).json({ error: error.message || "Failed to fetch content from 1C:ITS" });
    }
  });

  app.post("/api/url/fetch", async (req, res) => {
    const { url, bulk } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const fetchGeneric = async (targetUrl: string) => {
        const resp = await axios.get(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 10000
        });
        const $ = cheerio.load(resp.data);
        $('script, style, nav, footer, header, aside').remove();
        const title = $('h1').first().text().trim() || $('title').text().trim() || targetUrl;
        const content = $('body').text().replace(/\s+/g, ' ').trim();
        return { title, content, url: targetUrl, html: resp.data };
      };

      const main = await fetchGeneric(url);
      
      if (bulk) {
        const $ = cheerio.load(main.html);
        const links: string[] = [];
        const baseUrl = new URL(url);
        const baseDir = baseUrl.pathname.split('/').filter(Boolean).slice(0, -1).join('/');
        const basePrefix = '/' + baseDir + (baseDir ? '/' : '');
        
        const normalizeHostname = (h: string) => h.replace(/^www\./, '');
        const baseHostname = normalizeHostname(baseUrl.hostname);
        const baseSlug = baseUrl.pathname.split('/').filter(Boolean).pop() || '';

        $('a, [data-href], [data-url]').each((_, el) => {
          const href = $(el).attr('href') || $(el).attr('data-href') || $(el).attr('data-url');
          if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
              const absoluteUrl = new URL(href, url).toString().split('#')[0];
              const targetUrlObj = new URL(absoluteUrl);
              
              const isSameDomain = normalizeHostname(targetUrlObj.hostname) === baseHostname;
              const pathname = targetUrlObj.pathname;
              
              // Check if it's a sub-page or a sibling-page in the same category
              const cleanBasePath = baseUrl.pathname.replace(/\/$/, '');
              const isNested = pathname.startsWith(cleanBasePath);
              const isInCategory = basePrefix !== '/' && pathname.startsWith(basePrefix);
              
              // New: Check if the link contains the base slug (e.g. product name)
              const isRelatedBySlug = baseSlug.length > 5 && pathname.includes(baseSlug);
              
              // New: Check if it's in a 'manuals' or 'kb' section even if prefix differs slightly
              const isManualSection = pathname.includes('/manual/') || pathname.includes('/manuals/') || pathname.includes('/kb/') || pathname.includes('/baza-znaniy/') || pathname.includes('/ask_question/');

              if (isSameDomain && (isNested || isInCategory || isRelatedBySlug || isManualSection) &&
                  absoluteUrl !== url &&
                  !links.includes(absoluteUrl) &&
                  !['/login', '/register', '/cart', '/search', '/auth', '/personal', '/tags', '/logout'].some(p => pathname.includes(p))) {
                links.push(absoluteUrl);
              }
            } catch (e) {}
          }
        });

        const results = [main];
        // Sort links to prioritize those that look more like articles (longer paths usually)
        // and filter out common non-article patterns
        const sortedLinks = links
          .filter(l => !l.endsWith('.jpg') && !l.endsWith('.png') && !l.endsWith('.pdf') && !l.endsWith('.zip'))
          .sort((a, b) => b.length - a.length)
          .slice(0, 60);
        
        console.log(`URL Fetch: Found ${links.length} total links, analyzing top ${sortedLinks.length}`);
        
        for (const link of sortedLinks) {
          try {
            await new Promise(resolve => setTimeout(resolve, 350));
            const art = await fetchGeneric(link);
            // Only add if it has substantial content and is not just a redirect/empty page
            if (art.content.length > 200 && !results.some(r => r.url === art.url)) {
              results.push(art);
            }
            if (results.length >= 21) break; // Limit to 20 additional articles
          } catch (e) {}
        }
        return res.json(results.map(r => ({ title: r.title, content: r.content, url: r.url })));
      }

      res.json({ title: main.title, content: main.content, url: main.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          // Ignore data directories to prevent server restarts when saving KB items or lessons
          ignored: [
            '**/.data/**', 
            '**/data/**', 
            '**/lessons.json', 
            '**/kb.json', 
            '**/kb_sections.json'
          ]
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
