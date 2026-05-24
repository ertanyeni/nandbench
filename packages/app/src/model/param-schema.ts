/**
 * Per-kind parameter schemas.
 *
 * The Inspector panel renders a form from these fields, and validates input
 * before dispatching UpdateParamsCommand. Schemas live in the app — the
 * engine doesn't constrain params (its `ComponentParams = Record<string,
 * scalar>`), so all UX-facing constraints (mins, options, validators) are
 * centralized here.
 */

import type { ComponentParams } from '@gatecraft/engine';

export type ParamField =
  | {
      readonly type: 'number';
      readonly key: string;
      readonly label: string;
      /** i18n key for the label; falls back to `label` when missing. */
      readonly labelKey?: string;
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
      readonly default: number;
      /** Optional, restricts to specific discrete values (e.g. powers of two). */
      readonly options?: readonly number[];
    }
  | {
      readonly type: 'string';
      readonly key: string;
      readonly label: string;
      readonly labelKey?: string;
      readonly default: string;
      readonly placeholder?: string;
      /** Validator returns null if OK, error message otherwise. */
      readonly validate?: (raw: string) => string | null;
    }
  | {
      readonly type: 'boolean';
      readonly key: string;
      readonly label: string;
      readonly labelKey?: string;
      readonly default: boolean;
    }
  | {
      readonly type: 'enum';
      readonly key: string;
      readonly label: string;
      readonly labelKey?: string;
      readonly options: readonly string[];
      readonly default: string;
    };

export type ParamSchema = readonly ParamField[];

export type NumberParamField = Extract<ParamField, { type: 'number' }>;
export type StringParamField = Extract<ParamField, { type: 'string' }>;
export type BooleanParamField = Extract<ParamField, { type: 'boolean' }>;
export type EnumParamField = Extract<ParamField, { type: 'enum' }>;

const widthField = (max = 64): NumberParamField => ({
  type: 'number',
  key: 'width',
  label: 'Width (bits)',
  labelKey: 'param.width',
  min: 1,
  max,
  step: 1,
  default: 1,
});

const naryInputsField = (): NumberParamField => ({
  type: 'number',
  key: 'inputs',
  label: 'Inputs',
  labelKey: 'param.inputs',
  min: 2,
  max: 8,
  step: 1,
  default: 2,
});

/**
 * Validate a bigint literal string. Returns an i18n key on failure so the
 * Inspector can render the localized message — t() falls back to the raw
 * key if a translation is missing.
 */
const literalValidator = (raw: string): string | null => {
  const s = raw.trim();
  if (!s) return 'inspector.fieldErrors.empty';
  try {
    BigInt(s);
    return null;
  } catch {
    return 'inspector.fieldErrors.literal';
  }
};

const labelNameField = (): StringParamField => ({
  type: 'string',
  key: 'name',
  label: 'Name',
  labelKey: 'param.name',
  default: '',
  placeholder: 'A, B, sum, …',
});

