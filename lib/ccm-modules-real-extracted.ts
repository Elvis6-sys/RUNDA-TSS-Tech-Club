// ============================================================================
// CCM MODULES - EXTRACTED FROM REAL CURRICULUM PDFs
// Total: 24 modules across Level 3, 4, and 5
// Extraction date: 2026-08-07
// ============================================================================

import type { ModuleCurriculum } from './curriculumContent';

// Import the quick helper from curriculumContent
import { getCurriculumContent } from './curriculumContent';

// Helper function for quick module creation (matching the one in curriculumContent.ts)
function quick(code: string, title: string, level: string, credits: number, totalHours: number, purpose: string, los: Array<{
  id: string; title: string; hours: number; criteria: string[]; topics: Array<{ title: string; subs: Array<{ title: string; items: string[] }> }>;
}>): ModuleCurriculum {
  return {
    code,
    title,
    level,
    credits,
    totalHours,
    purpose,
    assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
    resources: ["Computer", "Projector", "Internet", "Relevant materials"],
    learningOutcomes: los.map(lo => ({
      ...lo,
      performanceCriteria: lo.criteria,
      topics: lo.topics.map(t => ({ title: t.title, subtopics: t.subs })),
    })),
  };
}

// LEVEL 3 CCM MODULES (9 modules)
export const CCMBC302 = quick(
  "CCMBC302",
  "-        Create a Business",
  "3",
  5,
  30,
  "Describe basic aspects of Entrepreneurship               Learning hours: 10 hours",
  [
    {
      id: "lo1",
      title: "Describe basic aspects of Entrepreneurship               Learning hours: 10 hours",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "     Analysis of business environment",
          subs: [
            {
              title: "     Analysis of business environment",
              items: [
                " Meaning of business environment",
                " Categories of business environment",
                "Internal business environment",
                "(Value system, mission and objectives, corporate culture and style of functioning of top",
                "management, quality of human",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Generate         Business Idea",
      hours: 15,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Describing Sources of Business idea",
          subs: [
            {
              title: " Describing Sources of Business idea",
              items: [
                "Talents",
                "Attending events",
                "Other Countries",
                "Scientific Discovery",
                "Exhibitions",
                "customer needs, complaints, preferences, wishes",
                "Personal interest /hobbies",
                "changes in society",
                "prior jobs",
                "gap in market place",
                "surveys",
              ],
            },
          ],
        },
        {
          title: " Characteristics/qualities of business ideas",
          subs: [
            {
              title: " Characteristics/qualities of business ideas",
              items: [
                "Market driven",
                "Feasible",
                "Unique",
                "Fundable",
              ],
            },
          ],
        },
        {
          title: " Techniques of discovering new business idea",
          subs: [
            {
              title: " Techniques of discovering new business idea",
              items: [
                "Observation",
                "Story telling",
                "Interview",
                "Survey",
                "Brainstorming",
              ],
            },
          ],
        },
        {
          title: " Reasons for generating business ideas",
          subs: [
            {
              title: " Reasons for generating business ideas",
              items: [
                "Respond to market needs",
                "Changing fashions and requirements",
                "To stay ahead of the competition",
                "To exploit technology",
                "Because of Product life cycle",
                "To spread risk and minimise failure",
                "5|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: " Explaining the components of business feasibility study",
          subs: [
            {
              title: " Explaining the components of business feasibility study",
              items: [
                "Product feasibility",
                "Market feasibility",
                "Organizational feasibility",
                "Financial feasibility",
                "Recommendations and conclusion",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMCL302 = quick(
  "CCMCL302",
  "-        Apply computer literacy",
  "3",
  3,
  30,
  "Apply computer basics                                        Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Apply computer basics                                        Learning hours: 10",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "     Creating and Edit a table",
          subs: [
            {
              title: "     Creating and Edit a table",
              items: [
                " Inserting a table",
              ],
            },
          ],
        },
        {
          title: " Inserting a column, Inserting a row",
          subs: [
            {
              title: " Inserting a column, Inserting a row",
              items: [
                " Merging cells",
                " Deleting table",
              ],
            },
          ],
        },
        {
          title: "     Editing document(Text)",
          subs: [
            {
              title: "     Editing document(Text)",
              items: [
                " Search/Find, replace",
              ],
            },
          ],
        },
        {
          title: " Deleting a range of text",
          subs: [
            {
              title: " Deleting a range of text",
              items: [
                " Undo & Redo command",
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "     Inserting header, Footer and Footnotes",
          subs: [
            {
              title: "     Inserting header, Footer and Footnotes",
              items: [
                " Footnotes",
                " Header and footer",
              ],
            },
          ],
        },
        {
          title: " Automatic page numbering",
          subs: [
            {
              title: " Automatic page numbering",
              items: [
                " Total number of pages",
                "     Saving a document",
                " File management",
              ],
            },
          ],
        },
        {
          title: " File naming and file formats",
          subs: [
            {
              title: " File naming and file formats",
              items: [
                "     Printing a document",
                " Page setup",
                " Printer options",
              ],
            },
          ],
        },
        {
          title: " Printing one or more copies",
          subs: [
            {
              title: " Printing one or more copies",
              items: [
                " Printing selected pages",
              ],
            },
          ],
        },
        {
          title: " Printing in black/white or color",
          subs: [
            {
              title: " Printing in black/white or color",
              items: [
                " Print page ranges",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Use current spreadsheet package                                       Learning hours: 5",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   Creation a new presentation",
          subs: [
            {
              title: "   Creation a new presentation",
              items: [
                " Creating new presentation",
                " Blank presentation and Design template",
                "   Management of a slide",
                " Creating a slide",
                " Inserting a slide",
                " Modifying a slide",
                "   Insertion of graphics",
                " Clip Art and Word Art,",
                " Library Images,",
                " Inserting image from file",
              ],
            },
          ],
        },
        {
          title: "   Conversion word documents to PowerPoint presentation",
          subs: [
            {
              title: "   Conversion word documents to PowerPoint presentation",
              items: [
                " Copy, cut, move",
                " Import file",
                " Process of conversion",
              ],
            },
          ],
        },
        {
          title: "   Animation of a presentation document",
          subs: [
            {
              title: "   Animation of a presentation document",
              items: [
                " Animation",
                " Custom animation",
                " Slide transition",
              ],
            },
          ],
        },
        {
          title: "   Use of different presentation view",
          subs: [
            {
              title: "   Use of different presentation view",
              items: [
                " Normal view",
                " Slide sorter view",
                " Slide show",
              ],
            },
          ],
        },
        {
          title: "   Printing a presentation document",
          subs: [
            {
              title: "   Printing a presentation document",
              items: [
                " Print preview",
                " Printing a copy or multiple copies",
                " Printing one slide on a page",
                " Printing more slides on a page",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Use Internet/Intranet (outlook)",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Definition of terms: internet, web browser, Website, Webpage, Search engine)",
          subs: [
            {
              title: "Definition of terms: internet, web browser, Website, Webpage, Search engine)",
              items: [
                " Types of website",
                "Dynamic",
                "Static",
              ],
            },
          ],
        },
        {
          title: " Parts of website address",
          subs: [
            {
              title: " Parts of website address",
              items: [
                "HTTP",
                "WWW",
                "Domain name of website",
                "Domain name suffix",
              ],
            },
          ],
        },
        {
          title: "   Use search engines (example Google)",
          subs: [
            {
              title: "   Use search engines (example Google)",
              items: [
                " Search engines types",
                " Role of search engines",
              ],
            },
          ],
        },
        {
          title: " Steps to create a chat account",
          subs: [
            {
              title: " Steps to create a chat account",
              items: [
                " Chatting options",
              ],
            },
          ],
        },
        {
          title: "   Management favourites using internet explorer",
          subs: [
            {
              title: "   Management favourites using internet explorer",
              items: [
                " Favourites types",
                " Creation of favourites",
              ],
            },
          ],
        },
        {
          title: "   Browsing on internet using the hyperlinks",
          subs: [
            {
              title: "   Browsing on internet using the hyperlinks",
              items: [
                " Definition of hyperlink",
              ],
            },
          ],
        },
        {
          title: "   Basic parts of web browser",
          subs: [
            {
              title: "   Basic parts of web browser",
              items: [
                " Examples of web browser",
                "Google Chrome.",
                "Mozilla Firefox.",
                "Microsoft Edge.",
                "Internet Explorer.",
                "8|Page",
                "Employable Skills for Sustainable Job Creation",
                "Safari",
              ],
            },
          ],
        },
        {
          title: " Definition of terms",
          subs: [
            {
              title: " Definition of terms",
              items: [
                "Downloading",
                "File attachment",
                "Uploading",
              ],
            },
          ],
        },
        {
          title: " Steps of downloading files",
          subs: [
            {
              title: " Steps of downloading files",
              items: [
                " Tips of uploading files",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMCZ301 = quick(
  "CCMCZ301",
  "",
  "3",
  3,
  30,
  "Describe        Learning hours:8",
  [
    {
      id: "lo1",
      title: "Describe        Learning hours:8",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "The construction of Rusumo bridge",
          subs: [
            {
              title: "The construction of Rusumo bridge",
              items: [
                "improved seeds and plants",
              ],
            },
          ],
        },
        {
          title: "Creation of political institutions",
          subs: [
            {
              title: "Creation of political institutions",
              items: [
                "Improvement in Education",
              ],
            },
          ],
        },
        {
          title: " Failures/Weaknesses of the First Republic",
          subs: [
            {
              title: " Failures/Weaknesses of the First Republic",
              items: [
                "Increased refugee problem",
                "Ethnic violence",
              ],
            },
          ],
        },
        {
          title: "Corruption and embezzlement",
          subs: [
            {
              title: "Corruption and embezzlement",
              items: [
                "Monopartism",
              ],
            },
          ],
        },
        {
          title: "Regional divisionism in PARMEHUTU",
          subs: [
            {
              title: "Regional divisionism in PARMEHUTU",
              items: [
                "Favouritism and Nepotism",
              ],
            },
          ],
        },
        {
          title: "Lack of rule of law and the culture of impunity",
          subs: [
            {
              title: "Lack of rule of law and the culture of impunity",
              items: [
                "Dictatorship",
                "Injustices",
              ],
            },
          ],
        },
        {
          title: " Failures/ weaknesses of the Second Republic",
          subs: [
            {
              title: " Failures/ weaknesses of the Second Republic",
              items: [
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "Use of violence against the opponents",
          subs: [
            {
              title: "Use of violence against the opponents",
              items: [
                "Censorship of the press",
                "Bad governance",
                "The creation of “Akazu”",
              ],
            },
          ],
        },
        {
          title: "The unsolved refugee question",
          subs: [
            {
              title: "The unsolved refugee question",
              items: [
                "Personality Cult",
                "Lack of democracy",
              ],
            },
          ],
        },
        {
          title: "The foundation of the RANU and birth of the RPF Inkotanyi",
          subs: [
            {
              title: "The foundation of the RANU and birth of the RPF Inkotanyi",
              items: [
                "The military option",
              ],
            },
          ],
        },
        {
          title: "Extension of guerrilla war (1991-1992)",
          subs: [
            {
              title: "Extension of guerrilla war (1991-1992)",
              items: [
                "Peace process (1991-1993)",
              ],
            },
          ],
        },
        {
          title: "The end of the Liberation War and the campaign to stop the Genocide",
          subs: [
            {
              title: "The end of the Liberation War and the campaign to stop the Genocide",
              items: [
                " The effects of the war",
              ],
            },
          ],
        },
        {
          title: "It revealed the weakness of the OAU",
          subs: [
            {
              title: "It revealed the weakness of the OAU",
              items: [
                "Social reconciliation",
              ],
            },
          ],
        },
        {
          title: "The loss of francophone’s influence in Rwanda",
          subs: [
            {
              title: "The loss of francophone’s influence in Rwanda",
              items: [
                "Internal displacement",
              ],
            },
          ],
        },
        {
          title: "Loss of lives and property",
          subs: [
            {
              title: "Loss of lives and property",
              items: [
                "5|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "   Explanation the Genocide against the Tutsi (April-July 1994)",
          subs: [
            {
              title: "   Explanation the Genocide against the Tutsi (April-July 1994)",
              items: [
                " The causes of genocide",
                "Colonization",
              ],
            },
          ],
        },
        {
          title: "Bad leadership/Poor governance",
          subs: [
            {
              title: "Bad leadership/Poor governance",
              items: [
                "Media of hatred",
              ],
            },
          ],
        },
        {
          title: "The loss of cultural identity",
          subs: [
            {
              title: "The loss of cultural identity",
              items: [
                "The ethnic based ideology",
                "The social inequality",
              ],
            },
          ],
        },
        {
          title: " The major steps of the Genocide",
          subs: [
            {
              title: " The major steps of the Genocide",
              items: [
                "Classification",
                "Symbolization",
                "Discrimination",
                "Dehumanization",
                "Organization",
                "Polarization",
                "Preparation",
                "Persecution",
                "Extermination",
                "Denial",
              ],
            },
          ],
        },
        {
          title: " Effects of genocide against Tutsi",
          subs: [
            {
              title: " Effects of genocide against Tutsi",
              items: [
                "Loss of lives",
                "Destruction of property",
              ],
            },
          ],
        },
        {
          title: " Problems inherited by the new government",
          subs: [
            {
              title: " Problems inherited by the new government",
              items: [
                "There was insecurity",
                "Dislocated families",
              ],
            },
          ],
        },
        {
          title: "Public utilities had broken down",
          subs: [
            {
              title: "Public utilities had broken down",
              items: [
                "Destroyed industries",
                "Lack of man power",
              ],
            },
          ],
        },
        {
          title: " Achievements of the Government of National Unity.",
          subs: [
            {
              title: " Achievements of the Government of National Unity.",
              items: [
                "Good governance",
                "Fighting corruption",
              ],
            },
          ],
        },
        {
          title: "Resettlement of the returnees",
          subs: [
            {
              title: "Resettlement of the returnees",
              items: [
                "6|Page",
                "Employable Skills for Sustainable Job Creation",
                "Unity and reconciliation",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "E Patriotism and Heroism in Rwanda Learning hours:6",
      hours: 6,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Explanation of Concept and styles of leadership",
          subs: [
            {
              title: " Explanation of Concept and styles of leadership",
              items: [
                " Concept of leadership",
                " The leadership styles",
              ],
            },
          ],
        },
        {
          title: "The authoritarian/autocratic leadership",
          subs: [
            {
              title: "The authoritarian/autocratic leadership",
              items: [
                "Paternalistic leadership",
                "Democratic leadership",
                "Laissez-faire leadership",
              ],
            },
          ],
        },
        {
          title: "Transformational Leadership",
          subs: [
            {
              title: "Transformational Leadership",
              items: [
                "Bureaucratic Leadership",
                "Charismatic Leadership",
                "Servant Leadership",
              ],
            },
          ],
        },
        {
          title: " Description of the Characteristics of a good leader",
          subs: [
            {
              title: " Description of the Characteristics of a good leader",
              items: [
                " Honest, Competent",
              ],
            },
          ],
        },
        {
          title: " Integrity, Accountability",
          subs: [
            {
              title: " Integrity, Accountability",
              items: [
                " Empathy, Humility",
                " Resilience, Vision",
              ],
            },
          ],
        },
        {
          title: " Description of challenges facing leaders",
          subs: [
            {
              title: " Description of challenges facing leaders",
              items: [
                " lack of funding",
                " lack motivating people",
                " public criticism",
              ],
            },
          ],
        },
        {
          title: " Explanation of characteristics of a good manager",
          subs: [
            {
              title: " Explanation of characteristics of a good manager",
              items: [
                " Leadership",
                " Good planners",
              ],
            },
          ],
        },
        {
          title: " Identify and solve problems",
          subs: [
            {
              title: " Identify and solve problems",
              items: [
                " Self-Motivation",
                " Integrity",
              ],
            },
          ],
        },
        {
          title: " Dependability and reliability",
          subs: [
            {
              title: " Dependability and reliability",
              items: [
                " Optimism and confidence",
                " Calmness",
              ],
            },
          ],
        },
        {
          title: " Discussion of relationship between leadership and management",
          subs: [
            {
              title: " Discussion of relationship between leadership and management",
              items: [
                "10 | P a g e",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMEN302 = quick(
  "CCMEN302",
  "",
  "3",
  3,
  30,
  "Narrate about          Learning hours: 7",
  [
    {
      id: "lo1",
      title: "Narrate about          Learning hours: 7",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Types of sentence structure",
          subs: [
            {
              title: " Types of sentence structure",
              items: [
                "simple sentence",
                "compound sentence",
                "complex sentence",
                "compound-complex sentence",
              ],
            },
          ],
        },
        {
          title: " The building blocks of a simple sentence /clause",
          subs: [
            {
              title: " The building blocks of a simple sentence /clause",
              items: [
                "Subject",
                "Predicate",
              ],
            },
          ],
        },
        {
          title: " The building blocks of paragraph (Parts)",
          subs: [
            {
              title: " The building blocks of paragraph (Parts)",
              items: [
                "Topic sentence",
                "Supporting sentences",
                "Concluding sentence",
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "   Developing paragraph",
          subs: [
            {
              title: "   Developing paragraph",
              items: [
                " Types of paragraph",
                "A descriptive paragraph",
                "A narrative paragraph",
                "An explanatory paragraph",
                "A persuassive paragraph",
                " Writing a well structured paragraph",
                "Paragraph with topic sentence,",
                "At leat 3 supporting ideas",
                "Concluding sentence",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Read and interpreting          Learning hours: 7",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "      Kinds of speech according to the purpose",
          subs: [
            {
              title: "      Kinds of speech according to the purpose",
              items: [
                "Informative Speech that",
                "Persuassive Speech",
                "Entertains Speech",
                "Entertaining speech",
                "Motivational speech",
                "Impromptu speech",
                "Oratorical speech",
              ],
            },
          ],
        },
        {
          title: "      Components of speech",
          subs: [
            {
              title: "      Components of speech",
              items: [
                "Introduction",
                "The main point or body",
                "The conclusion",
                "Transitions",
              ],
            },
          ],
        },
        {
          title: "      Use of active listening to separate components of a speech",
          subs: [
            {
              title: "      Use of active listening to separate components of a speech",
              items: [
                "Reporting of the main points of the speech/recording",
                "Keep an open mind",
              ],
            },
          ],
        },
        {
          title: " Ways of reporting a speech",
          subs: [
            {
              title: " Ways of reporting a speech",
              items: [
                "To use exact words of the speaker",
                "To paraphrase what the speaker said",
                "To summarize the speech",
              ],
            },
          ],
        },
        {
          title: " Expression to be used for one’s own views",
          subs: [
            {
              title: " Expression to be used for one’s own views",
              items: [
                "In my view…..",
                "In my opinion…..",
                "Personally….",
                "7|Page",
                "Employable Skills for Sustainable Job Creation",
                "To be host…..",
                "To tell the truth….",
                "According to….",
                "As far as I am concerned/ is concerned….",
                "From my point of view…..",
                "I agree/ disagree…",
                "I think that …..",
                "I would like to….",
              ],
            },
          ],
        },
        {
          title: " Sides/Positions of the discussions",
          subs: [
            {
              title: " Sides/Positions of the discussions",
              items: [
                "Supporting an idea",
                "Refuting/ rebutting an idea",
              ],
            },
          ],
        },
        {
          title: " Using linkers/ connectors to defend one’s side",
          subs: [
            {
              title: " Using linkers/ connectors to defend one’s side",
              items: [
                "First of all",
                "Last but not least",
                "On one hand",
                "On the other hand",
                "While, whereas",
                "For instance",
                "On the contrary",
                "As a result",
                "In addition to…",
              ],
            },
          ],
        },
        {
          title: " Use of active listening to understand an audio",
          subs: [
            {
              title: " Use of active listening to understand an audio",
              items: [
                "The main points",
                "Supporting details/ commentary",
                "Reporting the main points of the audio",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMFT302 = quick(
  "CCMFT302",
  "",
  "3",
  3,
  30,
  "Lire un texte lié à son métier",
  [
    {
      id: "lo1",
      title: "Lire un texte lié à son métier",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Eléments segmentaux",
          subs: [
            {
              title: "Eléments segmentaux",
              items: [
                " Voyelles",
                " Consonnes",
                " Syllabes",
              ],
            },
          ],
        },
        {
          title: "Signes de ponctuation :",
          subs: [
            {
              title: "Signes de ponctuation :",
              items: [
                " Point",
                " Point d'interrogation",
                " Point d'exclamation",
                " Point de suspension",
                " Virgule",
                " Point-virgule",
                " Guillemets",
                " Double point",
              ],
            },
          ],
        },
        {
          title: "Combinaison des lettres",
          subs: [
            {
              title: "Combinaison des lettres",
              items: [
                " Voyelles",
                " Voyelles et des consonnes",
              ],
            },
          ],
        },
        {
          title: "Eléments supra segmentaux",
          subs: [
            {
              title: "Eléments supra segmentaux",
              items: [
                " Accents",
                " Intonations",
                " Rythmes",
                " Liaison",
              ],
            },
          ],
        },
        {
          title: "Etapes de lecture",
          subs: [
            {
              title: "Etapes de lecture",
              items: [
                " La pré lecture",
                " L'observation du texte",
                " La lecture silencieuse",
                " Après la lecture",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "Types de lectures",
          subs: [
            {
              title: "Types de lectures",
              items: [
                " Lecture sélective",
                " Lecture en diagonal",
                " Lecture de base",
                " Lecture active",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Pratiquer l'expression orale",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Les salutations",
          subs: [
            {
              title: " Les salutations",
              items: [
                " Au début d'une conversation",
                "Pendant la journée",
                "Pendant la soirée et la nuit",
                " A la fin d'une conversation",
                "Pendant la journée",
                "Pendant la soirée et la nuit",
                "Formelle",
                "Informelle",
                " Dire son nom et son prénom",
                " Dire sa nationalité, son âge, sa profession",
                " Types d'interrogation",
                "Totale",
                "Employable Skills for Sustainable Job Creation",
                "Partielle",
                " Les adverbes interrogatifs",
                "De lieu",
                "De manière",
                "Du temps",
                "De degré",
                "De quantité",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Accorder les verbes",
      hours: 14,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "    Les classes grammaticales",
          subs: [
            {
              title: "    Les classes grammaticales",
              items: [
                " Les articles",
                "Défini",
                "Indéfini",
                "Partitif",
                " Le nom",
                "Le genre",
                "Le nombre",
                "Catégories",
                " Le pronom personnel",
                "Personnel (Sujet, Réfléchi, Tonique)",
                "Relatif « qui »",
                " Présent",
                "Employable Skills for Sustainable Job Creation",
                " Imparfait",
                " Futur simple",
                " Passe simple",
                " Les terminaisons de temps simples de l'indicatif",
                "Présent",
                "Imparfait",
                "Futur simple",
                "Passe simple",
              ],
            },
          ],
        },
        {
          title: "Sujets du verbe",
          subs: [
            {
              title: "Sujets du verbe",
              items: [
                " Seul sujet",
                " Plusieurs sujets",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMKN302 = quick(
  "CCMKN302",
  "Gukoresha Ikinyarwanda Kiboneye",
  "3",
  3,
  30,
  "Gukoresha ubuvanganzo gakondo Amasaha : 6",
  [
    {
      id: "lo1",
      title: "Gukoresha ubuvanganzo gakondo Amasaha : 6",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "       Ubuvanganzo gakondo",
                "   Umwandiko kuri imwe mu ngeri z'ubuvanganzo gakondo",
                "   Inshoza y'ubuvanganzo gakondo",
                "   Ingeri z'ubuvanganzo gakondo",
                "   Ubuvanganzo bw'abana",
                " Ubwoko bw'utwatuzo n'aho dukoreshwa",
                " Gukoresha utwatuzo n'isesekaza mu nteruro",
                " Ubwoko bw' imyandiko n'uturango twayo",
                " Amategeko y'ihinamwandiko",
                " Ibice by'umwandiko uhinnye",
                "Inshoza y'igitaramo nyarwanda",
                "Amoko y'ibitaramo nyarwanda",
                "Umuteguro w'igitaramo nyarwanda",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Gukoresha Ikinyarwanda kiboneye Amasaha ateganijwe: 6",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "   Isesenguramwandiko ku nsanganyamatsiko y'uburinganire n'ubwuzuzanye",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Amasaha ateganyijwe: 6",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "       Isesenguramwandiko ku nsanganyamatsiko y'uburenganzira bw'umwana",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Kugaragaza intêgo ya ntera n'amategeko Amasaha : 6",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "   Isesenguramwandiko ku nsanganyamatsiko yo kwirinda no kurwanya indwara zitandukanye",
                " Umwandiko ku nsanganyamatsiko yerekeye kurwanya indwara",
                " Inyunguragambo",
                " Ingingo z'ingenzi n'ingingingo z'ingereka",
                " Ingero z'indwara zandura",
                " Ingero z'indwara zitandura",
                " Ibikorwa byo gukumira no kwirinda indwara zandura n'izitandura",
                "   Ntera",
                " Inshoza ya ntera",
                " Uturango twa ntera",
                "   Intego n'amategeko y'igenemajwi muri ntera",
                " Uturemajambo twa ntera",
                " Ibicumbi bya ntera",
                " Amategeko y'igenamajwi muri ntera",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Gukoresha imyandikire ikwiye Amasaha yategenyijwe: 6",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "   Isesenguramwandiko ku nsanganyamatsiko y'ubuzima bw'imyororokere",
                " Umwandiko ku nsanganyamatsiko yerekeye ubuzima bw'imyororokerere",
                " Inshoza y'ubuzima bw'imyororokere",
                " Inyunguragambo",
                " Ingingo z'ingenzi n'ingingingo z'ingereka",
                " Ingero zifatika zigaragaza akamaro ko gusobanukirwa ubuzima bw'imyororokere",
                "   Amoko y'amagambo",
                " Amagambo ahinduka",
                " Amagambo adahindika",
                "   Amategeko y'imyandikire areba ikata n'itakara ry'inyajwi",
                " Ikata ry'inyajwi mu nteruro",
                " Itakara ry'inyajwi",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMOL302 = quick(
  "CCMOL302",
  "-        Describe the Occupation and learning process",
  "3",
  3,
  30,
  "Participate in a team and                              Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Participate in a team and                              Learning hours: 10",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   Description of the elements of occupation",
          subs: [
            {
              title: "   Description of the elements of occupation",
              items: [
                "   Definition of terms",
              ],
            },
          ],
        },
        {
          title: " Explanation of the content of the training programme (modules)",
          subs: [
            {
              title: " Explanation of the content of the training programme (modules)",
              items: [
                "Duration",
                "Flowchart",
              ],
            },
          ],
        },
        {
          title: " Qualification pathways (entry, exit level & further learning)",
          subs: [
            {
              title: " Qualification pathways (entry, exit level & further learning)",
              items: [
                " timetable",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const ICTIA302 = quick(
  "ICTIA302",
  "Competence",
  "3",
  20,
  200,
  "Apply for internship            Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Apply for internship            Learning hours: 10",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✔ Appropriate workplace behaviors and attitudes",
          subs: [
            {
              title: "✔ Appropriate workplace behaviors and attitudes",
              items: [
                "Dress code",
                "Time management",
                "Respect,",
                "Honesty",
                "Integrity",
                "Work as a team",
                "✔ Work habits",
                "Cooperation,",
                "Initiative,",
                "Courtesy,",
                "Constructive",
                "Criticism,",
                "Supervision",
                "Accuracy,",
                "Piece of work,",
                "Time usage",
                "Adaptability",
                "●      Time management.",
              ],
            },
          ],
        },
        {
          title: "✔ Strategies to better manage time",
          subs: [
            {
              title: "✔ Strategies to better manage time",
              items: [
                "Start your day with a clear focus.",
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
                "Have a dynamic task list.",
                "Focus on high-value activities.",
                "Minimize",
                "Interruptions.",
                "Limit multi-tasking.",
                "Review your day.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Analyze own professional         Learning hours: 10",
      hours: 170,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "ü Development of competencies related to one’s field",
          subs: [
            {
              title: "ü Development of competencies related to one’s field",
              items: [
                "Workplace safety and security activities",
                "6|Page",
                "Employable Skills for Sustainable Job Creation",
                "Various planned task related to one’s field",
              ],
            },
          ],
        },
        {
          title: "ü Trainer and Trainee’s documents",
          subs: [
            {
              title: "ü Trainer and Trainee’s documents",
              items: [
                "Logbooks",
                "IAP report template",
                "IAP Code of conduct",
                "ü Company’s documents",
              ],
            },
          ],
        },
        {
          title: "Company supervisor logbook",
          subs: [
            {
              title: "Company supervisor logbook",
              items: [
                "Attachment report",
              ],
            },
          ],
        },
        {
          title: "General departmental information of companies",
          subs: [
            {
              title: "General departmental information of companies",
              items: [
                "Training",
              ],
            },
          ],
        },
      ],
    },
  ]
);


// LEVEL 4 CCM MODULES (7 modules)
export const CCMBP402 = quick(
  "CCMBP402",
  "CCMBP402             Develop a business plan",
  "4",
  3,
  30,
  "Establish business contingency plan                       Learning hours: 7",
  [
    {
      id: "lo3",
      title: "Establish business contingency plan                       Learning hours: 7",
      hours: 3,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Purpose of business plan presentation",
          subs: [
            {
              title: " Purpose of business plan presentation",
              items: [
                "Financing support",
                "Strategic orientation",
                "Attracting investors",
              ],
            },
          ],
        },
        {
          title: " Types of business plan presentation preparation",
          subs: [
            {
              title: " Types of business plan presentation preparation",
              items: [
                "Content preparation",
                "Material preparation",
                "Psychological preparation",
              ],
            },
          ],
        },
        {
          title: " Steps involved in preparation of business plan presentation",
          subs: [
            {
              title: " Steps involved in preparation of business plan presentation",
              items: [
                "Analyse your audience",
                "Select topics",
              ],
            },
          ],
        },
        {
          title: "Prepare the body of the business plan to be presented and anticipate the questions from",
          subs: [
            {
              title: "Prepare the body of the business plan to be presented and anticipate the questions from",
              items: [
                "audience",
              ],
            },
          ],
        },
        {
          title: " Parties to present the business plan",
          subs: [
            {
              title: " Parties to present the business plan",
              items: [
                "Shareholders",
                "Stakeholders",
              ],
            },
          ],
        },
        {
          title: "Paint a picture in your audience’ minds",
          subs: [
            {
              title: "Paint a picture in your audience’ minds",
              items: [
                "Put credibly content",
                "Use statistics and data",
                "10 | P a g e",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: " Techniques to present your business plan",
          subs: [
            {
              title: " Techniques to present your business plan",
              items: [
                "Only write key points",
              ],
            },
          ],
        },
        {
          title: "Use body language, voice, appearance",
          subs: [
            {
              title: "Use body language, voice, appearance",
              items: [
                "Try to convince",
              ],
            },
          ],
        },
        {
          title: "Plan to maintain and enforce relationship with stakeholders (audience) for further",
          subs: [
            {
              title: "Plan to maintain and enforce relationship with stakeholders (audience) for further",
              items: [
                "collaboration",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMCS402 = quick(
  "CCMCS402",
  "CCMCS402",
  "4",
  3,
  30,
  "Describe the operating system                            Learning hours: 15",
  [
    {
      id: "lo1",
      title: "Describe the operating system                            Learning hours: 15",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Requirements to be considered",
          subs: [
            {
              title: " Requirements to be considered",
              items: [
                "Budget constraints",
              ],
            },
          ],
        },
        {
          title: "Processor: 1GHZ or faster processor or System on a Chip",
          subs: [
            {
              title: "Processor: 1GHZ or faster processor or System on a Chip",
              items: [
                "5|Page",
                "Display: 800 x 600",
              ],
            },
          ],
        },
        {
          title: "   Customization of the operating system",
          subs: [
            {
              title: "   Customization of the operating system",
              items: [
                " Windows settings",
                "Creating a user account",
                "Manage user account",
                "Window Personalization",
                " Disk management",
                "Disk partitioning",
                "Disk formatting",
                "Disk clean up",
              ],
            },
          ],
        },
        {
          title: " Windows administrative tools",
          subs: [
            {
              title: " Windows administrative tools",
              items: [
                "Task scheduler",
                "Event viewer",
                " Control panel settings",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Protect computer system",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Description of software tools \\utilities",
          subs: [
            {
              title: " Description of software tools \\utilities",
              items: [
                "Anti-virus",
                "Anti-malware",
                "Anti-spyware",
                "Backup software",
                "Backup media",
              ],
            },
          ],
        },
        {
          title: " Installation of software tools\\utilities",
          subs: [
            {
              title: " Installation of software tools\\utilities",
              items: [
                "Anti-virus",
                "Anti-malware",
                "Anti-spyware",
              ],
            },
          ],
        },
        {
          title: " Description of scan mode",
          subs: [
            {
              title: " Description of scan mode",
              items: [
                " Virus elimination",
              ],
            },
          ],
        },
        {
          title: "Elimination by neutralization",
          subs: [
            {
              title: "Elimination by neutralization",
              items: [
                "Elimination by deleting",
                "Elimination by quarantine",
                "7|Page",
              ],
            },
          ],
        },
        {
          title: " Description of backup types",
          subs: [
            {
              title: " Description of backup types",
              items: [
                "Full backup",
                "Differential backup",
                "Incremental backup",
                "Copy backup",
                "Mirror backup",
                "Daily backup",
              ],
            },
          ],
        },
        {
          title: " Selection of common backup devices",
          subs: [
            {
              title: " Selection of common backup devices",
              items: [
                "Tape drive",
                "Optical Discs",
                "USB flash drivers",
                "SD card",
                "HDD/SSD",
              ],
            },
          ],
        },
        {
          title: " Selection of common restore devices",
          subs: [
            {
              title: " Selection of common restore devices",
              items: [
                "HDD/SSD",
                "USB flash Drivers",
                "Tape drive",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMEN402 = quick(
  "CCMEN402",
  "",
  "4",
  3,
  30,
  "Write factual, descriptive, and explanatory                  Learning hours: 9",
  [
    {
      id: "lo1",
      title: "Write factual, descriptive, and explanatory                  Learning hours: 9",
      hours: 7,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "    Introduction to listening",
          subs: [
            {
              title: "    Introduction to listening",
              items: [
                " Definition of listening",
                " Listening vs hearing",
                " Types of listening",
                "Active listening",
                "Selective listening",
                "Reflective listening",
                "Comprehensive listening",
                "Biased listening",
                "Discriminative listening",
              ],
            },
          ],
        },
        {
          title: "    Effective listening skills",
          subs: [
            {
              title: "    Effective listening skills",
              items: [
                " Tips",
                " Strategies",
                " Listening activities",
                " Message detection",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Discuss, support or refute ideas on                     Learning hours: 7",
      hours: 7,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   Explanation of different reading techniques",
          subs: [
            {
              title: "   Explanation of different reading techniques",
              items: [
                " Skimming",
                " Scanning",
                " Intensive reading",
                " Extensive reading",
              ],
            },
          ],
        },
        {
          title: "   Applying reading techniques",
          subs: [
            {
              title: "   Applying reading techniques",
              items: [
                " Importance of reading",
                " Categories of reading",
                "A bottom-up",
                "A top-down",
              ],
            },
          ],
        },
        {
          title: "   Applying articulatory phonetics.",
          subs: [
            {
              title: "   Applying articulatory phonetics.",
              items: [
                " phonetics symbols",
                " consonants",
                " vowels",
                " syllables",
                "9|Page",
                "Employable Skills for Sustainable Job Creation",
                " phonemes",
                " allophones",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMFT402 = quick(
  "CCMFT402",
  "Exprimer des opinions en français élémentaire",
  "4",
  3,
  30,
  "Préciser des Les",
  [
    {
      id: "lo1",
      title: "Préciser des Les",
      hours: 11,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   La complétion d'un formulaire de réservation",
          subs: [
            {
              title: "   La complétion d'un formulaire de réservation",
              items: [
                " Les adjectifs numéraux",
                "Cardinaux (de 1 à 1000000)",
                "Ordinaux",
                " La description des temps",
                "Les heures",
                "Les dates",
                "Les jours de la semaine",
                "Les mois de l'année",
                "Les saisons de l'année",
                " Le genre des noms des pays en français",
                " Les adjectifs possessifs",
                " Les pronoms possessifs",
                " Les prépositions « de » et « à »",
                "Employable Skills for Sustainable Job Creation",
                " L'arbre généalogique",
                " Les professions",
                " L'emploi de c'est, il/elle est",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Décrire des personnes et",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   La description d'une personne",
          subs: [
            {
              title: "   La description d'une personne",
              items: [
                " Les parties du corps humain",
                " Les vêtements et les accessoires",
                " Les adjectifs qualificatifs",
                "Physique",
                "Caractères",
                "Couleur",
                " L'emploi de présentatif de « c'est » et « il y a »",
                " Les points cardinaux",
                " Les prépositions de lieu",
                "A côté de",
                "Loin de",
                "En, à, au, aux + pays",
                " Les sports et les loisirs",
                " L'interrogation est-ce que/ qu'est-ce que, l'intonation avec l'inversion",
                " Les façons d'exprimer ses goûts",
                "La négation « ne …pas »",
                "Moi aussi / moi non plus",
                "L'indicatif présent des verbes en « er » : aimer, préférer",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Indiquer l'itinéraire",
      hours: 11,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   L'impératif pour indiquer un chemin, une direction",
          subs: [
            {
              title: "   L'impératif pour indiquer un chemin, une direction",
              items: [
                " Aller",
                " Continuer",
                " Tourner",
                " Prendre",
                " Longer",
                " Passer",
                "   Les lieux de la ville",
                " L'administration",
                "La poste",
                "Employable Skills for Sustainable Job Creation",
                "La police",
                "Administration publique",
                "La crèche",
                "L'école",
                "Le collège",
                "Le lycée",
                "L'université",
                "Le boulodrome",
                "Le cinéma",
                "Les jeux pour enfants",
                "Le stade",
                "L'hôpital",
                "Pharmacie",
                "L'office de tourisme",
                "Le distributeur des billets (la banque)",
                "Les toilettes",
                "La gare routière",
                "Le chemin",
                "L'allée",
                "La rue",
                "L'avenue",
                "Le boulevard",
                "Employable Skills for Sustainable Job Creation",
                "L'église",
                "La mosquée",
                " Le commerce",
                "Le marché",
                "Le supermarché",
                " Les lieux touristiques",
                "Le musée",
                "Le parc",
                "   Demander et indiquer le chemin et la direction",
                " L'interrogation avec où pour demander un chemin/une direction",
                " Verbe aller à l'indicatif présent + au, à, à l', à la, aux",
                " Le vocabulaire de base pour indiquer l'itinéraire",
                "A droite",
                "A gauche",
                "Tout droit",
                "Au bout",
                "La première, la deuxième, …rue",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMIA402 = quick(
  "CCMIA402",
  "Integrate the Workplace",
  "4",
  30,
  230,
  "Investigate and secure industrial                      Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Investigate and secure industrial                      Learning hours: 10",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: " Types of IAP challenges (before, during and after)",
          subs: [
            {
              title: " Types of IAP challenges (before, during and after)",
              items: [
                "Budget issues",
                "Cope with a new work situation",
                "Insufficient of industrial attachment place",
                "Lack of assistance from industrial attachment in charge",
                "Industry attitude toward interns",
                "Competition from Co-Interns",
                "Not enough work",
                "Too much work",
                "Work is unnoticed, unappreciated",
                "Coping with unfamiliar office culture",
              ],
            },
          ],
        },
        {
          title: " Factors affecting industrial attachment",
          subs: [
            {
              title: " Factors affecting industrial attachment",
              items: [
                "Trainee’s factors",
                "Institution’s factors",
                "Companies’ factors",
              ],
            },
          ],
        },
        {
          title: " Responsibilities of IAP stakeholders to overcome IAP challenges",
          subs: [
            {
              title: " Responsibilities of IAP stakeholders to overcome IAP challenges",
              items: [
                "Institution",
                "Industry/company",
                "Parents",
                "Trainers",
                "Trainee",
              ],
            },
          ],
        },
        {
          title: " Tips to address IAP challenge",
          subs: [
            {
              title: " Tips to address IAP challenge",
              items: [
                "9|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: " Parties in IAP challenge solving",
          subs: [
            {
              title: " Parties in IAP challenge solving",
              items: [
                "Trainee",
                "Industry /company",
                "Institution",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Get briefed on industrial attachment                       Learning hours: 10",
      hours: 170,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "    Fill in trainee logbook",
          subs: [
            {
              title: "    Fill in trainee logbook",
              items: [
                " Daily report",
                " Weekly report",
                " IAP report",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMKN402 = quick(
  "CCMKN402",
  "-          Gukoresha Ikinyarwanda Cy'umunyamwuga",
  "4",
  3,
  30,
  "Gukoresha ubuvanganzo gakondo Amasaha : 10",
  [
    {
      id: "lo1",
      title: "Gukoresha ubuvanganzo gakondo Amasaha : 10",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "     Imikoreshereze y' ubuvanganzo gakondo bufatiye ku mwuga:",
                " Inshoza y'ubuvanganzo bufatiye ku mwuga.",
                " Ingero z'ubuvanganzo bufatiye ku mwuga",
                " Igitaramo cy'umuganura",
                "     Ikomorazina :",
                " Inshoza y'ikomorazina",
                " Ikomorazina mvazina",
                " Ikomorazina mvanshinga",
                "     Ikomoranshinga:",
                " Inshoza y'ikomoranshinga",
                " Ikomoranshinga mvazina",
                " Ikomoranshinga mvanshinga",
                "     Amoko y'inshinga:",
                " Imbundo",
                " Inshinga itondaguye",
                " Inshinga mburabuzi",
                " Ingirwanshinga",
                " Interuro ihamya",
                " Interuro ibaza",
                " Interuro itangara",
                " Interuro itegeka",
                "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Gukoresha Ikinyarwanda agaragaza Amasaha",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "   Isesenguramwandiko ku nsanganyamatsiko y'akamaro k'ikoranabuhanga mu iterambere",
                "ry'umwuga:",
                " Inyunguramagambo",
                " Ingingo z'ingenzi n'ingingo z'ingereka",
                "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
                " Insanganyamatsiko y'ingenzi iri mu mwandiko",
                " Isomo ry'ingenzi riri mu mwandiko",
                " Ingero zifatika zihamya akamaro k'ikoranabuhanga mu iterambere ry'umwuga",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Gukoresha Ikinyarwanda uwiga Amasaha",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "   Isesenguramwandiko ku nsanganyamatsiko ku bubi bw'ibiyobyabwenge mu rubyiruko:",
                " Inyunguramagambo",
                " Ingingo z'ingenzi n'ingingo z'ingereka",
                " Insanganyamatsiko y'ingenzi iri mu mwandiko",
                " Isomo ry'ingenzi mu mwandiko",
                " Ingero zifatika z'ibiyobyabwenge",
                " Ingaruka mbi zo gukoresha ibiyobyabwenge mu rubyiruko",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Gukoresha Ikinyarwanda uwiga Amasaha",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "       Isesenguramwandiko ku nsanganyamatsiko yo gufata neza ibidukikije:",
                " Inyunguramagambo",
                " Ingingo z'ingenzi n'ingingo z'ingereka",
                " Insanganyamatsiko y'ingenzi iri mu mwandiko",
                " Isomo ry'ingenzi mu mwandiko",
                " Ingero z'ibikorwa by'abanyamwuga bishobora kwangiza ibidukikije",
                " Ingero z'ibikorwa by'abanyamwuga bigamije kubungabunga ibidukikije",
                "    Imikoreshereze y'indangahantu:",
                " Inshoza y'indangahantu",
                " Amoko y'indangahantu n'imikoreshereze yazo",
                "    Imikoreshereze y'ibyungo:",
                " Inshoza y'ibyungo",
                " Amoko y'ibyungo n'imikoreshereze yabyo",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Gukoresha Ikinyarwanda Amasaha yategenyijwe:",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ibiyigwa",
          subs: [
            {
              title: "Ibiyigwa",
              items: [
                "   Isesenguramwandiko ku nsanganyamatsiko y'ubutabazi bw'ibanze:",
                " Inyunguramagambo",
                " Ingingo z'ingenzi n'ingingo z'ingereka",
                " Insanganyamatsiko y'ingenzi iri mu mwandiko",
                " Isomo ry'ingenzi mu mwandiko",
                "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
                " Ingero z'ibikorwa by'ubutabazi bw'ibanze",
                " Inshoza y'impakanyi",
                " Amoko y'impakanyi n'imikoreshereze yazo mu nteruro",
                " Inshoza y'indango z'inshinga",
                " Amoko y'indango z'inshinga n'imikoreshereze yazo",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CMCZ401 = quick(
  "CMCZ401",
  "Promote the Culture of Peace",
  "4",
  3,
  30,
  "Make a comparative study of genocides.                    Learning hours:10",
  [
    {
      id: "lo1",
      title: "Make a comparative study of genocides.                    Learning hours:10",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   Explanation of Gender-based violence and child abuse",
          subs: [
            {
              title: "   Explanation of Gender-based violence and child abuse",
              items: [
                " Definition of key terms",
                "Gender",
                "Gender equity",
                "Gender equality",
                "Gender Based Violence",
                "Child abuse",
              ],
            },
          ],
        },
        {
          title: " Forms of gender-based violence",
          subs: [
            {
              title: " Forms of gender-based violence",
              items: [
                "Physical",
                "Psychological",
                "Sexual",
                "Economic",
                " Forms of child abuse",
              ],
            },
          ],
        },
        {
          title: "Psychological (child neglect)",
          subs: [
            {
              title: "Psychological (child neglect)",
              items: [
                "Sexual",
                "Economic",
              ],
            },
          ],
        },
        {
          title: " Characteristics of human trafficking",
          subs: [
            {
              title: " Characteristics of human trafficking",
              items: [
                "6|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Promote peace and social cohesion",
      hours: 6,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "   Analysis of the concept of conflict management",
          subs: [
            {
              title: "   Analysis of the concept of conflict management",
              items: [
                " Definition of conflict",
                " Types of conflict",
                " Causes of conflict",
                " Consequence of conflict",
                " Conflict management",
                "Conflict resolution",
                "Conflict transformation",
                "Conflict prevention",
              ],
            },
          ],
        },
        {
          title: "   Explanation of the concepts of heritage and cultural diversity",
          subs: [
            {
              title: "   Explanation of the concepts of heritage and cultural diversity",
              items: [
                " Definition of key terms",
                "Heritage",
                "Culture",
                "Cultural diversity",
              ],
            },
          ],
        },
        {
          title: "   Discussion on Strategies for Fighting socio-cultural discrimination",
          subs: [
            {
              title: "   Discussion on Strategies for Fighting socio-cultural discrimination",
              items: [
                " Definition of key terms",
                "Social discrimination",
                "Cultural discrimination",
                "Social diversity",
                "8|Page",
                "Employable Skills for Sustainable Job Creation",
                "Social inclusion",
              ],
            },
          ],
        },
      ],
    },
  ]
);


// LEVEL 5 CCM MODULES (8 modules)
export const CCMBO502 = quick(
  "CCMBO502",
  "-         Organize a business",
  "5",
  3,
  30,
  "Perform business               Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Perform business               Learning hours: 10",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✓ Techniques of encouraging a positive ethical behavior in business",
          subs: [
            {
              title: "✓ Techniques of encouraging a positive ethical behavior in business",
              items: [
                "Rewards",
                "Expectations",
                "Training",
                "Policies",
              ],
            },
          ],
        },
        {
          title: "✓ Attribution of responsibilities",
          subs: [
            {
              title: "✓ Attribution of responsibilities",
              items: [
                "Estimation of volume of task",
                "Determination of task’s requirements",
                "Allowing time to the volume of task",
              ],
            },
          ],
        },
        {
          title: "✓ Responsibility assignment matrix",
          subs: [
            {
              title: "✓ Responsibility assignment matrix",
              items: [
                "Responsible, Accountable, Consulted and Informed (RACI)",
              ],
            },
          ],
        },
        {
          title: "•    Maintenance of good relationship with customers and suppliers",
          subs: [
            {
              title: "•    Maintenance of good relationship with customers and suppliers",
              items: [
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "✓   Importance of maintaining good customers and suppliers’ relationship to the business",
          subs: [
            {
              title: "✓   Importance of maintaining good customers and suppliers’ relationship to the business",
              items: [
                "✓   Ways to address",
                "Customer complaints",
                "Suppliers’ complaints",
              ],
            },
          ],
        },
        {
          title: "✓ Manual procedures for business operations as tool for maintaining customer and suppliers",
          subs: [
            {
              title: "✓ Manual procedures for business operations as tool for maintaining customer and suppliers",
              items: [
                "relationship",
                "Meaning of procedures manual",
                "Benefits of procedures manual",
                "Equipment",
              ],
            },
          ],
        },
        {
          title: "Tools                         •   Internet",
          subs: [
            {
              title: "Tools                         •   Internet",
              items: [
                "Reference books",
                "Case studies",
                "Scenarios",
                "Post note",
                "Template of documents used in purchasing process",
                "Employee recruitment template",
              ],
            },
          ],
        },
        {
          title: "Facilitation techniques       •   Brainstorming",
          subs: [
            {
              title: "Facilitation techniques       •   Brainstorming",
              items: [
                "Questions and answers",
                "Story telling",
                "Problem solving",
                "Role play",
                "Group discussion",
                "Practical exercise",
                "Formative",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Perform business                Learning hours: 5",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "•   Developing and maintaining goods, service, and market knowledge",
          subs: [
            {
              title: "•   Developing and maintaining goods, service, and market knowledge",
              items: [
                "✓ Key terms definitions",
                "Goods",
                "Services",
              ],
            },
          ],
        },
        {
          title: "✓ Comparison between goods and services",
          subs: [
            {
              title: "✓ Comparison between goods and services",
              items: [
                "Transfer ownership",
                "Separable",
                "Storage",
                "Perishable",
                "✓ Market opportunities",
                "Customers’ shopping trends",
                "Competition",
                "Availability of raw materials",
                "Reserved customers",
              ],
            },
          ],
        },
        {
          title: "✓ Service delivery procedures",
          subs: [
            {
              title: "✓ Service delivery procedures",
              items: [
                "Preparation",
                "Interaction",
                "Evaluation",
                "Providing feedback and observation",
              ],
            },
          ],
        },
        {
          title: "✓ Products and service adjustment",
          subs: [
            {
              title: "✓ Products and service adjustment",
              items: [
                "Definition of product and service adjustment",
                "Types of products and service adjustment",
                "Product and service adjustment procedures",
                "Importance of product and service adjustment on customer satisfaction",
                "Challenges with products/services adjustment",
              ],
            },
          ],
        },
        {
          title: "✓ Introduction to customer care",
          subs: [
            {
              title: "✓ Introduction to customer care",
              items: [
                "Key terms definition (customer, client, need, customer care, customer need, customer",
                "satisfaction, quality service)",
                "Customer profiles",
                "Importance of customer service (Positive effect, Negative effect)",
                "Levels of customer services",
                "Duties and responsibilities of a customer care provider",
              ],
            },
          ],
        },
        {
          title: "✓ Techniques to determine customer preferences, needs and expectations",
          subs: [
            {
              title: "✓ Techniques to determine customer preferences, needs and expectations",
              items: [
                "Active listening",
                "Questioning",
                "Observation",
                "Recognition of non-verbal signs",
                "8|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "✓ Anticipation of customer’s needs, expectations and preferences",
          subs: [
            {
              title: "✓ Anticipation of customer’s needs, expectations and preferences",
              items: [
                "Types of customer needs",
                "Types of customers preferences",
              ],
            },
          ],
        },
        {
          title: "✓ Factors influencing customer preferences, needs and expectations",
          subs: [
            {
              title: "✓ Factors influencing customer preferences, needs and expectations",
              items: [
                "Age",
                "Gender",
                "Social and cultural characteristics",
                "Prior knowledge",
                "Special needs",
                "Season",
                "Price of substitute goods",
                "Fashion",
                "Level of advertisement",
                "Consumer habits",
                "Consumer income level",
              ],
            },
          ],
        },
        {
          title: "✓ Tips to satisfy customer preferences, needs and expectations",
          subs: [
            {
              title: "✓ Tips to satisfy customer preferences, needs and expectations",
              items: [
                "Use of professional tone of voice",
                "Use professional language",
                "Respond promptly (give feedback promptly)",
                "✓ Customer satisfaction",
                "Importance of customer satisfaction",
                "Consequences of customer dissatisfaction",
              ],
            },
          ],
        },
        {
          title: "✓ Procedures for handling customer complaints",
          subs: [
            {
              title: "✓ Procedures for handling customer complaints",
              items: [
                "Listen",
                "Reformulate",
                "Solve",
                "Provide feedback",
              ],
            },
          ],
        },
        {
          title: "Offer something extra or complimentary",
          subs: [
            {
              title: "Offer something extra or complimentary",
              items: [
                "Follow up",
                "Service recovery",
                "9|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "✓ Difficult service situations",
          subs: [
            {
              title: "✓ Difficult service situations",
              items: [
                "Fire outbreak",
                "Water leakage",
                "Short circuit",
                "Falls and injuries",
                "Intruder",
              ],
            },
          ],
        },
        {
          title: "✓ Techniques for resolving difficult Service situations",
          subs: [
            {
              title: "✓ Techniques for resolving difficult Service situations",
              items: [
                "Notify everyone about the incident for rescue if necessary",
                "Call for assistance",
                "Monitoring and Communicate",
                "Provide solutions",
                "Record and report the incident information",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Monitor and evaluate",
      hours: 5,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "•    Elaboration of a daily report of business activities",
          subs: [
            {
              title: "•    Elaboration of a daily report of business activities",
              items: [
                "✓ Meaning of business daily report",
                "✓ Importance of business daily report to the business",
                "✓ Format of daily report of business activities",
              ],
            },
          ],
        },
        {
          title: "•    Conducting employee’s meeting",
          subs: [
            {
              title: "•    Conducting employee’s meeting",
              items: [
                "✓ Meaning of effective employees’ meeting",
                "✓ Purpose of employee’s meeting",
                "✓ Elements of preparing effective employee’s meeting",
                "Setting meeting objectives",
                "Preparing meeting requirements",
                "10 | P a g e",
                "Employable Skills for Sustainable Job Creation",
                "Running employee’s meeting",
                "✓ Ways to make employee meeting successful",
                "Facilitate brainstorming session",
                "Stand up",
                "Set meeting goals together",
                "Offer incentives and rewards",
                "Set a clear framework in advance",
              ],
            },
          ],
        },
        {
          title: "✓ Purpose of consulting business plan during a business operation",
          subs: [
            {
              title: "✓ Purpose of consulting business plan during a business operation",
              items: [
                "Create an effective strategy for growth",
                "Determine the future financial needs",
                "Attract investors and leaders",
              ],
            },
          ],
        },
        {
          title: "✓ Critical parts of the business plan to be considered while running business",
          subs: [
            {
              title: "✓ Critical parts of the business plan to be considered while running business",
              items: [
                "Executive summary",
                "Business description",
                "Market analysis and strategy",
                "Marketing and sales plan",
                "Competitive analysis",
                "Management and organization",
                "Description of product and services description",
                "Operating plan",
              ],
            },
          ],
        },
        {
          title: "✓        Using business plan as tool",
          subs: [
            {
              title: "✓        Using business plan as tool",
              items: [
                "Internal communication",
                "Communication with partners",
                "Communication with financial institutions",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMCZ501 = quick(
  "CCMCZ501",
  "",
  "5",
  3,
  30,
  "Describe      Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Describe      Learning hours: 10",
      hours: 6,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "•    Explanation of the concepts of unity in diversity and social cohesion.",
          subs: [
            {
              title: "•    Explanation of the concepts of unity in diversity and social cohesion.",
              items: [
                "✓ Define key terms",
                "Unity",
                "Unity in diversity",
                "Tolerance",
                "Respect",
              ],
            },
          ],
        },
        {
          title: "✓ Components/factors hindering tolerance and respect",
          subs: [
            {
              title: "✓ Components/factors hindering tolerance and respect",
              items: [
                "Bias",
                "Prejudice",
                "Stigma",
                "Harassment",
                "3|Page",
                "Employable Skills for Sustainable Job Creation",
                "Rejection",
                "Bullying",
                "Intolerance",
              ],
            },
          ],
        },
        {
          title: "✓ Factors affecting tolerance and respect",
          subs: [
            {
              title: "✓ Factors affecting tolerance and respect",
              items: [
                "Time",
                "Culture",
                "Place",
                "Situation",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMEN502 = quick(
  "CCMEN502",
  "Competence",
  "5",
  3,
  30,
  "Learning hours: 8",
  [
    {
      id: "lo1",
      title: "Learning hours: 8",
      hours: 7,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✓ Adjectives of Size and shape",
          subs: [
            {
              title: "✓ Adjectives of Size and shape",
              items: [
                "✓ Adjective of color",
                "✓ Adjectives of origin",
                "✓ Adjectives of material",
                "✓ Comparative adjectives",
              ],
            },
          ],
        },
        {
          title: "• Describing people’ appearance using adjective of appearance",
          subs: [
            {
              title: "• Describing people’ appearance using adjective of appearance",
              items: [
                "✓ Positive",
                "✓ Neutral and Negative",
                "✓ Adjective of quality",
                "✓ Formation of adjectives",
              ],
            },
          ],
        },
        {
          title: "✓ Articulation of English silent letters",
          subs: [
            {
              title: "✓ Articulation of English silent letters",
              items: [
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
              ],
            },
          ],
        },
        {
          title: "•    Writing a well-structured descriptive paragraph",
          subs: [
            {
              title: "•    Writing a well-structured descriptive paragraph",
              items: [
                "✓ Topic sentence",
                "✓ Relevant supporting sentences",
                "✓ Closing or transition sentence",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Learning hours: 7",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "•    Writing a well-structured introductory paraghraph",
          subs: [
            {
              title: "•    Writing a well-structured introductory paraghraph",
              items: [
                "✓ Purpose",
                "✓ Thesis statement",
              ],
            },
          ],
        },
        {
          title: "•    Connecting ideas with linking words",
          subs: [
            {
              title: "•    Connecting ideas with linking words",
              items: [
                "✓ Subordinators",
              ],
            },
          ],
        },
        {
          title: "✓ Words used to connect new idea",
          subs: [
            {
              title: "✓ Words used to connect new idea",
              items: [
                "✓ Words used to conclude",
              ],
            },
          ],
        },
        {
          title: "•    Writing a well structured body and concluding",
          subs: [
            {
              title: "•    Writing a well structured body and concluding",
              items: [
                "✓ Topic sentence",
                "✓ Supporting sentences",
                "✓ Concluding sentence",
              ],
            },
          ],
        },
        {
          title: "•    Writing a well structure essay",
          subs: [
            {
              title: "•    Writing a well structure essay",
              items: [
                "✓ Introductory paragraph",
                "✓ Body paragraph",
                "✓ Concluding paragraph",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMIW502 = quick(
  "CCMIW502",
  "Use ICT at workplace",
  "5",
  3,
  30,
  "Prepare document Layout     Learning hours: 10",
  [
    {
      id: "lo1",
      title: "Prepare document Layout     Learning hours: 10",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✓ Different file formats and file extension",
          subs: [
            {
              title: "✓ Different file formats and file extension",
              items: [
                "✓ File Conversion",
                "File to PDF",
              ],
            },
          ],
        },
        {
          title: "PDF to word, excel and PPT",
          subs: [
            {
              title: "PDF to word, excel and PPT",
              items: [
                "✓ Compress file",
                "Definition",
                "Importance",
                "Steps",
                "Use of storage media",
                "✓ Storage media capacity",
                "Definition",
                "Units of data storage",
              ],
            },
          ],
        },
        {
          title: "✓ Different types of storage media",
          subs: [
            {
              title: "✓ Different types of storage media",
              items: [
                "off-line storage",
                "On-line storage",
              ],
            },
          ],
        },
        {
          title: "✓ Storage media formatting",
          subs: [
            {
              title: "✓ Storage media formatting",
              items: [
                "Formatting",
                "Erase data",
              ],
            },
          ],
        },
        {
          title: "Personal area network (PAN)",
          subs: [
            {
              title: "Personal area network (PAN)",
              items: [
                "Local area network (LAN)",
              ],
            },
          ],
        },
        {
          title: "Metropolitan area network (MAN)",
          subs: [
            {
              title: "Metropolitan area network (MAN)",
              items: [
                "3|Page",
                "Employable Skills for Sustainable Job Creation",
                "Wide area network (WAN)",
              ],
            },
          ],
        },
        {
          title: "✓ Connect computer to the internet",
          subs: [
            {
              title: "✓ Connect computer to the internet",
              items: [
                "Fixed internet",
                "Mobile internet",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Manage data in MS Excel",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✓   Entering data types in cells and their default formats",
          subs: [
            {
              title: "✓   Entering data types in cells and their default formats",
              items: [
                "✓   Sorting data",
              ],
            },
          ],
        },
        {
          title: "✓   Finding and replacing cell formats",
          subs: [
            {
              title: "✓   Finding and replacing cell formats",
              items: [
                "✓   Removes duplicates",
              ],
            },
          ],
        },
        {
          title: "✓   Create data validation rules",
          subs: [
            {
              title: "✓   Create data validation rules",
              items: [
                "Apply Excel functions",
                "✓   Basics functions",
                "Sum",
                "Average",
                "Max",
                "Min",
                "Count",
                "Rank and Grade",
                "✓ Error checking",
              ],
            },
          ],
        },
        {
          title: "✓ Creating an absolute reference",
          subs: [
            {
              title: "✓ Creating an absolute reference",
              items: [
                "✓   Using the IF function",
                "Data analysis",
                "✓   Create Charts",
                "✓   Table styles",
                "4|Page",
                "Employable Skills for Sustainable Job Creation",
                "Conditional formatting",
                "Format as table",
                "Cell style",
              ],
            },
          ],
        },
        {
          title: "✓ Ways of protecting excel data",
          subs: [
            {
              title: "✓ Ways of protecting excel data",
              items: [
                "Protect a cell",
                "Protect worksheet",
                "Protect workbook",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMKK502 = quick(
  "CCMKK502",
  "-         Kutumia Kiswahili katika Mawasiliano ya kazini",
  "5",
  3,
  30,
  "Masaa ya kujifunza: 12",
  [
    {
      id: "lo1",
      title: "Masaa ya kujifunza: 12",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Matumizi ya Viambishi",
          subs: [
            {
              title: "Matumizi ya Viambishi",
              items: [
                "Viambishi vya hali shurtishi",
                "Viambishi vya uwezekano",
                "Viambishi vya mahali",
              ],
            },
          ],
        },
        {
          title: "Matumizi ya Vielezi",
          subs: [
            {
              title: "Matumizi ya Vielezi",
              items: [
                "Vielezi vya wakati",
                "Vielezi vya mahali",
                "Vielezi vya namna/jinsi",
                "Vielezi vya idadi",
              ],
            },
          ],
        },
        {
          title: "Mnyabuliko wa maneno",
          subs: [
            {
              title: "Mnyabuliko wa maneno",
              items: [
                "Mnyambuliko wa vitenzi",
                "Mnyambuliko wa nomino",
                "Employable Skills for Sustainable Job Creation",
                "Mnyambuliko wa vielezi",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Kusimulia matukio Masaa ya kujifunza: 10",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Matumizi ya Usemi wa asili",
          subs: [
            {
              title: "Matumizi ya Usemi wa asili",
              items: [
                "Maana",
                "Nyakati",
                "Wakati uliopo",
                "Wakati uliopita",
                "Wakati ujao",
                "Wakati uliotimilika",
                "Wakati wa mazoea",
                "Alama za uakifishaji",
                "Alama za mtajo",
                "Alama ya kuuliza",
                "Employable Skills for Sustainable Job Creation",
                "Alama ya kushangaa",
              ],
            },
          ],
        },
        {
          title: "Matumizi ya Usemi wa taarifa",
          subs: [
            {
              title: "Matumizi ya Usemi wa taarifa",
              items: [
                "Maana",
                "Nyakati",
                "Wakati uliopo",
                "Wakati uliopita",
                "Wakati ujao",
                "Wakati uliotimilika",
                "Wakati wa mazoea",
                "Alama za uakifishaji",
                "Alama za mtajo",
                "Alama ya kuuliza",
                "Alama ya kushangaa",
              ],
            },
          ],
        },
        {
          title: "Mabadiliko ya usemi",
          subs: [
            {
              title: "Mabadiliko ya usemi",
              items: [
                "Nafsi",
                "Nyakati/hali",
                "Aina mbalimbali za maneno",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Kutunga hati za Masaa ya kujifunza: 10",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Aina za hati za Kikazi",
          subs: [
            {
              title: "Aina za hati za Kikazi",
              items: [
                "Barua mbalimbali",
                "Ripoti",
                "Wasifu-kazi /wasifu Taala",
                "Ajenda",
                "Kumbukumbu za mkutano",
                "Tangazo/ilani",
              ],
            },
          ],
        },
        {
          title: "Barua za kikazi",
          subs: [
            {
              title: "Barua za kikazi",
              items: [
                "Maana ya barua",
                "Muundo wa barua",
                "Uandishi wa barua",
              ],
            },
          ],
        },
        {
          title: "Wasifu kazi",
          subs: [
            {
              title: "Wasifu kazi",
              items: [
                "Maana ya wasifu kazi",
                "Muundo wa wasifu kazi",
                "Uandishi wa wasifu kazi",
              ],
            },
          ],
        },
        {
          title: "Ripoti",
          subs: [
            {
              title: "Ripoti",
              items: [
                "Maana ya ripoti",
                "Muundo wa ripoti",
                "Uandishi wa wasifu",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMKN502 = quick(
  "CCMKN502",
  "Raporo",
  "5",
  3,
  30,
  "Gukoresha Amasaha : 5",
  [
    {
      id: "lo1",
      title: "Gukoresha Amasaha : 5",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko y' akamaro k'imyuga n' ubumenyi ngiro",
          subs: [
            {
              title: "Isesenguramwandiko ku nsanganyamatsiko y' akamaro k'imyuga n' ubumenyi ngiro",
              items: [
                "Inyunguramagambo",
                "Ingingo z'ingenzi n'ingingo z'ingereka",
                "Insanganyamatsiko y'ingenzi iri mu mwandiko",
                "Isomo ry'ingenzi mu mwandiko",
                "Ingero zifatika zihamya akamaro k'imyuga n'ubumenyi ngiro mu muryango nyarwanda",
              ],
            },
          ],
        },
        {
          title: "Inkuru shusho",
          subs: [
            {
              title: "Inkuru shusho",
              items: [
                "Inshoza y'inkuru shusho",
                "Uturango tw'inkuru shusho",
                "Urugero rw'inkuru shusho",
              ],
            },
          ],
        },
        {
          title: "Ikinamico",
          subs: [
            {
              title: "Ikinamico",
              items: [
                "Inshoza y'ikinamico",
                "Uturango tw'ikinamico",
                "Urugero rw'ikinamico",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Gukoresha Amasaha ateganijwe: 5",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko y'uburyo bunyuranye bwo gukemura",
          subs: [
            {
              title: "Isesenguramwandiko ku nsanganyamatsiko y'uburyo bunyuranye bwo gukemura",
              items: [
                "amakimbirane:",
                "Inyunguramagambo",
                "Gushaka insanganyamatsiko y'ingenzi iri mu mwandiko",
                "Ingingo z'ingenzi n'ingingo z'ingereka",
                "Isomo ry'ingenzi mu mwandiko",
                "Ingero zifatika zerekana",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Gukoresha Amasaha n ateganyijwe: 10",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko y'uburyo bunyuranye bwo gutunganya",
          subs: [
            {
              title: "Isesenguramwandiko ku nsanganyamatsiko y'uburyo bunyuranye bwo gutunganya",
              items: [
                "ubutaka:",
                "Inyunguramagambo",
                "Gushaka insanganyamatsiko y'ingenzi iri mu mwandiko",
                "Kuvumbura isomo ry'ingenzi mu mwandiko",
                "Ingero zifatika zo gufata neza ubutaka",
                "Ingaruka zo gufata no gukoresha nabi ubutaka",
              ],
            },
          ],
        },
        {
          title: "Imimaro y'amagambo",
          subs: [
            {
              title: "Imimaro y'amagambo",
              items: [
                "Ruhamwa",
                "Inshinga",
                "Ibyuzuzo",
                "Imfutuzi",
                "impuza",
              ],
            },
          ],
        },
        {
          title: "Amategeko agenga imyandikire y'ibihekane byihariye",
          subs: [
            {
              title: "Amategeko agenga imyandikire y'ibihekane byihariye",
              items: [
                "Bw-bg",
                "Jy, Cy, njy, ncy",
                "Gw, hw, kw",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Gukoresha Amasaha : 10",
      hours: 0,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko ku kamaro k'isuku n'isukura",
          subs: [
            {
              title: "Isesenguramwandiko ku nsanganyamatsiko ku kamaro k'isuku n'isukura",
              items: [
                "Inyunguramagambo",
                "Insanganyamatsiko y'ingenzi iri mu mwandiko",
                "Isomo ry'ingenzi mu mwandiko",
                "Ingero z'ibikorwa byimakaza isuku n'isukura",
                "Ingero z'ibyiza by'isuku n'isukura mu muryango",
              ],
            },
          ],
        },
        {
          title: "Umwandiko ntekerezo",
          subs: [
            {
              title: "Umwandiko ntekerezo",
              items: [
                "Inshoza y'umwandiko ntekerezo",
                "Imbata y'umwandiko ntekerezo",
                "Intambwe z'ingenzi mu gukora umwandiko ntekerezo",
                "Urugero rw'umwandiko ntekerezo",
              ],
            },
          ],
        },
        {
          title: "Itangazo",
          subs: [
            {
              title: "Itangazo",
              items: [
                "Inshoza y'itangazo",
                "Imbata y'itangazo",
                "Amoko y'amatanganzo",
                "Ingero z'amatangazo",
              ],
            },
          ],
        },
        {
          title: "Ibaruwa",
          subs: [
            {
              title: "Ibaruwa",
              items: [
                "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
                "Inshoza y'ibaruwa",
                "Ubwoko bw' amabaruwa n' imbata zayo",
                "Ingero z'amabaruwa",
              ],
            },
          ],
        },
        {
          title: "Raporo",
          subs: [
            {
              title: "Raporo",
              items: [
                "Inshoza ya raporo",
                "Amoko ya raporo",
                "Imbata ya raporo",
                "Urugero rwa raporo",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMPE502 = quick(
  "CCMPE502",
  "-       Apply professional and multicultural ethics at workplace",
  "5",
  3,
  30,
  "analyze social diversity Learning hours: 5",
  [
    {
      id: "lo1",
      title: "analyze social diversity Learning hours: 5",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✓ Communication guidelines in multicultural settings",
          subs: [
            {
              title: "✓ Communication guidelines in multicultural settings",
              items: [
                "Maintaining etiquettes",
                "Avoidance to use of slangs",
                "Speak slowly",
                "Practicing active listening",
                "Take turns to talk",
                "Write down differences and similarities",
              ],
            },
          ],
        },
        {
          title: "✓ Contexts cultures in communication",
          subs: [
            {
              title: "✓ Contexts cultures in communication",
              items: [
                "High contexts culture",
                "Low context culture",
              ],
            },
          ],
        },
        {
          title: "✓ Types of cultural differences in communication",
          subs: [
            {
              title: "✓ Types of cultural differences in communication",
              items: [
                "Eye contact",
                "Touch",
                "Gestures",
                "Facial expressions",
                "Posture",
              ],
            },
          ],
        },
        {
          title: "✓ Co-cultural communication goals",
          subs: [
            {
              title: "✓ Co-cultural communication goals",
              items: [
                "Assimilation",
                "Accommodation",
                "Separation",
              ],
            },
          ],
        },
        {
          title: "✓ Factors influencing co-cultural communication",
          subs: [
            {
              title: "✓ Factors influencing co-cultural communication",
              items: [
                "Field experience",
                "Situational context",
                "Abilities",
                "Communication approach",
              ],
            },
          ],
        },
        {
          title: "•   Maintaining cross-cultural communication",
          subs: [
            {
              title: "•   Maintaining cross-cultural communication",
              items: [
                "✓ Definition",
              ],
            },
          ],
        },
        {
          title: "✓ Types of cross-cultural communication contexts",
          subs: [
            {
              title: "✓ Types of cross-cultural communication contexts",
              items: [
                "High context cross-cultural communication",
                "Low context cross-cultural communication",
              ],
            },
          ],
        },
        {
          title: "✓ Communication techniques for multicultures",
          subs: [
            {
              title: "✓ Communication techniques for multicultures",
              items: [
                "Changing attitudes",
                "Practicing good speaking and listening",
                "Adjusting intercultural language competency",
                "Learning other cultures",
              ],
            },
          ],
        },
        {
          title: "✓ Factors affecting cross-cultural communication",
          subs: [
            {
              title: "✓ Factors affecting cross-cultural communication",
              items: [
                "Language differences",
                "Cultural differences in Nonverbal communication",
                "5|Page",
                "Employable Skills for Sustainable Job Creation",
                "Power distance",
              ],
            },
          ],
        },
        {
          title: "✓ Cross-cultural communication barriers",
          subs: [
            {
              title: "✓ Cross-cultural communication barriers",
              items: [
                "Linguistic misinterpretations",
                "Stereotypes",
                "Prejudice",
                "Ethnocentrism",
                "Emotional display",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Lead a team                   Learning hours: 7",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Ethical principles and values",
          subs: [
            {
              title: "Ethical principles and values",
              items: [
                "✓ Professional qualities",
                "Moral qualities",
                "Physical qualities",
                "Interpersonal qualities",
              ],
            },
          ],
        },
        {
          title: "Technical competence and Professional skills",
          subs: [
            {
              title: "Technical competence and Professional skills",
              items: [
                "Professional manners",
              ],
            },
          ],
        },
        {
          title: "•   Keeping Long life learning and Continuous professional development",
          subs: [
            {
              title: "•   Keeping Long life learning and Continuous professional development",
              items: [
                "✓ Key terms definitions",
                "Long life learning",
              ],
            },
          ],
        },
      ],
    },
  ]
);


// OTHER CCM MODULES
export const CCMHE303 = quick(
  "CCMHE303",
  "-         Maintain SHE at Workplace",
  "?",
  3,
  30,
  "Maintain personal hygiene, health and safety                Learning hours: 15",
  [
    {
      id: "lo1",
      title: "Maintain personal hygiene, health and safety                Learning hours: 15",
      hours: 7,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "•     Controlling hazards at the workplace",
          subs: [
            {
              title: "•     Controlling hazards at the workplace",
              items: [
                "✓ Key terms definition",
              ],
            },
          ],
        },
        {
          title: "✓ Methods of identifying workplace hazards in line with occupation",
          subs: [
            {
              title: "✓ Methods of identifying workplace hazards in line with occupation",
              items: [
                "Interviews",
                "Brainstorming",
                "Checklists",
                "Assumption Analysis.",
                "Cause and Effect Diagrams",
                "Nominal Group Technique (NGT)",
                "Affinity Diagram",
              ],
            },
          ],
        },
        {
          title: "✓ Types of hazards in the workplace",
          subs: [
            {
              title: "✓ Types of hazards in the workplace",
              items: [
                "Safety",
                "Physical",
                "Chemical",
                "Biological",
                "Other health hazards",
              ],
            },
          ],
        },
        {
          title: "✓ Controlling hazard at the workplace",
          subs: [
            {
              title: "✓ Controlling hazard at the workplace",
              items: [
                "Methods of hazard control",
                "SHE signs in the workplace",
                "Setting up workplace safety signs Illumination",
                "Practical Problem-Solving Model",
              ],
            },
          ],
        },
        {
          title: "✓ Types of risks at workplace",
          subs: [
            {
              title: "✓ Types of risks at workplace",
              items: [
                "✓ Steps of risk",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Ensure",
      hours: 8,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "✓ Concepts of sustainable environment and development",
          subs: [
            {
              title: "✓ Concepts of sustainable environment and development",
              items: [
                "Environment",
                "Development",
                "Sustainable environment",
                "Sustainable development",
              ],
            },
          ],
        },
        {
          title: "Economic and social development vs environment development",
          subs: [
            {
              title: "Economic and social development vs environment development",
              items: [
                "✓ Types of environments",
              ],
            },
          ],
        },
        {
          title: "✓ Rwanda’s environmental features",
          subs: [
            {
              title: "✓ Rwanda’s environmental features",
              items: [
                "Natural environment",
                "Geophysical features",
                "Natural",
              ],
            },
          ],
        },
      ],
    },
  ]
);

export const CCMFT502 = quick(
  "CCMFT502",
  "",
  "?",
  3,
  30,
  "Décrire son Les",
  [
    {
      id: "lo1",
      title: "Décrire son Les",
      hours: 10,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Parler des activités quotidiennes",
          subs: [
            {
              title: "Parler des activités quotidiennes",
              items: [
                "✓ Les moments de la journée",
                "✓ La conjugaison des verbes pronominaux du premier groupe à l'indicatif présent",
                "✓ L'emploi de « faire du, de la, des » pour décrire une activité",
                "✓ La conjugaison des verbes « dormir » et « finir » à l'indicatif présent",
              ],
            },
          ],
        },
        {
          title: "L'utilisation des indicateurs de temps",
          subs: [
            {
              title: "L'utilisation des indicateurs de temps",
              items: [
                "✓ Les expressions de la fréquence",
                "Jamais (ne)",
                "Parfois",
                "Souvent",
                "Toujours",
                "✓ Les indicateurs de temps pour situer dans le temps",
                "Jusqu'à",
                "De… à",
                "Quand",
                "D'abord/ premièrement",
                "Puis/ ensuite",
                "Après",
                "Enfin",
                "Depuis",
                "Employable Skills for Sustainable Job Creation",
                "Pendant",
              ],
            },
          ],
        },
        {
          title: "L'utilisation des conjonctions de coordination",
          subs: [
            {
              title: "L'utilisation des conjonctions de coordination",
              items: [
                "✓ Addition : Et",
                "✓ Négation addition : ni … ni",
                "✓ Choix : ou",
                "✓ Opposition : mais",
                "✓ Opposition avec exclusion : or",
                "✓ Conséquence : Donc",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Faire les courses",
      hours: 9,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "L'identification des produits alimentaires et les sites de courses",
          subs: [
            {
              title: "L'identification des produits alimentaires et les sites de courses",
              items: [
                "✓ Les produits alimentaires",
                "Les fruits",
                "Les légumes",
                "Les produits laitiers et les œufs",
                "Le poisson",
                "Les condiments",
                "✓ Les sites de courses",
                "Employable Skills for Sustainable Job Creation",
                "Épiceries spécialisées",
                "Supermarchés",
                "Marchés",
              ],
            },
          ],
        },
        {
          title: "Demander le prix",
          subs: [
            {
              title: "Demander le prix",
              items: [
                "✓ La formation d'interrogation avec « combien »",
                "✓ L'emploi des démonstratifs",
                "Les adjectifs démonstratifs",
                "Les pronoms démonstratifs",
                "✓ Les mesures de masse et de capacité",
                "✓ Les contenants des produits alimentaires",
                "Une barquette",
                "Une boîte",
                "Une bouteille",
                "Un paquet",
                "Un pot",
              ],
            },
          ],
        },
        {
          title: "L'emploi du futur proche et du verbe « prendre »",
          subs: [
            {
              title: "L'emploi du futur proche et du verbe « prendre »",
              items: [
                "✓ Verbe « aller » à l'indicatif présent",
                "✓ La formation de futur proche",
                "✓ La forme négative",
                "✓ Conjugaison du verbe « prendre » à l'indicatif présent",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Raconter un",
      hours: 11,
      criteria: ["Learner demonstrates competency in this outcome"],
      topics: [
        {
          title: "Utilisation du passé composé pour raconter un événement",
          subs: [
            {
              title: "Utilisation du passé composé pour raconter un événement",
              items: [
                "✓ Conjugaison des verbes « avoir » et « être » à l'indicatif présent",
                "Forme affirmative",
                "Forme négative",
                "✓ Le passé composé",
                "Les verbes du premier groupe",
                "Les verbes pronominaux du premier groupe",
                "✓ Accord du participe passé avec l'auxiliaire « être »",
              ],
            },
          ],
        },
        {
          title: "Emploi des adverbes de temps et le futur simple",
          subs: [
            {
              title: "Emploi des adverbes de temps et le futur simple",
              items: [
                "✓ Emploi des adverbes de temps",
                "Hier",
                "Aujourd'hui",
                "Demain",
                "✓ Le futur simple des verbes du premier groupe",
                "✓ Utilisation de « il y a » pour montrer un moment précis dans le passé",
              ],
            },
          ],
        },
        {
          title: "Raconter un voyage",
          subs: [
            {
              title: "Raconter un voyage",
              items: [
                "✓ Le vocabulaire lié au voyage",
                "L'aéroport",
                "Un vol",
                "Une valise",
                "Un taxi",
                "Quitter",
                "✓ Le participe passé en –u, -i, -is, -ert des verbes :",
                "Employable Skills for Sustainable Job Creation",
                "Descendre",
                "Voir",
                "Boire",
                "Choisir",
                "Dormir",
                "Prendre",
                "Découvrir",
                "✓ La voix active et la voix passive",
                "L'auxiliaire « être » à l'indicatif présent, passé compose et futur simple",
                "Le participe passé des verbes du deuxième groupe",
              ],
            },
          ],
        },
      ],
    },
  ]
);
