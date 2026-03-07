"use client"

import { useEffect, useRef, useState } from "react"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { LessonContent } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import mermaid from "mermaid"
import React from "react"

// Type-safe wrapper for syntax highlighter style
const syntaxStyle = vscDarkPlus as { [key: string]: React.CSSProperties }

interface LessonContentRendererProps {
  content: LessonContent[]
}

// Get theme-specific mermaid configuration
function getMermaidConfig(isDark: boolean) {
  if (isDark) {
    return {
      startOnLoad: false,
      theme: "base" as const,
      themeVariables: {
        primaryColor: "#3b82f6",
        primaryTextColor: "#e2e8f0",
        primaryBorderColor: "#60a5fa",
        lineColor: "#94a3b8",
        secondaryColor: "#1e293b",
        tertiaryColor: "#334155",
        background: "#0f172a",
        mainBkg: "#1e293b",
        secondBkg: "#334155",
        tertiaryBkg: "#475569",
        textColor: "#e2e8f0",
        border1: "#475569",
        border2: "#64748b",
        actorBorder: "#60a5fa",
        actorBkg: "#1e3a5f",
        actorTextColor: "#e2e8f0",
        actorLineColor: "#94a3b8",
        signalColor: "#e2e8f0",
        signalTextColor: "#e2e8f0",
        labelBoxBkgColor: "#1e3a5f",
        labelBoxBorderColor: "#60a5fa",
        labelTextColor: "#e2e8f0",
        loopTextColor: "#e2e8f0",
        noteBorderColor: "#60a5fa",
        noteBkgColor: "#1e3a5f",
        noteTextColor: "#e2e8f0",
        activationBorderColor: "#60a5fa",
        activationBkgColor: "#1e3a5f",
        sequenceNumberColor: "#e2e8f0"
      },
      securityLevel: "loose" as const,
      fontFamily: "system-ui, -apple-system, sans-serif",
      sequence: {
        diagramMarginX: 20,
        diagramMarginY: 20,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        useMaxWidth: true
      }
    }
  }

  // Light mode
  return {
    startOnLoad: false,
    theme: "base" as const,
    themeVariables: {
      primaryColor: "#3b82f6",
      primaryTextColor: "#1e293b",
      primaryBorderColor: "#60a5fa",
      lineColor: "#64748b",
      secondaryColor: "#e0f2fe",
      tertiaryColor: "#f1f5f9",
      background: "#ffffff",
      mainBkg: "#ffffff",
      secondBkg: "#f8fafc",
      tertiaryBkg: "#f1f5f9",
      textColor: "#1e293b",
      border1: "#cbd5e1",
      border2: "#94a3b8",
      actorBorder: "#3b82f6",
      actorBkg: "#dbeafe",
      actorTextColor: "#1e293b",
      actorLineColor: "#64748b",
      signalColor: "#1e293b",
      signalTextColor: "#1e293b",
      labelBoxBkgColor: "#e0f2fe",
      labelBoxBorderColor: "#3b82f6",
      labelTextColor: "#1e293b",
      loopTextColor: "#1e293b",
      noteBorderColor: "#3b82f6",
      noteBkgColor: "#dbeafe",
      noteTextColor: "#1e293b",
      activationBorderColor: "#3b82f6",
      activationBkgColor: "#dbeafe",
      sequenceNumberColor: "#ffffff"
    },
    securityLevel: "loose" as const,
    fontFamily: "system-ui, -apple-system, sans-serif",
    sequence: {
      diagramMarginX: 20,
      diagramMarginY: 20,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      useMaxWidth: true
    }
  }
}

export function LessonContentRenderer({ content }: LessonContentRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-pre:bg-transparent prose-pre:p-0">
      {content.map((section, index) => (
        <ContentSection key={index} section={section} />
      ))}
    </div>
  )
}

