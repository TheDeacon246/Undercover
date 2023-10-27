//DO NOT PAY ATTENTION TO CODE PRIOR TO LINE 312!!!!!!!!!!!
import { BoxGeometry, Group, HemisphereLightHelper, LoopOnce, Mesh, MeshBasicMaterial, PointLight, PointLightHelper, RectAreaLight, SpotLightHelper, TextureLoader, Vector3 } from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

var THREEx = THREEx || {};

THREEx.FullScreen = THREEx.FullScreen || {};

/**
 * test if it is possible to have fullscreen
 * 
 * @returns {Boolean} true if fullscreen API is available, false otherwise
*/
THREEx.FullScreen.available = function () {
	return this._hasWebkitFullScreen || this._hasMozFullScreen;
}

/**
 * test if fullscreen is currently activated
 * 
 * @returns {Boolean} true if fullscreen is currently activated, false otherwise
*/
THREEx.FullScreen.activated = function () {
	if (this._hasWebkitFullScreen) {
		return document.webkitIsFullScreen;
	} else if (this._hasMozFullScreen) {
		return document.mozFullScreen;
	} else {
		console.assert(false);
	}
}

/**
 * Request fullscreen on a given element
 * @param {DomElement} element to make fullscreen. optional. default to document.body
*/
THREEx.FullScreen.request = function (element) {
	element = element || document.body;
	if (this._hasWebkitFullScreen) {
		element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
	} else if (this._hasMozFullScreen) {
		element.mozRequestFullScreen();
	} else {
		console.assert(false);
	}
}

/**
 * Cancel fullscreen
*/
THREEx.FullScreen.cancel = function () {
	if (this._hasWebkitFullScreen) {
		document.webkitCancelFullScreen();
	} else if (this._hasMozFullScreen) {
		document.mozCancelFullScreen();
	} else {
		console.assert(false);
	}
}

// internal functions to know which fullscreen API implementation is available
THREEx.FullScreen._hasWebkitFullScreen = 'webkitCancelFullScreen' in document ? true : false;
THREEx.FullScreen._hasMozFullScreen = 'mozCancelFullScreen' in document ? true : false;

/**
 * Bind a key to renderer screenshot
 * usage: THREEx.FullScreen.bindKey({ charCode : 'a'.charCodeAt(0) }); 
*/
THREEx.FullScreen.bindKey = function (opts) {
	opts = opts || {};
	var charCode = opts.charCode || 'f'.charCodeAt(0);
	var dblclick = opts.dblclick !== undefined ? opts.dblclick : false;
	var element = opts.element

	var toggle = function () {
		if (THREEx.FullScreen.activated()) {
			THREEx.FullScreen.cancel();
		} else {
			THREEx.FullScreen.request(element);
		}
	}

	var onKeyPress = function (event) {
		if (event.which !== charCode) return;
		toggle();
	}.bind(this);

	document.addEventListener('keypress', onKeyPress, false);

	dblclick && document.addEventListener('dblclick', toggle, false);

	return {
		unbind: function () {
			document.removeEventListener('keypress', onKeyPress, false);
			dblclick && document.removeEventListener('dblclick', toggle, false);
		}
	};
}


/**
 * Update renderer and camera when the window is resized
 * 
 * @param {Object} renderer the renderer to update
 * @param {Object} Camera the camera to update
*/
THREEx.WindowResize = function (renderer, camera) {
	var callback = function () {
		// notify the renderer of the size change
		renderer.setSize(window.innerWidth, window.innerHeight);
		// update the camera
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}
	// bind the resize event
	window.addEventListener('resize', callback, false);
	// return .stop() the function to stop watching window resize
	return {
		/**
		 * Stop watching window resize
		*/
		stop: function () {
			window.removeEventListener('resize', callback);
		}
	};
}


THREEx.KeyboardState = function () {
	// to store the current state
	this.keyCodes = {};
	this.modifiers = {};

	// create callback to bind/unbind keyboard events
	var self = this;
	this._onKeyDown = function (event) { self._onKeyChange(event, true); };
	this._onKeyUp = function (event) { self._onKeyChange(event, false); };

	// bind keyEvents
	document.addEventListener("keydown", this._onKeyDown, false);
	document.addEventListener("keyup", this._onKeyUp, false);
}

