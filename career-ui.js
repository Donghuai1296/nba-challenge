// 生涯模式界面：创建球员 → 加入明星球队 → 26-27 赛季（文字模拟，必定夺冠）→ 虎扑锐评 → 传奇挑战
// 和 game.js 共用全局：app、run、go、save、store、esc、short、toast、tallCard、detailPanel、rosterHtml……
const C = window.Career;
// 选位置的图标：半场战术板，这个位置的站位亮起来（其余 4 个位置是暗点）
const POS_SPOT = { PG: [50, 17], SG: [84, 36], SF: [16, 36], PF: [66, 50], C: [38, 64] };
const POS_ROLE = { PG: '组织进攻 · 持球突破', SG: '外线投射 · 无球跑位', SF: '攻防兼备 · 锋线摇摆', PF: '篮下对抗 · 中距离', C: '护框篮板 · 内线支柱' };
function posCourt(pos) {
  const [x, y] = POS_SPOT[pos];
  const line = 'fill="none" stroke="currentColor" stroke-width="1.6"';
  return `<svg class="pos-court" viewBox="0 0 100 80" aria-hidden="true">
    <rect x="1" y="1" width="98" height="78" rx="6" fill="currentColor" opacity=".06"/>
    <g opacity=".45"><path d="M1 1H99" ${line}/><path d="M8 79V62A42 42 0 0 1 92 62V79" ${line}/>
      <rect x="35" y="47" width="30" height="32" ${line}/><circle cx="50" cy="47" r="11" ${line}/>
      <path d="M43 74H57" ${line}/><circle cx="50" cy="70" r="3" ${line}/></g>
    ${Object.entries(POS_SPOT).filter(([p]) => p !== pos).map(([, [a, b]]) => `<circle cx="${a}" cy="${b}" r="3.2" fill="currentColor" opacity=".3"/>`).join('')}
    <circle class="pc-glow" cx="${x}" cy="${y}" r="11"/>
    <circle cx="${x}" cy="${y}" r="6.5" fill="#ff8a4a" stroke="#fff" stroke-width="1.5"/>
  </svg>`;
}

// ---------- 11 项能力的格子（详情面板、建球员都用） ----------
function attrGrid(p, opts = {}) {
  const a = opts.values || C.attrsOf(p);
  const bonus = (p && p.isMe && p.bonus) || {}; // 普通勋章给的加成，标在数值后面
  return `<div class="attr-grid">${C.ATTRS.map((k) => {
    const v = a[k];
    const g = v == null ? '--' : C.grade(v);
    return `<div class="attr ${opts.clickable ? 'click' : ''} ${opts.locked && opts.locked[k] ? 'locked' : ''} ${bonus[k] ? 'buffed' : ''}" data-attr="${k}">
      <span class="an">${k}</span><span class="ag ${v == null ? '' : C.gradeClass(g)}">${g}</span>
      <span class="av num">${v == null ? '' : v}${bonus[k] ? `<i class="buff">🏅+${bonus[k]}</i>` : ''}${opts.down && opts.down[k] ? '<i class="down">▼</i>' : ''}</span>
      ${opts.locked && opts.locked[k] ? `<small>${opts.locked[k].hidden ? '★ 打法 · ' : ''}${esc(short(opts.locked[k].from))}</small>` : ''}
    </div>`;
  }).join('')}</div>`;
}
// 详情面板下面加上能力值格子
const _detailPanel = detailPanel;
detailPanel = function (p, note = '') {
  return _detailPanel(p, note) + `<details class="card attr-card" ${p.isMe ? 'open' : ''}><summary class="muted small">能力值（${C.ATTRS.length} 项）</summary>${attrGrid(p)}</details>`;
};

// ---------- 0. 开局：中场投篮，三不沾砸中超级明星 ----------
let intro = null; // { star, answers, hidden }
const starOf = (name) => C.SUPERSTARS.find((s) => s.name === name);
// 逐句弹出的小故事：每句间隔 0.18 秒（CSS 动画），按钮跟着最后一句出来，随时能点
function tell(lines, eyebrow, btnText, next) {
  const d = (i) => `style="animation-delay:${(i * 0.18).toFixed(2)}s"`;
  app.innerHTML = `<section class="story card" id="story">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
    ${lines.map((l, i) => `<p class="line-in" ${d(i)}>${l}</p>`).join('')}</section>
    <button class="btn btn-primary line-in" id="next" ${d(lines.length)}>${btnText}</button>`;
  document.getElementById('next').onclick = next;
}
function halftime() {
  intro = { answers: [] };
  tell([
    '这个周末，你终于抢到了一张职业联赛的现场球票。', // 用户 11-19：不要「普通虎扑 JR」的说法
    '中场休息，你正盯着场边的啦啦队看得入神——大屏幕突然切到了你的脸。',
    '全场的镜头都对着你。主持人跑过来：<b>“恭喜这位兄弟，被选中参加中场超远投篮挑战！”</b>',
    '他把话筒递到你嘴边：<b>“投之前先告诉大家——你最喜欢哪个球员？”</b>',
  ], '🏟️ 中场休息', '说出我最喜欢的球员', () => go(pickFav));
}
// 选人页：9 位超级明星；都不满意的话，从剩下的 95+ 球星里随机一名（先放 2 秒出场特效）
const REST_STARS = () => C.SUPERSTARS.filter((s) => !C.PICK_STARS.includes(s));
function pickFav(selected = null) {
  const s = selected && starOf(selected);
  const t = s && C.teamOfStar(s);
  const isRandom = s && !C.PICK_STARS.includes(s);
  const lo = Math.min(...C.PICK_STARS.map((p) => p.ovr)), hi = Math.max(...C.PICK_STARS.map((p) => p.ovr));
  app.innerHTML = `
    <div class="spread"><h2>你最喜欢哪个球员？</h2><button class="muted small" id="back">返回</button></div>
    <p class="muted small">${C.PICK_STARS.length} 位现役超级明星，评分 ${lo}-${hi}。你选的人，会成为你的队友。</p>
    ${s ? detailPanel(s, `${t.city} · 2026-27 赛季${isRandom ? ' · 随机抽中' : ''}`) : ''}
    <button class="btn btn-ghost" id="randomStar">🎲 都不满意？从剩下 ${REST_STARS().length} 位 95+ 球星里随机一名</button>
    <div class="tgrid">${C.PICK_STARS.map((p) => tallCard(p, { button: true, sel: selected === p.name, badge: C.teamOfStar(p).cn, attrs: `data-name="${esc(p.name)}"` })).join('')}
      ${isRandom ? tallCard(s, { button: true, sel: true, badge: '随机', attrs: `data-name="${esc(s.name)}"` }) : ''}</div>
    <button class="btn btn-primary sticky-cta" id="ok" ${s ? '' : 'disabled'}>${s ? `“我最喜欢 ${esc(short(s.name))}！”` : '先选一位球员'}</button>`;
  document.getElementById('back').onclick = () => go(home);
  app.querySelectorAll('.tcard[data-name]').forEach((el) => (el.onclick = () => pickFav(el.dataset.name)));
  document.getElementById('randomStar').onclick = () => {
    const rest = REST_STARS().filter((p) => p.name !== selected); // 再点一次不会抽到同一个人
    const p = rest[Math.floor(Math.random() * rest.length)];
    walkout({ ...p, legendYear: '2026-27', legendTeam: C.teamOfStar(p).city }).then(() => go(() => pickFav(p.name)));
  };
  document.getElementById('ok').onclick = () => { intro.star = s.name; go(airball); };
}
function airball() {
  const n = short(intro.star);
  tell([
    `“我最喜欢 <b>${esc(n)}</b>！”全场一阵欢呼，刚从更衣室走回场边的 ${esc(n)} 笑着朝你挥了挥手。`,
    '你站到中线后面，深吸一口气，用尽全力把球扔了出去——',
    '球在空中划出一道完美的弧线……<b>三不沾。</b>',
    `它不偏不倚，正好砸在 <b>${esc(n)}</b> 的脑袋上。`,
    `全场安静了一秒，然后爆笑。${esc(n)} 揉着脑袋走过来，上下打量了你一眼：`,
    `<span class="quote">“兄弟，扔得够远，就是准头差点。先回答我一个问题——你平时是什么打法？”</span>`,
  ], '🏀 超远投篮挑战', '认真回答', () => go(() => quiz(0)));
}
// 「你平时是什么打法？」7 个答案 = 7 位顶级球员最强的一项（三分库里、2分亚历山大、终结东契奇、传球约基奇、篮板文班、力量字母哥、弹跳爱德华兹）。
// 选完直接进建球员：这一项锁定成那位球星的数值；位置默认用他的位置，名字用上次的（建球员页上可以改）
function quiz(i) {
  const Q = C.QUIZ[i];
  app.innerHTML = `
    <p class="eyebrow">🏀 ${esc(short(intro.star))} 的问题</p>
    <h2>${esc(Q.q)}</h2>
    <div class="quiz">${Q.a.map(([t, key], k) => { const s = C.playStyle(key); return `<button class="qa qa-style" data-k="${k}">
      <span class="qa-av">${Avatar.avatarSVG(starOf(s.star) || { name: s.star, from: '现役' })}</span>
      <span class="qa-t">${esc(t)}<small>${s.attr} <b class="num">${s.v}</b> · 和${esc(s.nick)}一样</small></span></button>`; }).join('')}</div>`;
  app.querySelectorAll('.qa').forEach((b) => (b.onclick = () => {
    intro.answers[i] = Number(b.dataset.k);
    intro.style = C.hiddenFromAnswers(intro.answers);
    intro.hidden = null; // 不再有神秘技能
    startBuild(C.playStyle(intro.style).pos, store.get('nba-myname', '') || '无名新秀');
  }));
}
// 进建球员（选数值）：打法对应的那一项先锁定
function startBuild(pos, name) {
  build = { name, pos, locked: {}, reTeam: 3, rePlayers: 3, team: null, shown: [], pick: null };
  const s = intro && intro.style && C.playStyle(intro.style);
  if (s) build.locked[s.attr] = { v: s.v, from: s.star, down: false, hidden: true };
  go(() => spinTeam(true));
}
// 你的招牌：新开局是「打法」（比如 招牌3分，和库里一样），老存档是以前的神秘技能
function sigOf(me) {
  const s = me && me.style && C.playStyle(me.style);
  if (s) return { name: `招牌${s.attr}`, attr: s.attr, star: s.star };
  const h = me && me.hidden && C.HIDDEN[me.hidden];
  return h ? { name: `【${h.name}】`, attr: h.attr, star: h.star } : null;
}
// ---------- 1. 选位置（名字在进入联盟前和造型一起起，见 lookPage） ----------
let build = null; // 建球员的进度
function createPos(sel = null) {
  const h = intro && intro.style && C.playStyle(intro.style);
  app.innerHTML = `
    <div class="spread"><h2>选择我的位置</h2><button class="muted small" id="back">返回</button></div>
    <p class="muted small">你会成为一名新秀，加入一位明星所在的球队。名字在进入联盟前和造型一起起。</p>
    ${h ? `<p class="small hidden-chip">你的打法：${h.attr} ${h.v}（和${esc(h.nick)}一样）· 推荐位置：${E.POS_LABEL[h.pos]}</p>` : ''}
    <div class="pos-pick">${E.POS.map((p) => `<button class="pos-btn ${sel === p ? 'sel' : ''}" data-p="${p}">${posCourt(p)}
      <span class="pos-txt"><b>${E.POS_LABEL[p]}<em>${p}</em></b><small>${POS_ROLE[p]}</small></span>${h && h.pos === p ? '<i class="pos-rec">推荐</i>' : ''}</button>`).join('')}</div>
    <button class="btn btn-primary sticky-cta" id="ok" ${sel ? '' : 'disabled'}>确认位置</button>`;
  document.getElementById('back').onclick = () => go(build ? buildScreen : home);
  app.querySelectorAll('.pos-btn').forEach((b) => (b.onclick = () => createPos(b.dataset.p)));
  // 改了位置：建球员从头来（打法那一项照样锁定），已经起好的名字、选好的造型留着
  document.getElementById('ok').onclick = () => {
    const keep = build ? { name: build.name, look: build.look } : null;
    startBuild(sel, keep ? keep.name : store.get('nba-myname', '') || '无名新秀');
    if (keep && keep.look != null) build.look = keep.look;
  };
}

// ---------- 2. 建球员：摇一支现役球队，挑一名球员，锁定他的一项能力，一共 11 项 ----------
// 球衣：现役球员的球队以虎扑 2026-27 名单为准
for (const [code, list] of Object.entries(C.LEAGUE.teams)) for (const p of list) LOOKS_DATA.CURRENT_TEAM[p.name] = code;
for (const s of [...E.STARS, ...C.SUPERSTARS]) { const t = C.teamOfStar(s); if (t.team) LOOKS_DATA.CURRENT_TEAM[s.name] = t.team; }
const TEAMS = C.buildTeams();
async function spinTeam(first = false) {
  const list = TEAMS.filter((t) => !build.team || t.code !== build.team.code);
  const next = list[Math.floor(Math.random() * list.length)];
  Avatar.preloadPhotos(next.list); // 摇号动画期间就把这支队全部照片载好，「换球员」也不用等
  build.pick = null;
  build.spinning = true;
  buildScreen();
  const box = document.getElementById('spin');
  if (box && !reduceMotion) {
    for (let i = 0; i < 6; i++) {
      box.textContent = C.TEAM_CN[TEAMS[Math.floor(Math.random() * TEAMS.length)].code];
      await wait(30 + i * 10);
    }
  }
  build.team = next;
  build.shown = E.shuffle(next.list).slice(0, 5);
  build.seen = new Set(build.shown.map((p) => p.name)); // 本队已经出现过的球员，换球员时优先换没见过的
  build.spinning = false;
  buildScreen();
}
// 能力格子里直接显示你最终拿到的值：借来的值和位置保底取高的（隐藏能力原样）
const finalVal = (k, v, hidden) => (hidden ? v : Math.max(C.rookieFloor(build.pos, k), Math.min(100, v) - C.ROOKIE));
function previewValues() {
  const vals = {}, down = {};
  for (const k of C.ATTRS) {
    const l = build.locked[k];
    if (l) { vals[k] = finalVal(k, l.v, l.hidden); down[k] = l.down; continue; }
    if (build.pick) {
      const src = build.pick;
      const d = C.decay(build.pos, src.pos, k);
      vals[k] = finalVal(k, Math.max(25, C.attrsOf(src)[k] - d));
      down[k] = d > 0;
    } else vals[k] = null;
  }
  return { vals, down };
}
function buildScreen() {
  const n = Object.keys(build.locked).length;
  const { vals, down } = previewValues();
  const done = n === C.ATTRS.length;
  const ovr = done ? C.makeRookie(build.pos, build.locked).ovr : null;
  app.innerHTML = `
    <h2 style="text-align:center">创建球员</h2>
    <p class="muted small" style="text-align:center">我的位置：${E.POS_LABEL[build.pos]}（${build.pos}） <button class="link-btn" id="editPos">改位置</button></p>
    <div class="bprog"><div class="bar"><i style="width:${(n / C.ATTRS.length) * 100}%"></i></div><b class="num">${n}/${C.ATTRS.length}</b></div>
    <div class="build">
      <div class="bleft">
        <div class="bovr"><b class="num">${ovr != null ? ovr : '--'}</b><span>OVR</span></div>
        ${attrGrid(null, { values: vals, down, locked: build.locked, clickable: !!build.pick })}
      </div>
      <div class="bright">
        <div class="spin-head">🎰 随机选队</div>
        <div class="spin" id="spin">${build.team && !build.spinning ? C.TEAM_CN[build.team.code] : '……'}</div>
        <div class="re-row">
          <button class="btn btn-ghost small-btn" id="reTeam" ${build.reTeam && !done && !build.spinning ? '' : 'disabled'}>🎰 换球队（${build.reTeam}）</button>
          <button class="btn btn-ghost small-btn" id="rePlayers" ${build.rePlayers && !done && !build.spinning && build.team && build.team.list.length > build.shown.length ? '' : 'disabled'}>👥 换球员（${build.rePlayers}）</button>
        </div>
        ${done ? '' : `<button class="btn btn-ghost small-btn" id="autoPick" style="width:100%;margin-top:6px" ${build.spinning ? 'disabled' : ''}>🎲 一键随机（剩 ${C.ATTRS.length - n} 项）</button>`}
        ${build.spinning ? '' : `<p class="small muted">${build.team ? C.TEAM_CN[build.team.code] : ''} 展示 ${build.shown.length} 人</p>
        <div class="bplayers">${build.shown.map((p, i) => {
          // 这名球员在你还没锁定的能力里最强的一项（已经算上跨位置衰减），方便挑
          const a = C.attrsOf(p), open = C.ATTRS.filter((k) => !build.locked[k]);
          const val = (k) => Math.max(25, a[k] - C.decay(build.pos, p.pos, k));
          const bk = open.length ? open.reduce((m, k) => (val(k) > val(m) ? k : m)) : null;
          const g = bk && C.grade(val(bk));
          return `<button class="bp ${build.pick === p ? 'sel' : ''}" data-i="${i}" ${done ? 'disabled' : ''}>
          <div class="bp-av">${Avatar.avatarSVG(p)}</div><div><b>${esc(short(p.name))}</b><small>${p.pos}${bk ? ` · ${bk} <i class="${C.gradeClass(g)}">${g}</i> ${val(bk)}` : ''}</small></div><span class="num">${p.ovr}</span></button>`;
        }).join('')}</div>`}
        <p class="small" style="color:var(--gold)">${done ? '' : build.pick
          ? '👈 点左边的一项能力，锁定它'
          : '先选一名球员，再点左边的能力锁定'}</p>
        ${Object.values(down).some(Boolean) && build.pick ? '<p class="small warn">⚠ 跨位置衰减生效（▼）</p>' : ''}
      </div>
    </div>
    ${done ? `<section class="card"><p>能力值不打折。新秀赛季（文字模拟）的常规赛、季后赛数据打九折；进入挑战王朝后数据不打折。</p>
      <p class="small muted">每项都有位置保底：本位置的核心能力至少 C+，其他也至少 C-。</p></section>
      <button class="btn btn-primary" id="finish">${intro && intro.star ? `完成，空降${esc(C.teamOfStar(starOf(intro.star)).cn)}` : '完成，选一位明星加入他的球队'}</button>` : ''}`;
  document.getElementById('editPos').onclick = () => go(() => createPos(build.pos)); // 改位置（问答后默认用了球星的位置）
  if (!done) {
    // 手机上也是左右两栏（左边能力、右边挑人），挑人、锁定都不用滚动（2026-11-27 用户：「改成左右屏，不要上下屏」）
    app.querySelectorAll('.bp').forEach((b) => (b.onclick = () => {
      build.pick = build.shown[Number(b.dataset.i)];
      buildScreen();
    }));
    app.querySelectorAll('.attr.click').forEach((el) => (el.onclick = () => {
      const k = el.dataset.attr;
      if (build.locked[k] || !build.pick) return;
      const d = C.decay(build.pos, build.pick.pos, k);
      build.locked[k] = { v: Math.max(25, C.attrsOf(build.pick)[k] - d), from: build.pick.name, down: d > 0 };
      toast(`锁定 ${k} ${finalVal(k, build.locked[k].v)}（来自 ${short(build.pick.name)}）`);
      if (Object.keys(build.locked).length < C.ATTRS.length) spinTeam();
      else { build.pick = null; buildScreen(); }
    }));
    // 换球队 3 次、换球员 3 次，各算各的：换球员是留在本队、换一批没出现过的球员
    document.getElementById('reTeam').onclick = () => { if (build.reTeam > 0) { build.reTeam--; spinTeam(); } };
    // 一键随机：剩下的每项能力都随机一支队、从展示的 5 人里随机挑一个（跨位置衰减照常算）
    document.getElementById('autoPick').onclick = () => {
      if (build.spinning) return;
      const left = E.shuffle(C.ATTRS.filter((k) => !build.locked[k]));
      for (const k of left) {
        const team = TEAMS[Math.floor(Math.random() * TEAMS.length)];
        const src = E.shuffle(team.list).slice(0, 5)[Math.floor(Math.random() * Math.min(5, team.list.length))];
        const d = C.decay(build.pos, src.pos, k);
        build.locked[k] = { v: Math.max(25, C.attrsOf(src)[k] - d), from: src.name, down: d > 0 };
      }
      build.pick = null;
      toast(`🎲 系统随机选好了 ${left.length} 项能力`);
      buildScreen();
    };
    document.getElementById('rePlayers').onclick = () => {
      if (build.rePlayers <= 0 || !build.team) return;
      build.rePlayers--;
      const seen = build.seen || new Set(build.shown.map((p) => p.name));
      const fresh = E.shuffle(build.team.list.filter((p) => !seen.has(p.name)));
      // 本队没见过的人不够 5 个，就用见过的（但不是刚才这批）补齐
      const now = new Set(build.shown.map((p) => p.name));
      const old = E.shuffle(build.team.list.filter((p) => seen.has(p.name) && !now.has(p.name)));
      build.shown = [...fresh, ...old, ...E.shuffle(build.shown)].slice(0, 5);
      for (const p of build.shown) seen.add(p.name);
      build.seen = seen;
      build.pick = null;
      toast(`${C.TEAM_CN[build.team.code]}换了一批球员`);
      buildScreen();
    };
  } else document.getElementById('finish').onclick = () => (intro && intro.star ? go(lookPage, starOf(intro.star), () => joinTeam(starOf(intro.star))) : go(pickStarCareer));
}
// ---------- 造型：进入联盟前，从 15 个造型（faces.js）里自己选一个 ----------
//   2026-11-19：一开始是随机 + 换 2 次，用户说「不要随机，让玩家自己从 15 个人里面选」
//   上面一张大卡预览，下面 15 张小卡（5 列 × 3 行）点哪个看哪个，再点「进入联盟」
// 2026-11-27 用户：「单独给玩家设计个起名字环节，可以和捏脸一起」——这一页改成「起个名字，挑个造型」：
//   名字框在大卡下面，打字时大卡上的名字跟着变；下面按你的打法给 3 个虎扑味的名字建议（点一下填进去，🎲 换一批）；
//   不起名就叫「无名新秀」。虎扑版自己打的名字要先过内容安全检测（GameHupu.checkText），建议的名字是游戏自带的，不用检测
const DEFAULT_NAME = '无名新秀';
const NAME_IDEAS = {
  '3分': ['三分雨神', '远投狙击手', '后撤步大师', '中场神射', '三分外线王'],
  '2分': ['中投大师', '肘区之王', '急停跳投侠', '中距离教父', '翻身跳投王'],
  '终结': ['篮下终结者', '扣篮狂人', '上篮艺术家', '突破快刀', '篮下魔术手'],
  '传球': ['助攻机器', '场上指挥官', '不看人传球', '妙传诗人', '组织大脑'],
  '篮板': ['篮板收割机', '禁区铁闸', '二次进攻王', '篮板怪兽', '内线清道夫'],
  '力量': ['低位推土机', '禁区坦克', '背打狂魔', '内线硬汉', '人形高墙'],
  '弹跳': ['起飞少年', '弹簧腿', '暴扣少年', '天花板跳跃', '飞天新秀'],
};
const NAME_COMMON = ['板凳奇兵', '看台逆袭者', '步行街新星', '夜场之王', '空降新秀', '野球场传说', '冷血杀手', '关键先生'];
function nameIdeas(n = 3, avoid = []) {
  const s = intro && intro.style && C.playStyle(intro.style);
  const own = E.shuffle((s && NAME_IDEAS[s.attr]) || []).filter((x) => !avoid.includes(x));
  const rest = E.shuffle(NAME_COMMON).filter((x) => !avoid.includes(x));
  return [...own.slice(0, 2), ...rest].slice(0, n);
}
const isPresetName = (s) => s === DEFAULT_NAME || NAME_COMMON.includes(s) || Object.values(NAME_IDEAS).some((l) => l.includes(s));
function lookPage(star, next) {
  const code = C.teamOfStar(star).team;
  const { kit } = Avatar.kitOf({ name: build.name, team: code, from: '现役', season: '本季', isMe: true, num: 7 });
  if (build.look == null) build.look = 0;
  const named = build.name && build.name !== DEFAULT_NAME ? build.name : ''; // 上次起过的名字（老玩家）先填上
  // 大卡：15 个造型一开始全部画好，点小卡只切换显示哪一张（不在点击时往页面写 HTML——
  //   虎扑安全检测把点击时重写大卡列为需人工复核，2026-11-26 用户贴来让改）；名字也只用 textContent 改
  const big = (i) => `<div class="lb" data-i="${i}"${i === build.look ? '' : ' hidden'}>${Faces.svg(i, kit, { bare: true })}<div class="lc-name"><small>${esc(Faces.LOOKS[i].name)}</small><b class="lc-me">${esc(named || DEFAULT_NAME)}</b></div></div>`;
  const ideaBtns = (list) => list.map((x) => `<button type="button" class="name-idea" data-n="${esc(x)}">${esc(x)}</button>`).join('');
  app.innerHTML = `<p class="eyebrow">🪞 进入联盟之前</p><h2>起个名字，挑个造型</h2>
    <div class="look-stage"><div class="look-card done" id="lookBig" style="--c1:${kit.primary}">${Faces.LOOKS.map((L, i) => big(i)).join('')}</div></div>
    <section class="name-box">
      <label class="name-label" for="myName">你的名字<small>最多 8 个字，不起就叫「${DEFAULT_NAME}」</small></label>
      <input class="name-input" id="myName" maxlength="8" placeholder="给自己起个名字" autocomplete="off" value="${esc(named)}">
      <div class="name-ideas"><span>试试：</span><span id="ideas">${ideaBtns(nameIdeas())}</span><button type="button" class="name-idea dice" id="moreIdeas" aria-label="换一批名字">🎲</button></div>
    </section>
    <p class="look-sub">挑个造型（点小卡看大图）</p>
    <div class="look-grid">${Faces.LOOKS.map((L, i) => `<button class="look-thumb${i === build.look ? ' sel' : ''}" data-i="${i}" style="--c1:${kit.primary}" aria-label="${esc(L.name)}">
      ${Faces.svg(i, kit, { bare: true })}<span>${esc(L.name)}</span></button>`).join('')}</div>
    <button class="btn btn-primary sticky-cta" id="lookOk"></button>`;
  const card = document.getElementById('lookBig');
  const okBtn = document.getElementById('lookOk');
  const input = document.getElementById('myName');
  const nameNow = () => input.value.trim() || DEFAULT_NAME;
  // 按钮、大卡上的名字都是纯文字，用 textContent 写
  const refresh = () => {
    okBtn.textContent = `就叫「${nameNow()}」，进入联盟`;
    card.querySelectorAll('.lc-me').forEach((x) => (x.textContent = nameNow()));
  };
  refresh();
  input.addEventListener('input', refresh);
  const bindIdeas = () => app.querySelectorAll('#ideas .name-idea').forEach((b) => (b.onclick = () => { input.value = b.dataset.n; refresh(); }));
  bindIdeas();
  document.getElementById('moreIdeas').onclick = () => {
    const shown = [...app.querySelectorAll('#ideas .name-idea')].map((b) => b.dataset.n);
    const box = document.getElementById('ideas');
    box.textContent = '';
    for (const x of nameIdeas(3, shown)) { const b = document.createElement('button'); b.type = 'button'; b.className = 'name-idea'; b.dataset.n = x; b.textContent = x; box.appendChild(b); }
    bindIdeas();
  };
  app.querySelectorAll('.look-thumb').forEach((b) => (b.onclick = () => {
    const i = Number(b.dataset.i);
    if (i === build.look) return;
    build.look = i;
    card.querySelectorAll('.lb').forEach((x) => (x.hidden = Number(x.dataset.i) !== i));
    card.classList.remove('done'); void card.offsetWidth; card.classList.add('done'); // 换人时大卡弹一下
    app.querySelectorAll('.look-thumb').forEach((x) => x.classList.toggle('sel', x === b));
  }));
  okBtn.onclick = async () => {
    const name = nameNow();
    // 虎扑版：自己打的名字先过虎扑内容安全检测，没通过不让进（上次检测通过、存下来的名字不再查；建议的名字是游戏自带的）
    if (window.GameHupu && !isPresetName(name) && name !== store.get('nba-myname', '')) {
      okBtn.disabled = true;
      okBtn.textContent = '名字检测中……';
      const r = await window.GameHupu.checkText(name);
      okBtn.disabled = false;
      refresh();
      if (!r.ok) { toast(r.msg); input.focus(); return; }
    }
    build.name = name;
    store.set('nba-myname', name);
    next();
  };
}
function makeMe() {
  // 每项和位置保底取高的（不会出现 D），隐藏能力原样
  const { attrs } = C.makeRookie(build.pos, build.locked);
  const me = { name: build.name, pos: build.pos, attrs, isMe: true, from: '现役', season: '本季', num: 7,
    look: build.look != null ? build.look : Math.floor(Math.random() * Faces.count) }; // 造型（lookPage 随机的）
  if (intro && intro.style) Object.assign(me, { style: intro.style, origin: 'halftime' });
  else if (intro && intro.hidden && C.HIDDEN[intro.hidden]) Object.assign(me, { hidden: intro.hidden, skill: C.HIDDEN[intro.hidden].skill, origin: 'halftime' }); // 老流程
  me.ovr = C.ovrFromAttrs(attrs, me.pos);
  Object.assign(me, C.projectLine(me));
  return me;
}

