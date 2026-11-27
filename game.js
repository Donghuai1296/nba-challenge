// 诸神黄昏：王朝终结者（30 关模式叫「挑战王朝」）：界面与流程
const E = window.Engine;
// 有照片时（虎扑版、网站版）：10 连抽和宝箱不出找不到照片的老替补（显示成剪影，像头像没加载出来）。Q 版（NO_PHOTOS）不用去
if (!window.NO_PHOTOS && window.Avatar) E.limitGachaPool((p) => !!Avatar.photoOf(p));
const app = document.getElementById('app');
const TOTAL = E.LEVELS.length;
const LIVES = 3;
const SAVE_VERSION = 4; // 加入位置后的存档版本

/* ---------- 存档（浏览器本地） ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
let run = store.get('nba-run', null);
if (run && run.v !== SAVE_VERSION) {
  // 旧版本存档规则不同，直接丢弃
  run = null;
  store.del('nba-run');
}
// 2026-11-26 球队改用城市名（队名是 NBA 的注册商标）：老存档里的「1996 芝加哥公牛」「1996 公牛」「湖人」换成城市名。
// 冠军卡的 from 关系到羁绊判断，必须换；只换「（年份）（城市）队名」整串，球员名字、外号不会误伤
if (run && window.Career) {
  const OLD = { 老鹰: 'ATL', 凯尔特人: 'BOS', 篮网: 'BKN', 黄蜂: 'CHA', 公牛: 'CHI', 骑士: 'CLE', 独行侠: 'DAL', 小牛: 'DAL', 掘金: 'DEN', 活塞: 'DET', 勇士: 'GSW', 火箭: 'HOU', 步行者: 'IND', 快船: 'LAC', 湖人: 'LAL', 灰熊: 'MEM', 热火: 'MIA', 雄鹿: 'MIL', 森林狼: 'MIN', 鹈鹕: 'NOP', 尼克斯: 'NYK', 雷霆: 'OKC', 魔术: 'ORL', '76 人': 'PHI', '76人': 'PHI', 太阳: 'PHX', 开拓者: 'POR', 国王: 'SAC', 马刺: 'SAS', 猛龙: 'TOR', 爵士: 'UTA', 奇才: 'WAS' };
  const CITIES = new Set(['', '洛杉矶', ...Object.values(window.Career.TEAM_CN)]);
  const nicks = Object.keys(OLD).sort((a, b) => b.length - a.length);
  const INTERIM = { 洛杉矶L: '洛杉矶', 洛杉矶C: '洛杉矶快艇' }; // 11-26 当天中间版本的叫法
  const fix = (s) => {
    if (INTERIM[s]) return INTERIM[s];
    const m = s.match(/^(\d{4} )?(.+)$/);
    const k = m && nicks.find((n) => m[2].endsWith(n) && CITIES.has(m[2].slice(0, -n.length).trim()));
    if (!k) return s;
    return (m[1] || '') + window.Career.TEAM_CN[OLD[k]];
  };
  let changed = 0;
  const walk = (o) => {
    for (const key of Object.keys(o)) {
      const v = o[key];
      if (typeof v === 'string') { const t = fix(v); if (t !== v) { o[key] = t; changed++; } } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(run);
  if (changed) store.set('nba-run', run);
}
// 已删掉的勋章（2026-11-18 传奇勋章只留乔丹、詹姆斯、麦迪、库里、杜兰特）：从老存档里清掉；待选的三枚里有删掉的，换一枚新抽的
if (run) {
  // 普通勋章 2026-11-19 重做（11 项能力各一枚，各 +2）：老存档先扣掉旧勋章的加成，再换成对应的新勋章（撞了就换一枚还没有的）
  // medalV = 2 的存档已经是新勋章（新开局会写上），不再迁移
  if (run.career && (run.medalV || 1) < 2 && window.Career) {
    const me = run.team && run.team.find((p) => p.isMe);
    // 老存档里 11-18 删掉的传奇勋章（科比、魔术师、罗德曼、奥尼尔、吉诺比利）：同名的现在是普通勋章，换成它（魔术师换一枚没有的）
    const LEGACY_LEGEND = { kobe: 'kobe', magic: null, rodman: 'rodman', shaq: 'shaq', manu: 'manu' };
    const old = (run.passives || []).filter((k) => E.OLD_NORMAL[k] || k in LEGACY_LEGEND);
    if (me && old.length) {
      for (const k of old) if (E.OLD_NORMAL[k]) for (const [a, v] of Object.entries(E.OLD_NORMAL[k].attr)) {
        me.attrs[a] -= v;
        if (me.bonus && me.bonus[a]) { me.bonus[a] -= v; if (me.bonus[a] <= 0) delete me.bonus[a]; }
      }
      const next = run.passives.filter((k) => !old.includes(k) && E.PASSIVES[k]);
      for (const k of old) {
        let to = E.OLD_NORMAL[k] ? E.OLD_NORMAL[k].to : LEGACY_LEGEND[k];
        if (!to || next.includes(to) || !E.PASSIVES[to]) to = Object.keys(E.PASSIVES).find((x) => !E.PASSIVES[x].rare && !next.includes(x));
        if (!to) continue;
        next.push(to);
        Career.applyPassive(me, to);
      }
      run.passives = next;
      me.ovr = Career.ovrFromAttrs(me.attrs, me.pos);
      Object.assign(me, Career.projectLine(me));
    }
    // 待选三枚里的旧勋章先空出来，下面统一补抽成新勋章
    if (run.passiveOffer) run.passiveOffer = run.passiveOffer.map((k) => (E.OLD_NORMAL[k] || k === 'magic' ? null : k));
    run.medalV = 2;
    store.set('nba-run', run);
  }
  // 造型（11-19 加的）：老存档里的你还没有造型，随机给一个
  const meOld = run.career && run.team && run.team.find((p) => p.isMe);
  if (meOld && meOld.look == null && window.Faces) { meOld.look = Math.floor(Math.random() * Faces.count); store.set('nba-run', run); }
  // 11-19 当天改名的普通勋章（雷·阿伦→克莱、欧文 / 韦德→吉诺比利、佩顿→皮蓬）：同一项能力 +2，只换名字
  const ren = (k) => E.RENAMED[k] || k;
  if (run.passives) run.passives = run.passives.map(ren);
  // 改名后和已有的、或者三枚里互相撞了的，空出来让下面补抽
  if (run.passiveOffer) run.passiveOffer = run.passiveOffer.map(ren).map((k, i, a) => ((run.passives || []).includes(k) || a.indexOf(k) !== i ? null : k));
  if (run.passives) run.passives = run.passives.filter((k) => E.PASSIVES[k]);
  if (run.passiveOffer && run.passiveOffer.some((k) => !E.PASSIVES[k])) {
    const keep = run.passiveOffer.filter((k) => E.PASSIVES[k] && !(run.passives || []).includes(k));
    for (let i = keep.length; i < run.passiveOffer.length && window.Career; i++) {
      const k = Career.drawPassive([...(run.passives || []), ...keep]);
      if (k) keep.push(k);
    }
    run.passiveOffer = keep;
  }
}
let best = store.get('nba-best-v3', 0);
const save = () => store.set('nba-run', run);

/* ---------- 小工具 ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = E.short;
const fmt1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const teamAvg = (team) => E.teamPower(team); // 首发 72% + 替补 28%
const myPower = () => teamAvg(run.team) + E.chemistry(run.wins) + bondPowerOf(run.team);
const starterAvg = (team) => E.avgOvr(team.slice(0, 5));
const benchAvg = (team) => E.avgOvr(team.slice(5));
const winChance = (diff) => 1 / (1 + Math.exp(-1.702 * ((diff * 1.4) / 11.3)));
const statLine = (p) => `${p.season === '本季' ? '本季 ' : ''}${fmt1(p.pts)}分 ${fmt1(p.reb)}板 ${fmt1(p.ast)}助 ${fmt1(p.stl)}断 ${fmt1(p.blk)}帽`;
const fromChip = (p) => (p.from && p.from !== '现役' ? ` <span class="chip">${esc(p.from)}</span>` : '');
const onTeam = (name) => run.team.some((p) => E.samePlayer(p.name, name)); // 不同译名也算同一人
// 同一个球员只留一张，可以升级（2026-11-26 用户定）：抽到的卡在队里已有同一个人时，
//   比队里那张强 → 可以签（只能换下旧版本，E.signTarget）；不比它强 → 算重复（换幸运值）
const dupBlocked = (c) => { const s = E.sameOnTeam(run.team, c); return !!s && (s.isMe || c.ovr <= s.ovr); };

const posTag = (p) => (p.pos ? `<span class="pos pos-${p.pos}">${E.POS_LABEL[p.pos]}</span>` : '');
function playerCard(p, opts = {}) {
  const cls = ['player', p.ovr >= 95 ? 'legend' : '', opts.sel ? 'sel' : '', opts.dim ? 'dim' : ''].join(' ');
  const tag = opts.button ? 'button' : 'div';
  return `<${tag} class="${cls}" ${opts.attrs || ''}>
    <div class="av-wrap ${opts.sm ? 'sm' : ''}"><div class="av">${Avatar.avatarSVG(p)}</div><span class="ovr-badge num">${p.ovr}</span></div>
    <div><div class="pname">${posTag(p)}${esc(p.name)}${opts.extra || ''}${opts.noFrom ? '' : fromChip(p)}</div><div class="pstat">${statLine(p)}</div></div>
  </${tag}>`;
}
// ---------- 2K 风格竖版球员卡 ----------
const splitName = (name) => {
  const i = name.lastIndexOf('·');
  return i < 0 ? ['', name] : [name.slice(0, i), name.slice(i + 1)];
};
const ringColor = (ovr) => (ovr >= 90 ? '#3CD070' : ovr >= 80 ? '#F2C94C' : '#F2994A');
function ringSVG(ovr) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const f = Math.max(0.05, Math.min(1, (ovr - 40) / 59));
  const v = esc(ovr); // 存档里读回来的数字也转义（虎扑安全复核 2026-11-27）
  return `<svg viewBox="0 0 44 44" class="ring" aria-label="综评 ${v}">
    <circle cx="22" cy="22" r="${r}" fill="rgba(5,8,15,0.72)" stroke="rgba(255,255,255,0.14)" stroke-width="4"/>
    <circle cx="22" cy="22" r="${r}" fill="none" stroke="${ringColor(ovr)}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/>
    <text x="22" y="16" text-anchor="middle" font-size="5.6" fill="#C9D2E3" font-family="Microsoft YaHei UI, sans-serif">综评</text>
    <text x="22" y="29.5" text-anchor="middle" font-size="14.5" font-weight="900" fill="#fff" font-family="Bahnschrift, Arial, sans-serif">${v}</text>
  </svg>`;
}
// 卡面水印印的是英文城市名（不印队名），长的城市名缩小字号，免得只露出半截
const wordFit = (w) => (w.length >= 11 ? ' w3' : w.length >= 8 ? ' w2' : '');
function tallCard(p, opts = {}) {
  const { kit, num } = Avatar.kitOf(p);
  const [first, last] = splitName(p.name);
  const tag = opts.button ? 'button' : 'div';
  return `<${tag} class="tcard ${opts.sel ? 'sel' : ''} ${opts.dim ? 'dim' : ''}" style="--c1:${kit.primary};--c2:${kit.secondary}" ${opts.attrs || ''}>
    <div class="tc-word${wordFit(kit.word)}">${kit.word}</div>
    <div class="tc-fig">${Avatar.avatarSVG(p, { bare: true })}</div>
    <div class="tc-ring">${ringSVG(p.ovr)}</div>
    <div class="tc-meta">${num !== undefined ? `#${esc(num)}<br>` : ''}${E.POS_LABEL[p.pos] || ''}${p.bondPlus ? `<br><span class="tc-bond">🔗+${esc(p.bondPlus)}</span>` : ''}</div>
    ${opts.badge ? `<div class="tc-badge">${opts.badge}</div>` : ''}
    <div class="tc-name">${first ? `<small>${esc(first)}</small>` : ''}<b${last.length >= 9 ? ' class="xl"' : last.length >= 7 ? ' class="lg"' : ''}>${esc(last)}</b></div>
  </${tag}>`;
}
// 顶部详情面板（类似 2K 阵容编辑器的上方大卡）
// 命中率一行（虎扑数据）：投篮、三分（出手太少不显示）、罚球；你自己按能力值估的
function shotPct(p) {
  const pr = p.isMe ? E.shotProfile(p) : null;
  const fg = p.fg > 0 ? p.fg : null;
  const tp = p.tp > 0 && (p.tpa == null || p.tpa >= 0.5) ? p.tp : null;
  const ft = p.isMe ? Math.round(pr.ft * 1000) / 10 : p.ft > 0 && (p.fta == null || p.fta > 0) ? p.ft : null;
  const parts = [fg != null && `投篮 ${fmt1(fg)}%`, tp != null && `三分 ${fmt1(tp)}%`, ft != null && `罚球 ${fmt1(ft)}%`].filter(Boolean);
  return parts.length ? `<div class="pstat">${parts.join(' · ')}</div>` : '';
}
function detailPanel(p, note = '') {
  const { kit, num } = Avatar.kitOf(p);
  const [first, last] = splitName(p.name);
  return `<section class="dpanel" style="--c1:${kit.primary};--c2:${kit.secondary}">
    <div class="dp-word${wordFit(kit.word)}">${kit.word}</div>
    <div class="dp-fig">${Avatar.avatarSVG(p, { bare: true })}</div>
    <div class="dp-ring">${ringSVG(p.ovr)}</div>
    <div class="dp-info">
      <div class="dp-meta">${num !== undefined ? `#${num} · ` : ''}${E.POS_LABEL[p.pos] || ''} · ${p.from && p.from !== '现役' ? esc(p.from) : '现役'}</div>
      ${first ? `<div class="dp-first">${esc(first)}</div>` : ''}<div class="dp-last">${esc(last)}</div>
      <div class="pstat">${p.po ? '常规赛 ' : ''}${statLine(p)}</div>
      ${p.po ? `<div class="pstat">季后赛 ${p.po.gp}场 ${fmt1(p.po.pts)}分 ${fmt1(p.po.reb)}板 ${fmt1(p.po.ast)}助 ${fmt1(p.po.stl)}断 ${fmt1(p.po.blk)}帽</div>` : ''}
      ${shotPct(p)}
      ${note ? `<div class="small" style="color:var(--gold)">${note}</div>` : ''}
    </div>
  </section>`;
}

function missingNote(team) {
  const miss = E.missingPositions(team);
  return miss.length
    ? `<p class="warn">首发缺少 ${miss.map((p) => E.POS_LABEL[p]).join('、')}，实力 -${miss.length * E.MISSING_POS_PENALTY}。点"一键排首发"或手动调整。</p>`
    : '';
}

// 阵容编辑：首发 5 人 + 替补 7 人，先后点两名球员互换位置
let swapPick = null;
function rosterHtml(team0, opts = {}) {
  const team = team0 === run.team ? withBond(team0) : team0; // 羁绊里的人显示加成后的总评；一拆散就变回原来的
  // 手机竖屏：首发、替补都用一排 5 张的小卡（以前是左右滑的大卡，一次只看得到 3 个人）
  const row = (p, i) => miniCard(p, {
    button: opts.editable,
    sel: swapPick === i,
    badge: isCore(p) ? '核心' : '',
    attrs: opts.editable ? `data-swap="${i}"` : '',
  });
  const focus = team[swapPick != null ? swapPick : 0];
  return `
    ${detailPanel(focus, isCore(focus) ? '核心球星' : '')}
    <div class="spread"><h3>首发</h3><span class="muted small num">均分 ${fmt1(starterAvg(team))}</span></div>
    <div class="mgrid">${team.slice(0, 5).map((p, i) => row(p, i)).join('')}</div>
    <div class="spread"><h3>替补</h3><span class="muted small num">均分 ${fmt1(benchAvg(team))}</span></div>
    <div class="mgrid">${team.slice(5).map((p, i) => row(p, i + 5)).join('')}</div>
    ${opts.editable ? `${missingNote(team)}<p class="note">${swapPick === null ? '点一名球员，再点另一名，两人互换（首发↔替补）。' : `已选 ${esc(short(team[swapPick].name))}，再点一名球员和他互换。`}</p>
      <button class="btn btn-ghost" id="arrange">一键排首发（每个位置用最强的人）</button>` : ''}`;
}
// 排首发时固定首发的人：
// 经典模式：核心球星；
// 生涯模式：开局选的明星不再是「核心」（只是普通队友，后期你自己的能力值肯定最高）；你点过一次「一键进入首发」（获得教练信任）后，你固定首发
const coreNames = () => {
  const me = run && run.team && run.team.find((p) => p.isMe);
  if (run && run.career) return run.trusted && me ? [me.name] : [];
  return run && run.trusted && me ? [run.star, me.name] : run.star;
};
const isCore = (p) => !!(run && !run.career && p && p.name === run.star); // 只有经典模式有核心球星
function bindArrange(rerender) {
  const el = document.getElementById('arrange');
  if (!el) return;
  el.onclick = () => {
    const before = teamAvg(run.team);
    run.team = E.arrange(run.team, coreNames());
    swapPick = null;
    save();
    rerender();
    toast(`首发已按位置排好，实力 ${fmt1(before)} → ${fmt1(teamAvg(run.team))}`);
  };
}
function bindSwap(rerender) {
  app.querySelectorAll('[data-swap]').forEach((el) => (el.onclick = () => {
    const i = Number(el.dataset.swap);
    if (swapPick === null) swapPick = i;
    else if (swapPick === i) swapPick = null;
    else {
      [run.team[swapPick], run.team[i]] = [run.team[i], run.team[swapPick]];
      swapPick = null;
      save();
    }
    rerender();
  }));
}

function hearts() {
  return `<span class="hearts" aria-label="剩余 ${run.lives} 条命">${Array.from({ length: LIVES }, (_, i) => `<span class="${i < run.lives ? '' : 'off'}">♥</span>`).join('')}</span>`;
}
function statusBar() {
  return `<div class="status">
    ${hearts()}
    <span class="chip">第 ${Math.min(run.level + 1, TOTAL)} / ${TOTAL} 关</span>
    <span class="chip">默契 +${fmt1(E.chemistry(run.wins))}</span>
    ${bondOf(run.team).bonus ? `<span class="chip gold">羁绊 ${bondOf(run.team).who.length}人+${bondOf(run.team).bonus}</span>` : ''}
    ${run.career ? '' : `<span class="chip ${run.draws ? 'gold' : ''}">10 连抽 ×${run.draws}</span>`}
  </div>`;
}
// 首发 5 + 替补 7 的小卡网格（结束页的最终阵容；只读）
function lineupGrids(team0) {
  const team = withBond(team0);
  return `<div class="spread"><b>首发</b><span class="muted small num">均分 ${fmt1(starterAvg(team))}</span></div>
    <div class="mgrid">${team.slice(0, 5).map((p) => miniCard(p)).join('')}</div>
    <div class="spread"><b>替补</b><span class="muted small num">均分 ${fmt1(benchAvg(team))}</span></div>
    <div class="mgrid">${team.slice(5).map((p) => miniCard(p)).join('')}</div>`;
}
// 小号竖卡：一排 5 张，阵容页和大厅对位用（不用左右滑就能看全首发、替补）
function miniCard(p, opts = {}) {
  const { kit } = Avatar.kitOf(p);
  const tag = opts.button ? 'button' : 'div';
  // opts.rank：legend / gold 加金边（抽卡组首发的传奇卡、金卡）；opts.badge：右上角位置下面的小角标（核心、传奇卡…）
  const rank = opts.rank && opts.rank !== 'normal' ? ` rank-${opts.rank}` : '';
  return `<${tag} class="mcard${opts.sel ? ' sel' : ''}${p.isMe ? ' me' : ''}${rank}" style="--c1:${kit.primary}" ${opts.attrs || ''}>
    <span class="mc-ovr num" style="color:${ringColor(p.ovr)}">${p.ovr}</span><span class="mc-pos">${E.POS_LABEL[p.pos] || ''}</span>
    ${p.bondPlus ? `<span class="mc-bond">🔗+${p.bondPlus}</span>` : ''}
    ${opts.badge ? `<span class="mc-badge">${opts.badge}</span>` : ''}
    <div class="mc-fig">${Avatar.avatarSVG(p, { bare: true })}</div>
    ${p.isMe ? '<span class="mc-me">我</span>' : ''}<b class="mc-name${short(p.name).length >= 6 ? ' xs' : short(p.name).length >= 5 ? ' sm' : ''}">${esc(short(p.name))}</b>
  </${tag}>`;
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  // 页面底部有固定按钮（「确认位置」这类 sticky-cta）时，提示放到按钮上面，不然会被挡住（起名没通过的提示就看不到）
  const cta = document.querySelector('.sticky-cta');
  if (cta) {
    const r = cta.getBoundingClientRect();
    if (r.height && r.top < window.innerHeight) t.style.bottom = `${Math.round(window.innerHeight - r.top + 12)}px`;
  }
  document.body.append(t);
  setTimeout(() => t.remove(), 1800);
}
async function copy(text) {
  // 虎扑版（scripts/build-hupu.js 在 index.html 里放了 GameHupu）：用虎扑原生分享面板，不复制文字
  if (window.GameHupu) { const r = await window.GameHupu.share(text); if (!r.ok) toast(r.msg); return; }
  try { await navigator.clipboard.writeText(text); toast('已复制，去分享给球友吧'); }
  catch { prompt('复制下面这段文字：', text); }
}
// 换页：先收起底部导航（career-ui.js 的 setNav），要导航的页面自己再打开
// 2026-11-27 响应时间修复（虎扑 repair_task_aaab9eb31b69c638e156a5e3457a36d5，响应时间 256ms）：
//   线上最慢的交互都是开局那几下换页点击（安卓 X5 内核，事件处理 1～7.5 秒）——换页要把整页 HTML 塞进去、当场排版
//   （scrollTo 强制布局），低端机上点下去好几秒画面一动不动。
//   用户真实点击触发的换页：这一帧只把当前页压暗、挡住重复点击（马上画出来，就是点击反馈），画出来以后再画新页面；
//   脚本、定时器、动画结束触发的换页照旧同步（测试页直接调 go、用 .click() 也是同步）。连着换页只画最后一次
let goSeq = 0;
const userTap = () => { const ev = window.event; return !!(ev && ev.isTrusted && /^(click|pointerup|pointerdown|touchend|mouseup|keydown|keyup)$/.test(ev.type)); };
// 等当前这一帧画出来再执行 fn（只执行一次）。页面在后台（不出帧）时直接执行；
// 保底 1 秒：个别 WebView 不给 requestAnimationFrame 回调也不会卡住。保底不能太短——低端机上直播页一帧就要 150ms 以上，
// 太短的话保底先到，重活又跑到画面出来之前（2026-11-27 实测「跳过」150ms 保底时就是这样）
const afterPaint = (fn) => {
  let done = false;
  const run = () => { if (!done) { done = true; fn(); } };
  if (document.hidden) { setTimeout(run, 0); return; }
  requestAnimationFrame(() => setTimeout(run, 0));
  setTimeout(run, 1000);
};
const renderPage = (fn, args) => { if (window.setNav) setNav(null); fn(...args); window.scrollTo({ top: 0 }); };
const go = (fn, ...args) => {
  const seq = ++goSeq;
  const root = document.documentElement;
  if (!userTap()) { root.classList.remove('page-busy'); renderPage(fn, args); return; }
  root.classList.add('page-busy');
  afterPaint(() => {
    if (seq !== goSeq) return; // 期间又换了页，以最后一次为准
    root.classList.remove('page-busy');
    renderPage(fn, args);
  });
};

/* ---------- 抽卡动画 ---------- */
const RARITY = [
  { min: 95, cls: 'r-legend', label: '传 奇', level: 4 },
  { min: 90, cls: 'r-gold', label: '金 卡', level: 3 },
  { min: 85, cls: 'r-purple', label: '紫 卡', level: 2 },
  { min: 80, cls: 'r-blue', label: '蓝 卡', level: 1 },
  { min: 70, cls: 'r-silver', label: '银 卡', level: 0 },
  { min: 0, cls: 'r-bronze', label: '铜 卡', level: 0 },
];
const rarityOf = (p) => RARITY.find((r) => p.ovr >= r.min);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

