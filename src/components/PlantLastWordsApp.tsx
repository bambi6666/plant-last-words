"use client";

import clsx from "clsx";
import {
  Archive,
  BadgeAlert,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Home,
  Leaf,
  Loader2,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  Send,
  Skull,
  Sparkles,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DiagnosisResult, PlantSignalInput, PlantStatus } from "@/types/plant";

type StoredPlant = DiagnosisResult & { imageUrl?: string };
type AppTab = "scan" | "library" | "letter";

const symptomOptions = [
  { id: "yellow_leaf", label: "黄叶", code: "黄" },
  { id: "droopy", label: "耷拉", code: "塌" },
  { id: "brown_edge", label: "焦边", code: "焦" },
  { id: "mold", label: "霉土", code: "霉" },
  { id: "bugs", label: "虫害", code: "虫" },
  { id: "bare_stem", label: "秃杆", code: "秃" }
];

const statusCopy: Record<PlantStatus, { label: string; tone: string; hint: string }> = {
  dead: { label: "已阵亡", tone: "遗书模式", hint: "适合发朋友圈纪念" },
  dying: { label: "濒危", tone: "求救模式", hint: "马上进入抢救流程" },
  stressed: { label: "亚健康", tone: "观察模式", hint: "还有谈判空间" },
  healthy: { label: "健康", tone: "夸夸模式", hint: "暂时不要瞎折腾" }
};

