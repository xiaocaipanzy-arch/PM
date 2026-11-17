'use strict';
(() => {
 const catalog=window.PM_CATALOG, $=id=>document.getElementById(id);
 const script=document.querySelector('script[src$="assets/portal.js"]');
 const base=new URL('../',script.src);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const href=path=>new URL(path,base).href;
 let projectId='',query='',request,timer;
 const resources=catalog.projects.flatMap(project=>project.features.flatMap(feature=>feature.resources.map(r=>({...r,project:project.id,feature:feature.name}))));
 function route(project='',resource=''){const u=new URL(base);if(project)u.searchParams.set('project',project);if(resource)u.searchParams.set('resource',resource);return u;}
 function selectedProject(){return catalog.projects.find(p=>p.id===projectId);}
 function readRoute(){const p=new URLSearchParams(location.search);projectId=p.get('project')||(location.pathname!==base.pathname?document.body.dataset.initialProject:'')||'';if(!selectedProject())projectId='';query='';$('searchInput').value='';render();if(p.get('resource'))openDocument(p.get('resource'),false);}
 function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,3000);}
 function navigate(project){if($('documentDialog').open)$('documentDialog').close();projectId=project;query='';$('searchInput').value='';history.pushState(null,'',route(project));render();}
 function render(){
  const selected=selectedProject();document.title=(selected?selected.name:'项目资料')+' · PM';$('homeLink').href=route();
  $('breadcrumb').textContent=selected?'项目 / '+selected.name:'项目';$('pageTitle').textContent=selected?selected.name:'项目资料';$('pageDescription').hidden=!!selected;
  $('projectsSection').hidden=!!selected;$('library').hidden=!selected;
  $('projectNav').innerHTML=`<a class="nav-link ${!selected?'active':''}" href="${route()}" data-project=""><span class="nav-symbol">▦</span>全部项目</a>`+catalog.projects.map(p=>`<a class="nav-link ${selected?.id===p.id?'active':''}" href="${route(p.id)}" data-project="${p.id}" ${selected?.id===p.id?'aria-current="page"':''}><span class="nav-symbol">${escape(p.initial)}</span>${escape(p.name)}<span class="nav-count">${p.features.length}</span></a>`).join('');
  $('projectCards').innerHTML=catalog.projects.map(p=>`<a class="project-card" href="${route(p.id)}" data-project="${p.id}"><div class="project-card-top"><span class="project-icon ${p.color==='purple'?'purple':''}">${escape(p.initial)}</span><h3>${escape(p.name)}</h3><span class="project-arrow">↗</span></div><p>${p.features.length?p.features.length+' 个功能 · 原型 / PRD':'暂无功能资料'}</p></a>`).join('');renderFeatures();
 }
 function renderFeatures(){const project=selectedProject();if(!project)return;
  const features=project.features.filter(f=>f.name.toLowerCase().includes(query.trim().toLowerCase()));
  $('featureCount').textContent=project.features.length;$('resultSummary').textContent=`${features.length} 个功能`;
  $('featureList').innerHTML=features.map(f=>`<article class="function-card"><header><h3>${escape(f.name)}</h3><span class="resource-version">${escape(f.version)}</span></header><div class="function-resources">`+['prototype','prd'].map(type=>{const r=f.resources.find(i=>i.type===type);if(!r)return `<div class="function-resource missing"><strong>${type==='prd'?'PRD':'原型'}</strong><span>待补充</span></div>`;return `<div class="function-resource"><div><strong>${type==='prd'?'PRD':'原型'}</strong><p>${escape(r.status)}</p></div><div class="file-actions">${type==='prototype'?`<a class="open-button" href="${escape(href(r.path))}" target="_blank" rel="noopener" aria-label="打开${escape(f.name)}原型">打开原型 ↗</a>`:`<button class="open-button" type="button" data-document="${r.id}" aria-label="查看${escape(f.name)} PRD">查看 PRD ↗</button>`}<a class="download-button" href="${escape(href(r.path))}" download aria-label="下载${escape(f.name)}${type==='prd'?'PRD':'原型'}">↓</a></div></div>`;}).join('')+'</div></article>').join('');
  $('emptyState').hidden=!!features.length;$('emptyTitle').textContent=query.trim()?'未找到匹配功能':'暂无功能资料';$('clearFilters').hidden=!query.trim();
 }
 function inline(text,parent){const re=/(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;let cursor=0;
  for(const m of text.matchAll(re)){parent.append(document.createTextNode(text.slice(cursor,m.index)));let node;if(m[2]){node=document.createElement('strong');node.textContent=m[2];}else if(m[3]){node=document.createElement('code');node.textContent=m[3];}else{let url;try{url=new URL(m[5],base);}catch{}node=document.createElement(url&&['http:','https:'].includes(url.protocol)?'a':'span');node.textContent=m[4];if(node.tagName==='A'){node.href=url.href;node.target='_blank';node.rel='noopener';}}parent.append(node);cursor=m.index+m[0].length;}parent.append(document.createTextNode(text.slice(cursor)));
 }
 function markdown(text){
  const fragment=document.createDocumentFragment();const lines=text.replace(/\r/g,'').replace(/^---\n[\s\S]*?\n---\n/,'').split('\n');let list,code,paragraph;
  const cells=line=>line.trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
  const separator=line=>/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  for(let i=0;i<lines.length;i++){const line=lines[i];
   if(line.startsWith('```')){list=null;paragraph=null;if(code)code=null;else{const pre=document.createElement('pre');code=document.createElement('code');pre.append(code);fragment.append(pre);}continue;}
   if(code){code.textContent+=line+'\n';continue;}if(!line.trim()){list=null;paragraph=null;continue;}
   if(line.includes('|')&&separator(lines[i+1]||'')){list=null;paragraph=null;const wrap=document.createElement('div');wrap.className='table-wrap';const table=document.createElement('table'),head=document.createElement('thead'),row=document.createElement('tr');for(const value of cells(line)){const th=document.createElement('th');inline(value,th);row.append(th);}head.append(row);table.append(head);const body=document.createElement('tbody');i+=2;for(;i<lines.length&&lines[i].trim().includes('|');i++){const tr=document.createElement('tr');for(const value of cells(lines[i])){const td=document.createElement('td');inline(value,td);tr.append(td);}body.append(tr);}i--;table.append(body);wrap.append(table);fragment.append(wrap);continue;}
   const heading=line.match(/^(#{1,6})\s+(.+)/);if(heading){list=null;paragraph=null;const node=document.createElement('h'+heading[1].length);inline(heading[2],node);fragment.append(node);continue;}
   const item=line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);if(item){paragraph=null;const tag=/^\s*\d/.test(line)?'ol':'ul';if(!list||list.tagName.toLowerCase()!==tag){list=document.createElement(tag);fragment.append(list);}const li=document.createElement('li');inline(item[1],li);list.append(li);continue;}
   list=null;if(!paragraph){paragraph=document.createElement('p');fragment.append(paragraph);}else paragraph.append(' ');inline(line,paragraph);
  }return fragment;
 }
 async function openDocument(id,updateUrl=true){const r=resources.find(i=>i.id===id&&i.type==='prd');if(!r){toast('PRD 暂不可用');return;}if(request)request.abort();const controller=new AbortController();request=controller;
  $('documentTitle').textContent=r.feature+' · PRD '+r.version;$('documentMeta').textContent=r.status+(r.updated?' · 文档更新 '+r.updated:'');$('documentBody').textContent='正在加载…';$('documentDownload').href=href(r.path);$('documentRaw').href=href(r.path);if(!$('documentDialog').open)$('documentDialog').showModal();if(updateUrl)history.replaceState(null,'',route(r.project,r.id));
  try{const response=await fetch(href(r.path),{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(!controller.signal.aborted)$('documentBody').replaceChildren(markdown(text));}catch(e){if(e.name!=='AbortError')$('documentBody').textContent='加载失败，请稍后重试，或下载 PRD 查看。';}
 }
 document.addEventListener('click',event=>{const p=event.target.closest('a[data-project]');if(p){event.preventDefault();navigate(p.dataset.project);return;}const r=event.target.closest('[data-document]');if(r)openDocument(r.dataset.document);});
 $('searchInput').addEventListener('input',event=>{query=event.target.value;renderFeatures();});$('clearFilters').addEventListener('click',()=>{query='';$('searchInput').value='';renderFeatures();});$('closeDocument').addEventListener('click',()=>$('documentDialog').close());
 $('documentDialog').addEventListener('close',()=>{if(request)request.abort();if(new URLSearchParams(location.search).has('resource'))history.replaceState(null,'',route(projectId));});
 $('shareButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('链接已复制');}catch{toast('请复制地址栏中的链接');}});
 window.addEventListener('popstate',()=>{const current=location.href;if($('documentDialog').open)$('documentDialog').close();history.replaceState(null,'',current);readRoute();});readRoute();
})();
