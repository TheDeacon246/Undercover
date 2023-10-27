//DO NOT PAY ATTENTION TO CODE PRIOR TO LINE 312!!!!!!!!!!!
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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

            // Show the follow-up instructions div
           // const followUpInstructions = document.getElementById('follow-up-instructions');
           // followUpInstructions.style.display = 'block';

            // Hide the follow-up instructions after 3 seconds
            setTimeout(() => {
                followUpInstructions.style.display = 'none';
            }, 10000); // Hide after 8 seconds
        }, 1000); // Hide loading screen after 1 second
    }
}


// Initial call to start the progress animation
updateProgressBar();



// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var person, house, gltfLoader, loader1, loader2, loader3, loader4, loader5, loader6, loader7, loader8, floor, gunLoader, gun, player;
const initialTimeInSeconds = 180;
let timeRemaining = initialTimeInSeconds;
let previousTimestamp = null;

var gravity = new THREE.Vector3(0, -9.8, 0);

let p = [0, 0], bool = true, mixer;
let fwd, bkd, rgt, lft, spc, dwn = false, movKey = false, rtr, rtl;

var walls = [];
var collectWalls = [];
const firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Set up camera variables
const cameraDistance = 500; // Third-person camera distance from the model
const cameraHeight = 2000;   // Third-person camera height above the model
const firstPersonOffset = new THREE.Vector3(0, 200, 300); // First-person camera offset
// Initial camera choice (first-person or third-person)
let useFirstPersonCamera = true;


init();
animate();

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
		renderer = new THREE.WebGLRenderer({ antialias: true });
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


	// Create an audio context and buffer source
const context = new (window.AudioContext || window.webkitAudioContext)();
const source = context.createBufferSource();

// Load and play the audio when the page loads
const audioLoader = new THREE.AudioLoader();
audioLoader.load('models/Hitman.mp3', (buffer) => {
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
});

// Make sure the audio continues looping
source.loop = true;