// 粒子爆发
function burst(canvas, x, y, color, count) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== canvas.clientWidth * dpr) {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = 2 + Math.random() * 7;
    return { x: x * dpr, y: y * dpr, vx: Math.cos(a) * v * dpr, vy: Math.sin(a) * v * dpr - 2 * dpr, life: 1, r: (1.5 + Math.random() * 3) * dpr };
  });
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18 * dpr;
      p.vx *= 0.985;
      p.life -= 0.018;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (alive && canvas.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// 抽到 95+ 的出场特效：位置 → 号码 → 球队 → 名字，全程 2 秒，点屏幕直接跳过。几张一起翻开时一张接一张放
const WO_POS = { PG: '控球后卫', SG: '得分后卫', SF: '小前锋', PF: '大前锋', C: '中锋' };
let walkQ = Promise.resolve();
// 球员自己的球队（加入你的球队后 team 会变成你的队，出场特效和挑人时要按他原来的球队显示）：
// realTeam → 选秀球员查新秀球队 → 现役球员查本赛季名单（旧存档里没有 realTeam 的人）
function realTeamOf(p) {
  if (p.realTeam) return p.realTeam;
  if (p.draft && window.DRAFTS) {
    const d = (window.DRAFTS[p.draft.year] || []).find((x) => x.pick === p.draft.pick);
    return d && d.rookieTeam;
  }
  if (p.from && p.from !== '现役') return undefined; // 冠军球员按夺冠赛季的球衣，不用管
  const league = window.LEAGUE && window.LEAGUE.teams;
  const code = league && Object.keys(league).find((c) => league[c].some((x) => x.name === p.name));
  return code || (window.LOOKS_DATA && window.LOOKS_DATA.CURRENT_TEAM[p.name]);
}
// ---------- 羁绊：首发 5 人里同一支球队的人数 3/4/5 → 羁绊里的这几个人能力 +3/+4/+5（替补和别的首发不加），2 人及以下没有 ----------
// 按球员所属的球队算，不分年代：你自己算你所在的球队；现役看本赛季球队；冠军卡看夺冠那支队；选秀看新秀球队。
// 比如你在马刺：你 + 文班亚马（现役马刺）+ 邓肯（马刺冠军）+ 伦纳德（2014 马刺冠军）= 4 人 → 这 4 人各 +4；
// 只有伦纳德、邓肯、文班 3 人 → 各 +3，邓肯 99 显示成 102
let NICK_CODE = null;
function bondTeamOf(p) {
  if (p.isMe) return run.teamCode;
  const real = realTeamOf(p);
  if (real) return real;
  if (p.from && p.from !== '现役' && /^\d{4}/.test(p.from)) {
    if (!NICK_CODE) {
      NICK_CODE = Object.fromEntries(Object.entries(window.Career ? window.Career.TEAM_CN : {}).map(([c, n]) => [n, c]));
    }
    return NICK_CODE[E.nick(p.from.replace(/^\d{4}\s*/, ''))];
  }
  return undefined;
}
function bondOf(team) {
  const starters = team.slice(0, 5);
  const count = {};
  for (const p of starters) { const t = bondTeamOf(p); if (t) count[t] = (count[t] || 0) + 1; }
  const [code, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  const cn = code && window.Career ? window.Career.TEAM_CN[code] || code : '';
  const bonus = E.bondBonus(n);
  return { code, n, bonus, cn, who: starters.filter((p) => code && bondTeamOf(p) === code), text: bonus ? `${cn} ${n} 人同队首发` : '' };
}
// 显示用：羁绊里的人总评直接显示加成后的（邓肯 99 + 3 = 102），bondPlus 记加了多少；存档里的总评不变
function withBond(team) {
  const b = bondOf(team);
  if (!b.bonus) return team;
  const who = new Set(b.who);
  return team.map((p) => (who.has(p) ? { ...p, ovr: p.ovr + b.bonus, baseOvr: p.ovr, bondPlus: b.bonus } : p));
}
// 羁绊给球队实力加了多少（首发占 72%）
const bondPowerOf = (team) => { const b = bondOf(team); return E.bondPower(b.bonus, b.who.length); };
function bondLine(b) {
  return b.bonus
    ? `🔗 羁绊 · ${esc(b.cn)} ${b.n} 人同队首发：${b.who.map((p) => `${p.isMe ? '你' : esc(short(p.name))} ${p.ovr}→${p.ovr + b.bonus}`).join('、')}（各 +${b.bonus}）`
    : `🔗 羁绊：${b.n >= 2 ? `首发里${esc(b.cn)}有 ${b.n} 人，再来 ${3 - b.n} 人就能激活` : '首发 5 人来自不同球队'}。同队首发 3 人各 +3、4 人各 +4、5 人各 +5（只加这几个人）`;
}
function shownAs(p) {
  const team = realTeamOf(p);
  return team && team !== p.team ? { ...p, team } : p;
}
function walkoutLine(p) {
  if (p.draft) return `${p.draft.year} 年选秀 · 第 ${p.draft.pick} 顺位`;
  if (p.legendTeam) return `${p.legendYear ? `${p.legendYear} ` : ''}${p.legendTeam}`;
  if (p.from && p.from !== '现役') return p.from;
  const city = window.Career && window.Career.CITY[realTeamOf(p)];
  return city ? `2026-27 ${city}` : '2026-27 现役';
}
// 出场特效（美职篮全明星 / 2K 味道）：
// ① 球队主色 LED 大屏，巨大球衣号码闪进来 → ② 巨大位置闪进来（JERSEY NUMBER / POSITION）→
// ③ 号码和位置冲向屏幕散开，大屏暗下来，顶部留「号码 | 位置」和球队 → ④ 球员卡亮起，名字、总评。全程 2 秒，点屏幕继续
function walkout(p0) {
  const p = shownAs(p0); // 库里加入活塞后，出场特效仍然是勇士的颜色和 WARRIORS
  walkQ = walkQ.then(() => new Promise((resolve) => {
    const { kit, num } = Avatar.kitOf(p);
    // 实在查不到号码：不显示「—」，号码那块直接不出，只闪位置
    const n = num !== undefined && num !== null && num !== '' ? esc(num) : '';
    const ov = document.createElement('div');
    ov.className = 'walkout wo4';
    ov.style.setProperty('--c1', kit.primary);
    ov.innerHTML = `<div class="w4-led"></div><div class="w4-scan"></div><div class="w4-dark"></div>
      ${n ? `<div class="w4-big w4-num"><small>JERSEY NUMBER</small><b>${n}</b></div>` : ''}
      <div class="w4-big w4-pos"><small>POSITION</small><b>${esc(p.pos || '')}</b></div>
      <div class="w4-top">${n ? `<span>${n}</span><i></i>` : ''}<span>${esc(p.pos || '')}</span></div>
      <div class="w4-team">${esc(walkoutLine(p))}</div>
      <div class="w4-card">${tallCard(p, { badge: '传奇' }).replace('class="tcard', 'class="tcard rank-legend')}</div>
      <div class="w4-info"><b>${esc(p.name)}</b><small>${WO_POS[p.pos] || ''}</small><span>总评 ${esc(p.ovr)}</span></div>
      <small class="w4-tap">点击屏幕继续</small>`;
    document.body.appendChild(ov);
    // 号码、位置闪进来后多停一会儿（约 1 秒）再散开亮球队；球员卡 1.8 秒亮起，
    // 完全亮好（约 2.25 秒）后原地闪亮 0.2 秒，再看一会儿；3.2 秒自动结束，随时可以点屏幕关掉
    const at = reduceMotion ? [0, 0, 0, 0, 0] : [60, 330, 1350, 1800, 2250];
    const step = (k) => ov.classList.add(`s${k}`);
    const timers = at.slice(0, window.__walkStopAt || at.length).map((t, i) => setTimeout(() => step(i + 1), t)); // __walkStopAt：测试截图停在第几步
    let closed = false;
    const close = () => { if (closed) return; closed = true; timers.forEach(clearTimeout); clearTimeout(end); ov.remove(); resolve(); };
    const end = window.__holdWalkout ? 0 : setTimeout(close, reduceMotion ? 800 : 3200); // 3.2 秒自动结束，随时点屏幕关闭；__holdWalkout：测试截图用
    ov.onclick = close;
  }));
  return walkQ;
}

// 依次发牌、蓄力、翻面。全部翻开后点按钮关闭；传 host 就画在页面里（抽取页），不弹全屏
// 抽卡卡面（翻开后的正面）：抽卡、宝箱挑人共用。按球员自己的球队显示（还没加入你的队）
function gcardFront(p0) {
  const p = shownAs(p0);
  const { kit, num } = Avatar.kitOf(p);
  return `<div class="g-team" style="--c1:${kit.primary}"></div>
    <div class="g-ring">${ringSVG(p.ovr)}</div>
    <div class="g-meta">${num !== undefined && num !== null && num !== '' ? `#${esc(num)}<br>` : ''}${E.POS_LABEL[p.pos] || ''}</div>
    <div class="g-fig">${Avatar.avatarSVG(p, { bare: true })}</div>
    <div class="g-name"><div class="rar">${rarityOf(p).label}</div><div class="nm"><span class="nm-l">${esc(p.name)}</span><span class="nm-s">${esc(short(p.name))}</span></div><div class="st">${p.from && p.from !== '现役' ? esc(p.from.replace(/^\d{2}(\d{2}) (.+)$/, (m, y, t) => `'${y} ${E.nick(t)}`)) : '现役'}</div></div>`;
}
function drawCards(players, { title, sub = '', done = '收下', host = null, walk = true }) {
  return new Promise((resolve) => {
    const n = players.length;
    // 10 张：小屏（≤420 宽）一行 5 张太小、名字盖住整张照片 → 一行 4 张
    const wrap = n > 8 && typeof matchMedia === 'function' && matchMedia('(max-width: 420px)').matches;
    const cols = n === 1 ? 1 : n <= 4 ? 2 : n <= 8 || wrap ? 4 : 5;
    const ov = document.createElement('div');
    ov.className = host ? 'gacha inpage' : 'gacha';
    ov.innerHTML = `
      <div><h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div>
      <div class="deck ${n > 4 ? 'many' : ''}${wrap ? ' wrap' : ''}" style="--cols:${cols}">
        ${players.map((p, i) => `<div class="gcard ${rarityOf(p).cls}" data-i="${i}" role="button" aria-label="翻开第 ${i + 1} 张卡">
            <div class="inner">
              <div class="face back"></div>
              <div class="face front">${gcardFront(p)}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="actions"><button class="btn btn-ghost" id="g-all">全部翻开</button></div>
      <canvas></canvas><div class="flash"></div>`;
    (host || document.body).append(ov);
    const cards = [...ov.querySelectorAll('.gcard')];
    const canvas = ov.querySelector('canvas');
    const flash = ov.querySelector('.flash');
    const actions = ov.querySelector('.actions');
    let opened = 0;

    const reveal = async (i, fast = false) => {
      const el = cards[i];
      if (el.dataset.state) return;
      el.dataset.state = 'opening';
      const r = rarityOf(players[i]);
      if (!fast) {
        // 卡越多，普通卡翻得越快；高稀有度蓄力久一点
        const base = n > 4 && r.level < 2 ? 70 : 220;
        el.style.setProperty('--charge', `${(base + r.level * 170) / 1000}s`);
        el.classList.add('charge');
        await wait(base + r.level * 170);
      }
      if (walk && players[i].ovr >= 95) await walkout(players[i]); // 95+ 先放出场特效，再翻牌（宝箱里不放，选中的人再放）
      el.classList.add('flipped');
      if (r.level >= 2) el.classList.add('hi');
      await wait(180);
      const box = el.getBoundingClientRect();
      const cv = canvas.getBoundingClientRect(); // 页面内抽卡时画布不在屏幕左上角，换算成画布坐标
      const color = getComputedStyle(el).getPropertyValue('--rc').trim() || '#fff';
      if (!reduceMotion && r.level >= 1) burst(canvas, box.left - cv.left + box.width / 2, box.top - cv.top + box.height / 2, color, 20 + r.level * 28);
      if (!reduceMotion && r.level >= 3) {
        flash.classList.remove('on');
        void flash.offsetWidth;
        flash.classList.add('on');
        ov.classList.remove('shake');
        void ov.offsetWidth;
        ov.classList.add('shake');
      }
      el.dataset.state = 'open';
      if (++opened === cards.length) finish();
    };
    const finish = () => {
      const top = players.reduce((a, b) => (b.ovr > a.ovr ? b : a));
      actions.innerHTML = `<p class="sub">${n > 1 ? `本次最佳：${esc(top.name)}（${top.ovr}）` : ''}</p><button class="btn btn-primary" id="g-done">${esc(done)}</button>`;
      ov.querySelector('#g-done').onclick = () => {
        ov.remove();
        resolve();
      };
    };

    cards.forEach((el, i) => (el.onclick = () => reveal(i)));
    ov.querySelector('#g-all').onclick = () => cards.forEach((_, i) => reveal(i, true));

    (async () => {
      for (const el of cards) {
        await wait(n > 4 ? 35 : 70);
        el.classList.add('dealt');
      }
      await wait(300);
      for (let i = 0; i < cards.length; i++) {
        if (!ov.isConnected) return;
        await reveal(i);
        await wait(n > 4 ? 50 : 120);
      }
    })();
  });
}

// 选定核心球星后的 1 秒闪光
function starFlash(p) {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'star-flash';
    ov.innerHTML = `
      <div class="rays"></div>
      <div class="star-card">
        <div class="rank">核 心 球 星</div>
        <div class="flash-av">${Avatar.avatarSVG(p)}</div>
        <div class="big num">${p.ovr}</div>
        <div class="nm">${esc(p.name)}</div>
      </div>
      <div class="white"></div>`;
    document.body.append(ov);
    setTimeout(() => {
      ov.remove();
      resolve();
    }, reduceMotion ? 300 : 1000);
  });
}

