'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

/* ── Types ── */
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
  question_number: number;
  question_type: 'mcq' | 'numeric';
  marks: number;
  question_text: string;
  correct_answer: string;
  tolerance_percent: number;
  download_link: string | null;
  images: QuestionImage[];
  options: MCQOption[];
}
interface QuestionSet {
  id: string;
  title: string;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  auto_submit: boolean;
  grace_period_seconds: number;
  show_timer: boolean;
  categories?: { title: string };
}
type Status = 'unvisited' | 'viewed' | 'answered' | 'flagged';

function checkAnswer(ua: string, ca: string, tol: number, type: string): boolean {
  if (!ua.trim()) return false;
  if (type === 'mcq') return ua.trim() === ca.trim();
  const u = parseFloat(ua),
    c = parseFloat(ca);
  if (isNaN(u) || isNaN(c)) return ua.trim().toLowerCase() === ca.trim().toLowerCase();
  if (c === 0) return Math.abs(u) < 0.0001;
  const allowed = Math.abs(c * (tol / 100));
  return u >= c - allowed && u <= c + allowed;
}

const STORAGE_KEY = 'exam_state_';
const STATUS_COLORS: Record<Status, string> = {
  unvisited: 'rgba(255,255,255,0.08)',
  viewed: '#1d4ed8',
  answered: '#15803d',
  flagged: '#b45309',
};
const STATUS_LABELS: [Status, string, string][] = [
  ['unvisited', 'Not Visited', 'rgba(255,255,255,0.3)'],
  ['viewed', 'Viewed', '#60a5fa'],
  ['answered', 'Answered', '#4ade80'],
  ['flagged', 'Flagged', '#fbbf24'],
];

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const setId = params.setId as string;

  const [qSet, setQSet] = useState<QuestionSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [gracePeriod, setGracePeriod] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const [mobileView, setMobileView] = useState<'question' | 'answer'>('question');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptCode = useRef('');

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let score = 0;
    const answerPayload = questions.map((q) => {
      const ua = answers[q.id] || '';
      const correct = checkAnswer(ua, q.correct_answer, q.tolerance_percent, q.question_type);
      const marks = correct ? q.marks : 0;
      score += marks;
      return { question_id: q.id, user_answer: ua, is_correct: correct, marks_obtained: marks };
    });

    const totalMarks = qSet?.total_marks || questions.reduce((s, q) => s + q.marks, 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 10) / 10 : 0;
    const passed = score >= (qSet?.passing_marks || 0);
    const timeUsed = (qSet?.duration_minutes || 0) * 60 - timeLeft;

    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_set_id: setId,
          attempt_code: attemptCode.current,
          score,
          percentage,
          passed,
          time_used: timeUsed,
          answers: answerPayload,
        }),
      });
      const data = await res.json();
      const resultData = {
        score,
        percentage,
        passed,
        timeUsed,
        totalMarks,
        passingMarks: qSet?.passing_marks || 0,
        setTitle: qSet?.title || '',
        attempt_id: data.attempt_id,
        answers: answerPayload,
        questions: questions.map((q) => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text,
          correct_answer: q.correct_answer,
          marks: q.marks,
          tolerance_percent: q.tolerance_percent,
          question_type: q.question_type,
        })),
      };
      localStorage.removeItem(STORAGE_KEY + setId);
      localStorage.setItem('exam_result', JSON.stringify(resultData));
      router.push(passed ? '/result/passed' : '/result/failed');
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }, [answers, questions, qSet, setId, timeLeft, submitting, router]);

  /* Load exam */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const rnd = new Uint32Array(4);
      window.crypto.getRandomValues(rnd);
      attemptCode.current =
        'a-' +
        Array.from(rnd)
          .map((n) => n.toString(16).padStart(8, '0'))
          .join('');
      function shuffle<T>(arr: T[]): T[] {
        const a = [...arr],
          r = new Uint32Array(a.length);
        window.crypto.getRandomValues(r);
        for (let i = a.length - 1; i > 0; i--) {
          const j = Number(r[i]) % (i + 1);
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }
      try {
        const [setRes, qRes] = await Promise.all([
          fetch(`/api/question-sets/${setId}`),
          fetch(`/api/questions/${setId}`),
        ]);
        if (!setRes.ok || !qRes.ok) throw new Error('load failed');
        const setData: QuestionSet = await setRes.json();
        let qData: Question[] = await qRes.json();
        if (setData.shuffle_questions) qData = shuffle(qData);
        if (setData.shuffle_options)
          qData = qData.map((q) => ({ ...q, options: shuffle(q.options) }));
        setQSet(setData);
        setQuestions(qData);
        const saved = localStorage.getItem(STORAGE_KEY + setId);
        if (saved) {
          const s = JSON.parse(saved);
          if (s.attemptCode) attemptCode.current = s.attemptCode;
          setAnswers(s.answers || {});
          setStatuses(s.statuses || {});
          setCurrentIdx(s.currentIdx || 0);
          setTimeLeft(s.timeLeft ?? setData.duration_minutes * 60);
        } else {
          setTimeLeft(setData.duration_minutes * 60);
          const init: Record<string, Status> = {};
          qData.forEach((q) => {
            init[q.id] = 'unvisited';
          });
          setStatuses(init);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (setId) load();
  }, [setId]);

  /* Timer */
  useEffect(() => {
    if (!qSet || loading) return;
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qSet, loading, paused]);

  /* Auto submit */
  useEffect(() => {
    if (timeLeft === 0 && !loading && qSet && !submitting && !paused) {
      if (qSet.auto_submit) {
        if (qSet.grace_period_seconds > 0) setGracePeriod(qSet.grace_period_seconds);
        else handleSubmit();
      }
    }
  }, [timeLeft, loading, qSet, submitting, paused, handleSubmit]);

  /* Grace period */
  useEffect(() => {
    if (gracePeriod === null) return;
    if (gracePeriod <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setGracePeriod((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [gracePeriod, handleSubmit]);

  /* Persist */
  useEffect(() => {
    if (!qSet || loading) return;
    localStorage.setItem(
      STORAGE_KEY + setId,
      JSON.stringify({ answers, statuses, currentIdx, timeLeft, attemptCode: attemptCode.current })
    );
  }, [answers, statuses, currentIdx, timeLeft, qSet, loading, setId]);

  /* Tab switch */
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === 'hidden') {
        setTabSwitches((p) => p + 1);
        setTabWarning(true);
      }
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* Mark viewed */
  const cqId = questions[currentIdx]?.id;
  useEffect(() => {
    if (!cqId) return;
    setStatuses((prev) => (prev[cqId] === 'unvisited' ? { ...prev, [cqId]: 'viewed' } : prev));
    setActiveImage(0);
    setZoom(1);
  }, [currentIdx, cqId]);

  function handleAnswer(qId: string, val: string) {
    setAnswers((p) => ({ ...p, [qId]: val }));
    setStatuses((p) => ({ ...p, [qId]: 'answered' }));
  }
  function toggleFlag(qId: string) {
    setStatuses((p) => ({
      ...p,
      [qId]: p[qId] === 'flagged' ? (answers[qId] ? 'answered' : 'viewed') : 'flagged',
    }));
  }
  function formatTime(s: number) {
    const m = Math.floor(Math.abs(s) / 60),
      sec = Math.abs(s) % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function handlePause() {
    setPaused(true);
    setShowPauseOverlay(true);
  }
  function handleResume() {
    setPaused(false);
    setShowPauseOverlay(false);
  }

  const answered = Object.values(statuses).filter((s) => s === 'answered').length;
  const flagged = Object.values(statuses).filter((s) => s === 'flagged').length;
  const timerPct = qSet ? (timeLeft / (qSet.duration_minutes * 60)) * 100 : 100;
  const timerColor = timeLeft < 300 ? '#ff453a' : timeLeft < 600 ? '#ff9f0a' : '#34c759';

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg,#0a0a1a,#0d1b3e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter',Arial,sans-serif",
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <i
          className="fa-solid fa-gear fa-spin"
          style={{ fontSize: 40, color: 'rgba(99,102,241,0.8)' }}
        />
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500 }}>
          Loading Exam...
        </div>
      </div>
    );

  if (!qSet || questions.length === 0)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg,#0a0a1a,#0d1b3e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter',Arial,sans-serif",
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <i className="fa-solid fa-inbox" style={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>No Questions Found</div>
        <a
          href="/"
          style={{
            padding: '10px 24px',
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 10,
            color: '#818cf8',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }} />
          Back to Portal
        </a>
      </div>
    );

  const q = questions[currentIdx];
  const imgs = (q?.images || []).sort((a, b) => a.display_order - b.display_order);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#070713',
        fontFamily: "'Inter',Arial,sans-serif",
        color: '#f0f0ff',
      }}
    >
      {/* ── TOP BAR ── */}
      <div
        style={{
          height: 52,
          background: 'rgba(10,10,26,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          flexShrink: 0,
          gap: 12,
        }}
      >
        <a
          href="/"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-house" style={{ fontSize: 13 }} />
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {qSet.title}
          </div>
          {qSet.categories && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {qSet.categories.title}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {tabSwitches > 0 && (
            <span
              style={{
                color: '#ff9f0a',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 10 }} />
              {tabSwitches}
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Q{currentIdx + 1}/{questions.length}
          </span>
          <button
            onClick={handlePause}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,159,10,0.15)',
              border: '1px solid rgba(255,159,10,0.3)',
              borderRadius: 8,
              color: '#ff9f0a',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="fa-solid fa-pause" style={{ fontSize: 11 }} /> Pause
          </button>
          <button
            onClick={() => setShowSummary(true)}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,69,58,0.15)',
              border: '1px solid rgba(255,69,58,0.3)',
              borderRadius: 8,
              color: '#ff453a',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }} /> Submit
          </button>
        </div>
      </div>

      {/* ── MOBILE TAB BAR ── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,10,26,0.9)',
          flexShrink: 0,
        }}
        className="mobile-tabs"
      >
        {(['question', 'answer'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${mobileView === v ? '#6366f1' : 'transparent'}`,
              color: mobileView === v ? '#818cf8' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <i
              className={`fa-solid ${v === 'question' ? 'fa-file-lines' : 'fa-pen'}`}
              style={{ fontSize: 12 }}
            />
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: Navigator + Question + Image */}
        <div
          style={{
            width: '65%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
          className={`exam-left ${mobileView === 'answer' ? 'mobile-hide' : ''}`}
        >
          {/* Question Palette */}
          <div
            style={{
              background: 'rgba(10,10,22,0.98)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 14px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              QUESTION NAVIGATOR
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {questions.map((qi, idx) => {
                const s = statuses[qi.id] || 'unvisited';
                const isCur = currentIdx === idx;
                return (
                  <button
                    key={qi.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      border: `1px solid ${isCur ? '#6366f1' : 'transparent'}`,
                      background: isCur ? '#6366f1' : STATUS_COLORS[s],
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: isCur ? '2px solid rgba(99,102,241,0.4)' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    {qi.question_number}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              {STATUS_LABELS.map(([status, label, color]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: STATUS_COLORS[status],
                      border: `1px solid ${color}44`,
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question + Images */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            {/* Question Text */}
            <div
              style={{
                width: imgs.length > 0 ? '45%' : '100%',
                borderRight: imgs.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                overflowY: 'auto',
                padding: 18,
                background: 'rgba(8,8,20,0.98)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: '#818cf8',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                  }}
                >
                  Question {q?.question_number}
                </span>
                <span
                  style={{
                    background: 'rgba(255,159,10,0.15)',
                    border: '1px solid rgba(255,159,10,0.25)',
                    color: '#ff9f0a',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                  }}
                >
                  <i className="fa-solid fa-star" style={{ marginRight: 4, fontSize: 9 }} />
                  {q?.marks} pts
                </span>
              </div>
              <div
                style={{
                  color: 'rgba(240,240,255,0.85)',
                  fontSize: 13.5,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {q?.question_text}
              </div>
              {q?.download_link && (
                <a
                  href={q.download_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    marginTop: 16,
                    padding: '8px 14px',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#818cf8',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <i className="fa-solid fa-download" /> Download CAD Model
                </a>
              )}
              <div
                style={{
                  marginTop: 16,
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: 10,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  {q?.question_type === 'mcq' ? 'MCQ' : 'Numeric'}
                </span>
                {q?.question_type === 'numeric' && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    ±{q?.tolerance_percent}% tolerance
                  </span>
                )}
              </div>
            </div>

            {/* Image Viewer */}
            {imgs.length > 0 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(6,6,16,0.98)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                    style={{
                      padding: '4px 9px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass-plus" style={{ fontSize: 11 }} />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                    style={{
                      padding: '4px 9px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass-minus" style={{ fontSize: 11 }} />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    style={{
                      padding: '4px 9px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    <i className="fa-solid fa-rotate-left" />
                  </button>
                  <span
                    style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                  >
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  <img
                    src={imgs[activeImage]?.image_url}
                    alt={`Drawing ${activeImage + 1}`}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.2s',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).insertAdjacentHTML(
                        'afterend',
                        '<div style="color:rgba(255,255,255,0.3);text-align:center;padding:20px"><i class=\"fa-solid fa-image-slash\" style=\"font-size:32px;display:block;margin-bottom:8px\"></i>Image unavailable</div>'
                      );
                    }}
                  />
                </div>
                {imgs.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      padding: '8px 12px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {imgs.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(idx)}
                        style={{
                          width: 40,
                          height: 32,
                          borderRadius: 6,
                          overflow: 'hidden',
                          padding: 0,
                          border: `2px solid ${activeImage === idx ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
                          background: 'rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={img.image_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Timer + Answer */}
        <div
          style={{
            width: '35%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(8,8,20,0.98)',
            overflow: 'hidden',
          }}
          className={`exam-right ${mobileView === 'question' ? 'mobile-hide' : ''}`}
        >
          {/* Timer */}
          {qSet.show_timer && (
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.3)',
                    fontWeight: 800,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <i
                    className="fa-solid fa-clock"
                    style={{ fontSize: 10, color: paused ? '#ff9f0a' : 'rgba(255,255,255,0.3)' }}
                  />{' '}
                  {paused ? 'PAUSED' : 'TIME REMAINING'}
                </div>
                {paused && (
                  <span style={{ fontSize: 10, color: '#ff9f0a', fontWeight: 700 }}>● PAUSED</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: paused ? '#ff9f0a' : timerColor,
                  letterSpacing: '1px',
                  marginBottom: 8,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(timeLeft)}
              </div>
              <div
                style={{
                  height: 5,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, timerPct))}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: timerColor,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
              {timeLeft > 0 && timeLeft < 300 && !paused && (
                <div
                  style={{
                    color: '#ff453a',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 10 }} /> Less
                  than 5 minutes remaining!
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
              display: 'flex',
              gap: 8,
            }}
          >
            {[
              { label: 'Answered', val: answered, color: '#4ade80', icon: 'fa-circle-check' },
              { label: 'Flagged', val: flagged, color: '#fbbf24', icon: 'fa-flag' },
              { label: 'Total', val: questions.length, color: '#818cf8', icon: 'fa-list' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  padding: '8px 4px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    marginBottom: 2,
                  }}
                >
                  <i className={`fa-solid ${s.icon}`} style={{ fontSize: 9, color: s.color }} />
                  <span style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.val}</span>
                </div>
                <div
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}
                >
                  {s.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Q Info */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#818cf8', fontSize: 13, fontWeight: 700 }}>
              Q{q?.question_number}
            </span>
            <span style={{ color: '#ff9f0a', fontSize: 12, fontWeight: 600 }}>
              <i className="fa-solid fa-star" style={{ fontSize: 9, marginRight: 3 }} />
              {q?.marks} pts
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                background:
                  q?.question_type === 'mcq' ? 'rgba(99,102,241,0.15)' : 'rgba(52,199,89,0.15)',
                color: q?.question_type === 'mcq' ? '#818cf8' : '#4ade80',
                marginLeft: 'auto',
              }}
            >
              {q?.question_type === 'mcq' ? 'MCQ' : 'Numeric'}
            </span>
            {statuses[q?.id] === 'flagged' && (
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'rgba(180,83,9,0.2)',
                  color: '#fbbf24',
                }}
              >
                <i className="fa-solid fa-flag" style={{ fontSize: 9, marginRight: 3 }} />
                Flagged
              </span>
            )}
          </div>

          {/* Answer Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {q?.question_type === 'mcq' ? (
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.3)',
                    fontWeight: 800,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  SELECT YOUR ANSWER
                </div>
                {q.options.map((opt) => {
                  const sel = answers[q.id] === opt.option_text;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(q.id, opt.option_text)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 13px',
                        borderRadius: 10,
                        marginBottom: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: sel ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                        color: sel ? '#c7d2fe' : 'rgba(240,240,255,0.7)',
                        fontSize: 13,
                        lineHeight: '1.5',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: sel ? '#6366f1' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${sel ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {sel && (
                          <i className="fa-solid fa-check" style={{ fontSize: 9, color: '#fff' }} />
                        )}
                      </div>
                      {opt.option_text}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.3)',
                    fontWeight: 800,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  ENTER NUMERIC ANSWER
                </div>
                <input
                  type="number"
                  step="any"
                  value={answers[q?.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: 18,
                    fontFamily: "'Inter',Arial,sans-serif",
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    letterSpacing: '0.5px',
                  }}
                />
                <div
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 11,
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <i className="fa-solid fa-circle-info" style={{ fontSize: 10 }} /> Tolerance: ±
                  {q?.tolerance_percent}%
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}
          >
            <div style={{ display: 'flex', gap: 7 }}>
              <button
                onClick={() => toggleFlag(q?.id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background:
                    statuses[q?.id] === 'flagged'
                      ? 'rgba(251,191,36,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  color: statuses[q?.id] === 'flagged' ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <i className="fa-solid fa-flag" style={{ fontSize: 10 }} />
                {statuses[q?.id] === 'flagged' ? 'Unflag' : 'Flag'}
              </button>
              <button
                onClick={() => setShowSummary(true)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <i className="fa-solid fa-list" style={{ fontSize: 10 }} /> Summary
              </button>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.05)',
                  color: currentIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <i className="fa-solid fa-arrow-left" style={{ fontSize: 11 }} /> Prev
              </button>
              <button
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 8,
                  border: 'none',
                  background:
                    currentIdx < questions.length - 1
                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                      : 'rgba(99,102,241,0.1)',
                  color: currentIdx < questions.length - 1 ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: currentIdx < questions.length - 1 ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                Next <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />
              </button>
            </div>
            <button
              onClick={() => setShowSummary(true)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <i className="fa-solid fa-paper-plane" /> Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* ── PAUSE OVERLAY ── */}
      {showPauseOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 20,
              padding: 40,
              textAlign: 'center',
              maxWidth: 400,
              width: '90%',
            }}
          >
            <i
              className="fa-solid fa-pause-circle"
              style={{ fontSize: 64, color: '#ff9f0a', display: 'block', marginBottom: 16 }}
            />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              Exam Paused
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 8 }}>
              Timer is stopped. Your progress is saved.
            </div>
            <div
              style={{
                color: '#ff9f0a',
                fontSize: 28,
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 24,
              }}
            >
              {formatTime(timeLeft)}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleResume}
                style={{
                  flex: 2,
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <i className="fa-solid fa-play" /> Resume Exam
              </button>
              <button
                onClick={() => setShowSummary(true)}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB WARNING ── */}
      {tabWarning && !showPauseOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,159,10,0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              padding: 32,
              width: 400,
              textAlign: 'center',
            }}
          >
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ fontSize: 48, color: '#ff9f0a', display: 'block', marginBottom: 14 }}
            />
            <div style={{ color: '#ff9f0a', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Tab Switch Detected
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
              You have switched tabs {tabSwitches} time{tabSwitches > 1 ? 's' : ''}. Please stay on
              this page during the exam.
            </div>
            <button
              onClick={() => setTabWarning(false)}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#ff9f0a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              <i className="fa-solid fa-check" style={{ marginRight: 6 }} />
              Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* ── GRACE PERIOD ── */}
      {gracePeriod !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6000,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,69,58,0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              padding: 32,
              width: 400,
              textAlign: 'center',
            }}
          >
            <i
              className="fa-solid fa-hourglass-end"
              style={{ fontSize: 56, color: '#ff453a', display: 'block', marginBottom: 14 }}
            />
            <div style={{ color: '#ff453a', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Time is Up!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 }}>
              Auto-submitting in
            </div>
            <div style={{ color: '#ff453a', fontSize: 56, fontWeight: 900, marginBottom: 20 }}>
              {gracePeriod}
            </div>
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#ff453a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
              Submit Now
            </button>
          </div>
        </div>
      )}

      {/* ── SUMMARY MODAL ── */}
      {showSummary && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
            backdropFilter: 'blur(8px)',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(10,10,26,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>
                <i
                  className="fa-solid fa-list-check"
                  style={{ marginRight: 8, color: '#818cf8' }}
                />
                Exam Summary
              </span>
              <button
                onClick={() => setShowSummary(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                gap: 10,
              }}
            >
              {[
                { l: 'Answered', v: answered, c: '#4ade80' },
                { l: 'Flagged', v: flagged, c: '#fbbf24' },
                { l: 'Unanswered', v: questions.length - answered, c: 'rgba(255,255,255,0.4)' },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {s.l.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                {questions.map((qi, idx) => {
                  const s = statuses[qi.id] || 'unvisited';
                  return (
                    <button
                      key={qi.id}
                      onClick={() => {
                        setCurrentIdx(idx);
                        setShowSummary(false);
                        if (paused) handleResume();
                      }}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 8,
                        border: `1px solid ${STATUS_COLORS[s]}66`,
                        background: `${STATUS_COLORS[s]}22`,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>Q{qi.question_number}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                        {qi.marks}pt
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setShowSummary(false);
                  if (paused) handleResume();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
                Continue
              </button>
              <button
                onClick={() => {
                  setShowSummary(false);
                  handleSubmit();
                }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(min-width:769px){.mobile-tabs{display:none!important;}.exam-left,.exam-right{display:flex!important;width:auto;}}
        @media(max-width:768px){.mobile-tabs{display:flex!important;}.exam-left{width:100%!important;}.exam-right{width:100%!important;}.mobile-hide{display:none!important;}.exam-left,.exam-right{border:none!important;}}
      `}</style>
    </div>
  );
}
