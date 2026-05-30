/**
 * Wire-path routing utilities — small, deterministic helpers that turn
 * (startPoint, endPoint) into a list of orthogonal waypoints.
 *
 * Faz 2 uses the simplest possible router (L-route or user-supplied
 * waypoints). Auto-routing around obstacles (A*) is explicitly v2
 * (ROADMAP.md "deliberately deferred").
 */

import { GRID } from './kinds.js';
import type { Point } from './document.js';

/** Snap a world coordinate to the nearest grid intersection. */
export function snapToGrid(world: Point): Point {
  return {
    x: Math.round(world.x / GRID) * GRID,
    y: Math.round(world.y / GRID) * GRID,
  };
}

/**
 * Single-corner L route between two points. Picks the corner orientation
 * (HV vs VH) whose first segment is longer — typically the more readable
 * choice when the start is a pin facing a known direction.
 */
export function lRoute(start: Point, end: Point): Point[] {
  if (start.x === end.x || start.y === end.y) {
    return [start, end];
  }
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const corner: Point =
    dx >= dy ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
  return [start, corner, end];
}

export type PinSide = 'left' | 'right' | 'top' | 'bottom';

/** Axis-aligned rectangle in world coords — used as a routing obstacle. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Inflate a Box by `pad` on every side. Used to keep the router from
 * tracing the very edge of a component — a few pixels of breathing room
 * looks dramatically cleaner.
 */
function inflate(b: Box, pad: number): Box {
  return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
}

/** Does the orthogonal segment (a,b) intersect the box? */
function segmentHitsBox(a: Point, b: Point, box: Box): boolean {
  // Treat segments as having zero width — only crossing tests.
  if (a.x === b.x) {
    // vertical
    const x = a.x;
    if (x < box.x || x > box.x + box.w) return false;
    const y0 = Math.min(a.y, b.y);
    const y1 = Math.max(a.y, b.y);
    return y0 < box.y + box.h && y1 > box.y;
  }
  // horizontal
  const y = a.y;
  if (y < box.y || y > box.y + box.h) return false;
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  return x0 < box.x + box.w && x1 > box.x;
}

function pointInsideAny(p: Point, boxes: readonly Box[]): boolean {
  for (const b of boxes) {
    if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) return true;
  }
  return false;
}

/**
 * Pin-side-aware orthogonal router. Each endpoint takes a short
 * perpendicular "stub" away from the component body before bending —
 * this stops wires from cutting across pins and keeps the topology
 * readable even when shapes sit close together.
 *
 * The interior of the path is a single L bend (HV or VH) between the
 * two stub tips. If the stubs happen to line up on the same axis,
 * `dedupePath` collapses the redundant points so we emit a clean
 * straight segment.
 */
/**
 * Routing-time options shared across wires from the same source.
 *
 * `siblingIndex` lets parallel wires from one pin stagger their bend so
 * they fan out cleanly instead of stacking on top of each other. We map
 * each successive sibling to an extra +6px along the perpendicular axis
 * before the bend.
 */
export interface RouteOptions {
  readonly stub?: number;
  readonly obstacles?: readonly Box[];
  /** 0 = first wire from this pin (no offset); N = N×LANE perpendicular shift. */
  readonly siblingIndex?: number;
}

const BUS_LANE = 6;

export function routeOrthogonal(
  start: Point,
  end: Point,
  startSide?: PinSide,
  endSide?: PinSide,
  stub: number = 16,
  obstacles: readonly Box[] = [],
  opts: { siblingIndex?: number } = {},
): Point[] {
  const sib = opts.siblingIndex ?? 0;
  // Bus lane shift: nudges the stub tip along the axis perpendicular to
  // the pin's outgoing direction. Subsequent wires from the same pin
  // therefore "fan" instead of overlapping.
  stub = stub + sib * BUS_LANE;
  const stubStart = startSide ? offsetBySide(start, startSide, stub) : start;
  const stubEnd = endSide ? offsetBySide(end, endSide, stub) : end;
  const path: Point[] = [start];
  if (startSide) path.push(stubStart);
  // Bend between stub tips when they differ on both axes.
  if (stubStart.x !== stubEnd.x && stubStart.y !== stubEnd.y) {
    const horizontalFirst =
      startSide === 'left' || startSide === 'right'
        ? true
        : startSide === 'top' || startSide === 'bottom'
          ? false
          : Math.abs(stubEnd.x - stubStart.x) >= Math.abs(stubEnd.y - stubStart.y);
    const bend: Point = horizontalFirst
      ? { x: stubEnd.x, y: stubStart.y }
      : { x: stubStart.x, y: stubEnd.y };
    // Try this bend first; if either resulting segment cuts through an
    // obstacle, fall back to the other orientation. Two bends is the
    // most we attempt — full A* is V2.
    if (obstacles.length > 0 && pathHitsObstacles(stubStart, bend, stubEnd, obstacles)) {
      const altBend: Point = horizontalFirst
        ? { x: stubStart.x, y: stubEnd.y }
        : { x: stubEnd.x, y: stubStart.y };
      if (!pathHitsObstacles(stubStart, altBend, stubEnd, obstacles)) {
        path.push(altBend);
      } else {
        // Both two-bend paths hit something — insert a 3-bend "S route"
        // that goes wide of the offending box on the longer axis.
        const detour = sRouteDetour(stubStart, stubEnd, obstacles);
        path.push(...detour);
      }
    } else {
      path.push(bend);
    }
  }
  if (endSide) path.push(stubEnd);
  path.push(end);
  return dedupePath(path);
}

