const STORE_KEY = "simple-rich-learning-v1";
const APP_VERSION = "2026-06-16.3";
let deferredInstallPrompt = null;
let onlineInsights = [];
let supabaseClient = null;
let currentUser = null;
let cloudSaveTimer = null;

const actions = [
  {
    title: "学一个词 5 分钟",
    detail: "只学一个你不懂的词，然后用自己的话写一句解释。",
    examples: [
      "我是一个每天愿意学一点的人，所以我今天学会了 AI 是电脑帮人处理信息的工具。",
      "我是一个开始懂钱的人，所以我今天学会了现金流就是钱进来和钱出去的节奏。",
      "我是一个会让生活变轻松的人，所以我今天学会了自动化就是让电脑帮我重复做一件事。"
    ]
  },
  {
    title: "写一句富有身份",
    detail: "例：我是一个每天用小行动慢慢变富有的人。",
    examples: [
      "我是一个会保护稳定收入，也会慢慢创造新机会的人。",
      "我是一个每天都在累积财富能力的人。",
      "我是一个健康、清醒、会学习、会创造价值的人。"
    ]
  },
  {
    title: "观察一个别人为什么付钱",
    detail: "想一个你今天看到的消费：它是在买方便、时间、安全、健康，还是快乐？",
    examples: [
      "我是一个开始看懂商业的人，所以我发现人们买外卖，也是在买省时间。",
      "我是一个懂得价值交换的人，所以我发现健身课卖的是健康、陪伴和被监督。",
      "我是一个理解高端服务的人，所以我发现商务舱卖的是休息、身份、效率和舒服。"
    ]
  },
  {
    title: "问一个真实问题",
    detail: "问自己或别人：最近有什么事情很重复、很烦、但又不得不做？",
    examples: [
      "我是一个会观察真实需求的人，所以我问了朋友：你工作里最重复的事情是什么？",
      "我是一个越来越清醒的人，所以我发现自己最烦的是整理资料和做决定。",
      "我是一个寻找机会的人，所以我问了同事：如果有工具帮你省 1 小时，你希望它做什么？"
    ]
  },
  {
    title: "整理一笔钱",
    detail: "记录今天一笔收入、支出、储蓄或想买的东西。只写一句。",
    examples: [
      "我是一个会管理钱的人，所以我今天记录了一笔午餐支出。",
      "我是一个不被冲动控制的人，所以我今天把想买的东西延迟 24 小时再决定。",
      "我是一个重视自由的人，所以我今天确认了这个月可以存下多少钱。"
    ]
  },
  {
    title: "冥想 5 分钟",
    detail: "闭眼呼吸。结束后写一句：我今天可以先做好哪一件小事？",
    examples: [
      "我是一个能安静下来的人，所以我冥想 5 分钟后决定先学一个词。",
      "我是一个愿意理解自己的人，所以我发现我不是懒，我只是被目标吓到了。",
      "我是一个不逃避的人，所以我今天先让自己安静下来。"
    ]
  }
];

const extraExamples = [
  "我是一个开始看懂钱的人，所以我发现别人付钱通常是在买省时间、省麻烦、被照顾、变健康或变安全。",
  "我是一个慢慢变富有的人，所以我知道富有不是突然发生，是每天多一个能复用的小能力。",
  "我是一个温柔但持续的人，所以我今天没有逼自己变厉害，只是让自己继续了一下。",
  "我是一个理解高端生活的人，所以我观察到商务舱卖的不是座位，是休息、效率和被尊重。",
  "我是一个寻找机会的人，所以我想到如果我能帮人少做一件重复的事，这可能就是机会。",
  "我是一个会学习的人，所以我今天学会了一个词，并能用普通话解释它。",
  "我是一个不逃跑的人，所以我今天把一个大目标缩小成 5 分钟动作。",
  "我是一个让钱变清楚的人，所以我今天记录了一笔钱。",
  "我是一个尊重真实需求的人，所以我今天问了一个真实问题。",
  "我是一个保护注意力的人，所以我今天练习了专注，没有让手机拿走我的注意力。"
];

