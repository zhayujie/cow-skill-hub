import { defineMiddleware } from 'astro:middleware';
import { verifyJwt } from '@/lib/jwt';
import { getSecrets } from '@/pages/api/_utils';
import { DEFAULT_LANG, LANG_COOKIE, isLang, localizePath, splitLangPrefix } from '@/i18n';

// Crawlers, link previewers and scripted clients must always get the URL they
// asked for, otherwise search engines would see default-language pages
// redirect away and drop them from the index.
const NON_BROWSER_UA =
  /bot|crawl|spider|slurp|archiver|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|lighthouse|headless|phantom|inspectiontool|mediapartners|feedfetcher|python|curl|wget|httpx|go-http|java\/|okhttp|node-fetch|axios|undici|libwww|scrapy|chatgpt|gpt|claude|anthropic|perplexity|bytespider|baidu|sogou|yandex|petal|360spider|duckduck/i;

function isPageRequest(pathname: string): boolean {
  if (pathname.startsWith('/api/') || pathname.startsWith('/_')) return false;
  return !/\.[a-z0-9]+$/i.test(pathname);
}

/**
 * Decide whether a visitor on a default-language URL should be sent to the
 * English version. An explicit choice (cookie) always wins; otherwise only real
 * browsers whose Accept-Language lists no Chinese at all are redirected.
 */
function prefersEnglish(request: Request, cookieLang: string | undefined): boolean {
  if (isLang(cookieLang)) return cookieLang === 'en';
  const ua = request.headers.get('user-agent') || '';
  if (!ua.startsWith('Mozilla/') || NON_BROWSER_UA.test(ua)) return false;
  const al = (request.headers.get('accept-language') || '').toLowerCase();
  const langs = al
    .split(',')
    .map((part) => part.split(';')[0].trim())
    .filter((tag) => /^[a-z]{2,3}(-|$)/.test(tag));
  if (langs.length === 0) return false;
  return !langs.some((tag) => tag === 'zh' || tag.startsWith('zh-'));
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.lang = DEFAULT_LANG;

  const secret = (await getSecrets(context.locals)).JWT_SECRET;
  const token = context.cookies.get('cow_token')?.value;

  if (typeof secret === 'string' && secret.length > 0 && token) {
    const payload = await verifyJwt(token, secret);
    if (payload) {
      context.locals.user = {
        sub: payload.sub,
        username: payload.username,
        name: payload.name,
        avatar: payload.avatar,
      };
    }
  }

  const { pathname, search } = context.url;
  if (!isPageRequest(pathname)) return next();

  const { lang, path } = splitLangPrefix(pathname);
  if (lang !== DEFAULT_LANG) {
    if (pathname === `/${lang}`) return context.redirect(`/${lang}/${search}`, 301);
    // Only pages are localized; prefixed API/asset paths fall through to 404.
    if (!isPageRequest(path)) return next();
    context.locals.lang = lang;
    return next(`${path}${search}`);
  }

  const method = context.request.method;
  if (
    (method === 'GET' || method === 'HEAD') &&
    prefersEnglish(context.request, context.cookies.get(LANG_COOKIE)?.value)
  ) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${localizePath(pathname, 'en')}${search}`,
        Vary: 'Accept-Language, Cookie',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const response = await next();
  if ((response.headers.get('content-type') || '').includes('text/html')) {
    try {
      response.headers.append('Vary', 'Accept-Language, Cookie');
    } catch {
      /* immutable headers */
    }
  }
  return response;
});
