import type { RoomConfig, PhotoConfig, Wall } from "./types";
import { generateHearts, type HeartSpec } from "./collectibles";

export const WALL_THICKNESS = 0.25;
export const FRAME_BORDER = 0.09;
export const DOOR_WIDTH = 2.2;
export const ENTRANCE_DOOR_WIDTH = 3.2;
export const LOBBY_DEPTH = 7;
export const PLAYER_RADIUS = 0.35;
export const PLAYER_EYE_HEIGHT = 1.65;

// Salon-style gallery wall grid: two rows per wall, photos flow left-to-right
// within a row and wrap to the next row. Row centers are fixed regardless of
// each photo's real height so rows never collide even with mixed aspect
// ratios (MAX_FRAME_DIM matches the cap in scripts/import-photos.mjs).
const MAX_FRAME_DIM = 1.5;
const ROW_GAP_Y = 0.35;
const ROW_Y: [number, number] = [1.35, 1.35 + MAX_FRAME_DIM + ROW_GAP_Y];
const GAP_Z = 0.35;

export interface WallBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RoomBounds {
  id: string;
  name: string;
  description?: string;
  isFinal?: boolean;
  zStart: number;
  zEnd: number;
  zCenter: number;
  width: number;
  height: number;
}

export interface WallVisual {
  position: [number, number, number];
  size: [number, number, number]; // x, y(height), z
  roomHeight: number;
}

export interface PlacedPhoto extends PhotoConfig {
  position: [number, number, number];
  rotationY: number;
  frameWidth: number;
  frameHeight: number;
  roomId: string;
}

export interface LevelData {
  walls: WallBox[]; // collision only
  wallVisuals: WallVisual[];
  floors: { id: string; position: [number, number, number]; size: [number, number] }[];
  ceilings: { id: string; position: [number, number, number]; size: [number, number] }[];
  rooms: RoomBounds[];
  photos: PlacedPhoto[];
  lobby: { width: number; zStart: number; zEnd: number };
  totalDepth: number;
  spawn: [number, number, number];
  /** Midpoint of the largest non-final room — where the centerpiece goes. */
  centerpiece: [number, number, number];
  hearts: HeartSpec[];
}

function union(aMin: number, aMax: number, bMin: number, bMax: number) {
  return { min: Math.min(aMin, bMin), max: Math.max(aMax, bMax) };
}

/**
 * Margin needed so a wall's outermost photo frame doesn't poke through the
 * perpendicular wall at the room's corner: half the widest frame's outer
 * extent (including its border), plus the corner wall's own thickness, plus
 * a little breathing room.
 */
function marginForPhotos(photos: PhotoConfig[]): number {
  const maxWidth = photos.reduce((max, p) => Math.max(max, (p.width ?? 1.3) + FRAME_BORDER * 2), 0);
  return maxWidth / 2 + WALL_THICKNESS + 0.35;
}

/** Distributes photos evenly along a wall's Z-range (in room-local Z), avoiding the doorway if present. */
function distributeAlongWall(count: number, zStart: number, zEnd: number, margin = 0.9): number[] {
  const usableStart = zStart + margin;
  const usableEnd = zEnd - margin;
  const span = Math.max(0, usableEnd - usableStart);
  if (count <= 0) return [];
  if (count === 1) return [usableStart + span / 2];
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, i) => usableStart + step * i);
}

function rowLength(chunk: PhotoConfig[]): number {
  return chunk.reduce((sum, p, i) => sum + (p.width ?? 1.3) + (i > 0 ? GAP_Z : 0), 0);
}

/** Splits a wall's photos into 2 rows and reports how much wall length the longer row needs. */
function planGalleryWall(photos: PhotoConfig[]) {
  const perRow = Math.ceil(photos.length / 2);
  const rows = [photos.slice(0, perRow), photos.slice(perRow)];
  const lengths = rows.map(rowLength);
  return { rows, maxLength: Math.max(0, ...lengths) };
}

