// 玩家自己的造型：15 个真人形象（进入联盟前随机一个，可以换 2 次）
// 来源：用户自己的素材包「200 个现代都市人物资料卡」（桌面「2800个 漫剧人物+提示词资产汇总」），
//   把资料卡左边正面全身照的头到胸口抠成 569×320 透明底（和虎扑球员抠图一样的构图），见 test/face-cutout.html、scripts/face-cutout.js
// 2026-11-19：一开始是 15 个手绘卡通（第 1 个仿杨瀚森），用户给了 5 号资料卡说「用这个人物建模」；
//   第一版把真人头拼在画的球衣上，用户说「脸 P 的好假」→ 改成整张照片抠；然后用户同意其余 14 个也从素材包里挑
// 用法：Faces.svg(lookIndex, kit, { bare }) → <svg>；Faces.LOOKS[i].name 是造型名字；kit 暂时用不到（穿的是照片里自己的衣服）
(function (root) {
  // card：素材包里资料卡的编号（PICKS 顺序一样）
  const LOOKS = [
    { name: '东方少帅', card: 5 }, // 黄黑冲锋衣，用户指定的「类似杨瀚森的帅气中国人面孔」
    { name: '硬核中锋', card: 3 }, // 黑 T 恤 + 狗牌
    { name: '耳机少年', card: 8 }, // 灰卫衣 + 耳机
    { name: '运动少年', card: 14 }, // 运动球衫
    { name: '皮衣狠人', card: 16 }, // 皮夹克 + 项链
    { name: '墨镜巨星', card: 13 }, // 墨镜 + 银色外套
    { name: '健身狂魔', card: 33 }, // 背心 + 毛巾
    { name: '眼镜射手', card: 21 }, // 灰卫衣 + 眼镜
    { name: '工装硬汉', card: 29 }, // 工装马甲
    { name: '格子学长', card: 37 }, // 格子衬衫
    { name: '暖男后卫', card: 43 }, // 米色针织
    { name: '高冷杀手', card: 50 }, // 黑色高领
    { name: '铁血老将', card: 104 }, // 中年老将
    { name: '街头少年', card: 164 }, // 军绿夹克
    { name: '港风浪子', card: 135 }, // 花衬衫
  ].map((L, i) => ({ ...L, photo: `img/players/me/look${i}.webp` }));

  // opts.bare：竖版卡片里人物「站」在卡面底部（和虎扑照片一样按高度铺满、底部对齐）
  function svg(i, kit, opts = {}) {
    const L = LOOKS[((i % LOOKS.length) + LOOKS.length) % LOOKS.length];
    const fit = opts.bare ? 'xMidYMax slice' : 'xMidYMin slice';
    return `<svg viewBox="0 -14 569 334" preserveAspectRatio="${fit}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${L.name}">
      <image href="${api.base}${L.photo}" x="0" y="0" width="569" height="320"/></svg>`;
  }

  // base：图片路径的前缀（test/ 里的页面设成 '../'）
  const api = { LOOKS, svg, count: LOOKS.length, base: '' };
  root.Faces = api;
})(typeof window !== 'undefined' ? window : globalThis);
