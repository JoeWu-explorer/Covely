// User-initiated feedback: a quiet bottom-right button opens a glass dialog.
// Submits to Web3Forms (no backend, free tier) which emails the report to the
// developer. If the network submit fails — e.g. some regions can't reach the
// endpoint — it degrades to copy-to-clipboard + direct contact links, so a
// report is never lost. Nothing leaves the browser until the user hits send:
// no background telemetry, true to Covely's local-first promise.

import { icon } from "../lib/icons.js";
import * as storage from "../lib/storage.js";

// --- Config — fill these in before shipping --------------------------------
// Get an access key in ~10s at https://web3forms.com (enter your email, no
// signup). Reports are emailed straight to that inbox. While this is still the
// placeholder, the dialog still works: every submit lands in the copy/contact
// fallback below.
const WEB3FORMS_ACCESS_KEY = "b39c2ee0-fffb-4977-9698-9ed2b999acd6";
// Fallback channels shown if the network submit can't go through.
const CONTACT_EMAIL = "josephwu55555@gmail.com";
const CONTACT_XHS_URL = ""; // 小红书主页链接，留空则不显示该入口

const ENDPOINT = "https://api.web3forms.com/submit";
const SUBMIT_TIMEOUT_MS = 8000;
const SOUND_KEY = "covely.sound.preset"; // read for context (decoupled from noise.js)

/** @type {ReadonlyArray<{ key: string, label: string }>} */
const CATEGORIES = [
  { key: "idea", label: "💡 想法" },
  { key: "bug", label: "🐞 问题" },
  { key: "love", label: "❤️ 喜欢" },
];

/** Diagnostic context — only ever assembled inside submit(), never in the background. */
async function collectContext() {
  const ctx = {
    platform: process.env.COVELY_TARGET,
    version: process.env.COVELY_VERSION,
    locale: navigator.language,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    ua: navigator.userAgent,
    page: location.href,
    time: new Date().toString(),
    sound: "—",
  };
  try {
    const preset = /** @type {any} */ (await storage.get(SOUND_KEY));
    if (preset && typeof preset === "object") {
      const on = Object.keys(preset).filter((k) => preset[k]?.enabled);
      ctx.sound = on.length ? on.join(" + ") : "（静音）";
    }
  } catch {
    /* context is best-effort */
  }
  return ctx;
}

/**
 * @param {{ key: string, label: string }} cat
 * @param {string} message
 * @param {Record<string, string>} ctx
 */
function reportText(cat, message, ctx) {
  return [
    `[Covely 反馈 · ${cat.label}]`,
    "",
    message,
    "",
    "—— 以下为自动附带的诊断信息 ——",
    `版本: ${ctx.version}（${ctx.platform}）`,
    `声音: ${ctx.sound}`,
    `环境: ${ctx.locale} · ${ctx.viewport}`,
    `页面: ${ctx.page}`,
    `时间: ${ctx.time}`,
    `UA: ${ctx.ua}`,
  ].join("\n");
}

