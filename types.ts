
export enum UserRole {
  DEVELOPER = 'Разработчик',
  ACCOUNTANT = 'Бухгалтер',
  SALES = 'Менеджер',
  ADMINISTRATOR = 'Администратор 1С'
}

export enum UserSpecialization {
  COMMON = 'Общая',
  ACC = '1С:Бухгалтерия',
  UNF = '1С:УНФ',
  UT = '1С:Управление торговлей',
  KA = '1С:Комплексная автоматизация',
  ERP = '1С:ERP'
}

export enum ExerciseType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DRAG_AND_DROP = 'DRAG_AND_DROP',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  CODE_SIMULATOR = 'CODE_SIMULATOR',
  AI_GEN = 'AI_GEN'
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  hint?: string;
  xp: number;
  initialCode?: string;
  snippets?: string[]; // для drag and drop
}

export interface Lesson {
  id: string;
  role: UserRole;
  specialization: UserSpecialization;
  level: number;
  title: string;
  narrative: string;
  exercises: Exercise[];
}

export interface KBItem {
  id: string;
  title: string;
  content: string; // Текст из NoteBookLM или других источников
  tags: string[];
}

export interface UserProgress {
  xp: number;
  coins: number;
  hearts: number;
  streak: number;
  level: number;
  role: UserRole;
  specialization: UserSpecialization;
  aiDifficulty: number;
  isAdmin: boolean;
  lastCompletedDate?: string;
}
