# Requirements Document

## Introduction

本文档定义了 Project Lysh 从 Alpha 0.7.9.5 到 0.7.9.7 的视觉升级计划，包含一种新棋盘皮肤（国际象棋风格）和两种新棋子主题（冰/火、神圣/邪恶）。每个版本将独立发布，确保稳定性和可测试性。

## Glossary

- **Board_Skin**: 棋盘皮肤系统，控制棋盘的视觉外观
- **Piece_Theme**: 棋子主题系统，包含棋子模型、落子音效和视觉特效
- **Chess_Board**: 国际象棋风格棋盘，黑白格子交替排列
- **Ice_Fire_Theme**: 冰/火主题棋子，先手为冰晶，后手为火焰
- **Holy_Evil_Theme**: 神圣/邪恶主题棋子，先手为光明，后手为黑暗
- **Drop_Effect**: 落子特效，棋子落下时的视觉反馈
- **Drop_Sound**: 落子音效，棋子落下时的音频反馈
- **Effect_Panel**: 特效调节面板，用户可在二级子页面调整特效参数

## Requirements

### Requirement 1: 国际象棋风格棋盘 (Alpha 0.7.9.5)

**User Story:** As a player, I want to play on a chess-style board, so that I can enjoy a classic and elegant visual experience.

#### Acceptance Criteria

1. THE Board_Skin system SHALL provide a new "chess" skin option in the board selector
2. WHEN the chess skin is selected, THE Board SHALL display alternating black and white squares in an 8x8 pattern overlaid on the 15x15 grid
3. THE Chess_Board SHALL render pieces at the intersections of the grid lines (not in the center of squares)
4. THE Chess_Board SHALL feature a polished marble texture for white squares
5. THE Chess_Board SHALL feature a dark wood or obsidian texture for black squares
6. THE Chess_Board SHALL include an elegant border frame with classical chess board aesthetics
7. WHEN viewing the board selector, THE preview SHALL accurately represent the chess board appearance
8. THE Chess_Board SHALL maintain visual consistency across desktop and mobile devices

### Requirement 2: 冰/火主题棋子 (Alpha 0.7.9.6)

**User Story:** As a player, I want to use ice and fire themed pieces, so that I can experience dramatic elemental contrast during gameplay.

#### Acceptance Criteria

1. THE Piece_Theme system SHALL provide a new "ice_fire" theme option in the piece selector
2. WHEN the ice_fire theme is selected, THE first player (MAPLE) pieces SHALL display as ice crystals
3. WHEN the ice_fire theme is selected, THE second player (SUN) pieces SHALL display as fire orbs
4. THE Ice_Fire_Theme ice pieces SHALL feature:
   - Translucent crystalline appearance with internal light refraction
   - Cool blue-white color palette (#a8d8ff to #e0f4ff)
   - Subtle frost particle effects around the piece
5. THE Ice_Fire_Theme fire pieces SHALL feature:
   - Glowing ember core with flickering flame edges
   - Warm orange-red color palette (#ff4500 to #ffd700)
   - Dynamic flame particle effects around the piece
6. WHEN an ice piece is placed, THE Drop_Sound system SHALL play a crystalline chime sound
7. WHEN a fire piece is placed, THE Drop_Sound system SHALL play a crackling flame sound
8. WHEN an ice piece is placed, THE Drop_Effect system SHALL display frost spreading animation
9. WHEN a fire piece is placed, THE Drop_Effect system SHALL display ember burst animation
10. THE Effect_Panel SHALL allow users to adjust ice/fire effect intensity (off/low/medium/high)
11. THE Ice_Fire_Theme SHALL maintain visual clarity and piece distinguishability

### Requirement 3: 神圣/邪恶主题棋子 (Alpha 0.7.9.7)

**User Story:** As a player, I want to use holy and evil themed pieces, so that I can experience the dramatic contrast between light and darkness.

#### Acceptance Criteria

1. THE Piece_Theme system SHALL provide a new "holy_evil" theme option in the piece selector
2. WHEN the holy_evil theme is selected, THE first player (MAPLE) pieces SHALL display as holy light orbs
3. WHEN the holy_evil theme is selected, THE second player (SUN) pieces SHALL display as dark shadow orbs
4. THE Holy_Evil_Theme holy pieces SHALL feature:
   - Radiant golden-white glow with divine halo effect
   - Pure white core with golden accents (#ffffff to #ffd700)
   - Ascending light particle effects (upward motion)
5. THE Holy_Evil_Theme evil pieces SHALL feature:
   - Dark purple-black core with corrupted energy tendrils
   - Deep shadow color palette (#1a0033 to #4a0080)
   - Descending shadow particle effects (downward motion)
6. WHEN a holy piece is placed, THE Drop_Sound system SHALL play a celestial choir chime
7. WHEN an evil piece is placed, THE Drop_Sound system SHALL play a dark resonance sound
8. WHEN a holy piece is placed, THE Drop_Effect system SHALL display divine light burst animation
9. WHEN an evil piece is placed, THE Drop_Effect system SHALL display shadow corruption animation
10. THE Effect_Panel SHALL allow users to adjust holy/evil effect intensity (off/low/medium/high)
11. THE Holy_Evil_Theme SHALL maintain visual clarity and piece distinguishability

### Requirement 4: 皮肤系统集成

**User Story:** As a player, I want seamless integration of new skins with the existing system, so that I can easily switch between different visual styles.

#### Acceptance Criteria

1. THE Board_Skin selector SHALL display all available board skins including the new chess skin
2. THE Piece_Theme selector SHALL display all available piece themes including ice_fire and holy_evil
3. WHEN switching between themes, THE system SHALL preserve user preferences in GameState
4. THE system SHALL support any combination of board skin and piece theme
5. WHEN the game is restarted, THE system SHALL restore the previously selected skins
6. THE skin preview thumbnails SHALL accurately represent each skin's appearance

### Requirement 5: 性能与兼容性

**User Story:** As a player, I want smooth performance with new visual effects, so that gameplay remains responsive.

#### Acceptance Criteria

1. THE new visual effects SHALL maintain 60 FPS on modern desktop browsers
2. THE new visual effects SHALL maintain 30 FPS minimum on mobile devices
3. WHEN effect intensity is set to "off", THE system SHALL disable particle effects entirely
4. THE new skins SHALL be compatible with all existing game modes (PvE, PvP, BO3)
5. THE new audio effects SHALL respect the existing volume settings (SFX volume slider)
6. IF a device cannot render advanced effects, THEN THE system SHALL gracefully degrade to simpler visuals

### Requirement 6: 多语言支持

**User Story:** As a player, I want skin names and descriptions in my language, so that I can understand the options.

#### Acceptance Criteria

1. THE lang.js file SHALL include translations for all new skin names in zh-TW, zh-CN, and en
2. THE lang.js file SHALL include translations for all new effect panel labels
3. WHEN the language is changed, THE skin selector UI SHALL update immediately
