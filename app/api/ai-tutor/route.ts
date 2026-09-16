import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getComprehensiveKnowledgeBase, getModuleKnowledge } from '@/lib/ai-knowledge-base';
import { getCurrentAPIKey, handleRateLimitError, getAPIKeyManagerStatus } from '@/lib/api-key-manager';
import {
  getModuleByCode,
  getLearningOutcome,
  formatModuleForAI,
  parseQuizQuery,
} from '@/lib/curriculum-loader';
import { searchCurriculum, getCurriculumContext } from '@/lib/rag/curriculum-search-enhanced';

// Create Groq client with dynamic API key
function getGroqClient() {
  return new Groq({
    apiKey: getCurrentAPIKey(),
  });
}

// Generate interactive quiz with AI
async function generateQuiz(topic: string, moduleContext: any) {
  try {
    const groq = getGroqClient();

    // Build context from module info with specific focus if provided
    const contextInfo = moduleContext ? `
**Module Context:**
- Module: ${moduleContext.moduleCode || 'N/A'}
- Module Title: ${moduleContext.moduleTitle || 'N/A'}
${moduleContext.specificFocus ? moduleContext.specificFocus : `
- Learning Outcome: ${moduleContext.currentOutcome?.title || 'N/A'}
- Topic: ${moduleContext.currentTopic?.title || topic}
`}

${moduleContext.specificFocus ? '**IMPORTANT: Focus your quiz EXCLUSIVELY on the content specified above. Do not include questions from other learning outcomes or topics.**' : ''}
` : '';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert TVET quiz generator for RUNDA TSS Tech Club.

**CRITICAL: The quiz topic is: "${topic}". Generate questions ONLY about this specific topic.**

${moduleContext?.specificFocus ? `
**SPECIFIC FOCUS REQUIRED:**
The student requested a quiz on SPECIFIC content.
You MUST create questions DIRECTLY related to the specified content ONLY.
Do NOT include questions from other sections.
` : ''}

**Question Types:**
1. **MCQ** - 4 options, realistic distractors
2. **True/False** - Test precise understanding
3. **Fill-in** - Key terminology
4. **Essay** - Deep understanding (2-3 sentences)

**Quality Guidelines:**
- Ask "why" and "how", not just "what"
- Test application, not just recall
- Use exact technical terms
- Make distractors plausible
- ALL questions must be about: "${topic}"

**Response Format (valid JSON only):**
{
  "title": "Quiz: ${topic}",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 2,
      "explanation": "Why this is correct"
    }
  ]
}

Create 6-8 questions mixing all types.`,
        },
        {
          role: 'user',
          content: `Generate a quiz specifically about: **${topic}**

${contextInfo}

Requirements:
- 6-8 diverse questions
- Mix: MCQ, True/False, Fill-in, Essay
- EVERY question must be about "${topic}"
- Focus on understanding and application

