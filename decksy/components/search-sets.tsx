"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface SearchSetsProps {
  allTags: string[]
}

export function SearchSets({ allTags }: SearchSetsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const selectedTag = searchParams.get("tag")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    router.push(`/browse?${params.toString()}`)
  }

  const handleTagFilter = (tag: string) => {
    const params = new URLSearchParams(searchParams)
    if (selectedTag === tag) {
      params.delete("tag")
    } else {
      params.set("tag", tag)
    }
    router.push(`/browse?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    router.push("/browse")
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search flashcard sets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        {(search || selectedTag) && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </form>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Filter by tags:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => handleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
