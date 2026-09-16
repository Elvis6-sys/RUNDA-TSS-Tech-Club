#!/usr/bin/env python3
"""
Curriculum PDF Parser - Python Version
Extracts content from TVET curriculum PDFs and converts to JSON
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

CURRICULUM_DIR = Path(__file__).parent.parent / "public" / "curriculum"
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
                full_text += page.extract_text() + "\n"
            
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
    
    # Pattern 1: "Learning Outcome X: Title"
    pattern1 = r'Learning\s+Outcome\s+(\d+)[:\s]+([^\n]{10,200})'
    matches1 = re.finditer(pattern1, text, re.IGNORECASE)
    
    # Pattern 2: "LO X: Title"
    pattern2 = r'\bLO[\s\.]*(\d+)[:\.\s]+([^\n]{10,200})'
    matches2 = re.finditer(pattern2, text, re.IGNORECASE)
    
    all_matches = list(matches1) + list(matches2)
    
    seen = set()
    
    for match in all_matches:
        number = int(match.group(1))
        if number in seen or number > 20:
            continue
        
        seen.add(number)
        
        outcome_title = match.group(2).strip()
        outcome_title = re.sub(r'\s+', ' ', outcome_title)
        outcome_title = outcome_title.rstrip(':.')
        
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
    
    # Find the section for this learning outcome
    pattern = rf'Learning\s+Outcome\s+{outcome_number}[\s\S]{{0,2000}}?(?=Learning\s+Outcome\s+{outcome_number + 1}|Indicative\s+Content|Assessment|$)'
    match = re.search(pattern, text, re.IGNORECASE)
    
    section = match.group(0) if match else ""
    
    if not section:
        pattern2 = rf'LO\s*{outcome_number}[\s\S]{{0,2000}}?(?=LO\s*{outcome_number + 1}|Indicative\s+Content|Assessment|$)'
        match2 = re.search(pattern2, text, re.IGNORECASE)
        section = match2.group(0) if match2 else ""
    
    if section:
        # Extract bullet points
        bullet_pattern = r'[•\-\*○]\s*([^\n]{10,300})'
        bullets = re.finditer(bullet_pattern, section)
        
        for bullet in bullets:
            topic = bullet.group(1).strip()
            topic = re.sub(r'\s+', ' ', topic)
            if 10 < len(topic) < 300 and not re.match(r'^(Page|Learning|Outcome)', topic, re.IGNORECASE):
                topics.append(topic)
        
        # Extract numbered sub-items
        numbered_pattern = r'(?:^|\n)\s*\d+[\.\)]\s*([A-Z][^\n]{15,300})'
        numbered = re.finditer(numbered_pattern, section)
        
        for num in numbered:
            topic = num.group(1).strip()
            topic = re.sub(r'\s+', ' ', topic)
            if 15 < len(topic) < 300 and topic not in topics:
                topics.append(topic)
    
    return topics


def extract_indicative_content(text):
    """Extract indicative content sections"""
    content = []
    
    # Look for "Indicative Content" section
    pattern = r'Indicative\s+Content[:\s]+([\s\S]{0,3000}?)(?=Learning\s+Outcome|Assessment|Module|$)'
    match = re.search(pattern, text, re.IGNORECASE)
    
    if match:
        section = match.group(1)
        
        # Extract numbered items
        numbered_pattern = r'(?:^|\n)\s*(\d+)[\.\)]\s*([^\n]{10,300})'
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
        
        # If no numbered items, try bullet points
        if not content:
            bullet_pattern = r'[•\-\*]\s*([^\n]{10,300})'
            bullets = re.finditer(bullet_pattern, section)
            
            for index, bullet in enumerate(bullets, 1):
                content_text = bullet.group(1).strip()
                content_text = re.sub(r'\s+', ' ', content_text)
                if len(content_text) > 10:
                    content.append({
                        "number": index,
                        "text": content_text
                    })
    
    return content


def extract_description(text):
    """Extract module description"""
    patterns = [
        r'Description[:\s]+([^\n]{50,500})',
        r'Introduction[:\s]+([^\n]{50,500})',
        r'Overview[:\s]+([^\n]{50,500})',
        r'This\s+module[^\n]{50,500}'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            desc = match.group(1 if match.lastindex else 0).strip()
            desc = re.sub(r'\s+', ' ', desc)
            if len(desc) >= 50:
                return desc
    
    return ""


def extract_module_info(text, filename):
    """Extract module information from PDF text"""
    # Extract module code
    code_match = re.search(r'([A-Z]{3,}[A-Z0-9]+)', filename)
    module_code = code_match.group(1) if code_match else "UNKNOWN"
    
    # Extract module title
    title = filename.replace('.pdf', '').replace(module_code, '').strip()
    title = re.sub(r'^[\s\-_]+', '', title)
    title = re.sub(r'[\s\-_]+$', '', title)
    
    # Try to find better title in text
    title_patterns = [
        rf'{module_code}[\s:\-]+([^\n]{{10,100}})',
        r'Module Title[:\s]+([^\n]{10,100})',
        r'Course[:\s]+([^\n]{10,100})'
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match and len(match.group(1).strip()) > 5:
            title = match.group(1).strip()
            break
    
    # Extract learning outcomes
    learning_outcomes = extract_learning_outcomes(text)
    
    # Extract description
    description = extract_description(text)
    
    # Extract indicative content
    indicative_content = extract_indicative_content(text)
    
    return {
        "code": module_code,
        "title": title,
        "description": description,
        "learningOutcomes": learning_outcomes if learning_outcomes else None,
        "indicativeContent": indicative_content if indicative_content else None,
        "rawText": text[:10000]  # First 10000 chars for reference
    }


def process_directory(level):
    """Process all PDFs in a directory"""
    level_name = f"L{level}"
    print(f"\n🗂️  Processing {level_name} curriculum...")
    
    specific_modules_dir = CURRICULUM_DIR / level_name / "Specific Modules"
    
    if not specific_modules_dir.exists():
        print(f"⚠️  Directory not found: {specific_modules_dir}")
        return []
    
    pdf_files = list(specific_modules_dir.glob("*.pdf"))
    print(f"📚 Found {len(pdf_files)} PDF files")
    
    modules = []
    
    for pdf_file in pdf_files:
        try:
            pdf_data = parse_pdf(pdf_file)
            if pdf_data is None:
                continue
            
            module_info = extract_module_info(pdf_data["text"], pdf_file.name)
            
            modules.append({
                **module_info,
                "sourceFile": pdf_file.name,
                "pages": pdf_data["pages"],
                "level": level_name
            })
            
            print(f"  ✅ {module_info['code']}: {module_info['title']}")
            if module_info['learningOutcomes']:
                print(f"     📖 {len(module_info['learningOutcomes'])} learning outcomes extracted")
                for lo in module_info['learningOutcomes']:
                    if lo['topics']:
                        print(f"        LO{lo['number']}: {len(lo['topics'])} topics")
        
        except Exception as e:
            print(f"  ❌ Error parsing {pdf_file.name}: {e}")
    
    return modules


def main():
    """Main execution"""
    print("🚀 TVET Curriculum Parser Starting...\n")
    print("═══════════════════════════════════════════════════\n")
    
    all_modules = {
        "metadata": {
            "generatedAt": datetime.now().isoformat(),
            "totalModules": 0,
            "levels": []
        },
        "L3": [],
        "L4": [],
        "L5": []
    }
    
    # Process each level
    for level in [3, 4, 5]:
        modules = process_directory(level)
        all_modules[f"L{level}"] = modules
        all_modules["metadata"]["totalModules"] += len(modules)
        
        if modules:
            all_modules["metadata"]["levels"].append(f"L{level}")
            
            # Save individual level file
            level_file = OUTPUT_DIR / f"curriculum-l{level}.json"
            with open(level_file, 'w', encoding='utf-8') as f:
                json.dump(modules, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Saved: {level_file}")
    
    # Save combined file
    combined_file = OUTPUT_DIR / "curriculum-all.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(all_modules, f, indent=2, ensure_ascii=False)
    
    print('\n═══════════════════════════════════════════════════')
    print('✅ Parsing Complete!\n')
    print(f"📊 Total modules parsed: {all_modules['metadata']['totalModules']}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print(f"📄 Combined file: curriculum-all.json")
    print(f"📄 Level files: curriculum-l3.json, curriculum-l4.json, curriculum-l5.json")
    
    print('\n🎉 Ready to use! Import in your code:')
    print('   import curriculum from "@/lib/curriculum-data/curriculum-all.json"')
    print('\n📖 To view SWDBF501 Blockchain curriculum:')
    print('   cat lib/curriculum-data/curriculum-l5.json | grep -A 50 "SWDBF501"')


if __name__ == "__main__":
    main()
