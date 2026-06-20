import type { CoordinatePoint } from '@/types/route-planner'

export interface IndoorModelNode extends CoordinatePoint {
  id: number
  code: string
  label: string
  floorId: number
  floorName: string
  type: string
}

export interface IndoorModelEdge {
  id: number
  fromNodeId: number
  toNodeId: number
  floorId: number | null
  edgeType: 'WALK' | 'ELEVATOR' | 'STAIRS'
  distance: number
  timeCost: number
}

export interface IndoorModelRect {
  id: string
  kind: 'room' | 'hall' | 'corridor' | 'elevator' | 'stairs'
  label: string
  x: number
  y: number
  width: number
  depth: number
}

export interface IndoorModelFloor {
  id: number
  name: string
  level: number
  shell: { width: number; depth: number; centerX: number; centerY: number }
  nodes: IndoorModelNode[]
  edges: IndoorModelEdge[]
  spaces: IndoorModelRect[]
}

export interface IndoorBuildingModel {
  id: number
  name: string
  address: string
  floors: IndoorModelFloor[]
  edges: IndoorModelEdge[]
}

function createNode(
  id: number,
  floor: number,
  type: string,
  code: string,
  label: string,
  x: number,
  y: number
): IndoorModelNode {
  return {
    id,
    code,
    label,
    floorId: floor,
    floorName: `${floor}F`,
    type,
    x,
    y,
    lat: null,
    lng: null
  }
}

function createEdge(
  id: number,
  fromNodeId: number,
  toNodeId: number,
  edgeType: 'WALK' | 'ELEVATOR' | 'STAIRS',
  distance: number,
  timeCost: number,
  floorId: number | null
): IndoorModelEdge {
  return { id, fromNodeId, toNodeId, edgeType, distance, timeCost, floorId }
}

function rect(
  id: string,
  kind: IndoorModelRect['kind'],
  label: string,
  x: number,
  y: number,
  width: number,
  depth: number
): IndoorModelRect {
  return { id, kind, label, x, y, width, depth }
}

const shell = { width: 28, depth: 24, centerX: 10, centerY: 2.5 }

const floor1Nodes: IndoorModelNode[] = [
  createNode(10001, 1, 'ENTRANCE', '1F-EN1', '1F 主大门', 0, 0),
  createNode(10002, 1, 'HALL', '1F-HA1', '1F 大厅', 10, 0),
  createNode(10003, 1, 'ELEVATOR', '1F-EV1', '1F 电梯厅', 10, 5),
  createNode(10004, 1, 'STAIRS', '1F-ST1', '1F 楼梯A', 15, 5),
  createNode(10005, 1, 'ROOM', '1F-RM1', '1F 总服务台', 5, -5),
  createNode(10006, 1, 'ROOM', '1F-RM2', '1F 期刊阅览室', 20, 0),
  createNode(10007, 1, 'ROOM', '1F-RM3', '1F 咖啡区', 20, 10),
  createNode(10008, 1, 'CORNER', '1F-CO1', '1F 走廊东', 20, 5),
  createNode(10009, 1, 'CORNER', '1F-CO2', '1F 走廊西', 5, 5),
  createNode(10010, 1, 'CORNER', '1F-CO3', '1F 走廊北', 10, 10)
]

const floor2Nodes: IndoorModelNode[] = [
  createNode(10011, 2, 'ELEVATOR', '2F-EV1', '2F 电梯厅', 10, 5),
  createNode(10012, 2, 'STAIRS', '2F-ST1', '2F 楼梯A', 15, 5),
  createNode(10013, 2, 'ROOM', '2F-RM1', '2F 文科阅览室', 20, 0),
  createNode(10014, 2, 'ROOM', '2F-RM2', '2F 电子阅览区', 20, 10),
  createNode(10015, 2, 'ROOM', '2F-RM3', '2F 共享空间', 5, -5),
  createNode(10016, 2, 'CORNER', '2F-CO1', '2F 走廊东', 20, 5),
  createNode(10017, 2, 'CORNER', '2F-CO2', '2F 走廊西', 5, 5),
  createNode(10018, 2, 'CORNER', '2F-CO3', '2F 走廊北', 10, 10)
]

const floor3Nodes: IndoorModelNode[] = [
  createNode(10019, 3, 'ELEVATOR', '3F-EV1', '3F 电梯厅', 10, 5),
  createNode(10020, 3, 'STAIRS', '3F-ST1', '3F 楼梯A', 15, 5),
  createNode(10021, 3, 'ROOM', '3F-RM1', '3F 理科阅览室', 20, 0),
  createNode(10022, 3, 'ROOM', '3F-RM2', '3F 研讨间1', 20, 10),
  createNode(10023, 3, 'ROOM', '3F-RM3', '3F 研讨间2', 5, -5),
  createNode(10024, 3, 'ROOM', '3F-RM4', '3F 古籍特藏', 5, 10),
  createNode(10025, 3, 'CORNER', '3F-CO1', '3F 走廊东', 20, 5),
  createNode(10026, 3, 'CORNER', '3F-CO2', '3F 走廊西', 5, 5),
  createNode(10027, 3, 'CORNER', '3F-CO3', '3F 走廊北', 10, 10)
]

