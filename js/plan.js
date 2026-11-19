document.addEventListener('DOMContentLoaded', function () {
  const PHASES = {
    A: 'أ. التشخيص والأساسيات', B: 'ب. المهارات المنفصلة', C: 'ج. الإنتاج الكتابي',
    D: 'د. محاكاة الامتحان', E: 'هـ. المراجعة النهائية',
  };
  const WEEKS = [
    { p: 'A', t: 'تشخيص وأساسيات 1', goal: 'معرفة مستواك الحقيقي وبناء العادات.', tasks: [
      'حلّ موضوع 2021 (الأول) بالتوقيت دون الحل', 'تصحيح بالسلّم وتصنيف كل خطأ في سجل الأخطاء',
      'قراءة صفحة المنهجية: دورة النص', 'بدء بطاقات المفردات (10 بطاقات/يوم)'],
      links: [['annales/2021.html', 'موضوع 2021'], ['methode.html#cycle', 'دورة النص'], ['vocabulaire.html', 'المفردات']] },
    { p: 'A', t: 'تشخيص وأساسيات 2', goal: 'إتقان «الفكرة الرئيسية» و«المرجعيات» نظرياً.', tasks: [
      'حلّ موضوع 2021 (الثاني)', 'تعلّم خطوات حل المرجعيات الأربع', 'تدريب تفاعلي: 15 سؤال مرجعيات',
      'تحديد أكثر نوعين من الأخطاء تكراراً'],
      links: [['methode.html#ref', 'المرجعيات'], ['entrainement.html', 'التدريب'], ['suivi.html', 'سجل الأخطاء']] },
    { p: 'B', t: 'المرجعيات + الاستخراج', goal: 'دقة في الإحالات واستخراج العبارات القصيرة.', tasks: [
      'نص جديد: 2022 (الأول) مع خريطة الفقرات', 'دفتر سلاسل الإحالة: سلسلتان لكل نص',
      'تدريب الاستخراج: لا تنقل جملاً طويلة', 'مراجعة متباعدة لأخطاء الأسبوعين السابقين'],
      links: [['annales/2022.html', 'موضوع 2022'], ['entrainement.html', 'التدريب']] },
    { p: 'B', t: 'التصنيف + Vrai/Faux', goal: 'فهم بنية التقابل وتبرير كل جواب بدليل.', tasks: [
      'نص جديد: 2022 (الثاني)', 'تدريب التصنيف بدليل (رقم الفقرة)', 'تدريب V/F: مذكور / معكوس / غير مذكور',
      'مراجعة المفردات: محور الرقمنة'],
      links: [['methode.html#classer', 'التصنيف'], ['methode.html#vf', 'Vrai/Faux']] },
    { p: 'B', t: 'قصد الكاتب + المعنى + الروابط', goal: 'تحديد visée communicative واستعمال الروابط المنطقية.', tasks: [
      'نص جديد: 2023 (الأول)', 'حفظ قائمة القصد (informer, dénoncer, inciter…)',
      'تدريب الروابط: cause / conséquence / opposition', 'مراجعة المفردات: محور الثورة'],
      links: [['annales/2023.html', 'موضوع 2023'], ['methode.html#visee', 'القصد']] },
    { p: 'B', t: 'سؤال الرأي + أول compte rendu', goal: 'كتابة جواب Q8 بقالب 3 جمل، وأول compte rendu.', tasks: [
      'نص جديد: 2023 (الثاني)', 'كتابة 3 أجوبة Q8 بالقالب «موقف+حجة+مثال»',
      'أول compte rendu (120 كلمة) على نص 2023', 'تصحيحه بالسلّم'],
      links: [['methode.html#opinion', 'سؤال الرأي'], ['production.html#cr', 'Compte rendu']] },
    { p: 'C', t: 'Compte rendu 1', goal: 'تلخيص موضوعي (ثلث النص) بصيغة الغائب.', tasks: [
      'compte rendu لنص 2024 (الأول)', 'قياس: كل فقرة ← جملة ≤ 15 كلمة ثم دمج بالروابط',
      'قائمة تحقق: لا «je»، لا نقل حرفي', 'إعادة كتابته بعد التصحيح'],
      links: [['production.html#cr', 'القالب'], ['annales/2024.html', 'موضوع 2024']] },
    { p: 'C', t: 'Production libre (appel)', goal: 'بنية: شرح ← حجج ← حثّ.', tasks: [
      'بنك حجج لموضوعين (رقمنة، تاريخ)', 'كتابة appel (150 كلمة): 2024 (الثاني) Sujet 2',
      'استعمال الأمر + vous/nous', 'تصحيح بسلّم production libre'],
      links: [['production.html#appel', 'قالب appel']] },
    { p: 'C', t: 'Compte rendu 2 + Production libre 2', goal: 'تثبيت القوالب والتحكم بالعدد.', tasks: [
      'compte rendu لنص 2025 (الثاني)', 'production libre لموضوع 2025', 'عدّ الكلمات والتقيّد بالحد',
      'قارن نسختك الأولى بالأخيرة'],
      links: [['annales/2025.html', 'موضوع 2025'], ['production.html', 'الكتابة']] },
    { p: 'D', t: 'محاكاة 1', goal: 'تحمّل الزمن الكامل 2 س 30 د.', tasks: [
      'محاكاة كاملة: 2024 بشروط الامتحان', 'ورقة التقييم الذاتي وتسجيل النتيجة', 'تحليل الأخطاء (نوعها وسببها)',
      'مراجعة نقاط الضعف فقط'],
      links: [['simulateur.html?year=2024', 'محاكاة 2024']] },
    { p: 'D', t: 'محاكاة 2 + 3', goal: 'تحسين إدارة الوقت والإنتاج.', tasks: [
      'محاكاة: 2025', 'محاكاة: 2026', 'مقارنة النتائج وضبط توزيع الوقت', 'تثبيت القوالب المفضلة'],
      links: [['simulateur.html?year=2025', 'محاكاة 2025'], ['simulateur.html?year=2026', 'محاكاة 2026']] },
    { p: 'E', t: 'مراجعة نهائية', goal: 'الاستقرار الذهني وتثبيت المكتسبات.', tasks: [
      'مراجعة سجل الأخطاء كاملاً', 'مراجعة بطاقات المفردات المستحقة', 'قراءة القوالب وقوائم التحقق',
      'نوم كافٍ وتحضير أدوات الامتحان'],
      links: [['suivi.html', 'سجل الأخطاء'], ['vocabulaire.html', 'المفردات']] },
  ];

  const state = BG.load('plan.weeks', {});         // { "0": true, ... }
  const tasks = BG.load('plan.tasks', {});          // { "0-1": true }
  const startKey = 'plan.start';
  const root = document.getElementById('weeks');

  function curWeekIdx() {
    const st = BG.load(startKey, '');
    if (st) return Math.min(11, Math.max(0, Math.floor(BG.daysBetween(st, BG.todayStr()) / 7)));
    const i = WEEKS.findIndex((_, k) => !state[k]);
    return i < 0 ? 11 : i;
  }
  function render() {
    const cur = curWeekIdx();
    let lastPhase = '', html = '';
    WEEKS.forEach(function (w, i) {
      if (w.p !== lastPhase) { html += `<h2>${PHASES[w.p]}</h2>`; lastPhase = w.p; }
      const done = !!state[i];
      html += `<details class="topic" id="w${i}"${i === cur ? ' open' : ''}>
        <summary>الأسبوع ${i + 1}: ${w.t}${done ? ' <span class="tag">مكتمل</span>' : (i === cur ? ' <span class="tag accent">هذا الأسبوع</span>' : '')}</summary>
        <div class="topic-body">
          <p class="muted mt0"><strong>الهدف:</strong> ${w.goal}</p>
          <ul class="checklist">${w.tasks.map((t, j) => `<li><input type="checkbox" id="t${i}-${j}" data-t="${i}-${j}" ${tasks[i + '-' + j] ? 'checked' : ''}><label for="t${i}-${j}" style="font-weight:400;margin:0">${t}</label></li>`).join('')}</ul>
          <div class="row">${w.links.map(l => `<a class="btn ghost sm" href="${l[0]}">${l[1]}</a>`).join('')}</div>
        </div></details>`;
    });
    root.innerHTML = html;
    update();
  }

  function update() {
    const n = Object.values(state).filter(Boolean).length;
    const pct = Math.round(100 * n / WEEKS.length);
    document.getElementById('planPct').textContent = n + ' / ' + WEEKS.length;
    const bar = document.getElementById('planBar');
    bar.setAttribute('aria-valuenow', pct);
    bar.firstElementChild.style.width = pct + '%';
    document.getElementById('curWeek').textContent = 'أنت في الأسبوع ' + (curWeekIdx() + 1);
  }

  root.addEventListener('change', function (e) {
    const t = e.target;
    if (!t.dataset.t) return;
    tasks[t.dataset.t] = t.checked;
    BG.save('plan.tasks', tasks);
    const w = t.dataset.t.split('-')[0];
    const all = WEEKS[+w].tasks.every((_, j) => tasks[w + '-' + j]);
    if (state[w] !== all) {
      state[w] = all; BG.save('plan.weeks', state);
      const sm = document.querySelector('#w' + w + ' > summary');
      sm.querySelectorAll('.tag').forEach(x => x.remove());
      if (all) sm.insertAdjacentHTML('beforeend', ' <span class="tag">مكتمل</span>');
    }
    update();
  });

  const sd = document.getElementById('startDate');
  sd.value = BG.load(startKey, '');
  sd.addEventListener('change', () => { BG.save(startKey, sd.value); render(); });
  document.getElementById('resetPlan').addEventListener('click', function () {
    if (!confirm('هل تريد مسح تقدّم الخطة؟')) return;
    BG.save('plan.weeks', {}); BG.save('plan.tasks', {});
    Object.keys(state).forEach(k => delete state[k]); Object.keys(tasks).forEach(k => delete tasks[k]);
    render();
  });

  render();
});
