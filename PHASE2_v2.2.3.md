# PhotoCRM v2.2.3 - btoa Encoding Error Fix

## 🔴 修正された致命的バグ

### **問題:**
```
Uncaught InvalidCharacterError: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin range.
```

このエラーが原因で以下の問題が発生していました：
- 新規登録ボタンが反応しない
- テーブルが表示されない
- アプリが完全に停止

### **原因:**
app.js の476-478行目で、日本語を含む顧客データを `btoa()` でBase64エンコードしようとしていました。

**問題のコード:**
```javascript
onclick="window.generateInvoicePDF(JSON.parse(atob('${btoa(JSON.stringify(c))}')))">
```

`btoa()` は ASCII文字のみをサポートしており、日本語などのマルチバイト文字をエンコードできません。

### **修正内容:**

**修正前:**
```javascript
<button onclick="window.generateInvoicePDF(JSON.parse(atob('${btoa(JSON.stringify(c))}')))">📄</button>
<button onclick="window.generateQuotePDF(JSON.parse(atob('${btoa(JSON.stringify(c))}')))">📋</button>
<button onclick="window.openContractModal(JSON.parse(atob('${btoa(JSON.stringify(c))}')))">📜</button>
```

**修正後:**
```javascript
<button onclick="generateInvoiceByID('${c.id}')">📄</button>
<button onclick="generateQuoteByID('${c.id}')">📋</button>
<button onclick="openContractModalByID('${c.id}')">📜</button>
```

**新しいヘルパー関数を追加:**
```javascript
window.generateInvoiceByID = function(customerId) {
  const customer = customers.find(c => c.id === customerId);
  if (customer && window.generateInvoicePDF) {
    window.generateInvoicePDF(customer);
  }
};

window.generateQuoteByID = function(customerId) {
  const customer = customers.find(c => c.id === customerId);
  if (customer && window.generateQuotePDF) {
    window.generateQuotePDF(customer);
  }
};

window.openContractModalByID = function(customerId) {
  const customer = customers.find(c => c.id === customerId);
  if (customer && window.openContractModal) {
    window.openContractModal(customer);
  }
};
```

---

## 📦 修正されたファイル

1. **app.js**
   - 476-478行目: `btoa` を削除、顧客IDのみを渡す
   - 1258行目前: 新しいヘルパー関数を追加
   - バージョンを v2.2.3 に更新

2. **index.html**
   - バージョンを v2.2.3 に更新

3. **sw.js**
   - キャッシュを v7 に更新

4. **manifest.json**
   - バージョンを 2.2.3 に更新

---

## 🚀 インストール方法

### ステップ1: ファイルの置き換え

以下の4つのファイルを置き換えてください：
- `index.html`
- `app.js`
- `sw.js`
- `manifest.json`

### ステップ2: キャッシュのクリア（重要！）

**コンソール（F12）で以下を実行:**

```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});

caches.keys().then(function(names) {
  for(let name of names) {
    caches.delete(name);
  }
});

setTimeout(() => location.reload(true), 1000);
```

**または手動で:**
1. F12キーを押す
2. Application タブ → Service Workers → Unregister
3. Application タブ → Storage → Clear site data
4. ページをハードリロード（Ctrl+Shift+R）

---

## ✅ 動作確認

1. ページをリロード
2. コンソール（F12）に以下が表示されることを確認：
   ```
   📦 Loading PhotoCRM v2.2.3 (Fixed btoa encoding error)...
   🚀 PhotoCRM v2.2.3 Initializing...
   ```
3. **赤いエラーがないこと**を確認
4. 「新規登録」ボタンをクリック ✅
5. モーダルが開く ✅
6. 顧客を登録 ✅
7. テーブルに表示される ✅
8. 📄📋📜 ボタンが動作する ✅

---

## 🎯 Phase 2 の確認

v2.2.3 が動作したら、以下を確認してください：

### ✅ 新規登録モーダルで確認すべき項目：

1. **プラン選択**
   - ドロップダウンが空（「その他を入力...」のみ）
   - 手入力で追加可能

2. **アシスタント**
   - テキスト入力欄（ドロップダウンではない）
   - 自由に名前を入力可能

3. **セクションタイトル**
   - 「基本情報」「撮影情報」「支払い情報」が中央配置
   - 左寄せではなく、中央に表示

4. **チャーター事前払い**
   - チェックボックスが削除されている

---

## 📝 技術的詳細

### なぜ btoa でエラーが発生したか？

`btoa()` 関数は ASCII文字（0-255）のみをサポートしています。

```javascript
btoa('Hello');        // ✅ OK: "SGVsbG8="
btoa('こんにちは');   // ❌ エラー: InvalidCharacterError
```

日本語、中国語、韓国語などのマルチバイト文字は UTF-16 でエンコードされており、ASCII範囲を超えているため `btoa` では処理できません。

### 解決策の選択肢

1. **UTF-8対応Base64エンコード** (複雑)
   ```javascript
   btoa(unescape(encodeURIComponent(str)))
   ```
   → 2回のエンコードが必要で非効率

2. **顧客IDのみを渡す** (シンプル) ✅
   ```javascript
   onclick="generateInvoiceByID('${c.id}')"
   ```
   → 選択した方法。シンプルで効率的

3. **データ属性を使用** (中間)
   ```javascript
   data-customer-id="${c.id}" onclick="generateInvoice(this)"
   ```
   → 可能だが、今回の方法の方がシンプル

---

## 🐛 既知の問題（重要ではない警告）

以下の警告が表示されますが、**機能には影響しません**：

```
Missing translation: emptyStateDesc for ja
Missing translation: close for ja
Missing translation: edit for ja
```

これらは Phase 3 で修正予定です。

---

**更新日:** 2026年2月22日  
**バージョン:** 2.2.3  
**修正:** btoa encoding error  
**Phase:** 2/3 進行中
