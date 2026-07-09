import type { DiagnosisResult, LetterTone, PlantSignalInput, PlantStatus } from "@/types/plant";

const speciesPool = [
  "绿萝",
  "龟背竹",
  "琴叶榕",
  "多肉",
  "发财树",
  "虎皮兰",
  "薄荷",
  "栀子花",
  "吊兰"
];

const speciesHints: Array<[RegExp, string]> = [
  [/pothos|绿萝|lvluo/i, "绿萝"],
  [/monstera|龟背|guibei/i, "龟背竹"],
  [/fiddle|琴叶|qinye/i, "琴叶榕"],
  [/succulent|多肉|duorou/i, "多肉"],
  [/money|发财|facai/i, "发财树"],
  [/snake|虎皮|hupi/i, "虎皮兰"],
  [/mint|薄荷|bohe/i, "薄荷"],
  [/gardenia|栀子|zhizi/i, "栀子花"],
  [/spider|吊兰|diaolan/i, "吊兰"]
];

function hashText(value: string) {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function pickSpecies(input: PlantSignalInput) {
  const source = `${input.plantName || ""} ${input.imageName || ""} ${input.notes || ""}`;
  const hinted = speciesHints.find(([regex]) => regex.test(source));
  if (hinted) return hinted[1];
  return speciesPool[hashText(source || "plant") % speciesPool.length];
}

function scorePlant(input: PlantSignalInput) {
  let score = 82;
  const symptoms = new Set(input.symptoms);

  if (symptoms.has("yellow_leaf")) score -= 18;
  if (symptoms.has("droopy")) score -= 20;
  if (symptoms.has("brown_edge")) score -= 15;
  if (symptoms.has("mold")) score -= 24;
  if (symptoms.has("bugs")) score -= 22;
  if (symptoms.has("bare_stem")) score -= 26;
  if (input.watering === "daily") score -= 18;
  if (input.watering === "forgotten") score -= 15;
  if (input.potDrainage === "no") score -= 18;
  if (input.roomLight === "low") score -= 12;
  if (input.roomLight === "direct") score -= symptoms.has("brown_edge") ? 12 : 0;

  return Math.max(4, Math.min(98, score));
}

function statusFromScore(score: number): PlantStatus {
  if (score <= 18) return "dead";
  if (score <= 42) return "dying";
  if (score <= 70) return "stressed";
  return "healthy";
}

function causeFromSignals(input: PlantSignalInput) {
  const symptoms = new Set(input.symptoms);
  if (symptoms.has("mold") || input.watering === "daily" || input.potDrainage === "no") {
    return "疑似根系窒息：水太多、盆太闷，我的根在土里开了一个小型沼泽派对。";
  }
  if (input.watering === "forgotten" || symptoms.has("droopy")) {
    return "疑似长期缺水：我不是仙人掌，不能靠回忆里的水分活着。";
  }
  if (symptoms.has("brown_edge") && input.roomLight === "direct") {
    return "疑似暴晒灼伤：我需要阳光，不需要被阳光审判。";
  }
  if (symptoms.has("bugs")) {
    return "疑似虫害围攻：叶背已经开了不受我邀请的地下会议。";
  }
  if (symptoms.has("yellow_leaf")) {
    return "疑似光照或浇水节奏混乱：我每天都在猜今天是沙漠还是水牢。";
  }
  return "状态尚可：目前主要死因是主人太焦虑，以及我稍微有点戏多。";
}

function buildEvidence(input: PlantSignalInput) {
  const evidence = [];
  if (input.symptoms.includes("yellow_leaf")) evidence.push("黄叶提示浇水、光照或养分节奏失衡。");
  if (input.symptoms.includes("droopy")) evidence.push("叶片下垂通常和缺水、烂根或温差压力相关。");
  if (input.symptoms.includes("brown_edge")) evidence.push("焦边可能来自暴晒、空气过干、肥伤或水质刺激。");
  if (input.symptoms.includes("mold")) evidence.push("霉斑/白毛说明土壤环境偏湿且通风不足。");
  if (input.symptoms.includes("bugs")) evidence.push("虫害需要隔离观察，优先检查叶背和新芽。");
  if (input.potDrainage === "no") evidence.push("花盆无排水孔会显著提高烂根风险。");
  if (input.roomLight === "low") evidence.push("弱光环境会降低蒸腾和恢复速度。");
  return evidence.length ? evidence : ["没有明显重症信号，建议继续观察新叶和土壤干湿。"];
}

function makeLastWords(species: string, cause: string, score: number) {
  return {
    title: `${species}遗书：请把我的盆留给下一位勇士`,
    body: [
      "亲爱的饲养员：",
      "",
      `当你看到这封信的时候，我的健康分只剩 ${score}。我曾经也绿过，真的。`,
      cause,
      "我不怪你，毕竟你连自己喝水都靠手机提醒。只是下次遇到植物，请先摸土，不要只摸良心。",
      "",
      "我的遗愿很简单：把枯叶剪掉，把盆洗干净，把我的故事发出去。让大家知道，爱不是每天浇水，爱是知道什么时候住手。",
      "",
      "此致",
      "一株已经看开了的植物"
    ].join("\n")
  };
}

function makeRescueLetter(species: string, cause: string, score: number) {
  return {
    title: `${species}求救信：我还能抢救一下，别急着买新的`,
    body: [
      "主人，我先声明：我还没死，我只是长得很有临终感。",
      "",
      `目前健康分 ${score}。主要嫌疑是：${cause}`,
      "请你从现在开始停止凭感觉养我，按清单来。植物不是气氛组，我需要光、水、空气和一个不会积水的家。",
      "",
      "如果 7 天后我开始挺叶、长新芽、黄叶停止扩散，你可以继续叫我宝贝。否则，请把我移到更亮通风处，并检查根系。"
    ].join("\n")
  };
}

function rescueItems(input: PlantSignalInput) {
  const items = [
    {
      id: "moisture-meter",
      label: "土壤湿度计",
      why: "别再用玄学判断浇水，先看土干到哪里。",
      priority: "must" as const,
      buyHint: "搜索：土壤湿度计 绿植"
    },
    {
      id: "pruner",
      label: "消毒剪刀",
      why: "剪掉烂叶、枯枝和感染部位，减少继续消耗。",
      priority: "must" as const,
      buyHint: "搜索：园艺剪刀 酒精棉片"
    },
    {
      id: "well-draining-soil",
      label: "透气土 / 珍珠岩",
      why: "改善排水和根系呼吸，尤其适合烂根风险高的植物。",
      priority: input.potDrainage === "no" || input.watering === "daily" ? "must" as const : "nice" as const,
      buyHint: "搜索：通用营养土 珍珠岩"
    },
    {
      id: "grow-light",
      label: "补光灯",
      why: "弱光房间可以补足恢复期光照，但不要贴脸暴晒。",
      priority: input.roomLight === "low" ? "must" as const : "nice" as const,
      buyHint: "搜索：植物补光灯 全光谱"
    },
    {
      id: "insect-spray",
      label: "温和杀虫喷剂 / 小白药",
      why: "发现虫害时先隔离，再按说明处理叶背和土表。",
      priority: input.symptoms.includes("bugs") ? "must" as const : "nice" as const,
      buyHint: "搜索：绿植杀虫喷雾 小黑飞"
    }
  ];

  return items;
}

function rescueSteps(input: PlantSignalInput) {
  const steps = [
    {
      id: "quarantine",
      title: "先隔离",
      detail: "把它从其它植物旁边挪开，避免虫害或霉菌扩散，也方便观察。",
      timing: "今天"
    },
    {
      id: "soil-check",
      title: "检查土壤和盆底",
      detail: "手指插入 3-5cm 或用湿度计测，盆底不能长期积水。",
      timing: "今天"
    },
    {
      id: "trim",
      title: "修剪不可逆部位",
      detail: "剪掉完全枯黄、发黑、霉斑严重的叶片，剪刀先消毒。",
      timing: "24 小时内"
    },
    {
      id: "light",
      title: "调整光照",
      detail: input.roomLight === "direct" ? "移到明亮散射光处，避免正午直晒。" : "移到明亮散射光处，弱光房间考虑补光。",
      timing: "接下来 7 天"
    },
    {
      id: "water-plan",
      title: "重设浇水规则",
      detail: "不要按日历浇水。大多数室内植物等表土明显变干再浇透，盆底流出的水倒掉。",
      timing: "长期"
    }
  ];

  if (input.symptoms.includes("bugs")) {
    steps.splice(2, 0, {
      id: "bug-check",
      title: "处理虫害",
      detail: "重点检查叶背、新芽、土表。先物理擦除，再用温和杀虫产品按说明处理。",
      timing: "今天"
    });
  }

  return steps;
}

export function diagnosePlant(input: PlantSignalInput): DiagnosisResult {
  const species = pickSpecies(input);
  const healthScore = scorePlant(input);
  const status = statusFromScore(healthScore);
  const cause = causeFromSignals(input);
  const tone: LetterTone = status === "dead" ? "last_words" : "rescue_note";
  const letter = tone === "last_words" ? makeLastWords(species, cause, healthScore) : makeRescueLetter(species, cause, healthScore);
  const id = `${Date.now()}-${Math.abs(hashText(JSON.stringify(input))).toString(16)}`;

  return {
    id,
    detectedSpecies: species,
    nickname: `${species}${status === "dead" ? "遗像" : status === "dying" ? "抢救中" : "观察中"}`,
    confidence: Math.min(96, 64 + (input.imageName ? 15 : 0) + (input.plantName ? 12 : 0)),
    status,
    healthScore,
    deathCause: cause,
    evidence: buildEvidence(input),
    letterTone: tone,
    letterTitle: letter.title,
    letterBody: letter.body,
    rescueItems: rescueItems(input),
    rescueSteps: rescueSteps(input),
    tags: [species, status, input.roomLight, input.watering].filter(Boolean),
    createdAt: new Date().toISOString()
  };
}
