#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestQuiz() {
  try {
    console.log('🚀 Creating test learning module with quiz blocks...\n');

    // Find an existing track (preferably L4)
    const track = await prisma.skillTrack.findFirst({
      where: { tier: 'l4' }
    });

    if (!track) {
      console.log('❌ No track found. Please create a SkillTrack first.');
      return;
    }

    console.log(`✅ Using track: ${track.name} (${track.tier})\n`);

    // Check if test node already exists
    const existing = await prisma.skillNode.findFirst({
      where: {
        title: 'Test Quiz Module — Fullscreen Anti-Cheat Demo'
      }
    });

    if (existing) {
      console.log('⚠️  Test module already exists! Updating it...\n');
      
      // Update existing node with quiz blocks
      const updated = await prisma.skillNode.update({
        where: { id: existing.id },
        data: {
          blocks: testBlocks,
          estimatedMinutes: 15,
          xpReward: 50,
        }
      });

      console.log(`✅ Updated existing test module!`);
      console.log(`   ID: ${updated.id}`);
      console.log(`   URL: http://localhost:3000/learn/${updated.id}\n`);
      return;
    }

    // Create new test node with quiz blocks
    const node = await prisma.skillNode.create({
      data: {
        trackId: track.id,
        title: 'Test Quiz Module — Fullscreen Anti-Cheat Demo',
        description: 'A test module to demonstrate secure fullscreen quiz mode with anti-cheat features. Try pressing F5, Esc, F12, or Ctrl+C during the quiz!',
        xpReward: 50,
        estimatedMinutes: 15,
        order: 9999, // Put it at the end
        blocks: testBlocks,
      }
    });

    console.log('✅ Successfully created test learning module!\n');
    console.log('=' .repeat(80));
    console.log(`\n📚 Module: ${node.title}`);
    console.log(`   ID: ${node.id}`);
    console.log(`   Track: ${track.name}`);
    console.log(`   Blocks: ${testBlocks.length}`);
    console.log(`   Quiz Blocks: ${testBlocks.filter(b => b.type === 'quiz').length}`);
    console.log(`\n🔗 Direct URL: http://localhost:3000/learn/${node.id}`);
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 To test the fullscreen anti-cheat features:');
    console.log('   1. Open the URL above in your browser');
    console.log('   2. Click "Start Secure Quiz" on any quiz block');
    console.log('   3. Try pressing: F5, Esc, F12, Print Screen, Ctrl+C');
    console.log('   4. All keys should be blocked! ✋\n');

  } catch (error) {
    console.error('❌ Error creating test module:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test learning content with quiz blocks
const testBlocks = [
  {
    id: 'test-intro-text',
    type: 'text',
    content: `## Welcome to the Fullscreen Quiz Test Module

This module demonstrates the **secure fullscreen quiz** feature with anti-cheat protection.

### Features Being Tested:
- ✅ Fullscreen lockdown
- ✅ Blocked function keys (F1-F12)
- ✅ Blocked special keys (Esc, Print Screen, Scroll Lock, Pause)
- ✅ Blocked keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+Shift+I, etc.)
- ✅ Tab switching detection
- ✅ One-attempt-only enforcement
- ✅ Strike system (3 strikes = auto-submit)

### Instructions:
1. Read through this introduction
2. When you're ready, scroll to the quiz block below
3. Click "Start Secure Quiz"
4. **Try to break out!** Press F5, Esc, F12, etc.
5. Notice that all attempts are blocked 🔒`
  },
  {
    id: 'test-quiz-1',
    type: 'quiz',
    title: 'Basic Knowledge Quiz',
    questions: [
      {
        id: 'q1',
        questionType: 'mcq',
        question: 'What is the purpose of this test module?',
        options: [
          'To learn about Node.js',
          'To test the fullscreen anti-cheat quiz system',
          'To practice SQL queries',
          'To study React components'
        ],
        correct: 1,
        points: 10,
        explanation: 'This module is specifically designed to test and demonstrate the secure fullscreen quiz features with anti-cheat protection.'
      },
      {
        id: 'q2',
        questionType: 'mcq',
        question: 'Which of these keys should be BLOCKED during a secure quiz?',
        options: [
          'Letter keys (A-Z)',
          'F12 (Developer Tools)',
          'Enter key',
          'Space bar'
        ],
        correct: 1,
        points: 10,
        explanation: 'F12 opens developer tools which could be used to cheat. Letter keys, Enter, and Space are needed for answering questions.'
      },
      {
        id: 'q3',
        questionType: 'mcq',
        question: 'How many strikes does a student get before auto-submission?',
        options: [
          '1 strike',
          '2 strikes',
          '3 strikes',
          'Unlimited strikes'
        ],
        correct: 2,
        points: 10,
        explanation: 'The system allows 3 strikes (violations). After the 3rd strike, the quiz is automatically submitted with current answers.'
      },
      {
        id: 'q4',
        questionType: 'truefalse',
        question: 'True or False: Students can retake a quiz after completing it once.',
        options: ['True', 'False'],
        correct: 1,
        points: 10,
        explanation: 'False! The one-attempt enforcement prevents students from retaking quizzes. This was recently fixed to close a loophole.'
      },
      {
        id: 'q5',
        questionType: 'multiselect',
        question: 'Which of the following are anti-cheat features? (Select all that apply)',
        options: [
          'Fullscreen lockdown',
          'Tab switching detection',
          'Clipboard access blocking',
          'Function key blocking',
          'Free navigation'
        ],
        correct: [0, 1, 2, 3],
        points: 20,
        explanation: 'All options except "Free navigation" are anti-cheat features. The system restricts navigation during quizzes.'
      }
    ]
  },
  {
    id: 'test-text-2',
    type: 'text',
    content: `## What To Test

### Try These Actions During the Quiz:

#### ❌ **Should Be BLOCKED:**
- Press **F5** → Page should NOT refresh
- Press **Esc** → Should stay in fullscreen + get a strike
- Press **F11** → Fullscreen toggle blocked + strike
- Press **F12** → DevTools blocked + strike
- Press **Print Screen** → Screenshot blocked + strike
- Press **Ctrl+C** → Copy blocked + strike
- Press **Ctrl+V** → Paste blocked + strike
- Press **Ctrl+Shift+I** → DevTools blocked + strike
- Try to switch tabs → Detected + strike

#### ✅ **Should WORK:**
- Type letters/numbers → For answering questions
- Press **Tab** → Navigate between inputs
- Press **Enter** → Submit answers
- Press **Backspace** → Delete text
- Use mouse → Click buttons and radio buttons

### Strike System:
1. **Strike 1:** Warning "1 of 2"
2. **Strike 2:** Final warning
3. **Strike 3:** Quiz auto-submitted! ⚠️

### One-Attempt Rule:
After you complete and submit this quiz, try navigating back to it. You should see:
- "Quiz Already Attempted" message
- Your score and submission date
- **NO** "Start Quiz" button

**You cannot retake the quiz!** 🔒`
  },
  {
    id: 'test-quiz-2',
    type: 'quiz',
    title: 'Advanced Scenarios Quiz',
    questions: [
      {
        id: 'q6',
        questionType: 'short',
        question: 'Describe one way a student might try to cheat during an online quiz, and how the anti-cheat system would prevent it.',
        sampleAnswer: 'A student might try to open Google in another tab to search for answers. The anti-cheat system detects tab switching, records it as a violation, and after 3 violations, auto-submits the quiz.',
        rubric: 'Award full points if the answer mentions: (1) A specific cheating method, (2) How the system detects it, (3) The consequence (strikes/auto-submit)',
        points: 15
      },
      {
        id: 'q7',
        questionType: 'essay',
        question: 'Explain why fullscreen mode and key blocking are important for maintaining quiz integrity in an online learning environment.',
        sampleAnswer: 'Fullscreen mode prevents students from accessing other applications or websites during the quiz. Key blocking prevents them from using shortcuts to open developer tools, copy answers, or take screenshots. Together, these features ensure that the quiz measures actual knowledge rather than ability to search for information or collaborate inappropriately.',
        rubric: 'Award points based on: Discussion of fullscreen benefits (5pts), explanation of key blocking (5pts), connection to academic integrity (5pts)',
        points: 15
      },
      {
        id: 'q8',
        questionType: 'fillin',
        question: 'The quiz system allows ___ strikes before auto-submitting, and uses ___ mode to prevent tab switching.',
        blanks: ['3', 'fullscreen'],
        points: 10
      }
    ]
  },
  {
    id: 'test-conclusion',
    type: 'text',
    content: `## Test Complete! 🎉

If you've reached this point, you should have experienced:

### ✅ What You Tested:
- Secure fullscreen quiz mode
- Complete keyboard blocking (F1-F12, Esc, Print Screen, etc.)
- Keyboard shortcut blocking (Ctrl+C, Ctrl+V, etc.)
- Strike system with warnings
- One-attempt enforcement

### 📊 Expected Behavior:
- All blocked keys did nothing when pressed
- Violation attempts showed warning dialogs
- After 3 violations, quiz would auto-submit
- After completion, you cannot retake the quiz

### 🔧 Technical Details:
**Files Modified:**
- \`hooks/useAntiCheat.ts\` — Main anti-cheat logic
- \`hooks/useAntiCheatEnhanced.ts\` — Enhanced version with additional features
- \`components/LearnModuleReader.tsx\` — Quiz UI and one-attempt check

**Key Features:**
- Function keys blocking: \`['F1', 'F2', ..., 'F12']\`
- Special keys blocking: \`['Escape', 'PrintScreen', 'ScrollLock', 'Pause']\`
- Keyboard shortcuts: Ctrl+C/V/X, Ctrl+Shift+I/J/C, etc.
- Fullscreen enforcement with automatic restoration
- Grace periods to prevent false positives

### 🎓 Learning Outcome:
You now understand how the secure quiz system protects academic integrity through technical controls and behavioral monitoring.

**Great job testing the system!** 🚀`
  }
];

createTestQuiz();
