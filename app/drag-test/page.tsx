'use client'

import { useState } from 'react'

export default function DragTestPage() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [droppedItems, setDroppedItems] = useState<string[]>([])

  const testItems = ['Calculator', 'Timer', 'Todo', 'Note', 'Calendar']

  const handleDragStart = (e: React.DragEvent, item: string) => {
    console.log('[Test] dragStart triggered for:', item)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', item)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const item = e.dataTransfer.getData('text/plain')
    console.log('[Test] dropped item:', item)
    setDroppedItems(prev => [...prev, item])
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Drag Test Page</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left side - draggable items */}
        <div style={{ border: '2px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Draggable Items</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {testItems.map((item) => (
              <div
                key={item}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="allow-drag"
                style={{
                  padding: '1rem',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: 'grab',
                  backgroundColor: '#eff6ff',
                  userSelect: 'none',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right side - drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? '#22c55e' : '#ccc'}`,
            padding: '1rem',
            borderRadius: '8px',
            minHeight: '300px',
            backgroundColor: isDragOver ? '#f0fdf4' : '#f9fafb',
            transition: 'all 0.2s',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Drop Zone</h2>
          {droppedItems.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Drag items here...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {droppedItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #22c55e',
                    borderRadius: '6px',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