// Check if the context is suspended (e.g., due to autoplay restrictions)
if (context.state === 'suspended') {
  context.resume().then(() => {
    console.log('Audio context has been resumed automatically.');
  });
}







	person = new THREE.Object3D();
	person.add(camera);
	camera.position.set(0, 35, 10); // first-person view
	person.position.set(-5000, 100, 500);
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

	var floorT = THREE.ImageUtils.loadTexture("grass.jpg");
	floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping;
	floorT.repeat.set(10, 10);
	floor = new THREE.Mesh(new THREE.CubeGeometry(25000, 50, 25000),
		new THREE.MeshBasicMaterial({
			map: floorT
		})
	);
	floor.receiveShadow = true;
	floor.position.set(0, -50, 0);
	walls.push(floor);
	scene.add(floor);


	//gltf model
	const loader = new THREE.GLTFLoader();


	//Add soldier model
	loader.load('models/Soldier.glb', function (gltf) {
		player = gltf.scene;
		player.traverse(function (node) {
			if (node.isMesh) { node.castShadow = true; }
		});

		player.position.set(-5000, 0, 500);
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





	gltfLoader = new THREE.GLTFLoader();
	gunLoader = new THREE.GLTFLoader();
	house;
	gltfLoader.load('house/scene.glb', function (gltf) {
		house = gltf.scene;
		house.position.x = 3000;
		house.position.z = 500;
		house.scale.set(40, 40, 40);
		house.rotation.y = Math.PI / 2;
		//house.position.y = -190;

		house.traverse(function (node) {
			if (node.isMesh) {
				node.receiveShadow = true;
				walls.push(node);


			}
		});
		scene.add(house);
		//walls.push(house);
		loader1 = new THREE.GLTFLoader();
		loader1.load('models/sky/scene.gltf', function (gltf) {
			const sky = gltf.scene;
			sky.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide
					walls.push(node);
				}

			});
			sky.scale.set(300, 300, 300);

			scene.add(sky);
		});

		loader3 = new THREE.GLTFLoader();
		loader3.load('./models/luis_house_100923_9/scene.gltf', function (gltf) {
			const treeHigh = gltf.scene;
			treeHigh.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide
					walls.push(node);
				}

			});
			treeHigh.scale.set(3, 3, 3);
			treeHigh.position.y = -10;
			treeHigh.position.x = 3200;
			treeHigh.position.z = -2000;
			treeHigh.rotation.y = Math.PI / 2;

			scene.add(treeHigh);
		});

		loader4 = new THREE.GLTFLoader();
		loader4.load('./models/luis_house_100923_9/scene.gltf', function (gltf) {
			const treeHigh = gltf.scene;
			treeHigh.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide
					walls.push(node);
				}

			});
			treeHigh.scale.set(3, 3, 3);
			treeHigh.position.y = -10;
			treeHigh.position.x = 3200;
			treeHigh.position.z = 4000;
			treeHigh.rotation.y = Math.PI / 2;

			scene.add(treeHigh);
		});

		loader5 = new THREE.GLTFLoader();
		loader5.load('./models/road.glb', function (gltf) {
			const treeHigh = gltf.scene;
			treeHigh.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide
					walls.push(node);
				}

			});
			treeHigh.scale.set(2000, 10, 100);
			treeHigh.position.y = -26;

			treeHigh.position.x = -700;

			treeHigh.rotation.y = Math.PI / 2;

			scene.add(treeHigh);
		});

		loader6 = new THREE.GLTFLoader();
		loader6.load('./models/2012_mercedes_c-class.glb', function (gltf) {
			const treeHigh = gltf.scene;
			treeHigh.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide
					walls.push(node);
				}

			});
			treeHigh.scale.set(150, 150, 150);
			treeHigh.position.y = 33;

			treeHigh.position.x = 2300;
			treeHigh.position.z = -500;

			scene.add(treeHigh);
		});

		loader7 = new THREE.GLTFLoader();
		loader7.load('./models/2015_-_porsche_911_carrera_s_rigged__mid-poly/scene.gltf', function (gltf) {
			const treeHigh = gltf.scene;
			treeHigh.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide

					walls.push(node);
				}

			});
			treeHigh.scale.set(100, 100, 100);
			treeHigh.position.y = -28;
			treeHigh.position.x = 3000;
			treeHigh.position.z = -1600;
			treeHigh.rotation.y = Math.PI / 2;

			scene.add(treeHigh);
		});

		loader8 = new THREE.GLTFLoader();
		loader8.load('./models/2015_-_porsche_911_carrera_s_rigged__mid-poly/scene.gltf', function (gltf) {
			const treeHigh = gltf.scene;
			treeHigh.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.material.side = THREE.DoubleSide

					walls.push(node);
				}

			});
			treeHigh.scale.set(100, 100, 100);
			treeHigh.position.y = -28;
			treeHigh.position.x = 3000;
			treeHigh.position.z = 2600;
			treeHigh.rotation.y = Math.PI / 2;

			scene.add(treeHigh);
		});



	});

	var ambientLight = new THREE.AmbientLight(0xaaaaaa);
	scene.add(ambientLight);

	// Mouse Look (Free Look) controls 


	document.addEventListener('click', function (event) {
		var havePointerLock = 'pointerLockElement' in document ||
			'mozPointerLockElement' in document ||
			'webkitPointerLockElement' in document;
		if (!havePointerLock) return;
	
		var element = document.body;
		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock ||
			element.mozRequestPointerLock ||
			element.webkitRequestPointerLock;
		// Ask the browser to lock the pointer
		element.requestPointerLock();
	
		// Hook pointer lock state change events
		document.addEventListener('pointerlockchange', pointerLockChange, false);
		document.addEventListener('mozpointerlockchange', pointerLockChange, false);
		document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
	
		// Hook mouse move events
		// document.addEventListener("mousemove", this.moveCallback, false);
	
	}, false);


}

function moveCallback(e) {
	var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
	var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
	// store movement amounts; will be processed by update function.

}

function pointerLockChange(event) {
	var element = document.body;
	if (document.pointerLockElement === element ||
		document.mozPointerLockElement === element ||
		document.webkitPointerLockElement === element) {
		// Pointer was just locked, enable the mousemove listener
		document.addEventListener("mousemove", moveCallback, false);
	}
	else {
		// Pointer was just unlocked, disable the mousemove listener
		document.removeEventListener("mousemove", moveCallback, false);
	}
}

