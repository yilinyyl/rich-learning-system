# 富有学习系统 Requirements

## 1. Product Goal

这个 app 是一个 personal learning and wealth identity system。它不是投资建议工具，也不是直接赚钱工具。它的目标是每天让用户完成一个很小的行动，并把行动写成一句“我是...”证据，长期积累注意力、学习力、机会感和财富身份。

## 2. Primary User

- 用户有正式稳定工作和收入。
- 用户不是 AI 背景，不想一开始就学复杂技术词。
- 用户喜欢后端、系统、信息整理，不喜欢做复杂 frontend。
- 用户希望手机上能打开，并像有一个人提醒自己下一步做什么。
- 用户不想填很多表，希望每次只看到简单、可开始的动作。

## 3. Core User Journey

1. 用户打开手机 app。
2. 用户看到“第一步：小行动”，可以选择建议动作，也可以自己填写 5 到 10 分钟内真实做了什么。
3. 用户勾选完成第一步。
4. 用户看到“第二步：行动证据”，根据第一步写一句以“我是...”开头的话。
5. 用户看到“第三步：未来身份”，根据希望成为的人再写一句以“我是...”开头的话。
6. 用户保存三步记录。
7. 用户之后可以在历史里回顾自己写过的证据。
8. 如果登录 Supabase，同一个账号换手机后也能恢复历史。

## 4. Functional Requirements

### FR-1 Daily Action

- App must show one suggested small action at a time.
- App must allow the user to select from quick actions or type their own real action.
- Each action must be understandable without AI or software background.
- Each action should be small enough to start within 5 to 10 minutes.
- Quick actions should support wealth growth through both practical action and inner state, such as abundance evidence, gratitude for money, manifestation visualization, a calmer body, a clearer home space, or learning that raises awareness.

Acceptance criteria:
- Page shows a first-step card.
- Action title and detail are visible.
- User can choose a quick action or type a custom action.
- User can check completion.
- Quick action choices are concrete enough that the user knows exactly what to do in 5 to 10 minutes.

### FR-2 Identity Evidence

- App must provide a second-step area for writing an “我是...” sentence.
- The second-step sentence should be based on the first-step action.
- App must save the sentence locally while the user types.
- App must keep multiple evidence entries, including multiple entries on the same day.
- History display should stay lightweight by showing only the latest 3 calendar dates.
- History display should show one identity sentence per entry, not the full first-step action block.

Acceptance criteria:
- User can type evidence.
- Evidence appears in history.
- Two different saved sentences from the same day both appear in history.
- History does not show more than the latest 3 dates.
- Each visible history entry is compact and does not expand into multiple identity lines.

### FR-2B Future Identity

- App must provide a third-step area for writing an “我是...” future identity sentence.
- The third-step sentence should be based on who the user hopes to become.
- The saved history entry should include the first-step action, second-step evidence, and third-step future identity.

Acceptance criteria:
- User can type a future identity sentence.
- The future identity appears in history with the same saved entry.
- Saving and moving to the next action clears the third-step input.

### FR-3 Cloud Sync

- App should support Supabase email/password login.
- App should save each evidence sentence as an independent cloud record when the Supabase table has the newer `id` column.
- App should not expose service role keys or database passwords.
- App should degrade gracefully if Supabase is not configured or still uses the old one-row-per-day schema.

Acceptance criteria:
- Logged-in user can save evidence.
- Same account can read cloud history on another device.
- Different accounts only see their own records when RLS is enabled.
- If the cloud schema is old, the app shows a migration hint instead of silently failing.

### FR-4 Rich Life Imagination

- App must show concrete, empowering wealth-life scenes.
- Sentences should be simple and visual.
- Content should avoid technical feeds such as GitHub/DEV in this section.

Acceptance criteria:
- Rich-life section shows travel, health, home support, learning, giving, assets, or freedom scenes.
- Refresh changes the displayed scene set.

### FR-5 WeRead / Markdown Highlights

- App must import `.md` or `.txt` files.
- App must keep only useful Chinese sentence-like highlights.
- App must filter metadata such as `doc_type`, `lastReadDate`, URLs, chapter headings, page numbers, and Obsidian block IDs.

Acceptance criteria:
- Imported highlights do not show metadata.
- Imported highlights do not show chapter headings.
- Chinese sentence highlights appear in the reading section.

### FR-6 Online Key Points

- App should fetch Horizon English daily feed when possible.
- App should fall back to local key points if online fetching fails.
- Online key points should be learning-oriented, not social-media-oriented.

Acceptance criteria:
- Refresh online key points does not break the page when network fails.
- Fallback key points are shown when live data cannot be fetched.

### FR-7 PWA and Publishing

- App should run as a static GitHub Pages site.
- App should include PWA manifest and service worker.
- Every user-visible app change should bump `APP_VERSION` and `CACHE_NAME`.

Acceptance criteria:
- `manifest.json` exists.
- `sw.js` exists.
- GitHub Pages can serve the app.
- Mobile refresh eventually picks up the new cache version.

## 5. Non-Functional Requirements

- Simplicity: the main workflow must stay three clear steps.
- Comfort: visual design should be calm and readable on mobile.
- Safety: no illegal wealth advice, no gambling, no tax evasion, no fraud, no secret keys in public files.
- Privacy: cloud records must be separated by Supabase user ID and protected by RLS.
- Maintainability: major behavior should be documented in this file and covered by `TEST_PLAN.md`.

## 6. Out of Scope

- Real financial advice.
- Automatic trading or investment execution.
- Guaranteed wealth outcomes.
- Native iOS/Android app store release.
- Full push notifications, unless added as a later project.

## 7. Open Decisions

- Whether to add real scheduled push notifications later.
- Whether to split `app.js` into modules after the app stabilizes.
- Whether to add automated browser tests with Playwright.
