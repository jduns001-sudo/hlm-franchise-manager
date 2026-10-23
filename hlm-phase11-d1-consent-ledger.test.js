'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const {createD1ConsentLedger, INSERT} = require('./hlm-phase11-d1-consent-ledger.js');
// This is a contract test double, not evidence of real D1 concurrency semantics.
function fakeD1(revision='r1') {
  const seen = new Set(); let fail = false;
  return {
    seen, outage(v) { fail=v; },
    prepare(sql) { assert.equal(sql, INSERT); return {bind(...args) {return {args};}}; },
    async batch([stmt]) {
      if (fail) throw Error('db unavailable');
      const [id,,team,rev,guardTeam,guardRev] = stmt.args;
      if (seen.has(id)) throw Error('UNIQUE constraint');
      if (team !== guardTeam || rev !== guardRev || team !== 'cpu' || rev !== revision) return [{success:true,meta:{changes:0}}];
      seen.add(id); return [{success:true,meta:{changes:1}}];
    }
  };
}
const binding={proposalDigest:'digest',teamId:'cpu',stateRevision:'r1'};
test('first consumption succeeds, replay fails',async()=>{const db=fakeD1(),l=createD1ConsentLedger(db);assert.equal(await l.consumeOnce('d1',binding),true);assert.equal(await l.consumeOnce('d1',binding),false);assert.equal(db.seen.size,1);});
test('stale revision fails closed without consuming',async()=>{const db=fakeD1('r2'),l=createD1ConsentLedger(db);assert.equal(await l.consumeOnce('d2',binding),false);assert.equal(db.seen.size,0);});
test('database outage and invalid input fail closed',async()=>{const db=fakeD1(),l=createD1ConsentLedger(db);db.outage(true);assert.equal(await l.consumeOnce('d3',binding),false);db.outage(false);assert.equal(await l.consumeOnce('',binding),false);assert.equal(db.seen.size,0);});
test('requires a D1-like interface',()=>assert.throws(()=>createD1ConsentLedger({}),TypeError));
