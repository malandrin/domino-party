import * as THREE from 'three'

export const NUM_MAX_ENTITIES_IN_EDITOR = 5000

export const SCENE_INITIAL_TILE_IDX = 1
export const SCENE_LAST_TILE_IDX = 2

export const TILE_SIZE = {x: 2, y: 4, z: 0.6}
export const GROUND_SIZE = {x: 100, y: 1, z: 100}
export const BALL_RADIUS = 2.5

export const TILE_Y_POSITION = (TILE_SIZE.y + GROUND_SIZE.y) / 2 + 0.05
export const BALL_Y_POSITION = BALL_RADIUS + 0.5
export const INITIAL_IMPULSE_VALUE = 100

export const GROUND_GEOMETRY = new THREE.BoxBufferGeometry(GROUND_SIZE.x, GROUND_SIZE.y, GROUND_SIZE.z)
export const TILE_GEOMETRY = new THREE.BoxBufferGeometry(TILE_SIZE.x, TILE_SIZE.y, TILE_SIZE.z)
export const BALL_GEOMETRY = new THREE.SphereBufferGeometry(BALL_RADIUS, 24, 24)

export const MAX_SCENE_TITLE_LENGTH = 50
export const MAX_SCENE_AUTHOR_LENGTH = 30
