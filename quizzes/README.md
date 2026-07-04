# Quizzes 資料夾

把 JSON 格式的試卷檔案放到這裡，push 到 GitHub 後會**自動匯入到 Supabase**。

## 新增試卷

1. 在 `quizzes/` 資料夾新增一個 `.json` 檔案（例如 `grade8-algebra.json`）
2. 按照下方格式填寫試卷內容
3. Commit 並 push 到 `master` branch
4. GitHub Actions 會自動執行 `scripts/import-quizzes.mjs`，將試卷匯入資料庫

## 刪除試卷

直接**刪除** `quizzes/` 裡的 JSON 檔案，然後 push。

腳本會偵測資料庫中標記為 `[github]` 的試卷，如果對應的檔案不存在了，就會自動刪除該試卷。

## 更新試卷

修改 `quizzes/` 裡的 JSON 檔案內容，然後 push。

腳本會用 `quiz_title` 比對，如果名稱相同就**覆蓋更新**（刪除舊題目 → 插入新題目）。

## JSON 格式

```json
{
  "quiz_title": "七年級數學第二次段考",
  "subject": "數學",
  "grade": "七下",
  "description": "第二次段考範圍：整數運算與分數",
  "time_limit": 40,
  "questions": [
    {
      "type": "multiple_choice",
      "question": "計算 (-5) + (-8) × 2 的結果為何？",
      "latex": "(-5) + (-8) \\times 2",
      "spoken": "前小括號 負 5 後小括號 加 前小括號 負 8 後小括號 乘以 2",
      "options": [
        { "id": "A", "text": "-26", "latex": "-26", "spoken": "負 26" },
        { "id": "B", "text": "-21", "latex": "-21", "spoken": "負 21" },
        { "id": "C", "text": "-11", "latex": "-11", "spoken": "負 11" },
        { "id": "D", "text": "11", "latex": "11", "spoken": "11" }
      ],
      "correct_answer": "B",
      "difficulty": "medium"
    },
    {
      "type": "fill_in_blank",
      "question": "計算 12 - (-5) + (-3) 的結果是多少？",
      "latex": "12 - (-5) + (-3)",
      "spoken": "12 減 前小括號 負 5 後小括號 加 前小括號 負 3 後小括號",
      "correct_answer": "14",
      "difficulty": "easy"
    },
    {
      "type": "math_expression",
      "question": "請寫出 1/2 + 1/3 的簡化分數結果。",
      "latex": "\\frac{1}{2} + \\frac{1}{3}",
      "spoken": "2 分之 1 加 3 分之 1",
      "correct_answer": "5/6",
      "difficulty": "medium"
    },
    {
      "type": "true_false",
      "question": "對於任何整數 a，a × 0 = 0 永遠成立。",
      "latex": "a \\times 0 = 0",
      "spoken": "a 乘以 0 等於 0",
      "correct_answer": "true",
      "difficulty": "easy"
    }
  ]
}
```

## 欄位說明

| 欄位 | 必填 | 說明 |
|------|------|------|
| `quiz_title` | ✅ | 試卷標題（用於比對，同名會覆蓋更新） |
| `subject` | ❌ | 科目（預設：數學） |
| `grade` | ❌ | 年級（預設：null） |
| `description` | ❌ | 試卷說明 |
| `time_limit` | ❌ | 限時分鐘數（null = 不限時） |
| `questions` | ✅ | 題目陣列（至少 1 題） |

### 題目欄位

| 欄位 | 必填 | 說明 |
|------|------|------|
| `type` | ✅ | 題型：`multiple_choice`、`fill_in_blank`、`math_expression`、`true_false` |
| `question` | ✅ | 題目文字（也可用 `question_text`） |
| `spoken` | ✅ | NVDA 朗讀文字（**盲生必須**） |
| `latex` | ❌ | LaTeX 數學式（有數學式時建議填） |
| `options` | ❌ | 選擇題選項（`multiple_choice` 必填） |
| `correct_answer` | ✅ | 正確答案 |
| `difficulty` | ❌ | 難度：`easy`、`medium`、`hard` |
| `hint` | ❌ | 提示 |

### NVDA 朗讀規則

- 分數 a/b → **「b 分之 a」**
- x² → **「x 的 2 次方」**
- + → **「加」**，- → **「減」**，× → **「乘以」**，÷ → **「除以」**
- = → **「等於」**
- √ → **「根號」**
- () → **「前小括號」「後小括號」**
- π → **「拍」**
