import '/style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';

//global variables --------------------------------------------------------------------------------------------------------------------------------------------
const audioListener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();

//functions ----------------------------------------------------------------------------------------------------------------------------------------------------
function loadSoundEffect(name) {
	const sound = new THREE.Audio(audioListener);

	audioLoader.load(`sounds/sound-effects/${name}.mp3`, function(buffer){
		sound.setBuffer(buffer);
		sound.setLoop(false);
		sound.setVolume(1.0);
		}
	);

	return sound;
}

function loadModel(name, positionVec, scaleVec) {
	const loader = new GLTFLoader(); //Model Loader
	var mesh; //model mesh
	let mixer, mixer2; //animate animated objects

	loader.load(`models/${name}/scene.gltf`, 
		(gltf) => {
			mesh = gltf.scene;
			mesh.traverse(function (node) { //house casts shadow
				if (node.isMesh) { 
					node.castShadow = true; 
					node.material.depthWrite = true;
					node.material.roughness = 0;
				}
			});
			mesh.position.set(0, 0, 0);
			mesh.scale.copy(scaleVec);
			mesh.position.copy(positionVec);

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
}

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
camera.add(audioListener);
container.add(camera);

//Light for outside "sun"
const sun = new THREE.AmbientLight(0x404040);
scene.add(sun);

// Floor -----------------------------------------------------------------------------------------------------------------------------------


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

	// planeBody.position.y = -5
	planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	world.addBody(planeBody)
}

// createFloor();

//person physics
const personPhysMat = new CANNON.Material();

let person;

const personContactMat = new CANNON.ContactMaterial(
	personPhysMat,
	{ restitution: 0.9 }
);

let personBody;
const startPos = new THREE.Vector3(4, 0,5);

// Loading Models  ----------------------------------------------------------------------------------------------------------------------------
const loader = new GLTFLoader(); //Model Loader
var mesh; //model mesh
let mixer, mixer2; //animate animated objects

//Add soldier model
loader.load('models/Soldier.glb', function (gltf) {
	person = gltf.scene;
	person.traverse(function (node) {
		if (node.isMesh) { node.castShadow = true; }
	});
	person.position.copy(startPos);

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
		mesh.scale.set(0.9, 0.9, 0.9);
		mesh.position.y = -3;
	
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

//cupboard model
// loader.load('models/cupboard/scene.gltf', 
// 	(gltf) => {
// 		mesh = gltf.scene;
// 		mesh.traverse(function (node) { //house casts shadow
// 			if (node.isMesh) { 
// 				node.castShadow = true; 
// 			}
// 		});
// 		mesh.position.set(0, 0, 0);
// 		mesh.scale.set(0.005, 0.005, 0.005);
// 		mesh.position.set(-4.7, 0, -6.5);
	
// 		scene.add(mesh);
// 	},

// 	(xhr) => {
//         // Loading progress callback (optional)
//         console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
//     },

//     (error) => {
//         // Error callback
//         console.error('Error loading GLTF model:', error);
//     }
// );

//allow safe to be moved
var safe = new THREE.Group();

//safe model
loader.load('models/safe/scene.gltf', 
	(gltf) => {
		mesh = gltf.scene;
		mesh.position.set(0,0,0);
		mesh.scale.set(0.01,0.01,0.01)
		mesh.position.set(-4.7,1,-6.5);

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
		if (fwd) { console.log('w'); dwn = true; person.rotation.y = 0 * Math.PI / 180; p = [0, -0.1]; movKey = true;}
		if (bkd) { console.log('s'); dwn = true; person.rotation.y = 180 * Math.PI / 180; p = [0, 0.1]; movKey = true; }
		if (lft) { console.log('a'); dwn = true; person.rotation.y = 90 * Math.PI / 180; p = [-0.1, 0]; movKey = true; }
		if (rgt) { console.log('d'); dwn = true; person.rotation.y = -90 * Math.PI / 180; p = [0.1, 0]; movKey = true; }
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
				m.position.set(2.3, 1.75, -3.5)

				// Create an AnimationMixer, and get the list of AnimationClip instances
				mixer2 = new THREE.AnimationMixer( m );
				const clips = m.animations;

				// Update the mixer on each frame
				// mixer2.clipAction(gltf.animations[1]).setDuration(10).play();
				mixer2.clipAction(gltf.animations[0]).setDuration(7).play();

				scene.add(m);
			})
    }
}

new Surveilence();

//camera light
var view = new THREE.SpotLight(0xffee00, 30, 5, Math.PI/12, 1, 0)
view.position.set(0.1, 3, 0)

s.add(view)
s.add(view.target)




const radius = Math.sqrt(Math.pow(1.3 - 1, 2) + Math.pow(3.5 - 1,2));

//light cone
const geom = new THREE.ConeGeometry( 1.9, 4); 
const matrial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
const cone = new THREE.Mesh(geom, matrial ); 
cone.material.transparent = true;
cone.material.opacity = 0.5;

//angling the cone
cone.rotation.set(0, 0, 0.4);
cone.position.set(1.9, 0, 0);
s.add( cone );

s.rotation.y = 0;
s.position.set(2.3, 0, -3.5);
view.target.position.x = 2;
var h = new THREE.SpotLightHelper(view);

scene.add(h);
scene.add(s);

createCollectible(1.5, 0.2,-2.2, "key");

//rotation variables
var r = 0.01
var t = new THREE.Vector3().copy(view.target.position); //keeps track of light focus location

//render variables
let clock = new THREE.Clock();
let p = [0, 0]; //update person position

let zoomed = 0;

function zoomIn() {
	camera.fov *= 0.3;
	camera.updateProjectionMatrix();
}

function zoomOut() {
	camera.fov *= -0.3;
	camera.updateProjectionMatrix();
}

function restart() {
	//back to initiate position
	person.position.copy(startPos);
	const sound = loadSoundEffect("restart")
	sound.play();
}

loadModel("fridge", new THREE.Vector3(15, 0.8, -3), new THREE.Vector3(1, 1, 1));
let l = new THREE.PointLight(0xffffff, 10);
l.position.set(14, 1.5, -3);
var help = new THREE.PointLightHelper(l);
scene.add(l);
scene.add(help);

let stopGame = 0;
const geometry = new THREE.SphereGeometry( 0.1, 32, 16 ); 
const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); 
const sphere = new THREE.Mesh( geometry, material ); scene.add( sphere );
sphere.position.set(0,0,0);
scene.add(sphere);

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
		camera.position.y = 2;
		camera.position.z = person.position.z + 4; 
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
	if (Math.abs(s.rotation.y) > Math.PI/6)
		r *= -1;
	s.rotation.y += r
	t = new THREE.Vector3(2 * Math.cos(s.rotation.y) + s.position.x, 0, 2 * Math.sin(-s.rotation.y) + s.position.z) //update t 
	sphere.position.copy(t);


	//detect if person is in the camera view
	if (person) {	
		if(person.position.distanceTo(t) < 1)
		{
			// restart();
		}
		// console.log(person.position);

		// if (person.position.distanceTo(new THREE.Vector3(-4.7,0,-6.5)) < 0.5 && !zoomed) {
		// 	zoomIn();
		// 	zoomed = 1;
		// }

		if (person.position.distanceTo(new THREE.Vector3(-4.7,0,-6.5)) < 1.5 && selectedItem == "key") {
			removeFromInventory("key");
			stopGame = 1;
		}
	}
	renderer.render(scene, camera);
	if (stopGame == 1){
		endGame();
	}
}

renderer.setAnimationLoop(render);

//stops game
function endGame(){
	renderer.setAnimationLoop(null);
	document.getElementById("inventory").style.opacity = 0
	scene.visible = false;
	scene.background = new THREE.Color(0xffffff);

	const element = document.createElement('div')
	element.innerHTML = "LEVEL \nCOMPLETE :)"
	element.id = "gameover"
	document.body.appendChild(element)

	//location.replace("htmls/level-3.html"); //switch between htmls
}

