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
      const saved = localStorage.getItem('kauri.termId');
      const defaultId = saved && list.find(t => t.id === saved) ? saved : (list[0]?.id || '');
      if (defaultId) {
        setTermId(defaultId);
        localStorage.setItem('kauri.termId', defaultId);
      }
    })();
  }, []);

  function change(id: string) {
    setTermId(id);
    localStorage.setItem('kauri.termId', id);
    location.reload(); // simplest way to refresh pages to new scope
  }

  if (!terms.length) return (
    <a href="/terms/new" className="px-2 py-1 text-sm rounded bg-blue-700 text-white">Add term</a>
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-700">Term</label>
      <select value={termId} onChange={e => change(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-1 bg-white text-sm">
        {terms.map(t => (
          <option key={t.id} value={t.id}>{t.year} • Term {t.term}</option>
        ))}
      </select>
      <a href="/terms" className="text-sm underline text-blue-700">Manage</a>
    </div>
  );
}
