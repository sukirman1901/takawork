import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Component, useEffect, useMemo, type ReactNode } from 'react';
import { buildAvatar, disposeAvatar } from '../../../packages/avatar/src/model';
import type { AvatarConfig } from '../../../packages/contracts/src';

class SceneBoundary extends Component<{ children: ReactNode }, { failed:boolean }> {
  state = { failed:false };
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? <div className="scene-error"><strong>Tampilan 3D tidak tersedia</strong><p>Daftar worker dan percakapan tetap dapat digunakan. Aktifkan WebGL lalu muat ulang untuk melihat kantor.</p></div> : this.props.children; }
}
function AvatarObject({config,seated=false}: {config:AvatarConfig;seated?:boolean}) {
  const object = useMemo(()=>buildAvatar(config,seated),[JSON.stringify(config),seated]);
  useEffect(()=>()=>disposeAvatar(object),[object]);
  return <primitive object={object} dispose={null}/>;
}
export function AvatarPreview({config}: {config:AvatarConfig}) {
  return <SceneBoundary><Canvas frameloop="demand" camera={{position:[2,1.8,3.4],fov:33}} dpr={[1,1.5]}>
    <ambientLight intensity={1.2}/><hemisphereLight args={['#fff','#9aa38c',1]}/><directionalLight position={[-3,5,4]} intensity={2.5}/>
    <AvatarObject config={config}/><OrbitControls target={[0,1.05,0]} enablePan={false} minDistance={2.8} maxDistance={4.5} minPolarAngle={.8} maxPolarAngle={1.5}/>
  </Canvas></SceneBoundary>;
}