const richLifeIdentities = [
  "有选择权的人",
  "会保护注意力的人",
  "重视身体的人",
  "专注创造的人",
  "自由旅行的人",
  "慷慨的人",
  "有空间的人",
  "不被小钱困住的人",
  "能说不的人",
  "真正富有的人"
];

const richLifeFreedoms = [
  "不用把最好的精力交给洗衣、扫地、洗碗和做饭这些重复琐事",
  "可以把清洁、维修、预约、整理这些低价值事务交给服务或系统",
  "有时间健身、瑜伽、冥想、睡好觉，而不是永远赶时间",
  "可以把上午最清醒的时间留给学习、思考、创造和重要决定",
  "旅行时可以选择舒服的航班、可靠的酒店、好的向导和更少折腾",
  "有能力照顾家人、支持教育、捐钱，也不因为钱委屈价值观",
  "家里有书、干净桌面、安静角落和让心稳定下来的秩序",
  "买健康食物、课程、工具和帮助时，更在意长期价值",
  "可以拒绝消耗自己的关系、请求、工作和安排",
  "让钱服务于自由、健康、爱、学习、创造和贡献"
];

const fallbackKeyPoints = [
  {
    text: "Atomic Habits：不要靠意志力，先把动作小到不可能失败。",
    url: "https://jamesclear.com/atomic-habits"
  },
  {
    text: "七个习惯：以终为始。先想清楚你想过什么生活，再安排今天。",
    url: "https://www.franklincovey.com/the-7-habits/"
  },
  {
    text: "刻意练习：不要只是看内容，要练一个具体动作，并得到反馈。",
    url: "https://www.peakthebook.com/"
  },
  {
    text: "Manifestation：想象未来很好，但必须接一句行动证据。",
    url: "https://jamesclear.com/identity-based-habits"
  },
  {
    text: "金钱心理学：财富是你没花掉、保留下来、能给你选择权的钱。",
    url: "https://www.morganhousel.com/books"
  },
  {
    text: "AI 常识：AI 是放大器。你越清楚自己要什么，它越有用。",
    url: "https://help.openai.com/en/articles/6783457-chatgpt-general-faq"
  }
];

const growthFramework = [
  {
    title: "1. AI 入门",
    why: "先知道 AI 能做什么：总结、分类、写草稿、整理表格、生成计划。",
    action: "今天只问 ChatGPT 一个问题：帮我解释一个我不懂的词。",
    links: [
      ["ChatGPT FAQ", "https://help.openai.com/en/articles/6783457-chatgpt-general-faq"],
      ["OpenAI Docs", "https://platform.openai.com/docs/"]
    ]
  },
  {
    title: "2. AI/Tech YouTube",
    why: "不用一次看懂。只培养语感，慢慢听懂 AI 世界在说什么。",
    action: "今天只看 10 分钟，写一句：这个视频在解决什么问题？",
    links: [
      ["OpenAI", "https://www.youtube.com/@OpenAI"],
      ["Google for Developers", "https://www.youtube.com/@GoogleDevelopers"],
      ["Andrej Karpathy", "https://www.youtube.com/@AndrejKarpathy"],
      ["freeCodeCamp", "https://www.youtube.com/@freecodecamp"]
    ]
  },
  {
    title: "3. 创业和机会感",
    why: "学习别人怎么发现问题、做产品、找客户、变成公司。",
    action: "今天只看一个项目，写：它帮谁解决什么痛？",
    links: [
      ["Y Combinator Startup School", "https://www.startupschool.org/"],
      ["YC Library", "https://www.ycombinator.com/library"],
      ["GitHub Topics AI", "https://github.com/topics/artificial-intelligence"],
      ["GitHub Trending", "https://github.com/trending"],
      ["Hugging Face Models", "https://huggingface.co/models"]
    ]
  },
  {
    title: "4. 练习和作品提交",
    why: "未来你可以把小作品放出去，得到反馈，而不是永远自己想。",
    action: "今天只打开一个平台，看看别人提交了什么。",
    links: [
      ["Kaggle Competitions", "https://www.kaggle.com/competitions"],
      ["Hugging Face Spaces", "https://huggingface.co/spaces"],
      ["GitHub New Repository", "https://github.com/new"],
      ["YC Apply", "https://www.ycombinator.com/apply"]
    ]
  },
  {
    title: "5. Conference / 大趋势",
    why: "不用参加也可以看 keynote。你会知道 AI 和科技的钱往哪里流。",
    action: "今天只看一个官网，写：今年大家在关注什么？",
    links: [
      ["OpenAI DevDay", "https://openai.com/devday/"],
      ["Google I/O", "https://io.google/"],
      ["Microsoft Build", "https://developer.microsoft.com/en-us/events/build/"],
      ["AWS re:Invent", "https://reinvent.awsevents.com/"],
      ["NVIDIA GTC", "https://www.nvidia.com/gtc/"]
    ]
  },
  {
    title: "6. 钱和人生",
    why: "钱不是炫耀；钱是选择权、时间、健康、家人、旅行和捐赠能力。",
    action: "今天只写：我想用钱换回什么自由？",
    links: [
      ["Morgan Housel", "https://www.morganhousel.com/"],
      ["James Clear", "https://jamesclear.com/articles"],
      ["Cal Newport", "https://calnewport.com/writing/"]
    ]
  }
];

