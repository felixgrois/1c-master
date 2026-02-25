
import { GoogleGenAI, Type } from "@google/genai";
import { UserRole, UserSpecialization, ExerciseType, Exercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIQuestion = async (
  role: UserRole, 
  specialization: UserSpecialization, 
  level: number, 
  difficulty: number = 5, 
  context?: string
): Promise<Partial<Exercise>> => {
  const prompt = `You are a world-class 1C:Enterprise platform instructor. 
  Task: Create a unique, high-quality educational question for a ${role} specializing in ${specialization} at experience level ${level}.
  
  ${context ? `Use this Knowledge Base context: "${context}"` : ''}
  
  Difficulty Level: ${difficulty}/10. 
  
  Contextual Requirements:
  - Base the question on official 1C:Enterprise documentation standards for ${specialization}.
  - Role Focus: ${role === UserRole.DEVELOPER ? 'Coding, metadata objects, queries.' : role === UserRole.ACCOUNTANT ? 'Accounting entries, tax reports.' : 'CRM, sales analytics.'}
  
  Output Requirements:
  - Format: Strict JSON.
  - Language: Russian.
  
  JSON Schema: { "question": string, "options": string[], "correctAnswer": string, "explanation": string, "xp": number }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Generation Error", error);
    throw error;
  }
};

export const parseKBToExercises = async (kbText: string, role: UserRole, specialization: UserSpecialization): Promise<Partial<Exercise>[]> => {
  const prompt = `Extract exactly 3 educational exercises from the following technical text about 1C:Enterprise for the role of ${role} in specialization ${specialization}.
  Source Text: "${kbText}"
  
  Return a JSON array of exercises following the schema: { "question": string, "options": string[], "correctAnswer": string, "explanation": string, "xp": number }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error(e);
    return [];
  }
};
