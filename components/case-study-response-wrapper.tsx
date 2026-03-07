"use client"

import { useState, useEffect } from "react"
import { CaseStudyResponse } from "@/components/case-study-response"
import { getCaseStudyResponse, saveCaseStudyResponse } from "@/lib/storage"

interface CaseStudyResponseWrapperProps {
  lessonId: string
  moduleId: string
  guidingQuestions: string[]
  sampleResponse: string
  relatedConcepts?: { module: string; concept: string }[]
}

export function CaseStudyResponseWrapper(props: CaseStudyResponseWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [initialResponse, setInitialResponse] = useState("")

  useEffect(() => {
    setMounted(true)
    const savedResponse = getCaseStudyResponse(props.moduleId, props.lessonId)
    setInitialResponse(savedResponse)
  }, [props.moduleId, props.lessonId])

  const handleSave = (response: string) => {
    saveCaseStudyResponse(props.moduleId, props.lessonId, response)
  }

  if (!mounted) {
    return null
  }

  return (
    <CaseStudyResponse
      {...props}
      initialResponse={initialResponse}
      onResponseSave={handleSave}
    />
  )
}