function dailyOffset() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  return Math.floor(diff / 86400000);
}

function pickDailyItems(list, count, offset = 0) {
  const picked = [];
  const day = dailyOffset() + offset;
  for (let i = 0; i < Math.min(count, list.length); i += 1) {
    picked.push(list[(day + i * 3) % list.length]);
  }
  return picked;
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 120);
}

function linkedPoint(item) {
  const point = document.createElement("div");
  point.className = "example";
  const anchor = document.createElement("a");
  anchor.href = item.url;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.textContent = "打开来源";
  const title = document.createElement("strong");
  title.textContent = item.title;
  point.append(title);
  point.append(document.createElement("br"));
  point.append(`重点：${item.summary}`);
  point.append(document.createElement("br"));
  point.append(`来源：${item.source} · `);
  point.append(anchor);
  return point;
}

function fallbackPoint(item) {
  const point = document.createElement("div");
  point.className = "example";
  const anchor = document.createElement("a");
  anchor.href = item.url;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.textContent = item.text;
  point.append(anchor);
  return point;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchOnlineInsights() {
  const status = document.querySelector("#onlineStatus");
  if (status) status.textContent = "正在抓取 GitHub 和技术文章...";

  const requests = [
    fetchJson("https://dev.to/api/articles?tag=ai&per_page=12")
      .then((data) =>
        (data || []).map((article) => ({
          source: "DEV article",
          title: cleanTitle(article.title),
          summary: cleanTitle(article.description || "这是一篇 AI 相关技术文章。先判断它解决什么问题，再决定要不要深入读。"),
          url: article.url
        }))
      ),
    fetchJson("https://api.github.com/search/repositories?q=topic:ai+stars:%3E1000&sort=updated&order=desc&per_page=10")
      .then((data) =>
        (data.items || []).map((repo) => ({
          source: "GitHub repository",
          title: cleanTitle(repo.full_name),
          summary: cleanTitle(repo.description || "这个项目正在被更新。重点观察它提供什么能力、服务谁、为什么有人给 star。"),
          url: repo.html_url
        }))
      )
  ];

  const results = await Promise.allSettled(requests);
  onlineInsights = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter((item) => item.title && item.url && item.summary);

  state.onlineFetchedAt = new Date().toISOString();
  state.onlineInsights = onlineInsights.slice(0, 30);
  saveState();

  if (status) {
    status.textContent = onlineInsights.length
      ? `已更新 ${onlineInsights.length} 条网上资料。每天打开会尽量刷新；如果失败会用备用重点。`
      : "这次没有抓到网上资料，先显示备用重点。";
  }
  render();
}

const state = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function cloudConfig() {
  return window.RICH_APP_CONFIG || {};
}

function cloudConfigError() {
  const config = cloudConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return "Supabase 还没设置。请填入 Project URL 和 anon public key。";
  }

  try {
    const url = new URL(config.supabaseUrl);
    if (!url.hostname.endsWith(".supabase.co") || url.pathname !== "/") {
      return "Supabase URL 填错了。请只填 https://xxxx.supabase.co，不要包含 /rest/v1、/auth/v1、/project 或其他路径。";
    }
  } catch {
    return "Supabase URL 格式不对。它应该长得像 https://xxxx.supabase.co";
  }

  return "";
}

