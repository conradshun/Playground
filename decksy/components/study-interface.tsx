"use client"

import { useState, useEffect } from "react"
import type { FlashcardSet, Flashcard, StudySession } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, XCircle, Eye, Shuffle, Home } from "lucide-react"
import Link from "next/link"

interface StudyInterfaceProps {
  flashcardSet: FlashcardSet & { flashcards: Flashcard[] }
  initialMode: "flip" | "quiz"
}

export function StudyInterface({ flashcardSet, initialMode }: StudyInterfaceProps) {
  const [session, setSession] = useState<StudySession>({
    currentIndex: 0,
    isFlipped: false,
    mode: initialMode,
    score: 0,
    totalCards: flashcardSet.flashcards.length,
  })

  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(flashcardSet.flashcards)
  const [showResults, setShowResults] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([])

  const currentCard = shuffledCards[session.currentIndex]
  const progress = ((session.currentIndex + 1) / session.totalCards) * 100

  // Shuffle cards on component mount
  useEffect(() => {
    const shuffled = [...flashcardSet.flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setCorrectAnswers(new Array(flashcardSet.flashcards.length).fill(false))
  }, [flashcardSet.flashcards])

  const flipCard = () => {
    setSession((prev) => ({ ...prev, isFlipped: !prev.isFlipped }))
  }

  const nextCard = () => {
    if (session.currentIndex < session.totalCards - 1) {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        isFlipped: false,
      }))
    } else {
      // End of session
      if (session.mode === "quiz") {
        setShowResults(true)
      } else {
        // For flip mode, restart or go back
        setSession((prev) => ({ ...prev, currentIndex: 0, isFlipped: false }))
      }
    }
  }

  const prevCard = () => {
    if (session.currentIndex > 0) {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        isFlipped: false,
      }))
    }
  }

  const markAnswer = (isCorrect: boolean) => {
    const newCorrectAnswers = [...correctAnswers]
    newCorrectAnswers[session.currentIndex] = isCorrect
    setCorrectAnswers(newCorrectAnswers)

    const newScore = newCorrectAnswers.filter(Boolean).length
    setSession((prev) => ({ ...prev, score: newScore }))

    // Auto-advance after marking
    setTimeout(() => {
      nextCard()
    }, 500)
  }

  const restartSession = () => {
    const shuffled = [...flashcardSet.flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setSession({
      currentIndex: 0,
      isFlipped: false,
      mode: session.mode,
      score: 0,
      totalCards: flashcardSet.flashcards.length,
    })
    setCorrectAnswers(new Array(flashcardSet.flashcards.length).fill(false))
    setShowResults(false)
  }

  const switchMode = () => {
    const newMode = session.mode === "flip" ? "quiz" : "flip"
    setSession((prev) => ({ ...prev, mode: newMode, isFlipped: false }))
    setShowResults(false)
  }

  if (showResults) {
    const percentage = Math.round((session.score! / session.totalCards!) * 100)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">{percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}</div>
                <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
                <p className="text-xl text-muted-foreground">
                  You scored {session.score} out of {session.totalCards}
                </p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold mb-2">{percentage}%</div>
                <Progress value={percentage} className="h-3" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={restartSession} size="lg">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={switchMode} size="lg">
                  <Eye className="mr-2 h-5 w-5" />
                  Review Mode
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href={`/sets/${flashcardSet.id}`}>
                    <Home className="mr-2 h-5 w-5" />
                    Back to Set
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-balance">{flashcardSet.title}</h1>
            <p className="text-muted-foreground">
              Card {session.currentIndex + 1} of {session.totalCards}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={session.mode === "flip" ? "default" : "outline"}>
              {session.mode === "flip" ? "Flip Mode" : "Quiz Mode"}
            </Badge>
            <Button variant="outline" size="sm" onClick={switchMode}>
              Switch to {session.mode === "flip" ? "Quiz" : "Flip"}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          {session.mode === "quiz" && (
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>
                Progress: {session.currentIndex + 1}/{session.totalCards}
              </span>
              <span>
                Score: {session.score}/{session.totalCards}
              </span>
            </div>
          )}
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <Card className="min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg" onClick={flipCard}>
            <CardContent className="flex flex-col justify-center items-center p-8 min-h-[400px]">
              {!session.isFlipped ? (
                <div className="text-center w-full">
                  <div className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
                    <span>Front</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Click to flip</span>
                  </div>
                  <div className="text-xl mb-6 text-pretty">{currentCard.front_text}</div>
                  {currentCard.front_image_url && (
                    <img
                      src={currentCard.front_image_url || "/placeholder.svg"}
                      alt="Front"
                      className="max-w-full max-h-48 mx-auto rounded"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center w-full">
                  <div className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
                    <span>Back</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Click to flip</span>
                  </div>
                  <div className="text-xl mb-6 text-pretty">{currentCard.back_text}</div>
                  {currentCard.back_image_url && (
                    <img
                      src={currentCard.back_image_url || "/placeholder.svg"}
                      alt="Back"
                      className="max-w-full max-h-48 mx-auto rounded"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {session.mode === "flip" ? (
            // Flip Mode Controls
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={prevCard} disabled={session.currentIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button onClick={nextCard} disabled={session.currentIndex === session.totalCards - 1}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Quiz Mode Controls
            <div className="flex flex-col gap-4">
              {session.isFlipped && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => markAnswer(false)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Incorrect
                  </Button>
                  <Button onClick={() => markAnswer(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Correct
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Additional Controls */}
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={restartSession}>
              <Shuffle className="mr-2 h-4 w-4" />
              Restart
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/sets/${flashcardSet.id}`}>
                <Home className="mr-2 h-4 w-4" />
                Back to Set
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
