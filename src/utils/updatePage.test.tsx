/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, vi, it, expect, beforeEach } from 'vitest'

// Use fake timers to control debounce
vi.useFakeTimers()

// Declare spies
let mockEq: any
let mockUpdate: any
let mockFrom: any

vi.mock('../supabaseClient', () => {
  mockEq = vi.fn()
  mockUpdate = vi.fn(() => ({ eq: mockEq }))
  mockFrom = vi.fn(() => ({ update: mockUpdate }))

  return {
    supabase: {
      from: mockFrom
    }
  }
})

describe('updatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debounces and calls supabase update with correct data', async () => {
    // Dynamically import AFTER mock is in place
    const { updatePage } = await import('./updatePage')

    const pageData = { id: '123', title: 'Updated Title' }

    updatePage(pageData)

    await vi.advanceTimersByTimeAsync(500)

    expect(mockFrom).toHaveBeenCalledWith('pages')
    expect(mockUpdate).toHaveBeenCalledWith(pageData)
    expect(mockEq).toHaveBeenCalledWith('id', pageData.id)
  })
})