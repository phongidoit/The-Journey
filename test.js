import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from './node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';
import { threeToCannon, ShapeType } from 'three-to-cannon';

class SandKickoff{
  constructor(){
    this.clock = new THREE.Clock();
    this.numpar =200;
    this.temp=[];
  }

  createParticle(scene){
    const textureLoader = new THREE.TextureLoader();
    var sandParticles = this.sandParticles = [];
    //this.clock = new THREE.Clock();

    textureLoader.load("./source/clouds.png", texture => {
      const sandMat = new THREE.MeshBasicMaterial({
        color: 0xC2B280,
        map: texture,
        transparent: true
      });
      var container = new THREE.Object3D();
      container.name = "sandParts"
    
      const sandGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
      while (this.numpar--){
          this.sandParticles[this.numpar] = new THREE.Mesh(sandGeometry, sandMat);
          this.sandParticles[this.numpar].position.set(Math.random() * 1.5 - 3, Math.random() * 1.5 - 3, Math.random() * 1.5 - 3);
          //console.log(sandParticles);
          container.add(this.sandParticles[this.numpar]);
      }  
      scene.add(container); 
    });
    console.log(scene);
  }

  animate(container){
    //console.log(container);
    container.traverse(function(node){
      if (node.isMesh){
        var newPos = new THREE.Vector3;
        newPos.copy(node.position)
        newPos.x += Math.random()  * 0.2 - 0.1;
        newPos.y = Math.sin(Math.random() * Math.PI) * 0.5 - 1;
        newPos.z = Math.sin(Math.random() * Math.PI) * 0.5 - 1;
  
        node.position.copy(newPos);
      }
    });
  } 
}


var sandEffect;

function init(){
  var scene = new THREE.Scene();

  var box = getBox(1, 1, 1);
  var plane = getPlane(5);

  sandEffect = new SandKickoff();
  sandEffect.createParticle(scene);

  box.position.y = 0.5;
  plane.rotation.x = Math.PI/2;

  //scene.add(box);
  scene.add(plane);
  scene.add(new THREE.PointLight(1));
  plane.name = 'plane-1';
  var camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth/window.innerHeight,
      1,
      1000
  );

  camera.position.x = 1;
  camera.position.y = 1;
  camera.position.z = 7;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('webgl').appendChild(renderer.domElement);
  renderer.render(
      scene,
      camera
  );

  update(renderer, scene, camera)
}

function getBox(w, h, d){
  var geometry = new THREE.BoxGeometry(w, h, d);
  var material = new THREE.MeshBasicMaterial({
      color: 0xff0000
  });

  var mesh = new THREE.Mesh(
      geometry,
      material
  );
  return mesh;
}

function getPlane(size){
  var geometry = new THREE.PlaneGeometry(size, size);
  var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide
  });

  var mesh = new THREE.Mesh(
      geometry,
      material
  );
  return mesh;
}

function update(renderer, scene, camera){
  renderer.render(
      scene,
      camera
  );
  var plane = scene.getObjectByName("plane-1");
  plane.rotation.y += 0.001;
  plane.rotation.z += 0.001;
  var container = scene.getObjectByName('sandParts');
  
  if (container){
    container.position.copy(new THREE.Vector3(0,1,0));
    sandEffect.animate(container);
  }
  
  
  requestAnimationFrame(function(){
      update(renderer, scene, camera);
  })
}



init();