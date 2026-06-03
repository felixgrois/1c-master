-- SQL script to set up KB sections and items in Supabase
-- Run this in the Supabase SQL Editor

-- Create KB Sections table
CREATE TABLE IF NOT EXISTS kb_sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    "parentId" TEXT REFERENCES kb_sections(id) ON DELETE SET NULL,
    "order" INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    word_url TEXT,
    mp3_url TEXT,
    video_url TEXT,
    content_url TEXT,
    kb_item_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create KB Items table
CREATE TABLE IF NOT EXISTS kb_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    tags TEXT[],
    "sectionId" TEXT REFERENCES kb_sections(id) ON DELETE SET NULL,
    section TEXT,
    brief_url TEXT,
    detailed_url TEXT,
    podcast_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN 
    -- kb_sections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='updated_at') THEN
        ALTER TABLE kb_sections ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='word_url') THEN
        ALTER TABLE kb_sections ADD COLUMN word_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='mp3_url') THEN
        ALTER TABLE kb_sections ADD COLUMN mp3_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='video_url') THEN
        ALTER TABLE kb_sections ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='content_url') THEN
        ALTER TABLE kb_sections ADD COLUMN content_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='is_published') THEN
        ALTER TABLE kb_sections ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='order') THEN
        ALTER TABLE kb_sections ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='parentId') THEN
        ALTER TABLE kb_sections ADD COLUMN "parentId" TEXT REFERENCES kb_sections(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='kb_item_id') THEN
        ALTER TABLE kb_sections ADD COLUMN kb_item_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_sections' AND column_name='description') THEN
        ALTER TABLE kb_sections ADD COLUMN description TEXT;
    END IF;

    -- kb_items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='updated_at') THEN
        ALTER TABLE kb_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='brief_url') THEN
        ALTER TABLE kb_items ADD COLUMN brief_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='detailed_url') THEN
        ALTER TABLE kb_items ADD COLUMN detailed_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='podcast_url') THEN
        ALTER TABLE kb_items ADD COLUMN podcast_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='video_url') THEN
        ALTER TABLE kb_items ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='section') THEN
        ALTER TABLE kb_items ADD COLUMN section TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='sectionId') THEN
        ALTER TABLE kb_items ADD COLUMN "sectionId" TEXT REFERENCES kb_sections(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_items' AND column_name='description') THEN
        ALTER TABLE kb_items ADD COLUMN description TEXT;
    END IF;

    -- lessons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='sectionId') THEN
        ALTER TABLE lessons ADD COLUMN "sectionId" TEXT;
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_kb_sections_updated_at ON kb_sections;
CREATE TRIGGER update_kb_sections_updated_at BEFORE UPDATE ON kb_sections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_kb_items_updated_at ON kb_items;
CREATE TRIGGER update_kb_items_updated_at BEFORE UPDATE ON kb_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE kb_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_items ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (allow anyone to read)
DROP POLICY IF EXISTS "Enable read access for all users" ON kb_sections;
CREATE POLICY "Enable read access for all users" ON kb_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON kb_items;
CREATE POLICY "Enable read access for all users" ON kb_items FOR SELECT USING (true);

-- Enable all access for authenticated users to kb_sections and kb_items
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON kb_sections;
CREATE POLICY "Enable all access for authenticated users" ON kb_sections FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON kb_items;
CREATE POLICY "Enable all access for authenticated users" ON kb_items FOR ALL USING (auth.role() = 'authenticated');

-- ===============================================================
-- STORAGE SETUP (Run this in the Supabase SQL Editor)
-- ===============================================================
-- Create a bucket for KB media if it doesn't exist
-- Note: You can also do this manually in the Supabase Dashboard -> Storage

INSERT INTO storage.buckets (id, name, public) 
VALUES ('kb_media', 'kb_media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the 'kb_media' bucket
-- Allow public read access
DROP POLICY IF EXISTS "KB Media Public Access" ON storage.objects;
CREATE POLICY "KB Media Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'kb_media');

-- Allow authenticated users to upload/modify
DROP POLICY IF EXISTS "KB Media Authenticated Access" ON storage.objects;
CREATE POLICY "KB Media Authenticated Access" ON storage.objects FOR ALL USING (bucket_id = 'kb_media' AND auth.role() = 'authenticated');
