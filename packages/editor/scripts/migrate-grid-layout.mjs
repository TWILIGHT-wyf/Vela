#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'

function parseFrTemplate(template) {
  if (typeof template !== 'string' || !template.trim()) return [1]
  return template
    .trim()
    .split(/\s+/)
    .map((part) => {
      const match = part.match(/^([\d.]+)fr$/)
      if (!match) return 1
      const value = Number.parseFloat(match[1] || '1')
      return Number.isFinite(value) && value > 0 ? value : 1
    })
}

function frListToTracks(values) {
  return values.map((value) => ({
    unit: 'fr',
    value: Math.max(0.1, Math.round(value * 100) / 100),
  }))
}

function migrateGridContainer(container) {
  if (!container || container.mode !== 'grid') return

  if (!Array.isArray(container.columnTracks)) {
    container.columnTracks = frListToTracks(parseFrTemplate(container.columns || '1fr'))
  }
  if (!container.rowTracks) {
    container.rowTracks = frListToTracks(parseFrTemplate(container.rows || '1fr'))
  }

  if (container.gapX === undefined) {
    container.gapX = typeof container.gap === 'number' ? container.gap : 8
  }
  if (container.gapY === undefined) {
    container.gapY = typeof container.gap === 'number' ? container.gap : 8
  }
  if (!container.autoFlow) {
    container.autoFlow = 'row'
  }
  if (container.dense === undefined) {
    container.dense = true
  }
  if (container.autoRowsMin === undefined) {
    container.autoRowsMin = 24
  }
}

function migrateGridItem(node) {
  if (!node || typeof node !== 'object') return

  if (node.layoutItem?.mode === 'grid') return
  if (!node.geometry || node.geometry.mode !== 'grid') return

  const colStart = Math.max(1, Math.round(node.geometry.gridColumnStart || 1))
  const colEnd = Math.max(colStart + 1, Math.round(node.geometry.gridColumnEnd || colStart + 1))
  const rowStart = Math.max(1, Math.round(node.geometry.gridRowStart || 1))
  const rowEnd = Math.max(rowStart + 1, Math.round(node.geometry.gridRowEnd || rowStart + 1))

  node.layoutItem = {
    mode: 'grid',
    placement: {
      colStart,
      colSpan: colEnd - colStart,
      rowStart,
      rowSpan: rowEnd - rowStart,
    },
    sizeModeX: 'stretch',
    sizeModeY: 'stretch',
  }
}

function migrateNode(node) {
  if (!node || typeof node !== 'object') return

  migrateGridContainer(node.container)
  migrateGridItem(node)

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      migrateNode(child)
    }
  }

  if (node.slots && typeof node.slots === 'object') {
    for (const slotChildren of Object.values(node.slots)) {
      if (!Array.isArray(slotChildren)) continue
      for (const child of slotChildren) {
        migrateNode(child)
      }
    }
  }
}

function migrateProjectLike(data) {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data.pages)) {
    for (const page of data.pages) {
      if (page?.children) {
        migrateNode(page.children)
      }
    }
  }

  if (Array.isArray(data.routes)) {
    for (const route of data.routes) {
      if (route?.page?.children) {
        migrateNode(route.page.children)
      }
    }
  }

  if (data.children) {
    migrateNode(data.children)
  }

  if (data.id && (data.component || data.componentName || data.children || data.container)) {
    migrateNode(data)
  }

  return data
}

function printUsage() {
  console.log('Usage:')
  console.log('  node packages/editor/scripts/migrate-grid-layout.mjs <input.json> <output.json>')
}

const [, , inputArg, outputArg] = process.argv
if (!inputArg || !outputArg) {
  printUsage()
  process.exit(1)
}

const inputPath = path.resolve(process.cwd(), inputArg)
const outputPath = path.resolve(process.cwd(), outputArg)

if (!fs.existsSync(inputPath)) {
  console.error(`[migrate-grid-layout] Input file not found: ${inputPath}`)
  process.exit(1)
}

const raw = fs.readFileSync(inputPath, 'utf-8')
const json = JSON.parse(raw)
const migrated = migrateProjectLike(json)

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(migrated, null, 2)}\n`, 'utf-8')
console.log(`[migrate-grid-layout] Migrated file written to: ${outputPath}`)
