# PhotoCRM Phase 3 - カスタムフィールド機能

## 📋 要件

### 削除する項目
- ❌ アシスタント
- ❌ 第二アシスタント

### 追加する機能
- ✅ ヘアメイクの後に「＋項目を追加」ボタン
- ✅ クリックでカスタムフィールドを追加
- ✅ フィールド名を自由に入力（例：機材、レンズ、スタッフ、備品）
- ✅ 一度追加したフィールドは次回から選択可能
- ✅ 無制限に追加可能

---

## 🔧 実装手順

### Step 1: assistantフィールドを削除

**app.js の180-181行目を削除:**

```javascript
// 削除する行
{ key: 'assistant', label: 'アシスタント', type: 'text' },
{ key: 'secondAssistant', label: '第二アシスタント', type: 'text' },
```

**index.html から削除:**

```html
<!-- これらのセクションを削除 -->
<div class="form-group">
  <label for="form-assistant">アシスタント</label>
  <input type="text" id="form-assistant" />
</div>

<div class="form-group">
  <label for="form-secondAssistant">第二アシスタント</label>
  <input type="text" id="form-secondAssistant" />
</div>
```

---

### Step 2: カスタムフィールド定義を保存

**app.js に追加:**

```javascript
// Storage Keysセクションに追加
const CUSTOM_FIELDS_KEY = 'photocrm_custom_fields';

// カスタムフィールド定義の読み込み/保存
function loadCustomFieldDefinitions() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_FIELDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCustomFieldDefinitions(fields) {
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields));
}

// 新しいカスタムフィールド定義を追加
function addCustomFieldDefinition(label) {
  const definitions = loadCustomFieldDefinitions();
  const id = 'custom_' + Date.now().toString(36);
  const newField = { id, label, type: 'text' };
  definitions.push(newField);
  saveCustomFieldDefinitions(definitions);
  return newField;
}
```

---

### Step 3: モーダルにカスタムフィールドを表示

**index.html の撮影情報セクションに追加:**

```html
<!-- ヘアメイクの後に追加 -->
<div class="form-group">
  <label for="form-hairMakeup" data-i18n="labelHairMakeup">ヘアメイク</label>
  <select id="form-hairMakeup" data-i18n-placeholder="labelHairMakeup"></select>
</div>

<!-- カスタムフィールドコンテナ -->
<div id="custom-fields-container"></div>

<!-- 項目を追加ボタン -->
<div class="form-group" style="grid-column: 1 / -1;">
  <button type="button" class="btn btn-secondary" id="btn-add-custom-field" style="width: 100%;">
    <span data-i18n="addCustomField">＋ 項目を追加</span>
  </button>
</div>
```

---

### Step 4: カスタムフィールドの表示ロジック

**app.js に追加:**

```javascript
// カスタムフィールドを動的に表示
function renderCustomFields(customerData = {}) {
  const container = $('#custom-fields-container');
  if (!container) return;
  
  container.innerHTML = '';
  const definitions = loadCustomFieldDefinitions();
  const customFieldsData = customerData.customFields || {};
  
  definitions.forEach(field => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label>${escapeHtml(field.label)}</label>
      <div style="display: flex; gap: 4px;">
        <input type="text" id="custom-field-${field.id}" 
               value="${escapeHtml(customFieldsData[field.id] || '')}" 
               placeholder="${escapeHtml(field.label)}を入力..." 
               style="flex: 1;" />
        <button type="button" class="btn-icon" 
                onclick="removeCustomField('${field.id}')" 
                title="削除">🗑</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// 項目を追加ボタンのイベント
$('#btn-add-custom-field').addEventListener('click', () => {
  const label = prompt(t('enterFieldName') || '項目名を入力してください（例：機材、レンズ、スタッフ）');
  if (!label || !label.trim()) return;
  
  addCustomFieldDefinition(label.trim());
  renderCustomFields();
  showToast(t('customFieldAdded') || `「${label}」を追加しました`);
});

// カスタムフィールドを削除
function removeCustomField(fieldId) {
  if (!confirm(t('confirmDeleteField') || 'この項目を削除しますか？')) return;
  
  const definitions = loadCustomFieldDefinitions();
  const filtered = definitions.filter(f => f.id !== fieldId);
  saveCustomFieldDefinitions(filtered);
  renderCustomFields();
  showToast(t('customFieldRemoved') || '項目を削除しました');
}
window.removeCustomField = removeCustomField;
```