// ---------- 3. 选明星，加入他的球队 ----------
function pickStarCareer(selected = null) {
  const s = selected && E.STARS.find((x) => x.name === selected);
  const t = s && C.teamOfStar(s);
  app.innerHTML = `
    <div class="spread"><h2>选一位明星，加入他的球队</h2></div>
    <p class="muted small">选谁，你就去谁的球队（2026-27 赛季真实阵容）。首发是你 + 明星 + 本队 3 名主力，替补也是本队球员。</p>
    ${s ? detailPanel(s, `${t.city} · 2026-27 赛季`) : ''}
    <div class="tgrid">${E.STARS.map((p) => tallCard(p, { button: true, sel: selected === p.name, badge: C.teamOfStar(p).cn, attrs: `data-name="${esc(p.name)}"` })).join('')}</div>
    <button class="btn btn-primary sticky-cta" id="ok" ${s ? '' : 'disabled'}>${s ? `加入${t.cn}，和 ${esc(short(s.name))} 做队友` : '先选一位明星'}</button>`;
  app.querySelectorAll('.tcard[data-name]').forEach((el) => (el.onclick = () => pickStarCareer(el.dataset.name)));
  document.getElementById('ok').onclick = () => go(lookPage, s, () => joinTeam(s));
}
// 抽卡组首发：明星固定，其余 4 个位置各翻 1 张卡；95+ 传奇卡闪金光 1 秒，90+ 金卡闪 0.5 秒
const RANK_BADGE = { legend: '传奇卡', gold: '金卡' };
function rankCard(p, rank, fresh) {
  const html = tallCard(p, { badge: RANK_BADGE[rank] });
  return rank === 'normal' ? html : html.replace('class="tcard', `class="tcard rank-${rank}${fresh ? ` flash-${rank}` : ''}`);
}
// 传奇卡出场动画：和 10 连抽、选秀用同一个（game.js 的 walkout：位置 → 号码 → 球队 → 名字，2 秒，点屏幕跳过）
function legendWalkout(p, done) {
  walkout(p).then(done);
}
function joinTeam(starRaw) {
  const me = makeMe();
  const t = C.teamOfStar(starRaw);
  me.team = t.team;
  const star = { ...starRaw, team: t.team };
  const d = C.drawMates(star, me, Math.random, window.__forceLegend ? 1 : undefined); // __forceLegend：测试用，必出传奇卡
  const flipped = new Set();
  let fresh = new Set(['star']); // 这一次刚翻开的卡才闪光
  const render = () => {
    const all = flipped.size === d.cards.length;
    app.innerHTML = `
      <p class="eyebrow">🎴 抽卡组首发 · ${esc(t.city)}</p>
      <h2>${esc(short(star.name))}给你拉来了几位帮手</h2>
      <p class="muted small">点卡翻牌，看看谁来和你们一起打首发。</p>
      <div class="draw-row">
        <div class="draw-slot"><small>${E.POS_LABEL[star.pos]}</small>${rankCard(star, C.cardRank(star.ovr), fresh.has('star'))}</div>
        ${d.cards.map((c, i) => `<div class="draw-slot"><small>${E.POS_LABEL[c.pos]}</small>${flipped.has(i)
          ? rankCard(c.player, c.rank, fresh.has(i))
          : `<button class="draw-back" data-i="${i}"><b>?</b><small>点击翻牌</small></button>`}</div>`).join('')}
      </div>
      ${all ? '<button class="btn btn-primary" id="ok">首发定了，下一步：替补</button>' : '<button class="btn btn-ghost" id="flipAll">全部翻开</button>'}`;
    fresh = new Set();
    // 翻开的卡里有传奇卡：先放出场动画，再回到牌桌
    const reveal = (idx) => {
      idx.forEach((i) => flipped.add(i));
      fresh = new Set(idx);
      const leg = idx.find((i) => d.cards[i].legend);
      if (leg !== undefined) legendWalkout(d.cards[leg].player, render);
      else render();
    };
    app.querySelectorAll('.draw-back').forEach((b) => (b.onclick = () => reveal([Number(b.dataset.i)])));
    const fa = document.getElementById('flipAll');
    if (fa) fa.onclick = () => reveal(d.cards.map((_, i) => i).filter((i) => !flipped.has(i)));
    const ok = document.getElementById('ok');
    if (ok) ok.onclick = () => benchStep(me, star, t, d);
  };
  Avatar.preloadPhotos([star, ...d.cards.map((c) => c.player), ...d.bench]);
  render();
}
// 首发资格：你的总评 ≥ 队里同位置最高的人（首发 + 替补都算）→ 可以一键进入首发；否则坐替补
function canStart(me, d) {
  const same = [...d.starters, ...d.bench].filter((p) => p.pos === me.pos);
  return same.length > 0 && me.ovr >= Math.max(...same.map((p) => p.ovr));
}
// 进入首发：顶替同位置的首发，他去替补席第一个
function promoteMe(me, d) {
  const i = d.starters.findIndex((p) => p.pos === me.pos);
  d.benched = d.starters[i];
  d.starters = d.starters.map((p, k) => (k === i ? me : p));
  d.bench = [d.benched, ...d.bench];
  d.roster = [...d.starters, ...d.bench];
  d.meStarts = true;
}
// 选完首发选替补：总评不够坐替补席；够了就弹出「获得教练信任」，一键进入首发
function benchStep(me, star, t, d) {
  const eligible = !d.meStarts && canStart(me, d);
  // 手机竖屏：一排 5 张的小卡（以前是一排 3 张大卡，12 个人要翻好几屏）；传奇卡、金卡照样有金边和角标
  const meSlot = miniCard(me);
  const slot = (p, starter) => {
    if (p.isMe) return meSlot;
    const rank = starter ? C.cardRank(p.ovr) : 'normal';
    return miniCard(p, { rank, badge: RANK_BADGE[rank] || '' });
  };
  const rival = d.starters.find((p) => p.pos === me.pos && !p.isMe);
  app.innerHTML = `
    <p class="eyebrow">${d.meStarts ? '🔥 首发' : '🪑 替补席'} · ${esc(t.city)}</p>
    <h2>${d.meStarts ? '你进入了首发' : '替补席已自动补齐'}</h2>
    <p class="muted small">${d.meStarts ? `${E.POS_LABEL[me.pos]}的位置交给你，${esc(short(d.benched.name))}去替补席。` : eligible ? `训练营里，你和${E.POS_LABEL[me.pos]} ${esc(short(rival.name))}对位了一整个下午，他没占到便宜。` : '新秀先从替补打起，用表现去抢首发。'}</p>
    ${eligible ? `<section class="card skill-card pop" id="trust">
      <p>😏 <b>你微微一笑，已经获得教练信任。</b></p>
      <button class="btn btn-primary" id="promote">一键进入首发</button>
    </section>` : ''}
    <h3>首发</h3>
    <div class="mgrid">${d.starters.map((p) => slot(p, true)).join('')}</div>
    <h3>替补</h3>
    <div class="mgrid">
      ${d.meStarts ? '' : meSlot}
      ${d.bench.map((p) => slot(p, false)).join('')}
    </div>
    ${eligible ? '' : '<button class="btn btn-primary" id="ok">确认阵容</button>'}`;
  if (eligible) {
    document.getElementById('promote').onclick = () => { promoteMe(me, d); toast(`你进入首发，${short(d.benched.name)}去替补席`); benchStep(me, star, t, d); };
  } else document.getElementById('ok').onclick = () => teamStory(me, star, t, d);
}
function teamStory(me, star, t, d) {
  const team = d.roster;
  // trusted：开局就点过「一键进入首发」，以后一直固定首发，不用再点
  run = { v: SAVE_VERSION, medalV: 2, star: star.name, me: me.name, team, level: 0, wins: 0, lives: LIVES, rerolls: 0, draws: 0, signing: null, xp: 0, lv: 1, ups: 0, career: true, story: null, teamCode: t.team, teamLabel: t.cn, trusted: !!d.meStarts };
  save();
  app.innerHTML = `
    <section class="story card pop">
      <p class="eyebrow">2026 年夏天 · ${esc(t.city)}</p>
      ${me.origin === 'halftime' ? `<p>那记砸中 ${esc(short(star.name))} 脑袋的三不沾，在网上播放破了千万。第二天，${esc(t.cn)}总经理亲自打来电话：<b>“${esc(short(star.name))}点名要你。”</b></p>
        ${sigOf(me) ? `<p>公开试训上，你的${esc(sigOf(me).name)}让全场安静了三秒。</p>` : ''}` : ''}
      <p>你签下新秀合同，加入了 <b>${esc(t.city)}</b>，和 <b class="nw">${esc(star.name)}</b> 成了队友。</p>
      <p>训练营第一天，你拎着<b>一箱轩尼诗</b>敲开了${esc(t.cn)}主教练办公室的门。</p>
      <p class="quote">“孩子，我看人从来只看态度。”</p>
      ${d.meStarts
        ? `<p>你没说话，只是微微一笑。第二天，首发名单上赫然写着你的名字：<b>首发${E.POS_LABEL[me.pos]}</b>，${esc(short(d.benched.name))}被换到了替补席。主教练把箱子收进了柜子：<span class="quote">“酒我留下了，首发是你自己挣的。”</span></p>`
        : `<p>第二天，首发名单上没有你的名字。主教练把箱子推了回来：<span class="quote">“酒留下，首发自己去抢。”</span>你被排进了<b>替补席</b>。</p>`}
      <p>首发：${team.slice(0, 5).map((p) => `<span class="nw">${E.POS_LABEL[p.pos]} ${esc(short(p.name))}</span>`).join(' · ')}</p>
    </section>
    <h3>你的球队</h3>
    ${rosterHtml(run.team)}
    <button class="btn btn-primary" id="season">开始 26-27 赛季</button>`;
  document.getElementById('season').onclick = () => go(seasonStory);
}

// ---------- 4. 26-27 赛季：文字模拟，必定夺冠 ----------
async function seasonStory() {
  const me = run.team.find((p) => p.isMe);
  const star = run.team.find((p) => p.name === run.star);
  const s = run.story || (run.story = C.simulateSeason(me, star));
  save();
  const L = s.line, PL = s.playoffLine;
  // 这些数据（赛季结果、球员名）存在本机存档里，读回来再拼进 HTML：每一项都过 esc（虎扑安全复核 2026-11-27）
  const sn = esc(short(star.name)), sig = sigOf(me);
  const lines = [
    `<p class="eyebrow">2026-27 赛季</p>`,
    `<p>10 月，揭幕战。${run.team.slice(0, 5).some((p) => p.isMe) ? '你首发出场 28 分钟' : '你替补登场 14 分钟'}，${L.pts >= 12 ? `砍下 ${esc(Math.round(L.pts + 4))} 分，球迷开始记住你的名字。` : `拿了 ${esc(Math.max(2, Math.round(L.pts - 2)))} 分，${sn}拍了拍你的肩膀。`}</p>`,
    `<p>12 月，${sn}被评为月最佳球员，你也打出了单场生涯新高 <b>${esc(s.career)} 分</b>。</p>`,
    `<p>全明星周末，你在新秀挑战赛上${sig ? `秀出${esc(sig.name)}，解说喊破了音：“这是${esc(short(sig.star))}附体了吗？！”` : me.attrs.弹跳 >= 80 ? '一记暴扣点燃全场' : me.attrs['3分'] >= 80 ? '连中 5 记三分' : '送出 8 次助攻'}</p>`,
    `<p>常规赛结束：${esc(s.teamCN)} <b>${esc(s.wins)} 胜 ${esc(s.losses)} 负</b>，${esc(s.conf)}第 ${esc(s.seed)}。</p>`,
    `<div class="statline"><span>你的常规赛场均</span><b>${esc(L.pts)} 分 · ${esc(L.reb)} 板 · ${esc(L.ast)} 助 · ${esc(L.stl)} 断 · ${esc(L.blk)} 帽</b><small>投篮 ${esc(L.fg)}% · 三分 ${esc(L.tp)}%${s.rookieAward ? ` · ${esc(s.rookieAward)}` : ''}</small></div>`,
    ...s.rounds.map((r, i) => `<p>${esc(r.name)}：${esc(s.teamCN)} <b>${esc(r.score)}</b> ${esc(r.opp)}。${i === 3 ? `总冠军！` : i === 2 ? (r.score === '4-3' ? `${sn}抢七砍下 40 分。` : `${sn}系列赛场均 30+。`) : ''}</p>`),
    `<div class="statline gold"><span>你的季后赛场均</span><b>${esc(PL.pts)} 分 · ${esc(PL.reb)} 板 · ${esc(PL.ast)} 助</b><small>FMVP：${esc(s.fmvp)}</small></div>`,
    `<section class="result-banner win pop"><h2>🏆 2026-27 总冠军</h2><p class="muted">${esc(s.city)} · ${esc(me.name)} 新秀赛季就戴上了戒指</p></section>`,
  ];
  app.innerHTML = `<section class="story card" id="story"></section><div id="after"></div><button class="btn btn-ghost" id="skip">跳过</button>`;
  const box = document.getElementById('story');
  let skip = false;
  document.getElementById('skip').onclick = () => (skip = true);
  for (const l of lines) {
    if (!box.isConnected) return; // 逐行显示期间页面被换掉了（2026-11-26 异常错误率修复：不再去找已经不在的按钮）
    box.insertAdjacentHTML('beforeend', l);
    if (!skip) await wait(reduceMotion ? 100 : 320);
  }
  if (!box.isConnected) return;
  document.getElementById('skip').remove();
  document.getElementById('after').innerHTML = `<button class="btn btn-primary" id="next">打开虎扑看看大家怎么说</button>`;
  document.getElementById('next').onclick = () => go(hupu);
}

// ---------- 5. 虎扑锐评 → 强势回应 → 传奇挑战 ----------
function hupu() {
  const me = run.team.find((p) => p.isMe);
  const s = run.story;
  const comments = [
    [`${short(run.star)}带飞罢了，${me.name}纯纯混子冠军`, '2.3万'],
    [`场均 ${s.line.pts} 分也配戴戒指？换我上也行`, '1.1万'],
    [`听说是给教练送了轩尼诗才首发的，懂的都懂`, '8642'],
    [`现在的冠军含金量……放 90 年代能打几轮？`, '5120'],
  ];
  // 开局身份带来的专属评论
  const H = sigOf(me);
  if (me.origin === 'halftime') comments.splice(2, 0, [`中场投篮三不沾砸了${short(run.star)}一下，就砸进了职业联盟？这剧本编剧都不敢写`, '2.6万']);
  if (H) comments.push([`就会一招${H.name}，${H.attr}之外全是短板，穷人版${short(H.star)}罢了`, '9877']);
  const replies = ['冠军就是冠军，不服来打', '历史上的冠军队，我一支一支去赢给你们看', '轩尼诗是真的，戒指也是真的'];
  app.innerHTML = `
    <section class="hupu card">
      <p class="eyebrow">虎扑 · 步行街</p>
      <h3>【讨论】${esc(me.name)} 是不是史上最水的冠军新秀？</h3>
      ${comments.map(([t, n]) => `<div class="hp-c"><span>${esc(t)}</span><small>亮了 ${n}</small></div>`).join('')}
    </section>
    <p class="muted small">你决定回应：</p>
    ${replies.map((r, i) => `<button class="btn btn-ghost reply" data-i="${i}">${esc(r)}</button>`).join('')}
    <div id="after"></div>`;
  app.querySelectorAll('.reply').forEach((b) => (b.onclick = () => {
    app.querySelectorAll('.reply').forEach((x) => (x.disabled = true));
    document.getElementById('after').innerHTML = `
      <section class="hupu card pop"><div class="hp-c me"><span><b>${esc(me.name)}</b>（本人）：${esc(b.textContent)}</span><small>亮了 4.8万</small></div></section>
      <section class="card pop"><h3>挑战王朝</h3><p class="small">接下来是 ${TOTAL} 支历届总冠军球队，五大 Boss「魔神皇佛鲨」坐镇其中。每打完一场你都会成长，赢球还能 10 连抽补强阵容。</p></section>
      <button class="btn btn-primary" id="go">进入挑战王朝</button>`;
    document.getElementById('go').onclick = () => go(hub);
  }));
}

