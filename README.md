# WebWorkShop — Portfolio

Ogawa Yoshio（WebWorkShop）のポートフォリオサイト。デザインから開発・運用まで一貫して手がけるWebクリエイターの実績紹介サイトです。

🌐 **Live:** https://portfolio-blond-six-99.vercel.app

## 構成

静的サイト（ビルド不要）。

| ファイル | 役割 |
|---|---|
| `index.html` | マークアップ（セマンティックなクラス参照） |
| `style.css` | デザイントークン（CSS変数）＋コンポーネントスタイル |
| `app.js` | ローダー / Three.js のヒーロー演出 / スクロールアニメ / カウントアップ / 実績のパスワードゲート |
| `assets/` | LP・プロダクトカード・バナー画像 |

## ローカルで動かす

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## デプロイ

[Vercel](https://vercel.com) でホスティング。`main` への push で自動デプロイされます。

---

© 2026 WebWorkShop — Designed & built by Ogawa Yoshio
