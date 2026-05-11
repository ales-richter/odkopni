import { useState, useEffect, useRef, useCallback } from "react";
import {
  auth, db,
  signInAnonymously, onAuthStateChanged,
  collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot, setDoc
} from "./firebase";

// ============================================================
// 🌱 ODKOPNI — výměnný marketplace pro zahradní trvalky
// ============================================================

const CZ_PERENNIALS = [
  "Achillea millefolium – Řebříček obecný","Aconitum napellus – Oměj šalamounek","Agastache foeniculum – Agastache fenyklová",
  "Ajuga reptans – Živučka plazivá","Alchemilla mollis – Kontryhel měkký","Allium giganteum – Česnek obrovský",
  "Anemone hupehensis – Sasanka japonská","Anemone nemorosa – Sasanka hajní","Aquilegia vulgaris – Orlíček obecný",
  "Arabis caucasica – Huseník kavkazský","Armeria maritima – Trávnička přímořská","Artemisia schmidtiana – Pelyněk Schmidtův",
  "Aster novi-belgii – Hvězdnice novobelgická","Astilbe × arendsii – Čechrava Arendsova","Astrantia major – Jarmanka větší",
  "Aubrieta deltoidea – Tařička zahradní","Bergenia cordifolia – Bergénie srdčitá","Brunnera macrophylla – Pomněnkovec velkolistý",
  "Campanula carpatica – Zvonek karpatský","Campanula persicifolia – Zvonek broskvolistý","Centaurea montana – Chrpa horská",
  "Cerastium tomentosum – Rožec plstnatý","Chrysanthemum × grandiflorum – Chryzantéma velkokvětá",
  "Coreopsis grandiflora – Krásnoočko velkokvěté","Crocosmia × crocosmiiflora – Montbrécie","Delphinium elatum – Stračka vyvýšená",
  "Dianthus deltoides – Hvozdík kropenatý","Dianthus gratianopolitanus – Hvozdík sivý","Dicentra spectabilis – Srdcovka nádherná",
  "Digitalis purpurea – Náprstník červený","Doronicum orientale – Kamzičník východní","Echinacea purpurea – Třapatka nachová",
  "Echinops ritro – Bělotrn modrý","Epimedium × rubrum – Škornice červená","Erigeron speciosus – Turan ozdobný",
  "Eryngium planum – Máčka ladní","Eupatorium maculatum – Sadec skvrnitý","Euphorbia polychroma – Pryšec mnohobarevný",
  "Filipendula ulmaria – Tužebník jilmový","Gaillardia × grandiflora – Kokarda velkokvětá","Galanthus nivalis – Sněženka podsněžník",
  "Gaura lindheimeri – Svíčkovec Lindheimův","Gentiana acaulis – Hořec bezlodyžný","Geranium macrorrhizum – Kakost oddenkatý",
  "Geranium sanguineum – Kakost krvavý","Geum coccineum – Kuklík šarlatový","Gypsophila paniculata – Šater latnatý",
  "Helenium autumnale – Záplevák podzimní","Helianthus decapetalus – Slunečnice","Heliopsis helianthoides – Janeba drsná",
  "Helleborus niger – Čemeřice černá","Helleborus orientalis – Čemeřice východní","Hemerocallis hybrida – Denivka zahradní",
  "Heuchera sanguinea – Dlužicha krvavá","Heuchera micrantha – Dlužicha drobnokvětá","Hosta fortunei – Bohyška Fortunova",
  "Hosta sieboldiana – Bohyška Sieboldova","Iberis sempervirens – Iberka vždyzelená","Incarvillea delavayi – Zahradní gloxínie",
  "Iris germanica – Kosatec německý","Iris sibirica – Kosatec sibiřský","Kniphofia uvaria – Knifofie",
  "Lamium maculatum – Hluchavka skvrnitá","Lavandula angustifolia – Levandule lékařská","Leucanthemum × superbum – Kopretina velkokvětá",
  "Liatris spicata – Šuškarda klasnatá","Ligularia dentata – Popelivka zubatá","Lilium regale – Lilie královská",
  "Linum perenne – Len vytrvalý","Lobelia cardinalis – Lobelka šarlatová","Lupinus polyphyllus – Vlčí bob mnoholistý",
  "Lychnis chalcedonica – Smolnička chalcedonská","Lysimachia punctata – Vrbina tečkovaná","Lythrum salicaria – Kyprej vrbice",
  "Monarda didyma – Zavinutka dvojitá","Muscari armeniacum – Modřenec arménský","Myosotis sylvatica – Pomněnka lesní",
  "Narcissus pseudonarcissus – Narcis žlutý","Nepeta × faassenii – Šanta Faassenova","Oenothera missouriensis – Pupalka missourská",
  "Paeonia lactiflora – Pivoňka čínská","Papaver orientale – Mák východní","Penstemon barbatus – Dračík",
  "Phlox paniculata – Plamenka latnatá","Phlox subulata – Plamenka šídlovitá","Physalis alkekengi – Mochyně židovská třešeň",
  "Physostegia virginiana – Terčovka viržinská","Platycodon grandiflorus – Boubelka velkokvětá","Polemonium caeruleum – Jirnice modrá",
  "Polygonatum multiflorum – Kokořík mnohokvětý","Potentilla × tonguei – Mochna","Primula veris – Prvosenka jarní",
  "Primula vulgaris – Prvosenka bezlodyžná","Pulmonaria officinalis – Plicník lékařský","Pulsatilla vulgaris – Koniklec luční",
  "Rodgersia aesculifolia – Rodgerzie jírovcovitá","Rudbeckia fulgida – Třapatka zářivá","Rudbeckia laciniata – Třapatka dřípatá",
  "Salvia nemorosa – Šalvěj hajní","Salvia × superba – Šalvěj nádherná","Saponaria ocymoides – Mydlice bazalkovitá",
  "Saxifraga × arendsii – Lomikámen Arendsův","Scabiosa caucasica – Hlaváč kavkazský","Sedum spectabile – Rozchodník nádherný",
  "Sedum spurium – Rozchodník pochybný","Sempervivum tectorum – Netřesk střešní","Sidalcea malviflora – Sidalcea",
  "Solidago hybrida – Zlatobýl zahradní","Stachys byzantina – Čistec vlnatý","Symphytum grandiflorum – Kostival velkokvětý",
  "Thalictrum aquilegiifolium – Žluťucha orlíčkolistá","Thymus serpyllum – Mateřídouška úzkolistá",
  "Tiarella cordifolia – Pěnišník srdčitý","Tradescantia × andersoniana – Podražec Andersonův",
  "Trollius europaeus – Upolín evropský","Verbascum × hybridum – Divizna zahradní","Verbena bonariensis – Sporýš argentinský",
  "Veronica spicata – Rozrazil klasnatý","Vinca minor – Brčál menší","Viola cornuta – Violka rohatá",
  "Waldsteinia ternata – Mokrýš trojlistý","Yucca filamentosa – Juka vláknitá",
];

