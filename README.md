# 植物遗言

给快养死的植物拍照，AI 诊断死因，并以植物第一人称生成一封“遗书”或“求救信”。产品调性是惨但好笑，但求救信必须给出可执行的拯救清单。

## Product Idea

用户上传一张植物照片，选择症状、光照、浇水频率和盆底排水情况。系统输出：

- 拍照品种识别
- 健康状态：已阵亡 / 濒危 / 亚健康 / 健康
- 死因诊断
- 植物第一人称遗书或求救信
- 拯救物品购买清单
- 具体操作步骤
- 植物档案馆，按状态管理每一株植物

## CapWords Reference

CapWords 的关键启发是：拍一张现实照片，AI 识别对象，把它变成一个可收藏、可复习、可分享的“贴纸/卡片”。植物遗言借用这个模式：

- 拍一株植物
- 识别品种和状态
- 生成一张有性格的植物卡片
- 收进植物档案馆
- 后续按植物粒度跟踪复诊、死亡或康复

## Current Prototype

- Next.js App Router
- TypeScript
- Mock AI diagnosis engine
- Photo upload preview
- Sticker-style plant preview
- Symptom chips
- Plant archive with status tabs
- Letter generation
- Rescue item list
- Step-by-step care plan
- API routes for diagnosis and letter generation

## Tech Stack

- Frontend: Next.js, React, TypeScript
- UI: CSS, lucide-react
- Backend: Next.js Route Handlers
- Validation: zod
- Tests: Vitest

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## API

### `POST /api/diagnose`

Request:

```json
{
  "imageName": "pothos.jpg",
  "plantName": "绿萝",
  "symptoms": ["yellow_leaf", "droopy"],
  "roomLight": "medium",
  "watering": "weekly",
  "potDrainage": "yes",
  "notes": "放在办公室，最近叶子塌了"
}
```

Returns a `DiagnosisResult` containing species, health score, plant status, death cause, letter, rescue items, and rescue steps.

### `POST /api/letter`

Returns just the generated letter plus supporting rescue content.

## Future Roadmap

- Real plant recognition model
- Background removal / cutout stickers
- Multi-photo diagnosis: leaf, stem, soil, pot bottom
- Plant-level timeline and recovery check-ins
- Care reminders
- Shopping links for rescue items
- Shareable image cards
- Community gallery of dramatic plant last words
- Real LLM provider integration with safety constraints

## Product Guardrails

- The app should not claim medical-grade or expert botanical certainty.
- Severe plant toxicity warnings should be shown for pets and children in later versions.
- Purchase suggestions should stay practical and explain why each item is needed.
- The funny writing should not replace the care instructions.
