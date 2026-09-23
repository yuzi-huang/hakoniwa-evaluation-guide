'use strict';
(async function () {
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = message => { const box = $('#toast'); box.textContent = message; box.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => box.classList.remove('show'), 3200); };
  const copy = async text => { try { await navigator.clipboard.writeText(text); toast('已复制'); } catch { toast('当前浏览器无法自动复制，请手动复制页面内容或导出文件。'); } };
  const download = (name, content, type='application/json;charset=utf-8') => { const url=URL.createObjectURL(new Blob([content],{type})); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500); };
  $('#copy-link').addEventListener('click',()=>copy(location.href));
  let data;
  try { const response=await fetch('data.json'); if(!response.ok)throw new Error('资料未加载'); data=await response.json(); }
  catch { const note=document.createElement('p'); note.className='error'; note.textContent='资料暂时无法加载，请刷新页面后重试。'; $('#overview').append(note); return; }
  const sourceIndex=new Map(data.sources.map((s,i)=>[s.id,{...s,number:i+1}]));
  const ref = id => `<a class="source-ref" href="#source-${esc(id)}">[${String(sourceIndex.get(id)?.number ?? '').padStart(2,'0')}] 来源 ↗</a>`;
  $('#genre-rows').innerHTML=data.genres.map(g=>`<tr><td><b>${esc(g.name)}</b><small>${esc(g.example)}</small></td><td>${esc(g.focus)}</td><td><span class="fit">${esc(g.fit)}</span><br>${esc(g.note)}</td></tr>`).join('');
  $('#theory-cards').innerHTML=data.theories.map(t=>`<article class="card"><div class="meta"><span>${esc(t.kind)}</span>${ref(t.source)}</div><h3>${esc(t.name)}</h3><p>${esc(t.plain)}</p><div class="example">例如：${esc(t.example)}</div><p class="next"><b>用到评测里：</b>${esc(t.use)}</p><p class="limitation">${esc(t.limit)}</p></article>`).join('');
  const originalLinks = v => v.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join('');
  $('#scale-cards').innerHTML=data.scales.map((s,i)=>`<article class="card scale-card" id="scale-${esc(s.source)}"><div class="meta"><span>玩家自报工具</span>${ref(s.source)}</div><h3>${esc(s.name)} <small>${esc(s.subtitle)}</small></h3><figure class="scale-figure"><button type="button" class="scale-preview" data-scale="${i}" aria-label="放大 ${esc(s.name)} 中文内容图解"><img src="assets/${esc(s.visual.image)}.png" alt="${esc(s.visual.alt)}" width="2400" height="2880" loading="lazy"><span>查看 ${esc(s.name)} 中文内容图解 <b aria-hidden="true">↗</b></span></button><figcaption>依据原始资料自绘；中文题意示例不是正式中文版问卷。</figcaption></figure><p><b>适合：</b>${esc(s.good)}</p><p>${esc(s.detail)}</p><p class="limitation">${esc(s.caution)}</p><details class="scale-transcript"><summary>展开图中文字说明</summary><div class="detail-body"><h4>覆盖哪些方面</h4><ul>${s.visual.dimensions.map(d=>`<li>${esc(d)}</li>`).join('')}</ul><p><b>自拟题意示例：</b>${esc(s.visual.example)}</p><p><b>结果怎么看：</b>${esc(s.visual.reading)}</p></div></details><div class="original-links"><b>原始材料</b>${originalLinks(s.visual)}</div><p class="next">${esc(s.choice)}</p></article>`).join('');
  const scaleDialog=$('#scale-dialog');
  $('#scale-cards').addEventListener('click',e=>{
    const button=e.target.closest('button[data-scale]');if(!button)return;
    const s=data.scales[Number(button.dataset.scale)],v=s.visual;
    $('#scale-dialog-title').textContent=s.name+' · 中文内容图解';
    $('#scale-dialog-image').src='assets/'+v.image+'.png';
    $('#scale-dialog-image').alt=v.alt;
    $('#scale-download-png').href='assets/'+v.image+'.png';
    $('#scale-download-png').download=v.image+'.png';
    $('#scale-download-svg').href='assets/'+v.image+'.svg';
    $('#scale-download-svg').download=v.image+'.svg';
    $('#scale-dialog-sources').innerHTML=originalLinks(v);
    scaleDialog.showModal();scaleDialog.scrollTop=0;
  });
  $('#close-scale-dialog').addEventListener('click',()=>scaleDialog.close());
  scaleDialog.addEventListener('click',e=>{if(e.target===scaleDialog){const r=scaleDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)scaleDialog.close();}});
  $('#benchmark-cards').innerHTML=data.benchmarks.map(b=>`<article class="card"><div class="meta"><span>已有工作</span>${ref(b.source)}</div><h3>${esc(b.name)}</h3><p>${esc(b.what)}</p><div class="example"><b>可以借鉴：</b>${esc(b.take)}</div><p class="limitation">${esc(b.gap)}</p></article>`).join('');
  let activeTask=0;
  const drawTask=index=>{
    activeTask=index;
    document.querySelectorAll('#task-tabs button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
    const t=data.tasks[index];
    $('#task-panel').setAttribute('aria-labelledby',`task-tab-${index}`);
    $('#task-panel').innerHTML=`<article class="task-content"><span class="label">${esc(t.tag)} · 供讨论的任务模板</span><h3>${esc(t.title)}</h3><p>${esc(t.brief)}</p><div class="conditions"><b>所有候选遵守的条件</b><ul>${t.conditions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>${t.jobs.map(j=>`<div class="job"><h4>${esc(j.name)}</h4><p><b>输入：</b>${esc(j.input)}</p><p><b>交付：</b>${esc(j.output)}</p><p><b>怎么检查：</b>${esc(j.check)}</p></div>`).join('')}<div class="task-footer"><div><b>这个品类怎样看深度</b>${esc(t.depth)}</div><div><b>要留下的记录</b>${esc(t.evidence)}</div></div><p class="limitation">${esc(t.trap)}</p><button type="button" class="button secondary" id="copy-task">复制这份任务模板</button></article>`;
    $('#copy-task').addEventListener('click',()=>copy(taskText(t)));
  };
  const taskText=t=>[t.title,'共建草案 v'+data.version,t.brief,'\n所有候选遵守的条件',...t.conditions.map(x=>'• '+x),...t.jobs.flatMap(j=>['\n'+j.name,'输入：'+j.input,'交付：'+j.output,'检查：'+j.check]),'\n深度：'+t.depth,'记录：'+t.evidence,'注意：'+t.trap].join('\n');
  $('#task-tabs').innerHTML=data.tasks.map((t,i)=>`<button role="tab" id="task-tab-${i}" aria-controls="task-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-index="${i}">${esc(t.tag)} · ${esc(t.name)}</button>`).join('');
  $('#task-tabs').addEventListener('click',e=>{const button=e.target.closest('button[data-index]');if(button)drawTask(Number(button.dataset.index));});
  $('#task-tabs').addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(activeTask+1)%data.tasks.length;if(e.key==='ArrowLeft')next=(activeTask+data.tasks.length-1)%data.tasks.length;if(e.key==='Home')next=0;if(e.key==='End')next=data.tasks.length-1;if(next!==undefined){e.preventDefault();drawTask(next);$(`#task-tab-${next}`).focus();}});
  drawTask(0);
  $('#rubric-cards').innerHTML=data.rubrics.map(r=>`<details class="rubric" id="rubric-${r.id}"><summary><span class="rubric-id">${r.id}</span><div>${esc(r.name)}<span>${esc(r.question)}</span></div></summary><div class="detail-body"><p class="boundary">评分边界：${esc(r.boundary)} ${ref(r.source)}</p><div class="anchors">${r.anchors.map((a,i)=>`<div class="n">${i}</div><div class="anchor-text">${esc(a)}</div>`).join('')}</div><div class="evidence"><b>看什么证据：</b>${esc(r.evidence)}</div><p class="next"><b>接下来要做：</b>${esc(r.next)}</p><p class="limitation">${esc(r.caveat)}</p></div></details>`).join('');
  $('#download-rubrics').addEventListener('click',e=>{e.preventDefault();const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const rows=[['编号','维度','问题','边界','0','1','2','3','4','证据','注意事项','参考来源'],...data.rubrics.map(r=>[r.id,r.name,r.question,r.boundary,...r.anchors,r.evidence,r.caveat,sourceIndex.get(r.source).url])];download('casual-benchmark-rubrics-v0.1.csv','\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('已导出评分标准');});
  $('#source-list').innerHTML=data.sources.map((s,i)=>`<article class="source-item" id="source-${esc(s.id)}"><span class="source-num">${String(i+1).padStart(2,'0')}</span><div><h4><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></h4><p>${esc(s.authors)} · ${esc(s.year)}${s.extra?` · <a href="${esc(s.extra)}" target="_blank" rel="noopener noreferrer">补充链接</a>`:''}</p><p class="type">${esc(s.type)}</p><p>${esc(s.note)}</p></div></article>`).join('');
  $('#review-genre').innerHTML='<option value="">请选择</option>'+data.genres.map(g=>`<option>${esc(g.name)}</option>`).join('');
  $('#review-items').innerHTML=data.rubrics.map(r=>`<div class="review-row"><div><h4>${r.id} · ${esc(r.name)}</h4><a href="#rubric-${r.id}" class="anchor-link">查看这一项的具体评分标准 ↗</a><label>本次评分<select name="${r.id}-score"><option value="U">U · 证据不足／待观察</option><option value="NA">N/A · 本任务不适用</option>${r.anchors.map((a,i)=>`<option value="${i}">${i} · ${['明显失效','问题突出','基本成立','表现清楚','经更多情境验证'][i]}</option>`).join('')}</select></label></div><label>证据与理由<textarea name="${r.id}-evidence" rows="3" placeholder="时间／关卡／局面，实际发生了什么，为什么对应这个评分。N/A 请说明原因。"></textarea></label></div>`).join('');
  const form=$('#review-form'),key='casual-benchmark-review-v01';
  const readForm=()=>Object.fromEntries(new FormData(form).entries());
  let storageOK=true;
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&typeof saved==='object')Object.entries(saved).forEach(([k,v])=>{const input=form.elements.namedItem(k);if(input&&typeof v==='string')input.value=v;});}
  catch{storageOK=false;}
  const updateStatus=()=>{const values=readForm();const scores=data.rubrics.filter(r=>/^[0-4]$/.test(values[r.id+'-score'])).length;const evidence=data.rubrics.filter(r=>/^[0-4]$/.test(values[r.id+'-score'])&&values[r.id+'-evidence'].trim()).length;$('#save-state').textContent=`${scores}/8 项已评分 · ${evidence} 项附有证据${storageOK?' · 本机草稿':' · 请导出保存'}`;};
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(readForm()));}catch{storageOK=false;}updateStatus();};
  form.addEventListener('input',save);form.addEventListener('change',save);form.addEventListener('submit',e=>e.preventDefault());updateStatus();
  const result=()=>{const v=readForm();return {schema:'casual-benchmark-expert-review',version:data.version,exported_at:new Date().toISOString(),build:v.build,reviewer:v.reviewer,genre:v.genre,task:v.task,device:v.device,gate:v.gate,coverage:v.coverage,ratings:data.rubrics.map(r=>({id:r.id,dimension:r.name,score:/^[0-4]$/.test(v[r.id+'-score'])?Number(v[r.id+'-score']):v[r.id+'-score'],evidence:v[r.id+'-evidence'],anchor:/^[0-4]$/.test(v[r.id+'-score'])?r.anchors[Number(v[r.id+'-score'])]:null})),priority:v.priority,interpretation:'自拟专家 rubric；未经本项目试点校准；无总分。U 与 N/A 不作为 0 分，量表数据另行记录。'};};
  const validateReview=()=>{const v=readForm();const missing=data.rubrics.find(r=>v[r.id+'-score']!=='U'&&!v[r.id+'-evidence'].trim());if(missing){toast(`${missing.id} 请补充评分证据或不适用原因，也可改为 U 待观察。`);form.elements.namedItem(missing.id+'-evidence').focus();return false;}return true;};
  $('#export-review').addEventListener('click',()=>{if(!validateReview())return;const text=JSON.stringify(result(),null,2);$('#export-json').value=text;$('#export-preview').hidden=false;$('#export-preview').open=true;download('casual-benchmark-review-'+new Date().toISOString().slice(0,10)+'.json',text);toast('记录已生成并发起下载，也可复制下方内容。');});
  $('#copy-json').addEventListener('click',()=>copy($('#export-json').value));
  $('#copy-review').addEventListener('click',()=>{if(!validateReview())return;const r=result();copy(['休闲游戏体验评审 · v'+r.version,'作品：'+r.build,'评审：'+r.reviewer,'品类／任务：'+r.genre+' / '+r.task,'设备：'+r.device,'运行检查：'+{'unchecked':'未检查','pass':'通过','blocked':'有阻断'}[r.gate],'覆盖与运行：'+r.coverage,...r.ratings.map(x=>'\n'+x.id+' '+x.dimension+'：'+x.score+'\n'+(x.evidence||'待补充证据')),'\n优先修改：'+r.priority,'\n'+r.interpretation].join('\n'));});
  const revealHash=()=>{const id=decodeURIComponent(location.hash.slice(1));const el=document.getElementById(id);if(el?.matches('details'))el.open=true;if(el&&location.hash)requestAnimationFrame(()=>el.scrollIntoView({block:'start'}));};
  window.addEventListener('hashchange',revealHash);if(location.hash)revealHash();
  document.querySelectorAll('.anchor-link').forEach(link=>link.addEventListener('click',()=>{const el=document.querySelector(link.getAttribute('href'));if(el)el.open=true;}));
  const sections=[...document.querySelectorAll('main>section')];
  const setActive=()=>{let current=sections[0];for(const s of sections){if(s.getBoundingClientRect().top<=170)current=s;}document.querySelectorAll('.sidebar nav a').forEach(a=>{const active=a.getAttribute('href')==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});};
  let scheduled=false;window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{setActive();scheduled=false;});}},{passive:true});setActive();
})();
