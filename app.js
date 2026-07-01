/* ============================================================
   Grinex LinkedIn Dashboard — logika
   ============================================================ */
const C = {
  teal:'#5f8c94', koromiko:'#ffb14e', salmon:'#fa8775',
  punch:'#ea5f94', orchid:'#ec7ed8', grape:'#54399a',
  black:'#000000', ink:'#1c1f22', gray:'#888d92', grid:'#ebedee',
};
const PERSON_COLOR = {
  'Richard Jahoda': C.teal,
  'Richard Jahoda ml.': C.koromiko,
  'Kamila Blechová': C.salmon,
  'Lenka Nečasová': C.orchid,
  'Grinex LinkedIn': C.grape,
};
const MONTHS_SHORT = ['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro'];

const SECTIONS = [
  { id:'overview', icon:'1', title:'Přehled',          sub:'Jak se nám daří na první pohled',          person:true  },
  { id:'reach',    icon:'2', title:'Dosah v čase',      sub:'Vývoj a růst dosahu příspěvků',            person:true  },
  { id:'timing',   icon:'3', title:'Nejlepší čas',      sub:'Kdy publikovat pro maximální dosah',       person:true  },
  { id:'network',  icon:'4', title:'Růst sítě',         sub:'Sledující a spojení v čase',               person:false },
  { id:'compare',  icon:'5', title:'Srovnání profilů za celé období spolupráce',  sub:'Richard Jahoda vs Richard Jahoda ml.',   person:false },
  { id:'top',      icon:'6', title:'TOP příspěvky',     sub:'Nejúspěšnější příspěvky podle dosahu',     person:false },
  { id:'pipeline', icon:'7', title:'Stav obsahu',       sub:'Publikováno vs. rozpracováno',             person:false, year:false },
  { id:'profiles', icon:'8', title:'Profil ambasadora',  sub:'LinkedIn Analytics — data přímo z platformy', person:false, year:false },
  { id:'meta',     icon:'9',  title:'Meta',               sub:'Facebook a Instagram — výkon obsahu',          person:false, year:false },
  { id:'youtube',  icon:'10', title:'YouTube',            sub:'Grinex Czech Republic — výkon kanálu',         person:false, year:false },
  { id:'podcast',  icon:'11', title:'Podcast',            sub:'BARVY BYZNYSU — celkový zásah napříč platformami', person:false, year:false },
];

let DATA = null;
let state = { section:'overview', year:'all', person:'all', netTab:'Richard Jahoda' };
const charts = {};

const fmt = n => (n==null?'—':Math.round(n).toLocaleString('cs-CZ'));
const fmtK = n => n>=1e6 ? (n/1e6).toLocaleString('cs-CZ',{maximumFractionDigits:1})+' mil.' : n>=1000 ? (n/1000).toLocaleString('cs-CZ',{maximumFractionDigits:1})+' tis.' : fmt(n);
const fmtMln = n => n>=1e6 ? (n/1e6).toLocaleString('cs-CZ',{maximumFractionDigits:2})+' mil.' : fmtK(n);
const fmtDate = iso => { const [y,m,d]=iso.split('-'); return `${+d}.${+m}.${y}`; };
const yearOf = iso => Number(iso.slice(0,4));
const $ = s => document.querySelector(s);

Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Open Sans','Helvetica Neue',Arial,sans-serif";
Chart.defaults.color = C.ink;
Chart.defaults.plugins.datalabels.display = false;
Chart.defaults.plugins.legend.labels.font = { family:"'Montserrat',sans-serif", weight:'600', size:12 };
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;

function mkChart(id, cfg){ if(charts[id]) charts[id].destroy(); charts[id]=new Chart($('#'+id), cfg); }
const baseScales = (pct=false) => ({
  x:{ grid:{display:false}, ticks:{font:{size:11}} },
  y:{ grid:{color:C.grid}, border:{display:false},
      ticks:{ font:{size:11}, callback:v=> pct? v+'%' : fmtK(v) } }
});
const tip = { backgroundColor:C.black, padding:12, titleFont:{family:"'Montserrat'",weight:'700'},
  bodyFont:{family:"'Open Sans'"}, cornerRadius:4, displayColors:true, boxPadding:4 };

// ----------------------------------------------------------------------------
async function init(){
  DATA = await (await fetch('data.json')).json();
  const q = new URLSearchParams(location.search);
  if(q.get('s') && SECTIONS.some(x=>x.id===q.get('s'))) state.section = q.get('s');
  if(q.get('year')) state.year = q.get('year');
  if(q.get('person')) state.person = q.get('person');
  if(q.get('net')) state.netTab = q.get('net');
  buildNav();
  buildYearSeg();
  buildPersonSeg();
  buildFoot();
  render();
}

function buildNav(){
  $('#nav').innerHTML = SECTIONS.map(s=>`
    <button class="nav__item${s.id===state.section?' is-active':''}" data-sec="${s.id}">
      <span class="nav__num">${s.icon}</span><span>${s.title}</span>
    </button>`).join('');
  $('#nav').querySelectorAll('.nav__item').forEach(b=>b.onclick=()=>{ state.section=b.dataset.sec; render(); });
}
function buildYearSeg(){
  const yrs = ['all', ...DATA.meta.years];
  $('#yearSeg').innerHTML = yrs.map(y=>`<button data-year="${y}"${String(y)===String(state.year)?' class="is-active"':''}>${y==='all'?'Vše':y}</button>`).join('');
  $('#yearSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.year=b.dataset.year; render(); });
}
function buildPersonSeg(){
  const labels = { 'all':'Vše', 'Richard Jahoda':'R. Jahoda', 'Richard Jahoda ml.':'R. Jahoda ml.', 'Kamila Blechová':'K. Blechová', 'Lenka Nečasová':'L. Nečasová' };
  $('#personSeg').innerHTML = DATA.meta.persons.map(p=>`<button data-person="${p}"${p===state.person?' class="is-active"':''}>${labels[p]||p}</button>`).join('');
  $('#personSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.person=b.dataset.person; render(); });
}
function buildFoot(){
  const m=DATA.meta;
  $('#foot').innerHTML = `Zdroj: ${m.source_file}<br>Aktualizováno: ${m.generated_at}<br>Data k ${m.data_until}`;
}

// ----------------------------------------------------------------------------
function render(){
  const sec = SECTIONS.find(s=>s.id===state.section);
  $('#nav').querySelectorAll('.nav__item').forEach(b=>b.classList.toggle('is-active', b.dataset.sec===state.section));
  $('#secTitle').textContent = sec.title;
  $('#secSub').textContent = sec.sub;
  $('#personWrap').style.display = sec.person ? '' : 'none';
  $('#yearWrap').style.display   = sec.year === false ? 'none' : '';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('is-active'));
  $('#s-'+sec.id).classList.add('is-active');
  $('#yearSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', String(b.dataset.year)===String(state.year)));
  $('#personSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', b.dataset.person===state.person));

  ({ overview:renderOverview, reach:renderReach, timing:renderTiming,
     network:renderNetwork, compare:renderCompare, top:renderTop, pipeline:renderPipeline,
     profiles:renderProfiles, meta:renderMeta, youtube:renderYoutube, podcast:renderPodcast })[sec.id]();
}

const kkey = () => `${state.year}|${state.person}`;
const prevYearKey = () => {
  if(state.year==='all') return null;
  const i = DATA.meta.years.indexOf(Number(state.year));
  return i>0 ? `${DATA.meta.years[i-1]}|${state.person}` : null;
};

