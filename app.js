const STORE_KEY = "simple-rich-learning-v1";
const APP_VERSION = "2026-06-17.3";
let deferredInstallPrompt = null;
let onlineInsights = [];
let richLifeInsights = [];
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

const richLifeSearches = [
  { lang: "zh", source: "Wikipedia 中文", query: "家族办公室 财富管理", lens: "财富架构" },
  { lang: "zh", source: "Wikipedia 中文", query: "私人银行 高净值人士", lens: "专业服务" },
  { lang: "zh", source: "Wikipedia 中文", query: "慈善 基金会 捐赠", lens: "影响力" },
  { lang: "zh", source: "Wikipedia 中文", query: "礼宾 服务 生活", lens: "生活支持" },
  { lang: "zh", source: "Wikipedia 中文", query: "资产配置 投资管理", lens: "资产系统" },
  { lang: "zh", source: "Wikipedia 中文", query: "商务舱 头等舱 航空", lens: "高质量旅行" },
  { lang: "en", source: "Wikipedia", query: "family office wealth management", lens: "财富架构" },
  { lang: "en", source: "Wikipedia", query: "private banking high net worth", lens: "专业服务" },
  { lang: "en", source: "Wikipedia", query: "concierge lifestyle management", lens: "生活支持" },
  { lang: "en", source: "Wikipedia", query: "philanthropy foundation wealth", lens: "影响力" }
];

const richLifeSceneParts = {
  travel: {
    identities: ["能自由旅行的人", "可以舒服出行的人", "有选择权旅行的人"],
    scenes: ["我去到一个国家时，可以住舒服的五星级酒店", "我可以坐商务舱或头等舱，把旅程本身也变成休息", "我可以临时安排一次回东南亚的旅行，不需要为了钱一直犹豫"],
    actions: ["先查一个我想去的城市", "学一句当地语言", "写下我想体验的一家酒店"]
  },
  support: {
    identities: ["不用被琐事拖住的人", "把生活安排得很轻松的人", "有生活支持系统的人"],
    scenes: ["洗衣、打扫、做饭、预约这些事都有可靠的人或服务帮我处理", "我的时间不用被一堆小事切碎", "我的家干净、安静、有书、有运动空间，也有人帮我维持秩序"],
    actions: ["找出一件可以外包或简化的小事", "整理一个让我更省心的流程", "把房间里一个角落收干净"]
  },
  learning: {
    identities: ["有时间学习世界的人", "可以慢慢学语言和文化的人", "把旅行变成学习的人"],
    scenes: ["我可以在一个国家住久一点，请当地老师教我语言和文化", "我可以上午上课，下午散步，晚上安静读书", "我可以去巴厘岛学瑜伽，也可以去尼泊尔练冥想"],
    actions: ["学一个新词", "收藏一个想上的课程", "写一句我今天学到的东西"]
  },
  giving: {
    identities: ["有能力慷慨的人", "可以稳定捐钱的人", "让钱也服务善意的人"],
    scenes: ["我可以每年认真捐一笔钱，而不是只在有余力时才善良", "我可以支持教育、贫困、健康或环境项目", "我可以照顾家人，也可以帮助陌生人过得好一点"],
    actions: ["写下一个我想支持的对象", "存下一点未来捐赠基金", "查一个可靠的公益项目"]
  },
  assets: {
    identities: ["有被动收入的人", "让钱慢慢替我工作的人", "资产越来越清楚的人"],
    scenes: ["我的生活费不只靠工资，也有资产和系统在支持我", "我可以安心健身、读书、旅行，因为现金流是清楚的", "我拥有自己的房子和长期资产，不需要每天为生存紧张"],
    actions: ["记录一笔钱", "看一眼储蓄进度", "写下一个未来资产目标"]
  },
  body: {
    identities: ["有时间照顾身体的人", "健康又自由的人", "把身体放在第一位的人"],
    scenes: ["我可以固定健身、冥想、睡好觉，不用一直赶时间", "我可以请教练、上瑜伽课、吃健康食物", "我的身体不是被工作消耗完，而是被生活好好照顾"],
    actions: ["走路 10 分钟", "做 5 分钟伸展", "安静呼吸 5 分钟"]
  }
};

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

