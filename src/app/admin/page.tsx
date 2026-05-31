'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Category {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: string;
  created_at: string;
}
interface QuestionSet {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  difficulty: string;
  published: boolean;
  auto_submit: boolean;
  grace_period_seconds: number;
  show_timer: boolean;
  created_at: string;
  categories?: { title: string };
}
interface QuestionImage {
  id: string;
  image_url: string;
  display_order: number;
}
interface MCQOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  display_order: number;
}
interface Question {
  id: string;
  question_set_id: string;
  question_number: number;
  question_type: 'mcq' | 'numeric';
  marks: number;
  question_text: string;
  correct_answer: string;
  tolerance_percent: number;
  download_link: string | null;
  created_at: string;
  question_images: QuestionImage[];
  mcq_options: MCQOption[];
}
interface Analytics {
  total_attempts: number;
  passed: number;
  failed: number;
  pass_rate: number;
  avg_score: number;
  total_questions: number;
  total_sets: number;
  recent_attempts: RecentAttempt[];
  hardest_questions: { id: string; rate: number }[];
}
interface RecentAttempt {
  id: string;
  score: number;
  percentage: number;
  passed: boolean;
  time_used: number;
  submitted_at: string;
}

const G = {
  pageBg: 'linear-gradient(135deg,#05050f 0%,#0d0d2b 50%,#05050f 100%)',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.09)',
  navBg: 'rgba(5,5,18,0.98)',
  text: 'rgba(240,240,255,0.9)',
  textSub: 'rgba(240,240,255,0.55)',
  textMuted: 'rgba(240,240,255,0.3)',
  accent: '#6366f1',
  accentLight: '#818cf8',
  accentBg: 'rgba(99,102,241,0.12)',
  red: '#ff453a',
  green: '#34c759',
  orange: '#ff9f0a',
  yellow: '#ffd60a',
  shadow: '0 8px 40px rgba(0,0,0,0.5)',
};
const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Inter',Arial,sans-serif",
};
const labelSt: React.CSSProperties = {
  display: 'block',
  color: G.textMuted,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: 5,
};
const btnP: React.CSSProperties = {
  padding: '9px 16px',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'Inter',Arial,sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: 7,
};
const btnD: React.CSSProperties = {
  padding: '7px 12px',
  background: 'rgba(255,69,58,0.12)',
  border: '1px solid rgba(255,69,58,0.25)',
  borderRadius: 7,
  color: G.red,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Inter',Arial,sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: 5,
};
const btnS: React.CSSProperties = {
  padding: '7px 12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: G.textSub,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Inter',Arial,sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: 5,
};
const card: React.CSSProperties = {
  background: G.glass,
  border: `1px solid ${G.glassBorder}`,
  borderRadius: 12,
  padding: 14,
};
const diffC: Record<string, string> = {
  Beginner: '#34c759',
  Intermediate: '#ff9f0a',
  Advanced: '#ff453a',
  Expert: '#af52de',
};

function SecHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}
    >
      <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}

