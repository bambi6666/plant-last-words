"use client";

import clsx from "clsx";
import {
  Archive,
  BadgeAlert,
  Camera,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Leaf,
  Lightbulb,
  Loader2,
  PackagePlus,
  Scissors,
  Send,
  Skull,
  Sparkles,
  Sprout,
  Upload,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DiagnosisResult, PlantSignalInput, PlantStatus } from "@/types/plant";

const symptomOptions = [
  { id: "yellow_leaf", label: "黄叶", icon: "🟡" },
  { id: "droopy", label: "塌了", icon: "🥀" },
  { id: "brown_edge", label: "焦边", icon: "🔥" },
  { id: "mold", label: "土发霉", icon: "🍄" },
  { id: "bugs", label: "有虫", icon: "🐛" },
  { id: "bare_stem", label: "秃杆", icon: "🪵" }
];

const statusCopy: Record<PlantStatus, { label: string; tone: string }> = {
  dead: { label: "已阵亡", tone: "可以写遗书" },
  dying: { label: "濒危", tone: "马上抢救" },
  stressed: { label: "亚健康", tone: "还能谈" },
  healthy: { label: "健康", tone: "先别折腾" }
};

const seedPlants: Array<DiagnosisResult & { imageUrl?: string }> = [
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
    rescueItems: [],
    rescueSteps: [],
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

function statusIcon(status: PlantStatus) {
  if (status === "dead") return <Skull size={16} />;
  if (status === "dying") return <BadgeAlert size={16} />;
  if (status === "stressed") return <Leaf size={16} />;
  return <CheckCircle2 size={16} />;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PlantLastWordsApp() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [plantName, setPlantName] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>(["yellow_leaf", "droopy"]);
  const [roomLight, setRoomLight] = useState<PlantSignalInput["roomLight"]>("medium");
  const [watering, setWatering] = useState<PlantSignalInput["watering"]>("weekly");
  const [potDrainage, setPotDrainage] = useState<PlantSignalInput["potDrainage"]>("unknown");
  const [notes, setNotes] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [plants, setPlants] = useState<Array<DiagnosisResult & { imageUrl?: string }>>(seedPlants);
  const [activeStatus, setActiveStatus] = useState<PlantStatus | "all">("all");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const cached = window.localStorage.getItem("plant-last-words-archive");
    if (cached) {
      try {
        setPlants(JSON.parse(cached));
      } catch {
        setPlants(seedPlants);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("plant-last-words-archive", JSON.stringify(plants));
  }, [plants]);

  const filteredPlants = useMemo(() => {
    if (activeStatus === "all") return plants;
    return plants.filter((plant) => plant.status === activeStatus);
  }, [activeStatus, plants]);

  const counts = useMemo(() => {
    return plants.reduce(
      (acc, plant) => {
        acc[plant.status] += 1;
        acc.all += 1;
        return acc;
      },
      { all: 0, dead: 0, dying: 0, stressed: 0, healthy: 0 } as Record<PlantStatus | "all", number>
    );
  }, [plants]);

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
    } finally {
      setIsDiagnosing(false);
    }
  }

  const heroDiagnosis = diagnosis || plants[0];

  return (
    <main className="app-shell">
      <section className="studio">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <Sprout size={24} />
            </div>
            <div>
              <h1>植物遗言</h1>
              <p>拍照诊断死因，生成惨但好笑的遗书或求救信</p>
            </div>
          </div>
          <button className="ghost-button" type="button" onClick={() => fileInputRef.current?.click()}>
            <Camera size={17} />
            拍一株
          </button>
        </header>

        <div className="product-grid">
          <section className="capture-panel" aria-label="photo diagnosis form">
            <div className="section-title">
              <Wand2 size={18} />
              <span>拍照识别</span>
            </div>

            <div
              className={clsx("drop-zone", imageUrl && "has-image")}
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
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded plant" />
              ) : (
                <div className="drop-placeholder">
                  <Upload size={28} />
                  <strong>上传快不行的植物</strong>
                  <span>叶片、盆土、茎部都拍到更好</span>
                </div>
              )}
            </div>

            <label className="field">
              <span>我猜它是</span>
              <input value={plantName} placeholder="不知道就空着，例如 绿萝 / 多肉" onChange={(event) => setPlantName(event.target.value)} />
            </label>

            <div className="field">
              <span>症状贴纸</span>
              <div className="symptom-grid">
                {symptomOptions.map((option) => (
                  <button
                    className={clsx("symptom-chip", symptoms.includes(option.id) && "active")}
                    type="button"
                    key={option.id}
                    onClick={() => toggleSymptom(option.id)}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>光照</span>
                <select value={roomLight} onChange={(event) => setRoomLight(event.target.value as PlantSignalInput["roomLight"])}>
                  <option value="low">阴暗角落</option>
                  <option value="medium">普通室内光</option>
                  <option value="bright">明亮散射光</option>
                  <option value="direct">太阳直晒</option>
                </select>
              </label>
              <label className="field">
                <span>浇水</span>
                <select value={watering} onChange={(event) => setWatering(event.target.value as PlantSignalInput["watering"])}>
                  <option value="forgotten">想起来才浇</option>
                  <option value="weekly">一周左右</option>
                  <option value="daily">每天都浇</option>
                  <option value="unknown">说不清</option>
                </select>
              </label>
              <label className="field">
                <span>盆底排水</span>
                <select value={potDrainage} onChange={(event) => setPotDrainage(event.target.value as PlantSignalInput["potDrainage"])}>
                  <option value="yes">有排水孔</option>
                  <option value="no">没有</option>
                  <option value="unknown">不知道</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>补充口供</span>
              <textarea value={notes} placeholder="例如：放在工位，老板每天路过都说它不太行" onChange={(event) => setNotes(event.target.value)} />
            </label>

            <button className="primary-button" type="button" onClick={diagnose} disabled={isDiagnosing}>
              {isDiagnosing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              生成遗言 / 求救信
            </button>
          </section>

          <section className="letter-panel" aria-label="diagnosis and letter">
            <div className="plant-stage">
              <div className={clsx("plant-sticker", heroDiagnosis.status)}>
                {imageUrl && diagnosis ? <img src={imageUrl} alt="Plant cutout preview" /> : <div className="fake-plant" />}
              </div>
              <div className="score-card">
                <span>生命体征</span>
                <strong>{heroDiagnosis.healthScore}</strong>
                <em>/ 100</em>
              </div>
            </div>

            <div className="diagnosis-card">
              <div className="diagnosis-head">
                <div>
                  <span className={clsx("status-pill", heroDiagnosis.status)}>
                    {statusIcon(heroDiagnosis.status)}
                    {statusCopy[heroDiagnosis.status].label}
                  </span>
                  <h2>{heroDiagnosis.detectedSpecies} · {statusCopy[heroDiagnosis.status].tone}</h2>
                </div>
                <span className="confidence">{heroDiagnosis.confidence}% 像</span>
              </div>
              <p className="cause">{heroDiagnosis.deathCause}</p>
              <div className="evidence-list">
                {heroDiagnosis.evidence.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <article className="letter-card">
              <div className="letter-label">
                {heroDiagnosis.letterTone === "last_words" ? <Skull size={16} /> : <Send size={16} />}
                {heroDiagnosis.letterTone === "last_words" ? "遗书" : "求救信"}
              </div>
              <h2>{heroDiagnosis.letterTitle}</h2>
              <pre>{heroDiagnosis.letterBody}</pre>
            </article>

            <div className="rescue-layout">
              <section>
                <h3>
                  <PackagePlus size={16} />
                  拯救物品
                </h3>
                <ul className="shopping-list">
                  {(heroDiagnosis.rescueItems.length ? heroDiagnosis.rescueItems : []).map((item) => (
                    <li key={item.id}>
                      <strong>{item.label}</strong>
                      <p>{item.why}</p>
                      <span>{item.buyHint}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>
                  <ClipboardList size={16} />
                  操作步骤
                </h3>
                <ol className="step-list">
                  {(heroDiagnosis.rescueSteps.length ? heroDiagnosis.rescueSteps : []).map((step) => (
                    <li key={step.id}>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                      <span>{step.timing}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </section>

          <aside className="archive-panel" aria-label="plant archive">
            <div className="section-title">
              <Archive size={18} />
              <span>植物标本馆</span>
            </div>
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
            <div className="plant-list">
              {filteredPlants.map((plant) => (
                <button className="plant-card" key={plant.id} type="button" onClick={() => setDiagnosis(plant)}>
                  <div className={clsx("plant-thumb", plant.status)}>
                    {plant.imageUrl ? <img src={plant.imageUrl} alt={plant.detectedSpecies} /> : <Leaf size={22} />}
                  </div>
                  <div>
                    <strong>{plant.nickname}</strong>
                    <span>{plant.detectedSpecies} · {plant.healthScore}/100</span>
                    <p>{plant.deathCause}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <section className="product-notes">
          <article>
            <Lightbulb size={18} />
            <h3>CapWords 式收集</h3>
            <p>每次拍照会变成一个植物贴纸，并自动加入植物档案馆。后续可以接真实抠图，把每株植物做成可分享卡片。</p>
          </article>
          <article>
            <Droplets size={18} />
            <h3>不是只搞笑</h3>
            <p>求救信会同步给出物品清单、操作步骤和时机，避免用户笑完之后继续把植物养没。</p>
          </article>
          <article>
            <Scissors size={18} />
            <h3>植物粒度管理</h3>
            <p>按“已阵亡、濒危、亚健康、健康”分层管理，适合后续做提醒、复诊和成长时间线。</p>
          </article>
        </section>
      </section>
    </main>
  );
}
