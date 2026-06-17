const STORE_KEY = "simple-rich-learning-v1";
const APP_VERSION = "2026-06-17.16";
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
    identities: ["能自由旅行的人", "可以舒服出行的人", "有选择权旅行的人", "把世界当成课堂的人", "不被机票价格困住的人", "拥有时间主权的人", "走到哪里都被妥善照顾的人"],
    scenes: [
      "我去到一个国家时，可以住在安静、干净、有好床和好早餐的五星级酒店，早上醒来不用赶时间，先喝咖啡，再慢慢决定今天去哪里",
      "我可以坐商务舱或头等舱，登机前在 lounge 休息，飞机上躺平睡觉，抵达时身体还有能量，不是狼狈地开始一天",
      "我可以临时安排一次回东南亚的旅行，买票时主要考虑时间、舒适和安全，而不是一直被最低价格限制",
      "我可以在生日那天坐新航回马来西亚，提前安排素食餐、好座位和轻松转机，整个旅程像被认真照顾，而不是自己硬撑",
      "我可以到东京住一周学日语，到台北上文化课，到欧洲看艺术展；旅行不是匆忙打卡，而是让我变得更有眼界",
      "我抵达陌生城市时，可以有司机接机，行李有人协助，酒店已经准备好安静房间；我把精力留给体验、学习和重要的人",
      "我可以在一个城市多住几天，只因为我喜欢那里的空气、咖啡馆、书店和步行路线；我的行程不需要永远赶下一站",
      "我可以选择上午飞、下午飞、直飞或转机，选择权在我手上；我不需要为了省一点钱牺牲整个人的精神状态",
      "我可以住在安全、安静、服务好的地方，窗外有城市灯光或海景，房间里有好床、热水、干净浴袍和可以认真工作的桌子",
      "我可以把旅行安排得很从容：第一天只休息，第二天才开始见人、学习或探索；我的身体不需要为行程付出代价"
    ],
    actions: ["先查一个我想去的城市", "学一句当地语言", "写下我想体验的一家酒店", "保存一个未来生日航班", "查一个当地文化课程"]
  },
  support: {
    identities: ["不用被琐事拖住的人", "把生活安排得很轻松的人", "有生活支持系统的人", "把精力留给重要事情的人", "被生活好好支持的人", "生活有缓冲的人", "不用凡事亲力亲为的人"],
    scenes: [
      "洗衣、打扫、做饭、预约、维修和整理这些事都有可靠的人或服务帮我处理，我不用把最清醒的时间花在重复琐事上",
      "我的时间不用被一堆小事切碎，日历里有完整的学习、健身、散步、读书和休息时间，生活不是一直救火",
      "我的家干净、安静、有一个小图书馆、有舒服的书桌、有运动空间，也有人帮我维持秩序，我回家就能进入稳定状态",
      "冰箱里有健康食物，衣服已经洗好收好，房间空气清爽，桌面没有杂物；我醒来时不需要先处理一堆生活负担",
      "我的重要预约、旅行文件、账单和日程都有清楚系统管理，我不用靠焦虑记住所有事情",
      "我可以把低价值、重复、消耗情绪的事情交给服务和流程，把最好的脑力留给创造、学习、关系和健康",
      "我的生活不是奢侈堆满，而是干净、安静、顺手；每一样安排都在帮我减少摩擦，让我更稳定地变强",
      "我可以有私人助理或可靠服务帮我处理订票、改期、预约、资料整理和提醒，我不再把脑力浪费在反复确认小事上",
      "我可以请人定期深度清洁家里，床单是干净的，浴室是明亮的，厨房是有秩序的；我的家一直在支持我的状态",
      "我可以在需要专注时不被打断，在需要休息时真的休息；生活有足够缓冲，不会因为一件小事就全盘混乱"
    ],
    actions: ["找出一件可以外包或简化的小事", "整理一个让我更省心的流程", "把房间里一个角落收干净", "写下一件以后不想亲自做的琐事", "设一个固定整理时间"]
  },
  learning: {
    identities: ["有时间学习世界的人", "可以慢慢学语言和文化的人", "把旅行变成学习的人", "用财富扩大理解力的人", "可以认真培养兴趣的人", "有能力请好老师的人", "把好奇心养大的人"],
    scenes: [
      "我可以在一个国家住久一点，请当地老师教我语言和文化，不是走马看花，而是真的理解他们怎么生活、怎么说话、怎么吃饭",
      "我可以上午上课，下午散步，晚上安静读书；我的旅行不是逃避工作，而是扩大眼界和能力",
      "我可以去巴厘岛学瑜伽，也可以去尼泊尔练冥想，给身体和心灵一整段完整的时间，不需要向忙碌证明自己",
      "我可以请一位很好的老师一对一教我语言、写作、商业或冥想；我不用自己乱摸索，可以被真正懂的人带着走",
      "我有时间读完一本重要的书，也有空间把书里的重点变成自己的行动，而不是读完就忘",
      "我可以每个季度选择一个主题深入学习：AI、财富、销售、语言、健康、文化；我的人生不是原地重复，而是在持续升级",
      "我可以去一个安静的学校或 retreat 住几周，每天上课、练习、散步、写笔记，让自己真正沉进去",
      "我可以买好书、上好课、参加高质量 workshop，也可以请人帮我筛选资料；我不需要在低质量信息里消耗自己",
      "我可以为了学一门语言住到那个国家，早上上课，下午去市场练习，晚上把听到的新句子写进笔记",
      "我可以把学习变成生活的一部分，而不是挤出来的痛苦任务；我的时间允许我慢慢变深、变稳、变有见识"
    ],
    actions: ["学一个新词", "收藏一个想上的课程", "写一句我今天学到的东西", "找一位未来想跟随的老师", "列一个季度学习主题"]
  },
  giving: {
    identities: ["有能力慷慨的人", "可以稳定捐钱的人", "让钱也服务善意的人", "能把善良变成系统的人", "有余力照亮别人的人", "把善意做长久的人", "能保护也能给予的人"],
    scenes: [
      "我可以每年认真捐一笔钱，而不是只在有余力时才善良；捐赠会被计划、记录和复盘，真的帮助到人",
      "我可以支持教育、贫困、健康或环境项目，选择可靠组织，保留凭证，也知道自己的钱产生了什么影响",
      "我可以照顾家人，也可以帮助陌生人过得好一点；钱不只是安全感，也是我表达价值观的工具",
      "我可以为一个孩子的教育、一个家庭的医疗、一个小组织的项目提供稳定支持；我的财富不只是停在账户里，也流向真实的人",
      "我可以年底坐下来读自己的捐赠记录，看到钱去了哪里、帮助了谁、下一年可以做得更好",
      "我可以不靠冲动善良，而是用清楚预算、可靠机构和长期跟进，让每一笔善意更有力量",
      "我可以在自己越来越富有的同时，越来越温柔、越来越有责任感；财富让我有能力保护自己，也有能力支持别人",
      "我可以设立一个年度捐赠主题，比如教育、女性、医疗、动物或环境，然后认真选择机构、看报告、持续支持",
      "我可以在家人需要时稳稳伸手，不需要一边帮忙一边恐慌；我的富有让爱变得更有力量",
      "我可以把一部分财富变成奖学金、书籍、课程、治疗和机会，让别人也拥有重新开始的可能"
    ],
    actions: ["写下一个我想支持的对象", "存下一点未来捐赠基金", "查一个可靠的公益项目", "列一个未来捐赠类别", "保存一个公益机构资料"]
  },
  assets: {
    identities: ["有被动收入的人", "让钱慢慢替我工作的人", "资产越来越清楚的人", "不再只靠工资的人", "有长期选择权的人", "能和专业人士合作的人", "用系统管理财富的人"],
    scenes: [
      "我的生活费不只靠工资，也有资产、储蓄、投资和系统在支持我；我每个月都清楚钱从哪里来、到哪里去",
      "我可以安心健身、读书、旅行，因为现金流是清楚的，账目是干净的，税务和重要决定也有人专业协助",
      "我拥有自己的房子和长期资产，不需要每天为生存紧张；我做决定时看长期价值，而不是只看眼前压力",
      "我每个月都有固定资产盘点，知道现金、投资、房产、公司价值和未来机会分别在哪里；钱在我的系统里是清楚的",
      "我可以和会计、税务顾问、律师或理财顾问开会，听懂重点，问对问题，做合法稳健的长期安排",
      "我买东西时不再只问我喜不喜欢，也会问它会不会增加自由、健康、能力或长期价值",
      "我的财富不是靠一次幸运，而是靠持续收入、清楚记录、谨慎投资、耐心复利和越来越好的判断力",
      "我可以拥有一个干净的财务文件夹：收入、支出、税务、保险、投资、房产和捐赠都有记录，任何重要决定都看得清楚",
      "我可以请专业人士检查合约、税务和投资结构；我不需要假装自己什么都懂，而是知道什么时候该找对的人",
      "我可以每年做一次资产会议，认真看自己离自由更近了多少，也诚实调整下一年的策略"
    ],
    actions: ["记录一笔钱", "看一眼储蓄进度", "写下一个未来资产目标", "整理一个账户余额", "写下一项长期资产想法"]
  },
  body: {
    identities: ["有时间照顾身体的人", "健康又自由的人", "把身体放在第一位的人", "有能量享受财富的人", "身体和心都稳定的人", "不牺牲健康换钱的人", "活得舒展的人"],
    scenes: [
      "我可以固定健身、冥想、睡好觉，不用一直赶时间；我的一天有空间给身体恢复，不是只剩下疲惫",
      "我可以请教练、上瑜伽课、吃健康食物、做体检，也可以为了健康安排旅行和课程",
      "我的身体不是被工作消耗完，而是被生活好好照顾；我有时间变强壮、变柔软、变稳定",
      "我可以在早上慢慢运动、拉伸、喝水、吃一顿真正滋养身体的早餐，而不是一醒来就被压力推着跑",
      "我可以定期做体检、看牙、按摩、理疗和恢复训练；我不等身体崩溃才开始照顾自己",
      "我可以在海边、山里或安静的瑜伽馆练习呼吸，心里很稳，知道自己的人生不是只为了赶工",
      "我有足够的睡眠、规律的训练和稳定的情绪，财富对我来说不是更忙，而是更有能力好好活着",
      "我可以请营养师、教练或医生帮我制定适合自己的计划，健康不是靠硬撑，而是被专业地支持",
      "我可以把冥想、瑜伽、力量训练和散步放进日程里，像安排重要会议一样认真对待自己的身体",
      "我可以慢慢吃饭、认真休息、稳定运动；我拥有的不只是钱，还有可以享受人生的身体和心"
    ],
    actions: ["走路 10 分钟", "做 5 分钟伸展", "安静呼吸 5 分钟", "预约一个健康检查", "写下今晚几点睡"]
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

function cleanBookHighlight(text, limit = 96) {
  let result = String(text || "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^>\s?/, "")
    .replace(/^#+\s*/, "")
    .replace(/\^[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*-?/g, "")
    .replace(/\^[0-9０-９]+(?:-[0-9０-９]+)*-?/g, "")
    .replace(/==/g, "")
    .replace(/\*\*/g, "")
    .replace(/\[\[|\]\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (isChapterHeadingText(result)) return "";

  for (let i = 0; i < 4; i += 1) {
    result = result
      .replace(/\s*(?:位置|页码|页|loc(?:ation)?|page|p)\.?\s*[:：]?\s*[0-9０-９,\-–—]+\s*$/i, "")
      .replace(/\s*\^[0-9０-９]+(?:-[0-9０-９]+)*-?\s*$/u, "")
      .replace(/\s*[（(【\[]\s*(?:位置|页码|页|loc(?:ation)?|page|p)?\.?\s*[:：]?\s*[0-9０-９,\-–—]+\s*[)）】\]]\s*$/i, "")
      .replace(/\s*[（(【\[]\s*[0-9０-９]+(?:\s*[-–—]\s*[0-9０-９]+)?\s*[)）】\]]\s*$/u, "")
      .replace(/\s*[|｜·•#^]\s*[0-9０-９a-z-]{1,16}\s*$/i, "")
      .replace(/([。.!！？?，,；;：:])\s*[0-9０-９]{1,6}%?\s*$/u, "$1")
      .replace(/\s+[0-9０-９]{1,6}%?\s*$/u, "")
      .replace(/\s*[¹²³⁴⁵⁶⁷⁸⁹⁰①②③④⑤⑥⑦⑧⑨⑩]+\s*$/u, "")
      .replace(/\s*[〖〗《》「」『』]\s*[0-9０-９]+\s*$/u, "")
      .replace(/\s*[,:：;；]\s*[0-9０-９]+\s*$/u, "")
      .trim();
  }

  return result.slice(0, limit);
}

function isChapterHeadingText(text) {
  const value = String(text || "").trim();
  const compact = value.replace(/\s+/g, "");
  return (
    /^(?:\d+[.、．]\s*)?第[零〇一二两三四五六七八九十百千万0-9０-９]+[章节章篇部回]/.test(compact) ||
    /^(chapter|chap\.?|section|part|volume)\s*[0-9ivxlcdm]+/i.test(value)
  );
}

function hasChineseText(text) {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function isMetadataHighlightLine(text) {
  const value = String(text || "").trim();
  if (!value) return true;
  if (/^[-_]{3,}$/.test(value)) return true;
  if (/^[A-Za-z_][\w.-]*\s*[:：=]/.test(value)) return true;
  return /(^|[,\s，])(?:doc_type|lastReadDate|bookId|reviewId|chapterUid|range|type|created|updated|createTime|updateTime|metadata|isbn|cover|tags|source|url|author)\s*[:：=]/i.test(value);
}

function isCleanChineseHighlight(text) {
  const value = String(text || "").trim();
  if (value.length < 14) return false;
  if (!hasChineseText(value)) return false;
  if (isMetadataHighlightLine(value)) return false;
  if (isChapterHeadingText(value)) return false;
  if (/^(part|section|volume)\s+\d+/i.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value)) return false;
  if (/^[\d\s.。:：、-]+$/.test(value)) return false;
  return /[。！？；：，、,.!?;:]/.test(value) || value.length >= 24;
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
  const themes = [];
  const addTheme = (theme) => {
    if (theme && !themes.includes(theme)) themes.push(theme);
  };
  if (insights.length) {
    pickDailyItems(insights, Math.max(count * 2, 6), Number(state.richLifeSpin || 0)).map(richLifeTheme).forEach(addTheme);
  }
  const fallback = ["travel", "support", "learning", "giving", "assets", "body"];
  for (let i = 0; themes.length < count && i < fallback.length; i += 1) {
    addTheme(fallback[(dailyOffset() + Number(state.richLifeSpin || 0) + i) % fallback.length]);
  }
  return themes.slice(0, count);
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url, { cache: "no-store" });
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
  const response = await fetchWithTimeout("https://thysrael.github.io/Horizon/feed-en.xml", { cache: "no-store" }, 8000);
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

function makeEntryId() {
  return `${todayKey()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function activeOnlineInsights() {
  return onlineInsights.length ? onlineInsights : Array.isArray(state.onlineInsights) ? state.onlineInsights : [];
}

function activeWereadHighlights() {
  return (Array.isArray(state.wereadHighlights) ? state.wereadHighlights : [])
    .map((item) => ({
      ...item,
      book: cleanTitle(item.book || "读书重点"),
      text: cleanBookHighlight(item.text || "", 120)
    }))
    .filter((item) => isCleanChineseHighlight(item.text));
}

function isUsefulHighlightLine(line) {
  const raw = String(line || "").trim();
  if (isMetadataHighlightLine(raw)) return false;
  return isCleanChineseHighlight(cleanBookHighlight(raw, 140));
}

function parseWereadMarkdown(text, fileName) {
  const book = cleanTitle(String(fileName || "读书重点").replace(/\.(md|txt)$/i, ""));
  const lines = String(text || "").split(/\r?\n/);
  return lines
    .filter(isUsefulHighlightLine)
    .map((line) => ({
      book,
      text: cleanBookHighlight(line)
    }))
    .filter((item) => item.text)
    .slice(0, 40);
}

function renderBookHighlights() {
  const root = document.querySelector("#bookHighlights");
  if (!root) return;
  root.innerHTML = "";
  const highlights = pickDailyItems(activeWereadHighlights(), 4, Number(state.bookSpin || 0));
  highlights.forEach((highlight) => {
    const item = document.createElement("div");
    item.className = "example";
    const title = document.createElement("strong");
    title.textContent = `《${highlight.book}》`;
    item.append(title);
    item.append(document.createElement("br"));
    item.append(highlight.text);
    root.append(item);
  });
}

async function importWereadFiles(files, status) {
  const markdownFiles = Array.from(files || []).filter((file) => /\.(md|txt)$/i.test(file.name));
  if (!markdownFiles.length) {
    if (status) status.textContent = "没有找到 Markdown 或 txt 文件。";
    return;
  }

  if (status) status.textContent = `正在读取 ${markdownFiles.length} 个 Obsidian / WeRead 文件...`;

  try {
    const imported = [];
    for (const file of markdownFiles) {
      const text = await file.text();
      imported.push(...parseWereadMarkdown(text, file.name));
    }

    const existing = activeWereadHighlights();
    const merged = [...imported, ...existing]
      .filter((item, index, list) => item.text && list.findIndex((other) => other.book === item.book && other.text === item.text) === index)
      .slice(0, 200);

    state.wereadHighlights = merged;
    state.bookSpin = Number(state.bookSpin || 0) + 1;
    saveState();
    render();
    if (status) status.textContent = imported.length ? `已导入 ${imported.length} 条句子重点。` : "没有识别到句子重点。已过滤章节标题、页码和位置号。";
  } catch {
    if (status) status.textContent = "导入失败。请确认文件是 Markdown 或 txt。";
  }
}

function onlineKeyPoints() {
  const items = activeOnlineInsights();
  const pinned = items.filter((item) => item.pinned);
  const regular = items.filter((item) => !item.pinned);
  const offset = Number(state.onlineSpin || 0) + Number(state.actionIndex || 0);
  if (pinned.length) {
    const horizonItems = pickDailyItems(pinned, 3, offset);
    if (horizonItems.length >= 3) return horizonItems;
    return [...horizonItems, ...pickDailyItems(regular, 3 - horizonItems.length, offset)].filter(Boolean);
  }
  return pickDailyItems(items, 3, offset);
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
  let id = state.currentHistoryId || makeEntryId();
  let existing = history.find((item) => item.id === id);

  if (existing && existing.date !== date) {
    id = makeEntryId();
    existing = null;
  }

  if (existing) {
    existing.text = text;
    existing.action = currentAction().title;
    existing.updatedAt = new Date().toISOString();
  } else {
    history.unshift({
      id,
      date,
      text,
      action: currentAction().title,
      updatedAt: new Date().toISOString()
    });
  }

  state.currentHistoryId = id;
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
  if (examples) {
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
  }

  const wereadStatus = document.querySelector("#wereadStatus");
  if (wereadStatus) {
    const count = activeWereadHighlights().length;
    wereadStatus.textContent = count
      ? `已导入 ${count} 条读书重点。`
      : "还没有导入读书重点。";
  }
  renderBookHighlights();

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
    const meta = document.createElement("span");
    meta.textContent = `${readableDate(entry.date)} · ${entry.action || "行动证据"}`;
    item.append(meta);
    item.append(document.createTextNode(entry.text));
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
    state.currentHistoryId = null;
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
      const status = document.querySelector("#onlineStatus");
      state.onlineSpin = Number(state.onlineSpin || 0) + 1;
      saveState();
      render();
      if (status) status.textContent = "已点击刷新，正在读取 Horizon 英文日报...";
      fetchOnlineInsights().catch(() => {
        if (status) status.textContent = "Horizon 暂时抓不到，已经先换成本地备用 key points。";
        render();
      });
    });
  }

  const wereadImport = document.querySelector("#wereadImport");
  if (wereadImport) {
    wereadImport.addEventListener("change", async (event) => {
      const status = document.querySelector("#wereadStatus");
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      await importWereadFiles(files, status);
      event.target.value = "";
    });
  }

  const refreshBookBtn = document.querySelector("#refreshBookBtn");
  if (refreshBookBtn) {
    refreshBookBtn.addEventListener("click", () => {
      const status = document.querySelector("#wereadStatus");
      state.bookSpin = Number(state.bookSpin || 0) + 1;
      saveState();
      render();
      if (status) {
        const count = activeWereadHighlights().length;
        status.textContent = count ? "已刷新读书重点。" : "还没有导入读书重点。";
      }
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
    id: `${entry.date}-${new Date(entry.updated_at || Date.now()).getTime()}`,
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
  const today = todayKey();
  const todayEntries = (Array.isArray(state.history) ? state.history : [])
    .filter((entry) => entry.date === today && String(entry.text || "").trim())
    .sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
  const text = todayEntries.length
    ? todayEntries.map((entry) => String(entry.text || "").trim()).join("\n\n")
    : String(state.evidence || "").trim();
  if (!supabaseClient || !currentUser || !text) return;

  const { error } = await supabaseClient.from("evidence_entries").upsert(
    {
      user_id: currentUser.id,
      date: today,
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
