# イオンデビット明細CSV（Chrome拡張）

イオンカード「暮らしのマネーサイト」のデビット ご利用明細（`https://www.aeon.co.jp/app/debit/`）を CSV で保存する拡張機能です。
公式には CSV ダウンロードの機能がないため作りました。CSV は [Spendly](https://github.com/xenepic/spendly) への取り込みを想定しています。

ログインと明細ページへの移動は手動で行います。拡張機能は**ページ自身が受け取った明細 API の応答を写し取るだけ**で、自分からはリクエストを送りません。取得したデータを外部へ送信することもありません。

**CSV の列の意味と、取り込み側での扱い方は [docs/csv-format.md](docs/csv-format.md) を参照してください。**

## 使い方

1. `chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選ぶ
   （WSL 上にある場合は Windows 側へコピーしてから読み込むと確実です）
2. 暮らしのマネーサイトにログインし、デビットの「ご利用明細」を開く
3. 必要な月のタブやプルダウンを順に切り替える（切り替えるたびに、その月の明細が取得される）
4. 拡張機能のアイコンを押し、取得済みの月を確認して「CSVをダウンロード」

- 取得データは `chrome.storage.session` に保持され、ブラウザを閉じると消えます（ディスクには残りません）
- サイトでさかのぼれるのは約半年分なので、定期的に保存してください
- ポップアップに何も表示されない場合は、明細ページを再読み込みしてください（拡張機能が監視を始める前にページが API を呼んでいた可能性があります）

## 仕組み

| ファイル | 役割 |
|---|---|
| `src/inject.js` | ページ側（MAIN world）で XHR と fetch を監視し、`GetDebitUseDetail` の応答を `postMessage` で渡す |
| `src/relay.js` | 拡張側（ISOLATED world）でメッセージを受け取り、バックグラウンドへ中継する |
| `src/background.js` | 応答を検証し（`src/lib/statement.js`）、月ごとに保存する（同じ月は上書き） |
| `popup/` | 取得済みの月の一覧表示、CSV の作成（`src/lib/csv.js`）とダウンロード |

### 明細 API（実際の通信で確認。値は架空）

`POST https://www.aeon.co.jp/msapi/v1/debit/GetDebitUseDetail`

- リクエストは `{ cardIdentifier, referenceYearMonth: "YYYYMM", orderType }`。認証は Cookie
- 月のタブを切り替えたときに呼ばれ、**その月の全件が1回で返る**（「すべて見る」や「＋」では通信しない）
- 一度表示した月はページ内にキャッシュされ、もう一度選んでも通信しない

```json
{
  "resultCode": "00",
  "referenceYearMonth": "202609",
  "detailInfoList": [
    { "tradingNumber": "202609150000003", "useDate": "20260915",
      "useTarget": "ｻﾝﾌﾟﾙｼﾖﾂﾌﾟ          ", "priceCode": " ", "price": "880",
      "fixedState": "1", "effectivenessConfirmationTransactionKubun": "0" }
  ],
  "contactAboutNotWithdrawnAmount": []
}
```

未引落分の API（`/debit/GetDebitNotWithdrawnDetail`）もありますが、確定前のデータなので取得していません。

## 開発

```bash
npm test   # Node の組み込みテストランナー（依存パッケージなし）
```

テストのデータ（`tests/fixtures/`）は実際の応答の形式に合わせた架空のデータです。
