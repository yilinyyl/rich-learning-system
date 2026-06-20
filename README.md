# 富有学习系统

一个极简手机优先 PWA。它只做一件事：每天给你一个小行动，做 5 分钟，写一句证据。

页面会尝试从公开网络来源抓取 AI、创业、技术机会相关资料，生成每天的 online key points。网络失败时会显示备用重点。

## 使用

打开：

```text
C:\Users\Internet\Documents\rich!\index.html
```

## 每天只做两步

1. 做页面上的第一件小事 5 分钟。
2. 写一句行动证据。

这个系统故意很简单，因为真正重要的是每天开始，而不是填很多表。

## Engineering docs

- `REQUIREMENTS.md`：记录用户、目标、功能需求、验收标准和边界。
- `TEST_PLAN.md`：记录每次发布前应该检查的功能、云端同步、导入过滤和 PWA 更新。

## 手机 App

项目已经包含 PWA 文件：`manifest.json`、`sw.js`、`icons/icon.svg`。

部署到 HTTPS 后，用手机浏览器打开，再选择“加入主屏幕”或“安装应用”。

部署到线上后，在线刷新体验会比本地 `file://` 更稳定。

## GitHub Pages 发布

1. 在 GitHub 新建一个 public repository，例如 `rich-learning-system`。
2. 把本文件夹里的所有文件上传到 repository 根目录。
3. 打开 repository 的 `Settings`。
4. 进入 `Pages`。
5. Source 选择 `GitHub Actions`。
6. 上传或 push 文件后，打开 `Actions`，等待 `Deploy GitHub Pages` 运行完成。
7. 打开 `Settings` -> `Pages`，复制 GitHub 生成的 HTTPS 网址。

Updated for GitHub Pages.
手机打开这个 HTTPS 网址后：

- iPhone Safari：分享按钮，选择“加入主屏幕”。
- Android Chrome：菜单，选择“安装应用”或“添加到主屏幕”。

## 云端历史同步

如果想换手机后还能看到历史，需要连接 Supabase。

1. 去 https://supabase.com 新建一个 project。
2. 在 `Authentication` -> `Providers` 里开启 Email。
3. 如果你不想注册时确认邮件，可以在 Email provider 里关闭 confirm email；如果保持开启，注册后要去邮箱点确认。
4. 在 `SQL Editor` 执行：

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

如果你之前已经建过旧表，而且旧表是 `primary key (user_id, date)`，请先执行这个迁移，让云端可以保存同一天的多句证据：

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

5. 在 Supabase `Project Settings` -> `API` 复制 Project URL/API URL 和 anon public key。
6. 打开 `config.js`，填入：

```js
window.RICH_APP_CONFIG = {
  supabaseUrl: "https://你的projectref.supabase.co",
  supabaseAnonKey: "你的 anon public key"
};
```

7. 运行发布脚本上传到 GitHub Pages。
8. 手机打开 app，用 email + password 注册或登录。