/* ---------- 首页 ---------- */
function home() {
  app.innerHTML = `
    <section class="hero pop">
      <h1>诸神<span>黄昏</span></h1>
      <p class="subtitle">王朝终结者</p>
      <p class="tag">选一位本赛季顶级球星，连闯 ${TOTAL} 支总冠军球队，五大 Boss「魔神皇佛鲨」坐镇其中。</p>
    </section>
    <section class="card">
      <h3>玩法</h3>
      <ol class="rules">
        <li>从 ${E.STARS.length} 位本赛季顶级球星里选一位核心（评分全部 95+）。</li>
        <li>再抽 4 名首发：1 名 90+、2 名 85+、1 名 80+，正好补齐其余 4 个位置；加 7 名替补，共 12 人。</li>
        <li>球队实力 = 首发均分 × 72% + 替补均分 × 28%；首发 5 个位置每缺一个 -${E.MISSING_POS_PENALTY}。</li>
        <li>${TOTAL} 关全是历届总冠军，不重复，越往后越强。</li>
        <li>每通关一次，获得一次 10 连抽。卡池是 ${TOTAL} 支冠军队夺冠赛季的全部球员：90+ 概率 5%，80+ 概率 30%。</li>
        <li>抽完自动"一键替换"：同位置用高数值替换低数值，再按位置排好首发。剩下的卡也能手动签。</li>
        <li>一共 ${LIVES} 条命，输一场少一条，输光就结束。</li>
      </ol>
    </section>
    <p class="muted small">最佳纪录：${best ? (best >= TOTAL ? '全部通关 🏆' : `打过第 ${best} 关`) : '还没有'}</p>
    ${run ? `<button class="btn btn-primary" id="resume">继续挑战（第 ${run.level + 1} 关）</button>` : ''}
    <button class="btn ${run ? 'btn-ghost' : 'btn-primary'}" id="new">${run ? '放弃并重新开始' : '开始挑战'}</button>
    <p class="note">现役球员：本赛季数据取自 2026-27 赛季 11 月上旬公开统计（样本小），往季为 2024-25 赛季场均近似值；核心球星评分保底 95。冠军球员：夺冠赛季场均近似值，总评参考 2K 风格并整体 +${E.CHAMP_BOOST}。均为游戏数值。</p>`;
  if (run) document.getElementById('resume').onclick = () => { finishSigning(); go(hub); }; // 老存档里没签完的那一抽：直接签完
  document.getElementById('new').onclick = () => {
    run = null;
    store.del('nba-run');
    go(pickStar);
  };
}