// ---------- 6. 传奇挑战里的成长 ----------
// 比赛结算后：按你的表现加经验，升级就三选一加能力；打赢了按成长曲线自动成长
// 成长曲线的起点：第一次进传奇挑战（或老存档第一次打开）时的总评和关卡
function growInit(me) {
  if (!run.career || !me || run.ovr0 != null) return;
  run.ovr0 = me.ovr;
  run.lv0 = run.level;
  run.extra = 0;
  save();
}
const _showResult = showResult;
const SHOT_KEYS = ['fg2m', 'fg2a', 'fg3m', 'fg3a', 'ftm', 'fta'];
const pctOf = (m, a) => (a ? `${((100 * m) / a).toFixed(1)}%` : '-');
// 「2分 9-14 · 3分 3-6 · 罚球 6-8」
const shotLine = (x) => `2分 ${x.fg2m}-${x.fg2a} · 3分 ${x.fg3m}-${x.fg3a} · 罚球 ${x.ftm}-${x.fta}`;
// 生涯命中率（只算开始记投篮之后的场次）
const careerShot = (st) => (st && st.sg ? `2分 ${pctOf(st.fg2m, st.fg2a)} · 3分 ${pctOf(st.fg3m, st.fg3a)} · 罚球 ${pctOf(st.ftm, st.fta)}` : '');
// 一场的综合表现分：得分 + 1.2 篮板 + 1.5 助攻 + 3 抢断 + 3 盖帽（本场 MVP、生涯最佳一场都按这个比）
const gameScore = (x) => x.pts + 1.2 * x.reb + 1.5 * x.ast + 3 * x.stl + 3 * x.blk - (x.tov || 0);
const lineText = (x) => `${x.pts} 分 ${x.reb} 板 ${x.ast} 助 ${x.stl} 断 ${x.blk} 帽${x.tov != null ? ` ${x.tov} 失误` : ''}`;
showResult = function (r) {
  growInit(run.career && run.team.find((p) => p.isMe));
  const lvIdx = run.level; // 这场打的是第几关（赢了之后 run.level 会 +1）
  _showResult(r);
  if (!run.career) return;
  const me = run.team.find((p) => p.isMe);
  // 成长：每打完一场（输赢都算）得 7 个能力点，自己加到任意能力上（单项上限 100）；不再自动成长、不再升级三选一 +3
  migratePoints();
  run.addPts = (run.addPts || 0) + C.POINTS_PER_GAME;
  const row = r.box[0].find((x) => x.name === me.name);
  // 个人数据统计：场次、累计、单场最高
  const st = run.stats || (run.stats = { g: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, hi: { pts: 0, reb: 0, ast: 0 } });
  // 本场 MVP：两队所有上场球员里综合表现分最高的人
  const L = E.LEVELS[lvIdx];
  const played = [...r.box[0].map((x) => ({ ...x, side: 0 })), ...r.box[1].map((x) => ({ ...x, side: 1 }))].filter((x) => x.min);
  const mvp = played.length ? played.reduce((a, b) => (gameScore(b) > gameScore(a) ? b : a)) : null;
  const mvpPlayer = mvp && (mvp.side === 0 ? run.team : L.roster).find((p) => p.name === mvp.name);
  // 本场高光标签：本场 MVP、全场得分王、三双 / 两双、生涯新高（要在更新单场最高之前判断）
  const tags = [];
  if (row && row.min) {
    if (mvp && mvp.me) tags.push('🏅 本场 MVP');
    if (row.pts > 0 && row.pts >= Math.max(...played.map((x) => x.pts))) tags.push('👑 全场得分王');
    const dd = ['pts', 'reb', 'ast', 'stl', 'blk'].filter((k) => row[k] >= 10).length;
    if (dd >= 3) tags.push('🔥 三双'); else if (dd === 2) tags.push('💪 两双');
    if (st.g && row.pts > st.hi.pts) tags.push('📈 生涯新高');
    if (row.pts >= 50) tags.push('💥 50+');
    // 生涯统计：MVP、两双、三双、50+ 次数，最佳一场
    st.mvp = (st.mvp || 0) + (mvp && mvp.me ? 1 : 0);
    st.dd = (st.dd || 0) + (dd >= 2 ? 1 : 0);
    st.td = (st.td || 0) + (dd >= 3 ? 1 : 0);
    st.p50 = (st.p50 || 0) + (row.pts >= 50 ? 1 : 0);
    if (!st.best || gameScore(row) > st.best.gs) {
      st.best = { gs: gameScore(row), pts: row.pts, reb: row.reb, ast: row.ast, stl: row.stl, blk: row.blk, min: row.min, level: lvIdx + 1, opp: `${L.year} ${E.nick(L.team)}`, win: r.win, final: r.final };
    }
  }
  if (row && row.min) {
    st.g++;
    for (const k of ['min', 'pts', 'reb', 'ast', 'stl', 'blk', 'tov']) st[k] = (st[k] || 0) + (row[k] || 0);
    // 投篮：两分、三分、罚球的命中 / 出手（2026-11-18 才开始记，sg = 记了投篮的场数）
    if (row.fg2a != null) { st.sg = (st.sg || 0) + 1; for (const k of SHOT_KEYS) st[k] = (st[k] || 0) + (row[k] || 0); }
    for (const k of ['pts', 'reb', 'ast']) st.hi[k] = Math.max(st.hi[k], row[k]);
  }
  // 每打赢 3 关抽 3 个被动技能（11-19 起 Boss 改成第 6/12/18/24/30 关的五大 Boss，勋章还是每 3 关一次）
  if (r.win && run.level % C.PASSIVE_EVERY === 0 && run.level < TOTAL) run.passivePending = (run.passivePending || 0) + 1;
  // 每赢一场：幸运值 +7（满 50 / 100 得宝箱）
  const luckWin = r.win ? addLuck(LUCK_WIN) : null;
  // 挑战失败（还有命）：补偿一次 10 连抽（11-26 用户要求；以前是进传奇选秀大会挑 1 人，和别的环节不协调）
  const loseDraw = !r.win && run.lives > 0;
  if (loseDraw) run.draws = (run.draws || 0) + 1;
  save();
  const avg = (k) => (st.g ? ((st[k] || 0) / st.g).toFixed(1) : '0.0');
  const trig = (r.triggers || []).map((k) => E.PASSIVES[k]);
  const after = document.getElementById('after');
  // 放在「胜利 / 惜败」下面（以前在它上面，结果被挤到中间）
  (after.querySelector('.result-banner') || after).insertAdjacentHTML(after.querySelector('.result-banner') ? 'afterend' : 'afterbegin', `<section class="card grow pop">
    ${mvp ? `<div class="mvp-strip ${mvp.me ? 'is-me' : ''}">
      <div class="mvp-av">${mvpPlayer ? Avatar.avatarSVG(mvpPlayer) : ''}</div>
      <div><p class="eyebrow">🏅 本场 MVP${mvp.me ? ' · 就是你！' : ''}</p>
        <b>${esc(mvp.me ? me.name : mvp.name)}</b><small>${esc(r.labels[mvp.side])}</small>
        <span class="num">${lineText(mvp)}</span></div>
    </div>` : ''}
    <div class="spread"><b>${esc(me.name)}${buffTags(me)}</b><span class="num" style="color:var(--gold);white-space:nowrap">+${C.POINTS_PER_GAME} 能力点</span></div>
    ${row && row.min ? `<div class="my-hero">
      ${[['pts', '得分'], ['reb', '篮板'], ['ast', '助攻'], ['stl', '抢断'], ['blk', '盖帽']].map(([k, l]) => `<div class="${row[k] >= 10 ? 'hot' : ''}"><b class="num">${row[k]}</b><span>${l}</span></div>`).join('')}
      ${tags.length ? `<p class="my-tags">${tags.map((t) => `<i>${t}</i>`).join('')}</p>` : ''}
    </div>` : '<p class="muted small">本场未上场</p>'}
    ${trig.length ? `<div class="pas-hit">${trig.map((p) => `⚡ 触发被动【${esc(p.name)}】`).join('　')}</div>` : ''}
    <table class="mystat"><thead><tr><th></th><th>时间</th><th>分</th><th>板</th><th>助</th><th>断</th><th>帽</th><th>失误</th></tr></thead><tbody>
      <tr><td>本场</td>${row && row.min ? ['min', 'pts', 'reb', 'ast', 'stl', 'blk', 'tov'].map((k) => `<td class="num">${row[k] != null ? row[k] : 0}</td>`).join('') : '<td colspan="7">未上场</td>'}</tr>
      <tr><td>场均（${st.g} 场）</td>${['min', 'pts', 'reb', 'ast', 'stl', 'blk', 'tov'].map((k) => `<td class="num">${avg(k)}</td>`).join('')}</tr>
    </tbody></table>
    ${row && row.min && row.fg2a != null ? `<p class="shot-line"><b>本场投篮</b>${shotLine(row)}<br><b>生涯命中率</b>${careerShot(st)}</p>` : ''}
    <p class="small muted">单场最高：${st.hi.pts} 分 · ${st.hi.reb} 板 · ${st.hi.ast} 助　|　总评 ${me.ovr}/${C.OVR_MAX}</p>
    ${xpBar()}
    ${luckWin ? `<p class="small" style="color:#9fe3b5;margin:4px 0 0">${luckText(luckWin)}（${run.luck}/${LUCK_MAX}）</p>` : ''}
    ${run.addPts ? `<button class="btn btn-gold" id="levelup">🎯 加点：${run.addPts} 点自由分配</button>` : ''}</section>`);
  // 打赢五大 Boss：结果横幅下面加一行，并拿到这位 Boss 的球员卡（已经在你队里了就换成幸运值）
  const banner = after.querySelector('.result-banner');
  if (r.win && L.boss) {
    banner.insertAdjacentHTML('beforeend', `<p class="boss-beat">👑 你击败了五大 Boss 之「${L.boss.glyph}」${esc(E.bossName(L.boss))}！</p>`);
    const card = bossCardOf(lvIdx);
    if (lvIdx >= TOTAL - 1) { /* 最后一关打完就通关了，Boss 卡没用，不发 */ }
    else if (dupBlocked(card)) { // 队里已经有他、而且不比 Boss 卡弱；队里是他更弱的版本就照常发卡（签下即升级）
      const lk = luckText(addLuck(BOSS_CARD_LUCK));
      banner.insertAdjacentHTML('beforeend', `<p class="small muted">${esc(short(card.name))} 已经在你队里，Boss 卡换成 ${lk || `幸运值 +${BOSS_CARD_LUCK}`}</p>`);
    } else {
      run.bossCards = [...(run.bossCards || []), lvIdx];
      const btn = `<button class="btn btn-gold boss-card-btn pop" id="toBossCard">👑 领取 Boss 球员卡：${esc(card.name)}（${L.year}）</button>`;
      const db0 = document.getElementById('draw');
      if (db0) db0.insertAdjacentHTML('beforebegin', btn); else after.insertAdjacentHTML('beforeend', btn);
      document.getElementById('toBossCard').onclick = () => go(bossCardPage);
    }
    save();
  }
  // 输了：对面嘲讽一句（Boss 是专属台词），放在「惜败」下面
  if (!r.win) banner.insertAdjacentHTML('afterend', tauntCard(L, r));
  // 加点、抽卡、勋章都是单独页面（底部导航也能去）
  const b = document.getElementById('levelup');
  if (b) b.onclick = () => go(pointsPage);
  // 赢球后的「10 连抽」按钮改成去抽取页（Boss 关还会多一次勋章）
  const db = document.getElementById('draw');
  if (db) {
    db.textContent = `🎴 去抽取：${drawLabel()}`;
    db.onclick = () => go(drawCenter, r.win && run.passivePending && run.level % C.PASSIVE_EVERY === 0 ? 'medal' : 'cards');
  }
  // 输了：结算页最上面放 10 连抽补偿入口（不想现在抽，之后在「抽卡」页也能抽）
  if (loseDraw) {
    after.insertAdjacentHTML('afterbegin', `<button class="btn btn-gold lose-draw-btn pop" id="toDraw">🎴 挑战失败补偿：送你一次 10 连抽</button>`);
    document.getElementById('toDraw').onclick = () => go(drawCenter, 'cards');
  }
  setNav('play'); // 比赛打完，底部导航出来（直播时是收起的）
};
const drawLabel = () => [run.draws ? `10 连抽 ×${run.draws}` : '', run.passivePending ? `勋章 ×${run.passivePending}` : '', chestReady() ? `宝箱 ×${chestReady()}` : ''].filter(Boolean).join(' · ');

