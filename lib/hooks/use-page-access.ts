'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { PageName } from '@/lib/page-access';

export function usePageAccess() {
  const [pages, setPages] = useState<Set<PageName>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPageAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's page access
        const { data, error } = await supabase
          .from('user_page_access')
          .select('page_name')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading page access:', error);
          setLoading(false);
          return;
        }

        const pageSet = new Set(data?.map((row) => row.page_name as PageName) || []);
        setPages(pageSet);
      } catch (error) {
        console.error('Error loading page access:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPageAccess();
  }, []);

  const hasAccess = (pageName: PageName): boolean => {
    return pages.has(pageName);
  };

  return {
    hasAccess,
    canAccess: hasAccess, // alias
    loading,
    pages: Array.from(pages),
  };
}
