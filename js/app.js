const BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const $=s=>document.querySelector(s);
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const num=n=>Math.round(n).toLocaleString('id-ID');
const rp=n=>{const a=Math.abs(n);return a>=1e9?(n/1e9).toFixed(2).replace('.',',')+' M':a>=1e6?(n/1e6).toFixed(1).replace('.',',')+' Jt':num(n)};
const rpf=n=>'Rp '+num(n);
const pc=v=>(v*100).toFixed(1).replace('.',',')+'%';
const col=v=>v>=0.9?'#16a34a':v>=0.75?'#f59e0b':'#dc2626';
const bar=v=>'<div class="pb"><i style="width:'+Math.min(v*100,100)+'%;background:'+col(v)+'"></i><span>'+pc(v)+'</span></div>';
const S={from:0,to:11,jenis:'',mata:'',bulan:null,target:100,sort:'persen',dir:1,src:'Data contoh (Data_Fiktif_Dashboard_Kinerja_Anggaran_UP2D.xlsx)'};
let D=window.DEFAULT_DATA;
const charts={};
const base={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}};

const months=()=>{const m=[];for(let i=S.from;i<=S.to;i++)m.push(i);return m};
const kin=()=>D.kinerja.filter(r=>r.b>=S.from&&r.b<=S.to&&(!S.jenis||r.jenis===S.jenis));
const ang=()=>D.anggaran.filter(r=>r.b>=S.from&&r.b<=S.to&&(!S.mata||r.mata===S.mata));
const cb=()=>S.bulan!==null&&S.bulan>=S.from&&S.bulan<=S.to?S.bulan:S.from;
const kinM=()=>{const k=kin();return months().map(b=>{const r=k.filter(x=>x.b===b),bo=sum(r,x=>x.bobot),n=sum(r,x=>x.nilai);return{b,nilai:n,bobot:bo,p:bo?n/bo:0}})};
const angM=()=>{const a=ang();return months().map(b=>{const r=a.filter(x=>x.b===b),t=sum(r,x=>x.ang),re=sum(r,x=>x.real);return{b,ang:t,real:re,sisa:t-re,p:t?re/t:0}})};
const uniq=(a,f)=>[...new Set(a.map(f))];

