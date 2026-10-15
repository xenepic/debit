/**
 * GetDebitUseDetail の応答を検証・正規化する。
 *
 * 応答の形式（実データで確認。値は架空）:
 *   { resultCode: "00", referenceYearMonth: "202609",
 *     detailInfoList: [{ tradingNumber: "202609150000003", useDate: "20260915",
 *       useTarget: "ｻﾝﾌﾟﾙｼﾖﾂﾌﾟ          ", priceCode: " ", price: "880",
 *       fixedState: "1", effectivenessConfirmationTransactionKubun: "0" }],
 *     contactAboutNotWithdrawnAmount: [] }
 *
 * 1回の応答にその月の全件が含まれる（画面の「すべて見る」は表示上の折りたたみのみ）。
 */

export const ITEM_FIELDS = [
  'tradingNumber',
  'useDate',
  'useTarget',
  'priceCode',
  'price',
  'fixedState',
  'effectivenessConfirmationTransactionKubun',
]

/** 正常な応答なら { yearMonth, items } を返す。対象外・不正なら null */
export function normalizeUseDetail(body) {
  if (!body || typeof body !== 'object') return null
  if (body.resultCode !== '00') return null
  const yearMonth = body.referenceYearMonth
  if (typeof yearMonth !== 'string' || !/^\d{6}$/.test(yearMonth)) return null
  if (!Array.isArray(body.detailInfoList)) return null

  const items = []
  for (const raw of body.detailInfoList) {
    if (!raw || typeof raw !== 'object') return null
    const item = {}
    for (const key of ITEM_FIELDS) {
      const v = raw[key]
      item[key] = v == null ? '' : String(v)
    }
    if (!/^\d+$/.test(item.tradingNumber) || !/^\d{8}$/.test(item.useDate) || !/^\d+$/.test(item.price)) {
      return null
    }
    items.push(item)
  }
  return { yearMonth, items }
}