/** Places one row's photos centered within `availableLength`, starting at `zStart`. */
function placeRow(
  row: PhotoConfig[],
  zStart: number,
  availableLength: number,
  y: number,
  x: number,
  rotationY: number,
  roomId: string,
  out: PlacedPhoto[]
) {
  const contentLength = rowLength(row);
  let z = zStart + Math.max(0, (availableLength - contentLength) / 2);
  for (const photo of row) {
    const w = photo.width ?? 1.3;
    const h = photo.height ?? 1.0;
    out.push({
      ...photo,
      roomId,
      position: [x, y, z + w / 2],
      rotationY,
      frameWidth: w,
      frameHeight: h,
    });
    z += w + GAP_Z;
  }
}

export function buildLevel(rooms: RoomConfig[], heartNotes: string[] = []): LevelData {
  const walls: WallBox[] = [];
  const wallVisuals: WallVisual[] = [];
  const floors: LevelData["floors"] = [];
  const ceilings: LevelData["ceilings"] = [];
  const roomBounds: RoomBounds[] = [];
  const photos: PlacedPhoto[] = [];
  let centerpiece: [number, number, number] = [0, 0, 0];

  const lobbyWidth = rooms[0].width;
  const lobbyZStart = -LOBBY_DEPTH;
  const lobbyZEnd = 0;

  floors.push({ id: "lobby-floor", position: [0, 0, (lobbyZStart + lobbyZEnd) / 2], size: [lobbyWidth, LOBBY_DEPTH] });
  ceilings.push({
    id: "lobby-ceiling",
    position: [0, 4.6, (lobbyZStart + lobbyZEnd) / 2],
    size: [lobbyWidth, LOBBY_DEPTH],
  });
  pushSideWalls(lobbyWidth / 2, lobbyZStart, lobbyZEnd, 4.6, walls, wallVisuals);
  pushSolidWall(lobbyZStart, -lobbyWidth / 2, lobbyWidth / 2, 4.6, walls, wallVisuals);

  let cursorZ = 0;
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const zStart = cursorZ;

    const left = room.photos.filter((_, idx) => photoWallFor(room.photos, idx) === "left");
    const right = room.photos.filter((_, idx) => photoWallFor(room.photos, idx) === "right");
    const margin = room.photos.length ? marginForPhotos(room.photos) : 0.9;

    let depth = room.depth;
    let leftPlan: ReturnType<typeof planGalleryWall> | null = null;
    let rightPlan: ReturnType<typeof planGalleryWall> | null = null;

    if (!room.isFinal) {
      leftPlan = planGalleryWall(left);
      rightPlan = planGalleryWall(right);
      const required = Math.max(leftPlan.maxLength, rightPlan.maxLength) + margin * 2;
      depth = Math.max(depth, required);
    }

    const zEnd = zStart + depth;
    cursorZ = zEnd;

    roomBounds.push({
      id: room.id,
      name: room.name,
      description: room.description,
      isFinal: room.isFinal,
      zStart,
      zEnd,
      zCenter: (zStart + zEnd) / 2,
      width: room.width,
      height: room.height,
    });

    if (!room.isFinal) {
      centerpiece = [0, 0, (zStart + zEnd) / 2];
    }

    floors.push({ id: `${room.id}-floor`, position: [0, 0, (zStart + zEnd) / 2], size: [room.width, depth] });
    ceilings.push({ id: `${room.id}-ceiling`, position: [0, room.height, (zStart + zEnd) / 2], size: [room.width, depth] });

    pushSideWalls(room.width / 2, zStart, zEnd, room.height, walls, wallVisuals);

    const isFirst = i === 0;
    const isLast = i === rooms.length - 1;

    if (isFirst) {
      pushDoorway(
        lobbyZEnd,
        union(-lobbyWidth / 2, lobbyWidth / 2, -room.width / 2, room.width / 2),
        Math.max(4.6, room.height),
        ENTRANCE_DOOR_WIDTH,
        walls,
        wallVisuals
      );
    }

    if (isLast) {
      pushSolidWall(zEnd, -room.width / 2, room.width / 2, room.height, walls, wallVisuals);
    } else {
      const next = rooms[i + 1];
      const u = union(-room.width / 2, room.width / 2, -next.width / 2, next.width / 2);
      pushDoorway(zEnd, u, Math.max(room.height, next.height), DOOR_WIDTH, walls, wallVisuals);
    }

    if (room.isFinal) {
      const positions = distributeAlongWall(room.photos.length, -room.width / 2 + 0.2, room.width / 2 - 0.2, 1.2);
      room.photos.forEach((photo, idx) => {
        const w = photo.width ?? 1.3;
        const h = photo.height ?? 1.0;
        photos.push({
          ...photo,
          roomId: room.id,
          position: [positions[idx] ?? 0, 1.7, zEnd - WALL_THICKNESS - 0.03],
          rotationY: Math.PI,
          frameWidth: w,
          frameHeight: h,
        });
      });
    } else if (leftPlan && rightPlan) {
      const availableLength = depth - margin * 2;
      const leftX = -room.width / 2 + WALL_THICKNESS + 0.03;
      const rightX = room.width / 2 - WALL_THICKNESS - 0.03;

      leftPlan.rows.forEach((row, rowIdx) => {
        placeRow(row, zStart + margin, availableLength, ROW_Y[rowIdx], leftX, Math.PI / 2, room.id, photos);
      });
      rightPlan.rows.forEach((row, rowIdx) => {
        placeRow(row, zStart + margin, availableLength, ROW_Y[rowIdx], rightX, -Math.PI / 2, room.id, photos);
      });
    }
  }

  const galleryRoom = roomBounds.find((r) => !r.isFinal) ?? roomBounds[0];
  const hearts = galleryRoom && heartNotes.length ? generateHearts(galleryRoom, heartNotes) : [];

  return {
    walls,
    wallVisuals,
    floors,
    ceilings,
    rooms: roomBounds,
    photos,
    lobby: { width: lobbyWidth, zStart: lobbyZStart, zEnd: lobbyZEnd },
    totalDepth: cursorZ,
    spawn: [0, PLAYER_EYE_HEIGHT, lobbyZStart + 2],
    centerpiece,
    hearts,
  };
}

