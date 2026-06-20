# 富有学习系统

一个手机优先的个人成长 PWA。它把“我要变富有”拆成每天可以开始的两步：

1. 做一个 5 到 15 分钟的小行动。
2. 写一句以“我是...”开头的行动证据。

这个 app 不是投资建议，也不会保证赚钱。它的用途是帮你每天积累注意力、学习力、机会感、行动证据，以及更具体的富有生活想象。

## 这个 app 适合谁

- 有正式工作或稳定收入，但想慢慢建立新的财富能力。
- 不是 AI 或软件背景，希望学习入口简单一点。
- 不想填复杂表格，只想每天知道第一步做什么、第二步写什么。
- 想在手机上打开，并长期回顾自己写过的“我是...”证据。

## 主要功能

- 两步行动：第一步做小行动，第二步写“我是...”证据。
- 证据历史：可以回顾以前写过的句子。
- 云端同步：连接 Supabase 后，换手机也能恢复历史。
- 富有生活想象：显示具体、容易想象的财富生活画面。
- 读书重点导入：可以导入 `.md` 或 `.txt`，只保留干净的中文句子重点。
- Online key points：优先读取 Horizon 英文日报，失败时显示备用重点。
- PWA：可以通过 GitHub Pages 部署，并添加到手机主屏幕。

## 如果你只是想使用

1. 用手机浏览器打开部署后的 HTTPS 网址。
2. iPhone Safari：点分享按钮，选择“加入主屏幕”。
3. Android Chrome：点菜单，选择“安装应用”或“添加到主屏幕”。
4. 打开 app 后，每天只做两件事：
   - 完成第一步的小行动。
   - 写一句“我是...”证据。

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
