import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { MODULES } from '@/lib/modules';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { moduleSlug, noteTitle, noteContent } = body;

    if (!moduleSlug || !noteContent) {
      return NextResponse.json(
        { success: false, error: 'Module slug and note content are required.' },
        { status: 400 }
      );
    }

    const moduleMeta = MODULES.find((m) => m.slug === moduleSlug);
    if (!moduleMeta) {
      return NextResponse.json(
        { success: false, error: `Module not found for slug: ${moduleSlug}` },
        { status: 404 }
      );
    }

    const docsDir = process.env.DOCS_DIR || path.resolve(process.cwd(), '..');
    const targetFile = path.join(docsDir, moduleMeta.fileName);

    if (!fs.existsSync(targetFile)) {
      return NextResponse.json(
        { success: false, error: `Target markdown file not found: ${moduleMeta.fileName}` },
        { status: 404 }
      );
    }

    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const formattedBlock = `\n\n---\n\n## 📝 Personal Study Notes: ${noteTitle || 'Untitled Note'}\n\n> **Created via Notes Studio on:** ${timestamp}  \n> **Target Module:** ${moduleMeta.title}\n\n${noteContent.trim()}\n`;

    fs.appendFileSync(targetFile, formattedBlock, 'utf-8');

    return NextResponse.json({
      success: true,
      fileName: moduleMeta.fileName,
      moduleTitle: moduleMeta.title,
      message: `Note successfully appended to ${moduleMeta.fileName}!`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
