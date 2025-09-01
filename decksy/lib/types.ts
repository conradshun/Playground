export interface FlashcardSet {
  id: string
  title: string
  description?: string
  tags: string[]
  created_by?: string
  created_at: string
  updated_at: string
  flashcards?: Flashcard[]
}

export interface Flashcard {
  id: string
  set_id: string
  front_text: string
  back_text: string
  front_image_url?: string
  back_image_url?: string
  created_at: string
  updated_at: string
}

export interface StudySession {
  currentIndex: number
  isFlipped: boolean
  mode: "flip" | "quiz"
  score?: number
  totalCards?: number
}
