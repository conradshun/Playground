-- Create flashcard_sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_tags ON flashcard_sets USING GIN(tags);

-- Since this is a shared community app with no authentication,
-- we don't need Row Level Security (RLS) policies
-- Everyone can read and write to all flashcard sets