/* ---------- 选核心球星 ---------- */
function pickStar(selected = null) {
  app.innerHTML = `
    <div class="spread"><h2>选择你的核心球星</h2><button class="muted small" id="back">返回</button></div>
    <p class="muted small">${E.STARS.length} 位本赛季顶级球星，评分全部 95+。</p>
    ${selected ? detailPanel(E.STARS.find((s) => s.name === selected), '核心候选') : ''}
    <div class="tgrid">${E.STARS.map((p) => tallCard(p, { button: true, sel: selected === p.name, attrs: `data-name="${esc(p.name)}"` })).join('')}</div>
    <button class="btn btn-primary sticky-cta" id="ok" ${selected ? '' : 'disabled'}>${selected ? `就选 ${esc(short(selected))}` : '先选一名球星'}</button>`;
  document.getElementById('back').onclick = () => go(home);
  app.querySelectorAll('.tcard[data-name]').forEach((el) => (el.onclick = () => pickStar(el.dataset.name)));
  document.getElementById('ok').onclick = async () => {
    const star = { ...E.STARS.find((s) => s.name === selected) };
    run = { v: SAVE_VERSION, star: star.name, team: [star], level: 0, wins: 0, lives: LIVES, rerolls: 2, draws: 0, signing: null };
    await starFlash(star);
    await drawSupport();
    go(lineup);
  };
}

