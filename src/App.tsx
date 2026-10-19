import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ChevronDown,
  Command,
  Keyboard,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import {
  Action,
  Binding,
  Category,
  bindingLabel,
  bindingSignature,
  categories,
  initialActions,
  isModifier,
  keyLabel,
} from './data';

const STORAGE_KEY = 'wt-bind-editor-demo-v1';
const rows: { code: string; label?: string; width?: number }[][] = [
  [
    'Escape',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Digit0',
    'Minus',
    'Equal',
    'Backspace',
  ].map((code, i) => ({
    code,
    label: i === 0 ? 'Esc' : i === 13 ? 'Back' : undefined,
    width: i === 13 ? 1.7 : undefined,
  })),
  [
    { code: 'Tab', width: 1.45 },
    ...[
      'KeyQ',
      'KeyW',
      'KeyE',
      'KeyR',
      'KeyT',
      'KeyY',
      'KeyU',
      'KeyI',
      'KeyO',
      'KeyP',
      'BracketLeft',
      'BracketRight',
      'Backslash',
    ].map((code) => ({ code })),
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.8 },
    ...[
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyF',
      'KeyG',
      'KeyH',
      'KeyJ',
      'KeyK',
      'KeyL',
      'Semicolon',
      'Quote',
    ].map((code) => ({ code })),
    { code: 'Enter', width: 1.85 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.2 },
    ...['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'].map(
      (code) => ({ code }),
    ),
    { code: 'ShiftRight', label: 'Shift', width: 2.2 },
    { code: 'ArrowUp', label: '↑' },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.3 },
    { code: 'MetaLeft', label: 'Win', width: 1.1 },
    { code: 'AltLeft', label: 'Alt', width: 1.1 },
    { code: 'Space', label: 'Space', width: 6.4 },
    { code: 'AltRight', label: 'Alt', width: 1.1 },
    { code: 'ContextMenu', label: 'Fn', width: 1.1 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.3 },
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' },
  ],
];
const numpad = [
  'NumLock',
  'NumpadDivide',
  'NumpadMultiply',
  'Numpad7',
  'Numpad8',
  'Numpad9',
  'Numpad4',
  'Numpad5',
  'Numpad6',
  'Numpad1',
  'Numpad2',
  'Numpad3',
  'Numpad0',
  'NumpadDecimal',
  'NumpadEnter',
];

function KeyboardView({
  actions,
  selected,
  onKeyClick,
}: {
  actions: Action[];
  selected: Action | null;
  onKeyClick: (code: string) => void;
}) {
  const used = new Set(actions.flatMap((action) => action.bindings.map((b) => b.code)));
  const selectedKeys = new Set(selected?.bindings.map((b) => b.code) ?? []);
  const renderKey = (key: { code: string; label?: string; width?: number }) => (
    <button
      key={key.code}
      title={keyLabel(key.code)}
      aria-label={`Select ${keyLabel(key.code)}`}
      onClick={() => onKeyClick(key.code)}
      className={`keyboard-key ${selectedKeys.has(key.code) ? 'selected' : used.has(key.code) ? 'used' : ''}`}
      style={{ '--key-width': key.width ?? 1 } as React.CSSProperties}
    >
      {key.label ?? keyLabel(key.code)}
    </button>
  );
  return (
    <div className="keyboard-wrap">
      <div className="keyboard-layout">
        <div className="keyboard-main">
          {rows.map((row, i) => (
            <div className={`keyboard-row row-${i}`} key={i}>
              {row.map(renderKey)}
            </div>
          ))}
        </div>
        <div className="numpad" aria-label="Numeric keypad">
          {numpad.map((code) =>
            renderKey({
              code,
              label:
                code === 'NumLock'
                  ? 'Num'
                  : code === 'NumpadDivide'
                    ? '/'
                    : code === 'NumpadMultiply'
                      ? '*'
                      : code === 'NumpadDecimal'
                        ? '.'
                        : code === 'NumpadEnter'
                          ? 'Enter'
                          : keyLabel(code.replace('Numpad', '')),
            }),
          )}
        </div>
      </div>
    </div>
  );
}

