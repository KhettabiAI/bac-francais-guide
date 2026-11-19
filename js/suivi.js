document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);
  const GAPS = [1, 7, 21];
  let errors = BG.load('errors', []);
  const save = () => BG.save('errors', errors);
  const today = BG.todayStr();

  // next review is GAPS[n] days after the previous event (creation or last review)
  function due(e) {
    if (e.resolved) return null;
    const n = (e.reviews || []).length;
    if (n >= GAPS.length) return null;
    const base = n === 0 ? e.date : e.reviews[n - 1];
    return BG.addDays(base, GAPS[n]);
  }

  // selects
  const typeOpts = Object.entries(BG.ERR_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('eType').innerHTML = typeOpts;
  $('fType').innerHTML = '<option value="all">كل الأنواع</option>' + typeOpts;

  function card(e, withReview) {
    const d = due(e);
    return `<article class="card mt1" data-id="${e.id}">
      <div class="row"><span class="tag">${BG.esc(BG.ERR_TYPES[e.type] || e.type)}</span>${e.src ? `<span class="tag accent" dir="ltr">${BG.esc(e.src)}</span>` : ''}
        ${e.resolved ? '<span class="tag">مُتقن</span>' : (d ? `<span class="tag warn">المراجعة: ${d}</span>` : '')}
        <span class="spacer"></span><span class="muted" style="font-size:.85rem">${e.date}</span></div>
      <p class="q-text" lang="fr" dir="auto">${BG.esc(e.note)}</p>
      ${withReview ? `<details><summary>عرض التصحيح (بعد المحاولة)</summary><p>${BG.esc(e.fix || e.why || 'لم تُسجَّل ملاحظة — راجع الحل النموذجي.')}</p></details>
      <div class="row"><button class="btn sm" data-act="ok">أتقنته (مراجعة ${(e.reviews || []).length + 1}/3)</button><button class="btn sm ghost" data-act="ko">ما زلت أخطئ</button></div>`
        : `<details><summary>التصحيح</summary><p>${BG.esc(e.fix || e.why || '—')}</p></details>
      <div class="row"><button class="btn sm ghost" data-act="toggle">${e.resolved ? 'إعادة فتح' : 'وسم كمُتقن'}</button><button class="btn sm ghost" data-act="del">حذف</button></div>`}
    </article>`;
  }

  function render() {
    const dueList = errors.filter(e => { const d = due(e); return d && d <= today; });
    $('dueList').innerHTML = dueList.length ? dueList.map(e => card(e, true)).join('') : '<p class="muted">لا توجد مراجعات اليوم.</p>';
    if (!dueList.length && BG.param('task') === 'review') {
      BG.markDone('review');
      const box = $('reviewDone'); box.innerHTML = '<div class="callout"><strong class="t">أنهيت المراجعة</strong>ارجع إلى «اليوم» لخطوتك التالية.</div><p class="row" id="rdBtn"></p>';
      BG.backToToday($('rdBtn'));
    }
    const ft = $('fType').value, fs = $('fState').value;
    const all = errors.filter(e => (ft === 'all' || e.type === ft) && (fs === 'all' || (fs === 'open' ? !e.resolved : e.resolved)));
    $('allList').innerHTML = all.length ? all.map(e => card(e, false)).join('') : '<p class="muted">لا شيء لعرضه.</p>';
    $('kDue').textContent = dueList.length;
    $('kOpen').textContent = errors.filter(e => !e.resolved).length;
    $('kRes').textContent = errors.filter(e => e.resolved).length;
    stats(); history();
  }

  document.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const el = b.closest('[data-id]'); const e = errors.find(x => x.id === el.dataset.id); if (!e) return;
    const a = b.dataset.act;
    if (a === 'ok') {
      e.reviews = (e.reviews || []).concat(today);
      if (e.reviews.length >= GAPS.length) { e.resolved = true; BG.toast('أُتقن الخطأ بعد 3 مراجعات'); }
    } else if (a === 'ko') { e.reviews = []; e.date = today; BG.toast('ستعود إليه غداً'); }
    else if (a === 'toggle') e.resolved = !e.resolved;
    else if (a === 'del') { if (!confirm('حذف هذا الخطأ؟')) return; errors = errors.filter(x => x !== e); }
    save(); render();
  });
  $('fType').addEventListener('change', render); $('fState').addEventListener('change', render);

  $('errForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    BG.addError({ type: $('eType').value, src: $('eSrc').value.trim(), note: $('eNote').value.trim(), fix: $('eFix').value.trim() });
    errors = BG.load('errors', []);
    this.reset(); BG.toast('تمت إضافة الخطأ'); render();
    $('t-due').click();
  });

  // ---- stats
  const ADVICE = {
    ref: 'أكثر ما يتكرر عندك: المرجعيات. خصّص جلسة أسبوعية لدفتر «سلاسل الإحالة» وتدرّب في صفحة التدريب على نوع «المرجعيات».',
    texte: 'مشكلتك في فهم النص: أعد «دورة النص» (خريطة الفقرات) قبل الأسئلة، ولخّص كل فقرة في ≤ 6 كلمات.',
    question: 'مشكلتك في فهم السؤال: سطّر فعل التعليمة والعدد والفقرة المطلوبة، وراجع قائمة قصد الكاتب.',
    vocab: 'ضعف المفردات: ضاعف جلسات البطاقات وأضف كلمات كل نص جديد (5 كلمات/نص).',
    releve: 'الاستخراج غير الدقيق: التزم بالفقرة والعدد وانقل العبارة القصيرة المطابقة.',
    limite: 'تجاوز الحدود: تدرّب على العدّ في «أداة التحقق» بصفحة الكتابة.',
    langue: 'أخطاء لغة: ثبّت جدول الروابط وراجع تطابق الفعل والإملاء في كل نص.',
    args: 'نقص الحجج: ابنِ «بنك حجج» لكل موضوع (3 حجج + مثال).',
    autre: 'صنّف أخطاءك بدقة أكبر لتوجيه الخطة.',
  };
  function bars(el, rows, max) {
    el.innerHTML = rows.length ? rows.map(r => `<div class="mt1"><div class="row"><span>${BG.esc(r[0])}</span><span class="spacer"></span><strong>${r[1]}</strong></div><div class="progress"><span style="width:${max ? Math.round(100 * r[2] / max) : 0}%"></span></div></div>`).join('') : '<p class="muted">لا بيانات بعد.</p>';
  }
  function stats() {
    const cnt = {};
    errors.forEach(e => { cnt[e.type] = (cnt[e.type] || 0) + 1; });
    const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    const mx = rows.length ? rows[0][1] : 0;
    bars($('typeBars'), rows.map(([k, n]) => [BG.ERR_TYPES[k] || k, n, n]), mx);
    $('advice').hidden = !rows.length;
    $('advice').innerHTML = rows.length ? '<strong class="t">توصية</strong>' + BG.esc(ADVICE[rows[0][0]] || ADVICE.autre) : '';
    const qs = BG.load('quiz.stats', { bySkill: {} }).bySkill || {};
    const sk = window.SKILLS_AR || { idee: 'الفكرة الرئيسية', sens: 'معنى عبارة', vf: 'Vrai / Faux', ref: 'المرجعيات', classer: 'التصنيف', visee: 'قصد الكاتب', gram: 'الروابط والنحو' };
    bars($('skillBars'), Object.entries(qs).map(([k, v]) => [sk[k] || k, Math.round(100 * v.ok / v.n) + '% (' + v.ok + '/' + v.n + ')', 100 * v.ok / v.n]), 100);
  }

  // ---- history
  function history() {
    const h = BG.load('sim.history', []);
    const last3 = h.slice(-3);
    $('kAvg').textContent = last3.length ? (last3.reduce((s, x) => s + x.total, 0) / last3.length).toFixed(1) : '—';
    $('histBody').innerHTML = h.length ? h.slice().reverse().map(x => `<tr><td>${x.date}</td><td dir="ltr">${x.year} S${x.sujet} · ${x.type === 'cr' ? 'CR' : 'PL'}</td><td>${x.comp}</td><td>${x.prod}</td><td><strong>${x.total}</strong></td><td>${BG.esc(x.note || '')}</td><td><button class="btn sm ghost" data-hdel="${x.id}">حذف</button></td></tr>`).join('') : '<tr><td colspan="7" class="muted">لا توجد نتائج بعد.</td></tr>';
    // SVG chart
    if (!h.length) { $('chart').innerHTML = ''; return; }
    const W = 640, H = 200, P = 30, n = h.length;
    const x = i => n === 1 ? W / 2 : P + i * (W - 2 * P) / (n - 1);
    const y = v => H - P - (v / 20) * (H - 2 * P);
    const pts = h.map((p, i) => x(i) + ',' + y(p.total)).join(' ');
    $('chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="تطور نتائج المحاكاة" style="width:100%;height:auto;background:var(--surface);border:1px solid var(--line);border-radius:12px">
      ${[0, 5, 10, 15, 20].map(v => `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="4" y="${y(v) + 4}" font-size="11" fill="var(--ink-soft)">${v}</text>`).join('')}
      <polyline fill="none" stroke="var(--brand)" stroke-width="3" points="${pts}"/>
      ${h.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.total)}" r="5" fill="var(--brand)"><title>${p.date}: ${p.total}/20</title></circle>`).join('')}
    </svg>`;
  }
  document.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-hdel]'); if (!b) return;
    if (!confirm('حذف هذه النتيجة؟')) return;
    BG.save('sim.history', BG.load('sim.history', []).filter(x => x.id !== b.dataset.hdel)); history();
  });

  // ---- data
  const KEYS = ['errors', 'sim.history', 'plan.weeks', 'plan.tasks', 'plan.start', 'quiz.stats', 'flash.state', 'flash.newPerDay', 'prod.draft', 'today', 'days', 'texts'];
  $('exportBtn').addEventListener('click', function () {
    const o = {}; KEYS.forEach(k => { o[k] = BG.load(k, null); });
    const blob = new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bac-francais-data-' + today + '.json'; a.click();
  });
  $('importFile').addEventListener('change', function () {
    const f = this.files[0]; if (!f) return;
    f.text().then(function (t) {
      try { const o = JSON.parse(t); KEYS.forEach(k => { if (o[k] !== null && o[k] !== undefined) BG.save(k, o[k]); }); BG.toast('تم الاستيراد'); setTimeout(() => location.reload(), 600); }
      catch (e) { BG.toast('ملف غير صالح'); }
    });
  });
  $('wipeBtn').addEventListener('click', function () {
    if (!confirm('سيُمسح كل تقدّمك نهائياً. هل أنت متأكد؟')) return;
    KEYS.forEach(k => localStorage.removeItem('bg.' + k)); location.reload();
  });

  render();
  const h = location.hash.slice(1);
  if (h === 'history') $('t-history').click();
  if (BG.param('add') === '1' || h === 'add') { $('add').open = true; $('add').scrollIntoView(); }
});