/* ---------- 抽取队友（4 首发 + 7 替补） ---------- */
async function drawSupport(again = false) {
  const core = run.team.find((p) => p.name === run.star) || run.team[0];
  const { starters, bench } = E.randomSupport(core);
  run.team = E.arrange([core, ...starters, ...bench], run.star);
  swapPick = null;
  save();
  await drawCards(starters, { title: again ? '重 抽 首 发' : '抽 取 首 发', sub: '1 名 90+、2 名 85+、1 名 80+，补齐其余 4 个位置（1/2）', done: '继续抽替补' });
  await drawCards(bench, { title: '抽 取 替 补', sub: '7 名替补（2/2）', done: '看看阵容' });
}

function lineup() {
  app.innerHTML = `
    <h2>你的 12 人阵容</h2>
    <p class="muted small">核心球星固定，其余 11 人随机。不满意可以整队重抽（剩 ${run.rerolls} 次）。</p>
    ${rosterHtml(run.team, { editable: true })}
    <div class="card"><div class="spread"><span class="muted">球队实力（首发 72% + 替补 28%）</span><b class="num" style="font-size:22px">${fmt1(teamAvg(run.team))}</b></div></div>
    <div class="row">
      <button class="btn btn-ghost" id="reroll" ${run.rerolls ? '' : 'disabled'}>整队重抽</button>
      <button class="btn btn-primary" id="go">挑战下一关</button>
    </div>`;
  bindSwap(lineup);
  bindArrange(lineup);
  document.getElementById('reroll').onclick = async () => {
    run.rerolls--;
    await drawSupport(true);
    lineup();
  };
  document.getElementById('go').onclick = () => {
    swapPick = null;
    go(hub);
  };
}