const floor4Nodes: IndoorModelNode[] = [
  createNode(10028, 4, 'ELEVATOR', '4F-EV1', '4F 电梯厅', 10, 5),
  createNode(10029, 4, 'STAIRS', '4F-ST1', '4F 楼梯A', 15, 5),
  createNode(10030, 4, 'ROOM', '4F-RM1', '4F 学术报告厅', 20, 0),
  createNode(10031, 4, 'ROOM', '4F-RM2', '4F 研究室', 5, 10),
  createNode(10032, 4, 'CORNER', '4F-CO1', '4F 走廊东', 20, 5),
  createNode(10033, 4, 'CORNER', '4F-CO2', '4F 走廊西', 5, 5),
  createNode(10034, 4, 'CORNER', '4F-CO3', '4F 走廊北', 10, 10)
]

const edges: IndoorModelEdge[] = [
  createEdge(20001, 10001, 10002, 'WALK', 10, 7, 1),
  createEdge(20002, 10002, 10005, 'WALK', 7.07, 5, 1),
  createEdge(20003, 10002, 10009, 'WALK', 7.07, 5, 1),
  createEdge(20004, 10009, 10003, 'WALK', 5, 4, 1),
  createEdge(20005, 10003, 10004, 'WALK', 5, 4, 1),
  createEdge(20006, 10003, 10010, 'WALK', 5, 4, 1),
  createEdge(20007, 10004, 10008, 'WALK', 5, 4, 1),
  createEdge(20008, 10008, 10006, 'WALK', 5, 4, 1),
  createEdge(20009, 10008, 10007, 'WALK', 5, 4, 1),
  createEdge(20010, 10010, 10007, 'WALK', 10, 7, 1),
  createEdge(20011, 10009, 10010, 'WALK', 7.07, 5, 1),
  createEdge(20012, 10011, 10017, 'WALK', 5, 4, 2),
  createEdge(20013, 10017, 10015, 'WALK', 10, 7, 2),
  createEdge(20014, 10011, 10012, 'WALK', 5, 4, 2),
  createEdge(20015, 10012, 10016, 'WALK', 5, 4, 2),
  createEdge(20016, 10016, 10013, 'WALK', 5, 4, 2),
  createEdge(20017, 10016, 10014, 'WALK', 5, 4, 2),
  createEdge(20018, 10011, 10018, 'WALK', 5, 4, 2),
  createEdge(20019, 10018, 10014, 'WALK', 10, 7, 2),
  createEdge(20020, 10017, 10018, 'WALK', 7.07, 5, 2),
  createEdge(20021, 10019, 10026, 'WALK', 5, 4, 3),
  createEdge(20022, 10026, 10023, 'WALK', 10, 7, 3),
  createEdge(20023, 10019, 10020, 'WALK', 5, 4, 3),
  createEdge(20024, 10020, 10025, 'WALK', 5, 4, 3),
  createEdge(20025, 10025, 10021, 'WALK', 5, 4, 3),
  createEdge(20026, 10025, 10022, 'WALK', 5, 4, 3),
  createEdge(20027, 10019, 10027, 'WALK', 5, 4, 3),
  createEdge(20028, 10027, 10024, 'WALK', 5, 4, 3),
  createEdge(20029, 10026, 10027, 'WALK', 7.07, 5, 3),
  createEdge(20030, 10028, 10033, 'WALK', 5, 4, 4),
  createEdge(20031, 10028, 10029, 'WALK', 5, 4, 4),
  createEdge(20032, 10029, 10032, 'WALK', 5, 4, 4),
  createEdge(20033, 10032, 10030, 'WALK', 5, 4, 4),
  createEdge(20034, 10028, 10034, 'WALK', 5, 4, 4),
  createEdge(20035, 10034, 10031, 'WALK', 5, 4, 4),
  createEdge(20036, 10033, 10034, 'WALK', 7.07, 5, 4),
  createEdge(20037, 10003, 10011, 'ELEVATOR', 3, 10, null),
  createEdge(20038, 10011, 10019, 'ELEVATOR', 3, 10, null),
  createEdge(20039, 10019, 10028, 'ELEVATOR', 3, 10, null),
  createEdge(20040, 10004, 10012, 'STAIRS', 5, 20, null),
  createEdge(20041, 10012, 10020, 'STAIRS', 5, 20, null),
  createEdge(20042, 10020, 10029, 'STAIRS', 5, 20, null)
]