function mk(id,cfg){if(charts[id])charts[id].destroy();charts[id]=new Chart($('#'+id),cfg)}
function table(head,rows,foot){return '<table><thead><tr>'+head.join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody>'+(foot?'<tfoot>'+foot+'</tfoot>':'')+'</table>'}
function opts(el,list,val){el.innerHTML=list.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');el.value=val}

function fillFilters(){
  opts($('#from'),BULAN.map((b,i)=>[i,b]),S.from);
  opts($('#to'),BULAN.map((b,i)=>[i,b]),S.to);
  opts($('#jenis'),[['','Semua jenis']].concat(uniq(D.kinerja,x=>x.jenis).map(x=>[x,x])),S.jenis);
  opts($('#mata'),[['','Semua mata anggaran']].concat(uniq(D.anggaran,x=>x.mata).map(x=>[x,x])),S.mata);
  $('#target').value=S.target;
}

function renderKpis(){
  const km=kinM().filter(x=>x.bobot),am=angM(),T=S.target/100;
  const kp=km.length?sum(km,x=>x.p)/km.length:0,ta=sum(am,x=>x.ang),tr=sum(am,x=>x.real),sr=ta?tr/ta:0;
  const gap=((kp-T)*100).toFixed(1).replace('.',',');
  const it=[
    ['Total nilai kinerja',pc(kp),(kp>=T?'Tercapai':'Di bawah target')+', selisih '+gap+' poin',col(T?kp/T:0)],
    ['Target kinerja',S.target+'%','Bisa diubah di filter','#1d4ed8'],
    ['Total anggaran',rp(ta),rpf(ta),'#7c3aed'],
    ['Total realisasi',rp(tr),'Serapan '+pc(sr),col(sr)],
    ['Sisa anggaran',rp(ta-tr),pc(ta?(ta-tr)/ta:0)+' belum terserap','#0891b2']
  ];
  $('#kpis').innerHTML=it.map(x=>'<div class="kpi" style="--c:'+x[3]+'"><span>'+x[0]+'</span><b>'+x[1]+'</b><small>'+x[2]+'</small></div>').join('');
}

function renderCharts(){
  const km=kinM(),am=angM(),b0=cb(),lab=km.map(x=>BULAN[x.b].slice(0,3));
  const pick=(e,els,arr)=>{if(els.length){S.bulan=arr[els[0].index].b;renderAll()}};
  mk('c-kin',{type:'line',data:{labels:lab,datasets:[
    {label:'Kinerja',data:km.map(x=>+(x.p*100).toFixed(2)),borderColor:'#1d4ed8',backgroundColor:'rgba(29,78,216,.1)',fill:true,tension:.3,pointRadius:km.map(x=>x.b===b0?8:4),pointBackgroundColor:km.map(x=>x.b===b0?'#f5a623':'#1d4ed8')},
    {label:'Target',data:km.map(()=>S.target),borderColor:'#dc2626',borderDash:[6,4],pointRadius:0}]},
    options:{...base,onClick:(e,els)=>{if(els.length&&els[0].datasetIndex===0)pick(e,els,km)},scales:{y:{suggestedMin:60,suggestedMax:105,ticks:{callback:v=>v+'%'}}}}});
  mk('c-ang',{type:'bar',data:{labels:lab,datasets:[
    {type:'bar',label:'Anggaran',data:am.map(x=>x.ang/1e9),backgroundColor:am.map(x=>x.b===b0?'#fcd48a':'#c7d2fe')},
    {type:'bar',label:'Realisasi',data:am.map(x=>x.real/1e9),backgroundColor:am.map(x=>x.b===b0?'#f5a623':'#4f46e5')},
    {type:'line',label:'Serapan %',data:am.map(x=>+(x.p*100).toFixed(1)),borderColor:'#16a34a',yAxisID:'y1',tension:.3}]},
    options:{...base,onClick:(e,els)=>pick(e,els,am),scales:{y:{title:{display:true,text:'Miliar Rp'}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{callback:v=>v+'%'}}}}});
  const rng=D.anggaran.filter(r=>r.b>=S.from&&r.b<=S.to),ms=uniq(rng,x=>x.mata);
  const pal=['#1d4ed8','#f5a623','#16a34a','#7c3aed','#dc2626','#0891b2','#64748b','#db2777'];
  mk('c-mata',{type:'doughnut',data:{labels:ms,datasets:[{data:ms.map(m=>sum(rng.filter(r=>r.mata===m),x=>x.real)/1e9),backgroundColor:ms.map((m,i)=>pal[i%pal.length]),offset:ms.map(m=>m===S.mata?18:0)}]},
    options:{...base,onClick:(e,els)=>{if(els.length){const m=ms[els[0].index];S.mata=S.mata===m?'':m;$('#mata').value=S.mata;renderAll()}},plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>c.label+': Rp '+c.parsed.toFixed(2).replace('.',',')+' M'}}}}});
  const rows=kin().filter(r=>r.b===b0);
  $('#indT').textContent='Pencapaian indikator – '+BULAN[b0];
  opts($('#indM'),months().map(b=>[b,BULAN[b]]),b0);
  mk('c-ind',{type:'bar',data:{labels:rows.map(r=>r.ind),datasets:[{label:'Pencapaian %',data:rows.map(r=>+(r.persen*100).toFixed(1)),backgroundColor:rows.map(r=>col(r.persen))}]},
    options:{...base,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'}}}}});
}

function heatCell(v,b,suffix){const c=col(v);return '<td class="hm" data-b="'+b+'" style="background:'+c+'26;color:'+c+(b===cb()?';outline:2px solid #f5a623':'')+'">'+(v===null?'-':pc(v))+'</td>'}

function renderKinerja(){
  const k=kin(),ms=months(),inds=uniq(k,x=>x.ind);
  const head=['<th>Indikator</th>'].concat(ms.map(b=>'<th class="s" data-b="'+b+'">'+BULAN[b].slice(0,3)+'</th>'));
  const rows=inds.map(i=>'<tr><td>'+i+'</td>'+ms.map(b=>{const r=k.find(x=>x.ind===i&&x.b===b);return r?heatCell(r.persen,b):'<td class="hm">-</td>'}).join('')+'</tr>');
  $('#t-heat').innerHTML='<h2>Peta capaian indikator</h2><p class="hint">Klik kolom bulan untuk melihat rincian di bawah</p>'+table(head,rows);
  const b0=cb(),d=k.filter(r=>r.b===b0).sort((a,b)=>(typeof a[S.sort]==='string'?a[S.sort].localeCompare(b[S.sort]):a[S.sort]-b[S.sort])*S.dir);
  const hd=[['ind','Indikator'],['jenis','Jenis'],['target','Target maks'],['real','Realisasi'],['bobot','Bobot'],['nilai','Nilai'],['persen','Pencapaian']].map(h=>'<th class="s" data-k="'+h[0]+'">'+h[1]+(S.sort===h[0]?(S.dir>0?' ▲':' ▼'):'')+'</th>');
  const rw=d.map(r=>'<tr><td>'+r.ind+'</td><td>'+r.jenis+'</td><td>'+r.target+'</td><td>'+r.real+'</td><td>'+r.bobot+'</td><td>'+r.nilai.toFixed(2).replace('.',',')+'</td><td>'+bar(r.persen)+'</td></tr>');
  const bo=sum(d,x=>x.bobot),n=sum(d,x=>x.nilai);
  $('#t-ind').innerHTML='<h2>Rincian indikator – '+BULAN[b0]+'</h2><p class="hint">Klik judul kolom untuk mengurutkan</p>'+table(hd,rw,'<tr><td colspan="4">Total</td><td>'+bo+'</td><td>'+n.toFixed(2).replace('.',',')+'</td><td>'+bar(bo?n/bo:0)+'</td></tr>');
}

function renderAnggaran(){
  const rng=D.anggaran.filter(r=>r.b>=S.from&&r.b<=S.to),ms=uniq(rng,x=>x.mata);
  const rows=ms.map(m=>{const r=rng.filter(x=>x.mata===m),a=sum(r,x=>x.ang),re=sum(r,x=>x.real);return '<tr class="go'+(m===S.mata?' sel':'')+'" data-m="'+m+'"><td>'+m+'</td><td>'+rpf(a)+'</td><td>'+rpf(re)+'</td><td>'+rpf(a-re)+'</td><td>'+bar(a?re/a:0)+'</td></tr>'});
  const ta=sum(rng,x=>x.ang),tr=sum(rng,x=>x.real);
  $('#t-mata').innerHTML='<h2>Anggaran per mata anggaran</h2><p class="hint">Klik baris untuk memfilter seluruh dashboard</p>'+table(['<th>Mata anggaran</th>','<th>Anggaran</th>','<th>Realisasi</th>','<th>Sisa</th>','<th>Serapan</th>'],rows,'<tr><td>Total</td><td>'+rpf(ta)+'</td><td>'+rpf(tr)+'</td><td>'+rpf(ta-tr)+'</td><td>'+bar(ta?tr/ta:0)+'</td></tr>');
  const mm=months(),a=ang();
  const hd=['<th>Mata anggaran</th>'].concat(mm.map(b=>'<th class="s" data-b="'+b+'">'+BULAN[b].slice(0,3)+'</th>'));
  const rw=uniq(a,x=>x.mata).map(m=>'<tr><td>'+m+'</td>'+mm.map(b=>{const r=a.find(x=>x.mata===m&&x.b===b);return r?heatCell(r.ang?r.real/r.ang:0,b):'<td class="hm">-</td>'}).join('')+'</tr>');
  $('#t-heata').innerHTML='<h2>Peta serapan anggaran</h2>'+table(hd,rw);
}

function renderRekap(){
  const k=kinM(),a=angM();
  $('#t-rk').innerHTML='<h2>Rekap kinerja bulanan</h2>'+table(['<th>Bulan</th>','<th>Total nilai</th>','<th>Total bobot</th>','<th>Persentase</th>'],k.map(x=>'<tr class="go'+(x.b===cb()?' sel':'')+'" data-b="'+x.b+'"><td>'+BULAN[x.b]+'</td><td>'+x.nilai.toFixed(2).replace('.',',')+'</td><td>'+x.bobot+'</td><td>'+bar(x.p)+'</td></tr>'));
  $('#t-ra').innerHTML='<h2>Rekap anggaran bulanan</h2>'+table(['<th>Bulan</th>','<th>Total anggaran</th>','<th>Total realisasi</th>','<th>Total sisa</th>','<th>Serapan</th>'],a.map(x=>'<tr class="go'+(x.b===cb()?' sel':'')+'" data-b="'+x.b+'"><td>'+BULAN[x.b]+'</td><td>'+rpf(x.ang)+'</td><td>'+rpf(x.real)+'</td><td>'+rpf(x.sisa)+'</td><td>'+bar(x.p)+'</td></tr>'));
}

function renderAll(){
  $('#src').textContent='Sumber data: '+S.src;
  renderKpis();renderCharts();renderKinerja();renderAnggaran();renderRekap();
}

function parse(wb){
  const sn=re=>wb.SheetNames.find(n=>re.test(n.trim()));
  const sk=sn(/^data.*kinerja/i),sa=sn(/^data.*anggaran/i);
  if(!sk||!sa)throw new Error('Sheet "Data Kinerja" dan "Data Anggaran" tidak ditemukan di file ini.');
  const bi=v=>BULAN.findIndex(m=>m.toLowerCase()===String(v).trim().toLowerCase());
  const n=v=>Number(v)||0;
  const kinerja=XLSX.utils.sheet_to_json(wb.Sheets[sk]).map(r=>{const t=n(r['Target Maksimal']),re=n(r['Realisasi']),bo=n(r['Bobot']),p=r['Persentase']!==undefined?n(r['Persentase']):(t?re/t:0);return{b:bi(r['Bulan']),ind:String(r['Indikator Kinerja']||''),jenis:String(r['Jenis']||''),target:t,real:re,bobot:bo,nilai:r['Nilai Pencapaian']!==undefined?n(r['Nilai Pencapaian']):bo*p,persen:p}}).filter(r=>r.b>=0&&r.ind);
  const anggaran=XLSX.utils.sheet_to_json(wb.Sheets[sa]).map(r=>{const a=n(r['Anggaran']),re=n(r['Realisasi']);return{b:bi(r['Bulan']),mata:String(r['Mata Anggaran']||''),ang:a,real:re,sisa:r['Sisa Anggaran']!==undefined?n(r['Sisa Anggaran']):a-re,persen:a?re/a:0}}).filter(r=>r.b>=0&&r.mata);
  if(!kinerja.length||!anggaran.length)throw new Error('Data kosong atau nama kolom/bulan tidak sesuai format.');
  return{kinerja,anggaran};
}

function load(data,src){
  D=data;S.src=src;S.from=0;S.to=11;S.jenis='';S.mata='';S.bulan=null;
  fillFilters();renderAll();
}

$('#file').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=ev=>{try{load(parse(XLSX.read(ev.target.result,{type:'array'})),f.name)}catch(err){alert(err.message)}};
  rd.readAsArrayBuffer(f);e.target.value='';
});
$('#reset').onclick=()=>load(window.DEFAULT_DATA,'Data contoh (Data_Fiktif_Dashboard_Kinerja_Anggaran_UP2D.xlsx)');
$('#clear').onclick=()=>{S.from=0;S.to=11;S.jenis='';S.mata='';S.bulan=null;S.target=100;fillFilters();renderAll()};
$('#from').onchange=e=>{S.from=+e.target.value;if(S.to<S.from){S.to=S.from;$('#to').value=S.to}renderAll()};
$('#to').onchange=e=>{S.to=+e.target.value;if(S.from>S.to){S.from=S.to;$('#from').value=S.from}renderAll()};
$('#jenis').onchange=e=>{S.jenis=e.target.value;renderAll()};
$('#mata').onchange=e=>{S.mata=e.target.value;renderAll()};
$('#target').oninput=e=>{S.target=Math.max(1,+e.target.value||100);renderAll()};
$('#indM').onchange=e=>{S.bulan=+e.target.value;renderAll()};
document.querySelector('.tabs').onclick=e=>{
  const t=e.target.dataset.tab;if(!t)return;
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b===e.target));
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.id==='tab-'+t));
  Object.values(charts).forEach(c=>c.resize());
};
document.querySelector('main').addEventListener('click',e=>{
  const th=e.target.closest('th[data-k]');
  if(th){const k=th.dataset.k;S.dir=S.sort===k?-S.dir:1;S.sort=k;renderKinerja();return}
  const m=e.target.closest('[data-m]');
  if(m){S.mata=S.mata===m.dataset.m?'':m.dataset.m;$('#mata').value=S.mata;renderAll();return}
  const b=e.target.closest('[data-b]');
  if(b){S.bulan=+b.dataset.b;renderAll()}
});
$('#export').onclick=()=>{
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(kinM().map(x=>({Bulan:BULAN[x.b],'Total Nilai Kinerja':+x.nilai.toFixed(2),'Total Bobot':x.bobot,'Persentase Kinerja':+x.p.toFixed(4)}))),'Rekap Kinerja');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(angM().map(x=>({Bulan:BULAN[x.b],'Total Anggaran':x.ang,'Total Realisasi':x.real,'Total Sisa':x.sisa,'Persentase Penggunaan':+x.p.toFixed(4)}))),'Rekap Anggaran');
  XLSX.writeFile(wb,'Rekap_Dashboard_UP2D.xlsx');
};

fillFilters();
renderAll();
