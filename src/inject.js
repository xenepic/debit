// ページ側（MAIN world）で動き、明細API の応答を写し取って relay.js へ渡す。
// ページの通信内容は変更せず、追加のリクエストも送らない。
;(() => {
  const SOURCE = 'aeon-debit-csv'
  const TARGET = /\/msapi\/v1\/debit\/GetDebitUseDetail(?:[?#]|$)/

  const post = (body) => {
    if (!body || typeof body !== 'object') return
    window.postMessage({ source: SOURCE, type: 'useDetail', body }, location.origin)
  }

  const parse = (value) => {
    if (typeof value !== 'string') return value
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  // axios（XHR）経由の呼び出し
  const open = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (TARGET.test(String(url))) {
      this.addEventListener('load', () => {
        if (this.status !== 200) return
        const body = this.responseType === '' || this.responseType === 'text' ? this.responseText : this.response
        post(parse(body))
      })
    }
    return open.call(this, method, url, ...rest)
  }

  // 将来 fetch に切り替わった場合に備える
  const fetchOrig = window.fetch
  window.fetch = function (input, init) {
    const url = input instanceof Request ? input.url : String(input)
    const res = fetchOrig.call(this, input, init)
    if (TARGET.test(url)) {
      res
        .then((r) => (r.ok ? r.clone().json() : null))
        .then(post)
        .catch(() => {})
    }
    return res
  }
})()