// ---- 1. OVERVIEW ----
function renderOverview(){
  const k = DATA.kpis[kkey()] || {reach:0,posts:0,avg:0,engagement:0};

  // Porovnání se stejným obdobím předchozího roku (ne celý rok)
  const spPrev = (() => {
    if(state.year==='all') return null;
    const curY = Number(state.year);
    const yi = DATA.meta.years.indexOf(curY);
    if(yi<=0) return null;
    const prevY = DATA.meta.years[yi-1];
    // Kolik měsíců má aktuální rok data?
    const curM = DATA.monthly[`${curY}|${state.person}`] || new Array(12).fill(0);
    const nMo  = curM.reduce((last,v,i)=>v>0?i+1:last, 0) || 6;
    // Dosah za stejné měsíce předchozího roku
    const prevM = DATA.monthly[`${prevY}|${state.person}`] || new Array(12).fill(0);
    const reach = prevM.slice(0,nMo).reduce((s,v)=>s+v,0);
    // Počty příspěvků za stejné měsíce předchozího roku
    const prevPM = (DATA.monthly_posts||{})[`${prevY}|${state.person}`] || new Array(12).fill(0);
    const posts  = prevPM.slice(0,nMo).reduce((s,v)=>s+v,0);
    const avg    = posts&&reach ? Math.round(reach/posts) : 0;
    const MO = ['led','úno','bře','dub','kvě','čvn','čvc','srp','zář','říj','lis','pro'];
    return { reach, posts, avg, label:`jan–${MO[nMo-1]} ${prevY}` };
  })();

  const delta = (cur,prev) => {
    if(!spPrev||!prev) return '';
    const d = Math.round((cur-prev)/prev*100);
    return `<span class="kpi__delta ${d>=0?'up':'down'}">${d>=0?'▲':'▼'} ${Math.abs(d)} %</span><span>vs ${spPrev.label}</span>`;
  };
  // síť LinkedIn — sledující ke konci zvoleného roku (síť roste v čase)
  const netUpTo = (person) => {
    const series = DATA.network[person]?.LinkedIn?.series;
    if(!series || !series.length) return null;
    const first = series.find(p=>p.foll!=null) || series[0];
    const filt = (state.year==='all') ? series : series.filter(p=>yearOf(p.date)<=Number(state.year));
    const last = [...(filt.length?filt:series.slice(0,1))].reverse().find(p=>p.foll!=null) || first;
    return { start:first.foll, foll:last.foll, date:last.date };
  };
  const netPersons = (state.person==='all') ? Object.keys(DATA.network) : (DATA.network[state.person] ? [state.person] : []);
  let follNow=0, follGain=0, lastDate='';
  for(const p of netPersons){ const v=netUpTo(p); if(v){ follNow+=v.foll; follGain+=(v.foll-v.start); if(v.date>lastDate) lastDate=v.date; } }
  const follLabel = state.year==='all'
    ? `Sledující na LinkedIn (k ${lastDate?fmtDate(lastDate):'dnešku'})`
    : `Sledující na LinkedIn (k ${lastDate?fmtDate(lastDate):'konci '+state.year})`;

  const tiles = [
    { dark:true, label:'Celkový dosah', value:fmt(k.reach), sub:delta(k.reach, spPrev&&spPrev.reach) || 'zobrazení příspěvků' },
    { label:'Publikované příspěvky', value:fmt(k.posts), sub:delta(k.posts, spPrev&&spPrev.posts) || 'za období' },
    { label:'Průměrný dosah / příspěvek', value:fmt(k.avg), sub:delta(k.avg, spPrev&&spPrev.avg) || 'zobrazení' },
    { label:'Míra zapojení', value:(k.engagement||0).toLocaleString('cs-CZ')+' %', sub:'lajky + komentáře / dosah' },
    { label:follLabel, value:fmt(follNow), sub:`<span class="kpi__delta up">▲ +${fmt(follGain)}</span><span>od začátku</span>` },
  ];
  $('#kpiGrid').innerHTML = tiles.map(t=>`
    <div class="kpi${t.dark?' kpi--dark':''}">
      <div class="kpi__label">${t.label}</div>
      <div class="kpi__value">${t.value}</div>
      <div class="kpi__sub">${t.sub}</div>
    </div>`).join('');

  // monthly chart (if year specific) else yearly
  if(state.year==='all'){
    $('#ovChartHint').textContent = 'souhrn po letech';
    const yrs = DATA.meta.years;
    mkChart('ovMonthly',{ type:'bar', data:{ labels:yrs.map(String),
      datasets:[{ label:'Celkový dosah', data:yrs.map(y=>{
        const a=DATA.yearly[y]||{};
        return state.person==='all' ? Object.values(a).reduce((s,v)=>s+v,0) : (a[state.person]||0); }),
        backgroundColor:C.teal, borderRadius:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}}}, scales:baseScales() }});
  } else {
    $('#ovChartHint').textContent = `rok ${state.year}`;
    const m = DATA.monthly[kkey()] || new Array(12).fill(0);
    mkChart('ovMonthly',{ type:'bar', data:{ labels:MONTHS_SHORT,
      datasets:[{ label:'Dosah', data:m, backgroundColor:C.teal, borderRadius:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}}}, scales:baseScales() }});
  }
}

// ---- 2. REACH ----
function renderReach(){
  const isAll = state.year === 'all';
  const yrs = DATA.meta.years;
  const yearForCharts = isAll ? yrs[yrs.length - 1] : Number(state.year);
  const allMonthLabels = isAll
    ? yrs.flatMap(yr => MONTHS_SHORT.map(mo => `${mo} '${String(yr).slice(2)}`))
    : MONTHS_SHORT;
  const m = isAll
    ? yrs.flatMap(yr => DATA.monthly[`${yr}|${state.person}`] || new Array(12).fill(0))
    : DATA.monthly[`${yearForCharts}|${state.person}`] || new Array(12).fill(0);

  // --- Souhrn nad grafy ---
  const totalReach = state.year === 'all'
    ? DATA.meta.years.reduce((s,y) => {
        const row = DATA.yearly[y] || {};
        if(state.person === 'all') return s + Object.values(row).reduce((a,b)=>a+b,0);
        return s + (row[state.person] || 0);
      }, 0)
    : m.reduce((a,b)=>a+b,0);

  const kAll = state.year === 'all'
    ? DATA.meta.years.reduce((s,y) => {
        const k2 = DATA.kpis[`${y}|${state.person === 'all' ? 'all' : state.person}`] || {};
        return { posts: (s.posts||0)+(k2.posts||0), avg: 0 };
      }, {})
    : DATA.kpis[kkey()] || {};
  const posts  = state.year === 'all' ? (kAll.posts||'—') : (kAll.posts||'—');
  const avg    = posts && totalReach && posts !== '—' ? Math.round(totalReach / posts) : null;
  const period = state.year === 'all' ? 'celé období' : `rok ${yearForCharts}`;
  const who    = state.person === 'all' ? 'všichni ambasadoři' : state.person;

  $('#reachSummary').innerHTML = `
    <div class="reach-sum-bar">
      <div class="reach-sum-item reach-sum-item--main">
        <div class="reach-sum-val">${fmtMln(totalReach)}</div>
        <div class="reach-sum-lbl">Celkový dosah — ${period} · ${who}</div>
      </div>
      ${posts !== '—' ? `<div class="reach-sum-item">
        <div class="reach-sum-val">${fmt(posts)}</div>
        <div class="reach-sum-lbl">Příspěvků</div>
      </div>` : ''}
      ${avg ? `<div class="reach-sum-item">
        <div class="reach-sum-val">${fmt(avg)}</div>
        <div class="reach-sum-lbl">Průměr / příspěvek</div>
      </div>` : ''}
    </div>`;
  mkChart('reachMonthly',{ type:'bar', data:{ labels:allMonthLabels,
    datasets:[{ label:isAll?'Dosah (celé období)':`Dosah ${yearForCharts}`, data:m, backgroundColor:C.teal, borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)}}}, scales:baseScales() }});

  let cumRun = 0;
  const cum = isAll
    ? m.map(v => { cumRun += v; return cumRun; })
    : (DATA.cumulative[yearForCharts]||{}).cumulative || new Array(12).fill(0);
  mkChart('reachCumulative',{ type:'line', data:{ labels:allMonthLabels,
    datasets:[{ label:isAll?'Kumulativně (celé období)':`Kumulativně ${yearForCharts}`, data:cum, borderColor:C.teal, backgroundColor:'rgba(95,140,148,0.12)',
      fill:true, tension:0.3, pointRadius:3, pointBackgroundColor:C.teal, borderWidth:2.5 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>'Dohromady: '+fmt(c.parsed.y)}}}, scales:baseScales() }});

  let ds;
  if(isAll) {
    const ambs = ['Richard Jahoda','Richard Jahoda ml.','Kamila Blechová','Lenka Nečasová'];
    ds = ambs.map(p=>({
      label:p,
      data:yrs.flatMap(yr=>(DATA.monthly_stacked[String(yr)]||{})[p]||new Array(12).fill(0)),
      backgroundColor:PERSON_COLOR[p], borderRadius:2, stack:'s'
    })).filter(d=>d.data.some(v=>v>0));
  } else {
    const stacks = DATA.monthly_stacked[String(yearForCharts)]||{};
    ds = Object.keys(stacks).map(p=>({ label:p, data:stacks[p], backgroundColor:PERSON_COLOR[p], borderRadius:2, stack:'s' }));
  }
  mkChart('reachStacked',{ type:'bar', data:{ labels:allMonthLabels, datasets:ds },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}, tooltip:{...tip,callbacks:{label:c=>c.dataset.label+': '+fmt(c.parsed.y)}}},
      scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}} } }});

  // Srovnání let — jen stejné měsíce (fair porovnání neúplného roku)
  const lastY   = yrs[yrs.length - 1];
  const lastYM  = DATA.monthly[`${lastY}|all`] || new Array(12).fill(0);
  const nMoSP   = lastYM.reduce((last,v,i)=>v>0?i+1:last, 0) || 6;
  const MO_CZ   = ['led','úno','bře','dub','kvě','čvn','čvc','srp','zář','říj','lis','pro'];
  // Součet dosahu za stejné období (nMoSP měsíců) per ambassador per year
  const spYearly = {};
  for(const yr of yrs){
    spYearly[yr] = {};
    const stacked = DATA.monthly_stacked[String(yr)] || {};
    for(const [person, mArr] of Object.entries(stacked)){
      spYearly[yr][person] = mArr.slice(0, nMoSP).reduce((s,v)=>s+v, 0);
    }
  }
  const ambassadors = ['Richard Jahoda', 'Richard Jahoda ml.', 'Kamila Blechová', 'Lenka Nečasová'];
  const ambColors   = [C.teal, C.koromiko, C.salmon, C.orchid];
  const yearlyDatasets = ambassadors
    .map((amb,i)=>({ label:amb, data:yrs.map(y=>(spYearly[y]||{})[amb]||0), backgroundColor:ambColors[i], borderRadius:3, stack:'s' }))
    .filter(ds=>ds.data.some(v=>v>0));
  const lastDsIdx = yearlyDatasets.length - 1;
  // Popisky os: "2025 (jan–čvn)" a "2026 (jan–čvn)"
  const yrLabels = yrs.map(y=>`${y} (jan–${MO_CZ[nMoSP-1]})`);
  if($('#reachYearlyHint')) $('#reachYearlyHint').textContent = `Jan–${MO_CZ[nMoSP-1].charAt(0).toUpperCase()+MO_CZ[nMoSP-1].slice(1)} · stejné období obou let`;
  mkChart('reachYearly',{ type:'bar', data:{ labels:yrLabels, datasets:yearlyDatasets },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}, tooltip:{...tip,callbacks:{label:c=>c.dataset.label+': '+fmt(c.parsed.y)}},
      datalabels:{display:ctx=>ctx.datasetIndex===lastDsIdx, anchor:'end',align:'end',
        formatter:(v,ctx)=>{ const yr=yrs[ctx.dataIndex]; return fmtMln(Object.values(spYearly[yr]||{}).reduce((s,x)=>s+x,0)); },
        font:{family:"'Montserrat'",weight:'700',size:11},color:C.black}},
      scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}} } }});
}

