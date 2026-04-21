(function () {
  const API_BASE = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin;

  // ======= CSS (uses CSS variables for brand color) =======
  const style = document.createElement("style");
  style.textContent = `
:root{--ssm-c:#0d9488;--ssm-cd:#0a7060;--ssm-cl:#e6f7f5;--ssm-cb:#b2e4de}
#ssm-trigger{display:inline-flex;align-items:center;gap:7px;background:var(--ssm-c);color:#fff;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;font-family:'Segoe UI',Tahoma,Arial,sans-serif;margin-bottom:10px;transition:all .2s;white-space:nowrap;line-height:1}
#ssm-trigger:hover{background:var(--ssm-cd)}
#ssm-overlay{display:none;position:fixed;inset:0;background:rgba(10,20,40,.55);z-index:99999;justify-content:center;align-items:center;padding:16px;font-family:'Segoe UI',Arial,sans-serif}
#ssm-overlay.open{display:flex}
#ssm-modal{background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.ssm-header{background:var(--ssm-c);padding:20px 24px 16px;border-radius:20px 20px 0 0;color:#fff}
.ssm-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.ssm-title{font-size:17px;font-weight:700}
#ssm-close-btn{background:rgba(255,255,255,.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:.2s}
#ssm-close-btn:hover{background:rgba(255,255,255,.35)}
.ssm-progress-wrap{display:flex;align-items:center;gap:10px}
.ssm-progress-bar{flex:1;background:rgba(255,255,255,.3);border-radius:99px;height:5px}
.ssm-progress-fill{background:#fff;height:5px;border-radius:99px;transition:width .4s ease}
.ssm-step-count{font-size:12px;opacity:.85;white-space:nowrap}
.ssm-body{padding:24px;direction:rtl}
.ssm-question{font-size:19px;font-weight:700;color:#1e2a3e;margin-bottom:6px;line-height:1.4}
.ssm-hint{font-size:13px;color:#6b7280;margin-bottom:22px}
.ssm-cards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
.ssm-card{flex:1;min-width:120px;max-width:145px;border:2px solid #e5e7eb;border-radius:14px;padding:16px 10px 12px;cursor:pointer;text-align:center;transition:all .2s;background:#fafafa}
.ssm-card:hover{border-color:var(--ssm-c);background:var(--ssm-cl);transform:translateY(-2px)}
.ssm-card.active{border-color:var(--ssm-c);background:var(--ssm-cl);box-shadow:0 0 0 3px var(--ssm-cb)}
.ssm-card svg{display:block;margin:0 auto 10px}
.ssm-card .card-label{font-size:13px;font-weight:700;color:#1e2a3e}
.ssm-card .card-sub{font-size:11px;color:#6b7280;margin-top:3px}
.ssm-number-group{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px}
.ssm-num-btn{width:44px;height:44px;border-radius:50%;border:2px solid var(--ssm-c);background:#fff;color:var(--ssm-c);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;transition:.2s}
.ssm-num-btn:hover{background:var(--ssm-c);color:#fff}
.ssm-num-input{width:100px;text-align:center;font-size:26px;font-weight:700;color:#1e2a3e;border:2px solid #e5e7eb;border-radius:12px;padding:8px;outline:none}
.ssm-num-input:focus{border-color:var(--ssm-c)}
.ssm-unit{font-size:16px;color:#6b7280;margin-right:4px}
.ssm-gender-cards{display:flex;gap:16px;justify-content:center;margin-bottom:8px}
.ssm-gender-card{flex:1;max-width:160px;border:2px solid #e5e7eb;border-radius:14px;padding:20px 10px;cursor:pointer;text-align:center;transition:all .2s;background:#fafafa}
.ssm-gender-card:hover{border-color:var(--ssm-c);background:var(--ssm-cl)}
.ssm-gender-card.active{border-color:var(--ssm-c);background:var(--ssm-cl);box-shadow:0 0 0 3px var(--ssm-cb)}
.ssm-gender-card svg{display:block;margin:0 auto 12px}
.ssm-gender-card .g-label{font-size:15px;font-weight:700;color:#1e2a3e}
.ssm-nav{display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:16px;border-top:1px solid #f0f0f0}
.ssm-btn-back{background:none;border:none;color:var(--ssm-c);cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:5px;padding:8px 4px;border-radius:8px;transition:.2s}
.ssm-btn-back:hover{background:var(--ssm-cl)}
.ssm-btn-next{background:var(--ssm-c);color:#fff;border:none;padding:12px 28px;border-radius:10px;cursor:pointer;font-size:15px;font-weight:700;transition:.2s}
.ssm-btn-next:hover{background:var(--ssm-cd);transform:translateY(-1px)}
.ssm-result{text-align:center;padding:10px 0}
.ssm-result-icon{font-size:56px;margin-bottom:12px}
.ssm-result-label{font-size:15px;color:#6b7280;margin-bottom:8px}
.ssm-result-size{font-size:72px;font-weight:900;color:var(--ssm-c);line-height:1;margin-bottom:16px}
.ssm-result-msg{font-size:14px;color:#374151;line-height:1.6;margin-bottom:20px}
.ssm-stock-warn{display:inline-block;background:#fff3cd;border:1px solid #ffc107;color:#856404;font-size:13px;font-weight:700;padding:8px 16px;border-radius:10px;margin-bottom:16px}
.ssm-restart{background:#f3f4f6;border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-size:14px;color:#374151;transition:.2s}
.ssm-restart:hover{background:#e5e7eb}
.ssm-loading{text-align:center;padding:40px;color:#6b7280}
.ssm-spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:var(--ssm-c);border-radius:50%;animation:ssm-spin .8s linear infinite;margin:0 auto 16px}
@keyframes ssm-spin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(style);

  // ======= Auto-detect brand color from cart button =======
  function applyBrandColor(cartBtn) {
    try {
      const bg = window.getComputedStyle(cartBtn).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
      const m = bg.match(/\d+/g);
      if (!m) return;
      const [r, g, b] = m.map(Number);
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max - min < 30) return;
      if (r > 240 && g > 240 && b > 240) return;
      const dark = (v) => Math.max(0, Math.round(v * 0.8));
      const light = (v) => Math.min(255, Math.round(255 - (255 - v) * 0.12));
      const border = (v) => Math.min(255, Math.round(255 - (255 - v) * 0.35));
      const root = document.documentElement;
      root.style.setProperty('--ssm-c',  `rgb(${r},${g},${b})`);
      root.style.setProperty('--ssm-cd', `rgb(${dark(r)},${dark(g)},${dark(b)})`);
      root.style.setProperty('--ssm-cl', `rgb(${light(r)},${light(g)},${light(b)})`);
      root.style.setProperty('--ssm-cb', `rgb(${border(r)},${border(g)},${border(b)})`);
    } catch(e) {}
  }

  // ======= SVGs =======
  const SVG = {
    man: `<svg width="60" height="90" viewBox="0 0 60 90" fill="none"><circle cx="30" cy="12" r="10" fill="#4a6fa5" opacity=".15" stroke="#1e2a3e" stroke-width="2"/><rect x="18" y="24" width="24" height="30" rx="5" fill="#4a6fa5" opacity=".12" stroke="#1e2a3e" stroke-width="2"/><line x1="18" y1="28" x2="6" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="28" x2="54" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="24" y1="54" x2="20" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="36" y1="54" x2="40" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    woman: `<svg width="60" height="90" viewBox="0 0 60 90" fill="none"><circle cx="30" cy="12" r="10" fill="#c084fc" opacity=".2" stroke="#1e2a3e" stroke-width="2"/><path d="M18 24 Q15 38 14 44 Q22 56 30 56 Q38 56 46 44 Q45 38 42 24Z" fill="#c084fc" opacity=".12" stroke="#1e2a3e" stroke-width="2"/><line x1="18" y1="28" x2="6" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="28" x2="54" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="24" y1="56" x2="20" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="36" y1="56" x2="40" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    shoulderWide: `<svg width="80" height="90" viewBox="0 0 80 90" fill="none"><circle cx="40" cy="12" r="9" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M10 28 L70 28 L65 55 L15 55 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="40" y1="55" x2="35" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="55" x2="45" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="28" x2="2" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="28" x2="78" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    shoulderAvg: `<svg width="80" height="90" viewBox="0 0 80 90" fill="none"><circle cx="40" cy="12" r="9" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M20 28 L60 28 L57 55 L23 55 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="40" y1="55" x2="35" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="55" x2="45" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="28" x2="10" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="60" y1="28" x2="70" y2="50" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    shoulderNarrow: `<svg width="80" height="90" viewBox="0 0 80 90" fill="none"><circle cx="40" cy="12" r="9" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M26 28 Q20 30 18 35 L22 55 L58 55 L62 35 Q60 30 54 28 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="40" y1="55" x2="35" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="55" x2="45" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="35" x2="10" y2="52" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="62" y1="35" x2="70" y2="52" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    legsLong: `<svg width="70" height="110" viewBox="0 0 70 110" fill="none"><circle cx="35" cy="10" r="8" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><rect x="22" y="20" width="26" height="28" rx="4" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="22" y1="24" x2="14" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="48" y1="24" x2="56" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="28" y1="48" x2="25" y2="108" stroke="#1e2a3e" stroke-width="2.5" stroke-linecap="round"/><line x1="42" y1="48" x2="45" y2="108" stroke="#1e2a3e" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    legsAvg: `<svg width="70" height="110" viewBox="0 0 70 110" fill="none"><circle cx="35" cy="10" r="8" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><rect x="22" y="20" width="26" height="32" rx="4" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="22" y1="24" x2="14" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="48" y1="24" x2="56" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="28" y1="52" x2="25" y2="100" stroke="#1e2a3e" stroke-width="2.5" stroke-linecap="round"/><line x1="42" y1="52" x2="45" y2="100" stroke="#1e2a3e" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    legsShort: `<svg width="70" height="110" viewBox="0 0 70 110" fill="none"><circle cx="35" cy="10" r="8" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><rect x="22" y="20" width="26" height="38" rx="4" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="22" y1="24" x2="14" y2="44" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="48" y1="24" x2="56" y2="44" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="28" y1="58" x2="25" y2="92" stroke="#1e2a3e" stroke-width="2.5" stroke-linecap="round"/><line x1="42" y1="58" x2="45" y2="92" stroke="#1e2a3e" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    bellyFlat: `<svg width="70" height="100" viewBox="0 0 70 100" fill="none"><circle cx="38" cy="12" r="9" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M28 22 Q38 22 42 22 L42 60 Q38 62 30 60 L26 22 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="28" y1="25" x2="18" y2="46" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="60" x2="29" y2="98" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="60" x2="43" y2="98" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    bellyAvg: `<svg width="70" height="100" viewBox="0 0 70 100" fill="none"><circle cx="38" cy="12" r="9" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M28 22 Q38 22 42 22 L44 60 Q38 62 30 60 L26 22 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="28" y1="25" x2="18" y2="46" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="60" x2="29" y2="98" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="60" x2="43" y2="98" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    bellyBig: `<svg width="70" height="100" viewBox="0 0 70 100" fill="none"><circle cx="38" cy="12" r="9" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M28 22 Q38 22 42 22 Q56 34 54 52 Q50 62 38 62 L26 22 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="28" y1="25" x2="18" y2="46" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="62" x2="29" y2="98" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="62" x2="45" y2="98" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    hipNarrow: `<svg width="80" height="90" viewBox="0 0 80 90" fill="none"><circle cx="40" cy="10" r="8" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M26 20 L54 20 L52 44 L28 44 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M28 44 L22 60 L36 60 L40 44 L44 60 L58 60 L52 44 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="26" y1="24" x2="16" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="54" y1="24" x2="64" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="29" y1="60" x2="26" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="51" y1="60" x2="54" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    hipAvg: `<svg width="80" height="90" viewBox="0 0 80 90" fill="none"><circle cx="40" cy="10" r="8" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M26 20 L54 20 L52 44 L28 44 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M28 44 Q18 52 18 62 L36 62 L40 44 L44 62 L62 62 Q62 52 52 44 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="26" y1="24" x2="16" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="54" y1="24" x2="64" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="27" y1="62" x2="24" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="53" y1="62" x2="56" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
    hipWide: `<svg width="80" height="90" viewBox="0 0 80 90" fill="none"><circle cx="40" cy="10" r="8" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M26 20 L54 20 L52 44 L28 44 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><path d="M28 44 Q10 50 10 65 L36 65 L40 44 L44 65 L70 65 Q70 50 52 44 Z" stroke="#1e2a3e" stroke-width="2" fill="#e8f4f8"/><line x1="26" y1="24" x2="16" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="54" y1="24" x2="64" y2="42" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="23" y1="65" x2="20" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/><line x1="57" y1="65" x2="60" y2="88" stroke="#1e2a3e" stroke-width="2" stroke-linecap="round"/></svg>`,
  };

  // ======= Default quiz steps (fallback when no tag/API) =======
  const DEFAULT_STEPS = [
    { id: "gender", type: "gender", q: "ما هو جنسك؟", hint: "يساعدنا هذا في تحديد نموذج المقاس المناسب.", options: [{ v: "male", svg: SVG.man, label: "رجل" }, { v: "female", svg: SVG.woman, label: "امرأة" }] },
    { id: "height", type: "number", q: "كم طولك؟", hint: "أدخل طولك بالسنتيمتر.", unit: "سم", min: 130, max: 220, def: 165 },
    { id: "weight", type: "number", q: "كم وزنك؟", hint: "أدخل وزنك بالكيلوغرام.", unit: "كغ", min: 35, max: 200, def: 70 },
    { id: "shoulders", type: "cards", q: "ما شكل كتفيك؟", hint: "إذا كنت مترددًا، اختر متوسطة.", options: [{ v: "wide", svg: SVG.shoulderWide, label: "عريضة", sub: "كتفان واسعان" }, { v: "average", svg: SVG.shoulderAvg, label: "متوسطة", sub: "الشكل الطبيعي" }, { v: "narrow", svg: SVG.shoulderNarrow, label: "ضيقة", sub: "كتفان منحدران" }] },
    { id: "legs", type: "cards", q: "ما طول رجليك نسبةً لجسمك؟", hint: "إذا كنت مترددًا، اختر متوسطة.", options: [{ v: "long", svg: SVG.legsLong, label: "طويلة", sub: "أطول من المعدل" }, { v: "average", svg: SVG.legsAvg, label: "متوسطة", sub: "الطول الطبيعي" }, { v: "short", svg: SVG.legsShort, label: "قصيرة", sub: "أقصر من المعدل" }] },
    { id: "belly", type: "cards", q: "ما شكل بطنك؟", hint: "إذا كنت مترددًا، اختر متوسط.", options: [{ v: "flat", svg: SVG.bellyFlat, label: "مسطحة", sub: "بطن مسطحة" }, { v: "average", svg: SVG.bellyAvg, label: "متوسطة", sub: "الشكل الطبيعي" }, { v: "big", svg: SVG.bellyBig, label: "بارزة", sub: "بطن بارزة" }] },
    { id: "hips", type: "cards", q: "ما شكل وركيك؟", hint: "إذا كنت مترددًا، اختر متوسط.", options: [{ v: "narrow", svg: SVG.hipNarrow, label: "ضيقة", sub: "ورك ضيق" }, { v: "average", svg: SVG.hipAvg, label: "متوسطة", sub: "الشكل الطبيعي" }, { v: "wide", svg: SVG.hipWide, label: "عريضة", sub: "ورك واسع" }] },
  ];

  let step = 0, answers = {}, _apiKey = "", _categoryId = "";
  let _currentSteps = DEFAULT_STEPS;
  let _sizeRules = null;

  function gid(id) { return document.getElementById(id); }

  // ======= Tag extraction — reads product tag from page HTML =======
  function extractProductTag() {
    // 1. <meta name="product-tag" content="abaya">
    const meta = document.querySelector('meta[name="product-tag"]');
    if (meta) return meta.getAttribute("content");

    // 2. <* data-product-tag="abaya">
    const dataEl = document.querySelector('[data-product-tag]');
    if (dataEl) return dataEl.getAttribute("data-product-tag");

    // 3. <input type="hidden" name="product-tag" value="abaya"> or id="product-tag"
    const hidden = document.querySelector('input[name="product-tag"], #product-tag');
    if (hidden) return hidden.value;

    // 4. <body class="... product-tag-abaya ...">
    const m = document.body.className.match(/product-tag-([\w-]+)/);
    if (m) return m[1];

    return null;
  }

  // ======= Size calculation from JSONB rules =======
  // sizeRules format: { default: "M", rules: [{ size: "XL", conditions: { height: { min: 175 }, weight: { min: 85 } } }, ...] }
  function calculateSize(ans, rules) {
    if (!rules || !rules.rules) return fallbackSize(ans);
    for (const rule of rules.rules) {
      const conds = rule.conditions || {};
      let match = true;
      for (const [key, cond] of Object.entries(conds)) {
        const val = Number(ans[key]);
        if (cond.min !== undefined && val < cond.min) { match = false; break; }
        if (cond.max !== undefined && val > cond.max) { match = false; break; }
        if (cond.eq  !== undefined && ans[key] !== cond.eq) { match = false; break; }
        if (cond.in  !== undefined && !cond.in.includes(ans[key])) { match = false; break; }
      }
      if (match) return rule.size;
    }
    return rules.default || fallbackSize(ans);
  }

  function fallbackSize(ans) {
    const h = ans.height || 165, w = ans.weight || 70;
    const bmi = w / Math.pow(h / 100, 2);
    return bmi < 18.5 ? "S" : bmi < 23 ? "M" : bmi < 27 ? "L" : "XL";
  }

  // ======= Stock availability check =======
  function isSizeOutOfStock(size) {
    const sizeStr = size.toString().toUpperCase().trim();
    const candidates = document.querySelectorAll(
      '[data-size], [data-value], .size-option, .variant-option, ' +
      'salla-variants button, salla-product-options button, ' +
      '[class*="size"] button, [class*="variant"] button, ' +
      'label.swatch, .product-form__option button'
    );
    for (const el of candidates) {
      const txt = (
        el.textContent ||
        el.getAttribute('data-size') ||
        el.getAttribute('data-value') ||
        el.getAttribute('value') ||
        ''
      ).trim().toUpperCase();
      if (txt !== sizeStr) continue;
      if (
        el.disabled ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.classList.contains('out-of-stock') ||
        el.classList.contains('unavailable') ||
        el.classList.contains('sold-out') ||
        el.classList.contains('disabled') ||
        (el.style.opacity && parseFloat(el.style.opacity) < 0.5)
      ) return true;
    }
    return false;
  }

  // ======= Fetch dynamic quiz from API =======
  function fetchAndCacheQuiz(tag) {
    const url = `${API_BASE}/api/get-quiz?tag=${encodeURIComponent(tag)}&apiKey=${encodeURIComponent(_apiKey)}`;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.quiz) && data.quiz.length > 0 && data.sizeRules) {
          _currentSteps = data.quiz;
          _sizeRules = data.sizeRules;
          _categoryId = data.categoryId || _categoryId;
        }
      })
      .catch(() => {});
  }

  function setupModal() {
    if (document.getElementById("ssm-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "ssm-overlay";
    overlay.innerHTML = `
      <div id="ssm-modal">
        <div class="ssm-header">
          <div class="ssm-header-top">
            <span class="ssm-title">🧥 محدد المقاس الذكي</span>
            <button id="ssm-close-btn">✕</button>
          </div>
          <div class="ssm-progress-wrap">
            <div class="ssm-progress-bar"><div class="ssm-progress-fill" id="ssm-fill"></div></div>
            <span class="ssm-step-count" id="ssm-count"></span>
          </div>
        </div>
        <div class="ssm-body" id="ssm-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    gid("ssm-close-btn").onclick = closeModal;
    overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  }

  const CART_KEYWORDS = [
    'add to cart','add to bag','buy now','purchase','order now',
    'ajouter au panier','commander','acheter',
    'أضف للسلة','أضف إلى السلة','إضافة للسلة','اشتر الآن','اطلب الآن','أضف','شراء',
  ];

  const CART_SELECTORS = [
    'button[name="add"]', '.add-to-cart', '.single_add_to_cart_button',
    '.product-form__submit', '.btn-add-to-cart', '[id*="AddToCart"]',
    '[class*="add-to-cart"]', '[class*="addtocart"]', 'salla-add-to-cart button',
    'button[type="submit"]',
  ];

  function findCartButton() {
    for (const sel of CART_SELECTORS) {
      try { const el = document.querySelector(sel); if (el) return el; } catch(e) {}
    }
    for (const el of document.querySelectorAll('button, [role="button"], input[type="submit"]')) {
      const txt = (el.textContent || el.value || '').toLowerCase().trim();
      if (CART_KEYWORDS.some(k => txt.includes(k))) return el;
    }
    return null;
  }

  function inject() {
    if (document.getElementById("ssm-trigger")) return;
    const target = findCartButton();
    if (!target) return;

    applyBrandColor(target);

    // Re-extract tag on every inject (product may have changed on SPA)
    const tag = extractProductTag();
    if (tag && _apiKey) fetchAndCacheQuiz(tag);

    const btn = document.createElement("button");
    btn.id = "ssm-trigger";
    btn.type = "button";
    btn.innerHTML = "📏 احسب مقاسي";
    btn.onclick = () => { setupModal(); openModal(); };
    target.insertAdjacentElement("afterend", btn);
  }

  function openModal() { step = 0; answers = {}; gid("ssm-overlay").classList.add("open"); render(); }
  function closeModal() { gid("ssm-overlay").classList.remove("open"); }

  function render() {
    const s = _currentSteps[step];
    gid("ssm-fill").style.width = ((step / _currentSteps.length) * 100) + "%";
    gid("ssm-count").textContent = `الخطوة ${step + 1} من ${_currentSteps.length}`;

    let html = `<div class="ssm-question">${s.q}</div><div class="ssm-hint">${s.hint || ""}</div>`;

    if (s.type === "gender") {
      html += `<div class="ssm-gender-cards">${s.options.map(o => `<div class="ssm-gender-card ${answers[s.id] === o.v ? "active" : ""}" onclick="window._ssm.pick('${s.id}','${o.v}')">${o.svg || ""}<div class="g-label">${o.label}</div></div>`).join("")}</div>`;
    } else if (s.type === "number") {
      const v = answers[s.id] || s.def || 0;
      html += `<div class="ssm-number-group"><button class="ssm-num-btn" onclick="window._ssm.adj('${s.id}',-1)">−</button><input class="ssm-num-input" id="numinput" type="number" value="${v}" min="${s.min || 0}" max="${s.max || 9999}" oninput="window._ssm.setVal('${s.id}',+this.value)"/><button class="ssm-num-btn" onclick="window._ssm.adj('${s.id}',1)">+</button><span class="ssm-unit">${s.unit || ""}</span></div>`;
    } else if (s.type === "cards") {
      html += `<div class="ssm-cards">${s.options.map(o => `<div class="ssm-card ${answers[s.id] === o.v ? "active" : ""}" onclick="window._ssm.pick('${s.id}','${o.v}')">${o.svg || ""}<div class="card-label">${o.label}</div>${o.sub ? `<div class="card-sub">${o.sub}</div>` : ""}</div>`).join("")}</div>`;
    }

    const isLast = step === _currentSteps.length - 1;
    html += `<div class="ssm-nav"><button class="ssm-btn-back" onclick="window._ssm.back()">${step > 0 ? "&#8594; رجوع" : ""}</button><button class="ssm-btn-next" onclick="window._ssm.next()">${isLast ? "✨ احسب مقاسي" : "التالي &#8592;"}</button></div>`;

    gid("ssm-body").innerHTML = html;
  }

  window._ssm = {
    pick(id, v) { answers[id] = v; render(); },
    adj(id, d) {
      const s = _currentSteps[step];
      const cur = answers[id] || s.def || 0;
      answers[id] = Math.min(s.max || 9999, Math.max(s.min || 0, cur + d));
      const inp = gid("numinput"); if (inp) inp.value = answers[id];
    },
    setVal(id, v) { answers[id] = v; },
    back() { if (step > 0) { step--; render(); } },
    next() {
      const s = _currentSteps[step];
      if (s.type === "number") {
        const inp = gid("numinput"); if (inp) answers[s.id] = +inp.value;
        if (!answers[s.id]) { alert("رجاءً أدخل قيمة"); return; }
      }
      if ((s.type === "cards" || s.type === "gender") && !answers[s.id]) { alert("رجاءً اختر خياراً"); return; }
      if (step < _currentSteps.length - 1) { step++; render(); } else { submit(); }
    }
  };

  function submit() {
    gid("ssm-body").innerHTML = `<div class="ssm-loading"><div class="ssm-spinner"></div><p>جاري حساب مقاسك...</p></div>`;

    // If we have dynamic size rules, calculate locally (no extra round-trip needed)
    if (_sizeRules) {
      const size = calculateSize(answers, _sizeRules);
      showResult(size);
      return;
    }

    // Fallback: call server-side size API
    fetch(`${API_BASE}/api/widget/size`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, apiKey: _apiKey, categoryId: _categoryId })
    })
      .then(r => r.json())
      .then(d => showResult(d.size))
      .catch(() => showResult(fallbackSize(answers)));
  }

  function showResult(size) {
    const outOfStock = isSizeOutOfStock(size);

    let stockBadge = '';
    let msg = `بناءً على إجاباتك، ننصحك باختيار مقاس <strong>${size}</strong>.<br/>إذا كنت بين مقاسين، ننصح بالأكبر للراحة.`;

    if (outOfStock) {
      stockBadge = `<div class="ssm-stock-warn">⚠️ هذا المقاس غير متوفر حالياً</div>`;
      msg = `مقاسك هو <strong>${size}</strong>، لكنه غير متوفر حالياً.<br/>تواصل مع المتجر أو اختر أقرب مقاس متاح.`;
    }

    gid("ssm-body").innerHTML = `<div class="ssm-result"><div class="ssm-result-icon">${outOfStock ? "😔" : "🎉"}</div><div class="ssm-result-label">المقاس المناسب لك هو</div><div class="ssm-result-size">${size}</div>${stockBadge}<div class="ssm-result-msg">${msg}</div><button class="ssm-restart" onclick="window._ssm_restart()">🔄 أعد الحساب</button></div>`;
    window._ssm_restart = () => { step = 0; answers = {}; render(); };
  }

  // ======= Public API =======
  window.SizeMatcher = {
    init(config) {
      _apiKey = config.apiKey || "";
      _categoryId = config.categoryId || "";
      _currentSteps = DEFAULT_STEPS;
      _sizeRules = null;

      // Try to load dynamic quiz immediately on init
      const tag = extractProductTag();
      if (tag && _apiKey) fetchAndCacheQuiz(tag);

      let currentIv = null;

      function startInject() {
        const old = document.getElementById("ssm-trigger");
        if (old) old.remove();

        setupModal();
        inject();

        if (currentIv) clearInterval(currentIv);
        let tries = 0;
        currentIv = setInterval(() => {
          inject();
          if (document.getElementById("ssm-trigger") || ++tries > 40) clearInterval(currentIv);
        }, 200);
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startInject);
      } else {
        startInject();
      }

      // Re-run on SPA navigation
      let lastUrl = location.href;
      setInterval(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          // Reset quiz to default until new tag is fetched for new page
          _currentSteps = DEFAULT_STEPS;
          _sizeRules = null;
          setTimeout(startInject, 300);
        }
      }, 300);

      const _push = history.pushState.bind(history);
      history.pushState = function (...a) {
        _push(...a);
        _currentSteps = DEFAULT_STEPS;
        _sizeRules = null;
        setTimeout(startInject, 300);
      };
      window.addEventListener("popstate", () => {
        _currentSteps = DEFAULT_STEPS;
        _sizeRules = null;
        setTimeout(startInject, 300);
      });
    },
    open() { setupModal(); openModal(); }
  };
})();
