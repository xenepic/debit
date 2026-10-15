// 拡張機能側（ISOLATED world）。inject.js からの応答をバックグラウンドへ中継する。
window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== location.origin) return
  const data = event.data
  if (!data || data.source !== 'aeon-debit-csv' || data.type !== 'useDetail') return
  chrome.runtime.sendMessage({ type: 'useDetail', body: data.body }).catch(() => {})
})