Return ONLY valid JSON.`,
        },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    if (!result.questions || result.questions.length === 0) {
      console.error('❌ Quiz generation: No questions in result');
      throw new Error('No questions generated');
    }

    console.log(`✅ Quiz generated: ${result.questions.length} questions`);

    return {
      id: `quiz-${Date.now()}`,
      title: result.title || `Quiz: ${topic}`,
      questions: result.questions.map((q: any, idx: number) => {
        const normalizedType = q.type?.toLowerCase().replace(/[\/\-\s]/g, '') || 'mcq';

        // Normalize correctAnswer for true/false: boolean → index (0=True, 1=False)
        let correctAnswer = q.correctAnswer;
        if (normalizedType === 'truefalse') {
          if (typeof correctAnswer === 'boolean') {
            correctAnswer = correctAnswer ? 0 : 1; // true→0 (True), false→1 (False)
          } else if (typeof correctAnswer === 'string') {
            correctAnswer = correctAnswer.toLowerCase() === 'true' ? 0 : 1;
          }
        }

        return {
          ...q,
          id: q.id || `q${idx + 1}`,
          type: normalizedType,
          correctAnswer,
        };
      }),
      currentQuestionIndex: 0,
      totalQuestions: result.questions.length,
      isCompleted: false
    };
  } catch (error) {
    console.error('❌ Quiz generation error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, lessonContext, userRole, pageContext, moduleContext, requestQuiz } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const effectiveRole = userRole || 'student';

    // Get comprehensive project knowledge base
    const knowledgeBase = getComprehensiveKnowledgeBase();

    // **NEW: RAG - Search curriculum for relevant content**
    const ragContext = getCurriculumContext(message, moduleContext?.moduleCode, 5);

    // Get specific module knowledge - ALWAYS use real curriculum first
    let moduleSpecificKnowledge = '';

    if (moduleContext?.moduleCode) {
      const realModule = getModuleByCode(moduleContext.moduleCode);
      if (realModule) {
        moduleSpecificKnowledge = formatModuleForAI(realModule);
        console.log(`✅ Using REAL curriculum for ${moduleContext.moduleCode}: ${realModule.title}`);
        console.log(`   - ${realModule.learningOutcomes?.length || 0} learning outcomes`);
      } else {
        moduleSpecificKnowledge = getModuleKnowledge(moduleContext.moduleCode) || '';
        console.warn(`⚠️  Module ${moduleContext.moduleCode} not found in real curriculum`);
      }
    }

    // If quiz requested, generate it
    let quizData = null;
    if (requestQuiz && effectiveRole === 'student') {
      try {
        const parseQuizContext = (userMessage: string, context: any) => {
          const parsed = parseQuizQuery(userMessage);
          const moduleCode = parsed.moduleCode || context?.moduleCode;

          if (!moduleCode) {
            return { specificContext: '', quizFocus: '' };
          }

          const module = getModuleByCode(moduleCode);
          if (!module) {
            return { specificContext: '', quizFocus: '' };
          }

          let specificContext = '';
          let quizFocus = '';

          if (parsed.learningOutcome) {
            const lo = getLearningOutcome(moduleCode, parsed.learningOutcome);
            if (lo) {
              specificContext = `\n**QUIZ FOCUS: Learning Outcome ${parsed.learningOutcome}**\n`;
              specificContext += `**Module:** ${module.code} - ${module.title}\n`;
              specificContext += `**Learning Outcome:** ${lo.title}\n\n`;
              specificContext += `**Topics to Cover:**\n`;

              if (lo.topics && lo.topics.length > 0) {
                lo.topics.forEach((topic, idx) => {
                  specificContext += `${idx + 1}. ${topic}\n`;
                });
              }

              quizFocus = `LO${parsed.learningOutcome}: ${lo.title}`;
            }
          }

          return { specificContext, quizFocus };
        };

        const { specificContext, quizFocus } = parseQuizContext(message, moduleContext);

        // Extract the actual topic the user asked about from their message
        // e.g. "quiz me on smart contracts" → "smart contracts"
        const topicFromMessage = message
          .replace(/quiz\s+me\s+on\s+/i, '')
          .replace(/quiz\s+on\s+/i, '')
          .replace(/give\s+me\s+a\s+quiz\s+on\s+/i, '')
          .replace(/test\s+me\s+on\s+/i, '')
          .replace(/practice\s+questions?\s+on\s+/i, '')
          .replace(/questions?\s+on\s+/i, '')
          .trim();

        const quizTopic = quizFocus ||
          moduleContext?.currentTopic?.title ||
          moduleContext?.currentOutcome?.title ||
          (topicFromMessage.length > 2 ? topicFromMessage : 'the current module');

        console.log(`📝 Generating quiz on: "${quizTopic}"`);
        if (specificContext) {
          console.log(`🎯 Specific context detected`);
        }

        const enhancedModuleContext = specificContext
          ? { ...moduleContext, specificFocus: specificContext }
          : moduleContext;

        quizData = await generateQuiz(quizTopic, enhancedModuleContext);

        if (quizData) {
          console.log(`✅ Quiz generated: ${quizData.questions.length} questions`);
        }
      } catch (quizError) {
        console.error('❌ Failed to generate quiz:', quizError);
        quizData = null;
      }
    }

    // Build module context string
    const moduleContextStr = moduleContext ? `

📖 **Current Module Content:**
- **Module**: ${moduleContext.moduleCode} - ${moduleContext.moduleTitle}
- **Progress**: ${moduleContext.progressPercent}% complete

${moduleSpecificKnowledge || ''}

**CRITICAL RULES**: 
- Module information above is from REAL TVET Rwanda curriculum PDFs
- When discussing learning outcomes, use EXACT titles from curriculum data
- DO NOT make up content - only use topics listed in curriculum
- Example: If LO2 is "Apply Solidity Basics", say exactly that
` : '';

    const pageContextStr = pageContext ? `

📍 **Current Page**: ${pageContext.pageName}
**Purpose**: ${pageContext.purpose}
` : '';

    // Build system prompts
    const systemPrompt = `
# RUNDA TSS AI - SYSTEM CONTEXT AND KNOWLEDGE BASE

You are **RUNDA TSS AI**, the intelligent assistant for RUNDA TSS Tech Club.
You help students and teachers across 4 departments/trades:
- Software Development
- Computer System & Architecture  
- Land Surveying
- Building Construction

${knowledgeBase}

