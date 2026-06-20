<template>
  <div class="indoor-3d-shell">
    <div class="shell-head">
      <div>
        <p class="section-kicker">Indoor 3D</p>
        <h2>{{ buildingModel?.name || plan?.name || '室内路径规划' }}</h2>
        <p>{{ activeFloorName }} 楼层已升级为实体平面模型，支持房间块、井道和路径叠加。</p>
      </div>
      <div class="floor-tabs">
        <button
          v-for="floor in floors"
          :key="String(floor.id)"
          :class="['floor-tab', { active: floor.id === normalizedActiveFloorId }]"
          @click="$emit('change-floor', floor.id)"
        >
          {{ floor.name }}
        </button>
      </div>
    </div>

    <div class="scene-wrap">
      <div ref="canvasRef" class="scene-canvas"></div>
      <div class="scene-hud">
        <span>楼层 {{ activeFloorName }}</span>
        <span>房间块 {{ roomCount }}</span>
        <span>路径节点 {{ routeNodes.length }}</span>
      </div>
    </div>

    <div class="step-tray">
      <article v-for="step in filteredSteps" :key="step.id" class="step-chip">
        <strong>{{ step.title }}</strong>
        <p>{{ step.description || '室内导航步骤会显示在这里。' }}</p>
      </article>
      <article v-if="!filteredSteps.length" class="step-chip muted">
        <strong>固定模型已加载</strong>
        <p>当前显示的是根据 SQL 预建好的室内模型，规划完成后会在模型上叠加路线和蓝色火柴人。</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getIndoorBuildingModel, type IndoorModelFloor, type IndoorModelRect } from '@/data/indoorModels'
import type { CoordinatePoint, RoutePlanOption } from '@/types/route-planner'

const props = defineProps<{
  plan: RoutePlanOption | null
  activeFloorId: string | number | null
  buildingId: string | number | null
}>()

defineEmits<{
  (event: 'change-floor', floorId: string | number): void
}>()

const canvasRef = ref<HTMLElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let animationFrame = 0
let sceneRoot: THREE.Group | null = null
let walkerGroup: THREE.Group | null = null
let walkerRig: WalkerRig | null = null
let walkerTime = 0
let routeCurve: THREE.CatmullRomCurve3 | null = null
let resizeObserver: ResizeObserver | null = null

interface WalkerRig {
  group: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
}

const buildingModel = computed(() => getIndoorBuildingModel(props.buildingId))
const floors = computed<IndoorModelFloor[]>(() => buildingModel.value?.floors || [])
const normalizedActiveFloorId = computed(() => props.activeFloorId ?? props.plan?.currentFloorId ?? floors.value[0]?.id ?? null)
const activeFloor = computed(() => floors.value.find((item) => String(item.id) === String(normalizedActiveFloorId.value)) || floors.value[0] || null)
const activeFloorName = computed(() => activeFloor.value?.name || '未识别楼层')
const routeNodes = computed(() => (props.plan?.path || []).filter((item) => item.x != null && item.y != null))
const filteredSteps = computed(() => {
  if (!props.plan) return []
  return props.plan.steps.filter((item) => !item.floorName || item.floorName === activeFloor.value?.name)
})
const roomCount = computed(() => activeFloor.value?.spaces.filter((item) => item.kind === 'room').length || 0)

onMounted(() => {
  initThree()
  rebuildScene()
})

onBeforeUnmount(() => {
  stopAnimation()
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  scene = null
  camera = null
  controls = null
  sceneRoot = null
  walkerGroup = null
  walkerRig = null
  routeCurve = null
})

watch(
  () => [props.plan, props.activeFloorId, props.buildingId],
  () => rebuildScene(),
  { deep: true }
)

function initThree() {
  if (!canvasRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0c0f0c')
  scene.fog = new THREE.Fog('#0c0f0c', 60, 220)

  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1000)
  camera.position.set(34, 42, 54)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  canvasRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const ambientLight = new THREE.AmbientLight('#d7f4ff', 1.8)
  const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5)
  directionalLight.position.set(30, 50, 20)
  const pointLight = new THREE.PointLight('#60a5fa', 2.2, 220)
  pointLight.position.set(-20, 40, 40)
  scene.add(ambientLight, directionalLight, pointLight)

  resizeScene()
  resizeObserver = new ResizeObserver(() => resizeScene())
  resizeObserver.observe(canvasRef.value)
  animate()
}

