import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { AnimationClip, AnimationMixer } from "three";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls'
import * as CANNON from 'cannon-es';
import gsap from 'gsap';

//Some of the global variables
let p = [0, 0], bool = true, mixer, clock = new THREE.Clock(), controls;
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.81, 0)
});
let planeGeometry, planeMesh, planeBody;

// Scene and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8a8a8a);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight); //might need a resixe function
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Container for both camera and person
const container = new THREE.Group();
scene.add(container);

// Camera and controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 4, -20.5);
camera.lookAt(0, 0, 0)
container.add(camera);

//Light
const light = new THREE.AmbientLight(0x404040);
scene.add(light);

// Orbit CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 15
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
orbitControls.update();

// //Ground function with image as floor
// createFloor();

// function createFloor() {
// 	var material = new THREE.MeshPhongMaterial();

// 	planeGeometry = new THREE.PlaneGeometry(10, 10)
// 	planeMesh = new THREE.Mesh(planeGeometry, material)
// 	planeMesh.rotateX(-Math.PI / 2)
// 	planeMesh.receiveShadow = true
// 	scene.add(planeMesh)

// 	planeBody = new CANNON.Body({
// 		type: CANNON.Body.STATIC,
// 		shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.1))
// 	})

// 	planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
// 	world.addBody(planeBody)
// }


//Model Loader
const loader = new GLTFLoader();
const loader1 = new GLTFLoader();
const loader2 = new GLTFLoader();
const loader3 = new GLTFLoader();
const loader4 = new GLTFLoader();

const personPhysMat = new CANNON.Material();

let person, mesh, road, roadBody = new CANNON.Body({ mass: 0 });

const personContactMat = new CANNON.ContactMaterial(
	personPhysMat,
	{ restitution: 0.9 }
);


let personGeometry = new THREE.SphereGeometry(), personMesh, personBody;

//Add soldier model
loader.load('models/Soldier.glb', function (gltf) {
	person = gltf.scene;
	person.traverse(function (node) {
		if (node.isMesh) { node.castShadow = true; }
	});

	//add physis to character
	personBody = new CANNON.Body({
		mass: 0,
		shape: new CANNON.Sphere(0.9),
		position: new CANNON.Vec3(person.position),
	})
	world.addBody(personBody);

	//mixer for animating model
	mixer = new THREE.AnimationMixer(person);
	mixer.clipAction(THREE.AnimationUtils.subclip(gltf.animations[0], 'idle', 23, 44)).setDuration(0.7).play();
	mixer.clipAction(THREE.AnimationUtils.subclip(gltf.animations[1], 'walk', 0, 22)).setDuration(0.7).play();
	mixer._actions[1].enabled = true;
	mixer._actions[0].enabled = false;
	scene.add(person);
},
);

//house model
loader2.load('models/house/scene.gltf', 
	(gltf3) => {
		mesh = gltf3.scene;
		mesh.scale.set(1.5, 1.5, 1.5)
		mesh.position.set(70, 0, -70);
	
		// //add physics to character
		// const meshPhysMat = new CANNON.Material();
		// const meshBody = new CANNON.Body({
		// 	mass: 2,
		// 	shape: new CANNON.Sphere(1.6),
		// 	position: new CANNON.Vec3(mesh.position),
		// 	material: meshPhysMat
		// });
		// world.addBody(meshBody);
		scene.add(mesh);
		//console.log()
	},

	(xhr) => {
        // Loading progress callback (optional)
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },

    (error) => {
        // Error callback
        console.error('Error loading GLTF model:', error);
    }
);


//safe model
loader1.load('models/safe/scene.gltf', 
	(gltf2) => {
		mesh = gltf2.scene;
		mesh.position.set(5, 1, -4.5);
		mesh.scale.set(0.01,0.01,0.01)
	
		// //add physics to character
		// const meshPhysMat = new CANNON.Material();
		// const meshBody = new CANNON.Body({
		// 	mass: 2,
		// 	shape: new CANNON.Sphere(1.6),
		// 	position: new CANNON.Vec3(mesh.position),
		// 	material: meshPhysMat
		// });
		// world.addBody(meshBody);
		scene.add(mesh);
		//console.log()
	},

	(xhr) => {
        // Loading progress callback (optional)
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },

    (error) => {
        // Error callback
        console.error('Error loading GLTF model:', error);
    }
);

// Score and collectible count
let collectibleCount = 5; // Change this value based on the number of collectibles in your scene

