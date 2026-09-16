/**
 * RUNDA TSS Tech Club — Official Curriculum Registry
 *
 * Mirrors the exact folder structure in /7 Curriculum:
 *   Level 3  →  Specific modules | General modules | CCMs
 *   Level 4  →  Specific Modules | General Modules | CCM Modules
 *   Level 5  →  Specific Modules | General modules | CCM
 *
 * The `file` field is the exact PDF filename on disk.
 * The `code` field is the official module code from the PDF filename.
 * The `slug` field is the URL-safe identifier used in /learn/[slug].
 */

export type CurriculumModule = {
    id: string;      // unique slug used in URLs
    code: string;    // official module code e.g. SWDBD401
    title: string;   // human-readable title
    file: string;    // exact PDF filename
};

export type CurriculumCategory = {
    id: string;
    name: string;    // "Specific Modules" | "General Modules" | "CCM"
    type: "specific" | "general" | "ccm";
    modules: CurriculumModule[];
};

export type CurriculumLevel = {
    id: string;
    tier: string;    // "l3" | "l4" | "l5"
    title: string;
    categories: CurriculumCategory[];
};

// ─── LEVEL 3 ─────────────────────────────────────────────────────────────────

const L3: CurriculumLevel = {
    id: "l3",
    tier: "l3",
    title: "TVET Certificate III in Software Development",
    categories: [
        {
            id: "l3-specific",
            name: "Specific Modules",
            type: "specific",
            modules: [
                { id: "l3-web-dev", code: "L3-WEB", title: "Web Development", file: "Web Development.pdf" },
                { id: "l3-js", code: "L3-JS", title: "JavaScript Fundamentals", file: "Javascript Fundamentals.pdf" },
                { id: "l3-game-vue", code: "L3-GAME", title: "Game Development in Vue Framework", file: "Game development in vue framework.pdf" },
                { id: "l3-ux-design", code: "L3-UX", title: "UX Design", file: "UX Design.pdf" },
                { id: "l3-vcs", code: "L3-VCS", title: "Version Control", file: "VERSION CONTROL.pdf" },
                { id: "l3-reqs", code: "L3-REQS", title: "Software Project Requirements Analysis", file: "Software Project requirements Analysis.pdf" },
            ],
        },
        {
            id: "l3-general",
            name: "General Modules",
            type: "general",
            modules: [
                { id: "l3-graphic-design", code: "L3-GD", title: "Apply Graphic Design", file: "APPLY GRAPHIC DESIGN.pdf" },
                { id: "l3-algebra", code: "GENFT302", title: "Fundamental Algebra and Trigonometry", file: "GENFT302-FUNDAMENTAL ALGEBRA AND TRIGONOMETRY .pdf" },
                { id: "l3-physics", code: "GENGP302", title: "Apply General Physics", file: "GENGP302-APPLY GENERAL PHYSICS.pdf" },
            ],
        },
        {
            id: "l3-ccm",
            name: "Cross-Curricular Modules (CCM)",
            type: "ccm",
            modules: [
                { id: "l3-entre", code: "CCMBC302", title: "Entrepreneurship", file: "CCMBC302-ENTREPRENEURSHIP.pdf" },
                { id: "l3-ict", code: "CCMCL302", title: "Information and Communication Technology", file: "CCMCL302-INFORMATION AND COMMUNICATION TECHNOLOGY.pdf" },
                { id: "l3-citizen", code: "CCMCZ301", title: "Citizenship", file: "CCMCZ301-CITIZENSHIP.pdf" },
                { id: "l3-english", code: "CCMEN302", title: "English", file: "CCMEN302-ENGLISH.pdf" },
                { id: "l3-french", code: "CCMFT302", title: "Français", file: "CCMFT302-FRANÇAIS.pdf" },
                { id: "l3-she", code: "CCMHE303", title: "Safety, Health and Environment", file: "CCMHE303-Safety, Health and environment at workplace.pdf" },
                { id: "l3-kinya", code: "CCMKN302", title: "Ikinyarwanda Kiboneye", file: "CCMKN302-IKINYARWANDA KIBONEYE.pdf" },
                { id: "l3-ol", code: "CCMOL302", title: "Occupation and Learning Process", file: "CCMOL302-OCCUPATION AND LEARNING PROCESS.pdf" },
                { id: "l3-iap", code: "ICTIA302", title: "Industrial Attachment Program", file: "ICTIA302 _INDUSTRIAL ATTACHMENT PROGRAM.pdf" },
            ],
        },
    ],
};

