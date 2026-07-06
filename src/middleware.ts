import { defineMiddleware } from 'astro:middleware';
import { verifyJwt } from '@/lib/jwt';
import { getSecrets } from '@/pages/api/_utils';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

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

  return next();
});