// ---- 3. TIMING ----
function renderTiming(){
  const t = DATA.timing[kkey()];
  if(!t){ return; }
  const colorByVal = (arr,max) => arr.map(v=> `rgba(95,140,148,${0.25+0.75*(v/max||0)})`);

  // Zobrazujeme i sloty s 1 příspěvkem — tooltip upozorní na "malý vzorek"
  const MIN_N = 1;

  const days  = t.day.filter(d => d.n >= MIN_N);
  const hours = t.hour.filter(h => h.n >= MIN_N);

  // day
  if(days.length){
    const dMax = Math.max(...days.map(d=>d.avg));
    mkChart('timeDay',{ type:'bar', data:{ labels:days.map(d=>d.label),
      datasets:[{ data:days.map(d=>d.avg), backgroundColor:colorByVal(days.map(d=>d.avg),dMax), borderRadius:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
        tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' prům. dosah',afterLabel:c=>`${days[c.dataIndex].n} příspěvků`+(days[c.dataIndex].low?' (malý vzorek)':'')}}},
        scales:baseScales() }});
  }

  // hour
  if(hours.length){
    const hMax = Math.max(...hours.map(h=>h.avg));
    mkChart('timeHour',{ type:'bar', data:{ labels:hours.map(h=>h.hour+':00'),
      datasets:[{ data:hours.map(h=>h.avg), backgroundColor:colorByVal(hours.map(h=>h.avg),hMax), borderRadius:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
        tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' prům. dosah',afterLabel:c=>`${hours[c.dataIndex].n} příspěvků`+(hours[c.dataIndex].low?' (malý vzorek)':'')}}},
        scales:baseScales() }});
  }

  // month
  const mMax = Math.max(...t.month.map(m=>m.avg), 1);
  mkChart('timeMonth',{ type:'bar', data:{ labels:MONTHS_SHORT,
    datasets:[{ data:t.month.map(m=>m.avg), backgroundColor:colorByVal(t.month.map(m=>m.avg),mMax), borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' prům. dosah',afterLabel:c=>`${t.month[c.dataIndex].n} příspěvků`}}},
      scales:baseScales() }});

  // heatmap — všechny buňky s alespoň 1 příspěvkem
  renderHeatmap(t.heatmap.filter(c=>c.n >= 1));

  // note
  const bestDay = [...days].sort((a,b)=>b.avg-a.avg)[0];
  const bestH   = [...hours].sort((a,b)=>b.avg-a.avg)[0];
  const lowNote = bestDay?.low || bestH?.low ? ' <span class="lowsample">Malý vzorek — data orientační.</span>' : '';
  const outlierNote = (t.outliers_excluded > 0)
    ? ` <span class="lowsample">Vyloučeno ${t.outliers_excluded} příspěvků nad ${fmtK(t.outlier_cap)}.</span>`
    : '';
  $('#timeNote').innerHTML = bestDay
    ? `💡 Nejlépe vychází <b>${bestDay.label}</b> (prům. ${fmt(bestDay.avg)} zobrazení)` +
      (bestH?` a čas kolem <b>${bestH.hour}:00</b> (prům. ${fmt(bestH.avg)}).`:'.') +
      lowNote + outlierNote
    : `<span class="lowsample">Pro tento filtr není dostatek dat — zvolte širší rozsah.</span>`;
}

function renderHeatmap(cells){
  const WD = ['Po','Út','St','Čt','Pá','So','Ne'];
  const max = Math.max(...cells.map(c=>c.avg), 1);
  const map = {};
  cells.forEach(c=> map[c.d+'_'+c.h]=c);
  // active hours range
  const hoursPresent = [...new Set(cells.map(c=>c.h))].sort((a,b)=>a-b);
  const hMin = Math.min(...hoursPresent), hMax = Math.max(...hoursPresent);
  let html = '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:11px">';
  html += '<tr><th style="padding:4px;text-align:left"></th>';
  for(let h=hMin;h<=hMax;h++) html+=`<th style="padding:3px 2px;font-family:Montserrat;font-weight:600;color:#888;font-size:10px">${h}</th>`;
  html += '</tr>';
  for(let d=0;d<7;d++){
    html += `<tr><td style="padding:4px 8px 4px 4px;font-family:Montserrat;font-weight:600;color:#1c1f22">${WD[d]}</td>`;
    for(let h=hMin;h<=hMax;h++){
      const c = map[d+'_'+h];
      if(c){
        const op = 0.12 + 0.88*(c.avg/max);
        const txt = c.avg/max>0.55?'#fff':'#1c1f22';
        html += `<td title="${WD[d]} ${h}:00 — prům. ${fmt(c.avg)} (${c.n} přísp.)" style="background:rgba(95,140,148,${op.toFixed(2)});color:${txt};text-align:center;padding:6px 2px;font-size:9px;font-weight:600">${c.avg>=1000?Math.round(c.avg/1000)+'k':c.avg}</td>`;
      } else {
        html += `<td style="background:#f5f6f6;border:1px solid #fff"></td>`;
      }
    }
    html += '</tr>';
  }
  html += '</table></div>';
  $('#heatmap').innerHTML = html;
}

// ---- 4. NETWORK ----
function renderNetwork(){
  // tabs
  const netTabPersons = Object.keys(DATA.network);
  $('#netTabs').innerHTML = netTabPersons.map(p=>`<button class="subtab${p===state.netTab?' is-active':''}" data-net="${p}">${p}</button>`).join('');
  $('#netTabs').querySelectorAll('.subtab').forEach(b=>b.onclick=()=>{ state.netTab=b.dataset.net; renderNetwork(); });

  const person = state.netTab;
  const li = DATA.network[person]?.LinkedIn;
  if(!li){ $('#netSummary').innerHTML='<div class="note">Pro tuto osobu nejsou data.</div>'; return; }
  const yr = state.year;

  // Síť roste v čase → při zvoleném roce oříznout řadu ke KONCI toho roku
  const cut = arr => (yr==='all') ? arr.slice() : arr.filter(p=>yearOf(p.date)<=Number(yr));
  const series = (() => { const c = cut(li.series); return c.length ? c : li.series.slice(0,1); })();
  const firstFoll = li.series.find(p=>p.foll!=null) || li.series[0];
  const firstConn = li.series.find(p=>p.conn!=null) || li.series[0];
  const lastFoll = [...series].reverse().find(p=>p.foll!=null) || firstFoll;
  const lastConn = [...series].reverse().find(p=>p.conn!=null) || firstConn;
  const gain = (a,b)=> a-b;
  const pct  = (a,b)=> b ? Math.round((a-b)/b*100) : 0;

  // summary tiles
  const tiles = [
    { l:'Sledující — start', v:fmt(firstFoll.foll), d:fmtDate(firstFoll.date), muted:true },
    { l:`Sledující — k ${fmtDate(lastFoll.date)}`, v:fmt(lastFoll.foll), d:`+${fmt(gain(lastFoll.foll,firstFoll.foll))} (+${pct(lastFoll.foll,firstFoll.foll)} %)` },
    { l:'Spojení — start', v:fmt(firstConn.conn), d:fmtDate(firstConn.date), muted:true },
    { l:`Spojení — k ${fmtDate(lastConn.date)}`, v:fmt(lastConn.conn), d:`+${fmt(gain(lastConn.conn,firstConn.conn))} (+${pct(lastConn.conn,firstConn.conn)} %)` },
  ];
  $('#netSummary').innerHTML = tiles.map(t=>`<div class="ns-tile"><div class="l">${t.l}</div><div class="v">${t.v}</div>${t.d?`<div class="d"${t.muted?' style="color:var(--text-faint)"':''}>${t.d}</div>`:''}</div>`).join('');

  const labels = series.map(p=>p.date);
  mkChart('netFollowers',{ type:'line', data:{ labels,
    datasets:[{ label:'Sledující', data:series.map(p=>p.foll), borderColor:PERSON_COLOR[person]||C.teal,
      backgroundColor:'rgba(95,140,148,0.10)', fill:true, tension:0.25, pointRadius:0, borderWidth:2.5 }]},
    options:netLineOpts() });
  mkChart('netConnections',{ type:'line', data:{ labels,
    datasets:[{ label:'Spojení', data:series.map(p=>p.conn), borderColor:C.koromiko,
      backgroundColor:'rgba(255,177,78,0.12)', fill:true, tension:0.25, pointRadius:0, borderWidth:2.5 }]},
    options:netLineOpts() });

  // přírůstek sledujících po letech
  const yg = li.summary.foll_yearly_gain||{};
  let yrs = Object.keys(yg);
  if(yr!=='all') yrs = yrs.filter(y=>Number(y)<=Number(yr));
  mkChart('netYearly',{ type:'bar', data:{ labels:yrs,
    datasets:[{ data:yrs.map(y=>yg[y]), backgroundColor:PERSON_COLOR[person]||C.teal, borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
      datalabels:{display:true,anchor:'end',align:'end',formatter:v=>'+'+fmt(v),font:{family:"'Montserrat'",weight:'700',size:11},color:C.black},
      tooltip:{...tip,callbacks:{label:c=>'+'+fmt(c.parsed.y)+' sledujících'}}}, scales:baseScales() }});

  // Always hide netNote for Grinex (no extra social platforms note needed)
  $('#netNote').style.display='none';
}
function netLineOpts(){
  return { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
    tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)}}},
    scales:{ x:{grid:{display:false}, ticks:{maxTicksLimit:8,font:{size:10}}}, y:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}} } };
}

