"use strict";

(() => {
  const byId = id => document.getElementById(id);
  const canvas = byId("scene");
  const stage = byId("stage");
  const stageStatus = byId("stage-status");
  const fallback = byId("fallback");
  const motionButton = byId("motion");
  const motionText = byId("motion-text");
  const resetButton = byId("reset");
  const fullscreenButton = byId("fullscreen");
  const zoomOut = byId("zoom-out");
  const zoomIn = byId("zoom-in");
  const zoomValue = byId("zoom-value");
  const qualitySelect = byId("quality");
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const { Scene, MODES } = window.enduranceRenderer;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  let renderer;
  let mode = "flyby";
  let moving = !motionPreference.matches;
  let seconds = 0;
  let current = startingCamera(mode);
  let target = { ...current };
  let renderScale = 1;
  let quality = qualitySelect.value;
  let recentFrames = [];
  let request = 0;
  let lastTime;
  let dirty = true;
  let expanded = false;
  const pointers = new Map();

  function startingCamera(name) {
    const { yaw, pitch } = MODES[name];
    return { yaw, pitch, zoom: 1, x: 0, y: 0 };
  }

  function schedule() {
    if (!request && renderer && !document.hidden) request = requestAnimationFrame(tick);
  }

  function invalidate() {
    dirty = true;
    schedule();
  }

  function monitorQuality(elapsed) {
    if (quality !== "auto" || elapsed <= 0) return;
    recentFrames.push(elapsed);
    if (recentFrames.length < 40) return;
    const mean = recentFrames.reduce((sum, n) => sum+n, 0) / recentFrames.length;
    recentFrames = [];
    const next = mean > 33 ? Math.max(0.56, renderScale*0.82)
      : mean < 19 ? Math.min(1, renderScale+0.05) : renderScale;
    if (Math.abs(next-renderScale) > 0.015) {
      renderScale = next;
      dirty = true;
    }
  }

  function canvasSize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const maxPixels = { auto: 1050000, low: 460000, high: 1900000 }[quality];
    const ratio = quality === "low" ? 0.70 : Math.min(dpr, quality === "high" ? 1.65 : 1.18);
    const scale = Math.min(ratio, Math.sqrt(maxPixels / Math.max(1, width*height))) * renderScale;
    return [Math.max(4, Math.round(width*scale)), Math.max(4, Math.round(height*scale))];
  }

  function tick(now) {
    request = 0;
    if (!renderer || document.hidden) return;
    const dt = lastTime === undefined ? 0 : now - lastTime;
    lastTime = now;
    const blend = 1 - Math.exp(-0.020*Math.max(9, dt));
    let settling = false;
    for (const name of Object.keys(target)) {
      const delta = target[name] - current[name];
      if (Math.abs(delta) > 0.00007) {
        current[name] += delta * blend;
        settling = true;
      } else {
        current[name] = target[name];
      }
    }
    if (moving) seconds += Math.min(0.12, dt/1000);
    if (dirty || settling || moving) {
      try {
        renderer.resize(...canvasSize());
        renderer.render(mode, current, seconds);
        stage.classList.add("ready");
        dirty = false;
        monitorQuality(dt);
      } catch (error) {
        console.error(error);
        showFallback("三维渲染未能启动，已显示短片画面。");
        return;
      }
    }
    if (moving || settling || dirty) schedule();
    else lastTime = undefined;
  }

  function updateMotion() {
    motionButton.setAttribute("aria-pressed", String(!moving));
    motionText.textContent = moving ? "暂停动画" : "播放动画";
    invalidate();
  }

  function updateControls() {
    const { min, max } = MODES[mode];
    zoomValue.textContent = target.zoom.toFixed(1) + "×";
    zoomOut.disabled = !renderer || target.zoom <= min + 0.0001;
    zoomIn.disabled = !renderer || target.zoom >= max - 0.0001;
    modeButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
  }

  function chooseMode(next) {
    if (!renderer || next === mode || !MODES[next]) return;
    mode = next;
    current = startingCamera(mode);
    target = { ...current };
    updateControls();
    invalidate();
  }

  function changeZoom(factor) {
    if (!renderer) return;
    const { min, max } = MODES[mode];
    target.zoom = clamp(target.zoom*factor, min, max);
    updateControls();
    invalidate();
  }

  function orbit(x, y) {
    target.yaw -= x * 0.007;
    target.pitch = clamp(target.pitch + y*0.007, -1.48, 1.48);
    invalidate();
  }

  function pan(x, y) {
    const height = Math.max(1, canvas.clientHeight);
    target.x = clamp(target.x + x/height, -1.35, 1.35);
    target.y = clamp(target.y - y/height, -0.84, 0.84);
    invalidate();
  }

  function gesture() {
    const [a, b] = [...pointers.values()];
    return {
      x: (a.x+b.x)/2, y: (a.y+b.y)/2,
      distance: Math.hypot(a.x-b.x, a.y-b.y),
    };
  }

  canvas.addEventListener("pointerdown", event => {
    if (!renderer || pointers.size >= 2) return;
    if (event.pointerType !== "touch" && ![0, 1, 2].includes(event.button)) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {
      x: event.clientX, y: event.clientY, pan: event.button === 1 || event.button === 2,
    });
  });

  canvas.addEventListener("pointermove", event => {
    const previous = pointers.get(event.pointerId);
    if (!previous || !renderer) return;
    const before = pointers.size === 2 ? gesture() : null;
    const dx = event.clientX-previous.x, dy = event.clientY-previous.y;
    previous.x = event.clientX;
    previous.y = event.clientY;
    if (before) {
      const after = gesture();
      if (before.distance > 3 && after.distance > 3) changeZoom(after.distance/before.distance);
      pan(after.x-before.x, after.y-before.y);
    } else if (previous.pan || event.shiftKey) {
      pan(dx, dy);
    } else {
      orbit(dx, dy);
    }
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(name, event => pointers.delete(event.pointerId));
  }
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  canvas.addEventListener("wheel", event => {
    if (!renderer) return;
    event.preventDefault();
    const units = event.deltaMode === 1 ? 19 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    changeZoom(Math.exp(-clamp(event.deltaY * units, -300, 300) * 0.0018));
  }, { passive: false });
  canvas.addEventListener("keydown", event => {
    if (!renderer) return;
    const arrows = { ArrowLeft: [-21, 0], ArrowRight: [21, 0], ArrowUp: [0, -21], ArrowDown: [0, 21] };
    if (arrows[event.key]) {
      (event.shiftKey ? pan : orbit)(...arrows[event.key]);
    } else if (event.key === "+" || event.key === "=") {
      changeZoom(1.18);
    } else if (event.key === "-" || event.key === "_") {
      changeZoom(1/1.18);
    } else {
      return;
    }
    event.preventDefault();
  });

  modeButtons.forEach(button => button.addEventListener("click", () => chooseMode(button.dataset.mode)));
  motionButton.addEventListener("click", () => {
    moving = !moving;
    updateMotion();
  });
  motionPreference.addEventListener("change", event => {
    if (event.matches) moving = false;
    updateMotion();
  });
  resetButton.addEventListener("click", () => {
    target = startingCamera(mode);
    updateControls();
    invalidate();
  });
  zoomOut.addEventListener("click", () => changeZoom(1/1.18));
  zoomIn.addEventListener("click", () => changeZoom(1.18));
  qualitySelect.addEventListener("change", () => {
    quality = qualitySelect.value;
    renderScale = 1;
    recentFrames = [];
    invalidate();
  });

  function updateFullscreen() {
    const label = expanded || document.fullscreenElement === stage ? "退出全屏" : "全屏";
    fullscreenButton.title = label;
    fullscreenButton.setAttribute("aria-label", label);
    invalidate();
  }

  function expand(value) {
    expanded = value;
    stage.classList.toggle("expanded", value);
    updateFullscreen();
  }

  fullscreenButton.addEventListener("click", async () => {
    if (expanded) {
      expand(false);
      return;
    }
    if (document.fullscreenElement === stage) {
      await document.exitFullscreen();
      return;
    }
    try {
      if (stage.requestFullscreen) await stage.requestFullscreen();
      else expand(true);
    } catch {
      expand(true);
    }
  });
  document.addEventListener("fullscreenchange", updateFullscreen);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && expanded) expand(false);
  });
  document.addEventListener("visibilitychange", () => {
    lastTime = undefined;
    if (!document.hidden) invalidate();
  });
  new ResizeObserver(invalidate).observe(stage);

  function disableSceneControls(disabled) {
    [motionButton, resetButton, qualitySelect, ...modeButtons].forEach(button => {
      button.disabled = disabled;
    });
    updateControls();
  }

  function showFallback(message) {
    renderer = undefined;
    cancelAnimationFrame(request);
    request = 0;
    lastTime = undefined;
    pointers.clear();
    stage.classList.remove("ready");
    stageStatus.textContent = "静态预览";
    fallback.textContent = message;
    fallback.hidden = false;
    disableSceneControls(true);
  }

  async function initialize() {
    try {
      fallback.hidden = true;
      const lettering = new Image();
      lettering.src = window.gargantuaScene.stencil;
      await lettering.decode();
      renderer = new Scene(canvas, window.gargantuaScene, lettering);
      stageStatus.textContent = "实时渲染";
      disableSceneControls(false);
      updateMotion();
    } catch (error) {
      console.error(error);
      showFallback("当前浏览器无法启动 WebGL 2，已显示短片画面。");
    }
  }

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    showFallback("图形连接已中断，等待恢复。");
  });
  canvas.addEventListener("webglcontextrestored", initialize);
  updateMotion();
  initialize();
})();
