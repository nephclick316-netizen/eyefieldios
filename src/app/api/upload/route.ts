export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseClient';
import { uploadFileToR2, generateFileKey } from '../../../lib/r2';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    let buffer: Uint8Array;
    let fileKey: string;
    let contentType: string;

    const contentTypeHeader = request.headers.get('content-type') || '';

    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json();
      const { filename, contentType: reqContentType, fileBase64 } = body;

      if (!fileBase64) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      contentType = reqContentType || 'application/octet-stream';
      fileKey = generateFileKey(user.id, filename || 'upload.bin');

      const binaryString = atob(fileBase64);
      const len = binaryString.length;
      buffer = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buffer[i] = binaryString.charCodeAt(i);
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = new Uint8Array(bytes);
      contentType = file.type;
      fileKey = generateFileKey(user.id, file.name);
    }

    const publicUrl = await uploadFileToR2(buffer, fileKey, contentType);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: fileKey
    });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}