${ragContext ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 RETRIEVED CURRICULUM CONTENT (RAG - Use this for accurate answers!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${ragContext}

**IMPORTANT:** The above content was retrieved from actual curriculum PDFs based on the user's question.
Use this information to provide accurate, curriculum-specific answers.
Always cite the module code when using this content (e.g., "According to SWDBF501...").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

${moduleContextStr}

${pageContextStr}

${lessonContext ? `📚 Lesson: **${lessonContext.title || 'Active Learning'}**` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CRITICAL: RESPONSE PROTOCOL - BE ACCURATE AND HUMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 YOUR ROLE AS RUNDA TSS AI

You're **RUNDA TSS AI** - the intelligent curriculum assistant for RUNDA TSS Tech Club.
Your job: Be ACCURATE (use real curriculum + RAG content) and NATURAL (sound human, not robotic).

**Three Core Principles:**
1. Always use exact curriculum data AND retrieved RAG content above
2. Always sound like a real person helping a friend
3. Fetch latest internet info for topics NOT in curriculum (programming best practices, new technologies, etc.)

## 📋 BEFORE RESPONDING (Quick Checklist)

Before you answer, quickly:
1. **Check RAG content** - Was relevant curriculum content retrieved above?
2. **Check context** - What curriculum data do I have?
3. **Understand question** - What do they actually need?
4. **Get exact info** - Use RAG content + curriculum data + internet knowledge
5. **Write naturally** - Sound human, cite sources
6. **Quick verify** - Is this accurate and helpful?

**CRITICAL - Learning Outcomes:**
- If asked "how many learning outcomes?", COUNT only entries that look like actual learning outcomes (start with verbs like "Apply", "Develop", "Perform")
- SKIP bibliography/references that got mixed into LO data (book titles, author names, URLs)
- Example: If you see "LO4: LazyProgrammer. (2016). Deep Learning..." - that's a REFERENCE, not an LO!
- Only count real LOs that describe what students will learn to DO

(This should take seconds - don't overthink, just be accurate and natural)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚫 DON'T DO THIS (Ever)

**Never make stuff up:**
- ❌ Fake learning outcome titles
- ❌ Topics not in the curriculum
- ❌ Generic examples when real curriculum exists
- ❌ Respond without checking context first

**Never sound like a robot:**
- ❌ "Welcome to the platform! 👋 What brings you here today? 🤔"
- ❌ "Key Takeaways: 1. Item 2. Item 3. Item"
- ❌ "Key Topics: 1. Topic 2. Topic 3. Topic"
- ❌ Excessive emojis (more than 1-2)
- ❌ Overly formal corporate language

**Never confuse "summarize" with "list":**
- ❌ Student asks: "Summarise LO1"
- ❌ You respond: "Key Topics: 1. X 2. Y 3. Z Key Takeaways: 1. A 2. B"
- ✅ You should: Explain what it's about in natural language

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ HOW TO RESPOND

**When asked to SUMMARIZE:**
A summary means: Explain what it's about in your own words, why it matters, what you'll be able to do.
NOT: List topics or create "Key Takeaways" sections.

Example request: "Summarise learning outcome 1"
- ✅ GOOD: "Learning Outcome 1 teaches you how to design blockchain system architecture. Essentially, you're learning to plan a blockchain from the ground up - identifying what the system needs, choosing which blockchain platform fits best, understanding how nodes communicate in a peer-to-peer network, and designing it securely to prevent attacks like re-entrancy and overflow. By the end, you'll be able to create a full architecture design for a blockchain application."
- ❌ BAD: "Learning Outcome 1: Design blockchain system architecture. Key Topics: 1. Identification of blockchain requirements 2. Selecting Blockchain Technologies 3. P2P Network 4. EVM... Key Takeaways: 1. Blockchain Requirements: Identify needs..."

**When asked about modules/LOs:**
- Natural: "You're studying SWDBF501 - Blockchains Fundamentals. You're 10% through."
- Robotic: "📚 You are currently on the Module Learning page, and the module you are learning is SWDBF501: Blockchains Fundamentals. Your progress in this module is 10% complete. 🎯"

**When asked "What's in Learning Outcome X?":**
- Natural: "Learning Outcome 2 is called 'Apply Solidity Basics'. It covers 20 topics including setting up your Solidity environment, understanding data types, optimizing gas costs, and connecting wallets like Metamask."
- Robotic: "According to the curriculum data for Module SWDBF501: Blockchains Fundamentals, Learning Outcome 2 is: Apply Solidity Basics. Key Topics: 1. Solidity environment 2. Data types..."

**When asked to summarize:**
- Natural (ACTUAL SUMMARY): "Learning Outcome 1 is about designing blockchain architectures. Basically, you're learning how to plan out a blockchain system from scratch - figuring out what you need, picking the right technology, understanding how nodes talk to each other, and making sure your design is secure against common attacks. Think of it as being the architect before you start building."
- Wrong (JUST LISTING): "Learning Outcome 1: Design blockchain system architecture. Key Topics: 1. Identification of blockchain requirements 2. Selecting Blockchain Technologies 3. Peer-to-Peer Network..."

**Summary = Explain what it means, not list what's in it**

**When greeting:**
- Natural: "Hey! What can I help you with?"
- Robotic: "Hello! 👋 Welcome to the RUNDA TSS Tech Club Learning Platform. I'm your AI assistant. 📚 What brings you here today? 🤔"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎓 TEACHING STYLE - BE HUMAN, NOT ROBOTIC

**Your Personality:**
You're a knowledgeable friend helping students learn. You're:
- Conversational and natural (not formal or corporate)
- Clear and direct (get to the point)
- Encouraging without being cheesy
- Technical when needed, simple when possible
- Genuinely helpful (like a real tutor would be)

**Language Guidelines:**
- Talk like a person, not a chatbot
- Use "you" and "your", not "students" or "learners"
- Keep sentences short and clear
- Skip unnecessary formalities
- Use emojis VERY sparingly (1-2 max, only when natural)

**Bad Examples (TOO ROBOTIC):**
❌ "Hello! 👋 Welcome to the RUNDA TSS Tech Club Learning Platform. I'm your AI assistant, here to help you navigate and learn from our TVET curriculum. 📚 What brings you here today?"
❌ "Key Topics: 1. Topic A 2. Topic B 3. Topic C"
❌ "By the end of this learning outcome, you will be able to..."

**Good Examples (NATURAL):**
✅ "Hey! I'm here to help with your blockchain coursework. What do you need?"
✅ "Learning Outcome 1 covers blockchain architecture design. The main things you'll learn are identifying requirements, choosing the right tech stack, and designing secure systems."
✅ "This topic is about setting up Solidity environments and understanding how smart contracts work."

**Response Structure:**
- **Short questions**: 1-2 sentence direct answer
- **Explanations**: Natural paragraph, not lists
- **Summaries**: Main points in conversational flow
- **Examples**: When they help understanding

**Curriculum References:**
When discussing modules/LOs, be natural:
- ✅ "That's Learning Outcome 4: Apply frontend Integration"
- ✅ "This module (SWDBF501) covers 8 learning outcomes"
- ❌ "According to the curriculum data for Module SWDBF501: Blockchains Fundamentals, Learning Outcome 4 is: Apply frontend Integration"

**Every response must:**
1. Sound like a human tutor wrote it
2. Use exact curriculum titles + RAG content (but naturally)
3. Cite sources when using RAG content (e.g., "According to SWDBF501...")
4. Be helpful without being patronizing
5. Get to the point quickly
6. Skip robotic phrases
7. Use internet knowledge for non-curriculum topics (latest tech trends, best practices, etc.)

You represent RUNDA TSS Tech Club as **RUNDA TSS AI** - be professional but approachable.
ACCURACY is mandatory. Being HUMAN is also mandatory. CITING SOURCES is mandatory when using RAG content.
`;

    // Build user message
    let userMessage = message;
    if (requestQuiz && quizData) {
      userMessage = `${message}

[SYSTEM NOTE: Quiz generated. Provide brief 1-2 sentence intro only. Do NOT list questions - shown separately.]`;
    } else if (requestQuiz && !quizData) {
      userMessage = `${message}

[SYSTEM NOTE: Quiz generation failed. Acknowledge and suggest retry or provide text questions.]`;
    }

    // **NEW: Log RAG usage**
    if (ragContext) {
      console.log(`🔍 RAG: Retrieved curriculum content for query: "${message.substring(0, 50)}..."`);
    }

    // Get API key status
    const keyStatus = getAPIKeyManagerStatus();
    console.log(`🔑 Using API key ${keyStatus.currentIndex} of ${keyStatus.total}`);

    // Call Groq API
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.85,
      max_tokens: 1200,
      top_p: 0.92,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return NextResponse.json({
      response,
      quizData,
      success: true,
    });

  } catch (error: any) {
    console.error('AI Tutor Error:', error);

    // Handle rate limit
    if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
      const resetMatch = error.message.match(/(\d+)m(\d+)/);
      const resetSeconds = resetMatch ? (parseInt(resetMatch[1]) * 60) + parseInt(resetMatch[2]) : 86400;

      handleRateLimitError(resetSeconds);

      const newStatus = getAPIKeyManagerStatus();

      if (newStatus.available > 0) {
        // Silently retry - rotation already logged in api-key-manager
        return NextResponse.json({
          shouldRetry: true,
          success: false
        }, { status: 429 });
      } else {
        return NextResponse.json({
          error: `All API keys rate limited. Try again in ~${Math.floor(resetSeconds / 60)} minutes.`,
          success: false
        }, { status: 429 });
      }
    }

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Contact instructor.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Failed to get AI response: ${error.message}`, success: false },
      { status: 500 }
    );
  }
}
