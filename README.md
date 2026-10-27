# 校校产品调研报告网站

当前报告包含教师端、学员端、师生联动及全产品功能结构表，覆盖7个板块、23个模块、67项功能和256条检查点。

## 线上入口

- [调研报告总览](https://codeazuree.github.io/xiaoxiao-research-report/)
- [单词书学习](https://codeazuree.github.io/xiaoxiao-research-report/f/XX049/)
- [功能与模块链接映射](https://codeazuree.github.io/xiaoxiao-research-report/report-links.json)

采用 GitHub Pages 静态托管。推送 main 分支后，GitHub Actions 自动核验、构建并发布 public/ 中的报告和资源。仓库按用户选择设为公开。

## 核验与构建

```sh
npm run verify
npm run build
npm test
```

构建产物在 _site/，包含90个静态定位入口：f/XX001/ 至 f/XX067/，以及 m/M01/ 至 m/M23/。所有跳转使用相对路径，兼容 GitHub Pages 项目子目录。飞书链接保留稳定ID并使用结尾斜杠。

核验覆盖52个HTML页面、10183处本地链接、导出文件哈希、功能与模块锚点及图片。Node.js 22+ 可通过 npm start 在本地预览原始报告；线上运行无需 Node 服务或容器。

## 更新报告

先维护本地调研资料，再执行：

```sh
python3 scripts/export_report.py --workspace /你的调研工作目录
npm run verify
npm run build
```

提交并推送 main 分支后自动发布。导出器仅复制实际引用的页面、原始依据与资源；工具、认证配置、底稿和历史压缩包不进入发布目录。

## 项目目录

- public/：可公开访问的报告、图片与操作依据。
- data/：维护数据、发布清单及短链接映射。
- scripts/build_pages.py：GitHub Pages 静态构建。
- .github/workflows/pages.yml：自动核验及部署。
- server.mjs、test/：本地预览服务及验证。

robots.txt 和 noindex 表达不收录偏好，不构成访问控制。本仓库及报告素材用于产品研究和对比，不授予对第三方产品素材的额外使用权。