export const PARAM_SCHEMAS: Readonly<Record<string, ParamSchema>> = {
  // Wiring / sources
  input: [widthField(), labelNameField()],
  output: [widthField(), labelNameField()],
  constant: [
    widthField(),
    {
      type: 'string',
      key: 'value',
      label: 'Value (decimal or 0xHEX)',
      labelKey: 'param.value',
      default: '0',
      placeholder: '0xA or 42',
      validate: literalValidator,
    },
  ],
  clock: [],
  splitter: [
    { ...widthField(), default: 8, min: 2 },
    {
      type: 'number',
      key: 'fanout',
      label: 'Fanout',
      labelKey: 'param.fanout',
      min: 2,
      max: 64,
      step: 1,
      default: 4,
    },
  ],
  tunnel: [
    widthField(),
    {
      type: 'string',
      key: 'label',
      label: 'Label',
      labelKey: 'param.label',
      default: '',
      placeholder: 'NET / CLK / DATA',
    },
  ],

  // Gates
  and: [widthField(), naryInputsField()],
  or: [widthField(), naryInputsField()],
  nand: [widthField(), naryInputsField()],
  nor: [widthField(), naryInputsField()],
  xor: [widthField(), naryInputsField()],
  xnor: [widthField(), naryInputsField()],
  not: [widthField()],
  buffer: [widthField()],

  // Plexers
  mux: [
    widthField(),
    {
      type: 'number',
      key: 'inputs',
      label: 'Inputs',
      labelKey: 'param.inputs',
      options: [2, 4, 8, 16],
      default: 2,
    },
  ],
  demux: [
    widthField(),
    {
      type: 'number',
      key: 'outputs',
      label: 'Outputs',
      labelKey: 'param.outputs',
      options: [2, 4, 8, 16],
      default: 2,
    },
  ],
  decoder: [
    {
      type: 'number',
      key: 'inputs',
      label: 'Select bits',
      labelKey: 'param.selectBits',
      min: 1,
      max: 5,
      step: 1,
      default: 2,
    },
  ],

  // Arithmetic
  adder: [widthField()],
  subtractor: [widthField()],
  comparator: [
    widthField(),
    { type: 'boolean', key: 'signed', label: 'Signed', labelKey: 'param.signed', default: false },
  ],

  // Memory
  register: [widthField()],
  counter: [{ ...widthField(), default: 4 }],
  'shift-register': [
    { ...widthField(), default: 4 },
    {
      type: 'enum',
      key: 'direction',
      label: 'Direction',
      labelKey: 'param.direction',
      options: ['right', 'left'],
      default: 'right',
    },
  ],

  // I/O
  button: [],
  led: [
    {
      type: 'string',
      key: 'color',
      label: 'Color',
      labelKey: 'param.color',
      default: '#ef4444',
      placeholder: '#RRGGBB',
    },
  ],
  '7seg': [],

  // Logisim-parity primitives — Wiring
  power: [widthField()],
  ground: [widthField()],
  probe: [widthField()],
  'pull-resistor': [
    widthField(),
    {
      type: 'enum',
      key: 'direction',
      label: 'Direction',
      labelKey: 'param.direction',
      options: ['pullUp', 'pullDown'],
      default: 'pullUp',
    },
  ],
  por: [],
  'bit-extender': [
    {
      type: 'number',
      key: 'inWidth',
      label: 'Input width',
      labelKey: 'param.inWidth',
      min: 1,
      max: 64,
      step: 1,
      default: 4,
    },
    {
      type: 'number',
      key: 'outWidth',
      label: 'Output width',
      labelKey: 'param.outWidth',
      min: 1,
      max: 64,
      step: 1,
      default: 8,
    },
    {
      type: 'enum',
      key: 'mode',
      label: 'Extend mode',
      labelKey: 'param.extendMode',
      options: ['zero', 'one', 'sign'],
      default: 'zero',
    },
  ],

  // Logisim-parity primitives — Gates
  'odd-parity': [widthField(), naryInputsField()],
  'even-parity': [widthField(), naryInputsField()],
  'controlled-buffer': [widthField()],
  'controlled-inverter': [widthField()],

  // Logisim-parity primitives — Plexers
  'priority-encoder': [
    {
      type: 'number',
      key: 'select',
      label: 'Select bits',
      labelKey: 'param.selectBits',
      min: 1,
      max: 5,
      step: 1,
      default: 2,
    },
  ],
  'bit-selector': [
    { ...widthField(), default: 8, min: 2 },
    {
      type: 'number',
      key: 'group',
      label: 'Group',
      labelKey: 'param.group',
      min: 1,
      max: 32,
      step: 1,
      default: 1,
    },
  ],

  // Logisim-parity primitives — Arithmetic
  multiplier: [{ ...widthField(), default: 8 }],
  divider: [{ ...widthField(), default: 8 }],
  negator: [{ ...widthField(), default: 8 }],
  absolute: [{ ...widthField(), default: 8 }],
  'min-max': [
    { ...widthField(), default: 8 },
    { type: 'boolean', key: 'signed', label: 'Signed', labelKey: 'param.signed', default: false },
  ],
  shifter: [
    { ...widthField(), default: 8 },
    {
      type: 'enum',
      key: 'direction',
      label: 'Direction',
      labelKey: 'param.direction',
      options: ['left', 'right'],
      default: 'left',
    },
    {
      type: 'boolean',
      key: 'arithmetic',
      label: 'Arithmetic',
      labelKey: 'param.arithmetic',
      default: false,
    },
  ],
  'bit-adder': [{ ...widthField(), default: 8 }],
  'bit-finder': [
    { ...widthField(), default: 8 },
    {
      type: 'enum',
      key: 'direction',
      label: 'Direction',
      labelKey: 'param.direction',
      options: ['lowest', 'highest'],
      default: 'lowest',
    },
  ],
  exponentiator: [{ ...widthField(), default: 8 }],
  'square-root': [{ ...widthField(), default: 8 }],
  'd-flipflop': [],
  't-flipflop': [],
  'jk-flipflop': [],
  'sr-flipflop': [],
  ram: [
    { ...widthField(), default: 8 },
    {
      type: 'number',
      key: 'addrBits',
      label: 'Address bits',
      labelKey: 'param.addrBits',
      min: 1,
      max: 16,
      step: 1,
      default: 4,
    },
  ],
  rom: [
    { ...widthField(), default: 8 },
    {
      type: 'number',
      key: 'addrBits',
      label: 'Address bits',
      labelKey: 'param.addrBits',
      min: 1,
      max: 16,
      step: 1,
      default: 4,
    },
    {
      type: 'string',
      key: 'data',
      label: 'Data (space-separated hex)',
      labelKey: 'param.romData',
      default: '',
      placeholder: '00 01 0a ff …',
    },
  ],
};

export function schemaForKind(kind: string): ParamSchema | undefined {
  return PARAM_SCHEMAS[kind];
}

/** Fill in default values for fields missing in the given params. */
export function withDefaults(kind: string, params: ComponentParams): ComponentParams {
  const schema = PARAM_SCHEMAS[kind];
  if (!schema) return params;
  const merged: Record<string, number | string | boolean> = { ...params };
  for (const f of schema) {
    if (merged[f.key] === undefined) {
      merged[f.key] = f.default;
    }
  }
  return merged;
}
