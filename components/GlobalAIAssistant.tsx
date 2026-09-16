'use client';

import { usePathname } from 'next/navigation';
import AIStudyAssistant from './AIStudyAssistant';
import { useModuleReading } from '@/contexts/ModuleReadingContext';

interface GlobalAIAssistantProps {
  userRole: string;
  userName: string | null;
  userLevel: string | null;
  userCohort: string | null;
}

export default function GlobalAIAssistant({ userRole, userName, userLevel, userCohort }: GlobalAIAssistantProps) {
  const pathname = usePathname();
  const { context: moduleContext } = useModuleReading();

  // Map role to AI role type
  const aiRole: 'student' | 'teacher' | 'admin' =
    userRole === 'admin' ? 'admin' :
      userRole === 'trainer' ? 'teacher' : 'student';

  // Get page context based on current path
  const getPageContext = () => {
    if (pathname.startsWith('/dashboard')) {
      return {
        pageName: 'Dashboard',
        purpose: 'Your central hub to view learning progress, track XP, see recent activity, and access all platform features',
        contents: 'Current XP, active skills, recent lessons, upcoming quizzes, learning streak, quick access to modules',
        howToUse: 'Check your stats, click on skill cards to continue learning, view your progress rings, and explore navigation links',
        nextPage: 'Passport (to see your full learning journey) or Lessons (to start studying)',
        whatToExpect: 'On Passport: visual map of all modules and your progress. On Lessons: searchable library of study materials'
      };
    }

    if (pathname.startsWith('/lessons')) {
      return {
        pageName: 'Lessons Library',
        purpose: 'Browse and study lesson materials organized by subject, with full lesson content and learning outcomes',
        contents: 'Lessons across multiple subjects: searchable content, lesson previews, learning outcomes, and progress tracking',
        howToUse: 'Use search to find topics, click subject cards to filter, select a lesson to read the full content, scroll to track your reading progress',
        nextPage: 'Passport or specific Module to practice what you learned',
        whatToExpect: 'Interactive modules with videos, quizzes, and hands-on exercises to apply the concepts from these lessons'
      };
    }

    if (pathname.startsWith('/passport')) {
      return {
        pageName: 'Learning Passport',
        purpose: 'Visual map of your entire learning journey - see all skill tracks, modules, and your progress through the curriculum',
        contents: 'All learning tracks (Software Development, etc.), skill nodes/modules, progress status, XP earned, completion percentages',
        howToUse: 'Click on a track to expand modules, select a module to start learning, track your progress with visual indicators',
        nextPage: 'Click a module to open the interactive learning experience with lessons, videos, quizzes, and hands-on exercises',
        whatToExpect: 'Inside modules: step-by-step content, videos, code exercises, quizzes, and real-world projects to build your skills'
      };
    }

    if (pathname.startsWith('/learn/')) {
      return {
        pageName: 'Module Learning',
        purpose: 'Interactive learning experience - study content, watch videos, complete exercises, take quizzes, and earn XP',
        contents: 'Lesson text, embedded videos, code exercises, interactive quizzes, downloadable resources, progress tracking',
        howToUse: 'Read through content, watch videos, try code examples, complete quizzes to test understanding, track progress in sidebar',
        nextPage: 'Complete this module then return to Passport to unlock the next module in sequence',
        whatToExpect: 'Sequential learning: each module builds on previous ones. Complete quizzes to earn XP and unlock advanced modules'
      };
    }

    if (pathname.startsWith('/resources')) {
      return {
        pageName: 'Resources Library',
        purpose: 'Access downloadable study materials, PDFs, documents, and reference materials uploaded by your teachers',
        contents: 'PDFs, documents, videos, links organized by subject and track - searchable and filterable by tags',
        howToUse: 'Browse by subject, use search to find specific topics, filter by tags, click to view or download resources',
        nextPage: 'Back to Lessons to study theory, or Passport to practice with hands-on modules',
        whatToExpect: 'Complementary materials that support your lesson content - use these as references while working on modules'
      };
    }

    if (pathname.startsWith('/challenges')) {
      return {
        pageName: 'Challenges',
        purpose: 'Practice real-world skills by completing weekly challenges - submit your work and get scored by peers/teachers',
        contents: 'Open challenges (submit solutions), closed challenges (view scores), challenge descriptions, submission forms, peer scoring system',
        howToUse: 'Read challenge requirements, submit your solution (URL + notes), wait for scoring from teachers/advanced students',
        nextPage: 'After submission: check back to see your score. Use feedback to improve skills and try the next challenge',
        whatToExpect: 'Scores from 1-5 stars based on quality. Challenges help you apply what you learned in modules to real projects'
      };
    }

    if (pathname.startsWith('/progress')) {
      return {
        pageName: 'My Progress',
        purpose: 'Detailed view of all your learning outcomes, modules completed, and progress through the curriculum',
        contents: 'All completed outcomes, verification status, time spent, progress percentages, module completion history',
        howToUse: 'Review your achievements, see which outcomes are verified, track time spent learning, identify areas for improvement',
        nextPage: 'Return to Passport to continue with incomplete modules or Dashboard to see overall stats',
        whatToExpect: 'Use this page to reflect on your learning journey and plan what to focus on next'
      };
    }

    if (pathname.startsWith('/events')) {
      return {
        pageName: 'Events',
        purpose: 'View upcoming school events, workshops, tech talks, and important announcements',
        contents: 'Event calendar, event details, registration status, past events, reminders',
        howToUse: 'Browse upcoming events, click to see details, register for events you want to attend, set reminders',
        nextPage: 'Dashboard to continue learning, or check specific event details for more information',
        whatToExpect: 'Stay updated on school activities, networking opportunities, and special learning sessions'
      };
    }

    if (pathname.startsWith('/chat')) {
      return {
        pageName: 'Chat & Discussions',
        purpose: 'Communicate with classmates, teachers, and study groups',
        contents: 'Direct messages, group chats, study group discussions, announcements',
        howToUse: 'Select a conversation, send messages, create study groups, ask questions to teachers',
        nextPage: 'Return to learning materials to discuss with classmates what you studied',
        whatToExpect: 'Collaborate with peers, get help from teachers, organize study sessions'
      };
    }

    if (pathname.startsWith('/projects')) {
      return {
        pageName: 'Projects',
        purpose: 'Collaborate on team projects, submit individual projects, and showcase your work',
        contents: 'Active projects, team members, project submissions, feedback, project gallery',
        howToUse: 'Join project teams, contribute to team work, submit your projects, review feedback from teachers',
        nextPage: 'Work on projects then return to modules to learn more skills for your projects',
        whatToExpect: 'Apply what you learned in real projects, work with teams, build your portfolio'
      };
    }

    // Default context for other pages
    return {
      pageName: 'RUNDA TSS Platform',
      purpose: 'Learn, practice, and master technical skills through interactive modules and real-world projects',
      contents: 'Comprehensive TVET curriculum, interactive lessons, practice exercises, assessments, and collaborative tools',
      howToUse: 'Navigate through modules, complete exercises, take quizzes, collaborate with peers, track your progress',
      nextPage: 'Explore different sections: Dashboard for overview, Passport for curriculum, Lessons for study materials',
      whatToExpect: 'A complete learning platform designed for Rwanda TVET education excellence'
    };
  };

  return (
    <AIStudyAssistant
      userRole={aiRole}
      pageContext={getPageContext()}
      lessonContext={{
        title: 'RUNDA TSS Learning Platform',
        track: userCohort || 'Software Development',
      }}
      moduleContext={moduleContext || undefined}
    />
  );
}