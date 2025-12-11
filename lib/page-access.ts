import { createClient } from './supabase-server';

// หน้าทั้งหมดในระบบ
export type PageName =
  | 'dashboard'
  | 'tasks'
  | 'projects'
  | 'team'
  | 'clients'
  | 'settings';

// Cache for user page access per request
const pageAccessCache = new Map<string, Set<PageName>>();

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: No authenticated user');
  }

  return user;
}

/**
 * Get all pages user can access (cached)
 */
export async function getUserPageAccess(userId: string): Promise<Set<PageName>> {
  // Check cache first
  if (pageAccessCache.has(userId)) {
    return pageAccessCache.get(userId)!;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_page_access')
    .select('page_name')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching page access:', error);
    const emptySet = new Set<PageName>();
    pageAccessCache.set(userId, emptySet);
    return emptySet;
  }

  const pages = new Set(data.map((row) => row.page_name as PageName));
  pageAccessCache.set(userId, pages);
  return pages;
}

/**
 * Check if user has access to a specific page (returns boolean)
 */
export async function hasPageAccess(pageName: PageName): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const pages = await getUserPageAccess(user.id);
    return pages.has(pageName);
  } catch {
    return false;
  }
}

/**
 * Require page access - throws error if user can't access
 */
export async function requirePageAccess(pageName: PageName): Promise<void> {
  const user = await getCurrentUser();
  const pages = await getUserPageAccess(user.id);

  if (!pages.has(pageName)) {
    throw new Error(`Access denied: Cannot access page '${pageName}'`);
  }
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
}

/**
 * Clear page access cache
 */
export function clearPageAccessCache(userId?: string) {
  if (userId) {
    pageAccessCache.delete(userId);
  } else {
    pageAccessCache.clear();
  }
}
