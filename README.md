# 富有学习系统

一个手机优先的个人成长 PWA。它把“我要变富有”拆成每天可以开始的三步：

1. 选择或填写一个 5 到 10 分钟的小行动。
2. 根据第一步，写一句以“我是...”开头的行动证据。
3. 根据自己希望成为的人，再写一句以“我是...”开头的未来身份。

这个 app 不是投资建议，也不会保证赚钱。它的用途是帮你每天积累注意力、学习力、机会感、行动证据，以及更具体的富有生活想象。

## 这个 app 适合谁

- 有正式工作或稳定收入，但想慢慢建立新的财富能力。
- 不是 AI 或软件背景，希望学习入口简单一点。
- 不想填复杂表格，只想每天知道第一步做什么、第二步和第三步写什么。
- 想在手机上打开，并长期回顾自己写过的“我是...”证据。

## 主要功能

- 三步行动：第一步选择真实小行动，第二步写行动证据，第三步写未来身份。
- 证据历史：界面只显示最近 3 天的“我是...”句子，而且每条记录只显示一句，避免历史区变得太长；完整记录仍会保存在本地/云端。
- 云端同步：连接 Supabase 后，换手机也能恢复历史。
- 富有生活想象：显示具体、容易想象的财富生活画面。
- 读书重点导入：可以导入 `.md` 或 `.txt`，只保留干净的中文句子重点。
- Online key points：优先读取 Horizon 英文日报，失败时显示备用重点。
- PWA：可以通过 GitHub Pages 部署，并添加到手机主屏幕。

## FAQ / Privacy / Cost

### PWA 是什么？

PWA = Progressive Web App。简单说，它是“可以像手机 App 一样安装到主屏幕的网站”。

这个项目不是 App Store / Google Play 里的原生 app。它是一个静态网页，但因为包含 `manifest.json`、`sw.js`，并且可以部署到 HTTPS，所以手机浏览器可以把它加入主屏幕。

### 如果别人用我的部署网址注册，我会看到他们的 email 吗？

如果这个 app 连接的是你的 Supabase project，那么你作为 Supabase project owner，可以在 Supabase dashboard 看到：

- Authentication 里的用户 email。
- 用户 ID。
- `evidence_entries` 里的资料。

普通用户在 app 里应该只能看到自己的资料；这依赖 Supabase Row Level Security。项目管理者在 Supabase 后台拥有管理员视角，所以能看到 project 里的数据。

如果你不想管理别人的资料，建议让别人 fork 这个 repository，并填写他们自己的 Supabase project。

### 为什么两句“我是...”会有同一个 user ID？

这是正常的。`user_id` 代表“是谁写的”。同一个账号写的多句证据，应该拥有同一个 `user_id`。

要检查的是每一句证据是否有不同的 `id`，并且是否在 Supabase 里成为不同 row：

| user_id | id | text |
| --- | --- | --- |
| same-user | entry-1 | 我是...第一句 |
| same-user | entry-2 | 我是...第二句 |

如果同一天的多句证据被合并到同一个 row，说明 Supabase 可能还在旧表结构。请执行下面的旧表迁移 SQL，把主键从 `(user_id, date)` 改成 `(user_id, id)`。

### 这个 app 背后有用 LLM 吗？

目前没有。这个 app 没有调用 OpenAI、ChatGPT、Claude、Gemini 或其他 LLM API。

目前它主要使用：

- 本地 JavaScript。
- GitHub Pages 静态部署。
- Supabase 登录和资料保存。
- Horizon feed / GitHub / DEV / Wikipedia 等公开资料读取。
- 用户导入的 `.md` / `.txt` 文件清理。

“有钱人的世界”里很多句子是写在代码里的模板；online key points 是从公开来源抓取并显示，不是 app 自己调用 LLM 生成。

### 目前会产生费用吗？

通常不会。当前项目用到的东西大多有免费方案：

- GitHub Pages：public repository 通常免费。
- Supabase：有免费额度。
- Horizon / GitHub / DEV / Wikipedia 公开读取：通常免费。
- LLM API：目前没有使用，所以不会产生 LLM API 费用。

可能产生费用的情况：

- Supabase 用量超过免费额度。
- 很多人注册并写入大量资料。
- 使用 private repository 的 GitHub Pages，受 GitHub plan 限制。
- 购买 custom domain。
- 未来接入 OpenAI 或其他 AI API。

## 如果你只是想使用

1. 用手机浏览器打开部署后的 HTTPS 网址。
2. iPhone Safari：点分享按钮，选择“加入主屏幕”。
3. Android Chrome：点菜单，选择“安装应用”或“添加到主屏幕”。
4. 打开 app 后，每天只做三件事：
   - 选择或填写第一步的小行动。
   - 根据第一步写一句“我是...”行动证据。
   - 根据希望成为的人写一句“我是...”未来身份。

如果你想换手机后还看到历史，需要注册/登录云端账号。

## 如果你想自己部署一份

### 1. Fork 或复制这个 repository

在 GitHub 上 fork 这个 repository，或者新建一个 repository 后把文件复制进去。

重要：如果你 fork 这个项目，请把 `config.js` 换成你自己的 Supabase 配置。不要长期使用别人的 Supabase project。

