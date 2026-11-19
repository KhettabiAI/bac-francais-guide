document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);
  const today = BG.todayStr();
  const SEQ = ['2021-1', '2021-2', '2022-1', '2022-2', '2023-1', '2023-2', '2024-1', '2024-2', '2025-1', '2025-2', '2026-1', '2026-2'];
  const SUJET = { 1: 'الموضوع الأول', 2: 'الموضوع الثاني' };

  const days = BG.load('days', []);
  const seen = BG.load('texts', []);
  const errors = BG.load('errors', []);
  const cards = BG.load('flash.state', {});
  const hist = BG.load('sim.history', []);
  const state = BG.today();
  const firstRun = !days.length && !Object.keys(cards).length && !errors.length;

  // ---- plan week
  const start = BG.load('plan.start', '');
  let week = 1;
  if (start) week = Math.min(12, Math.max(1, Math.floor(BG.daysBetween(start, today) / 7) + 1));
  $('weekLink').textContent = 'الخطة · الأسبوع ' + week + ' من 12';
  $('when').textContent = new Date().toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });

  // ---- what is due
  function errDue(e) {
    if (e.resolved) return false;
    const gaps = [1, 7, 21], n = (e.reviews || []).length;
    if (n >= gaps.length) return false;
    return BG.addDays(n === 0 ? e.date : e.reviews[n - 1], gaps[n]) <= today;
  }
  const cardsDue = Object.values(cards).filter(c => c.due && c.due <= today).length;
  const errsDue = errors.filter(errDue).length;

  // ---- today's rhythm (5 steps, one main task per active day)
  const base = days.indexOf(today) >= 0 ? days.indexOf(today) : days.length;
  const r = base % 5;
  function mainTask(rhythm) {
    const nextKey = SEQ.find(k => seen.indexOf(k) < 0);
    const simulate = week >= 10 && week <= 11 && (rhythm === 0 || rhythm === 3);
    if (simulate || (!nextKey && rhythm === 0)) {
      const doneYears = hist.map(h => h.year);
      const y = ['2024', '2025', '2026', '2023', '2022', '2021'].find(x => doneYears.indexOf(x) < 0) || '2024';
      return { t: 'امتحان تجريبي كامل', d: 'ساعتان ونصف بشروط الامتحان، ثم صحّح وسجّل نتيجتك.', href: 'simulateur.html?year=' + y + '&task=main' };
    }
    if (rhythm === 1) return { t: 'تدرّب على المرجعيات', d: '10 أسئلة من المواضيع الحقيقية · 10 دقائق', href: 'entrainement.html?skill=ref&count=10&auto=1&task=main' };
    if (rhythm === 3) return { t: 'اكتب نصاً قصيراً', d: 'compte rendu أو appel بالقالب مع عدّ الكلمات · 30 دقيقة', href: 'production.html?task=main#tool' };
    if (rhythm === 4 || !nextKey) return { t: '10 أسئلة مختلطة', d: 'فكرة رئيسية، مرجعيات، Vrai/Faux وغيرها · 10 دقائق', href: 'entrainement.html?count=10&auto=1&task=main' };
    const [y, s] = nextKey.split('-');
    return firstRun
      ? { t: 'ابدأ بتشخيص مستواك', d: 'حلّ بكالوريا 2021 — الموضوع الأول بالقلم، ثم صحّح · 40 دقيقة', href: 'annales/' + y + '.html?task=main&s=' + s + '&k=' + nextKey }
      : { t: 'نص جديد: بكالوريا ' + y + ' — ' + SUJET[s], d: 'اقرأ، أجب بالقلم، ثم صحّح بالحل · 40 دقيقة', href: 'annales/' + y + '.html?task=main&s=' + s + '&k=' + nextKey };
  }

  const tasks = [];
  if (!firstRun) {
    const parts = [];
    if (cardsDue) parts.push(cardsDue + ' بطاقة');
    if (errsDue) parts.push(errsDue + ' خطأ');
    const toVocab = cardsDue > 0 || errsDue === 0;
    tasks.push({
      key: 'review', t: 'راجع ما تعلّمته',
      d: (parts.length ? parts.join(' · ') : '10 كلمات جديدة') + ' · 10 دقائق',
      href: toVocab ? 'vocabulaire.html?auto=1&task=review' : 'suivi.html?task=review',
      autoDone: false,
    });
  }
  // the day's main task is fixed once chosen (so it still reads correctly after it is done)
  if (!state.mainTask) { state.mainTask = mainTask(r); BG.save('today', state); }
  tasks.push(Object.assign({ key: 'main' }, state.mainTask));

  // ---- render
  const mark = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const pending = tasks.filter(t => !state.done[t.key]);
  let html = '';
  tasks.forEach(function (t) {
    const done = !!state.done[t.key];
    const primary = !done && pending[0] === t;
    html += `<div class="task${done ? ' done' : ''}${primary ? ' primary' : ''}">
      <span class="mark" aria-hidden="true">${done ? mark : ''}</span>
      <div class="body"><p class="t">${t.t}</p><p class="d">${done ? 'تم اليوم' : t.d}</p></div>
      ${done ? '' : `<a class="btn go" href="${t.href}">ابدأ</a>`}
    </div>`;
  });
  if (!pending.length) {
    const tomorrow = mainTask((r + 1) % 5);
    html += `<div class="all-done"><h2>أنهيت خطوات اليوم</h2><p class="muted">غداً: ${tomorrow.t}. الراحة جزء من الحفظ.</p></div>`;
    $('heading').textContent = 'أحسنت';
  } else if (firstRun) {
    $('heading').textContent = 'ابدأ بخطوة واحدة';
  }
  $('tasks').innerHTML = html;
});
