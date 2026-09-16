import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper function to extract text from text files only
async function extractText(filePath: string, mimeType: string): Promise<string> {
  console.log(`📖 Extracting text from ${mimeType}`);

  if (mimeType === 'text/plain') {
    return await readFile(filePath, 'utf-8');
  } else {
    throw new Error(`Only .txt files are supported. For PDFs/DOCX with images, please copy text to a .txt file.`);
  }
}

// AI parsing function using Groq API
async function parseQuestionsWithAI(text: string): Promise<any> {
  console.log('🤖 Initializing AI parser...');

  const { getCurrentAPIKey } = await import('@/lib/api-key-manager');

  const apiKey = getCurrentAPIKey();
  if (!apiKey) {
    throw new Error('No API key available. Please check your Groq API configuration.');
  }

  console.log('🔑 API key retrieved');

  const systemPrompt = `You are an expert educational content parser. Extract ALL questions from text documents with perfect accuracy.

⚠️ CRITICAL JSON RULES - FOLLOW EXACTLY:
1. Return ONLY valid JSON that can be parsed with JSON.parse()
2. ALL special characters MUST be escaped in strings:
   - Newlines: use \\n (not actual line breaks)
   - Tabs: use \\t
   - Quotes: use \\"
   - Backslashes: use \\\\
3. For multi-line content (code, long text), join lines with \\n:
   RIGHT: "Question text line 1\\nLine 2\\nLine 3"
4. Do NOT include actual newlines or unescaped quotes in JSON strings
5. If content is too long, summarize briefly

EXTRACTION RULES:
1. Extract EVERY question - don't skip any
2. Preserve question numbering (1, 2, 3 or Q1, Q2, Q3)
3. Detect marks/points from patterns like "5pts", "10 marks", "[3]"
4. Preserve all options (A, B, C, D)
5. Identify correct answers if marked
6. Keep questions in original order

QUESTION TYPES (13 total):
- multiple_choice: Has options A/B/C/D with ONE correct answer
- true_false: Binary true/false question  
- fill_blank: Contains blanks like ___, [blank], or "fill in"
- multi_select: "Select all", "Choose all", multiple correct answers
- matching: "Match the following", pairs to connect
- ordering: "Arrange in order", "Put in sequence"
- short_answer: Brief text response (1-3 sentences)
- essay: Long-form response, "Discuss", "Explain in detail"
- code: Requires writing/analyzing code
- file_upload: "Upload", "Submit file"
- drawing: "Draw", "Sketch", "Diagram"
- audio: "Record", "Speak"
- video: "Record video", "Present"

OUTPUT FORMAT - Return ONLY this valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text with escaped special chars",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "",
      "points": 5,
      "explanation": ""
    }
  ]
}

⚠️ FINAL CHECK: Verify your JSON is valid before returning!`;

  try {
    console.log('🚀 Sending request to Groq API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for large documents

    let response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract all questions from this document:\n\n${text}` }
          ],
          temperature: 0.1,
          max_tokens: 3000  // Reduced to prevent incomplete JSON
        }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', fetchError.message);

      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - document may be too large or API is slow. Please try a smaller document or try again later.');
      }

      throw new Error(`Network error: ${fetchError.message}. Please check your internet connection and try again.`);
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      console.error('❌ Groq API error:', response.status, err);

      // Handle rate limits by rotating API key
      if (response.status === 429 || response.status === 413) {
        console.log('🔄 Rate limit hit, rotating API key...');
        const { handleRateLimitError } = await import('@/lib/api-key-manager');
        handleRateLimitError();
        throw new Error(`Rate limit exceeded. Please try again. ${err}`);
      }

      throw new Error(`${response.status} ${err}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || '';
    console.log(`✅ AI response received (${responseText.length} chars)`);
    console.log('📄 Response preview:', responseText.substring(0, 300));

    if (!responseText || responseText.length < 10) {
      throw new Error('AI returned empty or very short response. The model may be overloaded. Please try again.');
    }

    // Parse JSON response with multi-stage error handling
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
      console.log('✅ Parsed JSON on first attempt');
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      console.log('🔧 Attempting to fix JSON...');

      // Stage 1: Extract JSON from markdown if present
      let jsonText = responseText;
      const markdownMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        jsonText = markdownMatch[1];
        console.log('📦 Extracted from markdown code block');
      }

      // Stage 2: Extract JSON object boundaries
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('❌ No JSON object found, trying array pattern...');
        // Try to find array pattern instead
        const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          console.log('✅ Found array pattern, wrapping in object...');
          jsonText = `{"questions": ${arrayMatch[0]}}`;
        } else {
          console.error('❌ No JSON found. Response preview:', responseText.substring(0, 500));
          throw new Error('No JSON object found in AI response. The AI may have returned an error message or the model is unavailable. Try again or check your API key.');
        }
      } else {
        jsonText = jsonMatch[0];
      }

      // Stage 3: Fix unescaped special characters within string values
      // This is the most critical fix for technical content with code
      let fixedJson = jsonText;

      // Fix unescaped newlines within quoted strings (but not between JSON properties)
      // This regex finds strings and replaces actual newlines with \n
      fixedJson = fixedJson.replace(/"([^"]*?)"/gs, (match: string, content: string) => {
        // Escape unescaped newlines, tabs, quotes
        let fixed = content
          .replace(/\\/g, '\\\\')           // Escape backslashes first
          .replace(/\n/g, '\\n')             // Escape newlines
          .replace(/\r/g, '\\r')             // Escape carriage returns
          .replace(/\t/g, '\\t')             // Escape tabs
          .replace(/\f/g, '\\f')             // Escape form feeds
          .replace(/\b/g, '\\b');            // Escape backspaces

        return `"${fixed}"`;
      });

      try {
        parsedData = JSON.parse(fixedJson);
        console.log('✅ Fixed and parsed JSON successfully (Stage 3)');
      } catch (secondError: any) {
        console.error('❌ Stage 3 fix failed:', secondError.message);

        // Stage 4: More aggressive cleaning - remove all problematic newlines
        console.log('🔧 Attempting Stage 4 fix (aggressive)...');
        let aggressiveJson = jsonText
          .replace(/\n/g, ' ')      // Remove all newlines
          .replace(/\r/g, ' ')      // Remove carriage returns  
          .replace(/\t/g, ' ')      // Remove tabs
          .replace(/  +/g, ' ');    // Collapse multiple spaces

        try {
          parsedData = JSON.parse(aggressiveJson);
          console.log('✅ Fixed and parsed JSON successfully (Stage 4 - aggressive)');
        } catch (thirdError: any) {
          console.error('❌ Stage 4 fix failed:', thirdError.message);

          // Stage 5: Try JSON5 parser as last resort (more lenient)
          console.log('🔧 Attempting Stage 5 fix (JSON5)...');
          try {
            const JSON5 = (await import('json5')).default;
            parsedData = JSON5.parse(jsonText);
            console.log('✅ Fixed and parsed with JSON5 parser');
          } catch (json5Error: any) {
            console.error('❌ All parsing attempts failed');
            console.log('📄 Response preview:', responseText.substring(0, 500));
            throw new Error(`The AI had trouble understanding your file format. This sometimes happens with very complex text. Try simplifying the file (remove special characters, use simple numbering like 1., 2., 3.) or create questions manually in the editor.`);
          }
        }
      }
    }

    // Extract questions array from response
    let questions;
    if (Array.isArray(parsedData)) {
      questions = parsedData;
    } else if (parsedData.questions && Array.isArray(parsedData.questions)) {
      questions = parsedData.questions;
    } else {
      console.error('❌ Unexpected response format:', parsedData);
      throw new Error('AI response does not contain a questions array');
    }

    console.log(`📊 Parsed ${questions.length} questions`);

    return { questions, rawResponse: responseText };

  } catch (error: any) {
    console.error('❌ AI parsing error:', error);
    throw new Error(`AI parsing failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Parse questions route called');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    console.log(`📄 File received: ${file.name} (${file.size} bytes)`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save temporarily
    const tempPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);
    console.log(`💾 Saved to: ${tempPath}`);

    // Extract text from document
    const extractedText = await extractText(tempPath, file.type);
    console.log(`📝 Extracted ${extractedText.length} characters`);

    // Parse questions using AI
    const aiResult = await parseQuestionsWithAI(extractedText);
    console.log(`✅ AI extracted ${aiResult.questions.length} questions`);

    // Cleanup temp file
    await unlink(tempPath);
    console.log('✅ Temp file cleaned up');

    const response = {
      success: true,
      message: `Successfully extracted ${aiResult.questions.length} questions`,
      questions: aiResult.questions,
      filename: file.name,
      extractedTextLength: extractedText.length
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error in parse-questions route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process file'
    }, { status: 500 });
  }
}