// 三届传奇选秀（1984 / 1996 / 2003）的球员已经全部去掉（2026-11-26 用户：「选秀包里的球员去掉」）：
//   以前输球后有「传奇选秀大会」挑 1 人、宝箱候选里也有他们；现在选秀页删了，宝箱也不出，drafts.js 不再加载。
//   老存档里已经签下的选秀球员照旧留在队里（卡片来历靠 p.draft 显示「'03 选秀 #5」）
const shuffleArr = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// 新人进队（宝箱、Boss 卡共用）：换下同位置最弱的；同位置没人能换，就换替补席最弱的——
// 2026-11-19 起替补不看位置：他加进来排好首发后，替补里总评最低的人被换下（E.replaceTarget）。被换下的人变成幸运值
function bringIn(p) {
  // 开局选的明星不再是核心，也可以被换下（你自己永远不会被换）；队里已有同一个人的弱版本 → 换下那个版本（升级，E.signTarget）
  const out = E.signTarget(run.team, p, coreNames());
  if (!out) { toast('没有能换下的人'); return null; }
  run.team[out.i] = { ...p };
  run.team = E.arrange(run.team, coreNames());
  return { out: out.x, luck: luckText(addLuck(luckFor(out.x))) };
}
// ---------- 幸运宝箱：宝箱 = 10 名 85-95 球员自选 1 名；超级明星宝箱 = 10 名 95+ 球员自选 1 名 ----------
// 候选：历届冠军球员（10 连抽卡池）+ 现役球员；同一个人只出一个版本。
//   阵中已有的人（不同译名也算）：只出比队里那张更强的版本（选了就升级，2026-11-26 用户定「同一人只留一张，可升级」）
const CHEST = {
  normal: { name: '宝箱', icon: '🎁', lo: 85, hi: 95, desc: '10 名 85-95 球员，自选 1 名' },
  super: { name: '超级明星宝箱', icon: '👑', lo: 95, hi: 999, desc: '10 名 95+ 球员，自选 1 名' },
};
function chestPool(kind) {
  const c = CHEST[kind];
  const league = Object.keys(C.LEAGUE.teams).flatMap((code) => C.rosterOf(code).map((p) => ({ ...p, team: run.teamCode, realTeam: code, from: '现役', season: '本季' })));
  const all = shuffleArr([...E.GACHA_POOL, ...league].filter((p) => p.ovr >= c.lo && p.ovr <= c.hi && !dupBlocked(p)));
  const out = [];
  for (const p of all) {
    if (out.length >= 10) break;
    if (!out.some((x) => E.samePlayer(x.name, p.name))) out.push({ ...p });
  }
  return out;
}
function chestStage(stage) {
  if (run.chestOffer) return chestOpen(stage); // 开了还没挑人的宝箱（刷新也不会丢）
  const ch = run.chests || { normal: 0, super: 0 };
  const luck = run.luck || 0;
  stage.innerHTML = `<section class="chest-intro">
    <div class="luck"><div class="spread"><b>🍀 幸运值</b><span class="num"><b>${luck}</b> / ${LUCK_MAX}</span></div>
      <div class="luck-bar"><i style="width:${Math.min(100, (luck / LUCK_MAX) * 100)}%"></i><span class="mk" style="left:50%">🎁</span><span class="mk" style="left:100%">👑</span></div>
      <p class="small muted">每赢一场 +${LUCK_WIN}；被换下的球员、重复抽到的球星按段位 +4 ~ +15。满 ${LUCK_STEP} 得宝箱，满 ${LUCK_MAX} 再得超级明星宝箱，然后从头累计。</p></div>
    <div class="chest-row">${['normal', 'super'].map((k) => `<div class="chest ${k}">
      <span class="chest-ico">${CHEST[k].icon}</span><b>${CHEST[k].name}</b><small>${CHEST[k].desc}</small>
      <span class="chest-n num">×${ch[k] || 0}</span>
      <button class="btn ${ch[k] ? 'btn-gold' : 'btn-ghost'} small-btn" data-chest="${k}" ${ch[k] ? '' : 'disabled'}>${ch[k] ? '开启' : '还没有'}</button></div>`).join('')}</div>
  </section>`;
  stage.querySelectorAll('[data-chest]').forEach((b) => (b.onclick = () => {
    if (drawing) return;
    const k = b.dataset.chest;
    const players = chestPool(k).sort((a, b) => b.ovr - a.ovr); // 总评从高到低
    if (!players.length) { toast('这个档次的球员你都有了'); return; }
    run.chests[k]--;
    run.chestOffer = { kind: k, players, revealed: false };
    save();
    chestOpen(stage);
  }));
}
// 宝箱推荐：先看签下后首发 5 人总评加起来涨多少（位置缺口优先：中锋只有 80，文班就比乔丹更值），
// 一样再看整队涨多少（他和被换下的人差多少），再一样就看总评。会把你自己挤下首发的人不算首发提升
function chestGain(p) {
  const out = E.signTarget(run.team, p, coreNames()); // 同一个人的更强版本：换下旧版本（升级）
  if (!out) return null;
  const now = E.arrange(run.team, coreNames());
  const next = [...run.team];
  next[out.i] = { ...p };
  const after = E.arrange(next, coreNames());
  const sum = (t) => t.slice(0, 5).reduce((s, x) => s + x.ovr, 0);
  const benchMe = now.slice(0, 5).some((x) => x.isMe) && !after.slice(0, 5).some((x) => x.isMe);
  // 羁绊变化也算进首发提升：羁绊里每个人加的能力值加起来（比如凑成 3 人羁绊 = 3 × 3 = +9）
  const bondNow = bondOf(now), bondAfter = bondOf(after);
  const bondSum = (b) => b.bonus * b.who.length;
  const dBond = bondSum(bondAfter) - bondSum(bondNow);
  return {
    out: out.x,
    start: (benchMe ? Math.min(0, sum(after) - sum(now)) : sum(after) - sum(now)) + dBond,
    dBond, bondNow, bondAfter,
    total: p.ovr - out.x.ovr,
    starts: after.slice(0, 5).some((x) => x.name === p.name),
    was: now.slice(0, 5).find((x) => x.pos === p.pos), // 他这个位置原来的首发
    benchMe,
    upgrade: !!out.upgrade, // 换下的是他自己的旧版本
  };
}
function chestRec(gains) {
  let best = null; // 候选已按总评从高到低排，分数一样时留前面（总评高）的
  gains.forEach((x, i) => {
    if (!x) return;
    const b = best === null ? null : gains[best];
    if (!b || x.start > b.start || (x.start === b.start && x.total > b.total)) best = i;
  });
  return best;
}
function recText(p, x) {
  const pos = E.POS_LABEL[p.pos];
  const bond = x.dBond > 0 ? `；🔗 凑成羁绊：${esc(x.bondAfter.cn)} ${x.bondAfter.n} 人同队首发，这 ${x.bondAfter.n} 人各 +${x.bondAfter.bonus}`
    : x.dBond < 0 ? `；但会拆散羁绊（${esc(x.bondNow.cn)} ${x.bondNow.n} 人 +${x.bondNow.bonus} → ${x.bondAfter.bonus ? `${x.bondAfter.n} 人 +${x.bondAfter.bonus}` : '没有'}）` : '';
  if (x.upgrade) return `⬆ 升级：队里的${esc(short(x.out.name))}（${esc(srcOf(x.out))}）${x.out.ovr} → ${p.ovr}（${esc(srcOf(p))}）${bond}${x.start > 0 ? `（首发提升 +${x.start}）` : ''}`;
  if (x.start > 0 && x.starts && x.was) return `直接首发${pos}，${esc(short(x.was.name))} ${x.was.ovr} → ${p.ovr}${bond}（首发提升 +${x.start}）`;
  if (x.start > 0) return `首发提升 +${x.start}${bond}`;
  if (x.total > 0) return `首发都比他强，补强替补：换下 ${esc(short(x.out.name))}（${x.out.ovr}），+${x.total}`;
  return '这一箱都提升不了你的阵容，选他损失最小';
}
// 宝箱页下面的「我的阵容」：按位置一行，金框是首发；选中某人后，被换下的划掉、新来的标绿
function chestRoster(inP, g) {
  const base = E.arrange(run.team, coreNames());
  const bond = bondOf(base);
  const team = withBond(base); // 羁绊里的人显示加成后的总评
  const starters = new Set(team.slice(0, 5));
  const total = team.slice(0, 5).reduce((s, x) => s + x.ovr, 0);
  const rows = E.POS.map((pos) => {
    const list = team.filter((x) => x.pos === pos).sort((a, b) => b.ovr - a.ovr);
    const chips = list.map((x) => `<span class="cr-chip${starters.has(x) ? ' st' : ''}${x.isMe ? ' me' : ''}${g && g.out.name === x.name ? ' out' : ''}">${x.isMe ? '⭐' : ''}${x.bondPlus ? '🔗' : ''}${esc(short(x.name))}<b>${x.ovr}</b></span>`).join('');
    const add = inP && g && inP.pos === pos ? `<span class="cr-chip in">+${esc(short(inP.name))}<b>${inP.ovr}</b></span>` : '';
    return `<div class="cr-row"><span class="cr-pos">${E.POS_LABEL[pos]}</span><div class="cr-chips">${chips}${add}</div></div>`;
  }).join('');
  return `<section class="chest-roster"><div class="spread"><b>我的阵容</b><small class="muted">${team.length} 人 · 首发总评 ${total}</small></div>
    ${rows}<p class="small bond-line ${bond.bonus ? 'on' : ''}" style="margin:2px 0 0">${bondLine(bond)}${g && g.dBond ? `<br><b>签下 ${esc(short(inP.name))} 后：${g.bondAfter.bonus ? `${esc(g.bondAfter.cn)} ${g.bondAfter.n} 人羁绊，各 +${g.bondAfter.bonus}` : '羁绊拆散，加成取消'}</b>` : ''}</p><p class="small muted cr-key"><span class="cr-chip st">首发</span><span class="cr-chip out">换下</span><span class="cr-chip in">新加入</span></p></section>`;
}
// 开箱：10 张一起翻开（不逐张放特效）→ 点一名 → 签下（95+ 签下时放出场特效）
// 卡片下面一行小字：哪一年哪支队 / 现役 / 哪一届选秀（宝箱 5 列小卡放不下完整的来历）
function srcOf(p) {
  if (p.draft) return `'${String(p.draft.year).slice(2)} 选秀 #${p.draft.pick}`;
  if (p.season === '本季' || p.from === '现役') return '现役';
  const m = String(p.from || '').match(/^(\d{4})\s*(.+)$/);
  return m ? `'${m[1].slice(2)} ${E.nick(m[2])}` : p.from || '';
}
function chestOpen(stage, sel = null) {
  const o = run.chestOffer, c = CHEST[o.kind];
  const tab = document.getElementById('dcFrag');
  if (tab) tab.textContent = `宝箱 ×${chestReady()}`;
  if (!o.revealed) {
    drawing = true;
    stage.innerHTML = '';
    drawCards(o.players, { host: stage, title: `${c.icon} ${c.name}`, sub: c.desc, done: '开始挑人', walk: false }).then(() => {
      drawing = false;
      o.revealed = true;
      save();
      chestOpen(stage);
    });
    return;
  }
  const players = o.players.sort((a, b) => b.ovr - a.ovr); // 旧存档里没排序的也按总评从高到低
  const gains = players.map(chestGain);
  const rec = chestRec(gains);
  if (sel === null) sel = rec; // 默认选中推荐的人，点一下「签下」就行
  const g = sel !== null ? gains[sel] : null;
  const gainTag = (x) => (!x ? '<small class="cg none">没法换</small>'
    : x.start > 0 ? `<small class="cg up">${x.dBond > 0 ? '🔗' : ''}首发 +${x.start}</small>`
      : x.total > 0 ? `<small class="cg bench">替补 +${x.total}</small>` : '<small class="cg none">没提升</small>');
  stage.innerHTML = `<section class="draft-head"><p class="eyebrow">${c.icon} ${c.name}</p><p class="muted small">${c.desc} · 总评从高到低</p></section>
    <div class="mgrid chest-grid">${players.map((p, i) => `<div class="cslot ${sel === i ? 'sel' : ''}" data-i="${i}" role="button" aria-label="选 ${esc(p.name)}">
      ${miniCard(shownAs(p), { sel: sel === i })}
      <small class="c-src">${esc(srcOf(p))}</small>
      ${rec === i ? '<span class="rec-tag">推荐</span>' : ''}${gainTag(gains[i])}</div>`).join('')}</div>
    ${rec !== null ? `<p class="chest-rec">💡 推荐 <b>${esc(short(players[rec].name))}</b>：${recText(players[rec], gains[rec])}</p>` : ''}
    <div class="mp-act">${sel === null ? '<p class="small muted" style="text-align:center">👆 点一名球员</p>'
      : g ? `<button class="btn btn-gold" id="chestSign">${g.upgrade ? `⬆ 升级 ${esc(short(players[sel].name))}：${g.out.ovr} → ${players[sel].ovr}` : `签下 ${esc(short(players[sel].name))}（${E.POS_LABEL[players[sel].pos]} ${players[sel].ovr}），换下 ${esc(short(g.out.name))}（${g.out.ovr}）`}</button>`
        : '<p class="small warn" style="text-align:center">没有能换下的人</p>'}</div>
    ${chestRoster(sel !== null ? players[sel] : null, g)}`;
  stage.querySelectorAll('.cslot').forEach((el) => (el.onclick = () => chestOpen(stage, Number(el.dataset.i))));
  const b = document.getElementById('chestSign');
  if (b) b.onclick = async () => {
    const p = players[sel];
    if (p.ovr >= 95) await walkout(p);
    const r = bringIn(p);
    if (!r) return;
    run.chestOffer = null;
    save();
    toast(`签下 ${short(p.name)}，换下 ${short(r.out.name)}${r.luck ? `；${r.luck}` : ''}`);
    drawCenter('frag');
  };
}
// ---------- 被动技能勋章：单独一页，3 枚勋章一键解锁，三选一（每枚普通 88%、传奇 12%） ----------
const PASSIVE_ICON = {
  tmac: '⏱️', jordan: '😈', kd: '💀', lebron: '👑', curry: '🎯',
  klay: '💦', kobe: '🐍', manu: '🗡️', ai: '🔀', cp3: '🧠', pippen: '🛡️', mutombo: '⛰️', rodman: '🦖', shaq: '🦈', rose: '🌹', carter: '🚀',
};
// 未解锁 = 暗色金属 + 问号；普通 = 银色齿边勋章 + 橙蓝绶带；传奇 = 金色星芒勋章 + 红金绶带
const MEDAL_PAL = {
  locked: { r1: '#3A4664', r2: '#252E44', d0: '#5C6886', d1: '#2A3350', d2: '#141A2A', rim: '#6B7794', ink: '#AEB7CA' },
  normal: { r1: '#F28C28', r2: '#1E3A78', d0: '#FFFFFF', d1: '#C9D1DE', d2: '#6F7B93', rim: '#EEF2F8', ink: '#2A3550' },
  legend: { r1: '#C81E1E', r2: '#F2C14E', d0: '#FFF7D1', d1: '#F2C14E', d2: '#9A5C08', rim: '#FFE38A', ink: '#5A3205' },
};
// 星芒 / 齿边：n 个尖，外半径 R、内半径 r
const starPts = (n, R, r, cx, cy) => Array.from({ length: n * 2 }, (_, i) => {
  const a = (Math.PI * i) / n - Math.PI / 2, d = i % 2 ? r : R;
  return `${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`;
}).join(' ');
function medalSVG(key, i, state) {
  const c = MEDAL_PAL[state], id = `md${i}${state[0]}`;
  const edge = state === 'legend' ? `<polygon points="${starPts(16, 53, 43, 60, 112)}" fill="url(#${id}g)" stroke="${c.d2}"/>`
    : state === 'normal' ? `<polygon points="${starPts(28, 46, 43, 60, 112)}" fill="${c.d1}" stroke="${c.d2}"/>` : '';
  const mark = state === 'locked'
    ? `<text x="60" y="127" text-anchor="middle" font-size="42" font-weight="900" fill="${c.ink}" font-family="Bahnschrift,Arial,sans-serif">?</text>`
    : `<text x="60" y="125" text-anchor="middle" font-size="34">${PASSIVE_ICON[key] || '🏅'}</text>`;
  return `<svg viewBox="0 0 120 170" aria-hidden="true">
    <defs>
      <pattern id="${id}r" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="${c.r2}"/><rect x="5" width="4" height="10" fill="${c.r1}"/></pattern>
      <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-opacity=".4"/><stop offset=".5" stop-opacity="0"/><stop offset="1" stop-opacity=".4"/></linearGradient>
      <radialGradient id="${id}g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c.d0}"/><stop offset=".55" stop-color="${c.d1}"/><stop offset="1" stop-color="${c.d2}"/></radialGradient>
      <clipPath id="${id}c"><circle cx="60" cy="112" r="40"/></clipPath>
    </defs>
    <path d="M34 0H86V58L60 70L34 58Z" fill="url(#${id}r)"/><path d="M34 0H86V58L60 70L34 58Z" fill="url(#${id}s)"/>
    <rect x="30" y="50" width="60" height="10" rx="3" fill="url(#${id}g)" stroke="${c.d2}"/>
    ${edge}
    <circle cx="60" cy="112" r="40" fill="url(#${id}g)" stroke="${c.rim}" stroke-width="3"/>
    <circle cx="60" cy="112" r="32" fill="none" stroke="${c.ink}" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="2 3"/>
    ${mark}
    <ellipse cx="46" cy="94" rx="16" ry="8" fill="#fff" opacity=".28" transform="rotate(-30 46 94)"/>
    <g clip-path="url(#${id}c)"><polygon class="m-shine" points="0,60 18,60 -2,170 -20,170" fill="#fff" opacity=".45"/></g>
  </svg>`;
}
function medalItem(key, i, state, cls = '') {
  const p = E.PASSIVES[key];
  return `<button class="medal ${state} ${cls}" data-i="${i}">
    ${state === 'legend' ? '<i class="m-rays"></i>' : ''}
    <div class="m-art">${medalSVG(key, i, state)}</div>
    ${state === 'locked'
      ? '<span class="m-tag">未解锁</span><b class="m-name">？？？</b>'
      : `<span class="m-tag">${p.rare ? '★ 传奇' : '普通'}</span><b class="m-name">${esc(p.name)}</b><small class="m-star">${esc(short(p.star))}</small><span class="m-desc">${esc(p.desc)}</span>`}
  </button>`;
}
// 粒子：每次单独一块画布，几次爆发互不干扰
function medalBurst(el, color, n) {
  if (reduceMotion || !el) return;
  const b = el.getBoundingClientRect();
  const cv = document.createElement('canvas');
  cv.className = 'mp-canvas';
  document.body.append(cv);
  burst(cv, b.left + b.width / 2, b.top + b.height * 0.66, color, n);
  setTimeout(() => cv.remove(), 1800);
}
function goldFlash() {
  const fl = document.createElement('div');
  fl.className = 'mp-flash';
  document.body.append(fl);
  setTimeout(() => fl.remove(), 1100);
}
// 普通勋章的加持：跟在你的名字后面（图标 + 加了哪项、加多少），外加勋章一共给你加了多少总评
function buffTags(me) {
  const list = (run.passives || []).filter((k) => E.PASSIVES[k] && E.PASSIVES[k].attr);
  if (!list.length) return '';
  const base = { ...me.attrs };
  for (const [a, v] of Object.entries(me.bonus || {})) base[a] -= v;
  const ovr = me.ovr - C.ovrFromAttrs(base, me.pos);
  return `<span class="buffs">${list.map((k) => `<i title="${esc(E.PASSIVES[k].name)}">${PASSIVE_ICON[k] || '🏅'}${Object.entries(E.PASSIVES[k].attr).map(([a, v]) => `${a}+${v}`).join(' ')}</i>`).join('')}${ovr > 0 ? `<i class="buff-ovr">总评+${ovr}</i>` : ''}</span>`;
}
// ---------- 抽卡页（10 连抽 + 幸运宝箱）、勋章页：各是底部导航里的一个页面 ----------
// 2026-11-19 用户要求加点、抽勋章、10 连抽都做成单独页面，底部导航随时切换
let drawing = false; // 动画进行中，不让切标签、切页面
const passivePick = () => go(drawCenter, 'medal');
// 老入口：drawCenter('medal') 去勋章页，其他去抽卡页；不带参数就去有东西可抽的那一页
function drawCenter(tab) {
  if (!tab) tab = run.draws || run.signing ? 'cards' : run.passivePending || run.passiveOffer ? 'medal' : chestReady() || run.chestOffer ? 'frag' : 'cards';
  if (tab === 'medal') return medalPage();
  return cardsPage(tab);
}
function cardsPage(tab) {
  drawing = false;
  if (!tab || tab === 'medal') tab = run.draws || run.signing || !(chestReady() || run.chestOffer) ? 'cards' : 'frag';
  const fr = chestReady();
  app.innerHTML = `
    ${statusBar()}
    <div class="spread"><h2>🃏 抽卡</h2><span class="muted small">🍀 幸运值 ${run.luck || 0} / ${LUCK_MAX}</span></div>
    <div class="dc-tabs two" role="tablist">
      <button role="tab" data-tab="cards" aria-selected="${tab === 'cards'}"><b>🃏 球员 10 连抽</b><small class="${run.draws ? 'has' : ''}" id="dcCards">剩 ${run.draws} 次</small></button>
      <button role="tab" data-tab="frag" aria-selected="${tab === 'frag'}"><b>🍀 幸运宝箱</b><small class="${fr ? 'has' : ''}" id="dcFrag">宝箱 ×${fr}</small></button>
    </div>
    <div id="stage" class="dc-stage"></div>`;
  app.querySelectorAll('.dc-tabs [role=tab]').forEach((b) => (b.onclick = () => { if (!drawing && b.dataset.tab !== tab) cardsPage(b.dataset.tab); }));
  const stage = document.getElementById('stage');
  if (tab === 'frag') chestStage(stage);
  else cardStage(stage);
  setNav('cards');
}
function medalPage() {
  drawing = false;
  const owned = (run.passives || []).filter((k) => E.PASSIVES[k]);
  app.innerHTML = `
    ${statusBar()}
    <div class="spread"><h2>🏅 勋章</h2><span class="muted small">已拥有 ${owned.length} 枚</span></div>
    <div id="stage" class="dc-stage"></div>
    <div id="owned">${medalBook()}</div>`;
  medalStage(document.getElementById('stage'));
  setNav('medal');
}
// 勋章图鉴：传奇 / 普通各一组，已拥有的亮起来、写上效果
function medalBook() {
  const owned = new Set(run.passives || []);
  const keys = Object.keys(E.PASSIVES);
  const group = (title, list) => `<div class="mb-group"><div class="spread"><b>${title}</b><small class="muted mb-count">${list.filter((k) => owned.has(k)).length} / ${list.length}</small></div>
    <div class="mb-list">${list.map((k) => { const p = E.PASSIVES[k]; return `<div class="mb-item ${owned.has(k) ? 'own' : ''} ${p.rare ? 'rare' : ''}" data-k="${esc(k)}"><span class="mb-ico">${PASSIVE_ICON[k] || '🏅'}</span><span><b>${esc(p.name)}</b><small>${esc(short(p.star))}</small></span><em>${esc(p.desc)}</em></div>`; }).join('')}</div></div>`;
  return `<section class="card medal-book"><h3>勋章图鉴</h3>
    ${group('★ 传奇勋章', keys.filter((k) => E.PASSIVES[k].rare))}${group('普通勋章', keys.filter((k) => !E.PASSIVES[k].rare))}
    <p class="small muted">每打赢 ${C.PASSIVE_EVERY} 关解锁 ${C.PASSIVE_DRAWS} 枚，三选一（每枚传奇 ${Math.round(C.LEGEND_PASSIVE_RATE * 100)}%）</p></section>`;
}
// 选完勋章后图鉴跟着变：只改「已拥有」的样式和计数（不重写 HTML，和数据表、造型大卡一样，2026-11-26）
function refreshMedalBook(book) {
  const owned = new Set(run.passives || []);
  book.querySelectorAll('.mb-group').forEach((g) => {
    const items = [...g.querySelectorAll('.mb-item[data-k]')];
    items.forEach((el) => el.classList.toggle('own', owned.has(el.dataset.k)));
    const c = g.querySelector('.mb-count');
    if (c) c.textContent = `${items.filter((el) => owned.has(el.dataset.k)).length} / ${items.length}`;
  });
}
// 10 连抽：一叠卡背 → 点开始，在页面里发牌翻牌 → 一键替换并签约
function cardStage(stage) {
  const pack = (dim) => `<div class="dc-pack ${dim ? 'dim' : ''}">${Array.from({ length: 10 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`;
  finishSigning(true); // 老存档里没签完的那一抽：直接签完（以前的签约页去掉了）
  const result = takeSignResult(); // 刚签完：结果显示在最上面（只显示一次）
  if (!run.draws) {
    stage.innerHTML = `${result}<section class="dc-intro">${pack(true)}<p>10 连抽次数用完了</p><p class="small muted">每打赢一关获得 1 次</p>
      ${result ? '<button class="btn btn-primary" id="toHub">回到关卡</button>' : ''}</section>`;
    const th = document.getElementById('toHub');
    if (th) th.onclick = () => go(hub);
    return;
  }
  stage.innerHTML = `${result}<section class="dc-intro">${pack(false)}
    <p class="small muted">冠军球队夺冠赛季的球员 · 90+ 5% · 80+ 30%<br>抽完一键签约：比队里最弱的替补强就换上（不看位置）；重复抽到的球星转幸运值，其他没签的卡作废</p>
    <button class="btn btn-gold" id="pull">🃏 开始 10 连抽（剩 ${run.draws} 次）</button></section>`;
  document.getElementById('pull').onclick = async () => {
    if (drawing || !run.draws) return;
    drawing = true;
    run.draws--;
    const cards = E.gacha(10);
    run.signing = { cards, signed: [], pick: null, swaps: [] };
    save();
    document.getElementById('dcCards').textContent = `剩 ${run.draws} 次`;
    stage.innerHTML = '';
    await drawCards(cards, { host: stage, title: '十 连 抽', sub: '冠军球队夺冠赛季球员', done: '一键替换并签约' });
    drawing = false;
    finishSigning(true);
    cardsPage('cards'); // 留在抽卡页：最上面是签约结果，下面还能接着抽
    window.scrollTo({ top: 0 });
  };
}
// 被动勋章：3 枚一键解锁，三选一
function medalStage(stage) {
  const me = run.team.find((p) => p.isMe);
  if (!run.passivePending && !run.passiveOffer) {
    const next = Math.ceil((run.level + 1) / C.PASSIVE_EVERY) * C.PASSIVE_EVERY;
    stage.innerHTML = `<section class="medal-page"><div class="medals" style="--n:3">${[0, 1, 2].map((i) => medalItem('mills', i, 'locked')).join('')}</div>
      <p>暂时没有勋章可以解锁</p><p class="small muted">每打赢 ${C.PASSIVE_EVERY} 关获得 1 次${next <= TOTAL ? `，下一次：打赢第 ${next} 关` : ''}</p></section>`;
    return;
  }
  // 这次的 3 枚先存起来（中途刷新也不会重抽）；3 枚互不重复，也不和已有的重复
  if (!run.passiveOffer) {
    const offer = [];
    for (let i = 0; i < C.PASSIVE_DRAWS; i++) {
      const k = C.drawPassive([...(run.passives || []), ...offer]);
      if (k) offer.push(k);
    }
    run.passiveOffer = offer;
    save();
  }
  const got = run.passiveOffer;
  if (!got.length) { run.passiveOffer = null; run.passivePending = 0; save(); stage.innerHTML = '<p class="muted" style="text-align:center">被动技能已经全部集齐</p>'; return; }
  const rate = Math.round(C.LEGEND_PASSIVE_RATE * 100);
  const real = (k) => (E.PASSIVES[k].rare ? 'legend' : 'normal');
  let phase = 'locked', sel = null;
  stage.innerHTML = `<section class="medal-page" id="mp">
    <h2 id="mpTitle">被动技能勋章</h2>
    <p class="muted small" id="mpSub">${got.length} 枚勋章，解锁后三选一 · 每枚普通 ${100 - rate}% / 传奇 ${rate}%</p>
    <div class="medals" id="medals" style="--n:${got.length}">${got.map((k, i) => medalItem(k, i, 'locked')).join('')}</div>
    <div id="mpAct" class="mp-act"><button class="btn btn-gold" id="unlock">🔓 一键解锁</button></div>
  </section>`;
  const page = document.getElementById('mp');
  const medals = document.getElementById('medals');
  const act = document.getElementById('mpAct');
  const medalEl = (i) => medals.querySelector(`.medal[data-i="${i}"]`);
  // 一键解锁：3 枚依次翻转亮相；翻出传奇时金光 + 震屏 + 金色粒子
  async function unlockAll() {
    if (phase !== 'locked') return;
    phase = 'unlocking';
    drawing = true;
    act.innerHTML = '<p class="small muted">解锁中……</p>';
    for (let i = 0; i < got.length; i++) {
      medalEl(i).classList.add('spin-out');
      await wait(300);
      const state = real(got[i]);
      medalEl(i).outerHTML = medalItem(got[i], i, state, 'spin-in');
      const legend = state === 'legend';
      medalBurst(medalEl(i).querySelector('.m-art'), legend ? '#FFD54A' : '#DDE4F0', legend ? 90 : 26);
      if (legend && !reduceMotion) {
        goldFlash();
        page.classList.remove('quake');
        void page.offsetWidth;
        page.classList.add('quake', 'legend-hit');
      }
      await wait(legend ? 450 : 120);
      if (!page.isConnected) { drawing = false; return; } // 动画期间页面被换掉了：停下（三枚已存进 run.passiveOffer，回来还能选）
    }
    drawing = false;
    phase = 'open';
    page.querySelector('#mpTitle').textContent = '选择你的勋章';
    page.querySelector('#mpSub').textContent = '三选一，佩戴后永久生效';
    medals.querySelectorAll('.medal').forEach((el) => (el.onclick = () => {
      if (phase !== 'open') return;
      sel = Number(el.dataset.i);
      medals.querySelectorAll('.medal').forEach((m) => m.classList.toggle('sel', m === el));
      renderAct();
    }));
    renderAct();
  }
  function renderAct() {
    act.innerHTML = sel === null
      ? '<p class="small muted">👆 点一枚勋章</p>'
      : `<button class="btn btn-gold" id="wear">佩戴【${esc(E.PASSIVES[got[sel]].name)}】</button>`;
    const w = document.getElementById('wear');
    if (w) w.onclick = wear;
  }
  function wear() {
    const k = got[sel], p = E.PASSIVES[k], before = me.ovr;
    (run.passives || (run.passives = [])).push(k);
    C.applyPassive(me, k);
    run.extra = (run.extra || 0) + (me.ovr - before); // 普通被动给的总评是额外的，叠在成长曲线上
    run.passiveOffer = null;
    run.passivePending = Math.max(0, (run.passivePending || 1) - 1);
    save();
    phase = 'chosen';
    medals.classList.add('chosen');
    medalBurst(medalEl(sel).querySelector('.m-art'), p.rare ? '#FFD54A' : '#F28C28', 60);
    document.getElementById('mpTitle').textContent = '勋章已佩戴';
    document.getElementById('mpSub').textContent = `已拥有 ${run.passives.length} 枚被动勋章`;
    act.innerHTML = `<section class="card skill-card pop">
        <p class="eyebrow">获得被动</p>
        <h3>${PASSIVE_ICON[k] || '🏅'} ${p.rare ? '★ ' : ''}${esc(p.name)}</h3>
        <p class="small">${esc(p.desc)}</p>
        <p class="small muted">${p.rare ? `传奇被动：每场 ${Math.round(p.rate * 100)}% 概率触发，可以和其他传奇被动叠加` : `能力加成直接生效，总评 ${before} → ${me.ovr}`}</p>
      </section>
      ${run.passivePending ? `<button class="btn btn-gold" id="again">🏅 再解锁一次（剩 ${run.passivePending} 次）</button>` : ''}
      ${run.draws ? `<button class="btn btn-gold" id="toCards">🃏 去 10 连抽（剩 ${run.draws} 次）</button>` : ''}
      <button class="btn btn-primary" id="back">回到关卡大厅</button>`;
    const ml = document.getElementById('dcMedal');
    if (ml) { ml.textContent = `剩 ${run.passivePending} 次`; ml.classList.toggle('has', !!run.passivePending); }
    const book = document.getElementById('owned');
    if (book) refreshMedalBook(book);
    setNav('medal'); // 红点数字跟着变
    const again = document.getElementById('again');
    if (again) again.onclick = () => drawCenter('medal');
    const tc = document.getElementById('toCards');
    if (tc) tc.onclick = () => drawCenter('cards');
    document.getElementById('back').onclick = () => go(hub);
  }
  document.getElementById('unlock').onclick = unlockAll;
  medals.querySelectorAll('.medal').forEach((el) => (el.onclick = unlockAll)); // 点任意一枚未解锁的勋章也能解锁
}
// 老存档：以前升级没用掉的「三选一 +3」，每次折成 3 个能力点
function migratePoints() {
  if (run.ups) { run.addPts = (run.addPts || 0) + run.ups * 3; run.ups = 0; save(); }
}
// 原来的经验条改成能力点：每打完一场 +7，自己分配
function xpBar() {
  return `<div class="xp pts-line"><span>🎯 能力点 <b class="num">${run.addPts || 0}</b></span><span class="small muted">每打完一场 +${C.POINTS_PER_GAME} 点，任意加到各项能力，单项上限 100</span></div>`;
}
// 加点：11 项能力自由分配，点 ＋ / − 调整，实时看总评和预计场均；可以只加一部分，剩下的存着下次加
// 底部导航里的「加点」页（pointsPage）和以前的弹窗（levelUp）共用 allocPanel
function pointsPage() {
  migratePoints();
  const me = run.team.find((p) => p.isMe);
  app.innerHTML = `${statusBar()}
    <div class="spread"><h2>🎯 加点</h2><span class="muted small">每打完一场 +${C.POINTS_PER_GAME} 点（输赢都算）</span></div>
    <div id="alloc"></div>`;
  if (me) allocPanel(document.getElementById('alloc'), { page: true, onDone: () => pointsPage() });
  setNav('pts');
}
function levelUp(onDone) {
  migratePoints();
  if (!run.team.find((p) => p.isMe) || !run.addPts) return;
  const ov = document.createElement('div');
  ov.className = 'levelup';
  document.body.append(ov);
  allocPanel(ov, { onDone: () => { ov.remove(); if (onDone) onDone(); }, onClose: () => ov.remove() });
}
function allocPanel(host, opts = {}) {
  const me = run.team.find((p) => p.isMe);
  const plan = {};
  const used = () => Object.values(plan).reduce((s, v) => s + v, 0);
  const cap = (k) => C.attrCap(me, k); // 100 + 勋章加成
  const ov = host;
  const preview = () => { const p = { ...me, attrs: { ...me.attrs } }; return C.addPoints(p, plan); };
  const render = () => {
    const left = (run.addPts || 0) - used();
    const pv = preview();
    ov.innerHTML = `<div class="lu-card alloc${opts.page ? ' page' : ''}">${opts.page ? '' : '<p class="eyebrow">加 点</p>'}
      <h3>${esc(me.name)} 总评 ${me.ovr}${pv.ovr !== me.ovr ? ` → <em class="num up">${pv.ovr}</em>` : ''}</h3>
      <p class="small">${run.addPts ? `剩余 <b class="num al-left">${left}</b> 点` : '<span class="muted">能力点用完了，打完下一场再来</span>'} · 单项上限 100${Object.keys(me.bonus || {}).length ? '（勋章加成另算）' : ''}</p>
      <div class="al-list">${C.ATTRS.map((k) => {
        const add = plan[k] || 0, v = me.attrs[k] + add, full = v >= cap(k);
        return `<div class="al-row${add ? ' on' : ''}"><span class="al-k">${k}<small>${C.ATTR_STAT[k] || ''}</small></span>
          <span class="al-v num">${v}${add ? `<i>+${add}</i>` : ''}${full ? '<small>满</small>' : ''}</span>
          <button class="al-b" data-k="${k}" data-d="-1" ${add ? '' : 'disabled'} aria-label="${k} 减 1">−</button>
          <button class="al-b" data-k="${k}" data-d="1" ${left > 0 && !full ? '' : 'disabled'} aria-label="${k} 加 1">＋</button></div>`;
      }).join('')}</div>
      <p class="small al-proj">预计场均 ${me.pts} 分 ${me.reb} 板 ${me.ast} 助 ${me.stl} 断 ${me.blk} 帽${used() ? `<br>→ <em>${pv.pts} 分 ${pv.reb} 板 ${pv.ast} 助 ${pv.stl} 断 ${pv.blk} 帽</em>` : ''}</p>
      <div class="al-act"><button class="btn btn-ghost" id="alAuto" ${left > 0 ? '' : 'disabled'}>一键推荐</button><button class="btn btn-ghost" id="alReset" ${used() ? '' : 'disabled'}>重置</button></div>
      <button class="btn btn-gold" id="alOk" ${used() ? '' : 'disabled'}>确认加点${used() ? `（${used()} 点${left ? ` · 存 ${left}` : ''}）` : ''}</button>
      ${opts.page ? '' : `<button class="muted small" id="alClose">${used() ? '取消' : '先存着，下次再加'}</button>`}</div>`;
    ov.querySelectorAll('.al-b').forEach((b) => (b.onclick = () => {
      const k = b.dataset.k, d = Number(b.dataset.d);
      plan[k] = Math.max(0, (plan[k] || 0) + d);
      render();
    }));
    ov.querySelector('#alAuto').onclick = () => { C.suggestPoints(me, run.addPts - used(), plan); render(); };
    ov.querySelector('#alReset').onclick = () => { for (const k of Object.keys(plan)) delete plan[k]; render(); };
    const close = ov.querySelector('#alClose');
    if (close) close.onclick = () => opts.onClose && opts.onClose();
    ov.querySelector('#alOk').onclick = () => {
      const before = me.ovr, n = used();
      C.addPoints(me, plan);
      run.addPts -= n;
      save();
      toast(`加了 ${n} 点，总评 ${before} → ${me.ovr}${run.addPts ? `，还剩 ${run.addPts} 点` : ''}`);
      if (opts.onDone) opts.onDone();
    };
  };
  render();
}
// ---------- 比赛页（关卡大厅）：你是谁 → 待办 → 这一关两队首发对位 → 开始比赛 → 关卡进度 ----------
// 2026-11-19 重新排版：加点、抽卡、勋章挪到底部导航的单独页面，这里只留比赛相关的
const _hub = hub;
hub = function () {
  if (!run.career) return _hub();
  const me = run.team.find((p) => p.isMe);
  if (!me) return _hub();
  growInit(me);
  migratePoints(); // 老存档没用掉的升级 +3 折成能力点
  // 首发：已经获得教练信任（点过一次）就自动留在首发；还没点过、总评又 ≥ 同位置最高的人，弹一次按钮
  const mi = run.team.indexOf(me);
  const same = run.team.filter((p) => !p.isMe && p.pos === me.pos);
  const si = run.team.findIndex((p, i) => i < 5 && p.pos === me.pos && !p.isMe);
  const toStart = () => { const out = run.team[si]; [run.team[si], run.team[mi]] = [me, out]; run.trusted = true; save(); return out; };
  if (mi >= 5 && si >= 0 && run.trusted) {
    toStart(); // 教练信任你：自动回到首发，不用再点
    return hub();
  }
  const canPromote = mi >= 5 && si >= 0 && same.length && me.ovr >= Math.max(...same.map((p) => p.ovr));
  const L = E.LEVELS[run.level];
  const mine = myPower(), pWin = winChance(mine - L.power), total = mine + L.power;
  const bd = bondOf(run.team), team = withBond(run.team), meB = team.find((p) => p.isMe);
  const pas = (run.passives || []).filter((k) => E.PASSIVES[k]); // 老存档里可能有已删掉的被动
  // 待办：点一下直接去对应页面（底部导航上也有红点）
  const todo = [
    (run.bossCards || []).length ? ['bosscard', '👑', `Boss 球员卡${run.bossCards.length > 1 ? ` ×${run.bossCards.length}` : ''}`] : null,
    run.addPts ? ['pts', '🎯', `${run.addPts} 能力点待分配`] : null,
    run.signing ? ['cards', '✍️', '10 连抽待签约'] : run.draws ? ['cards', '🃏', `10 连抽 ×${run.draws}`] : null,
    chestReady() || run.chestOffer ? ['frag', '🎁', run.chestOffer ? '宝箱待挑人' : `宝箱 ×${chestReady()}`] : null,
    run.passivePending || run.passiveOffer ? ['medal', '🏅', `勋章 ×${run.passivePending || 1}`] : null,
  ].filter(Boolean);
  const oppFive = L.roster.slice(0, 5).map((x) => (L.bond ? { ...x, ovr: x.ovr + L.bond, bondPlus: L.bond } : x));
  app.innerHTML = `
    ${statusBar()}
    ${canPromote ? `<section class="card skill-card pop">
      <p>😏 <b>你微微一笑，已经获得教练信任。</b></p>
      <p class="small muted">总评 ${me.ovr}，不低于同位置的 ${esc(short(run.team[si].name))}（${run.team[si].ovr}）。点一次就好，以后一直首发。</p>
      <button class="btn btn-primary" id="promote">一键进入首发</button></section>` : ''}
    <section class="card me-card"><div class="me-row">
      <div class="me-av">${Avatar.avatarSVG(me)}</div>
      <div class="me-info"><div><b>${esc(me.name)}</b>${buffTags(me)}</div>
        <span class="muted small">${E.POS_LABEL[me.pos]} · ${mi < 5 ? '首发' : '替补'} · 总评 <b class="num">${meB.ovr}</b>${meB.bondPlus ? ` <b class="bond-plus">🔗+${meB.bondPlus}</b>` : ''} · 预计场均 ${me.pts} 分 ${me.reb} 板 ${me.ast} 助</span></div></div>
      ${pas.length ? `<div class="pas-row">${pas.map((k) => { const p = E.PASSIVES[k]; return `<span class="pas-chip ${p.rare ? 'rare' : ''}" title="${esc(p.desc)}">${PASSIVE_ICON[k] || '🏅'} ${esc(p.name)}</span>`; }).join('')}</div>` : ''}
    </section>
    ${todo.length ? `<div class="todo">${todo.map(([k, ic, t]) => `<button class="todo-i" data-todo="${k}">${ic} ${t}</button>`).join('')}</div>` : ''}
    <section class="card pop vs-card">
      <div class="opp-head" style="--team:${L.color}">
        <span class="muted small">第 ${run.level + 1} 关 · ${L.year} 总冠军${L.boss ? ` · <b class="boss-tag">BOSS ${E.BOSSES.indexOf(L.boss) + 1}/${E.BOSSES.length}</b>` : ''}</span>
        <h2>${L.year} ${esc(L.team)}</h2>
        <span class="small" style="color:var(--gold)">${esc(L.tag)}</span>
      </div>
      ${L.boss ? bossBanner(L) : ''}
      <div class="vs-label"><span>对手首发</span><small>首发均分 ${fmt1(starterAvg(oppFive))}</small></div>
      <div class="mgrid">${oppFive.map((x) => miniCard(x)).join('')}</div>
      <details class="opp-bench"><summary class="muted small">对手替补 7 人（均分 ${fmt1(benchAvg(L.roster))}）</summary>
        <div class="mgrid">${L.roster.slice(5).map((x) => miniCard(x)).join('')}</div></details>
      <div class="stat-grid${L.bond ? ' has-bond' : ''}">
        <div><b>${fmt1(L.raw)}</b><span>对手阵容</span></div>
        <div><b>${L.boost >= 0 ? '+' : ''}${fmt1(L.boost)}</b><span>${run.level === TOTAL - 1 ? '72 胜光环' : L.boost < 0 ? '赛季初状态' : '状态加成'}</span></div>
        ${L.bond ? `<div class="bond-stat"><b>+${fmt1(L.bondPower)}</b><span>🔗 羁绊</span></div>` : ''}
        <div><b>${fmt1(L.power)}</b><span>对手实力</span></div>
      </div>
      ${L.bond ? `<p class="small bond-opp">🔗 Boss 羁绊：${esc(short(L.team))}首发 5 人同队，首发 5 人能力各 +${L.bond}</p>` : ''}
      <div class="vs-label"><span>你的首发</span><button class="link-btn" id="toTeam">调整阵容 ›</button></div>
      <div class="mgrid" id="myFive">${team.slice(0, 5).map((x) => miniCard(x)).join('')}</div>
      <p class="small bond-line ${bd.bonus ? 'on' : ''}">${bondLine(bd)}</p>
      ${missingNote(run.team)}
      <div class="spread"><span>你的实力 <b class="num">${fmt1(mine)}</b></span><span class="muted small">阵容 ${fmt1(teamAvg(run.team))} + 默契 ${fmt1(E.chemistry(run.wins))}${bd.bonus ? ` + 羁绊 ${fmt1(bondPowerOf(run.team))}` : ''}</span></div>
      <div class="meter">
        <div class="bar"><div class="me" style="width:${(mine / total) * 100}%"></div><div class="them" style="width:${(L.power / total) * 100}%"></div></div>
        <div class="spread small"><span style="color:var(--accent)">你</span><span>预计胜率 <b class="num">${Math.round(pWin * 100)}%</b></span><span class="muted">${esc(short(L.team))}</span></div>
      </div>
      <button class="btn btn-primary sticky-cta" id="play">开始比赛</button>
    </section>
    <section class="card ladder-card">
      <div class="spread"><b>关卡进度</b><span class="muted small">${run.level} / ${TOTAL} · 五大 Boss：魔神皇佛鲨</span></div>
      <div class="ladder mini" aria-label="关卡进度">${E.LEVELS.map((l, i) => `<div class="node ${i < run.level ? 'done' : i === run.level ? 'cur' : ''} ${l.boss ? 'boss' : ''}" title="${l.year} ${esc(l.team)}${l.boss ? ` · Boss「${l.boss.glyph}」${l.boss.nick}` : ''}">${i < run.level ? '✓' : l.boss ? l.boss.glyph : i + 1}</div>`).join('')}</div>
    </section>
    <button class="muted small" id="home" style="justify-self:center">回到首页（进度会保存）</button>`;
  const promote = document.getElementById('promote');
  if (promote) promote.onclick = () => {
    const out = toStart();
    toast(`你进入首发，${short(out.name)}去替补席`);
    go(hub);
  };
  const TODO_PAGE = { bosscard: () => go(bossCardPage), pts: () => go(pointsPage), cards: () => go(cardsPage, 'cards'), frag: () => go(cardsPage, 'frag'), medal: () => go(medalPage) };
  app.querySelectorAll('[data-todo]').forEach((b) => (b.onclick = TODO_PAGE[b.dataset.todo]));
  document.getElementById('play').onclick = () => go(match);
  document.getElementById('toTeam').onclick = () => go(myTeam);
  document.getElementById('myFive').onclick = () => go(myTeam);
  document.getElementById('home').onclick = () => go(home);
  setNav('play');
};
// Boss 关的横幅：大字「魔 / 鲨 / 皇 / 佛 / 神」+ 坐镇的球星 + 专属技能
const bossPlayer = (L) => L.roster.find((x) => x.name === L.boss.star) || L.roster[0];
function bossBanner(L) {
  const b = L.boss, p = bossPlayer(L);
  return `<div class="boss-banner"><span class="bb-glyph">${b.glyph}</span>
    <div class="bb-av">${Avatar.avatarSVG(p)}</div>
    <div class="bb-info"><b>五大 Boss 之「${b.glyph}」</b><span>${b.nick} · ${esc(b.star)} 坐镇</span>
      <span class="bb-skill">⚡ 技能【${esc(b.skill.name)}】${esc(b.skill.desc)}</span></div></div>`;
}
const buzz = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* 有的浏览器不让震 */ } };
// Boss 登场特效：全屏压暗，巨大的「魔 / 鲨 / 皇 / 佛 / 神」砸下来，球星头像、名字、技能依次亮出；3 秒后或点屏幕开始比赛
function bossIntroFx(L) {
  const b = L.boss, p = bossPlayer(L);
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'boss-intro';
    ov.innerHTML = `<div class="bi-glyph">${b.glyph}</div><div class="bi-flash"></div>
      <div class="bi-core">
        <p class="bi-tag">⚠ 五大 Boss 登场 ⚠</p>
        <div class="bi-av">${Avatar.avatarSVG(p)}</div>
        <p class="bi-name">「${b.glyph}」${esc(E.bossName(b))}</p>
        <p class="bi-team">${L.year} ${esc(L.team)} · 第 ${L.index + 1} 关</p>
        <p class="bi-skill">⚡ 技能【${esc(b.skill.name)}】${esc(b.skill.desc)}</p>
        <p class="bi-tap">点屏幕开始比赛</p>
      </div>`;
    document.body.append(ov);
    buzz([60, 50, 140]);
    let gone = false;
    const done = () => {
      if (gone) return;
      gone = true;
      ov.classList.add('out');
      setTimeout(() => { ov.remove(); resolve(); }, 260);
    };
    ov.onclick = done;
    if (!window.__holdBossFx) setTimeout(done, reduceMotion ? 1500 : 3400); // __holdBossFx：测试截图时停住
  });
}
// Boss 技能发动特效：屏幕四周红光一闪，顶部弹出「⚡ 魔 Boss 技能发动【Showtime】」，1.8 秒后消失
function bossSkillFx(L) {
  const b = L.boss;
  document.querySelectorAll('.skill-fx').forEach((x) => x.remove());
  const fx = document.createElement('div');
  fx.className = 'skill-fx';
  fx.innerHTML = `<div class="sf-edge"></div><div class="sf-bar"><span class="sf-glyph">${b.glyph}</span><span><small>Boss 技能发动</small><b>【${esc(b.skill.name)}】</b></span></div>`;
  document.body.append(fx);
  buzz([40, 30, 40]);
  if (window.__holdBossFx) fx.classList.add('hold'); // 测试截图：停在亮起的那一刻
  else setTimeout(() => fx.remove(), 1900);
}
// ---------- 挑战失败的嘲讽：输给 Boss 是他的专属台词（邓肯：「未来是你的，但不是现在。」），输给别的队是对面这场得分最多的人 ----------
const TAUNTS = [
  '新秀，欢迎来到联盟。',
  '下次记得把你的大腿也带上。',
  '回去多看看录像吧。',
  '就这？我还没热身呢。',
  '冠军戒指不是捏出来的。',
  '再练两年，再来找我。',
];
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
function tauntCard(L, r) {
  let p, who, text;
  if (L.boss) { p = bossPlayer(L); who = `「${L.boss.glyph}」${E.bossName(L.boss)}`; text = pickOne(L.boss.taunts); }
  else {
    const top = r && r.box ? [...r.box[1]].sort((a, b) => b.pts - a.pts)[0] : null;
    p = (top && L.roster.find((x) => x.name === top.name)) || [...L.roster].sort((a, b) => b.ovr - a.ovr)[0];
    who = short(p.name); text = pickOne(TAUNTS);
  }
  return `<section class="taunt pop${L.boss ? ' boss' : ''}"><div class="tt-av">${Avatar.avatarSVG(p)}</div>
    <div class="tt-bubble"><b>${esc(who)}</b><p>“${esc(text)}”</p></div></section>`;
}
// ---------- 打赢五大 Boss：拿到这位 Boss 的球员卡（那一年的版本），可以签下，也可以换成幸运值 ----------
const BOSS_CARD_LUCK = 15;
function bossCardOf(idx) {
  const L = E.LEVELS[idx];
  return { ...bossPlayer(L) };
}
function bossCardPage() {
  const list = run.bossCards || [];
  if (!list.length) { go(hub); return; }
  const idx = list[0], L = E.LEVELS[idx], b = L.boss, p = bossCardOf(idx);
  const g = chestGain(p);
  app.innerHTML = `${statusBar()}
    <section class="draft-head pop"><p class="eyebrow">👑 击败五大 Boss 之「${b.glyph}」</p>
      <h2>${esc(E.bossName(b))}愿意加入你</h2>
      <p class="muted small">${L.year} ${esc(L.team)}版本 · ${g && g.upgrade ? `队里已有${esc(short(g.out.name))}（${g.out.ovr}），签下就升级成这个版本` : '签下后换下替补里最弱的人'}</p></section>
    <div class="boss-card">${tallCard(shownAs(p))}</div>
    ${g ? `<p class="chest-rec">💡 ${recText(p, g)}</p>` : '<p class="small warn" style="text-align:center">没有能换下的人</p>'}
    ${g ? `<button class="btn btn-gold" id="bcSign">${g.upgrade ? `⬆ 升级 ${esc(short(p.name))}：${g.out.ovr} → ${p.ovr}` : `签下 ${esc(short(p.name))}（${E.POS_LABEL[p.pos]} ${p.ovr}），换下 ${esc(short(g.out.name))}（${g.out.ovr}）`}</button>` : ''}
    <button class="btn btn-ghost" id="bcSkip">不要了，换成幸运值 +${BOSS_CARD_LUCK}</button>`;
  setNav('play');
  const next = () => { run.bossCards = (run.bossCards || []).slice(1); save(); };
  const s = document.getElementById('bcSign');
  if (s) s.onclick = () => {
    const r = bringIn(p);
    if (!r) return;
    next();
    toast(`${short(p.name)} 加入！换下 ${short(r.out.name)}（${r.out.ovr}）${r.luck ? `；${r.luck}` : ''}`);
    walkout(p).then(() => go(run.bossCards.length ? bossCardPage : hub));
  };
  document.getElementById('bcSkip').onclick = () => {
    next();
    const lk = luckText(addLuck(BOSS_CARD_LUCK));
    save();
    toast(lk || `幸运值 +${BOSS_CARD_LUCK}`);
    go(run.bossCards.length ? bossCardPage : hub);
  };
}
// ---------- 阵容页：首发 5 人、替补 7 人一屏看全（小卡片，不用左右滑），点一名看详情，再点另一名互换 ----------
const _myTeam = myTeam;
myTeam = function () {
  if (!run.career) return _myTeam();
  const team = withBond(run.team);
  const bd = bondOf(run.team);
  const focusI = swapPick != null ? swapPick : Math.max(0, team.findIndex((p) => p.isMe));
  const card = (p, i) => miniCard(p, { button: true, sel: swapPick === i, attrs: `data-swap="${i}"` });
  app.innerHTML = `
    ${statusBar()}
    <div class="spread"><h2>👥 我的阵容</h2><span class="muted small">12 人 · 首发按位置，替补只看总评</span></div>
    <section class="card team-sum">
      <div class="ts-grid">
        <div><b class="num">${fmt1(starterAvg(team))}</b><span>首发均分</span></div>
        <div><b class="num">${fmt1(benchAvg(team))}</b><span>替补均分</span></div>
        <div><b class="num">+${fmt1(E.chemistry(run.wins))}</b><span>默契</span></div>
        <div class="${bd.bonus ? 'on' : ''}"><b class="num">${bd.bonus ? `+${fmt1(bondPowerOf(run.team))}` : '—'}</b><span>🔗 羁绊</span></div>
        <div class="tot"><b class="num">${fmt1(myPower())}</b><span>总实力</span></div>
      </div>
      <p class="small bond-line ${bd.bonus ? 'on' : ''}">${bondLine(bd)}</p>
      ${missingNote(run.team)}
    </section>
    <div class="spread"><h3>首发</h3><span class="muted small num">均分 ${fmt1(starterAvg(team))}</span></div>
    <div class="mgrid">${team.slice(0, 5).map((p, i) => card(p, i)).join('')}</div>
    <div class="spread"><h3>替补</h3><span class="muted small num">均分 ${fmt1(benchAvg(team))}</span></div>
    <div class="mgrid">${team.slice(5).map((p, k) => card(p, k + 5)).join('')}</div>
    <p class="note">${swapPick === null ? '点一名球员看详情；再点另一名，两人互换（首发↔替补）。' : `已选 ${esc(short(team[swapPick].name))}，再点一名球员和他互换；再点他自己取消。`}</p>
    <button class="btn btn-ghost" id="arrange">一键排首发（每个位置用最强的人）</button>
    <h3>${swapPick === null ? '我的详情' : `${esc(short(team[focusI].name))} 的详情`}</h3>
    ${detailPanel(team[focusI])}`;
  bindSwap(myTeam);
  bindArrange(myTeam);
  setNav('team');
};

