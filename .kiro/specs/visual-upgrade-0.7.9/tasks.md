# Implementation Plan: Visual Upgrade 0.7.9.5 - 0.7.9.7

## Overview

本实现计划分为三个独立版本，每个版本可单独发布。任务按依赖顺序排列，确保增量开发和测试。

## Tasks

### Phase 1: Alpha 0.7.9.5 - 国际象棋风格棋盘

- [x] 1. 实现国际象棋棋盘皮肤
  - [x] 1.1 在 style.css 添加 `.board.skin-chess` 基础样式
    - 定义棋盘边框样式（深色木质/金属边框）
    - 设置棋盘背景色
    - _Requirements: 1.6_
  
  - [x] 1.2 实现黑白格子交替样式
    - 添加 `.cell.chess-white` 大理石纹理样式
    - 添加 `.cell.chess-black` 黑曜石纹理样式
    - 使用 CSS 渐变模拟材质
    - _Requirements: 1.2, 1.4, 1.5_
  
  - [x] 1.3 在 game_render.js 扩展 applyBoardSkin() 函数
    - 添加 'chess' 皮肤分支
    - 实现 applyChessPattern() 函数
    - 基于 (row + col) % 2 为每个 cell 添加对应类
    - _Requirements: 1.2, 1.3_
  
  - [x] 1.4 在 game_ui.js 添加棋盘选择器选项
    - 在 selectBoardSkin() 添加 'chess' 分支
    - 在 updateBoardSelectorUI() 添加 'chess' 高亮逻辑
    - 在 updateBoardEntryPreview() 添加 'chess' 预览
    - _Requirements: 1.1, 1.7_
  
  - [x] 1.5 在 index.html 添加棋盘选择器 UI 元素
    - 添加 boardGridChess 选项卡
    - 添加迷你预览样式
    - _Requirements: 1.1, 1.7_
  
  - [x] 1.6 在 lang.js 添加多语言翻译
    - 添加 boardChess 翻译键（繁中/简中/英文）
    - _Requirements: 6.1_
  
  - [x] 1.7 添加移动端适配样式
    - 在 @media (max-width: 600px) 添加简化样式
    - _Requirements: 1.8_

- [x] 2. Checkpoint - 国际象棋棋盘测试
  - 确保所有测试通过，验证棋盘在各设备上显示正常
  - 如有问题请询问用户


### Phase 2: Alpha 0.7.9.6 - 冰/火主题棋子

- [ ] 3. 扩展 GameState 支持新主题系统
  - [ ] 3.1 在 gamestate.js 添加主题相关属性
    - 添加 currentPieceTheme 属性
    - 添加 pieceEffectSettings 对象
    - 添加向后兼容的全局变量
    - _Requirements: 4.3_

- [ ] 4. 实现冰晶棋子样式
  - [ ] 4.1 在 css/pieces.css 添加冰晶棋子基础样式
    - 定义 `.piece.skin-ice-fire.p1` 样式
    - 使用多层渐变模拟冰晶透明质感
    - 添加内部光折射效果
    - _Requirements: 2.2, 2.4_
  
  - [ ] 4.2 添加冰晶棋子动画效果
    - 添加微妙的闪烁动画
    - 添加霜冻边缘效果
    - _Requirements: 2.4_

- [ ] 5. 实现火焰棋子样式
  - [ ] 5.1 在 css/pieces.css 添加火焰棋子基础样式
    - 定义 `.piece.skin-ice-fire.p2` 样式
    - 使用多层渐变模拟火焰核心
    - 添加发光效果
    - _Requirements: 2.3, 2.5_
  
  - [ ] 5.2 添加火焰棋子动画效果
    - 添加火焰摇曳动画
    - 添加边缘火焰效果
    - _Requirements: 2.5_

- [ ] 6. 实现冰晶落子特效
  - [ ] 6.1 在 css/pieces.css 添加冰晶特效 CSS
    - 定义霜冻扩散环样式
    - 定义冰晶粒子样式
    - 定义寒气雾效样式
    - _Requirements: 2.8_
  
  - [ ] 6.2 在 game_render.js 实现 createIceEffect() 函数
    - 创建霜冻扩散环动画
    - 创建冰晶粒子飞散
    - 根据特效强度调整粒子数量
    - _Requirements: 2.8, 2.10_