function BindModal({
  action,
  slot,
  onClose,
  onSave,
}: {
  action: Action;
  slot: number;
  onClose: () => void;
  onSave: (binding: Binding) => void;
}) {
  const [captured, setCaptured] = useState<Binding | null>(null);
  const [listening, setListening] = useState(true);
  const captureRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => captureRef.current?.focus(), 20);
    return () => {
      window.clearTimeout(timer);
      restoreFocusRef.current?.focus();
    };
  }, []);
  useEffect(() => {
    if (!listening) return;
    function down(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (isModifier(e.code)) return;
      e.preventDefault();
      e.stopPropagation();
      setCaptured({
        code: e.code,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      });
      setListening(false);
    }
    window.addEventListener('keydown', down, true);
    return () => window.removeEventListener('keydown', down, true);
  }, [listening, onClose]);
  function captureMouse(e: React.MouseEvent) {
    if (!listening) return;
    e.preventDefault();
    e.stopPropagation();
    setCaptured({
      code: `Mouse${e.button}`,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    });
    setListening(false);
  }
  function trapFocus(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const nodes = [
      closeRef.current,
      captureRef.current,
      ...Array.from(
        document.querySelectorAll<HTMLButtonElement>('.modal-actions button:not(:disabled)'),
      ),
    ].filter((node): node is HTMLButtonElement => !!node);
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={trapFocus}
      >
        <div className="modal-head">
          <div className="modal-icon">
            <Keyboard size={22} />
          </div>
          <button ref={closeRef} className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <h2 id="modal-title">Assign a binding</h2>
        <p className="muted">
          {action.name} · {slot >= action.bindings.length ? 'New binding' : `Binding ${slot + 1}`}
        </p>
        <button
          ref={captureRef}
          className={`capture-target ${listening ? 'listening' : ''}`}
          onMouseDown={captureMouse}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span className="capture-symbol">
            <Command size={26} />
          </span>
          <strong>{captured ? bindingLabel(captured) : 'Press any key combination'}</strong>
          <small>
            {listening
              ? 'Click here for mouse buttons · Esc to cancel'
              : 'Captured! Select save or record again.'}
          </small>
        </button>
        <p className="capture-note">
          Some operating system and browser shortcuts cannot be captured.
        </p>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn secondary"
            onClick={() => {
              setCaptured(null);
              setListening(true);
              captureRef.current?.focus();
            }}
          >
            Record again
          </button>
          <button
            className="btn primary"
            disabled={!captured}
            onClick={() => {
              if (captured) onSave(captured);
            }}
          >
            <Check size={16} /> Save binding
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [actions, setActions] = useState<Action[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === initialActions.length)
          return parsed as Action[];
      }
    } catch {
      /* ignore invalid storage */
    }
    return initialActions;
  });
  const [category, setCategory] = useState<Category>('Ground');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('tank-range');
  const [modal, setModal] = useState<{ id: string; slot: number } | null>(null);
  const [onlyConflicts, setOnlyConflicts] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [keyFilter, setKeyFilter] = useState<string | null>(null);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  }, [actions]);
  const conflictSignatures = useMemo(() => {
    const counts = new Map<string, number>();
    for (const action of actions)
      for (const sig of new Set(action.bindings.map(bindingSignature))) {
        const scoped = `${action.category}:${sig}`;
        counts.set(scoped, (counts.get(scoped) ?? 0) + 1);
      }
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([sig]) => sig));
  }, [actions]);
  const hasConflict = (action: Action) =>
    action.bindings.some((binding) =>
      conflictSignatures.has(`${action.category}:${bindingSignature(binding)}`),
    );
  const categoryActions = actions.filter((action) => action.category === category);
  const filtered = categoryActions.filter(
    (action) =>
      (!search ||
        `${action.name} ${action.description} ${action.group}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!onlyConflicts || hasConflict(action)) &&
      (!keyFilter || action.bindings.some((b) => b.code === keyFilter)),
  );
  const selected = actions.find((a) => a.id === selectedId) ?? null;
  const currentModalAction = modal ? actions.find((a) => a.id === modal.id) : undefined;
  const assignedCount = categoryActions.filter((a) => a.bindings.length).length;
  const unassignedCount = categoryActions.length - assignedCount;
  function selectKey(code: string) {
    setKeyFilter((prev) => (prev === code ? null : code));
    const action = categoryActions.find((a) => a.bindings.some((b) => b.code === code));
    if (action) setSelectedId(action.id);
  }
  function changeBinding(id: string, slot: number, binding: Binding) {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id
          ? {
              ...action,
              bindings:
                slot < action.bindings.length
                  ? action.bindings.map((b, i) => (i === slot ? binding : b))
                  : [...action.bindings, binding],
            }
          : action,
      ),
    );
    setModal(null);
  }
  function removeBinding(id: string, slot: number) {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id
          ? { ...action, bindings: action.bindings.filter((_, i) => i !== slot) }
          : action,
      ),
    );
  }
  function downloadDemo() {
    const blob = new Blob(
      [
        JSON.stringify(
          { notice: 'Demo-only JSON. Not a War Thunder .blk file.', actions },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wt-bind-editor-demo.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="WT Key Binder home">
          <span className="brand-mark">WT</span>
          <span>
            <strong>KEY BINDER</strong>
            <small>WAR THUNDER CONTROL EDITOR</small>
          </span>
        </a>
        <div className="preset">
          <small>ACTIVE DEMO PRESET</small>
          <strong>Standard · {category === 'Ground' ? 'Ground Forces' : category}</strong>
        </div>
        <div className="top-actions">
          <button className="btn export" onClick={downloadDemo}>
            <ArrowDownToLine size={17} /> Download demo JSON
          </button>
          <button className="btn upload" disabled title="Configuration import is not connected yet">
            <Upload size={16} /> Import .blk
          </button>
          <span className="avatar" aria-label="User profile">
            Y
          </span>
        </div>
      </header>
      <aside className="action-sidebar">
        <div className="sidebar-head">
          <div>
            <h2>Actions</h2>
            <p>
              {category === 'Ground' ? 'Ground vehicle' : category} · {categoryActions.length}{' '}
              actions
            </p>
          </div>
        </div>
        <label className="search-wrap">
          <Search size={17} />
          <input
            placeholder="Search actions or keys..."
            aria-label="Search actions or keys"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="clear-search"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <div className="sidebar-filters">
          <button
            className={!onlyConflicts ? 'active' : ''}
            onClick={() => setOnlyConflicts(false)}
          >
            All actions <span>{categoryActions.length}</span>
          </button>
          <button className={onlyConflicts ? 'active' : ''} onClick={() => setOnlyConflicts(true)}>
            <AlertTriangle size={13} /> Conflicts{' '}
            <span>{categoryActions.filter(hasConflict).length}</span>
          </button>
        </div>
        <div className="action-column-label">
          <span>ACTION</span>
          <span>KEY</span>
        </div>
        <div className="action-list">
          {filtered.length === 0 ? (
            <div className="empty">No actions match these filters.</div>
          ) : (
            filtered.map((action) => (
              <button
                className={`action-row ${selectedId === action.id ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedId(action.id);
                  setKeyFilter(null);
                }}
                key={action.id}
              >
                <span className="action-info">
                  <strong>
                    {action.name}
                    {hasConflict(action) && <AlertTriangle size={13} className="danger-icon" />}
                  </strong>
                  <small>{action.group}</small>
                </span>
                <span className="binding-preview">
                  {action.bindings[0] ? <kbd>{bindingLabel(action.bindings[0])}</kbd> : <em>—</em>}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="sidebar-foot">
          <p>Select an action or a key to inspect its assignments.</p>
          <span>
            {assignedCount} assigned · {unassignedCount} unassigned
          </span>
          <button className="reset-link" onClick={() => setShowReset(true)}>
            <RotateCcw size={14} /> Reset demo bindings
          </button>
        </div>
      </aside>
      <main className="main-content" id="top">
        <nav className="category-tabs" aria-label="Control category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              className={category === c ? 'active' : ''}
              onClick={() => {
                setCategory(c);
                setKeyFilter(null);
                setSelectedId(actions.find((a) => a.category === c)?.id ?? '');
              }}
            >
              {c === 'Ground' ? 'Ground vehicles' : c}
            </button>
          ))}
        </nav>
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              EDITOR <span>/</span>{' '}
              {category === 'Ground' ? 'GROUND VEHICLE' : category.toUpperCase()}
            </p>
            <h1>{category === 'Ground' ? 'Ground vehicle' : category} controls</h1>
            <p>Select a key to see its assigned action and edit the binding.</p>
          </div>
          <div className="save-status">
            <i /> Saved locally
          </div>
        </div>
        <section className="surface keyboard-card">
          <div className="card-heading">
            <div>
              <h2>Keyboard</h2>
              <p>Assigned actions appear in the sidebar when you select a key.</p>
            </div>
            <button className="btn filter" onClick={() => setOnlyConflicts((v) => !v)}>
              <SlidersHorizontal size={15} />
              {onlyConflicts ? 'Conflicts' : 'All actions'}
              <ChevronDown size={14} />
            </button>
          </div>
          <KeyboardView
            actions={categoryActions}
            selected={selected?.category === category ? selected : null}
            onKeyClick={selectKey}
          />
          <div className="legend">
            <span>
              <i className="legend-selected" /> Selected
            </span>
            <span>
              <i className="legend-assigned" /> Assigned
            </span>
            <span>
              <i className="legend-empty" /> Unassigned
            </span>
            <span className="key-count">{assignedCount} actions assigned</span>
            {keyFilter && (
              <button onClick={() => setKeyFilter(null)}>
                Clear key selection <X size={13} />
              </button>
            )}
          </div>
        </section>
        <section className="surface detail-card">
          <div className="detail-topline">
            <span>SELECTED ACTION · BINDING DETAILS</span>
            <span
              className={`conflict-status ${selected && hasConflict(selected) ? 'has-conflict' : ''}`}
            >
              {selected && hasConflict(selected) ? (
                <>
                  <AlertTriangle size={14} /> Conflict found
                </>
              ) : (
                <>
                  <i /> No conflicts found
                </>
              )}
            </span>
          </div>
          {selected ? (
            <>
              <div className="selected-action">
                <div className="selected-key">
                  {selected.bindings[0]
                    ? selected.bindings[0].code.startsWith('Mouse')
                      ? 'M' + (Number(selected.bindings[0].code.slice(5)) + 1)
                      : keyLabel(selected.bindings[0].code)
                    : '—'}
                </div>
                <div className="selected-copy">
                  <h2>{selected.name}</h2>
                  <p>
                    {selected.group} ·{' '}
                    {selected.category === 'Ground' ? 'Ground vehicle' : selected.category}
                  </p>
                </div>
              </div>
              <div className="binding-editor">
                <div className="binding-values">
                  {selected.bindings.length ? (
                    selected.bindings.map((binding, i) => (
                      <div className="binding-value" key={i}>
                        <span>
                          <small>ASSIGNED BINDING {i + 1}</small>
                          <strong>{bindingLabel(binding)}</strong>
                        </span>
                        <span className="binding-controls">
                          <button
                            aria-label={`Change binding ${i + 1}`}
                            onClick={() => setModal({ id: selected.id, slot: i })}
                          >
                            <Keyboard size={15} />
                          </button>
                          <button
                            aria-label={`Remove binding ${i + 1}`}
                            onClick={() => removeBinding(selected.id, i)}
                          >
                            <X size={15} />
                          </button>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="binding-value unbound-value">
                      <span>
                        <small>ASSIGNED ACTION</small>
                        <strong>No key assigned</strong>
                      </span>
                    </div>
                  )}
                </div>
                <button
                  className="btn primary change-binding"
                  onClick={() => setModal({ id: selected.id, slot: 0 })}
                >
                  {selected.bindings.length ? 'Change binding' : 'Assign a binding'}
                </button>
              </div>
              <button
                className="add-binding"
                onClick={() => setModal({ id: selected.id, slot: selected.bindings.length })}
              >
                <Plus size={15} /> Add another binding
              </button>
            </>
          ) : (
            <div className="empty detail-empty">
              Choose an action from the sidebar or select an assigned key.
            </div>
          )}
        </section>
        <footer className="footnote">
          Demo prototype · Browser key capture may be limited by system shortcuts · No real .blk
          writing yet
        </footer>
      </main>
      {modal && currentModalAction && (
        <BindModal
          key={`${modal.id}-${modal.slot}`}
          action={currentModalAction}
          slot={modal.slot}
          onClose={() => setModal(null)}
          onSave={(binding) => changeBinding(modal.id, modal.slot, binding)}
        />
      )}
      {showReset && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowReset(false);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <div className="modal-head">
              <div className="modal-icon">
                <RotateCcw size={22} />
              </div>
              <button
                className="icon-button"
                onClick={() => setShowReset(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="reset-title">Reset all demo bindings?</h2>
            <p className="muted">
              This restores the bundled sample configuration and discards your locally saved edits.
            </p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowReset(false)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setActions(initialActions);
                  setShowReset(false);
                  setKeyFilter(null);
                }}
              >
                Reset demo
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
