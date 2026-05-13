import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
auth, db,
signInAnonymously, onAuthStateChanged,
googleProvider, signInWithPopup, linkWithPopup,
sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
EmailAuthProvider, linkWithCredential,
collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc,
doc, query, where, orderBy, onSnapshot, setDoc
} from "./firebase";
// ============================================================
// ODKOPNI — výměnný marketplace pro zahradní trvalky
// ============================================================
// Konec "amnestie" pro recovery — profily vytvořené před tímto datem
// mohou být obnoveny pomocí přezdívky+města+rostliny+emailu (jakýkoliv email).
// Profily vytvořené po tomto datu (s povinným emailem) lze obnovit pouze
// pomocí emailu shodného s tím v profilu.
var RECOVERY_AMNESTY_END = 1780394108578; // 2. června 2026
const CZ_PERENNIALS = [
"Achillea millefolium – Řebříček obecný","Aconitum napellus – Oměj šalamounek","Agastache f
"Ajuga reptans – Živučka plazivá","Alchemilla mollis – Kontryhel měkký","Allium giganteum –
"Anemone hupehensis – Sasanka japonská","Anemone nemorosa – Sasanka hajní","Aquilegia vulga
"Arabis caucasica – Huseník kavkazský","Armeria maritima – Trávnička přímořská","Artemisia
"Aster novi-belgii – Hvězdnice novobelgická","Astilbe × arendsii – Čechrava Arendsova","Ast
"Aubrieta deltoidea – Tařička zahradní","Bergenia cordifolia – Bergénie srdčitá","Brunnera
"Campanula carpatica – Zvonek karpatský","Campanula persicifolia – Zvonek broskvolistý","Ce
"Cerastium tomentosum – Rožec plstnatý","Chrysanthemum × grandiflorum – Chryzantéma velkokv
"Coreopsis grandiflora – Krásnoočko velkokvěté","Crocosmia × crocosmiiflora – Montbrécie","
"Dianthus deltoides – Hvozdík kropenatý","Dianthus gratianopolitanus – Hvozdík sivý","Dicen
"Digitalis purpurea – Náprstník červený","Doronicum orientale – Kamzičník východní","Echina
"Echinops ritro – Bělotrn modrý","Epimedium × rubrum – Škornice červená","Erigeron speciosu
"Eryngium planum – Máčka ladní","Eupatorium maculatum – Sadec skvrnitý","Euphorbia polychro
"Filipendula ulmaria – Tužebník jilmový","Gaillardia × grandiflora – Kokarda velkokvětá","G
"Gaura lindheimeri – Svíčkovec Lindheimův","Gentiana acaulis – Hořec bezlodyžný","Geranium
"Geranium sanguineum – Kakost krvavý","Geum coccineum – Kuklík šarlatový","Gypsophila panic
"Helenium autumnale – Záplevák podzimní","Helianthus decapetalus – Slunečnice","Heliopsis h
"Helleborus niger – Čemeřice černá","Helleborus orientalis – Čemeřice východní","Hemerocall
"Heuchera sanguinea – Dlužicha krvavá","Heuchera micrantha – Dlužicha drobnokvětá","Hosta f
"Hosta sieboldiana – Bohyška Sieboldova","Iberis sempervirens – Iberka vždyzelená","Incarvi
"Iris germanica – Kosatec německý","Iris sibirica – Kosatec sibiřský","Kniphofia uvaria – K
"Lamium maculatum – Hluchavka skvrnitá","Lavandula angustifolia – Levandule lékařská","Leuc
"Liatris spicata – Šuškarda klasnatá","Ligularia dentata – Popelivka zubatá","Lilium regale
"Linum perenne – Len vytrvalý","Lobelia cardinalis – Lobelka šarlatová","Lupinus polyphyllu
"Lychnis chalcedonica – Smolnička chalcedonská","Lysimachia punctata – Vrbina tečkovaná","L
"Monarda didyma – Zavinutka dvojitá","Muscari armeniacum – Modřenec arménský","Myosotis syl
"Narcissus pseudonarcissus – Narcis žlutý","Nepeta × faassenii – Šanta Faassenova","Oenothe
"Paeonia lactiflora – Pivoňka čínská","Papaver orientale – Mák východní","Penstemon barbatu
"Phlox paniculata – Plamenka latnatá","Phlox subulata – Plamenka šídlovitá","Physalis alkek
"Physostegia virginiana – Terčovka viržinská","Platycodon grandiflorus – Boubelka velkokvět
"Polygonatum multiflorum – Kokořík mnohokvětý","Potentilla × tonguei – Mochna","Primula ver
"Primula vulgaris – Prvosenka bezlodyžná","Pulmonaria officinalis – Plicník lékařský","Puls
"Rodgersia aesculifolia – Rodgerzie jírovcovitá","Rudbeckia fulgida – Třapatka zářivá","Rud
"Salvia nemorosa – Šalvěj hajní","Salvia × superba – Šalvěj nádherná","Saponaria ocymoides
"Saxifraga × arendsii – Lomikámen Arendsův","Scabiosa caucasica – Hlaváč kavkazský","Sedum
"Sedum spurium – Rozchodník pochybný","Sempervivum tectorum – Netřesk střešní","Sidalcea ma
"Solidago hybrida – Zlatobýl zahradní","Stachys byzantina – Čistec vlnatý","Symphytum grand
"Thalictrum aquilegiifolium – Žluťucha orlíčkolistá","Thymus serpyllum – Mateřídouška úzkol
"Tiarella cordifolia – Pěnišník srdčitý","Tradescantia × andersoniana – Podražec Andersonův
"Trollius europaeus – Upolín evropský","Verbascum × hybridum – Divizna zahradní","Verbena b
"Veronica spicata – Rozrazil klasnatý","Vinca minor – Brčál menší","Viola cornuta – Violka
"Waldsteinia ternata – Mokrýš trojlistý","Yucca filamentosa – Juka vláknitá",
];
var PLANT_DB = CZ_PERENNIALS.map(function(e) { var parts = e.split(" – "); return { latin: pa
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
// Normalizace názvu rostliny pro matching nabídka↔poptávka
function normalizePlantName(name){
if(!name) return "";
// Vezmi český nebo latinský název, lowercase, bez diakritiky, bez "–" části
var n = name.split(" – ")[0].trim().toLowerCase();
// Také zkus český název
var cz = (name.split(" – ")[1] || "").trim().toLowerCase();
return (cz || n).normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
var SEASONAL = [null,"Leden: Plánujte jarní záhony — objednávejte si odnože předem!","Únor: B
var CATS = ["Vše","Kvetoucí","Listové","Sukulentní","Byliny","Trávy","Cibuloviny"];
var STATUSES = { active:{label:"Dostupné",color:"#48a868",bg:"#e8f5ec"}, reserved:{label:"Zam
var C = {primary:"#3B6B4A",primaryDark:"#2d5239",bg:"#f4f7f5",card:"#ffffff",text:"#1a2e1f",s
// Standardní styl inputu (s explicitní barvou textu!)
var INPUT_STYLE = {width:"100%",padding:"11px 14px",border:"2px solid "+C.border,borderRadius
// ── SVG Icons ──
var I = {
Camera:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} vie
Image:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} view
Send:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Chat:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Back:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Plus:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
X:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBox=
Search:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} vie
Pin:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBo
Pkg:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewBo
Trash:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} view
Home:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Leaf:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Heart:function(p){var s=p.s||20,c=p.c||"currentColor",f=p.filled||false;return <svg width={
User:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Demand:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} vie
Sort:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Edit:function(p){var s=p.s||20,c=p.c||"currentColor";return <svg width={s} height={s} viewB
Google:function(p){var s=p.s||18;return <svg width={s} height={s} viewBox="0 0 24 24"><path
};
// ── Autocomplete pro rostliny ──
function PlantAC({value,onChange,placeholder}){
const [sugg,setSugg]=useState([]);const [show,setShow]=useState(false);const [focused,setFo
var timer=useRef(null),wrap=useRef(null);
function handleChange(e){var v=e.target.value;onChange(v);clearTimeout(timer.current);if(v.
function pick(p){onChange(p.full);setShow(false);setSugg([]);}
useEffect(function(){function h(e){if(wrap.current&&!wrap.current.contains(e.target))setSho
return(
<div ref={wrap} style={{position:"relative"}}>
<input value={value} onChange={handleChange} placeholder={placeholder} onFocus={functio
style={Object.assign({},INPUT_STYLE,{border:"2px solid "+(focused?C.primary:C.border)
{show&&sugg.length>0&&(
<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"whit
{sugg.map(function(s,i){return(
<div key={i} onMouseDown={function(){pick(s);}} style={{padding:"10px 14px",curso
<div style={{fontSize:"13.5px",fontWeight:"600",color:C.text}}>{s.czech||s.lati
{s.czech&&<div style={{fontSize:"11px",color:C.muted,fontStyle:"italic"}}>{s.la
</div>);})}
</div>)}
</div>);
}
// ── Autocomplete pro lokality (z existujících inzerátů, řazeno podle četnosti) ──
function CityAC({value,onChange,cityList,placeholder}){
const [show,setShow]=useState(false);const [focused,setFocused]=useState(false);
var wrap=useRef(null);
// Filtrované návrhy
var sugg = useMemo(function(){
var v = (value||"").toLowerCase().trim();
if(!v) return cityList.slice(0,8);
var starts = [], contains = [];
cityList.forEach(function(item){
var k = item.name.toLowerCase();
if(k.startsWith(v)) starts.push(item);
else if(k.includes(v)) contains.push(item);
});
return starts.concat(contains).slice(0,8);
},[value,cityList]);
function pick(name){onChange(name);setShow(false);}
useEffect(function(){function h(e){if(wrap.current&&!wrap.current.contains(e.target))setSho
return(
<div ref={wrap} style={{position:"relative"}}>
<div style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",dis
<input value={value} onChange={function(e){onChange(e.target.value);setShow(true);}} pl
style={Object.assign({},INPUT_STYLE,{paddingLeft:"38px",paddingRight:value?"38px":"14
{value&&(<button onClick={function(){onChange("");setShow(false);}} style={{position:"a
{show&&sugg.length>0&&(
<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"whit
{sugg.map(function(s,i){return(
<div key={s.name} onMouseDown={function(){pick(s.name);}} style={{padding:"10px 1
<div style={{fontSize:"13.5px",fontWeight:"600",color:C.text,display:"flex",ali
<span style={{fontSize:"11px",color:C.muted,background:C.bg,padding:"2px 8px",b
</div>);})}
</div>)}
</div>);
}
// ── Photo Capture (max 3) ──
function Photos({photos,onChange}){
var MAX=3,camRef=useRef(null),galRef=useRef(null);
function proc(file){if(!file||photos.length>=MAX||!file.type.startsWith("image/"))return;va
return(
<div>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginBotto
<div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
{photos.map(function(p,i){return(<div key={i} style={{width:"80px",height:"80px",bord
{photos.length<MAX&&(<>
<button onClick={function(){camRef.current&&camRef.current.click();}} style={{width
<button onClick={function(){galRef.current&&galRef.current.click();}} style={{width
<input ref={camRef} type="file" accept="image/*" capture="environment" style={{disp
<input ref={galRef} type="file" accept="image/*" style={{display:"none"}} onChange=
</>)}
</div>
</div>);
}
// ── Community Stats Bar ──
function CommunityBar({profiles}){
if(!profiles||profiles.length===0) return null;
var cityMap={};
profiles.forEach(function(p){var loc=(p.location||"").trim();if(loc){var key=loc.charAt(0).
var cities=Object.entries(cityMap).sort(function(a,b){return b[1]-a[1];});
var topCities=cities.slice(0,6);
return(
<div style={{background:"linear-gradient(135deg, "+C.primary+"08, "+C.accent+"08)",paddin
<div style={{maxWidth:"960px",margin:"0 auto"}}>
<div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
<I.User s={16} c={C.primary} />
<span style={{fontSize:"13px",fontWeight:"700",color:C.primary}}>{profiles.length}
<span style={{fontSize:"13px",color:C.sub}}>z {cities.length} měst</span>
</div>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
{topCities.map(function(entry){return(
<span key={entry[0]} style={{background:"white",padding:"3px 10px",borderRadius:"
<I.Pin s={10} c={C.muted} /> {entry[0]} <strong style={{color:C.primary}}>{entr
</span>);})}
{cities.length>6&&<span style={{padding:"3px 10px",fontSize:"11px",color:C.muted}}>
</div>
</div>
</div>);
}
// ── Plant Card ──
function PlantCard({plant,onClick,isFav,onToggleFav}){
var hasP=plant.photos&&plant.photos.length>0,dn=(plant.name||"").split(" – "),st=STATUSES[p
return(
<div onClick={onClick} style={{background:C.card,borderRadius:"16px",overflow:"hidden",cu
<div style={{height:"140px",display:"flex",alignItems:"center",justifyContent:"center",
{hasP?<img src={plant.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:
{plant.photos&&plant.photos.length>1&&<div style={{position:"absolute",bottom:"8px",r
<div style={{position:"absolute",top:"8px",left:"8px",display:"flex",gap:"4px"}}>
{isDemand&&<div style={{background:C.accent,borderRadius:"20px",padding:"3px 10px",
{!isDemand&&<div style={{background:"rgba(255,255,255,0.92)",borderRadius:"20px",pa
</div>
{!isDemand&&plant.status!=="active"&&<div style={{position:"absolute",top:"8px",right
<button onClick={function(e){e.stopPropagation();onToggleFav(plant.id);}} style={{pos
</div>
<div style={{padding:"12px 14px"}}>
<h3 style={{margin:"0 0 2px",fontSize:"14px",fontWeight:"700",color:C.text,fontFamily
{dn[1]&&<div style={{fontSize:"11px",color:C.muted,fontStyle:"italic",marginBottom:"4
<p style={{margin:"0 0 8px",fontSize:"12px",color:C.muted,lineHeight:"1.4",display:"-
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"20p
<div style={{display:"flex",alignItems:"center",gap:"3px"}}><I.Pin s={11} c={C.mute
</div>
{plant.lookingFor&&(<div style={{marginTop:"8px",padding:"6px 10px",background:C.prim
</div>
</div>);
}
// ── Gallery Lightbox ──
function GalleryLB({photos,onClose}){const [cur,setCur]=useState(0);if(!photos||!photos.lengt
// ── Detail Modal (with Edit + Matching) ──
function Detail({plant,user,allPlants,onClose,onStartChat,onDelete,onStatusChange,onEdit,onOp
const [gal,setGal]=useState(false);
var mine=user&&plant.userId===user.uid,hasP=plant.photos&&plant.photos.length>0,dn=(plant.n
// Najdi matching protějšky (nabídka↔poptávka) podle normalizovaného názvu
var matches = useMemo(function(){
if(!allPlants) return [];
var target = normalizePlantName(plant.name);
if(!target || target.length < 3) return [];
var opposite = isDemand ? "offer" : "demand";
return allPlants.filter(function(p){
if(p.id === plant.id) return false;
if((p.type||"offer") !== opposite) return false;
if(p.status && p.status !== "active") return false;
var n = normalizePlantName(p.name);
return n && (n === target || n.includes(target) || target.includes(n));
}).slice(0,5);
},[plant.id,plant.name,isDemand,allPlants]);
return(<>
<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",
<div style={{background:C.card,borderRadius:"24px",maxWidth:"480px",width:"100%",maxHei
<div style={{height:"200px",position:"relative",borderRadius:"24px 24px 0 0",overflow
{hasP?<img src={plant.photos[0]} alt="" style={{width:"100%",height:"100%",objectFi
{hasP&&plant.photos.length>1&&<div style={{position:"absolute",bottom:"12px",right:
<button onClick={function(e){e.stopPropagation();onClose();}} style={{position:"abs
<button onClick={function(e){e.stopPropagation();onToggleFav(plant.id);}} style={{p
</div>
<div style={{padding:"24px"}}>
<div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap"}}>
{isDemand&&<span style={{background:C.accent,color:"white",padding:"4px 12px",bor
{!isDemand&&<span style={{background:(plant.color||C.primary)+"18",color:plant.co
{!isDemand&&<span style={{background:st.bg,color:st.color,padding:"4px 12px",bord
</div>
<h2 style={{margin:"0 0 2px",fontSize:"22px",fontWeight:"700",fontFamily:"'Playfair
{dn[1]&&<div style={{fontSize:"13px",color:C.muted,fontStyle:"italic",marginBottom:
<p style={{margin:"0 0 20px",fontSize:"14px",color:C.sub,lineHeight:"1.6"}}>{plant.
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"
<div style={{background:C.bg,padding:"14px",borderRadius:"12px"}}><div style={{fo
{plant.lookingFor&&(<div style={{background:C.primary+"08",padding:"14px",borderR
</div>
{/* Matching panel */}
{matches.length>0&&(
<div style={{background:"linear-gradient(135deg, "+C.primary+"08, "+C.accent+"10)
<div style={{fontSize:"12px",fontWeight:"700",color:C.primary,marginBottom:"10p
{isDemand?" Někdo nabízí":" Někdo hledá"}: {matches.length} {matches.leng
</div>
<div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
{matches.map(function(m){return(
<div key={m.id} onClick={function(){onOpenPlant&&onOpenPlant(m);}} style={{
<div style={{width:"32px",height:"32px",borderRadius:"8px",background:(m.
{m.photos&&m.photos[0]?<img src={m.photos[0]} alt="" style={{width:"100
</div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:"13px",fontWeight:"600",color:C.text,whiteSpace:"
<div style={{fontSize:"11px",color:C.muted,display:"flex",alignItems:"c
</div>
<div style={{fontSize:"18px",color:C.primary}}>›</div>
</div>);})}
</div>
</div>
)}
<div style={{background:"#f0f7ff",border:"1px solid #d0e3f5",borderRadius:"12px",pa
{mine?(
<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
{!isDemand&&(<div style={{display:"flex",gap:"6px"}}>{Object.entries(STATUSES).
<button onClick={function(){onEdit(plant);onClose();}} style={{padding:"12px",b
<button onClick={function(){onDelete(plant.id);onClose();}} style={{padding:"12
</div>
):(
<button onClick={function(){onStartChat(plant);onClose();}} style={{width:"100%",
)}
</div>
</div>
</div>
</>);
{gal&&<GalleryLB photos={plant.photos} onClose={function(){setGal(false);}} />}
}
// ── Add / Edit / Demand Form ──
function AddForm({user,profile,onClose,onAdd,onUpdate,mode,editPlant}){
var isDemand=mode==="demand";
var isEdit=!!editPlant;
const [f,setF]=useState(editPlant?{name:editPlant.name||"",category:editPlant.category||"Kv
const [photos,setPhotos]=useState(editPlant?editPlant.photos||[]:[]);
const [saving,setSaving]=useState(false);
const [error,setError]=useState("");
var ok=f.name.trim()&&f.description.trim()&&f.location.trim();
async function submit(){
if(!ok||saving)return;
setSaving(true);setError("");
try{
if(isEdit){
var upd={name:f.name.trim(),category:f.category,description:f.description.trim(),look
await updateDoc(doc(db,"plants",editPlant.id),upd);
onUpdate(Object.assign({},editPlant,upd));
}else{
var plantData={name:f.name.trim(),category:f.category,description:f.description.trim(
var docRef=await addDoc(collection(db,"plants"),plantData);
onAdd(Object.assign({},plantData,{id:docRef.id}));
}
onClose();
}catch(err){
console.error("Chyba ukládání:",err);
var msg = "Nepodařilo se uložit. ";
if(err && err.code){
if(err.code==="permission-denied") msg += "Chybí oprávnění (zkuste se odhlásit else if(err.code==="unavailable") msg += "Server není dostupný — zkontrolujte připoje
else if(err.code==="resource-exhausted") msg += "Příliš mnoho fotek nebo dat — a znov
zkuste
else msg += "("+err.code+")";
}else if(err && err.message){
msg += err.message;
}else{
msg += "Zkuste to znovu, případně bez fotek.";
}
setError(msg);
setSaving(false);
}
}
return(
<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",
<div style={{background:C.card,borderRadius:"24px",maxWidth:"480px",width:"100%",maxHei
<div style={{padding:"24px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marg
<h2 style={{margin:0,fontSize:"20px",fontWeight:"700",fontFamily:"'Playfair Displ
<button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:"50%
</div>
{!isDemand&&<div style={{marginBottom:"20px"}}><Photos photos={photos} onChange={se
<div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",f
<div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",f
{!isDemand&&(<div style={{marginBottom:"14px"}}><label style={{display:"block",font
<div style={{marginBottom:"14px"}}><label style={{display:"block",fontSize:"13px",f
{!isDemand&&(<div style={{marginBottom:"20px"}}><label style={{display:"block",font
{error&&(<div style={{marginBottom:"14px",padding:"12px 14px",background:C.danger+"
<button onClick={submit} disabled={!ok||saving} style={{width:"100%",padding:"14px"
</div>
</div>
</div>);
}
// ── Quick Demand Banner (pro přihlášené bez příspěvků) ──
function QuickDemandBanner({onCreateDemand,onCreateOffer,onDismiss}){
return(
<div style={{maxWidth:"960px",margin:"14px auto 0",padding:"0 20px"}}>
<div style={{background:"linear-gradient(135deg, "+C.accent+"15, "+C.primary+"10)",bord
<button onClick={onDismiss} style={{position:"absolute",top:"8px",right:"8px",backgro
<div style={{fontSize:"34px",flexShrink:0}}> </div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:"14px",fontWeight:"700",color:C.text,marginBottom:"4px"}}>Zač
<div style={{fontSize:"12.5px",color:C.sub,marginBottom:"10px",lineHeight:"1.4"}}>P
<div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
<button onClick={onCreateOffer} style={{background:C.primary,border:"none",border
<button onClick={onCreateDemand} style={{background:C.accent,border:"none",border
</div>
</div>
</div>
</div>);
}
// ── Chat View ──
function ChatView({chat,user,onBack,onMarkRead}){
const [msgs,setMsgs]=useState([]);const [text,setText]=useState("");const [ld,setLd]=useSta
useEffect(function(){document.documentElement.style.backgroundColor="#f4f7f5";document.body
useEffect(function(){var q2=query(collection(db,"messages"),where("chatId","==",chat.id),or
useEffect(function(){setTimeout(function(){if(btm.current)btm.current.scrollIntoView({behav
useEffect(function(){if(onMarkRead)onMarkRead(chat.id);},[chat.id]);
async function send(){if(!text.trim())return;var t=text.trim();setText("");await addDoc(col
function fmt(ts){var d=new Date(ts);return d.getHours()+":"+d.getMinutes().toString().padSt
return(<>
<div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:C
<div style={{position:"fixed",top:0,left:0,width:"100vw",zIndex:1000,display:"flex",flexD
<div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,display:"flex",alig
<div style={{flex:1,overflow:"auto",padding:"16px",display:"flex",flexDirection:"column
{ld&&<div style={{textAlign:"center",color:C.muted,padding:"32px"}}>Načítám...</div>}
{msgs.map(function(m){var mine=m.senderId===user.uid;return(<div key={m.id} style={{a
<div ref={btm} />
</div>
<div style={{padding:"8px 12px",paddingBottom:"calc(8px + env(safe-area-inset-bottom, 0
<input value={text} onChange={function(e){setText(e.target.value);}} placeholder="Nap
<button onClick={send} disabled={!text.trim()} style={{width:"40px",height:"40px",min
</div>
</div>
</>);
}
// ── Chat List ──
function ChatList({user,onOpen,onBack}){
const [chats,setChats]=useState([]);const [ld,setLd]=useState(true);
useEffect(function(){(async function(){var q2=query(collection(db,"chats"),where("participa
return(
<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:C.card,zIndex
<div style={{padding:"16px 20px",borderBottom:"1px solid "+C.border,display:"flex",alig
<div style={{flex:1,overflow:"auto"}}>
{ld&&<div style={{textAlign:"center",padding:"48px",color:C.muted}}>Načítám...</div>}
{!ld&&!chats.length&&<div style={{textAlign:"center",padding:"48px",color:C.muted}}><
{chats.map(function(ch){return(<div key={ch.id} onClick={function(){onOpen(ch);}} sty
</div>
</div>);
}
// ── Detekce FB / Instagram in-app browseru ──
function isInAppBrowser(){
if(typeof navigator==="undefined") return false;
var ua = navigator.userAgent || "";
// FB: FBAN/FBAV/FB_IAB, Instagram: Instagram, Messenger: Messenger
return /FBAN|FBAV|FB_IAB|FB4A|Instagram|Messenger/i.test(ua);
}
// ── Banner pro in-app browser ──
function InAppBrowserBanner(){
const [dismissed,setDismissed]=useState(function(){try{return sessionStorage.getItem("odkop
if(!isInAppBrowser()||dismissed) return null;
function dismiss(){setDismissed(true);try{sessionStorage.setItem("odkopni_iab_banner_dismis
return(
<div style={{background:"linear-gradient(135deg, #d45a5a, #c44a4a)",color:"white",padding
<div style={{maxWidth:"960px",margin:"0 auto",display:"flex",alignItems:"flex-start",ga
<div style={{fontSize:"22px",flexShrink:0,lineHeight:"1"}}> </div>
<div style={{flex:1}}>
<div style={{fontWeight:"700",marginBottom:"4px"}}>Otevřete v běžném prohlížeči</di
<div style={{opacity:0.95,fontSize:"12.5px"}}>Aktuálně jste ve vestavěném prohlížeč
</div>
<button onClick={dismiss} aria-label="Zavřít" style={{background:"rgba(255,255,255,0.
</div>
</div>);
}
// ── Recovery účtu — vyhledá starý profil a převede ho na aktuální session ──
function RecoverAccount({onBack,onDone,currentUser}){
// Pokud je uživatel přihlášen (Google/email-link), používáme jeho email a po potvrzení pro
// Pokud ne (přijetí z Welcome), email zadá uživatel a posíláme email-link.
const isLoggedIn = !!(currentUser && currentUser.email);
const [step,setStep]=useState(1); // 1=zadej údaje, 2=potvrď, 3=akce, 4=hotovo
const [name,setName]=useState("");
const [loc,setLoc]=useState("");
const [plant,setPlant]=useState("");
const [email,setEmail]=useState(isLoggedIn ? currentUser.email : "");
const [searching,setSearching]=useState(false);
const [sending,setSending]=useState(false);
const [migrating,setMigrating]=useState(false);
const [migProgress,setMigProgress]=useState({phase:"",done:0,total:0});
const [found,setFound]=useState(null); // {profile, profileId, plants, chats}
const [error,setError]=useState("");
function norm(s){return (s||"").trim().toLowerCase();}
async function searchProfile(){
if(!name.trim()||!loc.trim()||!plant.trim()||!email.trim()||searching) return;
if(!email.includes("@") || email.length<5){
setError("Zadejte prosím platný e-mail.");return;
}
setSearching(true);setError("");
try{
// Před čtením chatů musíme být přihlášení (chats read vyžadují request.auth != null).
// Krátkodobá anonymní session — bude zahozená až uživatel klikne v emailu v Chromu.
if(!auth.currentUser){
await signInAnonymously(auth);
}
// 1) Najít všechny profily s odpovídající přezdívkou (case-insensitive musíme udělat k
var profSnap = await getDocs(collection(db,"profiles"));
var candidates = [];
profSnap.docs.forEach(function(d){
var data = d.data();
if(norm(data.displayName) === norm(name) && norm(data.location) === norm(loc)){
candidates.push({id:d.id, data:data});
}
});
if(candidates.length === 0){
setError("Nenašli jsme profil s touto přezdívkou a městem. Zkontrolujte, že je setSearching(false); return;
zadává
}
// 2) Pro každého kandidáta zkontroluj, jestli má některý jeho inzerát zadaný název ros
var matchedProfile = null;
for(var i=0;i<candidates.length;i++){
var c = candidates[i];
// Bezpečnostní logika:
// - Pokud má profil již email, ten musí sedět (přísná shoda)
// - Pokud profil vytvořený PO amnestii (createdAt >= RECOVERY_AMNESTY_END) a nemá em
// odmítneme — taký profil by neměl existovat (validační kontrola)
if(c.data.email && c.data.email.trim()){
if(norm(c.data.email) !== norm(email)){
continue; // Tento kandidát se přeskočí — uživatel zadal jiný email, než má profi
}
}else if((c.data.createdAt||0) >= RECOVERY_AMNESTY_END){
// Profil je z období po amnestii a nemá email → neobvyklé, přeskočit
continue;
}
var plantQ = query(collection(db,"plants"),where("userId","==",c.id));
var plantSnap = await getDocs(plantQ);
var hasMatch = plantSnap.docs.some(function(pd){
var pname = (pd.data().name||"").toLowerCase();
return pname.includes(norm(plant));
});
if(hasMatch){
if(matchedProfile){
setError("Nalezli jsme více účtů odpovídajících těmto údajům. Pro bezpečnost nemů
setSearching(false); return;
}
matchedProfile = {id:c.id, data:c.data, plants:plantSnap.docs.map(function(d){retur
}
}
if(!matchedProfile){
// Zkontrolujeme, jestli problém byl jen v emailu, abychom dali jasnější chybu
var hadEmailMismatch = candidates.some(function(c){return c.data.email && c.data.emai
if(hadEmailMismatch){
setError("Profil s touto přezdívkou a městem má v profilu vyplněný jiný e-mail. Pok
}else{
setError("Údaje sice odpovídají profilu, ale neznáme inzerát na rostlinu, kterou js
}
setSearching(false); return;
}
// 3) Najít chaty, kde figuruje staré UID
var chatQ = query(collection(db,"chats"),where("participants","array-contains",matchedP
var chatSnap = await getDocs(chatQ);
matchedProfile.chats = chatSnap.docs.map(function(d){return {id:d.id, data:d.data()};})
setFound(matchedProfile);
setStep(2);
setSearching(false);
}catch(err){
console.error("Recovery search error:",err);
setError("Při hledání nastala chyba. Zkuste to prosím znovu, nebo nás kontaktujte.");
setSearching(false);
}
}
// Přímá migrace dat ze starého profilu na aktuálně přihlášený UID (pro Google/email-link u
async function performDirectMigration(){
if(!found || migrating || !currentUser) return;
setMigrating(true);setError("");
var oldUid = found.id;
var newUid = currentUser.uid;
if(oldUid === newUid){
setError("Tento účet je již váš aktuální. Není co převádět.");
setMigrating(false);
return;
}
try{
// 0) Označit starý profil příznakem recoveryTo, aby rules dovolily přepis plants/chats
setMigProgress({phase:"Připravuji",done:0,total:1});
await updateDoc(doc(db,"profiles",oldUid),{recoveryTo:newUid,recoveryAt:Date.now()});
// 1) Update všech plants
var totalPlants = found.plants.length;
setMigProgress({phase:"Převod inzerátů",done:0,total:totalPlants});
for(var i=0;i<found.plants.length;i++){
await updateDoc(doc(db,"plants",found.plants[i].id),{userId:newUid});
setMigProgress({phase:"Převod inzerátů",done:i+1,total:totalPlants});
}
// 2) Update chats — přepsat participants, lastSenderId, readBy
var totalChats = found.chats.length;
setMigProgress({phase:"Převod chatů",done:0,total:totalChats});
for(var j=0;j<found.chats.length;j++){
var ch = found.chats[j];
var newParticipants = (ch.data.participants||[]).map(function(p){return p===oldUid?ne
var newLastSenderId = ch.data.lastSenderId===oldUid ? newUid : ch.data.lastSenderId;
var newReadBy = (ch.data.readBy||[]).map(function(p){return p===oldUid?newUid:p;});
await updateDoc(doc(db,"chats",ch.id),{
participants:newParticipants,
lastSenderId:newLastSenderId,
readBy:newReadBy
});
setMigProgress({phase:"Převod chatů",done:j+1,total:totalChats});
}
// 3) Aktualizovat profil pod newUid — doplnit displayName/location ze starého, pokud c
setMigProgress({phase:"Aktualizace profilu",done:0,total:1});
var ownSnap = await getDoc(doc(db,"profiles",newUid));
var ownData = ownSnap.exists() ? ownSnap.data() : {};
var mergedProfile = {
displayName: (ownData.displayName && ownData.displayName.trim()) ? ownData.displayNam
location: (ownData.location && ownData.location.trim()) ? ownData.location : (found.d
email: ownData.email || currentUser.email || found.data.email || "",
createdAt: ownData.createdAt || found.data.createdAt || Date.now()
};
await setDoc(doc(db,"profiles",newUid), mergedProfile, {merge:true});
setMigProgress({phase:"Aktualizace profilu",done:1,total:1});
// 4) Log do recoveryLog
try{
await addDoc(collection(db,"recoveryLog"),{
oldUid:oldUid,
newUid:newUid,
method:"direct-migration",
email:currentUser.email||"",
displayName:found.data.displayName||"",
location:found.data.location||"",
plantsCount:totalPlants,
chatsCount:totalChats,
timestamp:Date.now(),
userAgent:(typeof navigator!=="undefined"?navigator.userAgent:"").slice(0,200)
});
}catch(e){console.warn("recoveryLog write failed",e);}
// 5) Smazat starý profil
try{await deleteDoc(doc(db,"profiles",oldUid));}catch(e){console.warn("delete old profi
// 6) Vymazat cache
try{
localStorage.removeItem("odkopni_plants_cache");
localStorage.removeItem("odkopni_profiles_cache");
}catch(e){}
setStep(4);
setMigrating(false);
}catch(err){
console.error("performDirectMigration error:",err);
var msg = "Při převodu nastala chyba. ";
if(err && err.code === "permission-denied") msg += "Nemáte oprávnění. Zkuste znovu, pří
else if(err && err.message) msg += err.message;
setError(msg);
setMigrating(false);
}
}
async function sendRecoveryEmail(){
if(!found || sending) return;
setSending(true);setError("");
var oldUid = found.id;
try{
// Pokud uživatel není přihlášený, musíme být — bez auth nelze zapisovat recoveryClaim
// Použijeme anonymní přihlášení — tahle session bude jen krátkodobá (uživatel pak klik
if(!auth.currentUser){
await signInAnonymously(auth);
}
// 1) Zapsat recoveryClaim do starého profilu — slouží jako "tato schránka má nárok"
// recoveryClaim obsahuje email + timestamp; po kliknutí v emailu app najde profil podl
await updateDoc(doc(db,"profiles",oldUid),{
recoveryClaim: email.trim().toLowerCase(),
recoveryClaimAt: Date.now()
});
// 2) Pošli email link
var actionCodeSettings = {
url: window.location.origin + "/?recover=1",
handleCodeInApp: true
};
await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
// 3) Ulož email do localStorage — když uživatel klikne v emailu na stejném zařízení/pr
// appka si email pamatuje. Když klikne jinde, zeptá se znovu.
try{
}catch(e){}
localStorage.setItem("odkopni_emailForSignIn", email.trim());
setStep(4);
setSending(false);
}catch(err){
console.error("sendRecoveryEmail error:",err);
var msg = "Nepodařilo se odeslat e-mail. ";
if(err && err.code === "auth/invalid-email") msg += "Zkontrolujte formát e-mailu.";
else if(err && err.code === "auth/missing-android-pkg-name" || err.code === "auth/missi
else if(err && err.message) msg += err.message;
setError(msg);
setSending(false);
}
}
return(
<div>
<InAppBrowserBanner />
<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center
<div style={{width:"100%",maxWidth:"420px"}}>
<button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",pad
{step===1 && (
<div style={{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 8px
<div style={{fontSize:"42px",textAlign:"center",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"22px",fontWeight:"700",fontFamily:"'Playfa
<p style={{margin:"0 0 20px",fontSize:"13px",color:C.sub,textAlign:"center",lineH
<div style={{marginBottom:"12px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,mar
<input value={name} onChange={function(e){setName(e.target.value);}} placeholde
</div>
<div style={{marginBottom:"12px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,mar
<input value={loc} onChange={function(e){setLoc(e.target.value);}} placeholder=
</div>
<div style={{marginBottom:"12px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,mar
<PlantAC value={plant} onChange={setPlant} placeholder="Stačí část názvu, např.
<div style={{fontSize:"11px",color:C.muted,marginTop:"6px",lineHeight:"1.4"}}>S
</div>
<div style={{marginBottom:"18px"}}>
{isLoggedIn ? (
<div style={{padding:"12px 14px",background:C.bg,borderRadius:"12px",fontSize
Přihlášeni jste jako <strong>{currentUser.email}</strong>. Po obnově se sem
</div>
) : (<>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,m
<input type="email" value={email} onChange={function(e){setEmail(e.target.val
<div style={{fontSize:"11px",color:C.muted,marginTop:"6px",lineHeight:"1.4"}}
</>)}
</div>
{error && (<div style={{marginBottom:"14px",padding:"12px 14px",background:C.dang
<button onClick={searchProfile} disabled={!name.trim()||!loc.trim()||!plant.trim(
</div>
)}
{step===2 && found && (
<div style={{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 8px
<div style={{fontSize:"42px",textAlign:"center",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 16px",fontSize:"22px",fontWeight:"700",fontFamily:"'Playf
<div style={{background:C.bg,borderRadius:"14px",padding:"16px",marginBottom:"16p
<div style={{fontSize:"13px",color:C.sub,marginBottom:"6px"}}>{isLoggedIn ? "Př
<div style={{fontSize:"18px",fontWeight:"700",color:C.text,marginBottom:"4px"}}
<div style={{fontSize:"13px",color:C.muted,display:"flex",alignItems:"center",g
<div style={{display:"flex",gap:"16px",paddingTop:"12px",borderTop:"1px solid "
<div><div style={{fontSize:"20px",fontWeight:"700",color:C.primary}}>{found.p
<div><div style={{fontSize:"20px",fontWeight:"700",color:C.primary}}>{found.c
</div>
</div>
{isLoggedIn ? (
) : (
<p style={{margin:"0 0 16px",fontSize:"13px",color:C.sub,lineHeight:"1.5"}}>Vaš
<p style={{margin:"0 0 16px",fontSize:"13px",color:C.sub,lineHeight:"1.5"}}>Po
)}
{error && (<div style={{marginBottom:"14px",padding:"12px 14px",background:C.dang
<div style={{display:"flex",gap:"8px"}}>
<button onClick={function(){setStep(1);setFound(null);setError("");}} style={{f
{isLoggedIn ? (
<button onClick={performDirectMigration} disabled={migrating} style={{flex:2,
) : (
<button onClick={sendRecoveryEmail} disabled={sending} style={{flex:2,padding
)}
</div>
</div>
)}
{migrating && (
<div style={{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 8px
<div style={{fontSize:"32px",marginBottom:"8px"}}> </div>
<div style={{fontSize:"13px",color:C.sub,marginBottom:"8px"}}>{migProgress.phase}
<div style={{background:C.bg,borderRadius:"8px",overflow:"hidden",height:"6px"}}>
<div style={{background:C.primary,height:"100%",width:(migProgress.total>0?(mig
</div>
</div>
)}
{step===4 && (
<div style={{background:"white",borderRadius:"20px",padding:"32px",boxShadow:"0 8px
{isLoggedIn ? (<>
<div style={{fontSize:"56px",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"22px",fontWeight:"700",fontFamily:"'Play
<p style={{margin:"0 0 20px",fontSize:"14px",color:C.sub,lineHeight:"1.5"}}>Vaš
<button onClick={onDone} style={{width:"100%",padding:"14px",border:"none",bord
</>) : (<>
<div style={{fontSize:"56px",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"22px",fontWeight:"700",fontFamily:"'Play
<p style={{margin:"0 0 14px",fontSize:"14px",color:C.sub,lineHeight:"1.5"}}>Pos
<div style={{background:"#fff8e8",border:"1px solid #f0d090",borderRadius:"12px
<strong> Tip:</strong> Pokud e-mail nepřišel během minuty, zkontrolujte slo
</div>
<button onClick={onBack} style={{width:"100%",padding:"14px",border:"2px </>)}
</div>
solid
)}
</div>
</div>
</div>);
}
// ── ProfileSetup — dokončení profilu po prvním přihlášení (Google/email link) ──
function ProfileSetup({user,initialProfile,onDone}){
const [name,setName]=useState((initialProfile&&initialProfile.displayName)||user.displayNam
const [loc,setLoc]=useState((initialProfile&&initialProfile.location)||"");
const [saving,setSaving]=useState(false);
const [error,setError]=useState("");
var ok = name.trim() && loc.trim();
async function save(){
if(!ok || saving) return;
setSaving(true);setError("");
try{
var data = {
displayName: name.trim(),
location: loc.trim(),
email: (initialProfile&&initialProfile.email) || user.email || "",
createdAt: (initialProfile&&initialProfile.createdAt) || Date.now()
};
await setDoc(doc(db,"profiles",user.uid), data, {merge:true});
if(onDone) onDone(data);
}catch(err){
console.error("ProfileSetup save error:",err);
setError("Nepodařilo se uložit profil. "+(err&&err.message?err.message:""));
setSaving(false);
}
}
return(
<div>
<InAppBrowserBanner />
<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center
<div style={{width:"100%",maxWidth:"380px",textAlign:"center"}}>
<div style={{fontSize:"52px",marginBottom:"8px"}}> </div>
<h1 style={{fontSize:"28px",fontWeight:"800",fontFamily:"'Playfair Display', Georgia,
<p style={{fontSize:"14px",color:C.sub,margin:"0 0 24px",lineHeight:"1.5"}}>Pověděli
<div style={{textAlign:"left",marginBottom:"14px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginB
<input value={name} onChange={function(e){setName(e.target.value);}} placeholder="P
</div>
<div style={{textAlign:"left",marginBottom:"20px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,marginB
<input value={loc} onChange={function(e){setLoc(e.target.value);}} placeholder="Měs
</div>
{error && (<div style={{marginBottom:"14px",padding:"12px 14px",background:C.danger+"
<button onClick={save} disabled={!ok||saving} style={{width:"100%",padding:"16px",bor
</div>
</div>
</div>);
}
function Welcome({onStartRecovery}){
const [mode,setMode]=useState("choose"); // "choose" | "email" | "emailSent"
const [email,setEmail]=useState("");
const [emailSending,setEmailSending]=useState(false);
const [googleLoading,setGoogleLoading]=useState(false);
const [error,setError]=useState("");
async function goGoogle(){
if(googleLoading) return;
setGoogleLoading(true);setError("");
try{
var result=await signInWithPopup(auth,googleProvider);
var uid=result.user.uid;
var existing = await getDoc(doc(db,"profiles",uid));
if(!existing.exists()){
// Vytvoř minimální profil — uživatel vyplní zbytek přes "Dokončete profil"
await setDoc(doc(db,"profiles",uid),{
displayName: result.user.displayName || "",
location: "",
email: result.user.email || "",
createdAt: Date.now()
});
}
// onAuthStateChanged si přebere zbytek
}catch(err){
console.error("Google sign-in chyba:",err);
if(err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-reque
setError("Přihlášení přes Google se nezdařilo. "+(err&&err.message?err.message:""));
}
setGoogleLoading(false);
}
}
async function sendEmailLink(){
if(!email.trim() || emailSending) return;
if(!email.includes("@") || email.length < 5){
setError("Zadejte prosím platný e-mail.");
return;
}
setEmailSending(true);setError("");
try{
var actionCodeSettings = {
url: window.location.origin + "/?login=1",
handleCodeInApp: true
};
await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
try{ localStorage.setItem("odkopni_emailForSignIn", email.trim()); }catch(e){}
setMode("emailSent");
}catch(err){
console.error("sendSignInLinkToEmail error:",err);
var msg = "Nepodařilo se odeslat e-mail. ";
if(err && err.code === "auth/invalid-email") msg += "Zkontrolujte formát e-mailu.";
else if(err && (err.code === "auth/missing-android-pkg-name" || err.code === "auth/miss
else if(err && err.message) msg += err.message;
setError(msg);
setEmailSending(false);
}
}
return(
<div>
<InAppBrowserBanner />
<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center
<div style={{width:"100%",maxWidth:"380px",textAlign:"center"}}>
<div style={{fontSize:"52px",marginBottom:"8px"}}> </div>
<h1 style={{fontSize:"36px",fontWeight:"800",fontFamily:"'Playfair Display', Georgia,
<p style={{fontSize:"15px",color:C.sub,margin:"0 0 28px",lineHeight:"1.5"}}>Vyměňte p
{mode==="choose" && (<>
<button onClick={goGoogle} disabled={googleLoading} style={{width:"100%",padding:"1
<I.Google s={20} /> {googleLoading?"Přihlašuji...":"Pokračovat přes Google"}
</button>
<div style={{display:"flex",alignItems:"center",gap:"10px",margin:"14px 0",color:C.
<div style={{flex:1,height:"1px",background:C.border}}></div>
<span>nemám Google účet</span>
<div style={{flex:1,height:"1px",background:C.border}}></div>
</div>
<button onClick={function(){setMode("email");setError("");}} style={{width:"100%",p
Pokračovat e-mailem
</button>
{error && (<div style={{marginTop:"14px",padding:"12px 14px",background:C.danger+"1
<p style={{fontSize:"11px",color:C.muted,marginTop:"20px",lineHeight:"1.5"}}>Váš úč
<div style={{marginTop:"24px",paddingTop:"20px",borderTop:"1px solid "+C.border}}>
<button onClick={onStartRecovery} style={{background:"none",border:"none",cursor:
Už jsem tu byl(a), ale nevidím své inzeráty →
</button>
<div style={{fontSize:"11px",color:C.muted,marginTop:"4px",lineHeight:"1.4"}}>Pom
</div>
</>)}
{mode==="email" && (<>
<div style={{textAlign:"left",marginBottom:"14px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,margi
<input type="email" value={email} onChange={function(e){setEmail(e.target.value);
<div style={{fontSize:"11px",color:C.muted,marginTop:"6px",lineHeight:"1.4"}}>Poš
</div>
{error && (<div style={{marginBottom:"14px",padding:"12px 14px",background:C.danger
<button onClick={sendEmailLink} disabled={!email.trim()||emailSending} style={{widt
<button onClick={function(){setMode("choose");setError("");}} style={{background:"n
</>)}
{mode==="emailSent" && (<>
<div style={{fontSize:"56px",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"20px",fontWeight:"700",color:C.text}}>E-mail
<p style={{margin:"0 0 14px",fontSize:"13px",color:C.sub,lineHeight:"1.5"}}>Poslali
<div style={{background:"#fff8e8",border:"1px solid #f0d090",borderRadius:"12px",pa
<strong> Tip:</strong> Pokud e-mail nepřišel během minuty, zkontrolujte složku
</div>
<button onClick={function(){setMode("choose");setEmail("");setError("");}} style={{
</>)}
</div>
</div>
</div>);
}
// ── Profile Editor (s Google linkováním a emailem) ──
function ProfileEdit({user,profile,onClose,onProfileUpdate,onStartRecovery}){
const [name,setName]=useState((profile&&profile.displayName)||"");
const [loc,setLoc]=useState((profile&&profile.location)||"");
const [email,setEmail]=useState((profile&&profile.email)||"");
const [linking,setLinking]=useState(false);
const [saving,setSaving]=useState(false);
var isAnonymous = user && user.isAnonymous;
var linkedGoogle = user && user.providerData && user.providerData.some(function(p){return p
async function save(){
if(!name.trim()||saving)return;
setSaving(true);
try{
var data={displayName:name.trim(),location:loc.trim(),email:email.trim()};
await setDoc(doc(db,"profiles",user.uid),data,{merge:true});
onProfileUpdate(data);
onClose();
}catch(err){
console.error("Chyba ukládání profilu:",err);
alert("Nepodařilo se uložit. "+(err&&err.message?err.message:""));
setSaving(false);
}
}
async function linkGoogle(){
if(linking) return;
setLinking(true);
try{
var result = await linkWithPopup(auth.currentUser, googleProvider);
// Pokud email v profilu ještě není a Google ho dal, doplň ho
if(!email.trim() && result.user.email){
setEmail(result.user.email);
se při
}
alert(" Účet úspěšně propojen s Google!\nVaše data jsou teď v bezpečí — můžete }catch(err){
console.error("Linking chyba:",err);
if(err.code==="auth/credential-already-in-use" || err.code==="auth/email-already-in-use
alert("Tento Google účet je už propojen s jiným profilem.");
}else if(err.code!=="auth/popup-closed-by-user" && err.code!=="auth/cancelled-popup-req
alert("Propojení se nezdařilo. "+(err&&err.message?err.message:""));
}
}
setLinking(false);
}
return(
<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",
<div style={{background:C.card,borderRadius:"24px",maxWidth:"400px",width:"100%",maxHei
<div style={{padding:"24px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marg
<h2 style={{margin:0,fontSize:"20px",fontWeight:"700",fontFamily:"'Playfair Displ
<button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:"50%
</div>
<div style={{marginBottom:"14px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,margi
<input value={name} onChange={function(e){setName(e.target.value);}} style={INPUT
</div>
<div style={{marginBottom:"14px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,margi
<input value={loc} onChange={function(e){setLoc(e.target.value);}} style={INPUT_S
</div>
<div style={{marginBottom:"20px"}}>
<label style={{display:"block",fontSize:"13px",fontWeight:"600",color:C.sub,margi
<input type="email" value={email} onChange={function(e){setEmail(e.target.value);
<div style={{fontSize:"11px",color:C.muted,marginTop:"6px",lineHeight:"1.4"}}>Pro
</div>
<button onClick={save} disabled={!name.trim()||saving} style={{width:"100%",padding
{/* Google linkování pro anonymní uživatele */}
{isAnonymous && !linkedGoogle && (
<div style={{marginTop:"16px",paddingTop:"16px",borderTop:"1px solid "+C.border}}
<div style={{fontSize:"12px",color:C.sub,marginBottom:"8px",lineHeight:"1.5"}}>
<strong>Tip:</strong> Propojte účet s Google, abyste o data nepřišli při v
</div>
<button onClick={linkGoogle} disabled={linking} style={{width:"100%",padding:"1
<I.Google s={16} /> {linking?"Propojuji...":"Propojit s Google účtem"}
</button>
</div>
)}
{linkedGoogle && (
<div style={{marginTop:"16px",paddingTop:"16px",borderTop:"1px solid "+C.border}}
<div style={{padding:"10px 14px",background:C.primary+"10",borderRadius:"10px",
<I.Google s={14} /> Účet propojen s Google ✓
</div>
</div>
)}
{/* Recovery cizího účtu — pro lidi kteří mají rozjeté inzeráty pod jiným (anonymní
<div style={{marginTop:"20px",paddingTop:"16px",borderTop:"1px solid "+C.border}}>
<div style={{fontSize:"12px",color:C.muted,marginBottom:"8px",lineHeight:"1.5"}}>
Máte staré inzeráty z anonymního účtu, které tady nevidíte? Obnovíme vám přístu
</div>
<button onClick={function(){onClose();if(onStartRecovery)onStartRecovery();}} sty
Obnovit staré inzeráty z jiného účtu
</button>
</div>
</div>
</div>
</div>);
}
// ============================================================
// MAIN APP
// ============================================================
export default function App(){
const [user,setUser]=useState(undefined);const [profile,setProfile]=useState(null);const [p
const [sel,setSel]=useState(null);const [showAdd,setShowAdd]=useState(false);const [addMode
const [editPlant,setEditPlant]=useState(null);
const [showChats,setShowChats]=useState(false);const [activeChat,setActiveChat]=useState(nu
const [showProfile,setShowProfile]=useState(false);const [search,setSearch]=useState("");
const [cat,setCat]=useState("Vše");const [view,setView]=useState("browse");const [sort,setS
const [typeFilter,setTypeFilter]=useState("all"); // "all" | "offer" | "demand"
const [cityFilter,setCityFilter]=useState("");
const [unreadCount,setUnreadCount]=useState(0);
const [allProfiles,setAllProfiles]=useState([]);
const [bannerDismissed,setBannerDismissed]=useState(function(){try{return localStorage.getI
const [favs,setFavs]=useState(function(){try{return JSON.parse(localStorage.getItem("odkopn
const [showRecovery,setShowRecovery]=useState(false);
const [proactiveMatch,setProactiveMatch]=useState(null); // {oldProfile, plants, chats} | n
const [proactiveChecking,setProactiveChecking]=useState(false);
const [proactiveDismissed,setProactiveDismissed]=useState(false);
const [proactiveMigrating,setProactiveMigrating]=useState(false);
const [proactiveProgress,setProactiveProgress]=useState({phase:"",done:0,total:0});
const [emailLinkState,setEmailLinkState]=useState(null); // null | "processing" | "needEmai
const [emailLinkProgress,setEmailLinkProgress]=useState({phase:"",done:0,total:0});
const [emailLinkEmailInput,setEmailLinkEmailInput]=useState("");
// ── Detekce příchodu z email-link auth ──
useEffect(function(){
if(typeof window === "undefined") return;
var href = window.location.href;
if(!isSignInWithEmailLink(auth, href)) return;
// Tohle je email link! Spustíme příhlášení.
var savedEmail = "";
try{ savedEmail = localStorage.getItem("odkopni_emailForSignIn") || ""; }catch(e){}
if(savedEmail){
processEmailLink(savedEmail, href);
}else{
// Email v localStorage neexistuje — uživatel klikl v jiném prohlížeči/zařízení.
// Zeptáme se znovu.
setEmailLinkState("needEmail");
}
},[]);
async function processEmailLink(emailValue, href){
setEmailLinkState("processing");
setEmailLinkProgress({phase:"Přihlašuji",done:0,total:1});
try{
var result = await signInWithEmailLink(auth, emailValue, href);
var newUid = result.user.uid;
var normalizedEmail = emailValue.trim().toLowerCase();
// Hned po přihlášení vyčistíme URL od auth parametrů, ať se to neopakovalo při refresh
try{
var cleanUrl = window.location.origin + window.location.pathname;
window.history.replaceState({}, document.title, cleanUrl);
}catch(e){}
// Vyčistit email z localStorage
try{ localStorage.removeItem("odkopni_emailForSignIn"); }catch(e){}
// Najít starý profil podle recoveryClaim == email
setEmailLinkProgress({phase:"Hledám profil",done:0,total:1});
var profSnap = await getDocs(collection(db,"profiles"));
var oldProfileDoc = null;
profSnap.docs.forEach(function(d){
var data = d.data();
if(data.recoveryClaim && data.recoveryClaim === normalizedEmail && d.id !== newUid){
// Můžeme najít víc takových; vezmeme nejnovější podle recoveryClaimAt
if(!oldProfileDoc || (data.recoveryClaimAt||0) > (oldProfileDoc.data.recoveryClaimA
oldProfileDoc = {id:d.id, data:data};
}
}
});
if(!oldProfileDoc){
// Žádný profil s tímto recoveryClaim → uživatel se právě poprvé přihlásil emailem be
// V téhle situaci necháme profil tak jak je (případně si ho dovytvoří přes ProfileEd
// Pokud profil pro newUid neexistuje, založíme prázdný se zadaným emailem.
var ownSnap = await getDoc(doc(db,"profiles",newUid));
if(!ownSnap.exists()){
await setDoc(doc(db,"profiles",newUid),{
displayName:"",
location:"",
email:emailValue,
createdAt:Date.now()
});
}
setEmailLinkState("done");
// Po krátké chvíli zavřeme overlay
setTimeout(function(){
setEmailLinkState(null);
window.location.reload();
}, 1200);
return;
}
// Bezpečnostní check — zkontrolovat, že recoveryClaim není starší než 24h
if(oldProfileDoc.data.recoveryClaimAt && (Date.now() - oldProfileDoc.data.recoveryClaim
setEmailLinkState({error:"Odkaz pro obnovení vypršel. Vraťte se a vyžádejte si nový."
return;
}
var oldUid = oldProfileDoc.id;
// Označit recoveryTo (aby rules dovolily přepis)
setEmailLinkProgress({phase:"Připravuji obnovení",done:0,total:1});
await updateDoc(doc(db,"profiles",oldUid),{recoveryTo:newUid,recoveryAt:Date.now()});
// Načíst plants a chats starého UID
var plantQ = query(collection(db,"plants"),where("userId","==",oldUid));
var plantSnap = await getDocs(plantQ);
var totalPlants = plantSnap.docs.length;
setEmailLinkProgress({phase:"Převod inzerátů",done:0,total:totalPlants});
for(var i=0;i<plantSnap.docs.length;i++){
await updateDoc(doc(db,"plants",plantSnap.docs[i].id),{userId:newUid});
setEmailLinkProgress({phase:"Převod inzerátů",done:i+1,total:totalPlants});
}
var chatQ = query(collection(db,"chats"),where("participants","array-contains",oldUid))
var chatSnap = await getDocs(chatQ);
var totalChats = chatSnap.docs.length;
setEmailLinkProgress({phase:"Převod chatů",done:0,total:totalChats});
for(var j=0;j<chatSnap.docs.length;j++){
var ch = chatSnap.docs[j];
var chData = ch.data();
var newParticipants = (chData.participants||[]).map(function(p){return p===oldUid?new
var newLastSenderId = chData.lastSenderId===oldUid ? newUid : chData.lastSenderId;
var newReadBy = (chData.readBy||[]).map(function(p){return p===oldUid?newUid:p;});
await updateDoc(doc(db,"chats",ch.id),{
participants:newParticipants,
lastSenderId:newLastSenderId,
readBy:newReadBy
});
setEmailLinkProgress({phase:"Převod chatů",done:j+1,total:totalChats});
}
// Vytvořit nový profil pro newUid
setEmailLinkProgress({phase:"Aktualizace profilu",done:0,total:1});
var newProfileData = {
displayName: oldProfileDoc.data.displayName || "",
location: oldProfileDoc.data.location || "",
email: emailValue,
createdAt: oldProfileDoc.data.createdAt || Date.now()
};
await setDoc(doc(db,"profiles",newUid), newProfileData, {merge:true});
// Log do recoveryLog
try{
await addDoc(collection(db,"recoveryLog"),{
oldUid:oldUid,
newUid:newUid,
email:emailValue,
displayName:oldProfileDoc.data.displayName||"",
location:oldProfileDoc.data.location||"",
plantsCount:totalPlants,
chatsCount:totalChats,
timestamp:Date.now(),
userAgent:(typeof navigator!=="undefined"?navigator.userAgent:"").slice(0,200)
});
}catch(e){console.warn("recoveryLog write failed",e);}
// Smazat starý profil
try{await deleteDoc(doc(db,"profiles",oldUid));}catch(e){console.warn("delete old profi
// Vymazat cache
try{
localStorage.removeItem("odkopni_plants_cache");
localStorage.removeItem("odkopni_profiles_cache");
}catch(e){}
setEmailLinkProgress({phase:"Hotovo",done:1,total:1});
setEmailLinkState("done");
// Po krátké chvíli reload
setTimeout(function(){
setEmailLinkState(null);
window.location.reload();
}, 1500);
}catch(err){
console.error("processEmailLink error:",err);
var msg = "Při přihlašování nastala chyba. ";
if(err && err.code === "auth/invalid-action-code") msg += "Odkaz je neplatný nebo už by
else if(err && err.code === "auth/expired-action-code") msg += "Odkaz vypršel. Vyžádejt
else if(err && err.code === "auth/invalid-email") msg += "Email neodpovídá tomu, na kte
else if(err && err.message) msg += err.message;
setEmailLinkState({error:msg});
}
}
useEffect(function(){var unsub=onAuthStateChanged(auth,async function(u){setUser(u);if(u){t
// ── Proactive match: po Google/email loginu hledat starý profil se stejným emailem
useEffect(function(){
if(!user || user.isAnonymous || !user.email) return;
if(proactiveChecking || proactiveMatch || proactiveDismissed) return;
// Spustit pouze pokud uživatel je zatím "nový" v naší databázi
// (nemá profil, nebo profil je prázdný — vznikl rovnou po Google loginu se zaplněním dis
var isFreshAccount = !profile || !profile.location || !profile.location.trim();
if(!isFreshAccount) return;
setProactiveChecking(true);
(async function(){
try{
var userEmailNorm = user.email.trim().toLowerCase();
var allProfSnap = await getDocs(collection(db,"profiles"));
var matches = [];
allProfSnap.docs.forEach(function(d){
if(d.id === user.uid) return; // vlastní profil přeskočit
var data = d.data();
if(data.email && data.email.trim().toLowerCase() === userEmailNorm){
matches.push({id:d.id, data:data});
}
});
if(matches.length === 0){
setProactiveChecking(false);
return;
}
if(matches.length > 1){
// Více shod — nejdeme automaticky, jen logujeme
console.warn("Více profilů se stejným emailem:", userEmailNorm);
setProactiveChecking(false);
return;
}
var m = matches[0];
// Načti plants a chats kandidáta
var plantQ = query(collection(db,"plants"),where("userId","==",m.id));
var plantSnap = await getDocs(plantQ);
var chatQ = query(collection(db,"chats"),where("participants","array-contains",m.id))
var chatSnap = await getDocs(chatQ);
setProactiveMatch({
id:m.id,
data:m.data,
plants:plantSnap.docs.map(function(d){return {id:d.id, data:d.data()};}),
chats:chatSnap.docs.map(function(d){return {id:d.id, data:d.data()};})
});
}catch(err){
console.warn("Proactive match check failed:",err);
}finally{
setProactiveChecking(false);
}
})();
},[user, profile, proactiveChecking, proactiveMatch, proactiveDismissed]);
// Migrace proaktivně nalezeného profilu
async function performProactiveMigration(){
if(!proactiveMatch || !user || proactiveMigrating) return;
setProactiveMigrating(true);
var oldUid = proactiveMatch.id;
var newUid = user.uid;
try{
setProactiveProgress({phase:"Připravuji",done:0,total:1});
await updateDoc(doc(db,"profiles",oldUid),{recoveryTo:newUid,recoveryAt:Date.now()});
var totalPlants = proactiveMatch.plants.length;
setProactiveProgress({phase:"Převod inzerátů",done:0,total:totalPlants});
for(var i=0;i<proactiveMatch.plants.length;i++){
await updateDoc(doc(db,"plants",proactiveMatch.plants[i].id),{userId:newUid});
setProactiveProgress({phase:"Převod inzerátů",done:i+1,total:totalPlants});
}
var totalChats = proactiveMatch.chats.length;
setProactiveProgress({phase:"Převod chatů",done:0,total:totalChats});
for(var j=0;j<proactiveMatch.chats.length;j++){
var ch = proactiveMatch.chats[j];
var newParticipants = (ch.data.participants||[]).map(function(p){return p===oldUid?ne
var newLastSenderId = ch.data.lastSenderId===oldUid ? newUid : ch.data.lastSenderId;
var newReadBy = (ch.data.readBy||[]).map(function(p){return p===oldUid?newUid:p;});
await updateDoc(doc(db,"chats",ch.id),{
participants:newParticipants,
lastSenderId:newLastSenderId,
readBy:newReadBy
});
setProactiveProgress({phase:"Převod chatů",done:j+1,total:totalChats});
}
// Update profilu — doplnit displayName/location pokud chybí
setProactiveProgress({phase:"Aktualizace profilu",done:0,total:1});
var ownSnap = await getDoc(doc(db,"profiles",newUid));
var ownData = ownSnap.exists() ? ownSnap.data() : {};
var mergedProfile = {
displayName: (ownData.displayName && ownData.displayName.trim()) ? ownData.displayNam
location: (ownData.location && ownData.location.trim()) ? ownData.location : (proacti
email: user.email || ownData.email || "",
createdAt: ownData.createdAt || proactiveMatch.data.createdAt || Date.now()
};
await setDoc(doc(db,"profiles",newUid), mergedProfile, {merge:true});
// Log
try{
await addDoc(collection(db,"recoveryLog"),{
oldUid:oldUid,
newUid:newUid,
method:"proactive-email-match",
email:user.email||"",
displayName:proactiveMatch.data.displayName||"",
location:proactiveMatch.data.location||"",
plantsCount:totalPlants,
chatsCount:totalChats,
timestamp:Date.now(),
userAgent:(typeof navigator!=="undefined"?navigator.userAgent:"").slice(0,200)
});
}catch(e){console.warn("recoveryLog write failed",e);}
try{await deleteDoc(doc(db,"profiles",oldUid));}catch(e){console.warn("delete old profi
try{
localStorage.removeItem("odkopni_plants_cache");
localStorage.removeItem("odkopni_profiles_cache");
}catch(e){}
setProactiveProgress({phase:"Hotovo",done:1,total:1});
setProactiveMatch(null);
setProactiveMigrating(false);
// Reload pro načtení nových dat
setTimeout(function(){window.location.reload();},800);
}catch(err){
console.error("Proactive migration error:",err);
alert("Při převodu nastala chyba: "+(err&&err.message?err.message:""));
setProactiveMigrating(false);
}
}
// ── Plants: cache 5 minut v localStorage, sníží Firestore čtení o ~90% ──
useEffect(function(){
(async function(){
try{
var CACHE_KEY="odkopni_plants_cache";
var CACHE_TTL=5*60*1000; // 5 minut
// Nejdřív zkus cache
try{
var cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
if(cached && cached.ts && (Date.now()-cached.ts)<CACHE_TTL && Array.isArray(cached.
setPlants(cached.data);
return; // máme čerstvou cache, žádné Firestore čtení
}
}catch(e){}
// Cache neexistuje nebo je stará → načti z Firestore
var q2=query(collection(db,"plants"),orderBy("createdAt","desc"));
var snap=await getDocs(q2);
var data=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
setPlants(data);
try{localStorage.setItem(CACHE_KEY,JSON.stringify({ts:Date.now(),data:data}));}catch(
}catch(e){}
})();
},[]);
// ── Profiles pro CommunityBar: cache 10 minut (HLAVNÍ ŽROUT! 300 čtení/návštěva → 30) ──
useEffect(function(){
(async function(){
try{
var CACHE_KEY="odkopni_profiles_cache";
var CACHE_TTL=10*60*1000; // 10 minut
try{
var cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
if(cached && cached.ts && (Date.now()-cached.ts)<CACHE_TTL && Array.isArray(cached.
setAllProfiles(cached.data);
return;
}
}catch(e){}
var snap=await getDocs(collection(db,"profiles"));
var data=snap.docs.map(function(d){return d.data();});
setAllProfiles(data);
try{localStorage.setItem(CACHE_KEY,JSON.stringify({ts:Date.now(),data:data}));}catch(
}catch(e){}
})();
},[]);
// ── Unread count: kontrola jednou za 60s (místo 15s) — 4× méně čtení ──
useEffect(function(){
if(!user)return;
async function checkUnread(){
try{
var q2=query(collection(db,"chats"),where("participants","array-contains",user.uid));
var snap=await getDocs(q2);
var count=0;
snap.docs.forEach(function(d){
var data=d.data();
var readBy=data.readBy||[];
if(data.lastSenderId&&data.lastSenderId!==user.uid&&!readBy.includes(user.uid))coun
});
setUnreadCount(count);
}catch(e){}
}
checkUnread();
var interval=setInterval(checkUnread,60000); // 60s místo 15s
return function(){clearInterval(interval);};
},[user]);
useEffect(function(){try{localStorage.setItem("odkopni_favs",JSON.stringify(favs));}catch(e
// Pomocná funkce — invaliduje plants cache po vlastní změně
function invalidatePlantsCache(){try{localStorage.removeItem("odkopni_plants_cache");}catch
function toggleFav(id){setFavs(function(f){return f.includes(id)?f.filter(function(x){retur
function addPlant(p){setPlants(function(prev){return[p].concat(prev);});invalidatePlantsCac
function updatePlant(p){setPlants(function(prev){return prev.map(function(x){return x.id===
async function delPlant(id){try{await deleteDoc(doc(db,"plants",id));setPlants(plants.filte
async function changeStatus(id,status){try{await updateDoc(doc(db,"plants",id),{status:stat
function startChat(plant){var ids=[user.uid,plant.userId].sort();setActiveChat({id:ids[0]+"
async function markRead(chatId){try{var chatRef=doc(db,"chats",chatId);var chatSnap=await g
function handleEdit(plant){setEditPlant(plant);setAddMode(plant.type==="demand"?"demand":"o
function dismissBanner(){setBannerDismissed(true);try{localStorage.setItem("odkopni_banner_
// Seznam měst z inzerátů s počty (řazeno od nejčetnějších)
var cityList = useMemo(function(){
var m = {};
plants.forEach(function(p){
var loc=(p.location||"").trim();
if(loc){
var key = loc.charAt(0).toUpperCase()+loc.slice(1).toLowerCase();
m[key] = (m[key]||0)+1;
}
});
},[plants]);
return Object.entries(m).map(function(e){return {name:e[0],count:e[1]};}).sort(function(a
var month=new Date().getMonth()+1,seasonalMsg=SEASONAL[month];
// Filtrování s typeFilter a cityFilter
var filtered=plants.filter(function(p){
var s=search.toLowerCase();
var ms=!s||(p.name&&p.name.toLowerCase().includes(s))||(p.description&&p.description.toLo
var mc=cat==="Vše"||p.category===cat;
var mv=view==="browse"?true:view==="my"?(user&&p.userId===user.uid):view==="favs"?favs.in
var mt=typeFilter==="all"?true:typeFilter==="demand"?p.type==="demand":(p.type||"offer")=
var mci=!cityFilter || ((p.location||"").toLowerCase().includes(cityFilter.toLowerCase())
return ms&&mc&&mv&&mt&&mci;
});
if(sort==="oldest")filtered=filtered.slice().reverse();
// Statistiky
var totalOffers = plants.filter(function(p){return (p.type||"offer")==="offer";}).length;
var totalDemands = plants.filter(function(p){return p.type==="demand";}).length;
// Má uživatel nějaký svůj příspěvek?
var hasMyPosts = user && plants.some(function(p){return p.userId===user.uid;});
if(user===undefined)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center
// Email link processing overlays
if(emailLinkState === "processing"){
return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"
<div style={{background:"white",borderRadius:"20px",padding:"32px",boxShadow:"0 8px 32p
<div style={{fontSize:"42px",marginBottom:"12px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"20px",fontWeight:"700",color:C.text,fontFamily
<p style={{margin:"0 0 16px",fontSize:"13px",color:C.sub}}>{emailLinkProgress.phase}{
<div style={{background:C.bg,borderRadius:"8px",overflow:"hidden",height:"6px"}}>
<div style={{background:C.primary,height:"100%",width:(emailLinkProgress.total>0?(e
</div>
<p style={{margin:"16px 0 0",fontSize:"11px",color:C.muted}}>Prosím nezavírejte tuto
</div>
</div>;
}
if(emailLinkState === "needEmail"){
return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"
<div style={{background:"white",borderRadius:"20px",padding:"32px",boxShadow:"0 8px 32p
<div style={{fontSize:"42px",marginBottom:"8px",textAlign:"center"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"20px",fontWeight:"700",color:C.text,fontFamily
<p style={{margin:"0 0 16px",fontSize:"13px",color:C.sub,textAlign:"center",lineHeigh
<input type="email" value={emailLinkEmailInput} onChange={function(e){setEmailLinkEma
<button onClick={function(){if(emailLinkEmailInput.trim()){processEmailLink(emailLink
</div>
</div>;
}
if(emailLinkState === "done"){
return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"
<div style={{background:"white",borderRadius:"20px",padding:"32px",boxShadow:"0 8px 32p
<div style={{fontSize:"56px",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"22px",fontWeight:"700",color:C.text,fontFamily
<p style={{margin:"0",fontSize:"14px",color:C.sub}}>Načítám vaše údaje…</p>
</div>
</div>;
}
if(emailLinkState && emailLinkState.error){
return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"
<div style={{background:"white",borderRadius:"20px",padding:"32px",boxShadow:"0 8px 32p
<div style={{fontSize:"42px",marginBottom:"8px",textAlign:"center"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"20px",fontWeight:"700",color:C.danger,fontFami
<p style={{margin:"0 0 16px",fontSize:"13px",color:C.sub,textAlign:"center",lineHeigh
<button onClick={function(){setEmailLinkState(null);try{var cleanUrl = window.locatio
</div>
</div>;
}
// Recovery má přednost před vším — i když uživatel není přihlášen
if(showRecovery)return <RecoverAccount onBack={function(){setShowRecovery(false);}} onDone=
if(!user)return <Welcome onStartRecovery={function(){setShowRecovery(true);}} />;
// Proactive match — pokud najde starý profil pod stejným emailem, nabídne automatický přev
if(proactiveMatch && !proactiveDismissed){
return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"
<div style={{width:"100%",maxWidth:"420px"}}>
<div style={{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 8px 3
<div style={{fontSize:"48px",textAlign:"center",marginBottom:"8px"}}> </div>
<h2 style={{margin:"0 0 8px",fontSize:"22px",fontWeight:"700",fontFamily:"'Playfair
<p style={{margin:"0 0 16px",fontSize:"13px",color:C.sub,textAlign:"center",lineHei
<div style={{background:C.bg,borderRadius:"14px",padding:"16px",marginBottom:"16px"
<div style={{fontSize:"18px",fontWeight:"700",color:C.text,marginBottom:"4px"}}>{
<div style={{fontSize:"13px",color:C.muted,display:"flex",alignItems:"center",gap
<div style={{display:"flex",gap:"16px",paddingTop:"12px",borderTop:"1px solid "+C
<div><div style={{fontSize:"20px",fontWeight:"700",color:C.primary}}>{proactive
<div><div style={{fontSize:"20px",fontWeight:"700",color:C.primary}}>{proactive
</div>
</div>
{proactiveMigrating ? (
<div style={{padding:"14px",background:C.bg,borderRadius:"12px",textAlign:"center
<div style={{fontSize:"13px",color:C.sub,marginBottom:"8px"}}>{proactiveProgres
<div style={{background:"white",borderRadius:"8px",overflow:"hidden",height:"6p
<div style={{background:C.primary,height:"100%",width:(proactiveProgress.tota
</div>
</div>
) : (
<div style={{display:"flex",gap:"8px"}}>
<button onClick={function(){setProactiveDismissed(true);setProactiveMatch(null)
<button onClick={performProactiveMigration} style={{flex:2,padding:"12px",borde
</div>
)}
</div>
</div>
</div>;
}
// Profil neexistuje vůbec, ale user je email/Google přihlášen → ukázat ProfileSetup
if(!profile && user && !user.isAnonymous)return <ProfileSetup user={user} onDone={function(
// Profil existuje ale chybí klíčová pole (displayName nebo location) → ProfileSetup
if(profile && user && !user.isAnonymous && (!profile.displayName || !profile.displayName.tr
return <ProfileSetup user={user} initialProfile={profile} onDone={function(p){setProfile(
}
if(!profile)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justif
if(activeChat)return <ChatView chat={activeChat} user={user} onBack={function(){setActiveCh
return(
<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans', 'Segoe UI', system-
<style>{"@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@60
<InAppBrowserBanner />
<header style={{padding:"10px 16px",background:"rgba(255,255,255,0.88)",backdropFilter:
<div style={{maxWidth:"960px",margin:"0 auto"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marg
<div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSiz
<div style={{display:"flex",alignItems:"center",gap:"4px"}}>
<button onClick={function(){setShowProfile(true);}} style={{background:"none",b
<button onClick={function(){setShowChats(true);}} style={{background:"none",bor
</div>
</div>
<div style={{display:"flex",gap:"8px"}}>
<button onClick={function(){setEditPlant(null);setAddMode("offer");setShowAdd(tru
<button onClick={function(){setEditPlant(null);setAddMode("demand");setShowAdd(tr
</div>
</div>
</header>
{seasonalMsg&&(<div style={{background:"linear-gradient(135deg, "+C.primary+"12, "+C.ac
{/* Community stats */}
<CommunityBar profiles={allProfiles} />
{/* QuickDemand banner — jen pro přihlášené bez příspěvků */}
{user && !hasMyPosts && !bannerDismissed && (
<QuickDemandBanner
onCreateDemand={function(){setEditPlant(null);setAddMode("demand");setShowAdd(true)
onCreateOffer={function(){setEditPlant(null);setAddMode("offer");setShowAdd(true);}
onDismiss={dismissBanner}
/>
)}
<div style={{maxWidth:"960px",margin:"0 auto",padding:"14px 20px 0"}}>
{/* Záložky Procházet/Moje/Oblíbené */}
<div style={{display:"flex",gap:"4px",marginBottom:"10px",background:"white",borderRa
{[{k:"browse",l:"Procházet",ico:I.Home},{k:"my",l:"Moje",ico:I.Leaf},{k:"favs",l:"O
</div>
{/* Toggle Nabídky/Poptávky */}
<div style={{display:"flex",gap:"6px",marginBottom:"12px",flexWrap:"wrap"}}>
{[
{k:"all",l:"Vše",bg:C.primary,count:plants.length},
{k:"offer",l:"Nabídky",bg:C.primary,count:totalOffers},
{k:"demand",l:"Poptávky",bg:C.accent,count:totalDemands}
].map(function(item){var active=typeFilter===item.k;return(
<button key={item.k} onClick={function(){setTypeFilter(item.k);}} style={{padding
{item.l}
<span style={{background:active?"rgba(255,255,255,0.25)":C.bg,color:active?"whi
</button>);})}
</div>
{/* Vyhledávání + Filtr lokality + Sort */}
<div style={{display:"flex",gap:"8px",marginBottom:"10px",flexWrap:"wrap"}}>
<div style={{position:"relative",flex:"1 1 200px",minWidth:"180px"}}>
<div style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%
<input value={search} onChange={function(e){setSearch(e.target.value);}} placehol
</div>
<button onClick={function(){setSort(function(s){return s==="newest"?"oldest":"newes
</div>
<div style={{marginBottom:"12px"}}>
<CityAC value={cityFilter} onChange={setCityFilter} cityList={cityList} placeholder
</div>
<div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px",marginBott
<div style={{display:"flex",gap:"12px",fontSize:"11px",color:C.muted,marginBottom:"14
</div>
<main style={{maxWidth:"960px",margin:"0 auto",padding:"0 20px 80px"}}>
{!filtered.length?(
<div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><I.Leaf s={44}
):(
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1f
)}
</main>
}
{sel&&<Detail plant={sel} user={user} allPlants={plants} onClose={function(){setSel(nul
{showAdd&&<AddForm user={user} profile={profile} onClose={function(){setShowAdd(false);
{showChats&&!activeChat&&<ChatList user={user} onOpen={setActiveChat} onBack={function(
{showProfile&&<ProfileEdit user={user} profile={profile} onClose={function(){setShowPro
</div>);
