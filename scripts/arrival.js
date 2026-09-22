import * as THREE from '../assets/three.module.min.js';

const host = document.querySelector('.flight-grid');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (host) {
  try {
    const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.domElement.setAttribute('aria-hidden','true');
    host.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42,1,.1,100);
    camera.position.set(0,5,10);camera.lookAt(0,0,0);
    const grid = new THREE.GridHelper(24,24,0xc3cbd0,0xe0e4e7);
    grid.rotation.y = .22;scene.add(grid);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8,.1,2),new THREE.Vector3(-3,.2,1),
      new THREE.Vector3(1,.3,-1),new THREE.Vector3(7,1,-7)
    ]);
    const track = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),new THREE.LineDashedMaterial({color:0xfd790a,dashSize:.13,gapSize:.16,transparent:true,opacity:.75}));
    track.computeLineDistances();scene.add(track);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(.11,.36,3),new THREE.MeshBasicMaterial({color:0xfd790a}));
    scene.add(marker);
    let frame=0,start=performance.now(),visible=true,finished=false;
    function draw(time){
      frame=0;
      const progress=reduced.matches?0.55:Math.max(0,Math.min((time-start)/4500,1));
      grid.rotation.y=.22+(reduced.matches?0:.03*Math.sin(progress*Math.PI));
      marker.position.copy(curve.getPoint(progress));
      marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(progress).normalize());
      renderer.render(scene,camera);
      finished=progress>=1;
      if(!finished&&!reduced.matches&&visible&&!document.hidden)frame=requestAnimationFrame(draw);
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
    new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();schedule();}).observe(host);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}}).observe(host);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(visible)schedule();});
    reduced.addEventListener('change',schedule);
    host.parentElement.addEventListener('pointermove',event=>{if(reduced.matches||event.pointerType==='touch')return;const rect=host.getBoundingClientRect();camera.position.x=(event.clientX-rect.left-rect.width/2)/rect.width*.3;camera.lookAt(0,0,0);if(finished)schedule();});
    schedule();
  } catch { /* The static grid remains when WebGL is unavailable. */ }
}
