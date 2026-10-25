// Reuse the tested source, not a second hand-maintained copy of the room.
// Checked anchors deliberately fail the build if the original changes incompatibly.
function replaceOnce(source:string, from:string, to:string) {
  if(source.split(from).length!==2) throw new Error(`Legacy office hook changed: ${from}`);
  return source.replace(from,to);
}
export function sceneDocument(html:string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')
    .replace(/\s+on\w+="[^"]*"/g,'')
    .replace(/<link\b[^>]*>/g,'')
    .replaceAll('#2f5d50','#141414')
    .replace('</head>',`<link rel="stylesheet" href="/src/fonts.css"><style>
      #topbar,#agent-detail-card,#bottom-ticker,#roster-bar,#spawn-modal{display:none!important}
      body{font-family:'IBM Plex Sans',system-ui,sans-serif}
      .bubble{font:12px/1.4 'IBM Plex Sans',system-ui,sans-serif;padding:5px 9px;border:1px solid #e8e8e8;border-radius:8px;color:#6b6b6b;max-width:180px;overflow:hidden;text-overflow:ellipsis;background:#fff;box-shadow:0 1px 3px #1414140a}
      .bubble b{font-size:12px;font-weight:500;color:#141414!important}
      .bubble span{display:block;font-size:11px;margin-top:2px}
      .bubble.compact span{display:block}
      .bubble b,.bubble span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bubble.selected{border-color:#a3a3a3;background:#f2f2f2}
      .bubble:focus-visible{outline:1px solid #141414;outline-offset:2px}
      .bubble.is-busy b::after{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:#98702b;margin-left:6px;vertical-align:middle}
      @media(max-width:599px){.bubble{padding:4px 7px}}
    </style></head>`)
    .replace('</body>','<script type="module" src="/src/office-entry.ts"></script></body>');
}
export function sceneModule(html:string) {
  const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  if(!script) throw new Error('Legacy office inline scene not found');
  let code=replaceOnce(script,'layoutDesks(ws.members.length + 1);','layoutDesks(6);');
  code=replaceOnce(code,'function generateWhiteboardTexture() {',"function generateWhiteboardTexture() { return new THREE.CanvasTexture(Object.assign(document.createElement('canvas'),{width:1024,height:512}));");
  code=replaceOnce(code,'function showDetailCard(data) {','function showDetailCard(data) { hooks.onSelect(data.id); return;');
  code=replaceOnce(code,'function bubbleTextFor(ag) {','function bubbleTextFor(ag) { return hooks.bubble(ag);');
  code=replaceOnce(code,'function renderRosterUI() {','function renderRosterUI() { syncBubbles(); return;');
  code=replaceOnce(code,'function focusAgent(id) {',"function focusAgent(id) { if(agents.some(a=>a.data.id===id))hooks.onSelect(id); return;");
  code=replaceOnce(code,'scene.add(group);',`const selection = new THREE.Mesh(sharedGeometry('RingGeometry', .45, .51, 40), new THREE.MeshBasicMaterial({color:0x141414,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));
      selection.name='selection-ring';selection.rotation.x=-Math.PI/2;selection.position.y=.018;selection.visible=false;
      group.add(selection);scene.add(group);`);
  code=replaceOnce(code,'ag.timer = 12 + Math.random() * 25;',`if (roll >= .5 && roll < .65) { planAgentTrip(ag, 'meeting'); ag.data.task='Suasana meja bersama'; }
            else if (roll >= .65 && roll < .75) { planAgentTrip(ag, 'lounge'); ag.data.task='Suasana istirahat'; }
            ag.timer = 12 + Math.random() * 25;`);
  code=replaceOnce(code,'updateAgentBehaviors(dt, nowSec);','if (hooks.motion()) updateAgentBehaviors(dt, nowSec);');
  code=replaceOnce(code,'tickSimulation(dt);','if (hooks.motion()) tickSimulation(dt);');
  code=replaceOnce(code,'const dt = Math.max(0, Math.min(0.08, (now - prevTime) / 1000));',
    'if (now - prevTime < 1000 / 30 || hooks.suspended()) return;\nconst dt = Math.max(0, Math.min(0.08, (now - prevTime) / 1000));');
  return `export function initialize(THREE, OfficeCharacters, hooks) {\n${code}\n
    // Module initialization owns startup instead of the legacy example workspace.
    window.onload = null;
    return {
      load(data) { const loaded=loadWorkspace(data); camera.updateMatrixWorld(); positionBubbles(); renderer.render(scene, camera); return loaded; }, agents,
      start() { drawWallClock(); renderer.render(scene,camera); animationStarted=true; prevTime=performance.now(); if(!document.hidden) animationFrame=requestAnimationFrame(animate); },
      camera(view) { window.setCameraView(view); camera.updateMatrixWorld(); positionBubbles(); renderer.render(scene,camera); },
      lighting: night => { if(night!==isNightMode) { window.toggleOfficeLighting(); renderer.render(scene,camera); } },
      select: id => { selectedAgentId=id; agents.forEach(a=>{const active=a.data.id===id;a.bubbleEl?.classList.toggle('selected',active);a.mesh.getObjectByName('selection-ring').visible=active;}); renderer.render(scene,camera); },
      resume: () => { prevTime=performance.now(); },
      board(draw) { draw(wbTexture.image); wbTexture.needsUpdate=true; renderer.render(scene,camera); },
    };
  }`;
}
