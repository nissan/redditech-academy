"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Save, CheckCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface CaseStudyResponseProps {
  lessonId: string
  moduleId: string
  guidingQuestions: string[]
  sampleResponse: string
  relatedConcepts?: { module: string; concept: string }[]
  onResponseSave: (response: string) => void
  initialResponse?: string
}

export function CaseStudyResponse({
  lessonId,
  moduleId,
  guidingQuestions,
  sampleResponse,
  relatedConcepts,
  onResponseSave,
  initialResponse = "",
}: CaseStudyResponseProps) {
  const [response, setResponse] = useState(initialResponse)
  const [isSampleOpen, setIsSampleOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasResponse, setHasResponse] = useState(initialResponse.length > 0)

  useEffect(() => {
    setResponse(initialResponse)
    setHasResponse(initialResponse.length > 0)
  }, [initialResponse])

  const handleSave = () => {
    if (response.trim().length > 0) {
      onResponseSave(response)
      setSaved(true)
      setHasResponse(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const wordCount = response.trim().split(/\s+/).filter(w => w.length > 0).length

  return (
    <div className="space-y-6">
      {/* Guiding Questions */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>💡</span>
            Guiding Questions
          </CardTitle>
          <CardDescription>
            Consider these questions as you formulate your response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {guidingQuestions.map((question, index) => (
              <li key={index} className="flex gap-3">
                <span className="font-semibold text-primary">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Your Response */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>✍️</span>
                Your Response
              </CardTitle>
              <CardDescription>
                Write your analysis and recommendations
              </CardDescription>
            </div>
            {hasResponse && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response here... Be specific and reference the IAM concepts you've learned."
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {wordCount} words
            </span>
            <Button onClick={handleSave} disabled={response.trim().length === 0}>
              <Save className="mr-2 h-4 w-4" />
              {saved ? "Saved!" : "Save Response"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Response (Collapsible) */}
      <Collapsible open={isSampleOpen} onOpenChange={setIsSampleOpen}>
        <Card className="border-accent/30">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span>🔍</span>
                  Sample Expert Response
                </CardTitle>
                {isSampleOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>
              Click to reveal our expert's approach to this section
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sampleResponse}
                </ReactMarkdown>
              </div>

              {/* Related Concepts */}
              {relatedConcepts && relatedConcepts.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-semibold">Related Concepts Applied:</h4>
                  <div className="flex flex-wrap gap-2">
                    {relatedConcepts.map((concept, index) => (
                      <Badge key={index} variant="outline">
                        {concept.module}: {concept.concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
