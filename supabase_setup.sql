-- ИНСТРУКЦИЯ ПО НАСТРОЙКЕ SUPABASE
-- 1. Откройте SQL Editor в панели управления Supabase
-- 2. Скопируйте и выполните следующий SQL код:

-- Создание таблицы профилей
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  hearts INTEGER DEFAULT 5,
  streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  calculated_difficulty NUMERIC DEFAULT 1,
  role TEXT DEFAULT 'Developer',
  specialization TEXT DEFAULT 'Common',
  skill_level TEXT DEFAULT 'Beginner',
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  xp_history JSONB DEFAULT '[]'::JSONB,
  team_id TEXT,
  team_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_superadmin BOOLEAN DEFAULT false
);

-- Настройка RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политика: профили видны всем
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

-- Политика: пользователи могут создавать свой профиль
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Политика: пользователи могут обновлять свой профиль
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Создание таблицы разделов базы знаний
CREATE TABLE IF NOT EXISTS public.kb_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "parentId" TEXT REFERENCES public.kb_sections(id) ON DELETE SET NULL,
  "order" INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  word_url TEXT,
  mp3_url TEXT,
  video_url TEXT,
  content_url TEXT,
  kb_item_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Создание таблицы базы знаний
CREATE TABLE IF NOT EXISTS public.kb_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  "sectionId" TEXT REFERENCES public.kb_sections(id) ON DELETE SET NULL,
  section TEXT,
  brief_url TEXT,
  detailed_url TEXT,
  podcast_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Создание таблицы уроков
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  specialization TEXT NOT NULL,
  level INTEGER NOT NULL,
  difficulty INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT true,
  "sectionId" TEXT REFERENCES public.kb_sections(id) ON DELETE SET NULL,
  related_kb_sections TEXT[],
  related_kb_section_ids TEXT[],
  narrative TEXT,
  exercises JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Настройка RLS для новых таблиц
ALTER TABLE public.kb_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Политики: чтение доступно всем
DROP POLICY IF EXISTS "KB sections are viewable by everyone." ON public.kb_sections;
CREATE POLICY "KB sections are viewable by everyone." ON public.kb_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "KB items are viewable by everyone." ON public.kb_items;
CREATE POLICY "KB items are viewable by everyone." ON public.kb_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lessons are viewable by everyone." ON public.lessons;
CREATE POLICY "Lessons are viewable by everyone." ON public.lessons FOR SELECT USING (true);

-- Политики: запись для всех авторизованных (упрощенно)
DROP POLICY IF EXISTS "Only authenticated users can modify KB sections." ON public.kb_sections;
CREATE POLICY "Only authenticated users can modify KB sections." ON public.kb_sections FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only authenticated users can modify KB." ON public.kb_items;
CREATE POLICY "Only authenticated users can modify KB." ON public.kb_items FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only authenticated users can modify lessons." ON public.lessons;
CREATE POLICY "Only authenticated users can modify lessons." ON public.lessons FOR ALL USING (auth.role() = 'authenticated');

-- Создание таблицы настроек
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Настройка RLS для настроек
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by everyone." ON public.app_settings;
CREATE POLICY "Settings are viewable by everyone." ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only authenticated users can modify settings." ON public.app_settings;
CREATE POLICY "Only authenticated users can modify settings." ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
