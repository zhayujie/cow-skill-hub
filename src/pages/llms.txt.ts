import type { APIRoute } from 'astro';
import { getSiteConfig } from '@/config/site';
import { getAllSkills } from '@/data/db';
import { getInstallCommand } from '@/data/skills';
import { getAppContext } from '@/server/context';
import { localizePath, t } from '@/i18n';

function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export const GET: APIRoute = async ({ locals, url }) => {
  const site = getSiteConfig(locals);
  const origin = site.siteUrl || url.origin;
  const db = (await getAppContext(locals)).db;
  const skills = await getAllSkills(db);

  const lines: string[] = [
    `# ${site.brandName}`,
    '',
    `> ${site.description || t('en').defaultDescription(site.agentName)}`,
    '',
    `Every skill can be installed with the ${site.agentName} CLI, or by sending the install command to ${site.agentName} in chat:`,
    '',
    '```bash',
    `${site.cliName} skill install <name>`,
    '```',
    '',
    `Each skill page is available in Chinese (${origin}/<name>) and English (${origin}/en/<name>).`,
    '',
    '## Skills',
    '',
  ];

  for (const s of skills) {
    const nameEn = s.displayNameEn?.trim();
    const descEn = s.descriptionEn?.trim();
    const title = nameEn && nameEn !== s.displayName ? `${s.displayName} (${nameEn})` : s.displayName;
    const desc = oneLine(descEn && descEn !== s.description ? `${s.description} / ${descEn}` : s.description);
    const cmd = getInstallCommand(s, site.cliName);
    lines.push(`- [${title}](${origin}${localizePath(`/${s.name}`, 'zh')}): ${desc} Install: \`${cmd}\``);
  }

  const links: string[] = [];
  if (site.showBrandLinks && site.docsUrl) links.push(`- [Skill Hub docs](${site.docsUrl})`);
  if (site.showBrandLinks && site.brandUrl) links.push(`- [${site.agentName}](${site.brandUrl})`);
  if (site.githubUrl) links.push(`- [Source code](${site.githubUrl})`);
  links.push(`- [Submit a skill](${origin}/submit)`);
  lines.push('', '## Links', '', ...links, '');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
