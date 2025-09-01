-- Add created_by field to flashcard_sets table
ALTER TABLE flashcard_sets 
ADD COLUMN created_by VARCHAR(100);

-- Update existing sets to have a default creator
UPDATE flashcard_sets 
SET created_by = 'Anonymous' 
WHERE created_by IS NULL;
