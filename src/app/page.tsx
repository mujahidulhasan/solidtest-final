'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ── Types ── */
interface Category {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: string;
}
interface QuestionSet {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  difficulty: string;
  published: boolean;
  auto_submit: boolean;
  grace_period_seconds: number;
  show_timer: boolean;
}

const diffColors: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: 'rgba(52,199,89,0.15)', text: '#34c759' },
  Intermediate: { bg: 'rgba(255,159,10,0.15)', text: '#ff9f0a' },
  Advanced: { bg: 'rgba(255,69,58,0.15)', text: '#ff453a' },
  Expert: { bg: 'rgba(175,82,222,0.15)', text: '#af52de' },
};

const catIcons = [
  'fa-certificate',
  'fa-graduation-cap',
  'fa-gear',
  'fa-ruler-combined',
  'fa-wrench',
  'fa-chart-bar',
  'fa-bolt',
  'fa-clipboard-list',
];

/* ── Theme ── */
const LIGHT = {
  pageBg: 'linear-gradient(135deg,#e8eaf6 0%,#f3e5f5 50%,#e3f2fd 100%)',
  glass: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.8)',
  glassHover: 'rgba(255,255,255,0.75)',
  navBg: 'rgba(255,255,255,0.6)',
  navBorder: 'rgba(255,255,255,0.9)',
  text: '#1a1a2e',
  textSub: '#4a4a6a',
  textMuted: '#8888aa',
  accent: '#5c6bc0',
  accentBg: 'rgba(92,107,192,0.12)',
  accentText: '#3949ab',
  shadow: '0 8px 32px rgba(92,107,192,0.15)',
  cardShadow: '0 4px 24px rgba(0,0,0,0.08)',
};
const DARK = {
  pageBg: 'linear-gradient(135deg,#0a0a1a 0%,#0d1b3e 50%,#0a1628 100%)',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHover: 'rgba(255,255,255,0.1)',
  navBg: 'rgba(10,10,26,0.7)',
  navBorder: 'rgba(255,255,255,0.1)',
  text: '#f0f0ff',
  textSub: 'rgba(240,240,255,0.6)',
  textMuted: 'rgba(240,240,255,0.35)',
  accent: '#7986cb',
  accentBg: 'rgba(121,134,203,0.15)',
  accentText: '#9fa8da',
  shadow: '0 8px 32px rgba(0,0,0,0.4)',
  cardShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

type Step = 'category' | 'set' | 'rules';

export default function LandingPage() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [step, setStep] = useState<Step>('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selCat, setSelCat] = useState<Category | null>(null);
  const [selSet, setSelSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [setsLoading, setSetsLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    const saved = localStorage.getItem('tp_theme');
    if (saved) setDark(saved === 'dark');
  }, []);

  function toggleDark() {
    setDark((d) => {
      localStorage.setItem('tp_theme', !d ? 'dark' : 'light');
      return !d;
    });
  }

  useEffect(() => {
    setLoading(true);
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        setCategories(Array.isArray(d) ? d : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const loadSets = useCallback(async (cat: Category) => {
    setSetsLoading(true);
    setSelCat(cat);
    setStep('set');
    try {
      const r = await fetch(`/api/question-sets?category_id=${cat.id}`);
      const d = await r.json();
      setQuestionSets(Array.isArray(d) ? d : []);
    } catch {
      setQuestionSets([]);
    } finally {
      setSetsLoading(false);
    }
  }, []);

  function selectSet(s: QuestionSet) {
    setSelSet(s);
    setStep('rules');
  }
  function startExam() {
    if (selSet) router.push(`/exam/${selSet.id}`);
  }

  const glassCard: React.CSSProperties = {
    background: T.glass,
    border: `1px solid ${T.glassBorder}`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    boxShadow: T.cardShadow,
  };
  const inputBase: React.CSSProperties = {
    fontFamily: "'Inter', Arial, sans-serif",
    fontSize: '14px',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.pageBg,
        fontFamily: "'Inter', Arial, sans-serif",
        color: T.text,
        transition: 'background 0.3s',
      }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: T.navBg,
          borderBottom: `1px solid ${T.navBorder}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: T.accentBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="fa-solid fa-pen-ruler" style={{ color: T.accent, fontSize: 16 }} />
            </div>
            <div>
              <div
                style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: T.text }}
              >
                TesterPRO
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.5px' }}>
                CERTIFICATION PORTAL
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleDark}
              style={{
                background: T.glass,
                border: `1px solid ${T.glassBorder}`,
                borderRadius: 10,
                padding: '8px 14px',
                color: T.text,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                ...inputBase,
              }}
            >
              <i
                className={dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}
                style={{ fontSize: 14 }}
              />
              {dark ? 'Light' : 'Dark'}
            </button>
            <a
              href="/admin"
              style={{
                background: T.accentBg,
                border: `1px solid ${T.accent}33`,
                borderRadius: 10,
                padding: '8px 16px',
                color: T.accentText,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ fontSize: 13 }} /> Admin
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div
        style={{ textAlign: 'center', padding: '48px 24px 32px', maxWidth: 700, margin: '0 auto' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: T.accentBg,
            border: `1px solid ${T.accent}33`,
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: T.accentText,
            marginBottom: 20,
          }}
        >
          <i className="fa-solid fa-circle" style={{ fontSize: 7, color: '#34c759' }} /> Live
          Certification Simulator
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px,5vw,48px)',
            fontWeight: 900,
            lineHeight: 1.1,
            margin: '0 0 16px',
            letterSpacing: '-1px',
            color: T.text,
          }}
        >
          Master Your Engineering
          <br />
          <span style={{ color: T.accent }}>Certification Exams</span>
        </h1>
        <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, margin: 0 }}>
          Practice SOLIDWORKS CSWA, CSWP and more with realistic exam conditions, engineering
          tolerance validation, and instant results.
        </p>
      </div>

      {/* ── STEP BREADCRUMB ── */}
      <div style={{ maxWidth: 900, margin: '0 auto 32px', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          {(['category', 'set', 'rules'] as Step[]).map((s, idx) => {
            const labels = ['Select Exam Type', 'Choose Question Set', 'Review & Start'];
            const icons = ['fa-list', 'fa-folder-open', 'fa-play'];
            const isActive = step === s;
            const isDone = (step === 'set' && idx === 0) || (step === 'rules' && idx < 2);
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: isActive ? 1 : isDone ? 0.8 : 0.4,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? T.accent : isDone ? T.accentBg : T.glass,
                      border: `1px solid ${isActive ? T.accent : T.glassBorder}`,
                      fontSize: 12,
                    }}
                  >
                    <i
                      className={`fa-solid ${isDone ? 'fa-check' : icons[idx]}`}
                      style={{ color: isActive ? '#fff' : T.accentText }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? T.text : T.textSub,
                      display: 'none',
                    }}
                    className="step-label"
                  >
                    {labels[idx]}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? T.text : T.textSub,
                    }}
                  >
                    {labels[idx]}
                  </span>
                </div>
                {idx < 2 && <div style={{ width: 40, height: 1, background: T.glassBorder }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        {/* STEP 1: CATEGORIES */}
        {step === 'category' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: T.text }}>
              <i className="fa-solid fa-certificate" style={{ marginRight: 10, color: T.accent }} />
              Select Certification Type
            </h2>
            {loading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
                  gap: 16,
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{ ...glassCard, height: 160, animation: 'pulse 1.5s infinite' }}
                  />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div style={{ ...glassCard, padding: 48, textAlign: 'center' }}>
                <i
                  className="fa-solid fa-folder-open"
                  style={{ fontSize: 48, color: T.textMuted, display: 'block', marginBottom: 16 }}
                />
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                  No Exams Available
                </div>
                <div style={{ color: T.textSub, marginBottom: 20 }}>
                  Add exam categories from the Admin Panel to get started.
                </div>
                <a
                  href="/admin"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: T.accentBg,
                    border: `1px solid ${T.accent}44`,
                    borderRadius: 10,
                    color: T.accentText,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <i className="fa-solid fa-shield-halved" /> Open Admin Panel
                </a>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
                  gap: 16,
                }}
              >
                {categories.map((cat, idx) => {
                  const dc = diffColors[cat.difficulty] || diffColors.Intermediate;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => loadSets(cat)}
                      style={{
                        ...glassCard,
                        padding: 24,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.25s',
                        border: `1px solid ${T.glassBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = T.glassHover;
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = T.shadow;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = T.glass;
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                        (e.currentTarget as HTMLElement).style.boxShadow = T.cardShadow;
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: T.accentBg,
                            border: `1px solid ${T.accent}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {cat.thumbnail_url ? (
                            <img
                              src={cat.thumbnail_url}
                              alt=""
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <i
                              className={`fa-solid ${catIcons[idx % catIcons.length]}`}
                              style={{ color: T.accent, fontSize: 20 }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: dc.bg,
                            color: dc.text,
                          }}
                        >
                          {cat.difficulty}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}
                      >
                        {cat.title}
                      </div>
                      {cat.description && (
                        <div
                          style={{
                            fontSize: 13,
                            color: T.textSub,
                            lineHeight: 1.5,
                            marginBottom: 14,
                          }}
                        >
                          {cat.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: T.accentText,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        <span>Select this exam</span>
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: QUESTION SETS */}
        {step === 'set' && selCat && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => setStep('category')}
                style={{
                  background: T.glass,
                  border: `1px solid ${T.glassBorder}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  color: T.text,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="fa-solid fa-arrow-left" style={{ fontSize: 12 }} /> Back
              </button>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: T.text }}>
                  <i
                    className="fa-solid fa-folder-open"
                    style={{ marginRight: 10, color: T.accent }}
                  />
                  {selCat.title}
                </h2>
                <div style={{ fontSize: 13, color: T.textSub, marginTop: 3 }}>
                  Choose a question set to begin
                </div>
              </div>
            </div>
            {setsLoading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                  gap: 16,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ ...glassCard, height: 200 }} />
                ))}
              </div>
            ) : questionSets.length === 0 ? (
              <div style={{ ...glassCard, padding: 48, textAlign: 'center' }}>
                <i
                  className="fa-solid fa-inbox"
                  style={{ fontSize: 48, color: T.textMuted, display: 'block', marginBottom: 16 }}
                />
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                  No Question Sets
                </div>
                <div style={{ color: T.textSub }}>
                  This category has no published exam sets yet.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                  gap: 16,
                }}
              >
                {questionSets.map((s) => {
                  const passRate =
                    s.total_marks > 0 ? Math.round((s.passing_marks / s.total_marks) * 100) : 0;
                  return (
                    <div key={s.id} style={{ ...glassCard, padding: 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 14,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            margin: 0,
                            color: T.text,
                            flex: 1,
                            marginRight: 10,
                          }}
                        >
                          {s.title}
                        </h3>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: (diffColors[s.difficulty] || diffColors.Intermediate).bg,
                            color: (diffColors[s.difficulty] || diffColors.Intermediate).text,
                            flexShrink: 0,
                          }}
                        >
                          {s.difficulty}
                        </span>
                      </div>
                      {s.description && (
                        <div
                          style={{
                            fontSize: 13,
                            color: T.textSub,
                            marginBottom: 14,
                            lineHeight: 1.5,
                          }}
                        >
                          {s.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                          marginBottom: 16,
                        }}
                      >
                        {[
                          { icon: 'fa-clock', label: 'Duration', val: `${s.duration_minutes} min` },
                          { icon: 'fa-star', label: 'Total Marks', val: `${s.total_marks} pts` },
                          { icon: 'fa-trophy', label: 'Pass Score', val: `${s.passing_marks} pts` },
                          { icon: 'fa-percent', label: 'Pass Rate', val: `${passRate}%` },
                        ].map((r) => (
                          <div
                            key={r.label}
                            style={{
                              background: T.glass,
                              border: `1px solid ${T.glassBorder}`,
                              borderRadius: 10,
                              padding: '10px 12px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: T.textMuted,
                                marginBottom: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <i className={`fa-solid ${r.icon}`} style={{ fontSize: 9 }} />{' '}
                              {r.label}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                              {r.val}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => selectSet(s)}
                        style={{
                          width: '100%',
                          padding: '11px',
                          borderRadius: 10,
                          background: T.accentBg,
                          border: `1px solid ${T.accent}44`,
                          color: T.accentText,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <i className="fa-solid fa-arrow-right" /> Select This Set
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: RULES & START */}
        {step === 'rules' && selSet && selCat && (
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <button
                onClick={() => setStep('set')}
                style={{
                  background: T.glass,
                  border: `1px solid ${T.glassBorder}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  color: T.text,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="fa-solid fa-arrow-left" style={{ fontSize: 12 }} /> Back
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: T.text }}>
                <i
                  className="fa-solid fa-clipboard-check"
                  style={{ marginRight: 10, color: T.accent }}
                />
                Exam Information
              </h2>
            </div>

            <div style={{ ...glassCard, padding: 32, marginBottom: 20 }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 28,
                  paddingBottom: 24,
                  borderBottom: `1px solid ${T.glassBorder}`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: T.accentBg,
                    border: `1px solid ${T.accent}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i
                    className="fa-solid fa-file-circle-check"
                    style={{ color: T.accent, fontSize: 24 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{selSet.title}</div>
                  <div style={{ fontSize: 13, color: T.textSub, marginTop: 3 }}>{selCat.title}</div>
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 12,
                  marginBottom: 28,
                }}
              >
                {[
                  {
                    icon: 'fa-clock',
                    label: 'Duration',
                    val: `${selSet.duration_minutes} min`,
                    color: '#5c6bc0',
                  },
                  {
                    icon: 'fa-star',
                    label: 'Total Marks',
                    val: `${selSet.total_marks} pts`,
                    color: '#ff9f0a',
                  },
                  {
                    icon: 'fa-trophy',
                    label: 'Pass Score',
                    val: `${selSet.passing_marks} pts`,
                    color: '#34c759',
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    style={{
                      background: T.glass,
                      border: `1px solid ${T.glassBorder}`,
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'center',
                    }}
                  >
                    <i
                      className={`fa-solid ${r.icon}`}
                      style={{ fontSize: 20, color: r.color, display: 'block', marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{r.val}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{r.label}</div>
                  </div>
                ))}
              </div>

              {/* Rules */}
              <div
                style={{
                  background: dark ? 'rgba(255,159,10,0.08)' : 'rgba(255,159,10,0.06)',
                  border: '1px solid rgba(255,159,10,0.25)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                    color: '#ff9f0a',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation" /> Exam Rules & Conditions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['fa-stopwatch', 'Timer starts immediately when you click Start Exam'],
                    ['fa-floppy-disk', 'Your answers are auto-saved every time you change them'],
                    [
                      'fa-arrows-rotate',
                      'Refreshing the page will restore your session automatically',
                    ],
                    ['fa-eye', 'Tab switching is monitored and recorded in your session'],
                    [
                      'fa-calculator',
                      `Numeric answers use ±tolerance validation (engineering standard)`,
                    ],
                    [
                      'fa-bolt',
                      selSet.auto_submit
                        ? `Exam auto-submits when time expires (${selSet.grace_period_seconds}s grace period)`
                        : 'Timer will show warning but you control submission',
                    ],
                    ['fa-pause', 'You can pause the exam at any time using the Pause button'],
                  ].map(([icon, text]) => (
                    <div
                      key={text as string}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    >
                      <i
                        className={`fa-solid ${icon}`}
                        style={{ color: '#ff9f0a', fontSize: 12, marginTop: 3, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                {[
                  {
                    icon: 'fa-shuffle',
                    text: selSet.auto_submit ? 'Auto-Submit' : 'Manual Submit',
                  },
                  { icon: 'fa-eye', text: selSet.show_timer ? 'Timer Visible' : 'Timer Hidden' },
                ].map((f) => (
                  <div
                    key={f.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      background: T.accentBg,
                      border: `1px solid ${T.accent}33`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.accentText,
                    }}
                  >
                    <i className={`fa-solid ${f.icon}`} style={{ fontSize: 11 }} /> {f.text}
                  </div>
                ))}
              </div>

              <button
                onClick={startExam}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: 12,
                  background: T.accent,
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  letterSpacing: '-0.2px',
                  boxShadow: `0 4px 24px ${T.accent}55`,
                }}
              >
                <i className="fa-solid fa-play" /> Start Exam Now
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @media(max-width:640px){
          .step-label { display:none!important; }
        }
      `}</style>
    </div>
  );
}