// ---- 5. COMPARE ----
function renderCompare(){
  const yr = state.year;
  const persons = ['Richard Jahoda', 'Richard Jahoda ml.'];
  const colors  = persons.map(p=>PERSON_COLOR[p]);
  const ks = persons.map(p=> DATA.kpis[`${yr}|${p}`]||{reach:0,posts:0,avg:0,engagement:0});
  mkChart('cmpReach',{ type:'bar', data:{ labels:persons,
    datasets:[{ data:ks.map(k=>k.reach), backgroundColor:colors, borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},
      datalabels:{display:true,anchor:'end',align:'right',formatter:v=>fmt(v),font:{family:"'Montserrat'",weight:'700'},color:C.ink},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.x)}}}, scales:{x:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}},y:{grid:{display:false}}} }});
  mkChart('cmpAvg',{ type:'bar', data:{ labels:persons,
    datasets:[{ data:ks.map(k=>k.avg), backgroundColor:colors, borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},
      datalabels:{display:true,anchor:'end',align:'right',formatter:v=>fmt(v),font:{family:"'Montserrat'",weight:'700'},color:C.ink},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.x)}}}, scales:{x:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}},y:{grid:{display:false}}} }});

  const shortNames = { 'Richard Jahoda':'R. Jahoda', 'Richard Jahoda ml.':'R. Jahoda ml.', 'Kamila Blechová':'K. Blechová', 'Lenka Nečasová':'L. Nečasová' };
  const rows = persons.map((p,i)=>{
    const k=ks[i]; const net=DATA.network[p]?.LinkedIn?.summary;
    const col = PERSON_COLOR[p] || C.gray;
    return `<tr><td><span class="badge" style="background:${col}22;color:${col}">${shortNames[p]||p}</span></td>
      <td class="num">${fmt(k.posts)}</td><td class="num">${fmt(k.reach)}</td><td class="num">${fmt(k.avg)}</td>
      <td class="num">${(k.engagement||0).toLocaleString('cs-CZ')} %</td>
      <td class="num">${net?fmt(net.foll_now):'—'}</td>
      <td class="num">${net?'+'+fmt(net.foll_gain):'—'}</td></tr>`;
  }).join('');
  $('#cmpTable').innerHTML = `<thead><tr><th>Profil</th><th class="num">Příspěvků</th><th class="num">Dosah</th><th class="num">Ø dosah</th><th class="num">Zapojení</th><th class="num">Sledující dnes</th><th class="num">Růst sled.</th></tr></thead><tbody>${rows}</tbody>`;
}

// ---- 6. TOP ----
function renderTop(){
  const yr = state.year;
  const filtered = yr === 'all'
    ? DATA.top_posts
    : DATA.top_posts.filter(p => {
        // date format "DD.MM.YYYY"
        const parts = p.date.split('.');
        return parts.length === 3 && parts[2] === String(yr);
      });
  const hint = yr === 'all' ? 'za celé období' : `rok ${yr}`;
  if($('#topHint')) $('#topHint').textContent = `TOP 20 podle dosahu (${hint})`;

  const shortNameMap = {
    'Richard Jahoda':'R. Jahoda',
    'Richard Jahoda ml.':'R. Jahoda ml.',
    'Kamila Blechová':'K. Blechová',
    'Lenka Nečasová':'L. Nečasová',
  };
  const badgeHtml = (name) => {
    const col = PERSON_COLOR[name] || C.gray;
    const label = shortNameMap[name] || name;
    return `<span class="badge" style="background:${col}22;color:${col}">${label}</span>`;
  };

  const rows = filtered.length
    ? filtered.map((p,i)=>`
        <tr><td class="rank">${i+1}</td>
          <td>${badgeHtml(p.name)}</td>
          <td>${p.date}</td>
          <td>${p.idea||'<span class="muted">—</span>'}</td>
          <td class="num">${fmt(p.imp)}</td>
          <td class="num">${fmt(p.likes)}</td>
          <td class="num">${fmt(p.comments)}</td></tr>`).join('')
    : `<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">Žádné příspěvky pro rok ${yr}</td></tr>`;
  $('#topTable').innerHTML = `<thead><tr><th>#</th><th>Autor</th><th>Datum</th><th>Hlavní myšlenka</th><th class="num">Dosah</th><th class="num">Lajky</th><th class="num">Koment.</th></tr></thead><tbody>${rows}</tbody>`;
}

// ---- 7. PIPELINE ----
function renderPipeline(){
  const pipe = DATA.pipeline;
  const labelMap = { '1 - Done':'Publikováno','8 - Idea':'Nápad','5 - WIP':'Rozpracováno',
    '4 - Client control':'Ke schválení','3 - Edit':'Úprava','99 - Don\'t add':'Nepublikovat','—':'Bez stavu' };
  const entries = Object.entries(pipe).sort((a,b)=>b[1]-a[1]);
  const labels = entries.map(e=>labelMap[e[0]]||e[0]);
  const vals = entries.map(e=>e[1]);
  mkChart('pipeChart',{ type:'doughnut', data:{ labels, datasets:[{ data:vals, backgroundColor:[C.teal,C.koromiko,C.salmon,C.orchid,C.grape,C.gray,'#cccccc'], borderWidth:2, borderColor:'#fff' }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%', plugins:{legend:{position:'right'},
      tooltip:{...tip,callbacks:{label:c=>c.label+': '+fmt(c.parsed)}}}} });
  const total = vals.reduce((a,b)=>a+b,0);
  $('#pipeTable').innerHTML = `<thead><tr><th>Stav</th><th class="num">Počet</th><th class="num">Podíl</th></tr></thead><tbody>`+
    entries.map((e,i)=>`<tr><td>${labels[i]}</td><td class="num">${fmt(e[1])}</td><td class="num">${Math.round(e[1]/total*100)} %</td></tr>`).join('')+
    `<tr style="font-weight:700"><td>Celkem</td><td class="num">${fmt(total)}</td><td class="num">100 %</td></tr></tbody>`;
}

// ---- 8. PROFIL AMBASADORA ----
let profTab = 'Richard Jahoda ml.';

function renderProfiles(){
  const analytics = DATA.linkedin_analytics || {};
  const persons = Object.keys(analytics);

  if(!persons.length){ $('#profContent').innerHTML='<div class="note">Žádná data LinkedIn Analytics.</div>'; return; }

  // Tabs (jen pokud je víc profilů)
  if(persons.length > 1){
    $('#profTabs').innerHTML = persons.map(p=>`<button class="subtab${p===profTab?' is-active':''}" data-prof="${p}">${p}</button>`).join('');
    $('#profTabs').querySelectorAll('.subtab').forEach(b=>b.onclick=()=>{ profTab=b.dataset.prof; renderProfiles(); });
  } else {
    profTab = persons[0];
    $('#profTabs').innerHTML = '';
  }

  const a = analytics[profTab];
  if(!a){ $('#profContent').innerHTML='<div class="note">Žádná data.</div>'; return; }

  if(a.type === 'company'){ renderCompanyPage(a); return; }

  const color = PERSON_COLOR[profTab] || C.teal;
  const colorRgbMap = {'#5f8c94':'95,140,148','#ffb14e':'255,177,78','#fa8775':'250,135,117','#ec7ed8':'236,126,216','#54399a':'84,57,154'};
  const colorRgb = colorRgbMap[color] || '95,140,148';

  const netSeries = (DATA.network[profTab]?.LinkedIn?.series||[]).filter(p=>p.date>='2026-01-01');
  const firstNet = netSeries.find(p=>p.foll!=null);
  const lastNet  = [...netSeries].reverse().find(p=>p.foll!=null);
  const follGain = (firstNet && lastNet) ? lastNet.foll - firstNet.foll : 0;

  const monthly2026raw = DATA.monthly[`2026|${profTab}`] || new Array(12).fill(0);
  const monthlyLabels  = MONTHS_SHORT;
  const monthlyData    = monthly2026raw;

  const photoHtml = a.photo
    ? `<img src="${a.photo}" alt="${profTab}" class="prof-photo">`
    : `<div class="prof-initials" style="background:${color}">${profTab.split(' ').map(w=>w[0]).join('')}</div>`;

  const viewDelta = a.content.views_change_pct;
  const viewSign  = viewDelta >= 0 ? '▲' : '▼';
  const viewCls   = viewDelta >= 0 ? 'up' : 'down';

  const demoBar = items => {
    const maxP = Math.max(...items.map(x=>x.pct), 1);
    return `<div class="demo-list">${items.map(item=>`
      <div class="demo-row">
        <div class="demo-row__top">
          <span class="demo-row__label">${item.label}</span>
          <span class="demo-row__pct">${item.pct} %</span>
        </div>
        <div class="demo-row__bar-wrap">
          <div class="demo-row__bar" style="width:${Math.round(item.pct/maxP*100)}%;background:rgba(${colorRgb},0.75)"></div>
        </div>
      </div>`).join('')}</div>`;
  };

  const engRows = [
    ['Reakce',               a.engagement.reactions],
    ['Komentáře',            a.engagement.comments],
    ['Přesdílení',           a.engagement.reshares],
    ['Uložení',              a.engagement.saves],
    ['Odeslání na LinkedIn', a.engagement.sends],
    ['Kliknutí na odkaz',    a.engagement.link_clicks],
  ];

  const topPostsHtml = (a.top_posts?.length) ? `
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">Nejúspěšnější příspěvky</div>
        <div class="card__hint">dle zobrazení · ${a.period}</div>
      </div>
      <div class="top-posts-grid">
        ${a.top_posts.map((p,i)=>`
          <div class="top-post-card">
            <div class="top-post-rank">#${i+1}</div>
            <img src="${p.file}" alt="Příspěvek ${i+1}" class="top-post-img" loading="lazy">
            <div class="top-post-body">
              <div class="top-post-text">${p.text}</div>
              <div class="top-post-views">${fmt(p.views)} <span>zobrazení</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : '';

  $('#profContent').innerHTML = `
    <div class="card prof-header">
      ${photoHtml}
      <div class="prof-header__info">
        <div class="prof-header__name">${profTab}</div>
        <div class="prof-header__tagline">${a.tagline}</div>
        <div class="prof-header__period">LinkedIn Analytics &middot; ${a.period}</div>
      </div>
      <div class="prof-header__stats">
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.content.views)}</div>
          <div class="prof-stat__lbl">Zobrazení</div>
          <div class="prof-stat__delta ${viewCls}">${viewSign} ${Math.abs(viewDelta)}&thinsp;%</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.followers.total)}</div>
          <div class="prof-stat__lbl">Sledující</div>
          <div class="prof-stat__delta up">▲ ${a.followers.change_pct}&thinsp;%</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.content.members_reached)}</div>
          <div class="prof-stat__lbl">Oslovení</div>
          <div class="prof-stat__delta neutral">členové</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.engagement.total)}</div>
          <div class="prof-stat__lbl">Interakcí</div>
          <div class="prof-stat__delta neutral">celkem</div>
        </div>
      </div>
    </div>

    ${buildSsiCard(a, color, colorRgb)}

    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head">
          <div class="card__title">Růst sledujících</div>
          <div class="card__hint">2026 &middot; +${fmt(follGain)} nových</div>
        </div>
        <div class="chart-wrap"><canvas id="profFollowers"></canvas></div>
      </div>
      <div class="card">
        <div class="card__head">
          <div class="card__title">Zobrazení obsahu po měsících</div>
          <div class="card__hint">2026 &middot; zdroj: LinkedIn Analytics</div>
        </div>
        <div class="chart-wrap"><canvas id="profViews"></canvas></div>
      </div>
    </div>

    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Zapojení publika</div><div class="card__hint">detail aktivit za ${a.period}</div></div>
        <table class="tbl">
          <thead><tr><th>Typ aktivity</th><th class="num">Počet</th></tr></thead>
          <tbody>
            ${engRows.map(r=>`<tr><td>${r[0]}</td><td class="num">${fmt(r[1])}</td></tr>`).join('')}
            <tr style="font-weight:700;border-top:2px solid var(--border-default)">
              <td>Celkem sociální</td><td class="num">${fmt(a.engagement.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Pracovní tituly sledujících</div><div class="card__hint">demografická data LinkedIn</div></div>
        ${demoBar(a.demographics.job_title)}
      </div>
    </div>

    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Lokalita sledujících</div><div class="card__hint">top regiony</div></div>
        ${demoBar(a.demographics.location)}
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Služební věk sledujících</div><div class="card__hint">seniorita publika</div></div>
        ${demoBar(a.demographics.seniority)}
      </div>
    </div>

    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Obor sledujících</div><div class="card__hint">top sektory</div></div>
        ${demoBar(a.demographics.industry)}
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Velikost firmy sledujících</div><div class="card__hint">struktura publika dle velikosti firmy</div></div>
        ${demoBar(a.demographics.company_size)}
      </div>
    </div>

    ${topPostsHtml}
  `;

  if(netSeries.length > 0){
    mkChart('profFollowers',{
      type:'line',
      data:{
        labels: netSeries.map(p=>p.date),
        datasets:[{ label:'Sledující', data:netSeries.map(p=>p.foll),
          borderColor:color, backgroundColor:`rgba(${colorRgb},0.12)`,
          fill:true, tension:0.35, pointRadius:2, pointHoverRadius:5, borderWidth:2.5 }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{...tip, callbacks:{label:c=>fmt(c.parsed.y)+' sledujících'}} },
        scales:{ x:{grid:{display:false}, ticks:{maxTicksLimit:7, font:{size:10}}},
          y:{grid:{color:C.grid}, border:{display:false}, ticks:{callback:v=>fmtK(v)}} } }
    });
  }

  if(monthlyData.some(v=>v>0)){
    mkChart('profViews',{
      type:'bar',
      data:{ labels:monthlyLabels, datasets:[{ label:'Zobrazení', data:monthlyData,
        backgroundColor:`rgba(${colorRgb},0.8)`, borderRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false},
          tooltip:{...tip, callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}},
          datalabels:{ display:true, anchor:'end', align:'end', formatter:v=>fmtK(v),
            font:{family:"'Montserrat'",weight:'700',size:10}, color:C.ink } },
        scales:baseScales() }
    });
  }
}

