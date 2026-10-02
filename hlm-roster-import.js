// HLM 27 roster importer
// Imports the starting roster once, then leaves your franchise data alone.

(async function () {
  const KEY = "hlm_tracker_v3";
  const IMPORT_FLAG = "hlm_roster_imported_2026";

  try {
    // If the roster has already been imported, go straight to the app.
    if (localStorage.getItem(IMPORT_FLAG) === "1") {
      window.location.replace("./app.html");
      return;
    }

    const response = await fetch("./hlm-roster-2026.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        "Could not load hlm-roster-2026.json (" + response.status + ")"
      );
    }

    const roster = await response.json();

    const old = JSON.parse(
      localStorage.getItem(KEY) || "{}"
    );

    const db = {
      players: Array.isArray(roster.players)
        ? roster.players
        : [],

      teams: Array.isArray(roster.teams)
        ? roster.teams
        : [],

      seasons: Array.isArray(old.seasons)
        ? old.seasons
        : [],

      awards: Array.isArray(old.awards)
        ? old.awards
        : [],

      transactions: Array.isArray(old.transactions)
        ? old.transactions
        : [],

      draftPicks: Array.isArray(roster.draftPicks) && roster.draftPicks.length
        ? roster.draftPicks
        : Array.isArray(old.draftPicks)
          ? old.draftPicks
          : [],

      prospects: Array.isArray(old.prospects)
        ? old.prospects
        : [],

      draftClasses: Array.isArray(old.draftClasses)
        ? old.draftClasses
        : [],

      gmSettings: old.gmSettings || {},

      contracts: Array.isArray(old.contracts)
        ? old.contracts
        : [],

      snapshot: old.snapshot || {},

      franchiseName:
        old.franchiseName || "HLM 27 Franchise"
    };

    localStorage.setItem(
      KEY,
      JSON.stringify(db)
    );

    localStorage.setItem(
      IMPORT_FLAG,
      "1"
    );

    window.location.replace("./app.html");

  } catch (error) {

    document.body.innerHTML = `
      <div style="
        font-family:system-ui;
        padding:24px;
        color:white;
        background:#07111f;
        min-height:100vh
      ">
        <h2>🏒 Roster Import Failed</h2>
        <p>${String(error.message || error)}</p>
        <p>
          Make sure
          <b>hlm-roster-2026.json</b>
          is in the same GitHub folder.
        </p>
      </div>
    `;
  }
})();
