import { describe, expect, it } from 'vitest';
import { lRoute, routeOrthogonal } from '../src/model/routing.js';

describe('routing helpers', () => {
  it('lRoute returns a straight path when start/end share an axis', () => {
    expect(lRoute({ x: 0, y: 0 }, { x: 50, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
    ]);
    expect(lRoute({ x: 10, y: 10 }, { x: 10, y: 80 })).toEqual([
      { x: 10, y: 10 },
      { x: 10, y: 80 },
    ]);
  });

  it('lRoute inserts a corner for diagonal endpoints', () => {
    const path = lRoute({ x: 0, y: 0 }, { x: 50, y: 30 });
    // dx >= dy, so the corner takes end.x with start.y.
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 30 },
    ]);
  });

  it('routeOrthogonal starts and ends exactly at the pin points', () => {
    const path = routeOrthogonal(
      { x: 0, y: 0 },
      { x: 80, y: 40 },
      'right',
      'left',
      16,
    );
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 80, y: 40 });
    // dedupePath collapses collinear stubs, but the path must still
    // change direction at least once.
    let bends = 0;
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const c = path[i + 1]!;
      const sameAxisIn = a.x === b.x;
      const sameAxisOut = b.x === c.x;
      if (sameAxisIn !== sameAxisOut) bends++;
    }
    expect(bends).toBeGreaterThanOrEqual(1);
  });

  it('routeOrthogonal detours around an obstacle', () => {
    // Source pointing right, target pointing left, vertically offset so
    // the natural L-bend would cross through a box that sits between
    // them. With an obstacle present, the router falls back to the
    // alternative bend (different corner orientation).
    const obstacle = { x: 30, y: -10, w: 40, h: 80 };
    const withObstacle = routeOrthogonal(
      { x: 0, y: 0 },
      { x: 100, y: 60 },
      'right',
      'left',
      16,
      [obstacle],
    );
    const without = routeOrthogonal(
      { x: 0, y: 0 },
      { x: 100, y: 60 },
      'right',
      'left',
      16,
    );
    // Either the path changed, or the original already missed the box.
    // Asserting the bare paths differ for at least one waypoint when an
    // obstacle is present and crosses the natural bend.
    const sameLength = withObstacle.length === without.length;
    const sameWaypoints =
      sameLength && withObstacle.every((p, i) => p.x === without[i]!.x && p.y === without[i]!.y);
    // If they're literally identical, the test set-up failed to push the
    // router off course — flag it so we tune the fixture later.
    expect(sameWaypoints).toBe(false);
  });

  it('routeOrthogonal collapses collinear points (dedupe)', () => {
    // Co-linear sequence: route from (0,0) to (50,0) with right-to-left stubs
    // produces two horizontal segments on y=0 that should collapse.
    const path = routeOrthogonal(
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      'right',
      'left',
      8,
    );
    // No interior collinear points (start, end, plus at most stubs that
    // remain on the same y).
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const c = path[i + 1]!;
      const collinearH = a.y === b.y && b.y === c.y;
      const collinearV = a.x === b.x && b.x === c.x;
      expect(collinearH || collinearV).toBe(false);
    }
  });

  it('routeOrthogonal siblingIndex changes the path', () => {
    const p0 = routeOrthogonal({ x: 0, y: 0 }, { x: 100, y: 60 }, 'right', 'left', 16);
    const p1 = routeOrthogonal({ x: 0, y: 0 }, { x: 100, y: 60 }, 'right', 'left', 16, [], {
      siblingIndex: 1,
    });
    // We don't lock the exact stub geometry (dedupe may collapse the
    // initial stub when collinear with the bend), but a non-zero
    // siblingIndex must alter the path somehow.
    const sameLength = p0.length === p1.length;
    const sameAll = sameLength && p0.every((p, i) => p.x === p1[i]!.x && p.y === p1[i]!.y);
    expect(sameAll).toBe(false);
  });
});
