import * as THREE from 'three'
import Ammo from 'ammo.js'
import _ from 'lodash'
import {TILE_SIZE, BALL_RADIUS} from '@/defines'

const GROUND_MASS = 0
const GROUND_SHAPE = new Ammo.btBoxShape(new Ammo.btVector3(55, 0.5, 55))
const GROUND_LOCAL_INERTIA = new Ammo.btVector3(0, 0, 0)
GROUND_SHAPE.calculateLocalInertia(0, GROUND_LOCAL_INERTIA)

const TILE_MASS = 5
const TILE_SHAPE = new Ammo.btBoxShape(new Ammo.btVector3(TILE_SIZE.x / 2, TILE_SIZE.y / 2, TILE_SIZE.z / 2))
const TILE_LOCAL_INERTIA = new Ammo.btVector3(0, 0, 0)
TILE_SHAPE.calculateLocalInertia(TILE_MASS, TILE_LOCAL_INERTIA)

const BALL_MASS = 5
const BALL_SHAPE = new Ammo.btSphereShape(BALL_RADIUS)
const BALL_LOCAL_INERTIA = new Ammo.btVector3(0, 0, 0)
BALL_SHAPE.calculateLocalInertia(BALL_MASS, BALL_LOCAL_INERTIA)

const FALLING_TIME_BEFORE_SLEEP = 1
const FADING_COLOR = new THREE.Color(0xff6600)

let EntityIdGen = 0

class Entity {
  constructor(options) {
    this.options = options || {}

    this.id = EntityIdGen++
    this.name = this.options.name || 'Entity'
    this.position = this.options.position ? this.options.position.clone() : new THREE.Vector3()
    this.rotation = new THREE.Quaternion()
    this.angleY = 0
    this.parent = this.options.parent || null
    this.userData = this.options.userData || {}
    this.type = this.options.type || 'entity'
    this.visible = true
    this.frozen = false

    if (options.angleY) {
      this.angleY = options.angleY
      this.rotation.setFromEuler(new THREE.Euler(0, options.angleY, 0))
    } else if (options.rotation) {
      this.rotation.copy(options.rotation)
    }
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z)
  }

  getWorldPosition() {
    if (!this.parent) {
      return this.position.clone()
    }

    let position = this.position.clone()
    position.add(this.parent.getWorldPosition())
    return position
  }

  setRotation(y) {
    this.angleY = y
    this.rotation.setFromEuler(new THREE.Euler(0, y, 0))
  }

  getRotationY() {
    return this.angleY
  }

  getWorldRotationY() {
    if (!this.parent) {
      return this.angleY
    }

    return this.parent.getWorldRotationY() + this.angleY
  }

  move(offsetX, offsetY, offsetZ) {
    this.position.set(this.position.x + offsetX, this.position.y + offsetY, this.position.z + offsetZ)
  }

  rotate(offsetY) {
    this.setRotation(this.angleY + offsetY)
  }

  setParent(parent) {
    this.parent = parent
  }

  getColor() {
    return '#ffffff'
  }

  setVisible(visible) {
    this.visible = visible
  }

  setFrozen(frozen) {
    this.frozen = frozen
  }

  tick() {}
}

export class Group extends Entity {
  constructor(options) {
    super(_.assign(options, {
      type: 'group'
    }))

    this.children = []
  }

  addChild(child) {
    child.setParent(this)
    this.children.push(child)
  }

  removeChild(child) {
    child.setParent(null)
    this.children = this.children.filter(t => t.id !== child.id)
  }

  tick(delta) {
    for (const child of this.children) {
      child.tick(delta)
    }
  }

  saveState() {
    for (const child of this.children) {
      child.saveState()
    }
  }

  restoreState() {
    for (const child of this.children) {
      child.restoreState()
    }
  }

  setVisible(visible) {
    Entity.prototype.setVisible.call(this, visible)

    for (const child of this.children) {
      if (child.type === 'group') {
        child.setVisible(visible)
      } else {
        // I do this instead call setVisible of the child to avoid modify the child's private "visible" variable
        if (visible) {
          if (child.visible) {
            child.scale.set(1, 1, 1)
          }
        } else {
          child.scale.set(0, 0, 0)
        }
        child.updateMatrix()
      }
    }
  }

  addToRenderWorld() {
    for (const child of this.children) {
      child.addToRenderWorld()
    }
  }

  removeFromRenderWorld() {
    for (const child of this.children) {
      child.removeFromRenderWorld()
    }
  }

  addToPhysicalWorld(world) {
    for (const child of this.children) {
      child.addToPhysicalWorld(world)
    }
  }

  removeFromPhysicalWorld(world) {
    for (const child of this.children) {
      child.removeFromPhysicalWorld(world)
    }
  }