/**
 * To stop listening of the keyboard events
*/
THREEx.KeyboardState.prototype.destroy = function () {
	// unbind keyEvents
	document.removeEventListener("keydown", this._onKeyDown, false);
	document.removeEventListener("keyup", this._onKeyUp, false);
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
THREEx.KeyboardState.ALIAS = {
	'left': 37,
	'up': 38,
	'right': 39,
	'down': 40,
	'space': 32,
	'pageup': 33,
	'pagedown': 34,
	'enter': 13,
	'escape': 27,
	'lbracket': 219,
	'rbracket': 221,
	'tab': 9
};

/**
 * to process the keyboard dom event
*/
THREEx.KeyboardState.prototype._onKeyChange = function (event, pressed) {
	// log to debug
	//console.log("onKeyChange", event, pressed, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

	// update this.keyCodes
	var keyCode = event.keyCode;
	this.keyCodes[keyCode] = pressed;

	// update this.modifiers
	this.modifiers['shift'] = event.shiftKey;
	this.modifiers['ctrl'] = event.ctrlKey;
	this.modifiers['alt'] = event.altKey;
	this.modifiers['meta'] = event.metaKey;
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
*/
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
	var keys = keyDesc.split("+");
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var pressed;
		if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
			pressed = this.modifiers[key];
		}
		else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
			pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
		}
		else {
			pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
		}
		if (!pressed) return false;
	};
	return true;
}

var Stats = function () {
	var h, a, n = 0, o = 0, i = Date.now(), u = i, p = i, l = 0, q = 1E3, r = 0, e, j, f, b = [[16, 16, 48], [0, 255, 255]], m = 0, s = 1E3, t = 0, d, k, g, c = [[16, 48, 16], [0, 255, 0]];
	h = document.createElement("div");
	h.style.cursor = "pointer";
	h.style.width = "80px";
	h.style.opacity = "0.9";
	h.style.zIndex = "10001";
	h.addEventListener("mousedown", function (a) {
		a.preventDefault();
		n = (n + 1) % 2;
		n == 0 ? (e.style.display = "block",
			d.style.display = "none") : (e.style.display = "none",
				d.style.display = "block")
	}, !1);
	e = document.createElement("div");
	e.style.textAlign = "left";
	e.style.lineHeight = "1.2em";
	e.style.backgroundColor = "rgb(" + Math.floor(b[0][0] / 2) + "," + Math.floor(b[0][1] / 2) + "," + Math.floor(b[0][2] / 2) + ")";
	e.style.padding = "0 0 3px 3px";
	h.appendChild(e);
	j = document.createElement("div");
	j.style.fontFamily = "Helvetica, Arial, sans-serif";
	j.style.fontSize = "9px";
	j.style.color = "rgb(" + b[1][0] + "," + b[1][1] + "," + b[1][2] + ")";
	j.style.fontWeight = "bold";
	j.innerHTML = "FPS";
	e.appendChild(j);
	f = document.createElement("div");
	f.style.position = "relative";
	f.style.width = "74px";
	f.style.height = "30px";
	f.style.backgroundColor = "rgb(" + b[1][0] + "," + b[1][1] + "," + b[1][2] + ")";
	for (e.appendChild(f); f.children.length < 74;)
		a = document.createElement("span"),
			a.style.width = "1px",
			a.style.height = "30px",
			a.style.cssFloat = "left",
			a.style.backgroundColor = "rgb(" + b[0][0] + "," + b[0][1] + "," + b[0][2] + ")",
			f.appendChild(a);
	d = document.createElement("div");
	d.style.textAlign = "left";
	d.style.lineHeight = "1.2em";
	d.style.backgroundColor = "rgb(" + Math.floor(c[0][0] / 2) + "," + Math.floor(c[0][1] / 2) + "," + Math.floor(c[0][2] / 2) + ")";
	d.style.padding = "0 0 3px 3px";
	d.style.display = "none";
	h.appendChild(d);
	k = document.createElement("div");
	k.style.fontFamily = "Helvetica, Arial, sans-serif";
	k.style.fontSize = "9px";
	k.style.color = "rgb(" + c[1][0] + "," + c[1][1] + "," + c[1][2] + ")";
	k.style.fontWeight = "bold";
	k.innerHTML = "MS";
	d.appendChild(k);
	g = document.createElement("div");
	g.style.position = "relative";
	g.style.width = "74px";
	g.style.height = "30px";
	g.style.backgroundColor = "rgb(" + c[1][0] + "," + c[1][1] + "," + c[1][2] + ")";
	for (d.appendChild(g); g.children.length < 74;)
		a = document.createElement("span"),
			a.style.width = "1px",
			a.style.height = Math.random() * 30 + "px",
			a.style.cssFloat = "left",
			a.style.backgroundColor = "rgb(" + c[0][0] + "," + c[0][1] + "," + c[0][2] + ")",
			g.appendChild(a);
	return {
		domElement: h,
		update: function () {
			i = Date.now();
			m = i - u;
			s = Math.min(s, m);
			t = Math.max(t, m);
			k.textContent = m + " MS (" + s + "-" + t + ")";
			var a = Math.min(30, 30 - m / 200 * 30);
			g.appendChild(g.firstChild).style.height = a + "px";
			u = i;
			o++;
			if (i > p + 1E3)
				l = Math.round(o * 1E3 / (i - p)),
					q = Math.min(q, l),
					r = Math.max(r, l),
					j.textContent = l + " FPS (" + q + "-" + r + ")",
					a = Math.min(30, 30 - l / 100 * 30),
					f.appendChild(f.firstChild).style.height = a + "px",
					p = i,
					o = 0
		}
	}
};

