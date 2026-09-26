/* Atlas interativo, gerado a partir da exportação QGIS/qgis2web de 26/09/2026. */
(() => {
  'use strict';

  const datasets = {uf: window.WEBSIG_UF, macro: window.WEBSIG_MACRO};
  const els = Object.fromEntries(['source','scale','metric','period','periodGroup',
    'legend-title','legend-unit','legend-classes','legend-caption','interpretation',
    'placeSearch','places','searchButton','searchStatus','context-title',
    'context-subtitle','basemapButton','loading'].map(id => [id, document.getElementById(id)]));
  if (!datasets.uf || !datasets.macro || datasets.uf.features.length !== 27 ||
      datasets.macro.features.length !== 120) {
    els.loading.textContent = 'Os dados do mapa não foram encontrados. Confira a pasta data/.';
    return;
  }

  const nf2 = new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const nf0 = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
  const LABELS = {
    rate:'Taxa por 100 mil habitantes',masc:'Masculino',fem:'Feminino',sexo_ign:'Sexo ignorado',
    branca:'Branca',preta:'Preta',parda:'Parda',amarela:'Amarela',indigena:'Indígena',raca_ign:'Raça/cor ignorada',
    '0_14':'0 a 14 anos','15_29':'15 a 29 anos','30_49':'30 a 49 anos','50_59':'50 a 59 anos',
    '60_mais':'60 anos ou mais',idade_ign:'Idade ignorada'
  };
  const GROUPS = [
    ['Sexo',['masc','fem','sexo_ign']],
    ['Raça/cor',['branca','preta','parda','amarela','indigena','raca_ign']],
    ['Faixa etária',['0_14','15_29','30_49','50_59','60_mais','idade_ign']]
  ];
  const P = {
    rate:['#ffe818','#ffae12','#ff740c','#ff3a06','#eb121b'],
    masc:['#e3e8ff','#aab9ff','#7387fa','#3e5bed','#0735b4'],
    fem:['#fff0f0','#ffd0d2','#ff999f','#fa5966','#c91c45'],
    branca:['#e9f3fa','#bfd7eb','#85b8d6','#3d89b8','#174271'],
    preta:['#fae9f8','#ddb4db','#bd82bf','#8d4b93','#54235f'],
    parda:['#fff5d8','#f9d9a6','#f6b979','#ec8d3f','#bc520f'],
    amarela:['#fffbe5','#ffedaa','#fbd35e','#e8ac22','#aa7410'],
    indigena:['#edf9ed','#b7e5b1','#7acc81','#34905b','#0f5835'],
    age:['#e7f8f5','#bae6da','#81cbb9','#3f9c89','#126658'],
    ignored:['#f1f4f5','#d8e2e4','#b9c9cd','#829fa7','#426675']
  };
  const FIXED_RATE = {
    sim:{uf:[4.48159,5.87537,7.771153,9.41902,11.803,13.564],
         macro:[1.471797,6.251295,8.984564,11.627647,14.84874,19.20331]},
    sinan:{uf:[16.97868,32.16,57.197867,75.357646,142.89,191.22561],
           macro:[12.58925,37.29,71.91723,99.487221,139.45,191.22561]}
  };
  const YEARS = [2020,2021,2022,2023,2024,2025];
  let layer = null;
  let activeScale = null;
  let breaks = null;
  let colors = P.rate;

  const map = L.map('map',{preferCanvas:true,zoomControl:false,minZoom:3,maxZoom:12});
  L.control.zoom({position:'topleft'}).addTo(map);
  map.fitBounds([[-34.2,-74.7],[5.7,-33.3]],{padding:[15,15]});
  const satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom:12,maxNativeZoom:20,attribution:'Imagens © Google'
  }).addTo(map);
  map.attributionControl.setPrefix('Dados: SIM, SINAN/DATASUS · IBGE | Leaflet');

  const state = () => ({source:els.source.value,scale:els.scale.value,
    metric:els.metric.value,period:els.period.value});
  const metricOf = (feature,s) => {
    const data = feature.properties[s.source];
    if (s.metric !== 'rate') return data.pct[s.metric];
    return s.period === 'all' ? data.rate : data.years[YEARS.indexOf(Number(s.period))];
  };
  const isRate = s => s.metric === 'rate';
  const labelSource = s => s.source === 'sim' ? 'Óbitos por suicídio' : 'Notificações de violência autoprovocada';
  const labelScale = s => s.scale === 'uf' ? 'Unidades Federativas' : 'Macrorregiões de saúde';
  function paletteFor(metric){
    if (P[metric]) return P[metric];
    if (metric.startsWith('idade') || ['0_14','15_29','30_49','50_59','60_mais'].includes(metric)) return P.age;
    return P.ignored;
  }

  function makeBreaks(s){
    if (isRate(s) && s.period === 'all') return FIXED_RATE[s.source][s.scale];
    const vals = datasets[s.scale].features.map(f=>metricOf(f,s)).filter(v=>Number.isFinite(v));
    if (!vals.length) return [0,1,2,3,4,5];
    const low = Math.min(...vals), high = Math.max(...vals);
    if (high === low) return Array.from({length:6},(_,i)=>low+i);
    return Array.from({length:6},(_,i)=>low + (high-low)*i/5);
  }
  function bucket(value){
    if (!Number.isFinite(value)) return -1;
    for (let i=0;i<4;i++) if (value <= breaks[i+1]) return i;
    return 4;
  }
  function fillFor(feature,s){
    const i=bucket(metricOf(feature,s));
    return i < 0 ? '#c7d0d2' : colors[i];
  }
  function style(feature){
    return {color:'#253543',weight:0.85,opacity:0.95,fillColor:fillFor(feature,state()),fillOpacity:0.9};
  }
  function safe(raw){
    return String(raw??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function detailTable(data,keys){
    return '<table class="popup-table">'+keys.map(k=>'<tr><td>'+safe(LABELS[k])+'</td><td>'+(
      Number.isFinite(data.pct[k]) ? nf2.format(data.pct[k])+'%' : 'Sem dado')+'</td></tr>').join('')+'</table>';
  }
  function popupHTML(feature){
    const s=state(), p=feature.properties, d=p[s.source], v=metricOf(feature,s);
    const periodLabel=s.period==='all'?'Média anual · 2020–2025':s.period;
    const mainLabel=isRate(s)?'Taxa por 100 mil habitantes · '+periodLabel:'Percentual de registros · '+LABELS[s.metric];
    const mainValue=Number.isFinite(v)?nf2.format(v)+(isRate(s)?'':'%'):'Sem dado';
    const locality=s.scale==='macro'?p.uf+' · '+p.region:labelScale(s);
    const details=GROUPS.map(([name,keys])=>'<details class="popup-details"><summary>'+safe(name)+'</summary>'+detailTable(d,keys)+'</details>').join('');
    const yearCount=s.period!=='all' && isRate(s)?
      '<p class="popup-meta">Registros em '+safe(s.period)+': <strong>'+nf0.format(d.counts[YEARS.indexOf(Number(s.period))])+'</strong></p>':'';
    return '<div class="popup-kicker">'+safe(labelSource(s))+'</div><h2 class="popup-title">'+safe(p.name)+'</h2>'+ 
      '<div class="popup-subtitle">'+safe(locality)+'</div>'+ 
      '<div class="popup-highlight"><small>'+safe(mainLabel)+'</small><strong>'+safe(mainValue)+'</strong></div>'+ 
      '<p class="popup-meta">Total de registros · 2020–2025: <strong>'+nf0.format(d.total)+'</strong></p>'+yearCount+
      details+'<p class="popup-note">Os percentuais são proporções dos registros de '+safe(s.source.toUpperCase())+' no território durante 2020–2025.</p>';
  }
  function bindFeature(feature,featureLayer){
    featureLayer.bindPopup(()=>popupHTML(feature),{maxWidth:390,minWidth:240,maxHeight:520,autoPanPadding:[15,15]});
    featureLayer.on('mouseover',()=>{
      featureLayer.setStyle({weight:2,color:'#0b2438',fillOpacity:1});
      if (featureLayer.bringToFront) featureLayer.bringToFront();
    });
    featureLayer.on('mouseout',()=>{if (layer) layer.resetStyle(featureLayer);});
  }

  function renderLegend(s){
    const name=isRate(s)?(s.period==='all'?'Taxa média anual':'Taxa em '+s.period):
      'Registros · '+LABELS[s.metric];
    els['legend-title'].textContent=name;
    els['legend-unit'].textContent=isRate(s)?'por 100 mil hab.':'percentual (%)';
    els['legend-classes'].replaceChildren(...colors.map((color,i)=>{
      const row=document.createElement('div');row.className='legend-row';
      const sw=document.createElement('span');sw.className='legend-swatch';sw.style.background=color;
      const txt=document.createElement('span');txt.textContent=nf2.format(breaks[i])+' – '+nf2.format(breaks[i+1])+(isRate(s)?'':'%');
      row.append(sw,txt);return row;
    }));
    els['legend-caption'].textContent=(isRate(s)&&s.period==='all')?
      'Classes da simbologia original do QGIS para este mapa.':
      'Cinco intervalos iguais calculados para a seleção atual.';
    els.interpretation.textContent=isRate(s)?
      'Cores mais intensas indicam taxas mais altas no território selecionado.':
      'Cores mais intensas indicam maior participação deste grupo entre os registros do território.';
    els['context-title'].textContent=labelSource(s)+' · '+(s.scale==='uf'?'UFs':'macrorregiões');
    els['context-subtitle'].textContent=isRate(s)?
      (s.period==='all'?'Taxa média anual por 100 mil habitantes':'Taxa por 100 mil habitantes em '+s.period):
      'Percentual dos registros · '+LABELS[s.metric]+' · 2020–2025';
  }
  function normalize(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_\s-]+/g,' ').trim();}
  function displaySearch(p,s){return p.name+(s.scale==='macro'?' — '+p.uf:'');}
  function updateSearch(s){
    els.placeSearch.value='';els.searchStatus.textContent='';
    els.places.replaceChildren(...datasets[s.scale].features.map(f=>{
      const option=document.createElement('option');option.value=displaySearch(f.properties,s);return option;
    }));
    els.placeSearch.placeholder=s.scale==='uf'?'Buscar estado...':'Buscar macrorregião ou UF...';
  }
  function search(){
    const q=normalize(els.placeSearch.value),s=state();
    if (!q){els.searchStatus.textContent='Digite um território para buscar.';return;}
    const matches=[];
    layer.eachLayer(l=>{
      const p=l.feature.properties;
      const label=normalize(displaySearch(p,s));
      if (label===q || label.includes(q) || String(p.code)===q) matches.push(l);
    });
    if (!matches.length){els.searchStatus.textContent='Território não encontrado nesta divisão.';return;}
    if (matches.length>1 && !matches.some(l=>normalize(displaySearch(l.feature.properties,s))===q)){
      els.searchStatus.textContent=matches.length+' resultados. Escolha um nome completo na lista.';return;
    }
    const result=matches.find(l=>normalize(displaySearch(l.feature.properties,s))===q)||matches[0];
    els.searchStatus.textContent='';
    map.fitBounds(result.getBounds(),{maxZoom:s.scale==='uf'?7:9,padding:[25,25]});
    result.openPopup();
  }
  function render(){
    const s=state();
    const rate=isRate(s);els.period.disabled=!rate;
    els.periodGroup.classList.toggle('muted',!rate);
    if (!rate && s.period!=='all') {els.period.value='all';s.period='all';}
    breaks=makeBreaks(s);colors=paletteFor(s.metric);
    if (activeScale!==s.scale){
      if (layer) map.removeLayer(layer);
      activeScale=s.scale;
      layer=L.geoJSON(datasets[s.scale],{style,onEachFeature:bindFeature,renderer:L.canvas({padding:.5})}).addTo(map);
      updateSearch(s);
    } else {
      map.closePopup();layer.setStyle(style);
    }
    renderLegend(s);
  }
  ['source','scale','metric','period'].forEach(id=>els[id].addEventListener('change',render));
  els.searchButton.addEventListener('click',search);
  els.placeSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  els.basemapButton.addEventListener('click',()=>{
    const active=map.hasLayer(satellite);
    if(active) map.removeLayer(satellite);else satellite.addTo(map);
    els.basemapButton.setAttribute('aria-pressed',String(!active));
    els.basemapButton.textContent=active?'◐  Fundo claro':'◐  Satélite';
  });
  try {render();els.loading.classList.add('is-hidden');}
  catch(err){console.error(err);els.loading.textContent='Ocorreu um erro ao montar o mapa. Confira o console do navegador.';}
})();
