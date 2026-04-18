import * as THREE from "three";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";
import { Howl, Howler } from "https://esm.sh/howler";
import { AsciiEffect } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/effects/AsciiEffect.js';
// import { CSG } from 'https://cdn.jsdelivr.net/npm/three-csg-ts/+esm';

let scene, camera, renderer, controls
const keys = {};
const machineLights = [];
const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const collidable = []; // walls + machines
const speed = 0.08;
const collisionDistance = 0.6;
let crt_texture = ""
let iteration = 0;


/*
# plan
window.arcade.api = {
  lightsOn      : false,
  musicOn       : false,
  playlistIndex : 0,
  doorOpen      : false,
  position      : {0,0,0}
}

# top functions
init
saveState
lockControls
api
- @power-on@
- @power-off@
- @load-configuration@

# 
office
arcade
*/

// ARCADE API
let cachedCMD = ""
function arcadeAPI(data){
  let letter = data.detail.message
  cachedCMD+=letter
  let numATs= cachedCMD.split('@').length-1
  if (cachedCMD && numATs>1){
    console.log(cachedCMD)
    switch (cachedCMD) {
      case '@lights@':
        toggle_lights()
        break;
      case "@cool@":
        break;
      default:
        console.log(`${cachedCMD} is not an api call silly... `)
    }
    cachedCMD = ""
  }
}
function toggle_lights(){
  console.log("toggling lights")
  let turning_on = new Howl({
    src: ['assets/audio/effects/fluorescent lamp sound [K8LwIZE7kzw].mp3'],
    preload: true,
    volume: 1,
    html5: false,
    loop: false 
  });
  turning_on.pos(3.95, 1.75, 15.95)
  turning_on.play()
  initArcade()
  window.controls.lock()
}

// positional audio with howlerjs
let tracks = ['assets/audio/playlist/seperate_ways.mp3','assets/audio/playlist/spooky.mp3']
let track_index = 0
let arcade_speaker1 = ""
let arcade_speaker2 = ""

function playNext(){
  console.log('added')
  let width = 20
  let depth = 20
  arcade_speaker1 = new Howl({
    src: [tracks[track_index]],
    preload: true,
    volume: 1,
    html5: false,
    onend: () => {
      track_index = (track_index + 1) % tracks.length;
      playNext();
    }
  });

  arcade_speaker1.pos((width/2)+1, 4, (depth/2)-.8);

  arcade_speaker2 = new Howl({
    src: [tracks[track_index]],
    preload: true,
    volume: 1,
    html5: false,
  });
  arcade_speaker2.pos(-(width/2)+1, 4, (depth/2)-.8);
  arcade_speaker1.play();
  arcade_speaker2.play();
}
function skip() {
  if (arcade_speaker1) {
    arcade_speaker1.stop(); // stop current
  }
  // if (arcade_speaker2) {
  //   arcade_speaker2.stop(); // stop current
  // }
  track_index = (track_index + 1) % tracks.length;
  playNext();
}
function addCRT(canvas){
  // asset
  loader.load("/assets/machines/crt_computer_monitor.glb", (gltf) => {
    let machine = gltf.scene;

    machine.traverse((child) => {
      if (child.isMesh && child.name.includes('CRT_Monitor_monitor_glass_0')) {
          child.material = new THREE.MeshStandardMaterial({
            // map: crt_texture,
            emissive: new THREE.Color(0x000000),
            color: 0x000000,
            // emissiveMap: crt_texture,
            emissiveIntensity: 1.5
          });
      }
    });

    machine.scale.set(2,2,2);
    machine.position.set(3.95, 1.75, 15.95);
    // const light = new THREE.PointLight(0xffffff, 500, 500);
    // light.position.set(3.95, 4, 15.95)
    // scene.add(light);
    // addOverheadLight(machine.position.x,4,machine.position.z - 1, 4.75)
    machine.rotation.y = -1.9
    scene.add(machine);
  })
  // screen
  crt_texture = new THREE.CanvasTexture(canvas);
  crt_texture.minFilter = THREE.LinearFilter;
  crt_texture.magFilter = THREE.LinearFilter;
  crt_texture.flipY = true; // IMPORTANT for GLB-style UVs

  // (SUBDIVIDED FOR BENDING) =====
  const width = .52;
  const height = width * (canvas.height / canvas.width);
  const geometry = new THREE.PlaneGeometry(width, height,60, 60);


  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    // vertical + horizontal curve (CRT-style)
    const z =
      Math.pow(y, 2) * -0.15 +   // top/bottom bend
      Math.pow(x, 2) * -0.05;    // slight side curve

    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  const screenMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: crt_texture }));
  screenMesh.position.set(3.5, 1.795, 15.79);
  screenMesh.rotation.y = -1.9
  scene.add(screenMesh);
  
}

