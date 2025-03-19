import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const filePath = path.join(process.cwd(), ...params.path);
    const fileContents = await fs.readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filePath);
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.json':
        contentType = 'application/json';
        break;
      case '.bin':
        contentType = 'application/octet-stream';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    );
  }
}
