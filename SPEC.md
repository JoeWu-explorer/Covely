# Covely — 需求文档（v0，已冻结，可动工）

> 本文档描述 Covely 这款 Chrome 新标签页扩展的需求范围。所有 ✅ 项均已对齐，可直接据此开发。文档末尾的「开发时再定」一节列出可暂缓的设计细节，不阻塞 v0。

---

## 0. 项目代号

- **产品名**：`Covely`（cove + ly，"安静的小海湾"+ 形容词后缀）
- **目录**：`/Users/joseph/Workspace/Studio/Covely`
- **域名**：`covely.joewustudio.com`（CNAME 到 GitHub Pages，零额外成本）
  - **根路径直接是 Web 应用**，不做单独落地页；安装扩展入口作为页面内小链接
  - 与 Chrome 扩展**双发布、共享源码**（详见 §6）
- **参考项目**：[joeseesun/qiaomu-tab](https://github.com/joeseesun/qiaomu-tab)（MIT 协议，借鉴架构思路但**不 fork、不大段抄代码**；理由：原项目 newtab.js 单文件 4245 行，不利于 vibe coding 维护）

## 1. 一句话定位

把 Chrome 新标签页变成一个**安静的工作起点**：打开浏览器即进入白噪音陪伴 + 灵感速记的专注空间，专门服务 vibe coding 和深度工作时段。

## 2. 我是谁，为什么要做

- 写代码 / 做产品的人，每天打开浏览器很多次
- 工作时容易被新标签页的默认入口（搜索框、推荐内容、书签栏）拖走注意力
- 需要在打开浏览器时**立刻进入"安静工作"的状态**，关键是**有舒缓白噪音陪伴**
- qiaomu-tab 雏形不错，但音乐模块依赖固定接口、不是为专注设计；也缺"灵感速记 + 导出"这条路径

## 3. 核心理念（决策时的优先级）

按优先级从高到低，冲突时**上面的赢**：

1. **专注 > 信息密度** — 一屏只看到必要的东西
2. **声音是一等公民** — 白噪音（未来 + BGM）是核心体验，不是附属模块
3. **灵感是流动的，不是囤积的** — 灵感速记刻意不持久化，鼓励导出
4. **本地优先** — 不需要登录、不上传数据
5. **可被 AI 友好维护** — 代码模块化、单文件 ≤ 500 行（vibe coding 友好）
6. **零版权风险** — 不 bundle 任何受版权保护的音频

## 4. 功能清单

### P0（MVP，第一周内能用）

- **时钟 + 日期**：大字号、居中、克制
- **声音陪伴**（核心差异化）
  - 内置 3 个声音卡片槽，每个槽都是独立开关 + 音量条，**支持叠加播放**（类似 Noisli）
    1. **雨声**——内置 3 个变体（不同雨势/雨景），用户在卡片上切换；默认播放第一个
    2. **篝火**——内置 3 个变体（不同火焰大小/远近），用户在卡片上切换；默认播放第一个
    3. **轻音乐**（爵士 / 古典 / 优雅器乐）——单一文件；本质是 BGM 而非环境音，承担"咖啡厅氛围"的位置
  - 素材来源：仅接受 **Pixabay Content License**（free for commercial use, no attribution required）或 **CC0 / 公共领域**；明确拒绝 CC-BY、CC-NC 等带条件协议
  - 体积预算：
    - 环境音文件（雨/篝火）≤ 400KB 每个（mono 96kbps × ~30s slice，保留可接受听感）
    - 音乐文件 ≤ 1.5MB（必须 instrumental，无人声）
    - 7 个文件总预算 ≈ 4MB——扩展 / Web 包均可接受
  - 编码：mono mp3 96kbps（环境音）；stereo mp3 96kbps（音乐，保留琴音空间感）
  - **关闭新标签页时停止播放**（不做 offscreen API，保持简单）
  - **音源追溯**：每个文件在 `assets/sounds/SOURCES.md` 记录来源 URL + 协议 + 作者署名 + trim 编辑说明，即便协议不强制也保留
- **灵感速记**（替代传统待办/便签 — "流动的灵感"，不是"持久化任务"）
  - 一个轻量临时输入区，记录工作时冒出来的想法
  - **持久化：`sessionStorage`** — 刷新不丢，关浏览器/关标签页就丢，强迫最终导出
  - 关闭/切换标签页时若有未导出内容，**弹提醒**（`beforeunload`）
  - **一键复制到剪贴板**（Clipboard API）
- **极简搜索框**：默认 Google，回车跳转
- **设置入口**：主题（亮/暗）、白噪音预设保存

### P1（第二周，差异化扩展）

- **专注计时器（番茄钟）**
  - 25/5 默认，可配置
  - 番茄期间自动播放最后一次选定的白噪音组合，休息时静音
- **一键生图**（灵感速记的导出 + 冷启动获客通道）
  - 把灵感文字渲染成小红书首图风格
  - 候选尺寸：3:4 竖图（1080×1440），呼应白噪音的视觉调性（雨/浪/咖啡厅抽象插画作底）
  - **默认带极小角标 "made with Covely"，设置中可关闭** — 平衡免费传播和用户自由
  - 实现：Canvas API → `toBlob()` → 下载 或 写入剪贴板
- **每日一句**：保留 qiaomu-tab 用的一言 API（`v1.hitokoto.cn`，轻量、无侵扰）

### P2（之后再说）

- **BGM 电台流**（流式补充，独立于 MVP 内置的 3 个声音槽）
  - 候选频道：SomaFM（Drone Zone / Groove Salad）、Lofi Girl 官方流（具体选哪些 P2 阶段再定）
  - 仅靠 `<audio>` 播 mp3 stream，不下载、不缓存
  - 显示当前曲目（如果电台 API 提供 metadata）
  - 与 MVP 内置音乐槽的关系：MVP 槽是固定 instrumental loop；电台流是"换换花样"的扩展，二者并存而非替代
- **AI 搜索入口**：ChatGPT / Claude / Kimi 一键带词跳转（借用 qiaomu-tab 的 `provider-autosubmit.js` 思路 —— 那一段是原项目最值得学习的代码，可重写后引用）
- 自定义快捷网站
- 浏览器历史/收藏侧栏
- 灵感速记的多条历史归档（如果发现确实有这个需求）
- 英文 i18n
- 数据 export/import

### 明确不做（非目标）

- ❌ 不做天气（与"安静"主题违和）
- ❌ 不做账号 / 云同步（违背本地优先）
- ❌ 不 bundle 任何流行音乐 / lofi 音频文件（版权风险）
- ❌ 不内嵌 YouTube lofi 流（违反 ToS）
- ❌ MVP 阶段不上架 Chrome Web Store — 先自用 1-2 个月打磨核心体验，再走合规上架（届时隐私政策托管在 `covely.joewustudio.com`）

## 5. 体验细节

- **语言**：MVP 阶段中文优先，英文 i18n 推到 P2
- **主题**：浅色为主，深色作为切换项；色调走"安静"路线（低饱和、低对比的中性色）
- **首屏不滚动**：所有 P0 元素在一屏内

## 6. 技术选型

- **平台**：**双目标**——Chrome MV3 扩展（`chrome_url_overrides.newtab`）+ 静态 Web 应用（GitHub Pages 托管在 `covely.joewustudio.com`）。单仓库、共享 `src/`、esbuild 输出两份产物
- **构建**：esbuild（双 entry，分别产出 `build/extension/` 与 `build/web/`）
- **语言**：JavaScript + JSDoc + `checkJs`（不用 TypeScript，但享受 IDE 类型提示）
- **框架**：**不用** React/Vue。原生 DOM + 模块化 JS
- **音频**：Web Audio API（白噪音）+ `<audio>` 标签（电台流，P2）
- **存储**（统一 wrapper，运行时检测目标环境）：
  - 灵感速记 → `sessionStorage`（两个目标一致）
  - 设置、声音预设、番茄钟配置 → 扩展用 `chrome.storage.local`，Web 用 `localStorage`
  - wrapper 必须 graceful 降级：Web 包里不直接引用 `chrome.*`，避免 bundle 体积膨胀和运行时报错
- **目录结构**（**强约束：单文件 ≤ 500 行**，超过即拆分）：
  ```
  src/
    modules/
      clock.js
      noise.js        ← 白噪音生成（雨/浪/咖啡厅）
      memo.js         ← 灵感速记
      search.js
      pomodoro.js     ← P1
      poster.js       ← P1，一键生图
    lib/
      storage.js      ← chrome.storage + sessionStorage 统一 wrapper
      audio.js        ← Web Audio 共享 AudioContext
      clipboard.js
      i18n.js
    newtab.js         ← 装配入口（只做模块装配，不写业务逻辑）
    entry-extension.js  ← 扩展 entry（装配模块 + 注入扩展特性）
    entry-web.js        ← Web entry（装配模块，禁用扩展特性，启用 localStorage）
  build/
    extension/        ← MV3 包：manifest.json + newtab.html + bundle
    web/              ← 静态站：index.html + bundle（CNAME → GitHub Pages）
  shell/
    manifest.json     ← 扩展 manifest 模板
    newtab.html       ← 扩展用的根 HTML
    index.html        ← Web 用的根 HTML（除 <title> 外与 newtab.html 共用结构）
  newtab.css          ← 两个目标共用
  ```
- **从 qiaomu-tab 借鉴的具体点**（思路借鉴而非代码搬运）：
  - `manifest.json` 的 MV3 完整配置结构
  - `_locales/` 目录组织（为 P2 i18n 做准备）
  - 后期做 AI 搜索时参考 `provider-autosubmit.js`（处理 contenteditable + textarea 的注入、三层 fallback、sessionStorage 去重）

## 7. 成功标准

- **第 1 周**：自己每天用，至少 5 个工作日没有切回 Chrome 默认新标签页
- **第 4 周**：在 3 个以上场景（写代码 / 写文档 / 浏览资料）都觉得"白噪音帮到了"
- **第 8 周**：愿意推荐给一个朋友试用，并启动 P2 计划

## 8. 开发时再定（非阻塞的设计细节）

这些点不影响 v0 动工，做到对应模块再定：

- 白噪音控件位置：右下角悬浮 / 侧栏 / 顶部状态条
- 白噪音控件交互：点击图标开关，长按调音量？还是悬浮显示滑块？
- 生图模板的具体视觉风格（背景插画、字体、配色）
- 番茄钟微交互（结束时的提示音 vs 纯视觉提示）
- "未导出"提醒的 UI 形态（modal / toast / 原生 `confirm`）

## 9. 已决策履历

- ✅ 产品名：**Covely**
- ✅ 官网域名：`covely.joewustudio.com`
- ✅ 白噪音 MVP 三种：雨声、海浪、咖啡厅
- ✅ 白噪音支持叠加播放，各自独立音量
- ✅ 关闭新标签页时白噪音停止，不做 offscreen API
- ✅ BGM 推迟到 P2
- ✅ 不做传统待办/便签 → 改为"灵感速记 + 一键导出"
- ✅ 灵感速记用 `sessionStorage`（刷新不丢、关浏览器丢）
- ✅ P1 一键生图默认带 "made with Covely" 角标，设置可关
- ✅ AI 搜索入口排在 P2
- ✅ 不做天气
- ✅ MVP 不上架 Chrome Web Store，先自用 1-2 个月
- ✅ 用 JS + JSDoc + `checkJs`，不用 TypeScript
- ✅ **2026-05-28 双发布形态**：`covely.joewustudio.com` 根路径直接是可用的 Web 应用，同时发布 Chrome 扩展，两者共享 `src/`。存储层运行时检测扩展环境，Web 端降级到 `localStorage`
- ✅ **2026-05-28 放弃纯合成白噪音**：原型阶段验证 Web Audio 现场合成的雨/浪/咖啡厅听感不达"安静"标准（路径 B 第 4 步用户反馈"很难听"）。改为使用 CC0 / 公共领域短 loop，bundle 进包体。原"零音频文件"约束放宽为"零受版权保护音频文件"——CC0 / 公共领域允许；流行音乐 / lofi 等仍不许。每个音频文件 ≤ 100KB
- ✅ **2026-05-28 重新规划 3 个声音槽**：海浪 → **篝火**（用户反馈海浪让人不舒服）；咖啡厅 → **优雅轻音乐（爵士/古典/instrumental BGM）**；雨声内置 3 个变体让用户切换。意味着第 3 槽从"环境音"变为"BGM"——是早期决策的偏移，但用户认为咖啡厅氛围的本质就是音乐。体积预算同步调整：环境音 ≤ 150KB、音乐 ≤ 1.5MB。素材协议接受范围扩展到 Pixabay Content License（同样不需署名）

---

## 10. 给重启后的新会话：从这里开始

> 你（新会话的 Claude）正在接手一个 Chrome 新标签页扩展项目。**先读完上面所有章节**，再选择以下三条起步路径之一推进。用户已对齐到 v0 冻结状态，无需再次澄清产品需求。

### 推荐路径：B（先做白噪音 prototype）

**理由**：声音质感是 Covely 成败的核心差异化。先用一个独立 HTML 文件验证 Web Audio API 能否合成出"舒缓到能让人专注"的雨/浪/咖啡厅，再搭扩展壳。这一步如果质感不够好，整个产品定位需要重新评估。

**步骤**：
1. 在 `prototype/` 下建 `noise.html` + `noise.js`
2. 用 Web Audio API 实现 3 种声音的现场合成（白噪音 + biquad filter + LFO 调制）
3. 提供 3 个开关 + 3 个音量条
4. 在浏览器里听 30 分钟，确认质感
5. 满意后，再走路径 A 搭扩展骨架

### 备选路径 A：直接搭扩展骨架

1. 在 Covely 目录 `git init`
2. 按 §6 的目录结构创建文件
3. 写最小 `manifest.json`（MV3，`chrome_url_overrides.newtab`，只声明 `storage` 权限）
4. `newtab.html` + `newtab.js` 显示一行 "Covely" + 实时时钟
5. Load unpacked 验证扩展能接管新标签页
6. 之后逐模块开发

### 备选路径 C：先画首屏 ASCII 布局

在 SPEC.md 加一节 §11，用 ASCII 框定首屏元素位置，跟用户对齐视觉骨架再动工。适合用户先想"看到样子"而不是"听到声音"的情况。

### 通用约束（所有路径都要遵守）

- 单文件 ≤ 500 行
- 不引入 React / Vue / 任何 UI 框架
- 不 bundle 音频文件
- 不写未在 SPEC 中确认的功能（如要扩展请先更新 SPEC §9 履历）
- 提交前 self-check：是否符合 §3 的 6 条核心理念？

---

> 需求变更请直接编辑本文件，并在「§9 已决策履历」追加一行说明变更原因。