function resizeScene() {
  if (!canvasRef.value || !renderer || !camera) return
  const width = canvasRef.value.clientWidth || 1
  const height = canvasRef.value.clientHeight || 1
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function rebuildScene() {
  if (!scene) return

  if (sceneRoot) scene.remove(sceneRoot)

  sceneRoot = new THREE.Group()
  scene.add(sceneRoot)
  walkerGroup = null
  walkerRig = null
  routeCurve = null
  walkerTime = 0

  const preparedFloors = buildPreparedFloors()
  preparedFloors.forEach((floor) => {
    sceneRoot?.add(createFloorPlate(floor))
    sceneRoot?.add(createFloorShell(floor))
    sceneRoot?.add(createSpacesGroup(floor))
    sceneRoot?.add(createWalkEdges(floor))
    sceneRoot?.add(createVerticalCores(floor))
    floor.nodes.forEach((node) => sceneRoot?.add(createNodeMarker(node, floor.elevation, floor.highlighted)))
  })

  const routePoints = buildRoutePoints(preparedFloors)
  if (routePoints.length >= 2) {
    sceneRoot.add(createRouteTube(routePoints))
    routeCurve = new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.15)
    walkerRig = createWalker()
    walkerGroup = walkerRig.group
    sceneRoot.add(walkerGroup)
  }

  const baseFloor = preparedFloors.find((item) => String(item.id) === String(normalizedActiveFloorId.value)) || preparedFloors[0]
  if (baseFloor && controls) {
    controls.target.set(baseFloor.shell.centerX, baseFloor.elevation + 1.5, baseFloor.shell.centerY)
    controls.update()
  }
}

function buildPreparedFloors() {
  return floors.value.map((floor, index) => ({
    ...floor,
    elevation: index * 9,
    highlighted: String(floor.id) === String(normalizedActiveFloorId.value)
  }))
}

function createFloorPlate(floor: ReturnType<typeof buildPreparedFloors>[number]) {
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(floor.shell.width, 1.1, floor.shell.depth),
    new THREE.MeshStandardMaterial({
      color: floor.highlighted ? '#15241b' : '#121815',
      metalness: 0.24,
      roughness: 0.82,
      transparent: true,
      opacity: floor.highlighted ? 0.98 : 0.8
    })
  )
  plate.position.set(floor.shell.centerX, floor.elevation, floor.shell.centerY)

  const group = new THREE.Group()
  group.add(plate)

  const label = createTextSprite(floor.name, floor.highlighted ? '#dff2bf' : '#d7e4da')
  label.position.set(
    floor.shell.centerX - floor.shell.width / 2 + 5,
    floor.elevation + 1.4,
    floor.shell.centerY - floor.shell.depth / 2 + 3
  )
  group.add(label)
  return group
}

function createFloorShell(floor: ReturnType<typeof buildPreparedFloors>[number]) {
  const shape = new THREE.Shape()
  shape.moveTo(floor.shell.centerX - floor.shell.width / 2, floor.shell.centerY - floor.shell.depth / 2)
  shape.lineTo(floor.shell.centerX + floor.shell.width / 2, floor.shell.centerY - floor.shell.depth / 2)
  shape.lineTo(floor.shell.centerX + floor.shell.width / 2, floor.shell.centerY + floor.shell.depth / 2)
  shape.lineTo(floor.shell.centerX - floor.shell.width / 2, floor.shell.centerY + floor.shell.depth / 2)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false })
  const material = new THREE.MeshStandardMaterial({
    color: floor.highlighted ? '#344939' : '#29332d',
    transparent: true,
    opacity: 0.28
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = floor.elevation + 0.65
  return mesh
}

function createSpacesGroup(floor: ReturnType<typeof buildPreparedFloors>[number]) {
  const group = new THREE.Group()
  floor.spaces.forEach((space) => {
    group.add(createSpaceBlock(space, floor.elevation, floor.highlighted))
  })
  return group
}

function createSpaceBlock(space: IndoorModelRect, elevation: number, highlighted: boolean) {
  const height = space.kind === 'corridor' ? 0.4 : space.kind === 'room' ? 2.8 : 3.6
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(space.width, height, space.depth),
    new THREE.MeshStandardMaterial({
      color: getSpaceColor(space.kind),
      transparent: true,
      opacity: space.kind === 'corridor' ? 0.35 : highlighted ? 0.52 : 0.3,
      metalness: 0.12,
      roughness: 0.72
    })
  )
  mesh.position.set(space.x, elevation + height / 2 + 0.55, space.y)

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(space.width, height, space.depth)),
    new THREE.LineBasicMaterial({ color: highlighted ? '#d7ead6' : '#7b8d80', transparent: true, opacity: 0.55 })
  )
  edge.position.copy(mesh.position)

  const label = createTextSprite(space.label, '#f5f5f5')
  label.position.set(space.x, elevation + height + 1.2, space.y)

  const group = new THREE.Group()
  group.add(mesh, edge)
  if (space.kind !== 'corridor' && highlighted) group.add(label)
  return group
}

