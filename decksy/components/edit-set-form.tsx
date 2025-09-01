"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { FlashcardSet } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface EditSetFormProps {
  flashcardSet: FlashcardSet
}

export function EditSetForm({ flashcardSet }: EditSetFormProps) {
  const [title, setTitle] = useState(flashcardSet.title)
  const [description, setDescription] = useState(flashcardSet.description || "")
  const [tags, setTags] = useState<string[]>(flashcardSet.tags)
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("flashcard_sets")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", flashcardSet.id)

      if (error) throw error

      toast({
        title: "Success!",
        description: "Flashcard set updated successfully.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error updating flashcard set:", error)
      toast({
        title: "Error",
        description: "Failed to update flashcard set. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Set Details</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/sets/${flashcardSet.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Set
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Spanish Vocabulary, Biology Chapter 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this flashcard set covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={!title.trim() || isLoading}>
            {isLoading ? "Updating..." : "Update Set"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