// ---------- 底部导航：比赛 / 阵容 / 加点 / 抽卡 / 勋章，随时切换；有待处理的事显示红色数字 ----------
const NAV = [
  { k: 'play', ic: '🏀', t: '比赛', page: () => hub, n: () => ((run.bossCards || []).length ? '!' : 0) },
  { k: 'team', ic: '👥', t: '阵容', page: () => myTeam, n: () => 0 },
  { k: 'pts', ic: '🎯', t: '加点', page: () => pointsPage, n: () => run.addPts || 0 },
  { k: 'cards', ic: '🃏', t: '抽卡', page: () => cardsPage, n: () => (run.draws || 0) + chestReady() + (run.signing || run.chestOffer ? 1 : 0) },
  { k: 'medal', ic: '🏅', t: '勋章', page: () => medalPage, n: () => run.passivePending || (run.passiveOffer ? 1 : 0) },
];
// active = 当前页（null 收起）；只在挑战王朝阶段出现（新秀赛季之前、比赛直播中都不显示）
function setNav(active) {
  let nav = document.getElementById('tabbar');
  const show = !!(active && run && run.career && run.story && run.team);
  document.body.classList.toggle('has-nav', show);
  if (!show) { if (nav) nav.remove(); return; }
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'tabbar';
    nav.className = 'tabbar';
    nav.setAttribute('aria-label', '主菜单');
    document.body.append(nav);
  }
  nav.innerHTML = NAV.map((x) => {
    const n = x.n();
    return `<button data-nav="${x.k}" class="${x.k === active ? 'on' : ''}"${x.k === active ? ' aria-current="page"' : ''}><span class="ti">${x.ic}${n ? `<i class="nb">${typeof n === 'number' && n > 99 ? '99+' : n}</i>` : ''}</span><span class="tl">${x.t}</span></button>`;
  }).join('');
  nav.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => {
    if (drawing || document.querySelector('.walkout, .gacha, .levelup')) return; // 动画、弹窗进行中不切页
    swapPick = null;
    go(NAV.find((x) => x.k === b.dataset.nav).page());
  }));
}

// ---------- 打完（通关或止步）：生涯数据统计 ----------
const _endScreen = endScreen;
endScreen = function (won) {
  _endScreen(won);
  if (!run || !run.career) return;
  // 止步：淘汰你的那支队嘲讽一句（Boss 是专属台词）
  if (!won) app.querySelector('.hero').insertAdjacentHTML('afterend', tauntCard(E.LEVELS[Math.min(run.level, TOTAL - 1)], null));
  const me = run.team.find((p) => p.isMe);
  const st = run.stats || { g: 0 };
  if (!me || !st.g) return;
  const avg = (k) => ((st[k] || 0) / st.g).toFixed(1);
  const b = st.best;
  const pas = (run.passives || []).filter((k) => E.PASSIVES[k]);
  const line = `场均 ${avg('pts')} 分 ${avg('reb')} 板 ${avg('ast')} 助`;
  (app.querySelector('.taunt') || app.querySelector('.hero')).insertAdjacentHTML('afterend', `<section class="card career-sum pop">
    <div class="spread"><b>${esc(me.name)} · ${won ? `${TOTAL} 关生涯数据` : '本局生涯数据'}</b><span class="muted small">${E.POS_LABEL[me.pos]} · 总评 ${me.ovr}</span></div>
    <p class="small muted" style="margin:0">只统计挑战王朝的比赛，新秀赛季不计入</p>
    <div class="cs-grid">
      <div><b>${avg('pts')}</b><span>场均得分</span></div><div><b>${avg('reb')}</b><span>场均篮板</span></div><div><b>${avg('ast')}</b><span>场均助攻</span></div>
      <div><b>${avg('stl')}</b><span>场均抢断</span></div><div><b>${avg('blk')}</b><span>场均盖帽</span></div><div><b>${avg('tov')}</b><span>场均失误</span></div>
    </div>
    <p class="small muted">${st.g} 场 ${run.wins} 胜 · 单场最高 ${st.hi.pts} 分 / ${st.hi.reb} 板 / ${st.hi.ast} 助</p>
    ${b ? `<div class="cs-best"><p class="eyebrow" style="margin:0;color:#FFD54A">⭐ 最佳一场 · 第 ${b.level} 关 vs ${esc(b.opp)}</p>
      <b class="num" style="font-size:18px">${lineText(b)}</b>
      <p class="small muted" style="margin:2px 0 0">${b.min} 分钟 · ${b.win ? '胜' : '负'} ${b.final[0]}:${b.final[1]}</p></div>` : ''}
    <div class="cs-honor">${[`🏅 MVP ×${st.mvp || 0}`, `🔥 三双 ×${st.td || 0}`, `💪 两双 ×${st.dd || 0}`, `💥 50+ ×${st.p50 || 0}`].map((t) => `<i>${t}</i>`).join('')}</div>
    ${pas.length ? `<div class="pas-row">${pas.map((k) => `<span class="pas-chip ${E.PASSIVES[k].rare ? 'rare' : ''}">${PASSIVE_ICON[k] || '🏅'} ${esc(E.PASSIVES[k].name)}</span>`).join('')}</div>` : ''}
  </section>`);
  // 分享文案带上你的数据
  const text = `${shareText(won)}（${me.name} ${line}，最佳一场 ${b ? `${b.pts} 分 ${b.reb} 板 ${b.ast} 助` : '-'}，MVP ×${st.mvp || 0}）`;
  const p = app.querySelector('#share').previousElementSibling;
  if (p) p.textContent = text;
  document.getElementById('share').onclick = () => copy(text);
};

