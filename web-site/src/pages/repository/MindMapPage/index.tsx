import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, AlertCircle, TreeDeciduous } from 'lucide-react'
import { warehouseService } from '@/services/warehouse.service'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import mermaid from 'mermaid'

interface MindMapNode {
  id?: string
  title: string
  url?: string
  nodes: MindMapNode[]
}

interface MindMapResult {
  nodes: MindMapNode[]
}

interface MindMapResponse {
  code: number
  message: string
  data: MindMapResult
}

interface ProcessedNode {
  id: string
  name: string
  url?: string
  level: number
  parent?: string
  children: string[]
}

export default function MindMapPage() {
  const { t } = useTranslation()
  const { owner, name } = useParams<{ owner: string; name: string }>()
  const [mindMapData, setMindMapData] = useState<MindMapResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processedNodes, setProcessedNodes] = useState<ProcessedNode[]>([])
  const [mermaidDiagram, setMermaidDiagram] = useState('')
  const mermaidRef = useRef<HTMLDivElement>(null)

  // 转换后端数据格式为前端期望格式
  const convertBackendToFrontend = (backendNodes: any[]): MindMapNode[] => {
    return backendNodes.map((node, index) => ({
      id: `node_${index}_${Date.now()}`,
      title: node.Title || node.title || '',
      url: node.Url || node.url || '',
      nodes: node.Nodes ? convertBackendToFrontend(node.Nodes) : []
    }))
  }

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      suppressErrorRendering: true,
      logLevel: 'warn',
      mindmap: {
        padding: 10,
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
      },
    })

    // Reset all states when owner or name changes
    setMindMapData(null)
    setError(null)
    setProcessedNodes([])
    setMermaidDiagram('')

    if (owner && name) {
      fetchMindMapData()
    }
  }, [owner, name])

  useEffect(() => {
    if (mindMapData && mindMapData.nodes) {
      // 转换后端数据格式为前端期望格式
      const convertedNodes = convertBackendToFrontend(mindMapData.nodes)
      processNodesData(convertedNodes)
    }
  }, [mindMapData])

  useEffect(() => {
    if (processedNodes.length > 0) {
      generateMermaidDiagram()
    }
  }, [processedNodes])

  const fetchMindMapData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response: MindMapResponse = await warehouseService.getMiniMap(owner!, name!)

      if (response.code === 200) {
        setMindMapData(response.data)
      } else {
        setError(response.message || t('repository.layout.mindMapLoadFailed'))
      }
    } catch (err) {
      console.error('Failed to fetch mind map data:', err)
      setError(t('repository.layout.mindMapLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const processNodesData = (nodes: MindMapNode[]) => {
    const processed: ProcessedNode[] = []
    let nodeCounter = 0

    const processNode = (node: MindMapNode, level: number = 0, parentId?: string): string => {
      const nodeId = `node_${nodeCounter++}`
      const cleanName = node.title?.replace(/[^\w\s\-\u4e00-\u9fa5]/g, '').trim() || node.title?.trim() || 'Unknown'

      const processedNode: ProcessedNode = {
        id: nodeId,
        name: cleanName,
        url: node.url,
        level,
        parent: parentId,
        children: []
      }

      processed.push(processedNode)

      // Process children
      if (node.nodes && node.nodes.length > 0) {
        node.nodes.forEach(child => {
          const childId = processNode(child, level + 1, nodeId)
          processedNode.children.push(childId)
        })
      }

      return nodeId
    }

    nodes.forEach(node => processNode(node))
    setProcessedNodes(processed)
  }

  const generateMermaidDiagram = () => {
    if (processedNodes.length === 0) {
      // Generate a simple test diagram if no nodes
      const testDiagram = `flowchart TD
    A["${owner || 'Owner'}/${name || 'Repository'}"]
    B["No documents found"]
    A --> B`
      setMermaidDiagram(testDiagram)
      return
    }

    try {
      // Generate flowchart with real data
      let diagram = 'flowchart TD\n'
      const rootId = 'ROOT'
      const rootName = `${owner}/${name}`.replace(/["\[\]]/g, '')
      diagram += `    ${rootId}["${rootName}"]\n`

      // Add nodes with simple sequential IDs
      const nodeIdMap = new Map<string, string>()
      processedNodes.forEach((node, index) => {
        const simpleId = `N${index}`
        nodeIdMap.set(node.id, simpleId)

        // Clean node name for display
        const cleanName = node.name
          .replace(/["\[\]]/g, '')
          .replace(/[^\w\s\u4e00-\u9fa5.-]/g, ' ')
          .trim() || `Node${index}`

        diagram += `    ${simpleId}["${cleanName}"]\n`
      })

      // Add connections from root to level 0 nodes
      const rootNodes = processedNodes.filter(node => node.level === 0)
      if (rootNodes.length === 0) {
        // If no level 0 nodes, connect first few nodes directly
        processedNodes.slice(0, Math.min(5, processedNodes.length)).forEach(node => {
          const nodeId = nodeIdMap.get(node.id)
          if (nodeId) {
            diagram += `    ${rootId} --> ${nodeId}\n`
          }
        })
      } else {
        // Connect root nodes and their children
        rootNodes.forEach(node => {
          const nodeId = nodeIdMap.get(node.id)
          if (nodeId) {
            diagram += `    ${rootId} --> ${nodeId}\n`

            // Add child connections
            const children = processedNodes.filter(n => n.parent === node.id)
            children.forEach(child => {
              const childId = nodeIdMap.get(child.id)
              if (childId) {
                diagram += `    ${nodeId} --> ${childId}\n`
              }
            })
          }
        })
      }

      setMermaidDiagram(diagram)
    } catch (error) {
      console.error('Error in generateMermaidDiagram:', error)
      // Fallback to simple diagram
      const fallbackDiagram = `flowchart TD
    A["${owner}/${name}"]
    B["Error generating diagram"]
    A --> B`
      setMermaidDiagram(fallbackDiagram)
    }
  }



  const renderMermaidDiagram = async () => {
    if (!mermaidRef.current || !mermaidDiagram) return

    try {
      // Clear previous content
      mermaidRef.current.innerHTML = ''

      // Basic validation - just check if we have content
      if (!mermaidDiagram || mermaidDiagram.trim().length < 5) {
        throw new Error('No diagram content')
      }

      const { svg } = await mermaid.render('mindmap-diagram', mermaidDiagram)
      mermaidRef.current.innerHTML = svg

      // Clean up any error elements that might have been added to the DOM
      setTimeout(() => {
        const errorElements = document.querySelectorAll('[id^="d-"][id$="-error"], .mermaidTooltip')
        errorElements.forEach(el => el.remove())
      }, 100)
    } catch (error) {
      console.error('Error rendering mermaid diagram:', error)

      // Show user-friendly error instead of letting Mermaid render to DOM
      mermaidRef.current.innerHTML = `
        <div class="flex items-center justify-center h-64 text-muted-foreground">
          <div class="text-center">
            <p class="text-sm">Unable to render mind map</p>
            <p class="text-xs mt-1">Please try refreshing the page</p>
            <p class="text-xs mt-1 text-red-500">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      `

      // Clean up any error elements immediately
      setTimeout(() => {
        const errorElements = document.querySelectorAll('[id^="d-"][id$="-error"], .mermaidTooltip, .mermaid-parse-error')
        errorElements.forEach(el => el.remove())
      }, 50)
    }
  }

  useEffect(() => {
    if (mermaidDiagram) {
      renderMermaidDiagram()
    }
  }, [mermaidDiagram])


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('repository.layout.loadingMindMap')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!mindMapData || !mindMapData.nodes || mindMapData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <TreeDeciduous className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="font-medium">{t('repository.layout.noMindMapData')}</h3>
            <p className="text-sm text-muted-foreground">{t('repository.layout.mindMapGenerating')}</p>
          </div>
          <Button onClick={fetchMindMapData} variant="outline" size="sm">
            {t('common.refresh')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen overflow-auto bg-muted/20 relative">
      <div
        ref={mermaidRef}
        className="w-full h-full flex items-center justify-center"
        style={{ minHeight: '100%' }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{t('repository.layout.loadingMindMap')}</p>
          </div>
        </div>
      )}
      {!mermaidDiagram && processedNodes.length > 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}