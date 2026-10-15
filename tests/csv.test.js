import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeUseDetail } from '../src/lib/statement.js'
import { buildCsv, csvFileName, CSV_HEADER } from '../src/lib/csv.js'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/use-detail-202609.json', import.meta.url), 'utf8'))

test('実データの応答を正規化できる', () => {
  const r = normalizeUseDetail(fixture)
  assert.equal(r.yearMonth, '202609')
  assert.equal(r.items.length, 5)
  assert.equal(r.items[2].useTarget, 'ｻﾝﾌﾟﾙｼﾖﾂﾌﾟ          ')
})

test('エラー応答・不正な応答は無視する', () => {
  assert.equal(normalizeUseDetail({ ...fixture, resultCode: '99' }), null)
  assert.equal(normalizeUseDetail({ ...fixture, referenceYearMonth: '2026-09' }), null)
  assert.equal(normalizeUseDetail({ ...fixture, detailInfoList: [{ ...fixture.detailInfoList[0], price: '1,000' }] }), null)
  assert.equal(normalizeUseDetail(null), null)
})

test('CSV: BOM・ヘッダー・日付昇順・末尾空白の保持', () => {
  const { yearMonth, items } = normalizeUseDetail(fixture)
  const { csv, rows } = buildCsv({ [yearMonth]: { items } })
  assert.equal(rows, 5)
  assert.ok(csv.startsWith('﻿'))
  const lines = csv.slice(1).trimEnd().split('\r\n')
  assert.equal(lines[0], CSV_HEADER.join(','))
  assert.equal(lines[1], '202609010000001,2026/09/01,イオン見本店,1500," ",1,0,2026-09')
  assert.equal(lines[3], '202609150000003,2026/09/15,"ｻﾝﾌﾟﾙｼﾖﾂﾌﾟ          ",880," ",1,0,2026-09')
  assert.equal(lines[5], '202609290000005,2026/09/28,EXAMPLE *SUBSCRIPTION,1200," ",1,0,2026-09')
})

test('複数月にまたがって同じ取引番号があれば1行にする', () => {
  const { items } = normalizeUseDetail(fixture)
  const { rows } = buildCsv({ '202609': { items }, '202610': { items: items.slice(0, 2) } })
  assert.equal(rows, 5)
})

test('値にカンマ・引用符があればエスケープする', () => {
  const item = { ...normalizeUseDetail(fixture).items[0], useTarget: 'A,"B"' }
  const { csv } = buildCsv({ '202609': { items: [item] } })
  assert.ok(csv.includes(',"A,""B""",'))
})

test('ファイル名', () => {
  assert.equal(csvFileName({ '202609': {}, '202605': {}, '202607': {} }), 'aeon-debit_202605-202609.csv')
  assert.equal(csvFileName({ '202609': {} }), 'aeon-debit_202609.csv')
})
