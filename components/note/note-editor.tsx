'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { NOTE_EDITOR_COLORS } from '@/lib/colors'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

const TEXT_SIZES = [
  { label: '小', value: '1' },
  { label: '中', value: '3' },
  { label: '大', value: '5' },
  { label: '特大', value: '7' },
]

const TEXT_COLORS = NOTE_EDITOR_COLORS

/**
 * 解析 CSS 变量为实际颜色值
 * @param cssVar - CSS 变量字符串，如 'var(--note-editor-black)'
 * @returns 实际的颜色值，如 'rgb(51, 51, 51)'
 */
function resolveCssVariable(cssVar: string): string {
  console.log('[resolveCssVariable] 输入 cssVar:', cssVar)
  if (!cssVar.startsWith('var(')) {
    console.log('[resolveCssVariable] 非 CSS 变量，直接返回:', cssVar)
    return cssVar
  }
  if (typeof window === 'undefined') {
    console.log('[resolveCssVariable] 非浏览器环境，直接返回:', cssVar)
    return cssVar
  }
  const tempEl = document.createElement('div')
  tempEl.style.color = cssVar
  tempEl.style.display = 'none'
  document.body.appendChild(tempEl)
  const computedColor = getComputedStyle(tempEl).color
  document.body.removeChild(tempEl)
  console.log('[resolveCssVariable] 解析结果 computedColor:', computedColor)
  return computedColor || cssVar
}

export function NoteEditor({ content, onChange, placeholder, className }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)
  const lastContentRef = useRef<string>("")
  const isInitialized = useRef(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [currentColor, setCurrentColor] = useState<string>(TEXT_COLORS[0].value)
  const lang = useLanguage()
  const t = useTranslations(lang)

  useEffect(() => {
    console.log('[useEffect] content 变化:', content.substring(0, 50), 'isInitialized:', isInitialized.current, 'isInternalChange:', isInternalChange.current)
    
    if (!isInitialized.current) {
      if (editorRef.current) {
        console.log('[useEffect] 初始化 innerHTML')
        editorRef.current.innerHTML = content
        lastContentRef.current = content
        isInitialized.current = true
      }
      return
    }
    if (isInternalChange.current) {
      console.log('[useEffect] 内部变化，跳过')
      isInternalChange.current = false
      lastContentRef.current = content
      return
    }
    if (editorRef.current && content !== lastContentRef.current) {
      console.log('[useEffect] 外部变化，重置 innerHTML')
      const selection = window.getSelection()
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      const editor = editorRef.current
      editor.innerHTML = content
      lastContentRef.current = content
      if (range && editor.contains(range.startContainer)) {
        try {
          selection?.removeAllRanges()
          selection?.addRange(range)
        } catch {
          if (editor.childNodes.length > 0) {
            const lastChild = editor.lastChild
            if (lastChild) {
              const newRange = document.createRange()
              newRange.selectNodeContents(lastChild)
              newRange.collapse(false)
              selection?.removeAllRanges()
              selection?.addRange(newRange)
            }
          }
        }
      }
    }
  }, [content])

  const updateFormatState = useCallback(() => {
    setIsBold(document.queryCommandState('bold'))
    setIsItalic(document.queryCommandState('italic'))
    setIsUnderline(document.queryCommandState('underline'))
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      console.log('[handleInput] 当前 foreColor:', document.queryCommandValue('foreColor'))
      isInternalChange.current = true
      onChange(editorRef.current.innerHTML)
      updateFormatState()
    }
  }, [onChange, updateFormatState])

  const execCommand = useCallback((command: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()

    const selection = window.getSelection()
    console.log('[execCommand] command:', command, 'value:', value)
    console.log('[execCommand] selection rangeCount:', selection?.rangeCount)
    
    if (selection && selection.rangeCount === 0) {
      const range = document.createRange()
      if (editor.childNodes.length > 0) {
        range.selectNodeContents(editor)
        range.collapse(false)
      } else {
        range.setStart(editor, 0)
        range.collapse(true)
      }
      selection.removeAllRanges()
      selection.addRange(range)
      console.log('[execCommand] 创建了新的 range')
    }

    console.log('[execCommand] 执行前 queryCommandValue(foreColor):', document.queryCommandValue('foreColor'))
    document.execCommand(command, false, value)
    console.log('[execCommand] 执行后 queryCommandValue(foreColor):', document.queryCommandValue('foreColor'))
    handleInput()
  }, [handleInput])

  const handleMouseUp = useCallback(() => {
    updateFormatState()
  }, [updateFormatState])

  const handleKeyUp = useCallback(() => {
    updateFormatState()
  }, [updateFormatState])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-lg">
        <Toggle
          pressed={isBold}
          onPressedChange={() => execCommand('bold')}
          size="sm"
          className={cn(
            'h-8 w-8 p-0 transition-all',
            isBold ? 'bg-primary text-primary-foreground shadow-md' : ''
          )}
          title={t.note.toolbar.bold}
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle
          pressed={isItalic}
          onPressedChange={() => execCommand('italic')}
          size="sm"
          className={cn(
            'h-8 w-8 p-0 transition-all',
            isItalic ? 'bg-primary text-primary-foreground shadow-md' : ''
          )}
          title={t.note.toolbar.italic}
        >
          <Italic className="w-4 h-4" />
        </Toggle>
        <Toggle
          pressed={isUnderline}
          onPressedChange={() => execCommand('underline')}
          size="sm"
          className={cn(
            'h-8 w-8 p-0 transition-all',
            isUnderline ? 'bg-primary text-primary-foreground shadow-md' : ''
          )}
          title={t.note.toolbar.underline}
        >
          <Underline className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('strikeThrough')}
          title={t.note.toolbar.strikethrough}
        >
          <Strikethrough className="w-4 h-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <span className="text-sm font-semibold">A</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2">
            <ToggleGroup type="single" className="flex flex-col gap-1">
              {TEXT_SIZES.map(size => (
                <ToggleGroupItem
                  key={size.value}
                  value={size.value}
                  onClick={() => execCommand('fontSize', size.value)}
                  className="justify-start"
                >
                  <span style={{ fontSize: `${12 + parseInt(size.value) * 2}px` }}>
                    {size.label}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: currentColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2">
            <ToggleGroup type="single" className="flex flex-col gap-1">
              {TEXT_COLORS.map(color => (
                <ToggleGroupItem
                  key={color.value}
                  value={color.value}
                  onClick={() => {
                    console.log('[颜色选择] label:', color.label, 'value:', color.value, 'actualValue:', color.actualValue)
                    setCurrentColor(color.value)
                    const actualColor = resolveCssVariable(color.actualValue)
                    console.log('[颜色选择] 解析后的 actualColor:', actualColor)
                    execCommand('foreColor', actualColor)
                  }}
                  className="justify-start gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-sm">{color.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        <Toggle
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('insertUnorderedList')}
          title={t.note.toolbar.bulletList}
        >
          <List className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('insertOrderedList')}
          title={t.note.toolbar.numberedList}
        >
          <ListOrdered className="w-4 h-4" />
        </Toggle>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        className="min-h-[250px] p-4 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-sm max-w-none"
        data-placeholder={placeholder}
      />
    </div>
  )
}
