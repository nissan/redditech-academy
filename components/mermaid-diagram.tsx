"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  chart: string
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
      primaryBorderColor: "#3b82f6",
      lineColor: "#475569",
      secondaryColor: "#f1f5f9",
      tertiaryColor: "#e2e8f0",
      background: "#ffffff",
      mainBkg: "#f8fafc",
      secondBkg: "#f1f5f9",
      tertiaryBkg: "#e2e8f0",
      textColor: "#1e293b",
      border1: "#cbd5e1",
      border2: "#94a3b8",
      actorBorder: "#3b82f6",
      actorBkg: "#dbeafe",
      actorTextColor: "#1e293b",
      actorLineColor: "#475569",
      signalColor: "#1e293b",
      signalTextColor: "#1e293b",
      labelBoxBkgColor: "#dbeafe",
      labelBoxBorderColor: "#3b82f6",
      labelTextColor: "#1e293b",
      loopTextColor: "#1e293b",
      noteBorderColor: "#3b82f6",
      noteBkgColor: "#dbeafe",
      noteTextColor: "#1e293b",
      activationBorderColor: "#3b82f6",
      activationBkgColor: "#dbeafe",
      sequenceNumberColor: "#1e293b"
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

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Wait for theme to be resolved before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Render mermaid diagram after component mounts and when theme changes
    if (mermaidRef.current && mounted && chart) {
      const renderDiagram = async () => {
        try {
          // Reinitialize mermaid with theme-specific config
          const isDark = resolvedTheme === "dark"
          mermaid.initialize(getMermaidConfig(isDark))

          // Generate a valid CSS selector ID (must start with a letter)
          const diagramId = `diagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          const { svg } = await mermaid.render(diagramId, chart)
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg
          }
        } catch (error) {
          console.error("Mermaid rendering error:", error)
          // Fallback to showing raw content
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<pre class="text-sm text-muted-foreground">${chart}</pre>`
          }
        }
      }
      renderDiagram()
    }
  }, [chart, resolvedTheme, mounted])

  if (!mounted) {
    return null
  }

  return <div ref={mermaidRef} className="my-6 flex justify-center" />
}
