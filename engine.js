/* 描画に依存しない手順生成．ブラウザとNode.jsの双方で使用できます． */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const TREES = {
    basic: {A:['B','C'],B:['D','E'],C:['F','G'],D:[],E:['H','I'],F:[],G:[],H:[],I:[]},
    other: {A:['B','C','D'],B:['E','F'],C:['G'],D:['H','I'],E:[],F:[],G:[],H:['J'],I:[],J:[]}
  };
  function parseValues(text) {
    const parts = text.normalize('NFKC').trim().split(/[,，、\s]+/).filter(Boolean);
    if (!parts.length || parts.length > 12) throw Error('データは1～12個の整数を，カンマまたは空白で区切って入力してください．');
    return parts.map(s => {
      if (!/^-?\d+$/.test(s) || Math.abs(Number(s)) > 999) throw Error('各データは−999～999の整数で入力してください．');
      return Number(s);
    });
  }
  function integer(value, name, min, max) {
    const s = String(value).normalize('NFKC').trim();
    if (!/^-?\d+$/.test(s) || Number(s)<min || Number(s)>max) throw Error(`${name}は${min}～${max}の整数で入力してください．`);
    return Number(s);
  }
  function makeSequence(kind, values, options={}) {
    const frames=[];
    const emit = f => frames.push(clone(f));
    const items = values.map((value,i)=>({id:`n${i}`,value,slot:i,state:'normal'}));
    const op=options.operation || 'access';
    let capacity=values.length+(op==='insert'?1:0);
    const emitItems=(message,arr=items,extra={})=>emit({kind,items:arr,capacity,message,...extra});
    const index=options.index ?? 0;
    if (kind==='array') {
      emitItems('初期状態です．添字は0から始まります．');
      if(op==='access') {
        emitItems(`添字${index}を指定し，値${values[index]}に直接アクセスします．`,items.map(n=>({...n,state:n.slot===index?'found':'normal'})),{result:values[index],done:true});
      } else if(op==='insert') {
        emitItems(`添字${index}へ${options.value}を挿入します．後ろの要素から右へ移動し，空きを作ります．`);
        for(let i=values.length-1;i>=index;i--) {
          const node=items[i];node.slot++;
          emitItems(`値${node.value}を添字${i}から${i+1}へ移動します．`,items.map(n=>({...n,state:n.id===node.id?'current':'normal'})));
        }
        items.push({id:'new',value:options.value,slot:index,state:'found'});
        emitItems(`空いた添字${index}に${options.value}を格納しました．`,items,{done:true,result:items.slice().sort((a,b)=>a.slot-b.slot).map(n=>n.value)});
      } else {
        const removed=items[index];
        emitItems(`添字${index}の値${removed.value}を削除します．`,items.map(n=>({...n,state:n===removed?'found':'normal'})));
        items.splice(index,1);emitItems('削除した位置に空きができました．後ろの要素を左へ移動します．');
        for(let i=index;i<items.length;i++) {
          const oldSlot=items[i].slot;items[i].slot--;
          emitItems(`値${items[i].value}を添字${oldSlot}から${oldSlot-1}へ移動します．`,items.map(n=>({...n,state:n.id===items[i].id?'current':'normal'})));
        }
        emitItems('削除が完了しました．右端の空きはデータの要素数に含めません．',items.map(n=>({...n,state:'normal'})),{done:true,result:items.map(n=>n.value)});
      }
    } else if(kind==='list') {
      let links=items.map((n,i)=>({from:n.id,to:items[i+1]?.id || 'null'}));
      let head=items[0]?.id||'null';
      const linked=(message,extra={})=>emitItems(message,items,{links,head,...extra});
      linked('各ノードは値と，次のノードへの参照を持ちます．headは先頭ノードを指します．');
      if(op==='access') {
        for(let i=0;i<=index;i++) linked(`先頭から${i+1}個目のノードを確認します．${i===index?`目的の値は${items[i].value}です．`:'次の参照をたどります．'}`,{focus:items[i].id,done:i===index,result:i===index?items[i].value:undefined});
      } else if(op==='insert') {
        for(let i=0;i<index;i++) linked(`${i+1}個目のノードまで，先頭から参照をたどります．`,{focus:items[i].id});
        const next=items[index]?.id||'null';
        items.push({id:'new',value:options.value,slot:Math.max(0,index-.5),state:'found',lower:true});
        linked(`値${options.value}を持つ新しいノードを用意します．既存ノードの格納位置は動かしません．`);
        links.push({from:'new',to:next});
        linked('新しいノードのnextを，挿入位置の次のノード（またはNULL）へ向けます．',{edgeFocus:'new'});
        if(index===0)head='new';
        else links.find(e=>e.from===`n${index-1}`).to='new';
        linked(index===0?'headを新しいノードへ向けます．':'直前のノードのnextを，新しいノードへ向けます．',{edgeFocus:index===0?'head':`n${index-1}`,done:true,result:[...values.slice(0,index),options.value,...values.slice(index)]});
      } else {
        for(let i=0;i<=index;i++) linked(`先頭から${i+1}個目のノードを確認します．`,{focus:items[i].id});
        const removed=items[index];const successor=links.find(e=>e.from===removed.id).to;
        if(index===0)head=successor;
        else links.find(e=>e.from===items[index-1].id).to=successor;
        removed.state='found';
        linked(index===0?'headを次のノードへ向け，削除するノードを経路から外します．':'直前のノードのnextを，削除するノードの次へ向けます．',{edgeFocus:index===0?'head':items[index-1].id});
        links=links.filter(e=>e.from!==removed.id);items.splice(index,1);
        linked('経路から外したノードを取り除きました．残るノードの格納位置は動かしません．',{done:true,result:items.map(n=>n.value)});
      }
    } else {
      const isStack=kind==='stack';
      emitItems(isStack?'下から順にデータを追加した状態です．上端がtopです．':'左から順にデータを追加した状態です．左端がfront，右端がrearです．');
      if(op==='push'||op==='enqueue') {
        emitItems(`値${options.value}を${isStack?'上端（top）':'末尾（rear）'}に追加します．`,[...items,{id:'new',value:options.value,slot:items.length,state:'found',outside:true}],{capacity:values.length+1});
        items.push({id:'new',value:options.value,slot:items.length,state:'found'});
        emitItems('追加が完了しました．',items,{capacity:items.length,done:true,result:items.map(n=>n.value)});
      } else {
        const index=isStack?items.length-1:0;const removed=items[index];
        emitItems(`値${removed.value}を${isStack?'上端（top）':'先頭（front）'}から取り出します．`,items.map(n=>({...n,state:n===removed?'found':'normal'})));
        emitItems('取り出す値を確認してください．',items.map(n=>({...n,state:n===removed?'found':'normal',outside:n===removed})),{taken:removed.value});
        items.splice(index,1);
        // キューは残る要素を移動せず，frontを進める表現にする．
        emitItems(items.length?'取り出しが完了しました．':'データは空になりました．',items,{done:true,taken:removed.value,result:items.map(n=>n.value)});
      }
    }
    return frames;
  }
  function search(kind,values,target) {
    if(kind==='binary' && values.some((v,i)=>i>0&&values[i-1]>v)) throw Error('二分探索のデータは，左から昇順に並べて入力してください．');
    const frames=[];let count=0;const states=values.map(()=> 'normal');
    const emit=(message,extra={})=>frames.push(clone({kind,items:values.map((value,i)=>({id:`n${i}`,value,slot:i,state:states[i]})),capacity:values.length,count,target,message,...extra}));
    emit('初期状態です．比較回数は，値を確認した要素の個数として数えます．');
    if(kind==='linear') {
      for(let i=0;i<values.length;i++) {
        count++;states[i]='current';emit(`添字${i}の値${values[i]}を，探索値${target}と比較します．`,{current:i});
        if(values[i]===target) {states[i]='found';emit(`値${target}が見つかりました．比較回数は${count}回です．`,{done:true,result:i});return frames;}
        states[i]='visited';emit('一致しません．次の要素へ進みます．');
      }
    } else {
      let lo=0,hi=values.length-1;
      while(lo<=hi) {
        const mid=Math.floor((lo+hi)/2);count++;states[mid]='current';
        emit(`範囲は添字${lo}～${hi}です．中央（添字${mid}）の値${values[mid]}を探索値${target}と比較します．`,{lo,hi,current:mid});
        if(values[mid]===target) {states[mid]='found';emit(`値${target}が見つかりました．比較回数は${count}回です．`,{done:true,result:mid,lo,hi});return frames;}
        const old=mid;
        if(values[mid]<target)lo=mid+1;else hi=mid-1;
        for(let i=0;i<values.length;i++)states[i]=(i<lo||i>hi)?'excluded':'normal';
        emit(values[old]<target?'探索値の方が大きいため，中央を含む左側を探索対象から外します．':'探索値の方が小さいため，中央を含む右側を探索対象から外します．',{lo,hi});
      }
    }
    emit(`値${target}は存在しません．比較回数は${count}回です．`,{done:true,result:null});return frames;
  }
  function treeFrames(kind,treeName='basic',selected='E') {
    const tree=TREES[treeName];const frames=[];const order=[];
    const emit=(message,extra={})=>frames.push(clone({kind,tree,order,message,...extra}));
    if(kind==='tree') {
      emit('全体が一つの木です．上から下へ親子関係を表しています．');
      const parent=Object.keys(tree).find(p=>tree[p].includes(selected));
      emit(`${selected}に注目します．${parent?`親ノードは${parent}です．`:'親を持たないルートノードです．'}${tree[selected].length?`子ノードは${tree[selected].join('，')}です．`:'子を持たない葉ノードです．'}`,{current:selected,related:[...(parent?[parent]:[]),...tree[selected]],done:true});
      return frames;
    }
    emit('初期状態です．子ノードは図の左から右へ調べます．',{frontier:kind==='bfs'?['A']:[],path:[]});
    if(kind==='dfs') {
      const path=[];
      function visit(node) {
        path.push(node);order.push(node);
        emit(`${node}を初めて訪問します．${tree[node].length?'次は未訪問の子ノードへ進みます．':'子ノードがないため，親へ戻ります．'}`,{current:node,path,action:'visit'});
        for(const child of tree[node])visit(child);
        path.pop();
        if(path.length)emit(`${node}の探索を終え，親の${path[path.length-1]}へ戻ります．戻る操作は新たな訪問に数えません．`,{current:path[path.length-1],path,action:'return'});
      }
      visit('A');emit('すべてのノードを探索しました．',{path:[],done:true});
    } else {
      const queue=['A'];
      while(queue.length) {
        const node=queue.shift();order.push(node);
        emit(`キューの先頭から${node}を取り出し，訪問します．`,{current:node,frontier:queue,action:'visit'});
        for(const child of tree[node]) {
          queue.push(child);emit(`${node}の子ノード${child}を，キューの末尾へ追加します．`,{current:node,queued:child,frontier:queue,action:'enqueue'});
        }
      }
      emit('すべてのノードを探索しました．',{frontier:[],done:true});
    }
    return frames;
  }
  const api={TREES,parseValues,integer,makeSequence,search,treeFrames};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.AlgoEngine=api;
})(typeof window!=='undefined'?window:globalThis);
