'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PlayerRow = {
  player_term_id: string | null;
  player_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  status: string; // 'registered' | 'unregistered'
};

export default function AssignPlayersToTeamPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const router = useRouter();

  const [teamName, setTeamName] = useState<string>('');
  const [teamTermId, setTeamTermId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // player_term_id set
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setMsg(null);
      const termId = localStorage.getItem('kauri.termId');
      if (!termId) { setMsg('Select a term in the header.'); return; }

      // team name
      const t = await supabase.from('teams').select('name').eq('id', teamId).maybeSingle();
      setTeamName(t.data?.name || 'Team');

      // ensure team_terms
      const tt = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', String(teamId))
        .eq('term_id', termId)
        .maybeSingle();

      let ttId = tt.data?.id as string | undefined;
      if (!ttId) {
        const ins = await supabase
          .from('team_terms')
          .insert({ team_id: String(teamId), term_id: termId })
          .select('id')
          .single();
        if (ins.error || !ins.data) { setMsg(ins.error?.message || 'Failed to create team shell'); return; }
        ttId = ins.data.id;
      }
      setTeamTermId(ttId!);

      // ------------- AUTO-REGISTER LOGIC -------------
      // 1) load all players
      const all = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no');

      const allPlayers = all.data || [];

      // 2) load player_terms for this term
      const existingPT = await supabase
        .from('player_terms')
        .select('id, player_id')
        .eq('term_id', termId);

      const havePT = new Map<string, string>(); // player_id -> player_term_id
      (existingPT.data || []).forEach(r => havePT.set(r.player_id as string, r.id as string));

      // 3) insert missing player_terms in small batches
      const missing = allPlayers.filter(p => !havePT.has(p.id));
      while (missing.length) {
        const batch = missing.splice(0, 500).map(p => ({
          player_id: p.id,
          term_id: termId,
          status: 'registered'
        }));
        if (batch.length) {
          const ins = await supabase.from('player_terms').insert(batch).select('id, player_id');
          if (ins.error) { setMsg(`Error registering players: ${ins.error.message}`); return; }
          (ins.data || []).forEach((r: any) => havePT.set(r.player_id, r.id));
        }
      }

      // 4) build unified list
      const list: PlayerRow[] = allPlayers.map((p: any) => ({
        player_term_id: havePT.get(p.id) || null,
        player_id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        preferred_name: p.preferred_name,
        jersey_no: p.jersey_no,
        status: 'registered'
      }));

      setPlayers(list);

      // 5) preselect existing memberships
      const cur = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', ttId!);

      const pre = new Set((cur.data || []).map(r => r.player_term_id as string));
      setSelected(pre);
    })();
  }, [teamId]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return players.filter(p => {
      if (!t) return true;
      const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase();
      return name.includes(t) || String(p.jersey_no ?? '').includes(t);
    });
  }, [players, q]);

  function toggle(ptid: string) {
    const next = new Set(selected);
    if (next.has(ptid)) next.delete(ptid); else next.add(ptid);
    setSelected(next);
  }

  function toggleAll(ids: string[], on: boolean) {
    const next = new Set(selected);
    ids.forEach(id => on ? next.add(id) : next.delete(id));
    setSelected(next);
  }

  async function save() {
    setMsg(null);
    const termId = localStorage.getItem('kauri.termId');
    if (!termId) { setMsg('Select a term in the header.'); return; }
    if (!teamTermId) { setMsg('Missing team-term. Reload.'); return; }

    setSaving(true);
    try {
      // ensure every selected row has aassistant жок
