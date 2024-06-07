import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from './node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';
import { threeToCannon, ShapeType } from 'three-to-cannon';
//import json from "./source/sand_part.json"
//import System, {Emitter, Rate, Span, Position, Mass, Radius, Life, Velocity, PointZone, Vector3D, Scale}  from 'three-nebula';


    //------player-------

var scene, clock, world, timeStep=1/60, player, playerBody, controls, followCam, testCam;
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled=true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor('rgb(135,206,235)');
document.getElementById('webgl').appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 50);
window.camera = camera;
var light2 = getDirectionalLight();

var keyboard = {};
var moveSpeed = 6;
var delta = 0;
var rotateSpeed = Math.PI / 2 * 5;

var playerRot = new THREE.Vector3(0, 0, 0);
var jumpVelocity =  8;
var isOnGround = true;

scene = new THREE.Scene();
world = new CANNON.World();
var cannonDebugger = new CannonDebugger( scene, world, {
    onInit(body, mesh) {
      // Toggle visibiliy on "k" press
      document.addEventListener('keydown', (event) => {
        if (event.key === 'k') {
          mesh.visible = !mesh.visible
        }
      })
    }
});

//---here are model stuff for physic---
var pyramid, pyramidBody = new CANNON.Body();
var loaded=false;
var clock2=new THREE.Clock();

const elementNames = [];

//--particle--
// const { System: Nebula, SpriteRenderer } = window.Nebula;
// const system = new System();
// new System.fromJSONAsync(json, THREE).then(system => {
//     console.log(system);
//   });

function init(){
    //------environment------
    var map = getMap();  //build terrain here
    clock = new THREE.Clock();

    var ampLight = getAmbientLight(0.3);     

    player = new THREE.Object3D;
    //player.geometry.translate(0, -0.5, 0);

    followCam = new THREE.Object3D;
    followCam.position.z = 22;
    followCam.position.y = 2;

    const listener = new THREE.AudioListener();
    camera.add( listener );
    const sound = new THREE.Audio( listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'source/audio/Journey Soundtrack (Austin Wintory) - 17. Apotheosis.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.3 );
        sound.play();
        sound.resume();
    });

    player.add(followCam);
 
    player.castShadow = true;
    scene.add(player);

    //--where camera should be--
    testCam = new THREE.Object3D;
    followCam.getWorldPosition(testCam.position);

    scene.add(map);
    scene.add(ampLight);

    scene.add(light2);
    scene.add(light2.target);

    light2.position.y=40;
    player.scale.set(0.2, 0.2, 0.2);
    player.position.y=0;
    
    camera.position.x = 3; camera.position.y = 6; camera.position.z = 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.maxPolarAngle = Math.PI*7.75/16;

    //controls.update();
    document.addEventListener('keydown', function(event) {
        keyboard[event.key] = true;

    });
    document.addEventListener('keyup', function(event) {
        keyboard[event.key] = false;
    });

    return scene;
}

function initCannon() {
    world.gravity.set(0,-10,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    const bodyMat = new CANNON.Material('bodymat');

    playerBody = new CANNON.Body({
        mass: 40, // kg
        position: new CANNON.Vec3(0, 0.1, 0),// m
        shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.35, 0.12)),
        material: bodyMat
    });
    playerBody.angularVelocity.set(0,0,0);
    playerBody.angularDamping = 1;
    
    playerBody.addEventListener("collide",function(e){isOnGround=true;})
    world.addBody(playerBody);

    // Create a plane
    var groundBody = new CANNON.Body({
        mass: 0 // mass == 0 makes the body static
    });

    //An object with hit box
    var pillarBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(5, 0.01, 0),// m
        shape: new CANNON.Box(new CANNON.Vec3(0.35, 2.5, 0.3)),
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

    world.addBody(pillarBody);
    world.addBody(pyramidBody);
    world.addBody(groundBody);
}

function getPlane(size){
    var geometry = new THREE.PlaneGeometry(size, size, 80, 80);

    var textureLoader = new THREE.TextureLoader();
    var terrainLoader = new THREE.TextureLoader().load('./source/HeightMap1.png');
    terrainLoader.wrapS = terrainLoader.wrapT = THREE.RepeatWrapping;
    terrainLoader.repeat.set(1,2);
    var material = new THREE.MeshStandardMaterial({
        color: 0xf6d7b0,
        wireframe: false,
        side: THREE.DoubleSide,

    });
    material.map = textureLoader.load('./source/sand4.jpg');
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(15,15);

    var mesh = new THREE.Mesh(
        geometry,
        material,
    );
    mesh.receiveShadow=true;
    //mesh.position.y = -1;
    return mesh;
}

function getAmbientLight(intensity){
    var light = new THREE.AmbientLight(0xffffff, intensity);
    return light;
}

function getSpotLight(intensity){
    var light = new THREE.SpotLight(0xffffff, intensity);
    light.castShadow =true;
    light.shadow.bias = 0.001;
    light.shadow.mapSize.width= 1024;
    light.shadow.mapSize.height= 1024;
    return light;
}