function createWalkEdges(floor: ReturnType<typeof buildPreparedFloors>[number]) {
  const group = new THREE.Group()
  floor.edges.forEach((edge) => {
    const fromNode = floor.nodes.find((item) => item.id === edge.fromNodeId)
    const toNode = floor.nodes.find((item) => item.id === edge.toNodeId)
    if (!fromNode || !toNode) return

    const geometry = new THREE.BufferGeometry().setFromPoints([
      toWorldPosition(fromNode, floor.elevation, true),
      toWorldPosition(toNode, floor.elevation, true)
    ])
    group.add(
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: '#587a62',
          transparent: true,
          opacity: floor.highlighted ? 0.72 : 0.28
        })
      )
    )
  })
  return group
}

function createVerticalCores(floor: ReturnType<typeof buildPreparedFloors>[number]) {
  const group = new THREE.Group()
  floor.spaces
    .filter((space) => space.kind === 'elevator' || space.kind === 'stairs')
    .forEach((space) => {
      const shaftHeight = 8
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(space.width / 2, space.width / 2, shaftHeight, space.kind === 'elevator' ? 18 : 6),
        new THREE.MeshStandardMaterial({
          color: space.kind === 'elevator' ? '#f59e0b' : '#f472b6',
          transparent: true,
          opacity: 0.42,
          emissive: space.kind === 'elevator' ? '#a16207' : '#9d174d',
          emissiveIntensity: 0.22
        })
      )
      shaft.position.set(space.x, floor.elevation + shaftHeight / 2 + 0.6, space.y)
      group.add(shaft)

      const icon = createIconBillboard(space.kind === 'elevator' ? 'E' : 'S', space.kind === 'elevator' ? '#f59e0b' : '#f472b6')
      icon.position.set(space.x, floor.elevation + shaftHeight + 1.4, space.y)
      group.add(icon)
    })
  return group
}

function createNodeMarker(node: CoordinatePoint, elevation: number, highlighted: boolean) {
  const tone = getNodeColor(node.type)
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 14),
    new THREE.MeshStandardMaterial({
      color: tone,
      emissive: tone,
      emissiveIntensity: highlighted ? 0.32 : 0.14
    })
  )
  marker.position.copy(toWorldPosition(node, elevation, true))
  return marker
}

function buildRoutePoints(preparedFloors: ReturnType<typeof buildPreparedFloors>) {
  return routeNodes.value
    .map((node) => {
      const floor = preparedFloors.find((item) => String(item.id) === String(node.floorId)) || preparedFloors[0]
      return floor ? toWorldPosition(node, floor.elevation, true) : null
    })
    .filter(Boolean) as THREE.Vector3[]
}

function createRouteTube(points: THREE.Vector3[]) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.15)
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(points.length * 12, 48), 0.28, 10, false),
    new THREE.MeshStandardMaterial({
      color: '#8fb06e',
      emissive: '#5ea76d',
      emissiveIntensity: 0.55,
      metalness: 0.2,
      roughness: 0.35
    })
  )
}

function createWalker() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({
    color: '#4da3ff',
    emissive: '#2563eb',
    emissiveIntensity: 0.85
  })

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), material)
  head.position.y = 2.32
  group.add(head)

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.9, 6, 12), material)
  body.position.y = 1.58
  group.add(body)

  group.add(createJointSphere(0, 1.98, 0, 0.08, material))
  group.add(createJointSphere(0, 1.1, 0, 0.08, material))

  const leftArm = createAnimatedLimb(0.27, 1.92, 0, 0.62, 0.055, material, 0.55)
  const rightArm = createAnimatedLimb(-0.27, 1.92, 0, 0.62, 0.055, material, -0.55)
  const leftLeg = createAnimatedLimb(0.13, 1.1, 0, 0.98, 0.065, material, 0.18)
  const rightLeg = createAnimatedLimb(-0.13, 1.1, 0, 0.98, 0.065, material, -0.18)

  group.add(leftArm, rightArm, leftLeg, rightLeg)

  return {
    group,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  }
}