function cloudIsConfigured() {
  const config = cloudConfig();
  return Boolean(!cloudConfigError() && window.supabase);
}

function setCloudStatus(message) {
  const status = document.querySelector("#cloudStatus");
  if (status) status.textContent = message;
}

function currentAction() {
  return actions[Number(state.actionIndex || 0) % actions.length];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readableDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function activeOnlineInsights() {
  return onlineInsights.length ? onlineInsights : Array.isArray(state.onlineInsights) ? state.onlineInsights : [];
}

function insightIdentityExamples() {
  return pickDailyItems(activeOnlineInsights(), 4, Number(state.actionIndex || 0)).map((item) =>
    `我是一个会从网上资料提炼机会的人，所以我今天从 ${item.source} 学到：${item.summary}。我先问它服务谁、解决什么痛点。`
  );
}

function richLifeLines() {
  const insights = activeOnlineInsights();
  if (insights.length) {
    return pickDailyItems(insights, 4, 2).map((item) =>
      `我是一个把信息变成选择权的人，所以我看到「${item.title}」时，不只是看热闹，而是思考它如何节省时间、降低麻烦或创造收入。`
    );
  }

  const day = dailyOffset();
  const lines = [];
  for (let i = 0; i < 4; i += 1) {
    const identity = richLifeIdentities[(day + i * 2) % richLifeIdentities.length];
    const freedom = richLifeFreedoms[(day * 2 + i * 3) % richLifeFreedoms.length];
    lines.push(`我是一个${identity}，所以我${freedom}。`);
  }
  return lines;
}

function saveEvidenceHistory() {
  const text = String(state.evidence || "").trim();
  if (!text) return;

  const history = Array.isArray(state.history) ? state.history : [];
  const date = todayKey();
  const existing = history.find((item) => item.date === date);

  if (existing) {
    existing.text = text;
    existing.action = currentAction().title;
    existing.updatedAt = new Date().toISOString();
  } else {
    history.unshift({
      date,
      text,
      action: currentAction().title,
      updatedAt: new Date().toISOString()
    });
  }

  state.history = history.slice(0, 90);
  queueCloudSave();
}

function render() {
  const action = currentAction();
  const version = document.querySelector("#appVersion");
  if (version) version.textContent = `版本 ${APP_VERSION}`;
  document.querySelector("#todayLabel").textContent = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  });
  document.querySelector("#actionTitle").textContent = action.title;
  document.querySelector("#actionDetail").textContent = action.detail;
  document.querySelector("#doneCheck").checked = Boolean(state.done);
  document.querySelector("#evidenceText").value = state.evidence || "";
  const examples = document.querySelector("#examples");
  examples.innerHTML = "";
  const onlineIdentityExamples = insightIdentityExamples();
  const examplePool = onlineIdentityExamples.length ? onlineIdentityExamples : [...action.examples, ...extraExamples];
  const dailyExamples = pickDailyItems(examplePool, 4, Number(state.actionIndex || 0));
  dailyExamples.forEach((example) => {
    const item = document.createElement("div");
    item.className = "example";
    item.textContent = example;
    examples.append(item);
  });

  const richLifeRoot = document.querySelector("#richLife");
  richLifeRoot.innerHTML = "";
  richLifeLines().forEach((line) => {
    const item = document.createElement("div");
    item.className = "example";
    item.textContent = line;
    richLifeRoot.append(item);
  });

  const keyPointRoot = document.querySelector("#keyPoints");
  keyPointRoot.innerHTML = "";
  const liveItems = activeOnlineInsights();
  if (liveItems.length) {
    pickDailyItems(liveItems, 3).forEach((point) => keyPointRoot.append(linkedPoint(point)));
  } else {
    pickDailyItems(fallbackKeyPoints, 3).forEach((point) => keyPointRoot.append(fallbackPoint(point)));
  }

  const frameworkRoot = document.querySelector("#growthFramework");
  frameworkRoot.innerHTML = "";
  growthFramework.forEach((resource) => {
    const item = document.createElement("div");
    item.className = "resource";
    const links = resource.links
      .map(([label, url]) => `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`)
      .join("");
    item.innerHTML = `
      <strong>${resource.title}</strong>
      <span>${resource.why}</span>
      <span>${resource.action}</span>
      <div class="resource-links">${links}</div>
    `;
    frameworkRoot.append(item);
  });

  renderHistory();
}

