// Gemini API configuration
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Prompt for generating quiz questions from PDF
const QUIZ_GENERATION_PROMPT = `
你是一位專業的數學試卷轉換師。請根據上傳的考卷 PDF 內容，生成結構化的題目資料。

【重要規則】
1. 題目必須與原 PDF 內容一致，不能自行編造
2. 所有數學式要提供兩種版本：
   - latex: LaTeX 格式（用於視覺渲染）
   - spoken: 中文朗讀版本（用於 NVDA 螢幕閱讀器）

【NVDA 朗讀規則】（必須嚴格遵守）
- ( 轉為「前括號」，) 轉為「後括號」
- 只有大小括號時：() → 前小括號、後小括號
- 同時有大中小括號時：(→前小括號, )→後小括號, [→前中括號, ]→後中括號
- + 轉為「加」，- 轉為「減」（負數）或「減」（減法）
- ×、* 轉為「乘以」，÷ 轉為「除以」
- = 轉為「等於」
- <、>、≤、≥ 維持原樣
- √ 轉為「根號」，複雜時用「根號開始 [內容] 根號結束」
- 分數 a/b 轉為「b 分之 a」
- x² 轉為「x 的 2 次方」，(-1)ⁿ 轉為「左括號負1右括號的 n 次方」
- π 轉為「拍」
- ° 轉為「度」
- |x| 轉為「x 的絕對值」

【輸出格式】
請輸出 JSON 格式的題目陣列，格式如下：
{
  "quiz_title": "試卷標題",
  "questions": [
    {
      "type": "multiple_choice" | "fill_in_blank" | "math_expression" | "true_false",
      "question": "題目文字描述",
      "latex": "LaTeX數學式（如有）",
      "spoken": "NVDA朗讀文字",
      "options": [
        { "id": "A", "text": "選項文字", "latex": "選項數學式（如有）", "spoken": "朗讀文字" }
      ],
      "correct_answer": "正確答案",
      "difficulty": "easy" | "medium" | "hard",
      "hint": "提示（可選）"
    }
  ]
}

【題型判斷】
- 有 A、B、C、D 選項 → multiple_choice
- 需要計算數值答案 → math_expression
- 需要填空 → fill_in_blank
- 判斷對錯 → true_false
`;

export interface GeneratedQuestion {
  type: 'multiple_choice' | 'fill_in_blank' | 'math_expression' | 'true_false';
  question: string;
  latex?: string;
  spoken: string;
  options?: { id: string; text: string; latex?: string; spoken?: string }[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

export interface GeneratedQuiz {
  quiz_title: string;
  questions: GeneratedQuestion[];
}

export async function generateQuizFromPdf(
  pdfFile: File,
  onProgress?: (status: string) => void
): Promise<GeneratedQuiz> {
  if (!API_KEY) {
    throw new Error('請設定 VITE_GEMINI_API_KEY 環境變數');
  }

  onProgress?.('正在讀取 PDF 檔案...');

  // Read PDF as base64
  const arrayBuffer = await pdfFile.arrayBuffer();
  const base64Data = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  onProgress?.('正在上傳 PDF 到 Gemini...');

  // Call Gemini API with PDF
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Data,
                },
              },
              {
                text: QUIZ_GENERATION_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API 錯誤: ${error}`);
  }

  onProgress?.('正在處理 AI 回應...');

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('無法從 Gemini 取得回應');
  }

  // Parse JSON response
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('無法解析 AI 回應格式');
    }
    const quizData = JSON.parse(jsonMatch[0]);
    return quizData as GeneratedQuiz;
  } catch (e) {
    console.error('JSON parse error:', e);
    console.error('Raw response:', text);
    throw new Error('AI 回應格式不正確');
  }
}

export async function generateQuizFromText(
  text: string,
  onProgress?: (status: string) => void
): Promise<GeneratedQuiz> {
  if (!API_KEY) {
    throw new Error('請設定 VITE_GEMINI_API_KEY 環境變數');
  }

  onProgress?.('正在生成試卷...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `請將以下考卷內容轉換為題目：\n\n${text}\n\n${QUIZ_GENERATION_PROMPT}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API 錯誤: ${error}`);
  }

  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('無法從 Gemini 取得回應');
  }

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('無法解析 AI 回應格式');
    }
    return JSON.parse(jsonMatch[0]) as GeneratedQuiz;
  } catch (e) {
    throw new Error('AI 回應格式不正確');
  }
}