// ---------- 首页改成生涯模式 ----------
// 首页的 Boss 墙：五大 Boss，按出场顺序（第 6、12、18、24、30 关）
// 2026-11-26 用户：「把黄色字体的魔鲨皇佛神去掉，五名球员都可以加点特效」——每人一圈自己颜色的转动光环 + 呼吸光晕，
//   头像下面是第几关（打过的写「已推倒」）；下面轮流放他们的嘲讽，点头像换成他说
const HB_FX = { mo: ['#FDB927', '#A45CFF'], sha: ['#39C6FF', '#6A3DE8'], huang: ['#FFB81C', '#C8143E'], fo: ['#DDE5EE', '#2ED3A6'], shen: ['#FF4D3D', '#FFD54A'] };
function homeBosses() {
  const list = E.LEVELS.filter((L) => L.boss).map((L) => ({ L, b: L.boss, p: L.roster.find((x) => x.name === L.boss.star) || L.roster[0] }));
  return `<section class="card home-boss"><div class="spread"><h3>五大 Boss</h3><small class="muted">你倒在谁手里？</small></div>
    <div class="hb-grid">${list.map(({ L, b, p }, i) => {
      const [c1, c2] = HB_FX[b.key] || ['#FFD54A', '#F28C28'];
      const down = best > L.index; // best = 打赢过的关数
      return `<button class="hb" data-i="${i}" style="--c1:${c1};--c2:${c2};--d:${(i * 0.13).toFixed(2)}s" aria-label="${esc(b.nick)}，第 ${L.index + 1} 关">
        <span class="hb-ring"><span class="hb-av">${Avatar.avatarSVG(p)}</span><i class="hb-lv${down ? ' down' : ''}">${down ? '已推倒' : `第${L.index + 1}关`}</i></span>
        <b>${esc(b.nick)}</b><small>${L.year}<br>${esc(E.nick(L.team))}</small></button>`;
    }).join('')}</div>
    <p class="hb-say" id="hbSay" aria-live="polite"></p><p class="hb-tip">点头像，听听他们怎么嘲讽你</p></section>`;
}
// 首页「步行街热议」：轮流放几个吵了很多年的话题（用户 11-26：「要求虎扑口吻，有话题感」）。只写球员，不写队名
const HOT_TOPICS = [
  '96 年的乔丹和 17 年的库里，谁更强？',
  '1 比 3 逆转，是含金量最高的总冠军吗？',
  '巅峰大鲨鱼，今天有人防得住吗？',
  '石佛，是不是历史第一大前？',
  'Showtime 放到今天，还能打吗？',
  '卫冕冠军纽约，能排进历史前十吗？',
];
// 首页（2026-11-19）：标题 → 一句话「挑战 30 支历届总冠军球队，看看你能闯几关」→ 挑战介绍（中场投篮 → 你自己的球员 → 30 支冠军）
//   → 你的纪录 → 守关 Boss 头像墙；「开始挑战」一直贴在屏幕底部，点了直接进中场投篮（halftime）
//   有存档时「重新开始」要点两次，免得手滑清档；字体好看、不介绍玩法、不要「普通 JR 篮球梦」都是用户要求
// 用户 11-19 再改：首页先是挑战介绍（围绕你自己创建的球员，搭档球星只是其中一步），点「开始挑战」直接进中场投篮
home = function () {
  const rec = best ? (best >= TOTAL ? `${TOTAL} 关全通 🏆 你就是王朝终结者` : `闯到第 ${best} 关`) : '还没有（嘴上夺冠的不算）';
  const where = run && (run.career && !run.story ? '新秀赛季' : `第 ${run.level + 1} / ${TOTAL} 关`);
  app.innerHTML = `
    <section class="home-hero pop">
      <h1 class="hh-title"><span>诸神</span><b>黄昏</b></h1>
      <p class="hh-sub">王 朝 终 结 者</p>
      <p class="hh-pitch">一张球票，一场意外，<br>你从看台走进了职业联盟。<em>${TOTAL} 支王朝，你能掀翻几支？</em></p>
    </section>
    <section class="card challenge hot pop">
      <p class="eyebrow">🔥 步行街热议</p>
      <div class="hot-q"><span id="hotQ"></span></div>
      <p>吵了二十年没结论？<b>${TOTAL} 支历史总冠军球队</b>全在这，<span class="nw">亲自打一遍就知道。</span></p>
      <p>有成长，有收获，有被暴扣，<span class="nw">也有被绝杀。</span></p>
      <div class="ch-facts"><span><b class="num">${TOTAL}</b>关冠军球队</span><span><b class="num">${E.BOSSES.length}</b>大 Boss</span><span><b class="num">3</b>条命</span></div>
    </section>
    <p class="home-rec">🏅 你的纪录：${rec}</p>
    ${homeBosses()}
    <p class="home-foot">数据来自虎扑 · 评分纯属娱乐，不服来辩<br>输了别去步行街骂我，通关记得回来晒图</p>
    ${run ? `<button class="link-btn home-restart" id="new">重新开始（会清掉当前进度）</button>` : ''}
    <div class="home-cta">
      ${run ? `<button class="btn btn-primary btn-big" id="resume">继续挑战<small>${where}</small></button>` : `<button class="btn btn-primary btn-big" id="new">开始挑战<small>别吵了，球场上见</small></button>`}
    </div>`;
  // 热议话题每 3.6 秒换一个；Boss 嘲讽每 4 秒换一位，点了哪位就停在他（离开首页后计时器自己停）
  const hotQ = document.getElementById('hotQ');
  let qi = Math.floor(Math.random() * HOT_TOPICS.length);
  hotQ.textContent = `「${HOT_TOPICS[qi]}」`;
  const qt = setInterval(() => {
    if (!document.body.contains(hotQ)) { clearInterval(qt); return; }
    hotQ.classList.add('out');
    setTimeout(() => { qi = (qi + 1) % HOT_TOPICS.length; hotQ.textContent = `「${HOT_TOPICS[qi]}」`; hotQ.classList.remove('out'); }, 320);
  }, 3600);
  const hbs = [...app.querySelectorAll('.hb')];
  const bosses = E.LEVELS.filter((L) => L.boss).map((L) => L.boss);
  const say = document.getElementById('hbSay');
  const speak = (i) => {
    const b = bosses[i];
    hbs.forEach((el, k) => el.classList.toggle('on', k === i));
    say.style.setProperty('--sc', hbs[i].style.getPropertyValue('--c1'));
    say.innerHTML = `<b>${esc(short(b.star))}</b>：${esc(b.taunts[Math.floor(Math.random() * b.taunts.length)])}`;
  };
  let si = bosses.length - 1;
  speak(si);
  const st = setInterval(() => {
    if (!document.body.contains(say)) { clearInterval(st); return; }
    si = (si + 1) % bosses.length; speak(si);
  }, 4000);
  hbs.forEach((el, i) => (el.onclick = () => { clearInterval(st); speak(i); }));
  // 老存档里没签完的那一抽（以前要进签约页点「签约完成」）：继续时直接签完，结果在抽卡页显示
  if (run) document.getElementById('resume').onclick = () => { const had = !!run.signing; finishSigning(true); go(had ? cardsPage : run.career && !run.story ? seasonStory : hub, 'cards'); };
  const nb = document.getElementById('new');
  let sure = !run; // 有存档：第一次点只是提醒，再点一次才清档
  nb.onclick = () => {
    if (!sure) { sure = true; nb.textContent = '确定？再点一次就清掉当前进度，重新开始'; nb.classList.add('warn'); return; }
    run = null; intro = null; store.del('nba-run'); go(halftime);
  };
};

