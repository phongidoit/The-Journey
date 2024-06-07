import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from './node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import SandKickoff from "./test.js";

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

//--Particle--
var sandEffect;

function init(){
    //------environment------
    var map = getMap();  //build terrain here
    clock = new THREE.Clock();

    var ampLight = getAmbientLight(0.3);     

    player = new THREE.Object3D;    
    followCam = new THREE.Object3D;
    followCam.position.copy(new THREE.Vector3(0,2,22));

    //--Add Audio-- 
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
    player.scale.set(0.2, 0.2, 0.2);
    player.position.y=0;

    //--where camera should be--
    testCam = new THREE.Object3D;
    followCam.getWorldPosition(testCam.position);

    sandEffect = new SandKickoff();
    sandEffect.createParticle(player);

    light2.position.y=40;
    var sun = getSphere(2, 'white');
    sun.position.copy(light2.position);

    //Add element to scene
    var map_structures = [player, map, ampLight, light2, light2.target, sun];
    for (var i=0; i< map_structures.length; i++) {scene.add(map_structures[i]);}
    
    camera.position.copy(new THREE.Vector3(3, 6, 10));
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.maxPolarAngle = Math.PI*7.75/16;

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
        angularDamping: 1,
        angularVelocity: new CANNON.Vec3(0,0,0),
        shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.35, 0.12)),
        material: bodyMat
    });
    playerBody.addEventListener("collide",function(e){isOnGround=true;})
    //world.addBody(playerBody);

    // Create a plane
    var groundBody = new CANNON.Body({
        mass: 0 // mass == 0 makes the body static
    });

    //Use this function to add Hitbox
    function staticBody(pos, size){
        var temp = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(pos[0], pos[1], pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(size[0], size[1], size[2]))
        })
        return temp;

    }

    //Set hitbox for map elements
    var pillarBody = staticBody([5, 0.01, 0], [0.35, 2.5, 0.3]);
    var tombBody = staticBody([-10.25, 0.01, 0.52], [0.2, 1, 0.2]);

    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

    //add element to Physic world
    const listBody = [groundBody, playerBody, tombBody, pillarBody, pyramidBody];
    for (var index=0; index< listBody.length; index++){world.addBody(listBody[index]);}
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
    material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(15,15);

    var mesh = new THREE.Mesh( geometry,material);
    mesh.receiveShadow=true;
    return mesh;
}

function getAmbientLight(intensity){
    var light = new THREE.AmbientLight(0xffffff, intensity);
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
    var mesh = new THREE.Mesh( geometry,material);
    return mesh;
}

function getMap(){
    var map = new THREE.Object3D();
    map.name="map";
    
    var plane = getPlane(300);
    plane.rotation.x = -Math.PI/2;

    const loaderChar = new GLTFLoader();
    const loaderPyra = new GLTFLoader();
    const loadPillar = new GLTFLoader();
    const tomb = new GLTFLoader();

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

    tomb.load(
        // resource URL
        'source/tomb/railing_pillar_from_the_amaravati_stupa/scene.gltf',

        function ( gltf ) { 
            map.add( gltf.scene );
            gltf.scene.scale.set(0.8, 0.8, 0.8);
            gltf.scene.position.y = 0.1;
            gltf.scene.position.x = -10;
    
            gltf.scene.traverse(function(node){
                if (node.isMesh) {elementNames.push(node.name);node.castShadow=true; }
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

function CustomCollisionBox(model, modelBody){
    //Remember to add modelBody into world first
    var result = threeToCannon(model, {type: ShapeType.HULL});
    const {shape, offset, orientation} = result; 
    modelBody.addShape(shape, offset, orientation);
}

function update(renderer, scene, camera, controls, player){
    pyramid = scene.getObjectByName(elementNames[0]);
    var playerModel = scene.getObjectByName("player");
    updateLight();
    //--ADD the body for model after they load
    var t= clock2.getElapsedTime();

    if (!loaded && t>1.8 && playerModel && pyramid){
        player.add(playerModel);
        playerModel.visible = true;
        playerModel.scale.set(0.2, 0.2, 0.2);
        playerModel.position.copy(new THREE.Vector3(0,1, -2));
        playerModel.rotation.set(Math.PI, 0, Math.PI*9.5/10);

        CustomCollisionBox(pyramid, pyramidBody);
        pyramidBody.position.x = 25;
        loaded=true;
    }
    updatePhysics();

    var container = scene.getObjectByName('sandParts');
    if (container && isOnGround && playerModel){
        container.visible = true;
        container.position.copy(playerModel.position);
        container.position.z += 3;
        container.position.y -= 0.5;
        sandEffect.animate(container);
    }
    else if(container && !isOnGround){
        container.visible = false;
    }

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
        playerBody.quaternion.copy(player.quaternion);
    }else if (keyboard['T']|| keyboard['t']) {
        controls.enabled = !controls.enabled; 
        controls.enableRotate = !controls.enableRotate;
        keyboard['t'] = false;
    }
    
}

var scene = init();
initCannon();
update(renderer, scene, camera, controls, player);

globalThis.scene = scene;