function initOffice(){
  // let w, d =[20, 20]
  // arcade_speaker1 = new Howl({
  //   src: [tracks[track_index]],
  //   volume: 1,
  //   html5: false,
  // });

  // arcade_speaker1.pos(3.5, 1.795, 15.79);
  // arcade_speaker1.play();
  let width = 10
  let depth = 7.5


  //  Floor
  const floortexture = new THREE.TextureLoader().load("/assets/furnature/carpet.jpeg");
  floortexture.wrapS = THREE.RepeatWrapping;
  floortexture.wrapT = THREE.RepeatWrapping;
  floortexture.repeat.set(20, 30); 
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({
      map: floortexture,
      roughness: 1,
      metalness: 0
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0,0,13.75)
  floor.receiveShadow = true
  scene.add(floor);

  //  Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  // const texture = new THREE.TextureLoader().load('/assets/art/wallPaper2.jpg');
  // const wallMat = new THREE.MeshBasicMaterial({ map: texture});
  // wallMat.emissiveIntensity = 0
  // wallMat.color.set(0x808080); \

  const backWallGeo = new THREE.BoxGeometry(width, 5, 0.5);
  const sidewallGeo = new THREE.BoxGeometry(.5, 5, depth);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, 2.5, 15+2.5);
  scene.add(backWall);
  collidable.push(backWall);

  const leftWall = new THREE.Mesh(sidewallGeo, wallMat);
  leftWall.position.set(5, 2.5, 13.75);
  scene.add(leftWall);
  collidable.push(leftWall);

  const rightWall = new THREE.Mesh(sidewallGeo, wallMat);
  rightWall.position.set(-5, 2.5, 13.75);
  scene.add(rightWall);
  collidable.push(rightWall);

  //  Furnature
  loader.load("/assets/furnature/metal_desk.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(1.5,1.5,1.5);
    machine.position.set(3.75,.55, 15);
    machine.rotation.y = -1.55
    collidable.push(machine);
    scene.add(machine);
  })
  const termDiv = document.getElementById('term')
  if (!termDiv.querySelector("canvas")){
    alert("sorry, something is broken")
  }
  addCRT(termDiv.querySelector("canvas"))
  // loader.load("/assets/machines/old_keyboard.glb", (gltf) => {
  //   const machine = gltf.scene;
  //   machine.scale.set(.0032,.0032,.0032);
  //   // machine.position.set(3.75, 1.75, 15);
  //   // machine.rotation.y = -1.55
  //   machine.position.set(3.3, 1.38, 15.5);
  //   machine.rotation.y = -1.9
  //   scene.add(machine);
  // })
  loader.load("/assets/minis/esp8266.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(.02,.02,.02);
    // machine.position.set(3.75, 1.75, 15);
    // machine.rotation.y = -1.55
    machine.position.set(3.1, 1.31, 13.8);
    machine.rotation.y = -1.9
    scene.add(machine);
  })
  loader.load("/assets/minis/rpi.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(.025,.025,.025);
    // machine.position.set(3.75, 1.75, 15);
    // machine.rotation.y = -1.55
    machine.position.set(3.25, 1.31, 13.84);
    machine.rotation.y = -2
    scene.add(machine);
  })
  loader.load("/assets/minis/ram.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(.1,.1,.1);
    // machine.position.set(3.75, 1.75, 15);
    // machine.rotation.y = -1.55
    machine.position.set(3.4, 1.31, 13.84);
    // machine.rotation.y = -2.3
    machine.rotation.y = 1.75
    machine.rotation.x = 0
    scene.add(machine);
  })

  // door walls
  const doorWallWidth  = 5+8
  const doorWallHeight = 5
  const doorWallDepth  = .5
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x050505 })
  // const texture = new THREE.TextureLoader().load('/assets/art/wallPaper.jpg');
  // const ceilingMat = new THREE.MeshBasicMaterial({ map: texture});
  // ceilingMat.emissiveIntensity =0;
  const doorWallGeo   = new THREE.BoxGeometry(doorWallWidth, doorWallHeight, doorWallDepth);
  const rightDoorWall = new THREE.Mesh(doorWallGeo, ceilingMat);
  const leftDoorWall  = new THREE.Mesh(doorWallGeo, ceilingMat);
  rightDoorWall.position.set((width/2)+(doorWallWidth/2)-4, doorWallHeight/2, 10);
  leftDoorWall.position.set(-(width/2)-(doorWallWidth/2)+4, doorWallHeight/2, 10);
  scene.add(leftDoorWall);
  scene.add(rightDoorWall);
  collidable.push(leftDoorWall);
  collidable.push(rightDoorWall);
}

