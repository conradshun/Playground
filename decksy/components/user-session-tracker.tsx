"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function UserSessionTracker() {
  useEffect(() => {
    const trackUserSession = async () => {
      try {
        const supabase = createClient()

        // Generate or get session ID from localStorage
        let sessionId = localStorage.getItem("decksy_session_id")
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem("decksy_session_id", sessionId)
        }

        // Get user info
        const userAgent = navigator.userAgent
        const ipAddress = "unknown" // IP detection would require server-side implementation

        // Check if session already exists
        const { data: existingSession } = await supabase
          .from("user_sessions")
          .select("id")
          .eq("session_id", sessionId)
          .single()

        if (!existingSession) {
          // Create new session
          await supabase.from("user_sessions").insert({
            session_id: sessionId,
            ip_address: ipAddress,
            user_agent: userAgent,
          })
        } else {
          // Update last activity
          await supabase
            .from("user_sessions")
            .update({ last_activity: new Date().toISOString() })
            .eq("session_id", sessionId)
        }
      } catch (error) {
        console.error("Error tracking user session:", error)
      }
    }

    trackUserSession()
  }, [])

  return null // This component doesn't render anything
}