// ---- COMPANY PAGE ----
function renderCompanyPage(a){
  const color = C.grape;
  const colorRgb = '84,57,154';

  const netSeries = (DATA.network['Grinex LinkedIn']?.LinkedIn?.series||[]).filter(p=>p.date>='2026-01-01');
  const firstNet = netSeries.find(p=>p.foll!=null);
  const lastNet  = [...netSeries].reverse().find(p=>p.foll!=null);
  const follGain = (firstNet && lastNet) ? lastNet.foll - firstNet.foll : (a.followers.new_organic || 0);

  const demoBar = items => {
    if(!items?.length) return '<div class="muted" style="padding:16px">Data nejsou k dispozici</div>';
    const maxP = Math.max(...items.map(x=>x.pct), 1);
    return `<div class="demo-list">${items.map(item=>`
      <div class="demo-row">
        <div class="demo-row__top">
          <span class="demo-row__label">${item.label}</span>
          <span class="demo-row__pct">${item.pct} %</span>
        </div>
        <div class="demo-row__bar-wrap">
          <div class="demo-row__bar" style="width:${Math.round(item.pct/maxP*100)}%;background:rgba(${colorRgb},0.75)"></div>
        </div>
      </div>`).join('')}</div>`;
  };

  const topPostsHtml = (a.top_posts?.length) ? `
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">Nejúspěšnější příspěvky</div>
        <div class="card__hint">dle zobrazení · ${a.period}</div>
      </div>
      <div class="top-posts-grid">
        ${a.top_posts.map((p,i)=>`
          <div class="top-post-card">
            <div class="top-post-rank">#${i+1}</div>
            <img src="${p.file}" alt="Příspěvek ${i+1}" class="top-post-img" loading="lazy">
            <div class="top-post-body">
              <div class="top-post-text">${p.text}</div>
              <div class="top-post-views"><span>${p.date} &middot; </span>${fmt(p.views)} <span>zobrazení</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const deltaHtml = (pct) => {
    const cls = pct >= 0 ? 'up' : 'down';
    const arrow = pct >= 0 ? '▲' : '▼';
    return `<span class="kpi__delta ${cls}">${arrow} ${Math.abs(pct)} %</span>`;
  };

  $('#profContent').innerHTML = `
    <div class="card prof-header">
      <div class="prof-initials" style="background:${color}">GR</div>
      <div class="prof-header__info">
        <div class="prof-header__name">Grinex</div>
        <div class="prof-header__tagline">${a.tagline}</div>
        <div class="prof-header__period">LinkedIn Analytics &middot; ${a.period}</div>
      </div>
      <div class="prof-header__stats">
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.content.views)}</div>
          <div class="prof-stat__lbl">Zobrazení obsahu</div>
          <div class="prof-stat__delta ${a.content.views_change_pct>=0?'up':'down'}">${a.content.views_change_pct>=0?'▲':'▼'} ${Math.abs(a.content.views_change_pct)}&thinsp;%</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.followers.total)}</div>
          <div class="prof-stat__lbl">Sledující celkem</div>
          <div class="prof-stat__delta up">▲ +${fmt(follGain)} nových</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.visitors.page_views)}</div>
          <div class="prof-stat__lbl">Zobrazení stránky</div>
          <div class="prof-stat__delta ${a.visitors.page_views_change_pct>=0?'up':'down'}">${a.visitors.page_views_change_pct>=0?'▲':'▼'} ${Math.abs(a.visitors.page_views_change_pct)}&thinsp;%</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.content.reactions)}</div>
          <div class="prof-stat__lbl">Reakce</div>
          <div class="prof-stat__delta ${a.content.reactions_change_pct>=0?'up':'down'}">${a.content.reactions_change_pct>=0?'▲':'▼'} ${Math.abs(a.content.reactions_change_pct)}&thinsp;%</div>
        </div>
      </div>
    </div>

    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head">
          <div class="card__title">Růst sledujících</div>
          <div class="card__hint">2026 &middot; +${fmt(follGain)} nových organicky</div>
        </div>
        <div class="chart-wrap"><canvas id="profFollowers"></canvas></div>
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Zapojení obsahu</div><div class="card__hint">${a.period}</div></div>
        <table class="tbl">
          <thead><tr><th>Typ aktivity</th><th class="num">Počet</th><th class="num">Změna</th></tr></thead>
          <tbody>
            <tr><td>Reakce</td><td class="num">${fmt(a.content.reactions)}</td><td class="num">${deltaHtml(a.content.reactions_change_pct)}</td></tr>
            <tr><td>Komentáře</td><td class="num">${fmt(a.content.comments)}</td><td class="num">${deltaHtml(a.content.comments_change_pct)}</td></tr>
            <tr><td>Znovu zveřejněné</td><td class="num">${fmt(a.content.reshares)}</td><td class="num">—</td></tr>
            <tr style="font-weight:700;border-top:2px solid var(--border-default)">
              <td>Celkem interakcí</td><td class="num">${fmt((a.content.reactions||0)+(a.content.comments||0))}</td><td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Návštěvnost stránky</div><div class="card__hint">${a.period}</div></div>
        <table class="tbl">
          <thead><tr><th>Metrika</th><th class="num">Hodnota</th><th class="num">Změna</th></tr></thead>
          <tbody>
            <tr><td>Zobrazení stránky</td><td class="num">${fmt(a.visitors.page_views)}</td><td class="num">${deltaHtml(a.visitors.page_views_change_pct)}</td></tr>
            <tr><td>Jedineční návštěvníci</td><td class="num">${fmt(a.visitors.unique)}</td><td class="num">${deltaHtml(a.visitors.unique_change_pct)}</td></tr>
            <tr><td>Web</td><td class="num">${fmt(a.visitors.web)}</td><td class="num">—</td></tr>
            <tr><td>Mobilní</td><td class="num">${fmt(a.visitors.mobile)}</td><td class="num">—</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Lokalita sledujících</div><div class="card__hint">demografická data LinkedIn</div></div>
        ${demoBar(a.demographics?.location)}
      </div>
    </div>

    ${topPostsHtml}
  `;

  if(netSeries.length > 0){
    mkChart('profFollowers',{
      type:'line',
      data:{
        labels: netSeries.map(p=>p.date),
        datasets:[{ label:'Sledující', data:netSeries.map(p=>p.foll),
          borderColor:color, backgroundColor:`rgba(${colorRgb},0.12)`,
          fill:true, tension:0.35, pointRadius:2, pointHoverRadius:5, borderWidth:2.5 }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{...tip, callbacks:{label:c=>fmt(c.parsed.y)+' sledujících'}} },
        scales:{ x:{grid:{display:false}, ticks:{maxTicksLimit:7, font:{size:10}}},
          y:{grid:{color:C.grid}, border:{display:false}, ticks:{callback:v=>fmtK(v)}} } }
    });
  }
}

