// Capture a looping demo GIF of the three Gliss presets reacting to the
// synthetic AudioFrame in visuals-test.html. Headless Chrome renders the real
// Three.js scenes; frames are screenshotted and encoded to GIF in pure JS.
import puppeteer from 'puppeteer'
import gifenc from 'gifenc'
import pkg from 'pngjs'

const { GIFEncoder, quantize, applyPalette } = gifenc
import { writeFileSync } from 'node:fs'

const { PNG } = pkg
const BASE = process.env.BASE || 'http://localhost:5173'
const PRESETS = ['Glacier', 'Tide', 'Aurora']
const W = 600, H = 338
const FRAMES_PER_PRESET = 26
const FRAME_DELAY_MS = 70          // ~14 fps playback
const WARMUP_MS = 1100             // let the scene settle / bloom ramp

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--no-sandbox', '--disable-dev-shm-usage',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })

const gif = GIFEncoder()
let total = 0

for (const preset of PRESETS) {
  const url = `${BASE}/visuals-test.html?preset=${preset}`
  await page.goto(url, { waitUntil: 'networkidle0' })
  const canvas = await page.$('#c')
  if (!canvas) throw new Error(`no #c canvas for ${preset}`)
  await sleep(WARMUP_MS)

  for (let i = 0; i < FRAMES_PER_PRESET; i++) {
    const buf = await canvas.screenshot({ type: 'png' })
    const png = PNG.sync.read(buf)
    // png.data is RGBA Uint8Array at png.width x png.height (may differ slightly)
    const rgba = new Uint8Array(png.data)
    const palette = quantize(rgba, 256)
    const index = applyPalette(rgba, palette)
    gif.writeFrame(index, png.width, png.height, { palette, delay: FRAME_DELAY_MS })
    total++
    await sleep(FRAME_DELAY_MS)
  }
  console.log(`captured ${preset}`)
}

gif.finish()
writeFileSync(new URL('../docs/demo.gif', import.meta.url), gif.bytes())
console.log(`wrote docs/demo.gif (${total} frames)`)
await browser.close()
