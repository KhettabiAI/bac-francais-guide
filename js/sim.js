document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);
  const PLANS = {
    150: [['اختيار الموضوع', 5], ['قراءتان + خريطة الفقرات', 15], ['الأسئلة (14 نقطة)', 60], ['الإنتاج الكتابي (6 نقاط)', 50], ['مراجعة اللغة', 10], ['هامش أمان', 10]],
    90: [['اختيار الموضوع', 3], ['قراءتان + خريطة الفقرات', 12], ['الأسئلة', 40], ['الإنتاج الكتابي (مسودة قصيرة)', 25], ['مراجعة', 10]],
    60: [['قراءتان + خريطة الفقرات', 10], ['الأسئلة (14 نقطة)', 42], ['مراجعة', 8]],
  };
  let plan = PLANS[150], endAt = 0, remaining = 150 * 60, timer = null, running = false, startedAt = 0;

  const q = new URLSearchParams(location.search).get('year');
  if (q && /^20(2[1-6])$/.test(q)) $('yr').value = q;
  const upd = () => { $('openExam').href = 'annales/' + $('yr').value + '.html'; };
  $('yr').addEventListener('change', upd); upd();

  function fmt(s) {
    s = Math.max(0, s);
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = n => String(n).padStart(2, '0');
    return p(h) + ':' + p(m) + ':' + p(x);
  }
  function drawPhases(elapsedMin) {
    let acc = 0;
    $('phases').innerHTML = plan.map(function (ph) {
      const start = acc; acc += ph[1];
      const cls = elapsedMin >= acc ? 'done' : (elapsedMin >= start ? 'active' : '');
      return `<div class="phase ${cls}"><span>${ph[0]}</span><span>${ph[1]} د</span></div>`;
    }).join('');
  }
  function setDuration() {
    const d = +$('dur').value; plan = PLANS[d]; remaining = d * 60;
    $('clock').textContent = fmt(remaining); drawPhases(0);
  }
  $('dur').addEventListener('change', () => { if (!running) setDuration(); });

  let lastPhaseIdx = -1;
  function tick() {
    remaining = Math.round((endAt - Date.now()) / 1000);
    $('clock').textContent = fmt(remaining);
    const total = +$('dur').value, elapsed = (total * 60 - remaining) / 60;
    drawPhases(elapsed);
    let acc = 0, idx = plan.length - 1;
    for (let i = 0; i < plan.length; i++) { acc += plan[i][1]; if (elapsed < acc) { idx = i; break; } }
    if (idx !== lastPhaseIdx && lastPhaseIdx !== -1 && remaining > 0) BG.toast('المرحلة التالية: ' + plan[idx][0]);
    lastPhaseIdx = idx;
    if (remaining <= 0) { stop(true); }
  }
  function startTimer() {
    endAt = Date.now() + remaining * 1000; if (!startedAt) startedAt = Date.now();
    running = true; lastPhaseIdx = -2;
    timer = setInterval(tick, 1000); tick();
    $('go').disabled = true; $('pause').disabled = false; $('stop').disabled = false;
    $('pause').textContent = 'إيقاف مؤقت'; $('dur').disabled = true;
  }
  $('go').addEventListener('click', startTimer);
  $('pause').addEventListener('click', function () {
    if (running) { clearInterval(timer); running = false; this.textContent = 'استئناف'; }
    else { startTimer(); $('go').disabled = true; }
  });
  function stop(auto) {
    clearInterval(timer); running = false; startedAt = 0;
    $('go').disabled = false; $('pause').disabled = true; $('stop').disabled = true; $('dur').disabled = false;
    if (auto) { BG.toast('انتهى الوقت! ضع القلم وصحّح بالحل النموذجي.'); $('selfEval').scrollIntoView({ behavior: 'smooth' }); }
    setDuration();
  }
  $('stop').addEventListener('click', () => stop(false));

  // self-evaluation
  function total() {
    const a = parseFloat($('sComp').value), b = parseFloat($('sProd').value);
    const t = (isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b);
    $('total').textContent = (isNaN(a) && isNaN(b)) ? '— / 20' : (Math.round(t * 100) / 100) + ' / 20';
    return t;
  }
  ['sComp', 'sProd'].forEach(id => $(id).addEventListener('input', total));
  $('saveEval').addEventListener('click', function () {
    const a = parseFloat($('sComp').value), b = parseFloat($('sProd').value);
    if (isNaN(a) || isNaN(b) || a < 0 || a > 14 || b < 0 || b > 6) { BG.toast('أدخل نقاطاً صحيحة (0–14 و0–6)'); return; }
    const hist = BG.load('sim.history', []);
    hist.push({ id: BG.uid(), date: BG.todayStr(), year: $('yr').value, sujet: $('sSujet').value, type: $('sType').value, comp: a, prod: b, total: a + b, dur: +$('dur').value, note: $('sNote').value });
    BG.save('sim.history', hist);
    BG.toast('تم الحفظ ✓');
    setTimeout(() => location.href = 'suivi.html#history', 700);
  });
  setDuration();
});
