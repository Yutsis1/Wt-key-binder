import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Command, FileCode2, Keyboard, MousePointer2, Plus, RotateCcw, Search, Settings2, ShieldAlert, SlidersHorizontal, X } from 'lucide-react';
import { Action, Binding, Category, bindingLabel, bindingSignature, categories, initialActions, isModifier, keyLabel } from './data';

const STORAGE_KEY = 'wt-bind-editor-demo-v1';
const rows: {code:string; w?:number}[][] = [
  ['Escape','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'].map(code=>({code})),
  ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal'].map(code=>({code})).concat([{code:'Backspace',w:2}]),
  [{code:'Tab',w:1.5},...['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash'].map(code=>({code}))],
  [{code:'CapsLock',w:1.8},...['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote'].map(code=>({code})),{code:'Enter',w:2.2}],
  [{code:'ShiftLeft',w:2.3},...['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash'].map(code=>({code})),{code:'ShiftRight',w:2.7}],
  [{code:'ControlLeft',w:1.5},{code:'MetaLeft',w:1.3},{code:'AltLeft',w:1.3},{code:'Space',w:6},{code:'AltRight',w:1.3},{code:'ControlRight',w:1.5},{code:'ArrowLeft'},{code:'ArrowDown'},{code:'ArrowRight'}]
];

function KeyboardView({ actions, selected, onKeyClick }: { actions: Action[]; selected: Action | null; onKeyClick:(code:string)=>void }) {
  const used = new Set(actions.flatMap(action=>action.bindings.map(b=>b.code)));
  const selectedKeys = new Set(selected?.bindings.map(b=>b.code) ?? []);
  return <div className="keyboard-wrap"><div className="keyboard-inner">{rows.map((row,i)=><div className="keyboard-row" key={i}>
    {row.map(key=><button key={key.code} title={key.code} onClick={()=>onKeyClick(key.code)} style={{flex:key.w??1}} className={`keyboard-key ${selectedKeys.has(key.code)?'selected':used.has(key.code)?'used':''}`}>
      {key.code==='CapsLock'?'Caps':key.code==='Backspace'?'Backspace':key.code==='MetaLeft'?'Win':keyLabel(key.code)}
    </button>)}
  </div>)}</div></div>;
}

function BindModal({ action, slot, onClose, onSave }: { action:Action; slot:number; onClose:()=>void; onSave:(binding:Binding)=>void }) {
  const [captured,setCaptured] = useState<Binding|null>(null);
  const [listening,setListening] = useState(true);
  const captureRef = useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const timer = window.setTimeout(()=>captureRef.current?.focus(),20);
    return ()=>window.clearTimeout(timer);
  },[]);
  useEffect(()=>{
    if (!listening) return;
    function down(e:KeyboardEvent) {
      if (e.code==='Escape') {e.preventDefault();onClose();return;}
      if (isModifier(e.code)) return;
      e.preventDefault();e.stopPropagation();
      setCaptured({code:e.code,ctrl:e.ctrlKey,alt:e.altKey,shift:e.shiftKey,meta:e.metaKey});
      setListening(false);
    }
    window.addEventListener('keydown',down,true);
    return ()=>window.removeEventListener('keydown',down,true);
  },[listening,onClose]);
  const [conflictText,setConflictText] = useState('');
  function captureMouse(e:React.MouseEvent) { if (!listening) return; e.preventDefault(); e.stopPropagation(); const code=`Mouse${e.button}`; setCaptured({code,ctrl:e.ctrlKey,alt:e.altKey,shift:e.shiftKey,meta:e.metaKey});setListening(false); }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget) onClose();}}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-head"><div className="modal-icon"><Keyboard size={22}/></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={19}/></button></div>
      <h2 id="modal-title">Assign a binding</h2><p className="muted">{action.name} · {slot >= action.bindings.length?'New binding':`Binding ${slot+1}`}</p>
      <button ref={captureRef} className={`capture-target ${listening?'listening':''}`} onKeyDown={e=>{if(e.code==='Tab') e.stopPropagation();}} onMouseDown={captureMouse} onContextMenu={e=>e.preventDefault()}>
        <span className="capture-symbol"><Command size={26}/></span>
        <strong>{captured?bindingLabel(captured):'Press any key combination'}</strong>
        <small>{listening?'Click here for mouse buttons · Esc to cancel':'Captured! Select save or record again.'}</small>
      </button>
      {conflictText && <div className="inline-warning"><ShieldAlert size={16}/>{conflictText}</div>}
      <div className="modal-actions"><button className="btn secondary" onClick={onClose}>Cancel</button><button className="btn secondary" onClick={()=>{setCaptured(null);setConflictText('');setListening(true);captureRef.current?.focus();}}>Record again</button><button className="btn primary" disabled={!captured} onClick={()=>{if(captured){onSave(captured);setConflictText('');}}}><Check size={16}/> Save binding</button></div>
    </section>
  </div>;
}

