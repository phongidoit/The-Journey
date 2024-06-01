import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from './source/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from './node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';

    //------player-------

var gravity = -10;

var scene, clock, world, timeStep=1/60, player, playerBody, controls, followCam;
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled=true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor('rgb(120,120,120)');
document.getElementById('webgl').appendChild(renderer.domElement);

//var controls = new OrbitControls(camera, renderer.domElement);
var camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 50);
window.camera = camera;

var keyboard = {};
var moveSpeed = 10;
var delta = 0;
var rotateSpeed = Math.PI / 2 * 5;

var startYPosition = 0.3;
var playerPos = new THREE.Vector3(0, startYPosition, 0);
var playerRot = new THREE.Vector3(0, 0, 0);
var jumpVelocity =  8;

var isOnGround = true;
var cameraDeviation = new THREE.Vector3(-5, 4, -10);

var freecam= true, updatedTemp=false, tempPos;
scene = new THREE.Scene();
world = new CANNON.World();
var cannonDebugger = new CannonDebugger( scene, world );


function init(){
    //------environment------
    var map = getMap();  //build terrain here
    clock = new THREE.Clock();

    var light = getSpotLight(0.5);
    var ampLight = getAmbientLight(0.5);     

    player = new THREE.Mesh(
		new RoundedBoxGeometry( 1.0, 2.0, 1.0, 10, 0.5 ),
		[new THREE.MeshStandardMaterial({color: 'lightgrey'}),
        new THREE.MeshStandardMaterial({color: 'green'}),
        new THREE.MeshStandardMaterial({color: 'blue'}),
        new THREE.MeshStandardMaterial({color: 'yellow'}),
        new THREE.MeshStandardMaterial({color: 'pink'}),
        new THREE.MeshStandardMaterial({color: 'red'})
        ]
	);
    player.geometry.translate(0, -0.5, 0);
    player.capsuleInfo = {
        radius: 0.5, 
        segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, 0.0, 0))
    };
    followCam = getSphere(0.4);
    followCam.position.z = 8;
    followCam.position.y = 2;
    player.add(followCam); 
    player.castShadow = true;
    scene.add(player);

    scene.add(map);
    scene.add(light);
    scene.add(ampLight);
    
    light.position.y = 40;
    player.scale.set(0.2, 0.2, 0.2);
    player.position.y=0;
    
    camera.position.x = 3; camera.position.y = 6; camera.position.z = 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI*7.5/16;

    //controls.update();
    document.addEventListener('keydown', function(event) {
        keyboard[event.key] = true;
        if (event.key != " "){
            freecam=false;
        }
    });
    document.addEventListener('keyup', function(event) {
        keyboard[event.key] = false;
        freecam = true;
    });
    document.addEventListener('click', function(event) {
        freecam=true;
    });
    return scene;
}

function initCannon() {
    world.gravity.set(0,-10,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    playerBody = new CANNON.Body({
        mass: 25, // kg
        position: new CANNON.Vec3(0, 0.1, 0),// m
        shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.2, 0.12))
    });
    playerBody.angularVelocity.set(0,0,0);
    playerBody.angularDamping = 0.0002;
    world.addBody(playerBody);

    // Create a plane
    var groundBody = new CANNON.Body({
        mass: 0 // mass == 0 makes the body static
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
    world.addBody(groundBody);
}

function getPlane(size){
    var geometry = new THREE.PlaneGeometry(size, size);

    var textureLoader = new THREE.TextureLoader();
    var material = new THREE.MeshBasicMaterial({
        color: 0xf6d7b0,
        side: THREE.DoubleSide
    });
    material.map = textureLoader.load('./source/sand_texture.jpg');
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(6,6);
    //material.bumpMap = textureLoader.load('./source/sand_texture.jpg');

    var mesh = new THREE.Mesh(
        geometry,
        material
    );
    mesh.receiveShadow=true;
    return mesh;
}

function getAmbientLight(intensity){
    var light = new THREE.AmbientLight('rbg(10,30,40)', intensity);

    return light;
}

function getSpotLight(intensity){
    var light = new THREE.SpotLight(0xffffff, intensity);
    light.castShadow =true;
    light.shadow.bias = 0.001;
    light.shadow.mapSize.width= 2048;
    light.shadow.mapSize.height= 2048;
    return light;
}

function getSphere(r){
    var geometry = new THREE.SphereGeometry(r);
    var material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        material
    });
    var mesh = new THREE.Mesh(
        geometry,
        material
    );
    return mesh;
}

