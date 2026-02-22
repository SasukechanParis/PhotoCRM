# PhotoCRM Phase 3 - Antigravity Prompt

## Instructions for Antigravity

You are implementing custom field functionality for PhotoCRM. Make these exact changes:

---

## Changes Required

### 1. Remove Assistant Fields

**app.js - Line 180-181:**
DELETE these two lines:
```javascript
{ key: 'assistant', label: 'アシスタント', type: 'text' },
{ key: 'secondAssistant', label: '第二アシスタント', type: 'text' },
```

**index.html:**
FIND and DELETE these sections (around line 303-310):
```html
<div class="form-group">
  <label for="form-assistant" data-i18n="labelAssistant">アシスタント</label>
  <input type="text" id="form-assistant" />
</div>

<div class="form-group">
  <label for="form-secondAssistant" data-i18n="labelSecondAssistant">第二アシスタント</label>
  <input type="text" id="form-secondAssistant" />
</div>
```

---

### 2. Add Custom Fields Storage Key

**app.js - Around line 7-13 (Storage Keys section):**
ADD this line after other STORAGE_KEY declarations:
```javascript
const CUSTOM_FIELDS_KEY = 'photocrm_custom_fields';
```

---

### 3. Add Custom Field Functions

**app.js - After loadOptions() function (around line 136):**
INSERT this code:
```javascript
// Custom Fields Management
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

function addCustomFieldDefinition(label) {
  const definitions = loadCustomFieldDefinitions();
  const id = 'custom_' + Date.now().toString(36);
  const newField = { id, label, type: 'text' };
  definitions.push(newField);
  saveCustomFieldDefinitions(definitions);
  return newField;
}

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

window.removeCustomField = function(fieldId) {
  if (!confirm(t('confirmDeleteField') || 'この項目を削除しますか？')) return;
  
  const definitions = loadCustomFieldDefinitions();
  const filtered = definitions.filter(f => f.id !== fieldId);
  saveCustomFieldDefinitions(filtered);
  renderCustomFields();
  showToast(t('customFieldRemoved') || '項目を削除しました');
};
```

---

### 4. Update index.html Modal Form

**index.html - After the hairMakeup field (around line 299):**
ADD these sections:
```html
<!-- After ヘアメイク field -->
<div class="form-group">
  <label for="form-hairMakeup" data-i18n="labelHairMakeup">ヘアメイク</label>
  <select id="form-hairMakeup" data-i18n-placeholder="labelHairMakeup"></select>
</div>

<!-- NEW: Custom fields container -->
<div id="custom-fields-container"></div>

<!-- NEW: Add field button -->
<div class="form-group" style="grid-column: 1 / -1;">
  <button type="button" class="btn btn-secondary" id="btn-add-custom-field" style="width: 100%;">
    <span data-i18n="addCustomField">＋ 項目を追加</span>
  </button>
</div>
```

---

### 5. Update openModal Function

**app.js - In openModal() function (around line 615):**
FIND the code where it sets field values for editing:
```javascript
if (editingId) {
  const c = customers.find(x => x.id === editingId);
  if (!c) return;
  $('#modal-title').textContent = t('modalEditTitle');
  // ... existing code ...
} else {
  $('#modal-title').textContent = t('modalAddTitle');
}
```

ADD this AFTER the existing field-setting code, BEFORE opening the modal:
```javascript
// Render custom fields
if (editingId) {
  const c = customers.find(x => x.id === editingId);
  renderCustomFields(c);
} else {
  renderCustomFields();
}
```

---

### 6. Update saveCustomer Function

**app.js - In saveCustomer() function (around line 678):**
FIND where it creates the data object:
```javascript
const data = { customerName: name };
fields.forEach(f => {
  // ... existing code ...
});
```

