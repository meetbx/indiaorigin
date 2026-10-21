import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetSlug = Array.isArray(resolvedParams.slug) 
      ? resolvedParams.slug[resolvedParams.slug.length - 1] 
      : resolvedParams.slug;

    if (!targetSlug) {
      return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 });
    }

    // 1. Fetch main category
    const categoryResult = await sql`
      SELECT 
        id, parent_id, name, slug, description, image_url, icon_url
      FROM categories
      WHERE slug = ${targetSlug} AND is_active = true
      LIMIT 1;
    `;

    if (categoryResult.length === 0) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const currentCategory = categoryResult[0];

    // 2. Fetch raw data
    const [children, banners, recommendations] = await Promise.all([
      sql`
        SELECT id, name, slug, image_url, icon_url
        FROM categories
        WHERE parent_id = ${currentCategory.id} AND is_active = true
        ORDER BY sort_order ASC;
      `,
      sql`
        SELECT id, title, subtitle, image_url, link_url
        FROM category_banners
        WHERE category_id = ${currentCategory.id} AND is_active = true
        ORDER BY sort_order ASC;
      `,
      sql`
        SELECT id, name, target_slug, image_url, badge_text
        FROM category_recommendations
        WHERE category_id = ${currentCategory.id} AND is_active = true
        ORDER BY sort_order ASC;
      `
    ]);

    // 3. Normalize recommendation keys for React UI component compatibility
    const formattedRecommendations = recommendations.map((rec: Record<string, unknown>) => {
      const img = rec.image_url || rec.imageUrl || rec.image || rec.iconUrl || rec.icon;
      return {
        ...rec,
        id: rec.id,
        name: rec.name,
        targetSlug: rec.target_slug || rec.targetSlug,
        badgeText: rec.badge_text || rec.badgeText || rec.badge,
        // Bind image URL to all common component property names
        image_url: img,
        imageUrl: img,
        image: img,
        iconUrl: img,
        icon: img,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        category: currentCategory,
        children,
        banners,
        recommendations: formattedRecommendations
      }
    });
  } catch (err) {
    console.error('Failed to fetch category details:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}