// ---- 9. META (Facebook + Instagram) ----
function renderMeta(){
  const m = DATA.meta_analytics;
  if(!m){ $('#s-meta').innerHTML='<div class="note">Žádná Meta data.</div>'; return; }

  const FB = '#1877F2';
  const IG = '#E1306C';
  const fb = m.facebook;
  const ig = m.instagram;
  const dash = v => v!=null ? fmt(v) : '<span class="muted">—</span>';

  // H1 2026 data (Meta Business Suite)
  const fbH1 = fb.h1_2026 || {};
  const igH1 = ig.h1_2026 || {};
  const totalFbViews = fb.monthly.reduce((s,d)=>s+(d.views||0),0);
  const totalIgViews = ig.monthly.reduce((s,d)=>s+(d.views||0),0);
  const totalFbInter = fb.monthly.reduce((s,d)=>s+(d.interactions||0),0);
  const totalIgInter = ig.monthly.reduce((s,d)=>s+(d.interactions||0),0);
  const totalFbPosts = fb.history.reduce((s,d)=>s+(d.posts||0),0);
  const totalIgPosts = ig.history.reduce((s,d)=>s+(d.posts||0),0);
  const totalIgLikes = ig.history.reduce((s,d)=>s+(d.likes||0),0);

  // KPI tiles — H1 2026
  $('#metaKpiGrid').innerHTML = [
    { label:'FB zobrazení H1 2026',   value:fmtMln(fbH1.views||0),    sub:'100 % organické · žádná reklama' },
    { label:'FB unikátní diváci',     value:fmtMln(fbH1.viewers||0),  sub:'H1 2026 · Meta Business Suite' },
    { label:'FB interakce',           value:fmt(fbH1.interactions||0), sub:'H1 2026 · lajky + komentáře + sdílení' },
    { label:'IG dosah H1 2026',       value:fmt(igH1.reach||0),        sub:'↑ +715 % oproti H2/2025' },
    { dark:true, label:'IG interakce H1 2026', value:fmt(igH1.interactions||0), sub:'↑ +121 % oproti H2/2025' },
  ].map(t=>`<div class="kpi${t.dark?' kpi--dark':''}">
    <div class="kpi__label">${t.label}</div>
    <div class="kpi__value">${t.value}</div>
    <div class="kpi__sub">${t.sub}</div>
  </div>`).join('');

  // Chart 1: Posts per month — full history (stacked FB + IG)
  const histLabels = fb.history.map(d=>d.label);
  mkChart('metaHistoryChart',{ type:'bar', data:{ labels:histLabels,
    datasets:[
      { label:'Facebook', data:fb.history.map(d=>d.posts), backgroundColor:FB+'cc', borderRadius:2, stack:'s' },
      { label:'Instagram', data:ig.history.map(d=>d.posts), backgroundColor:IG+'cc', borderRadius:2, stack:'s' },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true, labels:{color:C.ink,font:{family:"'Montserrat'",size:11}} },
        tooltip:{...tip,callbacks:{label:c=>c.dataset.label+': '+c.parsed.y+' příspěvků'}} },
      scales:{ x:{stacked:true,grid:{display:false},ticks:{font:{size:10}}},
               y:{stacked:true,grid:{color:C.grid},border:{display:false},ticks:{stepSize:2,font:{size:11}}} } }});

  // Chart 2: FB Views 2026 (the viral March spike)
  const fbV2026 = fb.monthly;
  mkChart('metaFbChart',{ type:'bar', data:{ labels:fbV2026.map(d=>d.label),
    datasets:[{ label:'Zobrazení', data:fbV2026.map(d=>d.views||0), backgroundColor:FB, borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}} },
      scales:baseScales() }});

  // Table 1: Full history from Content Plan
  const fbMap = Object.fromEntries(fb.history.map(h=>[h.month,h]));
  const igMap = Object.fromEntries(ig.history.map(h=>[h.month,h]));
  const allMonths = fb.history.map(h=>h.month);
  const histRows = allMonths.map(ym=>{
    const f = fbMap[ym]||{};
    const g = igMap[ym]||{};
    const total = (f.posts||0)+(g.posts||0);
    const noPost = total===0;
    return `<tr${noPost?' class="muted-row"':''}>
      <td><strong>${f.full||ym}</strong></td>
      <td class="num" style="color:${FB}">${f.posts||0}</td>
      <td class="num" style="color:${IG}">${g.posts||0}</td>
      <td class="num"><strong>${total||'—'}</strong></td>
      <td class="num">${g.likes!=null&&g.likes>0?g.likes:'<span class="muted">—</span>'}</td>
    </tr>`;
  }).join('');
  $('#metaHistoryTable').innerHTML = `<table class="tbl" style="width:100%">
    <thead><tr>
      <th>Měsíc</th>
      <th class="num" style="color:${FB}">FB příspěvků</th>
      <th class="num" style="color:${IG}">IG příspěvků</th>
      <th class="num">Celkem</th>
      <th class="num">IG lajky</th>
    </tr></thead>
    <tbody>${histRows}</tbody>
    <tfoot><tr style="font-weight:700;border-top:2px solid var(--border-default)">
      <td>Celkem (Úno 2025–Čvn 2026)</td>
      <td class="num">${totalFbPosts}</td>
      <td class="num">${totalIgPosts}</td>
      <td class="num">${totalFbPosts+totalIgPosts}</td>
      <td class="num">${totalIgLikes}</td>
    </tr></tfoot>
  </table>`;

  // Table 2: 2026 aggregate (from PPTX screenshots)
  const rows2026 = fb.monthly.map((fbM,i)=>{
    const igM = ig.monthly[i];
    const peak = !!fbM.note && fbM.views!=null;
    return `<tr${peak?' style="background:rgba(24,119,242,0.04)"':''}>
      <td><strong>${fbM.full}</strong>${peak?` <span style="color:${FB};font-size:11px;font-family:'Montserrat';font-weight:600">★ Peak</span>`:''}</td>
      <td class="num" style="color:${FB};font-weight:${peak?'700':'400'}">${dash(fbM.views)}</td>
      <td class="num">${dash(fbM.interactions)}</td>
      <td class="num">${fbM.new_followers!=null?'+'+fmt(fbM.new_followers):'<span class="muted">—</span>'}</td>
      <td class="num" style="color:${IG}">${dash(igM.views)}</td>
      <td class="num">${dash(igM.reach)}</td>
      <td class="num">${dash(igM.interactions)}</td>
    </tr>`;
  }).join('');
  $('#metaTable').innerHTML = `<table class="tbl" style="width:100%">
    <thead><tr>
      <th>Měsíc</th>
      <th class="num" style="color:${FB}">FB Zobrazení</th>
      <th class="num">FB Interakce</th>
      <th class="num">FB Noví sledující</th>
      <th class="num" style="color:${IG}">IG Zobrazení</th>
      <th class="num">IG Dosah</th>
      <th class="num">IG Interakce</th>
    </tr></thead>
    <tbody>${rows2026}</tbody>
    <tfoot><tr style="font-weight:700;border-top:2px solid var(--border-default)">
      <td>Bře–Kvě 2026</td>
      <td class="num">${fmt(totalFbViews)}</td>
      <td class="num">${fmt(totalFbInter)}</td>
      <td class="num">—</td>
      <td class="num">${fmt(totalIgViews)}</td>
      <td class="num">—</td>
      <td class="num">${fmt(totalIgInter)}</td>
    </tr></tfoot>
  </table>`;

  // Formáty obsahu FB
  const fmtBreakdown = fbH1.format_views;
  if(fmtBreakdown){
    const fmtData = [
      { label:'Reels', views: fmtBreakdown.reels||0, inter: (fbH1.format_interactions?.reels||0), color: FB },
      { label:'Fotka', views: fmtBreakdown.fotka||0, inter: 0, color: '#888' },
      { label:'Více fotek', views: fmtBreakdown.vice_fotek||0, inter: (fbH1.format_interactions?.vice_fotek||0), color: '#aaa' },
      { label:'Text / ostatní', views: (fmtBreakdown.text||0)+(fmtBreakdown.ostatni||0), inter: 0, color: '#ccc' },
    ];
    const maxV = Math.max(...fmtData.map(d=>d.views));
    $('#metaTopPosts').innerHTML = `
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${FB}">TOP příspěvky — Facebook</div>
          <div class="card__hint">H1 2026 · dle zobrazení · Meta Business Suite</div>
        </div>
        <table class="tbl">
          <thead><tr><th>#</th><th>Příspěvek</th><th>Datum</th><th class="num">Zobrazení</th><th class="num">Lajky</th><th class="num">Kom.</th><th class="num">Sdílení</th></tr></thead>
          <tbody>${(fb.top_posts||[]).map((p,i)=>`<tr>
            <td class="rank">${i+1}</td>
            <td>${p.title}</td>
            <td>${p.date}</td>
            <td class="num" style="font-weight:${i<2?'700':'400'};color:${i<2?FB:'inherit'}">${fmtK(p.views)}</td>
            <td class="num">${fmt(p.likes)}</td>
            <td class="num">${fmt(p.comments)}</td>
            <td class="num">${fmt(p.shares??0)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${IG}">TOP příspěvky — Instagram</div>
          <div class="card__hint">H1 2026 · dle zobrazení · Meta Business Suite</div>
        </div>
        <table class="tbl">
          <thead><tr><th>#</th><th>Příspěvek</th><th>Datum</th><th class="num">Zobrazení</th><th class="num">Lajky</th><th class="num">Kom.</th><th class="num">Sdílení</th></tr></thead>
          <tbody>${(ig.top_posts||[]).map((p,i)=>`<tr>
            <td class="rank">${i+1}</td>
            <td>${p.title}</td>
            <td>${p.date}</td>
            <td class="num" style="font-weight:${i===0?'700':'400'};color:${i===0?IG:'inherit'}">${fmtK(p.views)}</td>
            <td class="num">${fmt(p.likes)}</td>
            <td class="num">${fmt(p.comments)}</td>
            <td class="num">${fmt(p.shares??0)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="card" style="grid-column:1/-1">
        <div class="card__head">
          <div class="card__title" style="color:${FB}">Formáty obsahu — Facebook H1 2026</div>
          <div class="card__hint">Zobrazení dle formátu · reels dominují</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">
          ${fmtData.map(d=>`<div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="font-weight:600">${d.label}</span>
              <span style="color:var(--text-muted)">${fmtK(d.views)} zobrazení${d.inter?` · ${d.inter} interakcí`:''}</span>
            </div>
            <div style="background:var(--border-default);border-radius:3px;height:8px">
              <div style="background:${d.color};border-radius:3px;height:8px;width:${maxV?Math.round(d.views/maxV*100):0}%"></div>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
  }

  // Note
  $('#metaNote').innerHTML = `💡 <strong>H1 2026 (1. 1.–29. 6. 2026)</strong>: data z Meta Business Suite. <strong>Reels táhnou FB dosah</strong> — 165 949 z 167 244 celkových zobrazení (99 %). Vše organické, žádná placená reklama. IG zobrazení klesla (−40 %), ale dosah +715 % ukazuje průnik mimo bublinu sledujících. Září a Říjen 2025: žádné příspěvky na FB ani IG.`;
}

// ---- 11. PODCAST ----
function renderPodcast(){
  const p = DATA.podcast_analytics;
  if(!p){ $('#s-podcast').innerHTML='<div class="note">Žádná podcast data.</div>'; return; }

  const SP   = '#1DB954'; // Spotify green
  const YT   = '#FF0000'; // YouTube red
  const FB   = '#1877F2'; // Facebook blue
  const APOD = '#9933CC'; // Apple Podcasts purple

  const sp = p.spotify;
  const yt = p.youtube;

  // Součty přes platformy
  const totalPlays     = sp.plays + yt.plays;
  const totalWatchH    = sp.watch_time_hours + yt.watch_time_hours;
  const totalWatchLbl  = `${Math.floor(totalWatchH)}h ${Math.round((totalWatchH % 1)*60)}m`;
  const ytOrgViews     = yt.yt_videos.reduce((s,v)=>s+v.views, 0);
  const metaViews      = p.meta_posts.reduce((s,v)=>s+v.views, 0);

  // KPI tiles
  $('#podKpiGrid').innerHTML = [
    { dark:true, label:'Celková přehrání podcastu', value:fmt(totalPlays), sub:`Spotify ${sp.plays} · YouTube ${yt.plays}` },
    { label:'Unikátní posluchači', value:fmt(sp.audience), sub:'Spotify · H1 2026' },
    { label:'Celková doba poslechu', value:totalWatchLbl, sub:`Spotify ${sp.watch_time_label} · YouTube ${yt.watch_time_hours}h` },
    { label:'Ø délka epizody', value:sp.avg_duration_label, sub:'Spotify · průměrná délka přehrávání' },
    { label:'Organický dosah Meta', value:fmtK(metaViews), sub:'FB + IG příspěvky o podcastu · bez reklamy' },
    { label:'YT organický dosah', value:fmtK(ytOrgViews), sub:'YouTube klipy o BARVY BYZNYSU · bez reklamy' },
  ].map(t=>`<div class="kpi${t.dark?' kpi--dark':''}">
    <div class="kpi__label">${t.label}</div>
    <div class="kpi__value">${t.value}</div>
    <div class="kpi__sub">${t.sub}</div>
  </div>`).join('');

  // Chart 1: Platforms donut
  mkChart('podPlatformChart',{
    type:'doughnut',
    data:{
      labels: sp.platforms.map(x=>x.name),
      datasets:[{ data: sp.platforms.map(x=>x.pct), backgroundColor: sp.platforms.map(x=>x.color),
        borderWidth:2, borderColor:'#fff', hoverOffset:6 }]
    },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins:{
        legend:{ position:'right', labels:{ font:{family:"'Montserrat'",size:11}, padding:12,
          generateLabels: chart => sp.platforms.map((x,i)=>({
            text:`${x.name}  ${x.pct} %`,
            fillStyle:x.color, strokeStyle:x.color, lineWidth:0, index:i })) }},
        tooltip:{...tip, callbacks:{ label:c=>`${c.label}: ${c.parsed} %` }},
        datalabels:{ display:false }
      }
    }
  });

  // Chart 2: Top episodes (horizontal bar — listen time in minutes)
  const eps = sp.top_episodes;
  mkChart('podEpisodesChart',{
    type:'bar',
    data:{
      labels: eps.map(e=>e.title.replace('Richard Jahoda | ','')),
      datasets:[{ label:'Doba poslechu (min)', data: eps.map(e=>e.listen_minutes),
        backgroundColor: SP+'cc', borderRadius:3 }]
    },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false},
        tooltip:{...tip, callbacks:{ label:c=>`${eps[c.dataIndex].listen_time}` }},
        datalabels:{ display:true, anchor:'end', align:'end',
          formatter:(_,ctx)=>eps[ctx.dataIndex].listen_time,
          font:{family:"'Montserrat'",weight:'600',size:10}, color:C.ink }
      },
      scales:{ x:{ grid:{color:C.grid}, border:{display:false}, ticks:{callback:v=>v+'min',font:{size:10}} },
               y:{ grid:{display:false}, ticks:{font:{size:11}} } }
    }
  });

  // Chart 3: Age groups
  mkChart('podAgeChart',{
    type:'bar',
    data:{
      labels: sp.age_groups.map(a=>a.range),
      datasets:[{ label:'% posluchačů', data: sp.age_groups.map(a=>a.pct),
        backgroundColor: SP+'cc', borderRadius:3 }]
    },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false},
        tooltip:{...tip, callbacks:{label:c=>c.parsed.y+' %'}},
        datalabels:{ display:true, anchor:'end', align:'end',
          formatter:v=>v+' %', font:{family:"'Montserrat'",weight:'700',size:11}, color:C.ink }
      },
      scales:{ x:{grid:{display:false}}, y:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>v+'%',font:{size:10}},max:60} }
    }
  });

  // Geography table
  $('#podGeoTable').innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">
    ${sp.geography.map(g=>`<div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
        <span>${g.flag} <strong>${g.country}</strong></span>
        <span style="font-family:'Montserrat';font-weight:700">${g.pct} %</span>
      </div>
      <div style="background:var(--border-default);border-radius:3px;height:6px">
        <div style="background:${SP};border-radius:3px;height:6px;width:${g.pct}%"></div>
      </div>
    </div>`).join('')}
  </div>`;

  // Social reach: Meta (FB+IG) + YT organic
  const fbPosts = p.meta_posts.filter(x=>x.platform==='Facebook');
  const igPosts = p.meta_posts.filter(x=>x.platform==='Instagram');
  const fbTotal = fbPosts.reduce((s,x)=>s+x.views, 0);
  const igTotal = igPosts.reduce((s,x)=>s+x.views, 0);
  $('#podSocialReach').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:${FB};margin-bottom:.75rem">
          Facebook · organicky &nbsp;<span style="font-weight:400;opacity:.6">${fmtK(fbTotal)} zobrazení celkem</span>
        </div>
        <table class="tbl" style="font-size:13px">
          <thead><tr><th>Příspěvek</th><th>Datum</th><th class="num">Zobrazení</th><th class="num">❤</th></tr></thead>
          <tbody>${fbPosts.map(mp=>`<tr>
            <td>${mp.title}</td><td style="white-space:nowrap;opacity:.6">${mp.date}</td>
            <td class="num" style="font-weight:${mp.views>=10000?'700':'400'};color:${mp.views>=10000?FB:'inherit'}">${fmtK(mp.views)}</td>
            <td class="num">${mp.likes}</td>
          </tr>`).join('')}
          </tbody>
          <tfoot><tr style="font-weight:700;border-top:2px solid var(--border-default)">
            <td>Celkem FB</td><td></td><td class="num" style="color:${FB}">${fmtK(fbTotal)}</td><td></td>
          </tr></tfoot>
        </table>
        ${igPosts.length ? `<div style="margin-top:1rem;font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#E1306C;margin-bottom:.5rem">Instagram · organicky</div>
        <table class="tbl" style="font-size:13px">
          <thead><tr><th>Příspěvek</th><th>Datum</th><th class="num">Zobrazení</th></tr></thead>
          <tbody>${igPosts.map(mp=>`<tr>
            <td>${mp.title}</td><td style="white-space:nowrap;opacity:.6">${mp.date}</td>
            <td class="num">${fmtK(mp.views)}</td>
          </tr>`).join('')}</tbody>
        </table>` : ''}
        <div style="margin-top:.75rem;font-size:12px;opacity:.6">Veškerý dosah je organický — žádná placená reklama</div>
      </div>
      <div>
        <div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:${YT};margin-bottom:.75rem">
          YouTube · organické klipy &nbsp;<span style="font-weight:400;opacity:.6">${fmtK(ytOrgViews)} zobrazení celkem</span>
        </div>
        <table class="tbl" style="font-size:13px">
          <thead><tr><th>Video</th><th>Datum</th><th class="num">Zobrazení</th></tr></thead>
          <tbody>${yt.yt_videos.map(v=>`<tr>
            <td>${v.title}</td><td style="white-space:nowrap;opacity:.6">${v.date}</td>
            <td class="num" style="font-weight:${v.views>5000?'700':'400'};color:${v.views>5000?YT:'inherit'}">${fmtK(v.views)}</td>
          </tr>`).join('')}</tbody>
          <tfoot><tr style="font-weight:700;border-top:2px solid var(--border-default)">
            <td>Celkem YT</td><td></td><td class="num" style="color:${YT}">${fmtK(ytOrgViews)}</td>
          </tr></tfoot>
        </table>
        <div style="margin-top:.75rem;font-size:12px;opacity:.6">Veškerý dosah je organický — žádná placená reklama</div>
      </div>
    </div>`;

  // Note
  $('#podNote').innerHTML = `💡 <strong>BARVY BYZNYSU · H1 2026</strong>: Celkem ${fmt(totalPlays)} přehrání podcastu napříč platformami (Spotify ${sp.plays} + YouTube ${yt.plays}), ${totalWatchLbl} celkové doby poslechu. Nejsilnější epizoda: <strong>Švarcsystém</strong> (8h 36m doby poslechu na Spotify). Organický dosah propagace podcastu: Meta ${fmtK(metaViews)} zobrazení (FB ${fmtK(fbTotal)} + IG ${fmtK(igTotal)}) + YouTube klipy ${fmtK(ytOrgViews)} — vše bez placené reklamy. Jádrové publikum: <strong>35–44 let (47 %)</strong>, převažují muži, 79 % ČR. Hlavní platformy: Spotify ${sp.platforms[0].pct} %, Apple Podcasts ${sp.platforms[1].pct} %.`;
}

