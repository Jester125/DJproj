import * as THREE from "three";
const WHEEL_RADIUS = 25.0;
const WHEEL_EXTRUDE = 2.2;

class Plinth extends THREE.Mesh {
  constructor(position, size, incomingColour) {
    let plinthGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    let plinthMaterial = new THREE.MeshPhongMaterial({
      color: incomingColour,
      specular: new THREE.Color(0x131313),
      shininess: 5.0
    });
    plinthGeometry.translate(
      position.x,
      position.y,
      position.z - WHEEL_EXTRUDE * 2
    );
    //plinthGeometry.center();

    super(plinthGeometry, plinthMaterial);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  update() {}
}

class Fader extends THREE.Mesh {
  constructor(position) {
    let wiperGeometry = new THREE.CylinderGeometry(
      0.8 / Math.sqrt(2),
      1 / Math.sqrt(2),
      1,
      4,
      1
    ); // size of top can be changed
    let wiperMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x030303),
      specular: new THREE.Color(0x131313),
      shininess: 5.0
    });
    let width = 4;
    let height = 4;
    let depth = 8;
    wiperGeometry.rotateY(Math.PI / 4);

    //wiperGeometry.computeFlatVertexNormals();
    wiperGeometry.translate(position.x, position.y + 10.5, position.z + 2.5);

    super(wiperGeometry, wiperMaterial);
    this.castShadow = true;
    this.receiveShadow = true;
    this.scale.set(width, height, depth);
    this.rotation.x = (Math.PI * 2) / 4;
  }

  update(mouseX) {
    this.position.x = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(mouseX, -1, 1, -20, 20),
      -10,
      10
    );
  }
}

export class Mixer extends THREE.Object3D {
  constructor(position) {
    super();
    this.mouseOverThis = false;
    this.mouseOverThis = false;

    this.fader = new Fader(position);
    this.fader.name = "fader";
    this.plinth = new Plinth(
      position,
      new THREE.Vector3(40, 40, 10),
      new THREE.Color(0xd3d3d3)
    );
    this.group = new THREE.Group();
    this.group.add(this.fader);
    this.group.add(this.plinth);

    this.intersected = null;
    this.xfade = 0;

    this.add(this.group);
  }

  update(clicked, mouseX, intersects, crossFade) {
    if (intersects.length > 0) {
      // if the closest object intersected is not the currently stored intersection object
      if (intersects[0].object !== this.intersected) {
        // restore previous intersection object (if it exists) to its original color
        if (this.intersected) {
          if (this.intersected.name === this.fader.name) {
            this.intersected.material.color.setHex(this.intersected.currentHex);
          }
        }
        // store reference to closest object as current intersection object
        this.intersected = intersects[0].object;
        // store color of closest object (for later restoration)
        if (this.intersected.name === this.fader.name) {
          this.mouseOverThis = true;

          this.intersected.currentHex = this.intersected.material.color.getHex();
          // set a new color for closest object
          this.intersected.material.color.setHex(0xff0000);
        } else {
          //this.mouseOverThis = false;
        }
      }
    } // there are no intersections
    else {
      // restore previous intersection object (if it exists) to its original color
      if (this.intersected) {
        if (this.intersected.name === this.fader.name) {
          this.intersected.material.color.setHex(this.intersected.currentHex);
        }
      }
      // remove previous intersection object reference
      //     by setting current intersection object to "nothing"
      this.intersected = null;
      this.mouseOverThis = false;
    }

    if (clicked && this.mouseOverThis) {
      this.xfade = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(mouseX, -0.3, 0.3, 0.0, 1.0),
        0.0,
        1.0
      );

      crossFade.fade.value = this.xfade;

      this.fader.update(mouseX);
    }
  }
}