const floor1Spaces = [
  rect('1f-hall', 'hall', '1F 大厅', 10, 0, 8, 5),
  rect('1f-service', 'room', '1F 总服务台', 5, -5, 5, 4),
  rect('1f-reading', 'room', '1F 期刊阅览室', 20, 0, 6, 5),
  rect('1f-cafe', 'room', '1F 咖啡区', 20, 10, 6, 5),
  rect('1f-corridor-west', 'corridor', '1F 西走廊', 5, 5, 4, 10),
  rect('1f-corridor-north', 'corridor', '1F 北走廊', 12.5, 10, 15, 4),
  rect('1f-corridor-east', 'corridor', '1F 东走廊', 20, 5, 4, 10),
  rect('1f-elevator', 'elevator', '1F 电梯井', 10, 5, 2.8, 2.8),
  rect('1f-stairs', 'stairs', '1F 楼梯井', 15, 5, 3.2, 3.2)
]

const floor2Spaces = [
  rect('2f-share', 'room', '2F 共享空间', 5, -5, 6, 5),
  rect('2f-reading', 'room', '2F 文科阅览室', 20, 0, 6, 5),
  rect('2f-digital', 'room', '2F 电子阅览区', 20, 10, 6, 5),
  rect('2f-corridor-west', 'corridor', '2F 西走廊', 5, 5, 4, 10),
  rect('2f-corridor-north', 'corridor', '2F 北走廊', 12.5, 10, 15, 4),
  rect('2f-corridor-east', 'corridor', '2F 东走廊', 20, 5, 4, 10),
  rect('2f-elevator', 'elevator', '2F 电梯井', 10, 5, 2.8, 2.8),
  rect('2f-stairs', 'stairs', '2F 楼梯井', 15, 5, 3.2, 3.2)
]

const floor3Spaces = [
  rect('3f-room1', 'room', '3F 理科阅览室', 20, 0, 6, 5),
  rect('3f-room2', 'room', '3F 研讨间1', 20, 10, 6, 5),
  rect('3f-room3', 'room', '3F 研讨间2', 5, -5, 6, 5),
  rect('3f-room4', 'room', '3F 古籍特藏', 5, 10, 6, 5),
  rect('3f-corridor-west', 'corridor', '3F 西走廊', 5, 5, 4, 10),
  rect('3f-corridor-north', 'corridor', '3F 北走廊', 12.5, 10, 15, 4),
  rect('3f-corridor-east', 'corridor', '3F 东走廊', 20, 5, 4, 10),
  rect('3f-elevator', 'elevator', '3F 电梯井', 10, 5, 2.8, 2.8),
  rect('3f-stairs', 'stairs', '3F 楼梯井', 15, 5, 3.2, 3.2)
]

const floor4Spaces = [
  rect('4f-hall', 'room', '4F 学术报告厅', 20, 0, 7, 6),
  rect('4f-lab', 'room', '4F 研究室', 5, 10, 6, 5),
  rect('4f-corridor-west', 'corridor', '4F 西走廊', 5, 5, 4, 10),
  rect('4f-corridor-north', 'corridor', '4F 北走廊', 12.5, 10, 15, 4),
  rect('4f-corridor-east', 'corridor', '4F 东走廊', 20, 5, 4, 10),
  rect('4f-elevator', 'elevator', '4F 电梯井', 10, 5, 2.8, 2.8),
  rect('4f-stairs', 'stairs', '4F 楼梯井', 15, 5, 3.2, 3.2)
]

function buildFloor(id: number, nodes: IndoorModelNode[], spaces: IndoorModelRect[]): IndoorModelFloor {
  return {
    id,
    name: `${id}F`,
    level: id,
    shell,
    nodes,
    edges: edges.filter((edge) => edge.floorId === id),
    spaces
  }
}

const building1: IndoorBuildingModel = {
  id: 1,
  name: '上海交通大学闵行校区图书馆主馆',
  address: '东川路800号',
  floors: [
    buildFloor(1, floor1Nodes, floor1Spaces),
    buildFloor(2, floor2Nodes, floor2Spaces),
    buildFloor(3, floor3Nodes, floor3Spaces),
    buildFloor(4, floor4Nodes, floor4Spaces)
  ],
  edges
}

const indoorModels: Record<number, IndoorBuildingModel> = {
  1: building1
}

export function getIndoorBuildingModel(buildingId: string | number | null | undefined) {
  const id = Number(buildingId)
  return Number.isFinite(id) ? indoorModels[id] || null : null
}
