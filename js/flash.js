document.addEventListener('DOMContentLoaded', function () {
  const GAPS = [1, 3, 7, 14, 30];
  const $ = id => document.getElementById(id);
  let state = BG.load('flash.state', {});     // id -> {box:1..5, due:'YYYY-MM-DD'}
  let queue = [], idx = 0, flipped = false, stats = { ok: 0, ko: 0 };

  $('totalCards').textContent = VOCAB.length;
  const sel = $('axisSel');
  sel.innerHTML = '<option value="all">كل المحاور</option>' +
    Object.entries(VOCAB_AXES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('newPerDay').value = BG.load('flash.newPerDay', 10);

  const inAxis = c => sel.value === 'all' || c[1] === sel.value;

  function counts() {
    const today = BG.todayStr();
    const pool = VOCAB.filter(inAxis);
    const due = pool.filter(c => state[c[0]] && state[c[0]].due <= today).length;
    const fresh = pool.filter(c => !state[c[0]]).length;
    $('dueCount').textContent = due + ' مستحقة';
    $('newCount').textContent = fresh + ' جديدة';
    $('dueN').textContent = due; $('newN').textContent = Math.min(fresh, +$('newPerDay').value || 0);
    $('newPerDayTxt').textContent = +$('newPerDay').value || 0;
    const bx = [0, 0, 0, 0, 0];
    Object.values(state).forEach(s => { bx[s.box - 1]++; });
    $('boxes').innerHTML = bx.map((n, i) => `<div class="b"><div class="n">${n}</div><div class="muted">صندوق ${i + 1}</div></div>`).join('');
  }

  function start() {
    const today = BG.todayStr();
    const pool = VOCAB.filter(inAxis);
    const due = pool.filter(c => state[c[0]] && state[c[0]].due <= today);
    const n = Math.max(0, Math.min(30, +$('newPerDay').value || 0));
    BG.save('flash.newPerDay', n);
    const fresh = BG.shuffle(pool.filter(c => !state[c[0]])).slice(0, n);
    queue = BG.shuffle(due.concat(fresh)); idx = 0; stats = { ok: 0, ko: 0 };
    if (!queue.length) {
      BG.toast('لا توجد بطاقات للمراجعة اليوم');
      if (BG.param('task') === 'review') { BG.markDone('review'); setTimeout(() => { location.href = 'index.html'; }, 900); }
      return;
    }
    $('done').hidden = true; $('home').hidden = true; $('session').hidden = false; show();
  }

  function show() {
    if (idx >= queue.length) return finish();
    const c = queue[idx];
    flipped = false; $('flash').classList.remove('flipped'); $('grade').hidden = true;
    $('fW').textContent = c[2]; $('fA').textContent = c[3]; $('fE').textContent = c[4];
    $('progressTxt').textContent = (idx + 1) + ' / ' + queue.length;
    $('sessBar').style.width = (100 * idx / queue.length) + '%';
  }
  function flip() {
    if ($('session').hidden) return;
    flipped = !flipped;
    $('flash').classList.toggle('flipped', flipped);
    $('grade').hidden = !flipped;
  }
  function grade(ok) {
    if (!flipped) { flip(); return; }
    const c = queue[idx], cur = state[c[0]];
    const box = ok ? Math.min(5, (cur ? cur.box : 0) + 1) : 1;
    state[c[0]] = { box: box, due: BG.addDays(BG.todayStr(), GAPS[box - 1]) };
    BG.save('flash.state', state);
    stats[ok ? 'ok' : 'ko']++;
    if (!ok) queue.push(c);                       // see wrong cards again this session
    idx++; show();
  }
  function finish() {
    $('session').hidden = true; $('done').hidden = false; $('home').hidden = true;
    $('doneTxt').textContent = 'عرفتَ ' + stats.ok + ' وأخطأت في ' + stats.ko + '. ما نسيته يعود قريباً.';
    if (BG.param('task') === 'review') {
      BG.markDone('review');
      const acts = $('doneActions');
      if (!acts.querySelector('a')) acts.prepend(Object.assign(BG.backToToday(acts), {}));
      $('againBtn').hidden = true;
    }
    counts();
  }

  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('stopBtn').addEventListener('click', () => { $('session').hidden = true; $('home').hidden = false; counts(); });
  $('flashInner').addEventListener('click', flip);
  $('btnRight').addEventListener('click', () => grade(true));
  $('btnWrong').addEventListener('click', () => grade(false));
  $('resetBtn').addEventListener('click', function () {
    if (!confirm('مسح تقدّم كل البطاقات؟')) return;
    state = {}; BG.save('flash.state', state); counts();
  });
  sel.addEventListener('change', counts);
  document.addEventListener('keydown', function (e) {
    if ($('session').hidden || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    else if (e.key === '1' && flipped) grade(false);
    else if (e.key === '2' && flipped) grade(true);
  });

  // searchable list
  const list = $('list');
  function drawList() {
    const q = $('q').value.trim().toLowerCase();
    let html = '';
    Object.entries(VOCAB_AXES).forEach(function ([k, name]) {
      const rows = VOCAB.filter(c => c[1] === k && (!q || (c[2] + ' ' + c[3]).toLowerCase().includes(q)));
      if (!rows.length) return;
      html += `<h3>${name}</h3><div class="table-scroll"><table><thead><tr><th>Français</th><th>العربية</th><th>Exemple</th></tr></thead><tbody>` +
        rows.map(c => `<tr><td class="fr"><strong>${BG.esc(c[2])}</strong></td><td>${BG.esc(c[3])}</td><td class="fr"><em>${BG.esc(c[4])}</em></td></tr>`).join('') + '</tbody></table></div>';
    });
    list.innerHTML = html || '<p class="muted">لا نتائج.</p>';
  }
  $('q').addEventListener('input', drawList);
  drawList(); counts();
  if (BG.param('auto') === '1') start();
});