function renderHistory() {
  const historyRoot = document.querySelector("#historyList");
  if (!historyRoot) return;
  const history = Array.isArray(state.history) ? state.history : [];
  historyRoot.innerHTML = "";

  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "history-item";
    empty.textContent = "还没有历史。今天写一句“我是...”，这里就会开始累积。";
    historyRoot.append(empty);
    return;
  }

  history.slice(0, 14).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `<span>${readableDate(entry.date)} · ${entry.action || "行动证据"}</span>${entry.text}`;
    historyRoot.append(item);
  });
}

function bindEvents() {
  document.querySelector("#doneCheck").addEventListener("change", (event) => {
    state.done = event.target.checked;
    saveState();
  });

  document.querySelector("#evidenceText").addEventListener("input", (event) => {
    state.evidence = event.target.value;
    saveEvidenceHistory();
    saveState();
    renderHistory();
  });

  document.querySelector("#nextActionBtn").addEventListener("click", () => {
    saveEvidenceHistory();
    saveState();
    state.actionIndex = (Number(state.actionIndex || 0) + 1) % actions.length;
    state.done = false;
    state.evidence = "";
    saveState();
    render();
  });

  const installBtn = document.querySelector("#installBtn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.hidden = true;
    });
  }

  const refreshOnlineBtn = document.querySelector("#refreshOnlineBtn");
  if (refreshOnlineBtn) {
    refreshOnlineBtn.addEventListener("click", () => {
      fetchOnlineInsights().catch(() => {
        const status = document.querySelector("#onlineStatus");
        if (status) status.textContent = "网上资料暂时抓不到，先用备用 key points。";
      });
    });
  }

  const exportHistoryBtn = document.querySelector("#exportHistoryBtn");
  if (exportHistoryBtn) {
    exportHistoryBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.history || [], null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rich-learning-history-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const loginBtn = document.querySelector("#loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", signInWithPassword);

  const signupBtn = document.querySelector("#signupBtn");
  if (signupBtn) signupBtn.addEventListener("click", signUpWithPassword);

  const logoutBtn = document.querySelector("#logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutCloud);

  const togglePasswordBtn = document.querySelector("#togglePasswordBtn");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const passwordInput = document.querySelector("#passwordInput");
      if (!passwordInput) return;
      const shouldShow = passwordInput.type === "password";
      passwordInput.type = shouldShow ? "text" : "password";
      togglePasswordBtn.textContent = shouldShow ? "隐藏" : "显示";
    });
  }
}

async function setupCloud() {
  const configError = cloudConfigError();
  if (configError || !window.supabase) {
    setCloudStatus(`未连接云端：${configError || "Supabase 程式还没加载完成。"}`);
    const loginBtn = document.querySelector("#loginBtn");
    const signupBtn = document.querySelector("#signupBtn");
    const emailInput = document.querySelector("#emailInput");
    const passwordInput = document.querySelector("#passwordInput");
    if (loginBtn) loginBtn.disabled = true;
    if (signupBtn) signupBtn.disabled = true;
    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    return;
  }

  const config = cloudConfig();
  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateCloudUi();
    if (currentUser) loadCloudHistory();
  });

  updateCloudUi();
  if (currentUser) await loadCloudHistory();
}

