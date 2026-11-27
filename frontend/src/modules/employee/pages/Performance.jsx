// src/pages/Performance.jsx
// Performance evaluation module: OKR goals, 360 feedback timeline, review cycles, and 6-cycle rating history.

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Target,
  MessageSquare,
  Award,
  History,
  Plus,
  Send,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { KpiTile } from '../components/Kpi.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Progress } from '../components/Progress.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { Table } from '../components/Table.jsx';
import { LineChart } from '../components/Charts.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { INITIAL_PERFORMANCE } from '../data/employee.js';
import { formatDate } from '../utils/format.js';

export function Performance() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'goals';
  const { showToast } = useToast();

  const [perfData, setPerfData] = useState(INITIAL_PERFORMANCE);
  const [addGoalDrawerOpen, setAddGoalDrawerOpen] = useState(false);
  const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);

  // New Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('Personal OKR');
  const [goalWeight, setGoalWeight] = useState(20);
  const [goalKeyResults, setGoalKeyResults] = useState('');

  // Peer Feedback Form
  const [peerName, setPeerName] = useState('Divya Menon (UI Designer)');
  const [feedbackType, setFeedbackType] = useState('Appreciation');
  const [feedbackText, setFeedbackText] = useState('');

  // Self Review Form
  const [competencyScores, setCompetencyScores] = useState({
    c1: 4, c2: 5, c3: 4, c4: 4, c5: 4, c6: 5
  });
  const [reviewAchievements, setReviewAchievements] = useState(INITIAL_PERFORMANCE.reviewCycle.achievements);
  const [reviewChallenges, setReviewChallenges] = useState(INITIAL_PERFORMANCE.reviewCycle.challenges);
  const [reviewDevGoals, setReviewDevGoals] = useState(INITIAL_PERFORMANCE.reviewCycle.developmentGoals);
  const [reviewLocked, setReviewLocked] = useState(false);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const newG = {
      id: `G-${perfData.goals.length + 1}`,
      title: goalTitle,
      type: goalType,
      weight: Number(goalWeight),
      progress: 0,
      dueDate: '2027-01-31',
      status: 'Awaiting approval',
      keyResults: goalKeyResults
    };

    setPerfData(prev => ({
      ...prev,
      goals: [...prev.goals, newG]
    }));

    setAddGoalDrawerOpen(false);
    setGoalTitle('');
    setGoalKeyResults('');
    showToast('New goal submitted to Priya Nair for approval');
  };

  const handleGiveFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    const newFb = {
      id: `fb-${Date.now()}`,
      giver: user?.name || 'Aarav Mehta',
      giverRole: user?.designation || 'Frontend Developer',
      date: 'Just now',
      type: feedbackType,
      content: feedbackText
    };

    setPerfData(prev => ({
      ...prev,
      feedback: [newFb, ...prev.feedback]
    }));

    setFeedbackDrawerOpen(false);
    setFeedbackText('');
    showToast(`Peer feedback submitted for ${peerName}!`);
  };

  const handleSubmitSelfReview = (e) => {
    e.preventDefault();
    setReviewLocked(true);
    showToast('Q3 Self-Review submitted to Priya Nair.', {
      duration: 300000, // 5 minutes Undo window (Section 19)
      undoLabel: 'Undo',
      onUndo: () => {
        setReviewLocked(false);
        showToast('Self-review unlocked for editing');
      }
    });
  };

  // 6 cycle rating history data for LineChart
  const lineChartData = perfData.history.slice(0, 6).reverse().map(h => ({
    label: h.cycle.replace(' FY', '\n'),
    value: h.rating
  }));

  return (
    <div className="space-y-6">
      {/* 1. SUMMARY TILES (Section 19) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap)]">
        <KpiTile label="Goal Completion" value={`${perfData.summary.completionRate}%`} delta="On track" isPositive={true} subtext="Q3 targets" icon={Target} />
        <KpiTile label="Open OKR Goals" value={perfData.summary.openGoals} delta="4 assigned" subtext="2 due soon" icon={CheckCircle2} />
        <KpiTile label="Feedback Received" value={perfData.summary.feedbackCount} delta="3 peers, 3 manager" isPositive={true} subtext="positive trend" icon={MessageSquare} />
        <KpiTile label="Next Review Due" value="20 Nov" delta="14 days left" isPositive={true} subtext="Q3 Self Assessment" icon={Award} />
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-line/40 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface2/60 border border-line">
          {[
            { id: 'goals', label: 'My Goals & OKRs' },
            { id: 'feedback', label: '360° Feedback' },
            { id: 'reviews', label: 'Review Cycle (Q3)' },
            { id: 'phistory', label: 'Rating History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                currentTab === tab.id
                  ? 'bg-accent text-on-accent font-semibold shadow-sm'
                  : 'text-muted hover:text-ink hover:bg-surface2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentTab === 'goals' && (
          <PrimaryButton size="sm" onClick={() => setAddGoalDrawerOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add My Goal
          </PrimaryButton>
        )}

        {currentTab === 'feedback' && (
          <PrimaryButton size="sm" onClick={() => setFeedbackDrawerOpen(true)}>
            <Send className="w-3.5 h-3.5" /> Give Peer Feedback
          </PrimaryButton>
        )}
      </div>

      {/* TAB 1: GOALS & OKRS */}
      {currentTab === 'goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perfData.goals.map((goal) => (
              <Card
                key={goal.id}
                title={goal.title}
                subtext={`Weight: ${goal.weight}% · Due ${formatDate(goal.dueDate)}`}
                action={<StatusPill status={goal.status} label={goal.status} />}
              >
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Tag color="accent">{goal.type}</Tag>
                  </div>

                  <p className="text-muted leading-relaxed">
                    <strong>Key Results:</strong> {goal.keyResults}
                  </p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-muted">
                      <span>Progress</span>
                      <span className="font-mono text-ink font-semibold">{goal.progress}%</span>
                    </div>
                    <Progress
                      value={goal.progress}
                      max={100}
                      height={6}
                      variant={goal.status === 'At risk' ? 'warn' : 'accent'}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: 360 FEEDBACK TIMELINE */}
      {currentTab === 'feedback' && (
        <Card title="Feedback & Recognition" subtext="Chronological praise and coaching received from team members">
          <div className="space-y-4">
            {perfData.feedback.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-tpl border border-line bg-surface2/30 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={fb.giver} size={28} />
                    <div>
                      <span className="font-semibold text-ink text-sm block">{fb.giver}</span>
                      <span className="text-muted text-[11px]">{fb.giverRole}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag color={fb.type === 'Appreciation' ? 'good' : fb.type === 'Coaching' ? 'info' : 'warn'}>
                      {fb.type}
                    </Tag>
                    <span className="text-muted font-mono text-[11px]">{fb.date}</span>
                  </div>
                </div>

                <p className="text-muted text-[13px] leading-relaxed pt-1">
                  "{fb.content}"
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: REVIEW CYCLE (Q3) */}
      {currentTab === 'reviews' && (
        <div className="space-y-6">
          {/* Stepper Card */}
          <Card title="Q3 FY2026–27 Appraisal Cycle" subtext="Formal performance review stages">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
              {[
                { title: '1. Self Review', status: 'Active (Due 20 Nov)', active: true },
                { title: '2. Manager Review', status: 'Starts 21 Nov', active: false },
                { title: '3. Calibration', status: 'December 2026', active: false },
                { title: '4. Published', status: 'Final Score', active: false }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-tpl border transition-all ${
                    step.active
                      ? 'border-accent bg-accent/10 shadow-sm'
                      : 'border-line/40 bg-surface2/20 text-muted'
                  }`}
                >
                  <div className={`font-semibold ${step.active ? 'text-accent' : 'text-ink'}`}>
                    {step.title}
                  </div>
                  <div className="text-[11px] text-muted mt-1">{step.status}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Self Review Evaluation Form */}
          <Card title="Self Review Assessment Form" subtext="Rate your 6 core competencies and highlight key deliverables">
            <form onSubmit={handleSubmitSelfReview} className="space-y-5 text-xs">
              {reviewLocked && (
                <div className="p-3.5 rounded-tpl bg-good/10 border border-good/40 text-good flex items-center gap-2 text-xs">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    Self review has been submitted and locked for manager evaluation. Undo is available for 5 minutes.
                  </span>
                </div>
              )}

              {/* 6 Competencies Rating Grid */}
              <div className="space-y-3">
                <span className="font-semibold text-ink text-sm block">Core Engineering Competencies (1 to 5)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'c1', label: 'Delivery', desc: 'Sprint commitments, timeliness, speed' },
                    { id: 'c2', label: 'Quality', desc: 'Code standards, unit tests, low defect rate' },
                    { id: 'c3', label: 'Ownership', desc: 'Taking responsibility, debugging, reliability' },
                    { id: 'c4', label: 'Collaboration', desc: 'Pair programming, cross-team alignment' },
                    { id: 'c5', label: 'Communication', desc: 'Documentation, concise standups' },
                    { id: 'c6', label: 'Continuous Learning', desc: 'Adopting modern patterns & tools' }
                  ].map(c => (
                    <div key={c.id} className="p-3 rounded-tpl bg-surface2/30 border border-line flex items-center justify-between">
                      <div>
                        <span className="font-medium text-ink block text-[13px]">{c.label}</span>
                        <span className="text-muted text-[11px]">{c.desc}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            type="button"
                            disabled={reviewLocked}
                            onClick={() => setCompetencyScores(prev => ({ ...prev, [c.id]: score }))}
                            className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                              competencyScores[c.id] === score
                                ? 'bg-accent text-on-accent'
                                : 'bg-surface2 text-muted hover:text-ink'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-muted text-xs mb-1 font-medium">
                    Key Achievements in Q3
                  </label>
                  <textarea
                    rows={2}
                    disabled={reviewLocked}
                    value={reviewAchievements}
                    onChange={(e) => setReviewAchievements(e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-xs focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted text-xs mb-1 font-medium">
                    Challenges & Roadblocks Encountered
                  </label>
                  <textarea
                    rows={2}
                    disabled={reviewLocked}
                    value={reviewChallenges}
                    onChange={(e) => setReviewChallenges(e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-xs focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted text-xs mb-1 font-medium">
                    Development Goals & Skill Aspirations
                  </label>
                  <textarea
                    rows={2}
                    disabled={reviewLocked}
                    value={reviewDevGoals}
                    onChange={(e) => setReviewDevGoals(e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-xs focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {!reviewLocked && (
                <div className="flex justify-end gap-2 pt-2">
                  <SecondaryButton type="button" onClick={() => showToast('Draft saved successfully')}>
                    Save Draft
                  </SecondaryButton>
                  <PrimaryButton type="submit">
                    Submit Self Review
                  </PrimaryButton>
                </div>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* TAB 4: RATING HISTORY & MILESTONES */}
      {currentTab === 'phistory' && (
        <div className="space-y-6">
          <Card title="Historical Rating Trend (Last 6 Cycles)" subtext="Scale 1.0 to 5.0 (Syne & Manrope tabular data)">
            <LineChart data={lineChartData} minY={3.0} maxY={5.0} height={160} />
          </Card>

          <Card title="Past Review Cycles">
            <Table
              keyField="cycle"
              columns={[
                {
                  header: 'Review Cycle',
                  key: 'cycle',
                  render: (c) => <span className="font-semibold text-ink">{c}</span>
                },
                {
                  header: 'Final Score',
                  key: 'rating',
                  render: (r) => (
                    <span className="font-display font-bold text-accent text-sm">
                      ★ {r.toFixed(1)} / 5.0
                    </span>
                  )
                },
                {
                  header: 'Goals Achieved',
                  key: 'goalsAchieved',
                  render: (g) => <span className="font-mono text-ink">{g}%</span>
                },
                {
                  header: 'Manager Comments',
                  key: 'managerComment',
                  render: (comm) => <span className="text-muted text-xs">{comm}</span>
                }
              ]}
              data={perfData.history}
            />
          </Card>

          {/* Milestones & Promotions */}
          <Card title="Career Milestones & Recognition">
            <div className="space-y-3">
              {perfData.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-tpl border border-line bg-surface2/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink text-sm block">{m.title}</span>
                    <span className="text-muted">{m.note}</span>
                  </div>
                  <Tag color="accent">{m.year}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Add Goal Drawer */}
      <Drawer
        isOpen={addGoalDrawerOpen}
        onClose={() => setAddGoalDrawerOpen(false)}
        title="Add Personal OKR Goal"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setAddGoalDrawerOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleAddGoal}>Submit for Approval</PrimaryButton>
          </div>
        }
      >
        <form onSubmit={handleAddGoal} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted font-medium mb-1">Goal Title *</label>
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Master Next.js 15 Server Components"
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Goal Category</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Personal OKR">Personal OKR</option>
              <option value="Learning Goal">Learning Goal</option>
              <option value="Engineering Quality">Engineering Quality</option>
            </select>
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Weightage (%)</label>
            <input
              type="number"
              min="5"
              max="50"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Key Measurable Results</label>
            <textarea
              rows={3}
              value={goalKeyResults}
              onChange={(e) => setGoalKeyResults(e.target.value)}
              placeholder="Describe deliverables and verification metrics..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </form>
      </Drawer>

      {/* Give Peer Feedback Drawer */}
      <Drawer
        isOpen={feedbackDrawerOpen}
        onClose={() => setFeedbackDrawerOpen(false)}
        title="Share 360° Peer Feedback"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setFeedbackDrawerOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleGiveFeedback}>Send Feedback</PrimaryButton>
          </div>
        }
      >
        <form onSubmit={handleGiveFeedback} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted font-medium mb-1">Recipient</label>
            <select
              value={peerName}
              onChange={(e) => setPeerName(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Divya Menon (UI Designer)">Divya Menon (UI Designer)</option>
              <option value="Karthik Reddy (Backend Engineer)">Karthik Reddy (Backend Engineer)</option>
              <option value="Rahul Verma (QA Lead)">Rahul Verma (QA Lead)</option>
              <option value="Priya Nair (Engineering Manager)">Priya Nair (Engineering Manager)</option>
            </select>
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Feedback Category</label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Appreciation">Appreciation (Kudos & shout-out)</option>
              <option value="Constructive">Constructive (Growth & suggestions)</option>
              <option value="Coaching">Coaching (Technical pairing)</option>
            </select>
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Message *</label>
            <textarea
              rows={4}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share concrete examples of their impact..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default Performance;

