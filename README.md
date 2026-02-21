# MBTIChange（人格轨迹实验室）

一个可运行的全栈 MBTI 人格轨迹应用（Next.js + Prisma + PostgreSQL + NextAuth）。

## 本次重点升级

- 题库升级：
  - 内置“公开荣格类型结构化题库”（大规模扩展）
  - 支持“官方授权题库本地导入”（`data/official-mbti-bank.json` 或 `OFFICIAL_MBTI_BANK_PATH`）
- 出题升级：
  - 基于历史人格数据进行自适应深挖
  - 针对脆弱维度、冲突维度、低确定性维度动态增权
- 答题体验升级：
  - 一题一屏
  - 全程连续背景音乐（旋律型）
  - 作答后“风吹沙化”渐隐过场切换下一题
- 形象升级：
  - 可爱风格 3D/线绘兼容小人（屏幕宠物风）
  - 同用户长期可辨识、同会话可复现、每次测验可进化
  - 小人形态由维度分数 + 行为统计联合驱动
- 时间轴升级：
  - 默认仅展示最新 6 次形象
  - 新增“全部记录”页面
  - 支持按时间、类型、特征筛选
  - 四维发光轨迹线可视化增强
- 设置页升级：
  - 全中文
  - 账户、近期人格状态、AI伙伴状态、视觉基因图谱一体展示

## 关键模块

- `lib/mbti-question-bank.ts`
  - 题库适配层（公开题库 + 官方题库导入）
- `lib/question-generator.ts`
  - 历史加权出题 + 深挖追问题
- `lib/persona-model.ts`
  - 长期人格模型构建
- `lib/style-dna.ts`
  - styleDNA + AI companion 生成与持久化
- `lib/pet-model.ts`
  - 新小人形态模型生成（seed 可复现，基于 styleDNA + 行为统计）
- `components/test-runner.tsx`
  - 单题沉浸答题 + 背景音乐 + 风沙过场
- `components/Timeline.tsx`
  - 优雅时间长廊 + 四维发光轨迹

## 题库说明（权威模式）

- 默认：使用内置“公开荣格类型结构化题库”。
- 若你拥有官方授权题库：
  1. 将 JSON 放到 `data/official-mbti-bank.json`，或设置 `OFFICIAL_MBTI_BANK_PATH`
  2. 格式为数组，每条包含：
     - `code`, `text`, `dimension`, `direction`, `reverseScoring`, `intent`, `theme`
  3. 系统会自动切换到“官方授权题库（本地导入）”。

## 启动

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

访问：`http://localhost:3000`

## 质量验证

```bash
npm run lint
npm run build
```

## 小人系统与回填

- 提交测验后会写入 `avatarToken.derivedStats.petModel`
- 旧数据可执行回填：

```bash
npm run character:backfill
# 或仅回填单用户
npm run character:backfill -- --email=admin@starringcapital.com
```
