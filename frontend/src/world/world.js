import * as THREE from 'three'
import Ammo from 'ammo.js'
import {IMeshManaged} from '@/world/imesh'
import {TILE_GEOMETRY, GROUND_GEOMETRY, BALL_GEOMETRY} from '@/defines'
import {Group} from './entities'

export default class {
  constructor(options) {
    this.domElement = options.domElement

    this.auxColor = new THREE.Color()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.domElement.clientWidth, this.domElement.clientHeight)
    this.renderer.setClearColor('#353535')
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap

    this.domElement.appendChild(this.renderer.domElement)

    const cameraPosition = options.cameraPosition
    this.camera = new THREE.PerspectiveCamera(45, this.domElement.clientWidth / this.domElement.clientHeight, 0.5, 500)
    this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)

    this.scene = new THREE.Scene()
    this.group = new Group()

    // lighting
    let ambient = new THREE.AmbientLight(0xcccccc)
    this.scene.add(ambient)

    let light = new THREE.DirectionalLight(0xffffff, 0.7)

    this.lightTarget = new THREE.Object3D()
    this.lightTarget.position.set(this.camera.position.x + 90, 0, this.camera.position.z)
    this.scene.add(this.lightTarget)

    light.position.set(cameraPosition.x + 110, cameraPosition.y + 70, cameraPosition.z - 20)
    light.target = this.lightTarget
    light.castShadow = true

    // ver el tema de las sombras si se puede hacer sin esto
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 500
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048

    const d = 150
    light.shadow.camera.left = - d
    light.shadow.camera.right = d
    light.shadow.camera.top = d
    light.shadow.camera.bottom = - d

    this.directionalLight = light
    this.scene.add(light)

    this.imTiles = new IMeshManaged(options.numTiles, TILE_GEOMETRY, true)
    this.imTiles.name = 'tiles'
    this.scene.add(this.imTiles.mesh)

    this.imGrounds = new IMeshManaged(options.numGrounds, GROUND_GEOMETRY, false)
    this.imGrounds.name = 'grounds'
    this.scene.add(this.imGrounds.mesh)

    this.imBalls = new IMeshManaged(options.numBalls, BALL_GEOMETRY, true)
    this.imBalls.name = 'balls'
    this.scene.add(this.imBalls.mesh)

    // physics stuff
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    let overlappingPairCache = new Ammo.btDbvtBroadphase()
    let solver = new Ammo.btSequentialImpulseConstraintSolver()

    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration)
    this.physicsWorld.setGravity(new Ammo.btVector3(0, -400, 0))
  }

  tick(delta) {
    this.physicsWorld.stepSimulation(delta, 8)
    this.group.tick(delta)
  }

  render() {
    this.imTiles.prepareRender()
    this.imGrounds.prepareRender()
    this.imBalls.prepareRender()

    this.renderer.render(this.scene, this.camera)
  }

  onWindowResize() {
    this.camera.aspect = this.domElement.clientWidth / this.domElement.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.domElement.clientWidth, this.domElement.clientHeight)
  }
}