/** @param {string} text @returns {Promise<boolean>} */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts (mirrors memo.js).
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function mountFeedback() {
  // --- Floating trigger (bottom-right) ---
  const control = document.createElement("div");
  control.className = "feedback-control";
  const trigger = document.createElement("button");
  trigger.className = "feedback-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-label", "反馈");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.append(icon("message", 18));
  control.append(trigger);
  document.body.append(control);

  let open = false;

  trigger.addEventListener("click", () => openDialog());

  function openDialog() {
    if (open) return;
    open = true;

    const scrim = document.createElement("div");
    scrim.className = "feedback-scrim";

    const card = document.createElement("div");
    card.className = "feedback-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "给开发者反馈");

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      open = false;
      scrim.classList.add("leaving");
      card.classList.add("leaving");
      const finish = () => {
        scrim.remove();
        card.remove();
        trigger.focus();
      };
      card.addEventListener(
        "animationend",
        (e) => {
          if (e.animationName === "welcome-out") finish();
        },
        { once: true },
      );
      setTimeout(finish, 700); // fallback (also covers reduced-motion)
    }

    // --- Form ---
    const title = document.createElement("h2");
    title.className = "feedback-title";
    title.textContent = "说点什么";

    const sub = document.createElement("p");
    sub.className = "feedback-sub";
    sub.textContent = "想法、问题，或只是想说句话 —— 都会直接发给我。";

    const cats = document.createElement("div");
    cats.className = "feedback-cats";
    let activeCat = CATEGORIES[0];
    /** @type {Map<string, HTMLButtonElement>} */
    const catBtns = new Map();
    for (const c of CATEGORIES) {
      const b = document.createElement("button");
      b.className = "feedback-cat";
      b.type = "button";
      b.textContent = c.label;
      b.addEventListener("click", () => {
        activeCat = c;
        for (const [key, btn] of catBtns) {
          btn.setAttribute("aria-pressed", String(key === c.key));
        }
        textarea.focus();
      });
      catBtns.set(c.key, b);
      cats.append(b);
    }

    const textarea = document.createElement("textarea");
    textarea.className = "feedback-textarea";
    textarea.rows = 4;
    textarea.placeholder = "在这里写下来…";
    textarea.setAttribute("aria-label", "反馈内容");

    const email = document.createElement("input");
    email.className = "feedback-email";
    email.type = "email";
    email.autocomplete = "email";
    email.placeholder = "邮箱（选填，方便我回复你）";
    email.setAttribute("aria-label", "你的邮箱（选填）");

    // Honeypot: bots fill it, humans never see it.
    const honeypot = document.createElement("input");
    honeypot.className = "feedback-hp";
    honeypot.type = "text";
    honeypot.name = "botcheck";
    honeypot.tabIndex = -1;
    honeypot.setAttribute("autocomplete", "off");
    honeypot.setAttribute("aria-hidden", "true");

    const note = document.createElement("p");
    note.className = "feedback-note";
    note.textContent = "这条反馈会发给开发者，不含任何后台数据 🤝";

    const actions = document.createElement("div");
    actions.className = "feedback-actions";
    const sendBtn = document.createElement("button");
    sendBtn.className = "feedback-primary";
    sendBtn.type = "button";
    sendBtn.textContent = "发送";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "feedback-ghost";
    cancelBtn.type = "button";
    cancelBtn.textContent = "再想想";
    actions.append(sendBtn, cancelBtn);

    const body = document.createElement("div");
    body.className = "feedback-body";
    body.append(cats, textarea, email, honeypot, note, actions);
    card.append(title, sub, body);

    document.body.append(scrim, card);
    for (const [key] of catBtns) {
      catBtns.get(key)?.setAttribute("aria-pressed", String(key === activeCat.key));
    }
    requestAnimationFrame(() => textarea.focus());

    // --- Result states (replace the body) ---
    /** @param {string} heading @param {string} detail */
    function showDone(heading, detail) {
      title.textContent = heading;
      sub.textContent = detail;
      body.replaceChildren();
      const ok = document.createElement("button");
      ok.className = "feedback-primary";
      ok.type = "button";
      ok.textContent = "好的";
      ok.addEventListener("click", close);
      const wrap = document.createElement("div");
      wrap.className = "feedback-actions";
      wrap.append(ok);
      body.append(wrap);
      requestAnimationFrame(() => ok.focus());
    }

    /** @param {string} text */
    async function showFallback(text) {
      const copied = await copyText(text);
      title.textContent = "网络没走通";
      sub.textContent = copied
        ? "已经把你的反馈复制到剪贴板，挑一个渠道直接发我就行："
        : "这条没能发出去，复制下面的内容，挑一个渠道发我：";
      body.replaceChildren();

      const channels = document.createElement("div");
      channels.className = "feedback-channels";
      const mail = document.createElement("a");
      mail.className = "feedback-channel";
      mail.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        "Covely 反馈",
      )}&body=${encodeURIComponent(text)}`;
      mail.textContent = `📮 邮件 · ${CONTACT_EMAIL}`;
      channels.append(mail);
      if (CONTACT_XHS_URL) {
        const xhs = document.createElement("a");
        xhs.className = "feedback-channel";
        xhs.href = CONTACT_XHS_URL;
        xhs.target = "_blank";
        xhs.rel = "noreferrer";
        xhs.textContent = "📕 小红书私信";
        channels.append(xhs);
      }

      if (!copied) {
        const pre = document.createElement("textarea");
        pre.className = "feedback-textarea feedback-fallback-text";
        pre.readOnly = true;
        pre.rows = 5;
        pre.value = text;
        body.append(pre);
      }

      const done = document.createElement("button");
      done.className = "feedback-ghost";
      done.type = "button";
      done.textContent = "关闭";
      done.addEventListener("click", close);
      const wrap = document.createElement("div");
      wrap.className = "feedback-actions";
      wrap.append(done);

      body.append(channels, wrap);
    }

    async function submit() {
      const message = textarea.value.trim();
      if (!message) {
        textarea.focus();
        return;
      }
      if (honeypot.value) {
        close();
        return;
      } // silently drop bots

      sendBtn.disabled = true;
      sendBtn.textContent = "发送中…";
      const ctx = await collectContext();
      const text = reportText(activeCat, message, ctx);

      try {
        // Submit as multipart FormData with NO custom headers — this is a CORS
        // "simple request", so the browser sends no OPTIONS preflight. (Web3Forms
        // 403s the JSON-content-type preflight, which would otherwise force every
        // submit into the fallback.) Same shape a native <form> POST would send.
        const form = new FormData();
        form.append("access_key", WEB3FORMS_ACCESS_KEY);
        form.append("subject", `Covely 反馈 · ${activeCat.label}`);
        form.append("from_name", "Covely");
        if (email.value.trim()) form.append("email", email.value.trim());
        form.append("botcheck", honeypot.value);
        form.append("category", activeCat.key);
        form.append("message", text);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
        const res = await fetch(ENDPOINT, {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        clearTimeout(timer);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          showDone("收到了，谢谢你 🌿", "你的每一条反馈我都会认真看。");
          return;
        }
        throw new Error(json.message || `HTTP ${res.status}`);
      } catch (err) {
        console.warn("[feedback] submit failed, using fallback", err);
        await showFallback(text);
      }
    }

    sendBtn.addEventListener("click", () => void submit());
    cancelBtn.addEventListener("click", close);
    // Cmd/Ctrl+Enter sends.
    textarea.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void submit();
      }
    });
    scrim.addEventListener("pointerdown", close);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    });
  }
}
