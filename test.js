import * as THREE from "three";
//import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from './node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';



var mass, body, shape, timeStep=1/60,
         camera, renderer, geometry, material, mesh;

let world, scene;
world = new CANNON.World();
scene = new THREE.Scene();
var cannonDebugger = new CannonDebugger( scene, world );
initThree();
initCannon();
animate();


function initCannon() {
    
    world.gravity.set(0,-3,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    shape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    mass = 1;
    body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 6, 0),
        velocity: new CANNON.Vec3(0, 0, 0),
        angularVelocity: new CANNON.Vec3(0, 0, 0)
    });

    body.addShape(shape);
    body.angularDamping = 1;
    world.addBody(body);

    var groundBody = new CANNON.Body({
        mass: 0 // mass == 0 makes the body static
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

    world.addBody(groundBody);
}

function initThree() {
    //scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 100 );
    camera.position.z = 15;
    camera.position.y = 5;
    //camera.lookAt((0,0,0));
    scene.add( camera );

    geometry = new THREE.BoxGeometry( 2, 2, 2 );
    material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );

    mesh = new THREE.Mesh( geometry, material );

    var geometry1 = new THREE.PlaneGeometry( 25 );
    var material1 = new THREE.MeshBasicMaterial({
        color: 0xf6d7b0,
        side: THREE.DoubleSide
    });
    var plane = new THREE.Mesh(geometry1, material1);
    scene.add( mesh );
    scene.add(plane);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

}

function animate() {

    requestAnimationFrame( animate );
    updatePhysics();
    cannonDebugger.update(); 
    render();

}

function updatePhysics() {

    // Step the physics world
    world.step(timeStep);

    // Copy coordinates from Cannon.js to Three.js
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);

}

function render() {

    renderer.render( scene, camera );

}