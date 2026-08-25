# WebWorkShop — Portfolio

Ogawa Yoshio（WebWorkShop）のポートフォリオサイト。デザインから開発・運用まで一貫して手がけるWebクリエイターの実績紹介サイトです。

🌐 **Live:** https://portfolio-blond-six-99.vercel.app

## 構成

静的サイト（ビルド不要）＋ 実績セクション用の Serverless Function。

| パス | 役割 |
|---|---|
| `public/` | 公開される静的ファイル一式（Vercel の Output Directory） |
| `public/index.html` | マークアップ（セマンティックなクラス参照） |
| `public/style.css` | デザイントークン（CSS変数）＋コンポーネントスタイル |
| `public/app.js` | ローダー / Three.js のヒーロー演出 / スクロールアニメ / カウントアップ / 実績ゲート |
| `public/assets/` | 自社プロダクトのカード画像 |
| `works-private/` | 実績のマークアップと画像。**公開ディレクトリの外**にあり、直接は配信されない |
| `api/works.js` | `POST /api/works` — 閲覧コードを検証して httpOnly cookie を発行 |
| `api/works-content.js` | `GET /works/content` — cookie 検証後に実績マークアップを返す |
| `api/works-asset.js` | `GET /works/assets/<file>` — cookie 検証後に実績画像を返す（未認証は 404） |
| `vercel.json` | Output Directory・rewrite・関数へのファイル同梱設定 |

### 実績セクションの保護

クライアントワークの秘匿のため、実績（他社名・LP スクリーンショット・バナー）は
**公開 HTML に一切含まれない**。未認証時に返るのは見出し・説明文・閲覧コード入力欄だけで、
中身はコード照合を通ったリクエストにのみサーバーから返される。
未認証のアクセスは 401/404 を返すだけで、Basic 認証のダイアログは出さない。

必要な環境変数（Vercel の Environment Variables に Production / Preview / Development すべて登録）:

| 変数 | 内容 |
|---|---|
| `WORKS_PASSWORD` | クライアントに伝える閲覧コード |
| `WORKS_KEY` | cookie に入れるランダム値（`openssl rand -hex 32`）。閲覧コードとは別物にする |

どちらも `NEXT_PUBLIC_` のような公開接頭辞は付けない（クライアントには渡らない）。

## ローカルで動かす

```bash
npx vercel dev
# → http://localhost:3000
```

`WORKS_PASSWORD` / `WORKS_KEY` を `.env.local` に置くか `vercel env pull` で取得しておく。
静的部分だけ確認したい場合は `python3 -m http.server 8000 --directory public`
（この場合 `/api/*` と実績セクションは動作しない）。

## デプロイ

[Vercel](https://vercel.com) でホスティング。`main` への push で自動デプロイされます。

---

© 2026 WebWorkShop — Designed & built by Ogawa Yoshio
