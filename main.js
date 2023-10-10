import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { AnimationClip, AnimationMixer } from "three";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls'
import * as CANNON from 'cannon-es';


// Add this at the beginning of your main.js
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('loading-progress-bar');
const gameName = document.querySelector('#loading-content h1');

// Set the game name
gameName.textContent = 'UnderCover Infiltration';

// Simulate loading progress for 10 seconds
const totalProgressSteps = 100;
let currentProgress = 0;
const progressIncrement = totalProgressSteps / 1000; // Update progress every 10ms

function updateProgressBar() {
    currentProgress += progressIncrement;
    progressBar.style.width = currentProgress + '%';

    if (currentProgress < 100) {
        requestAnimationFrame(updateProgressBar);
    } else {
        // Loading complete, hide the loading screen
        setTimeout(() => {
            loadingScreen.style.display = 'none';
			
        }, 1000); // Hide after 1 second
    }
	
}

// Initial call to start the progress animation
updateProgressBar();



//Some of the global variables
let p = [0, 0], bool = true, mixer, clock = new THREE.Clock(), controls;
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.81, 0)
});
let planeGeometry, planeMesh, planeBody;


// Scene and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8a8a8a);
scene.fog = new THREE.Fog(0x8a8a8a, 10, 50);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
//renderer.outputColorSpace = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Container for both camera and person
const container = new THREE.Group();
scene.add(container);
// Camera and controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 4, 6.5);
camera.lookAt(0, 0, 0)
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

// Cannon physics adding shapes and plane to world

const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial()

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const cubeMaterial = new THREE.MeshNormalMaterial()
const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
cubeMesh.position.x = 1
cubeMesh.position.y = 20
cubeMesh.castShadow = true
scene.add(cubeMesh)
const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
const cubeBody = new CANNON.Body({ mass: 2 })
cubeBody.addShape(cubeShape)
cubeBody.position.x = cubeMesh.position.x
cubeBody.position.y = cubeMesh.position.y
cubeBody.position.z = cubeMesh.position.z
world.addBody(cubeBody)

cubeBody.angularVelocity.set(0, 10, 0);
cubeBody.angularDamping = 0.5;


const sphereGeometry = new THREE.SphereGeometry()
const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial)
sphereMesh.position.x = 0
sphereMesh.position.y = 15
sphereMesh.castShadow = true
scene.add(sphereMesh)
const sphereShape = new CANNON.Sphere(1)
const sphereBody = new CANNON.Body({ mass: 8 })
sphereBody.addShape(sphereShape)
sphereBody.position.x = sphereMesh.position.x
sphereBody.position.y = sphereMesh.position.y
sphereBody.position.z = sphereMesh.position.z
world.addBody(sphereBody)

sphereBody.linearDamping = 0.31;



//Ground function with image as floor
createFloor();

function createFloor() {
	var material = new THREE.MeshPhongMaterial();
	const texture = new THREE.TextureLoader().load('images/worldColour.5400x2700.jpg');
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.RepeatWrapping;


	material.map = texture;

	planeGeometry = new THREE.PlaneGeometry(1000, 1000)
	planeMesh = new THREE.Mesh(planeGeometry, material)
	planeMesh.rotateX(-Math.PI / 2)
	planeMesh.receiveShadow = true
	scene.add(planeMesh)

	planeBody = new CANNON.Body({
		type: CANNON.Body.STATIC,
		shape: new CANNON.Box(new CANNON.Vec3(1000, 1000, 0.1))
	})

	planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	world.addBody(planeBody)
}


//Model Loader
const loader = new GLTFLoader();
const loader1 = new GLTFLoader();
const loader2 = new GLTFLoader();
const loader3 = new GLTFLoader();
const loader4 = new GLTFLoader();

const personPhysMat = new CANNON.Material();


let person, tree, road, roadBody = new CANNON.Body({ mass: 0 });

let treeBody = new CANNON.Body({
	mass: 10,
});

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


