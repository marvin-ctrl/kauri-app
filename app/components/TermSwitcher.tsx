'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Term = { id: string; year: number; term: number };

export default function TermSwitcher() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('terms').select('id,year,term').order('year', { ascending: false }).order('term', { ascending: true });
      const list = data || [];
      setTerms(list);
      const saved = typeof window !== 'undefined' ? localStorage.getItem('kauri.termId') : null;
      const defaultId = saved && list.find(t => t.id === saved) ? saved : (list[0]?.id || '');
      if (defaultId) {
        setTermId(defaultId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kauri.termId', defaultId);
        }
      }
    })();
  }, []);

  function change(id: string) {
    setTermId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kauri.termId', id);
      // Dispatch custom event for other components to react to term change
      window.dispatchEvent(new CustomEvent('termChanged', { detail: id }));
      // Reload to refresh data - consider using router.refresh() in the future
      location.reload();
    }
  }

  if (!terms.length) return (
    <a href="/terms/new" className="px-3 py-2 text-sm rounded bg-[#79CBC4] text-white hover:bg-[#68b8b0] transition-colors shadow-sm font-semibold">Add term</a>
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
      <a href="/terms" className="text-sm underline text-[#79CBC4] hover:text-[#68b8b0] transition-colors">Manage</a>
    </div>
  );
}
