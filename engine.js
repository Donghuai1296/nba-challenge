// 挑战王朝：现役球员、30 个冠军关卡、10 连抽、比赛模拟。浏览器和 Node 都能用。
// 每支球队 12 人：前 5 人是首发，后 7 人是替补。
(function (root) {
  const IS_NODE = typeof module === 'object' && module.exports;
  const RAW_CHAMPIONS = IS_NODE ? require('./champions.js') : root.CHAMPIONS;
  const POSITIONS = IS_NODE ? require('./positions.js') : root.POSITIONS;

  // ---------- 位置 ----------
  const POS = ['PG', 'SG', 'SF', 'PF', 'C'];
  const POS_LABEL = { PG: '控卫', SG: '分卫', SF: '小前', PF: '大前', C: '中锋' };
  const posOf = (name, fallback = 'SF') => POSITIONS[name] || fallback;

  // 冠军球员总评整体 +4（上限 99），冠军队首发位置取自 PG/SG/SF/PF/C 的排列顺序
  const CHAMP_BOOST = 4;
  // 生涯固定总评：同一名球员不管哪个赛季夺冠都是同一个数，按统治力和生涯地位定（2003、2007、2014 邓肯都是 99）
  const LEGACY = {
    // 99：历史级统治力
    '迈克尔·乔丹': 99, '科比·布莱恩特': 99, '勒布朗·詹姆斯': 99, '魔术师约翰逊': 99, '拉里·伯德': 99, '蒂姆·邓肯': 99,
    '沙奎尔·奥尼尔': 99, '哈基姆·奥拉朱旺': 99, '卡里姆·阿卜杜尔-贾巴尔': 99, '斯蒂芬·库里': 99, '尼古拉·约基奇': 99,
    // 98：MVP / FMVP 级巨星
    '凯文·杜兰特': 98, '德维恩·韦德': 98, '德克·诺维茨基': 98, '凯文·加内特': 98, '扬尼斯·阿德托昆博': 98, '谢伊·吉尔杰斯-亚历山大': 98,
    // 97~96：名人堂核心
    '科怀·伦纳德': 97, '斯科蒂·皮蓬': 97, '大卫·罗宾逊': 97, '克莱德·德雷克斯勒': 97,
    '伊塞亚·托马斯': 96, '凯文·麦克海尔': 96, '安东尼·戴维斯': 96, '杰森·塔图姆': 96, '保罗·皮尔斯': 96,
    // 95：名人堂 / 冠军基石
    '雷·阿伦': 95, '马努·吉诺比利': 95, '克莱·汤普森': 95, '詹姆斯·沃西': 95, '托尼·帕克': 95, '凯里·欧文': 95, '保罗·加索尔': 95, '罗伯特·帕里什': 95,
    // 94~92
    '乔·杜马斯': 94, '丹尼斯·罗德曼': 94, '杰森·基德': 94, '昌西·比卢普斯': 94, '克里斯·波什': 94, '本·华莱士': 94, '丹尼斯·约翰逊': 94,
    '德雷蒙德·格林': 93, '杰伦·布朗': 93, '比尔·沃顿': 93,
    '理查德·汉密尔顿': 92, '凯尔·洛瑞': 92, '朱·霍勒迪': 92, '贾马尔·穆雷': 92, '杰伦·威廉姆斯': 92,
    // 91~87：冠军拼图
    '拜伦·斯科特': 91, '拉希德·华莱士': 91, '托尼·库科奇': 91, '克里斯·米德尔顿': 91, '凯文·乐福': 91, '马克·加索尔': 91,
    '拉简·隆多': 90, '帕斯卡尔·西亚卡姆': 90, '迈克尔·库珀': 89, '霍雷斯·格兰特': 89, '安德烈·伊戈达拉': 89, '德里克·怀特': 89,
    '杰森·特里': 88, '文尼·约翰逊': 88, '罗伯特·霍里': 87, '罗恩·哈珀': 87, '凯文·威利斯': 82, '大卫·韦斯特': 88, '安托万·沃克': 87,
  };
  // ---------- 同一名球员的不同译名 ----------
  // 用户规则：去掉分隔符后至少 4 个字一样（按顺序对上）就当同一人，比如「OG·阿努诺比 / OG·阿奴诺比」「卢冈茨 / 吕冈茨·多尔特」。
  // 再加两道保险：① 两个名字最多只差一两个字（否则「罗伯特·威廉姆斯 / 帕特里克·威廉姆斯」也会被当成一个人）；
  // ② 同一份名单里本来就同时存在的两个人不算（雷霆的杰伦·威廉姆斯和杰林·威廉姆斯、现役的勒布朗和布朗尼）
  const normName = (s) => String(s || '').replace(/[-·・\s.]/g, '');
  function lcsLen(a, b) {
    const dp = Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) { let prev = 0; for (let j = 1; j <= b.length; j++) { const t = dp[j]; dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]); prev = t; } }
    return dp[b.length];
  }
  function editDist(a, b) {
    const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) { let prev = dp[0]; dp[0] = i; for (let j = 1; j <= b.length; j++) { const t = dp[j]; dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
    return dp[b.length];
  }
  const looksSame = (x, y) => lcsLen(x, y) >= 4 && editDist(x, y) <= Math.max(2, Math.round(Math.min(x.length, y.length) * 0.3));
  let coexist = null; // 同一份名单里同时存在、长得像但其实是两个人的名字对
  function buildCoexist() {
    coexist = new Set();
    const load = (g, file) => { if (root[g]) return root[g]; if (!IS_NODE) return null; try { return require(file); } catch (e) { return null; } };
    const LG = load('LEAGUE', './league.js'); // 选秀名单（drafts.js）2026-11-26 起不再进游戏，不用算
    const lists = [CHAMPIONS_LIST().map((p) => p.name)];
    if (LG) lists.push(Object.values(LG.teams).flat().map((p) => p.name));
    for (const list of lists) {
      const ns = [...new Set(list.map(normName))];
      for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) if (looksSame(ns[i], ns[j])) { coexist.add(ns[i] + '|' + ns[j]); coexist.add(ns[j] + '|' + ns[i]); }
    }
  }
  function samePlayer(a, b) {
    const x = normName(a), y = normName(b);
    if (!x || !y) return false;
    if (x === y) return true;
    if (!coexist) buildCoexist();
    return !coexist.has(x + '|' + y) && looksSame(x, y);
  }
  const CHAMPIONS_LIST = () => RAW_CHAMPIONS.flatMap((c) => c.roster);

  // 不在表里的多冠球员：统一取他各个夺冠赛季里最高的那个
  const bestSeason = {};
  for (const c of RAW_CHAMPIONS) for (const p of c.roster) bestSeason[p.name] = Math.max(bestSeason[p.name] || 0, Math.min(99, p.ovr + CHAMP_BOOST));
  const champOvr = (name) => (LEGACY[name] != null ? LEGACY[name] : bestSeason[name]);
  const CHAMPIONS = RAW_CHAMPIONS.map((c) => ({
    ...c,
    roster: c.roster.map((p, i) => ({ ...p, ovr: champOvr(p.name), pos: i < 5 ? POS[i] : posOf(p.name) })),
  }));

  // ---------- 现役球员评分 ----------
  // 单赛季分 = 55 + 0.85 ×（场均 得分+篮板+助攻+抢断+盖帽），最高 99
  // 有本赛季数据：总评 = 本赛季 70% + 往季 30%；没有则用往季
  const statSum = (s) => s.pts + s.reb + s.ast + s.stl + s.blk;
  const seasonOvr = (s) => Math.min(99, 55 + 0.85 * statSum(s));
  const S = (pts, reb, ast, stl, blk) => ({ pts, reb, ast, stl, blk });
  // P(名字, 往季五项…, 本赛季五项?, 保底评分?)
  function P(name, pts, reb, ast, stl, blk, cur, floor) {
    const last = S(pts, reb, ast, stl, blk);
    const p = { name, last };
    if (cur) {
      const c = S(...cur);
      Object.assign(p, c, { cur: c, ovr: Math.round(0.7 * seasonOvr(c) + 0.3 * seasonOvr(last)), season: '本季' });
    } else {
      Object.assign(p, last, { ovr: Math.round(seasonOvr(last)), season: '往季' });
    }
    if (floor) p.ovr = Math.max(p.ovr, floor);
    p.ovr = Math.min(99, p.ovr);
    p.from = '现役';
    p.pos = posOf(name);
    return p;
  }

  // 本赛季 MVP 榜前十（NBA.com 2026-11-06 首期榜单），按排名设保底评分，全部 95+
  // 本赛季数据为 11 月上旬公开统计（样本小）；没查到本季数据的用往季（2024-25）
  const STARS = [
    P('卢卡·东契奇', 28.2, 8.2, 7.7, 1.8, 0.4, [39.3, 7.8, 7.9, 1.5, 0.4], 99),
    P('维克托·文班亚马', 24.3, 11.0, 3.7, 1.1, 3.8, [30.1, 11.9, 3.0, 1.0, 4.5], 99),
    P('谢伊·吉尔杰斯-亚历山大', 32.7, 5.0, 6.4, 1.7, 1.0, [30.1, 4.3, 4.5, 1.6, 0.9], 98),
    P('泰瑞斯·马克西', 26.3, 3.3, 6.1, 1.8, 0.4, [28.0, 3.8, 5.4, 1.6, 0.4], 95),
    P('杰森·塔图姆', 26.8, 8.7, 6.0, 1.1, 0.5, null, 97),
    P('阿尔佩伦·申京', 19.4, 10.4, 5.0, 1.1, 0.8, null, 95),
    P('斯蒂芬·库里', 24.5, 4.4, 6.0, 1.1, 0.4, [29.9, 3.7, 4.5, 1.1, 0.4], 96),
    P('扬尼斯·阿德托昆博', 30.4, 11.9, 6.5, 0.9, 1.2, [27.3, 12.7, 5.6, 0.9, 0.9], 96),
    P('尼古拉·约基奇', 29.6, 12.7, 10.2, 1.8, 0.6, [23.1, 10.8, 9.1, 1.4, 0.7], 96),
  ];
  STARS.forEach((p, i) => (p.mvpRank = i + 1));

  // 开局首发档位：1 名 90+、2 名 85~89、1 名 80~84（评分按公式；档位池里的总评会被限制在本档内）
  const TIER = (lo, hi, list) => list.map((p) => ({ ...p, ovr: Math.max(lo, Math.min(hi, p.ovr)) }));
  const POOL_90 = TIER(90, 94, [
    P('安东尼·戴维斯', 24.7, 11.6, 3.4, 1.2, 2.1), P('勒布朗·詹姆斯', 24.4, 7.8, 8.2, 1.0, 0.6), P('卡尔-安东尼·唐斯', 24.4, 12.8, 3.1, 0.9, 0.7),
    P('安东尼·爱德华兹', 27.6, 5.7, 4.5, 1.2, 0.6, [33.3, 4.8, 3.5, 1.2, 0.6]), P('凯德·坎宁安', 26.1, 6.1, 9.1, 1.0, 0.8, [22.3, 5.2, 7.6, 1.0, 0.8], 90),
    P('多曼塔斯·萨博尼斯', 19.1, 13.9, 6.0, 0.8, 0.4, null, 90), P('特雷·杨', 24.2, 3.1, 11.6, 1.3, 0.2, null, 90),
  ]);
  const POOL_85 = TIER(85, 89, [
    P('杰伦·布伦森', 26.0, 2.9, 7.3, 0.9, 0.1), P('凯文·杜兰特', 26.6, 6.0, 4.2, 0.8, 1.2), P('保罗·班凯罗', 25.9, 7.5, 4.8, 0.9, 0.6),
    P('詹姆斯·哈登', 22.8, 5.8, 8.7, 1.5, 0.7), P('锡安·威廉森', 24.6, 7.2, 5.3, 1.2, 0.6), P('拉梅洛·鲍尔', 25.2, 4.9, 7.4, 1.1, 0.3),
    P('弗朗茨·瓦格纳', 24.2, 5.7, 4.7, 1.2, 0.4), P('德阿龙·福克斯', 23.5, 4.6, 6.3, 1.9, 0.4), P('多诺万·米切尔', 24.0, 4.5, 5.0, 1.3, 0.2),
    P('斯科蒂·巴恩斯', 19.3, 7.7, 5.8, 1.4, 1.0), P('杰伦·威廉姆斯', 21.6, 5.3, 5.1, 1.6, 0.7, null, 85),
    P('乔尔·恩比德', 23.8, 8.2, 4.5, 0.7, 0.9),
  ]);
  const POOL_80 = TIER(80, 84, [
    P('杰伦·布朗', 22.2, 5.8, 4.5, 1.2, 0.3), P('伊维察·祖巴茨', 16.8, 12.6, 2.7, 0.7, 1.1), P('小贾伦·杰克逊', 22.2, 5.6, 2.0, 1.2, 1.5),
    P('埃文·莫布里', 18.5, 9.3, 3.2, 0.9, 1.6), P('贾马尔·穆雷', 21.4, 4.2, 6.0, 1.4, 0.5), P('德斯蒙德·贝恩', 19.2, 5.6, 5.3, 1.2, 0.4),
    P('帕斯卡尔·西亚卡姆', 20.2, 6.9, 3.4, 0.9, 0.7), P('达里厄斯·加兰', 20.6, 2.9, 6.7, 1.2, 0.1), P('约什·哈特', 13.6, 9.6, 5.9, 1.4, 0.3),
    P('布兰登·米勒', 21.0, 4.9, 3.6, 0.9, 0.6), P('杰伦·格林', 21.0, 4.6, 3.4, 1.0, 0.3), P('戴森·丹尼尔斯', 14.1, 5.9, 4.4, 3.0, 0.7),
  ]);
  // 开局随机替补（总评约 60~76）
  const BENCH_POOL = [
    P('纳兹·里德', 14.3, 6.0, 2.1, 0.9, 0.8), P('小凯利·乌布雷', 15.0, 5.3, 2.0, 1.4, 0.4), P('唐特·迪文琴佐', 11.7, 4.1, 3.6, 1.4, 0.4),
    P('杰里米·索汉', 11.0, 6.4, 2.2, 0.8, 0.4), P('格雷森·阿伦', 10.9, 3.0, 2.0, 0.6, 0.2), P('卢克·肯纳德', 8.4, 2.6, 3.0, 0.4, 0.1),
    P('马利克·比斯利', 16.3, 3.4, 1.6, 0.8, 0.2), P('卡里斯·勒维尔', 10.0, 3.0, 2.0, 0.6, 0.3), P('盖布·文森特', 6.9, 1.2, 1.7, 0.6, 0.1),
    P('德隆·赖特', 5.0, 2.2, 2.3, 1.0, 0.3), P('凯尔·安德森', 6.0, 3.0, 2.0, 0.8, 0.5), P('诺阿·克洛尼', 3.9, 3.1, 0.6, 0.3, 0.3),
    P('托里·克雷格', 4.0, 3.0, 0.8, 0.4, 0.4), P('小加里·特伦特', 9.0, 2.0, 1.4, 0.7, 0.1), P('阿萨尔·汤普森', 10.1, 6.0, 2.7, 1.2, 0.8),
    P('乔·英格尔斯', 6.0, 3.0, 2.0, 0.4, 0.1), P('布鲁斯·布朗', 8.0, 3.8, 2.6, 0.9, 0.3), P('达里奥·沙里奇', 6.0, 3.5, 1.2, 0.4, 0.2),
    P('崔永熙', 2.6, 1.1, 0.5, 0.3, 0.1), P('杨瀚森', 4.5, 3.2, 1.4, 0.3, 0.7, null, 72),
    P('迈克·康利', 8.2, 2.5, 3.9, 1.0, 0.4), P('泰厄斯·琼斯', 10.2, 2.4, 5.3, 0.9, 0.1),
    P('梅森·普拉姆利', 3.7, 5.0, 1.6, 0.4, 0.4), P('史蒂文·亚当斯', 5.8, 5.6, 1.0, 0.4, 0.6),
  ];

  // ---------- 球队实力 ----------
  const STARTER_W = 0.72; // 首发占 72%，替补占 28%
  const MISSING_POS_PENALTY = 2; // 首发缺一个位置，实力 -2
  const avgOvr = (list) => list.reduce((s, p) => s + p.ovr, 0) / list.length;
  const missingPositions = (team) => POS.filter((pos) => !team.slice(0, 5).some((p) => p.pos === pos));
  const teamPower = (team) =>
    STARTER_W * avgOvr(team.slice(0, 5)) + (1 - STARTER_W) * avgOvr(team.slice(5)) - MISSING_POS_PENALTY * missingPositions(team).length;

  // ---------- 羁绊算进去的排首发（2026-11-28 用户：「一键替换球员优先考虑羁绊后能力值，比如马刺队有 4 名球员，
  //   95 的吉诺比利就推荐替换 99 的乔丹，替补球员数值优先没有羁绊效果」） ----------
  // bondTeam(p)：这个人算哪支队的羁绊（game.js 的 bondTeamOf，不传就是老算法：每个位置只看总评）
  // 首发 5 人里同队最多的那支 n 人（≥3）→ 这 n 人各 +bondBonus(n)；替补没有羁绊，只看总评
  const bondScore = (starters, bt) => {
    const cnt = {};
    for (const p of starters) { const t = bt(p); if (t) cnt[t] = (cnt[t] || 0) + 1; }
    const n = Math.max(0, ...Object.values(cnt));
    return bondBonus(n) * n;
  };
  // 同一个人反复查球队（现役要翻整个联盟名单）很慢：一次排阵 / 一次替换里按人缓存
  const bondCache = (bondTeam) => {
    const memo = new Map();
    return (p) => {
      const k = p.isMe ? '#me' : `${p.name}|${p.from || ''}|${p.season || ''}|${p.realTeam || ''}`;
      if (!memo.has(k)) memo.set(k, bondTeam(p));
      return memo.get(k);
    };
  };
  // 自动排首发：每个位置取该位置总评最高的人（核心球星一定首发），其余按总评进替补
  // coreName 可以是一个名字，也可以是几个名字（核心球星 + 玩家自己），这些人一定首发
  // 传了 bondTeam：每个位置在本位置前 4 强里挑，选「首发总评 + 羁绊加成」最高的组合（一样高就看首发总评）
  function arrange(team, coreName, bondTeam) {
    if (typeof bondTeam !== 'function') return arrangeByOvr(team, coreName);
    const coreNames = [].concat(coreName || []);
    const cores = team.filter((p) => coreNames.includes(p.name));
    if (new Set(cores.map((c) => c.pos)).size !== cores.length) return arrangeByOvr(team, coreName); // 两个核心同位置（不会出现）
    const bt = bondTeam.cached ? bondTeam : bondCache(bondTeam);
    const cand = POS.map((pos) => {
      const c = cores.find((x) => x.pos === pos);
      return c ? [c] : team.filter((p) => p.pos === pos && !cores.includes(p)).sort((a, b) => b.ovr - a.ovr).slice(0, 4);
    });
    let best = null;
    const pick = [];
    const visit = (i) => {
      if (i === POS.length) {
        const chosen = pick.filter(Boolean);
        const rest = team.filter((p) => !chosen.includes(p)).sort((a, b) => b.ovr - a.ovr); // 某个位置没人：用剩下总评最高的补满
        const starters = [...chosen, ...rest.slice(0, 5 - chosen.length)];
        const raw = starters.reduce((s, p) => s + p.ovr, 0);
        const score = raw + bondScore(starters, bt);
        if (!best || score > best.score || (score === best.score && raw > best.raw)) best = { score, raw, starters };
        return;
      }
      if (!cand[i].length) { pick.push(null); visit(i + 1); pick.pop(); return; }
      for (const p of cand[i]) { pick.push(p); visit(i + 1); pick.pop(); }
    };
    visit(0);
    const starters = best.starters.sort((a, b) => POS.indexOf(a.pos) - POS.indexOf(b.pos));
    return [...starters, ...team.filter((p) => !starters.includes(p)).sort((a, b) => b.ovr - a.ovr)];
  }
  function arrangeByOvr(team, coreName) {
    const left = [...team];
    const take = (p) => left.splice(left.indexOf(p), 1)[0];
    const coreNames = [].concat(coreName || []);
    // 核心（明星）固定首发；玩家自己不再自动首发，和同位置的人比总评
    const cores = left.filter((p) => coreNames.includes(p.name));
    const starters = [];
    for (const pos of POS) {
      let pick = cores.find((c) => c.pos === pos && left.includes(c)) || null;
      if (!pick) pick = left.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr)[0];
      if (pick) starters.push(take(pick));
    }
    for (const c of cores) if (left.includes(c)) starters.unshift(take(c));
    // 某个位置没人时，用剩下总评最高的人补满 5 个首发
    while (starters.length < 5) starters.push(take(left.sort((a, b) => b.ovr - a.ovr)[0]));
    starters.sort((a, b) => POS.indexOf(a.pos) - POS.indexOf(b.pos));
    return [...starters.slice(0, 5), ...left.concat(starters.slice(5)).sort((a, b) => b.ovr - a.ovr)];
  }

  // 阵容规则（2026-11-19 用户改的）：「替补不考虑位置，只看数值，数值高就可以换」
  //   首发还是按位置（每个位置用最强的人，arrange）；替补不看位置，新人进来就换下替补里总评最低的那个
  //   以前是「12 人里 5 个位置每个至少 2 人」、新人换同位置最弱的，这条规则去掉了（rosterOk 只留着给老测试看）
  const MIN_PER_POS = 2;
  const posShort = (team) => POS.reduce((s, pos) => s + Math.max(0, MIN_PER_POS - team.filter((p) => p.pos === pos).length), 0);
  const rosterOk = (team) => posShort(team) === 0;
  // 手动换人：除了你自己，谁都能换（不看位置）
  function canReplace(team, idx) {
    return !!team[idx] && !team[idx].isMe;
  }
  // 新人进队换下谁：把他加进来按位置排一次首发，替补里（不含你自己、不含 keep 里的人、不含他本人）总评最低的那个
  //   keep：固定首发、永远不换的人（生涯模式是获得教练信任后的你）
  function replaceTarget(team, incoming, keep = [], bondTeam) {
    const lineup = arrange([...team, incoming], keep, bondTeam);
    const bench = lineup.slice(5).filter((x) => x !== incoming && !x.isMe && !keep.includes(x.name));
    const pool = bench.length ? bench : team.filter((x) => !x.isMe && !keep.includes(x.name)); // 理论上不会走到
    if (!pool.length) return null;
    const x = pool.reduce((a, b) => (b.ovr < a.ovr ? b : a));
    return { x, i: team.indexOf(x) };
  }
  // 同一个球员的不同版本（不同赛季 / 球队，比如 76 人詹姆斯 97、热火詹姆斯 99；不同译名也算同一人）：队里只留一张，可以升级
  //   2026-11-26 用户定「同一人只留一张，可升级」——以前抽到另一个版本一律算重复，只能换成幸运值
  const sameOnTeam = (team, p) => team.find((x) => samePlayer(x.name, p.name)) || null;
  // 新人进队换下谁（10 连抽、宝箱、Boss 卡共用）：
  //   队里已经有这个人 → 新卡更强就换下旧版本（upgrade）；不比旧的强 → null（不能签，只能换幸运值）
  //   队里没有这个人 → 照旧换下替补里最弱的（replaceTarget）
  function signTarget(team, incoming, keep = [], bondTeam) {
    const same = sameOnTeam(team, incoming);
    if (same) return !same.isMe && incoming.ovr > same.ovr ? { x: same, i: team.indexOf(same), upgrade: true } : null;
    return replaceTarget(team, incoming, keep, bondTeam);
  }

  // 一键替换：从总评最高的卡开始，每张都按上面的规则找替补里最弱的人，比他高就换（核心、你自己不换），最后自动排首发
  //   队里已有同一个人的：更强就升级替换旧版本，不更强就跳过（之后算重复，换幸运值）
  // 传了 bondTeam（生涯模式）：按「排好首发后的球队实力 + 羁绊加成」挑——每轮在所有卡 × 替补里最弱的两个人里，
  //   找让实力涨得最多的一换，换到不再涨为止。所以凑成羁绊的 95 吉诺比利会比 99 乔丹先签、先首发；替补只看总评
  function autoReplace(team, cards, coreName, bondTeam) {
    if (typeof bondTeam === 'function') return autoReplaceBond(team, cards, coreName, bondTeam);
    const keep = [].concat(coreName || []);
    let next = arrange([...team], coreName);
    const swaps = [];
    const order = cards.map((c, i) => ({ c, i })).sort((a, b) => b.c.ovr - a.c.ovr);
    for (const { c, i } of order) {
      const out = signTarget(next, c, keep);
      if (!out || c.ovr <= out.x.ovr) continue; // 数值高才换
      next[out.i] = { ...c };
      next = arrange(next, coreName);
      swaps.push({ index: i, in: c, out: out.x, upgrade: !!out.upgrade });
    }
    return { team: arrange(next, coreName), swaps };
  }
  function autoReplaceBond(team, cards, coreName, bondTeam) {
    const keep = [].concat(coreName || []);
    const bt = bondCache(bondTeam);
    bt.cached = true;
    const lineup = (t) => arrange(t, coreName, bt);
    const power = (t) => { const a = lineup(t); return { a, v: teamPower(a) + (STARTER_W * bondScore(a.slice(0, 5), bt)) / 5 }; };
    let next = lineup([...team]);
    let base = power(next).v;
    const pool = cards.map((c, i) => ({ c, i }));
    const swaps = [];
    for (;;) {
      // 能被换下的：替补里（不含你自己、不含固定首发的人）总评最低的两个；同一个人的旧版本只能被更强的版本换（11-26 规则）
      const bench = next.slice(5).filter((x) => !x.isMe && !keep.includes(x.name)).sort((a, b) => a.ovr - b.ovr).slice(0, 2);
      let best = null;
      for (const { c, i } of pool) {
        const same = sameOnTeam(next, c);
        const targets = same ? (!same.isMe && !keep.includes(same.name) && c.ovr > same.ovr ? [same] : []) : bench;
        for (const x of targets) {
          const t = next.map((y) => (y === x ? { ...c } : y));
          const r = power(t);
          if (r.v > base + 1e-9 && (!best || r.v > best.v)) best = { ...r, c, i, x, upgrade: !!same };
        }
      }
      if (!best) break;
      next = best.a;
      base = best.v;
      swaps.push({ index: best.i, in: best.c, out: best.x, upgrade: best.upgrade });
      pool.splice(pool.findIndex((p) => p.i === best.i), 1);
    }
    return { team: next, swaps };
  }

  // ---------- 30 个关卡：全部是冠军球队 ----------
  // 五大 Boss「魔神皇佛鲨」（2026-11-19 用户要求，以前是每 3 关一个 Boss、共 10 个）：第 6、12、18、24、30 关
  //   用户定的顺序（11-19 第二次调整：乔丹和奥尼尔换位置，96 公牛还是最后一关）：
  //   魔术师（1987 湖人）→ 奥尼尔（2001 湖人，季后赛 15 胜 1 负）→ 詹姆斯（2016 骑士，1 比 3 大逆转）→ 邓肯（2003 马刺）→ 乔丹（1996 公牛，72 胜）
  //   难度照样一关比一关强（每关 +0.5），和是哪支队无关
  // 每位 Boss 有专属技能（skill，真的改比赛结果，大厅横幅里写明）和挑战失败时的嘲讽（taunts，随机一句）
  const BOSSES = [
    { year: 1987, team: '洛杉矶', key: 'mo', glyph: '魔', nick: '魔术师', star: '魔术师约翰逊',
      skill: { key: 'showtime', name: 'Showtime', desc: '洛杉矶快攻如潮：对手实力 +2' },
      taunts: ['这就是 Showtime，回去多看看录像吧。', '孩子，球是用来传的，不是用来送的。', '你跑得过我的快攻吗？显然不能。'] },
    { year: 2001, team: '洛杉矶', key: 'sha', glyph: '鲨', nick: '大鲨鱼', star: '沙奎尔·奥尼尔',
      skill: { key: 'paint', name: '篮下统治', desc: '你的篮板 -25%，对手实力 +1.5' },
      taunts: ['篮下是我的地盘，回去多吃两碗饭再来。', '想挡我？先去健身房举两年铁。', '我罚球是不准，但打你够了。'] },
    { year: 2016, team: '克利夫兰', key: 'huang', glyph: '皇', nick: '小皇帝', star: '勒布朗·詹姆斯',
      skill: { key: 'comeback', name: '1 比 3 逆转', desc: '克利夫兰落后 5 分以内时，第四节有六成机会反扑 +3~6 分' },
      taunts: ['1 比 3 我都能翻，你这点分差算什么？', '这一场，是送给克利夫兰的。', '别急着庆祝，比赛有四节。'] },
    { year: 2003, team: '圣安东尼奥', key: 'fo', glyph: '佛', nick: '石佛', star: '蒂姆·邓肯',
      skill: { key: 'rock', name: '稳如磐石', desc: '比赛波动减半，很难爆冷；对手实力 +0.5' },
      taunts: ['未来是你的，但不是现在。', '基本功，才是篮球。', '打板进了，也算两分。'] },
    { year: 1996, team: '芝加哥', key: 'shen', glyph: '神', nick: '篮球之神', star: '迈克尔·乔丹',
      skill: { key: 'lastshot', name: '最后一投', desc: '你只领先 1~3 分时，乔丹会在最后几秒绝杀' },
      taunts: ['72 胜都没人拦得住，你也一样。', '我记住你了。下次，还是我赢。', '最后一投，永远交给我。'] },
  ];
  const BOSS_SLOTS = [5, 11, 17, 23, 29]; // 第 6、12、18、24、30 关（按上面的顺序）
  const bossTeams = BOSSES.map((b) => CHAMPIONS.find((c) => c.year === b.year && c.team === b.team));
  // 第 1 关固定卫冕冠军；Boss 放在固定的关；其余按阵容实力从弱到强
  const first = CHAMPIONS.find((c) => c.year === 2026);
  const middle = CHAMPIONS.filter((c) => c !== first && !bossTeams.includes(c)).sort((a, b) => teamPower(a.roster) - teamPower(b.roster));
  const order = [first];
  for (let i = 1, m = 0; i < CHAMPIONS.length; i++) order.push(BOSS_SLOTS.includes(i) ? bossTeams[BOSS_SLOTS.indexOf(i)] : middle[m++]);
  const STEP = 0.5; // 每关至少比上一关强这么多（状态加成）
  // 前几关对手处于"赛季初状态"，实力打折：前 3 关大幅打折（让新手先赢起来），之后一直慢慢减到第 11 关（以前到第 5 关就断崖，第 6 关特别难）
  const EASE = [12, 11, 10, 8, 7, 6, 5, 4, 3, 2, 1];
  // Boss 关再降一点（Boss 首发 5 人同队，有 +5 羁绊，合起来还是比前后两关难）
  // 2026-11-28：2.5 → 1（Boss 实力 +1.5）。传奇勋章改成抽中 30%、触发 20% 后，抵消乔丹得分翻倍、麦迪必胜帮你赢下的 Boss 关
  const BOSS_EASE = 1;
  const isBoss = (i) => BOSS_SLOTS.includes(i);
  const bossOf = (i) => (isBoss(i) ? BOSSES[BOSS_SLOTS.indexOf(i)] : null);
  // 「大鲨鱼奥尼尔」「篮球之神乔丹」；魔术师约翰逊名字里已经有外号，不重复
  const bossName = (b) => (b.star.includes(b.nick) ? b.star : b.nick + b.star.split('·').pop());
  const ease = (i) => (EASE[i] || 0) + (isBoss(i) ? BOSS_EASE : 0);
  // 羁绊：首发 5 人里同一支球队的人数 3 / 4 / 5 → 这几个人（只加羁绊里的人，不加替补和别的首发）能力 +3 / +4 / +5；2 人及以下没有。
  // 你的球队按球员所属的球队算（不分年代）；Boss 关的冠军队首发 5 人本来就同队，首发 5 人各 +5（普通关没有羁绊）
  const BOND = { 3: 3, 4: 4, 5: 5 };
  const bondBonus = (n) => BOND[n] || 0;
  // 羁绊对球队实力的贡献：首发占 72%，n 个首发各 +bonus → 实力 +0.72 × bonus × n / 5
  const bondPower = (bonus, n) => (STARTER_W * bonus * n) / 5;
  const LEVELS = [];
  let base = -Infinity;
  order.forEach((c, i) => {
    const raw = teamPower(c.roster);
    base = Math.max(raw, base + STEP);
    const bond = isBoss(i) ? bondBonus(5) : 0;
    const bondP = bondPower(bond, 5);
    const power = base - ease(i) + bondP; // 对手实力已经算上羁绊
    LEVELS.push({ ...c, index: i, raw, power, bond, bondPower: bondP, boost: power - raw - bondP, era: `${c.year} 总冠军`, boss: bossOf(i) });
  });

  // 球队默契：每赢一关全队实力 +0.4，最多 +6
  const CHEM_PER_WIN = 0.4;
  const CHEM_MAX = 6;
  const chemistry = (wins) => Math.min(CHEM_MAX, Math.round(wins * CHEM_PER_WIN * 10) / 10);

  // ---------- 10 连抽：卡池是 30 支冠军队夺冠赛季的全部球员 ----------
  const GACHA_POOL = CHAMPIONS.flatMap((c) => c.roster);
  const GACHA_RATES = [
    { key: 'top', label: '90+', min: 90, max: 99, rate: 0.05 },
    { key: 'mid', label: '80+', min: 80, max: 89, rate: 0.3 },
    { key: 'low', label: '80 以下', min: 0, max: 79, rate: 0.65 },
  ];
  const GACHA_TIERS = GACHA_RATES.map((t) => ({ ...t, pool: GACHA_POOL.filter((p) => p.ovr >= t.min && p.ovr <= t.max) }));
  // 10 连抽：同一次里不会出同一个人（以前同一张 2002 湖人萨马基·沃克能抽到两次；不同赛季、不同译名也算同一人）
  function gacha(n = 10, rand = Math.random) {
    const got = [];
    const fresh = (pool) => pool.filter((p) => !got.some((g) => samePlayer(g.name, p.name)));
    for (let k = 0; k < n; k++) {
      let r = rand();
      const tier = GACHA_TIERS.find((t) => (r -= t.rate) < 0) || GACHA_TIERS[GACHA_TIERS.length - 1];
      let pool = fresh(tier.pool);
      // 这一档的人都已经抽到了（几乎不会）：换一档
      if (!pool.length) for (const t of GACHA_TIERS) { pool = fresh(t.pool); if (pool.length) break; }
      if (!pool.length) break;
      got.push({ ...pool[Math.floor(rand() * pool.length)] });
    }
    return got;
  }
  // 只留满足条件的人（原地改 GACHA_POOL 和各档卡池，宝箱候选也跟着变）；各档概率不变。
  // 虎扑版（有照片）用它去掉找不到照片的老替补：剪影在 10 连抽里像头像没加载出来（2026-11-26 用户说「有点球员头像加载有问题」）
  function limitGachaPool(keep) {
    const kept = GACHA_POOL.filter(keep);
    if (!kept.length) return;
    GACHA_POOL.length = 0;
    GACHA_POOL.push(...kept);
    for (const t of GACHA_TIERS) { const left = t.pool.filter(keep); if (left.length) t.pool = left; } // 某一档全被去掉就保留原样（不会发生）
  }

  // ---------- 随机工具 ----------
  function rng(seed) {
    if (seed == null) return Math.random;
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const gauss = (rand) => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  function shuffle(arr, rand = Math.random) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const clone = (p) => ({ ...p });

  // 开局：核心 + 首发（1 名 90+、2 名 85+、1 名 80+，补齐核心以外的 4 个位置）+ 7 名随机替补
  function randomSupport(core, rand = Math.random) {
    const used = new Set([core.name]);
    const pickOne = (pool, pos) => {
      const cands = pool.filter((p) => !used.has(p.name) && (!pos || p.pos === pos));
      if (!cands.length) return null;
      const p = clone(cands[Math.floor(rand() * cands.length)]);
      used.add(p.name);
      return p;
    };
    const positions = shuffle(POS.filter((p) => p !== core.pos), rand);
    const tiers = shuffle([POOL_90, POOL_85, POOL_85, POOL_80], rand);
    const starters = positions.map((pos, i) => pickOne(tiers[i], pos) || pickOne(tiers[i]));
    const bench = [];
    for (let i = 0; i < 7; i++) bench.push(pickOne(BENCH_POOL));
    return { starters, bench: bench.sort((a, b) => b.ovr - a.ovr) };
  }

  // ---------- 被动技能：每过 5 关三选一 ----------
  // rare = 传奇被动（比赛里触发 / 改变全队）；普通被动全是给你自己的能力加成（attr），是 99 之外的额外加成，可以超过 99
  const PASSIVES = {
    // 传奇被动：每场按概率触发（几率很小），几个可以同一场一起触发、效果叠加；rate = 每场触发概率
    // 2026-11-18 用户要求只留 5 个：乔丹、詹姆斯、麦迪、库里、杜兰特（科比、魔术师、罗德曼、吉诺比利、奥尼尔已删，老存档里的会被清掉）
    // 2026-11-28 用户重做：乔丹 单场得分翻倍；詹姆斯 得分、篮板、助攻、抢断、盖帽各 +5（原来乔丹那个，用户说「都 +5」，不再按上场时间折算）；
    //   库里「三分之神」换成魔术师 单场助攻翻倍；杜兰特「死神镰刀」换成奥尼尔「鲨鱼来袭」单场篮板翻倍
    //   （老存档里的库里、杜兰特勋章见下面 RENAMED，直接换成魔术师、奥尼尔）
    //   key 用 diesel：shaq 这个 key 一直是普通勋章（力量 +2），老存档里戴着的人很多，不能拿来当传奇
    //   触发概率（11-28 用户：游戏的重点是触发传奇勋章、一场拿到夸张数据的爽感 → 抽中 30%、触发 20%）：
    //   整局模拟（scratchpad 的 legend-run.js，真引擎 1500~2000 局）：全部 20% 时三分之一的比赛会触发，但全通率 2% → 13%，
    //   Boss 关的胜利有 22% 是乔丹 / 麦迪带走的。用户选了调整版：麦迪（必胜，不出数据）降到 10%，Boss 实力 +1.5（BOSS_EASE 2.5 → 1）
    //   → 28% 的比赛触发、每局约 2 场 50+ 分，全通率 6%、Boss 关胜率 71%，和改之前差不多难
    jordan: { name: '魔王降临', star: '迈克尔·乔丹', rare: true, rate: 0.20, desc: '你这场得分翻倍' },
    lebron: { name: '天选之子', star: '勒布朗·詹姆斯', rare: true, rate: 0.20, desc: '你这场得分、篮板、助攻、抢断、盖帽各 +5' },
    tmac: { name: '麦迪奇迹', star: '特雷西·麦克格雷迪', rare: true, rate: 0.10, desc: '最后 35 秒逆天改命：连得 13 分，这场必胜' },
    magic: { name: '魔术时刻', star: '魔术师约翰逊', rare: true, rate: 0.20, desc: '你这场助攻翻倍' },
    diesel: { name: '鲨鱼来袭', star: '沙奎尔·奥尼尔', rare: true, rate: 0.20, desc: '你这场篮板翻倍' },
    // 普通被动（2026-11-19 用户要求重做）：11 项能力各一枚，每枚对应这项能力史上最强的人，那一项 +2
    //   用户举的例子：奥尼尔「鲨鱼来袭」力量 +2。加点单项最高 100，勋章是唯一能超过 100 的办法（最高 102）
    //   用户 11-19 定的：3分 水花兄弟克莱、2分 曼巴精神科比、终结 妖刀出鞘吉诺比利、控球 费城答案艾弗森、传球 控卫之神保罗、
    //   内防 非洲大山穆托姆博、运动 风城玫瑰罗斯、外防 皮蓬
    klay: { name: '水花兄弟', star: '克莱·汤普森', attr: { '3分': 2 }, desc: '3分 +2' },
    kobe: { name: '曼巴精神', star: '科比·布莱恩特', attr: { '2分': 2 }, desc: '2分 +2' },
    manu: { name: '妖刀出鞘', star: '马努·吉诺比利', attr: { 终结: 2 }, desc: '终结 +2' },
    ai: { name: '费城答案', star: '阿伦·艾弗森', attr: { 控球: 2 }, desc: '控球 +2' },
    cp3: { name: '控卫之神', star: '克里斯·保罗', attr: { 传球: 2 }, desc: '传球 +2' },
    pippen: { name: '防守大闸', star: '斯科蒂·皮蓬', attr: { 外防: 2 }, desc: '外防 +2' },
    mutombo: { name: '非洲大山', star: '迪肯贝·穆托姆博', attr: { 内防: 2 }, desc: '内防 +2' },
    rodman: { name: '篮板怪兽', star: '丹尼斯·罗德曼', attr: { 篮板: 2 }, desc: '篮板 +2' },
    // 力量这枚原来是奥尼尔「鲨鱼来袭」，11-28 奥尼尔「鲨鱼来袭」改成传奇勋章（篮板翻倍），这枚换成卡尔·马龙；key 不变，老存档不用迁移
    shaq: { name: '钢铁邮差', star: '卡尔·马龙', attr: { 力量: 2 }, desc: '力量 +2' },
    rose: { name: '风城玫瑰', star: '德里克·罗斯', attr: { 运动: 2 }, desc: '运动 +2' },
    carter: { name: '半人半神', star: '文斯·卡特', attr: { 弹跳: 2 }, desc: '弹跳 +2' },
  };
  // 11-19 当天改过名的普通勋章 key（加成一样，直接换名字）
  // 11-28：传奇勋章库里「三分之神」→ 魔术师「魔术时刻」，杜兰特「死神镰刀」→ 奥尼尔「鲨鱼来袭」（用户说「换」，戴着的直接换成新的）
  const RENAMED = { ray: 'klay', kyrie: 'manu', wade: 'manu', payton: 'pippen', curry: 'magic', kd: 'diesel' };
  // 2026-11-19 之前的普通勋章（老存档迁移用：先扣掉旧加成，再换成对应的新勋章）
  const OLD_NORMAL = {
    mills: { attr: { '3分': 2 }, to: 'klay' }, kerr: { attr: { '3分': 2, '2分': 2 }, to: 'kobe' }, perkins: { attr: { 内防: 3, 力量: 2 }, to: 'shaq' },
    caruso: { attr: { 外防: 3 }, to: 'pippen' }, love: { attr: { 篮板: 4 }, to: 'rodman' }, battier: { attr: { 外防: 2, 内防: 2 }, to: 'mutombo' },
    horry: { attr: { '3分': 3, '2分': 1 }, to: 'klay' }, ibaka: { attr: { 弹跳: 2, 内防: 2 }, to: 'carter' }, rose: { attr: { 运动: 3, 终结: 2 }, to: 'rose' },
    cp3: { attr: { 传球: 3, 控球: 2 }, to: 'cp3' },
  };

  // ---------- 比赛模拟 ----------
  const PTS_PER_POWER = 0.7; // 实力差 1 ≈ 净胜 1.4 分；单场波动标准差约 11 分
  function simulate(myTeam, level, opts = {}) {
    const rand = rng(opts.seed);
    const L = LEVELS[level];
    const pas = new Set(opts.passives || []);
    // 传奇被动：先逐个掷骰子（只有你在阵中才会触发）
    const me = myTeam.find((p) => p.isMe);
    // legendBoost：保底，前面连着几场没触发，每枚的概率都加上（career.js 的 LEGEND_PITY × 没触发的场数）
    const boost = opts.legendBoost || 0;
    const hit = new Set(me ? [...pas].filter((k) => PASSIVES[k] && PASSIVES[k].rare && rand() < PASSIVES[k].rate + boost) : []);
    const triggers = [...hit];
    // 羁绊（opts.myBond + opts.bondWho）：只给羁绊里的那几个人加能力值
    const bond = opts.myBond || 0;
    const bondWho = new Set(opts.bondWho || []);
    const team = myTeam.map((p) => {
      const b = bondWho.has(p.name) ? bond : 0;
      return b ? { ...p, ovr: p.ovr + b } : p;
    });
    const myPower = teamPower(team) + (opts.myBonus || 0);
    // 五大 Boss 技能：魔 Showtime（实力 +2）、鲨 篮下统治（实力 +1.5、你的篮板 -25%）、佛 稳如磐石（波动减半、实力 +0.5）
    //   同等实力下每个技能让你的胜率少 8~12 个百分点（scratchpad 的 bosscheck.js 模拟）
    //   皇 1 比 3 逆转、神 最后一投 是有条件才发动的，在下面
    const sk = L.boss ? L.boss.skill.key : null;
    const oppPower = L.power + ({ showtime: 2, paint: 1.5, rock: 0.5 }[sk] || 0);
    const diff = myPower - oppPower;
    const noise = sk === 'rock' ? 4 : 8;
    const final = [
      Math.round(110 + diff * PTS_PER_POWER + gauss(rand) * noise),
      Math.round(110 - diff * PTS_PER_POWER + gauss(rand) * noise),
    ];
    if (final[0] === final[1]) final[rand() < 0.5 ? 0 : 1] += 2;
    const notes = [];
    // 五大 Boss 登场：开场两队首发介绍之后第一条播报
    if (L.boss) notes.push({ side: 1, text: `【五大 Boss】「${L.boss.glyph}」${bossName(L.boss)}率 ${L.year} ${nick(L.team)}登场！`, bold: true, pre: true });
    // Boss 技能播报（bossSkill：比赛页放技能特效）；q = 放在第几节（0 起），不写就是开场
    let bossHit = ['showtime', 'paint', 'rock'].includes(sk); // 这三个是一直生效的
    const skillNote = (text, q) => notes.push({ side: 1, text: `【${L.boss.skill.name}】${text}`, bold: true, skill: true, bossSkill: true, ...(q == null ? { pre: true } : { q }) });
    if (sk === 'showtime') skillNote('魔术师不看人传球，洛杉矶快攻一条龙，一波接一波！', Math.floor(rand() * 2));
    if (sk === 'paint') skillNote('奥尼尔篮下连续强打，你们的内线被打穿了！', 1);
    if (sk === 'rock') skillNote('圣安东尼奥几乎不犯错，这场比赛很难打出爆冷。');
    if (bond && bondWho.size) notes.push({ side: 0, text: `【羁绊】${opts.bondText || '首发同队'}，这 ${bondWho.size} 人能力 +${bond}！`, bold: true, skill: true, pre: true });
    if (L.bond) notes.push({ side: 1, text: `【羁绊】${nick(L.team)}首发 5 人同队，首发 5 人能力 +${L.bond}！`, bold: true, pre: true });
    const mods = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, ptsMul: 1 };
    const note = (k, text) => notes.push({ side: 0, text: `【${PASSIVES[k].name}】${text}`, bold: true, me: true, skill: true });
    // 传奇勋章（11-28 重做）：翻倍的三个在 boxScore 里，按你这场本来的数据翻倍（替补上场时间短，翻倍后也少，不会出现 14 分钟 60 分）；
    //   天选之子是各项固定 +5（多出来的 5 分算进全队比分）
    if (hit.has('lebron')) { for (const k of ['pts', 'reb', 'ast', 'stl', 'blk']) mods[k] += 5; final[0] += 5; note('lebron', `${me.name}天选之子，攻防两端全面爆发！`); }
    if (hit.has('jordan')) { mods.ptsX2 = true; note('jordan', `${me.name}魔王降临，今晚得分翻倍！`); }
    if (hit.has('magic')) { mods.astX2 = true; note('magic', `${me.name}魔术时刻，今晚助攻翻倍！`); }
    if (hit.has('diesel')) { mods.rebX2 = true; note('diesel', `${me.name}鲨鱼来袭，今晚篮板翻倍！`); }
    // 你这队的数据表先算：乔丹得分翻倍时你多拿的分要算进全队比分，后面的麦迪奇迹、Boss 技能都按这个真实比分来安排
    const box0 = boxScore(team, final[0], rand, { ...mods, rebMul: sk === 'paint' ? 0.75 : 1 });
    final[0] = box0.reduce((s, x) => s + x.pts, 0);
    if (final[0] === final[1]) final[1] += rand() < 0.5 ? 1 : -1; // 翻倍后正好打平：差一分分出胜负（没有加时）
    // 麦迪奇迹：最后 35 秒前落后 3~12 分，然后连得 13 分反超
    let tail = null;
    if (hit.has('tmac')) {
      final[1] = final[0] + 3 + Math.floor(rand() * 10);
      const n = me.name;
      tail = { reserve: 36, evs: [
        { clock: '0:35', side: 0, text: `${n}三分命中【麦迪奇迹】`, pts: 3, bold: true, me: true, skill: true },
        { clock: '0:31', side: 1, text: '对手发球，快速推进' },
        { clock: '0:24', side: 0, text: `${n}三分命中，同时造成犯规！`, pts: 3, bold: true, me: true, skill: true },
        { clock: '0:24', side: 0, text: `${n}加罚命中，四分打！`, pts: 1, bold: true, me: true, skill: true },
        { clock: '0:16', side: 1, text: `对手传球失误，${n}抢断`, me: true },
        { clock: '0:11', side: 0, text: `${n}抢断后三分命中！`, pts: 3, bold: true, me: true, skill: true },
        { clock: '0:05', side: 1, text: '对手跳投不中' },
        { clock: '0:01', side: 0, text: `${n}压哨三分命中！35 秒 13 分，逆天改命！`, pts: 3, bold: true, me: true, skill: true },
      ] };
    }
    // 皇「1 比 3 逆转」：骑士落后 5 分以内 → 第四节反扑 3~6 分（可能翻盘，也可能差一点）
    //   一开始是 8 分以内反扑 6~9 分，同等实力胜率从 48% 掉到 23%，太狠
    if (sk === 'comeback' && !tail && final[1] < final[0] && final[0] - final[1] <= 5 && rand() < 0.6) {
      final[1] += 3 + Math.floor(rand() * 4);
      if (final[0] === final[1]) final[1] += 1;
      skillNote('三节打完克利夫兰还落后，詹姆斯第四节接管比赛，疯狂反扑！', 3);
      bossHit = true;
    }
    // 神「最后一投」：你只领先 1~3 分 → 最后一攻前公牛落后 1 分，乔丹最后 2 秒绝杀（麦迪奇迹优先）
    if (sk === 'lastshot' && !tail && final[0] > final[1] && final[0] - final[1] <= 3) {
      final[1] = final[0] - 1;
      const j = L.boss.star;
      tail = { reserve: 14, side: 1, who: j, evs: [
        { clock: '0:13', side: 1, text: `${nick(L.team)}暂停回来发球，球交到了${short(j)}手里` },
        { clock: '0:06', side: 1, text: `${j}运球到罚球线，急停、起跳……` },
        { clock: '0:02', side: 1, text: `【最后一投】${j}后仰跳投命中！绝杀反超！`, pts: 2, bold: true, skill: true, bossSkill: true },
        { clock: '0:00', side: 0, text: '最后一攻仓促出手不中，比赛结束' },
      ] };
      bossHit = true;
    }
    const box = [box0, boxScore(L.roster, final[1], rand, { rebMul: sk === 'paint' ? 1.15 : 1 })];
    const labels = [opts.myLabel || '我队', nick(L.team)];
    const { events, quarters } = playByPlay(box, labels, rand, { notes, tail });
    // 最后几十秒的固定事件（麦迪奇迹 / 乔丹最后一投）：得分加到比分和那个人的数据上（三分、两分、罚球都记上）
    if (tail) {
      for (const e of tail.evs) {
        if (!e.pts) continue;
        final[e.side] += e.pts;
        const row = e.side === 0 ? box[0].find((x) => x.me) : box[1].find((x) => x.name === tail.who);
        if (!row) continue;
        row.pts += e.pts;
        if (e.pts === 3) { row.fg3m++; row.fg3a++; } else if (e.pts === 2) { row.fg2m++; row.fg2a++; } else { row.ftm++; row.fta++; }
      }
    }
    return { final, quarters, box, events, labels, myPower, oppPower, win: final[0] > final[1], triggers, bossSkill: sk ? { ...L.boss.skill, hit: bossHit } : null };
  }

  function splitQuarters(final, rand) {
    const q = [[], []];
    for (let t = 0; t < 2; t++) {
      const w = [0, 1, 2, 3].map(() => 0.8 + rand() * 0.4);
      const sum = w.reduce((a, b) => a + b, 0);
      let left = final[t];
      for (let i = 0; i < 4; i++) {
        const v = i === 3 ? left : Math.round((final[t] * w[i]) / sum);
        q[t].push(v);
        left -= v;
      }
    }
    return [0, 1, 2, 3].map((i) => [q[0][i], q[1][i]]);
  }

  // 上场时间：首发每人 30~37 分钟，其余 240 分钟按总评分给替补
  // 你坐替补时按自己的总评拿时间（超级第六人）：65 分 10 分钟，85 分 25 分钟，95 分以上 32 分钟
  const myBenchMin = (ovr) => Math.min(32, Math.max(16, 16 + (ovr - 65) * 0.8));
  function minutes(players, rand) {
    // 你打首发：球星级时间 34~38 分钟；其他首发 30~37
    const mins = players.map((p, i) => (i < 5 ? (p.isMe ? 34 + rand() * 4 : 30 + rand() * 7) : p.isMe ? myBenchMin(p.ovr) + (rand() - 0.5) * 4 : 0));
    const left = 240 - mins.reduce((a, b) => a + b, 0);
    const w = players.map((p, i) => (i < 5 || p.isMe ? 0 : Math.pow(Math.max(p.ovr - 55, 1), 2) * (0.5 + rand())));
    const sw = w.reduce((a, b) => a + b, 0);
    const out = mins.map((m, i) => (i < 5 || players[i].isMe ? m : (left * w[i]) / sw));
    // 替补单人最多 36 分钟，多出来的按比例分给其他替补（你自己的时间不动）
    for (let k = 0; k < 3; k++) {
      let extra = 0;
      out.forEach((m, i) => { if (i >= 5 && m > 36) { extra += m - 36; out[i] = 36; } });
      const room = out.map((m, i) => (i >= 5 && m < 36 && m > 0 ? 36 - m : 0));
      const rs = room.reduce((a, b) => a + b, 0);
      if (!extra || !rs) break;
      out.forEach((m, i) => { if (room[i]) out[i] += (extra * room[i]) / rs; });
    }
    return out.map((m) => (m < 2 ? 0 : Math.round(m)));
  }
  function allocate(players, mins, total, key, rand, power = 1.1) {
    const w = players.map((p, i) => (mins[i] ? Math.pow(Math.max(p[key], 0.2), power) * (mins[i] / 36) * (0.6 + rand() * 0.8) : 0));
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    const raw = w.map((x) => (total * x) / sum);
    const out = raw.map(Math.floor);
    let left = total - out.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => left-- > 0 && out[i]++);
    return out;
  }
  // ---------- 投篮：把每个人的得分拆成两分、三分、罚球（按他自己的虎扑数据） ----------
  // 没有数据时按位置估：p2 二分命中率、p3 三分命中率、ft 罚球命中率、s3 三分出手占投篮出手、ftr 罚球出手 ÷ 投篮出手
  const POS_SHOT = {
    PG: { p2: 0.5, p3: 0.36, ft: 0.82, s3: 0.42, ftr: 0.26 },
    SG: { p2: 0.5, p3: 0.36, ft: 0.81, s3: 0.42, ftr: 0.25 },
    SF: { p2: 0.52, p3: 0.35, ft: 0.78, s3: 0.36, ftr: 0.27 },
    PF: { p2: 0.54, p3: 0.34, ft: 0.73, s3: 0.24, ftr: 0.32 },
    C: { p2: 0.6, p3: 0.3, ft: 0.67, s3: 0.08, ftr: 0.38 },
  };
  const clampN = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  function shotProfile(p) {
    const d = POS_SHOT[p.pos] || POS_SHOT.SF;
    const pr = { ...d };
    // 你自己：3分决定三分出手多少和准不准，终结决定命中率，罚球看 3分、2分、终结
    if (p.isMe && p.attrs) {
      // 能力值 + 普通勋章加成（11-28 起勋章只影响比赛数据，不算在能力值里）
      const bo = p.bonus || {};
      const a = Object.fromEntries(Object.entries(p.attrs).map(([k, v]) => [k, v + (bo[k] || 0)]));
      pr.s3 = clampN((a['3分'] - 45) / 110, 0.03, 0.6);
      pr.p3 = clampN((p.tp || 33) / 100, 0.2, 0.5);
      pr.p2 = clampN(((p.fg || 46) / 100 - pr.s3 * pr.p3) / (1 - pr.s3), 0.38, 0.72);
      pr.ft = clampN(0.55 + (0.5 * a['3分'] + 0.3 * a['2分'] + 0.2 * a.终结 - 50) * 0.007, 0.5, 0.93);
      pr.ftr = clampN(d.ftr + ((a.力量 || 70) - 70) / 250, 0.15, 0.55);
      return pr;
    }
    // 三分出手占比：有出手数就直接算；老球员只有命中率的，按年代估（三分命中率很低 = 基本不投）
    if (p.fga > 0 && p.tpa != null) pr.s3 = clampN(p.tpa / p.fga, 0, 0.75);
    else if (p.tp != null) {
      const yr = Number(p.season) || 2026;
      pr.s3 = p.tp < 15 ? 0 : d.s3 * (yr < 1990 ? 0.25 : yr < 2000 ? 0.45 : yr < 2014 ? 0.6 : 1);
    }
    if (p.tp > 0 && (p.tpa == null || p.tpa >= 0.5)) pr.p3 = clampN(p.tp / 100, 0.15, 0.5);
    if (p.fg > 0) pr.p2 = clampN((p.fg / 100 - pr.s3 * pr.p3) / (1 - pr.s3), 0.3, 0.8);
    if (p.ft > 0 && (p.fta == null || p.fta > 0)) pr.ft = clampN(p.ft / 100, 0.3, 0.98);
    if (p.fga > 0 && p.fta != null) pr.ftr = clampN(p.fta / p.fga, 0.03, 0.9);
    return pr;
  }
  // 一个人这场的得分怎么来的：units = 每一次得分回合（2 / 3 / 罚球 / 三分之神 c3 / 死神镰刀 k2），再按命中率倒推投丢的球
  function shootLine(p, pts, min, rand, force) {
    const pr = shotProfile(p);
    const fgP = pr.s3 * pr.p3 + (1 - pr.s3) * pr.p2;
    const qFT = pr.ftr / 2 / (fgP + pr.ftr / 2); // 一个回合是罚球的概率（每两次罚球算一个回合）
    const q3 = (pr.s3 * pr.p3) / fgP; // 进的球里三分占多少
    const units = [];
    let rem = pts;
    if (force) {
      for (let k = 0; k < force.c3 && rem >= 3; k++) { units.push({ k: 'c3' }); rem -= 3; }
      for (let k = 0; k < force.k2 && rem >= 2; k++) { units.push({ k: 'k2' }); rem -= 2; }
    }
    // 有得分型隐藏能力（三分 / 两分，老存档）的人：这场至少有一球是这种
    const sk = p.skill && typeof p.skill.kind === 'number' ? p.skill.kind : 0;
    if (sk && rem >= sk) { units.push({ k: sk }); rem -= sk; }
    for (let guard = 0; rem > 0 && guard < 300; guard++) {
      if (rem === 1) {
        // 只剩 1 分：2+1 / 3+1、把一个两分换成三分、把一次罚丢改成罚中、两罚一中、技术犯规罚球，按这个人的习惯挑一种
        // （以前一律补「两罚一中」，罚球数和罚丢的球都偏多）
        const fgs = units.filter((u) => (u.k === 2 || u.k === 3) && !u.and1);
        const twos = units.filter((u) => u.k === 2);
        const missFT = units.filter((u) => u.k === 'ft' && !u.tech && u.ft.includes(0));
        const opts = [
          [fgs.length ? 3 : 0, () => (fgs[Math.floor(rand() * fgs.length)].and1 = true)],
          [twos.length ? 6 * pr.s3 : 0, () => (twos[Math.floor(rand() * twos.length)].k = 3)],
          [missFT.length ? 2 * pr.ft : 0, () => { const u = missFT[Math.floor(rand() * missFT.length)]; u.ft[u.ft.indexOf(0)] = 1; }],
          [1.5 * (1 - pr.ft) + 0.2, () => units.push({ k: 'ft', ft: rand() < 0.5 ? [1, 0] : [0, 1] })],
          [0.2, () => units.push({ k: 'ft', ft: [1], tech: true })],
        ];
        weighted(opts, (o) => o[0], rand)[1]();
        rem = 0;
        break;
      }
      if (rand() < qFT) {
        const a = rand() < pr.ft ? 1 : 0, b = rand() < pr.ft ? 1 : 0;
        units.push({ k: 'ft', ft: [a, b] });
        rem -= a + b;
      } else if (rem >= 3 && rand() < q3) { units.push({ k: 3 }); rem -= 3; }
      else { units.push({ k: 2 }); rem -= 2; }
    }
    for (; rem >= 2; rem -= 2) units.push({ k: 2 });
    if (rem === 1) units.push({ k: 'ft', ft: [1, 0] });
    let fg2m = 0, fg3m = 0, ftm = 0, fta = 0;
    for (const u of units) {
      if (u.k === 2 || u.k === 'k2') fg2m++;
      else if (u.k === 3 || u.k === 'c3') fg3m++;
      else { fta += u.ft.length; ftm += u.ft.reduce((s, x) => s + x, 0); }
      if (u.and1) { fta++; ftm++; }
    }
    // 出手数：按命中率倒推（这场手感有起伏），三分出手按他平时的占比；一个球没进但上了场，也投过几次
    // 三分之神 / 死神镰刀的必中球单独算（中几个就投几个），不拿来倒推出手
    const f3 = units.filter((u) => u.k === 'c3').length, f2 = units.filter((u) => u.k === 'k2').length;
    const fgm = fg2m - f2 + fg3m - f3;
    const fga = fgm ? Math.round(fgm / clampN(fgP * (0.82 + rand() * 0.36), 0.2, 0.95)) : min ? Math.round((rand() * min) / 14) : 0;
    const n3a = Math.max(fg3m - f3, Math.round(fga * pr.s3 * (0.75 + rand() * 0.5)));
    const fg3a = n3a + f3;
    const fg2a = Math.max(fg2m - f2, fga - n3a) + f2;
    return { units, s3: pr.s3, fg2m, fg2a, fg3m, fg3a, ftm, fta };
  }

  function boxScore(players, pts, rand, mods = {}) {
    const scale = (base, sd) => Math.max(0, Math.round(base + gauss(rand) * sd));
    const M = minutes(players, rand);
    // 你自己：按你的场均 × 上场时间（34 分钟算满）直接算，有起伏；队友再分剩下的
    const mi = players.findIndex((p) => p.isMe);
    let mine = null;
    let ptsExtra = 0;
    if (mi >= 0 && M[mi]) {
      const p = players[mi], f = M[mi] / 34;
      // 数据稀释：身边的人越强，你的球权越少。分量 =（总评-60）²，和「你 + 4 个 80 分队友」比
      const wt = (o) => Math.pow(Math.max(o - 60, 2), 2);
      const mates = mi < 5 ? players.slice(0, 5).filter((x, i) => i !== mi) : players.slice(5).filter((x) => !x.isMe).sort((a, b) => b.ovr - a.ovr).slice(0, 4);
      const share = wt(p.ovr) / (wt(p.ovr) + mates.reduce((s, x) => s + wt(x.ovr), 0));
      const ref = wt(p.ovr) / (wt(p.ovr) + 4 * wt(80));
      // 你是主角：挑战王朝里你的数据不打折（身边再强也不稀释），身边越弱你的球权越多（最多 +25%）
      const use = Math.min(1.25, Math.max(1, Math.pow(share / ref, 0.25)));
      const useReb = Math.min(1.15, Math.max(1, Math.pow(share / ref, 0.15)));
      const v = (x, k, sd) => Math.max(0, Math.round((x || 0) * f * k * (1 + gauss(rand) * sd)));
      // 每分钟最多 1.7 分（14 分钟最多 24 分，36 分钟最多 61 分）；勋章固定加的分（天选之子 +5）不受这个限制
      const capByMin = Math.round(M[mi] * 1.7) + (mods.pts || 0);
      mine = { pts: Math.min(v(p.pts, use, 0.22) * (mods.ptsMul || 1) + (mods.pts || 0), Math.round(pts * (mods.ptsMul > 1 ? 0.75 : 0.6)) + (mods.pts || 0), capByMin), reb: Math.round(v(p.reb, useReb, 0.3) * (mods.rebMul || 1)) + (mods.reb || 0), ast: v(p.ast, use, 0.3) + (mods.ast || 0), stl: v(p.stl, 1, 0.5) + (mods.stl || 0), blk: v(p.blk, 1, 0.5) + (mods.blk || 0), tov: v(p.tov || 1.5, use, 0.45) };
      // 传奇勋章翻倍（11-28）：在你这场本来的数据（上面各种上限之后）上翻倍。
      //   得分：多出来的分算进全队总分，队友的分不受影响；篮板、助攻：全队总数不变，从队友那份里挤（直播里每个助攻、篮板都要对得上进球和投丢）
      if (mods.ptsX2) { ptsExtra = mine.pts; mine.pts *= 2; }
      if (mods.rebX2) mine.reb *= 2;
      if (mods.astX2) mine.ast *= 2;
    }
    const Mo = mine ? M.map((m, i) => (i === mi ? 0 : m)) : M;
    const alloc = (key, total, power) => {
      const out = allocate(players, Mo, Math.max(0, total - (mine ? mine[key] : 0)), key, rand, power);
      if (mine) out[mi] = mine[key];
      return out;
    };
    const Pp = alloc('pts', pts + ptsExtra);
    const R = alloc('reb', Math.round(scale(44, 4) * (mods.rebMul || 1))); // rebMul：Boss「篮下统治」
    const A = alloc('ast', scale(25, 4));
    const St = alloc('stl', scale(7, 2), 1);
    const B = alloc('blk', scale(5, 2), 1);
    // 盖帽型隐藏能力：上场了就至少 1 帽（从队友那挪一个，没有就多记一个）
    players.forEach((p, i) => {
      if (!p.skill || p.skill.kind !== 'blk' || !M[i] || B[i]) return;
      const j = B.indexOf(Math.max(...B));
      if (B[j] > 0 && j !== i) B[j]--;
      B[i] = 1;
    });
    // 失误：全队 13 次左右，按各人的场均失误分（没有失误数据的老球员按得分、助攻估）；你的失误按你的场均（控球决定）
    const tovRows = players.map((p) => ({ tov: p.tov != null ? p.tov : 0.5 + 0.06 * (p.pts || 0) + 0.15 * (p.ast || 0) }));
    const Tv = allocate(tovRows, Mo, Math.max(0, scale(13, 3) - (mine ? mine.tov : 0)), 'tov', rand, 1);
    if (mine) Tv[mi] = mine.tov;
    return players.map((p, i) => ({
      name: p.name, pos: p.pos, me: !!p.isMe, skill: p.skill || null, starter: i < 5, min: M[i], pts: Pp[i], reb: R[i], ast: A[i], stl: St[i], blk: B[i], tov: Tv[i],
      // 两分、三分、罚球的命中 / 出手（units、s3 只给文字直播用，直播生成完就删掉）
      ...shootLine(p, Pp[i], M[i], rand, p.isMe && (mods.force3 || mods.force2) ? { c3: mods.force3 || 0, k2: mods.force2 || 0 } : null),
    }));
  }

  const short = (name) => {
    const parts = name.split('·');
    return parts.length > 1 ? parts[parts.length - 1] : name;
  };
  const pickFrom = (arr, rand) => arr[Math.floor(rand() * arr.length)];
  // 队名简称：以前「纽约尼克斯」→「尼克斯」；2026-11-26 起球队只用城市名，原样返回
  const SHORT = { 俄克拉荷马城: '俄城', 洛杉矶快艇: '快艇' }; // 小卡片上放不下的长名字
  const nick = (team) => SHORT[team] || team;

  // ---------- 虎扑式文字直播 ----------
  // 从技术统计倒推整场：每个进球、助攻、篮板、抢断、盖帽、罚球都和数据表对得上，比分逐条累加
  const CN_Q = ['一', '二', '三', '四'];
  const BIG = (r) => r.pos === 'C' || r.pos === 'PF';
  const SHOT3 = ['三分跳投命中', '三分命中', '三分跑投命中', '三分步退跳投命中', '底角三分命中', '三分急停跳投命中', '三分后撤步跳投命中'];
  const SHOT2_G = ['突破上篮命中', '两分跳投命中', '急停跳投命中', '突破抛投命中', '切入挑篮命中', '后仰跳投命中', '中投二分命中', '快攻上篮命中', '空切上篮命中', '两分背身跳投命中'];
  const SHOT2_B = ['完成两分扣篮', '篮下勾手命中', '补篮命中', '完成两分篮下', '突破扣篮命中', '两分背身跳投命中', '冲地灌篮命中', '翻身跳投命中', '快攻扣篮命中'];
  const ALLEY = ['空中接力扣篮命中', '空中接力暴扣命中'];
  const MISS3 = ['三分不中', '三分跳投不中', '底角三分偏出'];
  const MISS2 = ['跳投不中', '上篮不中', '突破抛投不中', '后仰跳投不中', '中投偏出', '勾手不中'];
  const FOULS = ['投篮犯规', '个人犯规', '打手犯规'];
  const TO = ['传球失误', '失误（丢球）', '传球失误', '失误（糟糕传球）'];
  const TECH = ['技术犯规（抱怨判罚）', '技术犯规（假摔）', '技术犯规（拖延比赛）'];

  const weighted = (list, w, rand) => {
    const sum = list.reduce((s, x) => s + w(x), 0);
    if (sum <= 0) return list[Math.floor(rand() * list.length)];
    let k = rand() * sum;
    for (const x of list) if ((k -= w(x)) <= 0) return x;
    return list[list.length - 1];
  };

  // extra.notes：被动技能的高光播报（不改比分，随机放进某一节）；extra.tail：第四节最后几十秒的固定事件（麦迪奇迹）
  function playByPlay(box, labels, rand, extra = {}) {
    const teamWord = (t) => (labels[t].endsWith('队') ? labels[t] : labels[t] + '队');
    const on = box.map((b) => b.filter((x) => x.min));
    const pickBy = (t, key, not) => weighted(on[t].filter((x) => x !== not), (x) => Math.max(x[key], 0.3) * x.min, rand);
    // 每一回合是一串事件（比如：犯规 → 两罚），先放进随机的一节
    const items = [];
    const put = (evs) => items.push({ q: 0, evs });
    const skillUsed = new Set();
    // 每个人的得分回合来自数据表（boxScore 的 shootLine）；投丢的球 m2 / m3 留给篮板、盖帽用，直播和数据表一一对得上
    for (const r of [...on[0], ...on[1]]) {
      if (!r.units) Object.assign(r, shootLine(r, r.pts, r.min, rand, null));
      r.m2 = r.fg2a - r.fg2m;
      r.m3 = r.fg3a - r.fg3m;
    }
    // 取一次投丢的球：从这一队还没用掉的投丢里按人数挑；用完了就给某人多记一次出手（数据表跟着变）
    const takeMiss = (side, not) => {
      const pool = on[side].filter((x) => x !== not && x.m2 + x.m3 > 0);
      if (pool.length) {
        const s = weighted(pool, (x) => x.m2 + x.m3, rand);
        const three = rand() * (s.m2 + s.m3) < s.m3;
        if (three) s.m3--; else s.m2--;
        return { s, three };
      }
      const s = weighted(on[side].filter((x) => x !== not), (x) => x.fg2a + x.fg3a + 0.5, rand);
      const three = rand() < s.s3;
      if (three) s.fg3a++; else s.fg2a++;
      return { s, three };
    };
    const missText = (s, three) => `${s.name}${pickFrom(three ? MISS3 : MISS2, rand)}`;
    for (let t = 0; t < 2; t++) {
      const o = 1 - t;
      const units = on[t].flatMap((r) => r.units.map((u) => ({ r, u })));
      // 助攻先分到进球上（11-28）：每个助攻对应一个别人投进的球，助攻多的人先挑。
      //   以前是每个进球按「剩下助攻 / 剩下进球」掷骰子，打完常常剩一两个助攻没地方放，数据表比直播多（老版本约四成场次）；
      //   魔术师助攻翻倍以后更明显。实在放不下的（极少）数据表跟着减，保证两边对得上
      const helperOf = new Map();
      const plain = units.filter((x) => x.u.k === 2 || x.u.k === 3);
      for (const h of on[t].filter((x) => x.ast > 0).sort((a, b) => b.ast - a.ast)) {
        const free = shuffle(plain.filter((x) => !helperOf.has(x) && x.r !== h), rand);
        const n = Math.min(h.ast, free.length);
        for (let i = 0; i < n; i++) helperOf.set(free[i], h);
        h.ast = n;
      }
      const cnt = { c3: 0, k2: 0 };
      for (const unit of units) {
        const { r, u } = unit;
        const ev = (text, pts = 0, bold = false, who = r) => ({ side: t, text, pts, bold, me: !!who.me });
        if (u.k === 'c3' || u.k === 'k2') {
          cnt[u.k]++;
          put([{ ...ev(u.k === 'c3' ? `${r.name}【三分之神】三分命中（第 ${cnt.c3} 记）` : `${r.name}【死神镰刀】中投命中（第 ${cnt.k2} 记）`, u.k === 'c3' ? 3 : 2, true), skill: true }]);
          continue;
        }
        if (u.k === 'ft') {
          if (u.tech) {
            const f = pickBy(o, 'pts');
            put([{ side: o, text: `${f.name}${pickFrom(TECH, rand)}`, me: !!f.me }, ev(`${r.name}技术犯规罚球命中（1罚1中）`, 1, true)]);
            continue;
          }
          const f = pickBy(o, 'reb');
          const foul = { side: o, text: `${f.name}${pickFrom(FOULS, rand)}（${r.name}造犯规）`, me: !!f.me };
          const made = u.ft.reduce((s, x) => s + x, 0);
          put([foul, ...u.ft.map((x, i) => ev(`${r.name}罚球第${i + 1}罚${x ? '命中' : '不中'}${i === u.ft.length - 1 ? `（${u.ft.length}罚${made}中）` : ''}`, x, !!x))]);
          continue;
        }
        const u3 = u.k;
        const helper = helperOf.get(unit) || null; // 这一球的助攻（上面先分好的）
        const desc = u3 === 3 ? pickFrom(SHOT3, rand) : helper && BIG(r) && rand() < 0.18 ? pickFrom(ALLEY, rand) : pickFrom(BIG(r) ? SHOT2_B : SHOT2_G, rand);
        // 隐藏能力的专属招式：传球型的助攻、得分型的进球，有一半以上会用专属说法
        // 每个隐藏能力第一次一定触发，之后一半多的概率
        const helperSkill = helper && helper.skill && helper.skill.kind === 'ast' && (!skillUsed.has(helper) || rand() < 0.6);
        if (helperSkill) skillUsed.add(helper);
        const tail = !helper ? '' : helperSkill ? helper.skill.text.replace('{n}', helper.name) : rand() < 0.75 ? `（${helper.name}助攻）` : ` (${helper.name}助攻)`;
        const mySkill = r.skill && r.skill.kind === u3 && (!skillUsed.has(r) || rand() < 0.55);
        if (mySkill) skillUsed.add(r);
        const text = mySkill ? r.skill.text.replace('{n}', r.name) + tail : `${r.name}${desc}${tail}`;
        const shot = { ...ev(text, u3, true), me: !!(r.me || (helper && helper.me)), skill: mySkill || helperSkill };
        // 2+1 / 3+1：进球同时造犯规，加罚命中
        if (u.and1) {
          const f = pickBy(o, 'reb');
          put([shot, { side: o, text: `${f.name}投篮犯规（${r.name}打成${u3 === 3 ? '四分打' : '2+1'}）`, me: !!f.me }, ev(`${r.name}加罚命中（1罚1中）`, 1, true)]);
        } else put([shot]);
      }
      // 抢断、盖帽（被盖的那一下算一次投丢）
      for (const r of on[t]) {
        for (let k = 0; k < r.stl; k++) { const v = pickBy(o, 'ast'); put([{ side: o, text: `${v.name}${pickFrom(TO, rand)}，${r.name}抢断`, me: !!(r.me || v.me) }]); }
        for (let k = 0; k < r.blk; k++) {
          const v = pickBy(o, 'pts');
          const b3 = !(v.m2 > 0) && v.m3 > 0;
          if (b3) v.m3--; else if (v.m2 > 0) v.m2--; else v.fg2a++;
          const sk = r.skill && r.skill.kind === 'blk' && (k === 0 || rand() < 0.6);
          const text = sk ? r.skill.text.replace('{v}', v.name).replace('{n}', r.name) : `${v.name}${b3 ? '三分出手' : pickFrom(['突破上篮', '篮下勾手', '跳投', '扣篮'], rand)}被${r.name}盖帽`;
          put([{ side: o, text, me: !!(r.me || v.me), skill: sk }]);
        }
      }
      for (let k = 0; k < 1 + Math.floor(rand() * 2); k++) put([{ side: t, text: pickFrom(['停摆（出界）', `${pickBy(t, 'min').name}走步违例`, `${pickBy(t, 'min').name}出界踏线`, `${pickBy(t, 'min').name}进攻犯规`], rand) }]);
    }
    // 篮板：大多数是防守篮板（对手投丢），少数是进攻篮板（自己投丢）；投丢的人和数据表对得上
    for (let t = 0; t < 2; t++) {
      const o = 1 - t;
      for (const r of on[t]) for (let k = 0; k < r.reb; k++) {
        const offense = rand() < 0.24;
        const ms = offense ? t : o;
        const { s, three } = takeMiss(ms, offense ? r : null);
        put([
          { side: ms, text: missText(s, three), me: !!s.me },
          { side: t, text: `${r.name}${offense ? '进攻' : '防守'}篮板`, me: !!r.me },
        ]);
      }
    }
    // 还没用掉的投丢：记成团队篮板（大多是对手的防守篮板）；太多了就少记几次出手，免得满屏团队篮板
    for (let t = 0; t < 2; t++) {
      const o = 1 - t;
      let left = on[t].reduce((s, x) => s + x.m2 + x.m3, 0);
      const cap = 3 + Math.floor(rand() * 3);
      for (; left > cap; left--) {
        const r = weighted(on[t].filter((x) => x.m2 + x.m3 > 0), (x) => x.m2 + x.m3, rand);
        if (rand() * (r.m2 + r.m3) < r.m3) { r.m3--; r.fg3a--; } else { r.m2--; r.fg2a--; }
      }
      for (const r of on[t]) {
        while (r.m2 + r.m3 > 0) {
          const three = rand() * (r.m2 + r.m3) < r.m3;
          if (three) r.m3--; else r.m2--;
          const def = rand() < 0.8;
          put([{ side: t, text: missText(r, three), me: !!r.me }, { side: def ? o : t, text: `${labels[def ? o : t]}${def ? '防守' : '进攻'}篮板` }]);
        }
      }
    }
    // 直播用的临时字段，不留在数据表里
    for (const r of box.flat()) { delete r.units; delete r.s3; delete r.m2; delete r.m3; }

    // 带 q 的播报固定放在那一节，其余随机放
    // pre：赛前播报（羁绊），放在开场两队首发介绍之后、第一节开始之前
    const preNotes = (extra.notes || []).filter((n) => n.pre);
    for (const n of (extra.notes || []).filter((x) => !x.pre)) items.push({ q: n.q != null ? n.q : Math.floor(rand() * 4), evs: [n], fixed: true });
    // 分到四节：每队的得分回合、其他回合分别打乱后轮流分配，每节比分不会太悬殊
    for (let t = 0; t < 2; t++) for (const scoring of [true, false]) {
      const group = shuffle(items.filter((x) => !x.fixed && x.evs.some((e) => e.side === t && e.pts) === scoring && x.evs[x.evs.length - 1].side === t), rand);
      const start = Math.floor(rand() * 4);
      group.forEach((x, i) => (x.q = (start + i) % 4));
    }
    // 换人：首发 / 首发和替补混合
    const lineup = (t, starters) => {
      const s = on[t].filter((x) => x.starter);
      const b = on[t].filter((x) => !x.starter).sort((a, c) => c.min - a.min);
      const five = starters ? s : [...s.sort(() => rand() - 0.5).slice(0, 2), ...b.slice(0, 3)];
      return { side: t, text: `${teamWord(t)}换人（${five.slice(0, 5).map((x) => x.name).join('、')}）`, me: five.some((x) => x.me) };
    };

    const events = [];
    const score = [0, 0];
    const quarters = [];
    const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    for (let q = 0; q < 4; q++) {
      const before = [...score];
      const list = items.filter((x) => x.q === q).sort(() => rand() - 0.5);
      const opening = [];
      if (q === 0) {
        opening.push(lineup(0, true), lineup(1, true), ...preNotes);
      } else if (q === 1) opening.push(lineup(0, false), lineup(1, false));
      else if (q === 2) opening.push(lineup(0, true), lineup(1, true));
      opening.push({ side: 0, text: `第${CN_Q[q]}节开始` });
      if (q === 0) {
        const c0 = on[0].find((x) => x.starter && x.pos === 'C') || on[0][0];
        const c1 = on[1].find((x) => x.starter && x.pos === 'C') || on[1][0];
        const g = on[0].find((x) => x.starter && x.pos === 'PG') || on[0][0];
        opening.push({ side: 0, text: `${short(c0.name)}对阵${short(c1.name)}（${short(g.name)}获得球权）`, me: !!(c0.me || g.me) });
      }
      for (const e of opening) events.push({ ...e, q: q + 1, clock: '12:00', score: [...score] });
      // 中间插一次换人、偶尔一次录像回放
      if (q === 0 || q === 3) list.splice(Math.floor(list.length * 0.55), 0, { evs: [lineup(0, false)] });
      if (rand() < 0.3) list.splice(Math.floor(rand() * list.length), 0, { evs: [{ side: Math.floor(rand() * 2), text: pickFrom(['即时回放（挑战：裁决推翻）', '即时回放（挑战：维持原判）', '即时回放（检查是否三分）'], rand) }] });
      const flat = list.flatMap((x) => x.evs);
      let run = [0, 0];
      let lastTimeout = -99;
      // 第四节有固定结尾（麦迪奇迹）：前面的事件压缩到最后 reserve 秒之前
      const reserve = q === 3 && extra.tail ? extra.tail.reserve : 0;
      flat.forEach((e, i) => {
        const clock = Math.max(1 + reserve, Math.round(reserve + (720 - reserve) * (1 - (i + 1) / (flat.length + 1)) + (rand() - 0.5) * 6));
        if (e.pts) {
          score[e.side] += e.pts;
          run[e.side] += e.pts;
          run[1 - e.side] = 0;
        }
        events.push({ ...e, q: q + 1, clock: fmt(clock), score: [...score] });
        // 对手一波 8-0：被打的一方叫暂停
        if (run[e.side] >= 8 && i - lastTimeout > 6) {
          events.push({ side: 1 - e.side, text: `${labels[1 - e.side]}请求暂停（对手打出一波 ${run[e.side]}-0）`, q: q + 1, clock: fmt(clock), score: [...score], pause: true });
          run = [0, 0];
          lastTimeout = i;
        }
      });
      if (reserve) {
        const ts = extra.tail.side || 0; // 谁落后、谁叫暂停（麦迪奇迹是你，乔丹最后一投是公牛）
        events.push({ side: ts, text: `${labels[ts]}请求暂停（还剩 ${reserve} 秒，落后 ${score[1 - ts] - score[ts]} 分）`, q: 4, clock: fmt(reserve), score: [...score], pause: true });
        for (const e of extra.tail.evs) { if (e.pts) score[e.side] += e.pts; events.push({ ...e, q: 4, score: [...score] }); }
      }
      events.push({ side: 0, text: q < 3 ? `第${CN_Q[q]}节结束` : '比赛结束', q: q + 1, clock: '0:00', score: [...score], end: true });
      quarters.push([score[0] - before[0], score[1] - before[1]]);
    }
    // 三分之神 / 死神镰刀的「第 N 记」按比赛先后重新编号
    const seq = { 三分之神: 0, 死神镰刀: 0 };
    for (const e of events) {
      const m = e.text && e.text.match(/【(三分之神|死神镰刀)】.*（第 \d+ 记）/);
      if (m) e.text = e.text.replace(/（第 \d+ 记）/, `（第 ${++seq[m[1]]} 记）`);
    }
    return { events, quarters };
  }

  const api = {
    MIN_PER_POS, rosterOk, canReplace, replaceTarget, signTarget, sameOnTeam, samePlayer, champOvr, LEGACY, PASSIVES, STARS, POOL_90, POOL_85, POOL_80, BENCH_POOL, LEVELS, GACHA_RATES, GACHA_POOL, CHEM_PER_WIN, CHEM_MAX, STARTER_W,
    POS, POS_LABEL, CHAMP_BOOST, MISSING_POS_PENALTY, BOND, bondBonus, bondPower, isBoss, bossOf, bossName, BOSSES, BOSS_SLOTS, OLD_NORMAL, RENAMED,
    chemistry, statSum, seasonOvr, avgOvr, teamPower, missingPositions, arrange, autoReplace, randomSupport, gacha, limitGachaPool, simulate, shuffle, short, rng, nick, playByPlay, shotProfile,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
