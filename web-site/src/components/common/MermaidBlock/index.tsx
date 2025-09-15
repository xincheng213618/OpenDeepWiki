import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidBlockProps {
  chart: string
}

export default function MermaidBlock({ chart }: MermaidBlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#8b5cf6',
          primaryTextColor: '#fff',
          primaryBorderColor: '#7c3aed',
          lineColor: '#5b21b6',
          secondaryColor: '#a78bfa',
          tertiaryColor: '#1f2937',
          background: '#111827',
          mainBkg: '#1f2937',
          secondBkg: '#374151',
          tertiaryBkg: '#4b5563',
        }
      })

      mermaid.contentLoaded()
    }
  }, [chart])

  return (
    <div className="my-6 flex justify-center overflow-x-auto">
      <div ref={ref} className="mermaid">
        {chart}
      </div>
    </div>
  )
}