import * as THREE from "three";

export default class SandKickoff{
  constructor(){
    this.clock = new THREE.Clock();
    this.numpar =50;
    this.temp=[];
  }

  createParticle(object){
    const textureLoader = new THREE.TextureLoader();
    var sandParticles = this.sandParticles = [];
    //this.clock = new THREE.Clock();

    textureLoader.load("./source/sand_dust.png", texture => {
      const sandMat = new THREE.MeshBasicMaterial({
        color: 0xC2B280,
        map: texture,
        transparent: true
      });
      var container = new THREE.Object3D();
      container.name = "sandParts"
    
      const sandGeometry = new THREE.SphereGeometry(1);
      while (this.numpar--){
          this.sandParticles[this.numpar] = new THREE.Mesh(sandGeometry, sandMat);
          this.sandParticles[this.numpar].position.set(Math.random() * 3 -1.5, Math.random() * 0.4-1.5, Math.random() * 2 - 1);
          //console.log(sandParticles);
          container.add(this.sandParticles[this.numpar]);
      }  
      object.add(container); 
    });
  }

  animate(container){
    //console.log(container);
    container.traverse(function(node){
      if (node.isMesh){
        var newPos = new THREE.Vector3;
        newPos.copy(node.position)
        newPos.x += Math.random() * 0.1 -0.05 ;
        newPos.y = Math.random() * 0.1-2 ;
        newPos.z = newPos.z + (Math.random()  * 0.1 - 0.05) ;
  
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


//init();