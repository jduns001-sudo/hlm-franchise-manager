/* Original, dependency-free line icons. No team or league artwork. */
(function(root){'use strict';
 const paths=Object.freeze({
  users:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1"/>',
  arrows:'<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m4 0h4M7 17h2m4 0h4"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  team:'<path d="M8 3h8l5 4-3 5-2-1v10H8V11l-2 1-3-5Z"/><path d="m9 3 3 4 3-4M10 14h4"/>',
  season:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m4 0h4M7 17h2m4 0h4"/>',
  moves:'<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  inbox:'<path d="m3 13 3-9h12l3 9v7H3Z"/><path d="M3 13h5l2 3h4l2-3h5"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9m4 13h4"/>',
  shield:'<path d="M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  puck:'<ellipse cx="12" cy="8" rx="9" ry="4"/><path d="M3 8v7c0 2 4 4 9 4s9-2 9-4V8"/>',
  rink:'<rect x="3" y="2" width="18" height="20" rx="6"/><path d="M3 12h18M3 7h18M3 17h18"/><circle cx="12" cy="12" r="3"/>',
  chart:'<path d="M3 3v18h18M7 17v-5m5 5V7m5 10V4"/>',
  trophy:'<path d="M7 3h10v5a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 13v5m-5 3v-3h10v3Z"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  filter:'<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  warning:'<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3v1"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  save:'<path d="M4 3h13l4 4v14H3V3Zm3 0v6h10V3M7 21v-8h10v8"/>',
  player:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
  lines:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="m6 7 5 10m7-10-5 10M7 5h10"/>',
  draft:'<path d="M5 3h14v18H5ZM9 7h6M9 11h6m-6 4h3"/><path d="m15 15 2 2 4-4"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  tools:'<path d="m14 6 4 4M3 21l8-8m2-10a6 6 0 0 0-6 8L3 15v6h6l4-4a6 6 0 0 0 8-6l-4 3-4-4Z"/>',
  trend:'<path d="m3 17 6-6 4 3 8-10m-6 0h6v6"/>',
  star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  hockey:'<path d="m7 3 7 14h6a2 2 0 0 1 0 4h-8L3 5"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>'
 });
 function svg(name,options={}){const size=Number.isFinite(options.size)?options.size:20;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" class="v1-icon" aria-hidden="true" focusable="false">'+(paths[name]||paths.info)+'</svg>';}
 function create(name,doc=root.document,options={}){const template=doc.createElement('template');template.innerHTML=svg(name,options);return template.content.firstElementChild;}
 root.HLMV1Icons=Object.freeze({svg,create,names:Object.freeze(Object.keys(paths))});
 if(typeof module==='object'&&module.exports)module.exports=root.HLMV1Icons;
})(typeof globalThis!=='undefined'?globalThis:this);
