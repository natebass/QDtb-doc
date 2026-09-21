import { useMemo, useState } from "react";

import {
  MAPPINGS,
  MODE_LABELS,
  OFF_KEYBOARD,
  PREFIXES,
  expandModes,
  type Mapping,
  type Mode,
} from "@site/src/data/keymaps";
import {
  BINDABLE,
  CLUSTER,
  NO_MODIFIERS,
  ROWS,
  parseToken,
  sameToken,
  toNotation,
  tokenize,
  type KeyDef,
  type ModifierName,
  type Modifiers,
} from "./keyboard";
import styles from "./styles.module.css";

/**
 * A keyboard that answers one question: in this mode, with these modifiers
 * held, after this prefix — what is this key doing, and is it free?
 */

type Status = "free" | "mapped" | "prefix" | "conflict";

interface KeyState {
  status: Status;
  /** Mappings that end on this key. */
  exact: Mapping[];
  /** Mappings that continue past it. */
  continues: Mapping[];
}

/** Pre-tokenised, because every state change re-reads every mapping. */
const TOKENISED = MAPPINGS.map((mapping) => ({
  mapping,
  tokens: tokenize(mapping.lhs),
}));

function modifiersMatch(
  a: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean },
  b: Modifiers,
): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.meta === b.meta
  );
}

/**
 * Work out what every key is doing in the current state, in one pass over the
 * mappings rather than one pass per key.
 */