// ─── LEVEL 4 ─────────────────────────────────────────────────────────────────

const L4: CurriculumLevel = {
    id: "l4",
    tier: "l4",
    title: "TVET Certificate IV in Software Development",
    categories: [
        {
            id: "l4-specific",
            name: "Specific Modules",
            type: "specific",
            modules: [
                { id: "l4-backend-app", code: "SWDBD401", title: "Backend Application Development", file: "SWDBD401 - BACKEND APPLICATION DEVELOPMENT.pdf" },
                { id: "l4-backend-design", code: "SWDBS401", title: "Backend System Design", file: "SWDBS401 - BACKEND SYSTEM DESIGN.pdf" },
                { id: "l4-dsa", code: "SWDDA401", title: "Data Structure and Algorithm Fundamentals", file: "SWDDA401 - DATA STRUCTURE AND ALGORITHM FUNDAMENTALS.pdf" },
                { id: "l4-db-dev", code: "SWDDD401", title: "Database Development", file: "SWDDD401 - DATABASE DEVELOPMENT.pdf" },
                { id: "l4-php", code: "SWDPP401", title: "PHP Programming", file: "SWDPP401 - PHP PROGRAMMING.pdf" },
                { id: "l4-windows-server", code: "SWDWS401", title: "Windows Server Administration", file: "SWDWS401 - WINDOWS SERVER ADMINISTRATION correct.pdf" },
            ],
        },
        {
            id: "l4-general",
            name: "General Modules",
            type: "general",
            modules: [
                { id: "l4-networking", code: "GENBN401", title: "Basics of Networking", file: "GENBN401 - BASICS OF NETWORKING.pdf" },
                { id: "l4-math", code: "GENFA402", title: "Apply Fundamental Mathematics Analysis", file: "GENFA402- APPLY FUNDAMENTAL MATHEMATICS ANALYSIS.pdf" },
                { id: "l4-mechanics", code: "GENMP402", title: "Apply Mechanics and Properties of Matter", file: "GENMP402- APPLY MECHANICS AND PROPERTIES OF MATTER.pdf" },
            ],
        },
        {
            id: "l4-ccm",
            name: "Cross-Curricular Modules (CCM)",
            type: "ccm",
            modules: [
                { id: "l4-entre", code: "CCMBP402", title: "Entrepreneurship", file: "CCMBP402 - ENTREPRENEURSHIP.pdf" },
                { id: "l4-ict", code: "CCMCS402", title: "Information and Communication Technology", file: "CCMCS402 -  INFORMATION AND COMMUNICATION TECHNOLOGY (ICT).pdf" },
                { id: "l4-english", code: "CCMEN402", title: "English", file: "CCMEN 402  - ENGLISH.pdf" },
                { id: "l4-french", code: "CCMFT402", title: "Français", file: "CCMFT402 - FRANÇAIS.pdf" },
                { id: "l4-iap", code: "CCMIA402", title: "Industrial Attachment Program (IAP)", file: "CCMIA402 - INDUSTRIAL ATTACHMENT PROGRAM (IAP).pdf" },
                { id: "l4-kinya", code: "CCMKN402", title: "Ikinyarwanda", file: "CCMKN402 - IKINYARWANDA.pdf" },
                { id: "l4-citizen", code: "CMCZ401", title: "Citizenship", file: "CMCZ401 -   CITIZENSHIP.pdf" },
            ],
        },
    ],
};

// ─── LEVEL 5 ─────────────────────────────────────────────────────────────────

