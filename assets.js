/**
 * assets.js - The Arsenal (Visual Assets Repository)
 * Version: Alpha 0.7.7.7 (Image Support Upgrade)
 * * 职责：存储静态美术资源。
 * * 更新：支持 PNG 图片路径引用 (type: 'image')。
 */

// 1. 棋子皮肤库 (Piece Skins)
const PIECE_ICONS = {
    // 🍁 落叶：引用本地 images 文件夹中的 PNG
    maple: { 
        type: 'image', 
        src: 'images/maple.png', 
        alt: 'Maple' 
    },
    
    // ☀️ 生辉：引用本地 images 文件夹中的 PNG
    sun: { 
        type: 'image', 
        src: 'images/sun.png', 
        alt: 'Sun' 
    },

    // ⚫ 经典黑子 (保留 SVG 以确保经典模式的清晰度)
    classic_black: `
        <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill="#111" stroke="#000" stroke-width="2"/>
            <circle cx="35" cy="35" r="10" fill="#fff" fill-opacity="0.2"/>
        </svg>
    `,

    // ⚪ 经典白子 (保留 SVG)
    classic_white: `
        <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill="#fff" stroke="#999" stroke-width="3"/>
        </svg>
    `
};

// 2. 技能图标库 (Skill Icons - 保持 SVG 不变，稳定优先)
const SKILL_ICONS = {
    double: '<svg viewBox="0 0 64 64" fill="none"><circle cx="24" cy="24" r="14" fill="#E0E0E0" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="40" r="14" fill="currentColor" stroke="white" stroke-width="3"/><path d="M48 20 L56 12 M52 24 L58 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    
    voodoo: '<svg viewBox="0 0 1024 1024" fill="none"><path d="M672.576 0c14.784 0 26.7648 12.0704 26.7648 26.944v107.7888a26.8544 26.8544 0 0 1-26.752 26.9568h-53.5296v107.776C722.5216 269.4784 806.4 353.9456 806.4 458.112v485.056C806.4 987.8016 770.4576 1024 726.1056 1024H297.8944C253.5424 1024 217.6 987.8016 217.6 943.1552V458.112c0-104.1664 83.8784-188.6208 187.3408-188.6208v-107.7888h-53.5168a26.8544 26.8544 0 0 1-26.7648-26.9568v-107.776C324.6592 12.0576 336.64 0 351.4112 0h321.1648z m-84.864 560.32l-37.8624 38.1056 18.944 19.072L512 674.6496l-56.7808-57.1648 18.9312-19.0592-37.8496-38.1056-75.6992 76.224 37.8496 38.1056 18.9184-19.0464 56.7808 57.1648-56.768 57.152-18.9312-19.072-37.8496 38.1184 75.6992 76.2112 37.8496-38.1056-18.9184-19.0464L512 750.8864l56.768 57.1648-18.9184 19.0592 37.8496 38.1056 75.6992-76.224-37.8496-38.1056-18.9184 19.0592-56.7808-57.1648 56.7808-57.1776 18.9184 19.0464 37.8496-38.1184-75.6992-76.2112z m-22.1824-398.6304h-107.0592v134.7328a26.8544 26.8544 0 0 1-26.752 26.944h-26.7776c-64.7424 0-118.7328 46.2976-131.136 107.7888h476.3904c-12.4032-61.4912-66.3936-107.776-131.136-107.776h-26.7648a26.8544 26.8544 0 0 1-26.7648-26.9568V161.6896z" fill="#1AB370"></path></svg>',
    
    move_self: '<svg viewBox="0 0 64 64" fill="none"><circle cx="20" cy="32" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/><path d="M32 32 L46 32" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><circle cx="50" cy="32" r="10" fill="currentColor"/><path d="M44 26 L50 32 L44 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    move_enemy: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="42" r="10" stroke="currentColor" stroke-width="3"/><path d="M16 10 L24 28 M48 10 L40 28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M20 28 Q32 36 44 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    
    zone: '<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" stroke-width="3"/><path d="M25 12 V52 M39 12 V52 M12 25 H52 M12 39 H52" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.5"/><rect x="26" y="26" width="12" height="12" fill="currentColor"/></svg>',
    
    bomb: `<svg viewBox="0 0 1024 1024" fill="none"><path d="M731.016 43.54a9.86 9.86 0 0 1 16.236 5.524l11.508 60.416a9.844 9.844 0 0 0 7.748 7.82l57.244 11.452a9.856 9.856 0 0 1 5.64 15.976l-45.72 54.868a9.852 9.852 0 0 0-1.66 9.772l16.228 43.272a9.856 9.856 0 0 1-10.504 13.24l-72.288-9.432a9.888 9.888 0 0 0-6.416 1.364l-56.836 34.736a9.856 9.856 0 0 1-14.828-6.596l-8.3-44.252a9.864 9.864 0 0 0-6.572-7.536l-62.084-20.692a9.86 9.86 0 0 1-3.34-16.804l41.568-36.024a9.856 9.856 0 0 0 2.66-11.204l-19.156-46.524a9.86 9.86 0 0 1 9.932-13.576l75.712 6.308a9.856 9.856 0 0 0 7.368-2.456l55.86-49.652z" fill="#FFBE52"></path><path d="M726.212 341.124a25.008 25.008 0 0 1-35.336 1.088 25.008 25.008 0 0 1-1.088-35.336s13.86-15.748 14.908-42.496c0.804-20.628-6.08-46.772-28.8-77.524a25 25 0 0 1 40.208-29.712c31.82 43.056 39.684 80.308 38.552 109.192-1.86 47.524-28.444 74.788-28.444 74.788z" fill="#F45340"></path><path d="M690 166m-26 0a26 26 0 1 0 52 0 26 26 0 1 0-52 0Z" fill="#FF7C5A"></path><path d="M476 324l106.096-67.196a34.712 34.712 0 0 1 29.828-3.512C635.508 261.728 681.208 279.512 720 304c40.632 25.648 72.224 57.548 86.94 73.656a34.628 34.628 0 0 1 8.552 23.844C814.572 435.144 812 520 812 520l-336-196z" fill="#ABB2E2"></path><path d="M512 652m-340 0a340 340 0 1 0 680 0 340 340 0 1 0-680 0Z" fill="#F3003D"></path><path d="M348.648 773.812a53.252 53.252 0 0 1-21.6-57.672c4.076-15.384 2.336-34.064-15.86-58.284-28.484-37.916-8.208-75.504 40.46-149.156 49.944-75.584 140.612-57.316 188.68-40.532a190.08 190.08 0 0 1 59.644 33.972c38.952 32.788 100.912 101.456 61.372 182.968-38.528 79.428-60.516 116.04-107.656 110.876-30.116-3.296-47.068 4.736-58.268 16.044a53.188 53.188 0 0 1-63.548 9.292l23.056-40.476a3.78 3.78 0 0 0-1.412-5.156l-6.576-3.748a3.792 3.792 0 0 0-5.16 1.416l-23.072 40.504c-7.088-4.02-14.48-8.22-21.924-12.456l23.084-40.528a3.788 3.788 0 0 0-1.412-5.16l-6.576-3.744a3.788 3.788 0 0 0-5.16 1.412l-23.088 40.536-21.916-12.476 23.092-40.54a3.788 3.788 0 0 0-1.416-5.16L376.82 732a3.788 3.788 0 0 0-5.16 1.416l-23.012 40.396z m215.268-111.308c-18.948-10.792-43.092-4.172-53.884 14.776-10.792 18.948-4.172 43.092 14.772 53.884 18.948 10.792 43.092 4.172 53.888-14.776 10.792-18.948 4.172-43.092-14.776-53.884z m-143.164-81.548c-18.944-10.792-43.092-4.172-53.884 14.776-10.792 18.948-4.172 43.092 14.776 53.884 18.948 10.792 43.092 4.172 53.884-14.776 10.792-18.944 4.172-43.092-14.776-53.884z m34.24 104.636s-27.88-2.012-36.06 12.352c-8.18 14.364 12.048 17.468 21.912 12.48 0.744 11.032 13.732 26.844 21.912 12.484 8.184-14.364-7.764-37.316-7.764-37.316z" fill="#FFFFFF"></path><path d="M736.56 396.792C807.324 459.12 852 550.384 852 652c0 187.652-152.348 340-340 340-133.348 0-248.868-76.932-304.56-188.792C267.352 855.976 345.964 888 432 888c187.652 0 340-152.348 340-340 0-54.304-12.76-105.652-35.44-151.208z" fill="#DD003B"></path><path d="M375.756 420.664c26.144-14.308 55.544-10.988 65.616 7.412 10.068 18.396-2.984 44.952-29.128 59.26s-55.544 10.988-65.616-7.412c-10.068-18.396 2.984-44.952 29.128-59.26z" fill="#FF5D78"></path></svg>`,
    
    god_hand: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 54 V40 M20 30 Q20 10 32 10 Q44 10 44 30" stroke="currentColor" stroke-width="3"/><path d="M20 30 L20 40 Q20 46 26 46 H38 Q44 46 44 40 L44 30" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="24" r="4" fill="currentColor"/></svg>',
    
    chaos: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
          <defs>
            <color id="outline" value="#1a0f35" /> <color id="faceTop" value="#7c4dff" />  <color id="faceLeft" value="#512da8" /> <color id="faceRight" value="#311b92" /> <color id="highlight" value="#b388ff" /> <color id="symbol" value="#00e5ff" />    </defs>

          <g stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" color="#1a0f35">

            <g transform="translate(110, 40) rotate(15) scale(0.8)">
              <path d="M0 25 L35 5 L70 25 L35 45 Z" fill="#7c4dff" stroke="none"/> <path d="M0 25 L35 45 L35 85 L0 65 Z" fill="#512da8" stroke="none"/> <path d="M70 25 L70 65 L35 85 L35 45 Z" fill="#311b92" stroke="none"/> <path d="M0 25 L35 5 L70 25" fill="none" stroke="#b388ff" stroke-width="3"/>

              <path d="M0 25 L35 5 L70 25 L70 65 L35 85 L0 65 Z M35 45 L35 85 M0 25 L35 45 L70 25" fill="none"/>
              
              <path d="M35 30 C 45 20, 55 35, 45 40 C 40 43, 40 50, 40 55" fill="none" stroke="#00e5ff" stroke-width="4"/>
              <circle cx="40" cy="65" r="3" fill="#00e5ff" stroke="none"/>
            </g>

            <g transform="translate(20, 70) rotate(-10)">
              <path d="M10 30 L50 10 L90 30 L50 50 Z" fill="#7c4dff" stroke="none"/> <path d="M10 30 L50 50 L50 95 L10 75 Z" fill="#512da8" stroke="none"/> <path d="M90 30 L90 75 L50 95 L50 50 Z" fill="#311b92" stroke="none"/> <path d="M10 30 L50 10 L90 30" fill="none" stroke="#b388ff" stroke-width="3"/>
              <path d="M10 30 L10 75" fill="none" stroke="#b388ff" stroke-width="3" opacity="0.5"/>

              <path d="M10 30 L50 10 L90 30 L90 75 L50 95 L10 75 Z M50 50 L50 95 M10 30 L50 50 L90 30" fill="none"/>

              <g stroke="#00e5ff" stroke-width="4" fill="none">
                <path d="M50 22 C 40 22, 35 35, 50 40 C 65 45, 70 30, 55 25" transform="rotate(-10 50 30)"/>
                <path d="M30 60 L 40 70 M 40 60 L 30 70" stroke-width="5"/>
                <circle cx="35" cy="65" r="8" stroke-width="3" opacity="0.6"/>
                <path d="M70 55 L 80 65 L 75 75" stroke-linejoin="miter"/>
              </g>
            </g>
          </g>
        </svg>
    `,
    
    short_battle: '<svg viewBox="0 0 64 64" fill="none"><path d="M12 52 L52 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M12 12 L52 52" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M10 48 L16 54 M48 10 L54 16" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M10 16 L16 10 M48 54 L54 48" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>',
    swap: '<svg viewBox="0 0 64 64" fill="none"><path d="M16 32 A 16 16 0 0 1 48 32" stroke="currentColor" stroke-width="3" fill="none" marker-end="url(#arrow)"/><path d="M48 32 A 16 16 0 0 1 16 32" stroke="currentColor" stroke-width="3" fill="none" transform="rotate(180 32 32)"/><path d="M44 26 L48 32 L44 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 38 L16 32 L20 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};