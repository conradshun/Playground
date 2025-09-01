import { createClient } from "@/lib/supabase/server"
import type { FlashcardSet, Flashcard } from "@/lib/types"
import { notFound } from "next/navigation"
import { StudyInterface } from "@/components/study-interface"

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const { mode } = await searchParams
  const supabase = await createClient()

  const { data: set } = await supabase
    .from("flashcard_sets")
    .select(`
      *,
      flashcards(*)
    `)
    .eq("id", id)
    .single()

  if (!set) {
    notFound()
  }

  const flashcardSet = set as FlashcardSet & { flashcards: Flashcard[] }

  if (flashcardSet.flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Cards to Study</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">This flashcard set doesn't have any cards yet.</p>
          <a
            href={`/sets/${flashcardSet.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Cards
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <StudyInterface flashcardSet={flashcardSet} initialMode={mode === "quiz" ? "quiz" : "flip"} />
    </div>
  )
}