function getMap(){
    var map = new THREE.Object3D();
    
    var plane = getPlane(60);
    plane.rotation.x = -Math.PI/2;

    const loaderChar = new GLTFLoader();
    const loaderPyra = new GLTFLoader();
    map.add(plane);

    loaderPyra.load(
        // resource URL
        'source/Pyramid/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) { 
            map.add( gltf.scene );
            gltf.scene.scale.set(2, 2, 2);
            gltf.scene.position.y = 0.1;
            gltf.scene.position.x = 25;
    
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object     
        }
    );
    return map;
}

function update(renderer, scene, camera, controls, player){
    updatePhysics();
    cannonDebugger.update(); 
    renderer.render(
        scene,
        camera
    );

    requestAnimationFrame(function(){
        update(renderer, scene, camera, controls, player);
        //console.log(followCam.matrixWorld);
        camera.position.setFromMatrixPosition(followCam.matrixWorld);
        camera.lookAt(player.position);
    })
    delta = clock.getDelta();
    
    controls.update();
    handleKeyboardInput(delta, camera, player);

    // if (!freecam){
    //     if (!updatedTemp)
    //     {    
    //         tempPos = player.position.clone();
    //         tempPos.add(cameraDeviation);
    //     }
    //     else{
    //         //console.log('here');
    //         cameraDeviation.set(
    //             camera.position.x-player.position.x,
    //             camera.position.y-player.position.y,
    //             camera.position.z-player.position.z,
    //         );
    //     }
    //     //console.log(tempPos);
    //     camera.position.set(tempPos.x, tempPos.y, tempPos.z);
    //     controls.target.set(player.position.x, player.position.y, player.position.z);
    //     updatedTemp = false;
    // }
    // else{
    //     tempPos = camera.position;
    //     updatedTemp= true;
    // }

}

function updatePhysics() {
    // Step the physics world
    world.step(timeStep);

    // Copy coordinates from Cannon.js to Three.js
    player.position.copy(playerBody.position);
    player.position.y += 0.12;
    player.quaternion.copy(playerBody.quaternion);
}

function RoundNum(num)
{
    return Math.round(num*100)/100;
}

function AnyInput(keyboard){
    var inputrange=['W', 'w', 'S', 's', 'D', 'd', 'A', 'a'];
    for (let i=0; i<8; i++){
        if (keyboard[inputrange[i]]){
            return true;
        }
    }
    return false;
}

function handleKeyboardInput(delta, camera, player) {

    if (keyboard[" "]){
        if (player.position.y <= startYPosition+0.1){
            playerBody.velocity.y = jumpVelocity;
        }
    }
    if (AnyInput(keyboard)){
        const direction = new THREE.Vector3();
        player.getWorldDirection(direction);

        if (keyboard['W'] || keyboard['w']) {
            player.position.add(direction.multiplyScalar(-moveSpeed * delta));
            playerBody.position.x = player.position.x;
            playerBody.position.z = player.position.z;
        }
        if (keyboard['S']|| keyboard['s']) {
            player.position.add(direction.multiplyScalar(moveSpeed * delta));
            playerBody.position.x = player.position.x;
            playerBody.position.z = player.position.z;
        }
        if (keyboard['A']|| keyboard['a']) {
            playerRot.y += rotateSpeed * delta;
        }
        if (keyboard['D']|| keyboard['d']) {
            playerRot.y -= rotateSpeed * delta;
        }        
       player.rotation.setFromVector3(playerRot);

        //player.position.add(direction.multiplyScalar(-moveSpeed * delta));
        playerBody.position.x = player.position.x;
        playerBody.position.z = player.position.z;
    } 
    
    playerBody.quaternion.copy(player.quaternion);
    
}


var scene = init();
console.log("Physic engine loaded")
initCannon();
update(renderer, scene, camera, controls, player);

globalThis.scene = scene;