ADD this AFTER the fields.forEach loop, BEFORE saving:
```javascript
// Save custom fields
const customFields = {};
const definitions = loadCustomFieldDefinitions();
definitions.forEach(field => {
  const input = $(`#custom-field-${field.id}`);
  if (input && input.value.trim()) {
    customFields[field.id] = input.value.trim();
  }
});
data.customFields = customFields;
```

---

### 7. Add Event Listener for Add Field Button

**app.js - In init() function (around line 1260):**
ADD this after other event listeners:
```javascript
// Custom field add button
const btnAddCustomField = $('#btn-add-custom-field');
if (btnAddCustomField) {
  btnAddCustomField.addEventListener('click', () => {
    const label = prompt(t('enterFieldName') || '項目名を入力してください（例：機材、レンズ、スタッフ）');
    if (!label || !label.trim()) return;
    
    addCustomFieldDefinition(label.trim());
    renderCustomFields();
    showToast(t('customFieldAdded') || `「${label}」を追加しました`);
  });
}
```

---

### 8. Add Translations

**locales.js - In each language object:**

Japanese (ja):
```javascript
addCustomField: '＋ 項目を追加',
enterFieldName: '項目名を入力してください（例：機材、レンズ、スタッフ）',
customFieldAdded: '項目を追加しました',
customFieldRemoved: '項目を削除しました',
confirmDeleteField: 'この項目を削除しますか？削除すると、すべての顧客からこの項目が消えます。',
```

English (en):
```javascript
addCustomField: '＋ Add Field',
enterFieldName: 'Enter field name (e.g., Equipment, Lens, Staff)',
customFieldAdded: 'Field added',
customFieldRemoved: 'Field removed',
confirmDeleteField: 'Delete this field? This will remove it from all customers.',
```

French (fr):
```javascript
addCustomField: '＋ Ajouter un champ',
enterFieldName: 'Nom du champ (ex: Équipement, Objectif, Personnel)',
customFieldAdded: 'Champ ajouté',
customFieldRemoved: 'Champ supprimé',
confirmDeleteField: 'Supprimer ce champ ? Cela le supprimera de tous les clients.',
```

Chinese Simplified (zh-CN):
```javascript
addCustomField: '＋ 添加字段',
enterFieldName: '输入字段名称（例：设备、镜头、员工）',
customFieldAdded: '字段已添加',
customFieldRemoved: '字段已删除',
confirmDeleteField: '删除此字段？这将从所有客户中删除它。',
```

Chinese Traditional (zh-TW):
```javascript
addCustomField: '＋ 新增欄位',
enterFieldName: '輸入欄位名稱（例：設備、鏡頭、員工）',
customFieldAdded: '欄位已新增',
customFieldRemoved: '欄位已刪除',
confirmDeleteField: '刪除此欄位？這將從所有客戶中刪除它。',
```

Korean (ko):
```javascript
addCustomField: '＋ 필드 추가',
enterFieldName: '필드 이름 입력 (예: 장비, 렌즈, 스태프)',
customFieldAdded: '필드가 추가되었습니다',
customFieldRemoved: '필드가 삭제되었습니다',
confirmDeleteField: '이 필드를 삭제하시겠습니까? 모든 고객에서 제거됩니다.',
```

---

### 9. Update Version Numbers

**app.js - init() function:**
Change version to v2.3.0:
```javascript
console.log('🚀 PhotoCRM v2.3.0 Initializing...');
```

**index.html - comment:**
```html
<!-- PhotoCRM v2.3.0 - Custom Fields - 2026-02-22 -->
```

**sw.js:**
```javascript
const CACHE_NAME = 'photocrm-v8'; // v2.3.0 - Custom Fields
```

**manifest.json:**
```json
"version": "2.3.0",
```

---

## Important Notes

1. Do NOT modify any other existing functionality
2. Test the changes after implementation
3. Ensure custom fields are saved when customer is saved
4. Ensure custom fields are loaded when customer is edited
5. The 🗑 button should remove the field definition globally

---

## Expected Result

After implementation:
- No assistant fields in the form
- "＋ 項目を追加" button appears after ヘアメイク
- Clicking it prompts for field name
- Added fields appear in the form
- Fields persist across customers
- Fields can be deleted with 🗑 button

---

## Testing

1. Open modal → No assistant fields ✓
2. Click "＋ 項目を追加" → Prompt appears ✓
3. Enter "機材" → Field appears ✓
4. Enter value → Save customer ✓
5. Edit customer → Value is shown ✓
6. Create new customer → "機材" field still there ✓
7. Click 🗑 on field → Field removed ✓