---

### Step 5: openModal関数でカスタムフィールドを表示

**openModal関数内に追加:**

```javascript
window.openModal = function (id) {
  // ... 既存のコード ...
  
  if (editingId) {
    const c = customers.find(x => x.id === editingId);
    if (!c) return;
    $('#modal-title').textContent = t('modalEditTitle');
    
    // ... 既存のフィールドの設定 ...
    
    // カスタムフィールドを表示
    renderCustomFields(c);
  } else {
    $('#modal-title').textContent = t('modalAddTitle');
    
    // カスタムフィールドを空で表示
    renderCustomFields();
  }
  
  // ... モーダルを開く ...
};
```

---

### Step 6: saveCustomer関数でカスタムフィールドを保存

**saveCustomer関数内に追加:**

```javascript
window.saveCustomer = function () {
  const name = $('#form-customerName').value.trim();
  if (!name) { showToast(t('msgEnterName'), 'error'); return; }
  
  const data = { customerName: name };
  
  // 通常のフィールドを保存
  fields.forEach(f => {
    // ... 既存のコード ...
  });
  
  // カスタムフィールドを保存
  const customFields = {};
  const definitions = loadCustomFieldDefinitions();
  definitions.forEach(field => {
    const input = $(`#custom-field-${field.id}`);
    if (input && input.value.trim()) {
      customFields[field.id] = input.value.trim();
    }
  });
  data.customFields = customFields;
  
  // ... 既存の保存ロジック ...
};
```

---

### Step 7: テーブル表示でカスタムフィールドを表示

カスタムフィールドはテーブルに表示しなくてOK。
詳細モーダルでのみ表示します。

---

## 📝 翻訳を追加

**locales.js に追加:**

```javascript
ja: {
  // ... 既存の翻訳 ...
  addCustomField: '＋ 項目を追加',
  enterFieldName: '項目名を入力してください（例：機材、レンズ、スタッフ）',
  customFieldAdded: '項目を追加しました',
  customFieldRemoved: '項目を削除しました',
  confirmDeleteField: 'この項目を削除しますか？削除すると、すべての顧客からこの項目が消えます。',
},

en: {
  // ... 既存の翻訳 ...
  addCustomField: '＋ Add Field',
  enterFieldName: 'Enter field name (e.g., Equipment, Lens, Staff)',
  customFieldAdded: 'Field added',
  customFieldRemoved: 'Field removed',
  confirmDeleteField: 'Delete this field? This will remove it from all customers.',
},

// 他の言語も同様に追加
```

---

## ✅ テストチェックリスト

- [ ] アシスタント欄が削除されている
- [ ] ヘアメイクの後に「＋項目を追加」ボタンがある
- [ ] ボタンをクリックすると項目名を入力できる
- [ ] 「機材」を追加すると、フォームに「機材」入力欄が表示される
- [ ] 顧客を保存すると、カスタムフィールドの値も保存される
- [ ] 顧客を編集すると、カスタムフィールドの値が表示される
- [ ] 別の顧客を登録する時も、「機材」フィールドが表示される
- [ ] カスタムフィールドの🗑ボタンで削除できる
- [ ] 複数のカスタムフィールドを追加できる

---

## 🎯 期待される動作

### シナリオ1: 初回使用
1. 新規登録ボタンをクリック
2. ヘアメイク欄の下に「＋項目を追加」ボタンがある
3. クリックすると「項目名を入力してください」
4. 「機材」と入力
5. フォームに「機材」入力欄が追加される
6. 「Canon R5」と入力して顧客を保存

### シナリオ2: 2回目の使用
1. 新規登録ボタンをクリック
2. 「機材」フィールドが既に表示されている
3. 「＋項目を追加」をクリック
4. 「レンズ」と入力
5. 「機材」と「レンズ」の両方が表示される
6. 入力して保存

### シナリオ3: 編集
1. 既存顧客を編集
2. カスタムフィールドの値が表示される
3. 値を変更して保存

---

## 🚀 実装完了後

バージョンを **v2.3.0** に更新してください。

**ファイル更新:**
- app.js → v2.3.0
- index.html → v2.3.0
- locales.js → 翻訳追加
- sw.js → photocrm-v8
- manifest.json → 2.3.0

---

**この実装ガイドに沿って修正してください！** 🚀

完成したら、新しい会話でスクリーンショットを共有してください。
