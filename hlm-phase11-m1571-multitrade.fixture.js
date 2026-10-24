'use strict';
// Synthetic acceptance data only. Never imported or auto-seeded by the app.
module.exports=function source(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},
 universe:{players:[{id:'pA',name:'Alex',teamId:'A'},{id:'pB',name:'Blair',teamId:'B'},{id:'pC',name:'Casey',teamId:'C'}],
 teams:[{id:'A',name:'Alpha'},{id:'B',name:'Beta'},{id:'C',name:'Gamma'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'},
 {playerId:'pC',teamId:'C',status:'active',aav:9,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100,C:100}},extensions:{tradeRosterLimits:{A:30,B:30,C:30}}};};
