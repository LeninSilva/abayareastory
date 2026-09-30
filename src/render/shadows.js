// Sun shadows: a depth map rendered from the sun around the player every frame, snapped to whole texels
// so edges don't crawl as you walk. Every shader samples it through shadowAt() in shaders.js.
import * as THREE from 'three';
import { U } from './shaders.js';

export class SunShadows {
  // slot 0: the sharp cascade near you; slot 1: the wide one that reaches the horizon
  constructor(renderer, size, radius, slot = 0) {
    this.r = renderer; this.size = size; this.R = radius; this.k = slot ? '2' : '';
    this.rt = new THREE.WebGLRenderTarget(size, size, { depthBuffer: true, stencilBuffer: false });
    this.rt.depthTexture = new THREE.DepthTexture(size, size, THREE.UnsignedIntType);
    this.rt.texture.generateMipmaps = false;
    this.range = slot ? 4000 : 1400;
    this.cam = new THREE.OrthographicCamera(-radius, radius, radius, -radius, 1, this.range);
    this.mat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
    this.tmp = new THREE.Vector3(); this.q = new THREE.Quaternion();
    U['uShadowMap' + this.k].value = this.rt.depthTexture; U['uShadowTexel' + this.k].value = 1 / size; U['uShadowBias' + this.k].value = (slot ? 1.2 : 0.3) / this.range;
  }
  // hide: objects that must not cast (sky, water, streets, markers...)
  update(scene, center, sunDir, hide) {
    if (sunDir.y < 0.04) { U['uShadowOn' + this.k].value = 0; return; }
    const cam = this.cam, dist = this.range * 0.55;
    const up = Math.abs(sunDir.y) > 0.98 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    // snap the centre to the texel grid in light space
    cam.position.copy(center).addScaledVector(sunDir, dist); cam.up.copy(up); cam.lookAt(center); cam.updateMatrixWorld();
    const texel = (2 * this.R) / this.size;
    this.tmp.copy(center).applyMatrix4(cam.matrixWorldInverse);
    this.tmp.x = Math.round(this.tmp.x / texel) * texel; this.tmp.y = Math.round(this.tmp.y / texel) * texel;
    const snapped = this.tmp.applyMatrix4(cam.matrixWorld);
    cam.position.copy(center).addScaledVector(sunDir, dist).add(snapped.sub(center)); cam.updateMatrixWorld();
    const vis = hide.map(o => o.visible); hide.forEach(o => o.visible = false);
    const prevOverride = scene.overrideMaterial, prevTarget = this.r.getRenderTarget(), prevAuto = this.r.autoClear;
    scene.overrideMaterial = this.mat;
    this.r.setRenderTarget(this.rt); this.r.autoClear = false; this.r.clear(true, true, false);
    this.r.render(scene, cam);
    this.r.setRenderTarget(prevTarget); this.r.autoClear = prevAuto; scene.overrideMaterial = prevOverride;
    hide.forEach((o, i) => o.visible = vis[i]);
    U['uShadowMat' + this.k].value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    U['uShadowOn' + this.k].value = 1;
  }
  dispose() { this.rt.dispose(); U['uShadowOn' + this.k].value = 0; }
}