function addMachine(x, y, z, rotY=0, machineIndex='/assets/machines/the_arcade.glb') {
  loader.load("/assets/machines/the_arcade.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(.014, .014, .014);
    machine.position.set(x, y, z);
    machine.rotation.y = rotY;
    collidable.push(machine);
    scene.add(machine);
    // point light above machine, worse then spotlight
    // const light = new THREE.PointLight(0xffffff, 5, 5);
    // light.position.copy(machine.position);
    // light.position.y += 3.5;
    // light.position.z += 1.5;
    // scene.add(light);
    // machineLights.push(light);
    addOverheadLight(machine.position.x,4,machine.position.z)
  });

}

function initMachines(){
  // Middle
  let x = 0;
  let y = 3.5;
  let z = -5;
  // Center
  addMachine(x-.5, 0, z,   3.15)
  addMachine(x-.5, 0, z+1.5, 3.15)
  addMachine(x-.5, 0, z+3, 3.15)
  addMachine(x-.5, 0, z+4.5, 3.15)
  addMachine(x+.5, 0, z)
  addMachine(x+.5, 0, z+1.5)
  addMachine(x+.5, 0, z+3)
  addMachine(x+.5, 0, z+4.5)
  // left and right
  addMachine(x-8, 0, z)
  addMachine(x-8, 0, z+1.5)
  addMachine(x-8, 0, z+3)
  addMachine(x-8, 0, z+4.5)
  addMachine(x+8, 0, z, 3.15)
  addMachine(x+8, 0, z+1.5, 3.15)
  addMachine(x+8, 0, z+3, 3.15)
  addMachine(x+8, 0, z+4.5, 3.15)
  let pac_man = new Howl({
    src: ['assets/audio/games/Pac-Man Arcade gameplay [uswzriFIf_k].mp3.mp3'],
    preload: true,
    volume: .5,
    html5: false,
    loop: true 
  });
  pac_man.pos(x+8, 0, z+4.5, 3.15)
  pac_man.play()
}
// function arcadeLeftWall(){
//   const floorWidth = 20
//   const widthX        = .5
//   const lengthZ       = 20
//   const blockWidthX  = .5
//   const space         = 1
//   const blockLengthZ  = 2.5
//   const blockHeightY  = 1.5
//   const topHeight     = 1
//   const heightY       = 5.5 - blockHeightY - topHeight
//   const totalHeight   = heightY + blockHeightY + topHeight

//   const wallTexture = new THREE.MeshStandardMaterial({ color: 0x050505 });
//   const group       = new THREE.Group();

//   // bottom
//   const bottomGeo  = new THREE.BoxGeometry(widthX, heightY, lengthZ);
//   const bottomMesh = new THREE.Mesh(bottomGeo, wallTexture);
//   group.add(bottomMesh)
  
