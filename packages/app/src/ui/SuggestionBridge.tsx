import { useEffect } from 'react';
import { getShape, pinWorldPosition } from '../model/kinds.js';
import { useAppStore } from '../model/store.js';

/**
 * Selection-aware suggestion anchor. When the user selects a single
 * component whose primary output is *unconnected*, we surface the
 * placement hint dots ("+ or", "+ not", "+ output") next to its output
 * pin. As soon as anything ties into that output (or the selection
 * changes to multiple components / a wire), the anchor clears.
 *
 * The Renderer already knows how to paint these hints — it just needs
 * an anchor to be set in the store. This bridge is the glue.
 */
export function SuggestionBridge(): null {
  const selectionIds = useAppStore((s) => s.selection.componentIds);
  const components = useAppStore((s) => s.document.components);
  const wires = useAppStore((s) => s.document.wires);
  const setSuggestionAnchor = useAppStore((s) => s.setSuggestionAnchor);
  const lastPlacedKind = useAppStore((s) => s.lastPlacedKind);

  useEffect(() => {
    // Only fire when *exactly one* component is selected. Multi-select
    // and wire selection both clear the anchor.
    if (selectionIds.size !== 1) {
      setSuggestionAnchor(null);
      return;
    }
    const id = [...selectionIds][0]!;
    const comp = components.find((c) => c.id === id);
    if (!comp) {
      setSuggestionAnchor(null);
      return;
    }
    // We anchor on a *useful output to extend*: the first pin whose
    // side is "right" (canonical output direction). Composites and
    // primitives both follow this convention. If the component has no
    // right-side pins, fall back to the first pin overall.
    let shape;
    try {
      shape = getShape(comp.kind, comp.params);
    } catch {
      setSuggestionAnchor(null);
      return;
    }
    const outPin = shape.pins.find((p) => p.side === 'right') ?? shape.pins[0];
    if (!outPin) {
      setSuggestionAnchor(null);
      return;
    }
    // Skip if this pin already has any wire (input *or* output) — once
    // the user wires it up, the tip overlay is in the way.
    const alreadyWired = wires.some((w) =>
      w.endpoints.some(
        (e) => e.componentId === comp.id && e.portName === outPin.name,
      ),
    );
    if (alreadyWired) {
      setSuggestionAnchor(null);
      return;
    }
    const world = pinWorldPosition(comp.position, shape, outPin.name);
    setSuggestionAnchor({ componentId: comp.id, world });
  }, [selectionIds, components, wires, setSuggestionAnchor, lastPlacedKind]);

  return null;
}
