import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Ocean Professional theme constants
 * primary: #2563EB, secondary/success: #F59E0B, error: #EF4444
 */
const OCEAN = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

const STORAGE_KEY = 'modern_notes_v1';

// Utility: generate id
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Seed notes for first load
const seedNotes = [
  {
    id: uid(),
    title: 'Welcome to Modern Notes',
    content:
      'This is a simple, fast notes app.\n\n- Create new notes with the + New button\n- Edit on the right pane\n- Search and sort your notes\n- Your notes are saved in your browser (localStorage)\n\nTip: Press Enter to save, Esc to cancel.',
    tags: ['getting-started', 'tips'],
    updatedAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: uid(),
    title: 'Ocean Professional Theme',
    content:
      'The app follows the Ocean Professional theme with blue and amber accents, subtle shadows, rounded corners, and smooth transitions.',
    tags: ['design', 'theme'],
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
];

// PUBLIC_INTERFACE
export default function App() {
  /**
   * Read optional env vars without depending on them.
   * These do not affect app logic since no backend is used.
   */
  const env = {
    apiBase: process.env.REACT_APP_API_BASE || '',
    backend: process.env.REACT_APP_BACKEND_URL || '',
    ws: process.env.REACT_APP_WS_URL || '',
    nodeEnv: process.env.REACT_APP_NODE_ENV || '',
    port: process.env.REACT_APP_PORT || '',
  };
  // eslint-disable-next-line no-unused-vars
  const _ignoreEnv = env; // keep reference to avoid unused var linting issues if config not used

  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return seedNotes;
  });

  const [selectedId, setSelectedId] = useState(() => (notes[0]?.id ?? null));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated_desc'); // updated_desc | updated_asc | title_asc | title_desc
  const [editingDraft, setEditingDraft] = useState(null); // {id,title,content,tags}
  const [isCreating, setIsCreating] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore storage errors
    }
  }, [notes]);

  // index current note
  const current = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  // filter + sort
  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    let arr = notes.filter((n) => {
      if (!lower) return true;
      const inTitle = n.title.toLowerCase().includes(lower);
      const inContent = n.content.toLowerCase().includes(lower);
      const inTags = (n.tags || []).some((t) => t.toLowerCase().includes(lower));
      return inTitle || inContent || inTags;
    });
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
    arr.sort((a, b) => {
      if (sort === 'updated_desc') return b.updatedAt - a.updatedAt;
      if (sort === 'updated_asc') return a.updatedAt - b.updatedAt;
      if (sort === 'title_asc') return collator.compare(a.title, b.title);
      if (sort === 'title_desc') return collator.compare(b.title, a.title);
      return 0;
    });
    return arr;
  }, [notes, query, sort]);

  // start editing current note
  const beginEdit = () => {
    if (!current) return;
    setEditingDraft({ ...current, tags: (current.tags || []).join(', ') });
    setIsCreating(false);
  };

  // PUBLIC_INTERFACE
  const cancelEdit = () => {
    setEditingDraft(null);
    setIsCreating(false);
  };

  // PUBLIC_INTERFACE
  const saveEdit = () => {
    if (!editingDraft) return;
    const next = { ...editingDraft };
    const tags = (next.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const updated = { ...current, title: next.title || 'Untitled', content: next.content || '', tags, updatedAt: Date.now() };
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setEditingDraft(null);
  };

  // PUBLIC_INTERFACE
  const createNote = () => {
    const id = uid();
    const newNote = {
      id,
      title: 'New Note',
      content: '',
      tags: [],
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(id);
    setEditingDraft({ ...newNote, tags: '' });
    setIsCreating(true);
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId((prev) => {
        const remaining = notes.filter((n) => n.id !== id);
        return remaining[0]?.id ?? null;
      });
      setEditingDraft(null);
    }
  };

  // keyboard: Enter to save, Esc to cancel when editing
  useEffect(() => {
    const onKey = (e) => {
      if (!editingDraft) return;
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  // Themable gradient header bar
  const Header = () => (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logoCircle} aria-hidden />
        <div>
          <div style={styles.appTitle}>Modern Notes</div>
          <div style={styles.appSubtitle}>Ocean Professional</div>
        </div>
      </div>
      <div style={styles.headerActions}>
        <button
          className="btn-primary"
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={createNote}
          aria-label="Create new note"
        >
          + New
        </button>
        <button
          className="btn-secondary"
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <Header />
      <div style={styles.container}>
        <aside style={styles.sidebar} aria-label="Notes list">
          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
              aria-label="Search notes"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={styles.sortSelect}
              aria-label="Sort notes"
            >
              <option value="updated_desc">Recent</option>
              <option value="updated_asc">Oldest</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
            </select>
          </div>

          <div style={styles.list}>
            {filtered.length === 0 ? (
              <div style={styles.emptyList}>
                <span style={{ fontSize: 24 }}>📝</span>
                <div style={{ marginTop: 8, color: OCEAN.textMuted }}>No notes found.</div>
                <button
                  style={{ ...styles.button, ...styles.primaryButton, marginTop: 12 }}
                  onClick={createNote}
                >
                  Create your first note
                </button>
              </div>
            ) : (
              filtered.map((n) => (
                <NoteListItem
                  key={n.id}
                  note={n}
                  active={n.id === selectedId}
                  onClick={() => {
                    setSelectedId(n.id);
                    setEditingDraft(null);
                    setIsCreating(false);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this note?')) {
                      deleteNote(n.id);
                    }
                  }}
                />
              ))
            )}
          </div>
        </aside>

        <main style={styles.main} aria-label="Note details">
          {!current ? (
            <div style={styles.emptyDetail}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>Welcome 👋</div>
              <div style={{ color: OCEAN.textMuted }}>Select a note from the left or create a new one.</div>
              <button
                style={{ ...styles.button, ...styles.primaryButton, marginTop: 16 }}
                onClick={createNote}
              >
                + New Note
              </button>
            </div>
          ) : editingDraft ? (
            <NoteEditor
              draft={editingDraft}
              setDraft={setEditingDraft}
              onSave={saveEdit}
              onCancel={cancelEdit}
              isCreating={isCreating}
            />
          ) : (
            <NoteViewer note={current} onEdit={beginEdit} onDelete={() => deleteNote(current.id)} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

function NoteListItem({ note, active, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      style={{
        ...styles.noteItem,
        ...(active ? styles.noteItemActive : {}),
      }}
      aria-current={active ? 'true' : 'false'}
    >
      <div style={styles.noteItemHeader}>
        <div style={styles.noteItemTitle}>{note.title || 'Untitled'}</div>
        <button
          title="Delete note"
          aria-label="Delete note"
          onClick={onDelete}
          style={styles.deleteIconButton}
        >
          🗑️
        </button>
      </div>
      <div style={styles.noteItemPreview}>
        {(note.content || '').slice(0, 80) || 'No content'}
      </div>
      <div style={styles.noteItemMeta}>
        <div style={styles.tagsRow}>
          {(note.tags || []).slice(0, 3).map((t) => (
            <span key={t} style={styles.tag}>
              {t}
            </span>
          ))}
        </div>
        <div style={styles.updatedAt}>{timeAgo(note.updatedAt)}</div>
      </div>
    </div>
  );
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function NoteViewer({ note, onEdit, onDelete }) {
  const contentLines = (note.content || '').split('\n');

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.viewerTitle}>{note.title || 'Untitled'}</div>
          <div style={styles.viewerSubTitle}>
            Updated {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>
        <div>
          <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={onEdit}>
            Edit
          </button>
          <button
            style={{ ...styles.button, ...styles.destructiveButton, marginLeft: 8 }}
            onClick={() => {
              if (window.confirm('Delete this note?')) onDelete();
            }}
          >
            Delete
          </button>
        </div>
      </div>
      {note.tags?.length ? (
        <div style={{ marginBottom: 12 }}>
          {note.tags.map((t) => (
            <span key={t} style={styles.tag}>
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <div style={styles.viewerContent}>
        {contentLines.map((line, i) => (
          <p key={i} style={{ margin: '0 0 10px' }}>
            {line.length ? line : ' '}
          </p>
        ))}
      </div>
    </div>
  );
}

function NoteEditor({ draft, setDraft, onSave, onCancel, isCreating }) {
  const titleRef = useRef(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.editorHeaderGroup}>
          <span style={styles.badge}>{isCreating ? 'New' : 'Editing'}</span>
          <div style={styles.viewerSubTitle}>Press Ctrl/Cmd+Enter to save • Esc to cancel</div>
        </div>
        <div>
          <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={onCancel}>
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton, marginLeft: 8 }}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          ref={titleRef}
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          style={styles.input}
          placeholder="Note title"
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label} htmlFor="content">
          Content
        </label>
        <textarea
          id="content"
          value={draft.content}
          onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
          style={styles.textarea}
          placeholder="Write your note..."
          rows={12}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label} htmlFor="tags">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          value={draft.tags}
          onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
          style={styles.input}
          placeholder="e.g., work, ideas"
        />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div style={styles.footer}>
      <span>© {new Date().getFullYear()} Modern Notes</span>
      <span style={{ color: OCEAN.textMuted }}>Your notes are stored locally in this browser.</span>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: OCEAN.background,
    color: OCEAN.text,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: `linear-gradient(90deg, rgba(37,99,235,0.08), rgba(249,250,251,1))`,
    borderBottom: `1px solid ${OCEAN.border}`,
    backdropFilter: 'saturate(120%) blur(2px)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${OCEAN.primary}, ${OCEAN.secondary})`,
    boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
  },
  appTitle: { fontWeight: 700, letterSpacing: 0.2 },
  appSubtitle: { fontSize: 12, color: OCEAN.textMuted },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10 },

  container: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 360px) 1fr',
    gap: 16,
    padding: 16,
  },

  sidebar: {
    background: OCEAN.surface,
    border: `1px solid ${OCEAN.border}`,
    borderRadius: 14,
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  searchRow: {
    padding: 12,
    borderBottom: `1px solid ${OCEAN.border}`,
    display: 'flex',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${OCEAN.border}`,
    outline: 'none',
    transition: 'box-shadow .2s, border-color .2s',
  },
  sortSelect: {
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${OCEAN.border}`,
    background: '#fff',
    outline: 'none',
  },
  list: {
    padding: 8,
    overflow: 'auto',
    flex: 1,
  },
  emptyList: {
    padding: 16,
    textAlign: 'center',
    color: OCEAN.textMuted,
  },
  noteItem: {
    border: `1px solid ${OCEAN.border}`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    background: '#ffffff',
    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform .12s ease, box-shadow .12s ease, border-color .12s ease',
  },
  noteItemActive: {
    borderColor: OCEAN.primary,
    boxShadow: '0 6px 20px rgba(37,99,235,0.12)',
    transform: 'translateY(-1px)',
  },
  noteItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  noteItemTitle: { fontWeight: 600 },
  noteItemPreview: { color: OCEAN.textMuted, fontSize: 13, marginTop: 6 },
  noteItemMeta: { marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tagsRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 999,
    background: 'rgba(37,99,235,0.08)',
    color: OCEAN.primary,
    border: `1px solid rgba(37,99,235,0.22)`,
  },
  updatedAt: { fontSize: 12, color: OCEAN.textMuted },

  main: {
    background: OCEAN.surface,
    border: `1px solid ${OCEAN.border}`,
    borderRadius: 14,
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    padding: 16,
    overflow: 'auto',
    minHeight: 0,
  },

  card: {
    background: '#ffffff',
    borderRadius: 14,
    border: `1px solid ${OCEAN.border}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    padding: 16,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  viewerTitle: { fontSize: 22, fontWeight: 700 },
  viewerSubTitle: { fontSize: 12, color: OCEAN.textMuted, marginTop: 2 },
  viewerContent: { lineHeight: 1.7, fontSize: 15 },

  editorHeaderGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: {
    fontSize: 12,
    background: 'rgba(245,158,11,0.15)',
    color: OCEAN.secondary,
    padding: '4px 8px',
    borderRadius: 999,
    border: '1px solid rgba(245,158,11,0.35)',
  },

  formGroup: { marginBottom: 12, display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, color: OCEAN.textMuted, marginBottom: 6 },
  input: {
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${OCEAN.border}`,
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${OCEAN.border}`,
    outline: 'none',
    resize: 'vertical',
    minHeight: 160,
    transition: 'border-color .2s, box-shadow .2s',
    fontFamily: 'inherit',
  },

  button: {
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    cursor: 'pointer',
    transition: 'transform .12s ease, box-shadow .12s ease, background .2s',
  },
  primaryButton: {
    background: OCEAN.primary,
    color: '#fff',
    boxShadow: '0 6px 20px rgba(37,99,235,0.25)',
  },
  secondaryButton: {
    background: '#EEF2FF',
    color: OCEAN.primary,
    border: `1px solid rgba(37,99,235,0.25)`,
  },
  destructiveButton: {
    background: OCEAN.error,
    color: '#fff',
    boxShadow: '0 6px 20px rgba(239,68,68,0.25)',
  },
  deleteIconButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    color: OCEAN.textMuted,
  },

  footer: {
    borderTop: `1px solid ${OCEAN.border}`,
    background: '#ffffff',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    color: OCEAN.textMuted,
  },

  '@media': {
    // kept for conceptual clarity; actual responsive handled below using inline checks or CSS file if needed
  },
};

// Responsive tweak via viewport checks using effect to adjust grid on small screens could be done with CSS,
// but since we avoid external files, the grid is mobile-friendly by default in small viewports via stacking using CSS.
// For CRA default index.css, we keep general font rules unchanged.