import * as fs from 'node:fs';

// Add this at the beginning of your main.js
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('loading-progress-bar');
const gameName = document.querySelector('#loading-content h1');

// Set the game name
gameName.textContent = 'UnderCover Infiltration';

// Simulate loading progress for 5 seconds
const totalProgressSteps = 500;
let currentProgress = 0;
const progressIncrement = totalProgressSteps / 1000; // Update progress every 10ms

function updateProgressBar() {
	currentProgress += progressIncrement;
	progressBar.style.width = currentProgress + '%';

	if (currentProgress < 50) {
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


// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var person, floor, mesh, player;
const initialTimeInSeconds = 180;
let timeRemaining = initialTimeInSeconds;
let previousTimestamp = null;

var gravity = new THREE.Vector3(0, -9.8, 0);

let startPos = new THREE.Vector3(3555, 948, -1893);
let p = [0, 0], bool = true, mixer, mixer2, mixer3;
let fwd, bkd, rgt, lft, spc, dwn = false, movKey = false, rtr, rtl; //character controls

var walls = []; //collideable objects
var collectWalls = [];

//switch between views
const firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Set up camera variables
const cameraDistance = 500; // Third-person camera distance from the model
const cameraHeight = 2000;   // Third-person camera height above the model
const firstPersonOffset = new THREE.Vector3(0, 200, 300); // First-person camera offset

// Initial camera choice (first-person or third-person)
let useFirstPersonCamera = true;

init();

//functions
function loadModel(path, scaleVec, positionVec = null, rotation = new THREE.Vector3(0,0,0)) {
	const loader = new GLTFLoader();

	loader.load(path, function (gltf) {
		const mesh = gltf.scene;
		mesh.traverse(function (node) {
			if (node.isMesh) {
				node.castShadow = true;
				node.material.side = THREE.DoubleSide
				walls.push(node);
			}
			
		});
		
		mesh.scale.copy(scaleVec);
		mesh.rotation.copy(rotation);
		if (positionVec)
			mesh.position.copy(positionVec);
		scene.add(mesh);
	});
}

function loadMovableModel(path, scaleVec, group, positionVec = null, rotation = new THREE.Vector3(0,0,0)) {
	const loader = new GLTFLoader();

	loader.load(path, function (gltf) {
		const mesh = gltf.scene;
		mesh.traverse(function (node) {
			if (node.isMesh) {
				node.castShadow = true;
				node.material.side = THREE.DoubleSide
				walls.push(node);
			}
			
		});
		
		mesh.scale.copy(scaleVec);
		mesh.rotation.copy(rotation);
		if (positionVec)
			mesh.position.copy(positionVec);
		group.add(mesh);
		
	});
}

function loadPlayerModel() {
	const loader = new GLTFLoader();

	loader.load('models/Soldier.glb', function (gltf) {
		player = gltf.scene;
		player.traverse(function (node) {
			if (node.isMesh) { node.castShadow = true; }
		});

		player.position.set(3555, 948, -1893);
		player.scale.set(60, 60, 60);
		//player.rotation.set()


		//mixer for animating model
		mixer = new THREE.AnimationMixer(player);
		mixer.clipAction(THREE.AnimationUtils.subclip(gltf.animations[0], 'idle', 23, 44)).setDuration(0.7).play();
		mixer.clipAction(THREE.AnimationUtils.subclip(gltf.animations[1], 'walk', 0, 22)).setDuration(0.7).play();
		mixer._actions[1].enabled = false;
		mixer._actions[0].enabled = true;
		//scene.add(player);
		//scene.add(player);

	},
	);
}

function invisibleCube(positionVec) {
	const geometry = new BoxGeometry(1400, 1, 1500);
	const material = new MeshBasicMaterial();
	material.transparent = true;
	material.opacity = 0;
	const cube = new Mesh(geometry, material);
	cube.position.copy(positionVec);
	cube.rotation.x = Math.PI/2;
	walls.push(cube);
	scene.add(cube);
}

function indoorLighting() {
	const light = new RectAreaLight(0xffffff, 10, 500, 500);
	light.position.set(3900, 1450, -600);
	light.lookAt(4100, 0, -600);
	// const h = new RectAreaLightHelper(light);
	// h.scale.set(200,200,200);
	// scene.add(h);
	scene.add(light);
}

function loadFurniture() {

	indoorLighting();
}

function init() {
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 1, FAR = 20000;
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	// Create two cameras: first-person and third-person

	scene.add(camera);

	// RENDERER
	if (Detector.webgl)
		renderer = new THREE.WebGLRenderer({ antialias: true});
	else
		renderer = new THREE.CanvasRenderer();
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById('ThreeJS');
	container.appendChild(renderer.domElement);

	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) });

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);

	// LIGHT
	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 250, 0);
	scene.add(light);

	//SkyBox
	var imgPrefix = "bluecloud";
	var directions = ["_bk", "_dn", "_ft", "_lf", "_rt", "_up"];
	var imgSuffix = ".jpg";
	var skyGeometry = new THREE.CubeGeometry(10000, 10000, 10000);

	var materialArray = [];
	for (var i = 0; i < 6; i++)
		materialArray.push(new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture(imgPrefix + directions[i] + imgSuffix),
			side: THREE.BackSide
		}));
	var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
	var skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
	//scene.add(skyBox);

	//character creation
	person = new THREE.Object3D();
	person.add(camera);
	camera.position.set(0, 100, 10); // first-person view
	person.position.copy(startPos);
	person.rotation.y = -Math.PI / 2.0;

	var boundingG = new THREE.CubeGeometry(40, 80, 40);

	boundingG.computeBoundingSphere();
	var boundingM = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, wireframe: true });
	var bounding = new THREE.Mesh(boundingG, boundingM);
	bounding.visible = false;
	person.add(bounding);

	person.velocity = new THREE.Vector3(0, 0, 0);

	scene.add(person);

	var coordinator = function (z, x, y) {
		return new THREE.Vector3(50 * x, 50 * y, 50 * z);
	}

	floor = new THREE.Mesh(new THREE.CubeGeometry(25000, 50, 25000),
		new THREE.MeshBasicMaterial({
			color: 0x66000000, transparent: true, opacity: 0, wireframe: true
		})
	);
	floor.receiveShadow = true;
	floor.position.set(0, 940, 0);
	walls.push(floor);
	scene.add(floor);

	//Add soldier model
	loadPlayerModel();

	if (mixer) {
		mixer._actions[1].enabled = true;
		mixer._actions[0].enabled = false;
	}

	//loading models
	loadModel("models/sky/scene.gltf", new THREE.Vector3(300, 300, 300));
	loadModel("house/scene.glb", new THREE.Vector3(250, 250, 250), new THREE.Vector3(0, 0, 200));
	invisibleCube(new THREE.Vector3(-247, 915, -2252));
	loadFurniture();

	var ambientLight = new THREE.AmbientLight(0xaaaaaa);
	scene.add(ambientLight);
}


