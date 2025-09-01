"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { FlashcardSet, Flashcard } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, Save, X, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface FlashcardEditorProps {
  flashcardSet: FlashcardSet & { flashcards: Flashcard[] }
}

interface EditingCard {
  id?: string
  front_text: string
  back_text: string
  front_image_url?: string
  back_image_url?: string
}

export function FlashcardEditor({ flashcardSet }: FlashcardEditorProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(flashcardSet.flashcards)
  const [editingCard, setEditingCard] = useState<EditingCard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const startNewCard = () => {
    setEditingCard({
      front_text: "",
      back_text: "",
      front_image_url: "",
      back_image_url: "",
    })
  }

  const startEditCard = (card: Flashcard) => {
    setEditingCard({
      id: card.id,
      front_text: card.front_text,
      back_text: card.back_text,
      front_image_url: card.front_image_url || "",
      back_image_url: card.back_image_url || "",
    })
  }

  const cancelEdit = () => {
    setEditingCard(null)
  }

  const saveCard = async () => {
    if (!editingCard || !editingCard.front_text.trim() || !editingCard.back_text.trim()) {
      toast({
        title: "Error",
        description: "Both front and back text are required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      if (editingCard.id) {
        // Update existing card
        const { error } = await supabase
          .from("flashcards")
          .update({
            front_text: editingCard.front_text.trim(),
            back_text: editingCard.back_text.trim(),
            front_image_url: editingCard.front_image_url?.trim() || null,
            back_image_url: editingCard.back_image_url?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCard.id)

        if (error) throw error

        // Update local state
        setFlashcards(
          flashcards.map((card) =>
            card.id === editingCard.id
              ? {
                  ...card,
                  front_text: editingCard.front_text.trim(),
                  back_text: editingCard.back_text.trim(),
                  front_image_url: editingCard.front_image_url?.trim() || null,
                  back_image_url: editingCard.back_image_url?.trim() || null,
                }
              : card,
          ),
        )

        toast({
          title: "Success!",
          description: "Flashcard updated successfully.",
        })
      } else {
        // Create new card
        const { data, error } = await supabase
          .from("flashcards")
          .insert({
            set_id: flashcardSet.id,
            front_text: editingCard.front_text.trim(),
            back_text: editingCard.back_text.trim(),
            front_image_url: editingCard.front_image_url?.trim() || null,
            back_image_url: editingCard.back_image_url?.trim() || null,
          })
          .select()
          .single()

        if (error) throw error

        // Add to local state
        setFlashcards([...flashcards, data])

        toast({
          title: "Success!",
          description: "Flashcard created successfully.",
        })
      }

      setEditingCard(null)
      router.refresh()
    } catch (error) {
      console.error("Error saving flashcard:", error)
      toast({
        title: "Error",
        description: "Failed to save flashcard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", cardId)

      if (error) throw error

      setFlashcards(flashcards.filter((card) => card.id !== cardId))

      toast({
        title: "Success!",
        description: "Flashcard deleted successfully.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting flashcard:", error)
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Flashcards ({flashcards.length})</CardTitle>
            <Button onClick={startNewCard} disabled={!!editingCard}>
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* New/Edit Card Form */}
          {editingCard && (
            <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg">{editingCard.id ? "Edit Flashcard" : "New Flashcard"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="front-text">Front Text *</Label>
                    <Textarea
                      id="front-text"
                      placeholder="Enter the question or prompt..."
                      value={editingCard.front_text}
                      onChange={(e) => setEditingCard({ ...editingCard, front_text: e.target.value })}
                      rows={3}
                    />
                    <Label htmlFor="front-image">Front Image URL (optional)</Label>
                    <Input
                      id="front-image"
                      placeholder="https://example.com/image.jpg"
                      value={editingCard.front_image_url}
                      onChange={(e) => setEditingCard({ ...editingCard, front_image_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="back-text">Back Text *</Label>
                    <Textarea
                      id="back-text"
                      placeholder="Enter the answer or explanation..."
                      value={editingCard.back_text}
                      onChange={(e) => setEditingCard({ ...editingCard, back_text: e.target.value })}
                      rows={3}
                    />
                    <Label htmlFor="back-image">Back Image URL (optional)</Label>
                    <Input
                      id="back-image"
                      placeholder="https://example.com/image.jpg"
                      value={editingCard.back_image_url}
                      onChange={(e) => setEditingCard({ ...editingCard, back_image_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCard} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Card"}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Cards */}
          {flashcards.length > 0 ? (
            <div className="space-y-4">
              {flashcards.map((card, index) => (
                <Card key={card.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm text-muted-foreground">Card {index + 1}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditCard(card)}
                          disabled={!!editingCard || isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCard(card.id)}
                          disabled={!!editingCard || isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Front</h4>
                        <p className="text-pretty mb-2">{card.front_text}</p>
                        {card.front_image_url && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>Image attached</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Back</h4>
                        <p className="text-pretty mb-2">{card.back_text}</p>
                        {card.back_image_url && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>Image attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground mb-4">Add your first flashcard to get started with this set!</p>
              <Button onClick={startNewCard}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
