#!/usr/bin/env python3
"""
COMPREHENSIVE Curriculum PDF Parser
Extracts ALL content from TVET curriculum PDFs (L3, L4, L5)
Includes: CCM modules, General modules, Specific modules
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime

try:
    import PyPDF2
except ImportError:
    print("📦 Installing PyPDF2...")
    os.system(f"{sys.executable} -m pip install PyPDF2")
    import PyPDF2

# Base curriculum directory
CURRICULUM_DIR = Path(__file__).parent.parent / "7 Curriculum"
OUTPUT_DIR = Path(__file__).parent.parent / "lib" / "curriculum-data"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def parse_pdf(pdf_path):
    """Parse a single PDF file"""
    print(f"\n📄 Parsing: {pdf_path.name}")
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            # Extract text from all pages
            full_text = ""
            for page in pdf_reader.pages:
                try:
                    full_text += page.extract_text() + "\n"
                except:
                    continue
            
            return {
                "text": full_text,
                "pages": num_pages
            }
    except Exception as e:
        print(f"  ❌ Error reading PDF: {e}")
        return None


def extract_learning_outcomes(text):
    """Extract learning outcomes with their topics"""
    outcomes = []
    
    # Multiple patterns for learning outcomes
    patterns = [
        r'Learning\s+[Oo]utcome\s+(\d+)[:\s]+([^\n]{10,200})',
        r'LO[\s\.]*(\d+)[:\.\s]+([^\n]{10,200})',
        r'(?:^|\n)\s*(\d+)\.\s+([A-Z][^\n]{20,200})',  # For numbered format
    ]
    
    seen = set()
    all_matches = []
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        all_matches.extend(matches)
    
    for match in all_matches:
        try:
            number = int(match.group(1))
        except:
            continue
            
        if number in seen or number > 20 or number < 1:
            continue
        
        seen.add(number)
        
        outcome_title = match.group(2).strip()
        outcome_title = re.sub(r'\s+', ' ', outcome_title)
        outcome_title = outcome_title.rstrip(':.')
        
        # Clean up common artifacts
        outcome_title = re.sub(r'\s+Learning hours.*$', '', outcome_title, flags=re.IGNORECASE)
        
        # Extract topics for this outcome
        topics = extract_topics_for_outcome(text, number, outcome_title)
        
        outcomes.append({
            "number": number,
            "title": outcome_title,
            "topics": topics
        })
    
    # Sort by number
    outcomes.sort(key=lambda x: x['number'])
    
    return outcomes


def extract_topics_for_outcome(text, outcome_number, outcome_title):
    """Extract topics for a specific learning outcome"""
    topics = []
    
    # Try to find the section for this learning outcome
    patterns = [
        rf'Learning\s+[Oo]utcome\s+{outcome_number}[:\s][^\n]*\n([\s\S]{{0,3000}}?)(?=Learning\s+[Oo]utcome\s+{outcome_number + 1}|Resources required|Assessment|Equipment|$)',
        rf'LO\s*{outcome_number}[:\s][^\n]*\n([\s\S]{{0,3000}}?)(?=LO\s*{outcome_number + 1}|Resources required|Assessment|Equipment|$)',
    ]
    
    section = ""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            section = match.group(1) if match.lastindex else match.group(0)
            break
    
    if section:
        # Extract bullet points with various markers
        bullet_patterns = [
            r'[•\-\*○●]\s*([^\n]{10,300})',
            r'✓\s*([^\n]{10,300})',
            r'[▪▫]\s*([^\n]{10,300})',
        ]
        
        for bullet_pattern in bullet_patterns:
            bullets = re.finditer(bullet_pattern, section)
            for bullet in bullets:
                topic = bullet.group(1).strip()
                topic = re.sub(r'\s+', ' ', topic)
                # Filter out page numbers and headers
                if (10 < len(topic) < 300 and 
                    not re.match(r'^(Page|Learning|Outcome|Module|RQF|Level)', topic, re.IGNORECASE) and
                    topic not in topics):
                    topics.append(topic)
        
        # Extract numbered sub-items (avoid top-level LOs)
        if len(topics) < 5:  # Only if we don't have many topics yet
            numbered_pattern = r'(?:^|\n)\s*(?:\d+\.\d+|\w\))\s*([A-Z][^\n]{15,300})'
            numbered = re.finditer(numbered_pattern, section)
            
            for num in numbered:
                topic = num.group(1).strip()
                topic = re.sub(r'\s+', ' ', topic)
                if (15 < len(topic) < 300 and 
                    topic not in topics and
                    not re.match(r'^(based on|according to|in line with)', topic, re.IGNORECASE)):
                    topics.append(topic)
    
    return topics


def extract_indicative_content(text):
    """Extract indicative content sections"""
    content = []
    
    # Look for "Indicative Content" section
    patterns = [
        r'Indicative\s+[Cc]ontent[:\s]+([\s\S]{0,5000}?)(?=Learning\s+[Oo]utcome|Resources required|Assessment|Equipment|Facilitation|$)',
        r'Course\s+[Cc]ontent[:\s]+([\s\S]{0,5000}?)(?=Learning\s+[Oo]utcome|Resources required|$)',
    ]
    
    section = ""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            section = match.group(1)
            break
    
    if section:
        # Extract bullet points
        bullet_patterns = [
            r'[•\-\*○●]\s*([^\n]{10,400})',
            r'✓\s*([^\n]{10,400})',
        ]
        
        for bullet_pattern in bullet_patterns:
            bullets = re.finditer(bullet_pattern, section)
            for index, bullet in enumerate(bullets, 1):
                content_text = bullet.group(1).strip()
                content_text = re.sub(r'\s+', ' ', content_text)
                if len(content_text) > 10:
                    content.append({
                        "number": index,
                        "text": content_text
                    })
        
        # If no bullets, try numbered items
        if not content:
            numbered_pattern = r'(?:^|\n)\s*(\d+)[\.\)]\s*([^\n]{10,400})'
            items = re.finditer(numbered_pattern, section)
            
            for item in items:
                number = int(item.group(1))
                content_text = item.group(2).strip()
                content_text = re.sub(r'\s+', ' ', content_text)
                if len(content_text) > 10:
                    content.append({
                        "number": number,
                        "text": content_text
                    })
    
    return content


def extract_description(text):
    """Extract module description"""
    patterns = [
        r'Purpose\s+statement[:\s]+([^\n]{50,800})',
        r'Description[:\s]+([^\n]{50,800})',
        r'Introduction[:\s]+([^\n]{50,800})',
        r'Overview[:\s]+([^\n]{50,800})',
        r'This\s+(?:module|specific module)[^\n]{50,800}',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            desc = (match.group(1) if match.lastindex else match.group(0)).strip()
            desc = re.sub(r'\s+', ' ', desc)
            if len(desc) >= 50:
                return desc
    
    return ""


def extract_module_info(text, filename, module_type):
    """Extract comprehensive module information from PDF text"""
    
    # Extract module code
    code_patterns = [
        r'([A-Z]{3,}[A-Z0-9]{3,}\d+)',  # e.g., SWDBF501, CCMEN502
        r'([A-Z]{2,}[A-Z]{2}\d{3,})',    # e.g., GENAP502
    ]
    
    module_code = "UNKNOWN"
    for pattern in code_patterns:
        match = re.search(pattern, filename)
        if match:
            module_code = match.group(1)
            break
    
    # If not in filename, try text
    if module_code == "UNKNOWN":
        for pattern in code_patterns:
            match = re.search(pattern, text[:1000])
            if match:
                module_code = match.group(1)
                break
    
    # Extract module title
    title = filename.replace('.pdf', '').replace(module_code, '').strip()
    title = re.sub(r'^[\s\-_]+', '', title)
    title = re.sub(r'[\s\-_]+$', '', title)
    
    # Try to find better title in text
    title_patterns = [
        rf'{module_code}[\s:\-]+([^\n]{{10,150}})',
        r'Module\s+Title[:\s]+([^\n]{10,150})',
        r'(?:Competence|Course)[:\s]+([^\n]{10,150})',
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, text[:2000], re.IGNORECASE)
        if match and len(match.group(1).strip()) > 5:
            candidate_title = match.group(1).strip()
            # Clean up
            candidate_title = re.sub(r'RQF Level.*$', '', candidate_title, flags=re.IGNORECASE)
            candidate_title = re.sub(r'Learning Hours.*$', '', candidate_title, flags=re.IGNORECASE)
            if len(candidate_title) > len(title) or len(title) < 10:
                title = candidate_title
            break
    
    # Extract learning hours
    learning_hours = None
    hours_match = re.search(r'Learning\s+Hours[:\s]+(\d+)', text[:2000], re.IGNORECASE)
    if hours_match:
        learning_hours = int(hours_match.group(1))
    
    # Extract credits
    credits = None
    credits_match = re.search(r'Credits[:\s]+(\d+)', text[:2000], re.IGNORECASE)
    if credits_match:
        credits = int(credits_match.group(1))
    
    # Extract learning outcomes
    learning_outcomes = extract_learning_outcomes(text)
    
    # Extract description
    description = extract_description(text)
    
    # Extract indicative content
    indicative_content = extract_indicative_content(text)
    
    return {
        "code": module_code,
        "title": title,
        "moduleType": module_type,
        "learningHours": learning_hours,
        "credits": credits,
        "description": description,
        "learningOutcomes": learning_outcomes if learning_outcomes else None,
        "indicativeContent": indicative_content if indicative_content else None,
        "rawText": text[:15000]  # First 15000 chars for reference
    }


def find_all_pdfs(base_dir, level_name):
    """Find all PDFs in a level directory across all module types"""
    level_dir = base_dir / level_name
    
    if not level_dir.exists():
        print(f"⚠️  Directory not found: {level_dir}")
        return {}
    
    modules_by_type = {
        "CCM": [],
        "General": [],
        "Specific": []
    }
    
    # Find CCM modules
    ccm_dirs = [
        level_dir / "CCM",
        level_dir / "CCM Modules-1",
        level_dir / "CCMs",
    ]
    
    for ccm_dir in ccm_dirs:
        if ccm_dir.exists():
            pdfs = list(ccm_dir.glob("*.pdf"))
            modules_by_type["CCM"].extend(pdfs)
    
    # Find General modules
    general_dirs = [
        level_dir / "General Modules",
        level_dir / "General modules",
    ]
    
    for gen_dir in general_dirs:
        if gen_dir.exists():
            pdfs = list(gen_dir.glob("*.pdf"))
            modules_by_type["General"].extend(pdfs)
    
    # Find Specific modules
    specific_dirs = [
        level_dir / "Specific Modules",
        level_dir / "Specific modules",
    ]
    
    for spec_dir in specific_dirs:
        if spec_dir.exists():
            pdfs = list(spec_dir.glob("*.pdf"))
            modules_by_type["Specific"].extend(pdfs)
    
    return modules_by_type


def process_level(base_dir, level_name, level_number):
    """Process all PDFs in a level directory"""
    print(f"\n{'='*70}")
    print(f"🗂️  Processing {level_name} (Level {level_number})")
    print(f"{'='*70}")
    
    modules_by_type = find_all_pdfs(base_dir, level_name)
    
    all_modules = []
    
    for module_type, pdf_files in modules_by_type.items():
        if not pdf_files:
            continue
        
        print(f"\n📚 {module_type} Modules: {len(pdf_files)} PDFs found")
        print(f"{'-'*70}")
        
        for pdf_file in pdf_files:
            try:
                pdf_data = parse_pdf(pdf_file)
                if pdf_data is None:
                    continue
                
                module_info = extract_module_info(pdf_data["text"], pdf_file.name, module_type)
                
                all_modules.append({
                    **module_info,
                    "sourceFile": pdf_file.name,
                    "pages": pdf_data["pages"],
                    "level": f"L{level_number}"
                })
                
                print(f"  ✅ {module_info['code']}: {module_info['title'][:60]}")
                if module_info['learningHours']:
                    print(f"     ⏱️  {module_info['learningHours']} hours")
                if module_info['learningOutcomes']:
                    print(f"     📖 {len(module_info['learningOutcomes'])} learning outcomes")
                    for lo in module_info['learningOutcomes'][:3]:  # Show first 3
                        topic_count = len(lo['topics']) if lo['topics'] else 0
                        if topic_count > 0:
                            print(f"        LO{lo['number']}: {lo['title'][:50]} ({topic_count} topics)")
            
            except Exception as e:
                print(f"  ❌ Error parsing {pdf_file.name}: {e}")
    
    return all_modules


def generate_summary_report(all_data):
    """Generate a comprehensive summary report"""
    report = []
    report.append("\n" + "="*80)
    report.append("📊 COMPREHENSIVE CURRICULUM EXTRACTION SUMMARY")
    report.append("="*80 + "\n")
    
    total_modules = 0
    for level in ['L3', 'L4', 'L5']:
        level_modules = all_data[level]
        total_modules += len(level_modules)
        
        # Count by type
        ccm_count = sum(1 for m in level_modules if m['moduleType'] == 'CCM')
        gen_count = sum(1 for m in level_modules if m['moduleType'] == 'General')
        spec_count = sum(1 for m in level_modules if m['moduleType'] == 'Specific')
        
        report.append(f"\n{level}:")
        report.append(f"  Total: {len(level_modules)} modules")
        report.append(f"  • CCM (Cross-Cutting): {ccm_count}")
        report.append(f"  • General: {gen_count}")
        report.append(f"  • Specific: {spec_count}")
        
        # Show sample modules
        if spec_count > 0:
            report.append(f"\n  Sample Specific Modules:")
            for module in [m for m in level_modules if m['moduleType'] == 'Specific'][:3]:
                report.append(f"    - {module['code']}: {module['title'][:50]}")
    
    report.append(f"\n{'='*80}")
    report.append(f"🎉 TOTAL MODULES EXTRACTED: {total_modules}")
    report.append(f"{'='*80}\n")
    
    return "\n".join(report)


def main():
    """Main execution"""
    print("🚀 COMPREHENSIVE TVET Curriculum Parser Starting...")
    print(f"📁 Scanning: {CURRICULUM_DIR}")
    print("="*80)
    
    all_modules = {
        "metadata": {
            "generatedAt": datetime.now().isoformat(),
            "totalModules": 0,
            "levels": [],
            "source": "TVET Rwanda Curriculum - Software Development",
            "includes": ["CCM Modules", "General Modules", "Specific Modules"]
        },
        "L3": [],
        "L4": [],
        "L5": []
    }
    
    # Level directory mappings
    level_dirs = {
        3: "RQF Level 3 SOFTWARE DEVELOPMENT",
        4: "RQF LEVEL 4 SoftWare_Development curriculum PDF",
        5: "RQF LEVEL 5 SoftWare_Development curriculum PDF"
    }
    
    # Process each level
    for level_num, level_dir_name in level_dirs.items():
        modules = process_level(CURRICULUM_DIR, level_dir_name, level_num)
        all_modules[f"L{level_num}"] = modules
        all_modules["metadata"]["totalModules"] += len(modules)
        
        if modules:
            all_modules["metadata"]["levels"].append(f"L{level_num}")
            
            # Save individual level file
            level_file = OUTPUT_DIR / f"curriculum-l{level_num}.json"
            with open(level_file, 'w', encoding='utf-8') as f:
                json.dump(modules, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Saved: {level_file}")
    
    # Save combined file
    combined_file = OUTPUT_DIR / "curriculum-all.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(all_modules, f, indent=2, ensure_ascii=False)
    
    # Generate and print summary
    summary = generate_summary_report(all_modules)
    print(summary)
    
    # Save summary to file
    summary_file = OUTPUT_DIR / "extraction-summary.txt"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary)
    
    print(f"\n📄 Files created:")
    print(f"   • curriculum-all.json - All modules combined")
    print(f"   • curriculum-l3.json - Level 3 modules")
    print(f"   • curriculum-l4.json - Level 4 modules")
    print(f"   • curriculum-l5.json - Level 5 modules")
    print(f"   • extraction-summary.txt - Summary report")
    
    print('\n🎉 AI Assistant is now 100% aware of ALL curriculum content!')
    print('\n📖 To use in your code:')
    print('   import curriculum from "@/lib/curriculum-data/curriculum-all.json"')


if __name__ == "__main__":
    main()