function getDirectionalLight(intensity){
    var light = new THREE.DirectionalLight(0xffffff, intensity);
    light.castShadow =true;
    var size=15;
    light.shadow.camera.left = -size;
    light.shadow.camera.right = size;
    light.shadow.camera.top = size;
    light.shadow.camera.bottom = -size;

    light.shadow.mapSize.width= 512;
    light.shadow.mapSize.height= 512;
    return light;
}

function getSphere(r, color){
    var geometry = new THREE.SphereGeometry(r);
    var material = new THREE.MeshBasicMaterial({
        color: color,
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
    map.name="map";
    
    var plane = getPlane(300);
    plane.name = 'ground';
    plane.rotation.x = -Math.PI/2;

    const loaderChar = new GLTFLoader();
    const loaderPyra = new GLTFLoader();
    const loadPillar = new GLTFLoader();
    map.add(plane);

    //Load gltf 3d file
    loaderPyra.load(
        // resource URL
        'source/Pyramid/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) { 
            map.add( gltf.scene );
            gltf.scene.scale.set(2, 2, 2);
            gltf.scene.position.y = 0.1;
            gltf.scene.position.x = 25;
    
            gltf.scene.traverse(function(node){
                if (node.isMesh) {elementNames.push(node.name); node.castShadow=true; }
                node.receiveShadow=true;
            }) ;
        }    
    );   
    
    loadPillar.load(
        // resource URL
        'source/Pillar/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) { 
            map.add( gltf.scene );
            gltf.scene.scale.set(0.4, 0.4, 0.4);
            gltf.scene.position.y = -0.05;
            gltf.scene.position.x = 5;
    
            gltf.scene.traverse(function(node){
                if (node.isMesh) {console.log('here');elementNames.push(node.name);node.castShadow=true; }
                node.receiveShadow=true;
            }) ;
            
        }    
    ); 
    
    loaderChar.load(
        'source/Character2/scene.gltf',
        function(gltf){
            map.add(gltf.scene);
            gltf.scene.name = "player";
            gltf.scene.scale.set(0.05,0.05,0.05);
            gltf.scene.position.y =1;
            gltf.scene.visible = false;
            gltf.scene.traverse(function(node){
                if (node.isMesh) { node.castShadow=true;}
                if(node.name=="Sketchfab_model" && node.type=="Object3D") {node.name = 'player';}
            });
        }
    )
    return map;
}

function updateLight(){
    var playerPos=new THREE.Vector3;
    player.getWorldPosition(playerPos);
    
    light2.position.set(playerPos.x-50, light2.position.y, playerPos.z-40);
    light2.target.position.copy(playerPos);
}

function loadModel(){

}

function update(renderer, scene, camera, controls, player){
    pyramid = scene.getObjectByName(elementNames[0]);
    var playerModel = scene.getObjectByName("player");
    updateLight();
    //--ADD the body for model after they load
    var t= clock2.getElapsedTime();
    //console.log(t);
    if (!loaded && t>1.8 && playerModel){
        player.add(playerModel);
        playerModel.visible = true;
        playerModel.scale.set(0.2, 0.2, 0.2);
        playerModel.position.y=1;
        playerModel.rotation.x = Math.PI;
        playerModel.position.z =-2;
        playerModel.position.x = 0;
        playerModel.rotation.z = Math.PI*9.5/10;

        var result = threeToCannon(pyramid, {type: ShapeType.HULL});
        const {shape, offset, orientation} = result;      
        pyramidBody.addShape(shape, offset, orientation);
        pyramidBody.position.x = 25;
        loaded=true;
    }
    updatePhysics();

    cannonDebugger.update(); 
    renderer.render( scene, camera);
    requestAnimationFrame(function(){
        update(renderer, scene, camera, controls, player);
        if (!controls.enabled){
            var midVec = new THREE.Vector3, followPos = new THREE.Vector3;
            midVec.copy(camera.position);            
            followCam.getWorldPosition(followPos);
            midVec.lerp(followPos, 0.075);            
            testCam.position.copy(midVec);
            camera.position.copy(midVec);
            //camera.lookAt(player.position); 
            controls.target.copy(player.position);
            controls.update();
        }  
        else{
            controls.update();
            controls.enableRotate = true;
            controls.target.copy(playerBody.position);
        }
    })
    delta = clock.getDelta();    
    handleKeyboardInput(delta, camera, player);
}

function updatePhysics() {
    // Step the physics world
    world.step(timeStep);

    // Copy coordinates from Cannon.js to Three.js
    player.position.copy(playerBody.position);
    player.position.y += 0.1;
    player.quaternion.copy(playerBody.quaternion);
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
        if (isOnGround){
            playerBody.velocity.y = jumpVelocity;
            isOnGround=false;
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

        playerBody.position.x = player.position.x;
        playerBody.position.z = player.position.z;
        playerBody.quaternion.copy(player.quaternion);
    }else if (keyboard['T']|| keyboard['t']) {
        controls.enabled = !controls.enabled; 
        controls.enableRotate = !controls.enableRotate;
        keyboard['t'] = false;
    }
    
}

function getSand(){
    const meshGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const meshMat = new THREE.MeshLambertMaterial({color: 0xC2B280, wireframe:false });
    var sand = new THREE.Mesh(meshGeo, meshMat);


}


var scene = init();
console.log("Physic engine loaded")
initCannon();
update(renderer, scene, camera, controls, player);

globalThis.scene = scene;