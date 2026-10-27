# 校校产品调研报告网站

当前报告的独立发布项目，包含教师端、学员端、师生联动及全产品功能结构表。现有目录、图片和锚点保留，覆盖7个板块、23个模块、67项功能和256条检查点。

## 当前线上入口

- [调研报告总览](https://xiaoxiao-report-296792-9-1309444917.sh.run.tcloudbase.com/)
- [固定功能链接示例：单词书学习](https://xiaoxiao-report-296792-9-1309444917.sh.run.tcloudbase.com/f/XX049)
- [功能与模块链接映射](https://xiaoxiao-report-296792-9-1309444917.sh.run.tcloudbase.com/report-links.json)

2026-10-27 已部署到上海地域的 `azure-env-d8g0wp9j7ef6bcbe4` 环境，服务为 `xiaoxiao-report`。公网开放，0.25核／0.5GB，自动扩缩容范围0–1个实例。当前体验版有效期至2027-02-14；每账期资源点会被本环境各项资源共同消耗，额度与有效期以控制台为准，未开启自动续费和超限付费。

默认测试域名首次访问会出现腾讯云提示页，点击“确定访问”即可继续。长期使用应按[腾讯云说明](https://docs.cloudbase.net/service/alias)绑定已备案的自定义域名；闲置缩容后再次访问可能需要等待冷启动。本次由CLI上传与GitHub提交一致的代码包，GitHub推送暂不自动触发部署。

## 本地启动

需要 Node.js 22 或更新版本，服务没有第三方运行依赖。

```sh
npm start
```

服务默认监听 `0.0.0.0:3000`，可用 `PORT` 指定端口。健康检查为 `/healthz`。

## 稳定报告链接

- `/`：调研总览。
- `/f/XX001` 至 `/f/XX067`：直接定位到对应功能的图文说明。
- `/m/M01` 至 `/m/M23`：直接定位到对应模块。
- `/report-links.json`：供飞书多维表格写入使用的功能与模块链接映射，不包含域名或访问凭据。

在飞书中使用部署域名加 `/f/XX049` 即可打开单词书学习；功能页面名称改变时，只需更新映射，外部短链接保持不变。

## 核验

```sh
npm test
npm run verify
```

核验包含中文路径、全部功能与模块定位、图片、HEAD/缓存响应、路径边界及所有本地资源和锚点。HTML原文件按哈希与发布清单核对。

## 更新报告

先在本地调研工作目录维护报告，再运行：

```sh
python3 scripts/export_report.py --workspace /你的调研工作目录
npm run verify
npm test
```

导出器仅复制报告入口实际引用的页面、原始依据与资源，以及供维护使用的功能数据。CLI工具、认证配置、底稿、历史压缩包不进入发布目录。提交并推送更新后再部署同一提交。

## CloudBase 云托管

项目按用户指定的云托管方式提供Dockerfile，使用Node官方镜像、非root运行，监听3000端口。构建无需安装前端框架或npm依赖。可在CloudBase控制台关联本GitHub仓库，以仓库根目录及Dockerfile构建。

也可以使用官方CLI从同一提交的本地目录部署：

```sh
npx --yes @cloudbase/cli@3.8.9 login
npx --yes @cloudbase/cli@3.8.9 cloudrun deploy --env-id 你的环境ID --service-name xiaoxiao-report --source . --port 3000 --min-num 0 --max-num 1 --open-access-types PUBLIC --wait
```

部署前确认环境、云托管能力及套餐额度。最小副本数为0、最大为1用于限制闲置资源和扩容，不代表永久免费；不要自动开启超限付费或购买套餐。环境ID及访问策略应以实际确认值为准。

当前按持链接可访问的网站准备，服务仅提供报告静态资源，不提供校校账号登录或凭据。`robots.txt`和noindex用于表达不收录偏好，不构成访问控制。

官方参考：https://docs.cloudbase.net/recipes/deploy-nextjs-to-cloudbase-run

## 项目目录

- `public/`：可对外访问的报告、图片与操作依据。
- `data/`：维护数据、发布清单及短链接映射；该目录不对外提供文件访问。
- `server.mjs`：静态文件服务及稳定链接跳转。
- `scripts/`：发布资料导出与核验。
- `test/`：服务验证。

本仓库及其报告素材用于内部产品研究和对比，不授予对第三方产品素材的额外使用权。
