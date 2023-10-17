import '/style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';

// Scene, world and lighting -----------------------------------------------------------------------------------------------------------------------------------
//creating 3d physics world
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.81, 0)
});

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); //sky blue

//renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); //might need a resize function
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; //enable shadows
document.body.appendChild(renderer.domElement);

// Container for both camera and person
const container = new THREE.Group();
scene.add(container);

// Camera and controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
container.add(camera);

//Light for outside "sun"
const sun = new THREE.AmbientLight(0x404040);
scene.add(sun);

// Floor -----------------------------------------------------------------------------------------------------------------------------------
//createFloor();

let planeGeometry, planeMesh, planeBody; //floor variables
function createFloor() {
	var material = new THREE.MeshPhongMaterial({color: 0xFFF999});

	planeGeometry = new THREE.PlaneGeometry(30, 30)
	planeMesh = new THREE.Mesh(planeGeometry, material)
	planeMesh.rotateX(-Math.PI / 2)
	planeMesh.receiveShadow = true
	scene.add(planeMesh)

	planeBody = new CANNON.Body({
		type: CANNON.Body.STATIC,
		shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.1))
	})

	planeBody.position.y = -5
	planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	world.addBody(planeBody)
}

//person physics
const personPhysMat = new CANNON.Material();

let person;

const personContactMat = new CANNON.ContactMaterial(
	personPhysMat,
	{ restitution: 0.9 }
);

let personBody;

// Loading Models  ----------------------------------------------------------------------------------------------------------------------------
const loader = new GLTFLoader(); //Model Loader
var mesh; //model mesh
let mixer, mixer2; //animate animated objects

