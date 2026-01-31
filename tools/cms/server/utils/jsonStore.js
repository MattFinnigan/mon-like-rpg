import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const DATA_DIR = join(new URL('../../../../assets/data/', import.meta.url).pathname)

/**
 * Read JSON from file
 * @param {string} fileName
 * @returns {Promise<any>} Parsed JSON
 */
export async function readJSON( fileName) {
  const content = await readFile(join(DATA_DIR, fileName + '.json'), 'utf-8')
  return JSON.parse(content)
}

/**
 * Write JSON to file
 * @param {string} fileName
 * @param {any} data
 */
export async function writeJSON (fileName, data) {
  try {
    await writeFile(join(DATA_DIR, fileName + '.json'), JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error(`Error writing ${fileName}:`, err)
    return false
  }
}
