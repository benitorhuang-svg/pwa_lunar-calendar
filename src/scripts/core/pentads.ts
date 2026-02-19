/**
 * 七十二候 (72 Pentads of the Solar Terms)
 * 每個節氣分為三候，每候約 5 天。
 * 描述自然界動物、植物、天氣的變化。
 */

export interface Pentad {
    name: string;
    meaning: string;
}

// 24 節氣順序：小寒 -> 冬至 (注意：lunar.ts 的 SOLAR_TERMS 順序)
// lunar.ts SOLAR_TERMS: 小寒(0), 大寒(1), 立春(2), ... 冬至(23)
// 我們依此順序建立數據。

export const PENTADS: Pentad[][] = [
    // 0. 小寒 (Minor Cold)
    [
        { name: "雁北鄉", meaning: "大雁開始向北遷移" },
        { name: "鵲始巢", meaning: "喜鵲開始築巢" },
        { name: "雉始雊", meaning: "野雞開始鳴叫" },
    ],
    // 1. 大寒 (Major Cold)
    [
        { name: "雞乳", meaning: "母雞開始孵育小雞" },
        { name: "徵鳥厲疾", meaning: "猛禽處於捕食能力最強的狀態" },
        { name: "水澤腹堅", meaning: "冰層凍得最厚實" },
    ],
    // 2. 立春 (Start of Spring)
    [
        { name: "東風解凍", meaning: "東風送暖，大地解凍，萬物復甦之始。" },
        { name: "蟄蟲始振", meaning: "冬眠的蟄蟲感受到春氣，開始在洞中甦醒蠕動。" },
        {
            name: "魚上冰",
            meaning: "東風解凍，河水初融。魚兒因水暖游至水面，背脊若隱若現，宛如負冰而行。",
        },
    ],
    // 3. 雨水 (Rain Water)
    [
        { name: "獺祭魚", meaning: "水獺開始捕魚，並將魚陳列在岸邊，如同祭祀天地。" },
        { name: "候雁北", meaning: "大雁感知陰陽二氣的更替，開始從南方飛回北方。" },
        { name: "草木萌動", meaning: "細雨潤物，草木隨著陽氣萌發，抽出嫩芽。" },
    ],
    // 4. 驚蟄 (Awakening of Insects)
    [
        { name: "桃始華", meaning: "桃花開始盛開" },
        { name: "倉庚鳴", meaning: "黃鸝鳥開始鳴叫" },
        { name: "鷹化為鳩", meaning: "老鷹躲起來繁殖，布穀鳥出現" },
    ],
    // 5. 春分 (Spring Equinox)
    [
        { name: "玄鳥至", meaning: "燕子從南方飛來" },
        { name: "雷乃發聲", meaning: "開始打雷" },
        { name: "始電", meaning: "開始出現閃電" },
    ],
    // 6. 清明 (Pure Brightness)
    [
        { name: "桐始華", meaning: "桐樹開花" },
        { name: "田鼠化為鴽", meaning: "田鼠躲回地洞，鵪鶉出來活動" },
        { name: "虹始見", meaning: "雨後開始出現彩虹" },
    ],
    // 7. 穀雨 (Grain Rain)
    [
        { name: "萍始生", meaning: "浮萍開始生長" },
        { name: "鳴鳩拂其羽", meaning: "布穀鳥拍打翅膀" },
        { name: "戴勝降于桑", meaning: "戴勝鳥停在桑樹上" },
    ],
    // 8. 立夏 (Start of Summer)
    [
        { name: "螻蟈鳴", meaning: "青蛙開始鳴叫" },
        { name: "蚯蚓出", meaning: "蚯蚓鑽出地面" },
        { name: "王瓜生", meaning: "王瓜的蔓藤開始生長" },
    ],
    // 9. 小滿 (Grain Buds)
    [
        { name: "苦菜秀", meaning: "苦菜枝葉繁茂" },
        { name: "靡草死", meaning: "喜陰的草類枯死" },
        { name: "麥秋至", meaning: "麥子開始成熟" },
    ],
    // 10. 芒種 (Grain in Ear)
    [
        { name: "螳螂生", meaning: "小螳螂破殼而出" },
        { name: "鵙始鳴", meaning: "伯勞鳥開始鳴叫" },
        { name: "反舌無聲", meaning: "反舌鳥停止鳴叫" },
    ],
    // 11. 夏至 (Summer Solstice)
    [
        { name: "鹿角解", meaning: "鹿角開始脫落" },
        { name: "蜩始鳴", meaning: "蟬開始鳴叫" },
        { name: "半夏生", meaning: "藥草半夏開始生長" },
    ],
    // 12. 小暑 (Minor Heat)
    [
        { name: "溫風至", meaning: "風中帶著熱浪" },
        { name: "蟋蟀居宇", meaning: "蟋蟀躲到屋簷下" },
        { name: "鷹始摯", meaning: "老鷹開始學習搏擊" },
    ],
    // 13. 大暑 (Major Heat)
    [
        { name: "腐草為螢", meaning: "枯草腐化，螢火蟲飛舞" },
        { name: "土潤溽暑", meaning: "土壤濕潤，天氣悶熱" },
        { name: "大雨時行", meaning: "常有雷雨降臨" },
    ],
    // 14. 立秋 (Start of Autumn)
    [
        { name: "涼風至", meaning: "涼爽的風開始吹拂" },
        { name: "白露降", meaning: "清晨有白茫茫的露珠" },
        { name: "寒蟬鳴", meaning: "寒蟬感應陰氣而鳴" },
    ],
    // 15. 處暑 (Limit of Heat)
    [
        { name: "鷹乃祭鳥", meaning: "老鷹捕食鳥類" },
        { name: "天地始肅", meaning: "萬物開始凋零" },
        { name: "禾乃登", meaning: "稻穀成熟" },
    ],
    // 16. 白露 (White Dew)
    [
        { name: "鴻雁來", meaning: "大雁開始南飛" },
        { name: "玄鳥歸", meaning: "燕子飛回南方" },
        { name: "群鳥養羞", meaning: "鳥兒儲備過冬食物" },
    ],
    // 17. 秋分 (Autumn Equinox)
    [
        { name: "雷始收聲", meaning: "雷聲消失" },
        { name: "蟄蟲坯戶", meaning: "蟲類封住洞口準備過冬" },
        { name: "水始涸", meaning: "河水開始乾涸" },
    ],
    // 18. 寒露 (Cold Dew)
    [
        { name: "鴻雁來賓", meaning: "最後一批大雁南飛" },
        { name: "雀入大水為蛤", meaning: "雀鳥不見，海邊出現很多蛤蜊" },
        { name: "菊有黃華", meaning: "菊花盛開" },
    ],
    // 19. 霜降 (Frost's Descent)
    [
        { name: "豺乃祭獸", meaning: "豺狼捕獵野獸以此祭天" },
        { name: "草木黃落", meaning: "樹葉枯黃掉落" },
        { name: "蟄蟲咸俯", meaning: "冬眠的蟲子全都不動了" },
    ],
    // 20. 立冬 (Start of Winter)
    [
        { name: "水始冰", meaning: "水面開始結冰" },
        { name: "地始凍", meaning: "土地開始凍結" },
        { name: "雉入大水為蜃", meaning: "野雞不多見，海邊出現大蛤" },
    ],
    // 21. 小雪 (Minor Snow)
    [
        { name: "虹藏不見", meaning: "彩虹不再出現" },
        { name: "天氣上升地氣下降", meaning: "天地不通，陰陽不交" },
        { name: "閉塞而成冬", meaning: "萬物閉藏進入冬天" },
    ],
    // 22. 大雪 (Major Snow)
    [
        { name: "鶡鴠不鳴", meaning: "寒號鳥停止鳴叫" },
        { name: "虎始交", meaning: "老虎開始求偶" },
        { name: "荔挺出", meaning: "蘭草抽出新芽" },
    ],
    // 23. 冬至 (Winter Solstice)
    [
        { name: "蚯蚓結", meaning: "蚯蚓蜷曲身體" },
        { name: "麋角解", meaning: "麋鹿的角脫落" },
        { name: "水泉動", meaning: "山泉水開始流動" },
    ],
];
