(() => {
  'use strict';

  const I18N = {
    zh: {
      brandSub: '同提示词 · 多模型表现对比（视频 / 交互网页 / SVG）',
      addModelBtn: '本地预览对比',
      sharedPromptBadge: 'SHARED PROMPT · 同一提示词',
      copyPrompt: '复制提示词',
      copied: '已复制 ✓',
      playAll: '同时播放全部',
      pauseAll: '全部暂停',
      resetAll: '全部归零',
      videoTip: '提示：每个视频均可独立点击播放；“同时播放”不强制跳帧，保证双路流畅不卡顿',
      launchAllHtml: '同时启动全部网页',
      sleepAllHtml: '全部休眠释放显卡',
      htmlTip: '提示：交互场景均为实时 WebGL2 渲染，可单开满帧体验，或点击「同时启动」并排操作',
      launchOneHtml: '▶ 启动实时交互网页',
      launchOneSub: '点击加载 WebGL2 场景 · 支持鼠标拖拽旋转与缩放',
      sleepOneHtml: '⏹ 休眠',
      soloAudio: '仅听此路',
      reloadHtml: '↻ 重载',
      openNewTab: '↗ 新窗全屏',
      svgBgToggle: '切换底色',
      specsTitle: '核心参数与成本对照',
      footerNote: '支持视频（MP4/WebM）、交互网页（HTML）与矢量图形（SVG）多模态分类同台对比',
      modalTitle: '添加本地作品进行同台对比',
      modalTip: '支持选择本地 MP4 / WebM 视频、HTML 网页或 SVG 矢量文件，仅在当前浏览器内存中临时加载对比，不会上传服务器；也可导出 JSON 片段写入 models.json 永久发布。',
      dropTitle: '点击选择或拖拽文件到此处',
      fieldName: '模型名称 *',
      fieldVendor: '研发方 / 版本备注',
      fieldTitle: '作品标题',
      fieldEngine: '渲染引擎 / 技术栈',
      fieldGenTime: '生成耗时',
      fieldTokens: 'Token 消耗',
      fieldCost: '花费 / 计费',
      genJsonBtn: '生成 models.json 配置',
      loadNowBtn: '加入当前对比网格',
      jsonGuide: '将文件放入 dist/ 对应目录后，把下方对象追加到 dist/models.json：',
      copy: '复制',
      metricTimeLabel: '耗时',
      metricTokenLabel: 'Token',
      metricCostLabel: '花费',
      worksUnit: '作品',
      catNames: {
        video: '🎬 视频成片对比',
        html: '🌐 交互式 3D 网页对比',
        svg: '✦ SVG 矢量图形对比',
        all: '📋 全部形式'
      },
      typeLabels: {
        video: '视频',
        html: 'HTML 网页',
        svg: 'SVG 矢量'
      },
      specRows: [
        ['研发方 / 来源', 'vendor'],
        ['产物形式', 'outputType'],
        ['生成耗时', 'generationTime'],
        ['Token 消耗', 'tokenUsage'],
        ['花费 / 计费', 'cost'],
        ['成片 / 规格', 'specSummary'],
        ['核心渲染引擎', 'renderEngine'],
        ['音频方案', 'audioEngine']
      ]
    },
    en: {
      brandSub: 'Same-Prompt Multi-Model Benchmark (Video / HTML / SVG)',
      addModelBtn: 'Preview Local Output',
      sharedPromptBadge: 'SHARED PROMPT',
      copyPrompt: 'Copy Prompt',
      copied: 'Copied ✓',
      playAll: 'Play All Videos',
      pauseAll: 'Pause All',
      resetAll: 'Reset All',
      videoTip: 'Tip: Play each video independently; "Play All" avoids forced mid-stream seeks for stutter-free decoding',
      launchAllHtml: 'Launch All Web Scenes',
      sleepAllHtml: 'Unload All (Free GPU)',
      htmlTip: 'Tip: Interactive scenes run heavy real-time WebGL2 shaders; launch one at a time for peak FPS or both together',
      launchOneHtml: '▶ Launch Interactive 3D Scene',
      launchOneSub: 'Click to boot WebGL2 · Drag to orbit, scroll to zoom',
      sleepOneHtml: '⏹ Sleep',
      soloAudio: 'Solo Audio',
      reloadHtml: '↻ Reload',
      openNewTab: '↗ Full Tab',
      svgBgToggle: 'Background',
      specsTitle: 'Specs & Cost Comparison',
      footerNote: 'Categorized comparison for Video (MP4/WebM), Interactive HTML, and Vector SVG outputs',
      modalTitle: 'Add Local Output to Comparison Grid',
      modalTip: 'Load any local MP4 / WebM video, HTML page, or SVG file locally inside your browser (never uploaded). Export a models.json snippet to deploy permanently.',
      dropTitle: 'Click to browse or drop file here',
      fieldName: 'Model Name *',
      fieldVendor: 'Vendor / Notes',
      fieldTitle: 'Work Title',
      fieldEngine: 'Render Engine / Stack',
      fieldGenTime: 'Generation Time',
      fieldTokens: 'Token Usage',
      fieldCost: 'Cost / Billing',
      genJsonBtn: 'Generate models.json',
      loadNowBtn: 'Add to Comparison Grid',
      jsonGuide: 'Place the asset under dist/ and append this object to models[] in dist/models.json:',
      copy: 'Copy',
      metricTimeLabel: 'Time',
      metricTokenLabel: 'Tokens',
      metricCostLabel: 'Cost',
      worksUnit: 'items',
      catNames: {
        video: '🎬 Video Cuts',
        html: '🌐 Interactive WebGL Pages',
        svg: '✦ Vector SVG',
        all: '📋 All Formats'
      },
      typeLabels: {
        video: 'Video',
        html: 'HTML Page',
        svg: 'Vector SVG'
      },
      specRows: [
        ['Vendor / Track', 'vendor'],
        ['Output Format', 'outputType'],
        ['Generation Time', 'generationTime'],
        ['Token Usage', 'tokenUsage'],
        ['Cost / Billing', 'cost'],
        ['Format / Specs', 'specSummary'],
        ['Render Engine', 'renderEngine'],
        ['Audio Pipeline', 'audioEngine']
      ]
    }
  };

  const state = {
    lang: 'zh',
    benchmarks: [],
    activeBenchmarkId: null,
    activeCategory: 'video',
    arena: null,
    models: [],
    soloVideoId: null,
    activeHtmlIds: new Set(),
    selectedFile: null,
    selectedType: 'video',
    selectedMeta: null
  };

  const $ = (id) => document.getElementById(id);

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inferModelType(m) {
    if (m.type) return m.type;
    const src = (m.url || m.video || m.src || '').toLowerCase();
    if (src.endsWith('.html') || src.endsWith('.htm')) return 'html';
    if (src.endsWith('.svg')) return 'svg';
    return 'video';
  }

  function getMediaUrl(m) {
    return m.url || m.video || m.src || '';
  }

  function getAvailableCategories(models) {
    const order = ['video', 'html', 'svg'];
    const counts = {};
    models.forEach((m) => {
      const t = inferModelType(m);
      counts[t] = (counts[t] || 0) + 1;
    });
    const cats = order.filter((t) => counts[t] > 0).map((t) => ({ key: t, count: counts[t] }));
    if (cats.length > 1) {
      cats.push({ key: 'all', count: models.length });
    }
    return cats;
  }

  function getVisibleModels() {
    if (!state.activeCategory || state.activeCategory === 'all') {
      return state.models;
    }
    return state.models.filter((m) => inferModelType(m) === state.activeCategory);
  }

  function getVideoEls() {
    return Array.from(document.querySelectorAll('#comparisonGrid video'));
  }

  function applySoloAudio(targetId) {
    state.soloVideoId = state.soloVideoId === targetId ? null : targetId;
    const vids = getVideoEls();

    vids.forEach((v) => {
      v.muted = state.soloVideoId ? v.dataset.modelId !== state.soloVideoId : false;
    });

    document.querySelectorAll('.solo-btn').forEach((btn) => {
      const on = state.soloVideoId === btn.dataset.modelId;
      btn.classList.toggle('active', on);
      btn.firstChild.textContent = on ? '🔊 ' : '🔈 ';
    });
  }

  function waitCanPlay(videoEl, timeoutMs = 1500) {
    if (videoEl.readyState >= 3) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        videoEl.removeEventListener('canplay', finish);
        resolve();
      };
      videoEl.addEventListener('canplay', finish, { once: true });
      setTimeout(finish, timeoutMs);
    });
  }

  async function playAllVideos() {
    const vids = getVideoEls();
    if (!vids.length) return;

    vids.forEach((v) => {
      if (Number.isFinite(v.duration) && v.currentTime >= v.duration - 0.1) {
        v.currentTime = 0;
      }
    });

    await Promise.all(vids.map((v) => waitCanPlay(v, 1200)));
    await Promise.allSettled(vids.map((v) => v.play()));
  }

  function pauseAllVideos() {
    getVideoEls().forEach((v) => v.pause());
  }

  function resetAllVideos() {
    getVideoEls().forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
  }

  function launchAllHtml() {
    getVisibleModels()
      .filter((m) => inferModelType(m) === 'html')
      .forEach((m) => state.activeHtmlIds.add(m.id));
    renderCards();
  }

  function sleepAllHtml() {
    state.activeHtmlIds.clear();
    renderCards();
  }

  function renderTelemetryHtml(model) {
    const dict = I18N[state.lang];
    const met = model.metrics || {};
    const sp = model.specs || {};
    const items = [
      [dict.metricTimeLabel, met.timeShort || sp.generationTime || '—'],
      [dict.metricTokenLabel, met.tokensShort || sp.tokenUsage || '—'],
      [dict.metricCostLabel, met.costShort || sp.cost || '—']
    ];
    return items
      .map(
        ([k, v]) => `<span class="metric-chip"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></span>`
      )
      .join('');
  }

  function renderBenchmarkTabs() {
    const nav = $('benchmarkNav');
    const dict = I18N[state.lang];
    nav.innerHTML = '';

    state.benchmarks.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bench-tab' + (b.id === state.activeBenchmarkId ? ' active' : '');
      const title = state.lang === 'zh' ? b.tabTitle || b.title : b.tabTitleEn || b.title;
      const badgeText = state.lang === 'zh' ? b.badge : b.badgeEn || b.badge;
      const badgeHtml = badgeText ? `<span class="bench-badge">${escapeHtml(badgeText)}</span>` : '';
      const countText = `${(b.models || []).length} ${dict.worksUnit}`;
      btn.innerHTML = `${badgeHtml}<span>${escapeHtml(title)}</span><span class="bench-count">(${escapeHtml(countText)})</span>`;
      btn.addEventListener('click', () => switchBenchmark(b.id, null, true));
      nav.appendChild(btn);
    });
  }

  function renderCategoryBar() {
    const bar = $('categoryBar');
    const cats = getAvailableCategories(state.models);
    if (cats.length <= 1) {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }

    const dict = I18N[state.lang];
    const newCats = new Set((state.arena && state.arena.newCategories) || []);
    bar.hidden = false;
    bar.innerHTML = '';

    cats.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-pill' + (cat.key === state.activeCategory ? ' active' : '');
      const label = dict.catNames[cat.key] || cat.key;
      const tagHtml = newCats.has(cat.key) ? `<span class="cat-tag">NEW</span>` : '';
      btn.innerHTML = `${tagHtml}<span>${escapeHtml(label)}</span><span>(${cat.count})</span>`;
      btn.addEventListener('click', () => switchCategory(cat.key, true));
      bar.appendChild(btn);
    });
  }

  function updatePromptNote() {
    const noteEl = $('promptFairnessNote');
    if (!state.arena) {
      noteEl.hidden = true;
      return;
    }
    const notesMap = state.lang === 'zh' ? state.arena.categoryNotes : state.arena.categoryNotesEn || state.arena.categoryNotes;
    const catKey = state.activeCategory;
    let noteText = '';
    if (notesMap && catKey !== 'all' && notesMap[catKey]) {
      noteText = notesMap[catKey];
    } else if (notesMap && catKey === 'all') {
      noteText = Object.values(notesMap).join(' | ');
    } else {
      noteText = state.lang === 'zh' ? state.arena.fairnessNote : state.arena.fairnessNoteEn || state.arena.fairnessNote;
    }
    if (noteText) {
      noteEl.textContent = noteText;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }
  }

  function switchCategory(catKey, updateHash = true) {
    pauseAllVideos();
    state.activeCategory = catKey;
    state.soloVideoId = null;

    if (updateHash && state.activeBenchmarkId) {
      const targetHash = `#${state.activeBenchmarkId}/${catKey}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }

    renderCategoryBar();
    updatePromptNote();
    renderCards();
    renderSpecTable();
  }

  function renderCards() {
    const grid = $('comparisonGrid');
    const dict = I18N[state.lang];
    const visibleModels = getVisibleModels();
    grid.innerHTML = '';

    let videoCount = 0;
    let htmlCount = 0;

    visibleModels.forEach((m, idx) => {
      const type = inferModelType(m);
      const src = getMediaUrl(m);
      const sp = m.specs || {};
      if (type === 'video') videoCount++;
      if (type === 'html') htmlCount++;

      const isHtmlLive = type === 'html' && state.activeHtmlIds.has(m.id);

      const card = document.createElement('article');
      card.className = 'model-card';

      const color = m.accent || (idx % 2 === 0 ? '#FF3B1D' : '#2855FF');
      const typeLabel = dict.typeLabels[type] || type.toUpperCase();
      const summary =
        state.lang === 'zh'
          ? m.tagline || sp.visualStyle || ''
          : m.taglineEn || m.tagline || sp.visualStyle || '';

      const metaRight = [sp.resolution, sp.duration ? sp.duration.split(' ')[0] : '', sp.fileSize]
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ');

      let toolsHtml = `<span class="media-type-pill">${escapeHtml(typeLabel)}</span>`;
      if (type === 'video') {
        toolsHtml += `<button type="button" class="btn-mini solo-btn" data-model-id="${escapeHtml(m.id)}">🔈 ${escapeHtml(dict.soloAudio)}</button>`;
      } else if (type === 'html') {
        if (isHtmlLive) {
          toolsHtml += `<button type="button" class="btn-mini sleep-html-btn" data-model-id="${escapeHtml(m.id)}">${escapeHtml(dict.sleepOneHtml)}</button>`;
          toolsHtml += `<button type="button" class="btn-mini reload-html-btn" data-idx="${idx}">${escapeHtml(dict.reloadHtml)}</button>`;
        }
        toolsHtml += `<a class="btn-mini" href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer">${escapeHtml(dict.openNewTab)}</a>`;
      } else if (type === 'svg') {
        toolsHtml += `<button type="button" class="btn-mini svg-bg-btn">${escapeHtml(dict.svgBgToggle)}</button>`;
        toolsHtml += `<a class="btn-mini" href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer">${escapeHtml(dict.openNewTab)}</a>`;
      }

      let stageClass = 'media-stage';
      let stageHtml = '';
      if (type === 'video') {
        stageHtml = `<video controls playsinline preload="metadata" poster="${escapeHtml(m.poster || '')}" data-model-id="${escapeHtml(m.id)}" src="${escapeHtml(src)}"></video>`;
      } else if (type === 'html') {
        stageClass += ' is-html';
        if (isHtmlLive) {
          stageHtml = `<iframe data-html-idx="${idx}" src="${escapeHtml(src)}" allow="fullscreen" loading="eager" title="${escapeHtml(m.name)}"></iframe>`;
        } else {
          const posterTag = m.poster ? `<img src="${escapeHtml(m.poster)}" alt="${escapeHtml(m.name)}">` : '';
          stageHtml = `
            <div class="html-cover">
              ${posterTag}
              <div class="html-launch-overlay">
                <button type="button" class="html-launch-btn" data-model-id="${escapeHtml(m.id)}">${escapeHtml(dict.launchOneHtml)}</button>
                <span class="html-launch-sub">${escapeHtml(dict.launchOneSub)}</span>
              </div>
            </div>
          `;
        }
      } else if (type === 'svg') {
        stageHtml = `<div class="svg-stage" data-bg="dark"><img src="${escapeHtml(src)}" alt="${escapeHtml(m.name)}" /></div>`;
      }

      card.innerHTML = `
        <div class="card-head">
          <div class="card-identity">
            <span class="dot" style="background:${color}; box-shadow:0 0 10px ${color}"></span>
            <span class="model-name">${escapeHtml(m.name)}</span>
            <span class="model-vendor">${escapeHtml(m.vendor || '')}</span>
          </div>
          <div class="card-tools">${toolsHtml}</div>
        </div>
        <div class="${stageClass}">${stageHtml}</div>
        <div class="card-foot">
          <div class="foot-top">
            <span class="work-title">${escapeHtml(m.title || m.name)}</span>
            <span class="work-meta">${escapeHtml(metaRight)}</span>
          </div>
          ${summary ? `<p class="work-summary">${escapeHtml(summary)}</p>` : ''}
          <div class="panel-telemetry">${renderTelemetryHtml(m)}</div>
        </div>
      `;

      grid.appendChild(card);
    });

    $('videoToolbar').hidden = videoCount < 2;
    $('htmlToolbar').hidden = htmlCount < 1;

    grid.querySelectorAll('.solo-btn').forEach((btn) => {
      btn.addEventListener('click', () => applySoloAudio(btn.dataset.modelId));
    });

    grid.querySelectorAll('.html-launch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeHtmlIds.add(btn.dataset.modelId);
        renderCards();
      });
    });

    grid.querySelectorAll('.sleep-html-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeHtmlIds.delete(btn.dataset.modelId);
        renderCards();
      });
    });

    grid.querySelectorAll('.reload-html-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const iframe = grid.querySelector(`iframe[data-html-idx="${btn.dataset.idx}"]`);
        if (iframe) iframe.src = iframe.src;
      });
    });

    const svgModes = ['dark', 'bg-light', 'bg-checker'];
    grid.querySelectorAll('.svg-bg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stage = btn.closest('.model-card').querySelector('.svg-stage');
        if (!stage) return;
        const cur = stage.dataset.bg || 'dark';
        const next = svgModes[(svgModes.indexOf(cur) + 1) % svgModes.length];
        stage.classList.remove('bg-light', 'bg-checker');
        if (next !== 'dark') stage.classList.add(next);
        stage.dataset.bg = next;
      });
    });

    state.soloVideoId = null;
  }

  function renderSpecTable() {
    const table = $('specTable');
    const dict = I18N[state.lang];
    const visibleModels = getVisibleModels();

    const headCells = visibleModels
      .map(
        (m, idx) => `<th>
          <span class="dot" style="display:inline-block;margin-right:6px;background:${m.accent || (idx % 2 === 0 ? '#FF3B1D' : '#2855FF')}"></span>
          ${escapeHtml(m.name)}
        </th>`
      )
      .join('');

    const rowsHtml = dict.specRows
      .map(([label, key]) => {
        const tds = visibleModels
          .map((m) => {
            const sp = m.specs || {};
            let val = '—';
            if (key === 'vendor') val = m.vendor || '—';
            else if (key === 'outputType') val = dict.typeLabels[inferModelType(m)] || '—';
            else if (key === 'specSummary') {
              val = [sp.resolution, sp.duration, sp.fileSize].filter(Boolean).join(' · ') || '—';
            } else {
              val = sp[key] || '—';
            }
            return `<td>${escapeHtml(val)}</td>`;
          })
          .join('');
        return `<tr><td>${escapeHtml(label)}</td>${tds}</tr>`;
      })
      .join('');

    table.innerHTML = `
      <thead>
        <tr>
          <th>${state.lang === 'zh' ? '对比维度' : 'Dimension'}</th>
          ${headCells}
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    `;
  }

  function applyI18n() {
    const dict = I18N[state.lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });

    if (state.arena) {
      $('promptText').textContent =
        state.lang === 'zh' ? state.arena.prompt : state.arena.promptEn || state.arena.prompt;
      $('benchmarkTags').textContent =
        state.lang === 'zh'
          ? state.arena.benchmarkSpecs || ''
          : state.arena.benchmarkSpecsEn || state.arena.benchmarkSpecs || '';

      const refEl = $('benchmarkRefLink');
      if (state.arena.referenceUrl) {
        refEl.href = state.arena.referenceUrl;
        refEl.textContent = state.arena.referenceLabel || 'Reference ↗';
        refEl.hidden = false;
      } else {
        refEl.hidden = true;
      }
    }

    renderBenchmarkTabs();
    renderCategoryBar();
    updatePromptNote();
    renderCards();
    renderSpecTable();
  }

  function switchBenchmark(id, requestedCategory = null, updateHash = true) {
    pauseAllVideos();
    state.activeHtmlIds.clear();
    const bench = state.benchmarks.find((b) => b.id === id) || state.benchmarks[0];
    if (!bench) return;

    state.activeBenchmarkId = bench.id;
    state.arena = bench;
    state.models = Array.isArray(bench.models) ? [...bench.models] : [];
    state.soloVideoId = null;

    const cats = getAvailableCategories(state.models);
    const validKeys = new Set(cats.map((c) => c.key));
    if (requestedCategory && validKeys.has(requestedCategory)) {
      state.activeCategory = requestedCategory;
    } else if (bench.defaultCategory && validKeys.has(bench.defaultCategory)) {
      state.activeCategory = bench.defaultCategory;
    } else {
      state.activeCategory = cats.length ? cats[0].key : 'all';
    }

    if (updateHash) {
      const targetHash = cats.length > 1 ? `#${bench.id}/${state.activeCategory}` : `#${bench.id}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }

    applyI18n();
  }

  function buildJsonEntryFromForm() {
    const name = ($('inputModelName').value || 'New Model').trim();
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'custom-model';
    const type = state.selectedType || 'video';
    const fileName = state.selectedFile ? state.selectedFile.name : `${id}.${type === 'html' ? 'html' : type === 'svg' ? 'svg' : 'mp4'}`;
    const meta = state.selectedMeta || {};
    const sizeMiB = state.selectedFile
      ? `${(state.selectedFile.size / (1024 * 1024)).toFixed(2)} MiB`
      : 'TBD';
    const folder = type === 'html' ? 'pages' : type === 'svg' ? 'svg' : 'videos';

    return {
      id,
      type,
      name,
      shortName: name,
      vendor: ($('inputModelVendor').value || 'Custom Upload').trim(),
      accent: '#C8FF2E',
      title: ($('inputWorkTitle').value || fileName).trim(),
      tagline: ($('inputRenderEngine').value || `${type.toUpperCase()} preview`).trim(),
      [type === 'video' ? 'video' : 'url']: `${folder}/${fileName}`,
      metrics: {
        timeShort: ($('inputGenTime').value || '—').trim(),
        tokensShort: ($('inputTokens').value || '—').trim(),
        costShort: ($('inputCost').value || '—').trim()
      },
      specs: {
        generationTime: ($('inputGenTime').value || '未记录').trim(),
        tokenUsage: ($('inputTokens').value || '未记录').trim(),
        cost: ($('inputCost').value || '未记录').trim(),
        duration: type === 'video' ? (meta.duration ? `${meta.duration.toFixed(2)}s` : '—') : '交互 / 静态',
        resolution: type === 'video' && meta.width ? `${meta.width} × ${meta.height}` : type.toUpperCase(),
        fileSize: sizeMiB,
        renderEngine: ($('inputRenderEngine').value || type.toUpperCase()).trim(),
        audioEngine: type === 'video' ? 'Embedded Audio' : '—'
      }
    };
  }

  function bindEvents() {
    $('playAllBtn').addEventListener('click', playAllVideos);
    $('pauseAllBtn').addEventListener('click', pauseAllVideos);
    $('resetAllBtn').addEventListener('click', resetAllVideos);
    $('launchAllHtmlBtn').addEventListener('click', launchAllHtml);
    $('sleepAllHtmlBtn').addEventListener('click', sleepAllHtml);

    $('copyPromptBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($('promptText').textContent);
        const btn = $('copyPromptBtn');
        btn.textContent = I18N[state.lang].copied;
        setTimeout(() => {
          btn.textContent = I18N[state.lang].copyPrompt;
        }, 1600);
      } catch (_) {}
    });

    $('langToggleBtn').addEventListener('click', () => {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      applyI18n();
    });

    const modal = $('addModal');
    const closeModal = () => {
      modal.hidden = true;
    };
    $('openAddModalBtn').addEventListener('click', () => {
      modal.hidden = false;
    });
    $('closeAddModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const handleFile = (file) => {
      if (!file) return;
      state.selectedFile = file;
      state.selectedMeta = null;
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.html') || lower.endsWith('.htm')) state.selectedType = 'html';
      else if (lower.endsWith('.svg')) state.selectedType = 'svg';
      else state.selectedType = 'video';

      $('selectedFileName').textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MiB · ${state.selectedType.toUpperCase()})`;
      if (!$('inputModelName').value.trim()) {
        $('inputModelName').value = file.name.replace(/\.[^.]+$/, '');
      }

      if (state.selectedType === 'video') {
        const probe = document.createElement('video');
        probe.preload = 'metadata';
        const url = URL.createObjectURL(file);
        probe.src = url;
        probe.addEventListener(
          'loadedmetadata',
          () => {
            state.selectedMeta = {
              duration: probe.duration,
              width: probe.videoWidth,
              height: probe.videoHeight
            };
            URL.revokeObjectURL(url);
          },
          { once: true }
        );
      }
    };

    $('localMediaFile').addEventListener('change', (e) => handleFile(e.target.files[0]));

    const dz = $('dropZone');
    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('dragover');
    });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    $('generateJsonBtn').addEventListener('click', () => {
      const entry = buildJsonEntryFromForm();
      $('jsonOutputPre').textContent = JSON.stringify(entry, null, 2);
      $('jsonOutputWrap').hidden = false;
    });

    $('copyJsonBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($('jsonOutputPre').textContent);
        $('copyJsonBtn').textContent = I18N[state.lang].copied;
        setTimeout(() => ($('copyJsonBtn').textContent = I18N[state.lang].copy), 1500);
      } catch (_) {}
    });

    $('addModelForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.selectedFile) {
        $('selectedFileName').textContent =
          state.lang === 'zh' ? '⚠ 请先选择一个本地视频 / HTML / SVG 文件' : '⚠ Please select a file first';
        return;
      }

      const entry = buildJsonEntryFromForm();
      entry.id = `${entry.id}-${Date.now().toString(36)}`;
      const blobUrl = URL.createObjectURL(state.selectedFile);
      if (entry.type === 'video') entry.video = blobUrl;
      else entry.url = blobUrl;
      if (entry.type === 'html') state.activeHtmlIds.add(entry.id);

      state.models.push(entry);
      state.activeCategory = entry.type;

      renderBenchmarkTabs();
      renderCategoryBar();
      updatePromptNote();
      renderCards();
      renderSpecTable();

      closeModal();
      $('addModelForm').reset();
      $('selectedFileName').textContent = '支持 .mp4 / .webm / .html / .svg（视频建议 < 25 MB）';
      state.selectedFile = null;
      state.selectedMeta = null;
    });

    window.addEventListener('hashchange', () => {
      const raw = window.location.hash.replace(/^#/, '');
      const [benchId, catId] = raw.split('/');
      if (benchId && state.benchmarks.some((b) => b.id === benchId)) {
        switchBenchmark(benchId, catId || null, false);
      }
    });
  }

  async function init() {
    try {
      const resp = await fetch('models.json', { cache: 'no-store' });
      const data = await resp.json();

      if (Array.isArray(data.benchmarks) && data.benchmarks.length) {
        state.benchmarks = data.benchmarks;
      } else {
        state.benchmarks = [
          {
            id: 'default',
            tabTitle: (data.arena && data.arena.title) || 'Benchmark',
            ...(data.arena || {}),
            models: Array.isArray(data.models) ? data.models : []
          }
        ];
      }

      const rawHash = window.location.hash.replace(/^#/, '');
      const [hashBench, hashCat] = rawHash.split('/');
      const initialId =
        (hashBench && state.benchmarks.some((b) => b.id === hashBench) && hashBench) ||
        data.defaultBenchmarkId ||
        state.benchmarks[0].id;

      bindEvents();
      switchBenchmark(initialId, hashCat || null, false);
    } catch (err) {
      document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#f3efe6">Failed to load models.json: ${escapeHtml(err.message)}</div>`;
    }
  }

  init();
})();
