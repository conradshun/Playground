import { createClient } from "@/lib/supabase/server"
import type { FlashcardSet, Flashcard } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Edit, Play, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DeleteSetButton } from "@/components/delete-set-button"

export default async function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/browse">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Browse
              </Link>
            </Button>
          </div>

          {/* Set Info */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2 text-balance">{flashcardSet.title}</CardTitle>
                  <CardDescription className="text-base text-pretty">
                    {flashcardSet.description || "No description provided"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/sets/${flashcardSet.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <DeleteSetButton setId={flashcardSet.id} setTitle={flashcardSet.title} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{flashcardSet.flashcards.length} cards</span>
                  <span>Created {new Date(flashcardSet.created_at).toLocaleDateString()}</span>
                  <span>Updated {new Date(flashcardSet.updated_at).toLocaleDateString()}</span>
                </div>
                {flashcardSet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {flashcardSet.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {flashcardSet.flashcards.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <Button asChild className="flex-1 sm:flex-none">
                    <Link href={`/study/${flashcardSet.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Studying
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 sm:flex-none bg-transparent">
                    <Link href={`/study/${flashcardSet.id}?mode=quiz`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Quiz Mode
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flashcards */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Flashcards ({flashcardSet.flashcards.length})
            </h2>
            {flashcardSet.flashcards.length > 0 ? (
              <div className="grid gap-4">
                {flashcardSet.flashcards.map((card, index) => (
                  <Card key={card.id}>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Front</h4>
                          <p className="text-pretty">{card.front_text}</p>
                          {card.front_image_url && (
                            <img
                              src={card.front_image_url || "/placeholder.svg"}
                              alt="Front"
                              className="mt-2 max-w-full h-auto rounded"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Back</h4>
                          <p className="text-pretty">{card.back_text}</p>
                          {card.back_image_url && (
                            <img
                              src={card.back_image_url || "/placeholder.svg"}
                              alt="Back"
                              className="mt-2 max-w-full h-auto rounded"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
                  <p className="text-muted-foreground mb-4">Add some flashcards to get started with studying!</p>
                  <Button asChild>
                    <Link href={`/sets/${flashcardSet.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Add Flashcards
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
