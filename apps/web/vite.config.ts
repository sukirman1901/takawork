import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { sceneDocument, sceneModule } from './legacy-office';
const require=createRequire(import.meta.url);
const legacy=fileURLToPath(new URL('../../kantor-sim.html',import.meta.url));
const characters=fileURLToPath(new URL('../../character-model.js',import.meta.url));
const scenePlugin:Plugin={
  name:'nusaiba-original-office',
  resolveId(id:string){if(id==='virtual:nusaiba-scene')return '\0nusaiba-scene';},
  load(id:string){
    if(id!=='\0nusaiba-scene')return;
    this.addWatchFile(legacy);this.addWatchFile(characters);
    const controls=readFileSync(require.resolve('three-office/examples/js/controls/OrbitControls.js'),'utf8');
    const model=readFileSync(characters,'utf8');
    return `import * as NativeThree from 'three-office';
      const THREE={...NativeThree};
      (function(THREE){${controls}\n})(THREE);
      const OfficeCharacters=(function(THREE){${model}\nreturn OfficeCharacters;})(THREE);
      ${sceneModule(readFileSync(legacy,'utf8'))}
      export function boot(hooks){
        const bank={createCharacter(look,resources){
          const rig=OfficeCharacters.createCharacter(look,resources);
          const config=look.avatar;
          if(config){
            const face=rig.head.getObjectByName('face');
            if(config.head==='soft'){face.geometry=resources.geometry('SphereGeometry',.20,8,8);face.scale.y=1.05;}
            rig.head.traverse(part=>{if(part.name==='eyebrow'&&config.brows==='soft')part.rotation.z=part.position.x>0?-.09:.09;});
            if(config.eyes==='slim')rig.eyes.forEach(eye=>{eye.children[0].scale.set(1.47,.57,1);});
          }
          return rig;
        }};
        return initialize(THREE,bank,hooks);
      }`;
  },
  transformIndexHtml:{order:'pre' as const,handler(html:string,ctx:{filename:string}){
    return ctx.filename.endsWith('/office.html')?sceneDocument(readFileSync(legacy,'utf8')):html;
  }},
};
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [scenePlugin,react()],
  build:{rollupOptions:{input:{app:fileURLToPath(new URL('./index.html',import.meta.url)),office:fileURLToPath(new URL('./office.html',import.meta.url))}}},
  server: { port: 5173, fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } },
});
