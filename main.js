import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from './source/RoundedBoxGeometry.js';


    //------player-------

var gravity = -10;

var scene, clock;
var keyboard = {};
var moveSpeed = 10;
var delta = 0;
var rotateSpeed = Math.PI / 2 * 1.5;
var cameraPosition = new THREE.Vector3(3, 4, 10);
var cameraRotation = new THREE.Vector3(0, 0, 0);

var  startYPosition = 0.3;
var playerPos = new THREE.Vector3(0, startYPosition, 0);
var playerRot = new THREE.Vector3(0, 0, 0);
var jumpVelocity =  10;

var cameraDeviation = new THREE.Vector3(-5, 4, -10);

var freecam= true, updatedTemp=false, tempPos;


function init(){
    var scene = new THREE.Scene();
    //var gui = new dat.GUI();    

    //------environment------
    var map = getMap();  //build terrain here
    clock = new THREE.Clock();

    var light = getSpotLight(0.5);
    var ampLight = getAmbientLight(0.5); 
    
    var camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth/window.innerHeight,
        0.1,
        50
    );
    window.camera = camera;

    var player = new THREE.Mesh(
		new RoundedBoxGeometry( 1.0, 2.0, 1.0, 10, 0.5 ),
		new THREE.MeshStandardMaterial()
	);
    player.geometry.translate(0, -0.5, 0);
    player.capsuleInfo = {
        radius: 0.5, 
        segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0))
    };
    player.castShadow = true;
    scene.add(player);

    scene.add(map);
    scene.add(light);
    scene.add(ampLight);
    
    light.position.y = 40;
    player.scale.set(0.2, 0.2, 0.2);
    player.position.y=0.3;
    
    camera.position.x = 3; camera.position.y = 6; camera.position.z = 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled=true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('rgb(120,120,120)');
    document.getElementById('webgl').appendChild(renderer.domElement);

    var controls = new OrbitControls(camera, renderer.domElement);
    //controls.update();

    document.addEventListener('keydown', function(event) {
        keyboard[event.key] = true;
        freecam=false;
    });

    document.addEventListener('keyup', function(event) {
        keyboard[event.key] = false;
        freecam = true;
    });

    document.addEventListener('click', function(event) {
        freecam=true;
    });

    update(renderer, scene, camera, controls, player);
    //animate(renderer, scene, camera, controls);
    return scene;
}

function getPlane(size){
    var geometry = new THREE.PlaneGeometry(size, size);
    var material = new THREE.MeshBasicMaterial({
        color: 0xf6d7b0,
        side: THREE.DoubleSide
    });

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
            gltf.scene.position.y = 0;
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
    renderer.render(
        scene,
        camera
    );

    requestAnimationFrame(function(){
        update(renderer, scene, camera, controls, player);
    })
    delta = clock.getDelta();
    handleKeyboardInput(delta, camera, player);

    if (!freecam){
        if (!updatedTemp)
        {    
            tempPos = player.position.clone();
            tempPos.add(cameraDeviation);
        }
        else{
            //console.log('here');
            cameraDeviation.set(
                camera.position.x-player.position.x,
                camera.position.y-player.position.y,
                camera.position.z-player.position.z,

            );
        }
        //console.log(tempPos);
        camera.position.set(tempPos.x, tempPos.y, tempPos.z);
        controls.target.set(player.position.x, player.position.y, player.position.z);
        updatedTemp = false;
    }
    else{
        tempPos = camera.position;
        updatedTemp= true;
    }
    
    camera.lookAt(player.position);
    controls.update();
    //console.log(freecam, updatedTemp);
}


function handleKeyboardInput(delta, camera, player) {
    const direction = new THREE.Vector3();
    player.getWorldDirection(direction);


    if (keyboard['W'] || keyboard['w']) {
      //playerPos.z -= moveSpeed * delta;
      player.position.add(direction.multiplyScalar(-moveSpeed * delta));
    }
    if (keyboard['S']|| keyboard['s']) {
        //playerPos.z += moveSpeed * delta;
        player.position.add(direction.multiplyScalar(moveSpeed * delta));
    }
    if (keyboard['A']|| keyboard['a']) {
        playerRot.y += rotateSpeed * delta;
    }
    if (keyboard['D']|| keyboard['d']) {
        playerRot.y -= rotateSpeed * delta;
    }
    if (keyboard[" "]){
        if (player.position.y != startYPosition){
            
        }
    }
    //player.position.copy(playerPos);
    player.rotation.setFromVector3(playerRot);

}


var scene = init();
console.log(scene);
globalThis.scene = scene;