/* ---------- 关卡大厅 ---------- */
function hub() {
  const L = E.LEVELS[run.level];
  const mine = myPower();
  const p = winChance(mine - L.power);
  const total = mine + L.power;
  app.innerHTML = `
    ${statusBar()}
    <div class="ladder" aria-label="关卡进度">
      ${E.LEVELS.map((l, i) => `<div class="node ${i < run.level ? 'done' : i === run.level ? 'cur' : ''} ${i === TOTAL - 1 ? 'boss' : ''}" title="${l.year} ${esc(l.team)}">${i < run.level ? '✓' : i + 1}</div>`).join('')}
    </div>
    ${run.draws ? `<button class="btn btn-gold" id="draw">10 连抽（剩 ${run.draws} 次）</button>` : ''}
    <section class="card pop">
      <div class="opp-head" style="--team:${L.color}">
        <span class="muted small">第 ${run.level + 1} 关 · ${L.year} 总冠军</span>
        <h2>${L.year} ${esc(L.team)}</h2>
        <span class="small" style="color:var(--gold)">${esc(L.tag)}</span>
      </div>
      <div class="trow">${L.roster.slice(0, 5).map((x) => (L.bond ? tallCard({ ...x, ovr: x.ovr + L.bond, bondPlus: L.bond }) : tallCard(x))).join('')}</div>
      <details><summary class="muted small" style="cursor:pointer">替补 7 人（均分 ${fmt1(benchAvg(L.roster))}）</summary>
        <div class="trow bench" style="margin-top:8px">${L.roster.slice(5).map((x) => tallCard(x)).join('')}</div>
      </details>
      <div class="stat-grid${L.bond ? ' has-bond' : ''}">
        <div><b>${fmt1(L.raw)}</b><span>对手阵容</span></div>
        <div><b>${L.boost >= 0 ? '+' : ''}${fmt1(L.boost)}</b><span>${run.level === TOTAL - 1 ? '72 胜光环' : L.boost < 0 ? '赛季初状态' : '状态加成'}</span></div>
        ${L.bond ? `<div class="bond-stat"><b>+${fmt1(L.bondPower)}</b><span>🔗 羁绊</span></div>` : ''}
        <div><b>${fmt1(L.power)}</b><span>对手实力</span></div>
      </div>
      ${L.bond ? `<p class="small bond-opp">🔗 Boss 羁绊：${esc(short(L.team))}首发 5 人同队，首发 5 人能力各 +${L.bond}（${L.roster.slice(0, 5).map((x) => `${esc(short(x.name))} ${x.ovr + L.bond}`).join('、')}）</p>` : ''}
    </section>
    ${missingNote(run.team)}
    <section class="card">
      <div class="spread"><span>你的实力 <b class="num">${fmt1(mine)}</b></span><span class="muted small">阵容 ${fmt1(teamAvg(run.team))} + 默契 ${fmt1(E.chemistry(run.wins))}${bondOf(run.team).bonus ? ` + 羁绊 ${fmt1(bondPowerOf(run.team))}` : ''}</span></div>
      <p class="small bond-line ${bondOf(run.team).bonus ? 'on' : ''}">${bondLine(bondOf(run.team))}</p>
      <div class="meter">
        <div class="bar"><div class="me" style="width:${(mine / total) * 100}%"></div><div class="them" style="width:${(L.power / total) * 100}%"></div></div>
        <div class="spread small"><span style="color:var(--accent)">你</span><span>预计胜率 <b class="num">${Math.round(p * 100)}%</b></span><span class="muted">${esc(short(L.team))}</span></div>
      </div>
    </section>
    <button class="btn btn-primary" id="play">开始比赛</button>
    <button class="btn btn-ghost" id="team">查看 / 调整阵容</button>
    <button class="muted small" id="home" style="justify-self:center">回到首页（进度会保存）</button>`;
  if (run.draws) document.getElementById('draw').onclick = tenDraw;
  document.getElementById('play').onclick = () => go(match);
  document.getElementById('team').onclick = () => go(myTeam);
  document.getElementById('home').onclick = () => go(home);
}

function myTeam() {
  app.innerHTML = `
    ${statusBar()}
    <h2>我的阵容</h2>
    ${rosterHtml(run.team, { editable: true })}
    <div class="card"><div class="spread"><span class="muted">阵容 ${fmt1(teamAvg(run.team))} + 默契 ${fmt1(E.chemistry(run.wins))}${bondOf(run.team).bonus ? ` + 羁绊 ${fmt1(bondPowerOf(run.team))}` : ''}</span><b class="num" style="font-size:22px">${fmt1(myPower())}</b></div>
      <p class="small bond-line ${bondOf(run.team).bonus ? 'on' : ''}">${bondLine(bondOf(run.team))}</p></div>
    <button class="btn btn-ghost" id="back">返回</button>`;
  bindSwap(myTeam);
  bindArrange(myTeam);
  document.getElementById('back').onclick = () => {
    swapPick = null;
    go(hub);
  };
}

/* ---------- 10 连抽 ---------- */
async function tenDraw() {
  if (!run.draws) return;
  run.draws--;
  const cards = E.gacha(10);
  run.signing = { cards, signed: [], pick: null, swaps: [] };
  save();
  await drawCards(cards, { title: '十 连 抽', sub: '冠军球队夺冠赛季球员 · 90+ 5% · 80+ 30%', done: '一键替换并签约' });
  finishSigning();
  go(run.career && window.drawCenter && (run.draws || run.passivePending || chestReady()) ? window.drawCenter : hub);
}

// 一键替换：比替补里最弱的人强就换（不看位置，E.autoReplace），然后自动排首发
function oneClickReplace() {
  const s = run.signing;
  const rest = s.cards.map((c, i) => ({ c, i })).filter(({ i }) => !s.signed.includes(i));
  const before = teamAvg(run.team);
  const res = E.autoReplace(run.team, rest.map((x) => x.c), coreNames());
  run.team = res.team;
  let pts = 0;
  for (const sw of res.swaps) {
    const idx = rest[sw.index].i;
    s.signed.push(idx);
    s.swaps.push({ in: sw.in, out: sw.out, up: sw.upgrade });
    pts += luckFor(sw.out); // 被换下的人 → 幸运值
  }
  pts += sweepDupes(s);
  s.pick = null;
  const lk = luckText(addLuck(pts));
  save();
  return { before, after: teamAvg(run.team), lk };
}

// 签约一步完成（2026-11-27 用户：「签约完成这步有点繁琐，可以把这个字段删除吗」）：
//   以前抽完要进「签约球员」页、再点「签约完成」；现在「一键替换并签约」就直接签完，
//   替换结果记在 lastSign，抽卡页顶部显示一次（career-ui.js 的 signResult）。没签的卡照旧：重复的转幸运值，其他作废
let lastSign = null;
function finishSigning(quiet = false) {
  if (!run || !run.signing) return null;
  const r = oneClickReplace();
  lastSign = { swaps: run.signing.swaps.slice(), before: r.before, after: r.after, lk: r.lk, cards: run.signing.cards.length };
  run.signing = null;
  save();
  if (quiet) return lastSign; // 抽卡页会显示结果卡片，不再弹提示
  if (lastSign.swaps.length) toast(`签下 ${lastSign.swaps.length} 人，实力 ${fmt1(lastSign.before)} → ${fmt1(lastSign.after)}${lastSign.lk ? `；${lastSign.lk}` : ''}`);
  else toast(`没有比替补更强的卡${lastSign.lk ? `；${lastSign.lk}` : ''}`);
  return lastSign;
}
// 签约结果（只显示一次）：换上谁、换下谁、实力变化
function takeSignResult() {
  const r = lastSign;
  lastSign = null;
  if (!r) return '';
  return `<section class="card sign-result"><h3>✍️ 签约完成</h3>
    ${r.swaps.length ? r.swaps.map((x) => `<div class="swap-row">${posTag(x.in)}<b>${esc(short(x.in.name))} ${x.in.ovr}</b><span class="muted">${x.up ? '升级旧版' : '换下'}</span><span>${esc(short(x.out.name))} ${x.out.ovr}</span><span class="diff-up">+${x.in.ovr - x.out.ovr}</span></div>`).join('')
      : '<p class="muted small">这次没有比队里替补更强的卡</p>'}
    <div class="spread small"><span class="muted">球队实力</span><b class="num">${fmt1(r.before)} → ${fmt1(r.after)}</b></div>
    ${r.lk ? `<p class="small" style="color:var(--gold)">${esc(r.lk)}</p>` : ''}</section>`;
}

