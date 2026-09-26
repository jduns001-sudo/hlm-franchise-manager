// HLM 27 roster importer for HLM Franchise Manager
// Loads the exported roster package and seeds the tracker's local database.
(async function(){
  try {
    const res = await fetch('./hlm-roster-2026.json', {cache:'no-store'});
    if(!res.ok) throw new Error('Roster file could not be loaded ('+res.status+').');
    const roster = await res.json();
    const KEY = 'hlm_tracker_v3';
    const old = JSON.parse(localStorage.getItem(KEY) || '{}');
    const db = {
      players: Array.isArray(roster.players) ? roster.players : [],
      teams: Array.isArray(roster.teams) ? roster.teams : [],
      seasons: Array.isArray(old.seasons) ? old.seasons : [],
      awards: Array.isArray(old.awards) ? old.awards : [],
      transactions: Array.isArray(old.transactions) ? old.transactions : [],
      draftPicks: Array.isArray(old.draftPicks) ? old.draftPicks : [],
      prospects: Array.isArray(old.prospects) ? old.prospects : [],
      draftClasses: Array.isArray(old.draftClasses) ? old.draftClasses : [],
      gmSettings: old.gmSettings || {},
      contracts: Array.isArray(old.contracts) ? old.contracts : [],
      snapshot: old.snapshot || {},
      franchiseName: old.franchiseName || 'HLM 27 Franchise'
    };
    localStorage.setItem(KEY, JSON.stringify(db));
    localStorage.setItem('hlm_roster_imported_2026', String(Date.now()));
    window.location.replace('./app.html');
  } catch(err) {
    document.body.innerHTML = '<div style="font-family:system-ui;padding:24px"><h2>Roster import failed</h2><p>'+String(err.message||err)+'</p><p>Make sure <b>hlm-roster-2026.json</b> is in the same GitHub folder as this file.</p></div>';
  }
})();
