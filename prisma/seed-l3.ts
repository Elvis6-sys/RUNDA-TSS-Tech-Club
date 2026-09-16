import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const LESSONS_DIR = path.join(__dirname, "lessons");

function txt(filename: string): string {
  return fs.readFileSync(path.join(LESSONS_DIR, filename), "utf-8");
}

// ─── L3 Lessons ──────────────────────────────────────────────────────────────

const L3_LESSONS = [
  // Mathematics
  { id: "l3-math-01", title: "Number Systems: Binary and Decimal",               subject: "Mathematics",     tierVisibility: "l3", order: 1, file: "l3-math-01-binary.txt" },
  { id: "l3-math-02", title: "Introduction to Algebra: Variables and Expressions", subject: "Mathematics",     tierVisibility: "l3", order: 2, file: "l3-math-02-algebra.txt" },
  // Web Development
  { id: "l3-web-01",  title: "HTML Structure & Semantics",                        subject: "Web Development", tierVisibility: "l3", order: 1, file: "l3-web-01-html.txt" },
  { id: "l3-web-02",  title: "CSS Layouts & Flexbox",                             subject: "Web Development", tierVisibility: "l3", order: 2, file: "l3-web-02-css.txt" },
  { id: "l3-web-03",  title: "JavaScript Fundamentals",                           subject: "Web Development", tierVisibility: "l3", order: 3, file: "l3-web-03-javascript.txt" },
  { id: "l3-web-04",  title: "Responsive Design",                                 subject: "Web Development", tierVisibility: "l3", order: 4, file: "l3-web-04-responsive.txt" },
  { id: "l3-web-05",  title: "Git & Version Control",                             subject: "Web Development", tierVisibility: "l3", order: 5, file: "l3-web-05-git.txt" },
  { id: "l3-web-06",  title: "Build a Static Portfolio Site",                     subject: "Web Development", tierVisibility: "l3", order: 6, file: "l3-web-06-portfolio.txt" },
  // Python Programming
  { id: "l3-py-01",   title: "Python Syntax & Data Types",                        subject: "Python",          tierVisibility: "l3", order: 1, file: "l3-py-01-syntax.txt" },
  { id: "l3-py-02",   title: "Control Flow: if, for, while",                      subject: "Python",          tierVisibility: "l3", order: 2, file: "l3-py-02-control-flow.txt" },
  { id: "l3-py-03",   title: "Functions & Modules",                               subject: "Python",          tierVisibility: "l3", order: 3, file: "l3-py-03-functions.txt" },
  { id: "l3-py-04",   title: "File I/O & Error Handling",                         subject: "Python",          tierVisibility: "l3", order: 4, file: "l3-py-04-file-io.txt" },
  { id: "l3-py-05",   title: "Build a CLI Tool",                                  subject: "Python",          tierVisibility: "l3", order: 5, file: "l3-py-05-cli-tool.txt" },
  // Computer Systems
  { id: "l3-cs-01",   title: "CPU & Memory Architecture",                         subject: "Computer Systems", tierVisibility: "l3", order: 1, file: "l3-cs-01-cpu-memory.txt" },
  { id: "l3-cs-02",   title: "Operating System Basics",                           subject: "Computer Systems", tierVisibility: "l3", order: 2, file: "l3-cs-02-os-basics.txt" },
  { id: "l3-cs-03",   title: "Linux Command Line",                                subject: "Computer Systems", tierVisibility: "l3", order: 3, file: "l3-cs-03-linux-cli.txt" },
  { id: "l3-cs-04",   title: "Networking Fundamentals",                           subject: "Computer Systems", tierVisibility: "l3", order: 4, file: "l3-cs-04-networking.txt" },
  { id: "l3-cs-05",   title: "Hexadecimal & Number Systems",                      subject: "Computer Systems", tierVisibility: "l3", order: 5, file: "l3-cs-05-hexadecimal.txt" },
];

// ─── L3 SkillTracks ───────────────────────────────────────────────────────────