const L5: CurriculumLevel = {
    id: "l5",
    tier: "l5",
    title: "TVET Certificate V in Software Development",
    categories: [
        {
            id: "l5-specific",
            name: "Specific Modules",
            type: "specific",
            modules: [
                { id: "l5-blockchain", code: "SWDBF501", title: "Blockchain Fundamentals", file: "SWDBF501 Blockchains Fundamentals.pdf" },
                { id: "l5-frontend", code: "SWDFA501", title: "Front-End App Development with React.JS", file: "SWDFA501 Front-End App Development with React.JS.pdf" },
                { id: "l5-integrate", code: "SWDIA502", title: "Integrate the Workplace", file: "SWDIA502_Integrate the Workplace.pdf" },
                { id: "l5-mobile", code: "SWDMA501", title: "Mobile App Development", file: "SWDMA501 MobileApp Development.pdf" },
                { id: "l5-ml", code: "SWDML501", title: "Machine Learning Application", file: "SWDML501 Machine Learning  Application.pdf" },
                { id: "l5-nosql", code: "SWDND501", title: "NoSQL Database Development", file: "SWDND501 NoSQL_Database Development.pdf" },
                { id: "l5-devops", code: "SWDOT501", title: "DevOps Application", file: "SWDOT501 Devops Application.pdf" },
            ],
        },
        {
            id: "l5-general",
            name: "General Modules",
            type: "general",
            modules: [
                { id: "l5-math-stats", code: "GENAP502", title: "Mathematical Analysis, Statistics and Probability", file: "GENAP502-Mathematical Analysis, Statistics and Probability _2024.pdf" },
                { id: "l5-dynamics", code: "GENDW502", title: "Apply Dynamics and Waves", file: "GENDW502 _APPLY DYNAMICS AND WAVES_2024.pdf" },
                { id: "l5-python", code: "GENPP501", title: "Python Programming", file: "GENPP501 Python Programming.pdf" },
                { id: "l5-qa", code: "GENQA501", title: "Quality Assurance", file: "GENQA501 Quality Assurance.pdf" },
            ],
        },
        {
            id: "l5-ccm",
            name: "Cross-Curricular Modules (CCM)",
            type: "ccm",
            modules: [
                { id: "l5-business", code: "CCMBO502", title: "Organise a Business", file: "CCMBO 502 _Organise a Business _2024.pdf" },
                { id: "l5-citizen", code: "CCMCZ501", title: "Develop Attitudes of Living Together in Harmony", file: "CCMCZ501_ DEVELOP ATTITUDES OF LIVING TOGETHER IN HARMONY_2024.pdf" },
                { id: "l5-english", code: "CCMEN502", title: "Use Upper-Intermediate English at the Workplace", file: "CCMEN502_ Use upper-intermediate English at the workplace_ 2024.pdf" },
                { id: "l5-french", code: "CCMFT502", title: "Échanger les idées en français élémentaire", file: "CCMFT502_ECHANGER LES IDEES EN FRANCAIS ELEMENTAIRE_2024.pdf" },
                { id: "l5-ict", code: "CCMIW502", title: "Apply ICT at Workplace", file: "CCMIW502_ APPLY ICT AT WORKPLACE _2024.pdf" },
                { id: "l5-kiswahili", code: "CCMKK502", title: "Kutumia Kiswahili katika Mawasiliano ya kazini", file: "CCMKK502_ Kutumia Kiswahili katika Mawasiliano ya kazini_2024.pdf" },
                { id: "l5-kinya", code: "CCMKN502", title: "Gukoresha Ikinyarwanda k'intyoza", file: "CCMKN502_ GUKORESHA IKINYARWANDA K_INTYOZA -2024.pdf" },
                { id: "l5-ethics", code: "CCMPE502", title: "Apply Professional and Multi-cultural Ethics at Workplace", file: "CCMPE_502 _Apply professional and multi-cultural ethics at workplace_2024.pdf" },
            ],
        },
    ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const CURRICULUM_LEVELS: CurriculumLevel[] = [L3, L4, L5];

/** Flat list of all modules across all levels and categories */
export const ALL_MODULES: (CurriculumModule & { tier: string; levelTitle: string; categoryName: string; categoryType: string })[] =
    CURRICULUM_LEVELS.flatMap(level =>
        level.categories.flatMap(cat =>
            cat.modules.map(m => ({
                ...m,
                tier: level.tier,
                levelTitle: level.title,
                categoryName: cat.name,
                categoryType: cat.type,
            }))
        )
    );

/** Look up a module by its ID */
export function getModuleById(id: string) {
    return ALL_MODULES.find(m => m.id === id) ?? null;
}

/** Supabase Storage public URL for a curriculum PDF */
export function getCurriculumPdfUrl(tier: string, categoryType: string, filename: string): string {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return "#";
    // Files are stored in the "curriculum" bucket under level/category/filename
    const folder = encodeURIComponent(`${tier}/${categoryType}`);
    const file = encodeURIComponent(filename);
    return `${base}/storage/v1/object/public/curriculum/${folder}/${file}`;
}

// Legacy export — keep PassportClient working until it's updated
export const CURRICULUM = {
    levels: CURRICULUM_LEVELS.map(level => ({
        id: level.id,
        title: level.title,
        tracks: level.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            modules: cat.modules.map(m => ({
                id: m.id,
                code: m.code,
                title: m.title,
                file: m.file,
                fileUrl: "#", // resolved at runtime
            })),
        })),
    })),
};

export default CURRICULUM_LEVELS;
