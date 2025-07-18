import { renderHook, act } from '@testing-library/react'
import { useFocusedNodeIndex } from './useFocusNodeIndex'
import { vi } from 'vitest'
import React from 'react'

describe('useFocusedNodeIndex', () => {
  const mockNodes = [{ id: 1 }, { id: 2 }, { id: 3 }] as any

  const createMockRef = (isFocused = false) => {
    const div = document.createElement('div')
    if (isFocused) {
      document.body.appendChild(div)
      div.tabIndex = 0
      div.focus()
    }
    return { current: div } as React.RefObject<HTMLDivElement>
  }

  it('should initialize focused index to 0', () => {
    const ref = createMockRef()
    const { result } = renderHook(() =>
      useFocusedNodeIndex({ nodes: mockNodes, commandPanelRef: ref })
    )
    expect(result.current[0]).toBe(0)
  })

  it('should increment focused index on ArrowDown', () => {
    const ref = createMockRef()
    const { result } = renderHook(() =>
      useFocusedNodeIndex({ nodes: mockNodes, commandPanelRef: ref })
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current[0]).toBe(1)
  })

  it('should decrement focused index on ArrowUp', () => {
    const ref = createMockRef()
    const { result } = renderHook(() =>
      useFocusedNodeIndex({ nodes: mockNodes, commandPanelRef: ref })
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current[0]).toBe(0)
  })

  it('should not decrement below 0 or increment beyond max index', () => {
    const ref = createMockRef()
    const { result } = renderHook(() =>
      useFocusedNodeIndex({ nodes: mockNodes, commandPanelRef: ref })
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current[0]).toBe(0)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current[0]).toBe(mockNodes.length - 1)
  })

  it('should not change index if commandPanelRef is focused', () => {
    const ref = createMockRef(true)
    const { result } = renderHook(() =>
      useFocusedNodeIndex({ nodes: mockNodes, commandPanelRef: ref })
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current[0]).toBe(0)
  })

  it('should remove event listener on unmount', () => {
    const ref = createMockRef()
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useFocusedNodeIndex({ nodes: mockNodes, commandPanelRef: ref })
    )

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