//Add soldier model
loader.load('models/Soldier.glb', function (gltf) {
	person = gltf.scene;
	person.position.y = -3
	person.traverse(function (node) {
		if (node.isMesh) { node.castShadow = true; }
	});

	//add physics to character
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
loader.load('models/house/scene.glb', 
	(gltf) => {
		mesh = gltf.scene;
		mesh.traverse(function (node) { //house casts shadow
			if (node.isMesh) { 
				node.castShadow = true; 
			}
		});
		mesh.position.set(0, 0, 0);
		mesh.position.y = -2.6;
	
		scene.add(mesh);
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

//allow safe to be moved
var safe = new THREE.Group();

//safe model
loader.load('models/safe/scene.gltf', 
	(gltf) => {
		mesh = gltf.scene;
		mesh.position.set(0,0,0);
		mesh.scale.set(0.01,0.01,0.01)
		mesh.position.set(0,1,0);

		safe.add(mesh);
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

scene.add(safe)
safe.position.x = 4

// Collectibles and Inventory  -----------------------------------------------------------------------------------------------------

// Collectibles: items for player to collect to solve puzzles with
class Collectible extends THREE.Mesh{
    constructor({name}) {
        super(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshNormalMaterial()
        )
        this.name = name;
    }
}

// Function to create collectible items
function createCollectible(x, y, z, name) {
	const c = new Collectible({name: name});
    c.position.set(x, y, z);
	scene.add(c);
}

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
			}
		}
	}
}

let inventoryList = []; //list of items currently in player inventory
let selectedItem = ""; //stores name of clicked item

//add to screen and list
function addToInventory (name) {
	//add to screen
    var inv = document.getElementById("inventory");
	//var img = '<img src = "'+ name +'.jpg"></img>';
	var img = '';
    var html = '<div class = "inv-item" id = "' + name + '">' + name + img + '</div>'; //div with id name and image of inv item
    inv.insertAdjacentHTML("beforeend", html);

	//ensure each item has a listener
	inv.lastChild.addEventListener("click", (e) => {
		const div = e.target; //entire div
        const item = div.id; //div id

		//delect item if there is selected
		if (selectedItem != "") { 
			const deselect = document.getElementById(selectedItem);
			deselect.style.borderColor = "#213547"; //unselected colour
			selectedItem = "";
		}

		div.style.borderColor = "#007bff"; //item border blue
		selectedItem = item; //select item
	});

	//add to list
	inventoryList.push(name);
}

//remove from screen and list
function removeFromInventory (name) {
    var inv = document.getElementById("inventory"); //fetch inventory tray
	var children = inv.childNodes;//fetch inventory elements
    
	//loop through to find item
	children.forEach(child => {
		if(child.id == name)			
			inv.removeChild(child);
	});

	//remove from list
	const index = inventoryList.indexOf(name);
	if (index != -1)
		inventoryList.splice(index, 1); //remove 1 item starting from index
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
		if (fwd) { console.log('w'); dwn = true; person.rotation.y = 0 * Math.PI / 180; p = [0, -0.5]; movKey = true;}
		if (bkd) { console.log('s'); dwn = true; person.rotation.y = 180 * Math.PI / 180; p = [0, 0.5]; movKey = true; }
		if (lft) { console.log('a'); dwn = true; person.rotation.y = 90 * Math.PI / 180; p = [-0.5, 0]; movKey = true; }
		if (rgt) { console.log('d'); dwn = true; person.rotation.y = -90 * Math.PI / 180; p = [0.5, 0]; movKey = true; }
		//if ( spc ) {console.log('space'); dwn=true; charSwitch()}
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

//surveilence camera
const s = new THREE.Group()

class Surveilence {
    constructor() {
        this.camera = new GLTFLoader().load('models/camera/scene.gltf',
			(gltf) => {
				var m = gltf.scene;
				m.position.set(0, 2.58, -0.8)

				// Create an AnimationMixer, and get the list of AnimationClip instances
				mixer2 = new THREE.AnimationMixer( m );
				const clips = m.animations;

				// Update the mixer on each frame
				mixer2.clipAction(gltf.animations[1]).setDuration(10).play();
				mixer2.clipAction(gltf.animations[0]).setDuration(7).play();

				scene.add(m);
			})
    }
}

s.add(new Surveilence())

//camera light
var view = new THREE.SpotLight(0xffee00, 3, 5, Math.PI/6, 1, 0)
view.position.set(0.1, 3, 0)

s.add(view)
s.add(view.target)

//light cone
const geometry = new THREE.ConeGeometry( 2, 4); 
const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
const cone = new THREE.Mesh(geometry, material ); 
cone.material.transparent = true
cone.material.opacity = 0.04

//angling the cone
cone.position.set(0.67, 1.05, 0)
cone.rotation.set(0, 0, 0.27)
s.add( cone );

s.rotation.y = 0
s.position.set(0, 0, 0)
view.target.position.x = 1

scene.add(s)

//rotation variables
var r = 0.01
var t = new THREE.Vector3().copy(view.target.position); //keeps track of light focus location

//render variables
let clock = new THREE.Clock();
let p = [0, 0]; //update person position

function zoomIn() {
	camera.fov *= 0.3;
	camera.updateProjectionMatrix();
}

function zoomOut() {
	camera.fov *= -0.3;
	camera.updateProjectionMatrix();
}

//render or animate
function render() {

	//Collectable items
    checkCollectibleInteractions();

	//character controls and camera movement
	if (person) {
		updateKey();
		person.position.x += p[0]; 
		person.position.z += p[1];
		
		var pos = new THREE.Vector3().copy(person.position);
		camera.lookAt(person.position);
		camera.position.x = person.position.x;
		camera.position.y = 10;
		camera.position.z = 0;
		// camera.lookAt(pos.add(new THREE.Vector3(0, 2, 0)));
		// camera.position.x = person.position.x;
		// camera.position.y = person.position.y + 2;
		// camera.position.z = person.position.z;
	}

	//Animation update for player standing type
	const clockDelta = clock.getDelta();
	if (mixer) { mixer.update(clockDelta); }
	if (mixer2) { mixer2.update(clockDelta); }

	//World meaning physics added to models,objects and plane
	world.step(1 / 60); //Update phyics by this step

	// planeMesh.position.copy(planeBody.position);
	// planeBody.quaternion.copy(planeBody.quaternion);

	if (person) {
		personBody.position.copy(person.position);
		personBody.quaternion.copy(person.quaternion);
	}

	//move light across the floor
	if (Math.abs(s.rotation.y) > Math.PI/4)
		r *= -1;
	s.rotation.y += r
	t.copy(new THREE.Vector3(Math.cos(s.rotation.y), 0, Math.sin(-s.rotation.y))); //update t 

	//detect if person is in the camera view
	if (person) {	
		let distance = person.position.distanceTo(safe.position)
		if(distance < 0.5)
		{
			//restart level
		}
	}

	renderer.render(scene, camera);
	renderer.setAnimationLoop(render);
}
renderer.setAnimationLoop(render);

