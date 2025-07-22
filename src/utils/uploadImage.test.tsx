/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockUpload: any
let mockStorageFrom: any

vi.mock('../supabaseClient', () => {
  mockUpload = vi.fn()
  mockStorageFrom = vi.fn(() => ({
    upload: mockUpload
  }))

  return {
    supabase: {
      storage: {
        from: mockStorageFrom
      }
    }
  }
})

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws an error if no file is provided', async () => {
    const { uploadImage } = await import('./uploadImage')

    await expect(uploadImage(undefined)).rejects.toThrow(
      'You must select an image to upload'
    )
  })

  it('uploads the file and returns file info on success', async () => {
    const { uploadImage } = await import('./uploadImage')

    mockUpload.mockResolvedValueOnce({
      data: {},
      error: null
    })

    const file = new File(['dummy'], 'image.png', { type: 'image/png' })

    const result = await uploadImage(file)

    expect(mockStorageFrom).toHaveBeenCalledWith('images')
    expect(mockUpload).toHaveBeenCalledWith(expect.any(String), file)
    expect(result).toHaveProperty('fileName')
    expect(result).toHaveProperty('filePath')
  })

  it('throws an error if upload fails', async () => {
    const { uploadImage } = await import('./uploadImage')

    mockUpload.mockResolvedValueOnce({
      data: null,
      error: { message: 'Something went wrong' }
    })

    const file = new File(['dummy'], 'image.jpg', { type: 'image/jpeg' })

    await expect(uploadImage(file)).rejects.toThrow(
      'Failed to upload image: Something went wrong'
    )
  })
})