function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: type === 'success' ? 'rgba(52,199,89,0.15)' : 'rgba(255,69,58,0.15)',
        border: `1px solid ${type === 'success' ? 'rgba(52,199,89,0.4)' : 'rgba(255,69,58,0.4)'}`,
        color: type === 'success' ? G.green : G.red,
        padding: '12px 18px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: G.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: "'Inter',Arial,sans-serif",
      }}
    >
      <i className={`fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
      {msg}
    </div>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        localStorage.setItem('admin_token', 'authenticated');
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || 'Invalid password');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: G.pageBg,
        fontFamily: "'Inter',Arial,sans-serif",
      }}
    >
      <nav
        style={{
          height: 52,
          background: G.navBg,
          borderBottom: `1px solid ${G.glassBorder}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-pen-ruler" style={{ color: G.accentLight, fontSize: 18 }} />
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>TesterPRO</span>
        </div>
        <a
          href="/"
          style={{
            color: G.textMuted,
            fontSize: 12,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: 10 }} /> Back to Portal
        </a>
      </nav>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: G.glass,
            border: `1px solid ${G.glassBorder}`,
            borderRadius: 20,
            overflow: 'hidden',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: G.shadow,
          }}
        >
          <div
            style={{ height: 4, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)' }}
          />
          <div style={{ padding: 36 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: G.accentBg,
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <i
                  className="fa-solid fa-shield-halved"
                  style={{ fontSize: 28, color: G.accentLight }}
                />
              </div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>Admin Panel</div>
              <div style={{ color: G.textSub, fontSize: 13, marginTop: 6 }}>
                Enter your admin password to continue
              </div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelSt}>Password</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter password..."
                  style={inputSt}
                  autoFocus
                />
              </div>
              {error && (
                <div
                  style={{
                    background: 'rgba(255,69,58,0.1)',
                    border: '1px solid rgba(255,69,58,0.3)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: G.red,
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ ...btnP, width: '100%', justifyContent: 'center', padding: 12 }}
              >
                <i className="fa-solid fa-right-to-bracket" />
                {loading ? 'Authenticating...' : 'Login to Admin Panel'}
              </button>
            </form>
            <div
              style={{
                marginTop: 20,
                padding: '10px 14px',
                background: G.accentBg,
                borderRadius: 8,
                border: '1px solid rgba(99,102,241,0.2)',
                color: G.textMuted,
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              Default password: <strong style={{ color: G.accentLight }}>123</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);
  if (loading)
    return (
      <div
        style={{ color: G.textMuted, padding: 24, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <i className="fa-solid fa-spinner fa-spin" />
        Loading analytics...
      </div>
    );
  if (!data) return null;
  const stats = [
    { icon: 'fa-flask', label: 'Total Attempts', value: data.total_attempts, color: G.accentLight },
    { icon: 'fa-circle-check', label: 'Passed', value: data.passed, color: G.green },
    { icon: 'fa-circle-xmark', label: 'Failed', value: data.failed, color: G.red },
    { icon: 'fa-chart-line', label: 'Pass Rate', value: `${data.pass_rate}%`, color: G.orange },
    { icon: 'fa-star', label: 'Avg Score', value: `${data.avg_score}%`, color: G.yellow },
    {
      icon: 'fa-circle-question',
      label: 'Questions',
      value: data.total_questions,
      color: '#a78bfa',
    },
    { icon: 'fa-clipboard-list', label: 'Exam Sets', value: data.total_sets, color: '#38bdf8' },
  ];
  return (
    <div>
      <SecHead title="Analytics Dashboard" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ ...card, textAlign: 'center' }}>
            <i
              className={`fa-solid ${s.icon}`}
              style={{ fontSize: 22, color: s.color, display: 'block', marginBottom: 8 }}
            />
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: G.textMuted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {data.recent_attempts.length > 0 && (
        <>
          <h3
            style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i
              className="fa-solid fa-clock-rotate-left"
              style={{ color: G.textMuted, fontSize: 12 }}
            />
            Recent Attempts
          </h3>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {data.recent_attempts.map((a, idx) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom:
                    idx < data.recent_attempts.length - 1 ? `1px solid ${G.glassBorder}` : 'none',
                }}
              >
                <div>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {a.percentage}%
                  </span>
                  <span style={{ color: G.textMuted, fontSize: 12, marginLeft: 10 }}>
                    Score: {a.score} pts
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: G.textMuted, fontSize: 11 }}>
                    {Math.floor(a.time_used / 60)}m {a.time_used % 60}s
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      background: a.passed ? 'rgba(52,199,89,0.15)' : 'rgba(255,69,58,0.15)',
                      color: a.passed ? G.green : G.red,
                    }}
                  >
                    {a.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {data.total_attempts === 0 && (
        <div style={{ textAlign: 'center', color: G.textMuted, padding: 40 }}>
          <i
            className="fa-solid fa-chart-bar"
            style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
          />
          No exam attempts yet. Share your portal to get started!
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'Intermediate',
    thumbnail_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/admin/categories');
    const d = await r.json();
    setCats(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  function openCreate() {
    setEditCat(null);
    setForm({ title: '', description: '', difficulty: 'Intermediate', thumbnail_url: '' });
    setShowForm(true);
  }
  function openEdit(c: Category) {
    setEditCat(c);
    setForm({
      title: c.title,
      description: c.description || '',
      difficulty: c.difficulty,
      thumbnail_url: c.thumbnail_url || '',
    });
    setShowForm(true);
  }
  async function uploadThumb(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json();
    setUploading(false);
    if (d.url) setForm((f) => ({ ...f, thumbnail_url: d.url }));
    else setToast({ msg: d.error || 'Upload failed', type: 'error' });
  }
  async function handleSave() {
    setSaving(true);
    const method = editCat ? 'PUT' : 'POST';
    const url = editCat ? `/api/admin/categories/${editCat.id}` : '/api/admin/categories';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setToast({ msg: editCat ? 'Updated!' : 'Created!', type: 'success' });
      setShowForm(false);
      load();
    } else {
      const d = await r.json();
      setToast({ msg: d.error || 'Save failed', type: 'error' });
    }
    setSaving(false);
  }
  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    const r = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setToast({ msg: 'Deleted!', type: 'success' });
      load();
    } else setToast({ msg: 'Delete failed', type: 'error' });
  }
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <SecHead
        title="Categories"
        action={
          <button style={btnP} onClick={openCreate}>
            <i className="fa-solid fa-plus" />
            New Category
          </button>
        }
      />
      {showForm && (
        <div style={{ ...card, marginBottom: 20, border: '1px solid rgba(99,102,241,0.25)' }}>
          <h3
            style={{
              color: '#fff',
              fontWeight: 700,
              marginBottom: 16,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i
              className={`fa-solid ${editCat ? 'fa-pen' : 'fa-plus-circle'}`}
              style={{ color: G.accentLight }}
            />
            {editCat ? 'Edit Category' : 'Create Category'}
          </h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
          >
            <div>
              <label style={labelSt}>Title *</label>
              <input
                style={inputSt}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. CSWP Core Simulation"
              />
            </div>
            <div>
              <label style={labelSt}>Difficulty</label>
              <select
                style={{ ...inputSt, cursor: 'pointer' }}
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              >
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Description</label>
            <input
              style={inputSt}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description..."
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>Thumbnail Image</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...inputSt, flex: 1 }}
                value={form.thumbnail_url}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                placeholder="Paste URL or upload file..."
              />
              <button style={btnS} onClick={() => fileRef.current?.click()} disabled={uploading}>
                <i className="fa-solid fa-paperclip" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && uploadThumb(e.target.files[0])}
              />
            </div>
            {form.thumbnail_url && (
              <img
                src={form.thumbnail_url}
                alt="thumb"
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnP} onClick={handleSave} disabled={saving || !form.title}>
              <i className="fa-solid fa-floppy-disk" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button style={btnS} onClick={() => setShowForm(false)}>
              <i className="fa-solid fa-xmark" />
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ color: G.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-spinner fa-spin" />
          Loading...
        </div>
      ) : cats.length === 0 ? (
        <div style={{ textAlign: 'center', color: G.textMuted, padding: 40 }}>
          <i
            className="fa-solid fa-folder-open"
            style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
          />
          No categories yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cats.map((c) => {
            const dc = diffC[c.difficulty] || G.orange;
            return (
              <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt=""
                    style={{
                      width: 48,
                      height: 36,
                      objectFit: 'cover',
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 36,
                      background: G.accentBg,
                      borderRadius: 6,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i
                      className="fa-solid fa-folder"
                      style={{ color: G.accentLight, fontSize: 16 }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                  {c.description && (
                    <div
                      style={{
                        color: G.textMuted,
                        fontSize: 12,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.description}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    background: dc + '22',
                    color: dc,
                    flexShrink: 0,
                  }}
                >
                  {c.difficulty}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={btnS} onClick={() => openEdit(c)}>
                    <i className="fa-solid fa-pen" />
                    Edit
                  </button>
                  <button style={btnD} onClick={() => handleDelete(c.id)}>
                    <i className="fa-solid fa-trash" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionSetsTab() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSet, setEditSet] = useState<QuestionSet | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = {
    category_id: '',
    title: '',
    description: '',
    duration_minutes: 90,
    passing_marks: 75,
    total_marks: 105,
    difficulty: 'Intermediate',
    shuffle_questions: false,
    shuffle_options: false,
    published: true,
    auto_submit: true,
    grace_period_seconds: 10,
    show_timer: true,
  };
  const [form, setForm] = useState(emptyForm);
  const load = useCallback(async () => {
    setLoading(true);
    const [sr, cr] = await Promise.all([
      fetch('/api/admin/question-sets').then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
    ]);
    setSets(Array.isArray(sr) ? sr : []);
    setCats(Array.isArray(cr) ? cr : []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  function openCreate() {
    setEditSet(null);
    setForm({ ...emptyForm, category_id: cats[0]?.id || '' });
    setShowForm(true);
  }
  function openEdit(s: QuestionSet) {
    setEditSet(s);
    setForm({
      category_id: s.category_id,
      title: s.title,
      description: s.description || '',
      duration_minutes: s.duration_minutes,
      passing_marks: s.passing_marks,
      total_marks: s.total_marks,
      difficulty: s.difficulty,
      shuffle_questions: s.shuffle_questions,
      shuffle_options: s.shuffle_options,
      published: s.published,
      auto_submit: s.auto_submit,
      grace_period_seconds: s.grace_period_seconds,
      show_timer: s.show_timer,
    });
    setShowForm(true);
  }
  async function handleSave() {
    setSaving(true);
    const method = editSet ? 'PUT' : 'POST';
    const url = editSet ? `/api/admin/question-sets/${editSet.id}` : '/api/admin/question-sets';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setToast({ msg: editSet ? 'Updated!' : 'Created!', type: 'success' });
      setShowForm(false);
      load();
    } else {
      const d = await r.json();
      setToast({ msg: d.error || 'Save failed', type: 'error' });
    }
    setSaving(false);
  }
  async function togglePublish(s: QuestionSet) {
    await fetch(`/api/admin/question-sets/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, published: !s.published }),
    });
    load();
  }
  async function handleDelete(id: string) {
    if (!confirm('Delete this question set?')) return;
    const r = await fetch(`/api/admin/question-sets/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setToast({ msg: 'Deleted!', type: 'success' });
      load();
    } else setToast({ msg: 'Delete failed', type: 'error' });
  }
  const toggle = (key: keyof typeof form) =>
    setForm((f) => ({ ...f, [key]: !f[key as keyof typeof f] }));
  const num = (key: string, v: string) => setForm((f) => ({ ...f, [key]: Number(v) }));
  function SW({ k, label }: { k: keyof typeof form; label: string }) {
    const on = !!form[k];
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <div
          onClick={() => toggle(k)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            flexShrink: 0,
            background: on ? G.accent : 'rgba(255,255,255,0.1)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: on ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }}
          />
        </div>
        <span style={{ color: on ? '#fff' : G.textMuted, fontSize: 12 }}>{label}</span>
      </label>
    );
  }
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <SecHead
        title="Question Sets"
        action={
          <button style={btnP} onClick={openCreate}>
            <i className="fa-solid fa-plus" />
            New Set
          </button>
        }
      />
      {showForm && (
        <div style={{ ...card, marginBottom: 20, border: '1px solid rgba(99,102,241,0.25)' }}>
          <h3
            style={{
              color: '#fff',
              fontWeight: 700,
              marginBottom: 16,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i
              className={`fa-solid ${editSet ? 'fa-pen' : 'fa-plus-circle'}`}
              style={{ color: G.accentLight }}
            />
            {editSet ? 'Edit Set' : 'Create Set'}
          </h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
          >
            <div>
              <label style={labelSt}>Category *</label>
              <select
                style={{ ...inputSt, cursor: 'pointer' }}
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">— Select —</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelSt}>Title *</label>
              <input
                style={inputSt}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. CSWP Segment 1"
              />
            </div>
            <div>
              <label style={labelSt}>Difficulty</label>
              <select
                style={{ ...inputSt, cursor: 'pointer' }}
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              >
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelSt}>Description</label>
              <input
                style={inputSt}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description..."
              />
            </div>
          </div>
          <div
            style={{
              background: 'rgba(99,102,241,0.06)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <div
              style={{
                color: G.accentLight,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Marks &amp; Duration
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelSt}>Duration (min)</label>
                <input
                  type="number"
                  style={inputSt}
                  value={form.duration_minutes}
                  onChange={(e) => num('duration_minutes', e.target.value)}
                  min={1}
                />
              </div>
              <div>
                <label style={labelSt}>Total Marks</label>
                <input
                  type="number"
                  style={inputSt}
                  value={form.total_marks}
                  onChange={(e) => num('total_marks', e.target.value)}
                  min={1}
                />
              </div>
              <div>
                <label style={labelSt}>Pass Marks</label>
                <input
                  type="number"
                  style={inputSt}
                  value={form.passing_marks}
                  onChange={(e) => num('passing_marks', e.target.value)}
                  min={1}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,159,10,0.06)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
              border: '1px solid rgba(255,159,10,0.15)',
            }}
          >
            <div
              style={{
                color: G.orange,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Timer &amp; Controls
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}
            >
              <div>
                <label style={labelSt}>Grace Period (sec)</label>
                <input
                  type="number"
                  style={inputSt}
                  value={form.grace_period_seconds}
                  onChange={(e) => num('grace_period_seconds', e.target.value)}
                  min={0}
                  max={60}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  justifyContent: 'center',
                }}
              >
                {(
                  (['show_timer', 'Show Timer'] as const) &&
                  ([
                    ['show_timer', 'Show Timer'],
                    ['auto_submit', 'Auto-Submit'],
                    ['shuffle_questions', 'Shuffle Questions'],
                    ['shuffle_options', 'Shuffle Options'],
                  ] as [keyof typeof form, string][])
                ).map(([k, l]) => (
                  <SW key={k as string} k={k} label={l} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div
                onClick={() => toggle('published')}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: form.published ? G.green : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: form.published ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
              <span
                style={{
                  color: form.published ? G.green : G.textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {form.published ? 'Published (visible to students)' : 'Unpublished (hidden)'}
              </span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={btnP}
              onClick={handleSave}
              disabled={saving || !form.title || !form.category_id}
            >
              <i className="fa-solid fa-floppy-disk" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button style={btnS} onClick={() => setShowForm(false)}>
              <i className="fa-solid fa-xmark" />
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ color: G.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-spinner fa-spin" />
          Loading...
        </div>
      ) : sets.length === 0 ? (
        <div style={{ textAlign: 'center', color: G.textMuted, padding: 40 }}>
          <i
            className="fa-solid fa-clipboard-list"
            style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
          />
          No question sets yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sets.map((s) => {
            const passRate =
              s.total_marks > 0 ? Math.round((s.passing_marks / s.total_marks) * 100) : 0;
            const dc = diffC[s.difficulty] || G.orange;
            return (
              <div key={s.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                    <div style={{ color: G.textMuted, fontSize: 12, marginTop: 2 }}>
                      {s.categories?.title} &middot; {s.duration_minutes}min &middot;{' '}
                      {s.total_marks}pts &middot; Pass: {s.passing_marks}pts ({passRate}%)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        background: dc + '22',
                        color: dc,
                      }}
                    >
                      {s.difficulty}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        background: s.published ? 'rgba(52,199,89,0.15)' : 'rgba(255,69,58,0.1)',
                        color: s.published ? G.green : G.red,
                        cursor: 'pointer',
                      }}
                      onClick={() => togglePublish(s)}
                    >
                      {s.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    color: G.textMuted,
                    fontSize: 11,
                    marginBottom: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    <i className="fa-solid fa-eye" style={{ marginRight: 3 }} />
                    {s.show_timer ? 'Timer ON' : 'Timer OFF'}
                  </span>
                  <span>
                    <i className="fa-solid fa-bolt" style={{ marginRight: 3 }} />
                    {s.auto_submit ? 'Auto-submit' : 'Manual'}
                  </span>
                  <span>
                    <i className="fa-solid fa-shuffle" style={{ marginRight: 3 }} />
                    {s.shuffle_questions ? 'Q.Shuffle ON' : 'OFF'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={btnS} onClick={() => openEdit(s)}>
                    <i className="fa-solid fa-pen" />
                    Edit
                  </button>
                  <button style={btnD} onClick={() => handleDelete(s.id)}>
                    <i className="fa-solid fa-trash" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionsTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selCat, setSelCat] = useState('');
  const [selSet, setSelSet] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emptyQ = {
    question_number: 1,
    question_type: 'mcq' as 'mcq' | 'numeric',
    marks: 10,
    question_text: '',
    correct_answer: '',
    tolerance_percent: 1,
    download_link: '',
    images: [] as string[],
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  };
  const [qForm, setQForm] = useState(emptyQ);
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch('/api/admin/question-sets').then((r) => r.json()),
    ]).then(([c, s]) => {
      setCats(Array.isArray(c) ? c : []);
      setSets(Array.isArray(s) ? s : []);
    });
  }, []);
  const filteredSets = sets.filter((s) => !selCat || s.category_id === selCat);
  async function loadQ(setId: string) {
    if (!setId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    const r = await fetch(`/api/admin/questions?set_id=${setId}`);
    const d = await r.json();
    setQuestions(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(() => {
    if (selSet) loadQ(selSet);
    else setQuestions([]);
  }, [selSet]);
  function openCreate() {
    setEditQ(null);
    const next =
      questions.length > 0 ? Math.max(...questions.map((q) => q.question_number)) + 1 : 1;
    setQForm({ ...emptyQ, question_number: next });
    setShowForm(true);
  }
  function openEdit(q: Question) {
    setEditQ(q);
    setQForm({
      question_number: q.question_number,
      question_type: q.question_type,
      marks: q.marks,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      tolerance_percent: q.tolerance_percent,
      download_link: q.download_link || '',
      images: q.question_images
        .sort((a, b) => a.display_order - b.display_order)
        .map((i) => i.image_url),
      options:
        q.mcq_options.length > 0
          ? q.mcq_options
              .sort((a, b) => a.display_order - b.display_order)
              .map((o) => ({ text: o.option_text, is_correct: o.is_correct }))
          : [
              { text: '', is_correct: false },
              { text: '', is_correct: false },
              { text: '', is_correct: false },
              { text: '', is_correct: false },
            ],
    });
    setShowForm(true);
  }
  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json();
    setUploading(false);
    if (d.url) setQForm((f) => ({ ...f, images: [...f.images, d.url] }));
    else setToast({ msg: d.error || 'Upload failed', type: 'error' });
  }
  async function saveQ() {
    if (!selSet) return;
    setSaving(true);
    const payload = {
      question_set_id: selSet,
      question_number: qForm.question_number,
      question_type: qForm.question_type,
      marks: qForm.marks,
      question_text: qForm.question_text,
      correct_answer: qForm.correct_answer,
      tolerance_percent: qForm.tolerance_percent,
      download_link: qForm.download_link || null,
      images: qForm.images.filter(Boolean),
      options:
        qForm.question_type === 'mcq'
          ? qForm.options
              .filter((o) => o.text)
              .map((o) => ({ text: o.text, is_correct: o.is_correct }))
          : [],
    };
    const method = editQ ? 'PUT' : 'POST';
    const url = editQ ? `/api/admin/questions/${editQ.id}` : '/api/admin/questions';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      setToast({ msg: editQ ? 'Updated!' : 'Created!', type: 'success' });
      setShowForm(false);
      loadQ(selSet);
    } else {
      const d = await r.json();
      setToast({ msg: d.error || 'Save failed', type: 'error' });
    }
    setSaving(false);
  }
  async function deleteQ(id: string) {
    if (!confirm('Delete this question?')) return;
    const r = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setToast({ msg: 'Deleted!', type: 'success' });
      loadQ(selSet);
    } else setToast({ msg: 'Delete failed', type: 'error' });
  }
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <SecHead
        title="Questions"
        action={
          selSet ? (
            <button style={btnP} onClick={openCreate}>
              <i className="fa-solid fa-plus" />
              Add Question
            </button>
          ) : null
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={labelSt}>Category</label>
          <select
            style={{ ...inputSt, cursor: 'pointer' }}
            value={selCat}
            onChange={(e) => {
              setSelCat(e.target.value);
              setSelSet('');
              setQuestions([]);
            }}
          >
            <option value="">— All —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelSt}>Question Set</label>
          <select
            style={{ ...inputSt, cursor: 'pointer' }}
            value={selSet}
            onChange={(e) => setSelSet(e.target.value)}
          >
            <option value="">— Select Set —</option>
            {filteredSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      {showForm && selSet && (
        <div style={{ ...card, marginBottom: 20, border: '1px solid rgba(99,102,241,0.25)' }}>
          <h3
            style={{
              color: '#fff',
              fontWeight: 700,
              marginBottom: 16,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i
              className={`fa-solid ${editQ ? 'fa-pen' : 'fa-circle-question'}`}
              style={{ color: G.accentLight }}
            />
            {editQ ? `Edit Q#${editQ.question_number}` : 'New Question'}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={labelSt}>Number</label>
              <input
                type="number"
                style={inputSt}
                value={qForm.question_number}
                onChange={(e) =>
                  setQForm((f) => ({ ...f, question_number: Number(e.target.value) }))
                }
                min={1}
              />
            </div>
            <div>
              <label style={labelSt}>Type</label>
              <select
                style={{ ...inputSt, cursor: 'pointer' }}
                value={qForm.question_type}
                onChange={(e) =>
                  setQForm((f) => ({ ...f, question_type: e.target.value as 'mcq' | 'numeric' }))
                }
              >
                <option value="mcq">MCQ</option>
                <option value="numeric">Numeric</option>
              </select>
            </div>
            <div>
              <label style={labelSt}>Marks</label>
              <input
                type="number"
                style={inputSt}
                value={qForm.marks}
                onChange={(e) => setQForm((f) => ({ ...f, marks: Number(e.target.value) }))}
                min={1}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Question Text *</label>
            <textarea
              style={
                {
                  ...inputSt,
                  minHeight: 120,
                  resize: 'vertical',
                  lineHeight: 1.6,
                } as React.CSSProperties
              }
              value={qForm.question_text}
              onChange={(e) => setQForm((f) => ({ ...f, question_text: e.target.value }))}
              placeholder="Enter question text..."
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Images</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button style={btnS} onClick={() => fileRef.current?.click()} disabled={uploading}>
                <i className="fa-solid fa-paperclip" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
              <input
                style={{ ...inputSt, flex: 1 }}
                placeholder="Or paste URL + Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) {
                      setQForm((f) => ({ ...f, images: [...f.images, v] }));
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
            {qForm.images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {qForm.images.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: `1px solid ${G.glassBorder}`,
                        display: 'block',
                        background: 'rgba(255,255,255,0.05)',
                      }}
                    />
                    <button
                      onClick={() =>
                        setQForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
                      }
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: G.red,
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {qForm.question_type === 'mcq' && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>MCQ Options (click circle to mark correct)</label>
              {qForm.options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}
                >
                  <button
                    onClick={() =>
                      setQForm((f) => ({
                        ...f,
                        options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })),
                      }))
                    }
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: opt.is_correct ? G.accent : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${opt.is_correct ? G.accent : 'rgba(255,255,255,0.15)'}`,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {opt.is_correct ? (
                      <i className="fa-solid fa-check" style={{ fontSize: 9 }} />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </button>
                  <input
                    style={{ ...inputSt, flex: 1 }}
                    value={opt.text}
                    onChange={(e) =>
                      setQForm((f) => ({
                        ...f,
                        options: f.options.map((o, i) =>
                          i === idx ? { ...o, text: e.target.value } : o
                        ),
                      }))
                    }
                    placeholder={`Option ${idx + 1}${opt.is_correct ? ' (correct)' : ''}`}
                  />
                  {qForm.options.length > 2 && (
                    <button
                      style={{ ...btnD, padding: '6px 8px' }}
                      onClick={() =>
                        setQForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))
                      }
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              ))}
              <button
                style={btnS}
                onClick={() =>
                  setQForm((f) => ({
                    ...f,
                    options: [...f.options, { text: '', is_correct: false }],
                  }))
                }
              >
                <i className="fa-solid fa-plus" />
                Add Option
              </button>
            </div>
          )}
          {qForm.question_type === 'numeric' && (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
            >
              <div>
                <label style={labelSt}>Correct Answer *</label>
                <input
                  style={inputSt}
                  value={qForm.correct_answer}
                  onChange={(e) => setQForm((f) => ({ ...f, correct_answer: e.target.value }))}
                  placeholder="e.g. 13313.35"
                />
              </div>
              <div>
                <label style={labelSt}>Tolerance %</label>
                <input
                  type="number"
                  style={inputSt}
                  value={qForm.tolerance_percent}
                  onChange={(e) =>
                    setQForm((f) => ({ ...f, tolerance_percent: Number(e.target.value) }))
                  }
                  min={0}
                  max={50}
                  step={0.1}
                />
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>CAD Download Link</label>
            <input
              style={inputSt}
              value={qForm.download_link}
              onChange={(e) => setQForm((f) => ({ ...f, download_link: e.target.value }))}
              placeholder="Google Drive / Dropbox link..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnP} onClick={saveQ} disabled={saving || !qForm.question_text}>
              <i className="fa-solid fa-floppy-disk" />
              {saving ? 'Saving...' : 'Save Question'}
            </button>
            <button style={btnS} onClick={() => setShowForm(false)}>
              <i className="fa-solid fa-xmark" />
              Cancel
            </button>
          </div>
        </div>
      )}
      {!selSet ? (
        <div style={{ textAlign: 'center', color: G.textMuted, padding: 40 }}>
          <i
            className="fa-solid fa-circle-question"
            style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
          />
          Select a category and question set above.
        </div>
      ) : loading ? (
        <div style={{ color: G.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-spinner fa-spin" />
          Loading...
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', color: G.textMuted, padding: 40 }}>
          <i
            className="fa-solid fa-inbox"
            style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
          />
          No questions yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((q) => (
            <div key={q.id} style={card}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ color: G.accentLight, fontSize: 12, fontWeight: 800 }}>
                      Q{q.question_number}
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        background:
                          q.question_type === 'mcq'
                            ? 'rgba(99,102,241,0.15)'
                            : 'rgba(52,199,89,0.15)',
                        color: q.question_type === 'mcq' ? G.accentLight : G.green,
                      }}
                    >
                      {q.question_type === 'mcq' ? 'MCQ' : 'Numeric'}
                    </span>
                    <span style={{ color: G.yellow, fontSize: 12, fontWeight: 700 }}>
                      <i className="fa-solid fa-star" style={{ fontSize: 9, marginRight: 3 }} />
                      {q.marks} pts
                    </span>
                    {q.question_images.length > 0 && (
                      <span
                        style={{
                          color: G.textMuted,
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <i className="fa-solid fa-image" style={{ fontSize: 9 }} />
                        {q.question_images.length}
                      </span>
                    )}
                    {q.question_type === 'numeric' && (
                      <span style={{ color: G.textMuted, fontSize: 10 }}>
                        ±{q.tolerance_percent}%
                      </span>
                    )}
                  </div>
                  <div style={{ color: G.text, fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>
                    {q.question_text.length > 180
                      ? q.question_text.slice(0, 180) + '…'
                      : q.question_text}
                  </div>
                  {q.question_type === 'mcq' && q.mcq_options.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                      {q.mcq_options.map((o) => (
                        <span
                          key={o.id}
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: 11,
                            background: o.is_correct
                              ? 'rgba(52,199,89,0.15)'
                              : 'rgba(255,255,255,0.04)',
                            color: o.is_correct ? G.green : G.textMuted,
                            border: `1px solid ${o.is_correct ? 'rgba(52,199,89,0.3)' : G.glassBorder}`,
                          }}
                        >
                          {o.is_correct && (
                            <i
                              className="fa-solid fa-check"
                              style={{ fontSize: 8, marginRight: 3 }}
                            />
                          )}
                          {o.option_text}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'numeric' && (
                    <div
                      style={{
                        color: G.green,
                        fontSize: 12,
                        marginTop: 4,
                        fontFamily: 'monospace',
                      }}
                    >
                      Correct: {q.correct_answer} (±{q.tolerance_percent}%)
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={btnS} onClick={() => openEdit(q)}>
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button style={btnD} onClick={() => deleteQ(q.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImportExportTab() {
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [exportSetId, setExportSetId] = useState('');
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    fetch('/api/admin/question-sets')
      .then((r) => r.json())
      .then((d) => setSets(Array.isArray(d) ? d : []));
  }, []);
  function loadFile(file: File) {
    const r = new FileReader();
    r.onload = (e) => setJsonText((e.target?.result as string) || '');
    r.readAsText(file);
  }
  async function handleImport() {
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const payload = JSON.parse(jsonText);
      const r = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) setResult(`Imported ${d.imported} questions!`);
      else setError(d.error || 'Import failed');
    } catch (e) {
      setError(`JSON error: ${e instanceof Error ? e.message : 'Invalid JSON'}`);
    }
    setImporting(false);
  }
  async function handleExport() {
    if (!exportSetId) return;
    setExporting(true);
    const [setRes, qRes] = await Promise.all([
      fetch(`/api/admin/question-sets/${exportSetId}`).then((r) => r.json()),
      fetch(`/api/admin/questions?set_id=${exportSetId}`).then((r) => r.json()),
    ]);
    const exportData = {
      questionSet: {
        ...setRes,
        questions: (qRes as Question[]).map((q) => ({
          questionNumber: q.question_number,
          type: q.question_type,
          marks: q.marks,
          text: q.question_text,
          correctAnswer: q.correct_answer,
          tolerancePercent: q.tolerance_percent,
          images: q.question_images?.map((i) => i.image_url) || [],
          options:
            q.mcq_options?.map((o) => ({ text: o.option_text, is_correct: o.is_correct })) || [],
        })),
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${setRes.title?.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }
  const example = `{\n  "questionSet": {\n    "title": "CSWP Segment 1",\n    "duration_minutes": 90,\n    "passing_marks": 75,\n    "total_marks": 105,\n    "questions": [\n      { "questionNumber": 1, "type": "numeric", "marks": 25, "text": "What is the mass?", "correctAnswer": 13313.35, "tolerancePercent": 1 }\n    ]\n  }\n}`;
  return (
    <div>
      <SecHead title="Import & Export" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
          gap: 20,
        }}
      >
        <div style={card}>
          <h3
            style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i className="fa-solid fa-file-import" style={{ color: G.accentLight }} />
            Import Exam
          </h3>
          <p style={{ color: G.textSub, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
            Upload JSON to bulk-import an entire exam set with all questions.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button style={btnS} onClick={() => fileRef.current?.click()}>
              <i className="fa-solid fa-folder-open" />
              Load File
            </button>
            <button style={btnS} onClick={() => setJsonText(example)}>
              <i className="fa-solid fa-file-code" />
              Example
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
            />
          </div>
          <textarea
            style={
              {
                ...inputSt,
                minHeight: 200,
                fontFamily: 'monospace',
                fontSize: 11,
                resize: 'vertical',
              } as React.CSSProperties
            }
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste JSON here..."
          />
          {result && (
            <div
              style={{
                color: G.green,
                fontSize: 13,
                marginTop: 8,
                padding: '8px 10px',
                background: 'rgba(52,199,89,0.1)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <i className="fa-solid fa-circle-check" />
              {result}
            </div>
          )}
          {error && (
            <div
              style={{
                color: G.red,
                fontSize: 13,
                marginTop: 8,
                padding: '8px 10px',
                background: 'rgba(255,69,58,0.1)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
              {error}
            </div>
          )}
          <button
            style={{ ...btnP, marginTop: 12, width: '100%', justifyContent: 'center' }}
            onClick={handleImport}
            disabled={importing || !jsonText.trim()}
          >
            <i className="fa-solid fa-file-import" />
            {importing ? 'Importing...' : 'Import Exam'}
          </button>
        </div>
        <div style={card}>
          <h3
            style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i className="fa-solid fa-file-export" style={{ color: G.green }} />
            Export Exam
          </h3>
          <p style={{ color: G.textSub, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
            Export any question set as JSON for backup or sharing.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Select Set</label>
            <select
              style={{ ...inputSt, cursor: 'pointer' }}
              value={exportSetId}
              onChange={(e) => setExportSetId(e.target.value)}
            >
              <option value="">— Select Set —</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <button
            style={{
              background: 'rgba(52,199,89,0.12)',
              border: '1px solid rgba(52,199,89,0.25)',
              borderRadius: 8,
              color: G.green,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              width: '100%',
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              fontFamily: "'Inter',Arial,sans-serif",
            }}
            onClick={handleExport}
            disabled={exporting || !exportSetId}
          >
            <i className="fa-solid fa-download" />
            {exporting ? 'Exporting...' : 'Download JSON'}
          </button>
          <div style={{ marginTop: 16, borderTop: `1px solid ${G.glassBorder}`, paddingTop: 14 }}>
            <div
              style={{
                color: G.textMuted,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              JSON Format Reference
            </div>
            <pre
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 6,
                padding: 10,
                fontSize: 10,
                color: G.textMuted,
                overflow: 'auto',
                maxHeight: 180,
                lineHeight: 1.6,
              }}
            >
              {example}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [pw, setPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  async function changePw() {
    setSaving(true);
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pw, new_password: newPw }),
    });
    const d = await r.json();
    if (r.ok) {
      setToast({ msg: 'Password changed!', type: 'success' });
      setPw('');
      setNewPw('');
    } else setToast({ msg: d.error || 'Failed', type: 'error' });
    setSaving(false);
  }
  const sqlSchema = `-- Run in Supabase SQL Editor → New Query
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
  thumbnail_url TEXT, difficulty TEXT DEFAULT 'Intermediate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  duration_minutes INTEGER DEFAULT 90, passing_marks INTEGER DEFAULT 75,
  total_marks INTEGER DEFAULT 105, shuffle_questions BOOLEAN DEFAULT FALSE,
  shuffle_options BOOLEAN DEFAULT FALSE, difficulty TEXT DEFAULT 'Intermediate',
  published BOOLEAN DEFAULT TRUE, auto_submit BOOLEAN DEFAULT TRUE,
  grace_period_seconds INTEGER DEFAULT 10, show_timer BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL, question_type TEXT DEFAULT 'mcq',
  marks INTEGER DEFAULT 10, question_text TEXT NOT NULL,
  correct_answer TEXT, tolerance_percent NUMERIC DEFAULT 1,
  download_link TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS question_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, display_order INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS mcq_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL, is_correct BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_set_id UUID REFERENCES question_sets(id),
  attempt_code TEXT, score INTEGER DEFAULT 0,
  percentage NUMERIC DEFAULT 0, passed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(), submitted_at TIMESTAMPTZ,
  time_used INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  user_answer TEXT, is_correct BOOLEAN DEFAULT FALSE, marks_obtained INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_password_hash TEXT NOT NULL,
  allow_tab_switch BOOLEAN DEFAULT FALSE,
  fullscreen_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
-- Public read policies
CREATE POLICY "pub_cat" ON categories FOR SELECT USING (true);
CREATE POLICY "pub_sets" ON question_sets FOR SELECT USING (published = true);
CREATE POLICY "pub_q" ON questions FOR SELECT USING (true);
CREATE POLICY "pub_img" ON question_images FOR SELECT USING (true);
CREATE POLICY "pub_opt" ON mcq_options FOR SELECT USING (true);
CREATE POLICY "ins_att" ON exam_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "sel_att" ON exam_attempts FOR SELECT USING (true);
CREATE POLICY "ins_ans" ON user_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "sel_ans" ON user_answers FOR SELECT USING (true);
-- Full access (backend)
CREATE POLICY "all_cat" ON categories FOR ALL USING (true);
CREATE POLICY "all_sets" ON question_sets FOR ALL USING (true);
CREATE POLICY "all_q" ON questions FOR ALL USING (true);
CREATE POLICY "all_img" ON question_images FOR ALL USING (true);
CREATE POLICY "all_opt" ON mcq_options FOR ALL USING (true);
CREATE POLICY "all_adm" ON admin_settings FOR ALL USING (true);`;
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <SecHead title="Settings" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
          gap: 20,
        }}
      >
        <div style={card}>
          <h3
            style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i className="fa-solid fa-lock" style={{ color: G.accentLight }} />
            Change Password
          </h3>
          <div style={{ marginBottom: 10 }}>
            <label style={labelSt}>Current Password</label>
            <input
              type="password"
              style={inputSt}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Current password..."
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>New Password</label>
            <input
              type="password"
              style={inputSt}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password..."
            />
          </div>
          <button
            style={{ ...btnP, width: '100%', justifyContent: 'center' }}
            onClick={changePw}
            disabled={saving || !pw || !newPw || newPw.length < 3}
          >
            <i className="fa-solid fa-key" />
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </div>
        <div style={card}>
          <h3
            style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <i className="fa-solid fa-database" style={{ color: G.green }} />
            Database Setup SQL
          </h3>
          <p style={{ color: G.textSub, fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
            Run in <strong style={{ color: '#fff' }}>Supabase &rarr; SQL Editor</strong> to create
            all tables.
          </p>
          <button
            style={btnS}
            onClick={() => {
              navigator.clipboard.writeText(sqlSchema);
              setToast({ msg: 'SQL copied to clipboard!', type: 'success' });
            }}
          >
            <i className="fa-solid fa-copy" />
            Copy SQL
          </button>
          <pre
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              padding: 10,
              fontSize: 9,
              color: G.textMuted,
              overflow: 'auto',
              maxHeight: 300,
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            {sqlSchema}
          </pre>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
  { id: 'categories', icon: 'fa-folder', label: 'Categories' },
  { id: 'sets', icon: 'fa-clipboard-list', label: 'Question Sets' },
  { id: 'questions', icon: 'fa-circle-question', label: 'Questions' },
  { id: 'import', icon: 'fa-file-import', label: 'Import / Export' },
  { id: 'settings', icon: 'fa-gear', label: 'Settings' },
];

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState('analytics');
  const [time, setTime] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    const up = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    up();
    const t = setInterval(up, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: G.pageBg,
        fontFamily: "'Inter',Arial,sans-serif",
        color: G.text,
      }}
    >
      <nav
        style={{
          height: 52,
          background: G.navBg,
          borderBottom: `1px solid ${G.glassBorder}`,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${G.glassBorder}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              color: G.textSub,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fa-solid fa-bars" style={{ fontSize: 13 }} />
          </button>
          <i className="fa-solid fa-pen-ruler" style={{ color: G.accentLight, fontSize: 18 }} />
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>TesterPRO Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              color: G.textMuted,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <i className="fa-solid fa-clock" style={{ fontSize: 10 }} />
            {time}
          </span>
          <a
            href="/"
            style={{
              color: G.textMuted,
              textDecoration: 'none',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <i className="fa-solid fa-house" style={{ fontSize: 11 }} />
            Portal
          </a>
          <button onClick={onLogout} style={{ ...btnS, fontSize: 11, padding: '5px 10px' }}>
            <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 10 }} />
            Logout
          </button>
        </div>
      </nav>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && (
          <div
            style={{
              width: 200,
              background: 'rgba(5,5,18,0.98)',
              borderRight: `1px solid ${G.glassBorder}`,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              padding: '12px 8px',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: G.textMuted,
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding: '4px 8px',
                marginBottom: 6,
              }}
            >
              Admin Controls
            </div>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: tab === t.id ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: tab === t.id ? G.accentLight : G.textMuted,
                  fontSize: 13,
                  fontWeight: tab === t.id ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  transition: 'all 0.15s',
                  fontFamily: "'Inter',Arial,sans-serif",
                }}
              >
                <i
                  className={`fa-solid ${t.icon}`}
                  style={{ fontSize: 13, width: 16, textAlign: 'center' }}
                />
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'sets' && <QuestionSetsTab />}
          {tab === 'questions' && <QuestionsTab />}
          {tab === 'import' && <ImportExportTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
      <style>{`
        @media(max-width:768px){
          nav span:not(:first-child){display:none;}
          .sidebar{width:60px!important;}
          .sidebar span{display:none!important;}
        }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (t === 'authenticated') setAuthed(true);
    setChecked(true);
  }, []);
  function handleLogout() {
    localStorage.removeItem('admin_token');
    setAuthed(false);
  }
  if (!checked)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: G.pageBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, color: G.accentLight }} />
      </div>
    );
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
