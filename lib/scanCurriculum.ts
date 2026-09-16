import fs from "fs";
import path from "path";

function slugify(s: string) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function getCurriculumFromFS() {
    const base = path.join(process.cwd(), "7 Curriculum");
    const result: any = { levels: [] };

    if (!fs.existsSync(base)) return result;

    const dirs = await fs.promises.readdir(base, { withFileTypes: true });

    for (const d of dirs) {
        if (!d.isDirectory()) continue;
        const name = d.name;
        const lower = name.toLowerCase();
        let id = "";
        if (lower.includes("level 3") || lower.includes("level3") || lower.includes("l3")) id = "l3";
        else if (lower.includes("level 4") || lower.includes("level4") || lower.includes("l4")) id = "l4";
        else if (lower.includes("level 5") || lower.includes("level5") || lower.includes("l5")) id = "l5";
        else continue; // skip unknown folders

        const levelPath = path.join(base, d.name);
        const entries = await fs.promises.readdir(levelPath, { withFileTypes: true });

        const tracks: any[] = [];
        for (const e of entries) {
            if (!e.isDirectory()) continue;
            const trackName = e.name;
            const trackPath = path.join(levelPath, e.name);
            const files = await fs.promises.readdir(trackPath, { withFileTypes: true });
            const modules: any[] = [];
            for (const f of files) {
                if (!f.isFile()) continue;
                const ext = path.extname(f.name).toLowerCase();
                if (![".pdf", ".txt", ".md"].includes(ext)) continue;
                const title = path.basename(f.name, ext);
                const moduleId = `${slugify(id)}-${slugify(trackName)}-${slugify(title)}`;
                // public destination dirs were copied to public/curriculum/L3|L4|L5 preserving subfolder names
                const levelPublic = id === "l3" ? "L3" : id === "l4" ? "L4" : "L5";
                const fileUrl = `/curriculum/${levelPublic}/${encodeURIComponent(trackName)}/${encodeURIComponent(f.name)}`;
                modules.push({ id: moduleId, title, file: f.name, fileUrl });
            }
            // sort modules alphabetically
            modules.sort((a, b) => a.title.localeCompare(b.title));
            tracks.push({ id: `${id}-${slugify(trackName)}`, name: trackName, modules });
        }

        // sort tracks by common order: Curriculum Structure, Specific, General, CCMs, others
        const orderWeight = (tname: string) => {
            const s = tname.toLowerCase();
            if (s.includes("curriculum")) return 0;
            if (s.includes("specific")) return 1;
            if (s.includes("general")) return 2;
            if (s.includes("ccm") || s.includes("ccms") || s.includes("cross")) return 3;
            return 10;
        };
        tracks.sort((a, b) => orderWeight(a.name) - orderWeight(b.name) || a.name.localeCompare(b.name));

        result.levels.push({ id, title: d.name, tracks });
    }

    // sort levels l3,l4,l5
    const order: Record<string, number> = { l3: 0, l4: 1, l5: 2 };
    result.levels.sort((a: any, b: any) => (order[a.id] ?? 9) - (order[b.id] ?? 9));

    return result;
}

export default getCurriculumFromFS;