const L3_TRACKS = [
  {
    id: "seed-track-web-development",
    name: "Web Development",
    description: "Build real websites and web applications from scratch.",
    tier: "l3", icon: "🌐", order: 0,
    nodes: [
      { id: "seed-node-web-0", title: "HTML Structure & Semantics",   description: "Write valid HTML5 documents with semantic tags.",      xpReward: 10, order: 0 },
      { id: "seed-node-web-1", title: "CSS Layouts & Flexbox",        description: "Style pages and build responsive layouts.",             xpReward: 10, order: 1 },
      { id: "seed-node-web-2", title: "JavaScript Fundamentals",      description: "Variables, functions, loops, DOM manipulation.",        xpReward: 15, order: 2 },
      { id: "seed-node-web-3", title: "Responsive Design",            description: "Mobile-first design with media queries.",               xpReward: 10, order: 3 },
      { id: "seed-node-web-4", title: "Git & Version Control",        description: "Commit, branch, merge, and push to GitHub.",            xpReward: 15, order: 4 },
      { id: "seed-node-web-5", title: "Build a Static Portfolio Site",description: "Deploy a personal portfolio to GitHub Pages.",          xpReward: 25, order: 5 },
    ],
  },
  {
    id: "seed-track-python-programming",
    name: "Python Programming",
    description: "Learn Python from basics to real problem-solving.",
    tier: "l3", icon: "🐍", order: 1,
    nodes: [
      { id: "seed-node-py-0", title: "Python Syntax & Data Types", description: "Strings, numbers, lists, dicts, booleans.",          xpReward: 10, order: 0 },
      { id: "seed-node-py-1", title: "Control Flow",               description: "if/else, for/while loops, break/continue.",          xpReward: 10, order: 1 },
      { id: "seed-node-py-2", title: "Functions & Modules",        description: "Define functions, import modules, use pip.",          xpReward: 15, order: 2 },
      { id: "seed-node-py-3", title: "File I/O & Error Handling",  description: "Read/write files, try/except blocks.",               xpReward: 15, order: 3 },
      { id: "seed-node-py-4", title: "Build a CLI Tool",           description: "Build a command-line app that solves a real problem.",xpReward: 25, order: 4 },
    ],
  },
  {
    id: "seed-track-computer-systems-&-architecture",
    name: "Computer Systems & Architecture",
    description: "Understand how computers work at the hardware and OS level.",
    tier: "l3", icon: "🖥️", order: 2,
    nodes: [
      { id: "seed-node-cs-0", title: "Binary & Number Systems",    description: "Binary, decimal, hexadecimal conversions.",                    xpReward: 10, order: 0 },
      { id: "seed-node-cs-1", title: "CPU & Memory Architecture",  description: "ALU, registers, RAM, cache, fetch-decode-execute.",             xpReward: 15, order: 1 },
      { id: "seed-node-cs-2", title: "Operating System Basics",    description: "Processes, threads, file systems, permissions.",                xpReward: 15, order: 2 },
      { id: "seed-node-cs-3", title: "Linux Command Line",         description: "Navigate, manage files, and run scripts in Linux.",             xpReward: 15, order: 3 },
      { id: "seed-node-cs-4", title: "Networking Fundamentals",    description: "IP, TCP/UDP, DNS, HTTP — how the internet works.",              xpReward: 15, order: 4 },
    ],
  },
];

async function main() {
  console.log("── L3 Seed ──────────────────────────────");

  // Lessons
  console.log("\nLessons:");
  for (const l of L3_LESSONS) {
    const { file, ...data } = l;
    await prisma.lesson.upsert({
      where: { id: data.id },
      update: { ...data, content: txt(file) },
      create: { ...data, content: txt(file) },
    });
    console.log(`  ✓ ${data.subject} — ${data.title}`);
  }

  // Tracks + nodes
  console.log("\nSkillTracks:");
  for (const track of L3_TRACKS) {
    const { nodes, ...trackData } = track;
    await prisma.skillTrack.upsert({
      where: { id: trackData.id },
      update: trackData,
      create: trackData,
    });
    for (const node of nodes) {
      await prisma.skillNode.upsert({
        where: { id: node.id },
        update: node,
        create: { ...node, trackId: trackData.id },
      });
    }
    console.log(`  ✓ ${trackData.name} (${nodes.length} nodes)`);
  }

  console.log("\nL3 seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
