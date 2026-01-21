export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EXPLORE: '/explore',
  POSTS: '/posts',
  POST_NEW: '/posts/new',
  POST_DETAIL: (id: string) => `/posts/${id}` as const,
  POST_EDIT: (id: string) => `/posts/${id}/edit` as const,
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_USER: (username: string) => `/profile/${username}` as const,
  APPLICATIONS: '/applications',
  MATCHES: '/matches',
  MATCH_DETAIL: (id: string) => `/matches/${id}` as const,
  NOTIFICATIONS: '/notifications',
} as const;

export const PROTECTED_ROUTES = [
  '/posts/new',
  '/profile/edit',
  '/applications',
  '/matches',
  '/notifications',
];

export const AUTH_ROUTES = ['/login', '/register'];
