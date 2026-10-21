import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const categories = await sql`
      SELECT id, name, slug, icon_url, sort_order
      FROM categories
      WHERE parent_id IS NULL AND is_active = true
      ORDER BY sort_order ASC, name ASC;
    `;

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Failed to fetch top-level categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load categories' },
      { status: 500 }
    );
  }
}