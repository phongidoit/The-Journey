import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from './source/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from './node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';
import { threeToCannon, ShapeType } from 'three-to-cannon';

    //------player-------

var gravity = -10;

var scene, clock, world, timeStep=1/60, player, playerBody, controls, followCam, testCam;
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled=true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor('rgb(135,206,235)');
document.getElementById('webgl').appendChild(renderer.domElement);

//var controls = new OrbitControls(camera, renderer.domElement);
var camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 50);
window.camera = camera;

var keyboard = {};
var moveSpeed = 6;
var delta = 0;
var rotateSpeed = Math.PI / 2 * 5;

var startYPosition = 0.3;
var playerPos = new THREE.Vector3(0, startYPosition, 0);
var playerRot = new THREE.Vector3(0, 0, 0);
var jumpVelocity =  8;

var isOnGround = true;

scene = new THREE.Scene();
world = new CANNON.World();
var cannonDebugger = new CannonDebugger( scene, world );

//---here are model stuff for physic---
var pyramid, pyramidBody = new CANNON.Body();
var loaded=false;
var clock2=new THREE.Clock();


function init(){
    //------environment------
    var map = getMap();  //build terrain here
    clock = new THREE.Clock();

    var light = getSpotLight(0.7);
    var light2 =getDirectionalLight(0.7);
    var ampLight = getAmbientLight(0.4);     

    player = new THREE.Mesh(
		new RoundedBoxGeometry( 0.01, 0.01, 0.01, 0.01, 0.01 ),
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
        radius: 0.01, 
        segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, 0.0, 0))
    };
    followCam = new THREE.Object3D;
    followCam.position.z = 22;
    followCam.position.y = 2;

    player.add(followCam);
 
    player.castShadow = true;
    scene.add(player);

    //--where camera is--
    testCam = getSphere(0.3, 'red');
    followCam.getWorldPosition(testCam.position);

    scene.add(map);
    scene.add(ampLight);
    //scene.add(light);
    scene.add(light2);
    
    light.position.y = 40;
    player.scale.set(0.2, 0.2, 0.2);
    player.position.y=0;
    
    camera.position.x = 3; camera.position.y = 6; camera.position.z = 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI*7.75/16;

    //controls.update();
    document.addEventListener('keydown', function(event) {
        keyboard[event.key] = true;
        controls.enabled =false;

    });
    document.addEventListener('keyup', function(event) {
        keyboard[event.key] = false;

    });
    document.addEventListener('click', function(event) {

    });
    return scene;
}

function initCannon() {
    world.gravity.set(0,-10,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    playerBody = new CANNON.Body({
        mass: 40, // kg
        position: new CANNON.Vec3(0, 0.1, 0),// m
        shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.35, 0.12))
    });
    playerBody.angularVelocity.set(0,0,0);
    playerBody.angularDamping = 1;
    
    playerBody.addEventListener("collide",function(e){isOnGround=true;})
    world.addBody(playerBody);

    // Create a plane
    var groundBody = new CANNON.Body({
        mass: 0 // mass == 0 makes the body static
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

    world.addBody(pyramidBody);
    world.addBody(groundBody);
}

function getPlane(size){
    var geometry = new THREE.PlaneGeometry(size, size, 100, 100);

    var textureLoader = new THREE.TextureLoader();
    var terrainLoader = new THREE.TextureLoader().load('./source/HeightMap1.png');
    terrainLoader.wrapS = terrainLoader.wrapT = THREE.RepeatWrapping;
    terrainLoader.repeat.set(1,2);
    var material = new THREE.MeshStandardMaterial({
        color: 0xf6d7b0,
        wireframe: false,
        side: THREE.DoubleSide,

    });
    material.map = textureLoader.load('./source/sand_texture.jpg');
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(30,30);


    var mesh = new THREE.Mesh(
        geometry,
        material,
    );
    mesh.receiveShadow=true;
    //mesh.position.y = -1;
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
    light.shadow.mapSize.width= 1024;
    light.shadow.mapSize.height= 1024;
    return light;
}

function getDirectionalLight(intensity){
    var light = new THREE.DirectionalLight(0xffffff, intensity);
    light.castShadow =true;
    light.shadow.bias = 0.001;
    light.shadow.mapSize.width= 1024;
    light.shadow.mapSize.height= 1024;
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
    
            gltf.scene.traverse(function(node){
                if (node.isMesh) {node.name = "Pyramid";node.castShadow=true; node.receiveShadow=true;}
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
                if (node.isMesh) {node.name="player"; node.castShadow=true;}
            });
        }
    )
    return map;
}

function update(renderer, scene, camera, controls, player){
    pyramid = scene.getObjectById(26);
    var playerModel = scene.getObjectById(31);
    
    //--ADD the body for model after they load
    var t= clock2.getElapsedTime();
    //console.log(t);
    if (!loaded && t>1.8){
        
        player.add(playerModel);
        playerModel.visible = true;
        playerModel.scale.set(0.2, 0.2, 0.2);
        playerModel.position.y=1;
        playerModel.rotation.x = Math.PI;
        playerModel.position.z =-2;
        playerModel.position.x = 0;
        playerModel.rotation.z = Math.PI*9.5/10;
        //player = playerModel;

        var result = threeToCannon(pyramid, {type: ShapeType.HULL});

        const {shape, offset, orientation} = result;      
        pyramidBody.addShape(shape, offset, orientation);
        pyramidBody.position.x = 25;
        loaded=true;
    }
    updatePhysics();
    //uncomment to see hitbox
    cannonDebugger.update(); 
    renderer.render(
        scene,
        camera
    );

    requestAnimationFrame(function(){
        update(renderer, scene, camera, controls, player);
        var midVec = new THREE.Vector3, followPos = new THREE.Vector3;
        midVec.copy(camera.position);            
        followCam.getWorldPosition(followPos);
        midVec.lerp(followPos, 0.075);            
        testCam.position.copy(midVec);
        camera.position.copy(midVec);
        camera.lookAt(player.position);      
    })
    delta = clock.getDelta();
    
    //console.log("Ground", isOnGround);
    handleKeyboardInput(delta, camera, player);


}

function updatePhysics() {
    // Step the physics world
    world.step(timeStep);

    // Copy coordinates from Cannon.js to Three.js
    player.position.copy(playerBody.position);
    player.position.y += 0.12;
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
    }  
    playerBody.quaternion.copy(player.quaternion);
    
}


var scene = init();
console.log("Physic engine loaded")
initCannon();
update(renderer, scene, camera, controls, player);

globalThis.scene = scene;