- [ ] 7. 实现火焰落子特效
  - [ ] 7.1 在 css/pieces.css 添加火焰特效 CSS
    - 定义火焰爆发核心样式
    - 定义火星粒子样式
    - 定义热浪扭曲效果
    - _Requirements: 2.9_
  
  - [ ] 7.2 在 game_render.js 实现 createFireEffect() 函数
    - 创建火焰爆发动画
    - 创建火星粒子飞散
    - 根据特效强度调整粒子数量
    - _Requirements: 2.9, 2.10_

- [ ] 8. 实现冰/火落子音效
  - [ ] 8.1 在 audio_sfx.js 添加 playIceStone() 函数
    - 使用高频正弦波模拟冰晶清脆声
    - 添加玻璃碎裂噪音层
    - _Requirements: 2.6_
  
  - [ ] 8.2 在 audio_sfx.js 添加 playFireStone() 函数
    - 使用低频噪音模拟火焰噼啪声
    - 添加爆裂音效层
    - _Requirements: 2.7_

- [ ] 9. 实现冰/火主题 UI
  - [ ] 9.1 在 game_render.js 扩展 renderPieceInCell() 函数
    - 添加 'ice_fire' 主题分支
    - 根据玩家应用对应样式类
    - _Requirements: 2.2, 2.3_
  
  - [ ] 9.2 在 game_render.js 扩展 placePiece() 函数
    - 添加主题音效调用逻辑
    - 添加主题特效调用逻辑
    - _Requirements: 2.6, 2.7, 2.8, 2.9_
  
  - [ ] 9.3 在 game_ui.js 添加冰火主题选择器
    - 添加 pieceGridIceFire 选项
    - 实现选择和高亮逻辑
    - _Requirements: 2.1_
  
  - [ ] 9.4 在 game_ui.js 实现冰火特效调节面板
    - 实现长按进入二级面板
    - 添加特效强度选择器（关/低/中/高）
    - _Requirements: 2.10_
  
  - [ ] 9.5 在 index.html 添加冰火主题 UI 元素
    - 添加棋子选择器选项
    - 添加特效调节面板 HTML
    - _Requirements: 2.1, 2.10_
  
  - [ ] 9.6 在 lang.js 添加冰火主题翻译
    - 添加 skinIceFire, pieceIce, pieceFire 翻译键
    - 添加特效面板相关翻译
    - _Requirements: 6.1, 6.2_

- [ ] 10. Checkpoint - 冰/火主题测试
  - 确保所有测试通过，验证冰火主题在各设备上显示正常
  - 验证音效和特效正确触发
  - 如有问题请询问用户


### Phase 3: Alpha 0.7.9.7 - 神圣/邪恶主题棋子

- [ ] 11. 实现神圣棋子样式
  - [ ] 11.1 在 css/pieces.css 添加神圣棋子基础样式
    - 定义 `.piece.skin-holy-evil.p1` 样式
    - 使用金白渐变模拟神圣光芒
    - 添加光环效果
    - _Requirements: 3.2, 3.4_
  
  - [ ] 11.2 添加神圣棋子动画效果
    - 添加光芒脉动动画
    - 添加神圣光环旋转效果
    - _Requirements: 3.4_

- [ ] 12. 实现邪恶棋子样式
  - [ ] 12.1 在 css/pieces.css 添加邪恶棋子基础样式
    - 定义 `.piece.skin-holy-evil.p2` 样式
    - 使用暗紫黑渐变模拟暗影核心
    - 添加腐蚀能量效果
    - _Requirements: 3.3, 3.5_
  
  - [ ] 12.2 添加邪恶棋子动画效果
    - 添加暗影脉动动画
    - 添加能量触须效果
    - _Requirements: 3.5_

