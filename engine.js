/*
 * 夜花房 NOCTURNE · 配方引擎
 * 核心原则：配方先行、图像受限 —— 先算出合法配方，效果图由配方 SVG 渲染，天然一致。
 * 规则来源：florist-recipe skill（constraints.md / flower-library.md）
 */
window.RecipeEngine = (function () {
  const { FLOWERS, SUBSTITUTIONS, VESSELS } = window.FLOWER_DB;

  // 颜色 → 渲染色值（深色底上使用，均需提亮）
  const COLOR_HEX = {
    '粉':'#E8B4C4','白':'#F4EEE2','紫':'#9B8FB8','香槟':'#E6D2A8','黄':'#E9C96A',
    '红':'#D98B86','蓝':'#7E97B8','绿':'#8EA87A','灰绿':'#9CAE8E','银灰':'#CFCFC7',
    '橙':'#E0A86B','酒红':'#9B4A4A','条纹':'#D9C2A0','深红':'#A85050','复色':'#D7A6B0'
  };

  // 确定性伪随机：同一输入永远得到同一配方
  function makeRng(seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    let s = h >>> 0;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const mid = ([a, b]) => (a + b) / 2;

  function seasonOf(month) {
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }

  // 风格 → 默认配色（色相 ≤ 3）
  const STYLE_PALETTE = {
    '自然': ['粉', '白', '绿'],
    '法式': ['粉', '香槟', '绿'],
    '韩式': ['白', '粉', '紫'],
    '中式': ['白', '绿'],
    '极简': ['白', '绿'],
  };

  function resolvePalette(input) {
    if (Array.isArray(input.colors) && input.colors.length) return input.colors.slice(0, 3);
    return STYLE_PALETTE[input.style] || ['粉', '白', '绿'];
  }

  // 按约束过滤候选花材
  function filterPool(input, month) {
    return FLOWERS.filter(f => {
      if (!f.months.includes(month)) return false;            // 当季优先
      if (input.pet === 'cat' || input.pet === 'dog') {
        if (f.toxic) return false;                            // 宠物家庭排除有毒
      }
      if (input.pollen) {
        if (f.pollen) return false;                           // 花粉过敏排除花粉量大
        if (f.smell === 'strong') return false;               // 浓香也排除
      }
      if (input.occasion === '探病' && f.smell === 'strong') return false; // 探病忌浓香
      return true;
    });
  }

  function hasSchemeColor(f, palette) {
    return f.colors.some(c => palette.includes(c));
  }

  function pickVessel(size) {
    const map = {
      '床头/办公': ['细口玻璃瓶', '小口梅瓶'],
      '餐桌/玄关': ['圆形玻璃花瓶', '宽口陶罐'],
      '落地/布置': ['高身落地瓶'],
    };
    const cands = map[size] || map['餐桌/玄关'];
    const v = VESSELS.find(x => x.name === cands[0]) || VESSELS[1];
    return v;
  }

  // 由瓶口推主花总枝数（rng 注入，保证确定性）
  function mainCountFromCrown(crown, rng) {
    if (crown < 25) return 3 + Math.floor(rng() * 3);   // 3–5
    if (crown <= 40) return 5 + Math.floor(rng() * 5);  // 5–9
    return 9 + Math.floor(rng() * 7);                   // 9–15
  }

  function generate(input) {
    const month = new Date().getMonth() + 1;
    const season = seasonOf(month);
    const rng = makeRng(JSON.stringify(input) + '|' + month);
    const palette = resolvePalette(input);
    const pool = filterPool(input, month);

    const byRole = (role) => pool.filter(f => f.role === role && hasSchemeColor(f, palette));
    const mains = byRole('main');
    const fillers = byRole('filler');
    const foliages = pool.filter(f => f.role === 'foliage');
    const accents = byRole('accent');

    // 兜底：若某角色无可选项，放宽到该角色全部当季花材
    const safeMains = mains.length ? mains : pool.filter(f => f.role === 'main');
    const safeFillers = fillers.length ? fillers : pool.filter(f => f.role === 'filler');
    const safeFoliage = foliages.length ? foliages : pool.filter(f => f.role === 'foliage');
    const safeAccents = accents.length ? accents : pool.filter(f => f.role === 'accent');

    // 选品种（主花 1–2 种，配花 1–2 种，叶材 1 种，点缀 0–1 种）
    const chosenMains = sample(rng, safeMains, rng() < 0.5 ? 2 : 1);
    const chosenFillers = sample(rng, safeFillers, rng() < 0.6 ? 2 : 1);
    const chosenFoliage = [pick(rng, safeFoliage)];
    const chosenAccent = (input.style === '极简' || input.style === '中式') ? [] : (safeAccents.length && rng() > 0.3 ? [pick(rng, safeAccents)] : []);

    // 花器与预算
    const vessel = pickVessel(input.size);
    const vesselMid = mid(vessel.price);
    const flowerBudget = input.includeVessel ? Math.max(20, input.budget - vesselMid) : input.budget;

    // 枝数
    const crown = vessel.mouth * 1.6;
    let mainTotal = mainCountFromCrown(crown, rng);
    const fillerTotal = Math.round(mainTotal * 0.8);
    // 叶材：枝数 ≥ 主花 × 1.2
    const foliageStemNeed = Math.ceil(mainTotal * 1.2);
    const accentTotal = chosenAccent.length ? 3 + Math.floor(rng() * 3) : 0; // 3–5

    // 分配主花到各品种
    const mainSplit = splitCount(mainTotal, chosenMains.length, rng);
    const fillerSplit = splitCount(fillerTotal, chosenFillers.length, rng);

    // 叶材按扎（约 7 枝/扎），龟背竹叶按枝
    let foliageLines = [];
    if (chosenFoliage[0].unit === 'bunch') {
      const bunches = Math.max(1, Math.ceil(foliageStemNeed / 7));
      foliageLines.push({ f: chosenFoliage[0], count: bunches, unit: 'bunch' });
    } else {
      foliageLines.push({ f: chosenFoliage[0], count: foliageStemNeed, unit: 'stem' });
    }

    // 组装清单行
    let lines = [];
    chosenMains.forEach((f, i) => lines.push(mkLine(f, mainSplit[i], palette)));
    chosenFillers.forEach((f, i) => lines.push(mkLine(f, fillerSplit[i], palette)));
    foliageLines.forEach(({ f, count, unit }) => lines.push(mkLine(f, count, palette, unit)));
    if (chosenAccent.length) lines.push(mkLine(chosenAccent[0], accentTotal, palette));

    // 预算校验：超了就裁剪（点缀→配花→主花→叶材）
    let flowerTotal = sumLines(lines);
    if (flowerTotal > flowerBudget) lines = trimToBudget(lines, flowerBudget);
    flowerTotal = sumLines(lines);

    const grandTotal = flowerTotal + (input.includeVessel ? vesselMid : 0);

    // 步骤 / 养护 / 替换
    const steps = buildSteps(lines, vessel);
    const care = buildCare(lines, season);
    lines.forEach(l => { l.sub = buildSub(l, palette); });

    const recipe = {
      occasion: input.occasion, style: input.style, palette, season, month,
      vessel, includeVessel: input.includeVessel,
      lines, flowerTotal: Math.round(flowerTotal), vesselTotal: Math.round(vesselMid),
      grandTotal: Math.round(grandTotal),
      budget: input.budget, remaining: Math.round(input.budget - grandTotal),
      crown: Math.round(crown),
      steps, care,
      warnings: buildWarnings(input, lines),
    };
    return recipe;
  }

  function mkLine(f, count, palette, forceUnit) {
    const unit = forceUnit || f.unit;
    const price = mid(f.price);
    const color = f.colors.find(c => palette.includes(c)) || f.colors[0];
    return {
      f, count: Math.max(1, count), unit, color,
      pricePerUnit: price, subtotal: Math.round(price * (forceUnit ? count : f.unit === 'bunch' ? count : count)),
    };
  }
  function sumLines(lines) { return lines.reduce((s, l) => s + l.subtotal, 0); }

  // 单花材减一档；枝按 2 递减、扎按 1 递减，最少留 1 枝/1 扎。同步刷新小计。到底返回 false。
  function stepDown(line) {
    const recompute = () => { line.subtotal = Math.round(line.pricePerUnit * line.count); };
    if (line.unit === 'bunch') { if (line.count > 1) { line.count -= 1; recompute(); return true; } return false; }
    if (line.count > 2) { line.count -= 2; recompute(); return true; }
    if (line.count === 2) { line.count = 1; recompute(); return true; }
    return false;
  }
  // 超出预算时裁剪：优先去点缀→配花→主花→叶材；无法再减时整行移除。
  function trimToBudget(linesIn, target) {
    let lines = linesIn.slice();
    let guard = 0;
    while (sumLines(lines) > target && guard++ < 60) {
      const before = sumLines(lines);
      const accent = lines.find(l => l.f.role === 'accent');
      if (accent) { lines = lines.filter(l => l !== accent); }
      else {
        const fillers = lines.filter(l => l.f.role === 'filler');
        const mains = lines.filter(l => l.f.role === 'main');
        if (fillers.length > 1) { lines = lines.filter(l => l !== fillers[0]); }
        else if (fillers.length === 1) { if (!stepDown(fillers[0])) lines = lines.filter(l => l !== fillers[0]); }
        else if (mains.length > 1) { lines = lines.filter(l => l !== mains[0]); }
        else if (mains.length === 1) { if (!stepDown(mains[0])) lines = lines.filter(l => l !== mains[0]); }
        else { const fol = lines.find(l => l.f.role === 'foliage'); if (fol) { if (!stepDown(fol)) lines = lines.filter(l => l !== fol); } else break; }
      }
      if (sumLines(lines) >= before) break; // 无进展则退出，防死循环
    }
    return lines;
  }
  function splitCount(total, n, rng) {
    if (n <= 1) return [total];
    const arr = []; let left = total;
    for (let i = 0; i < n - 1; i++) { const v = Math.max(1, Math.round(left * (0.4 + rng() * 0.3))); arr.push(v); left -= v; }
    arr.push(Math.max(1, left)); return arr;
  }
  function sample(rng, arr, n) {
    const copy = arr.slice(); const out = [];
    for (let i = 0; i < n && copy.length; i++) { out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]); }
    return out;
  }

  function buildSteps(lines, vessel) {
    const hasFoliage = lines.some(l => l.f.role === 'foliage');
    const steps = [
      `准备花器：${vessel.name}（瓶口 ${vessel.mouth}cm），洗净后注入常温清水至 2/3。`,
      '醒花：花材拆开，茎部斜剪 2–3cm，深水浸泡 1–2 小时（花头不沾水）。',
      '修剪：去掉水面以下的叶片，避免腐烂发臭。',
    ];
    if (hasFoliage) steps.push('先插叶材：确定轮廓与高度，叶材枝数应多于主花，做出外扩的底层。');
    steps.push('插主花：按 ' + Math.round(vessel.height * 1.6) + 'cm 总高确定主花位置，主花间距约一个花头直径，避免排成等距一圈。');
    steps.push('补配花：填在主花间隙，制造层次，不要散点乱插。');
    const accent = lines.find(l => l.f.role === 'accent');
    if (accent) steps.push(`点缀：${accent.f.name}只用 ${accent.count} 处，集中在视觉重心附近，多了显廉价。`);
    steps.push('调整：转动花瓶整体看四面，补空隙、压重心，完成后加满水。');
    return steps.slice(0, 8);
  }

  function buildCare(lines, season) {
    const lives = lines.map(l => l.f.vaseLife[0]);
    const minLife = Math.min(...lives);
    const hasRose = lines.some(l => l.f.name === '玫瑰');
    const care = [
      `整体花期约 ${minLife}–${Math.max(...lines.map(l=>l.f.vaseLife[1]))} 天，按最短的花材算。`,
      '每天换水、剪根 1cm；水位保持瓶高 1/2–2/3。',
      `第 ${Math.max(3, Math.round(minLife * 0.6))} 天挑出开败的花头，剩下的还能再撑几天。`,
    ];
    if (hasRose) care.push('玫瑰外层保护瓣可轻轻掰掉，会更精神。');
    care.push(`${season}季注意：空调直吹与阳光暴晒都会缩短花期，放在散射光处。`);
    care.push('价格以当地花市为准，本文为一线城市参考区间，地区差约 30–50%。');
    return care;
  }

  function buildWarnings(input, lines) {
    const w = [];
    if (input.pet === 'cat' || input.pet === 'dog') {
      const toxic = lines.find(l => l.f.toxic);
      if (toxic) w.push(`⚠️ ${toxic.f.name} 对宠物有毒，已尽量排除，但请再次确认。`);
      else w.push('✅ 已按宠物家庭排除有毒花材（百合、郁金香、绣球、龟背竹、常春藤等）。');
    }
    if (input.pollen) w.push('ℹ️ 已按花粉过敏排除花粉量大与浓香花材。');
    const mains = lines.filter(l => l.f.role === 'main').length;
    if (mains === 0 || lines.length < 3) w.push('⚠️ 当前预算偏低，已尽量精简；花材预算建议 ≥ ¥80 才能成束有型。');
    return w;
  }

  // 替换建议：优先用人工表；无表项时回退到同角色、同色系、价格 ±60% 内的其它花材。
  function buildSub(line, palette) {
    if (SUBSTITUTIONS[line.f.name]) return SUBSTITUTIONS[line.f.name];
    const cands = FLOWERS.filter(f => f.name !== line.f.name && f.role === line.f.role &&
      f.colors.some(c => palette.includes(c)) &&
      f.price[1] <= line.f.price[1] * 1.6 && f.price[0] >= line.f.price[0] * 0.4);
    return cands.slice(0, 3).map(f => ({
      to: f.name,
      diff: Math.round(mid(f.price) - line.pricePerUnit),
      note: '系统推荐替代（同角色·同色系）',
    }));
  }

  // ===== 修改能力（点选替换，而非重新生成）=====

  // 便宜 X%：保持同一设计，裁剪数量直到命中更低预算（沿用 trimToBudget）
  function cheaper(recipe, pct) {
    const target = recipe.flowerTotal * (1 - pct / 100);
    const r = JSON.parse(JSON.stringify(recipe));
    r.lines = trimToBudget(r.lines, target);
    r.lines.forEach(l => { l.subtotal = Math.round(l.pricePerUnit * l.count); });
    r.flowerTotal = Math.round(sumLines(r.lines));
    r.grandTotal = r.flowerTotal + (r.includeVessel ? r.vesselTotal : 0);
    r.remaining = Math.round(recipe.budget - r.grandTotal); // 与原预算比，显示省了多少
    return r;
  }

  // 替换某一种花材为其替代项（保持数量，重算价格）
  function substitute(recipe, flowerName, subName) {
    const r = JSON.parse(JSON.stringify(recipe));
    const line = r.lines.find(l => l.f.name === flowerName);
    if (!line) return r;
    const subDef = FLOWERS.find(f => f.name === subName);
    if (!subDef) return r;
    // 单位不同（枝↔扎）时按 7 枝/扎折算
    if (subDef.unit === 'bunch' && line.unit === 'stem') line.count = Math.max(1, Math.ceil(line.count / 7));
    else if (subDef.unit === 'stem' && line.unit === 'bunch') line.count = line.count * 7;
    line.f = subDef; line.unit = subDef.unit; line.pricePerUnit = mid(subDef.price);
    line.color = subDef.colors[0];
    line.subtotal = Math.round(line.pricePerUnit * line.count);
    r.flowerTotal = Math.round(sumLines(r.lines));
    r.grandTotal = r.flowerTotal + (r.includeVessel ? r.vesselTotal : 0);
    r.remaining = Math.round(r.budget - r.grandTotal);
    return r;
  }

  // 由配方渲染效果图（SVG）：每种花按数量画成色块，天然与清单一致
  function renderBouquet(recipe) {
    const W = 320, H = 420;
    const cx = W / 2;
    const palette = recipe.palette;
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    // 背景聚光
    svg += `<defs><radialGradient id="glow" cx="50%" cy="38%" r="60%">` +
           `<stop offset="0%" stop-color="#2a241f"/><stop offset="100%" stop-color="#141110"/></radialGradient>` +
           `<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">` +
           `<stop offset="0%" stop-color="#E0B266" stop-opacity="0.10"/><stop offset="100%" stop-color="#E0B266" stop-opacity="0.04"/></linearGradient></defs>`;
    svg += `<rect width="${W}" height="${H}" fill="url(#glow)"/>`;
    // 花器
    const vy = H - 90, vw = 70 + recipe.vessel.mouth * 2.2;
    svg += `<path d="M ${cx - vw/2} ${vy} Q ${cx} ${vy+70} ${cx + vw/2} ${vy} L ${cx+vw/2-8} ${vy-2} Q ${cx} ${vy+58} ${cx-vw/2+8} ${vy-2} Z" fill="url(#glass)" stroke="#E0B266" stroke-opacity="0.4"/>`;
    // 花材：按数量在冠幅内分布
    let idx = 0; const totalBlooms = recipe.lines.reduce((s,l)=> s + (l.f.role==='accent'? Math.min(l.count,5): l.count), 0);
    const crownR = 40 + recipe.crown * 1.1;
    recipe.lines.forEach(l => {
      const n = l.f.role === 'accent' ? Math.min(l.count, 5) : l.count;
      const fill = COLOR_HEX[l.color] || '#E8B4C4';
      const isFoliage = l.f.role === 'foliage';
      for (let i = 0; i < n; i++) {
        const ang = (idx / totalBlooms) * Math.PI * 2 + idx * 0.7;
        const rad = isFoliage ? crownR * (0.7 + (idx%3)*0.12) : crownR * (0.2 + (idx%5)*0.15);
        const x = cx + Math.cos(ang) * rad * 0.8;
        const y = vy - 40 - Math.abs(Math.sin(ang)) * rad * 0.9;
        if (isFoliage) {
          svg += `<path d="M ${x} ${y} q 6 -14 0 -26 q -6 12 0 26" fill="${fill}" opacity="0.55"/>`;
        } else {
          const r = l.f.role === 'main' ? 11 : (l.f.role === 'filler' ? 7 : 4);
          svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" opacity="0.92"/>`;
          svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r*0.45}" fill="#141110" opacity="0.25"/>`;
        }
        idx++;
      }
    });
    svg += `</svg>`;
    return svg;
  }

  return { generate, cheaper, substitute, renderBouquet, COLOR_HEX, seasonOf };
})();
