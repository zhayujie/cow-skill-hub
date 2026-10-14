import type { APIRoute } from 'astro';
import { getSiteConfig } from '@/config/site';
import { getAllSkills } from '@/data/db';
import { getAppContext } from '@/server/context';
import { DEFAULT_LANG, HREFLANG, localizePath } from '@/i18n';
import type { Lang } from '@/i18n';

const LANGS: Lang[] = ['zh', 'en'];

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
}

export const GET: APIRoute = async ({ locals, url }) => {
  const origin = getSiteConfig(locals).siteUrl || url.origin;
  const db = (await getAppContext(locals)).db;
  const skills = await getAllSkills(db);

  const latest = skills.reduce<string | undefined>(
    (max, s) => (s.updatedAt && (!max || s.updatedAt > max) ? s.updatedAt : max),
    undefined,
  );
  const pages: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: latest },
    ...skills.map((s) => ({ path: `/${s.name}`, lastmod: s.updatedAt })),
  ];

  const entries: string[] = [];
  for (const page of pages) {
    const alternates = [
      ...LANGS.map((l) => ({ hreflang: HREFLANG[l], href: `${origin}${localizePath(page.path, l)}` })),
      { hreflang: 'x-default', href: `${origin}${localizePath(page.path, DEFAULT_LANG)}` },
    ]
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(a.href)}"/>`)
      .join('\n');
    for (const lang of LANGS) {
      entries.push(
        [
          '  <url>',
          `    <loc>${xmlEscape(`${origin}${localizePath(page.path, lang)}`)}</loc>`,
          page.lastmod ? `    <lastmod>${page.lastmod}</lastmod>` : '',
          alternates,
          '  </url>',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