// ---- 10. YOUTUBE ----
function renderYoutube(){
  const y = DATA.youtube_analytics;
  if(!y){ $('#s-youtube').innerHTML='<div class="note">Žádná YouTube data.</div>'; return; }
  const YT = '#FF0000';
  const h1 = y.h1_2026;

  // KPI tiles
  $('#ytKpiGrid').innerHTML = [
    { dark:true, label:'Zobrazení H1 2026', value:fmtK(h1.views), sub:'Leden – Červen 2026 · YouTube Studio' },
    { label:'Čas sledování', value:h1.watch_time_hours+'h', sub:'H1 2026 · celkem' },
    { label:'Nových odběratelů', value:'+'+h1.subscribers_gained, sub:'H1 2026 · přírůstek' },
    { label:'Odběratelů celkem', value:fmt(y.subscribers_now), sub:'K 1. 7. 2026' },
  ].map(t=>`<div class="kpi${t.dark?' kpi--dark':''}">
    <div class="kpi__label">${t.label}</div>
    <div class="kpi__value">${t.value}</div>
    <div class="kpi__sub">${t.sub}</div>
  </div>`).join('');

  // Chart: views by month
  mkChart('ytMonthlyChart',{
    type:'bar',
    data:{
      labels: h1.monthly.map(m=>m.label),
      datasets:[{ label:'Zobrazení', data:h1.monthly.map(m=>m.views), backgroundColor:YT+'cc', borderRadius:3 }]
    },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...tip, callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}}},
      scales:baseScales() }
  });

  // Top 10 videos table
  const topSum3 = y.top_videos.slice(0,3).reduce((s,v)=>s+v.views, 0);
  $('#ytTopTable').innerHTML = `
    <table class="tbl">
      <thead><tr><th>#</th><th>Video</th><th>Datum</th><th>Zobrazení</th><th>Prům. délka</th><th>% zhlédnutí</th></tr></thead>
      <tbody>${y.top_videos.map((v,i)=>`
        <tr${v.views>=10000?' style="font-weight:600"':''}>
          <td style="opacity:.5;font-size:11px">${i+1}</td>
          <td>${v.title}</td>
          <td style="white-space:nowrap;opacity:.6;font-size:12px">${v.date}</td>
          <td style="text-align:right">${fmt(v.views)}</td>
          <td style="text-align:right;opacity:.7">${v.avg_duration}</td>
          <td style="text-align:right;opacity:.7">${v.avg_pct} %</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  // Podcast card
  const p = y.podcast;
  $('#ytPodcastCard').innerHTML = `
    <div class="card__title">Podcast: ${p.name}</div>
    <div style="display:flex;gap:2.5rem;margin-top:1rem;flex-wrap:wrap">
      <div>
        <div class="kpi__value" style="font-size:1.8rem">${fmt(p.views)}</div>
        <div class="kpi__label" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.05em;opacity:.6">Zobrazení</div>
      </div>
      <div>
        <div class="kpi__value" style="font-size:1.8rem">${p.watch_time_hours}h</div>
        <div class="kpi__label" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.05em;opacity:.6">Čas sledování</div>
      </div>
    </div>`;

  // Note
  const spikePct = Math.round(topSum3/h1.views*100);
  $('#ytNote').innerHTML = `💡 <strong>H1 2026 (1. 1.–30. 6. 2026)</strong>: data z YouTube Studio. <strong>Švarcsystém spike v březnu</strong> — 3 videa z 19. 3. 2026 přinesla ${fmtK(topSum3)} zobrazení (${spikePct} % celého H1). Podcast BARVY BYZNYSU: ${fmt(p.views)} zobrazení, ${p.watch_time_hours} h čas sledování. Měsíční rozpad je odhadovaný ze struktury top videí — přesná data z YouTube Studia jsou k dispozici v exportu.`;
}

