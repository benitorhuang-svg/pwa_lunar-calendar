# 🏮 農民曆 PWA - 數位農曆 (Lunar Calendar)

[![Deploy to GitHub Pages](https://github.com/benitorhuang-svg/pwa_lunar-calendar/actions/workflows/deploy.yml/badge.svg)](https://github.com/benitorhuang-svg/pwa_lunar-calendar/actions/workflows/deploy.yml)

這是一個結合傳統農曆文化與現代極簡設計的 **數位農民曆**。採用 **Astro** 框架開發，具備完整的 PWA (Progressive Web App) 能力，為使用者提供最純粹、優雅的歲月交互體驗。

---

## 🔗 線上體驗 (PWA)

您可以透過下方連結直接在瀏覽器中使用，或將其「安裝」至您的主畫面以獲得原生應用程式般的體驗：

### 🌐 [立即開啟：農民曆 PWA](https://benitorhuang-svg.github.io/pwa_lunar-calendar/)

---

## ✨ 核心特色

### 🎨 數位視覺 (Digital Premium)

- **沉浸式氛圍**: 自動切換的四季景觀背景，搭配優雅的「今日宜忌」卡片。
- **毛玻璃質感**: 採用現代 Glassmorphism 設計，所有介面元件皆具備細膩的穿透感與圓角。
- **動態轉場**: 優化的 5 秒/10 秒閒置自動沉浸邏輯，讓 App 在無操作時變身為精美的數位掛曆。

### 🎵 禪意聽覺體驗

- **東方音樂**: 內建多首精選蟬意背景音樂，支持自動循環與隨機播放。
- **智慧切換**: 巧妙的「暫停即預備下一首」設計，讓音律隨心而動。

### ⛩️ 傳統與現代的融合

- **精準算法**: 採用 `lunar-javascript` 核心，提供準確的農曆、節氣、干支與宜忌資訊。
- **文化主體**: 以農曆作為視覺核心，西曆作為輔助座標，回歸華人文化的時光節奏。

---

## 🛠️ 技術棧

- **Frontend**: [Astro](https://astro.build/) + Vanilla JS + CSS3
- **PWA**: `@vite-pwa/astro` (Service Worker, Offline Support)
- **Deployment**: GitHub Actions (CI/CD)
- **Design Strategy**: 請參考 [SDD (Software Design Document)](./SDD/spec-context.md)

---

## 🚀 快速上手

### 開發環境設定

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 部署

本專案已配置 GitHub Actions。任何推送到 `main` 分支的更動都會自動觸發建置並部署至 GitHub Pages。

---

## 📜 專案文檔 (SDD)

- [規格與設計描述 (Spec Context)](./SDD/spec-context.md)
- [視覺設計規範 (UI/UX Context)](./SDD/ui_ux_design_context.md)
- [技術架構說明 (Tech Context)](./SDD/tech_context.md)

---

_願這份數位工藝品能為您的生活帶來一絲安寧。_
