import { buildCsv, csvFileName } from '../src/lib/csv.js'

const tbody = document.querySelector('#months tbody')
const table = document.getElementById('months')
const hint = document.getElementById('hint')
const downloadBtn = document.getElementById('download')
const clearBtn = document.getElementById('clear')

const yen = new Intl.NumberFormat('ja-JP')

async function load() {
  const { months = {} } = await chrome.storage.session.get('months')
  return months
}

function render(months) {
  const keys = Object.keys(months).sort().reverse()
  tbody.replaceChildren()
  for (const ym of keys) {
    const { items } = months[ym]
    const total = items.reduce((sum, i) => sum + Number(i.price), 0)
    const unfixed = items.filter((i) => i.fixedState !== '1').length
    const tr = document.createElement('tr')
    for (const [text, cls] of [
      [`${ym.slice(0, 4)}年${Number(ym.slice(4))}月`],
      [`${items.length}件`],
      [`${yen.format(total)}円`],
      [unfixed ? `${unfixed}件` : '—', unfixed ? 'warn' : ''],
    ]) {
      const td = document.createElement('td')
      td.textContent = text
      if (cls) td.className = cls
      tr.append(td)
    }
    tbody.append(tr)
  }
  table.hidden = keys.length === 0
  hint.hidden = keys.length > 0
  downloadBtn.disabled = keys.length === 0
  clearBtn.disabled = keys.length === 0
}

downloadBtn.addEventListener('click', async () => {
  const months = await load()
  const { csv } = buildCsv(months)
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = csvFileName(months)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
})

clearBtn.addEventListener('click', async () => {
  await chrome.storage.session.remove('months')
})

chrome.storage.session.onChanged.addListener(async () => render(await load()))
render(await load())
