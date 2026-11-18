(function () {
  'use strict';
  const E=window.AlgoEngine;
  const $=id=>document.getElementById(id);
  const NS='http://www.w3.org/2000/svg';
  const colors={normal:'#fff',current:'#fff0bb',visited:'#d5eee5',found:'#ffd9c9',excluded:'#e8ebed',related:'#d5eee5'};
  const lessons={
    array:{title:'配列',group:'structure',description:'添字を指定して要素へアクセスします．途中への挿入・削除では，要素を移動して位置をそろえます．',notes:['添字は0から始めます．「添字2」は先頭から3個目の要素です．','図は挿入用の空き領域がある場合を表しています．容量不足の際に必要な領域の確保・再配置は省略しています．','削除後の右端の空きは，要素として数えません．']},
    list:{title:'連結リスト',group:'structure',description:'各ノードが，次のノードへの参照を持ちます．先頭から参照をたどり，挿入・削除では参照先をつなぎ替えます．',notes:['ここでは，次のノードへの参照だけを持つ「単方向連結リスト」を扱います．','headは先頭への参照，nextは次への参照です．NULLは参照先がないことを表します．','位置は0始まりで指定します．挿入・削除の位置に到達するまでにも，参照をたどる操作が必要です．','図のノードの間隔は説明用です．実際の記憶領域で隣り合っているとは限りません．']},
    stack:{title:'スタック',group:'structure',description:'最後に追加したデータを，最初に取り出します．上端（top）から追加・取り出しを行います．',notes:['LIFO：Last In First Out（後入れ先出し）です．','入力したデータを，左から順にpushした状態から始めます．最も右に入力した値がtopになります．','pushは追加，popは取り出しです．']},
    queue:{title:'キュー',group:'structure',description:'最初に追加したデータを，最初に取り出します．末尾（rear）へ追加し，先頭（front）から取り出します．',notes:['FIFO：First In First Out（先入れ先出し）です．','入力したデータを，左から順にenqueueした状態から始めます．最も左に入力した値がfrontになります．','enqueueは追加，dequeueは取り出しです．図では取り出すたびに残りの要素を左へ詰めず，frontを進めます．']},
    tree:{title:'木構造',group:'structure',description:'ノードを親子関係で結び，階層を表現します．親を持たないノードがルート，子を持たないノードが葉です．',notes:['注目するノードを変更し，親と子の関係を確認してください．','この教材の木は，探索順を説明するための木です．二分探索木を表しているわけではありません．','「別の木」には子を3個持つノードがあります．木構造の子の数は，必ず2個以下とは限りません．']},
    linear:{title:'線形探索',group:'search',description:'左端から順番に値を比較し，目的の値を探します．データが整列していなくても探索できます．',notes:['比較回数は「探索値と比較した要素の個数」です．画面の操作回数とは異なります．','目的の値が複数ある場合は，最初に見つかった位置で終了します．','存在しない値を指定した場合の比較回数も確認してください．']},
    binary:{title:'二分探索',group:'search',description:'整列済みのデータの中央を調べ，探索範囲を半分ずつ絞ります．探索値と中央の値の大小で，次の範囲を決めます．',notes:['データは昇順で入力してください．自動的な並べ替えは行いません．','中央の添字は（左端の添字＋右端の添字）÷2の小数点以下を切り捨てます．要素数が偶数の場合，中央2個の左側を使います．','比較回数は「探索値と比較した要素の個数」です．一致・大小の条件式を別々には数えません．','同じ値が複数あると，線形探索と異なる位置で見つかる場合があります．']},
    dfs:{title:'深さ優先探索',group:'search',description:'一つの経路を深くたどり，先に進めなくなったら戻ります．子ノードは左から右へ調べます．',notes:['訪問順は，各ノードを初めて調べた順番です．親へ戻る操作は訪問順に追加しません．','下の「現在の経路」は，再帰呼び出しのスタックに対応します．右端が現在のノードです．','この教材では木を探索します．一般のグラフで必要な閉路・重複訪問への対処は扱いません．']},
    bfs:{title:'幅優先探索',group:'search',description:'開始点に近いノードから順に調べます．キューを使い，同じ深さのノードを調べてから次の深さへ進みます．',notes:['訪問順は，キューから取り出して調べた順番です．子ノードは左から右へキューに追加します．','下のキューは，左端が次に取り出すノードです．','この教材では木を探索します．一般のグラフで必要な閉路・重複訪問への対処は扱いません．']}
  };
  let active='array',frames=[],frameIndex=0,timer=null;
  const saved={};const nodes=new Map();let svg,layers;
  function element(name,attrs={},text) {
    const el=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;return el;
  }
  function clear(node){node.replaceChildren();}
  function line(layer,x1,y1,x2,y2,attrs={}){layer.append(element('line',{x1,y1,x2,y2,stroke:'#7b9499','stroke-width':2,...attrs}));}
  function text(layer,x,y,value,cls='label',attrs={}){layer.append(element('text',{x,y,class:cls,...attrs},value));}
  function initializeSVG() {
    nodes.clear();svg=element('svg',{'viewBox':'0 0 900 290',role:'img','aria-label':lessons[active].title});
    const defs=element('defs');
    for(const [id,color]of [['arrow','#7b9499'],['arrow-focus','#bd553b']]){
      const marker=element('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});
      marker.append(element('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color}));defs.append(marker);
    }
    svg.append(defs);layers={};for(const id of ['background','edges','nodes','labels']){layers[id]=element('g');svg.append(layers[id]);}
    $('stage').replaceChildren(svg);
  }
  function paintNode(id,value,x,y,state='normal',shape='rect',w=62,h=54) {
    let data=nodes.get(id);
    if(!data){
      const group=element('g',{class:'node'});let body;
      if(shape==='circle')body=element('circle',{cx:0,cy:0,r:w/2,'stroke-width':2});
      else body=element('rect',{x:0,y:0,width:w,height:h,rx:4,'stroke-width':2});
      const valueText=element('text',{x:shape==='circle'?0:w/2,y:shape==='circle'?8:h/2+8,'text-anchor':'middle',class:'value'});
      group.append(body,valueText);
      if(shape==='list'){
        body.setAttribute('width',84);valueText.setAttribute('x',28);line(group,56,0,56,h,{stroke:'#8ca0a3','stroke-width':1});
        group.append(element('circle',{cx:70,cy:h/2,r:3,fill:'#536970'}));
      }
      layers.nodes.append(group);data={group,body,valueText};nodes.set(id,data);
    }
    data.group.style.transform=`translate(${x}px, ${y}px)`;
    data.group.setAttribute('aria-label',`${value}${state==='current'?'，現在の対象':state==='found'?'，操作・発見対象':state==='visited'?'，確認済み':state==='excluded'?'，探索対象外':''}`);
    data.body.setAttribute('fill',colors[state]||colors.normal);data.body.setAttribute('stroke',state==='current'?'#ba9022':state==='found'?'#bd553b':'#789299');
    data.valueText.textContent=value;data.group.style.opacity=state==='excluded'?'.55':'1';data.keep=true;
  }
  function drawArray(f) {
    const width=Math.max(900,f.capacity*77+80),gap=(width-100)/Math.max(f.capacity,1);svg.setAttribute('viewBox',`0 0 ${width} 270`);
    text(layers.labels,42,38,active==='array'?'格納位置と添字':'左から順に並ぶデータ');
    for(let i=0;i<f.capacity;i++){
      const x=50+i*gap;
      layers.background.append(element('rect',{x,y:86,width:62,height:54,rx:4,fill:'#f4f6f5',stroke:'#d3dcdb','stroke-dasharray':'4 4'}));
      text(layers.labels,x+31,166,`添字 ${i}`,'small',{'text-anchor':'middle'});
    }
    for(const n of f.items)paintNode(n.id,n.value,50+n.slot*gap,86,n.state);
    if(f.current!==undefined)text(layers.labels,81+f.current*gap,68,'比較中','small',{'text-anchor':'middle',fill:'#8c6610'});
    if(f.lo!==undefined&&f.lo<=f.hi){
      const x1=50+f.lo*gap,x2=50+f.hi*gap+62;
      line(layers.labels,x1,205,x2,205,{stroke:'#086b69','stroke-width':3});text(layers.labels,(x1+x2)/2,234,`探索範囲：添字${f.lo}～${f.hi}`,'label',{'text-anchor':'middle'});
    }
  }
  function drawList(f){
    const width=Math.max(900,f.capacity*110+180);svg.setAttribute('viewBox',`0 0 ${width} 325`);
    const positions=new Map(f.items.map(n=>[n.id,{x:65+n.slot*110,y:n.lower?217:100}]));
    const nullPos={x:width-70,y:126};
    function edge(from,to,startIsHead=false){
      const start=startIsHead?{x:35,y:52}:positions.get(from);if(!start)return;
      const end=to==='null'?nullPos:positions.get(to);if(!end)return;
      const x1=startIsHead?start.x:start.x+78,y1=startIsHead?start.y:start.y+26,x2=to==='null'?end.x-8:end.x-4,y2=to==='null'?end.y:end.y+26;
      const focused=f.edgeFocus===(startIsHead?'head':from);
      let d;
      if(startIsHead)d=`M ${x1} ${y1} C ${x1} ${y1+25}, ${x2} ${y2-35}, ${x2} ${y2}`;
      else if(Math.abs(y1-y2)>10)d=`M ${x1} ${y1} C ${x1+45} ${y1}, ${x2-35} ${y2}, ${x2} ${y2}`;
      else if(x2-x1>115)d=`M ${x1} ${y1} C ${x1+30} ${y1-68}, ${x2-30} ${y2-68}, ${x2} ${y2}`;
      else d=`M ${x1} ${y1} L ${x2} ${y2}`;
      layers.edges.append(element('path',{d,fill:'none',stroke:focused?'#bd553b':'#7b9499','stroke-width':focused?3:2,'marker-end':`url(#${focused?'arrow-focus':'arrow'})`,class:'edge'}));
    }
    text(layers.labels,17,34,'head','small');edge('head',f.head,true);
    for(const e of f.links)edge(e.from,e.to);
    for(const n of f.items){const p=positions.get(n.id);paintNode(n.id,n.value,p.x,p.y,f.focus===n.id?'current':n.state,'list',84,52);text(layers.labels,p.x+69,p.y+72,'next','small',{'text-anchor':'middle'});}
    text(layers.labels,nullPos.x,nullPos.y+5,'NULL','small');
  }
  function drawStack(f){
    const height=Math.max(310,80+Math.max(f.capacity,f.items.length)*42);svg.setAttribute('viewBox',`0 0 900 ${height}`);
    const base=height-45;
    line(layers.background,310,25,310,base+2);line(layers.background,490,25,490,base+2);line(layers.background,310,base+2,490,base+2);
    text(layers.labels,400,base+28,'底','label',{'text-anchor':'middle'});
    for(const n of f.items)paintNode(n.id,n.value,n.outside?570:335,base-(n.slot+1)*42,n.state,'rect',130,35);
    const inside=f.items.filter(n=>!n.outside);if(inside.length){const top=inside[inside.length-1];text(layers.labels,275,base-(top.slot+1)*42+24,'top','label',{'text-anchor':'end'});line(layers.labels,282,base-(top.slot+1)*42+17,323,base-(top.slot+1)*42+17,{'marker-end':'url(#arrow)'});}
    else text(layers.labels,400,base-30,'空','label',{'text-anchor':'middle'});
    if(f.items.some(n=>n.outside))text(layers.labels,635,base+28,'追加・取り出しの対象','small',{'text-anchor':'middle'});
  }
  function drawQueue(f){
    const width=Math.max(900,(f.capacity+1)*82+100);svg.setAttribute('viewBox',`0 0 ${width} 290`);const gap=78;
    for(const n of f.items)paintNode(n.id,n.value,60+n.slot*gap,n.outside?185:90,n.state);
    const inside=f.items.filter(n=>!n.outside);
    if(inside.length){
      const first=inside[0],last=inside[inside.length-1];
      text(layers.labels,91+first.slot*gap,65,'front','label',{'text-anchor':'middle'});
      text(layers.labels,91+last.slot*gap,166,'rear','label',{'text-anchor':'middle'});
    }else text(layers.labels,60,65,'キューは空です．');
    if(f.items.some(n=>n.outside))text(layers.labels,60,265,'下段：追加・取り出しの対象','small');
  }
  function treePositions(tree){
    const pos={};let leaf=0;
    function walk(n,depth){if(!tree[n].length)pos[n]={x:leaf++,y:depth};else{for(const c of tree[n])walk(c,depth+1);pos[n]={x:(pos[tree[n][0]].x+pos[tree[n].at(-1)].x)/2,y:depth};}}
    walk('A',0);for(const p of Object.values(pos)){p.x=70+p.x*(760/Math.max(leaf-1,1));p.y=53+p.y*80;}return pos;
  }
  function drawTree(f){
    const pos=treePositions(f.tree);svg.setAttribute('viewBox','0 0 900 360');
    for(const [p,children]of Object.entries(f.tree))for(const c of children){
      const a=pos[p],b=pos[c],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),hot=f.path?.includes(p)&&f.path?.includes(c);
      line(layers.edges,a.x+dx/len*24,a.y+dy/len*24,b.x-dx/len*24,b.y-dy/len*24,{stroke:hot?'#bd553b':'#9badae','stroke-width':hot?3:2});
    }
    for(const [id,p]of Object.entries(pos)){
      let state=f.order?.includes(id)?'visited':'normal';if(f.related?.includes(id))state='related';if(f.queued===id)state='found';if(f.current===id)state='current';
      paintNode(id,id,p.x,p.y,state,'circle',48,48);
      const visit=f.order.indexOf(id);if(visit>=0)text(layers.labels,p.x+31,p.y-18,`${visit+1}`,'small',{'text-anchor':'middle'});
      if(active==='tree'){if(id==='A')text(layers.labels,p.x+36,p.y+5,'ルート','small');else if(!f.tree[id].length)text(layers.labels,p.x,p.y+43,'葉','small',{'text-anchor':'middle'});}
    }
  }
  function render(){
    const f=frames[frameIndex];if(!f)return;
    for(const layer of [layers.background,layers.edges,layers.labels])clear(layer);
    for(const data of nodes.values())data.keep=false;
    if(['tree','dfs','bfs'].includes(active))drawTree(f);else if(active==='list')drawList(f);else if(active==='stack')drawStack(f);else if(active==='queue')drawQueue(f);else drawArray(f);
    for(const[id,data]of nodes){if(!data.keep){data.group.remove();nodes.delete(id);}}
    $('message').textContent=f.message;$('step-label').textContent=frameIndex===0?'初期状態':`手順 ${frameIndex} / ${frames.length-1}`;
    $('counter').textContent=['linear','binary'].includes(active)?`比較回数 ${f.count} 回`:f.done?'完了':'';
    clear($('auxiliary'));
    const add=(label,value)=>{const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label;p.append(strong,document.createTextNode(value));$('auxiliary').append(p);};
    if(active==='dfs'||active==='bfs'){
      add('訪問順：',f.order.length?f.order.join(' → '):'まだ訪問していません．');
      add(active==='dfs'?'現在の経路（右端がtop）：':'待機中のキュー（左端がfront）：',(active==='dfs'?f.path:f.frontier)?.join(' → ')||'空');
    }else if(active==='list'&&f.done&&Array.isArray(f.result))add('headからたどる順：',f.result.length?f.result.join(' → '):'空');
    else if(f.taken!==undefined)add('取り出す値：',String(f.taken));
    else if(f.done&&Array.isArray(f.result))add('操作後のデータ：',f.result.length?f.result.join('，'):'空');
    else if(f.done&&['linear','binary'].includes(active))add('探索結果：',f.result===null?'存在しません．':`添字 ${f.result}（先頭から${f.result+1}個目）`);
    $('timeline').max=frames.length-1;$('timeline').value=frameIndex;
    $('previous').disabled=frameIndex===0;$('reset').disabled=frameIndex===0&&!timer;$('next').disabled=frameIndex===frames.length-1;
    $('play').disabled=frames.length<=1;updatePlay();
  }
  function updatePlay(){$('play').textContent=timer?'一時停止':frameIndex===frames.length-1?'最初から再生':'自動再生';$('play').setAttribute('aria-pressed',String(Boolean(timer)));}
  function pause(){if(timer)clearInterval(timer);timer=null;updatePlay();}
  function play(){if(timer){pause();return;}if(frameIndex===frames.length-1)frameIndex=0;timer=setInterval(()=>{if(frameIndex<frames.length-1){frameIndex++;render();}if(frameIndex===frames.length-1){pause();render();}},Number($('speed').value));render();}
  function field(label,id,value,type='text',cls=''){
    const wrapper=document.createElement('label');wrapper.append(document.createTextNode(label));const input=document.createElement('input');input.id=id;input.name=id;input.type=type;input.value=value;input.className=cls;wrapper.append(input);return wrapper;
  }
  function select(label,id,options,value){const wrapper=document.createElement('label');wrapper.append(document.createTextNode(label));const sel=document.createElement('select');sel.id=id;sel.name=id;for(const [v,name]of options){const option=document.createElement('option');option.value=v;option.textContent=name;sel.append(option);}sel.value=value;wrapper.append(sel);return wrapper;}
  function buildSettings(){
    const form=$('settings');clear(form);const s=saved[active]||{};
    if(['tree','dfs','bfs'].includes(active)){
      form.append(select('木の形','tree-choice',[['basic','基本の木'],['other','別の木']],s.tree||'basic'));
      if(active==='tree'){
        const choices=Object.keys(E.TREES[s.tree||'basic']).map(n=>[n,n]);form.append(select('注目するノード','selected',choices,s.selected||'E'));
        $('tree-choice').addEventListener('change',()=>{saved[active]={tree:$('tree-choice').value,selected:'E'};buildSettings();});
      }
    }else{
      form.append(field(active==='binary'?'データ（昇順・最大12個）':'データ（最大12個）','values',s.values||(active==='binary'?'1,5,8,12,14,26':['linear','array','list'].includes(active)?'5,12,1,8,14,26':'5,12,1'),'text','data'));
      if(['linear','binary'].includes(active))form.append(field('探索する値','target',s.target??14,'text','small'));
      else{
        const opts=active==='array'||active==='list'?[['access','アクセス'],['insert','挿入'],['delete','削除']]:active==='stack'?[['push','push（追加）'],['pop','pop（取り出し）']]:[['enqueue','enqueue（追加）'],['dequeue','dequeue（取り出し）']];
        const op=s.operation||opts[0][0];form.append(select('操作','operation',opts,op));
        const index=field('添字・位置（0始まり）','index',s.index??2,'text','small');index.id='index-field';form.append(index);
        const value=field('追加する値','value',s.value??3,'text','small');value.id='value-field';form.append(value);
        $('operation').addEventListener('change',updateFields);updateFields();
      }
    }
    const apply=document.createElement('button');apply.type='submit';apply.textContent='設定を反映';form.append(apply);
    const sample=document.createElement('button');sample.type='button';sample.className='quiet';sample.textContent='標準の例に戻す';sample.addEventListener('click',()=>{delete saved[active];pause();buildSettings();build();});form.append(sample);
  }
  function updateFields(){const op=$('operation').value;$('index-field').hidden=!['array','list'].includes(active);$('value-field').hidden=!['insert','push','enqueue'].includes(op);}
  function build(){
    pause();$('error').textContent='';
    try{
      let newFrames,s;
      if(['tree','dfs','bfs'].includes(active)){
        s={tree:$('tree-choice').value,selected:$('selected')?.value||'E'};newFrames=E.treeFrames(active,s.tree,s.selected);
      }else{
        s={values:$('values').value};const values=E.parseValues(s.values);
        if(['linear','binary'].includes(active)){
          s.target=$('target').value;newFrames=E.search(active,values,E.integer(s.target,'探索する値',-999,999));
        }else{
          s.operation=$('operation').value;s.index=$('index').value;s.value=$('value').value;
          const opts={operation:s.operation};
          if(['array','list'].includes(active))opts.index=E.integer(s.index,'添字・位置',0,values.length-(s.operation==='insert'?0:1));
          if(['insert','push','enqueue'].includes(s.operation))opts.value=E.integer(s.value,'追加する値',-999,999);
          newFrames=E.makeSequence(active,values,opts);
        }
      }
      saved[active]=s;frames=newFrames;frameIndex=0;initializeSVG();render();
    }catch(error){$('error').textContent=error.message;}
  }
  function switchTab(key,focus=false){
    pause();active=key;location.hash=key;
    for(const tab of document.querySelectorAll('[role=tab]')){const yes=tab.id===`tab-${key}`;tab.setAttribute('aria-selected',String(yes));tab.tabIndex=yes?0:-1;}
    if(focus)$(`tab-${key}`).focus();
    $('lesson').setAttribute('aria-labelledby',`tab-${key}`);$('lesson-title').textContent=lessons[key].title;
    $('section-label').textContent=lessons[key].group==='structure'?'データ構造':'探索アルゴリズム';$('description').textContent=lessons[key].description;
    clear($('notes'));for(const note of lessons[key].notes){const p=document.createElement('p');p.textContent=note;$('notes').append(p);}
    buildSettings();build();
  }
  for(const[key,lesson]of Object.entries(lessons)){
    const tab=document.createElement('button');tab.id=`tab-${key}`;tab.type='button';tab.role='tab';tab.textContent=lesson.title;tab.setAttribute('aria-controls','lesson');tab.setAttribute('aria-selected','false');tab.tabIndex=-1;tab.addEventListener('click',()=>switchTab(key));
    tab.addEventListener('keydown',event=>{const siblings=Object.keys(lessons);let i=siblings.indexOf(key);if(event.key==='ArrowRight')i=(i+1)%siblings.length;else if(event.key==='ArrowLeft')i=(i+siblings.length-1)%siblings.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=siblings.length-1;else return;event.preventDefault();switchTab(siblings[i],true);});
    $(`${lesson.group}-tabs`).append(tab);
  }
  $('settings').addEventListener('submit',event=>{event.preventDefault();build();});
  $('next').addEventListener('click',()=>{pause();frameIndex=Math.min(frames.length-1,frameIndex+1);render();});
  $('previous').addEventListener('click',()=>{pause();frameIndex=Math.max(0,frameIndex-1);render();});
  $('reset').addEventListener('click',()=>{pause();frameIndex=0;render();});$('play').addEventListener('click',play);
  $('timeline').addEventListener('input',()=>{pause();frameIndex=Number($('timeline').value);render();});
  $('speed').addEventListener('change',()=>{if(timer){pause();play();}});
  $('projection').addEventListener('click',()=>{const on=document.body.classList.toggle('projector');$('projection').setAttribute('aria-pressed',String(on));$('projection').textContent=on?'通常表示':'投影表示';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();render();}});
  window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(lessons[key]&&key!==active)switchTab(key);});
  switchTab(lessons[location.hash.slice(1)]?location.hash.slice(1):'array');
})();
