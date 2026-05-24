/**
 * Axis-aligned bounding-box quadtree for fast spatial queries.
 *
 * Used at this stage for click-to-select on the infinite canvas — we have a
 * small number of items in Faz 1, but the structure is the one we'll lean on
 * once the canvas hosts thousands of gates and wires (ARCHITECTURE.md §4).
 *
 * Static build (CLAUDE.md: "rebuild on change" is fine through Faz 1 since
 * there's no editor yet). A node holds items whose bbox intersects its region;
 * if a node holds more than CAPACITY items and is above MIN_SIZE, it
 * subdivides. Items straddling subquadrant boundaries stay at the parent.
 */

export interface AABB {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface QuadItem<T> {
  readonly bbox: AABB;
  readonly payload: T;
}

interface Node<T> {
  region: AABB;
  items: QuadItem<T>[];
  children?: [Node<T>, Node<T>, Node<T>, Node<T>]; // NW, NE, SW, SE
}

const CAPACITY = 8;
const MIN_SIZE = 32;

export class Quadtree<T> {
  private readonly root: Node<T>;

  constructor(region: AABB) {
    this.root = { region, items: [] };
  }

  static build<T>(items: readonly QuadItem<T>[]): Quadtree<T> {
    if (items.length === 0) {
      return new Quadtree({ x: 0, y: 0, w: 1, h: 1 });
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const it of items) {
      if (it.bbox.x < minX) minX = it.bbox.x;
      if (it.bbox.y < minY) minY = it.bbox.y;
      if (it.bbox.x + it.bbox.w > maxX) maxX = it.bbox.x + it.bbox.w;
      if (it.bbox.y + it.bbox.h > maxY) maxY = it.bbox.y + it.bbox.h;
    }
    // Pad a little so items at the extreme edge sit cleanly inside.
    const pad = 16;
    const tree = new Quadtree<T>({
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    });
    for (const it of items) tree.insert(it);
    return tree;
  }

  insert(item: QuadItem<T>): void {
    this.insertInto(this.root, item);
  }

  private insertInto(node: Node<T>, item: QuadItem<T>): void {
    if (!intersects(node.region, item.bbox)) return;
    if (node.children) {
      const fitting = node.children.find((c) => contains(c.region, item.bbox));
      if (fitting) {
        this.insertInto(fitting, item);
        return;
      }
      // Straddles subquadrants — keep at this level.
      node.items.push(item);
      return;
    }
    node.items.push(item);
    if (node.items.length > CAPACITY && node.region.w > MIN_SIZE && node.region.h > MIN_SIZE) {
      this.subdivide(node);
    }
  }

  private subdivide(node: Node<T>): void {
    const { x, y, w, h } = node.region;
    const hw = w / 2;
    const hh = h / 2;
    const nw: Node<T> = { region: { x, y, w: hw, h: hh }, items: [] };
    const ne: Node<T> = { region: { x: x + hw, y, w: hw, h: hh }, items: [] };
    const sw: Node<T> = { region: { x, y: y + hh, w: hw, h: hh }, items: [] };
    const se: Node<T> = { region: { x: x + hw, y: y + hh, w: hw, h: hh }, items: [] };
    node.children = [nw, ne, sw, se];
    const original = node.items;
    node.items = [];
    for (const it of original) {
      const child = node.children.find((c) => contains(c.region, it.bbox));
      if (child) this.insertInto(child, it);
      else node.items.push(it);
    }
  }

  /** All items whose bbox contains the world-space point (x, y). */
  queryPoint(x: number, y: number): T[] {
    const out: T[] = [];
    this.queryPointInto(this.root, x, y, out);
    return out;
  }

  private queryPointInto(node: Node<T>, x: number, y: number, out: T[]): void {
    if (!pointInside(node.region, x, y)) return;
    for (const it of node.items) {
      if (pointInside(it.bbox, x, y)) out.push(it.payload);
    }
    if (node.children) {
      for (const c of node.children) this.queryPointInto(c, x, y, out);
    }
  }

  /** All items whose bbox intersects the given region. */
  queryRect(region: AABB): T[] {
    const out: T[] = [];
    this.queryRectInto(this.root, region, out);
    return out;
  }

  private queryRectInto(node: Node<T>, region: AABB, out: T[]): void {
    if (!intersects(node.region, region)) return;
    for (const it of node.items) {
      if (intersects(it.bbox, region)) out.push(it.payload);
    }
    if (node.children) {
      for (const c of node.children) this.queryRectInto(c, region, out);
    }
  }
}

function pointInside(b: AABB, x: number, y: number): boolean {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function intersects(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function contains(outer: AABB, inner: AABB): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}