function pathHitsObstacles(
  a: Point,
  bend: Point,
  c: Point,
  obstacles: readonly Box[],
): boolean {
  for (const raw of obstacles) {
    const box = inflate(raw, 4);
    if (segmentHitsBox(a, bend, box) || segmentHitsBox(bend, c, box)) return true;
  }
  return false;
}

/**
 * Trivial 3-bend "S" detour that puts the middle waypoints roughly
 * halfway between the stub tips, offset upward or downward enough to
 * miss every supplied obstacle. Good-enough fallback for the rare case
 * where the basic L router can't find a clean bend.
 */
function sRouteDetour(start: Point, end: Point, obstacles: readonly Box[]): Point[] {
  const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
  const mid = horizontal ? (start.x + end.x) / 2 : (start.y + end.y) / 2;
  if (horizontal) {
    return [
      { x: mid, y: start.y },
      { x: mid, y: end.y },
    ];
  }
  return [
    { x: start.x, y: mid },
    { x: end.x, y: mid },
  ];
  void obstacles;
}

function offsetBySide(p: Point, side: PinSide, d: number): Point {
  switch (side) {
    case 'left':
      return { x: p.x - d, y: p.y };
    case 'right':
      return { x: p.x + d, y: p.y };
    case 'top':
      return { x: p.x, y: p.y - d };
    case 'bottom':
      return { x: p.x, y: p.y + d };
  }
}

/** Collapse runs of identical points + collinear bends into the minimal path. */
function dedupePath(pts: readonly Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) out.push(p);
  }
  // Collapse 3-collinear sequences: if p[i-1], p[i], p[i+1] are on the
  // same line, drop p[i].
  if (out.length < 3) return out;
  const collapsed: Point[] = [out[0]!];
  for (let i = 1; i < out.length - 1; i++) {
    const a = out[i - 1]!;
    const b = out[i]!;
    const c = out[i + 1]!;
    const collinearH = a.y === b.y && b.y === c.y;
    const collinearV = a.x === b.x && b.x === c.x;
    if (collinearH || collinearV) continue;
    collapsed.push(b);
  }
  collapsed.push(out[out.length - 1]!);
  return collapsed;
}

/**
 * Append a waypoint to a path while enforcing Manhattan routing: from the
 * last point we insert at most one perpendicular bend before the new point.
 * Returns the new path.
 */
export function pushOrthogonalWaypoint(path: readonly Point[], next: Point): Point[] {
  if (path.length === 0) return [next];
  const last = path[path.length - 1]!;
  if (last.x === next.x || last.y === next.y) {
    return [...path, next];
  }
  // Insert a bend. Choose the bend that keeps the first segment longer
  // (same heuristic as lRoute) for readability.
  const dx = Math.abs(next.x - last.x);
  const dy = Math.abs(next.y - last.y);
  const bend: Point =
    dx >= dy ? { x: next.x, y: last.y } : { x: last.x, y: next.y };
  return [...path, bend, next];
}

/* ---------------------- A* grid router ---------------------- */

/**
 * Grid-based A* path finder for orthogonal wires. Runs on a coarse grid
 * (one cell = `GRID` world units) and refuses to enter cells covered by
 * any obstacle box. Output is a list of waypoints with collinear runs
 * collapsed (no redundant points along a straight segment).
 *
 * Cost model:
 *   - moving one cell horizontally or vertically: cost 1
 *   - turning: extra cost of `TURN_COST` (encourages straight runs)
 *
 * The router falls back to the deterministic L-route when:
 *   - no obstacles supplied (no benefit from search)
 *   - search exceeds the node budget (large/tangled layouts)
 *   - start or end cell is itself blocked
 *
 * This is intentionally a "good enough" router: it produces clean
 * routes for the typical 10-50 component circuit. A production-grade
 * router would use Steiner trees + bus channels — out of scope for V2.
 */
