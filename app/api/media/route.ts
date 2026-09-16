import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const imagesDir = path.join(process.cwd(), 'public', 'tss-images');
  try {
    const files = await fs.readdir(imagesDir);
    const urls = files
      .filter((name) => /\.(png|jpe?g|gif|webp)$/i.test(name))
      .map((name) => `/tss-images/${encodeURIComponent(name)}`);
    return NextResponse.json(urls);
  } catch (error) {
    console.error('Failed to read media folder', error);
    return NextResponse.json([]);
  }
}