function projectXZ(v) { return new THREE.Vector3(v.x, 0, v.z); }

function update() {
	stats.update();
	var delta = clock.getDelta(); // seconds since last update

	var moveDistance = 300 * delta; // 200 pixels per second  // should be velocity?
	var rotateAngle = Math.PI / 2 * delta;   // pi/4 radians (45 degrees) per second





	/*if (keyboard.pressed("P")) {
		camera.position.set(0, 35, 10); // first-person view
		person.position.set(50, 100, 50);
		//player.position.set(50, 100, 50);
		//player.rotation.y = -Math.PI / 2.0;
		person.rotation.y = -Math.PI / 2.0;
		person.velocity = new THREE.Vector3(0, 0, 0);
		//player.velocity = new THREE.Vector3(0, 0, 0);
	}*/

	// movement controls	
	var move = { xDist: 0, yAngle: 0, zDist: 0 };

	//  (if inactive, there will be no change)
	if (keyboard.pressed("W")) {
		move.zDist -= moveDistance * 4;
		movKey = true;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;

			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}
	}
	if (keyboard.pressed("S")) {
		move.zDist += moveDistance * 4;
		movKey = true;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;

			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}
	}
	// turn left/right
	if (keyboard.pressed("Q")) {
		move.yAngle += rotateAngle;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;

			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}

	}
	if (keyboard.pressed("E")) {
		move.yAngle -= rotateAngle;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;

			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}

	}
	// left/right (strafe)
	if (keyboard.pressed("A")) {
		move.xDist -= moveDistance * 4;
		movKey = true;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;

			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}
	}
	if (keyboard.pressed("D")) {
		move.xDist += moveDistance * 4;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;

			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}
		movKey = true;

	}


	if (movKey) {
		mixer._actions[0].enabled = false;
		mixer._actions[1].enabled = true;
	}

	// // up/down (debugging fly)
	// if (keyboard.pressed("T")) {
	// 	person.velocity = new THREE.Vector3(0, 0, 0);
	// 	person.translateY(moveDistance);
	// 	if (player) {
	// 		player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
	// 		if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
	// 			player.rotation.y = -person.rotation.y + Math.PI;
	// 		}
	// 		else {
	// 			player.rotation.y = person.rotation.y;
	// 		}
	// 	}
	// 	movKey = false;
	// }
	// if (keyboard.pressed("G")) {
	// 	person.velocity = new THREE.Vector3(0, 0, 0);
	// 	person.translateY(-moveDistance);
	// 	if (player) {
	// 		player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
	// 		if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
	// 			player.rotation.y = -person.rotation.y + Math.PI;
	// 		}
	// 		else {
	// 			player.rotation.y = person.rotation.y;
	// 		}
	// 	}
	// 	movKey = false;
	// }

	person.translateZ(move.zDist);
	person.rotateY(move.yAngle);
	person.translateX(move.xDist);
	person.updateMatrix();


	// look up/down
	if (keyboard.pressed("3")) { // third-person view
		scene.add(player);
		camera.position.set(0, 100, 30);
		camera.rotation.set(0, 0, 0);
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(15, 0, 0))
			if (person.rotation.x == Math.PI || person.rotation.x == -Math.PI) {
				player.rotation.y = -person.rotation.y + Math.PI;
			}
			else {
				player.rotation.y = person.rotation.y;
			}
		}
	}

	if (keyboard.pressed("1")) {
		scene.remove(player);
		camera.position.set(0, 100, 0);
		//camera.rotation.set(0,0,0);


	}
	/*if (keyboard.pressed("R"))
		camera.rotateX(rotateAngle);
	if (keyboard.pressed("F"))
		camera.rotateX(-rotateAngle);*/

	// process data from mouse look
	//  (if inactive, there will be no change)

	// limit camera to +/- 45 degrees (0.7071 radians) or +/- 60 degrees (1.04 radians)
	camera.rotation.x = THREE.Math.clamp(camera.rotation.x, -1.04, 1.04);
	if (player)
		player.rotation.x = THREE.Math.clamp(player.rotation.x, -1.04, 1.04);
	// pressing both buttons moves look angle to horizon
	if (keyboard.pressed("R") && keyboard.pressed("F"))
		camera.rotateX(-6 * camera.rotation.x * rotateAngle);

	// collision detection!
	if (collision(walls)) {
		person.translateX(-move.xDist);
		//player.translateX(-move.xDist);
		person.rotateY(-move.yAngle);
		//player.rotateY(-move.yAngle);
		person.translateZ(-move.zDist);
		//player.translateZ(-move.zDist);
		person.updateMatrix();

		if (collision(walls))
			console.log("Something's wrong with collision...");

	}

	// TODO: make sure there is no double-jump glitch
	//	(e.g. hold down space sometimes results in double-jump)
	/*if (keyboard.pressed("space") && (person.velocity.y == 0))
		person.velocity = new THREE.Vector3(0, 12, 0);*/

	person.velocity.add(gravity.clone().multiplyScalar(delta));
	person.translateY(person.velocity.y);
	person.updateMatrix();
	if (collision(walls)) {
		person.translateY(-person.velocity.y);
		person.updateMatrix();
		person.velocity = new THREE.Vector3(0, 0, 0);
	}
}



