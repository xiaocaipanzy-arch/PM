'use strict';
(() => {
 const catalog=window.PM_CATALOG,$=id=>document.getElementById(id);
 const base=new URL('../',document.querySelector('script[src$="assets/portal.js"]').src);
 const href=path=>new URL(path,base).href;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let projectId='',featureId='',view='prototype',prototypeKey='',documentKey='',request,timer;
 function project(){return catalog.projects.find(p=>p.id===projectId);}
 function feature(){return project()?.features.find(f=>f.id===featureId);}
 function route(){const u=new URL(base);u.searchParams.set('project',projectId);if(featureId)u.searchParams.set('feature',featureId);u.searchParams.set('view',view);return u;}
 function readRoute(){const p=new URLSearchParams(location.search);projectId=p.get('project')||(location.pathname!==base.pathname?document.body.dataset.initialProject:'')||catalog.projects[0]?.id||'';if(!project())projectId=catalog.projects[0]?.id||'';featureId=p.get('feature')||project()?.features[0]?.id||'';if(!feature())featureId=project()?.features[0]?.id||'';view=p.get('view')==='prd'||p.get('resource')==='app2-prd'?'prd':'prototype';render();}
 function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,2500);}
 function navigate(p,f){projectId=p;featureId=f||project()?.features[0]?.id||'';view='prototype';$('sourcesDialog').close();history.pushState(null,'',route());render();}
 function selectView(value,push=true){view=value;if(push)history.pushState(null,'',route());render();}
 function render(){const p=project(),f=feature();document.title=(p?.name||'项目')+(f?' · '+f.name:'')+' · '+(view==='prd'?'PRD':'原型');$('projectTitle').textContent=p?.name||'项目';$('featureTitle').textContent=f?.name||'';$('version').textContent=f?.version||'';$('version').hidden=!f;
  $('contentToolbar').hidden=!f;$('projectEmpty').hidden=!!f;$('emptyTitle').textContent=p?.name||'项目';
  $('prototypePanel').hidden=!f||view!=='prototype';$('prdPanel').hidden=!f||view!=='prd';
  for(const id of ['prototype','prd']){const tab=$(id+'Tab');tab.setAttribute('aria-selected',String(view===id));tab.tabIndex=view===id?0:-1;}
  const current=f?.resources.find(r=>r.type===view);$('contentStatus').textContent=current?.status||'';$('downloadFile').hidden=!current;if(current)$('downloadFile').href=href(current.path);
  const proto=f?.resources.find(r=>r.type==='prototype');const nextKey=proto?href(proto.path):'';
  if(prototypeKey!==nextKey){prototypeKey=nextKey;const frame=document.createElement('iframe');frame.id='prototypeFrame';frame.title='项目交互原型';frame.referrerPolicy='same-origin';$('prototypeFrame').replaceWith(frame);}
  $('prototypeFrame').hidden=!proto;$('prototypeEmpty').hidden=!!proto;
  if(view==='prototype'&&proto&&!$('prototypeFrame').hasAttribute('src'))$('prototypeFrame').src=prototypeKey;
  const prd=f?.resources.find(r=>r.type==='prd');const nextDocument=prd?href(prd.path):'';
  if(documentKey!==nextDocument){if(request)request.abort();documentKey=nextDocument;$('documentBody').replaceChildren();$('prdPanel').scrollTop=0;}
  if(view==='prd'&&f&&(!$('documentBody').hasChildNodes())){if(prd)loadDocument(prd);else $('documentBody').textContent='暂无 PRD';}
  $('featureLinks').innerHTML=p?.features.length?p.features.map(i=>`<a href="${escape(new URL('?project='+p.id+'&feature='+i.id+'&view=prototype',base).href)}" data-project="${p.id}" data-feature="${i.id}" class="source-link">${escape(i.name)}<small>${escape(i.version)}</small></a>`).join(''):'<p class="no-sources">暂无功能资料</p>';
  $('projectLinks').innerHTML=catalog.projects.filter(i=>i.id!==projectId).map(i=>`<a href="${escape(new URL('?project='+i.id,base).href)}" data-project="${i.id}" class="source-link">${escape(i.name)}<small>${i.features.length?'查看项目':'暂无资料'}</small></a>`).join('');
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

 async function loadDocument(resource){const controller=new AbortController();request=controller;$('documentBody').textContent='正在加载 PRD…';try{const response=await fetch(href(resource.path),{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(!controller.signal.aborted)$('documentBody').replaceChildren(markdown(text));}catch(e){if(e.name!=='AbortError'){$('documentBody').textContent='PRD 加载失败。';const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.addEventListener('click',()=>loadDocument(resource));$('documentBody').append(retry);}}}
 $('viewTabs').addEventListener('click',event=>{const tab=event.target.closest('[data-view]');if(tab&&tab.dataset.view!==view)selectView(tab.dataset.view);});
 $('viewTabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();selectView(event.key==='Home'?'prototype':event.key==='End'?'prd':view==='prototype'?'prd':'prototype');$(view+'Tab').focus();}});
 $('sourcesButton').addEventListener('click',()=>$('sourcesDialog').showModal());$('closeSources').addEventListener('click',()=>$('sourcesDialog').close());
 $('sourcesDialog').addEventListener('click',event=>{const link=event.target.closest('a[data-project]');if(link){event.preventDefault();navigate(link.dataset.project,link.dataset.feature);}});
 $('shareButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(route().href);toast('当前项目链接已复制');}catch{toast('请复制地址栏中的链接');}});
 window.addEventListener('popstate',readRoute);readRoute();
})();
