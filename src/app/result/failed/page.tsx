'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ResultQuestion {
  id: string;
  question_number: number;
  question_text: string;
  correct_answer: string;
  marks: number;
  tolerance_percent: number;
  question_type: string;
}
interface AnswerRow {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  marks_obtained: number;
}
interface ExamResult {
  score: number;
  percentage: number;
  passed: boolean;
  timeUsed: number;
  totalMarks: number;
  passingMarks: number;
  setTitle: string;
  attempt_id: string;
  answers: AnswerRow[];
  questions: ResultQuestion[];
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function FailedPage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('tp_theme');
    if (saved) setDark(saved === 'dark');
    const raw = localStorage.getItem('exam_result');
    if (!raw) {
      router.push('/');
      return;
    }
    const data: ExamResult = JSON.parse(raw);
    if (data.passed) {
      router.push('/result/passed');
      return;
    }
    setResult(data);
  }, [router]);

  if (!result)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#1a0608,#2e0d0d)',
          fontFamily: "'Inter',Arial,sans-serif",
        }}
      >
        <i
          className="fa-solid fa-spinner fa-spin"
          style={{ fontSize: 32, color: 'rgba(255,69,58,0.7)' }}
        />
      </div>
    );

  const correctCount = result.answers.filter((a) => a.is_correct).length;
  const wrongCount = result.answers.filter((a) => !a.is_correct).length;
  const needed = result.passingMarks - result.score;

  const glassBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)';
  const glassBorder = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)';
  const pageBg = dark
    ? 'linear-gradient(135deg,#1a0608 0%,#2e0d0d 50%,#1a0608 100%)'
    : 'linear-gradient(135deg,#fce4ec,#fff3e0,#fce4ec)';
  const textMain = dark ? '#fff0f0' : '#3a1a1a';
  const textSub = dark ? 'rgba(255,240,240,0.6)' : '#6a3a3a';
  const textMuted = dark ? 'rgba(255,240,240,0.3)' : '#aa7a7a';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: pageBg,
        fontFamily: "'Inter',Arial,sans-serif",
        color: textMain,
      }}
    >
      {/* Nav */}
      <nav
        style={{
          background: dark ? 'rgba(26,6,8,0.85)' : 'rgba(255,255,255,0.7)',
          borderBottom: `1px solid ${glassBorder}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-pen-ruler" style={{ color: '#ff453a', fontSize: 18 }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: textMain }}>TesterPRO</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setDark((d) => {
                localStorage.setItem('tp_theme', !d ? 'dark' : 'light');
                return !d;
              });
            }}
            style={{
              background: glassBg,
              border: `1px solid ${glassBorder}`,
              borderRadius: 8,
              padding: '6px 12px',
              color: textMain,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <i className={dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} style={{ fontSize: 12 }} />
          </button>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: glassBg,
              border: `1px solid ${glassBorder}`,
              borderRadius: 8,
              padding: '6px 14px',
              color: textSub,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-house" style={{ fontSize: 11 }} /> Portal
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px' }}>
        {/* Main Card */}
        <div
          style={{
            background: glassBg,
            border: `1px solid ${glassBorder}`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(255,69,58,0.15)',
            marginBottom: 20,
          }}
        >
          <div
            style={{ height: 5, background: 'linear-gradient(90deg,#ff453a,#ff3b30,#ff6b63)' }}
          />
          <div style={{ padding: '36px 32px' }}>
            {/* Badge */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: 'rgba(255,69,58,0.12)',
                  border: '2px solid rgba(255,69,58,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <i
                  className="fa-solid fa-circle-xmark"
                  style={{ fontSize: 40, color: '#ff453a' }}
                />
              </div>
              <div
                style={{ fontSize: 36, fontWeight: 900, color: '#ff453a', letterSpacing: '-1px' }}
              >
                NOT PASSED
              </div>
              <div style={{ color: textSub, fontSize: 14, marginTop: 8 }}>
                Keep practicing — review your answers and try again.
              </div>
              <div style={{ color: textMuted, fontSize: 13, marginTop: 4 }}>{result.setTitle}</div>
            </div>

            {/* Score Ring */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#ff453a"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 70 * result.percentage) / 100} ${2 * Math.PI * 70}`}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ff453a' }}>
                    {result.percentage}%
                  </div>
                  <div style={{ fontSize: 11, color: textMuted }}>Score</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                {
                  icon: 'fa-star',
                  label: 'Obtained',
                  val: `${result.score} pts`,
                  color: '#ff453a',
                },
                {
                  icon: 'fa-clock',
                  label: 'Time Used',
                  val: formatTime(result.timeUsed),
                  color: '#5c6bc0',
                },
                {
                  icon: 'fa-circle-check',
                  label: 'Correct',
                  val: `${correctCount}/${result.questions.length}`,
                  color: '#34c759',
                },
                {
                  icon: 'fa-trophy',
                  label: 'Pass Score',
                  val: `${result.passingMarks} pts`,
                  color: '#ff9f0a',
                },
                {
                  icon: 'fa-circle-xmark',
                  label: 'Incorrect',
                  val: `${wrongCount}`,
                  color: '#ff453a',
                },
                {
                  icon: 'fa-chart-pie',
                  label: 'Total Marks',
                  val: `${result.totalMarks} pts`,
                  color: textSub,
                },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: 12,
                    padding: '14px 12px',
                    textAlign: 'center',
                  }}
                >
                  <i
                    className={`fa-solid ${r.icon}`}
                    style={{ fontSize: 18, color: r.color, display: 'block', marginBottom: 6 }}
                  />
                  <div style={{ fontSize: 15, fontWeight: 800, color: textMain }}>{r.val}</div>
                  <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </div>

            {/* Needed info */}
            <div
              style={{
                background: 'rgba(255,159,10,0.08)',
                border: '1px solid rgba(255,159,10,0.25)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <i
                className="fa-solid fa-lightbulb"
                style={{ color: '#ff9f0a', fontSize: 20, flexShrink: 0 }}
              />
              <div>
                <div style={{ color: '#ff9f0a', fontSize: 13, fontWeight: 700 }}>
                  You needed {needed} more point{needed !== 1 ? 's' : ''} to pass
                </div>
                <div style={{ color: textSub, fontSize: 12, marginTop: 3 }}>
                  Study the incorrect answers below and retake to improve your score.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowReview(!showReview)}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: '12px',
                  background: showReview
                    ? 'rgba(92,107,192,0.15)'
                    : dark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${showReview ? 'rgba(92,107,192,0.4)' : glassBorder}`,
                  borderRadius: 10,
                  color: showReview ? '#818cf8' : textSub,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                <i className={`fa-solid ${showReview ? 'fa-eye-slash' : 'fa-eye'}`} />{' '}
                {showReview ? 'Hide' : 'Review'}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: '12px',
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${glassBorder}`,
                  borderRadius: 10,
                  color: textSub,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                <i className="fa-solid fa-print" /> Print
              </button>
              <a
                href="/"
                style={{
                  flex: 2,
                  minWidth: 160,
                  padding: '12px',
                  background: 'linear-gradient(135deg,#ff453a,#ff3b30)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                <i className="fa-solid fa-rotate-left" /> Try Again
              </a>
            </div>
          </div>
        </div>

        {/* Answer Review */}
        {showReview && (
          <div
            style={{
              background: glassBg,
              border: `1px solid ${glassBorder}`,
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: `1px solid ${glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <i className="fa-solid fa-list-check" style={{ color: '#ff453a', fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: textMain }}>
                Detailed Answer Review
              </span>
            </div>
            <div style={{ padding: 20 }}>
              {result.questions.map((q) => {
                const ans = result.answers.find((a) => a.question_id === q.id);
                const ok = ans?.is_correct ?? false;
                return (
                  <div
                    key={q.id}
                    style={{
                      background: ok ? 'rgba(52,199,89,0.05)' : 'rgba(255,69,58,0.05)',
                      border: `1px solid ${ok ? 'rgba(52,199,89,0.2)' : 'rgba(255,69,58,0.2)'}`,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
                          Q{q.question_number}
                        </span>
                        <span style={{ fontSize: 11, color: textMuted }}>{q.marks} pts</span>
                      </div>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          background: ok ? 'rgba(52,199,89,0.15)' : 'rgba(255,69,58,0.15)',
                          color: ok ? '#34c759' : '#ff453a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <i
                          className={`fa-solid ${ok ? 'fa-check' : 'fa-xmark'}`}
                          style={{ fontSize: 9 }}
                        />
                        {ok ? 'Correct' : 'Wrong'}
                      </span>
                    </div>
                    <div
                      style={{ color: textSub, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}
                    >
                      {q.question_text.slice(0, 200)}
                      {q.question_text.length > 200 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 120,
                          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 3 }}>
                          Your Answer
                        </div>
                        <div
                          style={{
                            color: ok ? '#34c759' : '#ff453a',
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {ans?.user_answer || '—'}
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 120,
                          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 3 }}>
                          Correct Answer
                        </div>
                        <div
                          style={{
                            color: '#34c759',
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {q.correct_answer}{' '}
                          {q.question_type === 'numeric' && (
                            <span style={{ color: textMuted, fontWeight: 400, fontSize: 11 }}>
                              ±{q.tolerance_percent}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      >
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 3 }}>Marks</div>
                        <div style={{ color: '#ff9f0a', fontSize: 13, fontWeight: 800 }}>
                          {ans?.marks_obtained ?? 0}/{q.marks}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