export function getRoomAt(z: number, rooms: RoomBounds[], lobby: { zStart: number; zEnd: number }): RoomBounds | null {
  if (z < lobby.zEnd) return null; // still in lobby
  return rooms.find((r) => z >= r.zStart && z < r.zEnd) ?? rooms[rooms.length - 1] ?? null;
}

function photoWallFor(photos: PhotoConfig[], idx: number): Wall {
  const explicit = photos[idx].wall;
  if (explicit && explicit !== "back") return explicit;
  return idx % 2 === 0 ? "left" : "right";
}

function pushSideWalls(
  halfWidth: number,
  zStart: number,
  zEnd: number,
  height: number,
  walls: WallBox[],
  visuals: WallVisual[]
) {
  const t = WALL_THICKNESS;
  const depth = zEnd - zStart;
  const zCenter = (zStart + zEnd) / 2;

  walls.push({ minX: -halfWidth - t, maxX: -halfWidth + t, minZ: zStart, maxZ: zEnd });
  visuals.push({ position: [-halfWidth, height / 2, zCenter], size: [t * 2, height, depth], roomHeight: height });

  walls.push({ minX: halfWidth - t, maxX: halfWidth + t, minZ: zStart, maxZ: zEnd });
  visuals.push({ position: [halfWidth, height / 2, zCenter], size: [t * 2, height, depth], roomHeight: height });
}

function pushSolidWall(z: number, minX: number, maxX: number, height: number, walls: WallBox[], visuals: WallVisual[]) {
  const t = WALL_THICKNESS;
  walls.push({ minX, maxX, minZ: z - t, maxZ: z + t });
  visuals.push({ position: [(minX + maxX) / 2, height / 2, z], size: [maxX - minX, height, t * 2], roomHeight: height });
}

function pushDoorway(
  z: number,
  extent: { min: number; max: number },
  height: number,
  doorWidth: number,
  walls: WallBox[],
  visuals: WallVisual[]
) {
  const t = WALL_THICKNESS;
  const doorHalf = doorWidth / 2;
  const lintelHeight = height - 2.6 > 0.3 ? height - 2.6 : 0.5;

  if (extent.min < -doorHalf) {
    pushSolidWall(z, extent.min, -doorHalf, height, walls, visuals);
  }
  if (extent.max > doorHalf) {
    pushSolidWall(z, doorHalf, extent.max, height, walls, visuals);
  }
  visuals.push({ position: [0, height - lintelHeight / 2, z], size: [doorWidth, lintelHeight, t * 2], roomHeight: height });
}