//   const windowGeo  = new THREE.BoxGeometry(blockWidthX, blockHeightY, space);
//   // mid
//   let iterations        = Math.round(lengthZ/(blockLengthZ+space))
//   let nextWindowStartZ  = -(lengthZ/2)
//   for (let i = 0; i<iterations; i++){
//     const windowWallMesh = new THREE.Mesh(windowGeo, wallTexture);
//     windowWallMesh.position.set(0,heightY-(blockHeightY/2),nextWindowStartZ)
//     nextWindowStartZ += space + blockLengthZ
//     // windowWallMesh.castShadow = true;
//     group.add(windowWallMesh)
//   }

//   // top
//   const topGeo  = new THREE.BoxGeometry(widthX, topHeight, lengthZ);
//   const topMesh = new THREE.Mesh(topGeo, wallTexture);
//   group.add(topMesh)
//   topMesh.position.set(0,heightY+(topHeight/2),0)

//   group.position.set(floorWidth/2, heightY/2, 0);
//   // group.castShadow = true
//   scene.add(group);
//   collidable.push(group);
// }
function addSpeaker(x,y,z,rot){
 loader.load("/assets/furnature/speaker.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(.02,.02,.02);
    // machine.position.set(x+.2,y, z);
    machine.position.set(x, y, z);
    machine.rotation.x = 3.8 // y axis
    // machine.rotation.z = rotz
    machine.rotation.y = -rot //-.4 // x axis for what we want
    machine.rotation.z = rot //.4 //  z axis

    scene.add(machine);
  })
}
function initArcade(){
  let width = 20
  let depth = 20
  
  // Floor
  const floortexture = new THREE.TextureLoader().load("/assets/furnature/carpet.jpeg");
  // enable tiling
  floortexture.wrapS = THREE.RepeatWrapping;
  floortexture.wrapT = THREE.RepeatWrapping;
  // how many times it repeats across the plane
  floortexture.repeat.set(20, 30); // 👈 tweak this
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
      map: floortexture,
      roughness: 1,
      metalness: 0
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // ceiling
  // const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x050505 })
  const textureCeiling = new THREE.TextureLoader().load('/assets/art/ceiling.jpeg');
  const ceilingMat = new THREE.MeshBasicMaterial({ map: textureCeiling}); 
  ceilingMat.emissiveIntensity = 0;
  const ceilingGeo = new THREE.BoxGeometry(20, .5, 20);
  const ceiling    = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.position.set(0,5.25,0)
  // ceiling.castShadow = true;
  scene.add(ceiling);
  // add machines
  initMachines()

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  // const texture = new THREE.TextureLoader().load('/assets/art/wallPaper.jpg');
  // const wallMat = new THREE.MeshBasicMaterial({ map: texture});

  const frontWallGeo = new THREE.BoxGeometry(width-3, 5, .5);
  const leftWallGeo = new THREE.BoxGeometry(.5, 5, 20);
  const rightWallGeo = new THREE.BoxGeometry(.5, 5, depth-3);
  const fronWall = new THREE.Mesh(frontWallGeo, wallMat);
  fronWall.position.set(3, 2.5, -(depth/2));
  scene.add(fronWall);
  collidable.push(fronWall);
  const texture2 = new THREE.TextureLoader().load("/assets/art/kings-arcade.png");
  const poster2 = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 6),
    new THREE.MeshStandardMaterial({
      map: texture2,
      transparent: true
    })
  );
  poster2.rotation.y = 0 // -3.15
  poster2.position.set(0, 2.3, -9.7); // on wall
  scene.add(poster2);
  loader.load("/assets/minis/spray_can.glb", (gltf) => {
    const machine = gltf.scene;
    machine.scale.set(.2, .2,.2);
    machine.position.set(4, .1, -9.5)
    machine.rotation.y = -.3
    scene.add(machine)
  })
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(width/2, 2.5, 0);
  // window hole
  // const windowGeo = new THREE.BoxGeometry(0.6, .5, .5);
  // const windowMesh = new THREE.Mesh(windowGeo);
  // windowMesh.position.set(width/2, 2, 0);
  // const result = CSG.subtract(leftWall, windowMesh);
  // scene.add(result);
  collidable.push(leftWall);
  // arcadeLeftWall()
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
  rightWall.position.set(-(width/2), 2.5, 1.5);
  scene.add(rightWall);
  collidable.push(rightWall);


  // const light = new THREE.PointLight(0xffffff, 500, 500);
  // light.position.set(0,3,5)
  // scene.add(light);
  const toplight1 = new THREE.PointLight(0xffffff, 5, 10);
  toplight1.position.set((width/2)-1-1, 4, (depth/2)-.8-1)
  const toplight2 = new THREE.PointLight(0xffffff, 5, 10);
  toplight2.position.set(-(width/2)+1+1, 4, (depth/2)-.88-1)
  scene.add(toplight1);
  scene.add(toplight2);

  addSpeaker((width/2)-1, 4, (depth/2)-.8, .4)
  addSpeaker(-(width/2)+1, 4, (depth/2)-.8, -.4)

  playNext()
}

