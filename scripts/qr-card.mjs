#!/usr/bin/env node
// Printable QR cards (US5). Usage: node scripts/qr-card.mjs https://<user>.github.io/wedding-moments/
// Writes docs/qr-card.html — 4 A6 cards per A4 sheet. Open in a browser and print (no margins).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const url = process.argv[2]
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Usage: node scripts/qr-card.mjs <site-url>')
  process.exit(2)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cfg = readFileSync(join(root, 'src/config.ts'), 'utf8')
const pick = (re, fallback) => cfg.match(re)?.[1] ?? fallback
const first = pick(/first:\s*'([^']+)'/, 'Яна')
const second = pick(/second:\s*'([^']+)'/, 'Віталій')
const joiner = pick(/joiner:\s*'([^']+)'/, 'та')
const date = pick(/dateLabel:\s*'([^']+)'/, '4 вересня 2027')
const olive = readFileSync(join(root, 'src/assets/olive.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '')

const qr = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 0,
  color: { dark: '#5A4636', light: '#0000' },
})

const card = `
<div class="card">
  <div class="branch tl">${olive}</div><div class="branch br">${olive}</div>
  <p class="caps">Поділіться моментами</p>
  <h1>${first} <em>${joiner}</em> ${second}</h1>
  <p class="caps date">${date}</p>
  <div class="qr">${qr}</div>
  <p class="hint">Наведіть камеру телефона на код<br/>і додайте фото та відео з нашого свята</p>
</div>`

const html = `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><title>QR-картки</title>
<style>
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; color: #5A4636; background: #fff }
.sheet { width: 210mm; height: 297mm; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr }
.card { position: relative; overflow: hidden; background: #F3EBDD; border: 0.2mm dashed #ddd;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10mm }
.card::after { content: ''; position: absolute; inset: 4mm; border: 0.3mm solid #C9B8A3; pointer-events: none }
.branch { position: absolute; width: 30mm; opacity: .9 } .branch svg { width: 100%; height: auto }
.tl { top: -2mm; left: -2mm; transform: rotate(90deg) } .br { bottom: -2mm; right: -2mm; transform: rotate(-90deg) }
.caps { text-transform: uppercase; letter-spacing: .28em; font-size: 8pt; margin: 0 }
h1 { font-weight: 500; text-transform: uppercase; letter-spacing: .15em; font-size: 17pt; margin: 4mm 0 2mm }
h1 em { text-transform: none; letter-spacing: 0; color: #7B7F5C; font-weight: 400 }
.date { margin-bottom: 5mm }
.qr { width: 42mm; height: 42mm; background: #FAF6EE; padding: 3mm; border-radius: 2mm } .qr svg { width: 100%; height: 100% }
.hint { font-size: 10pt; margin: 5mm 0 0; line-height: 1.35 }
</style></head>
<body><div class="sheet">${card.repeat(4)}</div>
<!-- ${url} --></body></html>`

const out = join(root, 'docs/qr-card.html')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html)
console.log(`Wrote ${out} for ${url}`)
