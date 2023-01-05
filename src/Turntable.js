import * as THREE from "three";

const WHEEL_RADIUS = 25.0;
const WHEEL_EXTRUDE = 2.2;

class Platter extends THREE.Mesh {
  constructor(position) {
    let texture = new THREE.TextureLoader().load("./images/6284.jpg");
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(1 / 128, 1 / 128);
    texture.offset.set(0.5, 0.5);

    let material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      color: new THREE.Color(0xffffff)
    });

    let wheelShape = new THREE.Shape();
    wheelShape.ellipse(
      0.0,
      0.0,
      WHEEL_RADIUS,
      WHEEL_RADIUS,
      Math.PI * -2.5,
      Math.PI * -0.5
    );

    let extrudeSettings = {
      depth: WHEEL_EXTRUDE,
      curveSegments: 128,
      bevelEnabled: false,
      bevelSegments: 16,
      steps: 5,
      bevelSize: 3.0,
      bevelThickness: 1.0
    };
    let geometry = new THREE.ExtrudeGeometry(wheelShape, extrudeSettings);
    geometry.translate(position.x, position.y, position.z);
    let centre = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter(centre);
    geometry.center();

    super(geometry, material);

    this.position.copy(centre);

    this.castShadow = true;
    this.receiveShadow = true;
  }

  update(direction) {
    if (direction > 0.0) {
      this.rotation.z -= 0.025;
    } else {
      this.rotation.z += 0.025;
    }
  }
}

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

export class Turntable extends THREE.Object3D {
  constructor(position, platterName) {
    super();
    this.mouseOverThis = false;

    this.platter = new Platter(position);
    this.platter.name = platterName;
    this.plinth = new Plinth(
      position,
      new THREE.Vector3(60, 60, 10),
      new THREE.Color(0x434343)
    );
    this.group = new THREE.Group();
    this.group.add(this.platter);
    this.group.add(this.plinth);

    this.intersected = null;
    this.direction = 1;
    this.add(this.group);
  }

  update(clicked, targetRotation, intersects, player) {
    let rotator = targetRotation - this.platter.rotation.z;

    // if there is one (or more) intersections

    if (intersects.length > 0) {
      // if the closest object intersected is not the currently stored intersection object
      if (intersects[0].object !== this.intersected) {
        // restore previous intersection object (if it exists) to its original color
        if (this.intersected) {
          if (this.intersected.name === this.platter.name) {
            this.intersected.material.color.setHex(this.intersected.currentHex);
          }
        }
        // store reference to closest object as current intersection object
        this.intersected = intersects[0].object;

        // store color of closest object (for later restoration)
        if (this.intersected.name === this.platter.name) {
          this.mouseOverThis = true;

          this.intersected.currentHex = this.intersected.material.color.getHex();
          // set a new color for closest object
          this.intersected.material.color.setHex(0xff00ff);
        } else {
          this.mouseOverThis = false;
        }
      }
    } // there are no intersections
    else {
      // restore previous intersection object (if it exists) to its original color
      if (this.intersected) {
        if (this.intersected.name === this.platter.name) {
          this.intersected.material.color.setHex(this.intersected.currentHex);
        }
      }
      // remove previous intersection object reference
      // by setting current intersection object to "nothing"
      this.intersected = null;
      this.mouseOverThis = false;
    }

    if (clicked && this.mouseOverThis && rotator > 0) {
      player.reverse = false;
      this.direction = 1;
      player.playbackRate = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(rotator, -0.5, 0.5, -2.0, 2.0),
        0.0,
        1.0
      );
      this.platter.rotation.z += rotator;
    } else if (!clicked && !this.mouseOverThis && rotator > 0) {
      player.playbackRate = 1;
    } else if (clicked && this.mouseOverThis && rotator < 0.0) {
      player.reverse = true;
      this.direction = -1;
      player.playbackRate = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(rotator, 1.5, -0.5, 2.0, 0.0),
        0.0,
        2.0
      );
      this.platter.rotation.z += rotator;
    } else if (!clicked && !this.mouseOverThis && rotator < 0) {
      player.playbackRate = 1;
    } else {
      player.playbackRate = 1;
    }

    this.platter.update(this.direction);
  }
}