/* ---------- 幸运值：每赢一场、被换下的球员、重复抽到的球星都加幸运值 ----------
   满 50 给 1 个宝箱（10 名 85-95 球员自选 1 名），满 100 再给 1 个超级明星宝箱（10 名 95+ 自选 1 名），然后从头累计。
   按模拟，平均每 10 关开 2.6 次箱（98% 在 2~4 次） */
const LUCK_WIN = 7;
const LUCK_STEP = 50, LUCK_MAX = 100;
const luckOf = (ovr) => (ovr >= 95 ? 15 : ovr >= 90 ? 10 : ovr >= 85 ? 8 : ovr >= 80 ? 6 : ovr >= 70 ? 5 : 4);
const luckFor = (p) => (!p || p.isMe || isCore(p) ? 0 : luckOf(p.ovr));
// 加幸运值：跨过 50 给宝箱，跨过 100 给超级明星宝箱、从头累计（多出来的带到下一轮）
function addLuck(n) {
  if (!run || !run.career || !n) return null;
  run.chests = run.chests || { normal: 0, super: 0 };
  let luck = (run.luck || 0) + n, mark = run.luck >= LUCK_STEP ? LUCK_MAX : LUCK_STEP, normal = 0, sup = 0;
  while (luck >= mark) {
    if (mark === LUCK_STEP) { normal++; mark = LUCK_MAX; }
    else { sup++; luck -= LUCK_MAX; mark = LUCK_STEP; }
  }
  run.luck = luck;
  run.chests.normal += normal;
  run.chests.super += sup;
  return { n, normal, super: sup };
}
const luckText = (g) => (!g ? '' : `🍀 幸运值 +${g.n}${g.normal ? '，🎁 获得宝箱' : ''}${g.super ? '，👑 获得超级明星宝箱' : ''}`);
const chestReady = () => (run && run.chests ? (run.chests.normal || 0) + (run.chests.super || 0) : 0);
// 10 连抽里没签、但人已经在阵中、又不比队里那张强（重复抽到）的卡 → 幸运值；更强的版本留着可以升级
function sweepDupes(s) {
  s.fragged = s.fragged || [];
  let pts = 0;
  s.cards.forEach((c, i) => {
    if (s.signed.includes(i) || s.fragged.includes(i) || !dupBlocked(c)) return;
    s.fragged.push(i);
    pts += luckOf(c.ovr);
  });
  return pts;
}

/* ---------- 比赛 ---------- */
let timer = null;
function match() {
  const L = E.LEVELS[run.level];
  const bd = bondOf(run.team);
  const r = E.simulate(run.team, run.level, { myBonus: E.chemistry(run.wins), myBond: bd.bonus, bondWho: bd.who.map((p) => p.name), bondText: bd.text, myLabel: run.teamLabel, passives: run.passives || [] });
  app.innerHTML = `
    ${statusBar()}
    <section class="card">
      <div class="board">
        <div><div class="team">${esc(run.teamLabel || '我的球队')}</div></div>
        <div class="vs">第 ${run.level + 1} 关</div>
        <div><div class="team">${L.year} ${esc(short(L.team))}</div></div>
        <div class="score num" id="s0">0</div>
        <div class="vs" id="qlabel">第 1 节</div>
        <div class="score num" id="s1">0</div>
      </div>
      <table class="qtable"><thead><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>总分</th></tr></thead>
        <tbody><tr><td>${esc(r.labels[0])}</td>${[0, 1, 2, 3].map((i) => `<td id="q0${i}">-</td>`).join('')}<td id="t0">-</td></tr>
        <tr><td>${esc(short(L.team))}</td>${[0, 1, 2, 3].map((i) => `<td id="q1${i}">-</td>`).join('')}<td id="t1">-</td></tr></tbody></table>
    </section>
    <section class="card live">
      <div class="spread"><b class="small">文字直播</b><span><button class="chip" id="speed">速度 ×3</button></span></div>
      <div class="live-head"><span>时间</span><span>球队</span><span>事件</span><span>比分</span></div>
      <div class="feed" id="feed" aria-live="polite"></div>
    </section>
    <div id="after"></div>
    <button class="btn btn-ghost" id="skip">跳过，直接看结果</button>`;

  // 虎扑文字直播：最新的在最上面；进球加粗，你自己的球员高亮
  const feed = document.getElementById('feed');
  const addEv = (ev) => {
    const d = document.createElement('div');
    if (ev.end) {
      d.className = 'ev end pop';
      d.textContent = `${ev.text}　${ev.score[0]} : ${ev.score[1]}`;
    } else {
      d.className = `ev ${ev.side === 0 ? 'me' : 'them'}${ev.bold ? ' b' : ''}${ev.me ? ' mine' : ''}${ev.pause ? ' pause' : ''}${ev.skill ? ' skillhit pop' : ''}`;
      d.innerHTML = `<span class="t">${esc(ev.clock)}</span><span class="tm">${esc(r.labels[ev.side])}</span><span class="tx">${esc(ev.text)}</span><span class="sc num">${ev.score[0]}-${ev.score[1]}</span>`;
    }
    feed.prepend(d);
    while (feed.children.length > 80) feed.lastChild.remove();
  };
  let i = 0;
  const showQuarter = (qi, score) => {
    document.getElementById(`q0${qi}`).textContent = r.quarters[qi][0];
    document.getElementById(`q1${qi}`).textContent = r.quarters[qi][1];
    document.getElementById('s0').textContent = score[0];
    document.getElementById('s1').textContent = score[1];
    document.getElementById('qlabel').textContent = qi < 3 ? `第 ${qi + 2} 节` : '终场';
  };
  // 速度：默认 ×3（一场约 30 秒），点一下 ×10，再点 ×1（每条约 0.2 秒，一场约 1.5 分钟）
  const SPEEDS = [3, 10, 1];
  let sp = 0;
  document.getElementById('speed').onclick = (e) => { sp = (sp + 1) % SPEEDS.length; e.target.textContent = `速度 ×${SPEEDS[sp]}`; };
  let over = false; // 比赛结束（或点了跳过）：Boss 登场特效结束后也不再开始直播
  const step = () => {
    if (over) return;
    if (i >= r.events.length) return finish();
    const ev = r.events[i++];
    addEv(ev);
    if (ev.bossSkill && window.bossSkillFx) bossSkillFx(L); // Boss 技能发动特效（跳过时不放）
    if (ev.end) showQuarter(ev.q - 1, ev.score);
    else {
      document.getElementById('s0').textContent = ev.score[0];
      document.getElementById('s1').textContent = ev.score[1];
      document.getElementById('qlabel').textContent = `第 ${ev.q} 节 ${ev.clock}`;
    }
    const base = ev.end ? 900 : ev.pause ? 700 : ev.bold ? 260 : 180;
    timer = setTimeout(step, base / SPEEDS[sp]);
  };
  const finish = () => {
    if (over) return;
    over = true;
    clearTimeout(timer);
    document.querySelectorAll('.boss-intro, .skill-fx').forEach((x) => x.remove());
    // 跳过时把剩下的直播一次补完（只留最近 80 条）：更早的补进去也会马上被挤掉，直接从最后 80 条开始补，结果一样
    i = Math.max(i, r.events.length - 80);
    while (i < r.events.length) addEv(r.events[i++]);
    for (let q = 0; q < 4; q++) showQuarter(q, r.final);
    document.getElementById('t0').textContent = r.final[0];
    document.getElementById('t1').textContent = r.final[1];
    document.getElementById('skip').remove();
    showResult(r);
  };
  // 点「跳过」：按钮马上变成「正在出结果」（这一帧先画出来），再补完直播、画结算（同一个 go 的道理，见上面 afterPaint）
  document.getElementById('skip').onclick = (e) => {
    if (over || !userTap()) { finish(); return; }
    const b = e.currentTarget;
    b.disabled = true;
    b.textContent = '正在出结果……';
    afterPaint(finish);
  };
  // Boss 关：先放 Boss 登场特效（点屏幕跳过），再开始直播
  const startLive = () => { if (!over) timer = setTimeout(step, 300); };
  if (L.boss && window.bossIntroFx) bossIntroFx(L).then(startLive);
  else startLive();
}