function buildStates(
  mode: Mode,
  mods: Modifiers,
  prefix: string[],
): Map<string, KeyState> {
  const states = new Map<string, KeyState>();

  for (const { mapping, tokens } of TOKENISED) {
    if (!expandModes(mapping.modes).has(mode)) continue;
    if (tokens.length <= prefix.length) continue;
    if (!prefix.every((token, index) => sameToken(token, tokens[index])))
      continue;

    const chord = parseToken(tokens[prefix.length]);
    if (chord === null || chord.key === null) continue;
    if (!modifiersMatch(chord, mods)) continue;

    let state = states.get(chord.key);
    if (state === undefined) {
      state = { status: "free", exact: [], continues: [] };
      states.set(chord.key, state);
    }
    if (tokens.length === prefix.length + 1) state.exact.push(mapping);
    else state.continues.push(mapping);
  }

  for (const state of states.values()) {
    if (state.exact.length > 0 && state.continues.length > 0)
      state.status = "conflict";
    else if (state.exact.length > 0) state.status = "mapped";
    else state.status = "prefix";
  }

  return states;
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function Key({
  def,
  state,
  mods,
  selected,
  onSelect,
  onToggleModifier,
}: {
  def: KeyDef;
  state: KeyState | undefined;
  mods: Modifiers;
  selected: boolean;
  onSelect: (key: KeyDef) => void;
  onToggleModifier: (name: ModifierName) => void;
}) {
  const width = def.width ?? 1;
  const style = { "--key-units": width } as React.CSSProperties;

  if (def.modifier) {
    const held = mods[def.modifier];
    return (
      <button
        type="button"
        className={styles.key}
        data-role="modifier"
        data-held={held || undefined}
        aria-pressed={held}
        style={style}
        onClick={() => onToggleModifier(def.modifier!)}
      >
        <span className={styles.keyLabel}>{def.label}</span>
      </button>
    );
  }

  if (def.inert) {
    return (
      <span className={styles.key} data-role="inert" style={style}>
        <span className={styles.keyLabel}>{def.label}</span>
      </span>
    );
  }

  const status = state?.status ?? "free";
  const legend =
    mods.shift && def.shifted !== undefined ? def.shifted : def.label;
  const hint = state?.exact[0]?.desc ?? state?.exact[0]?.rhs;

  return (
    <button
      type="button"
      className={styles.key}
      data-status={status}
      data-selected={selected || undefined}
      style={style}
      onClick={() => onSelect(def)}
      title={`${legend}: ${status}`}
    >
      <span className={styles.keyLabel}>{legend}</span>
      {status !== "free" && (
        <span className={styles.keyHint}>
          {status === "prefix" ? `+${state!.continues.length}` : hint}
        </span>
      )}
    </button>
  );
}

function MappingRow({ mapping }: { mapping: Mapping }) {
  return (
    <li className={styles.mapping}>
      <code className={styles.mappingLhs}>{mapping.lhs}</code>
      <div className={styles.mappingBody}>
        <div className={styles.mappingRhs}>{mapping.rhs || "— disabled —"}</div>
        {mapping.desc && <div className={styles.mappingDesc}>{mapping.desc}</div>}
        {mapping.note && <div className={styles.mappingNote}>{mapping.note}</div>}
        <div className={styles.mappingMeta}>
          <span>{mapping.modes.join(", ")}</span>
          <span>{mapping.source}</span>
        </div>
      </div>
    </li>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function KeyboardMap() {
  const [mode, setMode] = useState<Mode>("n");
  const [mods, setMods] = useState<Modifiers>(NO_MODIFIERS);
  const [prefixIndex, setPrefixIndex] = useState(0);
  const [selected, setSelected] = useState<KeyDef | null>(null);

  const prefix = PREFIXES[prefixIndex].tokens;
  const states = useMemo(
    () => buildStates(mode, mods, prefix),
    [mode, mods, prefix],
  );

  const freeCount = BINDABLE.filter(
    (key) => (states.get(key.id)?.status ?? "free") === "free",
  ).length;

  const selectedState = selected ? states.get(selected.id) : undefined;
  const notation = selected
    ? [...prefix, toNotation(selected, mods)]
        .map((token) => (token === "<leader>" ? "<leader>" : token))
        .join("")
    : "";

  const offKeyboard = OFF_KEYBOARD.filter((mapping) =>
    expandModes(mapping.modes).has(mode),
  );

  const toggleModifier = (name: ModifierName) =>
    setMods((current) => ({ ...current, [name]: !current[name] }));

  return (
    <section className={styles.root}>
      <div className={styles.controls}>
        <fieldset className={styles.control}>
          <legend>Mode</legend>
          <div className={styles.segmented}>
            {MODE_LABELS.map((entry) => (
              <button
                key={entry.mode}
                type="button"
                aria-pressed={mode === entry.mode}
                onClick={() => setMode(entry.mode)}
              >
                {entry.label}
                <code>{entry.hint}</code>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.control}>
          <legend>Modifiers</legend>
          <div className={styles.segmented}>
            {(
              [
                ["ctrl", "Ctrl"],
                ["shift", "Shift"],
                ["alt", "Alt"],
                ["meta", "Super"],
              ] as [ModifierName, string][]
            ).map(([name, label]) => (
              <button
                key={name}
                type="button"
                aria-pressed={mods[name]}
                onClick={() => toggleModifier(name)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.control}>
          <legend>After</legend>
          <div className={styles.chips}>
            {PREFIXES.map((entry, index) => (
              <button
                key={entry.label}
                type="button"
                aria-pressed={prefixIndex === index}
                onClick={() => setPrefixIndex(index)}
                title={entry.hint}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.legend}>
        <span data-status="mapped">mapped</span>
        <span data-status="prefix">starts a longer mapping</span>
        <span data-status="conflict">both — resolved on the timeout</span>
        <span data-status="free">free</span>
        <span className={styles.count}>
          {freeCount} of {BINDABLE.length} free
        </span>
      </div>

      <div className={styles.keyboard}>
        <div className={styles.main}>
          {ROWS.map((row, index) => (
            <div key={index} className={styles.row}>
              {row.map((def) => (
                <Key
                  key={def.id}
                  def={def}
                  state={states.get(def.id)}
                  mods={mods}
                  selected={selected?.id === def.id}
                  onSelect={setSelected}
                  onToggleModifier={toggleModifier}
                />
              ))}
            </div>
          ))}
        </div>
        <div className={styles.cluster}>
          {CLUSTER.map((row, index) => (
            <div key={index} className={styles.row}>
              {row.map((def) => (
                <Key
                  key={def.id}
                  def={def}
                  state={states.get(def.id)}
                  mods={mods}
                  selected={selected?.id === def.id}
                  onSelect={setSelected}
                  onToggleModifier={toggleModifier}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.detail} aria-live="polite">
        {selected === null ? (
          <p className={styles.empty}>
            Pick a key to see what it is bound to in{" "}
            <strong>{MODE_LABELS.find((m) => m.mode === mode)?.label}</strong>{" "}
            mode.
          </p>
        ) : (
          <>
            <h3 className={styles.detailTitle}>
              <code>{notation}</code>
            </h3>
            {selectedState === undefined ? (
              <p className={styles.empty}>
                Nothing in this configuration maps it. Vim&apos;s own meaning
                for the key still applies.
              </p>
            ) : (
              <>
                {selectedState.exact.length > 0 && (
                  <ul className={styles.mappings}>
                    {selectedState.exact.map((mapping, index) => (
                      <MappingRow key={index} mapping={mapping} />
                    ))}
                  </ul>
                )}
                {selectedState.continues.length > 0 && (
                  <>
                    <h4 className={styles.detailSub}>
                      Continues into {selectedState.continues.length} longer
                      {selectedState.continues.length === 1
                        ? " mapping"
                        : " mappings"}
                    </h4>
                    <ul className={styles.mappings}>
                      {selectedState.continues.map((mapping, index) => (
                        <MappingRow key={index} mapping={mapping} />
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {offKeyboard.length > 0 && (
        <div className={styles.detail}>
          <h4 className={styles.detailSub}>Not on a keyboard</h4>
          <ul className={styles.mappings}>
            {offKeyboard.map((mapping, index) => (
              <MappingRow key={index} mapping={mapping} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
