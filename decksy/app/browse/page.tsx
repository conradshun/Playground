import { createClient } from "@/lib/supabase/server"
import type { FlashcardSet } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import Link from "next/link"
import { SearchSets } from "@/components/search-sets"

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tag?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("flashcard_sets")
    .select(`
      *,
      flashcards(count)
    `)
    .order("updated_at", { ascending: false })

  // Apply search filter
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  // Apply tag filter
  if (params.tag) {
    query = query.contains("tags", [params.tag])
  }

  const { data: sets } = await query

  const flashcardSets = (sets as (FlashcardSet & { flashcards: { count: number }[] })[]) || []

  // Get all unique tags for filtering
  const { data: allSets } = await supabase.from("flashcard_sets").select("tags")
  const allTags = Array.from(new Set(allSets?.flatMap((set) => set.tags) || []))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Flashcard Sets</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Discover and study from {flashcardSets.length} available flashcard sets
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Set
            </Link>
          </Button>
        </div>

        {/* Search and Filter */}
        <SearchSets allTags={allTags} />

        {/* Results */}
        {flashcardSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcardSets.map((set) => (
              <Card key={set.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-balance">{set.title}</CardTitle>
                  <CardDescription className="text-pretty">{set.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground">{set.flashcards[0]?.count || 0} cards</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(set.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {set.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {set.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {set.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{set.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
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
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No flashcard sets found</h3>
              <p className="text-muted-foreground mb-4">
                {params.search || params.tag
                  ? "Try adjusting your search or filter criteria"
                  : "No flashcard sets have been created yet"}
              </p>
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
  )
}
