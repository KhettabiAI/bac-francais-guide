document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);
  const ERR_MAP = { ref: 'ref', idee: 'texte', sens: 'vocab', vf: 'texte', classer: 'texte', visee: 'question', gram: 'langue' };
  let picked = new Set(Object.keys(SKILLS));
  let run = null;

  // ---- setup
  const chips = $('skillChips');
  function drawChips() {
    chips.innerHTML = Object.entries(SKILLS).map(([k, v]) =>
      `<button type="button" class="btn sm ${picked.has(k) ? '' : 'ghost'}" data-k="${k}" aria-pressed="${picked.has(k)}">${v}</button>`).join('') +
      '<button type="button" class="btn sm ghost" data-all="1">الكل / لا شيء</button>';
    pool();
  }
  chips.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.all) picked = picked.size === Object.keys(SKILLS).length ? new Set() : new Set(Object.keys(SKILLS));
    else if (picked.has(b.dataset.k)) picked.delete(b.dataset.k); else picked.add(b.dataset.k);
    drawChips();
  });
  function filtered() {
    const y = $('yearSel').value;
    return QUIZ.filter(q => picked.has(q.skill) && (y === 'all' || q.src.startsWith(y)));
  }
  function pool() {
    const n = filtered().length;
    $('poolInfo').textContent = n + ' سؤالاً متاحاً بهذه الاختيارات.';
    $('startBtn').disabled = n === 0;
    const st = BG.load('quiz.stats', { done: 0, correct: 0 });
    $('statsInfo').textContent = st.done ? 'دقتك الإجمالية: ' + Math.round(100 * st.correct / st.done) + '% (' + st.correct + '/' + st.done + ')' : '';
  }
  $('yearSel').addEventListener('change', pool);

  // ---- run
  function start() {
    const qs = BG.shuffle(filtered()).slice(0, +$('countSel').value);
    run = { qs, i: 0, score: 0, per: {}, wrong: [] };
    $('setup').hidden = true; $('result').hidden = true; $('runner').hidden = false;
    show();
  }
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', function () { $('result').hidden = true; $('setup').hidden = false; pool(); });

  function show() {
    const q = run.qs[run.i];
    $('qCount').textContent = 'السؤال ' + (run.i + 1) + ' / ' + run.qs.length;
    $('qScore').textContent = 'النتيجة: ' + run.score;
    $('qBar').style.width = (100 * run.i / run.qs.length) + '%';
    const card = $('qCard');
    let html = `<div class="q-meta"><span class="tag">${SKILLS[q.skill]}</span><span class="tag accent">${q.src}</span></div>`;
    if (q.ctx) html += `<div class="q-ctx" lang="fr">${q.ctx}</div>`;
    if (q.type === 'qcm') {
      q._order = BG.shuffle(q.opts.map((o, i) => i));
      html += `<div class="q-text fr" lang="fr">${q.q}</div><div class="opts">` +
        q._order.map((oi, n) => `<button class="opt fr" data-o="${oi}" lang="fr">${BG.esc(q.opts[oi])}</button>`).join('') + '</div>';
    } else if (q.type === 'vf') {
      html += `<div class="q-text fr" lang="fr">« ${BG.esc(q.s)} »</div><div class="opts"><button class="opt" data-v="1">Vrai ✔</button><button class="opt" data-v="0">Faux ✘</button></div>`;
    } else if (q.type === 'cls') {
      html += `<div class="q-text" dir="rtl">صنّف كل عبارة في الخانة المناسبة:</div><div class="sorter">` +
        BG.shuffle(q.items.map((it, i) => i)).map(i => `<div class="sort-item" data-i="${i}"><span class="lbl">${BG.esc(q.items[i][0])}</span>
          <span class="seg" role="group">${q.cats.map((c, ci) => `<button type="button" data-c="${ci}" aria-pressed="false" lang="fr" class="fr">${BG.esc(c)}</button>`).join('')}</span></div>`).join('') +
        `</div><div class="row mt1"><button class="btn" id="checkCls" type="button">تحقق</button></div>`;
    }
    html += '<div class="feedback" id="fb" hidden></div>';
    card.innerHTML = html;
    card.focus && card.setAttribute('tabindex', '-1');
  }

  function record(q, ok) {
    run.per[q.skill] = run.per[q.skill] || { n: 0, ok: 0 };
    run.per[q.skill].n++; if (ok) { run.per[q.skill].ok++; run.score++; }
    const st = BG.load('quiz.stats', { done: 0, correct: 0, bySkill: {} });
    st.bySkill = st.bySkill || {};
    st.done++; if (ok) st.correct++;
    st.bySkill[q.skill] = st.bySkill[q.skill] || { n: 0, ok: 0 };
    st.bySkill[q.skill].n++; if (ok) st.bySkill[q.skill].ok++;
    BG.save('quiz.stats', st);
    if (!ok) {
      run.wrong.push(q.id);
      BG.addError({ type: ERR_MAP[q.skill] || 'autre', src: q.src, note: SKILLS[q.skill] + ' — ' + (q.q || q.s || q.ctx || '').replace(/<[^>]+>/g, '').slice(0, 140), why: q.why, auto: true });
    }
  }
  function feedback(q, ok) {
    const fb = $('fb');
    fb.hidden = false;
    fb.innerHTML = `<div class="callout ${ok ? '' : 'bad'}"><strong class="t">${ok ? '✓ صحيح' : '✗ خطأ — سُجّل في سجل الأخطاء'}</strong>${BG.esc(q.why)}</div>
      <div class="row"><button class="btn" id="nextBtn" type="button">${run.i + 1 < run.qs.length ? 'التالي' : 'عرض النتيجة'}</button></div>`;
    $('nextBtn').focus();
    $('nextBtn').addEventListener('click', next);
    $('qScore').textContent = 'النتيجة: ' + run.score;
  }
  function next() {
    run.i++;
    if (run.i >= run.qs.length) return finish();
    show();
  }

  $('qCard').addEventListener('click', function (e) {
    const q = run && run.qs[run.i]; if (!q || $('fb') && !$('fb').hidden) return;
    const opt = e.target.closest('.opt');
    if (opt && q.type === 'qcm') {
      const chosen = +opt.dataset.o, ok = chosen === q.a;
      this.querySelectorAll('.opt').forEach(b => { b.disabled = true; const o = +b.dataset.o; if (o === q.a) b.classList.add('correct'); else if (o === chosen) b.classList.add('wrong'); });
      record(q, ok); feedback(q, ok);
    } else if (opt && q.type === 'vf') {
      const val = opt.dataset.v === '1', ok = val === q.a;
      this.querySelectorAll('.opt').forEach(b => { b.disabled = true; const v = b.dataset.v === '1'; if (v === q.a) b.classList.add('correct'); else if (b === opt) b.classList.add('wrong'); });
      record(q, ok); feedback(q, ok);
    } else if (q.type === 'cls') {
      const seg = e.target.closest('.seg button');
      if (seg) { seg.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === seg)); }
      if (e.target.id === 'checkCls') {
        const rows = this.querySelectorAll('.sort-item');
        let good = 0, unanswered = 0;
        rows.forEach(r => { if (!r.querySelector('[aria-pressed="true"]')) unanswered++; });
        if (unanswered) { BG.toast('صنّف كل العبارات أولاً (' + unanswered + ' متبقية)'); return; }
        rows.forEach(r => {
          const i = +r.dataset.i, c = +r.querySelector('[aria-pressed="true"]').dataset.c, ok = c === q.items[i][1];
          r.classList.add(ok ? 'correct' : 'wrong'); if (ok) good++;
          r.querySelectorAll('button').forEach(b => b.disabled = true);
          if (!ok) r.querySelector('.lbl').insertAdjacentHTML('afterend', `<small class="muted" lang="fr"> → ${BG.esc(q.cats[q.items[i][1]])}</small>`);
        });
        const ok = good === rows.length;
        e.target.disabled = true;
        // partial credit counted as correct only if all right
        record(q, ok); feedback(q, ok);
      }
    }
  });

  function finish() {
    $('runner').hidden = true; $('result').hidden = false;
    const n = run.qs.length, pct = Math.round(100 * run.score / n);
    $('rScore').textContent = run.score + ' / ' + n;
    $('rMsg').textContent = pct >= 80 ? 'ممتاز! انتقل إلى خلط الأنواع أو إلى المحاكاة.' : pct >= 60 ? 'جيد. راجع الأخطاء المسجلة وأعد الجلسة بعد يوم.' : 'تحتاج مراجعة المنهجية لهذه الأنواع ثم إعادة التدريب.';
    $('bySkill').innerHTML = Object.entries(run.per).map(([k, v]) =>
      `<div class="card stat"><div class="n">${v.ok}/${v.n}</div><div class="l">${SKILLS[k]}</div></div>`).join('');
  }

  drawChips();
});
