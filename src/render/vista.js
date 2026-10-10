// A stylized regional panorama: the Chapala shoreline northwest of town,
// Sahuayo's Cristo Rey, and distant settlement lights. Scenic approximations,
// not navigation coordinates or replacements for the measured elevation data.
import * as THREE from 'three';
import { U, GLSL_COMMON, landmarkMaterial } from './shaders.js';

export function makeRegionalVista(city) {
  const group = new THREE.Group(); group.name = 'Chapala and Sahuayo panorama';
  const shore = new THREE.Shape();
  const points = [[-30000,-21000],[-24000,-24500],[-15000,-24000],[-6500,-18500],[-5200,-14500],[-8500,-11600],[-14500,-11500],[-22000,-13500],[-30000,-16500]];
  points.forEach(([x,z],i) => i ? shore.lineTo(x,-z) : shore.moveTo(x,-z)); shore.closePath();
  const geometry = new THREE.ShapeGeometry(shore, 16); geometry.rotateX(-Math.PI/2);
  const water = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: GLSL_COMMON + `varying vec3 vW; void main(){
      vec3 view=normalize(uCamPos-vW); float fres=pow(1.-max(view.y,0.),3.);
      float wave=sin(vW.x*.035+uTime*.7)*sin(vW.z*.045-uTime*.45);
      vec3 col=mix(vec3(.075,.25,.29),uSkyHorizon*.8,fres);
      col+=uSunColor*pow(max(dot(reflect(-view,normalize(vec3(wave*.035,1.,wave*.02))),uSunDir),0.),160.)*.8;
      col*=1.-uNight*.65;col+=wave*.012;
      col=mix(col,uFogColor,1.-exp(-length(uCamPos-vW)*uFogDensity*.45));
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` });
  const lake = new THREE.Mesh(geometry,water); lake.position.y=-16; lake.name='Lago de Chapala'; group.add(lake);
  const stone = landmarkMaterial({color:0xe8dfcf,roughness:.9});
  const base = landmarkMaterial({color:0xa68c76,roughness:1});
  const statue = new THREE.Group(); statue.name='Cristo Rey de Sahuayo';
  statue.position.set(-1700,city.heightAt(-1700,-6600),-6600);
  const part=(geo,mat,x,y,z,angle=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.z=angle;statue.add(m);return m;};
  part(new THREE.BoxGeometry(14,5,14),base,0,2.5,0);
  part(new THREE.BoxGeometry(9,7,9),base,0,8.5,0);
  part(new THREE.CylinderGeometry(2,4,16,12),stone,0,20,0);
  part(new THREE.SphereGeometry(2,16,12),stone,0,30,0);
  for(const side of [-1,1]) {
    part(new THREE.CylinderGeometry(.85,1.2,10,8),stone,side*5.5,26,0,side*Math.PI/2);
    part(new THREE.SphereGeometry(.9,8,6),stone,side*10.5,26,0);
  }
  statue.rotation.y=-.2;group.add(statue);
  // Batched warm pinpoints suggest Sahuayo in the valley without hundreds of lights.
  const lamps=new THREE.InstancedMesh(new THREE.SphereGeometry(1.8,5,4),new THREE.MeshBasicMaterial({color:0xffc17b}),80);
  const matrix=new THREE.Matrix4();
  for(let i=0;i<80;i++){const x=-1300+(i%16)*90,z=-5200-Math.floor(i/16)*130;matrix.makeTranslation(x,city.heightAt(x,z)+5,z);lamps.setMatrixAt(i,matrix);}
  // Visibility must be updated even while the mesh is hidden.
  group.userData.update=()=>{lamps.visible=U.uNight.value>.35;};
  group.add(lamps);return group;
}