// ---- SSI CARD ----
function buildSsiCard(a, color, colorRgb){
  if(!a.ssi?.snapshots?.length) return '';
  const snaps  = a.ssi.snapshots;
  const latest = snaps[snaps.length - 1];
  const prev   = snaps.length > 1 ? snaps[0] : null;
  const cir    = 2 * Math.PI * 34;
  const dashV  = cir * latest.score / 100;
  const dash   = dashV.toFixed(2);
  const gap    = (cir - dashV).toFixed(2);
  const comps  = [
    { label:'Budování značky',  key:'brand',         col:'#e85d4a' },
    { label:'Hledání kontaktů', key:'find',          col:'#9b59b6' },
    { label:'Zapojení',         key:'engage',        col:'#1a7a7a' },
    { label:'Budování vztahů',  key:'relationships', col:'#2980b9' },
  ];
  const bars = comps.map(c => {
    const val = latest[c.key];
    const pv  = prev ? prev[c.key] : null;
    const td  = pv != null ? val - pv : null;
    const tdHtml = td != null
      ? `<span style="color:${td>=0?'#27ae60':'#e74c3c'};font-size:10px;margin-left:6px">${td>=0?'▲':'▼'} ${Math.abs(td).toFixed(2)}</span>`
      : '';
    return `
      <div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;color:#1c1f22">${c.label}</span>
          <span style="font-family:'Montserrat';font-weight:700;font-size:13px;color:#1c1f22">${val.toFixed(2)}${tdHtml}</span>
        </div>
        <div style="background:#ebedee;border-radius:3px;height:8px">
          <div style="width:${Math.min(100,Math.round(val/25*100))}%;height:8px;background:${c.col};border-radius:3px"></div>
        </div>
      </div>`;
  }).join('');
  const trendHtml = prev ? `
    <div style="margin-top:16px;border-top:1px solid #ebedee;padding-top:14px">
      <div style="font-family:'Montserrat';font-weight:600;font-size:11px;color:#888;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Vývoj</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:left;padding:4px 8px 6px 0;color:#888;font-family:'Montserrat'">Složka</th>
          <th style="text-align:right;padding:4px 0 6px;color:#888;font-family:'Montserrat'">${prev.date}</th>
          <th style="text-align:right;padding:4px 0 6px;color:#888;font-family:'Montserrat'">${latest.date}</th>
          <th style="text-align:right;padding:4px 0 6px 8px;color:#888;font-family:'Montserrat'">Δ</th>
        </tr></thead>
        <tbody>
          ${comps.map(c => {
            const lv = latest[c.key], pv2 = prev[c.key], d = lv - pv2;
            return `<tr style="border-top:1px solid #f0f1f2">
              <td style="padding:5px 8px 5px 0">${c.label}</td>
              <td style="text-align:right;padding:5px 0">${pv2.toFixed(2)}</td>
              <td style="text-align:right;padding:5px 0;font-weight:700">${lv.toFixed(2)}</td>
              <td style="text-align:right;padding:5px 0 5px 8px;color:${d>0?'#27ae60':d<0?'#e74c3c':'#888'};font-weight:600">${d>=0?'+':''}${d.toFixed(2)}</td>
            </tr>`;
          }).join('')}
          <tr style="border-top:2px solid #ebedee">
            <td style="padding:7px 8px 0 0;font-weight:700;font-family:'Montserrat'">SSI celkem</td>
            <td style="text-align:right;padding:7px 0 0;font-weight:700">${prev.score}</td>
            <td style="text-align:right;padding:7px 0 0;font-weight:700">${latest.score}</td>
            <td style="text-align:right;padding:7px 0 0 8px;font-weight:700;color:${latest.score>=prev.score?'#27ae60':'#e74c3c'}">${latest.score>=prev.score?'+':''}${latest.score-prev.score}</td>
          </tr>
        </tbody>
      </table>
    </div>` : '';
  return `
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">SSI Index</div>
        <div class="card__hint">LinkedIn Sales Navigator · k ${latest.date}</div>
      </div>
      <div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px">
          <div style="position:relative;width:120px;height:120px">
            <svg viewBox="0 0 80 80" width="120" height="120" style="transform:rotate(-90deg)">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#ebedee" stroke-width="8"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="${color}" stroke-width="8"
                stroke-dasharray="${dash} ${gap}" stroke-linecap="round"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <div style="font-family:'Montserrat';font-weight:700;font-size:30px;color:#1c1f22;line-height:1">${latest.score}</div>
              <div style="font-size:11px;color:#888;margin-top:3px">z 100</div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <div style="text-align:center;background:rgba(${colorRgb},0.08);padding:7px 10px;border-radius:8px;min-width:65px">
              <div style="font-family:'Montserrat';font-weight:700;font-size:15px;color:#1c1f22">Top ${latest.industry_top_pct} %</div>
              <div style="font-size:10px;color:#888;margin-top:2px">v oboru</div>
            </div>
            <div style="text-align:center;background:rgba(${colorRgb},0.08);padding:7px 10px;border-radius:8px;min-width:65px">
              <div style="font-family:'Montserrat';font-weight:700;font-size:15px;color:#1c1f22">Top ${latest.network_top_pct} %</div>
              <div style="font-size:10px;color:#888;margin-top:2px">v síti</div>
            </div>
          </div>
        </div>
        <div style="flex:1;min-width:220px">
          <div style="font-family:'Montserrat';font-weight:600;font-size:11px;color:#888;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em">Čtyři složky skóre</div>
          ${bars}
        </div>
      </div>
      ${trendHtml}
    </div>`;
}

init();
