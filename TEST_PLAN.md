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
3. Confirm the page shows the first-step, second-step, and third-step cards.

Expected result:
- No blank page.
- First step, second step, and third step are visually separate.
- App version is visible.

### TC-2 First Step Selection and Completion

Steps:
1. Select one quick action related to inner wealth growth, such as manifestation visualization, abundance evidence, gratitude for money, a calmer body, a clearer home space, or awareness learning.
2. Edit the first-step action field.
3. Click “优化我写的第一步”.
4. Choose one polished first-step sentence.
5. Check “我完成了第一步”.
6. Refresh the page.

Expected result:
- The selected/custom action is saved locally.
- The selected quick action stays visually highlighted even after the user edits the first-step action field.
- The optimized action replaces the first-step action field.
- The checkbox state is saved locally.
- The quick action is concrete enough to start within 5 to 10 minutes.
- The quick action does not feel purely practical or overly business-like.

### TC-3 Evidence and Future Identity Save

Steps:
1. Select or type a first-step action.
2. Type a second-step “我是...” action evidence sentence.
3. Type a third-step “我是...” future identity sentence.
4. Confirm no new history entry appears before saving.
5. Click save / next.
6. Confirm the combined entry appears in history.
7. Type and save a second entry.

Expected result:
- The saved history entry stores first step, second step, and third step.
- Typing, choosing quick actions, clicking optimize, or choosing optimized suggestions does not save history by itself.
- Both entries appear in history.
- The second entry does not overwrite the first local history entry.
- The visible history shows one “我是...” identity sentence per entry without displaying the full first-step action block.

### TC-3A Identity Writing Helper

Steps:
1. Open the second-step evidence field.
2. Type one custom “我是...” sentence.
3. Click “优化并展开我这句”.
4. If logged in and the Edge Function is deployed, wait for AI suggestions.
5. If AI is unavailable, confirm the app shows a clear fallback message and local suggestions.
6. Choose one polished sentence.
7. Confirm history still does not change until clicking “保存今天这三步”.
8. Repeat the same flow in the third-step future identity field.

Expected result:
- Polished suggestions are shown only after the optimize click.
- AI suggestions preserve the user's original meaning and do not change topic.
- Choosing a polished sentence replaces the correct field.
- The helper does not expose `OPENROUTER_API_KEY` in browser files.

### TC-3D AI Edge Function

Precondition:
- Supabase is configured.
- User is logged in.
- `OPENROUTER_API_KEY` is set as a Supabase Function secret.
- `OPENROUTER_MODEL` is set, or the function falls back to `openrouter/free`.
- `polish-identity` Edge Function is deployed.

Steps:
1. Type `我是一个慢慢进入富足状态的人。`
2. Click “优化并展开我这句”.
3. Inspect returned suggestions.
4. Turn off or undeploy the function and retry.

Expected result:
- When deployed, AI returns several “我是...” suggestions related to the original sentence.
- Suggestions do not mention AI, prompt, model, or source.
- When unavailable, the app displays a clear error and local fallback suggestions.
- No history or Supabase evidence row is created until the user clicks “保存今天这三步”.

### TC-3B Three-Day History Display

Steps:
1. Create or restore history entries across at least 4 different dates.
2. Open the history section.

Expected result:
- The visible history only shows entries from the latest 3 calendar dates.
- Older entries are not shown in the history section.
- Multiple entries from the same visible date can still appear separately.
- The same “我是...” sentence does not appear repeatedly across history cards.

### TC-3C Delete History Item

Steps:
1. Save one history item.
2. Click “删除这条”.
3. Confirm the delete prompt.

Expected result:
- The item disappears from local history.
- If logged in, the app attempts to delete the matching Supabase row.

### TC-4 Cloud Login

Precondition:
- Supabase is configured in `config.js`.
- Email/password provider is enabled.
- RLS is enabled.

Steps:
1. Register or log in.
2. Type a complete three-step entry.
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
2. Save two different three-step entries on the same day.
3. Refresh or open on another device.

Expected result:
- Both entries are restored independently.
- They are not merged into one cloud row.

If this fails:
- Run the migration SQL in `README.md`.

### TC-6B Refresh Does Not Create Cloud Duplicates

Precondition:
- User is logged in.
- Supabase table uses the newer `id` column.

Steps:
1. Save one “我是...” sentence.
2. Check Supabase `evidence_entries` row count for that user.
3. Refresh the app 3 times.
4. Check Supabase `evidence_entries` row count again.

Expected result:
- Refreshing does not add new rows.
- The same “我是...” sentence appears only once in `evidence_entries`.

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
- Changing UI copy can make the three-step flow feel confusing again.

## 6. Release Command

After checks pass:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-config.ps1
```
