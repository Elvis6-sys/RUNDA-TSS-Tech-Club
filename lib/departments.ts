/**
 * DEPARTMENT/TRADE CONFIGURATION
 * 
 * Defines the 4 main trades/departments at RUNDA TSS Tech Club
 */

export interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  levels: string[]; // RQF Level 3, 4, 5
  moduleCount: number; // Estimated number of modules
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'computer-systems-architecture',
    name: 'Computer Systems & Architecture',
    description: 'Hardware, networks, system administration, and infrastructure',
    icon: '🖥️',
    color: 'bg-blue-500',
    levels: ['Level 3', 'Level 4', 'Level 5'],
    moduleCount: 12,
  },
  {
    id: 'software-development',
    name: 'Software Development',
    description: 'Programming, web/mobile apps, databases, and software engineering',
    icon: '💻',
    color: 'bg-green-500',
    levels: ['Level 3', 'Level 4', 'Level 5'],
    moduleCount: 25,
  },
  {
    id: 'land-surveying',
    name: 'Land Surveying',
    description: 'Geomatics, mapping, GIS, and spatial data analysis',
    icon: '📐',
    color: 'bg-yellow-500',
    levels: ['Level 3', 'Level 4', 'Level 5'],
    moduleCount: 8,
  },
  {
    id: 'building-construction',
    name: 'Building & Construction',
    description: 'Civil engineering, architecture, construction management',
    icon: '🏗️',
    color: 'bg-orange-500',
    levels: ['Level 3', 'Level 4', 'Level 5'],
    moduleCount: 10,
  },
];

/**
 * Map module codes to departments
 * Prefix matching: SWD = Software Development, CSA = Computer Systems, etc.
 */
export function getDepartmentFromModuleCode(moduleCode: string): string | null {
  const code = moduleCode.toUpperCase();
  
  if (code.startsWith('SWD')) return 'software-development';
  if (code.startsWith('CSA') || code.startsWith('NET') || code.startsWith('SYS')) {
    return 'computer-systems-architecture';
  }
  if (code.startsWith('LSV') || code.startsWith('GEO') || code.startsWith('MAP')) {
    return 'land-surveying';
  }
  if (code.startsWith('BLD') || code.startsWith('CON') || code.startsWith('CIV')) {
    return 'building-construction';
  }
  
  return null; // Generic/shared modules
}

/**
 * Get department by ID
 */
export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find(d => d.id === id);
}

/**
 * Get department display name
 */
export function getDepartmentName(id: string): string {
  const dept = getDepartmentById(id);
  return dept?.name || 'All Departments';
}
