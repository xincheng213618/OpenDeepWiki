import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  className?: string
}

export default function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // 获取所有标题元素
    const elements = Array.from(
      document.querySelectorAll('article h1, article h2, article h3')
    ).map((elem) => ({
      id: elem.id || elem.textContent?.toLowerCase().replace(/\s+/g, '-') || '',
      text: elem.textContent || '',
      level: parseInt(elem.tagName.substring(1))
    }))

    setHeadings(elements)

    // 监听滚动事件，更新当前激活的标题
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      let currentId = ''
      for (const heading of elements) {
        const element = document.getElementById(heading.id)
        if (element && element.offsetTop <= scrollPosition) {
          currentId = heading.id
        }
      }

      setActiveId(currentId)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始调用

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const top = element.offsetTop - 80
      window.scrollTo({
        top,
        behavior: 'smooth'
      })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className={cn("sticky top-20 h-fit max-h-[calc(100vh-5rem)] overflow-y-auto", className)}>
      <div className="border-l-2 border-border/40 pl-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          On This Page
        </h3>
        <ul className="space-y-2 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  "block py-1 text-muted-foreground hover:text-foreground transition-colors",
                  "border-l-2 -ml-[18px] pl-4",
                  activeId === heading.id
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}