// init scene
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x00000F);

  // View
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
  // camera.position.set(0, 2, 0);
  camera.position.set(2.9, 1.85, 15.65);
  camera.lookAt(3.95, 1.75, 15.95);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new PointerLockControls(camera, document.body);
  // document.body.addEventListener("click", () => controls.lock());
  window.controls = controls

  // Lighting (very dim ambient)
  scene.add(new THREE.AmbientLight(0xffffff, 0)); // .2

  // Floor
  // const floor = new THREE.Mesh(
  //   new THREE.PlaneGeometry(20, 20),
  //   new THREE.MeshStandardMaterial({ color: 0x222222 })
  // );
  // floor.rotation.x = -Math.PI / 2;
  // scene.add(floor);

  // Walls
  // const wallMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  // const wallGeo = new THREE.BoxGeometry(20, 5, 0.5);

  // const backWall = new THREE.Mesh(wallGeo, wallMat);
  // backWall.position.set(0, 2.5, -10);
  // scene.add(backWall);
  // collidable.push(backWall);

  // const frontWall = new THREE.Mesh(wallGeo, wallMat);
  // frontWall.position.set(0, 2.5, 10);
  // scene.add(frontWall);
  // collidable.push(frontWall);

  // const sideWallGeo = new THREE.BoxGeometry(0.5, 5, 20);

  // const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  // leftWall.position.set(-10, 2.5, 0);
  // scene.add(leftWall);
  // collidable.push(leftWall);

  // const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  // rightWall.position.set(10, 2.5, 0);
  // scene.add(rightWall);
  // collidable.push(rightWall);

  // // poster
  // const texture = new THREE.TextureLoader().load("/assets/art/Uncle-Sam.jpg");
  // const poster = new THREE.Mesh(
  //   new THREE.PlaneGeometry(2, 3),
  //   new THREE.MeshStandardMaterial({
  //     map: texture
  //   })
  // );
  // poster.rotation.y = -1.55
  // poster.position.set(9.7, 2, 1); // on wall
  // scene.add(poster);
  // // antoher one
  // const texture2 = new THREE.TextureLoader().load("/assets/art/kings-arcade.png");
  // const poster2 = new THREE.Mesh(
  //   new THREE.PlaneGeometry(9, 6),
  //   new THREE.MeshStandardMaterial({
  //     map: texture2,
  //     transparent: true
  //   })
  // );
  // poster2.rotation.y = -3.15
  // poster2.position.set(0, 3, 9.7); // on wall
  // scene.add(poster2);


  // // Create arcade machines on all walls
  // createWallMachines("back", 4.75, 0, -9); 
  // createWallMachines("front", Math.PI, 0, 9);
  // createWallMachines("left", Math.PI / 2, -9, 0);
  // createWallMachines("right", -Math.PI / 2, 9, 0);

  // Movement input
  document.addEventListener("keydown", e => keys[e.code] = true);
  document.addEventListener("keyup", e => keys[e.code] = false);

  window.addEventListener("resize", onResize);
  window.addEventListener("arcadeAPI", arcadeAPI);

