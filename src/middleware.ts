import { defineMiddleware } from 'astro:middleware';
import { verifyJwt } from '@/lib/jwt';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

  const secret = context.locals.runtime?.env?.JWT_SECRET;
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
