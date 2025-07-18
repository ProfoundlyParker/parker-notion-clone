import { describe, it, expect, vi, beforeEach } from 'vitest'
import { debounce } from './debounce'

vi.useFakeTimers()

describe('debounce', () => {
  let callback: ReturnType<typeof vi.fn>
  let debouncedFn: (...args: any[]) => void

  beforeEach(() => {
    callback = vi.fn()
    debouncedFn = debounce(callback, 300)
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('delays the callback by specified time', () => {
    debouncedFn('hello')
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(299)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledWith('hello')
  })

  it('only calls callback once if triggered multiple times rapidly', () => {
    debouncedFn('first')
    debouncedFn('second')
    debouncedFn('third')

    vi.advanceTimersByTime(300)

    // Only the last call should fire
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('third')
  })

  it('calls the callback with correct arguments', () => {
    debouncedFn('foo', 42, true)
    vi.advanceTimersByTime(300)

    expect(callback).toHaveBeenCalledWith('foo', 42, true)
  })

  it('uses default delay if not provided', () => {
    const defaultDebounced = debounce(callback)
    defaultDebounced('hi')
    vi.advanceTimersByTime(299)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledWith('hi')
  })
})