// Capture a looping demo GIF of the three Gliss presets reacting to the
// synthetic AudioFrame in visuals-test.html. Headless Chrome renders the real
// Three.js scenes; frames are screenshotted and encoded to GIF in pure JS.
import puppeteer from 'puppeteer-core'
import gifenc from 'gifenc'
import pkg from 'pngjs'
import { writeFileSync, existsSync } from 'node:fs'

const { GIFEncoder, quantize, applyPalette } = gifenc
const { PNG } = pkg

// puppeteer-core ships no browser; point it at an installed Chrome/Chromium.
// Override with CHROME_PATH=... if yours lives elsewhere.
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Chromium found. Set CHROME_PATH=/path/to/chrome and retry.')
  process.exit(1)
}
const BASE = process.env.BASE || 'http://localhost:5173'
const PRESETS = ['Glacier', 'Tide', 'Aurora']
const W = 540, H = 304
const FRAMES_PER_PRESET = 22
const FRAME_DELAY_MS = 80          // ~12.5 fps playback
const WARMUP_MS = 1100             // let the scene settle / bloom ramp

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath,
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
