"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CreateSetForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [createdBy, setCreatedBy] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [importedFlashcards, setImportedFlashcards] = useState<Array<{ front: string; back: string }>>([])
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

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".txt")) {
      toast({
        title: "Invalid file type",
        description: "Please select a .txt file.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content.split("\n").filter((line) => line.trim())
      const flashcards: Array<{ front: string; back: string }> = []

      for (const line of lines) {
        const parts = line.split(";")
        if (parts.length >= 2) {
          flashcards.push({
            front: parts[0].trim(),
            back: parts[1].trim(),
          })
        }
      }

      if (flashcards.length > 0) {
        setImportedFlashcards(flashcards)
        toast({
          title: "File imported!",
          description: `Successfully imported ${flashcards.length} flashcards.`,
        })
      } else {
        toast({
          title: "No flashcards found",
          description: "Make sure your file has the format: Question;Answer on each line.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      console.log("[v0] Supabase client created:", !!supabase)

      const insertData = {
        title: title.trim(),
        description: description.trim() || null,
        tags,
      }

      console.log("[v0] Attempting to insert flashcard set:", insertData)

      const { data, error } = await supabase.from("flashcard_sets").insert(insertData).select().single()

      console.log("[v0] Insert result:", { data, error })

      if (error) {
        console.log("[v0] Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      if (importedFlashcards.length > 0) {
        const flashcardsToInsert = importedFlashcards.map((card) => ({
          set_id: data.id,
          front_text: card.front,
          back_text: card.back,
        }))

        console.log("[v0] Inserting flashcards:", flashcardsToInsert.length)
        const { error: flashcardsError } = await supabase.from("flashcards").insert(flashcardsToInsert)

        if (flashcardsError) {
          console.error("[v0] Error creating flashcards:", flashcardsError)
          toast({
            title: "Warning",
            description: "Set created but some flashcards failed to import.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Success!",
        description: `Flashcard set created successfully${importedFlashcards.length > 0 ? ` with ${importedFlashcards.length} flashcards` : ""}.`,
      })

      router.push(`/sets/${data.id}/edit`)
    } catch (error) {
      console.error("[v0] Error creating flashcard set:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error constructor:", error?.constructor?.name)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error stack:", error?.stack)

      toast({
        title: "Error",
        description: `Failed to create flashcard set: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Details</CardTitle>
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
            <Label htmlFor="createdBy">Created by</Label>
            <Input
              id="createdBy"
              placeholder="Your name (optional)"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
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
            <Label>Import Flashcards (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-600">Upload a .txt file with flashcards</span>
                  <Input id="file-upload" type="file" accept=".txt" onChange={handleFileImport} className="hidden" />
                </Label>
                <p className="text-xs text-gray-500 mt-1">Format: Question;Answer (one per line)</p>
              </div>
            </div>
            {importedFlashcards.length > 0 && (
              <div className="text-sm text-green-600">✓ {importedFlashcards.length} flashcards ready to import</div>
            )}
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

          <div className="flex gap-4">
            <Button type="submit" disabled={!title.trim() || isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create Set"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
