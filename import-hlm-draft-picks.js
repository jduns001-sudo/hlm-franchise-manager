const fs = require('node:fs');
const path = require('node:path');

function readRows(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => ({
    line: index + 1,
    raw: line,
    fields: line.split(',')
  }));
}

function requiredInteger(value, label, file, line) {
  if (!/^-?\d+$/.test(value || '')) {
    throw new Error(`Invalid ${label} in ${file}:${line}`);
  }
  return Number(value);
}

function pickKey(league, originalTeamId, year, round) {
  return [league, originalTeamId, year, round].join('|');
}

function parseDate(value, line) {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (!match) throw new Error(`Invalid trade date in Trades.txt:${line}`);
  return { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]), value };
}

function compareTradeEvents(a, b) {
  return a.date.year - b.date.year
    || a.date.month - b.date.month
    || a.date.day - b.date.day
    || a.line - b.line;
}

function importDraftPicks(sourceDir) {
  const standardFile = path.join(sourceDir, 'Picks.txt');
  const customFile = path.join(sourceDir, 'Custom', 'Picks.txt');
  const teamsFile = path.join(sourceDir, 'Teams.txt');
  const tradesFile = path.join(sourceDir, 'Trades.txt');
  const pickRows = [
    ...readRows(standardFile).map(row => ({ ...row, sourceFile: 'Picks.txt' })),
    ...readRows(customFile).map(row => ({ ...row, sourceFile: 'Custom/Picks.txt' }))
  ];
  const teams = new Map();

  for (const row of readRows(teamsFile)) {
    const { fields, line } = row;
    if (fields.length < 4) throw new Error(`Invalid team record in Teams.txt:${line}`);
    const league = requiredInteger(fields[0], 'league', 'Teams.txt', line);
    const id = requiredInteger(fields[1], 'team ID', 'Teams.txt', line);
    teams.set(`${league}|${id}`, { name: fields[2], abbr: fields[3] });
  }

  const picksByKey = new Map();
  for (const row of pickRows) {
    const { fields, line, sourceFile } = row;
    if (fields.length < 5) throw new Error(`Invalid pick record in ${sourceFile}:${line}`);
    const league = requiredInteger(fields[0], 'league', sourceFile, line);
    const yearCode = requiredInteger(fields[1], 'year code', sourceFile, line);
    const originalTeamId = requiredInteger(fields[2], 'original team ID', sourceFile, line);
    const recordedOwnerId = requiredInteger(fields[3], 'recorded owner ID', sourceFile, line);
    const round = requiredInteger(fields[4], 'round', sourceFile, line);
    const year = 2000 + yearCode;
    const key = pickKey(league, originalTeamId, year, round);
    const record = {
      league,
      yearCode,
      year,
      originalTeamId,
      recordedOwnerId,
      round,
      sourceFile,
      sourceLine: line,
      raw: row.raw
    };
    if (!picksByKey.has(key)) picksByKey.set(key, []);
    picksByKey.get(key).push(record);
  }

  const tradesByKey = new Map();
  for (const row of readRows(tradesFile)) {
    const { fields, line } = row;
    if (fields.length < 5) throw new Error(`Invalid trade record in Trades.txt:${line}`);
    const league = requiredInteger(fields[0], 'league', 'Trades.txt', line);
    const date = parseDate(fields[1], line);
    const sides = fields.slice(3, 5).map((side, index) => {
      const [teamValue, , pickList = ''] = side.split(';');
      return {
        teamId: requiredInteger(teamValue, 'trade team ID', 'Trades.txt', line),
        pickList,
        sideIndex: index
      };
    });

    for (const side of sides) {
      const receivingSide = sides.find(other => other.sideIndex !== side.sideIndex);
      for (const token of side.pickList.split('.').filter(Boolean)) {
        const match = /^(\d+):(\d+):(\d+):(\d+):(\d+):(\d+)$/.exec(token);
        if (!match) throw new Error(`Invalid pick token in Trades.txt:${line}`);
        const originalTeamId = Number(match[1]);
        const round = Number(match[2]);
        const year = Number(match[3]);
        const key = pickKey(league, originalTeamId, year, round);
        const event = {
          date,
          line,
          fromTeamId: side.teamId,
          toTeamId: receivingSide.teamId,
          token
        };
        if (!tradesByKey.has(key)) tradesByKey.set(key, []);
        tradesByKey.get(key).push(event);
      }
    }
  }

  return [...picksByKey.entries()].map(([key, records]) => {
    const [league, originalTeamId, year, round] = key.split('|').map(Number);
    const tradeHistory = (tradesByKey.get(key) || []).sort(compareTradeEvents);
    const recordedOwners = [...new Set(records.map(record => record.recordedOwnerId))];
    const currentTeamId = tradeHistory.length
      ? tradeHistory[tradeHistory.length - 1].toTeamId
      : recordedOwners.length === 1 ? recordedOwners[0] : null;
    const originalTeam = teams.get(`${league}|${originalTeamId}`);
    const currentTeam = currentTeamId == null ? null : teams.get(`${league}|${currentTeamId}`);

    return {
      league,
      yearCode: year - 2000,
      year,
      draftYear: year,
      round,
      originalTeamId,
      originalTeam: originalTeam?.abbr ?? null,
      currentTeamId,
      currentTeam: currentTeam?.abbr ?? null,
      teamId: currentTeamId,
      sourceRecords: records,
      tradeHistory
    };
  });
}

function main() {
  const sourceDir = process.argv[2];
  const rosterFile = process.argv[3] || path.join(__dirname, 'hlm-roster-2026.json');
  if (!sourceDir) {
    throw new Error('Usage: node import-hlm-draft-picks.js <extracted-HLM-source-dir> [roster-json]');
  }

  const roster = JSON.parse(fs.readFileSync(rosterFile, 'utf8'));
  const picks = importDraftPicks(sourceDir);
  roster.draftPicks = picks;
  fs.writeFileSync(rosterFile, `${JSON.stringify(roster)}\n`);

  const unresolved = picks.filter(pick => pick.currentTeamId == null).length;
  console.log(`Imported ${picks.length} unique draft picks; ${unresolved} have unresolved ownership.`);
}

if (require.main === module) main();

module.exports = { importDraftPicks };