// addCRT()
// addFrontDoors()
// playNext()
  initOffice()
  // initArcade()

  //const light = new THREE.SpotLight("#d3d3c0", 1000, 100, Math.PI/4, 1, .8);
  // const light = new THREE.SpotLight("#d3d3c0", 10000, 1000);
  // light.position.set(15, 10, 0)
  // light.target.position.set(0, 0, 0)
  // light.castShadow = true;
  // scene.add(light)
  // scene.add(light.target)
}

function addOverheadLight(x,y=3.5,z,r=0){
  loader.load("/assets/furnature/fluorescent_light.glb", (gltf) => {
    const machine = gltf.scene;

    machine.traverse((child) => {
      if (child.name.includes('defaultMaterial_1') || child.name.includes('cylinder') ) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(0xffffee),
            emissiveIntensity: 500000, 
            side: THREE.Both 
           });
      }else if(child.name.includes('defaultMaterial_3')){
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(0xffffee),
            emissiveIntensity: 0, 
            side: THREE.Both,
            transparent: true,
            opacity: .3
           });
      }
    });
    machine.scale.set(2,2,2);
    machine.position.set(x+.2,y, z);
    machine.rotation.x = 3.15
    machine.rotation.y = r
    scene.add(machine);

    const light = new THREE.SpotLight("#FFFFE0", 100, 6, Math.PI/8, 1, .8);
    light.position.copy(machine.position);
    light.target.position.set(x,0,z)
    scene.add(light.target);
    scene.add(light);
    machineLights.push(light)
  })
}

function createWallMachines(side, rotY, offsetX, offsetZ) {
  for (let i = 0; i < 5; i++) {
    const spacing = -8 + i * 4;

    loader.load("/assets/machines/the_arcade.glb", (gltf) => {
      const machine = gltf.scene;

      machine.scale.set(.014, .014, .014);
      if (side === "back" || side === "front") {
        machine.position.set(spacing, 0, offsetZ);
      } else {
        machine.position.set(offsetX, 0, spacing);
      }

      machine.rotation.y = rotY;

      collidable.push(machine);
      scene.add(machine);

      // point light above machine, worse then spotlight
      // const light = new THREE.PointLight(0xffffff, 5, 5);
      // light.position.copy(machine.position);
      // light.position.y += 3.5;
      // light.position.z += 1.5;

      // scene.add(light);
      // machineLights.push(light);
      addOverheadLight(machine.position.x,4,machine.position.z)
    });
  }
}

function moveWithCollision() {
  if (window?.controls && window?.controls?.isLocked){
  const moveForward = (keys["KeyW"] ? 1 : 0) - (keys["KeyS"] ? 1 : 0);
  const moveRight = (keys["KeyD"] ? 1 : 0) - (keys["KeyA"] ? 1 : 0);

  if (moveForward === 0 && moveRight === 0) return;

  // 🔑 get camera direction (already normalized)
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward); 

  // flatten Y so you don't fly up/down
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  // final movement direction
  const moveDir = new THREE.Vector3();
  moveDir.addScaledVector(forward, moveForward);
  moveDir.addScaledVector(right, moveRight);
  moveDir.normalize();

  // 🔍 raycast
  const origin = camera.position.clone();
  origin.y -= 0.5;

  raycaster.set(origin, moveDir);
  const hits = raycaster.intersectObjects(collidable, true);

  if (hits.length > 0 && hits[0].distance < collisionDistance) {
    return; // blocked
  }

  // ✅ apply movement properly
  controls.moveForward(moveForward * speed);
  controls.moveRight(moveRight * speed);
}
}

function animate() {
  iteration = iteration + 1 % 1000;
  requestAnimationFrame(animate);
  moveWithCollision()
  
  if (crt_texture){
    crt_texture.needsUpdate = true;
  }
  
  if (arcade_speaker1){
    Howler.pos(camera.position.x, camera.position.y, camera.position.z);
  }
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function waitForCanvas() {
  const term = document.getElementById("term")
  const check = () => {
    const canvas = term.querySelector("canvas");
    if (canvas){
      init()          // add all the stuff
      return  animate() 
    } 
    requestAnimationFrame(check)
  }
  check()
}
function main(){
  waitForCanvas() // the off screen canvas has to render first before we can clone it into threejs
}
main()