/**
 * 取得済みの月別明細から CSV を作る。
 *
 * 値は API の応答をほぼそのまま出力する（利用先の半角カナ・末尾空白も保持）。
 * 解釈（確定かどうか、金額区分の符号など）は取り込み側で行う。
 */

export const CSV_HEADER = [
  '取引番号',
  '利用日',
  '利用先',
  '金額',
  '金額区分',
  '確定区分',
  '有効性確認区分',
  'ご利用分',
]

const escape = (value) => {
  const s = String(value)
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const formatDate = (yyyymmdd) => `${yyyymmdd.slice(0, 4)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}`
const formatMonth = (yyyymm) => `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}`

/**
 * @param {Record<string, { items: object[] }>} months 'YYYYMM' → 取得データ
 * @returns {{ csv: string, rows: number }} BOM付き UTF-8・CRLF。利用日→取引番号の昇順
 */
export function buildCsv(months) {
  const byNumber = new Map()
  for (const [yearMonth, { items }] of Object.entries(months)) {
    for (const item of items) byNumber.set(item.tradingNumber, { ...item, yearMonth })
  }
  const rows = [...byNumber.values()].sort(
    (a, b) => a.useDate.localeCompare(b.useDate) || a.tradingNumber.localeCompare(b.tradingNumber),
  )
  const lines = [CSV_HEADER.join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.tradingNumber,
        formatDate(r.useDate),
        r.useTarget,
        r.price,
        r.priceCode,
        r.fixedState,
        r.effectivenessConfirmationTransactionKubun,
        formatMonth(r.yearMonth),
      ]
        .map(escape)
        .join(','),
    )
  }
  return { csv: '﻿' + lines.join('\r\n') + '\r\n', rows: rows.length }
}

/** 例: aeon-debit_202605-202609.csv */
export function csvFileName(months) {
  const keys = Object.keys(months).sort()
  if (keys.length === 0) return 'aeon-debit.csv'
  const first = keys[0]
  const last = keys[keys.length - 1]
  return first === last ? `aeon-debit_${first}.csv` : `aeon-debit_${first}-${last}.csv`
}
