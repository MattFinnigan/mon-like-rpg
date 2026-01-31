import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const jsonPath = path.join(__dirname, '../assets/data/item-types.json')
const outputPath = path.join(__dirname, '../src/generated/item-type-keys.js')

const items = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

// generate the enum content
const enumContent = `// This file is auto-generated. Do not edit manually.
// Run 'npm run generate-keys' to regenerate.

/**
 * @typedef {keyof typeof ITEM_TYPE_KEY} ItemTypeKey
 */

/** @enum {ItemTypeKey} */
export const ITEM_TYPE_KEY = Object.freeze({
${items.map(type => `  ${type.key}: '${type.key}'`).join(',\n')}
})
`;

const generatedDir = path.dirname(outputPath)
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true })
}

fs.writeFileSync(outputPath, enumContent)

console.log('Generated item-type-keys.js')