export default function App(){
  const [actions,setActions]=useState<Action[]>(()=>{
    try {const saved=localStorage.getItem(STORAGE_KEY); if(saved){const parsed:unknown=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.length===initialActions.length) return parsed as Action[];}}catch{/* ignore invalid storage */}
    return initialActions;
  });
  const [category,setCategory]=useState<Category>('Aircraft');
  const [search,setSearch]=useState('');
  const [selectedId,setSelectedId]=useState<string>('fire-primary');
  const [modal,setModal]=useState<{id:string;slot:number}|null>(null);
  const [onlyConflicts,setOnlyConflicts]=useState(false);
  const [showReset,setShowReset]=useState(false);
  const [keyFilter,setKeyFilter]=useState<string|null>(null);
  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(actions));},[actions]);
  const selected=actions.find(a=>a.id===selectedId)??null;
  const conflictSignatures=useMemo(()=>{
    const counts = new Map<string,number>();
    for(const action of actions){ for(const sig of new Set(action.bindings.map(bindingSignature))) { const scoped=`${action.category}:${sig}`;counts.set(scoped,(counts.get(scoped)??0)+1); }}
    return new Set([...counts.entries()].filter(([,count])=>count>1).map(([sig])=>sig));
  },[actions]);
  const hasConflict=(action:Action)=>action.bindings.some(binding=>conflictSignatures.has(`${action.category}:${bindingSignature(binding)}`));
  const filtered=actions.filter(action=>action.category===category&&(!search||`${action.name} ${action.description} ${action.group}`.toLowerCase().includes(search.toLowerCase()))&&(!onlyConflicts||hasConflict(action))&&(!keyFilter||action.bindings.some(b=>b.code===keyFilter)));
  const groups=[...new Set(filtered.map(action=>action.group))];
  const counts=actions.filter(a=>a.category===category).length;
  const conflictCount=actions.filter(a=>a.category===category&&hasConflict(a)).length;
  const currentModalAction=modal?actions.find(a=>a.id===modal.id):undefined;
  function changeBinding(id:string,slot:number,binding:Binding) {
    setActions(prev=>prev.map(action=>action.id===id?{...action,bindings:slot<action.bindings.length?action.bindings.map((b,i)=>i===slot?binding:b):[...action.bindings,binding]}:action));
    setModal(null);
  }
  function removeBinding(id:string,slot:number){setActions(prev=>prev.map(action=>action.id===id?{...action,bindings:action.bindings.filter((_,i)=>i!==slot)}:action));}
  function downloadDemo(){const blob=new Blob([JSON.stringify({notice:'Demo-only JSON. Not a War Thunder .blk file.',actions},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='wt-bind-editor-demo.json';a.click();URL.revokeObjectURL(url);}
  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Settings2 size={23}/></div><div><strong>WT BIND</strong><span>CONTROL EDITOR</span></div></div>
      <div className="sidebar-label">WORKSPACE</div><nav className="nav">
      {categories.map(c=><button key={c} className={`nav-item ${category===c?'active':''}`} onClick={()=>{setCategory(c);setKeyFilter(null);setSelectedId(actions.find(a=>a.category===c)?.id??'');}}><span className="nav-dot"/>{c}<span className="nav-count">{actions.filter(a=>a.category===c).length}</span></button>)}
      </nav><div className="sidebar-bottom"><div className="demo-status"><span className="status-dot"/> DEMO WORKSPACE</div><p>Sample keybindings only. BLK import/export is not connected yet.</p><button className="sidebar-link" onClick={()=>setShowReset(true)}><RotateCcw size={15}/> Reset demo bindings</button></div>
    </aside>
    <main className="main"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Control bindings <span>/</span> <b>{category}</b></div><div className="top-actions"><span className="local-pill"><span className="status-dot"/> Saved locally</span><button className="btn export" onClick={downloadDemo}><ArrowDownToLine size={16}/> Export demo JSON</button></div></header>
    <div className="content"><div className="heading"><div><div className="eyebrow"><span className="eyebrow-line"/> INPUT CONFIGURATION</div><h1>{category} controls</h1><p>Customize your controls, discover conflicts, and visualize key assignments.</p></div><div className="header-stat"><span className="stat-num">{counts.toString().padStart(2,'0')}</span><span>ACTIONS<br/>AVAILABLE</span></div></div>
    <div className="toolbar"><div className="search-wrap"><Search size={18}/><input placeholder="Search actions, categories, or controls..." aria-label="Search actions" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>/</kbd></div><button onClick={()=>setOnlyConflicts(v=>!v)} className={`btn filter ${onlyConflicts?'filter-active':''}`}><SlidersHorizontal size={16}/> {onlyConflicts?'Showing conflicts':'All actions'} <ChevronDown size={15}/></button></div>
    <div className="columns"><section className="panel action-panel"><div className="panel-heading"><div><h2>Control mapping</h2><p>{filtered.length} actions · {conflictCount} with conflicts</p></div><span className="panel-badge">{category.toUpperCase()}</span></div>
    {keyFilter&&<div className="filter-chip">Key: {keyLabel(keyFilter)} <button onClick={()=>setKeyFilter(null)} aria-label="Clear key filter"><X size={14}/></button></div>}
    <div className="action-list">{groups.length===0?<div className="empty">No actions match your filters.</div>:groups.map(group=><div key={group}><div className="group-heading">{group} <span>{filtered.filter(a=>a.group===group).length}</span></div>{filtered.filter(a=>a.group===group).map(action=><button className={`action-row ${selectedId===action.id?'is-selected':''}`} onClick={()=>setSelectedId(action.id)} key={action.id}><div className="action-info"><div className="action-name">{action.name}{hasConflict(action)&&<AlertTriangle size={14} className="danger-icon"/>}</div><span>{action.description}</span></div><div className="binding-preview">{action.bindings.length? action.bindings.map((binding,i)=><span className="mini-key" key={i}>{bindingLabel(binding)}</span>):<span className="unbound">Unbound</span>}</div></button>)}</div>)}</div></section>
    <div className="right-col"><section className="panel detail-panel"><div className="panel-heading"><div><h2>Binding inspector</h2><p>Edit the selected control</p></div><MousePointer2 size={18} className="quiet-icon"/></div>
    {selected?<div className="inspector-body"><div className="detail-meta"><span className="detail-category">{selected.category} / {selected.group}</span><h3>{selected.name}</h3><p>{selected.description}</p></div><div className="section-label">ASSIGNED KEYS <span>{selected.bindings.length} / ∞</span></div><div className="assigned-list">{selected.bindings.map((binding,i)=><div className="assigned" key={i}><div><span className="binding-type">BINDING {i+1}</span><strong>{bindingLabel(binding)}</strong></div><div className="assigned-buttons"><button onClick={()=>setModal({id:selected.id,slot:i})} title="Edit binding"><Settings2 size={16}/></button><button onClick={()=>removeBinding(selected.id,i)} aria-label="Remove binding" title="Remove binding"><X size={16}/></button></div></div>)}</div><button className="add-binding" onClick={()=>setModal({id:selected.id,slot:selected.bindings.length})}><Plus size={17}/> Add key binding</button>{hasConflict(selected)&&<div className="conflict-box"><AlertTriangle size={17}/><span>One or more bindings are also assigned to another {selected.category.toLowerCase()} action.</span></div>}</div>:<div className="empty">Select an action to edit.</div>}
    </section><section className="panel keyboard-panel"><div className="panel-heading"><div><h2>Keyboard overview</h2><p>Click a key to filter assigned actions</p></div><Keyboard size={18} className="quiet-icon"/></div><KeyboardView actions={actions.filter(a=>a.category===category)} selected={selected?.category===category?selected:null} onKeyClick={code=>setKeyFilter(prev=>prev===code?null:code)}/><div className="legend"><span><i className="legend-dot selected-dot"/> Selected action</span><span><i className="legend-dot used-dot"/> In use</span><span><i className="legend-dot"/> Unassigned</span></div></section></div></div>
    <footer className="footnote"><FileCode2 size={15}/> Frontend prototype · Browser key capture may be limited by system shortcuts · No real .blk writing yet</footer></div></main>
    {modal&&currentModalAction&&<BindModal key={`${modal.id}-${modal.slot}`} action={currentModalAction} slot={modal.slot} onClose={()=>setModal(null)} onSave={binding=>changeBinding(modal.id,modal.slot,binding)}/>}
    {showReset&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowReset(false);}}><section className="modal confirm-modal" role="dialog" aria-modal="true"><div className="modal-head"><div className="modal-icon"><RotateCcw size={22}/></div><button className="icon-button" onClick={()=>setShowReset(false)} aria-label="Close"><X size={18}/></button></div><h2>Reset all demo bindings?</h2><p className="muted">This will restore the bundled sample configuration and discard your locally saved edits.</p><div className="modal-actions"><button className="btn secondary" onClick={()=>setShowReset(false)}>Cancel</button><button className="btn primary" onClick={()=>{setActions(initialActions);setShowReset(false);setKeyFilter(null);}}>Reset demo</button></div></section></div>}
  </div>;
}
