#!/usr/bin/env ts-node

/**
 * Seed L3 CSA "Assemble PCB and Computer System" - Learning Outcome 1 ONLY
 * 
 * Creates beautiful, interactive, engaging content with:
 * - Rich text with emojis and formatting
 * - Embedded videos (PCB assembly tutorials)
 * - Interactive quizzes
 * - Code examples (circuit diagrams, Python scripts)
 * - Practical assignments
 * - Visual diagrams
 * - Progress checklists
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRACK_ID = 'cmsycxz5x001z14y6qb7ly0o4'; // Assemble PCB and computer system

// Learning Outcome 1 Content Structure
const LO1_CONTENT = {
  title: "Prepare Tools, material and Equipment",
  description: "Learn to identify, prepare, and use tools, materials, and equipment for PCB and computer system assembly",
  xpReward: 100,
  
  // Introduction Section
  intro: {
    text: `# 🔧 Prepare Tools, Materials and Equipment

## 🎯 Why This Matters

Welcome to **PCB and Computer System Assembly**! This is where theory meets practice. In Rwanda's growing tech industry, companies like **BAG Innovation** and **Positivo BGH** need skilled technicians who can assemble computers and PCBs with precision.

### What You'll Learn
By the end of this learning outcome, you will be able to:
- ✅ Identify all tools needed for PCB assembly
- ✅ Prepare materials according to safety standards
- ✅ Set up your workspace professionally
- ✅ Use equipment correctly and safely
- ✅ Maintain tools for long-term use

### Real-World Application
**Example:** At Positivo BGH Rwanda (Kigali), technicians assemble over 10,000 computers per month. Every technician must master tool preparation before touching any components!

---

## 🏢 Industry Context

**Companies in Rwanda hiring PCB/Computer Assembly Technicians:**
- 🏭 Positivo BGH (Kigali) - Computer manufacturing
- 🔌 BAG Innovation - Electronics assembly
- 💻 Rwanda ICT Chamber - Technical support
- 🎓 Carnegie Mellon University Rwanda - Lab technicians
- 🏫 TVET schools nationwide - Teaching assistants

**Average Salary:** 300,000 - 600,000 RWF/month for entry-level technicians

---`,

    video: {
      id: "intro-video",
      type: "video",
      url: "https://www.youtube.com/embed/kYOqAyEN7K4",
      title: "PCB Assembly Workshop Setup - Complete Guide",
      duration: "15:20"
    },

    quiz: {
      id: "intro-quiz",
      type: "quiz",
      questions: [
        {
          id: "q1",
          questionType: "mcq",
          question: "Why is proper tool preparation important in PCB assembly?",
          options: [
            "It makes the work look professional",
            "It prevents damage to sensitive components",
            "It speeds up the assembly process",
            "All of the above"
          ],
          correct: 3,
          explanation: "Proper tool preparation is crucial for all three reasons: professionalism, preventing component damage (PCBs are sensitive to ESD and physical damage), and efficiency. A well-prepared workspace can reduce assembly time by 30%!"
        },
        {
          id: "q2",
          questionType: "truefalse",
          question: "Positivo BGH in Kigali manufactures computers locally in Rwanda.",
          correct: 0,
          explanation: "TRUE! Positivo BGH is one of Africa's largest computer manufacturers, with a factory in Kigali producing laptops and desktops for the East African market."
        },
        {
          id: "q3",
          questionType: "multiselect",
          question: "Which careers can this skill lead to? (Select all that apply)",
          options: [
            "Computer Assembly Technician",
            "PCB Repair Specialist",
            "Electronics Lab Assistant",
            "Software Developer"
          ],
          correct: [0, 1, 2],
          explanation: "This skill directly prepares you for hardware-related careers (options 1-3). Software development requires different skills, though understanding hardware is helpful!"
        }
      ]
    }
  },

  // Tools Section
  tools: {
    text: `## 🔨 Essential Tools for PCB Assembly

### 1. **Soldering Tools** 🔥

#### **Soldering Iron (40-60W)**
- **Purpose:** Join components to PCB pads
- **Temperature:** 300-400°C for lead-free solder
- **Tip types:** Chisel, conical, bevel
- **Rwanda suppliers:** Simba Telecom (Kigali), Sina Gerard Electronics

**Pro Tip:** 💡 Always tin your soldering iron tip before first use!

#### **Solder Wire**
- **Types:** Lead (Sn60/Pb40) vs Lead-free (SAC305)
- **Diameter:** 0.5mm - 1.0mm for PCB work
- **Flux core:** Rosin-based flux for electronics

#### **Desoldering Pump (Solder Sucker)**
- **Use:** Remove solder from pads
- **How to use:** Heat pad → Press pump → Release button

#### **Solder Wick (Desoldering Braid)**
- **Use:** Clean up excess solder
- **Material:** Copper braid with flux

---

### 2. **Hand Tools** 🛠️

| Tool | Purpose | Size/Spec |
|------|---------|-----------|
| **Wire Cutters** | Cut component leads | Flush cut, 125mm |
| **Long-nose Pliers** | Bend component leads | 150mm, insulated |
| **Tweezers** | Handle SMD components | ESD-safe, fine tip |
| **Screwdrivers** | PCB mounting | Phillips #0, #1, #2 |
| **Wire Strippers** | Prepare wires | 0.5-6mm² |

---

### 3. **Measuring & Testing Tools** 📏

#### **Digital Multimeter (DMM)**
- **Measures:** Voltage, current, resistance, continuity
- **Features needed:**
  - Auto-ranging
  - Diode test mode
  - Capacitance measurement (optional)
- **Recommended:** UNI-T UT33, Fluke 15B (available at Simba Telecom)

#### **Magnifying Glass / Loupe**
- **Magnification:** 10x - 20x
- **Use:** Inspect solder joints, identify component markings

#### **ESD Wrist Strap**
- **Purpose:** Prevent Electrostatic Discharge damage
- **Resistance:** 1 MΩ to ground
- **CRITICAL:** Always wear when handling CMOS/MOSFET components!

---

### 4. **Workspace Equipment** 🏭

#### **ESD-Safe Work Mat**
- **Material:** Conductive rubber
- **Size:** 60cm x 90cm minimum
- **Ground connection:** Connect to earth ground

#### **Helping Hands / PCB Holder**
- **Use:** Hold PCB while soldering
- **Features:** Adjustable arms, magnifying glass

#### **Fume Extractor / Fan**
- **Purpose:** Remove solder fumes (health hazard!)
- **Airflow:** 150+ CFM (cubic feet per minute)

#### **Good Lighting**
- **Type:** LED task light, 5000K color temperature
- **Brightness:** 1000+ lumens
- **Position:** Adjustable arm for shadow-free work

---`,

    code: {
      id: "tools-code",
      type: "code",
      language: "python",
      code: `# PCB Assembly Tools Checklist System
# Use this to track your tool inventory

class ToolInventory:
    def __init__(self):
        self.tools = {
            "Soldering Iron": {"status": "pending", "condition": "new"},
            "Solder Wire": {"status": "pending", "condition": "new"},
            "Wire Cutters": {"status": "pending", "condition": "new"},
            "Multimeter": {"status": "pending", "condition": "new"},
            "ESD Wrist Strap": {"status": "pending", "condition": "new"},
            "Work Mat": {"status": "pending", "condition": "new"},
        }
    
    def check_tool(self, tool_name):
        """Mark a tool as checked and ready"""
        if tool_name in self.tools:
            self.tools[tool_name]["status"] = "ready"
            print(f"✓ {tool_name} is ready!")
        else:
            print(f"✗ {tool_name} not in inventory")
    
    def get_status(self):
        """Show overall preparation status"""
        total = len(self.tools)
        ready = sum(1 for t in self.tools.values() if t["status"] == "ready")
        
        print(f"\\n📊 Tool Preparation Status: {ready}/{total} ready")
        print("\\nPending tools:")
        for name, info in self.tools.items():
            if info["status"] == "pending":
                print(f"  ⚠️  {name}")

# Example usage
inventory = ToolInventory()
inventory.check_tool("Soldering Iron")
inventory.check_tool("Solder Wire")
inventory.get_status()`,
      description: "Run this Python script to track your tool preparation progress!"
    },

    diagram: {
      id: "tools-diagram",
      type: "text",
      content: `## 🗺️ Workspace Layout Diagram

\`\`\`mermaid
graph TD
    A[Workbench] --> B[Left Side]
    A --> C[Center]
    A --> D[Right Side]
    
    B --> B1[Soldering Iron Stand]
    B --> B2[Solder & Flux]
    B --> B3[Fume Extractor]
    
    C --> C1[ESD Work Mat]
    C --> C2[PCB Holder/Helping Hands]
    C --> C3[Magnifying Glass]
    
    D --> D1[Hand Tools Organizer]
    D --> D2[Multimeter]
    D --> D3[Component Storage]
    
    style A fill:#e1f5ff
    style C1 fill:#fff3cd
    style B1 fill:#f8d7da
\`\`\`

### Workspace Setup Tips:
1. **Left side:** Hot tools (soldering iron, heat gun)
2. **Center:** Active work area with ESD protection
3. **Right side:** Measuring tools and components
4. **Behind:** Good lighting from above
5. **Ventilation:** Fume extractor on left, pulls fumes away`
    },

    quiz2: {
      id: "tools-quiz",
      type: "quiz",
      questions: [
        {
          id: "tq1",
          questionType: "mcq",
          question: "What temperature should a soldering iron be set to for lead-free solder?",
          options: [
            "200-250°C",
            "300-400°C",
            "500-600°C",
            "100-150°C"
          ],
          correct: 1,
          explanation: "Lead-free solder (SAC305) melts at around 217°C, so you need 300-400°C for proper flow and joint formation. Too hot (>450°C) damages components, too cold creates cold joints."
        },
        {
          id: "tq2",
          questionType: "fillin",
          question: "The purpose of an ESD wrist strap is to prevent ____ damage to sensitive components.",
          blanks: ["Electrostatic Discharge", "ESD", "static electricity"],
          explanation: "ESD (Electrostatic Discharge) can destroy CMOS chips, MOSFETs, and other sensitive components instantly. A wrist strap safely bleeds off static charge through a 1MΩ resistor."
        },
        {
          id: "tq3",
          questionType: "matching",
          question: "Match each tool to its primary purpose:",
          leftColumn: [
            "Soldering Iron",
            "Multimeter",
            "Solder Wick",
            "Tweezers"
          ],
          rightColumn: [
            "Measure voltage/resistance",
            "Remove excess solder",
            "Handle SMD components",
            "Join components to PCB"
          ],
          correctPairs: {
            "Soldering Iron": "Join components to PCB",
            "Multimeter": "Measure voltage/resistance",
            "Solder Wick": "Remove excess solder",
            "Tweezers": "Handle SMD components"
          },
          explanation: "Each tool has a specific purpose. Using the wrong tool can damage components or create poor quality work!"
        }
      ]
    }
  },

  // Safety Section
  safety: {
    text: `## ⚠️ Safety Guidelines

### 🔥 **Burn Prevention**

**Soldering Iron Safety:**
1. ✅ Always use a proper stand - NEVER lay it on the desk
2. ✅ Keep cord away from your body
3. ✅ Wait 30 seconds before touching a heated component
4. ✅ Label hot items with "HOT" sign
5. ✅ Keep a cup of water nearby (emergency cooling)

**First Aid for Burns:**
- Run under cold water for 10 minutes
- Do NOT use ice directly
- Apply burn cream if available
- See a doctor for serious burns

---

### ⚡ **Electrical Safety**

**Working with Powered Circuits:**
1. ⚠️ ALWAYS disconnect power before working
2. ⚠️ Use insulated tools only
3. ⚠️ Check voltage with multimeter first
4. ⚠️ Never work alone on powered circuits
5. ⚠️ Know where the emergency shutoff is

**Multimeter Safety:**
- Start with highest range
- Never measure above rated voltage
- Check test leads for damage
- Use proper probe category (CAT II for electronics)

---

### 🫁 **Health & Ventilation**

**Solder Fume Hazards:**
- Contains rosin flux fumes
- Can cause respiratory irritation
- Long-term exposure = asthma risk

**Protection:**
- ✅ Use fume extractor or fan
- ✅ Work in ventilated area
- ✅ Take breaks every 30 minutes
- ✅ Wash hands after soldering

---

### 🧤 **Personal Protective Equipment (PPE)**

| PPE | When to Use | Type |
|-----|-------------|------|
| **Safety Glasses** | Always | Impact-resistant, side shields |
| **ESD Wrist Strap** | Handling ICs | Grounded, 1MΩ resistance |
| **Heat-resistant gloves** | Hot components | Kevlar or leather |
| **Lab coat** | Workshop | Cotton, long sleeves |

---`,

    video: {
      id: "safety-video",
      type: "video",
      url: "https://www.youtube.com/embed/J5Sb21qbpEQ",
      title: "Electronics Workshop Safety - Complete Guide",
      duration: "8:45"
    },

    quiz: {
      id: "safety-quiz",
      type: "quiz",
      questions: [
        {
          id: "sq1",
          questionType: "truefalse",
          question: "It's safe to measure AC mains voltage (230V) with any multimeter.",
          correct: 1,
          explanation: "FALSE! You need a multimeter rated for mains voltage (CAT II minimum, 600V+). Using a cheap multimeter on mains can explode and cause serious injury!"
        },
        {
          id: "sq2",
          questionType: "multiselect",
          question: "Which PPE is required for PCB assembly? (Select all)",
          options: [
            "Safety glasses",
            "ESD wrist strap",
            "Full face shield",
            "Lab coat"
          ],
          correct: [0, 1, 3],
          explanation: "Safety glasses, ESD wrist strap, and lab coat are standard. Full face shield is only needed for grinding/drilling operations."
        },
        {
          id: "sq3",
          questionType: "ordering",
          question: "Put these steps in the correct order for treating a minor soldering burn:",
          items: [
            "Continue working",
            "Run under cold water for 10 minutes",
            "Get burned",
            "Apply burn cream",
            "Cover with clean bandage"
          ],
          correctOrder: [2, 1, 3, 4, 0],
          explanation: "Correct order: Get burned → Cold water immediately → Apply burn cream → Bandage → Then you can continue working (if minor). Never ignore burns!"
        }
      ]
    }
  },

  // Practical Assignment
  assignment: {
    id: "lo1-assignment",
    type: "assignment",
    title: "🎯 Practical Assignment: Setup Your PCB Assembly Workspace",
    description: `## Assignment: Complete Workshop Setup

### Objective
Set up a professional PCB assembly workspace following industry standards and safety guidelines.

### Tasks

**Part 1: Tool Inventory (20 points)**
1. Create a list of all tools you have access to
2. Check condition of each tool
3. Identify missing tools from the essential list
4. Take photos of your tool organization

**Part 2: Workspace Setup (30 points)**
1. Set up an ESD-safe work area
2. Arrange tools according to workflow diagram
3. Install proper lighting
4. Set up ventilation (fan or extractor)
5. Label all power switches and emergency stops

**Part 3: Safety Checklist (20 points)**
1. Create a safety checklist poster
2. Include burn prevention steps
3. Include electrical safety rules
4. Add emergency contact numbers
5. Post visibly in workspace

**Part 4: Documentation (30 points)**
Submit:
- Photos of your workspace (before & after)
- Tool inventory spreadsheet
- Safety checklist (PDF)
- Short video (1-2 min) explaining your setup

### Submission Format
- ZIP file containing all photos, documents, video
- Name file: YourName_L3CSA_LO1_Assignment.zip
- Maximum size: 50MB

### Grading Rubric
| Criterion | Excellent (90-100%) | Good (70-89%) | Needs Improvement (<70%) |
|-----------|---------------------|---------------|---------------------------|
| **Tool Organization** | All tools properly organized, labeled | Most tools organized | Disorganized |
| **ESD Protection** | Proper mat, wrist strap, grounded | Partial ESD setup | No ESD protection |
| **Safety** | All safety items present | Missing 1-2 items | Major safety issues |
| **Documentation** | Clear photos, complete checklist | Some missing | Incomplete |

### Deadline
**Due:** End of Week 2

### Resources
- [Tool Suppliers in Rwanda](https://simb atelecom.rw)
- [ESD Safety Guide PDF](#)
- [Workspace Layout Examples](#)

**Need help?** Ask your instructor or post in the class forum!`,
    
    submissionType: "file_upload",
    allowedFormats: ["zip", "pdf", "jpg", "png", "mp4"],
    maxFileSize: 50,
    points: 100
  },

  // Summary Checklist
  checklist: {
    id: "lo1-checklist",
    type: "checklist",
    items: [
      "I can identify all essential tools for PCB assembly",
      "I know how to safely use a soldering iron",
      "I understand ESD protection and why it's critical",
      "I can set up a proper workspace layout",
      "I know all safety guidelines for electronics work",
      "I can use a multimeter to measure voltage and resistance",
      "I have prepared my own PCB assembly workspace",
      "I understand where to buy tools in Rwanda (Simba Telecom, etc.)",
      "I can create a tool inventory and maintenance schedule",
      "I am ready to start actual PCB assembly work!"
    ]
  }
};

async function seedLO1() {
  console.log('🚀 Seeding L3 CSA "Assemble PCB and Computer System" - Learning Outcome 1\n');
  
  try {
    // Check if track exists
    const track = await prisma.skillTrack.findUnique({
      where: { id: TRACK_ID }
    });
    
    if (!track) {
      console.error('❌ Track not found! ID:', TRACK_ID);
      process.exit(1);
    }
    
    console.log(`✓ Found track: ${track.name}\n`);
    
    // Check if LO1 already exists
    const existing = await prisma.skillNode.findFirst({
      where: {
        trackId: TRACK_ID,
        title: { contains: 'Prepare Tools' }
      }
    });
    
    if (existing) {
      console.log('⚠️  Learning Outcome 1 already exists. Updating content...\n');
      
      // Update with new content
      await prisma.skillNode.update({
        where: { id: existing.id },
        data: {
          blocks: {
            intro: [
              { id: 'intro-text', type: 'text', content: LO1_CONTENT.intro.text },
              LO1_CONTENT.intro.video,
              LO1_CONTENT.intro.quiz
            ],
            tools: [
              { id: 'tools-text', type: 'text', content: LO1_CONTENT.tools.text },
              LO1_CONTENT.tools.code,
              LO1_CONTENT.tools.diagram,
              LO1_CONTENT.tools.quiz2
            ],
            safety: [
              { id: 'safety-text', type: 'text', content: LO1_CONTENT.safety.text },
              LO1_CONTENT.safety.video,
              LO1_CONTENT.safety.quiz
            ],
            practice: [
              LO1_CONTENT.assignment,
              LO1_CONTENT.checklist
            ]
          }
        }
      });
      
      console.log('✅ Content updated successfully!');
      
    } else {
      console.log('Creating new Learning Outcome 1 node...\n');
      
      // Create new node
      const node = await prisma.skillNode.create({
        data: {
          trackId: TRACK_ID,
          title: LO1_CONTENT.title,
          description: LO1_CONTENT.description,
          xpReward: LO1_CONTENT.xpReward,
          order: 1,
          estimatedMinutes: 120, // 2 hours of content
          blocks: {
            intro: [
              { id: 'intro-text', type: 'text', content: LO1_CONTENT.intro.text },
              LO1_CONTENT.intro.video,
              LO1_CONTENT.intro.quiz
            ],
            tools: [
              { id: 'tools-text', type: 'text', content: LO1_CONTENT.tools.text },
              LO1_CONTENT.tools.code,
              LO1_CONTENT.tools.diagram,
              LO1_CONTENT.tools.quiz2
            ],
            safety: [
              { id: 'safety-text', type: 'text', content: LO1_CONTENT.safety.text },
              LO1_CONTENT.safety.video,
              LO1_CONTENT.safety.quiz
            ],
            practice: [
              LO1_CONTENT.assignment,
              LO1_CONTENT.checklist
            ]
          }
        }
      });
      
      console.log('✅ Learning Outcome 1 created successfully!');
      console.log(`   Node ID: ${node.id}`);
    }
    
    console.log('\n📊 Content Summary:');
    console.log('   - 4 sections (Intro, Tools, Safety, Practice)');
    console.log('   - 3 text blocks (rich formatted)');
    console.log('   - 2 embedded videos');
    console.log('   - 3 interactive quizzes (10 questions total)');
    console.log('   - 1 code example (Python tool tracker)');
    console.log('   - 1 diagram (Mermaid workspace layout)');
    console.log('   - 1 practical assignment');
    console.log('   - 1 mastery checklist (10 items)');
    console.log('   - Estimated student time: 2-3 hours\n');
    
    console.log('🎉 Done! View at:');
    console.log(`   Teacher: http://localhost:3001/passport/teach/${TRACK_ID}`);
    console.log(`   Student: http://localhost:3001/learn/${track.moduleSlug}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedLO1().catch(console.error);