class Collectible extends THREE.Mesh{
    constructor({name}) {
        super(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshNormalMaterial()
        )
        this.name = name;
    }
}

// Function to create collectible cubes
function createCollectible(x, y, z, name) {
	const c = new Collectible({name: name});
    c.position.set(x, y, z);
	scene.add(c);
}

// Create collectible cubes at random positions
for (let i = 0; i < collectibleCount; i++) {
	const x = Math.random() * 20 - 10; // Random x position between -10 and 10
	const y = 0.5; // Set to half of the player's height
	const z = Math.random() * 20 - 10; // Random z position between -10 and 10
	createCollectible(x, y, z, "box");
}

// // Function to handle interactions with collectibles
// function handleCollectibleInteraction() {
// 	// Update UI to display the current score and collectible count
	
// }

// Event listener for player interaction with collectibles
function checkCollectibleInteractions() {
	for (let i = 0; i < scene.children.length; i++) {
		const object = scene.children[i];
		if (object instanceof Collectible) {
			let distance;

            if (person)
                distance = person.position.distanceTo(object.position);
            else
                distance = 10;

			if (distance < 1) {
                scene.remove(object);
                addToInventory(object.name);
                console.log(`Collected: ${object.name}`);
				//handleCollectibleInteraction();
			}
		}
	}
}

function addToInventory (item) {
    var inv = document.getElementById("inventory");
    var html = '<div class = "inv-item">' + item + '</div>';
    inv.insertAdjacentHTML("beforeend", html);
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
		if (fwd) { dwn = true; person.rotation.y = 0 * Math.PI / 180; p = [0, -0.05]; movKey = true; }
		if (bkd) { dwn = true; person.rotation.y = 180 * Math.PI / 180; p = [0, 0.05]; movKey = true; }
		if (lft) { dwn = true; person.rotation.y = 90 * Math.PI / 180; p = [-0.05, 0]; movKey = true; }
		if (rgt) { dwn = true; person.rotation.y = -90 * Math.PI / 180; p = [0.05, 0]; movKey = true; }

		if (movKey) {
			mixer._actions[0].enabled = false;
			mixer._actions[1].enabled = true;
		}
	}
}

//Light 2
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

class Surveilence extends THREE.Mesh {
    constructor() {
        super(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshNormalMaterial()
        )
		this.position.set(0, 3, 0)
    }
}

const s = new THREE.Group()
scene.add(s)
s.add(new Surveilence())
var gaze = new THREE.SpotLight(0xffee00, 10, 5, Math.PI/6, 1, 0)
gaze.position.set(0.1, 3, 0)

s.add(gaze)
s.add(gaze.target)
gaze.target.position.x = 1

s.position.set(0, 0, 0)
s.rotation.y = 0

const geometry = new THREE.ConeGeometry( 2.3, 4); 
const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
const cone = new THREE.Mesh(geometry, material ); 
cone.material.transparent = true
cone.material.opacity = 0.04
cone.position.set(0.67, 1.05, 0)
cone.rotation.set(0, 0, 0.27)
s.add( cone );
console.log(cone)

var r = 0.01
var t = new THREE.Vector3(1, 0, 0)

//render or animate
function render() {

	//Collectable items
    checkCollectibleInteractions();
	//checkCheckpoint();

	//character controls and camera movement
	if (person) {
		updateKey();
		person.position.x += p[0]; person.position.z += p[1];
		camera.lookAt(person.position);
		camera.position.x = person.position.x;
		camera.position.y = 3;
		camera.position.z = person.position.z + 4;
	}

	//Animation update for player standing type
	const clockDelta = clock.getDelta();
	if (mixer) { mixer.update(clockDelta); }

	//World meaning physics added to models,objects and plane
	world.step(1 / 60); //Update phyics by this step

	// planeMesh.position.copy(planeBody.position);
	// planeBody.quaternion.copy(planeBody.quaternion);

	if (person) {
		personBody.position.copy(person.position);
		personBody.quaternion.copy(person.quaternion);
	}

	if (Math.abs(s.rotation.y) > Math.PI/2)
		r *= -1;

	s.rotation.y += r
	t = new THREE.Vector3(Math.cos(s.rotation.y), Math.sin(s.rotation.y), 0)

	if (person) {	
		let distance = t.distanceTo(person.position)
		//console.log(distance)
		if(distance < 1.7)
		{
			console.log("collision detected!")
			//console.log(t)

		}
	}

	renderer.render(scene, camera);
	renderer.setAnimationLoop(render);
}
renderer.setAnimationLoop(render);

