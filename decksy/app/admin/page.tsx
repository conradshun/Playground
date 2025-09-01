"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Users, BookOpen, Tags, Trash2, BarChart3 } from "lucide-react"
import type { FlashcardSet, Flashcard } from "@/lib/types"

interface AdminStats {
  totalUsers: number
  totalSets: number
  totalFlashcards: number
  recentActivity: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSets: 0,
    totalFlashcards: 0,
    recentActivity: 0,
  })
  const [flashcardSets, setFlashcardSets] = useState<(FlashcardSet & { flashcards: Flashcard[] })[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [adminPassword, setAdminPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const supabase = createClient()

  // Simple admin authentication
  const handleAdminLogin = () => {
    if (adminPassword === "conrad2024") {
      // Simple password - you can change this
      setIsAuthenticated(true)
      loadAdminData()
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin password",
        variant: "destructive",
      })
    }
  }

  const loadAdminData = async () => {
    try {
      setLoading(true)

      // Get user session count (unique users)
      const { data: sessions, error: sessionsError } = await supabase.from("user_sessions").select("session_id")

      // Get flashcard sets with flashcards
      const { data: sets, error: setsError } = await supabase
        .from("flashcard_sets")
        .select(`
          *,
          flashcards (*)
        `)
        .order("created_at", { ascending: false })

      if (setsError) throw setsError

      const flashcardSetsData = sets || []
      setFlashcardSets(flashcardSetsData)

      // Calculate stats
      const totalFlashcards = flashcardSetsData.reduce((sum, set) => sum + (set.flashcards?.length || 0), 0)
      const uniqueUsers = sessions ? new Set(sessions.map((s) => s.session_id)).size : 0

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentSessions } = await supabase
        .from("user_sessions")
        .select("session_id")
        .gte("created_at", sevenDaysAgo.toISOString())

      const recentUniqueUsers = recentSessions ? new Set(recentSessions.map((s) => s.session_id)).size : 0

      setStats({
        totalUsers: uniqueUsers,
        totalSets: flashcardSetsData.length,
        totalFlashcards,
        recentActivity: recentUniqueUsers,
      })

      // Extract all unique tags
      const tags = new Set<string>()
      flashcardSetsData.forEach((set) => {
        if (set.tags) {
          set.tags.forEach((tag) => tags.add(tag))
        }
      })
      setAllTags(Array.from(tags))
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteFlashcardSet = async (setId: string) => {
    try {
      console.log("[v0] Starting delete operation for set:", setId)
      console.log("[v0] Supabase client:", !!supabase)

      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      // Delete flashcards first
      console.log("[v0] Deleting flashcards for set:", setId)
      const { data: deletedFlashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .delete()
        .eq("flashcard_set_id", setId)
        .select()

      if (flashcardsError) {
        console.error("[v0] Flashcards delete error details:", {
          message: flashcardsError.message,
          details: flashcardsError.details,
          hint: flashcardsError.hint,
          code: flashcardsError.code,
        })
        throw new Error(`Failed to delete flashcards: ${flashcardsError.message}`)
      }

      console.log("[v0] Flashcards deleted successfully:", deletedFlashcards?.length || 0)

      // Delete the set
      console.log("[v0] Deleting flashcard set:", setId)
      const { data: deletedSet, error: setError } = await supabase
        .from("flashcard_sets")
        .delete()
        .eq("id", setId)
        .select()

      if (setError) {
        console.error("[v0] Set delete error details:", {
          message: setError.message,
          details: setError.details,
          hint: setError.hint,
          code: setError.code,
        })
        throw new Error(`Failed to delete flashcard set: ${setError.message}`)
      }

      console.log("[v0] Flashcard set deleted successfully:", deletedSet)

      toast({
        title: "Success",
        description: "Flashcard set deleted successfully",
      })

      setFlashcardSets((prev) => prev.filter((set) => set.id !== setId))

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalSets: prev.totalSets - 1,
        totalFlashcards: prev.totalFlashcards - (deletedFlashcards?.length || 0),
      }))
    } catch (error) {
      console.error("[v0] Delete operation failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Error",
        description: `Failed to delete flashcard set: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const deleteFlashcard = async (flashcardId: string) => {
    try {
      console.log("[v0] Starting delete operation for flashcard:", flashcardId)
      console.log("[v0] Supabase client:", !!supabase)

      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data: deletedCard, error } = await supabase.from("flashcards").delete().eq("id", flashcardId).select()

      if (error) {
        console.error("[v0] Flashcard delete error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Failed to delete flashcard: ${error.message}`)
      }

      console.log("[v0] Flashcard deleted successfully:", deletedCard)

      toast({
        title: "Success",
        description: "Flashcard deleted successfully",
      })

      setFlashcardSets((prev) =>
        prev.map((set) => ({
          ...set,
          flashcards: set.flashcards?.filter((card) => card.id !== flashcardId) || [],
        })),
      )

      setStats((prev) => ({
        ...prev,
        totalFlashcards: prev.totalFlashcards - 1,
      }))
    } catch (error) {
      console.error("[v0] Delete flashcard operation failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Error",
        description: `Failed to delete flashcard: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Admin Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
              />
              <Button onClick={handleAdminLogin} className="w-full">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage Decksy flashcard webapp</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Unique users who accessed the app</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSets}</div>
            <p className="text-xs text-muted-foreground">Total sets created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flashcards</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlashcards}</div>
            <p className="text-xs text-muted-foreground">Cards across all sets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">Active users (last 7 days)</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="sets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sets">Manage Sets</TabsTrigger>
          <TabsTrigger value="tags">Manage Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flashcard Sets Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flashcardSets.map((set) => (
                  <div key={set.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{set.title}</h3>
                        <p className="text-sm text-muted-foreground">{set.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {set.flashcards?.length || 0} cards • Created: {new Date(set.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Flashcard Set</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{set.title}"? This will also delete all{" "}
                              {set.flashcards?.length || 0} flashcards in this set. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFlashcardSet(set.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Set
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {set.tags && set.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {set.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Individual flashcards */}
                    {set.flashcards && set.flashcards.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-medium">Flashcards:</h4>
                        {set.flashcards.map((card) => (
                          <div key={card.id} className="bg-muted p-2 rounded flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm">
                                <strong>Front:</strong> {card.front_text}
                              </p>
                              <p className="text-sm">
                                <strong>Back:</strong> {card.back_text}
                              </p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this flashcard? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFlashcard(card.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Card
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tags Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">All tags currently used across flashcard sets:</p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-sm">
                      <Tags className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                {allTags.length === 0 && <p className="text-muted-foreground">No tags found.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
