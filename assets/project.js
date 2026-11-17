'use strict';
(() => {
 const scope=document.body.dataset.projectScope;
 const catalog={projects:window.PM_CATALOG.projects.filter(p=>p.id===scope)},$=id=>document.getElementById(id);
 const base=new URL('../',document.querySelector('script[src*="assets/project.js"]').src);
 const href=path=>new URL(path,base).href;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let projectId='',featureId='',resourceId='',query='',category='all',documentKey='',request,timer;
 const frames=new Map();
 function project(){return catalog.projects.find(p=>p.id===projectId);}
 function feature(){return project()?.features.find(f=>f.id===featureId);}
 function resource(){return feature()?.resources.find(r=>r.id===resourceId);}
 function kind(r){if(r.type==='prd'||/PRD/i.test(r.title))return 'prd';if(r.type==='prototype')return 'prototype';if(/report|research|调研|竞品/i.test(r.type+' '+r.title))return 'research';if(/history|archive|历史|归档/i.test(r.type+' '+r.title))return 'history';return 'other';}
 const labels={prototype:'原型',prd:'PRD',research:'调研报告',history:'历史资料',other:'其他资料'};
 function isHtml(r){return r.format==='html'||/html/.test(r.type)||/\.html?(?:[?#]|$)/i.test(r.file||r.path)||r.type==='prototype';}
 function route(p=scope,f=featureId,r=resourceId){const u=new URL('./',location.href);u.search='';u.hash='';if(f)u.searchParams.set('feature',f);if(f&&r)u.searchParams.set('resource',r);return u;}
 function readRoute(){const p=new URLSearchParams(location.search);projectId=scope;featureId=p.get('feature')||'';if(!feature())featureId='';const f=feature();resourceId=p.get('resource')||f?.resources.find(r=>r.type===p.get('view'))?.id||f?.resources[0]?.id||'';if(f&&!resource())resourceId=f.resources[0]?.id||'';render();}
 function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,2500);}
 function navigate(p,f='',r=''){projectId=scope;featureId=f;resourceId=r||feature()?.resources[0]?.id||'';query='';category='all';$('contentSearch').value='';history.pushState(null,'',route());render();}
 function selectResource(id,push=true){resourceId=id;if(push)history.pushState(null,'',route());render();}
 function render(){const p=project(),f=feature(),r=resource();document.title=(p?.name||'项目')+(f?' · '+f.name:' · 项目内容')+(r?' · '+r.title:'');$('projectTitle').textContent=p?.name||'项目';$('featureTitle').textContent=f?.name||'项目内容';$('version').textContent=f?.version||r?.version||'';$('version').hidden=!f||!$('version').textContent;$('backOverview').href=route(projectId,'','');
  $('overview').hidden=!!f;$('contentToolbar').hidden=!f;$('projectEmpty').hidden=true;
  $('prototypePanel').hidden=!r||!isHtml(r);$('prdPanel').hidden=!r||isHtml(r);
  $('contentStatus').textContent=r?.status||'';$('downloadFile').hidden=!r||r.downloadable===false;if(r)$('downloadFile').href=href(r.file||r.path);
  $('viewTabs').innerHTML=(f?.resources||[]).map(item=>`<button type="button" role="tab" data-resource="${escape(item.id)}" aria-selected="${item.id===resourceId}" tabindex="${item.id===resourceId?0:-1}">${escape(item.title||labels[kind(item)])}</button>`).join('');
  for(const frame of frames.values())frame.hidden=true;
  if(r&&isHtml(r)){const key=href(r.file||r.path);let frame=frames.get(key);if(!frame){frame=document.createElement('iframe');frame.title=(f?.name||'')+' · '+r.title;frame.referrerPolicy='same-origin';frame.src=key;$('embedFrames').append(frame);frames.set(key,frame);}frame.hidden=false;}
  const nextDocument=r&&!isHtml(r)?href(r.path):'';
  if(nextDocument&&documentKey!==nextDocument){if(request)request.abort();documentKey=nextDocument;$('documentBody').replaceChildren();$('prdPanel').scrollTop=0;loadDocument(r);}
  if(!f)renderOverview();

 }
 function renderOverview(){const p=project();const features=p?.features||[];const all=features.flatMap(f=>f.resources.map(r=>({...r,feature:f})));
  const names={all:'全部资料',prototype:'产品原型',prd:'PRD',research:'调研报告',history:'历史资料',other:'其他文档'};
  const symbols={all:'▦',prototype:'◇',prd:'▤',research:'⌕',history:'↺',other:'▧'};
  $('categoryFilters').innerHTML=Object.entries(names).map(([id,label])=>{const count=id==='all'?all.length:all.filter(r=>kind(r)===id).length;return `<button type="button" data-category="${id}" aria-pressed="${category===id}"><span class="type-symbol">${symbols[id]}</span><span>${label}</span><small>${count}</small></button>`;}).join('');
  const search=query.trim().toLowerCase();const entries=all.filter(r=>(category==='all'||kind(r)===category)&&(!search||[r.feature.name,r.title,r.description,r.version].join(' ').toLowerCase().includes(search)));
  $('overviewTitle').textContent=names[category];$('overviewSummary').textContent=`${entries.length} 份资料`;
  $('overviewCards').innerHTML=entries.map(r=>{const title=['原型','PRD'].includes(r.title)?r.feature.name+' · '+r.title:r.title;const url=route(scope,r.feature.id,r.id).href;return `<article class="document-row"><span class="document-symbol ${kind(r)}" aria-hidden="true">${symbols[kind(r)]}</span><div class="document-info"><a href="${escape(url)}" data-open-feature="${escape(r.feature.id)}" data-open-resource="${escape(r.id)}" class="document-name">${escape(title)}</a><p>${escape(r.feature.name)}<span>·</span>${escape(r.status||names[kind(r)])}</p>${r.description?`<p class="document-description">${escape(r.description)}</p>`:''}</div><div class="document-date"><span>${escape(r.version||r.feature.version||'—')}</span>${r.updated?`<time datetime="${escape(r.updated)}">${escape(r.updated)}</time>`:''}</div><a class="document-open" href="${escape(url)}" data-open-feature="${escape(r.feature.id)}" data-open-resource="${escape(r.id)}" aria-label="查看${escape(title)}">查看 <span>→</span></a></article>`;}).join('');
  $('overviewEmpty').hidden=!!entries.length;$('overviewEmptyText').textContent=search||category!=='all'?'请调整搜索词或文档类型。':'当前项目还没有登记的公开资料。';
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


 async function loadDocument(resource){const controller=new AbortController();request=controller;$('documentBody').textContent='正在加载…';try{const response=await fetch(href(resource.path),{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(!controller.signal.aborted)$('documentBody').replaceChildren(markdown(text));}catch(e){if(e.name!=='AbortError'){$('documentBody').textContent='加载失败。';const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.addEventListener('click',()=>loadDocument(resource));$('documentBody').append(retry);}}}
 document.addEventListener('click',event=>{const open=event.target.closest('[data-open-feature]');if(open){event.preventDefault();navigate(projectId,open.dataset.openFeature,open.dataset.openResource);return;}const link=event.target.closest('a[data-project]');if(link){event.preventDefault();navigate(link.dataset.project,link.dataset.feature||'');return;}const tab=event.target.closest('[data-resource]');if(tab&&tab.dataset.resource!==resourceId){selectResource(tab.dataset.resource);return;}const filter=event.target.closest('[data-category]');if(filter){category=filter.dataset.category;renderOverview();return;}if(event.target.closest('#backOverview')){event.preventDefault();navigate(projectId);}});
 $('viewTabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const items=feature()?.resources||[];let index=items.findIndex(r=>r.id===resourceId);index=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowRight'?1:-1)+items.length)%items.length;if(items[index]){selectResource(items[index].id);$('viewTabs').querySelector('[aria-selected="true"]').focus();}}});

 $('contentSearch').addEventListener('input',event=>{query=event.target.value;renderOverview();});
 $('shareButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(route().href);toast('链接已复制');}catch{toast('请复制地址栏中的链接');}});
 window.addEventListener('popstate',readRoute);readRoute();
})();
