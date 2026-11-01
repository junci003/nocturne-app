/*
 * 花材档案（数据来源：florist-recipe skill / references/flower-library.md）
 * 价格为一线城市花市零售参考区间（元），单位按「枝」或「扎」。
 * 所有价格随季节、产地、地区波动 30–50%，输出时必须标注「以当地为准」。
 * months: 该花材在哪些月份当季可用（含边界）。
 * unit: 'stem' 枝 | 'bunch' 扎（1 扎 ≈ 5–10 枝）。
 * smell: 'none' | 'light' | 'strong'
 * toxic: 对猫狗有毒
 * pollen: 花粉量大，过敏人群避开
 * taboo: 不适合的场合关键词
 */
window.FLOWER_DB = (function () {
  const M = {
    all: [1,2,3,4,5,6,7,8,9,10,11,12],
    s69: [6,7,8,9],
    s46: [4,5,6],
    s124: [12,1,2,3,4],
    s25: [2,3,4,5],
    s58: [5,6,7,8],
    s710: [7,8,9,10],
    s123: [12,1,2,3],
    s912: [9,10,11,12],
    s112: [11,12,1,2],
    s24: [2,3,4],
    s47: [4,5,6,7],
    s610: [6,7,8,9,10],
    s57: [5,6,7],
  };

  const FLOWERS = [
    // ===== 主花 =====
    { name:'玫瑰', role:'main', colors:['红','粉','白','香槟','黄'], price:[6,10], unit:'stem', vaseLife:[5,7], months:M.all, smell:'light', toxic:false, pollen:false, taboo:[], notes:'最通用。去刺后斜剪，外层保护瓣可掰掉' },
    { name:'洋桔梗', role:'main', colors:['粉','白','紫','香槟'], price:[5,8], unit:'stem', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'最耐放的主花，新手首选' },
    { name:'康乃馨', role:'main', colors:['粉','红','白','复色'], price:[3,5], unit:'stem', vaseLife:[10,14], months:M.all, smell:'light', toxic:false, pollen:false, taboo:[], notes:'花期最长。茎节脆，剪在节上方' },
    { name:'向日葵', role:'main', colors:['黄'], price:[8,12], unit:'stem', vaseLife:[5,7], months:M.s69, smell:'light', toxic:false, pollen:true, taboo:[], notes:'花粉多，过敏者避开' },
    { name:'芍药', role:'main', colors:['粉','白','深红'], price:[15,25], unit:'stem', vaseLife:[3,5], months:M.s46, smell:'light', toxic:false, pollen:false, taboo:[], notes:'盛开后极短。买花苞，室温下自行开放' },
    { name:'郁金香', role:'main', colors:['红','粉','黄','白'], price:[6,9], unit:'stem', vaseLife:[5,7], months:M.s124, smell:'none', toxic:true, pollen:false, taboo:[], notes:'会继续长高，插时要留余量。对猫有毒' },
    { name:'洋牡丹', role:'main', colors:['粉','橙','白','酒红'], price:[8,12], unit:'stem', vaseLife:[6,9], months:M.s25, smell:'none', toxic:false, pollen:false, taboo:[], notes:'茎中空易折，用铁丝穿茎固定' },
    { name:'绣球', role:'main', colors:['蓝','粉','白','紫'], price:[20,30], unit:'stem', vaseLife:[3,5], months:M.s58, smell:'none', toxic:true, pollen:false, taboo:[], notes:'极易脱水，需喷水+深水。对宠物有毒' },
    { name:'大丽花', role:'main', colors:['红','橙','粉','黄'], price:[10,18], unit:'stem', vaseLife:[5,7], months:M.s710, smell:'none', toxic:false, pollen:false, taboo:[], notes:'茎中空，剪后立即入水' },
    { name:'百合', role:'main', colors:['白','粉','黄'], price:[10,18], unit:'stem', vaseLife:[7,10], months:M.all, smell:'strong', toxic:true, pollen:false, taboo:[], notes:'对猫剧毒，有猫家庭一律排除。花粉易染色' },
    { name:'马蹄莲', role:'main', colors:['白','粉','黄','紫'], price:[8,14], unit:'stem', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'线条感强，适合极简与东方风格' },
    { name:'红掌', role:'main', colors:['红','粉','白'], price:[12,20], unit:'stem', vaseLife:[15,20], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'花期极长，热带感' },
    { name:'朱顶红', role:'main', colors:['红','白','条纹'], price:[25,40], unit:'stem', vaseLife:[7,10], months:M.s123, smell:'none', toxic:false, pollen:false, taboo:[], notes:'单枝即可成景，适合做焦点' },
    { name:'帝王花', role:'main', colors:['粉','白'], price:[40,80], unit:'stem', vaseLife:[20,25], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'高价，可干花保存' },

    // ===== 配花 =====
    { name:'小雏菊', role:'filler', colors:['白','粉'], price:[2,4], unit:'stem', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'最通用的填缝花，成簇插不要散点' },
    { name:'香雪兰', role:'filler', colors:['白','黄','粉','紫'], price:[4,7], unit:'stem', vaseLife:[6,9], months:M.s124, smell:'light', toxic:false, pollen:false, taboo:[], notes:'有香，洋桔梗的最佳替代' },
    { name:'翠菊', role:'filler', colors:['紫','粉','白'], price:[3,5], unit:'stem', vaseLife:[7,10], months:M.s610, smell:'none', toxic:false, pollen:false, taboo:[], notes:'体量比雏菊稍大' },
    { name:'金鱼草', role:'filler', colors:['粉','黄','白','橙'], price:[5,8], unit:'stem', vaseLife:[6,9], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'有纵向线条，适合拉高' },
    { name:'飞燕草', role:'filler', colors:['蓝','紫','粉','白'], price:[10,18], unit:'stem', vaseLife:[6,9], months:M.s58, smell:'none', toxic:false, pollen:false, taboo:[], notes:'蓝色系稀缺选项，体量高' },
    { name:'蕾丝花', role:'filler', colors:['白'], price:[8,12], unit:'stem', vaseLife:[5,7], months:M.s47, smell:'none', toxic:false, pollen:false, taboo:[], notes:'轻盈，替代满天星更高级' },
    { name:'紫罗兰', role:'filler', colors:['紫','白','粉'], price:[5,8], unit:'stem', vaseLife:[5,7], months:M.s124, smell:'light', toxic:false, pollen:true, taboo:[], notes:'有香，过敏者慎用' },
    { name:'六出花', role:'filler', colors:['粉','白','黄'], price:[5,8], unit:'stem', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'耐放，叶多需修' },
    { name:'洋甘菊', role:'filler', colors:['白','黄'], price:[3,6], unit:'stem', vaseLife:[5,7], months:M.s47, smell:'none', toxic:false, pollen:false, taboo:[], notes:'田园感，易脱水' },
    { name:'石竹', role:'filler', colors:['粉','红','白'], price:[3,5], unit:'stem', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'便宜耐放' },

    // ===== 叶材（按扎） =====
    { name:'尤加利', role:'foliage', colors:['灰绿'], price:[12,18], unit:'bunch', vaseLife:[10,14], months:M.all, smell:'light', toxic:false, pollen:false, taboo:[], notes:'最通用。可干花，有淡香' },
    { name:'银叶菊', role:'foliage', colors:['银灰'], price:[10,15], unit:'bunch', vaseLife:[10,14], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'银灰色，中和粉色很好看' },
    { name:'雪柳', role:'foliage', colors:['绿'], price:[15,25], unit:'bunch', vaseLife:[10,14], months:M.s24, smell:'none', toxic:false, pollen:false, taboo:[], notes:'线条硬挺，东方风格首选' },
    { name:'南天竹', role:'foliage', colors:['红','绿'], price:[12,20], unit:'bunch', vaseLife:[10,14], months:M.s912, smell:'none', toxic:false, pollen:false, taboo:[], notes:'秋日红叶，中式感强' },
    { name:'散尾葵', role:'foliage', colors:['绿'], price:[10,15], unit:'bunch', vaseLife:[10,14], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'大片叶，做底部体量' },
    { name:'龟背竹叶', role:'foliage', colors:['绿'], price:[8,15], unit:'stem', vaseLife:[10,15], months:M.all, smell:'none', toxic:true, pollen:false, taboo:[], notes:'单叶片即成景。对宠物有毒' },
    { name:'松枝', role:'foliage', colors:['绿'], price:[10,20], unit:'bunch', vaseLife:[15,20], months:M.s112, smell:'light', toxic:false, pollen:false, taboo:[], notes:'冬季、圣诞感' },
    { name:'肾蕨', role:'foliage', colors:['绿'], price:[8,12], unit:'bunch', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'细碎，填底部' },
    { name:'常春藤', role:'foliage', colors:['绿'], price:[10,15], unit:'bunch', vaseLife:[7,10], months:M.all, smell:'none', toxic:true, pollen:false, taboo:[], notes:'垂坠，适合高瓶。对宠物有毒' },
    { name:'高山羊齿', role:'foliage', colors:['绿'], price:[10,15], unit:'bunch', vaseLife:[10,14], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'深绿，体量适中' },

    // ===== 点缀 =====
    { name:'满天星', role:'accent', colors:['白'], price:[2,3], unit:'stem', vaseLife:[7,10], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'只用 3–5 处，多了显廉价' },
    { name:'勿忘我', role:'accent', colors:['蓝','紫'], price:[2,4], unit:'stem', vaseLife:[10,14], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'可干花' },
    { name:'情人草', role:'accent', colors:['紫','粉'], price:[3,5], unit:'stem', vaseLife:[10,20], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'紫粉，轻盈' },
    { name:'水晶草', role:'accent', colors:['白'], price:[3,5], unit:'stem', vaseLife:[10,20], months:M.all, smell:'none', toxic:false, pollen:false, taboo:[], notes:'细碎白点' },
  ];

  // 替换关系（同角色、同色系、体量接近）。diff 为「换后单价 - 原单价」的粗略方向。
  const SUBSTITUTIONS = {
    '洋桔梗': [{ to:'香雪兰', diff:0, note:'形态更柔，枝数可不变' }, { to:'康乃馨', diff:-2, note:'花瓣较硬，观感略逊' }],
    '白玫瑰': [{ to:'白洋牡丹', diff:-14, note:'体量更小，需增 1–2 枝' }],
    '玫瑰': [{ to:'洋桔梗', diff:-3, note:'需增 1–2 枝补体量' }],
    '芍药': [{ to:'洋牡丹', diff:-10, note:'体量接近，最接近的替代' }],
    '郁金香': [{ to:'马蹄莲', diff:4, note:'都属线条型，观感差异大' }],
    '尤加利': [{ to:'银叶菊', diff:6, note:'色更灰，适合冷调' }, { to:'雪柳', diff:8, note:'线条更硬，风格更东方' }],
    '满天星': [{ to:'蕾丝花', diff:8, note:'更高级，用量减半' }],
    '绣球': [{ to:'康乃馨', diff:-20, note:'体量差大，需 3–4 枝替代 1 枝' }],
  };

  // 花器（单独计价，不占花材预算）。mouth=瓶口直径cm，height=瓶高cm。
  const VESSELS = [
    { name:'细口玻璃瓶', mouth:6, height:14, price:[25,35], shape:'tall', note:'适合少量主花的极简瓶插' },
    { name:'圆形玻璃花瓶', mouth:9, height:18, price:[35,50], shape:'round', note:'通用桌面瓶，冠幅适中' },
    { name:'宽口陶罐', mouth:12, height:16, price:[40,60], shape:'wide', note:'低矮饱满，适合餐桌中心' },
    { name:'高身落地瓶', mouth:14, height:30, price:[60,90], shape:'floor', note:'落地布置，需要更多花材' },
    { name:'小口梅瓶', mouth:5, height:22, price:[30,45], shape:'tall', note:'东方线条感，少而精' },
  ];

  return { FLOWERS, SUBSTITUTIONS, VESSELS };
})();
