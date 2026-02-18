/** @type {import('tailwindcss').Config} */
module.exports = {
  // 变更原因：仅扫描前端入口和业务脚本，避免无关文件进入构建范围
  content: ["./index.html", "./js/**/*.js"],
  // 变更原因：预留稳定白名单，防止后续通过 JS 动态拼接类名时被裁剪
  safelist: [
    "fixed",
    "block",
    "inline-block",
    "flex",
    "flex-wrap",
    "transform",
    "resize",
    "shadow",
    "ring",
    "filter",
    "blur",
  ],
  // 变更原因：继续保持与现有项目一致，避免基础样式重置污染老UI
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