// ---------- 样式 ----------
document.head.insertAdjacentHTML('beforeend', `<style>
.attr-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.attr{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:6px;padding:7px 10px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:13px;position:relative}
.attr .an{font-weight:600}.attr .av{text-align:right;color:#9aa4b8}.attr .down{color:#ff6b5b;font-style:normal;margin-left:2px;font-size:10px}
.attr .ag{font-weight:900;font-family:Bahnschrift,Arial,sans-serif}.gs{color:#FFD54A;text-shadow:0 0 8px rgba(255,213,74,.7)}.bp small i{font-style:normal;font-weight:900}.ga{color:#ff6b5b}.gb{color:#f2c94c}.gc{color:#3cd070}.gd{color:#8a93a6}
.attr.click{cursor:pointer;border-color:rgba(255,160,90,.5)}.attr.click:hover{background:rgba(255,160,90,.15)}
.attr.locked{background:rgba(255,160,90,.18);border-color:#ff9a5a}.attr.locked .av{color:#fff}.attr small{grid-column:1/-1;font-size:10px;color:#ffb37a}
.attr-card summary{cursor:pointer;margin-bottom:8px}
.name-input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:inherit;font-size:15px}
.pos-pick{display:grid;gap:8px}
.pos-btn{position:relative;display:grid;grid-template-columns:76px 1fr;gap:14px;align-items:center;padding:10px 14px 10px 10px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#C3CADA;font:inherit;text-align:left;cursor:pointer;transition:border-color .2s,background .2s,transform .15s}
.pos-btn:hover{border-color:rgba(255,138,74,.5)}.pos-btn:active{transform:scale(.98)}
.pos-court{width:76px;height:61px;display:block;color:#C3CADA}
.pos-court .pc-glow{fill:rgba(255,138,74,.28)}
.pos-txt{display:grid;gap:3px}.pos-txt b{font-size:17px;color:#fff;display:flex;align-items:baseline;gap:8px}
.pos-txt em{font-style:normal;font:900 15px Bahnschrift,Arial,sans-serif;color:#ff8a4a;letter-spacing:.04em}.pos-txt small{font-size:12px;color:#9aa4b8}
.pos-rec{position:absolute;top:8px;right:10px;font-style:normal;font-size:11px;font-weight:800;padding:1px 8px;border-radius:999px;color:#1A0E02;background:var(--gold)}
.pos-btn.sel{border-color:#ff8a4a;background:linear-gradient(90deg,rgba(255,138,74,.2),rgba(255,138,74,.06))}
.pos-btn.sel .pos-court{color:#fff}.pos-btn.sel .pc-glow{animation:pcPulse 1.4s ease-in-out infinite}
@keyframes pcPulse{50%{r:14;fill:rgba(255,138,74,.45)}}
@media (prefers-reduced-motion:reduce){.pos-btn.sel .pc-glow{animation:none}}
.bprog{display:flex;gap:10px;align-items:center}.bprog .bar,.xp .bar{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}.bprog i,.xp i{display:block;height:100%;background:#ff8a4a}
.build{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:12px;align-items:start}
.build .attr-grid{grid-template-columns:1fr}.bovr{text-align:center;padding:10px;border-radius:12px;background:rgba(255,255,255,.05);margin-bottom:6px}.bovr b{font-size:30px;color:#ff8a4a;display:block}.bovr span{font-size:11px;letter-spacing:.3em;color:#9aa4b8}
.spin-head{text-align:center;color:#ff8a4a;font-weight:700}.spin{text-align:center;font-size:24px;font-weight:900;padding:14px;margin:8px 0;border-radius:14px;background:rgba(255,255,255,.06)}
.small-btn{padding:8px 12px;font-size:13px;width:100%}
.bplayers{display:grid;gap:6px}.bp{display:grid;grid-template-columns:40px 1fr auto;gap:8px;align-items:center;padding:6px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:inherit;text-align:left}
.bp.sel{border-color:#ff8a4a;background:rgba(255,138,74,.15)}.bp-av{width:40px;height:40px;overflow:hidden;border-radius:50%}.bp-av svg{width:100%;height:100%}.bp small{display:block;color:#9aa4b8}.bp span{font-size:20px;font-weight:900}
.story p{line-height:1.8;margin:8px 0}.story .eyebrow,.hupu .eyebrow,.lu-card .eyebrow{color:#ff8a4a;letter-spacing:.2em;font-size:12px}.quote{font-style:italic;color:#f2c94c}
.statline{display:grid;gap:2px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.06);margin:10px 0}.statline span{font-size:12px;color:#9aa4b8}.statline b{font-size:18px}.statline small{color:#9aa4b8}.statline.gold{background:rgba(242,201,76,.12)}
.hupu h3{margin:6px 0 10px}.hp-c{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}.hp-c small{color:#ff6b5b;white-space:nowrap}.hp-c.me span{color:#f2c94c}
.xp{display:flex;gap:8px;align-items:center;font-size:12px;margin-top:8px}
.levelup{position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:99;padding:20px}.lu-card{background:#161c2c;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:22px;display:grid;gap:10px;width:min(360px,100%)}
.narrow-only{display:none}
.sign-result{border-color:rgba(255,213,74,.45);background:linear-gradient(180deg,rgba(255,213,74,.1),rgba(255,213,74,.02))}.sign-result h3{color:#FFD54A}
@media (max-width:560px){.build{grid-template-columns:minmax(0,1fr) minmax(0,1.12fr);gap:8px}
.build .attr-grid{grid-template-columns:1fr;gap:4px}.build .attr{padding:5px 7px;font-size:12.5px;gap:4px}.build .attr small{font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.build .re-row{grid-template-columns:1fr;gap:5px}.build .spin-head{font-size:13px}.bp b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bp small{font-size:11px}
.bovr{display:flex;align-items:baseline;justify-content:center;gap:8px;padding:6px}.bovr b{display:inline;font-size:22px}
.spin{font-size:18px;padding:8px 4px;margin:6px 0}.bp{grid-template-columns:30px minmax(0,1fr) auto;gap:6px;padding:4px 6px}.bp-av{width:30px;height:30px}.bp span{font-size:16px}
.wide-only{display:none}.narrow-only{display:inline}}
.origin{display:grid;grid-template-columns:52px 1fr;grid-template-rows:auto auto;column-gap:12px;align-items:center;text-align:left;padding:18px 16px;border-radius:16px;border:1px solid var(--line);background:var(--surface)}
.origin .oi{grid-row:1/3;font-size:36px;text-align:center}.origin b{font-size:18px}.origin small{color:var(--muted)}.origin:hover{border-color:var(--accent)}
.quiz{display:grid;gap:8px}.qa-style{display:grid;grid-template-columns:44px 1fr;gap:10px;align-items:center;padding:10px 12px}.qa-av{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#fff}.qa-av svg{width:100%;height:100%}.qa-t small{display:block;margin-top:3px;color:var(--gold);font-size:12px}.link-btn{background:none;border:0;color:#9fb0ff;text-decoration:underline;font-size:12px;cursor:pointer;padding:0 2px}.qa{padding:14px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);text-align:left;font-size:15px}.qa:hover{border-color:var(--accent);background:rgba(242,140,40,.12)}
.hidden-card{text-align:center;display:grid;gap:8px;justify-items:center;padding:22px 16px;border-radius:18px;border:1px solid var(--gold);background:radial-gradient(circle at 50% 0%,rgba(242,193,78,.28),transparent 65%),var(--surface);animation:hcin .7s ease-out}
.hidden-card h2{font-size:28px;color:var(--gold);letter-spacing:.05em}.hc-av{width:112px;height:112px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);box-shadow:0 0 28px rgba(242,193,78,.45)}
.hc-attr{display:flex;gap:10px;align-items:baseline}.hc-attr span{font-weight:700}.hc-attr b{font-size:40px;color:var(--gold)}
@keyframes hcin{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.teammate{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:center;border-color:var(--accent)}.tm-av{width:72px;height:72px;border-radius:50%;overflow:hidden;border:2px solid var(--accent)}
.hidden-chip{padding:8px 12px;border-radius:10px;background:rgba(242,193,78,.12);border:1px solid rgba(242,193,78,.4);color:var(--gold)}
.draw-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.tcard.rank-legend{border:2px solid #FFD54A;box-shadow:0 0 14px rgba(255,213,74,.55)}.tcard.rank-gold{border:2px solid #E8B64C}
.tcard.flash-legend{animation:flashLegend 1s ease-out}.tcard.flash-gold{animation:flashGold .5s ease-out}
@keyframes flashLegend{0%{box-shadow:0 0 0 rgba(255,213,74,0);filter:brightness(1)}25%{box-shadow:0 0 40px 12px rgba(255,213,74,.95);filter:brightness(1.8)}100%{box-shadow:0 0 14px rgba(255,213,74,.55);filter:brightness(1)}}
@keyframes flashGold{0%{filter:brightness(1)}40%{box-shadow:0 0 26px 6px rgba(232,182,76,.85);filter:brightness(1.6)}100%{filter:brightness(1)}}
@media (prefers-reduced-motion:reduce){.tcard.flash-legend,.tcard.flash-gold{animation:none}}
.walkout{position:fixed;top:0;right:0;bottom:0;left:0;z-index:50;background:radial-gradient(circle at 50% 45%,var(--c1) 0%,#05070d 70%);background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--c1) 55%,#000) 0%,#05070d 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;overflow:hidden;cursor:pointer;color:#fff;text-align:center}
.wo-rays{position:absolute;top:-50%;right:-50%;bottom:-50%;left:-50%;background:repeating-conic-gradient(from 0deg,rgba(255,213,74,.22) 0 6deg,transparent 6deg 18deg);animation:woSpin 6s linear infinite,woFade .6s ease-out;pointer-events:none}
.wo-step{opacity:0;transform:translateY(16px) scale(.9);transition:opacity .3s,transform .3s;position:relative}.wo-step.on{opacity:1;transform:none}
.wo-year{font-size:64px;font-weight:900;letter-spacing:4px;color:#FFD54A;text-shadow:0 0 24px rgba(255,213,74,.8)}
.wo-pos{font-size:28px;font-weight:900;letter-spacing:8px}
.wo-team{font-size:22px;font-weight:800;display:flex;align-items:center;gap:8px}.wo-dot{width:16px;height:16px;border-radius:50%;background:var(--c1);box-shadow:0 0 0 2px #fff}
.wo-card{width:150px;display:flex;flex-direction:column;gap:6px}.wo-card .tcard{width:150px;max-width:none;flex:none}.wo-name{font-size:20px;color:#FFD54A}
.wo-skip{position:absolute;bottom:18px;opacity:.5;font-size:12px}
/* 出场特效（2K 味道）：s1 号码闪进 → s2 位置闪进 → s3 冲散、大屏暗下、顶部号码|位置 + 球队 → s4 球员卡亮起 */
.walkout.wo4{display:block;background:#070A12;text-align:center}
/* LED 大屏：球队主色 + 点阵 + 四周压暗，开场闪一下 */
.wo4 .w4-led{position:absolute;top:0;right:0;bottom:0;left:0;opacity:0;
  background:radial-gradient(ellipse at 50% 45%,transparent 35%,rgba(0,0,0,.5) 100%),linear-gradient(180deg,var(--c1) 0%,var(--c1) 45%,var(--c1) 100%);background:radial-gradient(ellipse at 50% 45%,transparent 35%,rgba(0,0,0,.5) 100%),linear-gradient(180deg,color-mix(in srgb,var(--c1) 85%,#fff) 0%,var(--c1) 45%,color-mix(in srgb,var(--c1) 70%,#000) 100%)}
.wo4 .w4-led::after{content:"";position:absolute;top:0;right:0;bottom:0;left:0;background-image:radial-gradient(rgba(0,0,0,.3) 1px,transparent 1.4px);background-size:4px 4px}
.wo4.s1 .w4-led{opacity:1;animation:w4Pulse .45s ease-out}
.wo4.s2 .w4-led{animation:w4Pulse2 .35s ease-out}
@keyframes w4Pulse{0%{filter:brightness(2.2)}100%{filter:brightness(1)}}
@keyframes w4Pulse2{0%{filter:brightness(1.6)}100%{filter:brightness(1)}}
/* 扫描线：位置闪进来时从上往下扫一遍 */
.wo4 .w4-scan{position:absolute;left:0;right:0;top:-20%;height:18%;opacity:0;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.35),transparent)}
.wo4.s2 .w4-scan{animation:w4Scan .6s ease-out}
@keyframes w4Scan{0%{top:-20%;opacity:1}100%{top:110%;opacity:0}}
/* 巨大号码、位置 */
.wo4 .w4-big{position:absolute;left:0;right:0;opacity:0;color:#fff;transition:opacity .3s ease-out,transform .35s ease-out}
.wo4 .w4-big small{display:block;font:800 12px/1 Bahnschrift,Arial,sans-serif;letter-spacing:.5em;opacity:.85;margin-bottom:6px}
.wo4 .w4-big b{display:block;font-style:italic;font-weight:900;font-family:Bahnschrift,'Arial Black',Impact,sans-serif;line-height:.85;letter-spacing:-.04em;text-shadow:0 10px 0 rgba(0,0,0,.18),0 0 40px rgba(255,255,255,.25)}
.wo4 .w4-num{top:20%;transform:scale(1.35)}.wo4 .w4-num b{font-size:clamp(150px,50vw,220px)}
.wo4 .w4-pos{top:56%;transform:scale(1.35)}.wo4 .w4-pos b{font-size:clamp(96px,32vw,140px)}
.wo4.s1 .w4-num{opacity:1;transform:none}
.wo4.s2 .w4-pos{opacity:1;transform:none}
/* 冲向屏幕散开 */
.wo4.s3 .w4-num,.wo4.s3 .w4-pos{opacity:0;transform:scale(1.6);transition:opacity .25s ease-in,transform .3s ease-in}
/* 大屏暗下来：深色底 + 球队主色光晕 */
.wo4 .w4-dark{position:absolute;top:0;right:0;bottom:0;left:0;opacity:0;transition:opacity .35s ease-out;
  background:radial-gradient(circle at 50% 52%,var(--c1) 0%,transparent 36%,transparent 62%),#070A12;background:radial-gradient(circle at 50% 52%,color-mix(in srgb,var(--c1) 65%,transparent) 0%,color-mix(in srgb,var(--c1) 20%,transparent) 36%,transparent 62%),#070A12}
.wo4.s3 .w4-dark{opacity:1}
/* 顶部小号码 | 位置 + 球队 */
.wo4 .w4-top{position:absolute;left:0;right:0;top:6%;display:flex;justify-content:center;align-items:center;gap:16px;opacity:0;transform:translateY(-10px);transition:opacity .35s ease-out,transform .35s ease-out}
.wo4 .w4-top span{font:italic 900 46px/1 Bahnschrift,'Arial Black',sans-serif;color:#fff;text-shadow:0 0 20px var(--c1);text-shadow:0 0 20px color-mix(in srgb,var(--c1) 80%,transparent)}
.wo4 .w4-top i{width:2px;height:40px;background:linear-gradient(transparent,rgba(255,255,255,.6),transparent)}
.wo4 .w4-team{position:absolute;left:0;right:0;top:14%;font-size:17px;font-weight:900;letter-spacing:.18em;color:#fff;opacity:0;transform:translateY(-6px);transition:opacity .35s ease-out .1s,transform .35s ease-out .1s}
.wo4 .w4-team::after{content:"";display:block;width:56px;height:3px;margin:8px auto 0;border-radius:3px;background:var(--c1);box-shadow:0 0 12px var(--c1)}
.wo4.s3 .w4-top,.wo4.s3 .w4-team{opacity:1;transform:none}
/* 球员卡亮起 */
.wo4 .w4-card{position:absolute;left:50%;top:52%;width:min(58vw,244px);opacity:0;transform:translate(-50%,-44%) scale(.94);
  transition:opacity .4s ease-out,transform .5s cubic-bezier(.2,.8,.3,1);filter:drop-shadow(0 0 26px var(--c1));filter:drop-shadow(0 0 26px color-mix(in srgb,var(--c1) 75%,transparent))}
.wo4 .w4-card .tcard{width:100%;max-width:none;flex:none}
.wo4.s4 .w4-card{opacity:1;transform:translate(-50%,-50%)}
/* s5：球星卡原地闪亮 0.2 秒——亮度一跳 + 金光 + 一道斜光扫过卡面 */
.wo4 .w4-card::after{content:"";position:absolute;top:0;right:0;bottom:0;left:0;border-radius:14px;pointer-events:none;opacity:0;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.8) 50%,transparent 70%);background-size:260% 100%;background-position:110% 0}
.wo4.s5 .w4-card::after{animation:w4Shine .2s ease-out}
.wo4.s5 .w4-card .tcard{animation:w4Glint .2s ease-out}
@keyframes w4Shine{0%{opacity:1;background-position:110% 0}100%{opacity:0;background-position:-10% 0}}
@keyframes w4Glint{50%{filter:brightness(1.55);box-shadow:0 0 36px 10px rgba(255,213,74,.9)}}
.wo4 .w4-info{position:absolute;left:0;right:0;bottom:9%;opacity:0;transform:translateY(10px);transition:opacity .35s ease-out .15s,transform .35s ease-out .15s}
.wo4 .w4-info b{display:block;font-size:28px;font-weight:900;letter-spacing:.04em;color:#fff}
.wo4 .w4-info small{display:block;font-size:13px;color:rgba(255,255,255,.7);margin:2px 0 8px;letter-spacing:.2em}
.wo4 .w4-info span{display:inline-block;padding:3px 14px;border-radius:999px;background:#FFD54A;color:#1A0E02;font:900 16px Bahnschrift,Arial,sans-serif}
.wo4.s4 .w4-info{opacity:1;transform:none}
.wo4 .w4-tap{position:absolute;bottom:20px;left:0;right:0;font-size:12px;color:rgba(255,255,255,.6);z-index:2}
@media (prefers-reduced-motion:reduce){.wo4 *{transition:none!important;animation:none!important}}
@keyframes woSpin{to{transform:rotate(360deg)}}@keyframes woFade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.wo-rays{animation:none}.wo-step{transition:none}}.draw-slot{display:flex;flex-direction:column;gap:4px;min-width:0}.draw-slot>small{text-align:center;color:var(--muted);font-size:11px}
.draw-slot .tcard{flex:none;width:100%;min-width:0;max-width:none}.draw-back{aspect-ratio:3/4.2;border-radius:12px;border:2px solid rgba(255,255,255,.25);background:repeating-linear-gradient(45deg,#1d2a4a,#1d2a4a 8px,#24345c 8px,#24345c 16px);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;font:inherit}
.draw-back b{font-size:34px}.draw-back span{font-weight:800}.draw-back small{font-size:11px;opacity:.7}.draw-back.gold{border-color:var(--gold);box-shadow:0 0 12px rgba(242,193,78,.35)}.draw-back.gold span{color:var(--gold)}
.mystat{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}.mystat th,.mystat td{padding:5px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08)}.mystat td:first-child,.mystat th:first-child{text-align:left;white-space:nowrap}
.pas-hit{margin:6px 0;padding:8px 10px;border-radius:10px;background:linear-gradient(90deg,rgba(255,213,74,.25),rgba(255,213,74,.05));color:#FFD54A;font-weight:800}
.medal-page{display:grid;gap:10px;text-align:center;padding:14px 0 6px;border-radius:20px;background:radial-gradient(circle at 50% 42%,rgba(242,140,40,.16),transparent 62%);transition:background .6s}
.medal-page.legend-hit{background:radial-gradient(circle at 50% 42%,rgba(255,213,74,.3),transparent 66%)}
.medal-page h2{font-size:26px;letter-spacing:.08em}.medal-page .eyebrow{color:#ff8a4a;letter-spacing:.2em;font-size:12px}
.medal-page.quake{animation:shake .4s}
.medals{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:6px;align-items:start;margin:8px 0}
.medal{position:relative;display:grid;justify-items:center;align-content:start;gap:4px;padding:8px 4px 12px;border-radius:16px;border:1.5px solid transparent;background:none;color:inherit;font:inherit;cursor:pointer;perspective:600px;transition:transform .25s,border-color .25s,background .25s,opacity .35s}
.medal .m-art{position:relative;z-index:1;width:100%;max-width:118px}
.medal svg{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 12px rgba(0,0,0,.55))}
.medal .m-tag{position:relative;z-index:1;font-size:11px;font-weight:800;padding:1px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.3);color:#C9D1DE}
.medal .m-name{position:relative;z-index:1;font-size:15px}.medal .m-star{color:var(--muted);font-size:11px}
.medal .m-desc{font-size:12px;line-height:1.45;color:#C3CADA}
.medal.locked .m-art{animation:mBreath 2.4s ease-in-out infinite}.medal.locked .m-name{color:var(--muted)}
.medal.legend .m-tag{border-color:#FFD54A;color:#1A0E02;background:#FFD54A}.medal.legend .m-name{color:#FFD54A;text-shadow:0 0 12px rgba(255,213,74,.6)}
.medal.legend svg{filter:drop-shadow(0 0 16px rgba(255,213,74,.75)) drop-shadow(0 8px 12px rgba(0,0,0,.5))}
.m-rays{position:absolute;left:50%;top:10%;width:150%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:repeating-conic-gradient(rgba(255,213,74,.4) 0 7deg,transparent 7deg 20deg);-webkit-mask:radial-gradient(circle,#000 25%,transparent 68%);mask:radial-gradient(circle,#000 25%,transparent 68%);animation:woSpin 9s linear infinite;pointer-events:none}
.m-shine{animation:mShine 3s ease-in-out infinite}
.medal.spin-out .m-art{animation:mOut .3s ease-in forwards}.medal.spin-in .m-art{animation:mIn .6s cubic-bezier(.2,1.5,.4,1)}
.medal.sel{border-color:var(--gold);background:rgba(242,193,78,.1);transform:translateY(-6px) scale(1.04)}
.medals.chosen .medal:not(.sel){opacity:.22;transform:scale(.9);cursor:default}.medals.chosen .medal.sel .m-art{animation:mWear .9s ease-out}
.mp-act{display:grid;gap:10px}
.grow-up{display:grid;gap:2px;margin:6px 0;padding:8px 10px;border-radius:10px;background:linear-gradient(90deg,rgba(242,140,40,.22),rgba(242,140,40,.04));border-left:3px solid #ff8a4a}
.grow-up em{font-style:normal;color:#ff8a4a;font-weight:800}.grow-up small{color:#C3CADA}
.line-in{animation:lineIn .3s ease-out both}@keyframes lineIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.dc-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;padding:4px;border-radius:14px;background:var(--surface);border:1px solid var(--line)}
.dc-tabs [role=tab] b{font-size:14px!important;white-space:nowrap}
.chest-intro{display:grid;gap:12px;padding:10px 0}
.luck{display:grid;gap:8px;padding:12px;border-radius:14px;background:radial-gradient(circle at 30% 0%,rgba(72,199,116,.2),transparent 70%),rgba(255,255,255,.04);border:1px solid rgba(72,199,116,.4)}
.luck b{color:#9fe3b5}.luck .num b{font-size:22px}
.luck-bar{position:relative;height:12px;border-radius:99px;background:rgba(255,255,255,.1);margin:6px 10px 10px 0}.luck-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#48C774,#9fe3b5)}
.luck-bar .mk{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:18px;filter:drop-shadow(0 0 4px rgba(0,0,0,.6))}
.chest-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.chest{display:grid;gap:4px;justify-items:center;text-align:center;padding:14px 10px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14)}
.chest.super{border-color:#FFD54A;background:radial-gradient(circle at 50% 20%,rgba(255,213,74,.22),transparent 70%),rgba(255,255,255,.04)}
.chest-ico{font-size:40px}.chest b{font-size:15px}.chest.super b{color:#FFD54A}.chest small{color:var(--muted);font-size:11px}.chest-n{font-size:20px;font-weight:900}.chest .btn{width:100%}
.dc-tabs [role=tab]{display:grid;gap:2px;padding:10px 6px;border-radius:10px;border:0;background:none;color:var(--muted);font:inherit;cursor:pointer}
.dc-tabs [role=tab] b{font-size:15px}.dc-tabs small{font-size:12px}.dc-tabs small.has{color:var(--gold);font-weight:800}
.dc-tabs [aria-selected=true]{background:linear-gradient(180deg,rgba(242,140,40,.28),rgba(242,140,40,.1));color:#fff;box-shadow:inset 0 0 0 1px rgba(242,140,40,.6)}
.dc-stage{min-height:420px;display:grid;align-content:start}
.dc-intro{display:grid;gap:10px;justify-items:center;text-align:center;padding:12px 0;border-radius:20px;background:radial-gradient(circle at 50% 35%,rgba(242,140,40,.18),transparent 62%)}.dc-intro .btn{width:100%}
.dc-pack{position:relative;width:240px;height:200px;margin:6px auto 36px}
.dc-pack i{position:absolute;left:50%;bottom:24px;width:100px;aspect-ratio:5/7;margin-left:-50px;border-radius:12px;border:3px solid #2A1606;transform-origin:50% 130%;transform:rotate(calc((var(--i) - 4.5) * 7deg));box-shadow:0 8px 18px rgba(0,0,0,.45);
  background:radial-gradient(circle at 50% 50%,transparent 31%,#1A0E02 31.5%,#1A0E02 33%,transparent 33.5%),linear-gradient(90deg,transparent 49%,#1A0E02 49%,#1A0E02 51%,transparent 51%),linear-gradient(0deg,transparent 49%,#1A0E02 49%,#1A0E02 51%,transparent 51%),radial-gradient(circle at 35% 30%,#FFB25E,#E07316 60%,#A84F08);
  animation:packIn .5s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:calc(var(--i) * 30ms)}
.dc-pack:not(.dim) i:last-child{animation:packIn .5s cubic-bezier(.2,.9,.3,1.2) both,packGlow 1.6s ease-in-out .6s infinite}
.dc-pack.dim i{filter:grayscale(1) brightness(.45)}
@keyframes packIn{from{opacity:0;transform:translateY(40px) rotate(0)}}
@keyframes packGlow{50%{box-shadow:0 0 26px 6px rgba(242,193,78,.65)}}
.gacha.inpage{position:relative;top:auto;right:auto;bottom:auto;left:auto;z-index:auto;min-height:520px;border-radius:20px;padding:16px 10px 18px;align-content:start}
.gacha.inpage .deck.many{grid-template-columns:repeat(var(--cols),minmax(0,1fr));width:100%;gap:6px}
@media (prefers-reduced-motion:reduce){.line-in,.dc-pack i{animation:none!important}}
.mp-canvas{position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;pointer-events:none;z-index:60}
.mp-flash{position:fixed;top:0;right:0;bottom:0;left:0;pointer-events:none;z-index:59;background:radial-gradient(circle at 50% 40%,rgba(255,213,74,.75),rgba(255,213,74,0) 65%);animation:flash 1.1s ease-out forwards}
@keyframes mBreath{0%,100%{transform:none;filter:brightness(1)}50%{transform:translateY(-3px);filter:brightness(1.25)}}
@keyframes mShine{0%,55%{transform:translateX(0)}100%{transform:translateX(150px)}}
@keyframes mOut{to{transform:rotateY(450deg) scale(1.15)}}
@keyframes mIn{from{transform:rotateY(-90deg) scale(1.3)}to{transform:none}}
@keyframes mWear{0%{transform:none}40%{transform:scale(1.25) rotate(-6deg)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.medal .m-art,.m-shine,.m-rays,.medal-page.quake{animation:none!important}}
.lose-draw-btn{background:linear-gradient(90deg,#4A7BFF,#8A5CFF);color:#fff;box-shadow:0 0 18px rgba(110,110,255,.4)}
.xp.pts-line{flex-wrap:wrap;gap:2px 10px;align-items:baseline}.pts-line b{color:#FFD54A;font-size:15px}.pts-line i{display:inline;font-style:normal}
.lu-card.alloc{max-height:92vh;overflow:auto;gap:8px}.lu-card.alloc h3 em.up{color:#5EF2A0;font-style:normal}
.al-left{color:#FFD54A;font-size:16px}
.al-list{display:grid;gap:4px}
.al-row{display:grid;grid-template-columns:1fr auto 36px 36px;align-items:center;gap:6px;padding:3px 6px;border-radius:10px;background:rgba(255,255,255,.04)}
.al-row.on{background:rgba(242,201,76,.12)}
.al-k{font-weight:700;font-size:14px}.al-k small{margin-left:6px;color:var(--muted);font-size:11px;font-weight:400}
.al-v{font-weight:800;font-size:15px;min-width:64px;text-align:right}.al-v i{font-style:normal;color:#5EF2A0;margin-left:3px;font-size:12px;display:inline}.al-v small{color:#ff8a4a;margin-left:3px;font-size:10px}
.al-b{width:36px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;font-size:18px;font-weight:800;cursor:pointer;padding:0}
.al-b:disabled{opacity:.28;cursor:default}
.al-act{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.al-proj{margin:0;line-height:1.6}.al-proj em{color:#ff8a4a;font-style:normal}
.stat-grid.has-bond{grid-template-columns:repeat(4,1fr)}
.stat-grid .bond-stat{background:rgba(255,213,74,.12);box-shadow:inset 0 0 0 1px rgba(255,213,74,.45)}.stat-grid .bond-stat b{color:#FFD54A}
.bond-opp{margin:8px 0 0;color:#FFB4A2}
.tc-bond{display:inline-block;margin-top:2px;padding:0 4px;border-radius:4px;background:#FFD54A;color:#1A0E02;font:800 10px/1.4 var(--num);text-shadow:none}.bond-plus{color:#FFD54A;font-size:11px}
.bond-line{margin:8px 0 0;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.16);color:var(--muted);line-height:1.5}
.bond-line.on{color:#FFE7A3;background:rgba(255,213,74,.1);border:1px solid rgba(255,213,74,.45)}
.chest-deck{margin:6px auto 4px;row-gap:10px}
.cslot{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:0}
.cslot .gcard{width:100%;cursor:pointer;border-radius:14px;transition:transform .15s,box-shadow .15s}
.cslot.sel .gcard{transform:translateY(-3px);box-shadow:0 0 0 2.5px #FFD54A,0 6px 18px rgba(255,213,74,.35)}
.chest-grid{row-gap:6px;margin:2px 0 4px}
.chest-grid .cslot{padding-top:12px}.chest-grid .rec-tag{top:-2px}
.cslot .mcard{transition:transform .15s}.cslot.sel .mcard{transform:translateY(-3px)}
.c-src{font-size:9.5px;color:var(--muted);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.rec-tag{position:absolute;top:-7px;left:50%;transform:translateX(-50%);z-index:3;padding:1px 7px;border-radius:999px;background:#2ECC71;color:#062312;font-size:10px;font-weight:900;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.cg{font-size:10px;font-weight:800;white-space:nowrap}.cg.up{color:#5EF2A0}.cg.bench{color:#9fb0ff}.cg.none{color:var(--muted);font-weight:600}
.chest-rec{margin:6px 0 2px;padding:8px 10px;border-radius:12px;background:rgba(46,204,113,.1);border:1px solid rgba(46,204,113,.35);font-size:13px;line-height:1.5}
.chest-rec b{color:#5EF2A0}
.chest-roster{margin-top:10px;padding:10px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);display:grid;gap:6px}
.cr-row{display:grid;grid-template-columns:34px 1fr;gap:6px;align-items:start}
.cr-pos{font-size:12px;font-weight:800;color:#9fb0ff;padding-top:3px}
.cr-chips{display:flex;flex-wrap:wrap;gap:4px;min-width:0}
.cr-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:8px;font-size:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);white-space:nowrap}
.cr-chip b{font-family:var(--num);font-size:12px}
.cr-chip.st{border-color:#FFD54A;background:rgba(255,213,74,.12)}
.cr-chip.me{color:#FFD54A}
.cr-chip.out{text-decoration:line-through;color:#ff8a8a;border-color:#ff6b6b;background:rgba(255,80,80,.12)}
.cr-chip.in{color:#5EF2A0;border-color:#2ECC71;background:rgba(46,204,113,.14)}
.cr-key{display:flex;gap:6px;align-items:center;margin:2px 0 0}.cr-key .cr-chip{font-size:10px;padding:0 5px}
.mvp-strip{display:grid;grid-template-columns:56px 1fr;gap:12px;align-items:center;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)}
.mvp-strip.is-me{background:linear-gradient(90deg,rgba(255,213,74,.28),rgba(255,213,74,.06));border-color:#FFD54A;box-shadow:0 0 18px rgba(255,213,74,.25)}
.mvp-av{width:56px;height:56px;border-radius:50%;overflow:hidden;border:2px solid #FFD54A;background:#fff}
.mvp-strip .eyebrow{margin:0;font-size:11px;letter-spacing:.15em;color:#FFD54A;font-weight:800}
.mvp-strip b{font-size:16px;margin-right:6px}.mvp-strip small{color:#9aa4b8;font-size:12px}.mvp-strip span{display:block;font-size:13px;color:#fff;margin-top:2px}
.career-sum .cs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center}
.career-sum .cs-grid div{padding:8px 4px;border-radius:10px;background:rgba(255,255,255,.05)}.career-sum .cs-grid b{display:block;font:900 24px/1.1 Bahnschrift,Arial,sans-serif;color:#ff8a4a}.career-sum .cs-grid span{font-size:11px;color:#9aa4b8}
.career-sum .cs-best{padding:10px 12px;border-radius:12px;background:linear-gradient(90deg,rgba(255,213,74,.2),rgba(255,213,74,.04));border-left:3px solid #FFD54A}
.career-sum .cs-honor{display:flex;flex-wrap:wrap;gap:6px}.career-sum .cs-honor i{font-style:normal;font-size:12px;font-weight:800;padding:2px 10px;border-radius:999px;background:rgba(255,255,255,.08)}
.my-hero{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:12px 6px 10px;border-radius:14px;text-align:center;background:radial-gradient(circle at 50% 0%,rgba(255,138,74,.28),rgba(255,138,74,.05) 70%);border:1px solid rgba(255,138,74,.35)}
.my-hero>div{display:grid;gap:2px}.my-hero b{font:900 30px/1 Bahnschrift,Arial,sans-serif;color:#fff}.my-hero span{font-size:11px;color:#9aa4b8;letter-spacing:.1em}
.my-hero>div:first-child b{font-size:40px;color:#ff8a4a;text-shadow:0 0 18px rgba(255,138,74,.55)}.my-hero .hot b{color:#FFD54A}
.my-tags{grid-column:1/-1;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:6px 0 0}.my-tags i{font-style:normal;font-size:12px;font-weight:800;padding:2px 10px;border-radius:999px;color:#1A0E02;background:linear-gradient(90deg,#FFD54A,#F28C28)}
.box tr.me td{color:#ff8a4a;font-weight:800;background:rgba(255,138,74,.1)}.box.wide tr.me td:first-child{background:linear-gradient(rgba(255,138,74,.1),rgba(255,138,74,.1)),var(--surface)}
/* 底部导航（比赛 / 阵容 / 加点 / 抽卡 / 勋章） */
.tabbar{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:480px;z-index:40;display:grid;grid-template-columns:repeat(5,1fr);background:rgba(14,20,34,.97);border-top:1px solid var(--line);padding:4px 4px max(6px,env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(0,0,0,.35)}
.tabbar button{display:grid;justify-items:center;gap:1px;padding:5px 0 3px;color:var(--muted);font-size:11px;background:none;border:0;border-radius:10px}
.tabbar .ti{position:relative;font-size:20px;line-height:1.15;filter:grayscale(.7);opacity:.75}
.tabbar button.on{color:var(--accent);font-weight:700;background:rgba(242,140,40,.08)}
.tabbar button.on .ti{filter:none;opacity:1}
.tabbar .nb{position:absolute;top:-5px;left:calc(100% - 6px);min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#FF4D4F;color:#fff;font:700 10px/16px var(--num);font-style:normal;box-shadow:0 0 0 2px #0E1422;filter:none}
body.has-nav #app{padding-bottom:calc(84px + env(safe-area-inset-bottom))}
body.has-nav .toast{bottom:calc(80px + env(safe-area-inset-bottom))}
body.has-nav .sticky-cta{bottom:calc(74px + env(safe-area-inset-bottom))}
/* 小号竖卡：一排 5 张 */
.mgrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.mcard{--c1:#3A4766;position:relative;display:block;width:100%;aspect-ratio:3/4.1;border-radius:9px;overflow:hidden;padding:0;border:1.5px solid rgba(255,255,255,.1);background:linear-gradient(180deg,var(--c1),#070A12 88%);background:linear-gradient(180deg,color-mix(in srgb,var(--c1) 75%,#000),#070A12 88%);color:inherit;font:inherit;text-align:center}
.mc-fig{position:absolute;left:0;right:0;top:15%;bottom:19%}
.mc-fig svg{width:100%;height:100%;display:block}
.mc-ovr{position:absolute;top:3px;left:4px;z-index:2;font:800 15px/1 var(--num);text-shadow:0 1px 3px #000}
.mc-pos{position:absolute;top:4px;right:4px;z-index:2;font-size:10.5px;color:#E3E8F2;text-shadow:0 1px 2px #000}
.mc-bond{position:absolute;top:20px;left:3px;z-index:2;font-size:9px;font-weight:800;color:var(--gold);text-shadow:0 1px 2px #000}
.mc-me{position:absolute;bottom:21px;right:3px;z-index:2;font-size:9px;font-weight:800;padding:0 4px;border-radius:4px;background:var(--accent);color:#1A0E02}
.mc-name{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:3px 2px 4px;background:rgba(5,8,15,.88);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mc-name.sm{font-size:9.5px;letter-spacing:-.02em}.mc-name.xs{font-size:8.5px;letter-spacing:-.04em}
.mcard.me{border-color:var(--accent)}
.mc-badge{position:absolute;top:18px;right:3px;z-index:2;font-size:9px;font-weight:800;line-height:1.5;padding:0 4px;border-radius:4px;background:var(--gold);color:#1A0E02}
.mcard.rank-legend{border:2px solid #FFD54A;box-shadow:0 0 10px rgba(255,213,74,.5)}.mcard.rank-gold{border:2px solid #E8B64C}
.mcard.sel{border-color:var(--gold);box-shadow:0 0 0 2px var(--gold),0 0 14px rgba(242,193,78,.4)}
#myFive{cursor:pointer}
/* 比赛页 */
.me-row{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center}
.me-av{width:48px;height:48px;border-radius:50%;overflow:hidden;background:#fff;border:2px solid var(--accent)}
.me-info{min-width:0;display:grid;gap:2px}
.todo{display:flex;flex-wrap:wrap;gap:6px}
.todo-i{padding:6px 11px;border-radius:999px;background:linear-gradient(180deg,#3A2A0C,#2A1F0B);border:1px solid rgba(242,193,78,.55);color:#FFE3A1;font-size:13px;font-weight:700}
.vs-label{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:13.5px;font-weight:700;margin-top:2px}
.vs-label small{font-weight:400;color:var(--muted);font-size:11.5px}
.opp-bench summary{cursor:pointer}.opp-bench .mgrid{margin-top:8px}
.boss-tag{color:#1A0E02;background:var(--gold);padding:0 5px;border-radius:4px;font-size:11px}
.ladder.mini{grid-template-columns:repeat(10,1fr);gap:4px}
.ladder.mini .node{font-size:11px;border-radius:6px;border-width:1px}
.ladder.mini .node.boss{border-color:var(--gold);border-width:1.5px;font-family:var(--display);font-size:14px;color:var(--gold);background:linear-gradient(180deg,#3A2A0C,#241A08)}
.ladder.mini .node.boss.cur{background:var(--accent);color:var(--accent-ink)}.ladder.mini .node.boss.done{background:#1E3A2C;color:var(--win)}
/* Boss 登场：全屏压暗 + 巨字砸下 + 白闪 + 震屏，头像、名字、技能依次亮出 */
.boss-intro{position:fixed;top:0;right:0;bottom:0;left:0;z-index:80;display:grid;place-items:center;overflow:hidden;cursor:pointer;background:radial-gradient(circle at 50% 42%,#4A1608 0%,#170704 55%,#050203 100%);animation:bi-in .2s ease-out,bi-shake .45s .25s}
.boss-intro.out{animation:bi-out .26s ease-in forwards}
.bi-glyph{position:absolute;font-family:var(--display);font-size:min(92vw,440px);line-height:1;color:rgba(255,213,74,.16);text-shadow:0 0 60px rgba(255,120,40,.35);animation:bi-glyph .55s cubic-bezier(.2,1.4,.4,1) both}
.bi-flash{position:absolute;top:0;right:0;bottom:0;left:0;background:#FFF2C8;opacity:0;animation:bi-flash .5s .18s ease-out}
.bi-core{position:relative;display:grid;justify-items:center;gap:8px;text-align:center;padding:0 20px}
.bi-tag{font-family:var(--display);font-size:16px;letter-spacing:.25em;color:#FF6B5B;animation:bi-blink .6s steps(2) 3}
.bi-av{width:124px;height:124px;border-radius:50%;overflow:hidden;background:#fff;border:3px solid #FFD54A;box-shadow:0 0 0 6px rgba(255,213,74,.15),0 0 50px rgba(255,180,60,.65);animation:bi-pop .5s .3s cubic-bezier(.2,1.6,.4,1) both}
.bi-name{font-family:var(--display);font-size:34px;line-height:1.15;color:#FFD54A;text-shadow:0 0 22px rgba(255,180,60,.6);animation:bi-up .4s .55s both}
.bi-team{font-size:14px;color:#E3E8F2;animation:bi-up .4s .65s both}
.bi-skill{margin-top:4px;max-width:330px;padding:7px 14px;border-radius:12px;background:rgba(255,107,91,.16);border:1px solid rgba(255,107,91,.65);color:#FFC2B8;font-size:13px;line-height:1.5;animation:bi-up .4s .85s both}
.bi-tap{margin-top:10px;font-size:12px;color:rgba(255,255,255,.5);animation:bi-up .4s 1.4s both}
@keyframes bi-in{from{opacity:0}}@keyframes bi-out{to{opacity:0;transform:scale(1.04)}}
@keyframes bi-glyph{from{transform:scale(2.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes bi-flash{0%{opacity:.85}100%{opacity:0}}
@keyframes bi-shake{0%,100%{transform:none}20%{transform:translate(-7px,4px)}40%{transform:translate(6px,-5px)}60%{transform:translate(-4px,3px)}80%{transform:translate(3px,-2px)}}
@keyframes bi-blink{50%{opacity:.25}}
@keyframes bi-pop{from{transform:scale(.3);opacity:0}}
@keyframes bi-up{from{transform:translateY(14px);opacity:0}}
/* Boss 技能发动：屏幕四周红光一闪 + 顶部弹出横条 */
.skill-fx{position:fixed;top:0;right:0;bottom:0;left:0;z-index:75;pointer-events:none}
.sf-edge{position:absolute;top:0;right:0;bottom:0;left:0;box-shadow:inset 0 0 80px 20px rgba(255,60,40,.55);animation:sf-edge 1.8s ease-out forwards}
.sf-bar{position:absolute;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:8px 18px 8px 10px;border-radius:14px;white-space:nowrap;background:linear-gradient(100deg,#5A1408,#2A0A06);border:1.5px solid #FFD54A;box-shadow:0 8px 30px rgba(255,80,40,.5);animation:sf-bar 1.8s cubic-bezier(.2,1.3,.4,1) forwards}
.sf-glyph{font-family:var(--display);font-size:34px;line-height:1;color:#FFD54A;text-shadow:0 0 16px rgba(255,200,80,.7)}
.sf-bar small{display:block;font-size:11px;color:#FFB4A8;letter-spacing:.1em}.sf-bar b{display:block;font-family:var(--display);font-size:20px;color:#fff}
@keyframes sf-edge{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
.skill-fx.hold .sf-bar,.skill-fx.hold .sf-edge{animation-play-state:paused;animation-delay:-.45s}
@keyframes sf-bar{0%{transform:translate(-50%,-120%) scale(.9);opacity:0}14%{transform:translate(-50%,0) scale(1.06);opacity:1}24%{transform:translate(-50%,0) scale(1)}82%{opacity:1}100%{transform:translate(-50%,-30%);opacity:0}}
@media (prefers-reduced-motion: reduce){.boss-intro,.bi-glyph,.bi-flash,.bi-av,.bi-name,.bi-team,.bi-skill,.bi-tap,.bi-tag,.sf-bar,.sf-edge{animation-duration:.01s!important;animation-delay:0s!important}}
/* 嘲讽：对面头像 + 对话气泡（Boss 金边） */
.taunt{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center}
.tt-av{width:52px;height:52px;border-radius:50%;overflow:hidden;background:#fff;border:2px solid #FF6B5B}
.taunt.boss .tt-av{border-color:#FFD54A;box-shadow:0 0 14px rgba(255,213,74,.5)}
.tt-bubble{position:relative;padding:9px 12px;border-radius:12px;background:#2A1414;border:1px solid rgba(255,107,91,.5)}
.taunt.boss .tt-bubble{background:#2E220C;border-color:rgba(255,213,74,.6)}
.tt-bubble::before{content:"";position:absolute;left:-7px;top:50%;width:12px;height:12px;background:inherit;border-left:inherit;border-bottom:inherit;transform:translateY(-50%) rotate(45deg)}
.tt-bubble b{font-size:12px;color:#FF8A7A}.taunt.boss .tt-bubble b{color:#FFD54A}
.tt-bubble p{margin:2px 0 0;font-size:15px;font-weight:700;line-height:1.5;color:#fff}
/* Boss 球员卡 */
.boss-card{display:flex;justify-content:center}.boss-card .tcard{flex:0 0 46%;max-width:200px;box-shadow:0 0 0 2px #FFD54A,0 0 30px rgba(255,213,74,.4)}
.boss-card-btn{background:linear-gradient(180deg,#FFE08A,#F2B13A 55%,#D98A1A)}
.bb-skill{font-size:12px!important;color:#FFC2B8!important;margin-top:2px}
.boss-beat{margin-top:6px;font-family:var(--display);font-size:18px;color:#FFD54A;text-shadow:0 0 14px rgba(255,213,74,.5)}
.boss-banner{position:relative;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;overflow:hidden;background:linear-gradient(100deg,rgba(255,213,74,.22),rgba(242,140,40,.06) 60%,transparent);border:1px solid rgba(255,213,74,.55)}
.bb-glyph{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-family:var(--display);font-size:64px;line-height:1;color:rgba(255,213,74,.22);pointer-events:none}
.bb-av{width:46px;height:46px;border-radius:50%;overflow:hidden;background:#fff;border:2px solid #FFD54A;box-shadow:0 0 14px rgba(255,213,74,.45)}
.bb-info{display:grid;gap:1px;position:relative}.bb-info b{font-family:var(--display);font-size:18px;color:#FFD54A;letter-spacing:.04em}.bb-info span{font-size:12.5px;color:#E3E8F2}
/* 阵容页 */
.ts-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;text-align:center}
.ts-grid div{background:var(--surface-2);border-radius:9px;padding:6px 2px;display:grid}
.ts-grid b{font-size:16px}.ts-grid span{font-size:10.5px;color:var(--muted)}
.ts-grid .on b{color:var(--gold)}.ts-grid .tot{background:rgba(242,140,40,.15)}.ts-grid .tot b{color:var(--accent)}
/* 抽卡页两个标签、加点页、勋章图鉴 */
.dc-tabs.two{grid-template-columns:1fr 1fr}
.lu-card.page{max-width:none;width:auto;margin:0;box-shadow:none}
.medal-book h3{margin:0}
.mb-group{display:grid;gap:6px}
.mb-list{display:grid;gap:5px}
.mb-item{display:grid;grid-template-columns:28px 7.5em 1fr;gap:8px;align-items:center;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);opacity:.5}
.mb-item.own{opacity:1;border-color:rgba(242,140,40,.6);background:rgba(242,140,40,.08)}
.mb-item.rare.own{border-color:#FFD54A;background:rgba(255,213,74,.08)}
.mb-ico{font-size:20px;text-align:center}
.mb-item b{display:block;font-size:13px}.mb-item small{display:block;font-size:10.5px;color:var(--muted)}
.mb-item em{font-style:normal;font-size:12px;color:#C9D2E3}
/* 造型页：上面大卡预览，下面 15 张小卡自己选 */
.look-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.name-box{display:grid;gap:8px;padding:12px;border-radius:14px;border:1px solid rgba(255,213,74,.28);background:linear-gradient(180deg,rgba(255,213,74,.08),rgba(255,213,74,.02))}
.name-label{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-family:var(--display);font-size:17px;color:#FFD54A}
.name-label small{font-family:var(--body);font-size:12px;color:#94A2BC}
.name-box .name-input{font-size:17px;font-weight:700;padding:12px 14px;border-color:rgba(255,213,74,.35)}
.name-box .name-input:focus{outline:none;border-color:#FFD54A;box-shadow:0 0 0 2px rgba(255,213,74,.25)}
.name-ideas{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12.5px;color:#94A2BC}
.name-ideas #ideas{display:contents}
.name-idea{padding:6px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#EEF2F8;font-size:13px}
.name-idea:active{background:rgba(255,213,74,.2);border-color:#FFD54A}
.name-idea.dice{padding:6px 9px}
.look-sub{margin:2px 0 -4px;font-size:13px;color:#94A2BC}
.look-thumb{--c1:#3A4766;position:relative;display:block;width:100%;aspect-ratio:3/3.9;border-radius:9px;overflow:hidden;padding:0;border:1.5px solid rgba(255,255,255,.1);background:linear-gradient(180deg,var(--c1),#070A12 92%);background:linear-gradient(180deg,color-mix(in srgb,var(--c1) 70%,#000),#070A12 92%);color:inherit;font:inherit}
.look-thumb>svg{position:absolute;left:0;top:3%;width:100%;height:80%}
.look-thumb span{position:absolute;left:0;right:0;bottom:0;padding:2px 1px 3px;font-size:10.5px;text-align:center;background:rgba(5,8,15,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.look-thumb.sel{border-color:#FFD54A;box-shadow:0 0 0 2px #FFD54A,0 0 12px rgba(255,213,74,.4)}.look-thumb.sel span{color:#FFD54A;font-weight:800}
.look-stage{display:flex;justify-content:center;padding:2px 0}
.look-card{--c1:#3A4766;position:relative;width:min(50vw,200px);aspect-ratio:3/4.1;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,var(--c1),#070A12 88%);background:linear-gradient(180deg,color-mix(in srgb,var(--c1) 78%,#000),#070A12 88%);border:2px solid rgba(255,255,255,.12)}
.look-card>svg,.look-card .lb>svg{position:absolute;left:0;top:6%;width:100%;height:78%}
.look-card .lb{display:contents}.look-card .lb[hidden]{display:none}
.look-card.done{border-color:#FFD54A;box-shadow:0 0 0 3px rgba(255,213,74,.25),0 0 34px rgba(255,213,74,.4);animation:lc-pop .4s cubic-bezier(.2,1.6,.4,1)}
.lc-name{position:absolute;left:0;right:0;bottom:0;padding:8px 6px 10px;text-align:center;background:rgba(5,8,15,.9)}
.lc-name small{display:block;font-size:12px;color:#AAB4C6}.lc-name b{display:block;font-family:var(--display);font-size:21px;letter-spacing:.03em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.look-card.done .lc-name b{color:#FFD54A}
@keyframes lc-pop{from{transform:scale(.9)}}
/* 首页：标题 + 楼主帖 + 贴底的开始按钮 */
.home-hero{position:relative;isolation:isolate;display:grid;justify-items:center;text-align:center;gap:6px;padding:16px 0 2px}
.home-hero::before{content:"";position:absolute;left:-16px;right:-16px;top:-20px;height:240px;z-index:-1;pointer-events:none;background:radial-gradient(55% 65% at 50% 35%,rgba(242,140,40,.30),transparent 70%)}
.hh-badge{font-size:12px;padding:3px 10px;border-radius:999px;background:rgba(242,140,40,.12);border:1px solid rgba(242,140,40,.45);color:#FFC58A}
.hh-title{font-size:66px;line-height:1.02;letter-spacing:.02em;margin:6px 0 0;display:flex;align-items:baseline;gap:2px}
.hh-title span{color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.5)}
.hh-title b{font-weight:inherit;background:linear-gradient(180deg,#FFE08A 0%,#F7A23B 45%,#E2541C 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 14px rgba(242,140,40,.45))}
.hh-sub{font-family:var(--display);font-size:19px;letter-spacing:.3em;margin-right:-.3em;color:var(--gold)}
.hh-pitch{margin-top:8px;font-size:16px;line-height:1.6;color:#DDE4F0}
.hh-pitch b{color:#FFC58A}
.hh-pitch em{display:block;margin-top:2px;font-style:normal;font-family:var(--display);font-size:26px;letter-spacing:.04em;color:#fff;text-shadow:0 0 18px rgba(242,140,40,.55)}
.challenge{gap:8px;background:linear-gradient(180deg,#1B2540,#172033)}
.challenge .eyebrow{margin:0;color:var(--gold);font-weight:800;letter-spacing:.08em}
.challenge>p{font-size:14.5px;line-height:1.75;color:#C9D2E3}.challenge>p b{color:#FFC58A}
.ch-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px}
.ch-facts span{display:grid;justify-items:center;padding:8px 4px;border-radius:10px;background:rgba(0,0,0,.22);font-size:11.5px;color:var(--muted)}
.ch-facts b{font-family:var(--display);font-size:24px;line-height:1.1;color:#fff}
.home-rec{text-align:center;font-size:13px;color:var(--muted)}
.home-foot{text-align:center;font-size:12px;line-height:1.8;color:var(--muted)}
.home-restart{justify-self:center;font-size:12.5px;color:var(--muted)}.home-restart.warn{color:#FF8A65;font-weight:700}
.home-cta{position:sticky;bottom:0;z-index:20;margin:-6px -16px calc(-1 * max(28px, env(safe-area-inset-bottom)));padding:16px 16px max(16px,env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(14,20,34,0),rgba(14,20,34,.94) 32%,#0E1422)}
.btn-big{display:grid;gap:1px;padding:13px 16px 11px;font-size:22px;border-radius:15px;background:linear-gradient(180deg,#FFAE55,#F28C28 55%,#DD6A1A);box-shadow:0 8px 26px rgba(242,140,40,.38),inset 0 1px 0 rgba(255,255,255,.35)}
.btn-big small{font-family:var(--body);font-size:12px;font-weight:700;letter-spacing:0;opacity:.75}
.home-boss h3,.home-how h3{margin:0;font-size:16px}
/* 首页「步行街热议」：话题轮播（淡出 → 换字 → 淡入） */
.hot{background:linear-gradient(160deg,#3A1F1A,#1B2238 58%,#172033);border-color:rgba(255,120,60,.28)}
.hot .eyebrow{color:#FF8A4C}
.hot-q{min-height:2.75em;font-family:var(--display);font-size:22px;line-height:1.35;color:#fff;text-wrap:balance;text-shadow:0 0 16px rgba(255,120,60,.35)}
.hot-q span{display:block;transition:opacity .3s,transform .3s}.hot-q span.out{opacity:0;transform:translateY(6px)}
/* 首页 Boss 墙：每人一圈自己颜色的转动光环 + 呼吸光晕，依次弹出；点中的放大、名字变色 */
.hb-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px 4px;margin-top:4px}
.hb{position:relative;display:grid;justify-items:center;gap:2px;text-align:center;min-width:0;padding:6px 0 2px;margin:0;background:none;border:0;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;animation:hb-in .55s cubic-bezier(.2,.9,.3,1.3) both;animation-delay:var(--d)}
.hb-ring{position:relative;isolation:isolate;display:grid;place-items:center;width:58px;height:58px;margin-bottom:9px;transition:transform .25s}
.hb-ring::before{content:"";position:absolute;top:0;right:0;bottom:0;left:0;border-radius:50%;background:conic-gradient(var(--c1),var(--c2),var(--c1),var(--c2),var(--c1));animation:hb-spin 3.2s linear infinite;animation-delay:calc(var(--d) * -5)}
.hb-ring::after{content:"";position:absolute;top:-8px;right:-8px;bottom:-8px;left:-8px;z-index:-1;border-radius:50%;background:radial-gradient(circle,var(--c1) 0%,transparent 66%);opacity:.4;animation:hb-glow 2.4s ease-in-out infinite;animation-delay:calc(var(--d) * -4)}
.hb-av{position:relative;width:52px;height:52px;border-radius:50%;overflow:hidden;background:#fff}
.hb-lv{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);font-style:normal;font-size:9.5px;font-weight:800;line-height:1;padding:3px 6px;border-radius:999px;white-space:nowrap;color:#140A02;background:linear-gradient(90deg,var(--c1),var(--c2));box-shadow:0 2px 6px rgba(0,0,0,.45)}
.hb-lv.down{color:#06210F;background:#5BE08A}
.hb b{font-size:12px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s}
.hb small{font-size:10px;color:var(--muted);white-space:nowrap}
.hb.on .hb-ring{transform:scale(1.1)}.hb.on b{color:var(--c1)}
.hb-say{min-height:2.9em;margin:8px 0 0;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.05);border-left:3px solid var(--sc,#FFD54A);font-size:13px;line-height:1.55;color:#E6ECF5}
.hb-say b{color:var(--sc,#FFD54A)}
.hb-tip{margin:0;text-align:center;font-size:11px;color:var(--muted)}
@keyframes hb-spin{to{transform:rotate(1turn)}}
@keyframes hb-glow{50%{opacity:.85;transform:scale(1.1)}}
@keyframes hb-in{from{opacity:0;transform:translateY(12px) scale(.8)}}
@media (prefers-reduced-motion:reduce){.hb,.hb-ring::before,.hb-ring::after{animation:none}.hot-q span{transition:none}}
/* 文字按钮看起来不变，点按区域放大到约 44px 高（手机上好点） */
.link-btn{padding:12px 6px;margin:-12px -6px}#back.muted,#home.muted{padding:12px 10px;margin:-12px -10px}#speed{padding:7px 12px}
.home-how ol{margin:0;padding-left:20px;display:grid;gap:7px;font-size:13.5px;color:var(--muted);line-height:1.5}
.home-how li b{color:var(--text,#fff);margin-right:6px}
.shot-line{margin:0;font-size:12.5px;line-height:1.75;color:#cfe3ff;font-family:var(--num)}.shot-line b{display:inline-block;min-width:5.2em;color:var(--muted);font-weight:400;font-family:var(--body)}
.buffs{display:inline-flex;flex-wrap:wrap;gap:4px;margin:0 4px;vertical-align:middle}
.buffs i{font-style:normal;font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;color:#9fe3b5;background:rgba(72,199,116,.14);border:1px solid rgba(72,199,116,.45)}
.buffs i.buff-ovr{color:#1A0E02;background:#9fe3b5}
.attr .buff{font-style:normal;font-size:10px;font-weight:800;color:#9fe3b5;margin-left:3px}.attr.buffed{border-color:rgba(72,199,116,.45)}
.pas-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.pas-chip{font-size:12px;padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.25)}.pas-chip.rare{border-color:#FFD54A;color:#FFD54A}
.re-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}.re-row .small-btn{margin:0;padding-left:4px;padding-right:4px}
</style>`);