function ContentSection({ section }: { section: LessonContent }) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const resolvedTheme = "dark"
  const [mounted, setMounted] = useState(false)

  // Wait for theme to be resolved before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Render mermaid diagrams after component mounts and when theme changes
    if (section.type === "diagram" && mermaidRef.current && mounted) {
      const renderDiagram = async () => {
        try {
          // Reinitialize mermaid with theme-specific config
          const isDark = resolvedTheme === "dark"
          mermaid.initialize(getMermaidConfig(isDark))

          // Generate a valid CSS selector ID (must start with a letter)
          const diagramId = `diagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          const diagramContent = section.content || section.code || ""
          const { svg } = await mermaid.render(
            diagramId,
            diagramContent
          )
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg
          }
        } catch (error) {
          console.error("Mermaid rendering error:", error)
          // Fallback to showing raw content
          if (mermaidRef.current) {
            const diagramContent = section.content || section.code || ""
            mermaidRef.current.innerHTML = `<pre class="text-sm text-muted-foreground">${diagramContent}</pre>`
          }
        }
      }
      renderDiagram()
    }
  }, [section, resolvedTheme, mounted])

  switch (section.type) {
    case "text":
      return (
        <div className="space-y-4">
          {section.title && (
            <h2 className="text-2xl font-semibold text-foreground border-b border-border pb-2">
              {section.title}
            </h2>
          )}
          <div className="text-foreground/90">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // Custom table styling
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-muted" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody className="divide-y divide-border bg-background" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-4 py-3 text-sm text-foreground/90" {...props} />
                ),
                // Custom list styling
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-outside ml-6 space-y-2 my-4" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-outside ml-6 space-y-2 my-4" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-foreground/90 leading-relaxed" {...props} />
                ),
                // Custom link styling
                a: ({ node, ...props }) => (
                  <a
                    className="text-primary underline hover:text-primary/80 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                // Custom inline code styling
                code: ({ node, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "")
                  return !match ? (
                    <code
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      // @ts-ignore - vscDarkPlus type is union but works at runtime
                      style={syntaxStyle}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md my-4"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  )
                },
                // Custom paragraph styling
                p: ({ node, ...props }) => (
                  <p className="text-foreground/90 leading-relaxed my-3" {...props} />
                ),
                // Custom blockquote styling
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-foreground/80 bg-muted/30 rounded-r"
                    {...props}
                  />
                ),
                // Custom heading styling
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold text-foreground mt-8 mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold text-foreground mt-6 mb-3 border-b border-border pb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-semibold text-foreground mt-5 mb-2" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props} />
                ),
                // Custom strong/em styling
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-foreground" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-foreground/90" {...props} />
                ),
              }}
            >
              {section.content || section.code || ""}
            </ReactMarkdown>
          </div>
        </div>
      )

    case "code":
      return (
        <Card className="border-primary/20 bg-muted/50 overflow-hidden">
          <CardContent className="p-0">
            {section.title && (
              <div className="border-b border-border/50 px-4 py-2 bg-muted">
                <div className="text-sm font-medium flex items-center gap-2">
                  <span className="text-primary">{"</>"}</span>
                  {section.title}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={section.language || "text"}
                // @ts-ignore - vscDarkPlus type is union but works at runtime
                style={syntaxStyle}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: "0.875rem",
                  padding: "1rem"
                }}
                showLineNumbers={section.language !== "text"}
              >
                {section.content || section.code || ""}
              </SyntaxHighlighter>
            </div>
            {section.caption && (
              <div className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground bg-muted/30">
                {section.caption}
              </div>
            )}
          </CardContent>
        </Card>
      )

    case "diagram":
      return (
        <Card className="border-accent/20 bg-accent/5 overflow-hidden">
          <CardContent className="p-6">
            {section.title && (
              <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <span className="text-accent">📊</span>
                {section.title}
              </h3>
            )}
            <div className="flex justify-center items-center bg-background/50 rounded-md p-6 min-h-[200px]">
              <div
                ref={mermaidRef}
                className="mermaid-diagram w-full flex justify-center"
              />
            </div>
            {section.caption && (
              <p className="mt-4 text-sm text-muted-foreground text-center italic">
                {section.caption}
              </p>
            )}
          </CardContent>
        </Card>
      )

    case "interactive":
      return (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-6">
            {section.title && (
              <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <span className="text-success">⚡</span>
                {section.title}
              </h3>
            )}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {section.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )

    default:
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      )
  }
}
