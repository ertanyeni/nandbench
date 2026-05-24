import { describe, expect, it } from 'vitest';
import { CHALLENGES } from '../src/challenges.js';
import { TEMPLATES } from '../src/fixtures/templates.js';
import { runChallenge } from '../src/model/challenge-runner.js';

describe('Challenge runner', () => {
  it('half-adder template passes its own challenge', () => {
    const tpl = TEMPLATES.find((t) => t.id === 'half-adder')!;
    const doc = tpl.build();
    const result = runChallenge(doc, [], CHALLENGES['half-adder']!);
    expect(result.kind).toBe('pass');
  });

  it('full-adder template passes its own challenge', () => {
    const tpl = TEMPLATES.find((t) => t.id === 'full-adder')!;
    const doc = tpl.build();
    const result = runChallenge(doc, [], CHALLENGES['full-adder']!);
    expect(result.kind).toBe('pass');
  });

  it('returns an error when expected input pins are missing', () => {
    const tpl = TEMPLATES.find((t) => t.id === 'empty')!;
    const result = runChallenge(tpl.build(), [], CHALLENGES['half-adder']!);
    expect(result.kind).toBe('error');
  });

  it('reports failures when the circuit produces wrong outputs', () => {
    // Take the half-adder template but swap XOR and AND so the truth table
    // breaks. We just rebuild a half-adder with swapped wire endpoints.
    const tpl = TEMPLATES.find((t) => t.id === 'half-adder')!;
    const doc = tpl.build();
    // Swap sum & cout wires: connect XOR.out to cout pin and AND.out to sum pin.
    const sumWire = doc.wires.find(
      (w) => w.endpoints[1].componentId === 'sum' && w.endpoints[1].portName === 'in',
    );
    const coutWire = doc.wires.find(
      (w) => w.endpoints[1].componentId === 'cout' && w.endpoints[1].portName === 'in',
    );
    // Some templates use generated UUIDs — fall back to id match by kind+pos.
    if (!sumWire || !coutWire) {
      const sumComp = doc.components.find((c) => c.params['name'] === 'sum');
      const coutComp = doc.components.find((c) => c.params['name'] === 'cout');
      const xorComp = doc.components.find((c) => c.kind === 'xor');
      const andComp = doc.components.find((c) => c.kind === 'and');
      expect(sumComp && coutComp && xorComp && andComp).toBeTruthy();
      const broken = {
        ...doc,
        wires: doc.wires.map((w) => {
          const isSumWire =
            w.endpoints[1].componentId === sumComp!.id &&
            w.endpoints[1].portName === 'in';
          const isCoutWire =
            w.endpoints[1].componentId === coutComp!.id &&
            w.endpoints[1].portName === 'in';
          if (isSumWire) {
            return {
              ...w,
              endpoints: [
                { componentId: andComp!.id, portName: 'out' },
                w.endpoints[1],
              ] as typeof w.endpoints,
            };
          }
          if (isCoutWire) {
            return {
              ...w,
              endpoints: [
                { componentId: xorComp!.id, portName: 'out' },
                w.endpoints[1],
              ] as typeof w.endpoints,
            };
          }
          return w;
        }),
      };
      const result = runChallenge(broken, [], CHALLENGES['half-adder']!);
      expect(result.kind).toBe('fail');
    }
  });
});
