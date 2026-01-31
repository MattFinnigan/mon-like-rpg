import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const jsonPath = path.join(__dirname, '../assets/data/attack_assets.json')
const outputPath = path.join(__dirname, '../src/generated/attack-asset-keys.js')

const items = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

// Get unique items by assetKey
const uniqueItems = items.filter((item, index, self) => 
  index === self.findIndex(t => t.assetKey === item.assetKey)
)

// generate the enum content
const enumContent = `// This file is auto-generated. Do not edit manually.
// Run 'npm run generate-keys' to regenerate.

/**
  * @typedef {keyof typeof ATTACK_ASSET_KEYS} AttackAssetKey
 */

/** @enum {AttackAssetKey} */
export const ATTACK_ASSET_KEYS = Object.freeze({
${uniqueItems.map(type => `  ${type.assetKey}: '${type.assetKey}'`).join(',\n')}
})
`;

const generatedDir = path.dirname(outputPath)
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true })
}

fs.writeFileSync(outputPath, enumContent)

console.log('Generated attack-asset-keys.js')