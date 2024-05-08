import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function init(){
    var scene = new THREE.Scene();
    //var gui = new dat.GUI();

    

    var plane = getPlane(12);

    var light = getDirectionalLight(1);
    const loader = new GLTFLoader();


    var camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth/window.innerHeight,
        1,
        1000
    );

    loader.load(
        // resource URL
        'source/Character2/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) {
            
            scene.add( gltf.scene );
            gltf.scene.scale.set(0.2, 0.2, 0.2);
            gltf.scene.position.y =2;
    
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
    
        }
    );

    scene.add(plane);
    scene.add(light);
    plane.rotation.x = Math.PI/2;

    camera.position.x = 1;
    camera.position.y = 2;
    camera.position.z = 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled=true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('rgb(120,120,120)');
    document.getElementById('webgl').appendChild(renderer.domElement);

    var controls = new OrbitControls(camera, renderer.domElement);
    
    update(renderer, scene, camera, controls);
    return scene;
}

function getPlane(size){
    var geometry = new THREE.PlaneGeometry(size, size);
    var material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide
    });

    var mesh = new THREE.Mesh(
        geometry,
        material
    );
    mesh.receiveShadow=true;
    return mesh;
}

function getPointLight(intensity){
    var light = new THREE.PointLight(0xffffff, intensity);
    light.castShadow =true;
    return light;
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

function getDirectionalLight(intensity){
    var light = new THREE.DirectionalLight(0xffffff, intensity);
    light.castShadow =true;
    light.shadow.left = -10;
    light.shadow.right = 10;
    light.shadow.top = 10;
    light.shadow.bottom = -10;
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




function update(renderer, scene, camera, controls){
    renderer.render(
        scene,
        camera
    );

    controls.update();
    //var plane = scene.getObjectByName("plane-1");
    //plane.rotation.y += 0.01;
    //plane.rotation.z += 0.01;

    /*
    scene.traverse(function(child){
        child.scale.x += 0.001;
    })
    */
    requestAnimationFrame(function(){
        update(renderer, scene, camera, controls);
    })
}


var scene = init();
console.log(scene);
globalThis.scene = scene;