function updateCloudUi() {
  const loginBtn = document.querySelector("#loginBtn");
  const signupBtn = document.querySelector("#signupBtn");
  const logoutBtn = document.querySelector("#logoutBtn");
  const emailInput = document.querySelector("#emailInput");
  const passwordInput = document.querySelector("#passwordInput");

  if (!cloudIsConfigured()) return;

  if (currentUser) {
    setCloudStatus(`已连接云端：${currentUser.email}。换手机后用同一个 email 登录即可恢复历史。`);
    if (loginBtn) loginBtn.hidden = true;
    if (signupBtn) signupBtn.hidden = true;
    if (emailInput) emailInput.hidden = true;
    if (passwordInput) passwordInput.hidden = true;
    if (logoutBtn) logoutBtn.hidden = false;
  } else {
    setCloudStatus("Supabase 已设置。用 email + password 登录后，换手机也能恢复历史。");
    if (loginBtn) loginBtn.hidden = false;
    if (loginBtn) loginBtn.disabled = false;
    if (signupBtn) signupBtn.hidden = false;
    if (signupBtn) signupBtn.disabled = false;
    if (emailInput) emailInput.hidden = false;
    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.hidden = false;
    if (passwordInput) passwordInput.disabled = false;
    if (logoutBtn) logoutBtn.hidden = true;
  }
}

function authFields() {
  const email = String(document.querySelector("#emailInput")?.value || "").trim();
  const password = String(document.querySelector("#passwordInput")?.value || "");

  if (!email) return { error: "先输入 email。" };
  if (password.length < 6) return { error: "密码至少要 6 个字符。" };
  return { email, password };
}

async function signInWithPassword() {
  if (!supabaseClient) {
    setCloudStatus("不能登录：Supabase 还没设置好。请先确认 config.js 已填入 Project URL 和 anon public key，并已发布到 GitHub Pages。");
    return;
  }

  const fields = authFields();
  if (fields.error) {
    setCloudStatus(fields.error);
    return;
  }

  setCloudStatus("正在登录...");
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: fields.email,
    password: fields.password
  });

  setCloudStatus(error ? `登录失败：${error.message}` : "登录成功，正在读取云端历史...");
}

async function signUpWithPassword() {
  if (!supabaseClient) {
    setCloudStatus("不能注册：Supabase 还没设置好。");
    return;
  }

  const fields = authFields();
  if (fields.error) {
    setCloudStatus(fields.error);
    return;
  }

  setCloudStatus("正在注册...");
  const { error } = await supabaseClient.auth.signUp({
    email: fields.email,
    password: fields.password
  });

  setCloudStatus(error ? `注册失败：${error.message}` : "注册成功。若 Supabase 要求确认邮件，请先去邮箱点确认；否则会自动登录。");
}

async function logoutCloud() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  currentUser = null;
  updateCloudUi();
}

async function loadCloudHistory() {
  if (!supabaseClient || !currentUser) return;

  setCloudStatus("正在读取云端历史...");
  const { data, error } = await supabaseClient
    .from("evidence_entries")
    .select("date,text,action,updated_at")
    .order("date", { ascending: false })
    .limit(90);

  if (error) {
    setCloudStatus(`读取云端失败：${error.message}`);
    return;
  }

  state.history = (data || []).map((entry) => ({
    date: entry.date,
    text: entry.text,
    action: entry.action,
    updatedAt: entry.updated_at
  }));

  const today = state.history.find((entry) => entry.date === todayKey());
  if (today && !String(state.evidence || "").trim()) {
    state.evidence = today.text;
  }

  saveState();
  render();
  setCloudStatus(`已连接云端：${currentUser.email}。`);
}

function queueCloudSave() {
  if (!supabaseClient || !currentUser) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(syncTodayEvidence, 650);
}

async function syncTodayEvidence() {
  const text = String(state.evidence || "").trim();
  if (!supabaseClient || !currentUser || !text) return;

  const { error } = await supabaseClient.from("evidence_entries").upsert(
    {
      user_id: currentUser.id,
      date: todayKey(),
      text,
      action: currentAction().title,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,date" }
  );

  setCloudStatus(error ? `云端保存失败：${error.message}` : `已保存到云端：${currentUser.email}。`);
}

function bindPwaInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    const installBtn = document.querySelector("#installBtn");
    if (installBtn) installBtn.hidden = false;
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

render();
bindEvents();
bindPwaInstall();
setupCloud();
onlineInsights = Array.isArray(state.onlineInsights) ? state.onlineInsights : [];
fetchOnlineInsights().catch(() => {
  const status = document.querySelector("#onlineStatus");
  if (status) status.textContent = "网上资料暂时抓不到，先用备用 key points。";
  render();
});
