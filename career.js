// 生涯模式：11 项能力值（每项对应一项比赛数据）（参考虎扑「我创造的完美球员」）、拼出自己的球员、加入明星的球队、
// 第一个赛季文字模拟（26-27 赛季，必定夺冠）、之后进入 30 关传奇挑战，打得好就成长。
// 所有数值都是游戏数值。
(function (root) {
  const IS_NODE = typeof module === 'object' && module.exports;
  const E = IS_NODE ? require('./engine.js') : root.Engine;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r0 = (v) => Math.round(v);

  // ================= 11 项能力：每项都对应一项比赛数据 =================
  // 得分 ← 3分、2分；命中率 ← 终结；篮板 ← 篮板、力量；助攻 ← 传球；抢断 ← 运动、外防；盖帽 ← 弹跳、内防；失误 ← 控球
  const ATTRS = ['3分', '2分', '终结', '控球', '传球', '外防', '内防', '篮板', '力量', '运动', '弹跳'];
  // 字母等级：97 以上是 S（只有招牌球星的招牌能力能到），然后 A+ 94、A 90、A- 86、B+ 80、B 75、B- 70、C+ 65、C 60、C- 55，再往下 D
  function grade(v) {
    return v >= 97 ? 'S' : v >= 94 ? 'A+' : v >= 90 ? 'A' : v >= 86 ? 'A-' : v >= 80 ? 'B+' : v >= 75 ? 'B' : v >= 70 ? 'B-' : v >= 65 ? 'C+' : v >= 60 ? 'C' : v >= 55 ? 'C-' : 'D';
  }
  const gradeClass = (g) => (g === 'S' ? 'gs' : g[0] === 'A' ? 'ga' : g[0] === 'B' ? 'gb' : g[0] === 'C' ? 'gc' : 'gd');

  // 各位置「总评 75 的球员」的能力轮廓（2K 式）：本位置的核心能力 70~80，不是本位置的活 45~60
  const POS_BASE = {
    PG: { '3分': 74, '2分': 72, 终结: 68, 控球: 80, 传球: 78, 外防: 70, 内防: 45, 篮板: 50, 力量: 50, 运动: 78, 弹跳: 62 },
    SG: { '3分': 76, '2分': 74, 终结: 70, 控球: 72, 传球: 66, 外防: 72, 内防: 48, 篮板: 54, 力量: 55, 运动: 76, 弹跳: 66 },
    SF: { '3分': 71, '2分': 72, 终结: 72, 控球: 66, 传球: 62, 外防: 72, 内防: 60, 篮板: 62, 力量: 64, 运动: 74, 弹跳: 68 },
    PF: { '3分': 64, '2分': 70, 终结: 75, 控球: 56, 传球: 58, 外防: 62, 内防: 72, 篮板: 72, 力量: 75, 运动: 70, 弹跳: 72 },
    C: { '3分': 50, '2分': 66, 终结: 78, 控球: 46, 传球: 56, 外防: 52, 内防: 78, 篮板: 78, 力量: 82, 运动: 64, 弹跳: 74 },
  };
  // 各位置每 36 分钟的平均数据和平均命中率：比这个好，对应能力就往上加
  const NORM36 = {
    PG: { pts: 17, tpm: 2.2, reb: 4.5, ast: 7, stl: 1.3, blk: 0.3, tov: 2.8, fg: 45, tp: 36 },
    SG: { pts: 17, tpm: 2.4, reb: 5, ast: 4, stl: 1.3, blk: 0.4, tov: 2.0, fg: 45, tp: 36 },
    SF: { pts: 16, tpm: 1.8, reb: 6.5, ast: 3.5, stl: 1.2, blk: 0.6, tov: 1.8, fg: 46, tp: 35 },
    PF: { pts: 16, tpm: 1.2, reb: 8.5, ast: 3, stl: 1.0, blk: 1.0, tov: 1.7, fg: 50, tp: 34 },
    C: { pts: 15, tpm: 0.5, reb: 11, ast: 3, stl: 0.9, blk: 1.6, tov: 2.0, fg: 57, tp: 30 },
  };
  const SIG_MIN = 96; // 96~100 只留给招牌能力，普通球员按数据算最高 95
  // 招牌能力（2K 式）：招牌球星的招牌能力 96~100；其余按数据推算
  const SIGNATURE = {
    // 文班亚马按用户给的标准：3分 80、2分 95、终结 96、篮板 98、力量 90、传球 75、运动 98、外防 75、弹跳 99、内防 100
    '维克托·文班亚马': { '3分': 80, '2分': 95, 终结: 96, 篮板: 98, 力量: 90, 传球: 75, 运动: 98, 外防: 75, 弹跳: 99, 内防: 100, 控球: 76 },
    '斯蒂芬·库里': { '3分': 100, '2分': 94, 控球: 95, 传球: 88, 终结: 90, 运动: 92, 力量: 50, 弹跳: 55 },
    '卢卡·东契奇': { 终结: 99, 传球: 97, 控球: 96, '2分': 95, '3分': 88, 运动: 70, 力量: 80, 弹跳: 60 },
    '谢伊·吉尔杰斯-亚历山大': { '2分': 100, 终结: 96, 控球: 95, 外防: 88, 运动: 92 },
    '尼古拉·约基奇': { 传球: 100, 篮板: 98, '2分': 92, 终结: 97, 运动: 55, 力量: 92, 弹跳: 55, '3分': 82 },
    '扬尼斯·阿德托昆博': { 终结: 98, 力量: 98, 运动: 97, 弹跳: 96, 篮板: 94, '3分': 55, '2分': 70, 外防: 85, 内防: 90 },
    '凯文·杜兰特': { '2分': 100, '3分': 92, 终结: 92 },
    '贾·莫兰特': { 弹跳: 98, 运动: 96, 终结: 93, 控球: 92 },
    '德里克·怀特': { 外防: 97, '3分': 86, 弹跳: 74 },
    '泰雷斯·哈利伯顿': { 传球: 98, '3分': 88, 控球: 92 },
    '德文·布克': { '2分': 97, '3分': 88 },
    '鲁迪·戈贝尔': { 内防: 98, 弹跳: 92, 篮板: 96, '3分': 30 },
    '切特·霍姆格伦': { 内防: 95, 弹跳: 92 },
    '亚历克斯·卡鲁索': { 外防: 96 },
    '朱·霍勒迪': { 外防: 95 },
    '杰森·塔图姆': { '3分': 87, '2分': 90, 外防: 86 },
    '泰瑞斯·马克西': { 运动: 97, '3分': 88, 控球: 91, 终结: 88 },
    '阿尔佩伦·申京': { 传球: 87, 力量: 89, 终结: 91, 篮板: 91, '3分': 55 },
    '勒布朗·詹姆斯': { 力量: 95, 传球: 96, 运动: 88, 终结: 95, 弹跳: 85 },
    '乔尔·恩比德': { 力量: 96, '2分': 93, 终结: 94, 内防: 90 },
    '安东尼·爱德华兹': { 弹跳: 98, 运动: 97, '3分': 87 },
    '锡安·威廉森': { 力量: 99, 弹跳: 96, 终结: 97, '3分': 45 },
    '安东尼·戴维斯': { 内防: 95, 弹跳: 92, 篮板: 91 },
    '戴森·丹尼尔斯': { 外防: 98 },
    '特雷·杨': { 传球: 97, '3分': 88, 控球: 93, 外防: 50, 力量: 40 },
    '詹姆斯·哈登': { 控球: 94, 传球: 94, '3分': 87, 运动: 66 },
    '杰伦·布伦森': { '2分': 95, 控球: 91 },
    '约什·哈特': { 篮板: 89, 外防: 82 },
    '伊维察·祖巴茨': { 篮板: 92, 内防: 87, '3分': 30 },
    '小贾伦·杰克逊': { 内防: 95, 弹跳: 90 },
    '埃文·莫布里': { 内防: 95, 弹跳: 90 },
    '卡尔-安东尼·唐斯': { '3分': 90, '2分': 90, 篮板: 93 },
    '多曼塔斯·萨博尼斯': { 篮板: 97, 传球: 90, 运动: 58 },
    '德阿龙·福克斯': { 运动: 97, 终结: 90 },
    '拉梅洛·鲍尔': { 传球: 93, '3分': 85, 控球: 91 },
    '多诺万·米切尔': { 弹跳: 94, 运动: 92, '2分': 90 },
    '凯德·坎宁安': { 传球: 92, 控球: 91 },
    '杨瀚森': { 传球: 82, 内防: 78 },
    '凯里·欧文': { 控球: 99, 终结: 96, '2分': 94 },
    '科怀·伦纳德': { 外防: 97, '2分': 96 },
    // 传奇（冠军关卡、10 连抽里的历史球员）
    '迈克尔·乔丹': { '2分': 99, 终结: 97, 弹跳: 97, 运动: 98, 外防: 97 },
    '沙奎尔·奥尼尔': { 力量: 100, 终结: 99, 弹跳: 92, 篮板: 96, '3分': 25, '2分': 55 },
    '科比·布莱恩特': { '2分': 99, 外防: 92, 控球: 92 },
    '拉里·伯德': { '3分': 95, '2分': 96, 传球: 93 },
    '魔术师约翰逊': { 传球: 100, 控球: 94 },
    '蒂姆·邓肯': { 内防: 97, 篮板: 95, '2分': 90 },
    '哈基姆·奥拉朱旺': { 内防: 99, 弹跳: 96, 终结: 97, 运动: 88 },
    '丹尼斯·罗德曼': { 篮板: 100, 外防: 94, 内防: 92, '3分': 35 },
    '雷·阿伦': { '3分': 98, '2分': 94 },
    '德克·诺维茨基': { '2分': 99, '3分': 91 },
    '克莱·汤普森': { '3分': 96, 外防: 88 },
    '德维恩·韦德': { 终结: 96, 弹跳: 95, 运动: 95 },
    '凯文·加内特': { 内防: 96, '2分': 90, 篮板: 93 },
    '本·华莱士': { 内防: 98, 弹跳: 94, 篮板: 96, 力量: 95 },
    '斯科蒂·皮蓬': { 外防: 98, 传球: 88, 运动: 94 },
    '德雷蒙德·格林': { 传球: 89, 内防: 92, 外防: 90 },
  };
  const memo = new Map();
  // 真实球员的能力：位置轮廓 + 总评（核心能力涨得快）+ 每 36 分钟数据修正 + 招牌能力
  function attrsOf(p) {
    if (p.attrs) return p.attrs;
    const key = `${p.name}|${p.season}|${p.ovr}`;
    if (memo.has(key)) return memo.get(key);
    const pos = POS_BASE[p.pos] ? p.pos : 'SF';
    const b = POS_BASE[pos], w = WEIGHTS[pos], n = NORM36[pos];
    // 换成每 36 分钟：打得少的只放大一部分（36/分钟 的 0.6 次方），免得替补 8 分钟拿 2 个帽就成了盖帽王
    const f = Math.pow(36 / Math.max(12, p.min || 30), 0.6);
    // 本季场次少的，数据只信一部分
    const rel = p.season === '本季' && p.gp != null ? p.gp / (p.gp + 4) : 1;
    const v36 = (x) => (x || 0) * f;
    const dv = (x, norm) => (v36(x) - norm) * rel;
    const pts = dv(p.pts, n.pts), reb = dv(p.reb, n.reb), ast = dv(p.ast, n.ast), stl = dv(p.stl, n.stl), blk = dv(p.blk, n.blk);
    // 3 分：投进多少 + 三分命中率（三分出手太少的不看命中率）；老球员没有三分命中数，只看命中率
    const tpm = p.tpm != null ? dv(p.tpm, n.tpm) : 0;
    const tpPct = p.tp != null && (p.tpa == null || p.tpa >= 1) ? (p.tp - n.tp) * rel : 0;
    // 2 分：总得分去掉三分的部分（没有三分命中数就按总得分算）
    const pts2 = p.tpm != null ? dv(p.pts - 3 * p.tpm, n.pts - 3 * n.tpm) : pts * 0.8;
    // 终结：投篮命中率 + 得分量
    const fgPct = p.fg != null ? (p.fg - n.fg) * rel : 0;
    // 控球：同样多的出手和组织（球权），失误越少越好
    const usage = (v36(p.pts) + 2 * v36(p.ast)) / (n.pts + 2 * n.ast);
    const tov = p.tov != null ? (v36(p.tov) - n.tov * usage) * rel : 0;
    const lim = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const lift = (k) => (p.ovr - 75) * (w[k] >= 8 ? 0.9 : 0.55); // 本位置核心能力（权重 ≥8）随总评涨得快
    const a = {
      '3分': lift('3分') + lim(tpm * 5 + tpPct * 0.5, -12, 14),
      '2分': lift('2分') + lim(pts2 * 1.0, -10, 14),
      终结: lift('终结') + lim(fgPct * 0.9 + pts * 0.3, -12, 14),
      控球: lift('控球') + lim(ast * 1.2 - tov * 4, -12, 12),
      传球: lift('传球') + lim(ast * 3.2, -14, 16),
      外防: lift('外防') + lim(stl * 8, -10, 12),
      运动: lift('运动') + lim(stl * 5 + blk * 1.5 + pts * 0.2, -8, 10),
      内防: lift('内防') + lim(blk * 5 + reb * 0.6, -10, 14),
      弹跳: lift('弹跳') + lim(blk * 6 + reb * 0.8, -10, 14),
      篮板: lift('篮板') + lim(reb * 2.6, -12, 16),
      力量: lift('力量') + lim(reb * 1.2, -8, 10),
    };
    const sig = SIGNATURE[p.name] || {};
    for (const k of ATTRS) a[k] = r0(sig[k] != null ? sig[k] : clamp(b[k] + a[k], 25, SIG_MIN - 1));
    memo.set(key, a);
    return a;
  }
  // 按位置加权算总评
  const WEIGHTS = {
    PG: { '3分': 14, '2分': 11, 终结: 9, 控球: 15, 传球: 17, 外防: 10, 内防: 2, 篮板: 3, 力量: 3, 运动: 12, 弹跳: 4 },
    SG: { '3分': 17, '2分': 14, 终结: 11, 控球: 11, 传球: 8, 外防: 12, 内防: 3, 篮板: 4, 力量: 4, 运动: 11, 弹跳: 5 },
    SF: { '3分': 12, '2分': 12, 终结: 12, 控球: 8, 传球: 7, 外防: 12, 内防: 7, 篮板: 8, 力量: 6, 运动: 9, 弹跳: 7 },
    PF: { '3分': 7, '2分': 9, 终结: 13, 控球: 4, 传球: 6, 外防: 8, 内防: 13, 篮板: 13, 力量: 11, 运动: 7, 弹跳: 9 },
    C: { '3分': 3, '2分': 6, 终结: 14, 控球: 2, 传球: 6, 外防: 5, 内防: 17, 篮板: 16, 力量: 13, 运动: 6, 弹跳: 12 },
  };
  // 按能力加权后再补一个偏移，让算出来的总评和球员原本的总评对得上：下面联盟名单载入后按全联盟球员自动校准
  const OVR_OFFSET = { PG: 5, SG: 5, SF: 5, PF: 5, C: 5 };
  // 你的总评最高 100（2026-11-19 用户要求「能力值有个上限，数据很牛但不要太超标」，以前是 105）
  //   单项能力：加点最高 100，对应那项的普通勋章再 +2（最高 102）；总评 100 ≈ 场均 40 分 10 板 10 助 3 断 3 帽
  //   羁绊另算：比赛里首发同队 3/4/5 人再各 +3/+4/+5，所以比赛里最高 105
  const OVR_MAX = 100;
  function ovrFromAttrs(a, pos) {
    const w = WEIGHTS[pos];
    let s = 0, t = 0;
    for (const k of ATTRS) { s += a[k] * w[k]; t += w[k]; }
    return r0(clamp(s / t + OVR_OFFSET[pos], 40, OVR_MAX));
  }
  // 跨位置衰减：后卫借内线的能力（终结、内防、篮板、力量、弹跳）、内线借后卫的能力（3分、控球、传球、外防、运动）会打折
  const BIG = ['终结', '内防', '篮板', '力量', '弹跳'];
  const SMALL = ['3分', '控球', '传球', '外防', '运动'];
  function decay(myPos, srcPos, attr) {
    const d = E.POS.indexOf(srcPos) - E.POS.indexOf(myPos);
    if (d > 0 && BIG.includes(attr)) return d * 3; // 从更高大的位置借
    if (d < 0 && SMALL.includes(attr)) return -d * 3; // 从更矮小的位置借
    return 0;
  }
  const ROOKIE = 0; // 能力值不打折（新秀赛季改成数据打九折，见 simulateSeason）
  const ROOKIE_SEASON = 0.9; // 新秀赛季（文字模拟）常规赛数据打九折
  const ROOKIE_PLAYOFF = 0.75; // 季后赛再少一些：七五折（季后赛明星接管，FMVP 也是他的）
  // 你捏的新秀：每项 = 借来的能力 - 跨位置衰减，再和「位置保底」取高的
  // 保底按这项能力对你位置的重要程度：核心能力最低 68（C+），不是本位置的活最低 55（C-），所以新秀不会出现 D
  function rookieFloor(pos, k) {
    const w = WEIGHTS[pos], max = Math.max(...Object.values(w));
    return r0(55 + 13 * (w[k] / max));
  }
  function makeRookie(pos, locked) {
    const attrs = Object.fromEntries(ATTRS.map((k) => {
      const l = locked[k];
      if (l.hidden) return [k, l.v]; // 隐藏能力直接锁定
      return [k, Math.max(rookieFloor(pos, k), Math.min(100, l.v) - ROOKIE)];
    }));
    return { attrs, ovr: ovrFromAttrs(attrs, pos) };
  }

  // ================= 现役联盟：2026-27 赛季 30 支球队完整阵容（league.js，数据来自虎扑） =================
  const LEAGUE = IS_NODE ? require('./league.js') : root.LEAGUE;
  // 球队一律只用城市名（队名、队徽是 NBA 的注册商标，2026-11-26 用户定：避开版权风险）。
  // 洛杉矶两支队：湖人叫「洛杉矶」，快船暂时叫「洛杉矶快艇」（用户 11-26 定）
  const TEAM_CN = { ATL: '亚特兰大', BOS: '波士顿', BKN: '布鲁克林', CHA: '夏洛特', CHI: '芝加哥', CLE: '克利夫兰', DAL: '达拉斯', DEN: '丹佛', DET: '底特律', GSW: '金州', HOU: '休斯顿', IND: '印第安纳', LAC: '洛杉矶快艇', LAL: '洛杉矶', MEM: '孟菲斯', MIA: '迈阿密', MIL: '密尔沃基', MIN: '明尼苏达', NOP: '新奥尔良', NYK: '纽约', OKC: '俄克拉荷马城', ORL: '奥兰多', PHI: '费城', PHX: '菲尼克斯', POR: '波特兰', SAC: '萨克拉门托', SAS: '圣安东尼奥', TOR: '多伦多', UTA: '犹他', WAS: '华盛顿' };
  const CITY = TEAM_CN; // 以前是「城市 + 队名」全称，现在和 TEAM_CN 一样
  const WEST = ['DAL', 'DEN', 'GSW', 'HOU', 'LAC', 'LAL', 'MEM', 'MIN', 'NOP', 'OKC', 'PHX', 'POR', 'SAC', 'SAS', 'UTA'];
  const nameKey = (n) => n.replace(/[-·・\s]/g, '');
  // 开局能选的 13 位超级明星（中场投篮时主持人问你最喜欢谁）：评分全部 95+，东契奇和文班最高 100
  // 场均、照片、球队、号码用虎扑数据，评分按这里
  // 前 9 位是开局能选的（按用户定的分数从高到低），后 6 位只保留 95 的评分，不在选人页出现
  const SUPER_OVR = [
    ['卢卡·东契奇', 100], ['维克托·文班亚马', 100], ['谢伊·吉尔杰斯-亚历山大', 99], ['扬尼斯·阿德托昆博', 99],
    ['尼古拉·约基奇', 98], ['安东尼·爱德华兹', 98], ['勒布朗·詹姆斯', 97], ['凯文·杜兰特', 97], ['斯蒂芬·库里', 97],
    ['杰森·塔图姆', 95], ['凯里·欧文', 95], ['凯德·坎宁安', 95], ['杰伦·布伦森', 95], ['詹姆斯·哈登', 95], ['科怀·伦纳德', 95],
    ['泰瑞斯·马克西', 95], ['阿尔佩伦·申京', 95],
  ];
  const PICK_COUNT = 9;
  const leagueAll = Object.entries(LEAGUE.teams).flatMap(([code, list]) => list.map((p) => ({ ...p, team: code })));
  const SUPERSTARS = SUPER_OVR.map(([name, ovr]) => {
    const p = leagueAll.find((x) => nameKey(x.name) === nameKey(name));
    const old = E.STARS.find((x) => nameKey(x.name) === nameKey(name));
    return { ...(old || {}), ...p, name, ovr, from: '现役', season: '本季', superstar: true };
  }).filter((p) => p.team);
  // 开局选人页：只放前 9 位（东契奇 … 爱德华兹），分数从高到低
  const PICK_STARS = SUPERSTARS.filter((s) => SUPER_OVR.slice(0, PICK_COUNT).some(([n]) => n === s.name)).sort((a, b) => b.ovr - a.ovr);
  const STAR_BY_KEY = new Map([...E.STARS, ...SUPERSTARS].map((s) => [nameKey(s.name), s]));
  // 联盟里的球员：明星用游戏里的版本（MVP 榜保底评分），其余用虎扑数据
  // 金卡球员：最强的 20 位非超级明星，评分提到 90-92（抽卡翻到会闪金光）
  const GOLD_OVR = new Map([
    ['卡尔-安东尼·唐斯', 92], ['乔尔·恩比德', 92], ['贾马尔·穆雷', 91], ['安东尼·戴维斯', 91], ['多诺万·米切尔', 91], ['库珀·弗拉格', 91], ['德文·布克', 91],
    ['杰伦·约翰逊', 90], ['保罗·班凯罗', 90], ['斯科蒂·巴恩斯', 90], ['杰伦·布朗', 90], ['泰雷斯·哈利伯顿', 90],
    ['小达里厄斯·阿卡夫', 90], ['德尼·阿夫迪亚', 90], ['弗朗茨·瓦格纳', 90], ['帕斯卡尔·西亚卡姆', 90],
    ['巴姆·阿德巴约', 90], ['多曼塔斯·萨博尼斯', 90], ['奥斯汀·里夫斯', 90], ['杰伦·杜伦', 90],
  ].map(([n, o]) => [nameKey(n), o]));
  // 其余球员的评分：按综合产量排名，映射到 62-89 的曲线（类似 2K：顶尖的少，中间的多）
  // 综合产量 = 得分 + 0.7 篮板 + 1.2 助攻 + 1.5 抢断 + 1.2 盖帽；本季场次少的往「普通轮换球员」拉，免得打 1 场就 80
  const prod = (p) => p.pts + 0.7 * p.reb + 1.2 * p.ast + 1.5 * p.stl + 1.2 * p.blk;
  const scoreOf = (p) => {
    if (p.season === '新秀') return 2;
    if (p.season === '本季') { const w = (p.gp || 0) / ((p.gp || 0) + 6); return w * prod(p) + (1 - w) * 9; }
    return prod(p) * 0.85; // 本季几乎没上场（伤病等），看往季，打个折
  };
  const pinned = (n) => STAR_BY_KEY.has(nameKey(n)) || GOLD_OVR.has(nameKey(n));
  const RATED = new Map();
  {
    const rest = Object.values(LEAGUE.teams).flat().filter((p) => !pinned(p.name)).sort((a, b) => scoreOf(b) - scoreOf(a));
    rest.forEach((p, i) => RATED.set(nameKey(p.name), Math.round(62 + 27 * Math.pow(1 - i / (rest.length - 1), 2))));
  }
  const rosterOf = (code) => (LEAGUE.teams[code] || []).map((p) => {
    const s = STAR_BY_KEY.get(nameKey(p.name));
    const q = s ? { ...s, team: code, num: p.num } : p;
    const g = GOLD_OVR.get(nameKey(p.name));
    if (g) return { ...q, ovr: Math.max(q.ovr, g) };
    const r = RATED.get(nameKey(p.name));
    return r ? { ...q, ovr: r } : q;
  }).sort((a, b) => b.ovr - a.ovr);
  // 总评校准：全联盟（本季打了 5 场以上的）球员「能力加权平均」和他们总评的差，按位置取平均当偏移。
  // 这样你捏出来的球员，总评和真实球员是同一把尺子
  {
    const sum = {}, cnt = {};
    for (const code of Object.keys(LEAGUE.teams)) for (const p of rosterOf(code)) {
      if (!WEIGHTS[p.pos] || p.season !== '本季' || (p.gp || 0) < 5) continue;
      const a = attrsOf(p), w = WEIGHTS[p.pos];
      let s = 0, t = 0;
      for (const k of ATTRS) { s += a[k] * w[k]; t += w[k]; }
      sum[p.pos] = (sum[p.pos] || 0) + p.ovr - s / t;
      cnt[p.pos] = (cnt[p.pos] || 0) + 1;
    }
    for (const pos of Object.keys(OVR_OFFSET)) if (cnt[pos]) OVR_OFFSET[pos] = Math.round((sum[pos] / cnt[pos]) * 10) / 10;
  }
  const teamOfName = (name) => Object.keys(LEAGUE.teams).find((c) => LEAGUE.teams[c].some((p) => nameKey(p.name) === nameKey(name)));
  function teamOfStar(star) {
    const team = teamOfName(star.name);
    return { team, city: CITY[team] || '', cn: TEAM_CN[team] || '' };
  }
  // 加入明星的球队：明星 + 3 名首发队友（按位置挑本队最强的，保底 80）+ 7 名本队替补
  function joinRoster(star, myPos) {
    const team = teamOfName(star.name);
    const roster = rosterOf(team).filter((p) => nameKey(p.name) !== nameKey(star.name)).sort((a, b) => b.ovr - a.ovr);
    const need = E.POS.filter((p) => p !== myPos && p !== star.pos);
    // 从本队最强的 6 人里挑 3 个填空位：总评高优先，打不熟的位置每差一格扣 4 分
    const cand = roster.slice(0, 6);
    let best = null;
    for (const a of cand) for (const b of cand) for (const c of cand) {
      if (a === b || a === c || b === c) continue;
      const trio = [a, b, c];
      const score = trio.reduce((s, p, i) => s + p.ovr - 4 * Math.abs(E.POS.indexOf(p.pos) - E.POS.indexOf(need[i])), 0);
      if (!best || score > best.score) best = { score, trio };
    }
    const mates = best.trio.map((m, i) => {
      roster.splice(roster.indexOf(m), 1);
      return { ...m, pos: need[i], ovr: Math.max(80, m.ovr), team };
    });
    return { team, mates, bench: roster.slice(0, 7).map((b) => ({ ...b, team })) };
  }
  // 抽卡组首发：明星固定在自己的位置；其余 4 个位置各抽 1 张卡（全联盟同位置、总评 80-92），位置不重复。
  // 玩家默认替补；替补席再自动补 6 人（本队总评 ≤80 的随机，不够从联盟补）
  const DRAW_RANGE = [80, 92];
  const BENCH_MAX = 80;
  const BENCH_MIN = 65;
  const LEGEND_RATE = 0.05; // 每张卡 5% 翻出传奇卡
  // 传奇卡：本赛季 95+ 的现役超级明星（开局队友必须是本赛季的，不出历史球员）
  const LEGENDS = SUPERSTARS.filter((p) => p.ovr >= 95).map((p) => ({ ...p, from: '现役', season: '本季', legendYear: '2026-27', legendTeam: CITY[p.team] || '' }));
  const cardRank = (ovr) => (ovr >= 95 ? 'legend' : ovr >= 90 ? 'gold' : 'normal');
  function drawMates(star, me, rand = Math.random, legendRate = LEGEND_RATE) {
    const team = teamOfName(star.name);
    const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const used = new Set([nameKey(star.name)]);
    const pool = Object.keys(LEAGUE.teams).filter((c) => c !== team).flatMap((c) => rosterOf(c).map((p) => ({ ...p, from: '现役' })));
    const [lo, hi] = DRAW_RANGE;
    const cards = E.POS.filter((p) => p !== star.pos).map((pos) => {
      // 小概率翻出传奇卡：同位置的本赛季现役超级明星（比如 2026-27 杜兰特），同位置没有就照常抽普通卡
      if (rand() < legendRate) {
        const legends = LEGENDS.filter((p) => p.pos === pos && !used.has(nameKey(p.name)));
        if (legends.length) {
          const pick = legends[Math.floor(rand() * legends.length)];
          used.add(nameKey(pick.name));
          return { pos, rank: 'legend', legend: true, player: { ...pick, pos, team, realTeam: pick.team } };
        }
      }
      const ok = (p) => p.ovr >= lo && p.ovr <= hi && !used.has(nameKey(p.name));
      // 同位置没有合适的人，就从这个分数段里随便抽一个，打这个位置
      let list = pool.filter((p) => ok(p) && p.pos === pos);
      if (!list.length) list = pool.filter(ok);
      const pick = list[Math.floor(rand() * list.length)];
      used.add(nameKey(pick.name));
      return { pos, rank: cardRank(pick.ovr), player: { ...pick, pos, team, realTeam: pick.team } };
    });
    const starters = [star, ...cards.map((c) => c.player)].sort((a, b) => E.POS.indexOf(a.pos) - E.POS.indexOf(b.pos));
    // 替补 6 人：全联盟随机，只要本赛季上过场的球员（不要往季数据的伤病球员），总评 65~80（不要 62 分的凑数球员）；
    // 先 5 个位置各 1 人，再随机补 1 人
    const benchPool = shuffle(Object.keys(LEAGUE.teams).flatMap((c) => rosterOf(c))
      .filter((p) => p.season === '本季' && p.ovr <= BENCH_MAX && p.ovr >= BENCH_MIN && !used.has(nameKey(p.name))));
    const bench = [];
    const take = (p) => { used.add(nameKey(p.name)); bench.push({ ...p, from: '现役', team }); };
    for (const pos of E.POS) { const p = benchPool.find((x) => x.pos === pos && !used.has(nameKey(x.name))); if (p) take(p); }
    for (const p of benchPool) { if (bench.length >= 6) break; if (!used.has(nameKey(p.name))) take(p); }
    bench.sort((a, b) => E.POS.indexOf(a.pos) - E.POS.indexOf(b.pos));
    return { team, cards, starters, bench, roster: [...starters, me, ...bench] };
  }
  // 拼能力用的球队：30 支，每队全部球员
  function buildTeams() {
    return Object.keys(LEAGUE.teams).map((code) => ({ code, list: rosterOf(code) }));
  }
  // 球队强弱（前 8 人综评均值），用来排季后赛对手
  const teamStrength = (code) => { const r = rosterOf(code).slice(0, 8); return r.reduce((s, p) => s + p.ovr, 0) / r.length; };
  // ================= 你的数据：总评决定场均（总评 80 ≈ 10 分 3 板 3 助） =================
  // 每项数据由对应的能力决定：得分 ← 2分、3分（命中率 ← 终结）；篮板 ← 篮板、力量；助攻 ← 传球；
  // 抢断 ← 运动、外防；盖帽 ← 弹跳、内防；失误 ← 控球
  function projectLine(me) {
    const a = me.attrs;
    const o = me.ovr;
    const shoot = 0.4 * a['2分'] + 0.35 * a['3分'] + 0.25 * a.终结;
    const rebA = 0.7 * a.篮板 + 0.3 * a.力量;
    const stlA = 0.5 * a.运动 + 0.5 * a.外防;
    const blkA = 0.5 * a.弹跳 + 0.5 * a.内防;
    // 总评 65 ≈ 4 分，80 ≈ 10 分，85 ≈ 15 分，90 ≈ 20 分；得分能力比总评高就多得
    let pts = 3 + (Math.max(o, 55) - 62) * 0.4 + Math.max(0, o - 80) * 0.55;
    pts = Math.max(2, pts * (1 + (shoot - o) / 100));
    const rebBase = { PG: 2.4, SG: 2.8, SF: 3.2, PF: 4.6, C: 5.6 }[me.pos];
    const astBase = { PG: 4.4, SG: 3.2, SF: 2.8, PF: 2.1, C: 1.7 }[me.pos];
    const scale = Math.max(0.45, 1 + (o - 80) * 0.05);
    const reb = rebBase * scale * Math.max(0.5, 1 + (rebA - o) / 60);
    const ast = astBase * scale * Math.max(0.5, 1 + (a.传球 - o) / 60);
    const stl = 0.4 + Math.max(0, stlA - 55) * 0.025;
    const blk = 0.15 + Math.max(0, blkA - 55) * 0.035;
    // 总评 90 以上开始「超神」：到 100 大约 40 分 10 板 10 助 3 断 3 帽，105 继续往上；
    // 但长板短板照样体现：哪项能力比总评高，那项数据就冲得更高，反之更低
    const t = Math.max(0, (o - 90) / 10);
    const fit = (attr) => clamp(attr / o, 0.6, 1.25);
    const up = (v, target) => (t > 0 ? v + (target - v) * t : v);
    const r1 = (x) => Math.max(0.1, Math.round(x * 10) / 10);
    // 得分：90→100 从普通算法过渡到 40 ×（得分能力 / 总评）；100 以上每 +1 总评再 +2 分
    const P40 = 40 * fit(shoot);
    const P = t <= 0 ? pts : t <= 1 ? pts + (P40 - pts) * t : P40 + (o - 100) * 2;
    const line = { pts: r1(P), reb: r1(up(reb, 10 * fit(rebA))), ast: r1(up(ast, 10 * fit(a.传球))), stl: r1(up(stl, 3 * fit(stlA))), blk: r1(up(blk, 3 * fit(blkA))) };
    // 失误：拿球越多越容易失误，控球越好失误越少
    line.tov = r1((0.6 + 0.07 * line.pts + 0.15 * line.ast) * clamp(1.6 - a.控球 / 100, 0.55, 1.3));
    // 命中率：终结决定投篮命中率（内线基础高），3分决定三分命中率
    line.fg = r1({ PG: 43, SG: 43, SF: 45, PF: 48, C: 54 }[me.pos] + (a.终结 - 75) * 0.3);
    line.tp = r1(30 + (a['3分'] - 70) * 0.4);
    return line;
  }

  // ================= 第一个赛季：文字模拟，必定夺冠 =================
  const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];
  function simulateSeason(me, star, rand = Math.random) {
    const t = teamOfStar(star);
    const myTeamCN = t.cn;
    const west = WEST.includes(t.team);
    const conf = Object.keys(LEAGUE.teams).filter((c) => c !== t.team && WEST.includes(c) === west).sort((a, b) => teamStrength(b) - teamStrength(a)).map((c) => TEAM_CN[c]);
    const other = Object.keys(LEAGUE.teams).filter((c) => WEST.includes(c) !== west).sort((a, b) => teamStrength(b) - teamStrength(a)).map((c) => TEAM_CN[c]);
    const used = new Set();
    const opps = conf;
    const pickOpp = (list) => { const l = list.filter((x) => !used.has(x)); const o = pick(l.length ? l : list, rand); used.add(o); return o; };
    // 新秀赛季：能力不打折，但常规赛、季后赛数据打九折（命中率不变）
    const full = projectLine(me);
    const cut = (v) => Math.round(v * ROOKIE_SEASON * 10) / 10;
    const line = { ...full, pts: cut(full.pts), reb: cut(full.reb), ast: cut(full.ast), stl: cut(full.stl), blk: cut(full.blk), tov: cut(full.tov) };
    const wins = 54 + Math.floor(rand() * 11) + (me.ovr >= 85 ? 3 : 0);
    const seed = wins >= 62 ? 1 : wins >= 58 ? 2 : 3;
    const starLine = star.cur || star;
    const vary = (x, sd) => Math.max(0, Math.round((x + (rand() - 0.5) * 2 * sd) * 10) / 10);
    // 季后赛：按完整数据的七五折（比常规赛的九折更少），在这个基础上小幅起伏
    const po = (k, sd) => vary(full[k] * ROOKIE_PLAYOFF, sd);
    const playoffLine = { pts: po('pts', 1.2), reb: po('reb', 0.5), ast: po('ast', 0.5), stl: po('stl', 0.2), blk: po('blk', 0.2) };
    const career = r0(line.pts * 1.7 + 5 + rand() * 6);
    const rounds = [
      { name: '首轮', opp: pickOpp(opps.slice(5, 8)), score: pick(['4-1', '4-0', '4-2'], rand) },
      { name: '次轮', opp: pickOpp(opps.slice(2, 6)), score: pick(['4-2', '4-3', '4-1'], rand) },
      { name: `${west ? '西部' : '东部'}决赛`, opp: pickOpp(opps.slice(0, 3)), score: pick(['4-3', '4-2'], rand) },
      { name: '总决赛', opp: pickOpp(other.slice(0, 3)), score: pick(['4-2', '4-3', '4-1'], rand) },
    ];
    const fmvp = star.name; // 新秀赛季：明星球员必拿总冠军 + FMVP
    return {
      team: t.team, teamCN: myTeamCN, city: t.city, wins, losses: 82 - wins, seed, conf: west ? '西部' : '东部',
      line, playoffLine, career, rounds, fmvp, starLine,
      rookieAward: line.pts >= 14 ? '最佳新秀' : line.pts >= 9 ? '最佳新秀第一阵容' : '',
    };
  }

  // ================= 开局：普通虎扑 JR → 隐藏能力 =================
  // 问答决定你继承哪位球星的隐藏能力：这一项能力直接锁定（不受跨位置衰减），比赛直播里有专属招式
  // skill.kind：3 = 三分命中、2 = 两分命中、blk = 盖帽、ast = 助攻；text 里 {n} 是你的名字，{v} 是对手
  const HIDDEN = {
    curry: { star: '斯蒂芬·库里', name: '萌神附体', attr: '3分', v: 99, pos: 'PG', desc: '过了半场就是射程，投丢了也不回头',
      skill: { kind: 3, text: '{n}【萌神附体】超远三分命中' } },
    luka: { star: '卢卡·东契奇', name: '后撤步', attr: '控球', v: 98, pos: 'PG', desc: '一步后撤，防守人还在原地思考人生',
      skill: { kind: 3, text: '{n}【后撤步】晃开防守后撤步三分命中' } },
    kd: { star: '凯文·杜兰特', name: '得分机器', attr: '2分', v: 99, pos: 'SF', desc: '肘区干拔，谁来防都一样',
      skill: { kind: 2, text: '{n}【得分机器】肘区干拔中投命中' } },
    ant: { star: '安东尼·爱德华兹', name: '大心脏', attr: '弹跳', v: 97, pos: 'SG', desc: '起跳永远比防守人快半拍，越到最后越敢冲',
      skill: { kind: 2, text: '{n}【大心脏】顶着防守强起命中' } },
    giannis: { star: '扬尼斯·阿德托昆博', name: '希腊怪兽', attr: '终结', v: 98, pos: 'PF', desc: '三步从三分线冲到篮下，谁挡劈谁',
      skill: { kind: 2, text: '{n}【希腊怪兽】隔人劈扣命中' } },
    jokic: { star: '尼古拉·约基奇', name: '约老师', attr: '传球', v: 98, pos: 'C', desc: '球到你手里，队友总在最舒服的位置',
      skill: { kind: 'ast', text: '（{n}【约老师】背后盲传助攻）' } },
    wemby: { star: '维克托·文班亚马', name: '外星人之手', attr: '内防', v: 99, pos: 'C', desc: '对手上篮前要先抬头看看你在哪',
      skill: { kind: 'blk', text: '{v}突破上篮被{n}【外星人之手】钉板大帽' } },
  };
  // 只有 1 道题：每个选项对应一种隐藏能力（7 个选项 → 7 种能力）
  // ↑ HIDDEN（神秘技能）已停用，只留给老存档显示用。
  // 开局问答「你平时是什么打法？」（2026-11-15 用户重新设计）：7 个答案各对应一位顶级球员最强的一项，
  // 选哪个，你这一项就直接拿到和他一样的数值（锁定，不受新秀期和跨位置衰减影响），成为你最强的一项。不再有「获得神秘技能」那一步
  const PLAY_STYLES = {
    curry: { attr: '3分', star: '斯蒂芬·库里', nick: '库里', text: '站在三分线外，球到手就投，过半场就是射程' },
    sga: { attr: '2分', star: '谢伊·吉尔杰斯-亚历山大', nick: '亚历山大', text: '中距离急停跳投，肘区就是我的家' },
    luka: { attr: '终结', star: '卢卡·东契奇', nick: '东契奇', text: '慢悠悠晃到篮下，什么别扭姿势都能放进去' },
    jokic: { attr: '传球', star: '尼古拉·约基奇', nick: '约基奇', text: '喂球给队友，看他们得分比自己得分还爽' },
    wemby: { attr: '篮板', star: '维克托·文班亚马', nick: '文班亚马', text: '篮下卡位，天上飞的球都是我的' },
    giannis: { attr: '力量', star: '扬尼斯·阿德托昆博', nick: '字母哥', text: '低头硬冲，谁挡撞谁' },
    ant: { attr: '弹跳', star: '安东尼·爱德华兹', nick: '爱德华兹', text: '起飞！能扣就绝不上篮' },
  };
  const QUIZ = [{ q: '你平时是什么打法？', a: Object.entries(PLAY_STYLES).map(([k, s]) => [s.text, k]) }];
  // 打法 → { attr, star, text, v（这一项的初始数值）, pos（那位球星的位置，推荐给你）}
  //   v 统一 99（2026-11-19 用户要求；以前是那位球星这一项的数值，98~100 不等）
  const STYLE_V = 99;
  const styleMemo = {};
  function playStyle(key) {
    const s = PLAY_STYLES[key];
    if (!s) return null;
    if (!styleMemo[key]) {
      const p = Object.keys(LEAGUE.teams).flatMap((c) => rosterOf(c)).find((x) => x.name === s.star);
      styleMemo[key] = { key, ...s, v: STYLE_V, pos: p ? p.pos : 'SF' };
    }
    return styleMemo[key];
  }
  // 答案 → 打法（只有一道题，选第几个就是第几种）
  function hiddenFromAnswers(answers) {
    const a = QUIZ[0].a[answers[0]];
    return a ? a[1] : 'curry';
  }

  // ================= 成长：打得好就成长 =================
  // 每场比赛的表现分 → 经验；经验满了升一级，自选一项能力 +3
  const XP_PER_LEVEL = (lv) => 40 + lv * 12;
  function gameXP(row, win) {
    if (!row) return 0;
    return r0(row.pts + row.reb * 1.2 + row.ast * 1.5 + row.stl * 3 + row.blk * 3 + (win ? 15 : 4));
  }
  // 单项上限：99 + 普通被动给的额外加成（所以能超过 99）
  const attrCap = (me, k) => 100 + ((me.bonus && me.bonus[k]) || 0);
  function upgradeChoices(me, rand = Math.random) {
    const w = WEIGHTS[me.pos];
    const room = (k) => attrCap(me, k) - me.attrs[k];
    const cands = ATTRS.filter((k) => room(k) > 0).sort((a, b) => w[b] * room(b) * (0.5 + rand()) - w[a] * room(a) * (0.5 + rand()));
    return cands.slice(0, 3);
  }
  function applyUpgrade(me, attr, amount = 3) {
    me.attrs[attr] = Math.min(attrCap(me, attr), me.attrs[attr] + amount);
    me.ovr = ovrFromAttrs(me.attrs, me.pos);
    Object.assign(me, projectLine(me));
    return me;
  }

  // ================= 加点：每打完一场比赛（输赢都算）得 7 点，自己分配到任意能力，单项上限 100（勋章加成另算） =================
  // 用户 2026-11-15 定的规则，取代了以前「赢球按成长曲线自动长」和「升级三选一 +3」
  const POINTS_PER_GAME = 7;
  // 每项能力影响哪项比赛数据（加点页上的提示）
  const ATTR_STAT = { '3分': '得分', '2分': '得分', 终结: '命中率', 控球: '少失误', 传球: '助攻', 外防: '抢断', 运动: '抢断', 内防: '盖帽', 弹跳: '盖帽', 篮板: '篮板', 力量: '篮板' };
  function addPoints(me, plan) {
    for (const [k, v] of Object.entries(plan)) if (v > 0) me.attrs[k] = Math.min(attrCap(me, k), me.attrs[k] + v);
    me.ovr = ovrFromAttrs(me.attrs, me.pos);
    Object.assign(me, projectLine(me));
    return me;
  }
  // 一键推荐：一点一点给「位置权重 × 剩余空间」最大的那项（plan 里已经加了的也算进去）
  function suggestPoints(me, n, plan = {}) {
    const w = WEIGHTS[me.pos];
    const room = (k) => attrCap(me, k) - me.attrs[k] - (plan[k] || 0);
    for (let i = 0; i < n; i++) {
      const ks = ATTRS.filter((k) => room(k) > 0);
      if (!ks.length) break;
      const k = ks.reduce((a, b) => (w[b] * room(b) > w[a] * room(a) ? b : a));
      plan[k] = (plan[k] || 0) + 1;
    }
    return plan;
  }

  // ================= 成长曲线：每打赢一关，能力值自动成长（已停用，改成每场 7 点自己加；留着给老代码参考） =================
  // 保底总评：从进入传奇挑战时的总评出发，前 10 关先快后慢，第 10 关左右 95-99，第 20 关左右 100
  // 升级加点、普通被动给的总评是额外的（记在 run.extra），叠在曲线上面
  const GROW_POINTS = [[10, 97], [20, 100.4], [30, 102.5]];
  function growTarget(L, ovr0, lv0 = 0) {
    const pts = [[lv0, ovr0], ...GROW_POINTS.filter(([l]) => l > lv0)];
    for (let i = 1; i < pts.length; i++) {
      const [la, va] = pts[i - 1];
      const lb = pts[i][0], vb = Math.max(va, pts[i][1]);
      pts[i] = [lb, vb];
      if (L <= lb) {
        const t = Math.max(0, (L - la) / (lb - la));
        return va + (vb - va) * (i === 1 ? 1 - Math.pow(1 - t, 1.6) : t);
      }
    }
    return pts[pts.length - 1][1];
  }
  // 长到目标总评：每次给「位置权重 × 剩余空间」最大的那项 +1，直到总评够了；场均数据跟着总评一起涨
  function growTo(me, target) {
    const w = WEIGHTS[me.pos];
    const goal = Math.min(OVR_MAX, Math.round(target));
    const room = (k) => attrCap(me, k) - me.attrs[k];
    for (let guard = 0; me.ovr < goal && guard < 2000; guard++) {
      const ks = ATTRS.filter((k) => room(k) > 0);
      if (!ks.length) break;
      const k = ks.reduce((a, b) => (w[b] * room(b) > w[a] * room(a) ? b : a));
      me.attrs[k]++;
      me.ovr = ovrFromAttrs(me.attrs, me.pos);
    }
    Object.assign(me, projectLine(me));
    return me;
  }

  // ================= 被动技能：每过 5 关三选一（定义在 engine.js 的 PASSIVES） =================
  const PASSIVE_EVERY = 3; // 每打赢 3 关抽一次（和五大 Boss 无关）
  const LEGEND_PASSIVE_RATE = 0.15; // 抽到传奇被动的概率（每枚勋章）
  const PASSIVE_DRAWS = 3; // 每次 3 枚勋章
  // 抽一枚：15% 传奇、85% 普通；已经有的不再出现，普通的抽完了就只剩传奇
  function drawPassive(owned = [], rand = Math.random) {
    const keys = Object.keys(E.PASSIVES).filter((k) => !owned.includes(k));
    const rare = keys.filter((k) => E.PASSIVES[k].rare), normal = keys.filter((k) => !E.PASSIVES[k].rare);
    const pool = (rand() < LEGEND_PASSIVE_RATE && rare.length) || !normal.length ? rare : normal;
    return pool.length ? pool[Math.floor(rand() * pool.length)] : null;
  }
  // 选中后：能力型被动直接加到你身上，是额外加成（不受 99 限制，记在 me.bonus 里）
  function applyPassive(me, key) {
    const p = E.PASSIVES[key];
    me.bonus = me.bonus || {};
    for (const [k, v] of Object.entries(p.attr || {})) { me.bonus[k] = (me.bonus[k] || 0) + v; me.attrs[k] += v; }
    me.ovr = ovrFromAttrs(me.attrs, me.pos);
    Object.assign(me, projectLine(me));
    return me;
  }

  const api = { PICK_STARS, makeRookie, rookieFloor, OVR_OFFSET, SIGNATURE, GROW_POINTS, growTarget, growTo, attrCap, POINTS_PER_GAME, ATTR_STAT, addPoints, suggestPoints,PASSIVE_EVERY, PASSIVE_DRAWS, LEGEND_PASSIVE_RATE, drawPassive, applyPassive, OVR_MAX, SUPERSTARS, HIDDEN, QUIZ, hiddenFromAnswers, PLAY_STYLES, playStyle, ATTRS, grade, gradeClass, attrsOf, ovrFromAttrs, decay, ROOKIE, TEAM_CN, CITY, LEAGUE, buildTeams, teamOfStar, joinRoster, drawMates, cardRank, rosterOf, projectLine, simulateSeason, XP_PER_LEVEL, gameXP, upgradeChoices, applyUpgrade, WEIGHTS };
  if (IS_NODE) module.exports = api;
  else root.Career = api;
})(typeof window !== 'undefined' ? window : globalThis);
