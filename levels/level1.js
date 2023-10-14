import '../style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { AnimationClip, AnimationMixer } from "three";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls'
import * as CANNON from 'cannon-es';

let p = [0, 0], bool = true, mixer, clock = new THREE.Clock(), controls;

// Scene and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa3a3a3);
scene.fog = new THREE.Fog(0xa3a3a3, 10, 50);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);


// Container for both camera and person
const container = new THREE.Group();
scene.add(container);
// Camera and controls
const xAxis = new THREE.Vector3(1, 0, 0);
const tempCameraVector = new THREE.Vector3();
const tempModelVector = new THREE.Vector3();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
//camera.position.set(0, 2, 1);
const cameraOrigin = new THREE.Vector3(0, 4, 6);
//camera.lookAt(scene.position);
container.add(camera);






//Light
const light = new THREE.AmbientLight(0x404040);
scene.add(light);

const spotLight = new THREE.SpotLight(0x00ffff);
spotLight.position.set(100, 1000, 100);
spotLight.map = new THREE.TextureLoader();

spotLight.castShadow = true;

spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;

spotLight.shadow.camera.near = 500;
spotLight.shadow.camera.far = 4000;
spotLight.shadow.camera.fov = 30;

scene.add(spotLight);

// Orbit CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 15
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
orbitControls.update();

//Model Loader
const loader = new GLTFLoader();
const loader1 = new GLTFLoader();
const loader2 = new GLTFLoader();
const loader3 = new GLTFLoader();
const loader4 = new GLTFLoader();

let person;


loader1.load('./models/sky/scene.gltf', function(gltf) {
    const sky = gltf.scene;

    scene.add(sky);
});

loader2.load('./models/bayard/scene.gltf', function(gltf){
	const house = gltf.scene;
	house.position.y =-9;
	house.position.z =-9;
	scene.add(house);

})

loader.load('models/Soldier.glb', function (gltf) {
	person = gltf.scene;
	mixer = new THREE.AnimationMixer(person);
	person.traverse(function(node){
		if(node.isMesh){node.castShadow  =true;}
	});
	mixer.clipAction(THREE.AnimationUtils.subclip(gltf.animations[0], 'idle', 23, 44)).setDuration(0.7).play();
	mixer.clipAction(THREE.AnimationUtils.subclip(gltf.animations[1], 'walk', 0, 22)).setDuration(0.7).play();
	mixer._actions[1].enabled = true;
	mixer._actions[0].enabled = false;
	scene.add(person);
},
);

const world = new CANNON.World();
  world.gravity.set(0, -9.81, 0); // Set the gravity (adjust as needed)
  const houseShape = new CANNON.Box(new CANNON.Vec3(3, 4, 5)); // Adjust dimensions as needed
  const houseBody = new CANNON.Body({ mass: 0, shape: houseShape }); // Mass 0 makes it static (solid)
  houseBody.position.set(0, -9, -9); // Replace with your house's position
  world.addBody(houseBody); // Add the house body to the physics world
  const fixedTimeStep = 1.0 / 60.0; // Time step for physics updates
  const maxSubSteps = 3; // Maximum number of sub-steps per frame


//render
renderer.setAnimationLoop(render);
function render() {
	//character controls
	if (person) {
		updateKey();
		person.position.x += p[0]; person.position.z += p[1];
	}
	//animation update	
	const clockDelta = clock.getDelta();
	if (mixer) { mixer.update(clockDelta); }

	//Camera controls
	//camera.position.copy(person.position).add(cameraOrigin);
	//camera.lookAt(person.position);

	renderer.render(scene, camera);
}

//keys for character control
let fwd, bkd, rgt, lft, spc, dwn = false, movKey = false;
window.addEventListener('keydown', function (e) {
	switch (e.code) {
		case 'KeyW': fwd = true; break;
		case 'KeyS': bkd = true; break;
		case 'KeyD': rgt = true; break;
		case 'KeyA': lft = true; break;
		//case 'Space': spc = true; break;
	}
});
window.addEventListener('keyup', function (e) {
	dwn = false;
	movKey = false;
	p = [0, 0];
	mixer._actions[0].enabled = true;
	mixer._actions[1].enabled = false;
	switch (e.code) {
		case 'KeyW': fwd = false; break;
		case 'KeyS': bkd = false; break;
		case 'KeyD': rgt = false; break;
		case 'KeyA': lft = false; break;
		//case 'Space': spc = false; break;
	}
});
function updateKey() {
	if (!dwn) {	
		if (fwd) { console.log('w'); dwn = true; person.rotation.y = 0 * Math.PI / 180; p = [0, -0.05]; movKey = true;}
		if (bkd) { console.log('s'); dwn = true; person.rotation.y = 180 * Math.PI / 180; p = [0, 0.05]; movKey = true; }
		if (lft) { console.log('a'); dwn = true; person.rotation.y = 90 * Math.PI / 180; p = [-0.05, 0]; movKey = true; }
		if (rgt) { console.log('d'); dwn = true; person.rotation.y = -90 * Math.PI / 180; p = [0.05, 0]; movKey = true; }
		//if ( spc ) {console.log('space'); dwn=true; charSwitch()}
		if (movKey) {
			mixer._actions[0].enabled = false;
			mixer._actions[1].enabled = true;
		}
	}
}


function light1() {
	scene.add(new THREE.AmbientLight(0xffffff, 0.7))

	const dirLight = new THREE.DirectionalLight(0xffffff, 1)
	dirLight.position.set(- 60, 100, - 10);
	dirLight.castShadow = true;
	dirLight.shadow.camera.top = 50;
	dirLight.shadow.camera.bottom = - 50;
	dirLight.shadow.camera.left = - 50;
	dirLight.shadow.camera.right = 50;
	dirLight.shadow.camera.near = 0.1;
	dirLight.shadow.camera.far = 200;
	dirLight.shadow.mapSize.width = 4096;
	dirLight.shadow.mapSize.height = 4096;
	scene.add(dirLight);
	 //scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}

light1();