function escapeHtml(value) {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtTs(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function renderSubmissionRows(submissions) {
  if (submissions.length === 0) {
    return '<p class="empty">No submissions yet.</p>'
  }

  return submissions
    .map((submission) => {
      const major = escapeHtml(submission.major) || '<span class="dim">-</span>'
      const questions = escapeHtml(submission.questions) || '<span class="dim">-</span>'
      const contact = escapeHtml(submission.contact) || '<span class="dim">-</span>'

      return `
      <article class="entry">
        <header>
          <span class="ts">${escapeHtml(fmtTs(submission.ts))}</span>
          <span class="id">${escapeHtml(submission.id)}</span>
        </header>
        <dl>
          <dt>Major</dt><dd>${major}</dd>
          <dt>Questions</dt><dd class="multiline">${questions}</dd>
          <dt>Contact</dt><dd>${contact}</dd>
          <dt class="meta">UA</dt><dd class="meta">${escapeHtml(submission.ua || '')}</dd>
          <dt class="meta">IP</dt><dd class="meta">${escapeHtml(submission.ip || '')}</dd>
        </dl>
      </article>`
    })
    .join('\n')
}

export function renderPrivateDashboard(submissions) {
  const orderedSubmissions = submissions.sort((a, b) => (a.ts < b.ts ? 1 : -1))
  const submissionRows = renderSubmissionRows(orderedSubmissions)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <title>Private - Foreman Control</title>
  <style>
    :root {
      --bg: #07090b;
      --rail: #0d1418;
      --panel: #111b20;
      --panel-strong: #16242b;
      --line: #2d4650;
      --line-hot: #5fc7d6;
      --text: #f4ecd7;
      --muted: #9ba99f;
      --amber: #ffb000;
      --cyan: #63d2ff;
      --green: #65d68a;
      --red: #ff667a;
      --ink: #050607;
      --shadow: rgba(0, 0, 0, 0.45);
    }

    * {
      box-sizing: border-box;
    }

    html {
      background: var(--bg);
    }

    body {
      min-height: 100vh;
      margin: 0;
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(99, 210, 255, 0.05), transparent 320px),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.018), rgba(255,255,255,0.018) 1px, transparent 1px, transparent 4px),
        var(--bg);
      font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      line-height: 1.5;
      padding: 18px 14px 56px;
    }

    button,
    input,
    textarea,
    select {
      font: inherit;
    }

    button {
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--text);
      background: #0b1216;
      cursor: pointer;
      transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;
    }

    button:hover {
      border-color: var(--line-hot);
      background: #122229;
    }

    button:active {
      transform: translateY(1px);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .shell {
      width: min(1180px, 100%);
      margin: 0 auto;
    }

    .topbar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: end;
      padding: 8px 0 18px;
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: clamp(24px, 5vw, 42px);
      line-height: 1;
      letter-spacing: 0;
      color: var(--text);
      text-shadow: 0 0 24px rgba(99, 210, 255, 0.24);
    }

    .sub {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
    }

    .status-pill {
      min-width: 190px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: #0a1013;
      text-align: center;
      font-size: 12px;
    }

    .status-pill[data-kind="ok"] {
      color: var(--green);
      border-color: rgba(101, 214, 138, 0.5);
    }

    .status-pill[data-kind="warn"] {
      color: var(--amber);
      border-color: rgba(255, 176, 0, 0.5);
    }

    .status-pill[data-kind="error"] {
      color: var(--red);
      border-color: rgba(255, 102, 122, 0.55);
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin: 18px 0;
      overflow-x: auto;
    }

    .tab {
      padding: 8px 14px;
      white-space: nowrap;
    }

    .tab[aria-selected="true"] {
      color: var(--ink);
      background: var(--cyan);
      border-color: var(--cyan);
    }

    .tab-panel[hidden] {
      display: none;
    }

    .console-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
      gap: 14px;
      align-items: start;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(17, 27, 32, 0.92);
      box-shadow: 0 16px 36px var(--shadow);
      overflow: hidden;
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-strong);
    }

    .panel-head h2 {
      margin: 0;
      font-size: 13px;
      letter-spacing: 0;
      color: var(--cyan);
    }

    .panel-body {
      padding: 14px;
    }

    .field {
      display: grid;
      gap: 6px;
      margin-bottom: 12px;
    }

    label,
    .label {
      color: var(--muted);
      font-size: 12px;
    }

    textarea,
    input,
    select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--text);
      background: #081014;
      outline: none;
      padding: 10px 11px;
    }

    textarea {
      min-height: 176px;
      resize: vertical;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 0 2px rgba(99, 210, 255, 0.12);
    }

    .inline-row {
      display: grid;
      grid-template-columns: 1fr 100px;
      gap: 10px;
    }

    .switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 0 4px;
    }

    .switch-row input {
      width: 20px;
      height: 20px;
      accent-color: var(--cyan);
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .primary {
      color: var(--ink);
      border-color: var(--cyan);
      background: var(--cyan);
      min-width: 112px;
      font-weight: 700;
    }

    .primary:hover {
      border-color: #a6edff;
      background: #a6edff;
    }

    .success {
      color: var(--ink);
      border-color: var(--green);
      background: var(--green);
      font-weight: 700;
    }

    .danger {
      color: var(--text);
      border-color: rgba(255, 102, 122, 0.65);
      background: rgba(255, 102, 122, 0.12);
    }

    .ghost {
      color: var(--muted);
      background: transparent;
    }

    .wide {
      width: 100%;
    }

    .result {
      margin-top: 12px;
      padding: 12px;
      border: 1px solid rgba(99, 210, 255, 0.25);
      border-radius: 6px;
      background: #081014;
      min-height: 88px;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      color: #d6f6ff;
      font-size: 12px;
    }

    .mission-toolbar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }

    .mission-list {
      display: grid;
      gap: 10px;
    }

    .mission-card,
    .log-entry,
    .entry {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(8, 16, 20, 0.72);
    }

    .mission-card {
      padding: 12px;
    }

    .mission-top {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: start;
    }

    .mission-title {
      margin: 0 0 4px;
      font-size: 15px;
      color: var(--text);
    }

    .mission-id {
      color: var(--muted);
      font-size: 11px;
      word-break: break-all;
    }

    .badge {
      justify-self: end;
      padding: 3px 8px;
      border-radius: 999px;
      color: var(--amber);
      border: 1px solid rgba(255, 176, 0, 0.45);
      font-size: 11px;
      white-space: nowrap;
    }

    .awaiting {
      margin-top: 10px;
      padding: 10px;
      border: 1px solid rgba(255, 176, 0, 0.35);
      border-radius: 6px;
      background: rgba(255, 176, 0, 0.06);
    }

    .awaiting strong {
      display: block;
      margin-bottom: 4px;
      color: var(--amber);
      font-size: 12px;
    }

    .awaiting p {
      margin: 0 0 8px;
      color: var(--text);
      font-size: 12px;
      white-space: pre-wrap;
    }

    .mission-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 10px;
    }

    .mini {
      min-height: 32px;
      padding: 4px 9px;
      font-size: 12px;
    }

    .event-log {
      display: grid;
      gap: 8px;
      max-height: 520px;
      overflow: auto;
    }

    .log-entry {
      padding: 10px;
    }

    .log-entry strong {
      display: block;
      margin-bottom: 5px;
      color: var(--cyan);
      font-size: 12px;
    }

    .decision-box {
      display: grid;
      gap: 10px;
    }

    .empty {
      margin: 0;
      padding: 30px 14px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      text-align: center;
      background: rgba(8, 16, 20, 0.5);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }

    .actions a,
    .mission-link {
      color: var(--cyan);
      text-decoration: none;
      border-bottom: 1px solid rgba(99, 210, 255, 0.35);
    }

    .actions a:hover,
    .mission-link:hover {
      border-bottom-color: var(--cyan);
    }

    .entry {
      padding: 14px;
      margin-bottom: 10px;
    }

    .entry header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 7px;
      margin-bottom: 8px;
      border-bottom: 1px dashed var(--line);
      color: var(--muted);
      font-size: 12px;
      word-break: break-word;
    }

    .ts {
      color: var(--amber);
    }

    dl {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 4px 12px;
      margin: 0;
      font-size: 14px;
    }

    dt {
      color: var(--muted);
    }

    dd {
      margin: 0;
      word-break: break-word;
    }

    dd.multiline {
      white-space: pre-wrap;
    }

    .dim,
    .meta {
      color: var(--muted);
      opacity: 0.7;
    }

    .meta {
      font-size: 11px;
    }

    .mobile-stack {
      display: contents;
    }

    @media (max-width: 900px) {
      .topbar,
      .console-grid,
      .inline-row,
      .mission-toolbar,
      .mission-top {
        grid-template-columns: 1fr;
      }

      .status-pill,
      .badge {
        justify-self: start;
      }
    }

    @media (max-width: 560px) {
      body {
        padding: 12px 10px 42px;
      }

      .panel-head {
        align-items: flex-start;
        flex-direction: column;
      }

      dl {
        grid-template-columns: 1fr;
      }

      dt {
        margin-top: 6px;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div>
        <h1>FOREMAN CONTROL</h1>
        <p class="sub">private console / bearer hidden / phone loop online</p>
      </div>
      <div id="top-status" class="status-pill" data-kind="warn">checking config</div>
    </header>

    <nav class="tabs" role="tablist" aria-label="Private tools">
      <button class="tab" data-tab="foreman" role="tab" aria-selected="true">Foreman</button>
      <button class="tab" data-tab="flyers" role="tab" aria-selected="false">Flyers (${orderedSubmissions.length})</button>
    </nav>

    <section id="tab-foreman" class="tab-panel">
      <div class="console-grid">
        <section class="panel">
          <div class="panel-head">
            <h2>NEW MISSION</h2>
            <button id="refresh-missions" class="ghost mini" type="button">Refresh</button>
          </div>
          <div class="panel-body">
            <form id="mission-form">
              <div class="field">
                <label for="spec">Task</label>
                <textarea id="spec" name="spec_markdown" autocomplete="off" spellcheck="true" placeholder="Build the thing, verify it, and send me the preview."></textarea>
              </div>
              <div class="inline-row">
                <div class="field">
                  <label for="repo">Repo</label>
                  <input id="repo" name="repo_hint" autocomplete="off" placeholder="/mnt/c/Projects/Anima" />
                </div>
                <div class="field">
                  <label for="priority">Priority</label>
                  <input id="priority" name="priority" type="number" min="0" max="9" value="0" />
                </div>
              </div>
              <div class="switch-row">
                <span class="label">Auto confirm in-budget plans</span>
                <input id="auto-confirm" name="auto_confirm" type="checkbox" checked />
              </div>
              <div class="button-row">
                <button id="submit-mission" class="primary" type="submit">Run</button>
                <button id="clear-spec" class="ghost" type="button">Clear</button>
              </div>
            </form>

            <div class="result" aria-live="polite">
              <pre id="latest-result">Ready.</pre>
              <div id="result-actions" class="button-row"></div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>DECISION COCKPIT</h2>
            <span id="selected-kind" class="label">none selected</span>
          </div>
          <div class="panel-body decision-box">
            <div class="field">
              <label for="decision-id">Decision id</label>
              <input id="decision-id" autocomplete="off" placeholder="dec_..." />
            </div>
            <div class="field">
              <label for="steer-text">Steer</label>
              <textarea id="steer-text" rows="4" placeholder="Make it more focused on surprising research observations."></textarea>
            </div>
            <div class="button-row">
              <button class="success" data-decision-answer="ship" type="button">Ship</button>
              <button data-decision-answer="confirm" type="button">Confirm</button>
              <button class="danger" data-decision-answer="reject" type="button">Reject</button>
              <button class="primary" data-decision-answer="steer" type="button">Steer</button>
            </div>
          </div>
        </section>
      </div>

      <div class="console-grid" style="margin-top:14px;">
        <section class="panel">
          <div class="panel-head">
            <h2>MISSION WALL</h2>
            <div class="mission-toolbar">
              <select id="mission-filter" aria-label="Mission filter">
                <option value="all">All</option>
                <option value="awaiting">Awaiting</option>
              </select>
              <button id="manual-refresh" class="mini" type="button">Sync</button>
            </div>
          </div>
          <div class="panel-body">
            <div id="mission-list" class="mission-list" aria-live="polite">
              <p class="empty">Loading missions...</p>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>EVENT LOG</h2>
            <button id="clear-log" class="ghost mini" type="button">Clear</button>
          </div>
          <div class="panel-body">
            <div id="event-log" class="event-log" aria-live="polite"></div>
          </div>
        </section>
      </div>
    </section>

    <section id="tab-flyers" class="tab-panel" hidden>
      <section class="panel">
        <div class="panel-head">
          <h2>FLYER SUBMISSIONS</h2>
          <span class="label">${orderedSubmissions.length} total</span>
        </div>
        <div class="panel-body">
          <div class="actions">
            <a href="/private/data.json">raw JSON</a>
            <a href="/private/data.csv">csv</a>
            <a href="/">site</a>
          </div>
          ${submissionRows}
        </div>
      </section>
    </section>
  </main>

  <script>
    (function () {
      var storageKey = 'foreman-private-console-v1';
      var logKey = 'foreman-private-console-log-v1';
      var selectedDecision = null;
      var missions = [];
      var foremanConfigured = false;

      var els = {
        topStatus: document.getElementById('top-status'),
        spec: document.getElementById('spec'),
        repo: document.getElementById('repo'),
        priority: document.getElementById('priority'),
        autoConfirm: document.getElementById('auto-confirm'),
        latestResult: document.getElementById('latest-result'),
        resultActions: document.getElementById('result-actions'),
        missionForm: document.getElementById('mission-form'),
        submitMission: document.getElementById('submit-mission'),
        missionList: document.getElementById('mission-list'),
        missionFilter: document.getElementById('mission-filter'),
        decisionId: document.getElementById('decision-id'),
        steerText: document.getElementById('steer-text'),
        selectedKind: document.getElementById('selected-kind'),
        eventLog: document.getElementById('event-log')
      };

      function readJson(key, fallback) {
        try {
          var raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (_err) {
          return fallback;
        }
      }

      function writeJson(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (_err) {
        }
      }

      function setStatus(kind, text) {
        els.topStatus.dataset.kind = kind;
        els.topStatus.textContent = text;
      }

      function stringify(value) {
        if (typeof value === 'string') return value;
        try {
          return JSON.stringify(value, null, 2);
        } catch (_err) {
          return String(value);
        }
      }

      function savePrefs() {
        writeJson(storageKey, {
          repo: els.repo.value,
          priority: els.priority.value,
          autoConfirm: els.autoConfirm.checked,
          tab: document.querySelector('.tab[aria-selected="true"]')?.dataset.tab || 'foreman'
        });
      }

      function addLog(title, body, kind) {
        var logs = readJson(logKey, []);
        logs.unshift({
          title: title,
          body: body,
          kind: kind || 'ok',
          at: new Date().toLocaleTimeString()
        });
        writeJson(logKey, logs.slice(0, 10));
        renderLog();
      }

      function renderLog() {
        var logs = readJson(logKey, []);
        els.eventLog.innerHTML = '';
        if (!logs.length) {
          var empty = document.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'No events yet.';
          els.eventLog.appendChild(empty);
          return;
        }
        logs.forEach(function (log) {
          var entry = document.createElement('article');
          entry.className = 'log-entry';

          var title = document.createElement('strong');
          title.textContent = log.at + ' / ' + log.title;
          entry.appendChild(title);

          var body = document.createElement('pre');
          body.textContent = stringify(log.body);
          entry.appendChild(body);

          els.eventLog.appendChild(entry);
        });
      }

      async function requestJson(path, options) {
        var opts = options || {};
        var method = opts.method || 'POST';
        var url = new URL(path, window.location.origin).toString();
        var fetchOptions = {
          method: method,
          headers: {}
        };

        if (method !== 'GET') {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(opts.body || {});
        }

        var response = await fetch(url, fetchOptions);
        var text = await response.text();
        var data = text ? JSON.parse(text) : null;
        if (!response.ok) {
          var err = new Error((data && (data.message || data.error)) || response.statusText);
          err.data = data;
          throw err;
        }
        return data;
      }

      function setLatest(value) {
        els.latestResult.textContent = stringify(value);
      }

      function setBusy(isBusy) {
        els.submitMission.disabled = isBusy;
        els.submitMission.textContent = isBusy ? 'Running' : 'Run';
      }

      function buildDecisionAnswer(action, steerText) {
        if (action !== 'steer') return action;
        var cleaned = (steerText || '').trim();
        if (!cleaned) return '';
        return cleaned.toLowerCase().startsWith('steer') ? cleaned : 'steer ' + cleaned;
      }

      async function sendDecision(action, decisionId, steerText) {
        var id = (decisionId || els.decisionId.value).trim();
        var answer = buildDecisionAnswer(action, steerText || els.steerText.value);

        if (!id) {
          setStatus('warn', 'decision id needed');
          return;
        }

        if (!answer) {
          setStatus('warn', action === 'steer' ? 'steer text needed' : 'answer needed');
          return;
        }

        setStatus('warn', 'sending decision');
        try {
          var data = await requestJson('/private/foreman/decide', {
            body: {
              decision_id: id,
              answer: answer
            }
          });
          setStatus('ok', 'decision sent');
          setLatest(data);
          addLog('Decision sent', { decision_id: id, answer: answer, result: data }, 'ok');
          refreshMissions();
        } catch (err) {
          setStatus('error', 'decision failed');
          setLatest(err.data || err.message);
          addLog('Decision failed', err.data || err.message, 'error');
        }
      }

      function selectDecision(awaiting) {
        selectedDecision = awaiting || null;
        els.decisionId.value = awaiting?.decision_id || '';
        els.selectedKind.textContent = awaiting ? awaiting.kind + ' selected' : 'none selected';
        if (awaiting?.prompt) {
          els.steerText.value = awaiting.prompt.slice(0, 600);
        }
      }

      function createButton(label, className, onClick) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = className || 'mini';
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
      }

      function defaultActionsFor(awaiting) {
        if (!awaiting) return [];
        if (Array.isArray(awaiting.options) && awaiting.options.length) {
          return awaiting.options;
        }
        if (awaiting.kind === 'review') return ['ship', 'steer', 'reject'];
        if (awaiting.kind === 'question') return ['confirm', 'reject'];
        return ['confirm', 'reject'];
      }

      function renderMissionCard(mission) {
        var card = document.createElement('article');
        card.className = 'mission-card';

        var top = document.createElement('div');
        top.className = 'mission-top';

        var heading = document.createElement('div');
        var title = document.createElement('h3');
        title.className = 'mission-title';
        title.textContent = mission.title || '(untitled mission)';
        heading.appendChild(title);

        var id = document.createElement('div');
        id.className = 'mission-id';
        id.textContent = mission.id || '';
        heading.appendChild(id);
        top.appendChild(heading);

        var badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = mission.status || 'unknown';
        top.appendChild(badge);
        card.appendChild(top);

        var actions = document.createElement('div');
        actions.className = 'mission-actions';

        if (mission.demo_url) {
          var link = document.createElement('a');
          link.className = 'mission-link mini';
          link.href = mission.demo_url;
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = 'Demo';
          actions.appendChild(link);
        }

        actions.appendChild(createButton('Details', 'mini', function () {
          getDemo(mission.id);
        }));

        card.appendChild(actions);

        if (mission.awaiting) {
          var awaiting = document.createElement('div');
          awaiting.className = 'awaiting';

          var promptTitle = document.createElement('strong');
          promptTitle.textContent = mission.awaiting.kind + ' / ' + mission.awaiting.decision_id;
          awaiting.appendChild(promptTitle);

          var prompt = document.createElement('p');
          prompt.textContent = mission.awaiting.prompt || '';
          awaiting.appendChild(prompt);

          var decisionActions = document.createElement('div');
          decisionActions.className = 'mission-actions';
          decisionActions.appendChild(createButton('Focus', 'mini', function () {
            selectDecision(mission.awaiting);
          }));

          defaultActionsFor(mission.awaiting).forEach(function (action) {
            var normalized = String(action || '').trim();
            if (!normalized) return;
            if (normalized === 'steer') {
              decisionActions.appendChild(createButton('Steer', 'mini primary', function () {
                selectDecision(mission.awaiting);
                sendDecision('steer', mission.awaiting.decision_id, els.steerText.value);
              }));
              return;
            }
            decisionActions.appendChild(createButton(normalized, normalized === 'reject' ? 'mini danger' : 'mini', function () {
              selectDecision(mission.awaiting);
              sendDecision(normalized, mission.awaiting.decision_id, '');
            }));
          });

          awaiting.appendChild(decisionActions);
          card.appendChild(awaiting);
        }

        return card;
      }

      function renderMissions() {
        els.missionList.innerHTML = '';
        if (!missions.length) {
          var empty = document.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'No missions found.';
          els.missionList.appendChild(empty);
          return;
        }

        missions.forEach(function (mission) {
          els.missionList.appendChild(renderMissionCard(mission));
        });
      }

      async function refreshMissions() {
        if (!foremanConfigured) {
          missions = [];
          els.missionList.innerHTML = '';
          var notConfigured = document.createElement('p');
          notConfigured.className = 'empty';
          notConfigured.textContent = 'Set FOREMAN_MCP_TOKEN on the website server.';
          els.missionList.appendChild(notConfigured);
          setStatus('warn', 'token needed');
          return;
        }

        setStatus('warn', 'syncing missions');
        try {
          var filter = {};
          if (els.missionFilter.value === 'awaiting') {
            filter.awaiting_only = true;
          }
          var data = await requestJson('/private/foreman/list', {
            body: Object.keys(filter).length ? { filter: filter } : {}
          });
          missions = Array.isArray(data) ? data : [];
          renderMissions();
          setStatus('ok', missions.length + ' missions');
        } catch (err) {
          missions = [];
          renderMissions();
          setStatus('error', 'sync failed');
          setLatest(err.data || err.message);
          addLog('Mission sync failed', err.data || err.message, 'error');
        }
      }

      async function getDemo(missionId) {
        if (!missionId) return;
        setStatus('warn', 'loading demo');
        try {
          var data = await requestJson('/private/foreman/demo/' + encodeURIComponent(missionId), {
            method: 'GET'
          });
          setStatus('ok', 'demo loaded');
          setLatest(data);
          addLog('Demo details', data, 'ok');
        } catch (err) {
          setStatus('error', 'demo failed');
          setLatest(err.data || err.message);
          addLog('Demo details failed', err.data || err.message, 'error');
        }
      }

      async function loadConfig() {
        try {
          var data = await requestJson('/private/foreman/config', {
            method: 'GET'
          });
          foremanConfigured = Boolean(data.configured);
          if (!els.repo.value) {
            els.repo.value = data.defaultRepoHint || '';
          }
          setStatus(foremanConfigured ? 'ok' : 'warn', foremanConfigured ? 'configured' : 'token needed');
          if (!foremanConfigured) {
            setLatest(data);
          }
        } catch (err) {
          foremanConfigured = false;
          setStatus('error', 'config failed');
          setLatest(err.data || err.message);
        }
      }

      function selectTab(tabName) {
        document.querySelectorAll('.tab').forEach(function (tab) {
          var selected = tab.dataset.tab === tabName;
          tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.hidden = panel.id !== 'tab-' + tabName;
        });
        savePrefs();
      }

      els.missionForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var spec = els.spec.value.trim();
        if (!spec) {
          setStatus('warn', 'task needed');
          return;
        }

        setBusy(true);
        setStatus('warn', 'submitting mission');
        els.resultActions.innerHTML = '';
        savePrefs();

        try {
          var data = await requestJson('/private/foreman/submit', {
            body: {
              spec_markdown: spec,
              repo_hint: els.repo.value.trim(),
              priority: Number(els.priority.value || 0),
              auto_confirm: els.autoConfirm.checked
            }
          });

          setStatus('ok', data.auto_confirmed ? 'mission running' : 'plan pending');
          setLatest(data);
          addLog('Mission submitted', data, 'ok');

          if (data.plan_decision_id) {
            selectDecision({
              decision_id: data.plan_decision_id,
              kind: 'plan',
              prompt: data.plan_shape?.summary_text || '',
              options: ['confirm', 'reject']
            });

            if (!data.auto_confirmed) {
              els.resultActions.appendChild(createButton('Confirm plan', 'success', function () {
                sendDecision('confirm', data.plan_decision_id, '');
              }));
            }
          }
          refreshMissions();
        } catch (err) {
          setStatus('error', 'submit failed');
          setLatest(err.data || err.message);
          addLog('Mission submit failed', err.data || err.message, 'error');
        } finally {
          setBusy(false);
        }
      });

      document.getElementById('clear-spec').addEventListener('click', function () {
        els.spec.value = '';
        els.spec.focus();
      });

      document.getElementById('refresh-missions').addEventListener('click', refreshMissions);
      document.getElementById('manual-refresh').addEventListener('click', refreshMissions);
      els.missionFilter.addEventListener('change', refreshMissions);
      document.getElementById('clear-log').addEventListener('click', function () {
        writeJson(logKey, []);
        renderLog();
      });

      document.querySelectorAll('[data-decision-answer]').forEach(function (button) {
        button.addEventListener('click', function () {
          sendDecision(button.dataset.decisionAnswer, '', '');
        });
      });

      document.querySelectorAll('.tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          selectTab(tab.dataset.tab);
        });
      });

      ['repo', 'priority', 'autoConfirm'].forEach(function (key) {
        els[key].addEventListener('change', savePrefs);
      });

      var prefs = readJson(storageKey, {});
      if (prefs.repo) els.repo.value = prefs.repo;
      if (prefs.priority) els.priority.value = prefs.priority;
      if (typeof prefs.autoConfirm === 'boolean') els.autoConfirm.checked = prefs.autoConfirm;
      selectTab(prefs.tab || 'foreman');
      renderLog();
      loadConfig().then(function () {
        refreshMissions();
      });
      setInterval(function () {
        if (foremanConfigured) refreshMissions();
      }, 20000);
    })();
  </script>
</body>
</html>`
}
