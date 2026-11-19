document.addEventListener('DOMContentLoaded', function () {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

  const weeks = BG.load('plan.weeks', {});
  set('st-weeks', Object.values(weeks).filter(Boolean).length + '/12');

  const qs = BG.load('quiz.stats', { done: 0, correct: 0 });
  set('st-quiz', qs.done ? Math.round(100 * qs.correct / qs.done) + '%' : '—');

  const today = BG.todayStr();
  const errs = BG.load('errors', []);
  const dueErr = errs.filter(e => !e.resolved && nextDue(e) <= today).length;
  set('st-due', dueErr);

  const cards = BG.load('flash.state', {});
  set('st-cards', Object.values(cards).filter(c => c.due && c.due <= today).length);

  function nextDue(e) {
    const gaps = [1, 7, 21];
    const n = (e.reviews || []).length;
    if (n >= gaps.length) return '9999-12-31';
    return BG.addDays(n === 0 ? e.date : e.reviews[n - 1], gaps[n]);
  }
});
