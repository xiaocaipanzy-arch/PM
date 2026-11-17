'use strict';
(() => {
  const catalog = {projects:window.PM_CATALOG.projects.map(p=>({...p,description:p.description||'',features:p.features.map(f=>({...f,resources:f.resources.map(r=>({...r,type:r.type==='prd'?'document':r.type,updated:r.updated||'—',dateLabel:r.dateLabel||'更新于'}))}))}))};
  const types = {all:'全部',prototype:'交互原型',document:'文档说明',changelog:'更新记录'};
  const icons = {prototype:'◇',document:'▤',changelog:'↺'};
  const isPage = resource => resource.type==='prototype'||resource.format==='html';
  const params = new URLSearchParams(location.search);
  const state = {project:params.get('project') || '',feature:params.get('feature') || '',type:'all',query:''};
  if (!catalog.projects.some(p=>p.id===state.project)) state.project='';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allResources = catalog.projects.flatMap(project=>project.features.flatMap(feature=>feature.resources.map(r=>({...r,project:project.id,projectName:project.name,feature:feature.id,featureName:feature.name}))));
  const href = path => new URL(path,location.href.split('?')[0]).href;
  const route = (project='',feature='',resource='') => {
    const item=catalog.projects.find(p=>p.id===project);
    const url = item?new URL(encodeURIComponent(item.name)+'/',new URL('./',location.href)):new URL('./',location.href);
    if(feature)url.searchParams.set('feature',feature);
    if(resource)url.searchParams.set('resource',resource);
    return url.pathname+url.search;
  };
  const projectResources = () => allResources.filter(r=>(!state.project||r.project===state.project)&&(!state.feature||r.feature===state.feature));
  let toastTimer, documentRequest;
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
  function resetRoute(project='',feature='') {
    if($('documentDialog').open)$('documentDialog').close();
    state.project=project;state.feature=feature;state.query='';state.type='all';$('searchInput').value='';
    history.pushState(null,'',route(project,feature));render();
  }
  function render(){
    const project=catalog.projects.find(p=>p.id===state.project);
    if(state.feature&&!project?.features.some(f=>f.id===state.feature))state.feature='';
    const feature=project?.features.find(f=>f.id===state.feature);
    document.title=(project?`${project.name}${feature?' · '+feature.name:''}`:'项目总览')+' · PM 项目资料站';
    $('breadcrumb').textContent='工作空间 / '+(project?project.name+(feature?' / '+feature.name:''):'项目总览');
    $('pageTitle').textContent=project?project.name+(feature?' / '+feature.name:''):'让每次迭代，都有迹可循。';
    $('pageDescription').textContent=feature?feature.description:project?project.description:'选择一个项目，从想法到原型，在这里找到最新资料。';
    $('projectNav').innerHTML=`<a href="${route()}" class="nav-link ${!project?'active':''}" ${!project?'aria-current="page"':''} data-project=""><span class="nav-symbol">▦</span>项目总览<span class="nav-count">${catalog.projects.length}</span></a><div class="nav-divider"></div>`+catalog.projects.map(p=>`<a href="${route(p.id)}" data-project="${p.id}" class="nav-link ${state.project===p.id?'active':''}" ${state.project===p.id?'aria-current="page"':''}><span class="nav-symbol">${escape(p.initial)}</span>${escape(p.name)}<span class="nav-count">${allResources.filter(r=>r.project===p.id).length}</span></a>`).join('');
    $('projectsSection').hidden=!!project;
    $('projectCount').textContent=catalog.projects.length;
    $('projectCards').innerHTML=catalog.projects.map(p=>{
      const resources=allResources.filter(r=>r.project===p.id);
      return `<a href="${route(p.id)}" data-project="${p.id}" class="project-card"><div class="project-card-top"><span class="project-icon ${p.color==='purple'?'purple':''}">${escape(p.initial)}</span><div><h3>${escape(p.name)}</h3><div class="mini-status">${resources.length?'资料已发布':'等待首份资料'}</div></div></div><p>${escape(p.description)}</p><div class="project-card-bottom"><span><strong>${p.features.length}</strong> 个功能</span><span><strong>${resources.length}</strong> 份资料</span><span class="project-arrow">↗</span></div></a>`;
    }).join('');
    const base=projectResources();
    $('resourcesTitle').firstChild.textContent=feature?'功能资料 ':project?'项目资料 ':'全部资料 ';
    $('resourceCount').textContent=base.length;
    $('resourceHint').textContent=project?(base.length?'按功能浏览，快速找到所需资料':'已建立独立项目目录，资料发布后将在此展示'):'浏览已公开的原型与配套资料';
    $('featureNav').innerHTML=project&&project.features.length?`<button class="feature-chip ${!feature?'active':''}" data-feature="" type="button" aria-pressed="${!feature}">全部功能</button>`+project.features.map(f=>`<button class="feature-chip ${state.feature===f.id?'active':''}" data-feature="${f.id}" type="button" aria-pressed="${state.feature===f.id}">${escape(f.name)}</button>`).join(''):'';
    renderResources();
  }
  function renderResources(){
    const base=projectResources();
    $('typeTabs').innerHTML=Object.entries(types).map(([id,label])=>`<button type="button" data-type="${id}" class="type-tab ${state.type===id?'active':''}" aria-pressed="${state.type===id}">${label}<small>${base.filter(r=>id==='all'||r.type===id).length}</small></button>`).join('');
    const query=state.query.trim().toLowerCase();
    const matches=base.filter(r=>(state.type==='all'||r.type===state.type)&&(!query||[r.title,r.description,r.projectName,r.featureName,r.version].join(' ').toLowerCase().includes(query)));
    $('resultSummary').textContent=`找到 ${matches.length} 份资料`;
    $('resourceList').innerHTML=matches.map(r=>`<article class="resource-row"><span class="file-icon ${r.type}" aria-hidden="true">${icons[r.type]}</span><div><${isPage(r)?'a':'button'} ${isPage(r)?`href="${escape(href(r.path))}" target="_blank" rel="noopener"`:`type="button" data-document="${r.id}"`} class="resource-title">${escape(r.title)}<span class="resource-version">${escape(r.version)}</span></${isPage(r)?'a':'button'}><p class="resource-context">${escape(r.projectName)} <span aria-hidden="true">/</span> ${escape(r.featureName)}</p><p class="resource-type">${types[r.type]} · ${escape(r.status)}<span class="mobile-date"> · ${escape(r.updated)}</span></p></div><div class="resource-status"><span class="badge ${r.type}">${escape(r.status)}</span></div><div class="resource-date"><small>${escape(r.dateLabel)}</small><time datetime="${r.updated}">${escape(r.updated)}</time></div><div class="resource-actions">${isPage(r)?`<a class="open-button" href="${escape(href(r.path))}" target="_blank" rel="noopener" aria-label="打开${escape(r.title)}">打开 ↗</a>`:`<button class="open-button" type="button" data-document="${r.id}" aria-label="阅读${escape(r.title)}">阅读 ↗</button>`}<a class="download-button" href="${escape(href(r.file||r.path))}" download aria-label="下载${escape(r.title)}" title="下载文件">↓</a></div></article>`).join('');
    $('emptyState').hidden=!!matches.length;
    const filtered=!!query||state.type!=='all';
    $('emptyTitle').textContent=filtered?'没有找到匹配的资料':'这个项目的第一份资料，即将到来';
    $('emptyDescription').textContent=filtered?'试试其他关键词，或清除筛选查看全部资料。':'当前暂无公开文件。加入原型或文档后，会在这里按功能展示。';
    $('clearFilters').hidden=!filtered;
  }
  function inline(text,parent){
    const pattern=/(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;let cursor=0;
    for(const match of text.matchAll(pattern)){
      parent.append(document.createTextNode(text.slice(cursor,match.index)));let node;
      if(match[2]){node=document.createElement('strong');node.textContent=match[2];}
      else if(match[3]){node=document.createElement('code');node.textContent=match[3];}
      else{const url=new URL(match[5],location.href);node=document.createElement(url.protocol==='https:'||url.protocol==='http:'?'a':'span');node.textContent=match[4];if(node.tagName==='A'){node.href=url.href;node.target='_blank';node.rel='noopener';}}
      parent.append(node);cursor=match.index+match[0].length;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }
  function markdown(text){
    const fragment=document.createDocumentFragment();let list=null,code=null,paragraph=null;
    for(const line of text.replace(/\r/g,'').split('\n')){
      if(line.startsWith('```')){list=null;paragraph=null;if(code){code=null;}else{const pre=document.createElement('pre');code=document.createElement('code');pre.append(code);fragment.append(pre);}continue;}
      if(code){code.textContent+=line+'\n';continue;}
      if(!line.trim()){list=null;paragraph=null;continue;}
      const heading=line.match(/^(#{1,3})\s+(.+)/);
      if(heading){list=null;paragraph=null;const node=document.createElement('h'+heading[1].length);inline(heading[2],node);fragment.append(node);continue;}
      const item=line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
      if(item){paragraph=null;const tag=/^\s*\d/.test(line)?'ol':'ul';if(!list||list.tagName.toLowerCase()!==tag){list=document.createElement(tag);fragment.append(list);}const li=document.createElement('li');inline(item[1],li);list.append(li);continue;}
      list=null;if(!paragraph){paragraph=document.createElement('p');fragment.append(paragraph);}else paragraph.append(' ');inline(line,paragraph);
    }
    return fragment;
  }
  async function openDocument(id,updateUrl=true){
    const resource=allResources.find(r=>r.id===id&&!isPage(r));if(!resource){toast('这份资料暂不可用，请从列表重新选择。');return;}
    if(documentRequest)documentRequest.abort();const controller=new AbortController();documentRequest=controller;
    $('documentTitle').textContent=resource.title;$('documentMeta').textContent=resource.projectName+' / '+resource.featureName+' · '+resource.version;
    $('documentBody').textContent='正在读取文档…';$('documentDownload').href=href(resource.path);$('documentRaw').href=href(resource.path);
    if(!$('documentDialog').open)$('documentDialog').showModal();
    if(updateUrl)history.replaceState(null,'',route(state.project,state.feature,id));
    try{const response=await fetch(href(resource.path),{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(controller.signal.aborted)return;$('documentBody').replaceChildren(markdown(text));}
    catch(error){if(error.name==='AbortError')return;const p=document.createElement('p');p.textContent='文档暂时未能加载。请稍后重试，或点击下方“查看原文件”。';$('documentBody').replaceChildren(p);}
  }
  document.addEventListener('click',event=>{
    const project=event.target.closest('[data-project]');if(project){event.preventDefault();if(project.dataset.project)location.assign(route(project.dataset.project));else resetRoute();return;}
    const feature=event.target.closest('[data-feature]');if(feature){resetRoute(state.project,feature.dataset.feature);return;}
    const type=event.target.closest('[data-type]');if(type){state.type=type.dataset.type;renderResources();$('typeTabs').querySelector(`[data-type="${state.type}"]`).focus();return;}
    const resource=event.target.closest('[data-document]');if(resource)openDocument(resource.dataset.document);
  });
  $('searchInput').addEventListener('input',event=>{state.query=event.target.value;renderResources();});
  $('clearFilters').addEventListener('click',()=>{state.query='';state.type='all';$('searchInput').value='';renderResources();$('searchInput').focus();});
  $('closeDocument').addEventListener('click',()=>$('documentDialog').close());
  $('documentDialog').addEventListener('close',()=>{if(documentRequest)documentRequest.abort();if(new URLSearchParams(location.search).has('resource'))history.replaceState(null,'',route(state.project,state.feature));});
  $('shareButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('页面链接已复制，可以直接分享给他人。');}catch{toast('请复制浏览器地址栏中的链接进行分享。');}});
  window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);if($('documentDialog').open)$('documentDialog').close();state.project=catalog.projects.some(i=>i.id===p.get('project'))?p.get('project'):'';state.feature=p.get('feature')||'';state.query='';state.type='all';$('searchInput').value='';render();if(p.get('resource'))openDocument(p.get('resource'),false);});
  if(state.project){location.replace(route(state.project,state.feature,params.get('resource')||''));return;}
  render();if(params.get('resource'))openDocument(params.get('resource'),false);
})();
