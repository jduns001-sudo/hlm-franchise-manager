'use strict';
// Mission 1637: local Miniflare/D1 TEST FIXTURE ONLY. Not a network service,
// signer, protected verifier, live settlement path or production authority.
const {createIsolatedCPUTradeCandidate}=require('./hlm-phase9-cpu-isolated-trade-candidate');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const schema=`
CREATE TABLE IF NOT EXISTS m1637_isolated_state (
 slot TEXT PRIMARY KEY NOT NULL,
 revision TEXT NOT NULL,
 state_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS m1637_consumed_decisions (
 decision_id TEXT PRIMARY KEY NOT NULL,
 slot TEXT NOT NULL,
 proposal_digest TEXT NOT NULL,
 previous_revision TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS m1637_guard_decision BEFORE INSERT ON m1637_consumed_decisions
WHEN NOT EXISTS (
 SELECT 1 FROM m1637_isolated_state WHERE slot=NEW.slot
 AND revision=NEW.previous_revision
)
BEGIN SELECT RAISE(ABORT,'stale isolated state'); END;
`;
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false,productionTouched:false,experimental:true});
function assertDb(db){if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')throw Error('Local D1 required')}
async function initialize(db,slot,revision,state){
 assertDb(db);
 if(typeof slot!=='string'||!slot||typeof revision!=='string'||!revision||!validateGameStateEnvelope(state).valid)throw Error('Invalid isolated fixture');
 // D1 exec's SQL splitter cannot safely parse a trigger body. Use prepared
 // CREATE TABLE statements, then a separately prepared trigger statement.
 const statements=schema.split('CREATE TRIGGER IF NOT EXISTS');
 await db.prepare(statements[0].split(';')[0].trim()).run();
 await db.prepare(statements[0].split(';')[1].trim()).run();
 await db.prepare('CREATE TRIGGER IF NOT EXISTS'+statements[1].trim()).run();
 await db.prepare('INSERT INTO m1637_isolated_state(slot,revision,state_json) VALUES (?,?,?)').bind(slot,revision,JSON.stringify(state)).run();
}
async function read(db,slot){
 assertDb(db);
 const row=await db.prepare('SELECT revision,state_json FROM m1637_isolated_state WHERE slot=?').bind(slot).first();
 return row?{revision:row.revision,state:JSON.parse(row.state_json)}:null;
}
async function settle(db,request){
 assertDb(db);
 // This opt-in marker is a test harness constraint, NOT authentication.
 if(request?.localTestFixture!==true)return deny('local-test-only');
 if(request.gmAction!=='approve')return deny('gm-cancelled-or-declined');
 if(request.cpuFixtureDecision!=='accept')return deny('cpu-declined-or-unverified');
 const {slot,expectedRevision,nextRevision,decisionId,proposalDigest,teamId,input}=request;
 if(![slot,expectedRevision,nextRevision,decisionId,proposalDigest,teamId].every(x=>typeof x==='string'&&x.length>0)||
 expectedRevision===nextRevision||!input||typeof input!=='object')return deny('invalid-request');
 try{
  const prior=await read(db,slot);
  if(!prior||prior.revision!==expectedRevision)return deny('stale-revision');
  if(input.humanGMApproved!==true)return deny('gm-approval-required');
  // Recompute from D1-owned source state. Never persist caller-provided candidate.
  const candidate=createIsolatedCPUTradeCandidate(prior.state,teamId,input).candidateState;
  if(!validateGameStateEnvelope(candidate).valid)return deny('invalid-candidate');
  const insert=db.prepare('INSERT INTO m1637_consumed_decisions(decision_id,slot,proposal_digest,previous_revision) VALUES (?,?,?,?)').bind(decisionId,slot,proposalDigest,expectedRevision);
  const update=db.prepare('UPDATE m1637_isolated_state SET revision=?,state_json=? WHERE slot=? AND revision=?').bind(nextRevision,JSON.stringify(candidate),slot,expectedRevision);
  // D1 batch is transactional: the trigger rejects stale revisions, and the
  // unique decision key rejects replay. Both statements must report one change.
  const result=await db.batch([insert,update]);
  if(result?.length!==2||result.some(r=>r?.success!==true||r?.meta?.changes!==1))
   return deny('transaction-result-unverified');
  return Object.freeze({ok:true,code:'local-fixture-committed',saved:true,settlementAuthorized:false,productionTouched:false,experimental:true,revision:nextRevision});
 }catch{return deny('transaction-aborted-or-replayed')}
}
module.exports=Object.freeze({schema,initialize,read,settle});