loader2.load('models/tree 2.glb', function (gltf2) {
	tree = gltf2.scene;
	tree.position.set(0, 0, -20);
	
	//add physis to character
	const treePhysMat = new CANNON.Material();
	treeBody = new CANNON.Body({
		mass: 2,
		shape: new CANNON.Sphere(1.6),
		position: new CANNON.Vec3(tree.position),
		material: treePhysMat
	});
	world.addBody(treeBody);
	scene.add(tree);
},
);

// Score and collectible count
let score = 0;
let collectibleCount = 5; // Change this value based on the number of collectibles in your scene

// Function to create collectible cubes
function createCollectible(x, y, z) {
	const collectibleGeometry = new THREE.BoxGeometry(1, 1, 1);
	const collectible = new THREE.Mesh(collectibleGeometry, normalMaterial);
	collectible.position.set(x, y, z);
	scene.add(collectible);
}

// Create collectible cubes at random positions
for (let i = 0; i < collectibleCount; i++) {
	const x = Math.random() * 20 - 10; // Random x position between -10 and 10
	const y = 0.5; // Set to half of the player's height
	const z = Math.random() * 20 - 10; // Random z position between -10 and 10
	createCollectible(x, y, z);
}

// Function to handle interactions with collectibles
function handleCollectibleInteraction() {
	score++;
	collectibleCount--;
	// Update UI to display the current score and collectible count
	console.log(`Score: ${score}`);
	console.log(`Collectibles left: ${collectibleCount}`);
}



// Function to check if the player reached the checkpoint
function checkCheckpoint() {
	const checkpointX = 8; // Set the x position of the checkpoint area
	const checkpointZ = 8; // Set the z position of the checkpoint area
	const distance = person.position.distanceTo(new THREE.Vector3(checkpointX, person.position.y, checkpointZ));
	if (distance < 2) {
		// The player has reached the checkpoint
		// Implement logic for handling the completion of the challenge
		console.log('Checkpoint reached! Challenge completed!');
	}
}

// Event listener for player interaction with collectibles
function checkCollectibleInteractions() {
	for (let i = 0; i < scene.children.length; i++) {
		const object = scene.children[i];
		if (object instanceof THREE.Mesh && object !== person && object != planeMesh && object != sphereMesh && object != cubeMesh) {
			const distance = person.position.distanceTo(object.position);
			if (distance < 1) {
				scene.remove(object);
				handleCollectibleInteraction();
			}
		}
	}
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


//render or animate
function render() {

	//Collectable items
	checkCollectibleInteractions();
	checkCheckpoint();

	//character controls and camera movement
	if (person) {
		updateKey();
		person.position.x += p[0]; person.position.z += p[1];
		camera.lookAt(person.position);
		camera.position.x = person.position.x;
		camera.position.y = 4;
		camera.position.z = person.position.z + 6;
	}
	//Animation update for player standing type
	const clockDelta = clock.getDelta();
	if (mixer) { mixer.update(clockDelta); }


	//World meaning physics added to models,objects and plane
	world.step(1 / 60); //Update phyics by this step

	planeMesh.position.copy(planeBody.position);
	planeBody.quaternion.copy(planeBody.quaternion);

	cubeMesh.position.set(
		cubeBody.position.x,
		cubeBody.position.y,
		cubeBody.position.z
	)
	cubeMesh.quaternion.set(
		cubeBody.quaternion.x,
		cubeBody.quaternion.y,
		cubeBody.quaternion.z,
		cubeBody.quaternion.w
	)
	sphereMesh.position.set(
		sphereBody.position.x,
		sphereBody.position.y,
		sphereBody.position.z
	)
	sphereMesh.quaternion.set(
		sphereBody.quaternion.x,
		sphereBody.quaternion.y,
		sphereBody.quaternion.z,
		sphereBody.quaternion.w
	)

	personBody.position.copy(person.position);
	personBody.quaternion.copy(person.quaternion);

	renderer.render(scene, camera);
	renderer.setAnimationLoop(render);
}
renderer.setAnimationLoop(render);

