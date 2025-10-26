'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

type Term = { id: string; year: number; term: number };

export default function TermSwitcher() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState<string>('');
  const supabase = useSupabase();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('terms')
        .select('id,year,term')
        .order('year', { ascending: false })
        .order('term', { ascending: true });

      const list = data || [];
      setTerms(list);

      // Safe localStorage access (SSR-compatible)
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TERM_ID);
        const defaultId = saved && list.find(t => t.id === saved) ? saved : (list[0]?.id || '');
        if (defaultId) {
          setTermId(defaultId);
          localStorage.setItem(LOCAL_STORAGE_KEYS.TERM_ID, defaultId);
        }
      }
    })();
  }, [supabase]);

  function change(id: string) {
    if (typeof window !== 'undefined') {
      setTermId(id);
      localStorage.setItem(LOCAL_STORAGE_KEYS.TERM_ID, id);
      // Use router.refresh() for soft reload instead of location.reload()
      router.refresh();
    }
  }

  if (!terms.length) return (
    <Link href="/terms/new" className="px-3 py-2 text-sm rounded bg-[#79CBC4] text-white hover:bg-[#68b8b0] transition-colors shadow-sm font-semibold">
      Add term
    </Link>
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[#5a718f] font-medium">Term</label>
      <select 
        value={termId} 
        onChange={e => change(e.target.value)} 
        className="border border-[#e2e8f0] rounded-md px-2 py-1 bg-white text-sm text-[#172F56] focus:border-[#79CBC4] focus:ring-2 focus:ring-[#79CBC4]/20 transition-all"
      >
        {terms.map(t => (
          <option key={t.id} value={t.id}>{t.year} • Term {t.term}</option>
        ))}
      </select>
      <Link href="/terms" className="text-sm underline text-[#79CBC4] hover:text-[#68b8b0] transition-colors">
        Manage
      </Link>
    </div>
  );
}
