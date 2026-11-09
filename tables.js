// Table preferences are local to this browser; inventory remains in team storage.
const tablePreferences = (() => {try {return JSON.parse(localStorage.getItem('dp_tables')||'{}')} catch {return {}}})();
function enhanceTables(){
  document.querySelectorAll('#app table').forEach((table,tableIndex)=>{
    const head=table.rows[0];if(!head)return;
    const headings=Array.from(head.cells).map(c=>c.textContent.trim());
    const key=JSON.stringify([tab,tab==='po'?sub:'',headings,tableIndex]);
    const pref=tablePreferences[key] ||= {widths:[],filters:[],sort:-1,direction:1};
    const persist=()=>{try{localStorage.setItem('dp_tables',JSON.stringify(tablePreferences))}catch{}};
    const rows=Array.from(table.rows).slice(1);
    const thead=table.createTHead();thead.append(head);
    const oldBodies=Array.from(table.tBodies);const tbody=table.createTBody();rows.forEach(row=>tbody.append(row));oldBodies.forEach(body=>body.remove());
    const cols=document.createElement('colgroup');table.prepend(cols);
    const tools=document.createElement('div');tools.className='table-tools';
    const count=document.createElement('span');const reset=document.createElement('button');reset.className='btn';reset.textContent='Reset tabel';
    tools.append(count,reset);table.parentElement.before(tools);
    const empty=document.createElement('tr');empty.innerHTML=`<td class="empty-filter" colspan="${head.cells.length}">Tidak ada baris yang cocok dengan filter.</td>`;
    const text=(row,i)=>{const c=row.cells[i];return c?.querySelector('input')?.value || c?.querySelector('input')?.placeholder || c?.textContent.trim() || ''};
    const numeric=value=>{if(value==='∞')return Infinity;const clean=value.replace(/\./g,'').replace(',','.').replace(/%$/,'').trim();return /^[-+]?\d+(\.\d+)?$/.test(clean)?Number(clean):null};
    const apply=()=>{
      const sorted=rows.slice();
      if(pref.sort>=0)sorted.sort((a,b)=>{const x=text(a,pref.sort),y=text(b,pref.sort),nx=numeric(x),ny=numeric(y);return pref.direction*(nx!==null&&ny!==null?(nx===ny?0:nx<ny?-1:1):x.localeCompare(y,'id',{numeric:true}))});
      let visible=0;sorted.forEach(row=>{row.hidden=!pref.filters.every((filter,i)=>!filter||text(row,i).toLocaleLowerCase('id').includes(filter.toLocaleLowerCase('id')));if(!row.hidden)visible++;tbody.append(row)});
      empty.remove();if(!visible)tbody.append(empty);count.textContent=`${visible} dari ${rows.length} baris · tarik batas judul untuk mengatur lebar`;
      Array.from(head.cells).forEach((c,i)=>{c.querySelector('button').textContent=(headings[i]||'Aksi')+(pref.sort===i?(pref.direction===1?' ↑':' ↓'):' ↕');c.setAttribute('aria-sort',pref.sort===i?(pref.direction===1?'ascending':'descending'):'none')});
    };
    const setWidth=(i,w)=>{pref.widths[i]=Math.max(90,w);cols.children[i].style.width=pref.widths[i]+'px';table.style.width=pref.widths.reduce((a,b)=>a+b,0)+'px'};
    headings.forEach((title,i)=>{
      const cell=head.cells[i],col=document.createElement('col');cols.append(col);
      pref.widths[i] ||= title==='Nama'?260:title==='SKU'?180:title.includes('Keterangan')?240:145;
      col.style.width=pref.widths[i]+'px';cell.replaceChildren();
      const sort=document.createElement('button');sort.className='sort-col';sort.type='button';sort.title='Urutkan '+(title||'Aksi');sort.onclick=()=>{pref.direction=pref.sort===i?-pref.direction:1;pref.sort=i;apply();persist()};
      const filter=document.createElement('input');filter.className='column-filter';filter.type='search';filter.placeholder='Filter…';filter.setAttribute('aria-label','Filter '+(title||'Aksi'));filter.value=pref.filters[i]||'';filter.oninput=()=>{pref.filters[i]=filter.value;apply();persist()};
      const resize=document.createElement('span');resize.className='col-resize';resize.title='Tarik untuk mengatur lebar kolom';resize.setAttribute('aria-hidden','true');
      resize.onpointerdown=e=>{e.preventDefault();const start=e.clientX,width=pref.widths[i];resize.setPointerCapture(e.pointerId);resize.onpointermove=move=>setWidth(i,width+move.clientX-start);resize.onpointerup=()=>{resize.onpointermove=null;persist()}};
      cell.append(sort,filter,resize);
    });
    table.style.width=pref.widths.reduce((a,b)=>a+b,0)+'px';
    reset.onclick=()=>{delete tablePreferences[key];persist();render()};apply();
  });
}