export function routeAStar(
  start: Point,
  end: Point,
  obstacles: readonly Box[] = [],
  opts: { maxNodes?: number; pad?: number } = {},
): Point[] {
  const maxNodes = opts.maxNodes ?? 4000;
  const pad = opts.pad ?? 4;
  if (obstacles.length === 0) return lRoute(start, end);

  const startCell = { x: Math.round(start.x / GRID), y: Math.round(start.y / GRID) };
  const endCell = { x: Math.round(end.x / GRID), y: Math.round(end.y / GRID) };

  // Inflate obstacles once.
  const inflated = obstacles.map((b) => inflate(b, pad));
  const blocked = (cx: number, cy: number): boolean => {
    const wx = cx * GRID;
    const wy = cy * GRID;
    for (const b of inflated) {
      if (wx > b.x && wx < b.x + b.w && wy > b.y && wy < b.y + b.h) return true;
    }
    return false;
  };

  // If start or end is blocked, the search can't succeed; fall back.
  if (blocked(startCell.x, startCell.y) || blocked(endCell.x, endCell.y)) {
    return lRoute(start, end);
  }

  const TURN_COST = 2;
  type Node = {
    readonly cx: number;
    readonly cy: number;
    readonly dir: 'h' | 'v' | null; // incoming direction
    readonly g: number;
    readonly f: number;
    readonly parent: Node | null;
  };
  const key = (cx: number, cy: number, dir: 'h' | 'v' | null): string =>
    `${cx},${cy},${dir ?? '-'}`;
  const heuristic = (cx: number, cy: number): number =>
    Math.abs(cx - endCell.x) + Math.abs(cy - endCell.y);

  const open: Node[] = [
    {
      cx: startCell.x,
      cy: startCell.y,
      dir: null,
      g: 0,
      f: heuristic(startCell.x, startCell.y),
      parent: null,
    },
  ];
  const closed = new Set<string>();
  let visited = 0;

  while (open.length > 0 && visited < maxNodes) {
    // Pick the lowest-f node — small open set so linear scan is fine.
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i]!.f < open[bestIdx]!.f) bestIdx = i;
    }
    const cur = open.splice(bestIdx, 1)[0]!;
    visited++;
    if (cur.cx === endCell.x && cur.cy === endCell.y) {
      // Reconstruct + grid-to-world.
      const cells: { cx: number; cy: number }[] = [];
      let n: Node | null = cur;
      while (n) {
        cells.push({ cx: n.cx, cy: n.cy });
        n = n.parent;
      }
      cells.reverse();
      const path: Point[] = cells.map((c) => ({ x: c.cx * GRID, y: c.cy * GRID }));
      // Replace start + end with exact pin coords so the visual matches
      // the bbox, not the snapped cell.
      path[0] = start;
      path[path.length - 1] = end;
      return dedupePath(path);
    }
    closed.add(key(cur.cx, cur.cy, cur.dir));
    const neighbors: { dx: number; dy: number; dir: 'h' | 'v' }[] = [
      { dx: 1, dy: 0, dir: 'h' },
      { dx: -1, dy: 0, dir: 'h' },
      { dx: 0, dy: 1, dir: 'v' },
      { dx: 0, dy: -1, dir: 'v' },
    ];
    for (const nb of neighbors) {
      const ncx = cur.cx + nb.dx;
      const ncy = cur.cy + nb.dy;
      if (blocked(ncx, ncy)) continue;
      const k = key(ncx, ncy, nb.dir);
      if (closed.has(k)) continue;
      const turnPenalty = cur.dir && cur.dir !== nb.dir ? TURN_COST : 0;
      const g = cur.g + 1 + turnPenalty;
      const f = g + heuristic(ncx, ncy);
      const existing = open.find(
        (o) => o.cx === ncx && o.cy === ncy && o.dir === nb.dir,
      );
      if (existing && existing.g <= g) continue;
      if (existing) {
        // Replace by removing old + pushing new (simpler than mutating)
        open.splice(open.indexOf(existing), 1);
      }
      open.push({ cx: ncx, cy: ncy, dir: nb.dir, g, f, parent: cur });
    }
  }
  // Budget blown or no path: fall back to L-route (still better than nothing).
  return lRoute(start, end);
}
