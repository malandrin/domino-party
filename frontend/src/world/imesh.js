import * as THREE from 'three'
import _ from 'lodash'


export class IMesh {
  constructor(size, geometry, castShadow) {
    this.auxMatrix = new THREE.Matrix4()
    this.auxColor = new THREE.Color()
    this.auxVector = new THREE.Vector3()
    this.auxVector2 = new THREE.Vector3()
    this.auxQuaternion = new THREE.Quaternion()
    this.auxEuler = new THREE.Euler(0, 0, 0, 'XYZ')
    this.size = size
    this.needsTransformUpdate = false
    this.needsColorUpdate = false

    let instancedGeometry = new THREE.InstancedBufferGeometry()

    this.colors = new Float32Array(size * 3)
    this.colors.fill(0xffffff, 0, size)

    instancedGeometry.vertexColors = true
    instancedGeometry.setAttribute('color', new THREE.InstancedBufferAttribute(this.colors, 3))

    this.material = new THREE.MeshLambertMaterial({vertexColors: true})

    THREE.BufferGeometry.prototype.copy.call(instancedGeometry, geometry)

    this.mesh = new THREE.InstancedMesh(instancedGeometry, this.material, size)
    this.mesh.castShadow = castShadow
    this.mesh.receiveShadow = true
    this.mesh.iMesh = this
  }

  setCount(count) {
    this.mesh.count = count
  }

  getCount() {
    return this.mesh.count
  }

  setTransformAt(idx, x, y, z, rotY, scale) {
    if (_.isUndefined(scale)) {
      scale = 1
    }

    this.auxMatrix.identity()
    this.auxQuaternion.setFromEuler(new THREE.Euler(0, rotY, 0))
    this.auxVector.set(x, y, z)
    this.auxVector2.set(scale, scale, scale)

    this.auxMatrix.compose(this.auxVector, this.auxQuaternion, this.auxVector2)
    this.mesh.setMatrixAt(idx, this.auxMatrix)
    this.needsTransformUpdate = true
  }

  setColorAt(idx, hexColor) {
    if (this.colors) {
      this.auxColor.set(hexColor)
      this.auxColor.toArray(this.colors, idx * 3)
      this.needsColorUpdate = true
    }
  }

  getColorAt(idx) {
    if (!this.colors) {
      return '#ffffff'
    }

    this.auxColor.fromArray(this.colors, idx * 3)
    return `#${this.auxColor.getHexString()}`
  }

  prepareRender() {
    if (this.needsColorUpdate && this.colors) {
      this.mesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(this.colors, 3))
    }

    this.mesh.instanceMatrix.needsUpdate = this.needsTransformUpdate

    this.needsColorUpdate = false
    this.needsTransformUpdate = false
  }
}

export class IMeshManaged extends IMesh {
  constructor(size, geometry, castShadow) {
    super(size, geometry, castShadow)

    this.freeEntries = []

    for (let i = 0; i < this.size; ++i) {
      this.freeEntries.push(i)
    }
  }

  useEntry() {
    if (this.freeEntries.length === 0) {
      // todo: manage error
      return -1
    }

    return this.freeEntries.pop()
  }

  freeEntry(idx) {
    this.freeEntries.push(idx)
  }
}