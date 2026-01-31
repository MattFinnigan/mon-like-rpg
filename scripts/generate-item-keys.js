import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const itemsPath = path.join(__dirname, '../assets/data/items.json')
const outputPath = path.join(__dirname, '../src/generated/item-keys.js')

const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// generate the enum content
const enumContent = `// This file is auto-generated. Do not edit manually.
// Run 'npm run generate-keys' to regenerate.

/**
 * @typedef {keyof typeof ITEM_KEY} ItemKey
 */

/** @enum {ItemKey} */
export const ITEM_KEY = Object.freeze({
${items.map(item => `  ${item.key}: '${item.key}'`).join(',\n')}
})
`;

const generatedDir = path.dirname(outputPath)
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true })
}

fs.writeFileSync(outputPath, enumContent)

console.log('Generated item-keys.js')