- [ ] 13. 实现神圣落子特效
  - [ ] 13.1 在 css/pieces.css 添加神圣特效 CSS
    - 定义神圣光环扩散样式
    - 定义向上飘升光粒子样式
    - 定义十字光芒样式
    - _Requirements: 3.8_
  
  - [ ] 13.2 在 game_render.js 实现 createHolyEffect() 函数
    - 创建神圣光环扩散动画
    - 创建向上飘升的光粒子
    - 根据特效强度调整粒子数量
    - _Requirements: 3.8, 3.10_

- [ ] 14. 实现邪恶落子特效
  - [ ] 14.1 在 css/pieces.css 添加邪恶特效 CSS
    - 定义暗影腐蚀扩散样式
    - 定义向下沉降暗影粒子样式
    - 定义紫色能量脉冲样式
    - _Requirements: 3.9_
  
  - [ ] 14.2 在 game_render.js 实现 createEvilEffect() 函数
    - 创建暗影腐蚀扩散动画
    - 创建向下沉降的暗影粒子
    - 根据特效强度调整粒子数量
    - _Requirements: 3.9, 3.10_

- [ ] 15. 实现神圣/邪恶落子音效
  - [ ] 15.1 在 audio_sfx.js 添加 playHolyStone() 函数
    - 使用和弦音模拟天籁圣歌
    - 添加高频泛音层
    - _Requirements: 3.6_
  
  - [ ] 15.2 在 audio_sfx.js 添加 playEvilStone() 函数
    - 使用低频嗡鸣模拟黑暗共鸣
    - 添加不和谐音层
    - _Requirements: 3.7_

- [ ] 16. 实现神圣/邪恶主题 UI
  - [ ] 16.1 在 game_render.js 扩展主题渲染逻辑
    - 在 renderPieceInCell() 添加 'holy_evil' 分支
    - 在 placePiece() 添加圣邪音效和特效调用
    - _Requirements: 3.2, 3.3, 3.6, 3.7, 3.8, 3.9_
  
  - [ ] 16.2 在 game_ui.js 添加圣邪主题选择器
    - 添加 pieceGridHolyEvil 选项
    - 实现选择和高亮逻辑
    - _Requirements: 3.1_
  
  - [ ] 16.3 在 game_ui.js 实现圣邪特效调节面板
    - 复用冰火面板逻辑
    - 添加圣邪特效强度选择器
    - _Requirements: 3.10_
  
  - [ ] 16.4 在 index.html 添加圣邪主题 UI 元素
    - 添加棋子选择器选项
    - 添加特效调节面板 HTML
    - _Requirements: 3.1, 3.10_
  
  - [ ] 16.5 在 lang.js 添加圣邪主题翻译
    - 添加 skinHolyEvil, pieceHoly, pieceEvil 翻译键
    - 添加特效面板相关翻译
    - _Requirements: 6.1, 6.2_

- [ ] 17. Checkpoint - 神圣/邪恶主题测试
  - 确保所有测试通过，验证圣邪主题在各设备上显示正常
  - 验证音效和特效正确触发
  - 如有问题请询问用户

### Phase 4: 集成与优化

- [ ] 18. 皮肤系统集成测试
  - [ ] 18.1 验证所有棋盘皮肤 × 棋子主题组合
    - 测试 4 种棋盘 × 4 种棋子 = 16 种组合
    - 确保无视觉冲突
    - _Requirements: 4.4, 5.4_
  
  - [ ] 18.2 验证设置持久化
    - 切换皮肤后刷新页面
    - 确保设置正确恢复
    - _Requirements: 4.3, 4.5_

- [ ] 19. 性能优化
  - [ ] 19.1 添加移动端特效简化
    - 在移动端减少粒子数量
    - 简化动画复杂度
    - _Requirements: 5.2_
  
  - [ ] 19.2 验证 FPS 性能
    - 桌面端保持 60 FPS
    - 移动端保持 30 FPS 以上
    - _Requirements: 5.1, 5.2_

- [ ] 20. Final Checkpoint - 完整功能测试
  - 确保所有功能正常工作
  - 验证多语言显示正确
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 为可选任务，可跳过以加快 MVP 开发
- 每个 Phase 可独立发布为一个版本
- Checkpoint 任务用于验证阶段性成果
- 所有 CSS 动画优先使用 `@keyframes`，避免 JS 动画
- 音效使用 Web Audio API 合成，无需额外音频文件