const seedPlants: StoredPlant[] = [
  {
    id: "seed-1",
    detectedSpecies: "绿萝",
    nickname: "办公室绿萝抢救中",
    confidence: 84,
    status: "dying",
    healthScore: 34,
    deathCause: "疑似长期缺水：我不是仙人掌，不能靠回忆里的水分活着。",
    evidence: ["叶片下垂", "盆土干到可以当饼干"],
    letterTone: "rescue_note",
    letterTitle: "绿萝求救信：我还能抢救一下",
    letterBody: "主人，我还没死，我只是长得很有临终感。请先浇透，再放到明亮散射光处。",
    rescueItems: [
      {
        id: "seed-water-meter",
        label: "土壤湿度计",
        why: "停止凭感觉浇水。",
        priority: "must",
        buyHint: "搜索：土壤湿度计 绿植"
      }
    ],
    rescueSteps: [
      {
        id: "seed-water",
        title: "浇透一次",
        detail: "盆底有水流出后倒掉托盘积水。",
        timing: "今天"
      }
    ],
    tags: ["绿萝", "dying"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: "seed-2",
    detectedSpecies: "多肉",
    nickname: "窗台多肉遗像",
    confidence: 78,
    status: "dead",
    healthScore: 12,
    deathCause: "疑似根系窒息：盆太闷，根在土里开了小型沼泽派对。",
    evidence: ["叶片透明化", "盆底无排水"],
    letterTone: "last_words",
    letterTitle: "多肉遗书：请把我的盆留给下一位勇士",
    letterBody: "我曾经胖过，真的。下次不要三天两头浇我，我是多肉，不是海带。",
    rescueItems: [],
    rescueSteps: [],
    tags: ["多肉", "dead"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  }
];

const fallbackItems = [
  {
    id: "fallback-meter",
    label: "土壤湿度计",
    why: "先判断土壤干湿，再决定浇水。",
    priority: "must" as const,
    buyHint: "搜索：土壤湿度计 绿植"
  },
  {
    id: "fallback-pruner",
    label: "消毒剪刀",
    why: "剪掉不可逆的枯叶和坏死组织。",
    priority: "must" as const,
    buyHint: "搜索：园艺剪刀 酒精棉片"
  }
];

const fallbackSteps = [
  {
    id: "fallback-check",
    title: "摸土和看盆底",
    detail: "确认 3-5cm 深处是否仍湿，托盘不能积水。",
    timing: "今天"
  },
  {
    id: "fallback-light",
    title: "换到明亮散射光",
    detail: "先别暴晒，给它一个不刺激的恢复环境。",
    timing: "接下来 7 天"
  }
];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function statusIcon(status: PlantStatus) {
  if (status === "dead") return <Skull size={15} />;
  if (status === "dying") return <BadgeAlert size={15} />;
  if (status === "stressed") return <Leaf size={15} />;
  return <CheckCircle2 size={15} />;
}

export default function PlantLastWordsApp() {
  const [activeTab, setActiveTab] = useState<AppTab>("scan");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [plantName, setPlantName] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>(["yellow_leaf", "droopy"]);
  const [roomLight, setRoomLight] = useState<PlantSignalInput["roomLight"]>("medium");
  const [watering, setWatering] = useState<PlantSignalInput["watering"]>("weekly");
  const [potDrainage, setPotDrainage] = useState<PlantSignalInput["potDrainage"]>("unknown");
  const [notes, setNotes] = useState("");
  const [activeStatus, setActiveStatus] = useState<PlantStatus | "all">("all");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [plants, setPlants] = useState<StoredPlant[]>(seedPlants);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const cached = window.localStorage.getItem("plant-last-words-archive");
    if (!cached) return;
    try {
      setPlants(JSON.parse(cached));
    } catch {
      setPlants(seedPlants);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("plant-last-words-archive", JSON.stringify(plants));
  }, [plants]);

  const currentPlant = (diagnosis ? { ...diagnosis, imageUrl } : plants[0]) as StoredPlant;
  const displayItems = currentPlant.rescueItems.length ? currentPlant.rescueItems : fallbackItems;
  const displaySteps = currentPlant.rescueSteps.length ? currentPlant.rescueSteps : fallbackSteps;

  const counts = useMemo(
    () =>
      plants.reduce(
        (acc, plant) => {
          acc[plant.status] += 1;
          acc.all += 1;
          return acc;
        },
        { all: 0, dead: 0, dying: 0, stressed: 0, healthy: 0 } as Record<PlantStatus | "all", number>
      ),
    [plants]
  );

  const filteredPlants = useMemo(() => {
    if (activeStatus === "all") return plants;
    return plants.filter((plant) => plant.status === activeStatus);
  }, [activeStatus, plants]);

  function toggleSymptom(id: string) {
    setSymptoms((current) =>
      current.includes(id) ? current.filter((symptom) => symptom !== id) : [...current, id]
    );
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setImageName(file.name);
    setImageUrl(await readFileAsDataUrl(file));
  }

  async function diagnose() {
    setIsDiagnosing(true);
    try {
      const payload: PlantSignalInput = {
        imageName,
        plantName,
        symptoms,
        roomLight,
        watering,
        potDrainage,
        notes
      };
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as DiagnosisResult;
      setDiagnosis(result);
      setPlants((current) => [{ ...result, imageUrl }, ...current.filter((plant) => plant.id !== result.id)]);
      setActiveTab("letter");
    } finally {
      setIsDiagnosing(false);
    }
  }

  function selectPlant(plant: StoredPlant) {
    setDiagnosis(plant);
    setImageUrl(plant.imageUrl || "");
    setActiveTab("letter");
  }

  return (
    <main className="mini-program-shell">
      <section className="phone-app" aria-label="Plant Last Words mini program prototype">
        <header className="app-nav">
          <div>
            <span className="eyebrow">Plant Epitaph</span>
            <h1>植物遗言</h1>
          </div>
          <div className="nav-actions">
            <button type="button" aria-label="search">
              <Search size={18} />
            </button>
            <button type="button" aria-label="new plant" onClick={() => fileInputRef.current?.click()}>
              <Plus size={18} />
            </button>
          </div>
        </header>

        {activeTab === "scan" && (
          <div className="screen stack">
            <section className="hero-card">
              <div className="hero-copy">
                <span>拍一株快不行的植物</span>
                <h2>让它自己交代死因</h2>
                <p>识别品种、生成植物贴纸、写一封惨但有用的求救信。</p>
              </div>
              <button className="camera-button" type="button" onClick={() => fileInputRef.current?.click()}>
                <Camera size={19} />
                拍照诊断
              </button>
            </section>

            <section
              className={clsx("sticker-board", imageUrl && "has-photo")}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <div className="cutout-card main">
                {imageUrl ? <img src={imageUrl} alt="Uploaded plant" /> : <div className="plant-illustration" />}
                <span>{plantName || "Unknown plant"}</span>
              </div>
              <div className="floating-label label-a">Dead or alive?</div>
              <div className="floating-label label-b">Care score</div>
              <div className="floating-label label-c">Rescue note</div>
            </section>

            <section className="form-card">
              <label className="input-field">
                <span>植物名字</span>
                <input
                  value={plantName}
                  placeholder="不知道就空着，例如 绿萝 / 多肉"
                  onChange={(event) => setPlantName(event.target.value)}
                />
              </label>

              <div className="symptom-section">
                <span className="field-title">症状贴纸</span>
                <div className="symptom-pills">
                  {symptomOptions.map((option) => (
                    <button
                      className={clsx("symptom-pill", symptoms.includes(option.id) && "active")}
                      type="button"
                      key={option.id}
                      onClick={() => toggleSymptom(option.id)}
                    >
                      <span>{option.code}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mini-grid">
                <label className="input-field">
                  <span>光照</span>
                  <select value={roomLight} onChange={(event) => setRoomLight(event.target.value as PlantSignalInput["roomLight"])}>
                    <option value="low">阴暗角落</option>
                    <option value="medium">普通室内光</option>
                    <option value="bright">明亮散射光</option>
                    <option value="direct">太阳直晒</option>
                  </select>
                </label>
                <label className="input-field">
                  <span>浇水</span>
                  <select value={watering} onChange={(event) => setWatering(event.target.value as PlantSignalInput["watering"])}>
                    <option value="forgotten">想起来才浇</option>
                    <option value="weekly">一周左右</option>
                    <option value="daily">每天都浇</option>
                    <option value="unknown">说不清</option>
                  </select>
                </label>
              </div>

              <label className="input-field">
                <span>盆底排水</span>
                <select value={potDrainage} onChange={(event) => setPotDrainage(event.target.value as PlantSignalInput["potDrainage"])}>
                  <option value="yes">有排水孔</option>
                  <option value="no">没有</option>
                  <option value="unknown">不知道</option>
                </select>
              </label>

              <label className="input-field">
                <span>补充口供</span>
                <textarea
                  value={notes}
                  placeholder="例如：放在工位，最近叶子塌了"
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>

              <button className="primary-action" type="button" onClick={diagnose} disabled={isDiagnosing}>
                {isDiagnosing ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                生成遗书 / 求救信
              </button>
            </section>
          </div>
        )}

        {activeTab === "letter" && (
          <div className="screen stack">
            <section className="result-hero">
              <div className={clsx("result-cutout", currentPlant.status)}>
                {currentPlant.imageUrl ? <img src={currentPlant.imageUrl} alt={currentPlant.detectedSpecies} /> : <div className="plant-illustration" />}
              </div>
              <div className="score-bubble">
                <span>生命</span>
                <strong>{currentPlant.healthScore}</strong>
              </div>
              <div className={clsx("state-chip", currentPlant.status)}>
                {statusIcon(currentPlant.status)}
                {statusCopy[currentPlant.status].label}
              </div>
            </section>

            <section className="summary-card">
              <div>
                <span className="eyebrow">{currentPlant.confidence}% 识别相似度</span>
                <h2>{currentPlant.detectedSpecies} · {statusCopy[currentPlant.status].tone}</h2>
                <p>{currentPlant.deathCause}</p>
              </div>
              <ChevronRight size={18} />
            </section>

            <article className="letter-paper">
              <div className="letter-top">
                <span>{currentPlant.letterTone === "last_words" ? "遗书" : "求救信"}</span>
                <Send size={16} />
              </div>
              <h2>{currentPlant.letterTitle}</h2>
              <pre>{currentPlant.letterBody}</pre>
            </article>

            <section className="rescue-card">
              <h3>
                <PackagePlus size={17} />
                拯救物品
              </h3>
              <div className="rescue-items">
                {displayItems.map((item) => (
                  <div className="rescue-item" key={item.id}>
                    <strong>{item.label}</strong>
                    <p>{item.why}</p>
                    <span>{item.buyHint}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rescue-card">
              <h3>
                <ClipboardList size={17} />
                操作步骤
              </h3>
              <div className="timeline">
                {displaySteps.map((step, index) => (
                  <div className="timeline-item" key={step.id}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                      <em>{step.timing}</em>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "library" && (
          <div className="screen stack">
            <section className="library-head">
              <div>
                <span className="eyebrow">Plant Library</span>
                <h2>植物标本馆</h2>
              </div>
              <button type="button" onClick={() => setActiveStatus("all")}>
                <RotateCcw size={16} />
              </button>
            </section>

            <div className="status-tabs">
              {(["all", "dead", "dying", "stressed", "healthy"] as Array<PlantStatus | "all">).map((status) => (
                <button
                  type="button"
                  className={clsx(activeStatus === status && "active")}
                  key={status}
                  onClick={() => setActiveStatus(status)}
                >
                  {status === "all" ? "全部" : statusCopy[status].label}
                  <span>{counts[status]}</span>
                </button>
              ))}
            </div>

            <section className="plant-grid">
              {filteredPlants.map((plant) => (
                <button className="plant-tile" type="button" key={plant.id} onClick={() => selectPlant(plant)}>
                  <div className={clsx("tile-sticker", plant.status)}>
                    {plant.imageUrl ? <img src={plant.imageUrl} alt={plant.detectedSpecies} /> : <Leaf size={34} />}
                  </div>
                  <strong>{plant.detectedSpecies}</strong>
                  <span>{plant.healthScore}/100 · {statusCopy[plant.status].label}</span>
                </button>
              ))}
            </section>
          </div>
        )}

        <nav className="bottom-tabs" aria-label="mini program tabs">
          <button type="button" className={clsx(activeTab === "scan" && "active")} onClick={() => setActiveTab("scan")}>
            <Home size={19} />
            拍照
          </button>
          <button type="button" className={clsx(activeTab === "library" && "active")} onClick={() => setActiveTab("library")}>
            <Archive size={19} />
            图鉴
          </button>
          <button type="button" className={clsx(activeTab === "letter" && "active")} onClick={() => setActiveTab("letter")}>
            <Sparkles size={19} />
            遗言
          </button>
        </nav>
      </section>
    </main>
  );
}
