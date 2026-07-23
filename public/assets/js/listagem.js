(function(){
"use strict";
var $=H4U.$,$$=H4U.$$;

var ZONAS=["Talatona","Ilha do Cabo","Kilamba","Miramar","Ingombota","Benfica","Maianga","Camama","Mussulo"];
var TIPOS=[
  {cod:"apt",label:"Apartamento",icone:"ic-build",teste:function(i){return /^T\d/.test(i.tip);}},
  {cod:"vivenda",label:"Vivenda",icone:"ic-house",teste:function(i){return i.tip==="Vivenda";}},
  {cod:"escritorio",label:"Escritório",icone:"ic-brief",teste:function(i){return i.tip==="Escritório";}},
  {cod:"terreno",label:"Terreno",icone:"ic-land",teste:function(i){return i.tip==="Terreno";}}
];
var EXTRAS=["Piscina","Vista mar","Mobilado","Gerador","Elevador","Estacionamento","Segurança 24h","Ar condicionado"];

function tipoPorCod(cod){return TIPOS.filter(function(t){return t.cod===cod;})[0];}
function toggleArray(arr,v){var p=arr.indexOf(v);if(p>-1)arr.splice(p,1);else arr.push(v);}

/* ---------- estado inicial a partir da URL (vindo da homepage) ---------- */
function estadoInicial(){
  var p=new URLSearchParams(location.search);
  var neg=p.get("negocio");
  var zona=p.get("zona");
  return {
    neg:(neg==="venda"||neg==="arrendamento")?neg:"todos",
    zonas:zona?[zona]:[],
    tipos:[],precoMin:null,precoMax:null,quartos:0,areaMin:null,extras:[],
    ordem:"relevancia"
  };
}
var estado=estadoInicial();

/* ---------- motor de filtragem ---------- */
function passa(i,ignorar){
  if(estado.neg!=="todos"&&i.neg!==estado.neg)return false;
  if(ignorar!=="zona"&&estado.zonas.length&&estado.zonas.indexOf(i.zona)===-1)return false;
  if(ignorar!=="tipo"&&estado.tipos.length&&!estado.tipos.some(function(cod){return tipoPorCod(cod).teste(i);}))return false;
  if(estado.precoMin!=null&&i.preco<estado.precoMin)return false;
  if(estado.precoMax!=null&&i.preco>estado.precoMax)return false;
  if(estado.quartos&&i.q<estado.quartos)return false;
  if(estado.areaMin!=null&&i.area<estado.areaMin)return false;
  if(ignorar!=="extras"&&estado.extras.length&&!estado.extras.every(function(ex){return i.extras.some(function(e){return e.indexOf(ex)>-1;});}))return false;
  return true;
}
function filtra(ignorar){return IMOVEIS.filter(function(i){return passa(i,ignorar);});}
function ordena(lista){
  var l=lista.slice();
  if(estado.ordem==="precoAsc")l.sort(function(a,b){return a.preco-b.preco;});
  else if(estado.ordem==="precoDesc")l.sort(function(a,b){return b.preco-a.preco;});
  else if(estado.ordem==="areaDesc")l.sort(function(a,b){return b.area-a.area;});
  return l;
}
function nFiltrosActivos(){
  var n=0;
  if(estado.neg!=="todos")n++;
  n+=estado.zonas.length+estado.tipos.length+estado.extras.length;
  if(estado.precoMin!=null)n++;
  if(estado.precoMax!=null)n++;
  if(estado.quartos)n++;
  if(estado.areaMin!=null)n++;
  return n;
}

/* ---------- elementos ---------- */
var elGrid=$("#resGrid"),elCount=$("#resCount"),elBadge=$("#filtrosBadge"),
    elToolbarLimpar=$("#toolbarLimpar"),elLimpar=$("#fLimpar");
var modalApi=H4U.initModal();
H4U.ligarGrelha(elGrid,modalApi);
elGrid.addEventListener("click",function(ev){
  if(ev.target.closest&&ev.target.closest("[data-limpar]"))limparFiltros();
});

/* ---------- render das secções da sidebar (com contagens dinâmicas) ---------- */
function renderNeg(){
  $$("#fNeg button").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-neg")===estado.neg));});
}
function renderZonas(){
  var base=filtra("zona");
  $("#fZonas").innerHTML=ZONAS.map(function(z){
    var n=base.filter(function(i){return i.zona===z;}).length;
    var marcado=estado.zonas.indexOf(z)>-1;
    return '<label class="fchk'+(n===0&&!marcado?" fchk--vazio":"")+'">'
      +'<input type="checkbox" data-zona="'+z+'"'+(marcado?" checked":"")+'>'
      +'<span>'+z+'</span><small>'+n+'</small></label>';
  }).join("");
}
function renderTipos(){
  var base=filtra("tipo");
  $("#fTipos").innerHTML=TIPOS.map(function(t){
    var n=base.filter(t.teste).length;
    var marcado=estado.tipos.indexOf(t.cod)>-1;
    return '<label class="fchk'+(n===0&&!marcado?" fchk--vazio":"")+'">'
      +'<input type="checkbox" data-tipo="'+t.cod+'"'+(marcado?" checked":"")+'>'
      +'<svg aria-hidden="true" class="fchk-ico"><use href="#'+t.icone+'"/></svg>'
      +'<span>'+t.label+'</span><small>'+n+'</small></label>';
  }).join("");
}
function renderExtras(){
  var base=filtra("extras");
  $("#fExtras").innerHTML=EXTRAS.map(function(ex){
    var n=base.filter(function(i){return i.extras.some(function(e){return e.indexOf(ex)>-1;});}).length;
    var marcado=estado.extras.indexOf(ex)>-1;
    return '<button type="button" class="fchip" data-extra="'+ex+'" aria-pressed="'+marcado+'">'+ex+' <small>'+n+'</small></button>';
  }).join("");
}
function renderQuartos(){
  $$("#fQuartos button").forEach(function(b){b.setAttribute("aria-pressed",String(Number(b.getAttribute("data-q"))===estado.quartos));});
}

/* ---------- render principal ---------- */
function render(){
  var lista=ordena(filtra());
  var moeda=H4U.Moeda.get();
  elGrid.innerHTML=lista.length
    ? lista.map(function(i){return H4U.cartao(i,moeda);}).join("")
    : '<div class="empty empty--acao"><p>Nenhum imóvel corresponde a estes filtros.</p><button type="button" class="btn btn--ghost" data-limpar>Limpar filtros</button></div>';
  elCount.textContent=lista.length+(lista.length===1?" imóvel encontrado":" imóveis encontrados");

  renderNeg();renderZonas();renderTipos();renderExtras();renderQuartos();

  var n=nFiltrosActivos();
  if(elBadge){elBadge.textContent=n;elBadge.hidden=n===0;}
  if(elToolbarLimpar)elToolbarLimpar.hidden=n===0;
  if(elLimpar)elLimpar.disabled=n===0;
}

function limparFiltros(){
  estado={neg:"todos",zonas:[],tipos:[],precoMin:null,precoMax:null,quartos:0,areaMin:null,extras:[],ordem:estado.ordem};
  $("#fPrecoMin").value="";$("#fPrecoMax").value="";$("#fAreaMin").value="";
  render();
}

/* ---------- ligações de eventos ---------- */
$("#fNeg").addEventListener("click",function(ev){
  var b=ev.target.closest?ev.target.closest("button[data-neg]"):null;
  if(!b)return;
  estado.neg=b.getAttribute("data-neg");
  render();
});
$("#fZonas").addEventListener("change",function(ev){
  if(ev.target.tagName!=="INPUT")return;
  toggleArray(estado.zonas,ev.target.getAttribute("data-zona"));
  render();
});
$("#fTipos").addEventListener("change",function(ev){
  if(ev.target.tagName!=="INPUT")return;
  toggleArray(estado.tipos,ev.target.getAttribute("data-tipo"));
  render();
});
$("#fExtras").addEventListener("click",function(ev){
  var b=ev.target.closest?ev.target.closest("button[data-extra]"):null;
  if(!b)return;
  toggleArray(estado.extras,b.getAttribute("data-extra"));
  render();
});
$("#fQuartos").addEventListener("click",function(ev){
  var b=ev.target.closest?ev.target.closest("button[data-q]"):null;
  if(!b)return;
  var v=Number(b.getAttribute("data-q"));
  estado.quartos=(estado.quartos===v)?0:v;
  render();
});
$("#fPrecoMin").addEventListener("change",function(){estado.precoMin=this.value?Number(this.value)*1000000:null;render();});
$("#fPrecoMax").addEventListener("change",function(){estado.precoMax=this.value?Number(this.value)*1000000:null;render();});
$("#fAreaMin").addEventListener("change",function(){estado.areaMin=this.value?Number(this.value):null;render();});
$("#fOrdem").addEventListener("change",function(){estado.ordem=this.value;render();});
elLimpar.addEventListener("click",limparFiltros);
if(elToolbarLimpar)elToolbarLimpar.addEventListener("click",limparFiltros);

/* ---------- painel de filtros em ecrã pequeno ---------- */
var sidebar=$("#fSidebar"),backdrop=$("#fBackdrop"),btnAbrir=$("#btnFiltros"),btnFechar=$("#fFechar");
function abrirPainel(){sidebar.classList.add("aberta");backdrop.classList.add("aberta");document.body.classList.add("travado");}
function fecharPainel(){sidebar.classList.remove("aberta");backdrop.classList.remove("aberta");document.body.classList.remove("travado");}
if(btnAbrir)btnAbrir.addEventListener("click",abrirPainel);
if(btnFechar)btnFechar.addEventListener("click",fecharPainel);
if(backdrop)backdrop.addEventListener("click",fecharPainel);
document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&sidebar&&sidebar.classList.contains("aberta"))fecharPainel();});

H4U.initChrome(function(){render();modalApi.refrescarPreco();});
H4U.initReveal();
render();
})();
