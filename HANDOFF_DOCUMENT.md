# PhotoCRM - AI引き継ぎドキュメント

**作成日:** 2026年2月22日  
**現在バージョン:** v2.2.3  
**プロジェクト状態:** Phase 2 完了、Phase 3 準備完了  
**前担当AI:** Claude (Anthropic)

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [開発経緯](#開発経緯)
3. [設計思想](#設計思想)
4. [アーキテクチャ](#アーキテクチャ)
5. [現在のコード構造](#現在のコード構造)
6. [解決済みのバグ](#解決済みのバグ)
7. [未解決の課題](#未解決の課題)
8. [Phase 3: 次のステップ](#phase-3-次のステップ)
9. [懸念事項と技術的負債](#懸念事項と技術的負債)
10. [重要な決定事項](#重要な決定事項)

---

## プロジェクト概要

### プロダクト名
**PhotoCRM** - フォトグラファー向け顧客管理アプリケーション

### ターゲットユーザー
- 個人フォトグラファー（主に日本市場）
- 小規模フォトスタジオ
- フリーランスカメラマン

### コアバリュープロポジション
1. **シンプル**: 複雑な機能を排除、必要最小限に特化
2. **オフライン優先**: ローカルストレージ（localStorage）を活用
3. **多言語対応**: 6言語サポート（日本語、英語、フランス語、中国語簡体字/繁体字、韓国語）
4. **PWA**: インストール可能、モバイル対応
5. **無料**: 基本機能は永久無料（30顧客まで）

### 主要機能
- 顧客管理（CRUD）
- カレンダー表示
- 請求書・見積書・契約書PDF生成
- タスク管理
- 経費管理
- チーム管理
- データエクスポート/インポート
- 多言語切り替え
- ダーク/ライトモード

---

## 開発経緯

### セッション1（詳細不明、転記内容のみ）
- v2.0.0として6言語PWAの基盤構築
- メッセージ解析機能の実装
- チーム管理機能の計画

### セッション2（2026年2月21日-22日）
このセッションで以下を実施：

#### 初期状態
- Antigravityで生成されたコードが動作不良
- 言語切り替えが完全に壊れている
- テーマ切り替えが機能していない
- メッセージ解析機能が不要と判断

#### Phase 1: 緊急バグ修正
1. **言語切り替えシステムの完全修正**
   - `updateLanguage()` 関数の再実装
   - `data-i18n` 属性の追加
   - locales.js のエクスポート確認
   - 初期化順序の修正

2. **テーマシステムの修正**
   - `currentTheme` 変数の未定義エラー修正
   - `applyTheme()` 関数の正常化

3. **メッセージ解析機能の削除**
   - 使用頻度が低いと判断
   - コードの複雑性を削減
   - 約150行のコード削減

4. **openModal() バグ修正**
   - 削除した要素への参照を除去
   - 新規登録ボタンが反応しない問題を解決

5. **savedTheme is not defined エラー修正**
   - v2.2.2 で解決
   - すべての機能が停止していた致命的バグ

#### Phase 2: UI/UX改善 + btoa エンコードエラー修正
1. **プランのデフォルト削除**
   - `DEFAULT_OPTIONS.plan = []` に変更
   - ユーザーが自由に追加可能に

2. **アシスタントフィールドをテキスト入力に変更**
   - ドロップダウンから自由入力へ

3. **セクションタイトルの中央配置**
   - CSS で `text-align: center` 適用

4. **btoa エンコードエラーの修正（最重要）**
   - 問題: 日本語顧客データを `btoa()` でエンコードしようとしてエラー
   - 解決: 顧客IDのみを渡し、関数内でデータ取得
   - 新しいヘルパー関数を追加:
     - `generateInvoiceByID()`
     - `generateQuoteByID()`
     - `openContractModalByID()`
   - **これが最も重要な修正。このバグでアプリ全体が停止していた**

---

## 設計思想

### 1. オフラインファースト
**理念:** バックエンドに依存しない、完全にクライアントサイドで動作するアプリ

**実装:**
- すべてのデータを localStorage に保存
- Service Worker でオフライン対応
- PWA として動作

**メリット:**
- サーバーコスト: ゼロ
- データ主権: ユーザーがデータを完全に所有
- 高速: サーバー通信なし

**デメリット（認識済み）:**
- デバイス間同期なし（手動エクスポート/インポートのみ）
- ストレージ制限（ブラウザ依存、通常5-10MB）
- バックアップはユーザー責任

### 2. シンプリシティ
**理念:** 必要最小限の機能のみを実装

**判断基準:**
- 80%のフォトグラファーが使う機能のみ実装
- 「Nice to have」は削除
- メンテナンス負荷を最小化

**実例:**
- メッセージ解析機能を削除（使用頻度低い）
- デフォルトのプラン選択肢を削除（一般的ではない）
- チャーター事前払いチェックボックスを削除予定

### 3. 日本市場最適化
**理念:** 主要ターゲットは日本のフォトグラファー

**実装:**
- 日本語を第一言語として設計
- 円（¥）をデフォルト通貨
- 日本の商習慣に対応（請求書フォーマット、税込/税抜）
- 日本語の顧客データに完全対応（btoa問題を解決）

### 4. 段階的価格戦略
**理念:** 無料→有料への自然な移行

**価格設定の背景:**
- 無料プラン: 30顧客（「試してから買う」体験）
- 個人プラン: $7/月（日本市場を考慮した低価格）
- チームプラン: $17/月
- スタジオプラン: $37/月
- エンタープライズ: カスタム

**戦略:**
- 30顧客制限で有料化を促進
- フリーミアムモデル
- Firebase統合は有料プランのみ（Phase 3以降）

---

## アーキテクチャ

### 技術スタック

```
Frontend:
├── Vanilla JavaScript (ES6+)
├── HTML5
├── CSS3 (Custom Properties for theming)
└── PWA (Service Worker + manifest.json)

Storage:
└── localStorage (JSON)

Libraries:
├── jsPDF (請求書/見積書/契約書PDF生成)
└── Google Fonts (Inter)

Deployment:
└── 静的ホスティング (任意のHTTPサーバー)
```

### ファイル構造

```
photocrm/
├── index.html              # メインアプリUI
├── landing.html            # ランディングページ
├── style.css               # 全体スタイル
├── app.js                  # メインロジック (1376行)
├── locales.js              # 多言語翻訳 (1837行)
├── invoice-generator.js    # PDF生成
├── team-manager.js         # チーム管理
├── sync-manager.js         # エクスポート/インポート
├── sw.js                   # Service Worker
├── manifest.json           # PWA設定
└── icon.svg                # アプリアイコン
```

### データモデル

#### Customer Object
```javascript
{
  id: "ldjf93jd",              // String - ユニークID
  customerName: "山田花子",     // String - 必須
  contact: "@yamada",          // String - Instagram/Email
  inquiryDate: "2026-02-01",   // String (ISO date)
  contractDate: "2026-02-10",  // String (ISO date)
  shootingDate: "2026-03-15",  // String (ISO date)
  meetingDate: "2026-02-20",   // String (ISO date)
  billingDate: "2026-03-20",   // String (ISO date)
  plan: "半日午後",             // String
  costume: "ウェディングドレス", // String
  hairMakeup: "ヘアメイク",     // String
  location: "代々木公園",       // String
  revenue: 150000,             // Number (円)
  paymentChecked: true,        // Boolean
  assignedTo: "photographer1", // String - チームメンバーID
  details: "...",              // String - 長文
  notes: "...",                // String - 長文
  updatedAt: "2026-02-22T10:30:00Z", // String (ISO timestamp)
  customFields: {              // Object - カスタムフィールド（Phase 3で追加予定）
    "custom_abc123": "Canon R5"
  }
}
```

#### Options Object
```javascript
{
  plan: ["半日午前", "半日午後", ...],      // Array<String>
  costume: ["ウェディングドレス", ...],    // Array<String>
  hairMakeup: ["ヘアメイク", ...],        // Array<String>
  assistant: [],                          // Array<String> - 現在未使用
  secondAssistant: []                     // Array<String> - 現在未使用
}
```

#### Tax Settings Object
```javascript
{
  enabled: true,               // Boolean
  rate: 10,                    // Number (%)
  label: "消費税",              // String
  included: false,             // Boolean - 税込み/税抜き
  companyName: "...",          // String
  address: "...",              // String
  email: "...",                // String
  phone: "...",                // String
  bank: "..."                  // String
}
```

#### Team Member Object
```javascript
{
  id: "photographer1",         // String
  name: "田中太郎",             // String
  role: "photographer",        // String: admin | photographer | assistant
  createdAt: "2026-02-22T..."  // String (ISO timestamp)
}
```

#### Expense Object
```javascript
{
  id: "exp123",                // String
  date: "2026-02-15",          // String (ISO date)
  category: "equipment",       // String
  item: "Canon R5",            // String
  amount: 500000,              // Number (円)
  createdAt: "2026-02-22T..."  // String (ISO timestamp)
}
```

### localStorage Keys

```javascript
'photocrm_customers'        // Customer[]
'photocrm_options'          // Options
'photocrm_theme'            // 'dark' | 'light'
'photocrm_lang'             // 'en' | 'ja' | 'fr' | 'zh-CN' | 'zh-TW' | 'ko'
'photocrm_tax_settings'     // TaxSettings
'photocrm_expenses'         // Expense[]
'photocrm_team'             // TeamMember[]
'photocrm_custom_fields'    // CustomFieldDefinition[] (Phase 3で追加予定)
```

---

## 現在のコード構造

### app.js の主要セクション

```javascript
// ===== Storage Keys ===== (Line 6-13)
// ローカルストレージのキー定義

// ===== Language Management ===== (Line 15-104)
// 多言語対応システム
// - t(key, params): 翻訳関数
// - updateLanguage(lang): 言語切り替え

// ===== Default Custom Options ===== (Line 106-119)
// フィールドのデフォルト選択肢

// ===== Storage Helpers ===== (Line 121-136)
// localStorage の読み書き関数

// ===== State ===== (Line 142-157)
// アプリケーション状態管理

// ===== Fields Definition ===== (Line 170-189)
// フォームフィールドの定義

// ===== Formatting & Helpers ===== (Line 191-243)
// 日付・通貨フォーマット、税金計算

// ===== Theme Management ===== (Line 245-268)
// ダーク/ライトモード切り替え

// ===== Expense Management ===== (Line 270-318)
// 経費管理機能

// ===== Dashboard Update ===== (Line 320-343)
// ダッシュボードの統計表示

// ===== Month Filter ===== (Line 345-360)
// 月別フィルター

// ===== Filter & Sort ===== (Line 362-442)
// 顧客リストのフィルタリング・ソート

// ===== Render Table ===== (Line 444-503)
// 顧客リストのテーブル表示
// ⚠️ 重要: btoa問題の修正箇所（476-478行目）

// ===== Calendar Rendering ===== (Line 524-607)
// カレンダー表示

// ===== Modal Management ===== (Line 609-677)
// 顧客登録/編集モーダル

// ===== Save Customer ===== (Line 678-740)
// 顧客データの保存

// ===== Delete Customer ===== (Line 742-774)
// 顧客削除

// ===== Detail Modal ===== (Line 776-835)
// 顧客詳細表示

// ===== Export Functions ===== (Line 837-961)
// CSV/ICSエクスポート

// ===== Settings Management ===== (Line 963-1258)
// 設定モーダル、税金設定、チーム管理

// ===== Helper Functions ===== (Line 1260-1277)
// PDF生成用ヘルパー関数

// ===== Initialization ===== (Line 1279-1354)
// アプリ初期化、イベントリスナー登録

// ===== DOM Ready ===== (Line 1372-1376)
// DOMContentLoaded イベント
```

### 重要な関数の詳細

#### updateLanguage(lang)
**責務:** 言語を切り替え、すべてのUI要素を更新

**処理フロー:**
1. localStorage に言語を保存
2. `data-i18n` 属性を持つ要素をすべて更新
3. `data-i18n-placeholder` 属性を持つ要素を更新
4. `data-i18n-title` 属性を持つ要素を更新
5. 言語セレクターの値を更新
6. 動的コンテンツ（テーブル、カレンダー）を再レンダリング

**呼び出しタイミング:**
- アプリ初期化時
- 言語セレクター変更時

#### renderTable()
**責務:** 顧客リストをテーブルに表示

**重要な修正履歴:**
- **v2.2.3**: btoa問題を修正
  - 変更前: `btoa(JSON.stringify(c))` で日本語をエンコード
  - 変更後: 顧客IDのみを渡し、ヘルパー関数で取得

**処理フロー:**
1. フィルタリングされた顧客リストを取得
2. 顧客数が0なら空状態を表示
3. 各顧客をテーブル行として生成
4. アクションボタン（編集、削除、PDF生成）を追加
5. 統計情報を更新

#### saveCustomer()
**責務:** 顧客データを保存（新規作成または更新）

**処理フロー:**
1. 必須フィールド（顧客名）を検証
2. フォームデータを収集
3. 新規の場合はIDと作成日を追加
4. 更新の場合は既存データをマージ
5. localStorage に保存
6. テーブルを再レンダリング
7. モーダルを閉じる

**バリデーション:**
- 顧客名: 必須
- 無料プラン制限: 30顧客まで

#### openModal(id)
**責務:** 顧客登録/編集モーダルを開く

**処理フロー:**
1. 無料プラン制限をチェック（新規作成時）
2. フォームをリセット
3. セレクトボックスを再構築
4. 選択肢を読み込み
5. 編集の場合は既存データを表示
6. カスタムフィールドを表示（Phase 3で追加予定）
7. モーダルを表示

**重要な修正履歴:**
- **v2.2.1**: 削除した要素（parse-input, parse-result）への参照を除去

---

## 解決済みのバグ

### 🔴 致命的バグ（アプリ全体が停止）

#### 1. savedTheme is not defined (v2.2.2で修正)
**症状:**
```
Uncaught ReferenceError: savedTheme is not defined
at app.js:1281
```
- 新規登録ボタンが反応しない
- テーブルが表示されない
- すべての機能が停止

**原因:**
```javascript
// app.js:1281
$('#btn-theme').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
```
変数名の誤り。`savedTheme` は存在せず、正しくは `currentTheme`

**修正:**
```javascript
$('#btn-theme').textContent = currentTheme === 'dark' ? '🌙' : '☀️';
```

---

#### 2. btoa Encoding Error (v2.2.3で修正) ⭐ 最重要
**症状:**
```
Uncaught InvalidCharacterError: Failed to execute 'btoa' on 'Window': 
The string to be encoded contains characters outside of the Latin range.
at renderTable (app.js:476)
```
- 日本語顧客データが存在すると即座にエラー
- 新規登録ボタンが反応しない
- テーブルが表示されない
- アプリが完全に使用不可能

**原因:**
```javascript
// app.js:476-478
onclick="window.generateInvoicePDF(JSON.parse(atob('${btoa(JSON.stringify(c))}')))">
```
`btoa()` は ASCII文字（0-255）のみをサポート。日本語（UTF-16）は範囲外でエラー。

**修正:**
```javascript
// 修正後
onclick="generateInvoiceByID('${c.id}')">

// ヘルパー関数を追加
window.generateInvoiceByID = function(customerId) {
  const customer = customers.find(c => c.id === customerId);
  if (customer && window.generateInvoicePDF) {
    window.generateInvoicePDF(customer);
  }
};
```

**重要性:**
このバグは日本語を含む顧客データが1件でも存在すると、アプリ全体が使用不可能になる。
日本市場をターゲットとする本アプリにとって最も致命的なバグだった。

---

### 🟡 機能停止バグ

#### 3. openModal() - 削除した要素への参照 (v2.2.1で修正)
**症状:**
- 「最初の顧客を登録」ボタンが反応しない
- console.error が発生

**原因:**
```javascript
// v2.2.0でメッセージ解析機能を削除したが、参照が残っていた
$('#parse-input').value = '';
$('#parse-result').classList.remove('visible');
```

**修正:**
削除した要素への参照を除去

---

#### 4. 言語切り替えシステムの完全崩壊 (v2.1.0で修正)
**症状:**
- 言語セレクターが機能しない
- 翻訳キーがそのまま表示（例: "cardTotalCustomers"）
- 日本語に切り替えても英語のまま

**原因:**
1. HTMLに `data-i18n` 属性が欠如
2. `updateLanguage()` 関数のイベントリスナーが未接続
3. 初期化順序の問題

**修正:**
1. すべてのUI要素に `data-i18n` 属性を追加
2. 言語セレクターにイベントリスナーを接続
3. 初期化順序を修正（locales.js → app.js）

---

### 🟢 軽微なバグ

#### 5. テーマボタンの表示不具合
**症状:**
- テーマボタンのアイコンが正しく表示されない

**原因:**
`currentTheme` の初期化タイミング

**修正:**
`applyTheme()` を `updateLanguage()` の前に実行

---

## 未解決の課題

### 🟡 警告（機能には影響なし）

#### 翻訳キーの欠如
```
Missing translation: emptyStateDesc for ja
Missing translation: close for ja
Missing translation: edit for ja
Missing translation: delete for ja
Missing translation: taxLabelJapan for ja
Missing translation: saveSettings for ja
Missing translation: confirmDeleteMessage for ja
```

**影響:** なし（該当キーは使用されていない、または代替テキストで表示）

**優先度:** 低

**解決策:** locales.js に該当キーを追加

---

### 🔵 技術的負債

#### 1. file:// プロトコルでの動作不可
**問題:**
- ローカルファイルとして開くとCORSエラー
- Service Workerが動作しない

**現状の回避策:**
- Pythonの簡易サーバーで起動
  ```bash
  python3 -m http.server 8000
  ```

**長期的解決策:**
- 静的ホスティングサービスにデプロイ
- GitHub Pages、Netlify、Vercel など

**優先度:** 中

---

#### 2. ブラウザストレージの制限
**問題:**
- localStorage は通常 5-10MB が上限
- 大量の顧客データで制限に達する可能性

**現状:**
- 警告なし
- ストレージフル時の挙動が未定義

**長期的解決策:**
- IndexedDB への移行（容量制限がより大きい）
- ストレージ使用量のモニタリング
- 警告表示

**優先度:** 低（30顧客制限により実質問題なし）

---

#### 3. データバックアップの責任
**問題:**
- ブラウザデータ削除でデータ完全消失
- ユーザーへの注意喚起が不十分

**現状:**
- エクスポート機能は存在
- しかし定期バックアップの仕組みなし

**長期的解決策:**
- 定期的なバックアップのリマインダー
- 自動エクスポート機能
- クラウド同期（有料プラン）

**優先度:** 中

---

#### 4. デバイス間同期なし
**問題:**
- PC、スマホ、タブレット間でデータ同期不可
- 手動エクスポート/インポートのみ

**現状:**
- 意図的な設計（オフラインファースト）
- 無料プランの制限

**長期的解決策:**
- Firebase統合（有料プラン）
- リアルタイム同期

**優先度:** 低（Phase 4以降）

---

#### 5. テーブルパフォーマンス
**問題:**
- 顧客数が増えると（100+）テーブル描画が遅くなる可能性

**現状:**
- 30顧客制限により問題なし

**長期的解決策:**
- 仮想スクロール
- ページネーション
- 遅延ロード

**優先度:** 低

---

## Phase 3: 次のステップ

### 🎯 カスタムフィールド機能

**目的:**
各フォトグラファーが独自の項目を追加できるようにする

**要件:**

#### 削除する項目
- ❌ アシスタント
- ❌ 第二アシスタント

**理由:**
- すべてのフォトグラファーがアシスタントを使うわけではない
- カスタムフィールド機能で代替可能

#### 追加する機能
1. **「＋項目を追加」ボタン**
   - ヘアメイク欄の後に配置
   - クリックでプロンプト表示

2. **カスタムフィールド定義の保存**
   ```javascript
   {
     id: 'custom_ldjf93jd',
     label: '機材',
     type: 'text'
   }
   ```

3. **カスタムフィールドの表示**
   - 一度追加したフィールドはすべての顧客で表示
   - 各顧客ごとに値を入力可能

4. **カスタムフィールドの削除**
   - 🗑ボタンで削除
   - すべての顧客からフィールド定義が削除される

#### ユースケース例

**例1: 機材を管理したいフォトグラファー**
1. 「＋項目を追加」をクリック
2. 「機材」と入力
3. 顧客登録時に「機材」欄に「Canon R5」と入力
4. 以降、すべての顧客で「機材」欄が表示される

**例2: レンズ、ライティング、スタッフを管理**
1. 「機材」を追加
2. 「レンズ」を追加
3. 「ライティング」を追加
4. 「スタッフ」を追加
5. すべてのフィールドが表示される

#### 技術実装

**新しいlocalStorageキー:**
```javascript
'photocrm_custom_fields' // CustomFieldDefinition[]
```

**データ構造:**
```javascript
// CustomFieldDefinition
{
  id: 'custom_abc123',
  label: '機材',
  type: 'text'
}

// Customer.customFields
{
  'custom_abc123': 'Canon R5',
  'custom_def456': 'RF 24-70mm f/2.8'
}
```

**主要関数:**
```javascript
loadCustomFieldDefinitions()
saveCustomFieldDefinitions(fields)
addCustomFieldDefinition(label)
renderCustomFields(customerData)
removeCustomField(fieldId)
```

**実装ガイド:**
- PHASE3_GUIDE.md（詳細な手順）
- PHASE3_ANTIGRAVITY.md（Antigravity用プロンプト）

---

## 懸念事項と技術的負債

### 🔴 高優先度の懸念

#### 1. バックエンドレス設計の限界
**懸念:**
- 有料プランの実装が困難
  - 支払い処理（Stripe）にバックエンドが必要
  - ユーザー認証（Firebase Auth）
  - サブスクリプション管理
- デバイス間同期の実装不可
- 紹介キャンペーンの自動化不可

**現状の対応:**
- 無料プラン（30顧客）のみ提供
- 有料化は Phase 4 以降（Firebase + Stripe統合）

**長期的解決策:**
1. Firebase統合
   - Authentication
   - Firestore (データベース)
   - Cloud Functions (サーバーレス)
2. Stripe統合
   - 支払い処理
   - サブスクリプション管理

**推定工数:** 2-3週間

**懸念レベル:** 高（ビジネスモデルに直結）

---

#### 2. Antigravityへの過度な依存
**懸念:**
- Antigravityが生成したコードの品質が低い
  - 指示通りに実装されないことが多い
  - バグが多発
  - デバッグに多大な時間がかかる

**実例:**
- Phase 2の実装が全く反映されていなかった
- 言語切り替えが完全に壊れていた
- btoa問題が放置されていた

**現状の対応:**
- Claudeが直接実装（手動修正）
- Antigravityは補助的な役割のみ

**長期的解決策:**
1. より詳細なプロンプト作成
2. 段階的な実装（1機能ずつ）
3. 自動テストの導入

**懸念レベル:** 中

---

#### 3. テスト不足
**懸念:**
- 自動テストが存在しない
- 手動テストのみ
- リグレッションのリスク

**現状:**
- 各修正後にスクリーンショットで確認
- ブラウザコンソールでデバッグ

**長期的解決策:**
1. Jest + Testing Library の導入
2. E2Eテスト（Playwright）
3. CI/CD パイプライン

**推定工数:** 1-2週間

**懸念レベル:** 中

---

### 🟡 中優先度の懸念

#### 4. i18nの不完全性
**懸念:**
- 一部の翻訳キーが欠如
- 翻訳の品質が不明（機械翻訳？）
- 新機能追加時の翻訳漏れ

**現状:**
- 日本語と英語は高品質
- 他言語は未検証

**長期的解決策:**
1. ネイティブスピーカーによるレビュー
2. 翻訳管理ツール（i18next）
3. 翻訳の自動チェック

**懸念レベル:** 中

---

#### 5. アクセシビリティ
**懸念:**
- ARIA属性が不足
- キーボードナビゲーション未検証
- スクリーンリーダー対応不明

**現状:**
- 基本的なセマンティックHTML
- しかし本格的なa11y対応なし

**長期的解決策:**
1. WCAG 2.1 AA準拠
2. axe DevToolsでの検証
3. キーボードナビゲーションの改善

**懸念レベル:** 低（個人アプリのため）

---

### 🔵 低優先度の懸念

#### 6. コードの可読性
**懸念:**
- app.js が1376行（長すぎる）
- 関数が大きい（renderTable: 60行）
- モジュール分割なし

**現状:**
- 動作はするが、メンテナンス性が低下

**長期的解決策:**
1. app.jsを複数ファイルに分割
   - customer.js
   - calendar.js
   - modal.js
   - settings.js
2. ES Modules の使用
3. ビルドツール（Vite）の導入

**懸念レベル:** 低

---

#### 7. エラーハンドリング
**懸念:**
- try-catchが不足
- ユーザーへのエラーメッセージが不明確
- エラーログの収集なし

**現状:**
- 基本的なエラーハンドリングのみ

**長期的解決策:**
1. グローバルエラーハンドラー
2. Sentryなどのエラー追跡サービス
3. ユーザーフレンドリーなエラーメッセージ

**懸念レベル:** 低

---

## 重要な決定事項

### デザイン決定

#### 1. プランのデフォルト削除
**決定:** `DEFAULT_OPTIONS.plan = []`

**理由:**
- 「半日午前」「半日午後」「1日」は一般的ではない
- 各フォトグラファーが独自のプランを持つ
- ユーザーが自由に追加可能にする

**代替案の検討:**
- デフォルトで一般的なプランを提供
  → 却下（一般的なプランは存在しない）

**影響:**
- 初回使用時に手動で追加が必要
- しかし柔軟性が向上

---

#### 2. アシスタント欄の削除（Phase 3）
**決定:** アシスタント・第二アシスタント欄を削除

**理由:**
- すべてのフォトグラファーがアシスタントを使うわけではない
- カスタムフィールド機能で代替可能
- シンプルさを優先

**代替案の検討:**
- オプショナルフィールドとして残す
  → 却下（UIが煩雑になる）

**影響:**
- カスタムフィールド機能が必須になる

---

#### 3. メッセージ解析機能の削除
**決定:** v2.2.0 で削除

**理由:**
- 使用頻度が低いと予想
- 手動入力の方が確実
- 解析精度が100%ではない
- コード複雑性の削減（150行削減）

**代替案の検討:**
- 精度を向上させて維持
  → 却下（投資対効果が低い）

**影響:**
- コードがシンプルになった
- 読み込み速度が向上
- メンテナンス負荷が減少

---

### 技術決定

#### 4. btoa問題の解決方法
**決定:** 顧客IDのみを渡し、関数内でデータ取得

**理由:**
- シンプル
- 日本語を含むすべてのデータに対応
- パフォーマンスへの影響なし

**代替案の検討:**
1. UTF-8対応Base64エンコード
   ```javascript
   btoa(unescape(encodeURIComponent(str)))
   ```
   → 却下（複雑、非推奨API）

2. データ属性を使用
   ```javascript
   data-customer-id="${c.id}"
   ```
   → 可能だが、現在の方法の方がシンプル

**影響:**
- 新しいヘルパー関数が必要（3つ追加）
- しかし根本的に解決

---

#### 5. オフラインファースト設計
**決定:** バックエンドなし、localStorage のみ

**理由:**
- サーバーコスト: ゼロ
- 開発速度が速い
- ユーザーがデータを完全に所有

**トレードオフ:**
- デバイス間同期なし
- ストレージ制限あり
- 有料化が困難（後で解決予定）

**長期計画:**
- Phase 4でFirebase統合
- 有料プランのみクラウド同期

---

#### 6. 無料プラン制限: 30顧客
**決定:** 無料プランは30顧客まで

**理由:**
1. 「試してから買う」体験を提供
2. 10顧客では不十分（ユーザーフィードバック）
3. 30顧客で約1-2ヶ月使用可能
4. 有料化への自然な移行

**代替案の検討:**
- 10顧客: 少なすぎる
- 50顧客: 無料で十分使える（有料化しない）
- 制限なし: 収益化不可

**影響:**
- ストレージ制限の心配なし
- パフォーマンス問題なし

---

### ビジネス決定

#### 7. 価格設定
**決定:**
- 個人: $7/月
- チーム: $17/月
- スタジオ: $37/月
- エンタープライズ: カスタム

**理由:**
- 日本市場を考慮した低価格
- 競合（Studio Ninja $30/月）より安い
- 比例的な価格（$7 → $17 → $37）
- 年間17%割引で長期契約を促進

**影響:**
- 低価格で市場参入しやすい
- しかし収益率は低い
- ボリュームが必要

---

#### 8. 日本市場優先
**決定:** 日本語を第一言語として設計

**理由:**
- ユーザーの主要ターゲット
- 円（¥）がデフォルト
- 日本の商習慣に対応

**トレードオフ:**
- 他言語のサポートは二次的
- 翻訳の品質が不均一

**影響:**
- 日本語ユーザーの満足度が高い
- しかし国際展開は難しい

---

## 次の担当AIへのアドバイス

### 1. 慎重に扱うべきコード
**app.js の以下のセクションは非常に重要:**
- `renderTable()` (476-478行目): btoa問題の修正箇所
- `updateLanguage()`: 言語システムの核心
- `saveCustomer()`: データ整合性
- `openModal()`: 多くのバグが発生した箇所

**変更時の注意:**
- コンソールで徹底的にテスト
- 日本語データで必ずテスト
- ブラウザキャッシュのクリアを忘れずに

---

### 2. Antigravityの使い方
**推奨:**
- 1機能ずつ実装
- 非常に詳細なプロンプト
- 実装後は必ず手動でレビュー

**非推奨:**
- 複数機能を一度に実装
- 高レベルのプロンプト
- Antigravityの出力を盲目的に信頼

---

### 3. デバッグ方法
**必須ツール:**
- Chrome DevTools
- `console.log()` で状態確認
- ブラウザのlocalStorageビューア

**デバッグ手順:**
1. コンソールでエラーを確認
2. 該当行のコードを特定
3. `console.log()` で変数を確認
4. localStorage の状態を確認
5. Service Workerをクリア
6. ハードリロード

---

### 4. テストチェックリスト
**新機能実装後:**
- [ ] 日本語で動作確認
- [ ] 英語で動作確認
- [ ] 顧客の登録・編集・削除
- [ ] 言語切り替え
- [ ] テーマ切り替え
- [ ] PDF生成（請求書・見積書・契約書）
- [ ] エクスポート/インポート
- [ ] ブラウザキャッシュクリア後の動作
- [ ] モバイルでの動作（レスポンシブ）

---

### 5. Phase 3 実装時の注意
**カスタムフィールド機能:**
- localStorage への保存を忘れずに
- すべての顧客で表示されるようにする
- フィールド削除時の確認ダイアログ
- 翻訳を6言語すべてに追加

**テスト項目:**
- [ ] フィールド追加
- [ ] フィールドに値を入力して保存
- [ ] 顧客編集時にフィールド値が表示
- [ ] 別の顧客でもフィールドが表示
- [ ] フィールド削除
- [ ] 削除後、すべての顧客からフィールドが消える

---

### 6. よくある質問

**Q: ファイルを修正したのに変更が反映されない**
A: ブラウザキャッシュとService Workerをクリア
```javascript
// コンソールで実行
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
caches.keys().then(k => k.forEach(n => caches.delete(n)));
setTimeout(() => location.reload(true), 1000);
```

**Q: 新しい翻訳キーを追加したい**
A: locales.js のすべての言語オブジェクトに追加
```javascript
ja: { newKey: '日本語', ... },
en: { newKey: 'English', ... },
fr: { newKey: 'Français', ... },
// ...
```

**Q: 新しいフィールドを追加したい**
A: 
1. `fields` 配列に追加（app.js:170-189）
2. HTMLフォームに追加
3. 必要に応じて翻訳を追加

**Q: バージョン番号の更新方法**
A: 以下の4ファイルを更新
1. app.js: `console.log('🚀 PhotoCRM v2.X.X ...')`
2. index.html: `<!-- PhotoCRM v2.X.X ... -->`
3. sw.js: `const CACHE_NAME = 'photocrm-vX';`
4. manifest.json: `"version": "2.X.X",`

---

## 最後に

このプロジェクトは**シンプルさ**を最優先に設計されています。

新機能を追加する際は、常に以下を自問してください：
1. **本当に必要か？**（80%のユーザーが使うか？）
2. **シンプルさを損なわないか？**
3. **メンテナンス負荷は許容範囲か？**

**開発の指針:**
- ✅ シンプル > 多機能
- ✅ 動作する > 完璧
- ✅ ユーザー体験 > 技術的美しさ

**現在の状態:**
- ✅ Phase 1: バグ修正完了
- ✅ Phase 2: UI改善完了
- 🔄 Phase 3: カスタムフィールド（準備完了、実装待ち）
- ⏳ Phase 4: Firebase + Stripe統合（計画中）

**成功の鍵:**
1. 日本語ユーザーを最優先
2. シンプルさを維持
3. 段階的な実装
4. 徹底的なテスト

---

**引き継ぎドキュメント作成日:** 2026年2月22日  
**前担当AI:** Claude (Anthropic)  
**プロジェクト状態:** 健全、Phase 3実装準備完了  

**次の担当AIへ:** 頑張ってください！このドキュメントに従えば、スムーズに引き継げるはずです。何か質問があれば、このドキュメントを参照してください。🚀
