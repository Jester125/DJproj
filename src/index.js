import * as THREE from "three";
import * as Tone from "tone";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
//import { Turntable, Mixer } from "./djObjects.js";
import { Turntable } from "./Turntable.js";
import { Mixer } from "./Mixer.js";
import "./styles.css";

let scene, camera, renderer;

let colour, intensity, light;
let ambientLight;

let orbit;

let clock, delta, interval;
let sceneHeight, sceneWidth;

let raycaster;
let mouse, targetRotation, targetRotationOnMouseDown;
let turntable1, turntable2;
let mixer;
let clicked = false;

let player1, player2;
let crossFade;

let startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  // remove overlay
  let overlay = document.getElementById("overlay");
  overlay.remove();

  //create our clock and set interval at 30 fpx
  clock = new THREE.Clock();
  delta = 0;
  interval = 1 / 30;

  //create our scene
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfdfdf);
  //create camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 80;
  //specify our renderer and add it to our document
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //create the orbit controls instance so we can use the mouse move around our scene
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enabled = false;
  orbit.enableZoom = false;

  // lighting
  colour = 0xffffff;
  intensity = 1;
  light = new THREE.DirectionalLight(colour, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove, false);
  window.addEventListener("mousedown", onMouseDown, false);
  window.addEventListener("mouseup", onMouseUp, false);
  crossFade = new Tone.CrossFade().toDestination();
  player1 = new Tone.Player("./sounds/Warrpy.mp3", () => {
    player1.loop = true;
    player1.autostart = true;
  }).connect(crossFade.a);
  player2 = new Tone.Player("./sounds/Warrpy.mp3", () => {
    player2.loop = true;
    player2.autostart = true;
  }).connect(crossFade.b);

  turntable1 = new Turntable(new THREE.Vector3(-60, 0, 0), "platter1");
  scene.add(turntable1);
  turntable2 = new Turntable(new THREE.Vector3(60, 0, 0), "platter2");
  scene.add(turntable2);
  mixer = new Mixer(new THREE.Vector3(0, -10, 0));
  scene.add(mixer);
  targetRotation = 0;
  targetRotationOnMouseDown = 0;

  play();
}

// stop animating (not currently used)
function stop() {
  renderer.setAnimationLoop(null);
}

// simple render function

function render() {
  renderer.render(scene, camera);
}

// start animating

function play() {
  //using the new setAnimationLoop method which means we are WebXR ready if need be
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

//our update function

function update() {
  orbit.update();
  delta += clock.getDelta();
  // update the picking ray with the camera and mouse position

  if (delta > interval) {
    raycaster.setFromCamera(mouse, camera);
    // calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects(scene.children, true);

    turntable1.update(clicked, mouse.y, intersects, player1);
    turntable2.update(clicked, mouse.y, intersects, player2);
    mixer.update(clicked, mouse.x * 2, intersects, crossFade);
    delta = delta % interval;
  }

  //update stuff in here
}

function onWindowResize() {
  //resize & align
  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseDown(event) {
  let windowHalfY = window.innerHeight / 2;
  clicked = true;
  targetRotation = targetRotationOnMouseDown - (mouse.y - windowHalfY) * 0.2;
}

function onMouseUp(event) {
  clicked = false;
}