function createAnimatedLimb(
  x: number,
  y: number,
  z: number,
  length: number,
  radius: number,
  material: THREE.Material,
  restRotationZ = 0
) {
  const pivot = new THREE.Group()
  pivot.position.set(x, y, z)
  pivot.rotation.z = restRotationZ

  const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), material)
  limb.position.y = -length / 2
  pivot.add(limb)
  return pivot
}

function createJointSphere(x: number, y: number, z: number, radius: number, material: THREE.Material) {
  const joint = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), material)
  joint.position.set(x, y, z)
  return joint
}

function toWorldPosition(node: CoordinatePoint, elevation: number, elevate = false) {
  return new THREE.Vector3(Number(node.x ?? 0), elevation + (elevate ? 1.4 : 0), Number(node.y ?? 0))
}

function getSpaceColor(kind: IndoorModelRect['kind']) {
  if (kind === 'room') return '#6f9f83'
  if (kind === 'hall') return '#c8a96b'
  if (kind === 'corridor') return '#51736a'
  if (kind === 'elevator') return '#f59e0b'
  return '#f472b6'
}

function getNodeColor(type?: string) {
  const text = String(type || '').toLowerCase()
  if (text.includes('elevator')) return '#f59e0b'
  if (text.includes('stair')) return '#f472b6'
  if (text.includes('room')) return '#22c55e'
  if (text.includes('entrance')) return '#38bdf8'
  if (text.includes('hall')) return '#facc15'
  return '#94a3b8'
}

function createTextSprite(text: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(8, 12, 11, 0.72)'
  roundRect(ctx, 8, 18, 496, 92, 26)
  ctx.fill()
  ctx.font = '700 34px sans-serif'
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 26, 64)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(8.8, 2.2, 1)
  return sprite
}

function createIconBillboard(text: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, 128, 128)
  ctx.fillStyle = 'rgba(10, 14, 12, 0.82)'
  ctx.beginPath()
  ctx.arc(64, 64, 46, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 8
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 54px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 64, 68)

  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }))
  sprite.scale.set(2.6, 2.6, 1)
  return sprite
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function animate() {
  animationFrame = window.requestAnimationFrame(animate)

  if (walkerGroup && routeCurve) {
    walkerTime = (walkerTime + 0.0018) % 1
    const point = routeCurve.getPointAt(walkerTime)
    const lookAhead = routeCurve.getPointAt((walkerTime + 0.01) % 1)
    walkerGroup.position.copy(point)
    walkerGroup.lookAt(lookAhead)

    if (walkerRig) {
      const gait = Math.sin(walkerTime * Math.PI * 28)
      const counterGait = Math.sin(walkerTime * Math.PI * 28 + Math.PI)

      walkerRig.leftArm.rotation.x = gait * 0.5
      walkerRig.rightArm.rotation.x = counterGait * 0.5
      walkerRig.leftLeg.rotation.x = counterGait * 0.42
      walkerRig.rightLeg.rotation.x = gait * 0.42
      walkerRig.group.position.y += Math.abs(gait) * 0.04
    }
  }

  controls?.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function stopAnimation() {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }
}
</script>

<style scoped>
.indoor-3d-shell {
  display: grid;
  gap: 18px;
  color: #f5f1e8;
}

.shell-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.shell-head h2 {
  color: #fff7ea;
}

.shell-head p {
  margin-top: 8px;
  color: rgba(245, 241, 232, 0.72);
}

.floor-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.floor-tab {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
}

.floor-tab.active {
  background: rgba(169, 193, 140, 0.18);
  border-color: rgba(169, 193, 140, 0.24);
  color: #e5f6c8;
}

.scene-wrap {
  position: relative;
  min-height: 560px;
  border-radius: 30px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(143, 176, 110, 0.16), transparent 24%),
    radial-gradient(circle at 80% 10%, rgba(96, 165, 250, 0.14), transparent 22%),
    linear-gradient(180deg, #121613 0%, #0d100d 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.scene-canvas {
  width: 100%;
  height: 100%;
  min-height: 560px;
}

.scene-hud {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.scene-hud span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(10, 14, 12, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(245, 241, 232, 0.86);
}

.step-tray {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.step-chip {
  padding: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.step-chip strong {
  color: #fff;
}

.step-chip p {
  margin-top: 8px;
  color: rgba(245, 241, 232, 0.72);
  line-height: 1.7;
}

.step-chip.muted {
  opacity: 0.88;
}

@media (max-width: 768px) {
  .shell-head {
    flex-direction: column;
  }

  .floor-tabs {
    justify-content: flex-start;
  }

  .scene-wrap,
  .scene-canvas {
    min-height: 420px;
  }

  .scene-hud {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
}
</style>