### 2. 开启 GitHub Pages

1. 打开你的 repository。
2. 进入 `Settings`。
3. 进入 `Pages`。
4. 在 `Build and deployment` 里选择 GitHub Actions 或 GitHub 提供的 Pages 部署方式。
5. 推送代码后，进入 `Actions`，等待部署完成。
6. 回到 `Settings` -> `Pages`，复制 GitHub 生成的 HTTPS 网址。

如果你看到 GitHub 要求 repository public 才能使用 Pages，需要把 repository 改成 public，或者升级 GitHub 方案。

如果你没有看到 GitHub Actions，也可以尝试：

1. 在 `Source` 选择 `Deploy from a branch`。
2. Branch 选择 `main`。
3. Folder 选择 `/root`。
4. Save。

### 3. 设置手机 App

部署成功后，用手机打开 GitHub Pages 的 HTTPS 网址：

- iPhone Safari：分享按钮 -> 加入主屏幕。
- Android Chrome：菜单 -> 安装应用 / 添加到主屏幕。

## 云端同步设置

云端同步使用 Supabase。Supabase 的 anon public key 可以放在前端，但不要放 service role key、database password、JWT secret。

### 1. 创建 Supabase project

1. 去 https://supabase.com 新建 project。
2. 进入 `Authentication` -> `Providers`。
3. 开启 Email provider。
4. 如果你不想每次注册都确认邮件，可以在 Email provider 里关闭 confirm email。

### 2. 创建资料表

进入 Supabase `SQL Editor`，执行：

```sql
create table if not exists public.evidence_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date text not null,
  text text not null,
  action text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists evidence_entries_user_date_idx
on public.evidence_entries (user_id, date desc, updated_at desc);

alter table public.evidence_entries enable row level security;

drop policy if exists "Users can read own evidence" on public.evidence_entries;
drop policy if exists "Users can insert own evidence" on public.evidence_entries;
drop policy if exists "Users can update own evidence" on public.evidence_entries;
drop policy if exists "Users can delete own evidence" on public.evidence_entries;

create policy "Users can read own evidence"
on public.evidence_entries
for select
using (auth.uid() = user_id);

create policy "Users can insert own evidence"
on public.evidence_entries
for insert
with check (auth.uid() = user_id);

create policy "Users can update own evidence"
on public.evidence_entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own evidence"
on public.evidence_entries
for delete
using (auth.uid() = user_id);
```

### 3. 如果你以前用过旧表结构

旧版本曾经使用 `primary key (user_id, date)`，同一天只能保存一条云端记录。现在建议迁移成 `primary key (user_id, id)`，这样同一天可以保存多句证据。

如果你的表已经存在，执行：

```sql
alter table public.evidence_entries
add column if not exists id text;

update public.evidence_entries
set id = date || '-' || extract(epoch from coalesce(updated_at, now()))::bigint
where id is null;

alter table public.evidence_entries
alter column id set not null;

alter table public.evidence_entries
drop constraint if exists evidence_entries_pkey;

alter table public.evidence_entries
add constraint evidence_entries_pkey primary key (user_id, id);

create index if not exists evidence_entries_user_date_idx
on public.evidence_entries (user_id, date desc, updated_at desc);
```

### 4. 填写 `config.js`

去 Supabase `Project Settings` -> `API`，复制：

- Project URL
- anon public key

然后修改 `config.js`：

```js
window.RICH_APP_CONFIG = {
  supabaseUrl: "https://你的-project-ref.supabase.co",
  supabaseAnonKey: "你的 anon public key"
};
```

注意：

- `supabaseUrl` 只填 `https://xxxx.supabase.co`。
- 不要填 `/rest/v1`、`/auth/v1`、`/project` 之类路径。
- 不要把 service role key 放进 `config.js`。

## 本地打开

如果只是本地看页面，可以直接打开：

```text
index.html
```

但完整 PWA、缓存更新、手机安装体验会在 HTTPS GitHub Pages 上更稳定。

## 发布更新

在本机项目目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-config.ps1
```

发布脚本会：

- 检查 `config.js` 是否疑似包含私密 key。
- stage 主要项目文件。
- commit。
- pull --rebase。
- push 到 GitHub `main`。

## 工程文档

- `REQUIREMENTS.md`：产品目标、用户、功能需求、验收标准、边界。
- `TEST_PLAN.md`：发布前测试清单、云端同步测试、导入过滤测试、PWA 更新测试。

## 发布前检查

```powershell
node --check app.js
node --check sw.js
git status --short
```

如果改了用户能看到的 app 内容，请同步更新：

- `app.js` 里的 `APP_VERSION`
- `sw.js` 里的 `CACHE_NAME`

这样手机 app 才比较容易拿到新版本。

## 安全说明

- Supabase anon public key 不是 service role secret，可以在前端使用。
- 真正保护资料的是 Supabase Row Level Security。
- 必须开启 RLS，并确保 policies 使用 `auth.uid() = user_id`。
- 不要提交 service role key、database password、JWT secret。
- 这个 app 只适合个人成长记录，不是金融、法律、税务建议。
