---
name: premium-ui-design
description: Guidelines and technical specifications for creating high-end, "Digital Premium" web interfaces with a focus on immersive aesthetics and fluid interaction.
---

# Premium UI Design & High-End Aesthetics

此 Skill 旨在規範如何構建具有「高級感」、「呼吸感」與「沉浸式體驗」的現代網頁設計。高品質的 UI 不僅僅是視覺上的美觀，更是細節處理、材質表達與互動心理的綜合展現。

## 1. 核心設計支柱 (Core Pillars)

### A. 呼吸感與負空間 (Breathing Room & Negative Space)

- **原則**：寧可留白過多，不可過度擁擠。高級感的本質是「餘裕」。
- **要點**：
    - **Grid 佈局**：使用 4x3 或 3x4 等平衡的網格，避免 6x2 或 8x1 這種過於緊密的佈局。
    - **一致的容器規格**：切換不同面板（如日曆與年月選取）時，應保持容器的 `width`, `height`, `bottom`, `margin` 完全一致，防止視覺跳動。
    - **行高與內距**：互動元件（如日期格子、按鈕）要有明確的最小高度 (`min-height`) 與內距 (`padding`)。

### B. 材質與深度 (Material & Depth)

- **原則**：使用物理世界的材質感規避「數位廉價感」。
- **要點**：
    - **磨砂玻璃 (Glassmorphism)**：使用 `backdrop-filter: blur(20px)` 配合高飽和度。
    - **噪點紋理 (Grain/Noise)**：在玻璃背景中加入輕微的噪點 (`fractalNoise`)，增加物理觸感。
    - **極簡邊框**：使用非常細且半透明的邊框 (`1px solid rgba(255,255,255,0.15)`)，而不是實體線條。

### C. 字體排版 (Typography)

- **原則**：混合使用高品質的 Serif (襯線體) 與 Sans-serif (無襯線體)。
- **要點**：
    - **數字高級化**：數字應優先選用具有古典比例的襯線體 (如 `Playfair Display`)。
    - **字元間距 (Letter Spacing)**：標題與導航文字應適度加大 `0.1em` ~ `0.2em` 的間距。
    - **對齊心理**：功能性列表使用左對齊（專業感），標題或引導性文字可嘗試居中（平衡感）。

### D. 動效與心理 (Motion & Emotion)

- **原則**：動畫應遵循「彈性物理」，而非線性運動。
- **要點**：
    - **Bezier 曲線**：全面捨棄 `ease` 或 `linear`。使用 `cubic-bezier(0.2, 0.8, 0.2, 1)` 或 `cubic-bezier(0.34, 1.56, 0.64, 1)`。
    - **互動反饋**：點擊狀態 (`:active`) 應有微細的縮放 (`scale(0.96)`)。

### E. 職人精神與靈魂 (Soul of Craftsmanship)

- **原則**：UI 必須具備「模式靈魂」，讓色彩與功能形成一種直覺的「共生關係」。
- **要點**：
    - **功能色系歸屬感 (Functional Symbiosis)**：
        - 不同的操作模態（如「日曆」與「映畫」）應具備鮮明的專屬配色。
        - **全域同步 (Global Sync)**：當模式切換時，導覽箭頭、控制按鈕、甚至狀態動畫（如音樂律動）必須「同秒、同步」更換色系。
        - **降低認知負荷**：配色不僅是美觀，更是一種低成本的「功能指南」。例如：金色 = 時間/翻月，銀色 = 影像/翻圖。
    - **動態槽位佈局 (Dynamic Slotting)**：
        - 採用中心化、可替換的功能槽位。將次要功能（如藝廊選單、年月切換）置於中央圖標化區域，節省橫向空間，同時保持視覺平衡。

## 2. 色彩體系 (Color Systems)

- **避免死色**：不要使用純紅、純黃。使用具歷史層次感的色彩（如「宮牆紅」、「香檳金」）。
- **語義變數**：在 `base.css` 定義語義化變數，如 `--color-festive-red`, `--color-accent-gold`。
- **微光 (Glow)**：使用 `box-shadow: 0 0 20px rgba(gold, 0.2)` 營造光暈感。

## 3. 技術開發檢查表 (Technical Checklist)

- [ ] **響應式單位**：是否使用 `dvh` / `dvw` 確保手機端高度完美適配？
- [ ] **視圖穩定性**：切換元件時，底層容器位置是否固定？
- [ ] **層次處理**：Z-index 是否清晰定義（如浮動面板要在 2000 以上）？
- [ ] **交互降噪**：是否在特定操作下隱藏不必要的 UI（如查看細節時隱藏導航）？
- [ ] **色彩同步**：切換模式時，導覽步進鍵與狀態動畫是否已同步變換色系歸屬？

---

_此設計準則應在所有追求「旗艦級體驗」的專案中強制執行。_
