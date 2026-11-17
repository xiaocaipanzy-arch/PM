/* 项目资料目录：由对应项目会话登记，UI 按登记内容生成聚合入口。 */
window.PM_CATALOG = {
  "projects": [
    {
      "id": "yuanyoumao",
      "name": "元游猫",
      "initial": "元",
      "color": "blue",
      "features": [
        {
          "id": "app2",
          "name": "APP2.0",
          "version": "v1.4",
          "resources": [
            {
              "id": "app2-prototype",
              "title": "原型",
              "type": "prototype",
              "version": "v1.4",
              "status": "交互演示",
              "path": "元游猫/APP2.0/元游猫_APP2.0_A方案_全链路产品原型_v1.4.html"
            },
            {
              "id": "app2-prd",
              "title": "PRD",
              "type": "prd",
              "version": "v1.4",
              "status": "待用户确认 / 不进入研发",
              "updated": "2026-09-08",
              "path": "元游猫/APP2.0/元游猫_APP2.0_A方案产品需求文档_v1.4纯产品修订稿.md"
            }
          ]
        }
      ]
    },
    {
      "id": "5e",
      "name": "5E",
      "initial": "5E",
      "color": "purple",
      "description": "租号及相关功能的产品调研与公开资料。",
      "features": [
        {
          "id": "competitor-research",
          "name": "竞品调研",
          "description": "PC 网页与客户端产品体验分析",
          "resources": [
            {
              "id": "zuhaowan-cs2-research",
              "downloadable": false,
              "title": "租号玩 CS2 产品体验调研",
              "type": "document",
              "format": "html",
              "version": "2026.11.17",
              "updated": "2026-11-17",
              "dateLabel": "更新于",
              "status": "对外调研报告",
              "description": "7 个使用场景、14 张配图，并附与 5E 平台的功能对比。研究范围为公开 PC 页面与客户端官方说明。",
              "path": "5E/竞品调研/租号玩CS2产品体验调研.html"
            }
          ]
        }
      ]
    }
  ]
};

/* 5E历史原型功能登记，与其他功能目录独立维护。 */
(() => {
  const project = window.PM_CATALOG.projects.find(project => project.id === "5e");
  if (!project) return;
  project.description = "按功能浏览5E原型、调研与阅读资料。";
  const feature = {
  "id": "rental-history",
  "name": "租号历史原型",
  "description": "按租客、商家和后台使用路径阅读历史原型，或按更新记录回顾变化。",
  "resources": [
    {
      "id": "5e-rental-viewer",
      "title": "租号历史原型 · 路径与更新双视图",
      "type": "prototype",
      "version": "2026.11.17",
      "updated": "2026-11-17",
      "dateLabel": "网页更新",
      "status": "历史资料归档",
      "description": "57条更新、35份RP、199个节点；158张完整画布与对应原文说明。",
      "path": "5E/租号历史原型/HTML/index.html",
      "file": "5E/租号历史原型/HTML/index.html"
    }
  ]
};
  const at = project.features.findIndex(item => item.id === feature.id);
  if (at < 0) project.features.push(feature); else project.features[at] = feature;
})();
