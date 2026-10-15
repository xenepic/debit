import { normalizeUseDetail } from './lib/statement.js'

// 明細はブラウザを閉じると消える storage.session に保持する（ディスクに残さない）
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'useDetail') return
  if (!sender.url?.startsWith('https://www.aeon.co.jp/app/')) return
  const result = normalizeUseDetail(message.body)
  if (!result) return
  save(result)
})

async function save({ yearMonth, items }) {
  const { months = {} } = await chrome.storage.session.get('months')
  months[yearMonth] = { items, capturedAt: new Date().toISOString() }
  await chrome.storage.session.set({ months })
}
