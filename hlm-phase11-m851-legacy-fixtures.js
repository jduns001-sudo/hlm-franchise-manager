'use strict';
// Mission 851: synthetic, read-only legacy save fixtures. No browser storage access.
const legacyV5 = Object.freeze({
 schema:5, settings:{controlledTeamId:42, season:2026},
 roster:[{id:101,teamId:42,position:'C',overall:82}],
 contracts:[{playerId:101,capHit:2500000,years:3}],
 draftPicks:[{year:2027,round:1,ownerId:42,originalOwnerId:42}],
 prospects:[{id:202,teamId:42,potential:'Elite'}],
 history:[{year:2025,wins:41,losses:29}],
 transactions:[{type:'trade',playerId:101,year:2025}],
 extraDraftPicks:[], customPlayers:[], playerOverrides:{}, draftPickOverrides:{},
 decisions:[],lines:{},depth:{},draftBoard:[],waivers:[],notes:'fixture'
});
const clone = value => JSON.parse(JSON.stringify(value));
module.exports={legacyV5,clone};
