# Covely

> 一个安静的 Chrome 新标签页：白噪音陪伴 + 灵感速记，专门服务 vibe coding 和深度工作时段。

打开浏览器即进入"安静工作"的状态，有舒缓白噪音陪伴，有灵感速记随手记。

🌐 **Web 版**：[covely.joewustudio.com](https://covely.joewustudio.com)
🧩 **Chrome 扩展**：见下方「安装」

---

## 核心理念

按优先级，冲突时上面的赢：

1. **专注 > 信息密度** — 一屏只看到必要的东西
2. **声音是一等公民** — 白噪音是核心体验，不是附属模块
3. **灵感是流动的，不是囤积的** — 灵感速记刻意不持久化，鼓励导出
4. **本地优先** — 不需要登录、不上传数据
5. **可被 AI 友好维护** — 模块化，单文件 ≤ 500 行
6. **零版权风险** — 仅 bundle CC0 / 公共领域 / Pixabay License 音频

## 功能（P0 / MVP）

- ⏰ **时钟 + 日期**：大字号、居中、克制
- 🔊 **声音陪伴**：3 个独立声音槽，支持叠加播放
  - 雨声（3 个变体可切换）
  - 篝火（3 个变体可切换）
  - 优雅轻音乐（爵士 / 古典 instrumental BGM）
- 💡 **灵感速记**：`sessionStorage` 存储，刷新不丢、关浏览器丢，强迫导出；一键复制剪贴板
- 🔍 **极简搜索框**：默认 Google
- ⚙️ **设置**：主题、白噪音预设

后续规划见 [SPEC.md](./SPEC.md) §4（P1 番茄钟 + 一键生图，P2 电台流 + AI 搜索入口）。

## 技术选型

- **双目标构建**：Chrome MV3 扩展 + 静态 Web 应用，共享 `src/`
- **构建**：esbuild（双 entry，分别产出 `build/extension/` 与 `build/web/`）
- **语言**：JavaScript + JSDoc + `checkJs`（享受类型提示，不引入 TypeScript 工具链）
- **框架**：无（原生 DOM + 模块化 JS）
- **音频**：Web Audio API
- **存储**：扩展用 `chrome.storage.local`，Web 用 `localStorage`，灵感速记统一 `sessionStorage`

## 开发

```bash
# 安装依赖
npm install

# 构建两份产物
npm run build

# 仅构建扩展 / Web
npm run build:ext
npm run build:web

# watch 模式
npm run watch

# 类型检查
npm run typecheck
```

产物：

- `build/extension/` — Chrome 扩展（Load unpacked 加载）
- `build/web/` — 静态站，由 GitHub Pages 部署到 `covely.joewustudio.com`

## 安装（Chrome 扩展）

1. `npm run build:ext`
2. 打开 `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `build/extension/`
5. 打开新标签页即生效

> MVP 阶段不上架 Chrome Web Store，先自用 1–2 个月打磨核心体验。

## 目录结构

```
src/
  modules/    业务模块（clock / noise / memo / search / ...）
  lib/        基础设施（storage / audio / clipboard / i18n）
  entry-extension.js  扩展 entry
  entry-web.js        Web entry
shell/
  manifest.json       扩展 manifest 模板
  newtab.html         扩展根 HTML
  index.html          Web 根 HTML
assets/
  sounds/             音频文件（CC0 / Pixabay License，含 SOURCES.md 追溯）
build/
  extension/          扩展产物
  web/                Web 产物
```

**强约束**：单文件 ≤ 500 行（vibe coding 友好），超过即拆分。

## 致谢

架构思路借鉴 [joeseesun/qiaomu-tab](https://github.com/joeseesun/qiaomu-tab)（MIT），仅借鉴思路而非搬运代码。

## License

待定（暂不开源协议，仅自用）。
