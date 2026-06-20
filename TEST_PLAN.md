# 富有学习系统 Test Plan

## 1. Purpose

这个测试计划用于每次发布前检查 app 是否仍然符合核心需求。重点不是追求复杂测试，而是避免重复出现已经遇到过的问题：手机不更新、历史丢失、导入脏数据、云端保存不清楚、UI 太复杂。

## 2. Pre-Release Checklist

Run these checks before publishing:

```powershell
node --check app.js
node --check sw.js
git status --short
```

Expected result:

- `node --check` prints no syntax errors.
- `git status --short` shows only intended files before publishing.

## 3. Manual Test Cases

### TC-1 App Loads

Steps:
1. Open `index.html` locally or open the GitHub Pages URL.
2. Confirm the page shows the app title.
3. Confirm the page shows the first-step and second-step cards.

Expected result:
- No blank page.
- First step and second step are visually separate.
- App version is visible.

### TC-2 First Step Completion

Steps:
1. Check “我完成了第一步”.
2. Refresh the page.

Expected result:
- The checkbox state is saved locally.

### TC-3 Evidence Save

Steps:
1. Type an “我是...” sentence.
2. Confirm it appears in history.
3. Click “保存并换下一个”.
4. Type a second “我是...” sentence.

Expected result:
- Both sentences appear in history.
- The second sentence does not overwrite the first local history entry.

### TC-4 Cloud Login

Precondition:
- Supabase is configured in `config.js`.
- Email/password provider is enabled.
- RLS is enabled.

Steps:
1. Register or log in.
2. Type an “我是...” sentence.
3. Wait for cloud save status.
4. Open the app on another browser/device and log in with the same account.

Expected result:
- Cloud status says the entry was saved.
- Same account can see the entry on another device.

### TC-5 Cloud Account Isolation

Steps:
1. Log in as account A and save evidence.
2. Log out.
3. Log in as account B.

Expected result:
- Account B cannot see account A history.

If this fails:
- Check Supabase RLS is enabled.
- Check policies use `auth.uid() = user_id`.

### TC-6 Cloud Per-Entry History

Precondition:
- Supabase table has the newer `id` column and primary key `(user_id, id)`.

Steps:
1. Log in.
2. Save two different “我是...” sentences on the same day.
3. Refresh or open on another device.

Expected result:
- Both entries are restored independently.
- They are not merged into one cloud row.

If this fails:
- Run the migration SQL in `README.md`.

### TC-7 Old Cloud Schema Fallback

Precondition:
- Supabase still uses the old primary key `(user_id, date)`.

Steps:
1. Log in.
2. Save evidence.

Expected result:
- App does not crash.
- Cloud status explains that the old schema was used and migration is needed for independent entries.

### TC-8 WeRead Markdown Import

Steps:
1. Import a `.md` file containing Chinese highlights and metadata.
2. Include lines such as `doc_type: weread-highlights-reviews`, `lastReadDate: 2026-05-25`, chapter headings, and `^3300105762-12-2806-`.

Expected result:
- Metadata does not appear.
- Obsidian block IDs do not appear.
- Chinese sentence highlights appear.

### TC-9 Rich Life Refresh

Steps:
1. Open “有钱人的世界是什么样？”
2. Click refresh.

Expected result:
- Content updates.
- No GitHub/DEV/Horizon technical text appears in this section.
- Sentences are concrete and easy to imagine.

### TC-10 Online Key Points

Steps:
1. Open “今天 3 个 online key points”.
2. Click refresh.
3. Test once with network available and once when network is unavailable if possible.

Expected result:
- With network, Horizon items or live items appear.
- Without network, fallback key points appear.
- Page does not crash.

### TC-11 PWA Cache Update

Steps:
1. Change user-visible app content.
2. Bump `APP_VERSION` in `app.js`.
3. Bump `CACHE_NAME` in `sw.js`.
4. Publish.
5. Refresh the phone app.

Expected result:
- Phone eventually receives the new version.
- Version text changes.

## 4. Security Checklist

- `config.js` contains only Supabase Project URL and anon public key.
- No `service_role` key is committed.
- No database password is committed.
- Supabase RLS is enabled on `evidence_entries`.
- Policies restrict select/insert/update to `auth.uid() = user_id`.

## 5. Regression Risks

- Changing `app.js` may break local history or cloud sync.
- Changing `sw.js` without bumping cache can make phones show stale UI.
- Changing WeRead filters can accidentally hide useful Chinese highlights.
- Changing UI copy can make the two-step flow feel confusing again.

## 6. Release Command

After checks pass:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-config.ps1
```
