import { createClient } from "@/lib/supabase/server"
import type { FlashcardSet } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { UserSessionTracker } from "@/components/user-session-tracker"

export default async function HomePage() {
  const supabase = await createClient()

  // Get recent flashcard sets
  const { data: recentSets } = await supabase
    .from("flashcard_sets")
    .select(`
      *,
      flashcards(count)
    `)
    .order("updated_at", { ascending: false })
    .limit(6)

  const sets = (recentSets as (FlashcardSet & { flashcards: { count: number }[] })[]) || []

  const { data: userSessions } = await supabase.from("user_sessions").select("session_id")

  const uniqueStudents = userSessions ? new Set(userSessions.map((session) => session.session_id)).size : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <UserSessionTracker />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-balance">Welcome to Decksy</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-pretty">
            Create, share, and study flashcards together as a community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/create">
                <Plus className="mr-2 h-5 w-5" />
                Create New Set
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/browse">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse All Sets
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sets.reduce((total, set) => total + (set.flashcards[0]?.count || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Using App</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueStudents}</div>
              <p className="text-xs text-muted-foreground">Unique students tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sets */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Recent Flashcard Sets</h2>
          {sets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sets.map((set) => (
                <Card key={set.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg text-balance">{set.title}</CardTitle>
                    <CardDescription className="text-pretty">{set.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">{set.flashcards[0]?.count || 0} cards</span>
                      <div className="flex gap-1">
                        {set.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/study/${set.id}`}>Study</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Link href={`/sets/${set.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No flashcard sets yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to create a flashcard set for your community!</p>
                <Button asChild>
                  <Link href="/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Set
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
