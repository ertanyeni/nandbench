/**
 * Glossary registry — terms beginners (and forgetful experts) want to look
 * up while building circuits. The strings themselves live in i18n; this
 * module owns just the ordering.
 */

export interface GlossaryTerm {
  readonly id: string;
  readonly nameKey: string;
  readonly descKey: string;
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  { id: 'bit', nameKey: 'glossary.term.bit.name', descKey: 'glossary.term.bit.desc' },
  { id: 'bus', nameKey: 'glossary.term.bus.name', descKey: 'glossary.term.bus.desc' },
  { id: 'gate', nameKey: 'glossary.term.gate.name', descKey: 'glossary.term.gate.desc' },
  { id: 'driver', nameKey: 'glossary.term.driver.name', descKey: 'glossary.term.driver.desc' },
  { id: 'sink', nameKey: 'glossary.term.sink.name', descKey: 'glossary.term.sink.desc' },
  { id: 'net', nameKey: 'glossary.term.net.name', descKey: 'glossary.term.net.desc' },
  { id: 'x', nameKey: 'glossary.term.x.name', descKey: 'glossary.term.x.desc' },
  { id: 'z', nameKey: 'glossary.term.z.name', descKey: 'glossary.term.z.desc' },
  { id: 'fanout', nameKey: 'glossary.term.fanout.name', descKey: 'glossary.term.fanout.desc' },
  { id: 'multiDriver', nameKey: 'glossary.term.multiDriver.name', descKey: 'glossary.term.multiDriver.desc' },
  { id: 'oscillation', nameKey: 'glossary.term.oscillation.name', descKey: 'glossary.term.oscillation.desc' },
  { id: 'edge', nameKey: 'glossary.term.edge.name', descKey: 'glossary.term.edge.desc' },
  { id: 'register', nameKey: 'glossary.term.register.name', descKey: 'glossary.term.register.desc' },
  { id: 'mux', nameKey: 'glossary.term.mux.name', descKey: 'glossary.term.mux.desc' },
  { id: 'splitter', nameKey: 'glossary.term.splitter.name', descKey: 'glossary.term.splitter.desc' },
  { id: 'tunnel', nameKey: 'glossary.term.tunnel.name', descKey: 'glossary.term.tunnel.desc' },
  { id: 'composite', nameKey: 'glossary.term.composite.name', descKey: 'glossary.term.composite.desc' },
  { id: 'netlist', nameKey: 'glossary.term.netlist.name', descKey: 'glossary.term.netlist.desc' },
  { id: 'snapshot', nameKey: 'glossary.term.snapshot.name', descKey: 'glossary.term.snapshot.desc' },
  { id: 'diagnostic', nameKey: 'glossary.term.diagnostic.name', descKey: 'glossary.term.diagnostic.desc' },
  { id: 'truthTable', nameKey: 'glossary.term.truthTable.name', descKey: 'glossary.term.truthTable.desc' },
];