var PLANT_DB = CZ_PERENNIALS.map(function(e) { var parts = e.split(" – "); return { latin: parts[0].trim(), czech: parts[1] ? parts[1].trim() : "", full: e }; });

function searchLocalPlants(q) {
  if (!q || q.length < 2) return [];
  var s = q.toLowerCase(), starts = [], contains = [];
  for (var i = 0; i < PLANT_DB.length; i++) {
    var p = PLANT_DB[i], l = p.latin.toLowerCase(), c = p.czech.toLowerCase();
    if (l.startsWith(s) || c.startsWith(s)) starts.push(p);
    else if (l.includes(s) || c.includes(s)) contains.push(p);
  }
  return starts.concat(contains).slice(0, 8);
}

var SEASONAL = [null,"Leden: Plánujte jarní záhony — objednávejte si odnože předem!","Únor: Brzy začne sezóna — připravte si seznamy k výměně!","Březen: Čas dělit trvalky! Podělte se o přebytky z probouzející se zahrady.","Duben: Ideální čas na dělení a výměnu trvalek — odkopněte přebytky!","Květen: Plná sezóna výměn! Trvalky se ujímají nejlépe právě teď.","Červen: Kvetoucí zahrady — vyfoťte přebytky a nabídněte je k výměně.","Červenec: Letní odnože jsou silné — ideální čas je odkopnout.","Srpen: Podzimní dělení se blíží — připravte si nabídky!","Září: Podzim = čas přesazování. Vyměňte si trvalky před zimou!","Říjen: Poslední šance na podzimní výměny — trvalky se ještě stihnou zakořenit.","Listopad: Plánujte výměny na jaro — procházejte nabídky a ukládejte oblíbené.","Prosinec: Zahradnické plány na nový rok — co chcete do zahrady přidat?"];
var CATS = ["Vše","Kvetoucí","Listové","Sukulentní","Byliny","Trávy","Cibuloviny"];
var STATUSES = { active:{label:"Dostupné",color:"#48a868",bg:"#e8f5ec"}, reserved:{label:"Zamluvené",color:"#e8a040",bg:"#fff8e8"}, traded:{label:"Vyměněno",color:"#999",bg:"#f0f0f0"} };
var C = {primary:"#3B6B4A",primaryDark:"#2d5239",bg:"#f4f7f5",card:"#ffffff",text:"#1a2e1f",sub:"#6b7f72",muted:"#a3b0a8",border:"#e2e8e4",accent:"#d4a574",danger:"#d45a5a",heart:"#e25555"};

// ── SVG Icons ──
var I = {
  Camera:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;},
  Image:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;},
  Send:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;},
  Chat:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;},
  Back:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;},
  Plus:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;},
  X:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;},
  Search:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;},
  Pin:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;},
  Pkg:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;},
  Trash:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;},
  Home:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;},
  Leaf:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={"M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C8 16 10 12 17 10V8z"} fill={c} fillOpacity="0.15"/><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C8 16 10 12 17 10"/><path d="M20.59 3.41A2 2 0 0 1 22 5c0 6-8 10-14 11"/></svg>;},
  Heart:function(p){var s=p.s||20,c=p.c||"currentColor",f=p.filled||false;return <svg width={s} height={s} viewBox="0 0 24 24" fill={f?c:"none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;},
  User:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;},
  Demand:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>;},
  Sort:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M6 12h12M9 18h6"/></svg>;},
  Edit:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;},
};

// ── Autocomplete ──
function PlantAC({value,onChange,placeholder}){
  const [sugg,setSugg]=useState([]);const [show,setShow]=useState(false);const [focused,setFocused]=useState(false);
  var timer=useRef(null),wrap=useRef(null);
  function handleChange(e){var v=e.target.value;onChange(v);clearTimeout(timer.current);if(v.length>=2){timer.current=setTimeout(function(){setSugg(searchLocalPlants(v));},150);setShow(true);}else{setSugg([]);setShow(false);}}
  function pick(p){onChange(p.full);setShow(false);setSugg([]);}
  useEffect(function(){function h(e){if(wrap.current&&!wrap.current.contains(e.target))setShow(false);}document.addEventListener("mousedown",h);return function(){document.removeEventListener("mousedown",h);};});
  return(
    <div ref={wrap} style={{position:"relative"}}>
      <input value={value} onChange={handleChange} placeholder={placeholder} onFocus={function(){setFocused(true);if(sugg.length)setShow(true);}} onBlur={function(){setFocused(false);}}
        style={{width:"100%",padding:"11px 14px",border:"2px solid "+(focused?C.primary:C.border),borderRadius:"12px",fontSize:"14px",outline:"none",transition:"border 0.2s",boxSizing:"border-box"}} />
      {show&&sugg.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"white",borderRadius:"12px",marginTop:"4px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",border:"1px solid "+C.border,maxHeight:"220px",overflow:"auto"}}>
          {sugg.map(function(s,i){return(
            <div key={i} onMouseDown={function(){pick(s);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:i<sugg.length-1?"1px solid #f0f0f0":"none"}} onMouseEnter={function(e){e.currentTarget.style.background="#f5f9f6";}} onMouseLeave={function(e){e.currentTarget.style.background="white";}}>
              <div style={{fontSize:"13.5px",fontWeight:"600",color:C.text}}>{s.czech||s.latin}</div>
              {s.czech&&<div style={{fontSize:"11px",color:C.muted,fontStyle:"italic"}}>{s.latin}</div>}
            </div>);})}
        </div>)}
    </div>);
}

