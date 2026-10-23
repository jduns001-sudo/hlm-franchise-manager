'use strict';
// Mission 1458: real local D1 engine acceptance through Miniflare (no Cloudflare account/deploy).
// Run: npm install --no-save miniflare@3 && node --test hlm-phase11-d1-local.integration.test.js
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {Miniflare}=require('miniflare');
const {createD1ConsentLedger}=require('./hlm-phase11-d1-consent-ledger.js');
const schema=fs.readFileSync(path.join(__dirname,'hlm-phase11-d1-consent-ledger.sql'),'utf8');
const binding={proposalDigest:'digest',teamId:'cpu',stateRevision:'r1'};
async function open(persistPath) {
  const mf=new Miniflare({modules:true,script:'export default {fetch() {return new Response("ok")}}',d1Databases:{DB:'test-db'},persistPath});
  return {mf,db:await mf.getD1Database('DB')};
}
test('real local D1 unique replay, revision guard, rollback and persisted restart',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-d1-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  let instance=await open(dir);
  try {
    await instance.db.exec(schema.split('\\n').filter(line => !line.trimStart().startsWith('--')).join('\\n'));
    await instance.db.prepare('INSERT INTO consent_state_revisions(team_id,state_revision) VALUES (?,?)').bind('cpu','r1').run();
    const ledger=createD1ConsentLedger(instance.db);
    const attempts=await Promise.all(Array.from({length:8},()=>ledger.consumeOnce('concurrent',binding)));
    assert.equal(attempts.filter(Boolean).length,1,'exactly one concurrent consent may be consumed');
    assert.equal((await instance.db.prepare('SELECT COUNT(*) AS n FROM consumed_cpu_decisions WHERE decision_id=?').bind('concurrent').first()).n,1);
    assert.equal(await ledger.consumeOnce('stale',{...binding,stateRevision:'r0'}),false);
    assert.equal((await instance.db.prepare('SELECT COUNT(*) AS n FROM consumed_cpu_decisions WHERE decision_id=?').bind('stale').first()).n,0);
    await instance.db.prepare('UPDATE consent_state_revisions SET state_revision=? WHERE team_id=?').bind('r2','cpu').run();
    assert.equal(await ledger.consumeOnce('revision-race',binding),false);
    // D1 batch must roll back an earlier insert when a later statement fails.
    await assert.rejects(instance.db.batch([
      instance.db.prepare('INSERT INTO consumed_cpu_decisions(decision_id,proposal_digest,team_id,state_revision) VALUES (?,?,?,?)').bind('rollback','digest','cpu','r2'),
      instance.db.prepare('INSERT INTO consumed_cpu_decisions(decision_id,proposal_digest,team_id,state_revision) VALUES (?,?,?,?)').bind('rollback','digest','cpu','r2')
    ]));
    assert.equal((await instance.db.prepare('SELECT COUNT(*) AS n FROM consumed_cpu_decisions WHERE decision_id=?').bind('rollback').first()).n,0);
  } finally {await instance.mf.dispose();}
  instance=await open(dir);
  try {
    const ledger=createD1ConsentLedger(instance.db);
    assert.equal(await ledger.consumeOnce('concurrent',binding),false,'replay must survive process restart');
    assert.equal((await instance.db.prepare('SELECT COUNT(*) AS n FROM consumed_cpu_decisions WHERE decision_id=?').bind('concurrent').first()).n,1);
  } finally {await instance.mf.dispose();}
});
