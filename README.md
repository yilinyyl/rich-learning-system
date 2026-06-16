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
