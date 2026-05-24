/**
 * Path-compressed, union-by-rank Disjoint Set (Union-Find).
 *
 * Used by the net compiler to collapse wire junctions into nets in
 * near-constant time. Generic over the element type — we use it with
 * PortKey strings (`${componentId}:${portName}`).
 */

export class UnionFind<T> {
  private readonly parent = new Map<T, T>();
  private readonly rank = new Map<T, number>();

  /** Make sure `x` exists as its own set; no-op if already known. */
  add(x: T): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }

  /** Find the representative for `x`, adding it if unseen. Path-compresses. */
  find(x: T): T {
    this.add(x);
    let root = x;
    while (true) {
      const p = this.parent.get(root)!;
      if (p === root) break;
      root = p;
    }
    // Path compression: point every node on the path directly to root.
    let cur = x;
    while (this.parent.get(cur)! !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  /** Union the sets containing `a` and `b`. Returns true if they merged. */
  union(a: T, b: T): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
    return true;
  }

  /** Iterate every (element, root) pair currently tracked. */
  *entries(): IterableIterator<[T, T]> {
    for (const x of this.parent.keys()) {
      yield [x, this.find(x)];
    }
  }
}