// 数据表：时间、得分，2分 / 3分 / 罚球（命中-出手，按每个人自己的虎扑命中率模拟），篮板、助攻、抢断、盖帽、失误；最下面合计和命中率
function boxTable(rows) {
  const mvp = rows.reduce((b, x) => (x.pts + x.reb + x.ast > b.pts + b.reb + b.ast ? x : b));
  // 同队两个人简称一样（两个约翰逊）：带上名字的第一个字，「凯·约翰逊」「杰·约翰逊」
  const shortOf = (x) => short(x.name);
  const dup = new Set(rows.map(shortOf).filter((s, i, a) => a.indexOf(s) !== i));
  const nameOf = (x) => (dup.has(shortOf(x)) && x.name.includes('·') ? `${x.name[0]}·${shortOf(x)}` : shortOf(x));
  const has = rows.some((x) => x.fg2a != null);
  // 不用空值合并、可选链这类新语法：老手机（安卓内核 80 以前、iOS 13.4 以前）认不出，整个脚本会白屏
  const n0 = (v) => (v != null ? v : 0);
  const shoot = (x) => (has ? `<td class="sh">${n0(x.fg2m)}-${n0(x.fg2a)}</td><td class="sh">${n0(x.fg3m)}-${n0(x.fg3a)}</td><td class="sh">${n0(x.ftm)}-${n0(x.fta)}</td>` : '');
  const cols = has ? 11 : 8;
  // 列的顺序：分 板 助 2分 3分 罚球 断 帽 失误 时间（手机上不用滑就能看到前面 6 列）
  const line = (x) => x.min
    ? `<tr class="${x === mvp ? 'mvp' : ''} ${x.me ? 'me' : ''}"><td>${x.me ? '⭐' : ''}${esc(nameOf(x))}</td><td>${x.pts}</td><td>${x.reb}</td><td>${x.ast}</td>${shoot(x)}<td>${x.stl}</td><td>${x.blk}</td><td>${x.tov != null ? x.tov : '-'}</td><td>${x.min}</td></tr>`
    : `<tr class="muted"><td>${esc(nameOf(x))}</td><td colspan="${cols - 1}" style="text-align:center">未上场</td></tr>`;
  const sep = (t) => `<tr><td colspan="${cols}" class="muted small" style="padding-top:8px">${t}</td></tr>`;
  const sum = (k) => rows.reduce((s, x) => s + (x.min ? x[k] || 0 : 0), 0);
  const pct = (m, a) => (a ? `${Math.round((100 * m) / a)}%` : '-');
  const foot = has ? `<tr class="tot"><td>合计</td><td>${sum('pts')}</td><td>${sum('reb')}</td><td>${sum('ast')}</td>${shoot({ fg2m: sum('fg2m'), fg2a: sum('fg2a'), fg3m: sum('fg3m'), fg3a: sum('fg3a'), ftm: sum('ftm'), fta: sum('fta') })}<td>${sum('stl')}</td><td>${sum('blk')}</td><td>${sum('tov')}</td><td></td></tr>
    <tr class="pct"><td>命中率</td><td colspan="3" style="text-align:center">投篮 ${pct(sum('fg2m') + sum('fg3m'), sum('fg2a') + sum('fg3a'))}</td><td>${pct(sum('fg2m'), sum('fg2a'))}</td><td>${pct(sum('fg3m'), sum('fg3a'))}</td><td>${pct(sum('ftm'), sum('fta'))}</td><td colspan="4"></td></tr>` : '';
  return `<div class="box-wrap"><table class="box${has ? ' wide' : ''}"><thead><tr><th>球员</th><th>分</th><th>板</th><th>助</th>${has ? '<th class="sh">2分</th><th class="sh">3分</th><th class="sh">罚球</th>' : ''}<th>断</th><th>帽</th><th>失误</th><th>时间</th></tr></thead><tbody>
    ${sep('首发')}${rows.filter((x) => x.starter).map(line).join('')}
    ${sep('替补')}${rows.filter((x) => !x.starter).map(line).join('')}
    ${foot}
  </tbody></table></div>${has ? '<p class="box-hint">2分 / 3分 / 罚球 = 命中-出手 · 表格可左右滑动</p>' : ''}`;
}

function showResult(r) {
  const L = E.LEVELS[run.level];
  const after = document.getElementById('after');
  let actions = '';
  if (r.win) {
    run.wins++;
    run.level++;
    run.draws++;
    best = Math.max(best, run.level);
    store.set('nba-best-v3', best);
    save();
    actions = run.level >= TOTAL
      ? `<button class="btn btn-primary" id="champ">登顶！查看战绩</button>`
      : `<button class="btn btn-gold" id="draw">获得 10 连抽，现在就抽！</button><button class="btn btn-ghost" id="hub">稍后再抽，回到关卡</button>`;
  } else {
    run.lives--;
    save();
    actions = run.lives > 0
      ? `<button class="btn btn-primary" id="retry">再战一次（剩 ${run.lives} 条命）</button><button class="btn btn-ghost" id="hub">回到关卡</button>`
      : `<button class="btn btn-primary" id="over">查看战绩</button>`;
  }
  after.innerHTML = `
    <section class="result-banner ${r.win ? 'win' : 'lose'} pop">
      <h2>${r.win ? '胜 利' : '惜 败'}</h2>
      <p class="muted">${r.final[0]} : ${r.final[1]}${r.win ? ` · 击败 ${L.year} ${esc(L.team)}` : ''}</p>
    </section>
    <section class="card">
      <div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-t="0">我的球队</button><button role="tab" aria-selected="false" data-t="1">${L.year} ${esc(short(L.team))}</button></div>
      <div id="boxwrap"><div data-box="0">${boxTable(r.box[0])}</div><div data-box="1" hidden>${boxTable(r.box[1])}</div></div>
    </section>
    ${actions}`;
  // 两队数据表一开始都画好，标签只切换显示（不在点击时往页面写 HTML——虎扑安全检测把点击时重写数据表
  //   列为需人工复核，2026-11-26 改）
  after.querySelectorAll('[role=tab]').forEach((b) => (b.onclick = () => {
    after.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    after.querySelectorAll('#boxwrap [data-box]').forEach((x) => (x.hidden = x.dataset.box !== b.dataset.t));
  }));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on('draw', tenDraw);
  on('hub', () => go(hub));
  on('retry', () => go(match));
  on('over', () => go(gameOver));
  on('champ', () => go(champion));
  after.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- 结束 ---------- */
function shareText(won) {
  const core = short(run.star);
  const five = run.team.slice(0, 5).map((p) => short(p.name)).join('、');
  // 生涯模式：你和开局选的现役球星搭档（和首页「搭档一名现役球星，看看你能闯几关」一个意思）
  if (run.career) {
    const L = E.LEVELS[Math.min(run.level, TOTAL - 1)];
    // 倒在 Boss 关就点名是哪位 Boss
    const foe = `${L.boss ? `五大 Boss 之「${L.boss.glyph}」${E.bossName(L.boss)}的 ` : ''}${L.year} ${L.team}`;
    return won
      ? `我在《诸神黄昏：王朝终结者》和${core}搭档，${TOTAL} 关冠军球队全部打穿，五大 Boss「魔神皇佛鲨」全部终结！首发：${five}`
      : `我在《诸神黄昏：王朝终结者》和${core}搭档，闯到第 ${run.level + 1} 关，倒在了${foe}面前。首发：${five}。你能闯几关？`;
  }
  return won
    ? `我在《诸神黄昏：王朝终结者》用 ${core} 连胜 ${TOTAL} 支总冠军球队，五大 Boss「魔神皇佛鲨」全部终结！首发：${five}`
    : `我在《诸神黄昏：王朝终结者》用 ${core} 打到了第 ${run.level + 1} 关，止步 ${E.LEVELS[run.level].year} ${E.LEVELS[run.level].team}。首发：${five}。你能打多远？`;
}
function endScreen(won) {
  const text = shareText(won);
  const L = E.LEVELS[Math.min(run.level, TOTAL - 1)];
  app.innerHTML = `
    <section class="hero pop" style="text-align:center">
      <h1 style="font-size:32px">${won ? `🏆 ${TOTAL} 关全通，王朝终结者！` : `止步第 ${run.level + 1} 关`}</h1>
      <p class="tag">${won ? '你击败了历史上所有这些冠军。' : `倒在了 ${L.year} ${esc(L.team)} 面前。`}最佳纪录：${best >= TOTAL ? '全部通关' : `闯到第 ${best} 关`}</p>
    </section>
    <h3>最终阵容</h3>
    ${run.career ? lineupGrids(run.team) : rosterHtml(run.team)}
    <section class="card"><p class="small">${esc(text)}</p><button class="btn btn-ghost" id="share">${window.GameHupu ? '分享战绩' : '复制战绩'}</button></section>
    <button class="btn btn-primary" id="again">再来一局</button>`;
  document.getElementById('share').onclick = () => copy(text);
  document.getElementById('again').onclick = () => {
    run = null;
    store.del('nba-run');
    go(home);
  };
}
const gameOver = () => endScreen(false);
const champion = () => endScreen(true);

home();
