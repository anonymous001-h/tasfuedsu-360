import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EngagementTarget } from '@/types';

interface EngagementCounts {
  [targetId: string]: { likes: number; comments: number };
}

export function useEngagementCounts(targetType: EngagementTarget, targetIds: string[]) {
  const [counts, setCounts] = useState<EngagementCounts>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (targetIds.length === 0) {
      setLoading(false);
      return;
    }

    const [likesRes, commentsRes] = await Promise.all([
      supabase.from('likes').select('target_id').eq('target_type', targetType).in('target_id', targetIds),
      supabase.from('comments').select('target_id').eq('target_type', targetType).in('target_id', targetIds),
    ]);

    const map: EngagementCounts = {};
    (likesRes.data || []).forEach((l) => {
      const id = l.target_id;
      if (!map[id]) map[id] = { likes: 0, comments: 0 };
      map[id].likes++;
    });
    (commentsRes.data || []).forEach((c) => {
      const id = c.target_id;
      if (!map[id]) map[id] = { likes: 0, comments: 0 };
      map[id].comments++;
    });
    setCounts(map);
    setLoading(false);
  }, [targetType, targetIds.join(',')]);

  useEffect(() => { load(); }, [load]);

  return { counts, loading, refresh: load };
}