// ── Photo Capture (max 3) ──
function Photos({photos,onChange}){
  var MAX=3,camRef=useRef(null),galRef=useRef(null);
  function proc(file){if(!file||photos.length>=MAX||!file.type.startsWith("image/"))return;var rd=new FileReader();rd.onload=function(e){var img=new window.Image();img.onload=function(){var cv=document.createElement("canvas"),M=800,w=img.width,h=img.height;if(w>M||h>M){if(w>h){h=(h/w)*M;w=M;}else{w=(w/h)*M;h=M;}}cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);onChange(photos.concat([cv.toDataURL("image/jpeg",0.8)]));};img.src=e.target.result;};rd.readAsDataURL(file);}
  return(
    <div>
      <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"8px"}}>Fotky ({photos.length}/{MAX})</label>
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
        {photos.map(function(p,i){return(<div key={i} style={{width:"80px",height:"80px",borderRadius:"12px",overflow:"hidden",position:"relative",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}><img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /><button onClick={function(){onChange(photos.filter(function(_,j){return j!==i;}));}} style={{position:"absolute",top:"3px",right:"3px",background:"rgba(0,0,0,0.6)",border:"none",borderRadius:"50%",width:"20px",height:"20px",color:"white",cursor:"pointer",fontSize:"11px",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>);})}
        {photos.length<MAX&&(<>
          <button onClick={function(){camRef.current&&camRef.current.click();}} style={{width:"80px",height:"80px",borderRadius:"12px",border:"2px dashed "+C.border,background:C.primary+"06",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px"}}><I.Camera s={18} c={C.primary} /><span style={{fontSize:"9px",color:C.primary,fontWeight:"600"}}>Fotit</span></button>
          <button onClick={function(){galRef.current&&galRef.current.click();}} style={{width:"80px",height:"80px",borderRadius:"12px",border:"2px dashed "+C.border,background:C.accent+"06",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px"}}><I.Image s={18} c={C.accent} /><span style={{fontSize:"9px",color:C.accent,fontWeight:"600"}}>Galerie</span></button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={function(e){if(e.target.files[0])proc(e.target.files[0]);e.target.value="";}} />
          <input ref={galRef} type="file" accept="image/*" style={{display:"none"}} onChange={function(e){if(e.target.files[0])proc(e.target.files[0]);e.target.value="";}} />
        </>)}
      </div>
    </div>);
}

// ── Community Stats Bar ──
function CommunityBar({profiles}){
  if(!profiles||profiles.length===0) return null;
  var cityMap={};
  profiles.forEach(function(p){var loc=(p.location||"").trim();if(loc){var key=loc.charAt(0).toUpperCase()+loc.slice(1).toLowerCase();cityMap[key]=(cityMap[key]||0)+1;}});
  var cities=Object.entries(cityMap).sort(function(a,b){return b[1]-a[1];});
  var topCities=cities.slice(0,6);
  return(
    <div style={{background:"linear-gradient(135deg, "+C.primary+"08, "+C.accent+"08)",padding:"14px 20px",borderBottom:"1px solid "+C.border}}>
      <div style={{maxWidth:"960px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
          <I.User s={16} c={C.primary} />
          <span style={{fontSize:"13px",fontWeight:"700",color:C.primary}}>{profiles.length} zahradníků</span>
          <span style={{fontSize:"13px",color:C.sub}}>z {cities.length} měst</span>
        </div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {topCities.map(function(entry){return(
            <span key={entry[0]} style={{background:"white",padding:"3px 10px",borderRadius:"20px",fontSize:"11px",color:C.sub,border:"1px solid "+C.border}}>
              <I.Pin s={10} c={C.muted} /> {entry[0]} <strong style={{color:C.primary}}>{entry[1]}</strong>
            </span>);})}
          {cities.length>6&&<span style={{padding:"3px 10px",fontSize:"11px",color:C.muted}}>a další...</span>}
        </div>
      </div>
    </div>);
}

// ── Plant Card ──
function PlantCard({plant,onClick,isFav,onToggleFav}){
  var hasP=plant.photos&&plant.photos.length>0,dn=(plant.name||"").split(" – "),st=STATUSES[plant.status]||STATUSES.active,isDemand=plant.type==="demand";
  return(
    <div onClick={onClick} style={{background:C.card,borderRadius:"16px",overflow:"hidden",cursor:"pointer",transition:"all 0.3s cubic-bezier(0.23,1,0.32,1)",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",border:"1px solid "+(isDemand?C.accent+"40":C.border)}} onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.1)";}} onMouseLeave={function(e){e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.05)";}}>
      <div style={{height:"140px",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",background:hasP?"#eee":"linear-gradient(135deg, "+(plant.color||C.primary)+"20, "+(plant.color||C.primary)+"40)"}}>
        {hasP?<img src={plant.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:isDemand?<I.Demand s={48} c={plant.color||C.accent} />:<I.Leaf s={48} c={plant.color||C.primary} />}
        {plant.photos&&plant.photos.length>1&&<div style={{position:"absolute",bottom:"8px",right:"8px",background:"rgba(0,0,0,0.6)",borderRadius:"10px",padding:"2px 8px",fontSize:"11px",color:"white",fontWeight:"600"}}>+{plant.photos.length-1}</div>}
        <div style={{position:"absolute",top:"8px",left:"8px",display:"flex",gap:"4px"}}>
          {isDemand&&<div style={{background:C.accent,borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:"700",color:"white"}}>Poptávka</div>}
          {!isDemand&&<div style={{background:"rgba(255,255,255,0.92)",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:"600",color:C.sub,backdropFilter:"blur(8px)"}}>{plant.category}</div>}
        </div>
        {!isDemand&&plant.status!=="active"&&<div style={{position:"absolute",top:"8px",right:"8px",background:st.bg,borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:"700",color:st.color}}>{st.label}</div>}
        <button onClick={function(e){e.stopPropagation();onToggleFav(plant.id);}} style={{position:"absolute",bottom:"8px",left:"8px",background:"rgba(255,255,255,0.85)",border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}}><I.Heart s={16} c={isFav?C.heart:"#ccc"} filled={isFav} /></button>
      </div>
      <div style={{padding:"12px 14px"}}>
        <h3 style={{margin:"0 0 2px",fontSize:"14px",fontWeight:"700",color:C.text,fontFamily:"'Playfair Display', Georgia, serif"}}>{dn[1]||dn[0]}</h3>
        {dn[1]&&<div style={{fontSize:"11px",color:C.muted,fontStyle:"italic",marginBottom:"4px"}}>{dn[0]}</div>}
        <p style={{margin:"0 0 8px",fontSize:"12px",color:C.muted,lineHeight:"1.4",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{plant.description}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"20px",height:"20px",borderRadius:"50%",background:"linear-gradient(135deg, "+(plant.color||C.primary)+", "+(plant.color||C.primary)+"88)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",color:"white",fontWeight:"700"}}>{(plant.userName||"?")[0]}</div><span style={{fontSize:"11px",color:C.muted}}>{plant.userName}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:"3px"}}><I.Pin s={11} c={C.muted} /><span style={{fontSize:"10px",color:C.muted}}>{plant.location}</span></div>
        </div>
        {plant.lookingFor&&(<div style={{marginTop:"8px",padding:"6px 10px",background:C.primary+"08",borderRadius:"8px",fontSize:"11px",color:C.sub}}><span style={{fontWeight:"600",color:C.primary}}>Hledám:</span> {plant.lookingFor}</div>)}
      </div>
    </div>);
}

// ── Gallery Lightbox ──
function GalleryLB({photos,onClose}){const [cur,setCur]=useState(0);if(!photos||!photos.length)return null;return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} onClick={onClose}><button onClick={onClose} style={{position:"absolute",top:"16px",right:"16px",background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"50%",width:"40px",height:"40px",color:"white",cursor:"pointer",fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button><img src={photos[cur]} alt="" style={{maxWidth:"92%",maxHeight:"78vh",borderRadius:"8px",objectFit:"contain"}} onClick={function(e){e.stopPropagation();}} />{photos.length>1&&(<div style={{display:"flex",gap:"8px",marginTop:"16px"}} onClick={function(e){e.stopPropagation();}}>{photos.map(function(p,i){return <div key={i} onClick={function(){setCur(i);}} style={{width:"48px",height:"48px",borderRadius:"8px",overflow:"hidden",cursor:"pointer",border:i===cur?"2px solid white":"2px solid transparent",opacity:i===cur?1:0.5}}><img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>;})}</div>)}</div>);}

// ── Detail Modal (with Edit button) ──
function Detail({plant,user,onClose,onStartChat,onDelete,onStatusChange,onEdit,isFav,onToggleFav}){
  const [gal,setGal]=useState(false);
  var mine=user&&plant.userId===user.uid,hasP=plant.photos&&plant.photos.length>0,dn=(plant.name||"").split(" – "),st=STATUSES[plant.status]||STATUSES.active,isDemand=plant.type==="demand";
  return(<>
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"24px",maxWidth:"480px",width:"100%",maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{height:"200px",position:"relative",borderRadius:"24px 24px 0 0",overflow:"hidden",cursor:hasP?"pointer":"default",background:hasP?"#eee":"linear-gradient(135deg, "+(plant.color||C.primary)+"30, "+(plant.color||C.primary)+"60)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={function(){if(hasP)setGal(true);}}>
          {hasP?<img src={plant.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:isDemand?<I.Demand s={72} c={plant.color||C.accent} />:<I.Leaf s={72} c={plant.color||C.primary} />}
          {hasP&&plant.photos.length>1&&<div style={{position:"absolute",bottom:"12px",right:"12px",background:"rgba(0,0,0,0.6)",borderRadius:"12px",padding:"4px 12px",fontSize:"12px",color:"white",fontWeight:"600"}}>📷 {plant.photos.length} fotek</div>}
          <button onClick={function(e){e.stopPropagation();onClose();}} style={{position:"absolute",top:"12px",right:"12px",background:"rgba(255,255,255,0.9)",border:"none",borderRadius:"50%",width:"36px",height:"36px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={18} c="#333" /></button>
          <button onClick={function(e){e.stopPropagation();onToggleFav(plant.id);}} style={{position:"absolute",top:"12px",left:"12px",background:"rgba(255,255,255,0.9)",border:"none",borderRadius:"50%",width:"36px",height:"36px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.Heart s={18} c={isFav?C.heart:"#ccc"} filled={isFav} /></button>
        </div>
        <div style={{padding:"24px"}}>
          <div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap"}}>
            {isDemand&&<span style={{background:C.accent,color:"white",padding:"4px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:"700"}}>Poptávka</span>}
            {!isDemand&&<span style={{background:(plant.color||C.primary)+"18",color:plant.color||C.primary,padding:"4px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:"600"}}>{plant.category}</span>}
            {!isDemand&&<span style={{background:st.bg,color:st.color,padding:"4px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:"600"}}>{st.label}</span>}
          </div>
          <h2 style={{margin:"0 0 2px",fontSize:"22px",fontWeight:"700",fontFamily:"'Playfair Display', Georgia, serif",color:C.text}}>{dn[1]||dn[0]}</h2>
          {dn[1]&&<div style={{fontSize:"13px",color:C.muted,fontStyle:"italic",marginBottom:"10px"}}>{dn[0]}</div>}
          <p style={{margin:"0 0 20px",fontSize:"14px",color:C.sub,lineHeight:"1.6"}}>{plant.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
            <div style={{background:C.bg,padding:"14px",borderRadius:"12px"}}><div style={{fontSize:"10px",color:C.muted,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{isDemand?"Hledá":"Nabízí"}</div><div style={{fontSize:"13px",color:C.text,fontWeight:"600"}}>{plant.userName}</div><div style={{fontSize:"12px",color:C.muted,marginTop:"2px",display:"flex",alignItems:"center",gap:"4px"}}><I.Pin s={11} c={C.muted} /> {plant.location}</div></div>
            {plant.lookingFor&&(<div style={{background:C.primary+"08",padding:"14px",borderRadius:"12px"}}><div style={{fontSize:"10px",color:C.primary,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Hledám výměnou</div><div style={{fontSize:"13px",color:C.text,fontWeight:"500"}}>{plant.lookingFor}</div></div>)}
          </div>
          <div style={{background:"#f0f7ff",border:"1px solid #d0e3f5",borderRadius:"12px",padding:"12px 14px",marginBottom:"20px",fontSize:"13px",color:"#4a6a8a",display:"flex",alignItems:"center",gap:"10px"}}><I.Pkg s={20} c="#4a6a8a" /><span>Předání přes výdejní místa nebo osobně — domluvte se v chatu.</span></div>
          {mine?(
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {!isDemand&&(<div style={{display:"flex",gap:"6px"}}>{Object.entries(STATUSES).map(function(entry){var key=entry[0],val=entry[1];return <button key={key} onClick={function(){onStatusChange(plant.id,key);}} style={{flex:1,padding:"10px",border:"2px solid",borderColor:plant.status===key?val.color:C.border,borderRadius:"10px",background:plant.status===key?val.bg:"white",color:plant.status===key?val.color:C.muted,fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>{val.label}</button>;})}</div>)}
              <button onClick={function(){onEdit(plant);onClose();}} style={{padding:"12px",border:"none",borderRadius:"12px",background:C.primary+"12",color:C.primary,fontSize:"13px",fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><I.Edit s={16} c={C.primary} /> Upravit</button>
              <button onClick={function(){onDelete(plant.id);onClose();}} style={{padding:"12px",border:"none",borderRadius:"12px",background:C.danger+"12",color:C.danger,fontSize:"13px",fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><I.Trash s={16} c={C.danger} /> Smazat</button>
            </div>
          ):(
            <button onClick={function(){onStartChat(plant);onClose();}} style={{width:"100%",padding:"14px",border:"none",borderRadius:"14px",background:"linear-gradient(135deg, "+C.primary+", "+C.primaryDark+")",color:"white",fontSize:"15px",fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",boxShadow:"0 4px 16px "+C.primary+"40"}}><I.Chat s={18} c="white" /> Napsat zprávu</button>
          )}
        </div>
      </div>
    </div>
    {gal&&<GalleryLB photos={plant.photos} onClose={function(){setGal(false);}} />}
  </>);
}

// ── Add / Edit / Demand Form ──
function AddForm({user,profile,onClose,onAdd,onUpdate,mode,editPlant}){
  var isDemand=mode==="demand";
  var isEdit=!!editPlant;
  const [f,setF]=useState(editPlant?{name:editPlant.name||"",category:editPlant.category||"Kvetoucí",description:editPlant.description||"",lookingFor:editPlant.lookingFor||"",location:editPlant.location||(profile&&profile.location)||""}:{name:"",category:"Kvetoucí",description:"",lookingFor:"",location:(profile&&profile.location)||""});
  const [photos,setPhotos]=useState(editPlant?editPlant.photos||[]:[]);
  const [saving,setSaving]=useState(false);
  var ok=f.name.trim()&&f.description.trim()&&f.location.trim();
  async function submit(){
    if(!ok||saving)return;setSaving(true);
    try{
      if(isEdit){
        var upd={name:f.name.trim(),category:f.category,description:f.description.trim(),lookingFor:f.lookingFor.trim(),location:f.location.trim(),photos:photos};
        await updateDoc(doc(db,"plants",editPlant.id),upd);
        onUpdate(Object.assign({},editPlant,upd));
      }else{
        var plantData={name:f.name.trim(),category:f.category,description:f.description.trim(),lookingFor:f.lookingFor.trim(),location:f.location.trim(),photos:photos,type:mode,userId:user.uid,userName:(profile&&profile.displayName)||"Anonym",color:"hsl("+Math.floor(Math.random()*360)+",50%,60%)",createdAt:Date.now(),status:"active"};
        var docRef=await addDoc(collection(db,"plants"),plantData);
        onAdd(Object.assign({},plantData,{id:docRef.id}));
      }
      onClose();
    }catch(err){console.error("Chyba:",err);alert("Nepodařilo se uložit.");setSaving(false);}
  }
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"24px",maxWidth:"480px",width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{padding:"24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
            <h2 style={{margin:0,fontSize:"20px",fontWeight:"700",fontFamily:"'Playfair Display', Georgia, serif",color:C.text}}>{isEdit?"Upravit":(isDemand?"Hledám rostlinu":"Přidat nabídku")}</h2>
            <button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={16} c={C.sub} /></button>
          </div>
          {!isDemand&&<div style={{marginBottom:"20px"}}><Photos photos={photos} onChange={setPhotos} /></div>}
          <div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>{isDemand?"Jakou rostlinu hledáte? *":"Název rostliny *"}</label><PlantAC value={f.name} onChange={function(v){setF(Object.assign({},f,{name:v}));}} placeholder={isDemand?"např. Pivoňka, Hosta...":"např. Echinacea, Třapatka..."} /></div>
          <div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>{isDemand?"Podrobnosti *":"Popis *"}</label><textarea value={f.description} onChange={function(e){setF(Object.assign({},f,{description:e.target.value}));}} placeholder={isDemand?"Jakou barvu, velikost hledáte...":"Popište rostlinu, kolik kusů nabízíte..."} rows={3} style={{width:"100%",padding:"11px 14px",border:"2px solid "+C.border,borderRadius:"12px",fontSize:"14px",resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
          {!isDemand&&(<div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Hledám výměnou</label><input value={f.lookingFor} onChange={function(e){setF(Object.assign({},f,{lookingFor:e.target.value}));}} placeholder="Co byste chtěli výměnou?" style={{width:"100%",padding:"11px 14px",border:"2px solid "+C.border,borderRadius:"12px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>)}
          <div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Lokalita *</label><input value={f.location} onChange={function(e){setF(Object.assign({},f,{location:e.target.value}));}} placeholder="Město" style={{width:"100%",padding:"11px 14px",border:"2px solid "+C.border,borderRadius:"12px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
          {!isDemand&&(<div style={{marginBottom:"20px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"8px"}}>Kategorie</label><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{CATS.filter(function(c){return c!=="Vše";}).map(function(cat){return <button key={cat} onClick={function(){setF(Object.assign({},f,{category:cat}));}} style={{padding:"6px 12px",borderRadius:"20px",border:"2px solid",borderColor:f.category===cat?C.primary:C.border,background:f.category===cat?C.primary+"10":"white",color:f.category===cat?C.primary:C.muted,fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>{cat}</button>;})}</div></div>)}
          <button onClick={submit} disabled={!ok||saving} style={{width:"100%",padding:"14px",border:"none",borderRadius:"14px",background:ok?"linear-gradient(135deg, "+C.primary+", "+C.primaryDark+")":"#e0e0e0",color:"white",fontSize:"15px",fontWeight:"700",cursor:ok?"pointer":"default",opacity:saving?0.7:1}}>{saving?"Ukládám...":(isEdit?"✅ Uložit změny":(isDemand?"🔍 Zveřejnit poptávku":"🌱 Přidat nabídku"))}</button>
        </div>
      </div>
    </div>);
}

// ── Chat View ──
function ChatView({chat,user,onBack,onMarkRead}){
  const [msgs,setMsgs]=useState([]);const [text,setText]=useState("");const [ld,setLd]=useState(true);var btm=useRef(null);
  useEffect(function(){document.documentElement.style.backgroundColor="#f4f7f5";document.body.style.backgroundColor="#f4f7f5";document.body.style.overflow="hidden";return function(){document.body.style.overflow="";};},[]);
  useEffect(function(){var q2=query(collection(db,"messages"),where("chatId","==",chat.id),orderBy("timestamp","asc"));var unsub=onSnapshot(q2,function(snap){setMsgs(snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}));setLd(false);});return unsub;},[chat.id]);
  useEffect(function(){setTimeout(function(){if(btm.current)btm.current.scrollIntoView({behavior:"smooth"});},100);},[msgs]);
  useEffect(function(){if(onMarkRead)onMarkRead(chat.id);},[chat.id]);
  async function send(){if(!text.trim())return;var t=text.trim();setText("");await addDoc(collection(db,"messages"),{chatId:chat.id,senderId:user.uid,text:t,timestamp:Date.now()});var chatRef=doc(db,"chats",chat.id);var chatSnap=await getDoc(chatRef);if(chatSnap.exists()){await updateDoc(chatRef,{lastMessage:t,lastTimestamp:Date.now(),lastSenderId:user.uid,readBy:[user.uid]});}else{await setDoc(chatRef,{id:chat.id,participants:chat.participants,plantName:chat.plantName,lastMessage:t,lastTimestamp:Date.now(),lastSenderId:user.uid,readBy:[user.uid]});}}
  function fmt(ts){var d=new Date(ts);return d.getHours()+":"+d.getMinutes().toString().padStart(2,"0");}
  return(<>
    <div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:C.bg,zIndex:999}} />
    <div style={{position:"fixed",top:0,left:0,width:"100vw",zIndex:1000,display:"flex",flexDirection:"column",height:"100vh",height:"100dvh",backgroundColor:C.card,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",gap:"12px",flexShrink:0,backgroundColor:C.card}}><button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}><I.Back s={22} c={C.text} /></button><div><div style={{fontSize:"15px",fontWeight:"700",color:C.text}}>{chat.plantName}</div><div style={{fontSize:"12px",color:C.muted}}>Výměna</div></div></div>
      <div style={{flex:1,overflow:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"8px",backgroundColor:C.bg,WebkitOverflowScrolling:"touch",overscrollBehavior:"contain"}}>
        {ld&&<div style={{textAlign:"center",color:C.muted,padding:"32px"}}>Načítám...</div>}
        {msgs.map(function(m){var mine=m.senderId===user.uid;return(<div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"80%"}}><div style={{padding:"10px 14px",borderRadius:"16px",borderBottomRightRadius:mine?"4px":"16px",borderBottomLeftRadius:mine?"16px":"4px",background:mine?C.primary:"white",color:mine?"white":C.text,fontSize:"14px",lineHeight:"1.5",boxShadow:mine?"none":"0 1px 4px rgba(0,0,0,0.06)"}}>{m.text}</div><div style={{fontSize:"10px",color:C.muted,marginTop:"3px",textAlign:mine?"right":"left",padding:"0 4px"}}>{fmt(m.timestamp)}</div></div>);})}
        <div ref={btm} />
      </div>
      <div style={{padding:"8px 12px",paddingBottom:"calc(8px + env(safe-area-inset-bottom, 0px))",borderTop:"1px solid "+C.border,display:"flex",gap:"8px",alignItems:"center",boxSizing:"border-box",width:"100%",flexShrink:0,backgroundColor:C.card}}>
        <input value={text} onChange={function(e){setText(e.target.value);}} placeholder="Napište zprávu..." onKeyDown={function(e){if(e.key==="Enter")send();}} onFocus={function(){setTimeout(function(){if(btm.current)btm.current.scrollIntoView({behavior:"smooth"});},300);}} style={{flex:1,minWidth:0,padding:"10px 14px",border:"2px solid "+C.border,borderRadius:"24px",fontSize:"16px",outline:"none",boxSizing:"border-box"}} />
        <button onClick={send} disabled={!text.trim()} style={{width:"40px",height:"40px",minWidth:"40px",borderRadius:"50%",border:"none",cursor:text.trim()?"pointer":"default",background:text.trim()?C.primary:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I.Send s={16} c="white" /></button>
      </div>
    </div>
  </>);
}

// ── Chat List ──
function ChatList({user,onOpen,onBack}){
  const [chats,setChats]=useState([]);const [ld,setLd]=useState(true);
  useEffect(function(){(async function(){var q2=query(collection(db,"chats"),where("participants","array-contains",user.uid));var snap=await getDocs(q2);setChats(snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}));setLd(false);})();},[user]);
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:C.card,zIndex:900,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",gap:"12px"}}><button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}><I.Back s={22} c={C.text} /></button><h2 style={{margin:0,fontSize:"20px",fontWeight:"700",fontFamily:"'Playfair Display', Georgia, serif"}}>Zprávy</h2></div>
      <div style={{flex:1,overflow:"auto"}}>
        {ld&&<div style={{textAlign:"center",padding:"48px",color:C.muted}}>Načítám...</div>}
        {!ld&&!chats.length&&<div style={{textAlign:"center",padding:"48px",color:C.muted}}><I.Chat s={40} c={C.border} /><p style={{marginTop:"12px"}}>Zatím žádné konverzace</p></div>}
        {chats.map(function(ch){return(<div key={ch.id} onClick={function(){onOpen(ch);}} style={{padding:"16px 20px",borderBottom:"1px solid "+C.border,cursor:"pointer",display:"flex",alignItems:"center",gap:"14px"}} onMouseEnter={function(e){e.currentTarget.style.background=C.bg;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><div style={{width:"44px",height:"44px",borderRadius:"50%",background:C.primary+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I.Leaf s={22} c={C.primary} /></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"14px",fontWeight:"600",color:C.text}}>{ch.plantName}</div><div style={{fontSize:"12px",color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ch.lastMessage}</div></div></div>);})}
      </div>
    </div>);
}

// ── Welcome Screen (with optional demand) ──
function Welcome(){
  const [name,setName]=useState("");const [loc,setLoc]=useState("");const [want,setWant]=useState("");const [saving,setSaving]=useState(false);
  var ok=name.trim()&&loc.trim();
  async function go(){
    if(!ok||saving)return;setSaving(true);
    try{
      var result=await signInAnonymously(auth);var uid=result.user.uid;
      await setDoc(doc(db,"profiles",uid),{displayName:name.trim(),location:loc.trim(),createdAt:Date.now()});
      if(want.trim()){
        await addDoc(collection(db,"plants"),{name:want.trim(),type:"demand",category:"",description:"Hledám tuto rostlinu — nabídněte mi výměnu!",lookingFor:"",location:loc.trim(),photos:[],userId:uid,userName:name.trim(),color:"hsl("+Math.floor(Math.random()*360)+",50%,60%)",createdAt:Date.now(),status:"active"});
      }
    }catch(err){console.error("Chyba:",err);alert("Nepodařilo se připojit.");setSaving(false);}
  }
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg, "+C.bg+" 0%, #e8f0ea 50%, "+C.bg+" 100%)",padding:"24px"}}>
      <div style={{width:"100%",maxWidth:"380px",textAlign:"center"}}>
        <div style={{fontSize:"52px",marginBottom:"8px"}}>🌱</div>
        <h1 style={{fontSize:"36px",fontWeight:"800",fontFamily:"'Playfair Display', Georgia, serif",color:C.text,margin:"0 0 6px",letterSpacing:"-1px"}}>Odkopni</h1>
        <p style={{fontSize:"15px",color:C.sub,margin:"0 0 36px",lineHeight:"1.5"}}>Vyměňte přebytky ze zahrady<br/>s dalšími zahradníky</p>
        <div style={{textAlign:"left",marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Jak vám máme říkat? *</label><input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Přezdívka nebo jméno" style={{width:"100%",padding:"14px",border:"2px solid "+C.border,borderRadius:"14px",fontSize:"15px",outline:"none",boxSizing:"border-box"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
        <div style={{textAlign:"left",marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Odkud jste? *</label><input value={loc} onChange={function(e){setLoc(e.target.value);}} placeholder="Město nebo oblast" style={{width:"100%",padding:"14px",border:"2px solid "+C.border,borderRadius:"14px",fontSize:"15px",outline:"none",boxSizing:"border-box"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
        <div style={{textAlign:"left",marginBottom:"24px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Po jaké rostlině pokukujete? <span style={{fontWeight:"400",color:C.muted}}>(volitelné)</span></label><PlantAC value={want} onChange={setWant} placeholder="např. Pivoňka, Hosta, Levandule..." /></div>
        <button onClick={go} disabled={!ok||saving} style={{width:"100%",padding:"16px",border:"none",borderRadius:"14px",background:ok?"linear-gradient(135deg, "+C.primary+", "+C.primaryDark+")":"#e0e0e0",color:"white",fontSize:"16px",fontWeight:"700",cursor:ok?"pointer":"default",boxShadow:ok?"0 4px 20px "+C.primary+"30":"none"}}>{saving?"Připojuji...":"Jdeme na to! 🌿"}</button>
        <p style={{fontSize:"11px",color:C.muted,marginTop:"20px"}}>Žádná registrace — vaše data zůstanou v tomto prohlížeči.</p>
      </div>
    </div>);
}

// ── Profile Editor ──
function ProfileEdit({user,profile,onClose,onProfileUpdate}){
  const [name,setName]=useState((profile&&profile.displayName)||"");const [loc,setLoc]=useState((profile&&profile.location)||"");
  async function save(){if(!name.trim())return;var data={displayName:name.trim(),location:loc.trim()};await setDoc(doc(db,"profiles",user.uid),data,{merge:true});onProfileUpdate(data);onClose();}
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"24px",maxWidth:"400px",width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{padding:"24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}><h2 style={{margin:0,fontSize:"20px",fontWeight:"700",fontFamily:"'Playfair Display', Georgia, serif"}}>Profil</h2><button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={16} c={C.sub} /></button></div>
          <div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Přezdívka</label><input value={name} onChange={function(e){setName(e.target.value);}} style={{width:"100%",padding:"11px 14px",border:"2px solid "+C.border,borderRadius:"12px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
          <div style={{marginBottom:"20px"}}><label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBottom:"6px"}}>Lokalita</label><input value={loc} onChange={function(e){setLoc(e.target.value);}} style={{width:"100%",padding:"11px 14px",border:"2px solid "+C.border,borderRadius:"12px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
          <button onClick={save} style={{width:"100%",padding:"14px",border:"none",borderRadius:"14px",background:"linear-gradient(135deg, "+C.primary+", "+C.primaryDark+")",color:"white",fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>Uložit</button>
        </div>
      </div>
    </div>);
}

// ============================================================
// MAIN APP
// ============================================================
export default function App(){
  const [user,setUser]=useState(undefined);const [profile,setProfile]=useState(null);const [plants,setPlants]=useState([]);
  const [sel,setSel]=useState(null);const [showAdd,setShowAdd]=useState(false);const [addMode,setAddMode]=useState("offer");
  const [editPlant,setEditPlant]=useState(null);
  const [showChats,setShowChats]=useState(false);const [activeChat,setActiveChat]=useState(null);
  const [showProfile,setShowProfile]=useState(false);const [search,setSearch]=useState("");
  const [cat,setCat]=useState("Vše");const [view,setView]=useState("browse");const [sort,setSort]=useState("newest");
  const [unreadCount,setUnreadCount]=useState(0);
  const [allProfiles,setAllProfiles]=useState([]);
  const [favs,setFavs]=useState(function(){try{return JSON.parse(localStorage.getItem("odkopni_favs")||"[]");}catch(e){return[];}});

  useEffect(function(){var unsub=onAuthStateChanged(auth,async function(u){setUser(u);if(u){try{var profSnap=await getDoc(doc(db,"profiles",u.uid));if(profSnap.exists())setProfile(profSnap.data());}catch(e){}}});return unsub;},[]);

  useEffect(function(){(async function(){try{var q2=query(collection(db,"plants"),orderBy("createdAt","desc"));var snap=await getDocs(q2);setPlants(snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}));}catch(e){}})();},[]);

  // Load all profiles for community bar
  useEffect(function(){(async function(){try{var snap=await getDocs(collection(db,"profiles"));setAllProfiles(snap.docs.map(function(d){return d.data();}));}catch(e){}})();},[]);

  useEffect(function(){if(!user)return;async function checkUnread(){try{var q2=query(collection(db,"chats"),where("participants","array-contains",user.uid));var snap=await getDocs(q2);var count=0;snap.docs.forEach(function(d){var data=d.data();var readBy=data.readBy||[];if(data.lastSenderId&&data.lastSenderId!==user.uid&&!readBy.includes(user.uid))count++;});setUnreadCount(count);}catch(e){}}checkUnread();var interval=setInterval(checkUnread,15000);return function(){clearInterval(interval);};},[user]);

  useEffect(function(){try{localStorage.setItem("odkopni_favs",JSON.stringify(favs));}catch(e){}},[favs]);

  function toggleFav(id){setFavs(function(f){return f.includes(id)?f.filter(function(x){return x!==id;}):f.concat([id]);});}
  function addPlant(p){setPlants(function(prev){return[p].concat(prev);});}
  function updatePlant(p){setPlants(function(prev){return prev.map(function(x){return x.id===p.id?p:x;});});setSel(null);}
  async function delPlant(id){try{await deleteDoc(doc(db,"plants",id));setPlants(plants.filter(function(p){return p.id!==id;}));}catch(e){}}
  async function changeStatus(id,status){try{await updateDoc(doc(db,"plants",id),{status:status});setPlants(plants.map(function(p){return p.id===id?Object.assign({},p,{status:status}):p;}));setSel(function(s){return s&&s.id===id?Object.assign({},s,{status:status}):s;});}catch(e){}}
  function startChat(plant){var ids=[user.uid,plant.userId].sort();setActiveChat({id:ids[0]+"_"+ids[1]+"_"+plant.id,plantName:plant.name,participants:[user.uid,plant.userId]});}
  async function markRead(chatId){try{var chatRef=doc(db,"chats",chatId);var chatSnap=await getDoc(chatRef);if(chatSnap.exists()){var data=chatSnap.data();var readBy=data.readBy||[];if(!readBy.includes(user.uid)){readBy.push(user.uid);await updateDoc(chatRef,{readBy:readBy});}}var q2=query(collection(db,"chats"),where("participants","array-contains",user.uid));var snap=await getDocs(q2);var count=0;snap.docs.forEach(function(d){var dd=d.data();var rb=dd.readBy||[];if(dd.lastSenderId&&dd.lastSenderId!==user.uid&&!rb.includes(user.uid))count++;});setUnreadCount(count);}catch(e){}}
  function handleEdit(plant){setEditPlant(plant);setAddMode(plant.type==="demand"?"demand":"offer");setShowAdd(true);}

  var month=new Date().getMonth()+1,seasonalMsg=SEASONAL[month];
  var filtered=plants.filter(function(p){var s=search.toLowerCase();var ms=!s||(p.name&&p.name.toLowerCase().includes(s))||(p.description&&p.description.toLowerCase().includes(s))||(p.lookingFor||"").toLowerCase().includes(s)||(p.location&&p.location.toLowerCase().includes(s));var mc=cat==="Vše"||p.category===cat;var mv=view==="browse"?true:view==="my"?(user&&p.userId===user.uid):view==="favs"?favs.includes(p.id):true;return ms&&mc&&mv;});
  if(sort==="oldest")filtered=filtered.slice().reverse();

  if(user===undefined)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><div style={{fontSize:"36px"}}>🌱</div></div>;
  if(!user)return <Welcome />;
  if(!profile)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,flexDirection:"column",gap:"12px"}}><div style={{fontSize:"36px"}}>🌱</div><div style={{color:C.muted,fontSize:"14px"}}>Načítám profil...</div></div>;
  if(activeChat)return <ChatView chat={activeChat} user={user} onBack={function(){setActiveChat(null);}} onMarkRead={markRead} />;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif"}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}input,textarea,button{font-family:inherit}html,body{overflow-x:hidden;background-color:#f4f7f5}"}</style>

      <header style={{padding:"10px 16px",background:"rgba(255,255,255,0.88)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+C.border,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:"960px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"22px"}}>🌱</span><span style={{fontSize:"18px",fontWeight:"800",fontFamily:"'Playfair Display', Georgia, serif",color:C.text}}>Odkopni</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
              <button onClick={function(){setShowProfile(true);}} style={{background:"none",border:"none",cursor:"pointer",padding:"7px",borderRadius:"10px"}} title="Profil"><I.User s={19} c={C.sub} /></button>
              <button onClick={function(){setShowChats(true);}} style={{background:"none",border:"none",cursor:"pointer",padding:"7px",borderRadius:"10px",position:"relative"}} title="Zprávy"><I.Chat s={19} c={C.sub} />{unreadCount>0&&<span style={{position:"absolute",top:"2px",right:"2px",background:C.heart,color:"white",borderRadius:"50%",width:"16px",height:"16px",fontSize:"10px",fontWeight:"700",display:"flex",alignItems:"center",justifyContent:"center"}}>{unreadCount}</span>}</button>
            </div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={function(){setEditPlant(null);setAddMode("offer");setShowAdd(true);}} style={{flex:1,background:C.primary,border:"none",borderRadius:"10px",padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",color:"white",fontSize:"13px",fontWeight:"700"}}><I.Plus s={14} c="white" /> Nabídka</button>
            <button onClick={function(){setEditPlant(null);setAddMode("demand");setShowAdd(true);}} style={{flex:1,background:C.accent,border:"none",borderRadius:"10px",padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",color:"white",fontSize:"13px",fontWeight:"700"}}><I.Demand s={14} c="white" /> Poptávka</button>
          </div>
        </div>
      </header>

      {seasonalMsg&&(<div style={{background:"linear-gradient(135deg, "+C.primary+"12, "+C.accent+"12)",padding:"10px 20px",fontSize:"13px",color:C.sub,textAlign:"center",borderBottom:"1px solid "+C.border}}>🌿 {seasonalMsg}</div>)}

      {/* Community stats */}
      <CommunityBar profiles={allProfiles} />

      <div style={{maxWidth:"960px",margin:"0 auto",padding:"14px 20px 0"}}>
        <div style={{display:"flex",gap:"4px",marginBottom:"12px",background:"white",borderRadius:"12px",padding:"3px",border:"1px solid "+C.border,width:"fit-content"}}>
          {[{k:"browse",l:"Procházet",ico:I.Home},{k:"my",l:"Moje",ico:I.Leaf},{k:"favs",l:"Oblíbené",ico:function(p){return <I.Heart s={p.s} c={p.c} filled={true} />;}}].map(function(item){var Ico=item.ico;return(<button key={item.k} onClick={function(){setView(item.k);}} style={{padding:"7px 14px",borderRadius:"10px",border:"none",background:view===item.k?C.primary:"transparent",color:view===item.k?"white":C.sub,fontSize:"12px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px"}}><Ico s={13} c={view===item.k?"white":C.muted} /> {item.l}{item.k==="favs"&&favs.length>0&&<span style={{background:view===item.k?"rgba(255,255,255,0.3)":C.heart,color:"white",borderRadius:"10px",padding:"1px 6px",fontSize:"10px",fontWeight:"700"}}>{favs.length}</span>}</button>);})}
        </div>
        <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
          <div style={{position:"relative",flex:1}}><div style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",display:"flex"}}><I.Search s={16} c={C.muted} /></div><input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Hledat rostliny, lokality..." style={{width:"100%",padding:"11px 14px 11px 40px",border:"2px solid "+C.border,borderRadius:"12px",fontSize:"14px",outline:"none",background:"white"}} onFocus={function(e){e.target.style.borderColor=C.primary;}} onBlur={function(e){e.target.style.borderColor=C.border;}} /></div>
          <button onClick={function(){setSort(function(s){return s==="newest"?"oldest":"newest";});}} style={{background:"white",border:"2px solid "+C.border,borderRadius:"12px",padding:"0 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",fontSize:"12px",color:C.sub,fontWeight:"600",whiteSpace:"nowrap"}}><I.Sort s={14} c={C.muted} /> {sort==="newest"?"Nejnovější":"Nejstarší"}</button>
        </div>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px",marginBottom:"16px",WebkitOverflowScrolling:"touch"}}>{CATS.map(function(c){return(<button key={c} onClick={function(){setCat(c);}} style={{padding:"6px 12px",borderRadius:"20px",background:cat===c?C.primary:"white",color:cat===c?"white":C.sub,fontSize:"12px",fontWeight:"600",cursor:"pointer",whiteSpace:"nowrap",border:cat===c?"none":"1px solid "+C.border,boxShadow:cat===c?"0 2px 8px "+C.primary+"30":"none"}}>{c}</button>);})}</div>
        <div style={{display:"flex",gap:"12px",fontSize:"11px",color:C.muted,marginBottom:"14px"}}><span><strong style={{color:C.primary}}>{filtered.length}</strong> nabídek</span><span style={{color:C.border}}>|</span><span><strong style={{color:C.primary}}>{new Set(plants.map(function(p){return p.location;})).size}</strong> měst</span></div>
      </div>

      <main style={{maxWidth:"960px",margin:"0 auto",padding:"0 20px 80px"}}>
        {!filtered.length?(
          <div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><I.Leaf s={44} c={C.border} /><p style={{fontSize:"15px",fontWeight:"500",marginTop:"12px",color:C.sub}}>{view==="my"?"Zatím nemáte žádné nabídky":view==="favs"?"Žádné oblíbené":search?"Nic nenalezeno":"Žádné nabídky"}</p></div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1fr))",gap:"14px"}}>{filtered.map(function(p,i){return(<div key={p.id} style={{animation:"slideUp 0.35s ease "+(i*0.04)+"s both"}}><PlantCard plant={p} onClick={function(){setSel(p);}} isFav={favs.includes(p.id)} onToggleFav={toggleFav} /></div>);})}</div>
        )}
      </main>

      {sel&&<Detail plant={sel} user={user} onClose={function(){setSel(null);}} onStartChat={startChat} onDelete={delPlant} onStatusChange={changeStatus} onEdit={handleEdit} isFav={favs.includes(sel.id)} onToggleFav={toggleFav} />}
      {showAdd&&<AddForm user={user} profile={profile} onClose={function(){setShowAdd(false);setEditPlant(null);}} onAdd={addPlant} onUpdate={updatePlant} mode={addMode} editPlant={editPlant} />}
      {showChats&&!activeChat&&<ChatList user={user} onOpen={setActiveChat} onBack={function(){setShowChats(false);}} />}
      {showProfile&&<ProfileEdit user={user} profile={profile} onClose={function(){setShowProfile(false);}} onProfileUpdate={function(data){setProfile(function(prev){return Object.assign({},prev,data);});}} />}
    </div>);
}
