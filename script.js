import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Clock,
  Box3,
  Vector3,
} from './three.module.js'

import { VRButton } from './VRButton.js';
import { OrbitControls } from './OrbitControls.js'
import { XRControllerModelFactory } from './XRControllerModelFactory.js';
import { TiltLoader, updateBrushes } from './three-tiltloader.module.js';

// If you want to create OBJKT's with different seeds,
// you can access the creator and viewer wallet ids.
// This values will only be injected once the piece
// has been minted they will not work locally.
// If the user is not sync, the viewer comes in as false.
const creator = new URLSearchParams(window.location.search).get('creator')
const viewer = new URLSearchParams(window.location.search).get('viewer')

console.log('NFT created by', creator)
console.log('NFT viewed by', viewer)

class Sketch {
  constructor() {
    this.renderer = new WebGLRenderer({
      antialias: true,
      //alpha: true
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.xr.enabled = true;

    this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 0.95, 2)

    this.scene = new Scene()

    this.canvas = null

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.clock = new Clock()

    this.resize()
    this.init()
  }

  init() {
    this.addCanvas()
    this.addVRButton()
    this.addVRControllers()
    this.addEvents()
    this.addElements()
    this.render()
  }

  addCanvas() {
    this.canvas = this.renderer.domElement
    document.body.appendChild(this.canvas)
  }

  addVRButton() {
    document.body.appendChild( VRButton.createButton( this.renderer ) );
  }

  addVRControllers() {
    // The XRControllerModelFactory will automatically fetch controller models
    // that match what the user is holding as closely as possible. The models
    // should be attached to the object returned from getControllerGrip in
    // order to match the orientation of the held device.

    const controllerModelFactory = new XRControllerModelFactory();

    this.controllerGrip1 = this.renderer.xr.getControllerGrip( 0 );
    this.controllerGrip1.add( controllerModelFactory.createControllerModel( this.controllerGrip1 ) );
    this.scene.add( this.controllerGrip1 );

    this.controllerGrip2 = this.renderer.xr.getControllerGrip( 1 );
    this.controllerGrip2.add( controllerModelFactory.createControllerModel( this.controllerGrip2 ) );
    this.scene.add( this.controllerGrip2 );
  }

  addEvents() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  addElements() {
    const tiltLoader = new TiltLoader()
    tiltLoader.setBrushDirectory('./brushes/')
    tiltLoader.load( 'model.glb', ( tiltData ) => {
      this.scene.updateableMeshes = tiltData.updateableMeshes
      this.mesh = tiltData.scene

      // Tilt Brush/Open Brush doesn't center model on export. Here's a quick snippet to find it's geometric center
      const box = new Box3().setFromObject(this.mesh)
      const boxCenter = box.getCenter(new Vector3())
      this.controls.target.set(0, 0.95, 0)
      this.scene.add(this.mesh)
    });
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }

  render() {
    this.controls.update()
    if(this.scene.updateableMeshes && this.mesh) {
      updateBrushes(this.scene.updateableMeshes, this.clock.getElapsedTime(), this.camera.position);
      this.mesh.rotation.y = this.clock.getElapsedTime() * 0.35
    }

    this.renderer.setAnimationLoop(this.render.bind(this))
    this.renderer.render(this.scene, this.camera)
  }
}

new Sketch()