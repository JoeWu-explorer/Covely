// Covely 白噪音原型：用 Web Audio API 现场合成雨/浪/咖啡厅
// 目标：验证质感——是否能让人专注 30 分钟。
//
// 共享一个 AudioContext，每种声音是一个独立的 SoundNode：
//   start() 时构建图、连接到主输出；
//   stop()  时断开并丢弃所有节点，释放 CPU；
//   setVolume(0..1) 调节本声音的最终增益。

/** @type {AudioContext | null} */
let ctx = null;

function getCtx() {
  if (!ctx) {
    const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ---------- 噪声源 ----------

/** 白噪声 buffer，长度 = 2 秒，循环播放。 */
function makeWhiteNoiseBuffer(ac) {
  const len = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** 粉红噪声 buffer（Paul Kellet 滤波法）：低频更厚，听感更自然。 */
function makePinkNoiseBuffer(ac) {
  const len = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

/** 棕噪声 buffer：积分白噪声 → 低频突出，像远处的环境嗡鸣。 */
function makeBrownNoiseBuffer(ac) {
  const len = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

function bufferSource(ac, buffer) {
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

// ---------- SoundNode 基础结构 ----------

/**
 * @typedef {{
 *   start: () => void,
 *   stop: () => void,
 *   setVolume: (v: number) => void,
 *   running: boolean,
 * }} SoundNode
 */

/**
 * @param {() => { sources: AudioScheduledSourceNode[], out: AudioNode, dispose?: () => void }} build
 * @returns {SoundNode}
 */
function makeSound(build) {
  /** @type {AudioScheduledSourceNode[]} */
  let sources = [];
  /** @type {GainNode | null} */
  let masterGain = null;
  /** @type {(() => void) | undefined} */
  let dispose;
  let volume = 0.6;
  let running = false;

  return {
    get running() { return running; },
    set running(v) { running = v; },
    start() {
      if (running) return;
      const ac = getCtx();
      const { sources: srcs, out, dispose: d } = build();
      masterGain = ac.createGain();
      masterGain.gain.value = volume;
      out.connect(masterGain);
      masterGain.connect(ac.destination);
      sources = srcs;
      dispose = d;
      for (const s of sources) s.start();
      running = true;
    },
    stop() {
      if (!running) return;
      for (const s of sources) {
        try { s.stop(); } catch {}
      }
      sources = [];
      if (masterGain) {
        try { masterGain.disconnect(); } catch {}
      }
      masterGain = null;
      if (dispose) dispose();
      dispose = undefined;
      running = false;
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (masterGain) {
        const ac = getCtx();
        masterGain.gain.setTargetAtTime(volume, ac.currentTime, 0.05);
      }
    },
  };
}

// ---------- 三种声音 ----------

/** 雨声：白噪声经带通滤波 + 高频小颗粒。 */
function createRain() {
  return makeSound(() => {
    const ac = getCtx();
    const noise = bufferSource(ac, makeWhiteNoiseBuffer(ac));

    // 主体：带通在 ~1.2kHz，模拟雨水主能量段
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 0.6;

    // 低通收一下顶端的刺耳感
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4500;

    // 高频颗粒：另一条支路 → 高通 + LFO 调幅，制造小水滴的密集感
    const droplets = bufferSource(ac, makeWhiteNoiseBuffer(ac));
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const dropGain = ac.createGain();
    dropGain.gain.value = 0.08;

    // LFO 让颗粒声密度起伏（5-7Hz 抖动）
    const lfo = ac.createOscillator();
    lfo.frequency.value = 6.2;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain).connect(dropGain.gain);

    const sum = ac.createGain();
    sum.gain.value = 1.0;

    noise.connect(bp).connect(lp).connect(sum);
    droplets.connect(hp).connect(dropGain).connect(sum);

    return { sources: [noise, droplets, lfo], out: sum };
  });
}

/** 海浪：棕噪声 → 低通 → 极慢 LFO 调幅，模拟潮汐起伏。 */
function createOcean() {
  return makeSound(() => {
    const ac = getCtx();
    const noise = bufferSource(ac, makeBrownNoiseBuffer(ac));

    // 低通让海浪闷下来
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 0.4;

    // 慢 LFO（~0.08Hz，周期 ~12s）控制整体音量
    const swell = ac.createGain();
    swell.gain.value = 0.6;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.4; // 在 0.2 ~ 1.0 之间起伏
    lfo.connect(lfoDepth).connect(swell.gain);

    // 加一点高频"沫"，让浪头不全是低频闷音
    const foam = bufferSource(ac, makePinkNoiseBuffer(ac));
    const foamHp = ac.createBiquadFilter();
    foamHp.type = "highpass";
    foamHp.frequency.value = 1200;
    const foamGain = ac.createGain();
    foamGain.gain.value = 0.0;
    const foamLfo = ac.createOscillator();
    foamLfo.frequency.value = 0.08;
    const foamLfoDepth = ac.createGain();
    foamLfoDepth.gain.value = 0.08;
    foamLfo.connect(foamLfoDepth).connect(foamGain.gain);

    const sum = ac.createGain();
    noise.connect(lp).connect(swell).connect(sum);
    foam.connect(foamHp).connect(foamGain).connect(sum);

    return { sources: [noise, foam, lfo, foamLfo], out: sum };
  });
}

/** 咖啡厅：粉噪 + 棕噪 + 随机"杯碟碰撞"事件。 */
function createCafe() {
  return makeSound(() => {
    const ac = getCtx();

    // 底层人声混响：粉红噪声 + 中频带通
    const chatter = bufferSource(ac, makePinkNoiseBuffer(ac));
    const chatterBp = ac.createBiquadFilter();
    chatterBp.type = "bandpass";
    chatterBp.frequency.value = 600;
    chatterBp.Q.value = 0.4;
    const chatterGain = ac.createGain();
    chatterGain.gain.value = 0.7;

    // 远处空间嗡鸣：棕噪声 + 低通
    const rumble = bufferSource(ac, makeBrownNoiseBuffer(ac));
    const rumbleLp = ac.createBiquadFilter();
    rumbleLp.type = "lowpass";
    rumbleLp.frequency.value = 300;
    const rumbleGain = ac.createGain();
    rumbleGain.gain.value = 0.5;

    // 慢调制人声音量（模拟人群的起落）
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.15;
    lfo.connect(lfoDepth).connect(chatterGain.gain);

    const sum = ac.createGain();
    chatter.connect(chatterBp).connect(chatterGain).connect(sum);
    rumble.connect(rumbleLp).connect(rumbleGain).connect(sum);

    // 偶尔的"叮"——短促高通噪声爆发，用 setInterval 触发
    const clinkBus = ac.createGain();
    clinkBus.gain.value = 0.0;
    clinkBus.connect(sum);

    const clinkTimer = setInterval(() => {
      // 平均每 4-8 秒一次
      if (Math.random() > 0.25) return;
      scheduleClink(ac, clinkBus);
    }, 1500);

    return {
      sources: [chatter, rumble, lfo],
      out: sum,
      dispose: () => clearInterval(clinkTimer),
    };
  });
}

/** 一次性"叮"事件：高频窄带噪声脉冲，~120ms 包络。 */
function scheduleClink(ac, dest) {
  const now = ac.currentTime;
  const src = ac.createBufferSource();
  // 50ms 短 buffer 即可
  const buf = ac.createBuffer(1, ac.sampleRate * 0.15, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3000 + Math.random() * 2000; // 3-5kHz
  bp.Q.value = 8;

  const env = ac.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.18, now + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  src.connect(bp).connect(env).connect(dest);
  src.start(now);
  src.stop(now + 0.15);
}

// ---------- 与 UI 绑定 ----------

/** @type {Record<string, SoundNode>} */
const sounds = {
  rain: createRain(),
  ocean: createOcean(),
  cafe: createCafe(),
};

document.querySelectorAll(".card").forEach((card) => {
  const id = /** @type {HTMLElement} */ (card).dataset.id;
  if (!id || !(id in sounds)) return;
  const sound = sounds[id];
  const toggle = card.querySelector(".toggle");
  const slider = /** @type {HTMLInputElement} */ (card.querySelector("input[type=range]"));

  // 初始音量
  sound.setVolume(Number(slider.value) / 100);

  toggle?.addEventListener("click", () => {
    if (sound.running) {
      sound.stop();
      card.classList.remove("on");
    } else {
      sound.start();
      // start() 会重置 masterGain，需要重新写入当前 slider 值
      sound.setVolume(Number(slider.value) / 100);
      card.classList.add("on");
    }
  });

  slider.addEventListener("input", () => {
    sound.setVolume(Number(slider.value) / 100);
  });
});
