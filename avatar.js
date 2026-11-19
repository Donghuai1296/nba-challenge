// 球员 Q 版形象：大头小身子、当赛季球衣（配色、队名、号码）+ 标志性造型 / 外号造型。纯 SVG，离线可用。
(function (root) {
  const D = root.LOOKS_DATA;
  const DEFAULT_KIT = { primary: '#3A4766', secondary: '#FFFFFF', word: 'NBA' };
  const cache = new Map();

  // 冠军球员没写号码时：先找他别的夺冠赛季的号码；2026 尼克斯（就是上赛季）再找本赛季现役名单里的号码
  function champNum(name, year) {
    const exact = D.NUMBERS[`${name}@${year}`];
    if (exact !== undefined) return exact;
    const other = Object.keys(D.NUMBERS).find((k) => k.startsWith(`${name}@`));
    if (other) return D.NUMBERS[other];
    if (year >= 2026 && root.LEAGUE) {
      const key = name.replace(/[-·・\s]/g, '');
      const p = Object.values(root.LEAGUE.teams).flat().find((x) => x.name.replace(/[-·・\s]/g, '') === key);
      if (p && p.num != null && p.num !== '') return p.num;
    }
    return undefined;
  }
  // 冠军球员按夺冠年份取球衣，现役球员按本赛季球队
  function kitOf(p) {
    const year = p.from && p.from !== '现役' ? Number(p.season) : null;
    if (year) return { kit: D.CHAMP_KITS[year] || DEFAULT_KIT, num: champNum(p.name, year), look: D.LOOKS[`${p.name}@${year}`] || D.LOOKS[p.name] || {}, key: `${p.name}@${year}` };
    const team = p.team || D.CURRENT_TEAM[p.name];
    return { kit: D.TEAM_KITS[team] || DEFAULT_KIT, num: p.num ?? D.NUMBERS[p.name], look: D.LOOKS[p.name] || {}, key: `${p.name}|${team || ''}` };
  }

  // 外号造型（按球员名字，所有赛季的卡都适用）
  const STYLES = {
    '维克托·文班亚马': 'alien', // 外星人
    '卢卡·东契奇': 'burger', // 汉堡
    '杰森·塔图姆': 'bunny', // 兔子
    '斯蒂芬·库里': 'kid', // 小学生
    '谢伊·吉尔杰斯-亚历山大': 'whistle', // 哨子（罚球多）
    '勒布朗·詹姆斯': 'king', // 国王
    '迈克尔·乔丹': 'goat', // 山羊 GOAT
    '尼古拉·约基奇': 'joker', // 小丑 Joker
    '泰瑞斯·马克西': 'car', // 跑车
    '阿尔佩伦·申京': 'sister', // 老嫂子
    '科比·布莱恩特': 'snake', // 黑曼巴
    '沙奎尔·奥尼尔': 'shark', // 大鲨鱼
    '蒂姆·邓肯': 'stone', // 石佛
    '凯文·杜兰特': 'reaper', // 死神
    '扬尼斯·阿德托昆博': 'laurel', // 希腊怪物
    '拉里·伯德': 'bird', // 大鸟
    '魔术师约翰逊': 'magic', // 魔术师
    '哈基姆·奥拉朱旺': 'dream', // 大梦
    '凯文·加内特': 'wolf', // 狼王
    '德维恩·韦德': 'flash', // 闪电侠
    '安东尼·戴维斯': 'unibrow', // 浓眉
    '科怀·伦纳德': 'robot', // 机器人
    '凯里·欧文': 'uncle', // 德鲁大叔
  };

  const SKIN_TONE = '#F7CD4F'; // 积木公仔式统一肤色
  const LINE = '#2A1C10';
  const HAIR_COLORS = { dark: '#2B1D14', blond: '#E9C46A', ginger: '#C8642A', brown: '#7A4B2A', grey: '#C3C7CE' };
  const FACE_BY_STYLE = { alien: '#A6E89A', bunny: '#FBF7F2', goat: '#F1EEE8', joker: '#FAFAFA', stone: '#B9BEC6', robot: '#CDD6E1' };
  const NO_HAIR = ['alien', 'bunny', 'goat', 'stone', 'robot', 'reaper', 'car', 'burger'];
  const NO_EARS = ['bunny', 'goat', 'robot', 'reaper', 'car', 'shark'];
  const NO_BEARD = ['joker', 'stone', 'robot', 'goat', 'bird'];

  // opts.bare：不画方形底色（用在竖版球员卡里，人物"站"在卡面上）
  function cartoonSVG(p, opts = {}) {
    const { kit, num, look, key } = kitOf(p);
    const st = STYLES[p.name] || null;
    const legend = p.ovr >= 95;
    const ck = `${key}|${legend}|${opts.bare ? 1 : 0}`;
    if (cache.has(ck)) return cache.get(ck);

    const { primary: c1, secondary: c2, word } = kit;
    const face = FACE_BY_STYLE[st] || SKIN_TONE;
    const arm = ['alien', 'robot', 'stone', 'goat'].includes(st) ? face : SKIN_TONE;
    let hair = look.hair || 'short';
    if (NO_HAIR.includes(st)) hair = 'none';
    if (st === 'kid') hair = 'bowl';
    if (st === 'sister') hair = 'bun';
    if (st === 'joker') hair = 'joker';
    if (st === 'shark') hair = 'bald';
    const hc = st === 'uncle' ? HAIR_COLORS.grey : HAIR_COLORS[look.hairColor] || HAIR_COLORS.dark;
    const beard = (look.beard || st === 'uncle') && !NO_BEARD.includes(st);
    const s = `stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"`;
    const thin = `stroke="${LINE}" stroke-width="1.1" stroke-linejoin="round"`;
    const P = [];

    // ---------- 背景 ----------
    if (!opts.bare) {
      P.push(`<rect width="100" height="100" rx="14" fill="${c1}"/>`);
      P.push('<circle cx="50" cy="34" r="46" fill="#fff" opacity="0.16"/>');
    }
    P.push('<ellipse cx="50" cy="99" rx="30" ry="5" fill="#000" opacity="0.3"/>');

    // ---------- 身后的东西 ----------
    if (st === 'king') P.push(`<path d="M20 101 L27 70 Q50 60 73 70 L80 101 Z" fill="#B3122E" ${s}/>`);
    if (st === 'reaper') {
      P.push(`<path d="M83 16 L79 99" stroke="#6B4A2B" stroke-width="3.2" stroke-linecap="round"/>`);
      P.push(`<path d="M83 16 Q97 18 99 34 Q91 26 81 24 Z" fill="#D3D9E2" ${s}/>`);
    }
    if (hair === 'afro') P.push(`<circle cx="50" cy="35" r="29" fill="${hc}" ${s}/>`);
    if (hair === 'long') P.push(`<path d="M25 38 Q22 62 31 66 L69 66 Q78 62 75 38 Z" fill="${hc}" ${s}/>`);

    // ---------- 身体 ----------
    const font = 'font-family="Bahnschrift, Arial Narrow, Arial, sans-serif" text-anchor="middle" font-weight="900"';
    if (st === 'car') {
      // 坐在跑车里：车身是球队主色，车门上印号码
      for (const y of [80, 86, 92]) P.push(`<path d="M3 ${y} H13" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>`);
      P.push(`<path d="M15 93 Q15 81 27 79 L37 72 Q50 65 63 72 L73 79 Q85 81 85 93 Z" fill="${c1}" ${s}/>`);
      P.push(`<path d="M39 73 Q50 67.5 61 73 L59 77.5 L41 77.5 Z" fill="#9FD8FF" ${thin}/>`);
      P.push(`<path d="M19 84 H81" stroke="${c2}" stroke-width="1.8"/>`);
      P.push(`<circle cx="30" cy="93" r="6" fill="#222" ${s}/><circle cx="70" cy="93" r="6" fill="#222" ${s}/><circle cx="30" cy="93" r="2.4" fill="#C9CED6"/><circle cx="70" cy="93" r="2.4" fill="#C9CED6"/>`);
      P.push(`<text x="50" y="91" ${font} font-size="8" fill="${c2}">${num !== undefined ? num : word}</text>`);
    } else {
      P.push(`<ellipse cx="30" cy="82" rx="5.5" ry="10" transform="rotate(14 30 82)" fill="${arm}" ${s}/>`);
      P.push(`<ellipse cx="70" cy="82" rx="5.5" ry="10" transform="rotate(-14 70 82)" fill="${arm}" ${s}/>`);
      P.push(`<path d="M31 101 L33 76 Q35 68 43 66 L46 65.5 Q50 72 54 65.5 L57 66 Q65 68 67 76 L69 101 Z" fill="${c1}" ${s}/>`);
      P.push(`<path d="M46 65.5 Q50 73 54 65.5" fill="none" stroke="${c2}" stroke-width="2.2"/>`);
      P.push(`<path d="M35.5 71 Q39 80 37 92 M64.5 71 Q61 80 63 92" fill="none" stroke="${c2}" stroke-width="1.8"/>`);
      if (num !== undefined) {
        P.push(`<text x="50" y="78.5" ${font} font-size="4.6" letter-spacing="0.3" fill="${c2}">${word}</text>`);
        P.push(`<text x="50" y="92" ${font} font-size="13" fill="${c2}" stroke="${LINE}" stroke-width="0.5">${num}</text>`);
      } else {
        P.push(`<text x="50" y="86" ${font} font-size="5.6" letter-spacing="0.3" fill="${c2}">${word}</text>`);
      }
      if (st === 'king') {
        P.push(`<ellipse cx="50" cy="67" rx="19" ry="4.6" fill="#fff" ${s}/>`);
        P.push('<circle cx="40" cy="67" r="0.9" fill="#222"/><circle cx="47" cy="68" r="0.9" fill="#222"/><circle cx="54" cy="67" r="0.9" fill="#222"/><circle cx="61" cy="68" r="0.9" fill="#222"/>');
      }
      if (st === 'kid') {
        P.push(`<path d="M41 64 L59 64 L50 70 Z" fill="#E02424" ${s}/>`);
        P.push(`<path d="M49 69 L44 80 L48 80 L50 72 L52 80 L56 80 L51 69 Z" fill="#E02424" ${s}/>`);
      }
      if (st === 'whistle') P.push('<path d="M40 66 Q44 74 50 75 Q56 74 60 66" fill="none" stroke="#E53935" stroke-width="1.6"/>');
      if (legend) {
        P.push(`<circle cx="76" cy="90" r="8.5" fill="#E8792B" ${s}/>`);
        P.push(`<path d="M67.5 90 H84.5 M76 81.5 V98.5 M70 84 Q76 90 70 96 M82 84 Q76 90 82 96" fill="none" stroke="${LINE}" stroke-width="1.1"/>`);
      }
    }

    // ---------- 汉堡头：整颗头换成汉堡 ----------
    if (st === 'burger') {
      P.push(`<path d="M28 52 Q28 61 34 62 L66 62 Q72 61 72 52 Z" fill="#E9A24E" ${s}/>`);
      P.push(`<rect x="26" y="45" width="48" height="8" rx="4" fill="#6B3A1E" ${s}/>`);
      P.push(`<path d="M27 45 L73 45 L70 49 L64 46 L58 50 L52 46 L46 49.5 L40 46 L34 49 Z" fill="#FFC93C" ${s}/>`);
      P.push(`<path d="M25 44 Q29 40 33 44 Q37 40 41 44 Q45 40 49 44 Q53 40 57 44 Q61 40 65 44 Q69 40 75 44 L75 46 L25 46 Z" fill="#6CC24A" ${s}/>`);
      P.push(`<path d="M26 43 Q26 17 50 17 Q74 17 74 43 Z" fill="#F0A84E" ${s}/>`);
      P.push('<ellipse cx="40" cy="23" rx="1.6" ry="0.9" fill="#FFF6DD"/><ellipse cx="50" cy="20.5" rx="1.6" ry="0.9" fill="#FFF6DD"/><ellipse cx="60" cy="23" rx="1.6" ry="0.9" fill="#FFF6DD"/><ellipse cx="33" cy="29" rx="1.6" ry="0.9" fill="#FFF6DD"/><ellipse cx="67" cy="29" rx="1.6" ry="0.9" fill="#FFF6DD"/>');
      P.push('<ellipse cx="42" cy="22" rx="8" ry="3" fill="#fff" opacity="0.3"/>');
      P.push(`<ellipse cx="42" cy="33" rx="2.7" ry="3.5" fill="${LINE}"/><ellipse cx="58" cy="33" rx="2.7" ry="3.5" fill="${LINE}"/>`);
      P.push('<circle cx="43" cy="31.8" r="1" fill="#fff"/><circle cx="59" cy="31.8" r="1" fill="#fff"/>');
      P.push('<ellipse cx="36" cy="38.5" rx="3.4" ry="1.8" fill="#FF7A7A" opacity="0.5"/><ellipse cx="64" cy="38.5" rx="3.4" ry="1.8" fill="#FF7A7A" opacity="0.5"/>');
      P.push(`<path d="M45 38 Q50 42.5 55 38" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>`);
      return finish(P, p, ck);
    }

    // ---------- 头后面的造型层 ----------
    if (st === 'bunny') {
      P.push(`<ellipse cx="39" cy="12" rx="6.5" ry="16" transform="rotate(-12 39 12)" fill="${face}" ${s}/><ellipse cx="61" cy="12" rx="6.5" ry="16" transform="rotate(12 61 12)" fill="${face}" ${s}/>`);
      P.push('<ellipse cx="39" cy="13" rx="3.2" ry="11" transform="rotate(-12 39 13)" fill="#FFB3C7"/><ellipse cx="61" cy="13" rx="3.2" ry="11" transform="rotate(12 61 13)" fill="#FFB3C7"/>');
    }
    if (st === 'alien') {
      P.push(`<path d="M42 20 L35 6 M58 20 L65 6" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>`);
      P.push(`<circle cx="35" cy="6" r="3.6" fill="#7CF0FF" ${s}/><circle cx="65" cy="6" r="3.6" fill="#7CF0FF" ${s}/>`);
    }
    if (st === 'robot') {
      P.push(`<path d="M50 18 L50 7" stroke="${LINE}" stroke-width="2"/><circle cx="50" cy="6" r="3" fill="#FF5252" ${s}/>`);
      P.push(`<rect x="22" y="37" width="6" height="10" rx="1.5" fill="#8E99A8" ${s}/><rect x="72" y="37" width="6" height="10" rx="1.5" fill="#8E99A8" ${s}/>`);
    }
    if (st === 'goat') {
      P.push(`<path d="M38 22 Q30 6 18 12 Q28 13 33 26 Z" fill="#D9C7A3" ${s}/><path d="M62 22 Q70 6 82 12 Q72 13 67 26 Z" fill="#D9C7A3" ${s}/>`);
      P.push(`<ellipse cx="24" cy="40" rx="9" ry="4" transform="rotate(25 24 40)" fill="${face}" ${s}/><ellipse cx="76" cy="40" rx="9" ry="4" transform="rotate(-25 76 40)" fill="${face}" ${s}/>`);
    }
    if (st === 'wolf') {
      P.push(`<path d="M29 28 L30 8 L44 20 Z" fill="#7C8590" ${s}/><path d="M71 28 L70 8 L56 20 Z" fill="#7C8590" ${s}/>`);
      P.push('<path d="M32 23 L32.5 13 L40 20 Z" fill="#FFB3C7"/><path d="M68 23 L67.5 13 L60 20 Z" fill="#FFB3C7"/>');
    }
    if (st === 'reaper') P.push(`<path d="M23 52 Q19 11 50 9 Q81 11 77 52 L77 66 Q50 72 23 66 Z" fill="#2A2236" ${s}/>`);
    if (st === 'shark') P.push(`<circle cx="50" cy="39" r="28" fill="#8DA1B4" ${s}/>`);
    if (st === 'car') {
      P.push(`<circle cx="50" cy="39" r="27" fill="${c1}" ${s}/>`);
      P.push(`<path d="M45 12.5 L55 12.5 L55 20 L45 20 Z" fill="${c2}"/>`);
    }
    if (hair === 'bun') P.push(`<circle cx="50" cy="13" r="9" fill="${hc}" ${s}/>`);

    // ---------- 耳朵、大头 ----------
    if (!NO_EARS.includes(st)) P.push(`<circle cx="27.5" cy="42" r="4.2" fill="${face}" ${s}/><circle cx="72.5" cy="42" r="4.2" fill="${face}" ${s}/>`);
    P.push(`<circle cx="50" cy="40" r="23" fill="${face}" ${s}/>`);
    if (st === 'alien') P.push('<ellipse cx="44" cy="23" rx="7" ry="3" fill="#fff" opacity="0.35"/>');
    if (st === 'stone') P.push('<path d="M39 22 L43 29 L41 34 M63 47 L66 52 L64 56 M33 46 L36 49" fill="none" stroke="#7D838C" stroke-width="1.2"/>');
    if (beard) P.push(`<path d="M28.5 44 Q30 63.5 50 64.5 Q70 63.5 71.5 44 Q66 57 50 58 Q34 57 28.5 44 Z" fill="${hc}" ${s}/>`);
    if (st === 'flash') {
      P.push(`<path d="M27.5 37 Q50 31 72.5 37 L71 47 Q50 42 29 47 Z" fill="#D6242C" ${s}/>`);
      P.push(`<path d="M51 20 L46 29 L50 29 L47 35 L55 26 L51 26 L54 20 Z" fill="#FFD23F" ${thin}/>`);
    }

    // ---------- 五官 ----------
    // 眉毛
    if (st === 'unibrow') P.push(`<path d="M35 34.5 Q42.5 30.5 50 33 Q57.5 30.5 65 34.5" fill="none" stroke="${LINE}" stroke-width="3.4" stroke-linecap="round"/>`);
    else if (!['robot', 'stone', 'goat', 'flash'].includes(st)) P.push(`<path d="M37.5 34.5 Q41 32.5 44.5 34.5 M55.5 34.5 Q59 32.5 62.5 34.5" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>`);
    // 眼睛
    if (st === 'alien') {
      P.push(`<ellipse cx="40" cy="42" rx="5.2" ry="7" transform="rotate(-18 40 42)" fill="${LINE}"/><ellipse cx="60" cy="42" rx="5.2" ry="7" transform="rotate(18 60 42)" fill="${LINE}"/>`);
      P.push('<circle cx="41.5" cy="39" r="1.8" fill="#fff"/><circle cx="61.5" cy="39" r="1.8" fill="#fff"/><circle cx="38.8" cy="45" r="0.9" fill="#fff"/><circle cx="58.8" cy="45" r="0.9" fill="#fff"/>');
    } else if (st === 'stone') {
      P.push(`<path d="M37 42 Q41 44.6 45 42 M55 42 Q59 44.6 63 42" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>`);
    } else if (st === 'robot') {
      P.push(`<rect x="35.5" y="39" width="10" height="5.5" rx="1.5" fill="#5CF0FF" ${thin}/><rect x="54.5" y="39" width="10" height="5.5" rx="1.5" fill="#5CF0FF" ${thin}/>`);
    } else {
      if (st === 'flash') P.push('<ellipse cx="41" cy="42" rx="4.4" ry="4.6" fill="#fff"/><ellipse cx="59" cy="42" rx="4.4" ry="4.6" fill="#fff"/>');
      P.push(`<ellipse cx="41" cy="42" rx="2.9" ry="3.8" fill="${LINE}"/><ellipse cx="59" cy="42" rx="2.9" ry="3.8" fill="${LINE}"/>`);
      P.push('<circle cx="42" cy="40.6" r="1.1" fill="#fff"/><circle cx="60" cy="40.6" r="1.1" fill="#fff"/>');
    }
    if (st === 'joker') {
      P.push('<path d="M41 33 L42.6 35.6 L41 38.2 L39.4 35.6 Z M59 33 L60.6 35.6 L59 38.2 L57.4 35.6 Z M41 46 L42.4 48.2 L41 50.4 L39.6 48.2 Z M59 46 L60.4 48.2 L59 50.4 L57.6 48.2 Z" fill="#7A3FC6"/>');
    }
    // 腮红
    if (!beard && !['robot', 'stone', 'joker', 'goat', 'flash'].includes(st)) P.push('<ellipse cx="35.5" cy="49" rx="3.6" ry="2" fill="#FF7A7A" opacity="0.45"/><ellipse cx="64.5" cy="49" rx="3.6" ry="2" fill="#FF7A7A" opacity="0.45"/>');
    // 嘴
    if (st === 'whistle') {
      P.push(`<rect x="46" y="49" width="14" height="6.4" rx="3" fill="#C9D3DE" ${s}/><rect x="41.5" y="50.4" width="5.5" height="3.6" rx="1" fill="#9AA6B5" ${thin}/>`);
      P.push(`<circle cx="61" cy="56" r="2" fill="none" stroke="${LINE}" stroke-width="1.1"/>`);
    } else if (st === 'joker') {
      P.push(`<circle cx="50" cy="47" r="3.6" fill="#E32B2B" ${s}/>`);
      P.push(`<path d="M37 51 Q50 63 63 51 Q50 57.5 37 51 Z" fill="#D7263D" ${s}/>`);
    } else if (st === 'bird') {
      P.push(`<path d="M44.5 46 L55.5 46 L50 55 Z" fill="#F2A93B" ${s}/><path d="M45 49 H55" stroke="${LINE}" stroke-width="1"/>`);
    } else if (st === 'goat') {
      P.push(`<ellipse cx="50" cy="50" rx="3.2" ry="2.2" fill="${LINE}"/><path d="M46 54 Q48 56 50 54 Q52 56 54 54" fill="none" stroke="${LINE}" stroke-width="1.3" stroke-linecap="round"/>`);
      P.push(`<path d="M45.5 59 L50 72 L54.5 59 Q50 61 45.5 59 Z" fill="#FFFFFF" ${s}/>`);
    } else if (st === 'robot') {
      P.push(`<rect x="42" y="50" width="16" height="4.6" rx="1" fill="#6F7C8E" ${thin}/><path d="M46 50 V54.6 M50 50 V54.6 M54 50 V54.6" stroke="${LINE}" stroke-width="0.9"/>`);
    } else if (st === 'bunny') {
      P.push(`<path d="M47.5 47 L52.5 47 L50 49.6 Z" fill="#FF8FB0" ${s}/>`);
      P.push(`<path d="M30 46 L41 47.5 M30 50.5 L41 49.5 M70 46 L59 47.5 M70 50.5 L59 49.5" stroke="${LINE}" stroke-width="1" stroke-linecap="round"/>`);
      P.push(`<path d="M44.5 50.5 Q50 55.5 55.5 50.5" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>`);
      P.push(`<rect x="47.4" y="53" width="2.6" height="3.6" rx="0.6" fill="#fff" ${thin}/><rect x="50" y="53" width="2.6" height="3.6" rx="0.6" fill="#fff" ${thin}/>`);
    } else {
      const mouth = st === 'sister' ? '#E0485A' : beard ? '#F3E2C7' : LINE;
      P.push(`<path d="M44.5 50.5 Q50 55.5 55.5 50.5" fill="none" stroke="${mouth}" stroke-width="1.8" stroke-linecap="round"/>`);
    }

    // ---------- 发型前层 ----------
    const cap = 'M27 40 Q26 16 50 16 Q74 16 73 40 Q67 25.5 50 25.5 Q33 25.5 27 40 Z';
    if (['short', 'long', 'bun'].includes(hair)) P.push(`<path d="${cap}" fill="${hc}" ${s}/>`);
    if (hair === 'bowl') P.push(`<path d="M26.5 42 Q25 15 50 15 Q75 15 73.5 42 L71 34 L29 34 Z" fill="${hc}" ${s}/>`);
    if (hair === 'afro') P.push(`<path d="M27 38 Q27 18 50 18 Q73 18 73 38 Q66 27 50 27 Q34 27 27 38 Z" fill="${hc}"/>`);
    if (hair === 'joker') P.push(`<path d="M27 40 L24 24 L32 27 L33 14 L41 22 L46 10 L51 20 L58 10 L60 22 L68 14 L68 27 L76 24 L73 40 Q67 26 50 26 Q33 26 27 40 Z" fill="#3DBB55" ${s}/>`);
    if (hair === 'dyed') {
      P.push(`<path d="${cap}" fill="#FF5FA2" ${s}/>`);
      P.push('<path d="M33 30 Q50 18 67 30" fill="none" stroke="#FFD34E" stroke-width="2.6"/><path d="M30 35 Q50 22 70 35" fill="none" stroke="#5EE2FF" stroke-width="1.8"/>');
    }
    if (hair === 'bald') P.push('<ellipse cx="44" cy="24" rx="7" ry="3.2" fill="#fff" opacity="0.45"/>');
    if (st === 'bird') P.push(`<path d="M44 18 Q46 6 50 14 Q52 4 55 16 Q60 8 58 19" fill="#E9C46A" ${thin}/>`);

    // ---------- 前面的配饰 ----------
    if (look.headband && st !== 'king') P.push(`<path d="M27.6 31 Q50 22 72.4 31 L72.8 36 Q50 27 27.2 36 Z" fill="${c2 === '#FFFFFF' ? '#FFFFFF' : c2}" ${s}/>`);
    if (look.goggles) {
      P.push(`<path d="M27.5 41 L34 41 M66 41 L72.5 41" stroke="${LINE}" stroke-width="1.6"/>`);
      P.push('<ellipse cx="41" cy="42" rx="6.6" ry="5.8" fill="#BFE3FF" fill-opacity="0.35" stroke="#F4F8FC" stroke-width="1.8"/><ellipse cx="59" cy="42" rx="6.6" ry="5.8" fill="#BFE3FF" fill-opacity="0.35" stroke="#F4F8FC" stroke-width="1.8"/>');
      P.push('<path d="M47.6 42 L52.4 42" stroke="#F4F8FC" stroke-width="1.8"/>');
    }
    if (st === 'uncle') {
      P.push(`<circle cx="41" cy="42" r="5.6" fill="none" stroke="#3B2A1A" stroke-width="1.6"/><circle cx="59" cy="42" r="5.6" fill="none" stroke="#3B2A1A" stroke-width="1.6"/><path d="M46.6 42 H53.4" stroke="#3B2A1A" stroke-width="1.6"/>`);
    }
    if (st === 'king') {
      P.push(`<path d="M32 22 L35 6 L42.5 15 L50 3 L57.5 15 L65 6 L68 22 Z" fill="#FFD23F" ${s}/>`);
      P.push('<circle cx="35" cy="6" r="1.8" fill="#E53935"/><circle cx="50" cy="3" r="2" fill="#2E7DFF"/><circle cx="65" cy="6" r="1.8" fill="#E53935"/><circle cx="50" cy="17" r="2" fill="#E53935"/>');
    }
    if (st === 'magic') {
      P.push(`<rect x="36" y="-2" width="28" height="20" fill="#1A1A1F" ${s}/><rect x="36" y="12" width="28" height="4" fill="#C62828"/><rect x="28" y="16.5" width="44" height="4.5" rx="2.2" fill="#1A1A1F" ${s}/>`);
      P.push('<path d="M76 8 L77.3 11.5 L81 12.5 L77.3 13.5 L76 17 L74.7 13.5 L71 12.5 L74.7 11.5 Z M20 26 L21 28.6 L23.6 29.5 L21 30.4 L20 33 L19 30.4 L16.4 29.5 L19 28.6 Z" fill="#FFD23F"/>');
    }
    if (st === 'dream') {
      P.push(`<path d="M27 27 Q36 3 62 6 Q74 9 79 22 L73 25 Q66 15 50 18 Q36 20 31 31 Z" fill="#5B8DEF" ${s}/>`);
      P.push('<path d="M40 12 L44 22 M52 8 L54 19 M63 9 L64 18" stroke="#fff" stroke-width="2" opacity="0.8"/>');
      P.push(`<circle cx="79" cy="24" r="4" fill="#fff" ${s}/>`);
      P.push(`<text x="86" y="12" ${font} font-size="8" fill="#fff">Zz</text>`);
    }
    if (st === 'laurel') {
      for (let a = 200; a <= 340; a += 14) {
        const r = (a * Math.PI) / 180;
        const x = 50 + 22 * Math.cos(r);
        const y = 38 + 22 * Math.sin(r);
        P.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="2" transform="rotate(${a + 60} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#E6B422" ${thin}/>`);
      }
    }
    if (st === 'sister') {
      P.push('<circle cx="62" cy="11" r="2.6" fill="#FF4D6D"/><circle cx="66" cy="13.5" r="2.6" fill="#FF4D6D"/><circle cx="64.5" cy="17.5" r="2.6" fill="#FF4D6D"/><circle cx="59.6" cy="17.5" r="2.6" fill="#FF4D6D"/><circle cx="58.2" cy="13.5" r="2.6" fill="#FF4D6D"/><circle cx="62" cy="14.5" r="2" fill="#FFD23F"/>');
    }
    if (st === 'snake') {
      P.push(`<ellipse cx="50" cy="21" rx="21" ry="6.5" fill="#1F1F24" ${s}/><ellipse cx="50" cy="15" rx="15" ry="5.5" fill="#1F1F24" ${s}/>`);
      P.push('<path d="M38 21 H62 M42 15 H58" stroke="#FDB927" stroke-width="1" stroke-dasharray="2 3"/>');
      P.push(`<ellipse cx="62" cy="9" rx="7" ry="4.5" fill="#1F1F24" ${s}/><circle cx="64" cy="7.6" r="1.2" fill="#FFD23F"/>`);
      P.push('<path d="M69 9.5 L75 9.5 M75 9.5 L78 7.5 M75 9.5 L78 11.5" stroke="#E53935" stroke-width="1.1" stroke-linecap="round"/>');
    }
    if (st === 'shark') {
      P.push(`<path d="M44 12.5 L54 -3 L60 13.5 Z" fill="#8DA1B4" ${s}/>`);
      P.push(`<path d="M31 22 L34 17.5 L37 22 L40 17 L43 21 L46 16.5 L49 20.5 L52 16.5 L55 20.5 L58 17 L61 21 L64 17.5 L67 22 L69 23 L31 23 Z" fill="#fff" ${thin}/>`);
    }
    if (st === 'car') {
      P.push(`<rect x="29" y="25" width="42" height="6.5" rx="3" fill="#1C2230" ${thin}/><rect x="33" y="26.3" width="12" height="1.6" rx="0.8" fill="#fff" opacity="0.5"/>`);
    }

    return finish(P, p, ck);
  }

  function finish(parts, p, ck) {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}" overflow="visible">${parts.join('')}</svg>`;
    cache.set(ck, svg);
    return svg;
  }


  // 虎扑头像：现役球员有照片就用照片（本地 img/players/*.webp，约 10KB 一张）；
  // 没有照片、冠军队老球员、玩家自己捏的球员用卡通形象；照片加载失败也退回卡通
  let photoMap = null;
  const nameKey = (n) => n.replace(/[-·・\s]/g, '');
  // 照片路径相对 avatar.js 所在目录（游戏首页和 test/ 里的页面都能找到）
  //   网页版（scripts/build-web.js）把脚本直接内嵌进页面，那时没有 src，就按页面地址算
  const BASE = typeof document !== 'undefined' && document.currentScript && document.currentScript.src ? new URL('.', document.currentScript.src).href : '';
  const resolve = (u) => (/^(https?:|data:|\/)/.test(u) || !BASE ? u : BASE + u);
  // 冠军队名单和虎扑译名不一致的现役球员：冠军队写法 → 虎扑写法
  const ALIAS = {
    'OG·阿努诺比': 'OG·阿奴诺比', '泰勒·科雷克': '泰勒·科勒克', '阿里尔·霍克波特': '阿里尔·胡克波尔蒂',
    '卢冈茨·多尔特': '吕冈茨·多尔特', '伊萨亚·哈尔滕施泰因': '以赛亚·哈尔滕施泰因', '阿隆·威金斯': '阿龙·威金斯',
    '阿尔·霍福德': '艾尔·霍福德', '佩顿·普理查德': '佩顿·普里查德', '山姆·豪泽': '萨姆·豪瑟',
    '肯塔维厄斯·卡德威尔-波普': '肯塔维厄斯·考德威尔·波普', '迈克尔·波特': '小迈克尔·波特', '阿隆·戈登': '阿龙·戈登',
    '克里斯蒂安·布劳恩': '克里斯琴·布朗', '佩顿·沃森': '佩顿·沃特森', '鲍比·波蒂斯': '博比·波蒂斯', '安德鲁·维金斯': '安德鲁·威金斯',
  };
  // 老照片统一样式后的版本（photo-norm.js，scripts/normalize-photos.js 生成）
  const norm = (u) => (root.PHOTO_NORM && root.PHOTO_NORM[u]) || u;
  // 带底色的方形老照片（photo-boxed.js）：虎扑没有抠图版，统一样式也抠不掉背景，
  // 缩在画布中间会变成一个小方块。这些直接用原图铺满人像区（像球星卡），底部渐隐
  let boxedSet = null;
  const isBoxed = (u) => (boxedSet || (boxedSet = new Set(root.PHOTO_BOXED || []))).has(u);
  function rawPhoto(p) {
    // 玩家自己没有照片；冠军队老球员用虎扑历史照片（champions-hupu.js），如今还在 NBA 的用现役照片
    if (p.isMe) return '';
    if (p.img) return p.img;
    if (!photoMap) {
      photoMap = new Map();
      const L = root.LEAGUE;
      if (L) for (const list of Object.values(L.teams)) for (const x of list) if (x.img) photoMap.set(nameKey(x.name), x.img);
    }
    const exact = photoMap.get(nameKey(ALIAS[p.name] || p.name));
    if (exact) return exact;
    // 译名不同：至少 4 个字一样、只差一两个字，就当同一人用他的照片（Engine.samePlayer）。
    // 但如果那个名字在冠军名单里本来就是另一个人，不借用
    const E = root.Engine;
    if (!E || !E.samePlayer) return '';
    if (!champKeys) champKeys = new Set((root.CHAMPIONS || []).flatMap((c) => c.roster.map((x) => nameKey(x.name))));
    if (!fuzzyCache.has(p.name)) {
      let hit = '';
      for (const [k, u] of photoMap) if (!champKeys.has(k) && E.samePlayer(k, p.name)) { hit = u; break; }
      fuzzyCache.set(p.name, hit);
    }
    return fuzzyCache.get(p.name);
  }
  let champKeys = null;
  const fuzzyCache = new Map();
  // 人像分割抠好的老照片（photo-ml.js，scripts/ml-cutout.js 生成）：比方形原图、按颜色抠的都优先
  //   起因：用户说「1994 火箭球员头像显示出来很奇怪」——观众席背景的比赛照以前只能整块方图显示
  const mlOf = (u) => (root.PHOTO_ML && root.PHOTO_ML[u]) || '';
  function hupuPhoto(p) {
    const u = rawPhoto(p);
    if (!u) return '';
    if (mlOf(u)) return resolve(mlOf(u));
    return resolve(isBoxed(u) ? u : norm(u));
  }
  // 没有照片（玩家自己、虎扑也找不到照片的老替补）：和照片同样构图的剪影，球衣用球队颜色，不用卡通
  function silhouetteSVG(p, opts = {}) {
    const { kit } = kitOf(p);
    const fit = opts.bare ? 'xMidYMax slice' : 'xMidYMin slice'; // 和照片一样按高度铺满
    return `<svg viewBox="0 0 569 320" preserveAspectRatio="${fit}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}">
      <ellipse cx="284.5" cy="84" rx="60" ry="74" fill="#c3c9d4"/>
      <path d="M254 140h61v52h-61z" fill="#b3bac6"/>
      <path d="M118 320C124 238 186 204 284.5 198C383 204 445 238 451 320Z" fill="${kit.primary}"/>
      <path d="M244 199Q284.5 236 325 199" fill="none" stroke="${kit.secondary}" stroke-width="10"/>
    </svg>`;
  }
  function avatarSVG(p, opts = {}) {
    // 玩家自己：进入联盟前随机到的造型（faces.js，15 个手绘形象），穿你所在球队的背心
    if (p.isMe && p.look != null && root.Faces) {
      const cls = `hp-ph fail${opts.bare ? ' bare' : ''}`;
      return `<span class="${cls}" style="background:${opts.bare ? 'transparent' : '#fff'}">${root.Faces.svg(p.look, kitOf(p).kit, opts)}</span>`;
    }
    const svg = silhouetteSVG(p, opts);
    const url = hupuPhoto(p);
    const boxed = url && isBoxed(rawPhoto(p)) && !mlOf(rawPhoto(p)); // 抠好了就不按方形照片显示
    const bg = opts.bare ? 'transparent' : '#fff';
    const cls = `hp-ph${opts.bare ? ' bare' : ''}${boxed ? ' boxed' : ''}`;
    if (!url) return `<span class="${cls} fail" style="background:${bg}">${svg}</span>`;
    // 剪影先藏起来，直接显示照片；照片加载失败才把剪影露出来
    return `<span class="${cls}" style="background:${bg}">${svg}<img class="hp-photo" alt="" src="${url}" referrerpolicy="no-referrer" decoding="async" onerror="this.parentNode.classList.add('fail');this.remove()"></span>`;
  }
  // 提前把一批照片下载进浏览器缓存（比如进入选人页前），翻页时就不会一张张冒出来
  const preloaded = new Set();
  function preloadPhotos(players) {
    if (typeof Image === 'undefined') return;
    for (const p of players) {
      const u = hupuPhoto(p);
      if (!u || preloaded.has(u)) continue;
      preloaded.add(u);
      const im = new Image();
      im.decoding = 'async';
      im.src = u;
    }
  }
  if (typeof document !== 'undefined') {
    const st = document.createElement('style');
    st.textContent = '.hp-ph{position:relative;display:block;width:100%;height:100%;overflow:hidden}.hp-ph>svg{width:100%;height:100%;display:block;visibility:hidden}' +
      '.hp-ph.fail>svg{visibility:visible}.hp-ph>.hp-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 12%}' +
      // 虎扑抠图是 569×320 的横图、人在正中间：卡片人像框都是竖的，按高度铺满（裁掉两边透明的部分），人才够大
      '.hp-ph.bare>.hp-photo{object-fit:cover;object-position:50% 100%}' +
      // 方形老照片：铺满、对准脸，卡片里底部渐隐进名字栏
      '.hp-ph.boxed>.hp-photo{object-fit:cover;object-position:50% 18%}' +
      '.hp-ph.bare.boxed>.hp-photo{object-fit:cover;object-position:50% 15%;border-radius:8px 8px 0 0;' +
      '-webkit-mask-image:linear-gradient(#000 68%,transparent 100%);mask-image:linear-gradient(#000 68%,transparent 100%)}';
    document.head.appendChild(st);
  }
  // 本地图片：images/ 文件夹里有图就用图，没有就显示卡通形象。
  // 依次尝试：名字@年份（冠军球员当赛季）→ 名字，扩展名 png / jpg / webp
  const EXTS = ['png', 'jpg', 'webp'];
  function photoCandidates(p) {
    const year = p.from && p.from !== '现役' ? p.season : null;
    const names = year ? [`${p.name}@${year}`, p.name] : [p.name];
    return names.flatMap((n) => EXTS.map((e) => `images/${encodeURIComponent(n)}.${e}`));
  }
  const failed = new Set(); // 已确认不存在的图片，不再重复尝试
  function avatarHTML(p) {
    const list = photoCandidates(p).filter((u) => !failed.has(u));
    const img = list.length ? `<img class="av-photo" alt="" src="${list[0]}" data-try="${list.slice(1).join('|')}">` : '';
    return avatarSVG(p) + img;
  }
  // 图片加载失败时换下一个候选；全部失败就移除，露出下面的卡通形象
  if (typeof document !== 'undefined') {
    document.addEventListener('error', (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.classList.contains('av-photo')) return;
      failed.add(img.getAttribute('src'));
      const rest = (img.dataset.try || '').split('|').filter(Boolean);
      if (rest.length) {
        img.dataset.try = rest.slice(1).join('|');
        img.src = rest[0];
      } else img.remove();
    }, true);
  }

  root.Avatar = { avatarSVG, avatarHTML, kitOf, STYLES, preloadPhotos, photoOf: hupuPhoto };
})(typeof window !== 'undefined' ? window : globalThis);