function projectXZ(v) { return new THREE.Vector3(v.x, 0, v.z); }

function update() {
	stats.update();
	var delta = clock.getDelta(); // seconds since last update

	var moveDistance = 400 * delta; // 200 pixels per second  // should be velocity?
	var rotateAngle = Math.PI / 4 * delta;   // pi/4 radians (45 degrees) per second





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
		move.zDist -= moveDistance * 2;
		movKey = true;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
				
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
	}
	if (keyboard.pressed("S")) {
		move.zDist += moveDistance * 2;
		movKey = true;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
				
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
	}
	// turn left/right
	if (keyboard.pressed("Q")) {
		move.yAngle += rotateAngle;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
				
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
		movKey = true;
	}
	if (keyboard.pressed("E")) {
		move.yAngle -= rotateAngle ;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
				
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
		movKey = true;
	}
	// left/right (strafe)
	if (keyboard.pressed("A")) {
		move.xDist -= moveDistance * 2;
		movKey = true;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
				
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
	}
	if (keyboard.pressed("D")) {
		move.xDist += moveDistance * 2;
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
				
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
		movKey = true;

	}


	if (movKey) {
		mixer._actions[0].enabled = false;
		mixer._actions[1].enabled = true;
	}
	// up/down (debugging fly)
	if (keyboard.pressed("T")) {
		person.velocity = new THREE.Vector3(0, 0, 0);
		person.translateY(moveDistance);
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
	}
	if (keyboard.pressed("G")) {
		person.velocity = new THREE.Vector3(0, 0, 0);
		person.translateY(-moveDistance);
		if (player) {
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
	}

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
			player.position.copy(person.position).add(new THREE.Vector3(10,0,0))
			if(person.rotation.x == Math.PI || person.rotation.x == -Math.PI){
				player.rotation.y = -person.rotation.y + Math.PI;
			}
			else{
				player.rotation.y = person.rotation.y;
			}
		}
	}

	if (keyboard.pressed("1")) {
		scene.remove(player);
		camera.position.set(0, 0, 0);
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
	if (keyboard.pressed("space") && (person.velocity.y == 0))
		person.velocity = new THREE.Vector3(0, 12, 0);

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




const textEditor = document.getElementById('textEditor');
const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Function to create a text mesh
function createTextMesh(text) {
    const textGeometry = new TextGeometry(text, {
        size: 0.5,
        height: 0.1,
    });
    return new THREE.Mesh(textGeometry, textMaterial);
}

let textMesh; // Initialize textMesh variable

textEditor.addEventListener('input', function () {
    const newText = textEditor.value;

    if (!textMesh) {
        textMesh = createTextMesh(newText);
        // Set the initial position, material, etc., for the text mesh.
        // Example: textMesh.position.set(x, y, z);
        // Example: textMesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // Add the textMesh to your scene.
        scene.add(textMesh);
    } else {
        textMesh.geometry = new TextGeometry(newText, /* your options */);
        // You may need to update the position, material, etc., depending on your use case.
    }
});

const collisionButton = document.getElementById('collisionButton');
const submitButton = document.getElementById('submitButton');

collisionButton.addEventListener('click', function () {
    textEditor.style.display = 'block';
});

// Event listener for the Enter key
textEditor.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const enteredText = textEditor.value.toLowerCase(); // Convert input to lowercase

        if (enteredText === 'yes') {
            // Show the quiz popup
			const quizPopup = document.getElementById('quizPopup');
			if (quizPopup) {
				quizPopup.style.display = 'block';
			} else {
				console.error("Element with ID 'quizPopup' not found.");
			}

            // Handle the quiz submission
            const quizSubmitButton = document.getElementById('quiz-submit-button');
            quizSubmitButton.addEventListener('click', function () {
                // Handle the quiz submission logic here
                // You can check the selected answer and provide feedback
                // You can also hide the quiz popup after submission
                quizPopup.style.display = 'none';
            });
        } else {
            console.log('Entered text:', enteredText);
        }

        // Clear the editor
        textEditor.value = '';
    }
});