// 旧存档补上球队简称（文字直播里用）
if (run && run.career && !run.teamLabel && run.teamCode) run.teamLabel = C.TEAM_CN[run.teamCode];
// 2026-11-26 挑战失败选秀改成 10 连抽：老存档里没用掉的选秀次数换成同样多次 10 连抽
if (run && (run.draftPending || run.draftOffer)) {
  run.draws = (run.draws || 0) + (run.draftPending || 0);
  delete run.draftPending; delete run.draftOffer;
  save();
}
// 旧存档里你的球员是 13 项能力（三分、中投、扣篮、护球、盖帽、关键……），换成新的 11 项：
// 三分→3分、中投→2分、护球→控球，扣篮和盖帽合成弹跳（取高的），关键去掉；普通勋章的加成也一样换
if (run && Array.isArray(run.team)) {
  const me = run.team.find((p) => p.isMe);
  const conv = (o) => {
    if (!o || o['3分'] != null || o.三分 == null) return o;
    const n = { '3分': o.三分, '2分': o.中投, 终结: o.终结, 控球: o.护球, 传球: o.传球, 外防: o.外防, 内防: o.内防, 篮板: o.篮板, 力量: o.力量, 运动: o.运动, 弹跳: Math.max(o.扣篮 || 0, o.盖帽 || 0) };
    for (const k of Object.keys(n)) if (n[k] == null) n[k] = 60;
    return n;
  };
  if (me && me.attrs && me.attrs.三分 != null) {
    me.attrs = conv(me.attrs);
    if (me.bonus) {
      const b = me.bonus, nb = {};
      const map = { 三分: '3分', 中投: '2分', 护球: '控球', 扣篮: '弹跳', 盖帽: '弹跳' };
      for (const [k, v] of Object.entries(b)) if (k !== '关键') nb[map[k] || k] = (nb[map[k] || k] || 0) + v;
      me.bonus = nb;
    }
    me.ovr = C.ovrFromAttrs(me.attrs, me.pos);
    Object.assign(me, C.projectLine(me));
    run.ovr0 = null; // 成长曲线按新的总评重新起算
  }
}
// 旧存档里的碎片换成幸运值（按段位：传奇 15、金 10、紫 8、蓝 6、银 5、铜 4）
if (run && run.career && (run.frags || run.fragOffer)) {
  const per = { legend: 15, gold: 10, purple: 8, blue: 6, silver: 5, bronze: 4 };
  const pts = Object.entries(run.frags || {}).reduce((s, [k, n]) => s + (per[k] || 0) * n, 0) + (run.fragOffer ? per[run.fragOffer.tier] * 5 : 0);
  delete run.frags;
  delete run.fragOffer;
  addLuck(pts);
  save();
}
// 旧存档里的冠军球员（10 连抽签来的）统一成生涯固定总评（比如汤普森 94 → 95）
if (run && Array.isArray(run.team)) {
  const fix = (p) => { if (p && !p.isMe && p.from && p.from !== '现役' && /^\d{4}$/.test(String(p.season))) { const o = E.champOvr(p.name); if (o) p.ovr = o; } };
  run.team.forEach(fix);
  if (run.signing && run.signing.cards) run.signing.cards.forEach(fix);
  save();
}
// 2026-11-26 开局球星评分改了（东契奇、文班 100 → 99，亚历山大、字母哥 99 → 98）：老存档里已经在队里的现役球星跟着改
if (run && Array.isArray(run.team)) {
  const now = new Map(C.PICK_STARS.map((s) => [s.name, s.ovr]));
  const fix = (p) => { if (p && !p.isMe && (p.from === '现役' || p.season === '本季') && now.has(p.name)) p.ovr = now.get(p.name); };
  run.team.forEach(fix);
  if (run.signing && run.signing.cards) run.signing.cards.forEach(fix);
  if (run.chestOffer && run.chestOffer.players) run.chestOffer.players.forEach(fix);
  save();
}
// game.js 加载时已经画过一次旧首页，这里重画成生涯模式
home();
window.__gameReady = true; // 首页画好了：boot.js 不再提示（启动画面已经被首页替换掉）
// 虎扑版：首页画好、能点了，通知平台（GameHupu 会等标题字体和首页照片加载完再发）
if (window.GameHupu) window.GameHupu.ready(app);
