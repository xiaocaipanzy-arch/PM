/* 公开资料目录：新增资料时在所属项目与功能下登记，不扫描或上传本地知识库。 */
window.PM_CATALOG = {
  projects: [
    {id:'yuanyoumao',name:'元游猫',initial:'元',color:'blue',description:'按功能查看产品原型、使用说明与迭代记录。',features:[
      {id:'app2',name:'APP2.0',description:'A 方案全链路产品原型',resources:[
        {id:'app2-prototype',title:'APP2.0 全链路产品原型',type:'prototype',version:'v1.4',updated:'2026-11-17',dateLabel:'纳入资料站',status:'演示原型',description:'包含 C 端 App、运营后台与原型小馆。交互与数据用于演示，不代表线上状态。',path:'元游猫/APP2.0/',file:'元游猫/APP2.0/元游猫_APP2.0_A方案_全链路产品原型_v1.4.html'},
        {id:'app2-guide',title:'原型查看说明',type:'document',version:'v1.0',updated:'2026-11-17',dateLabel:'更新于',status:'使用说明',description:'原型入口、查看方式和演示范围。',path:'元游猫/APP2.0/使用说明.md'},
        {id:'app2-changelog',title:'资料迭代记录',type:'changelog',version:'v1.0',updated:'2026-11-17',dateLabel:'更新于',status:'资料记录',description:'记录资料迁移、页面发布和后续原型变更。',path:'元游猫/APP2.0/更新记录.md'}
      ]}
    ]},
    {id:'5e',name:'5E',initial:'5E',color:'purple',description:'项目空间已建立，等待加入首份公开资料。',features:[]}
  ]
};
