/* 夜花房 NOCTURNE · 控制器 */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = {
    input: { occasion: '居家瓶插', style: '自然', colors: [], budget: 200, size: '餐桌/玄关', pet: 'none', pollen: false, includeVessel: true },
    recipe: null,
    swapOpen: -1,
    history: loadHistory(),
  };

  // ===== 导航 =====
  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === id));
    $('#' + id).scrollTop = 0;
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { showScreen(go.dataset.go); return; }
  });

  // ===== 表单交互 =====
  function bindChips(containerId, key, multi) {
    const box = $('#' + containerId);
    box.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      if (multi) {
        chip.classList.toggle('active');
        const vals = $$('.chip.active', box).map(c => c.dataset.val);
        state.input[key] = vals.slice(0, 3);
        if (vals.length > 3) { // 超过 3 个色相则取消最早选的
          const first = $$('.chip.active', box)[0];
          first.classList.remove('active');
          state.input[key] = $$('.chip.active', box).map(c => c.dataset.val);
        }
      } else {
        $$('.chip', box).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.input[key] = chip.dataset.val;
      }
    });
  }
  bindChips('occasion-chips', 'occasion', false);
  bindChips('style-chips', 'style', false);
  bindChips('color-chips', 'colors', true);
  bindChips('size-chips', 'size', false);

  $('#budget').addEventListener('input', e => {
    state.input.budget = +e.target.value;
    $('#budget-label').textContent = '¥' + e.target.value;
  });
  $('#pet').addEventListener('change', e => state.input.pet = e.target.checked ? 'cat' : 'none');
  $('#pollen').addEventListener('change', e => state.input.pollen = e.target.checked);
  $('#include-vessel').addEventListener('change', e => state.input.includeVessel = e.target.checked);

  // 默认选中
  $('.chip[data-val="居家瓶插"]').classList.add('active');
  $('.chip[data-val="自然"]').classList.add('active');
  $('.chip[data-val="餐桌/玄关"]').classList.add('active');
  $('.chip.color[data-val="粉"]').classList.add('active');
  $('.chip.color[data-val="白"]').classList.add('active');
  state.input.colors = ['粉', '白'];

  // ===== 生成 =====
  $('#btn-generate').addEventListener('click', () => {
    const input = Object.assign({}, state.input);
    state.recipe = RecipeEngine.generate(input);
    renderResult();
    showScreen('screen-result');
  });

  function renderResult() {
    const r = state.recipe;
    $('#bouquet').innerHTML = RecipeEngine.renderBouquet(r);
    $('#result-meta').innerHTML =
      `<div class="rm-title">${r.occasion} · ${r.style}风</div>` +
      `<div class="rm-sub">${r.season}季配方 · 冠幅约 ${r.crown}cm · 花器 ${r.vessel.name}（瓶口 ${r.vessel.mouth}cm）</div>`;
    $('#flower-total').textContent = '¥' + r.flowerTotal;
    $('#grand-total').textContent = '¥' + r.grandTotal;
    $('#remaining').textContent = (r.remaining >= 0 ? '¥' : '-¥') + Math.abs(r.remaining);
    $('#warnings').innerHTML = (r.warnings || []).map(w => `<div>${w}</div>`).join('');
  }

  // 便宜 30%
  $('#btn-cheaper').addEventListener('click', () => {
    state.recipe = RecipeEngine.cheaper(state.recipe, 30);
    renderResult(); renderDetail(); showScreen('screen-result');
  });

  // 换配色：轮换风格重算（保持预算/场景）
  const STYLES = ['自然', '法式', '韩式', '中式', '极简'];
  $('#btn-color-shift').addEventListener('click', () => {
    const cur = STYLES.indexOf(state.input.style);
    state.input.style = STYLES[(cur + 1) % STYLES.length];
    $$('#style-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.val === state.input.style));
    state.recipe = RecipeEngine.generate(state.input);
    renderResult(); renderDetail();
    toast('已切换为「' + state.input.style + '」风格');
  });

  // ===== 制作详情 =====
  function renderDetail() {
    const r = state.recipe; state.swapOpen = -1;
    const roleLabel = { main: '主花', filler: '配花', foliage: '叶材', accent: '点缀' };
    $('#recipe-lines').innerHTML = r.lines.map((l, i) => {
      const hex = RecipeEngine.COLOR_HEX[l.color] || '#E8B4C4';
      let swapHtml = '';
      if (l.sub && l.sub.length) {
        if (state.swapOpen === i) {
          swapHtml = l.sub.map(s => `<button class="ln-swap" data-swap="${i}" data-to="${s.to}">换为${s.to}</button>`).join('');
        } else {
          swapHtml = `<button class="ln-swap" data-swapopen="${i}">换</button>`;
        }
      }
      return `<div class="line">
        <span class="dot" style="background:${hex}"></span>
        <span class="ln-name">${l.f.name}<span class="ln-role"> · ${roleLabel[l.f.role]}</span></span>
        <span class="ln-qty">${l.count}${l.unit === 'bunch' ? '扎' : '枝'}</span>
        <span class="ln-price">¥${l.subtotal}</span>
        ${swapHtml}
      </div>`;
    }).join('');

    $('#steps').innerHTML = r.steps.map(s => `<li>${s}</li>`).join('');
    $('#care').innerHTML = r.care.map(c => `<li>${c}</li>`).join('');
  }
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-swapopen]');
    if (open) { state.swapOpen = +open.dataset.swapopen; renderDetail(); return; }
    const sw = e.target.closest('[data-swap]');
    if (sw) {
      const i = +sw.dataset.swap, to = sw.dataset.to;
      const name = state.recipe.lines[i].f.name;
      state.recipe = RecipeEngine.substitute(state.recipe, name, to);
      renderDetail(); renderResult();
      toast(`已将「${name}」换为「${to}」`);
      return;
    }
  });

  $('#btn-save').addEventListener('click', () => {
    const r = state.recipe;
    state.history.unshift({
      ts: Date.now(), occasion: r.occasion, style: r.style, season: r.season,
      grandTotal: r.grandTotal, palette: r.palette.join(''), input: state.input,
    });
    state.history = state.history.slice(0, 20);
    saveHistory(state.history);
    renderRecent(); renderHistory();
    toast('已保存到「我的」');
  });

  // ===== 作品点评（规则式，无视觉识别）=====
  $('#photo').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = $('#photo-preview');
      img.src = ev.target.result; img.hidden = false;
      renderCritique();
    };
    reader.readAsDataURL(file);
  });
  function renderCritique() {
    const r = state.recipe;
    const items = [];
    items.push({ t: '关于识别', b: '当前为离线规则引擎，无法真正"看"照片。以下是通用的自检清单，对照你的成品逐项打勾。' });
    items.push({ t: '比例自检', b: '叶材枝数是否多于主花？若插出来像个球，是叶材不够。总高是否约为花器高度的 1.6–2 倍？' });
    items.push({ t: '色彩自检', b: '色相是否不超过 3 个？对比色面积是否控制在 10% 以内？' });
    items.push({ t: '层次自检', b: '主花是否避免了等距一圈排布？配花是否填在间隙而非散点？' });
    if (r) {
      items.push({ t: '对照本方案', b: `你当前的「${r.occasion}·${r.style}」方案用了 ${r.lines.length} 种花材、共 ${r.lines.reduce((s,l)=>s+l.count,0)} 单位。成品应尽量贴近这份配方的结构与比例。` });
    }
    items.push({ t: '上线后', b: '接入视觉识别后，这里会给出"玫瑰偏高 2cm""左侧偏空"这类具体点评。' });
    $('#critique').innerHTML = items.map(it =>
      `<div class="c-item"><div class="c-title">${it.t}</div><div class="c-body">${it.b}</div></div>`).join('');
  }

  // ===== 历史 =====
  function renderRecent() {
    const box = $('#recent-list');
    if (!state.history.length) { box.innerHTML = '<div class="empty">还没有方案，去设计第一束吧。</div>'; return; }
    box.innerHTML = state.history.slice(0, 3).map((h, i) =>
      `<div class="recent-card" data-history="${i}">
        <div><div class="rc-name">${h.occasion}·${h.style}</div><div class="rc-meta">${h.season}季 · ${h.palette}</div></div>
        <div class="rc-price">¥${h.grandTotal}</div>
      </div>`).join('');
  }
  function renderHistory() {
    const box = $('#history-list');
    if (!state.history.length) { box.innerHTML = '<div class="empty">暂无历史方案。</div>'; return; }
    box.innerHTML = state.history.map((h, i) =>
      `<div class="recent-card" data-history="${i}">
        <div><div class="rc-name">${h.occasion}·${h.style}</div><div class="rc-meta">${new Date(h.ts).toLocaleDateString()} · ${h.palette}</div></div>
        <div class="rc-price">¥${h.grandTotal}</div>
      </div>`).join('');
  }
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-history]');
    if (!card) return;
    const h = state.history[+card.dataset.history];
    state.input = Object.assign({}, h.input);
    // 同步 UI 选中态
    syncChips('occasion-chips', 'occasion', false);
    syncChips('style-chips', 'style', false);
    syncChips('size-chips', 'size', false);
    syncChips('color-chips', 'colors', true);
    $('#budget').value = state.input.budget; $('#budget-label').textContent = '¥' + state.input.budget;
    $('#pet').checked = state.input.pet !== 'none';
    $('#pollen').checked = state.input.pollen;
    $('#include-vessel').checked = state.input.includeVessel;
    state.recipe = RecipeEngine.generate(state.input);
    renderResult(); renderDetail();
    showScreen('screen-result');
  });
  function syncChips(id, key, multi) {
    const box = $('#' + id);
    $$('.chip', box).forEach(c => {
      const on = multi ? (state.input[key] || []).includes(c.dataset.val) : state.input[key] === c.dataset.val;
      c.classList.toggle('active', on);
    });
  }

  // ===== 工具 =====
  function loadHistory() { try { return JSON.parse(localStorage.getItem('nocturne_history') || '[]'); } catch { return []; } }
  function saveHistory(h) { try { localStorage.setItem('nocturne_history', JSON.stringify(h)); } catch {} }
  let toastTimer;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:#E0B266;color:#1a140a;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:600;z-index:99;opacity:0;transition:.25s;pointer-events:none';
      document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.opacity = '0', 1600);
  }
  function tickClock() { const d = new Date(); $('#clock').textContent = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  tickClock(); setInterval(tickClock, 30000);

  renderRecent(); renderHistory();
})();