// returns true on intersection
function collision(wallArray) {
	// send rays from center of person to each vertex in bounding geometry
	for (var vertexIndex = 0; vertexIndex < person.children[1].geometry.vertices.length; vertexIndex++) {
		var localVertex = person.children[1].geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(person.matrix);
		var directionVector = globalVertex.sub(person.position);

		var ray = new THREE.Raycaster(person.position, directionVector.clone().normalize());
		var collisionResults = ray.intersectObjects(wallArray);
		if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length())
			return true;

	}
	return false;
}

function collisionRemove(wallArray) {
	// send rays from center of person to each vertex in bounding geometry

	for (var vertexIndex = 0; vertexIndex < person.children[1].geometry.vertices.length; vertexIndex++) {
		var localVertex = person.children[1].geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(person.matrix);
		var directionVector = globalVertex.sub(person.position);

		var ray = new THREE.Raycaster(person.position, directionVector.clone().normalize());
		var collisionResults = ray.intersectObjects(wallArray);
		if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length())
			return true;
		scene.remove(collectible);
	}
	return false;
}

// Collectibles and Inventory  -----------------------------------------------------------------------------------------------------
let zoomed = false; //see if 

class Zoomable{
	constructor({path, scaleVec, positionVec, rotation = new THREE.Vector3(0, 0, 0)}) {
		this.model = new Group();
		loadMovableModel(path, scaleVec, this.model, positionVec, rotation);
		this.zoomed = false;
		this.model.addEventListener('click', this.handleClick.bind(this));
	}

