/**
 * Component registry — looks up a ComponentDefinition by its `kind` string.
 *
 * Primitives are registered once at startup; later, composite (saved sub-circuit)
 * definitions plug in here too (Faz 5).
 */

import type { ComponentDefinition, ComponentRegistry } from './types.js';

class RegistryImpl implements ComponentRegistry {
  private readonly defs = new Map<string, ComponentDefinition>();

  register<TState>(def: ComponentDefinition<TState>): void {
    if (this.defs.has(def.kind)) {
      throw new Error(`Component kind "${def.kind}" is already registered`);
    }
    this.defs.set(def.kind, def as ComponentDefinition);
  }

  get(kind: string): ComponentDefinition | undefined {
    return this.defs.get(kind);
  }
}

export function createRegistry(): ComponentRegistry {
  return new RegistryImpl();
}
