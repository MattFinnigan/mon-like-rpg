import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(new URL('../../../../assets/images/anims/attks/', import.meta.url).pathname)

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || !form.length) {
      throw createError({
        statusCode: 400,
        message: 'No data uploaded'
      })
    }

    // Find file and name from form data
    const fileField = form.find(field => field.name === 'file')
    const nameField = form.find(field => field.name === 'name')
    
    if (!fileField) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }

    if (!nameField) {
      throw createError({
        statusCode: 400,
        message: 'No name provided'
      })
    }

    // Get the filename from the name field
    const filename = nameField.data.toString('utf-8')

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(fileField.type || '')) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file type. Only images allowed.'
      })
    }

    // Write file
    const filepath = join(UPLOAD_DIR, filename)
    await writeFile(filepath, fileField.data)

    // Return public URL
    return {
      success: true,
      url: `/assets/images/anims/attks/${filename}`,
      filename: filename
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to upload image'
    })
  }
})