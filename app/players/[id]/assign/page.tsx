// inside app/players/[id]/assign/page.tsx submit()
const termId = localStorage.getItem('kauri.termId');
if (!termId) { setMsg('Select a term.'); setSaving(false); return; }

// 1) ensure player_terms exists
const pt = await supabase.from('player_terms')
  .select('id').eq('player_id', String(playerId)).eq('term_id', termId).maybeSingle();
let playerTermId = pt.data?.id as string | undefined;
if (!playerTermId) {
  const ins = await supabase.from('player_terms')
    .insert({ player_id: String(playerId), term_id: termId, status: 'registered' })
    .select('id').single();
  if (ins.error || !ins.data) { setMsg(`Error: ${ins.error?.message}`); setSaving(false); return; }
  playerTermId = ins.data.id;
}

// 2) ensure team_terms for each selected team
const teamTermIds: string[] = [];
for (const team_id of Array.from(selected)) {
  const tt = await supabase.from('team_terms')
    .select('id').eq('team_id', team_id).eq('term_id', termId).maybeSingle();
  if (tt.data?.id) teamTermIds.push(tt.data.id);
  else {
    const ins = await supabase.from('team_terms')
      .insert({ team_id, term_id: termId })
      .select('id').single();
    if (ins.error || !ins.data) { setMsg(`Error: ${ins.error?.message}`); setSaving(false); return; }
    teamTermIds.push(ins.data.id);
  }
}

// 3) insert memberships, avoid duplicates
const existing = await supabase.from('memberships')
  .select('team_term_id')
  .eq('player_term_id', playerTermId);
const existingSet = new Set((existing.data || []).map(r => r.team_term_id));

const rows = teamTermIds
  .filter(ttid => !existingSet.has(ttid))
  .map(ttid => ({ player_term_id: playerTermId!, team_term_id: ttid, role }));

if (rows.length) {
  const { error } = await supabase.from('memberships').insert(rows);
  if (error) { setMsg(`Error: ${error.message}`); setSaving(false); return; }
}

setSaving(false);
router.replace(`/players/${playerId}`);