	handleClick(event) {
		if (zoomed) {
			zoomed = false;
			this.zoomOut();
		}

		else {
			zoomed = true;
			this.zoomIn();
		}
	}

	zoomIn() {
		camera.fov *= 0.3;
		camera.updateProjectionMatrix();
	}
 	
	zoomOut() {
		camera.fov *= -0.3;
		camera.updateProjectionMatrix();
	}
}


//track all collectibles inside level
let collectibles = [];

// Collectibles: items for player to collect to solve puzzles with
class Collectible extends THREE.Mesh{
    constructor({name}) {
		
		super (			            
			new THREE.BoxGeometry(1,1,1),
            new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(`images/collectibles/${name}.jpg`)})
			)
		this.name = name;

    }
}

// Function to create collectible items
function createCollectible(name, positionVec, scaleVec) {
	const c = new Collectible({name: name});
	c.position.set(0,0,0);
	c.scale.copy(scaleVec);	
	c.position.copy(positionVec);
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
                distance = 10000;

			if (distance < 500) {
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
	var img = '<img src = "images/collectibles/'+ name +'.jpg" width = "100px" height = "100px"></img>';
    var html = '<div class = "inv-item" id = "' + name + '">' + img + '</div>'; //div with id name and image of inv item
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
		selectedItem = name; //select item
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

//surveilence camera
const s = new Group()

class Surveilence {
    constructor() {
        this.camera = new GLTFLoader().load('camera/scene.gltf',
			(gltf) => {
				var m = gltf.scene;
				m.scale.set(300, 300, 300);
				m.position.set(450, 1200, -750);

				// Create an AnimationMixer, and get the list of AnimationClip instances
				mixer2 = new THREE.AnimationMixer( m );
				const clips = m.animations;

				// Update the mixer on each frame
				// mixer2.clipAction(gltf.animations[1]).setDuration(10).play();
				mixer2.clipAction(gltf.animations[0]).setDuration(4).play();

				scene.add(m);
			})
    }
}

new Surveilence();

//camera light
var view = new THREE.SpotLight(0xffee00, 30, 5, Math.PI/12, 1, 0)
// var help = new SpotLightHelper(view);
// help.scale(100,100,100);
view.position.set(750, 1200, -750);
// scene.add(help);

s.add(view)
s.add(view.target)

// //light cone
// const geom = new THREE.ConeGeometry( 1.9, 4); 
// const matrial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
// const cone = new THREE.Mesh(geom, matrial ); 
// cone.material.transparent = true;
// cone.material.opacity = 0.5;
// cone.scale.set(200,200,200);

// //angling the cone
// cone.rotation.set(0, 0, 0.4);
// cone.position.set(600, 915, -500);
// s.add( cone );

s.rotation.y = 0;
// s.position.set(600, 915, -500)
view.target.position.x += 200;

scene.add(s);

createCollectible("key", new THREE.Vector3(400, 755, 20), new THREE.Vector3(50,1,50));

//rotation variables
var r = 0.01; //speed
var t = new THREE.Vector3().copy(view.target.position); //keeps track of light focus location

function restart() {
	//back to initiate position
	person.position.copy(startPos);
	// const sound = loadSoundEffect("restart")
	// sound.play();
}

let stopGame = 0;
// const geometry = new THREE.SphereGeometry( 10, 32, 16 ); 
// const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); 
// const sphere = new THREE.Mesh( geometry, material ); scene.add( sphere );
// sphere.position.set(0,0,0);
// scene.add(sphere);

//safe model
let safe = new THREE.Group();
let loader = new THREE.GLTFLoader();
loader.load('models/safe/scene.gltf', 
	(gltf) => {
		mesh = gltf.scene;
		mesh.position.set(0,0,0);
		mesh.scale.set(1, 1, 1)
		mesh.rotation.y = Math.PI/2;

		safe.add(mesh);
	},
);
safe.position.set(1235,855,-2191);

scene.add(safe)

function animate() {
	requestAnimationFrame(animate);
	render();
	update();
	checkCollectibleInteractions();
	const clockDelta = clock.getDelta() * 2;
	if (mixer) { mixer.update(clockDelta); }
	if (mixer2) { mixer2.update(clockDelta); }

	//move light across the floor
	if (Math.abs(s.rotation.y) > Math.PI/6)
		r *= -1;
	s.rotation.y += r
	t = new THREE.Vector3(200 * Math.cos(s.rotation.y) + view.position.x, 0, 200 * Math.sin(-s.rotation.y) + view.position.z) //update t

	if(player){
		// console.log(selectedItem);
		if (player.position.distanceTo(t) < 1000) {
			restart();
		}
		if (person.position.distanceTo(safe.position) < 150 && selectedItem == "key") {
			removeFromInventory("key");
			stopGame = 1;
		}
	}

}

function render() {

	renderer.render(scene, camera);
	if (stopGame == 1){
		endGame();
	}
}

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

	location.replace("htmls/level-3.html"); //switch between htmls
}

animate();