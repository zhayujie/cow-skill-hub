import type { APIRoute } from 'astro';
import { json } from '../_utils';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ user: null }, 200);
  }
  return json({
    user: {
      sub: user.sub,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    },
  });
};