function cleanSummary(text, limit = 160) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, limit);
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

function cleanSnippet(text) {
  return cleanTitle(
    String(text || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

function wikiSearchUrl({ lang, query }) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    list: "search",
    srsearch: query,
    srlimit: "5"
  });
  return `https://${lang}.wikipedia.org/w/api.php?${params.toString()}`;
}

function wikiArticleUrl(lang, title) {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/\s+/g, "_"))}`;
}

function richLifeLesson(title, snippet, lens) {
  const lower = `${title} ${snippet} ${lens}`.toLowerCase();

  if (lower.includes("family office")) {
    return "真正的大财富不是一个人硬扛，而是把投资、税务、法律、房产、慈善和传承放进一个可管理的系统。";
  }
  if (lower.includes("private banking") || lower.includes("私人银行") || lower.includes("高净值")) {
    return "高净值服务卖的不是炫耀，而是更省心的资产安排、风险管理、隐私、连接和专业判断。";
  }
  if (lower.includes("philanthropy") || lower.includes("charity") || lower.includes("foundation") || lower.includes("慈善") || lower.includes("基金会")) {
    return "有钱人的捐赠不是临时感动，而是可以被规划、衡量、复盘和长期执行的影响力。";
  }
  if (lower.includes("concierge") || lower.includes("礼宾") || lower.includes("lifestyle")) {
    return "有钱人买的是少操心：预约、行程、维修、清洁、安排和突发问题都有人处理。";
  }
  if (lower.includes("business class") || lower.includes("first class") || lower.includes("travel") || lower.includes("商务舱") || lower.includes("头等舱")) {
    return "高端旅行真正买的是休息、确定性、隐私、少折腾，以及抵达后还有能量做重要的事。";
  }
  if (lower.includes("asset") || lower.includes("portfolio") || lower.includes("investment") || lower.includes("资产") || lower.includes("投资")) {
    return "富有不是只看收入，而是持续管理资产、现金流、风险、时间和长期选择权。";
  }
  return "真正的富有像一个支持系统：专业人士、稳定现金流、生活外包、健康安排、学习时间和自由选择。";
}

function richLifeTheme(item) {
  const text = `${item?.title || ""} ${item?.rawPoint || ""} ${item?.summary || ""}`.toLowerCase();
  if (/travel|hotel|aviation|business class|first class|商务舱|头等舱|旅行|酒店|航空/.test(text)) return "travel";
  if (/concierge|lifestyle|service|礼宾|服务|生活/.test(text)) return "support";
  if (/philanthropy|charity|foundation|慈善|公益|基金会|捐/.test(text)) return "giving";
  if (/asset|portfolio|investment|wealth|banking|office|资产|投资|财富|银行|家族办公室/.test(text)) return "assets";
  return ["travel", "support", "learning", "giving", "assets", "body"][(dailyOffset() + Number(state?.richLifeSpin || 0)) % 6];
}

function partFrom(list, salt) {
  return list[(dailyOffset() + Number(state.richLifeSpin || 0) + Number(state.actionIndex || 0) + salt) % list.length];
}

function richLifeThemeSet(theme) {
  return richLifeSceneParts[theme] || richLifeSceneParts.travel;
}

function simpleRichLifeSentence(theme, index) {
  const set = richLifeThemeSet(theme);
  const identity = partFrom(set.identities, index);
  const scene = partFrom(set.scenes, index * 2);
  return `我是一个${identity}，所以${scene}。`;
}

function simpleEvidenceSentence(theme, index) {
  const set = richLifeThemeSet(theme);
  const identity = partFrom(set.identities, index);
  const action = partFrom(set.actions, index * 2);
  return `我是一个${identity}，所以我今天只做一件小事：${action}。`;
}

function richLifeThemes(count) {
  const insights = activeRichLifeInsights();
  const themes = insights.length ? pickDailyItems(insights, count, Number(state.richLifeSpin || 0)).map(richLifeTheme) : [];
  const fallback = ["travel", "support", "learning", "giving", "assets", "body"];
  while (themes.length < count) {
    themes.push(fallback[(dailyOffset() + Number(state.richLifeSpin || 0) + themes.length) % fallback.length]);
  }
  return themes;
}

function richLifeInsightFromWiki(page, search) {
  const title = cleanTitle(page.title);
  const rawPoint = cleanSnippet(page.snippet);
  if (!title) return null;
  return {
    source: search.source,
    title,
    rawPoint: rawPoint || `${search.query} 的相关资料`,
    summary: richLifeLesson(title, rawPoint, search.lens),
    url: wikiArticleUrl(search.lang, title),
    domain: search.source
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function horizonFallbackInsights() {
  return [
    {
      source: "Horizon Daily",
      title: "Horizon 暂时抓不到，先读它的公开日报入口",
      summary: "Horizon 会从多个信息源抓取内容，再用 AI 去重、评分、过滤和摘要。等 feed 可用时，这里会显示最新日报条目。",
      url: "https://thysrael.github.io/Horizon/",
      pinned: true
    },
    {
      source: "Horizon Daily",
      title: "AI 信息系统的基本流程",
      summary: "收集资料、去掉重复、判断重要性、补充背景、写成摘要。这就是你要学习的后端信息处理思路。",
      url: "https://github.com/Thysrael/Horizon",
      pinned: true
    },
    {
      source: "Horizon Daily",
      title: "为什么这和变富有有关",
      summary: "有价值的信息系统可以帮人省时间、看重点、少错过机会。你不喜欢前端，也可以学习这种后端型价值。",
      url: "https://github.com/Thysrael/Horizon",
      pinned: true
    }
  ];
}

function absoluteHorizonUrl(url) {
  if (!url) return "https://thysrael.github.io/Horizon/";
  try {
    return new URL(url, "https://thysrael.github.io/Horizon/").href;
  } catch {
    return "https://thysrael.github.io/Horizon/";
  }
}

function firstUsefulParagraphAfter(node) {
  let current = node.nextElementSibling;
  while (current) {
    if (current.tagName === "P") {
      const text = cleanSummary(current.textContent, 220);
      if (text && !/hackernews|reddit|telegram|github\s*·|社区讨论/i.test(text)) return text;
    }
    if (current.tagName === "H2") break;
    current = current.nextElementSibling;
  }
  return "";
}

function horizonItemsFromEntry(entry) {
  const content = entry.getElementsByTagName("content")[0]?.textContent || "";
  const entryLink = entry.getElementsByTagName("link")[0]?.getAttribute("href") || "https://thysrael.github.io/Horizon/";
  const doc = new DOMParser().parseFromString(content, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2")).slice(0, 12);
  const items = headings
    .map((heading) => {
      const anchor = heading.querySelector("a[href]");
      const title = cleanTitle(anchor?.textContent || heading.textContent || "");
      if (!title) return null;
      const summary = firstUsefulParagraphAfter(heading) || "Horizon 从今日资讯中筛选出的高优先级条目。打开来源看完整摘要和背景。";
      return {
        source: "Horizon Daily",
        title,
        summary,
        url: absoluteHorizonUrl(anchor?.getAttribute("href") || entryLink),
        pinned: true
      };
    })
    .filter(Boolean);

  if (items.length) return items;

  return Array.from(doc.querySelectorAll("ol li"))
    .slice(0, 6)
    .map((item) => {
      const anchor = item.querySelector("a[href]");
      const title = cleanTitle(anchor?.textContent || item.textContent || "");
      if (!title) return null;
      return {
        source: "Horizon Daily",
        title,
        summary: "Horizon 今日筛选出的重要资讯。打开来源看完整摘要。",
        url: absoluteHorizonUrl(entryLink),
        pinned: true
      };
    })
    .filter(Boolean);
}

async function fetchHorizonInsights() {
  const response = await fetch("https://thysrael.github.io/Horizon/feed-en.xml", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  const feed = new DOMParser().parseFromString(xml, "application/xml");
  const entry = feed.getElementsByTagName("entry")[0];
  if (!entry) throw new Error("Horizon feed has no entries");
  const items = horizonItemsFromEntry(entry);
  if (!items.length) throw new Error("Horizon feed has no parsed items");
  return items.slice(0, 12);
}

async function fetchOnlineInsights() {
  const status = document.querySelector("#onlineStatus");
  if (status) status.textContent = "正在抓取 Horizon、GitHub 和技术文章...";

  const requests = [
    fetchHorizonInsights().catch(() => horizonFallbackInsights()),
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
    .filter((item, index, list) => item.title && item.url && item.summary && list.findIndex((other) => other.url === item.url && other.title === item.title) === index);

  state.onlineFetchedAt = new Date().toISOString();
  state.onlineInsights = onlineInsights.slice(0, 36);
  saveState();

  if (status) {
    status.textContent = onlineInsights.length
      ? `已更新 ${onlineInsights.length} 条网上资料，优先显示 Horizon 日报筛选结果。`
      : "这次没有抓到网上资料，先显示备用重点。";
  }
  render();
}

async function fetchRichLifeInsights() {
  const status = document.querySelector("#richLifeStatus");
  if (status) status.textContent = `正在给你换几句新的生活画面... ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;

  const searches = pickDailyItems(richLifeSearches, 6, Number(state.actionIndex || 0) + Number(state.richLifeSpin || 0));
  const requests = searches.map((search) =>
    fetchJson(wikiSearchUrl(search)).then((data) =>
      ((data.query && data.query.search) || [])
        .map((page) => richLifeInsightFromWiki(page, search))
        .filter(Boolean)
    )
  );

  const results = await Promise.allSettled(requests);
  const failedCount = results.filter((result) => result.status === "rejected").length;
  richLifeInsights = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter((item, index, list) => list.findIndex((other) => other.url === item.url) === index)
    .slice(0, 36);

  state.richLifeFetchedAt = new Date().toISOString();
  state.richLifeInsights = richLifeInsights;
  saveState();

  if (status) {
    status.textContent = richLifeInsights.length
      ? "已换成新的简单生活句子。"
      : `这次网上灵感没有连上，先显示离线生活句子。失败来源：${failedCount}/${results.length}`;
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

function onlineKeyPoints() {
  const items = activeOnlineInsights();
  const pinned = items.filter((item) => item.pinned);
  const regular = items.filter((item) => !item.pinned);
  if (pinned.length) {
    const horizonItems = pickDailyItems(pinned, 3, Number(state.actionIndex || 0));
    if (horizonItems.length >= 3) return horizonItems;
    return [...horizonItems, ...pickDailyItems(regular, 3 - horizonItems.length, Number(state.actionIndex || 0))].filter(Boolean);
  }
  return pickDailyItems(items, 3);
}

function activeRichLifeInsights() {
  const items = richLifeInsights.length ? richLifeInsights : Array.isArray(state.richLifeInsights) ? state.richLifeInsights : [];
  return items.filter((item) => !/gdelt|github|dev article/i.test(String(item.source || "")));
}

function insightIdentityExamples() {
  return richLifeThemes(4).map(simpleEvidenceSentence);
}

function richLifeLines() {
  return richLifeThemes(4).map(simpleRichLifeSentence);
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
  const liveItems = onlineKeyPoints();
  if (liveItems.length) {
    liveItems.forEach((point) => keyPointRoot.append(linkedPoint(point)));
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

  const refreshRichLifeBtn = document.querySelector("#refreshRichLifeBtn");
  if (refreshRichLifeBtn) {
    refreshRichLifeBtn.addEventListener("click", () => {
      const status = document.querySelector("#richLifeStatus");
      state.richLifeSpin = Number(state.richLifeSpin || 0) + 1;
      saveState();
      render();
      if (status) status.textContent = "正在换几句新的生活画面...";
      fetchRichLifeInsights().catch(() => {
        if (status) status.textContent = "网上灵感暂时抓不到，已经先换成离线生活句子。";
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
richLifeInsights = Array.isArray(state.richLifeInsights) ? state.richLifeInsights : [];
fetchOnlineInsights().catch(() => {
  const status = document.querySelector("#onlineStatus");
  if (status) status.textContent = "网上资料暂时抓不到，先用备用 key points。";
  render();
});
fetchRichLifeInsights().catch(() => {
  const status = document.querySelector("#richLifeStatus");
  if (status) status.textContent = "网上灵感暂时抓不到，先显示简单生活句子。";
  render();
});