  findChildById(id) {
    for (const child of this.children) {
      if (child.type === 'group') {
        if (child.id === id) {
          return child
        }

        const entity = child.findChildById(id)
        if (entity !== null) {
          return entity
        }
      } else if (child.id === id) {
        return child
      }
    }

    return null
  }

  findChildByIMeshEntry(iMeshName, iMeshEntry) {
    for (const child of this.children) {
      if (child.type === 'group') {
        const entity = child.findChildByIMeshEntry(iMeshName, iMeshEntry)
        if (entity !== null) {
          return entity
        }
      } else if ((child.iMeshEntry === iMeshEntry) && (child.iMesh.name === iMeshName)) {
        return child
      }
    }

    return null
  }

  setPosition(x, y, z) {
    const currentPosition = this.position.clone()

    Entity.prototype.setPosition.call(this, x, y, z)

    for (const child of this.children) {
      if (child.type !== 'group') {
        if (child.frozen) {
          child.move(currentPosition.x - x, currentPosition.y - y, currentPosition.z - z)
        } else {
          child.updateMatrix()
        }
      }
    }
  }

  setRotation(y) {
    this.rotate(y - this.angleY)
  }

  move(offsetX, offsetY, offsetZ) {
    Entity.prototype.move.call(this, offsetX, offsetY, offsetZ)

    for (const child of this.children) {
      if (child.type !== 'group') {
        if (child.frozen) {
          // update child position to avoid moving it with the parent
          child.move(-offsetX, -offsetY, -offsetZ)
        } else {
          child.updateMatrix()
        }
      }
    }
  }

  rotate(offsetY) {
    Entity.prototype.setRotation.call(this, this.angleY + offsetY)

    const cosa = Math.cos(offsetY)
    const sina = Math.sin(offsetY)

    for (const child of this.children) {
      if (child.type !== 'group') {
        if (!child.frozen) {
          let newX = cosa * child.position.x  - sina * child.position.z
          let newZ = sina * child.position.x  + cosa * child.position.z
          child.setPosition(newX, child.position.y, newZ)
          child.rotate(-offsetY)
          child.updateMatrix()
        }
      }
    }
  }
}

export class SimEntity extends Entity {
  constructor(options) {
    super(options)

    this.iMesh = this.options.iMesh
    this.matrix = new THREE.Matrix4()
    this.scale = 0
    this.iMeshEntry = -1
    this.fallingTimer = 0
    this.world = null
    this.state = 'idle'
    this.color = this.options.color || '#ffffff'
    this.overrideColor = null
  }

  setPosition(x, y, z) {
    Entity.prototype.setPosition.call(this, x, y, z)
    this.updateMatrix()
  }

  setRotation(y) {
    Entity.prototype.setRotation.call(this, y)
    this.updateMatrix()
  }

  move(offsetX, offsetY, offsetZ) {
    Entity.prototype.move.call(this, offsetX, offsetY, offsetZ)
    this.updateMatrix()
  }

  rotate(offsetY) {
    Entity.prototype.rotate.call(this, offsetY)
    this.updateMatrix()
  }

  saveState() {
    this.positionSaved = this.position.clone()
    this.rotationSaved = this.rotation.clone()
    this.stateSaved = this.state
  }

  restoreState() {
    this.position.copy(this.positionSaved)
    this.rotation.copy(this.rotationSaved)
    this.state = this.stateSaved
    this.updateMatrix()
  }

  updateMatrix() {
    let position = this.getWorldPosition()
    this.iMesh.setTransformAt(this.iMeshEntry, position.x, position.y, position.z, this.angleY, this.scale)
  }

  addToRenderWorld() {
    if (this.iMeshEntry !== -1) {
      return
    }

    this.iMeshEntry = this.iMesh.useEntry()

    if (this.iMeshEntry !== -1) {
      this.setVisible(true)
      this.setColor(this.color)
    }
  }

  removeFromRenderWorld() {
    if (this.iMeshEntry === -1) {
      return
    }

    if (this.iMeshEntry !== -1) {
      this.setVisible(false)
      this.iMesh.freeEntry(this.iMeshEntry)
      this.iMeshEntry = -1
    }
  }

  addToPhysicalWorld(world) {
    if (this.body) {
      return
    }

    let transform = new Ammo.btTransform()
    const worldPosition = this.getWorldPosition()

    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(worldPosition.x, worldPosition.y, worldPosition.z))
    transform.setRotation(new Ammo.btQuaternion(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w))

    const motionState = new Ammo.btDefaultMotionState(transform)
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(this.options.mass, motionState, this.options.shape, this.options.localInertia)