// Event listener for the "Submit" button
submitButton.addEventListener('click', function () {
    const enteredText = textEditor.value.toLowerCase(); // Convert input to lowercase

    if (enteredText === 'yes') {
        // Show the quiz popup
        const quizPopup = document.getElementById('quiz-popup');
        quizPopup.style.display = 'block';

        // Handle the quiz submission
        const quizSubmitButton = document.getElementById('quiz-submit-button');
        quizSubmitButton.addEventListener('click', function () {
            // Handle the quiz submission logic here
            // You can check the selected answer and provide feedback
            // You can also hide the quiz popup after submission
            quizPopup.style.display = 'none';
        });
    } else {
        console.log('Entered text:', enteredText);
    }

    // Clear the editor
    textEditor.value = '';
});




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



// Score and collectible count
const normalMaterial = new THREE.MeshNormalMaterial()
let score = 0;
let collectibleCount = 10; // Change this value based on the number of collectibles in your scene
var collectible;

// Function to create collectible cubes
function createCollectible(x, y, z) {
	const collectibleGeometry = new THREE.BoxGeometry(1, 1, 1);
	collectible = new THREE.Mesh(collectibleGeometry, normalMaterial);
	collectible.position.set(x, y, z);
	collectible.scale.set(50, 50, 50)
	scene.add(collectible);
	collectWalls.push(collectible);

}

// // Create collectible cubes at random positions
// for (let i = 0; i < collectibleCount; i++) {
// 	const x = Math.random() * 100 - 10; // Random x position between -10 and 10
// 	const y = 0.5; // Set to half of the player's height
// 	const z = Math.random() * 100 - 10; // Random z position between -10 and 10
// 	createCollectible(x, y, z);

// }

createCollectible(4000,5,5);
createCollectible(4000,10,4000);
createCollectible(4000,5,-2000);
createCollectible(4000,10,5);
createCollectible(4000,10,1000);
createCollectible(2000,5,-4000);


// Function to handle interactions with collectibles
function handleCollectibleInteraction() {
	score++;
	collectibleCount--;

	// Update UI to display the current score and collectible count
	console.log(`Score: ${score}`);
	console.log(`Collectibles left: ${collectibleCount}`);
	scene.remove(collectible);
	//collectWalls.pop(collectible);
}



// Function to check if the player reached the checkpoint
function checkCheckpoint() {
	const checkpointX = 8; // Set the x position of the checkpoint area
	const checkpointZ = 8; // Set the z position of the checkpoint area
	if (collisionRemove(collectWalls)) {
		console.log('Checkpoint reached! Challenge completed!');

	}
}

// Event listener for player interaction with collectibles
function checkCollectibleInteractions() {
	for (let i = 0; i < scene.children.length; i++) {
		const object = scene.children[i];
		if (object instanceof THREE.Mesh && object != person && object != house && object != loader1 && object != loader2
			&& object != loader3 && object != loader4 && object != loader5 && object != loader6 && object != loader7 && object != loader8
			&& object != floor) {
			if (collisionRemove(collectWalls)) {
				// Set the position
				collisionButton.click();
				scene.remove(object);
				handleCollectibleInteraction();
			}

		}
	}
}

function updateCountdown(timestamp) {
    if (!previousTimestamp) {
        previousTimestamp = timestamp;
    }
    const deltaTime = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    // Update the time remaining.
    timeRemaining -= deltaTime / 1000; // Convert milliseconds to seconds;

    if (timeRemaining <= 0) {
        document.getElementById('countdown-text').innerHTML = 'Countdown Expired';
        document.getElementById('progress-bar').style.width = '0%';
        return;
    }

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);

    // Update the countdown text.
    document.getElementById('countdown-text').innerHTML = `Timer: ${minutes}m ${seconds}s`;

    // Update the progress bar.
    const totalDuration = 300; // Total duration in seconds
    const remainingPercentage = ((totalDuration - timeRemaining) / totalDuration) * 100;
    document.getElementById('progress-bar').style.width = remainingPercentage + '%';

    // Request the next frame.
    requestAnimationFrame(updateCountdown);
}

requestAnimationFrame(updateCountdown);

function animate() {
	requestAnimationFrame(animate);
	render();
	update();
	checkCheckpoint();
	checkCollectibleInteractions();
	const clockDelta = clock.getDelta() * 2;
	if (mixer) { mixer.update(clockDelta); }

	console.log(person.rotation);



}

function render() {

	renderer.render(scene, camera);
}