    this.body = new Ammo.btRigidBody(rbInfo)
    this.world = world

    world.physicsWorld.addRigidBody(this.body)
  }

  removeFromPhysicalWorld(world) {
    if (!this.body) {
      return
    }

    world.physicsWorld.removeRigidBody(this.body)

    this.body = null
    this.world = null
  }

  setVisible(visible) {
    Entity.prototype.setVisible.call(this, visible)

    if (visible && this.parent && !this.parent.visible) {
      return
    }

    this.scale = visible ? 1 : 0
    this.updateMatrix()
  }

  setColor(color) {
    if (this.iMeshEntry !== -1) {
      this.color = color
      this.iMesh.setColorAt(this.iMeshEntry, color)
    }
  }

  getColor() {
    return this.color
  }

  setFadingIntensity(intensity) {
    if (this.iMeshEntry !== -1) {
      const color = new THREE.Color(this.color).lerp(FADING_COLOR, intensity).getHexString()
      this.iMesh.setColorAt(this.iMeshEntry, `#${color}`)
    }
  }

  setParent(parent) {
    Entity.prototype.setParent.call(this, parent)
    this.updateMatrix()
  }
}

export class Ground extends SimEntity {
  constructor(options) {
    super(_.assign(options, {
      type: 'ground',
      mass: GROUND_MASS,
      shape: GROUND_SHAPE,
      localInertia: GROUND_LOCAL_INERTIA
    }))
  }
}

export class DynEntity extends SimEntity {
  constructor(options) {
    super(options)

    this.tmpTrans = new Ammo.btTransform()
  }

  tick() {
    if (!this.body || this.state === 'slept') {
      return false
    }

    const ms = this.body.getMotionState()
    ms.getWorldTransform(this.tmpTrans)

    const position = this.tmpTrans.getOrigin()
    const quaternion = this.tmpTrans.getRotation()
    const array = this.iMesh.mesh.instanceMatrix.array
    const arrayIndex = this.iMeshEntry * 16

    // formula copied from: https://github.com/mrdoob/three.js/blob/master/examples/physics_cannon_instancing.html
    const x = quaternion.x(), y = quaternion.y(), z = quaternion.z(), w = quaternion.w()
    const x2 = x + x, y2 = y + y, z2 = z + z
    const xx = x * x2, xy = x * y2, xz = x * z2
    const yy = y * y2, yz = y * z2, zz = z * z2
    const wx = w * x2, wy = w * y2, wz = w * z2

    array[arrayIndex + 0] = (1 - (yy + zz))
    array[arrayIndex + 1] = (xy + wz)
    array[arrayIndex + 2] = (xz - wy)
    array[arrayIndex + 3] = 0

    array[arrayIndex + 4] = (xy - wz)
    array[arrayIndex + 5] = (1 - (xx + zz))
    array[arrayIndex + 6] = (yz + wx)
    array[arrayIndex + 7] = 0

    array[arrayIndex + 8] = (xz + wy)
    array[arrayIndex + 9] = (yz - wx)
    array[arrayIndex + 10] = (1 - (xx + yy))
    array[arrayIndex + 11] = 0

    array[arrayIndex + 12] = position.x()
    array[arrayIndex + 13] = position.y()
    array[arrayIndex + 14] = position.z()
    array[arrayIndex + 15] = 1

    this.iMesh.mesh.instanceMatrix.needsUpdate = true

    return true
  }
}

export class Ball extends DynEntity {
  constructor(options) {
    super(_.assign(options, {
      type: 'ball',
      mass: BALL_MASS,
      shape: BALL_SHAPE,
      localInertia: BALL_LOCAL_INERTIA
    }))

    this.tmpTrans = new Ammo.btTransform()
  }
}

export class Tile extends DynEntity {
  constructor(options) {
    super(_.assign(options, {
      type: 'tile',
      mass: TILE_MASS,
      shape: TILE_SHAPE,
      localInertia: TILE_LOCAL_INERTIA
    }))
  }

  tick(delta) {
    if (DynEntity.prototype.tick.call(this, delta)) {
      const quaternion = this.tmpTrans.getRotation()

      const q = new THREE.Quaternion(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w())
      const p = new THREE.Quaternion()
      p.setFromEuler(new THREE.Euler(0, this.angleY, 0))
      const a = q.angleTo(p)

      if ((this.state === 'idle') && (a > 0.5)) {
        this.state = 'falling'
        this.fallingTimer = FALLING_TIME_BEFORE_SLEEP
      } else if (this.state === 'falling') {
        this.fallingTimer -= delta

        if (this.fallingTimer <= 0) {
          this.state = 'slept'
          this.removeFromPhysicalWorld(this.world)
        }
      }
    }
  }
}