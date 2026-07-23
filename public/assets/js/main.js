(function(){
"use strict";
/* Câmbio indicativo apenas para demonstração: 1 EUR = 1.100 Kz */
var TAXA_EUR=1100;

/* Carteira de demonstração — dados fictícios do protótipo */
var IMOVEIS=[
{ref:"H4U-0101",t:"Vivenda V4 com piscina em condomínio",zona:"Talatona",sub:"Condomínio fechado",tip:"Vivenda",neg:"venda",preco:185000000,area:380,q:4,wc:4,cena:"sc-villa",faixa:"m",extras:["Piscina","Gerador","Furo de água","Segurança 24h","Cozinha equipada"],desc:"Vivenda moderna de dois pisos em condomínio fechado, com piscina privada, quintal e anexo. Acabamentos de primeira linha e processo documental completo."},
{ref:"H4U-0102",t:"Apartamento T3 com vista para a baía",zona:"Ingombota",sub:"Marginal de Luanda",tip:"T3",neg:"venda",preco:145000000,area:158,q:3,wc:3,cena:"sc-office",faixa:"m",extras:["Vista mar","Elevador","Estacionamento","Gerador do prédio"],desc:"T3 no coração da Baixa, com sala ampla virada para a baía, suite principal e duas vagas de garagem. Prédio com gerador e segurança 24 horas."},
{ref:"H4U-0103",t:"Moradia T3 em frente à praia",zona:"Ilha do Cabo",sub:"Primeira linha de mar",tip:"T3",neg:"arrendamento",preco:1800000,area:210,q:3,wc:2,cena:"sc-beach",faixa:"a",extras:["Vista mar","Mobilado","Ar condicionado","Esplanada"],desc:"Moradia mobilada em primeira linha, com esplanada sobre a areia e acesso directo à praia. Ideal para habitação ou representação de empresa."},
{ref:"H4U-0104",t:"Apartamento T2 renovado",zona:"Kilamba",sub:"Centralidade do Kilamba",tip:"T2",neg:"venda",preco:48000000,area:96,q:2,wc:1,cena:"sc-towers",faixa:"b",extras:["Cozinha equipada","Elevador","Renovado em 2025"],desc:"T2 totalmente renovado num dos blocos mais bem localizados da centralidade, perto de escolas e comércio. Pronto a habitar."},
{ref:"H4U-0105",t:"Vivenda V5 clássica com jardim",zona:"Miramar",sub:"Zona diplomática",tip:"Vivenda",neg:"venda",preco:320000000,area:520,q:5,wc:5,cena:"sc-miramar",faixa:"a",extras:["Jardim","Vista mar","Anexo independente","Garagem para 4 viaturas"],desc:"Vivenda de traça clássica numa das ruas mais procuradas do Miramar, com jardim consolidado, anexo independente e vista sobre a baía."},
{ref:"H4U-0106",t:"Apartamento T3 mobilado",zona:"Talatona",sub:"Zona Nova Vida",tip:"T3",neg:"arrendamento",preco:950000,area:142,q:3,wc:2,cena:"sc-apartment",faixa:"m",extras:["Mobilado","Piscina do condomínio","Ginásio"],desc:"T3 mobilado e decorado em condomínio com piscina, ginásio e segurança. Disponível de imediato, contrato mínimo de um ano."},
{ref:"H4U-0107",t:"Escritório open space no 4.º piso",zona:"Ingombota",sub:"Baixa de Luanda",tip:"Escritório",neg:"arrendamento",preco:2400000,area:180,q:0,wc:2,cena:"sc-office",faixa:"a",extras:["Gerador","Estacionamento","Elevador","Ar condicionado central"],desc:"Open space de 180 m² com luz natural em todo o piso, duas salas de reunião envidraçadas e copa. Edifício com gerador e estacionamento rotativo."},
{ref:"H4U-0108",t:"Terreno murado de 1.500 m²",zona:"Benfica",sub:"Junto à estrada principal",tip:"Terreno",neg:"venda",preco:55000000,area:1500,q:0,wc:0,cena:"sc-terreno",faixa:"b",extras:["Murado","Topografia plana","Água e energia na via"],desc:"Lote murado com frente de 30 metros para a via principal, topografia plana e infra-estruturas à porta. Documentação de superfície em ordem."},
{ref:"H4U-0109",t:"Apartamento T1 mobilado",zona:"Maianga",sub:"Perto do Largo da Maianga",tip:"T1",neg:"arrendamento",preco:380000,area:58,q:1,wc:1,cena:"sc-apartment",faixa:"b",extras:["Mobilado","Varanda","Portaria"],desc:"T1 funcional e mobilado, óptimo para um jovem profissional, a minutos do centro. Prédio com portaria e água garantida."}
];

var estado={neg:"venda",zona:"todas",faixa:"todas",cat:"todas",moeda:"kz",todos:false};
var guardados={},nGuardados=0,itemAberto=null;
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}

/* ---------- formatação ---------- */
function fmtKz(n){return n.toLocaleString("pt-PT").replace(/[\u00A0\u202F ]/g,".")}
function fmtPreco(i){
  if(estado.moeda==="eur"){
    var e=Math.round(i.preco/TAXA_EUR/100)*100;
    return "\u2248 "+fmtKz(e)+" \u20AC"+(i.neg==="arrendamento"?" <small>/m\u00EAs</small>":"");
  }
  return fmtKz(i.preco)+" <small>Kz"+(i.neg==="arrendamento"?"/m\u00EAs":"")+"</small>";
}

/* ---------- filtros ---------- */
function passaCat(i){
  switch(estado.cat){
    case "todas":return true;
    case "apt":return /^T\d/.test(i.tip);
    case "vivenda":return i.tip==="Vivenda";
    case "escritorio":return i.tip==="Escrit\u00F3rio";
    case "terreno":return i.tip==="Terreno";
    case "piscina":return i.extras.join("|").indexOf("Piscina")>-1;
    case "mar":return i.zona==="Ilha do Cabo"||i.zona==="Mussulo"||i.extras.indexOf("Vista mar")>-1;
    case "ate75":return i.neg==="venda"&&i.preco<=75000000;
    case "luxo":return i.neg==="venda"&&i.preco>=200000000;
  }
  return true;
}
function filtra(){
  return IMOVEIS.filter(function(i){
    return (estado.neg==="todos"||i.neg===estado.neg)
      &&(estado.zona==="todas"||i.zona===estado.zona)
      &&(estado.faixa==="todas"||i.faixa===estado.faixa)
      &&passaCat(i);
  });
}

/* ---------- cartões ---------- */
function specHtml(i){
  var s="";
  if(i.q)s+='<span><svg aria-hidden="true"><use href="#ic-bed"/></svg>'+i.q+"</span>";
  if(i.wc)s+='<span><svg aria-hidden="true"><use href="#ic-bath"/></svg>'+i.wc+"</span>";
  s+='<span><svg aria-hidden="true"><use href="#ic-area"/></svg>'+fmtKz(i.area)+" m\u00B2</span>";
  return s;
}
function cartao(i){
  var badge=i.neg==="venda"?'<span class="pbadge pbadge--venda">Venda</span>':'<span class="pbadge">Arrendamento</span>';
  var saved=guardados[i.ref]?" saved":"";
  return '<article class="pcard" data-ref="'+i.ref+'" tabindex="0" role="button" aria-label="Ver ficha: '+i.t+'">'
    +'<div class="pmedia"><svg aria-hidden="true"><use href="#'+i.cena+'"/></svg>'+badge
    +'<button class="pheart'+saved+'" data-heart="'+i.ref+'" aria-label="Guardar im\u00F3vel"><svg aria-hidden="true"><use href="#ic-heart"/></svg></button></div>'
    +'<div class="pbody"><div class="pprice">'+fmtPreco(i)+"</div>"
    +'<h3 class="ptitle">'+i.t+"</h3>"
    +'<p class="pplace"><svg aria-hidden="true"><use href="#ic-pin"/></svg>'+i.zona+" \u00B7 "+i.sub+"</p>"
    +'<div class="pspecs">'+specHtml(i)+'<span class="pref">'+i.ref+"</span></div></div></article>";
}
var grid=$("#pgrid"),btnMais=$("#btnMais");
function render(){
  var lista=filtra();
  var corte=estado.todos?lista:lista.slice(0,6);
  grid.innerHTML=corte.length?corte.map(cartao).join(""):'<p class="empty">Nenhum im\u00F3vel corresponde a estes filtros. Experimente alargar a zona ou o or\u00E7amento.</p>';
  if(lista.length>6&&!estado.todos){btnMais.hidden=false;btnMais.textContent="Mostrar todos os "+lista.length+" im\u00F3veis";}
  else{btnMais.hidden=true;}
}

/* ---------- sincronizadores ---------- */
var LBL={
  venda:["Qualquer valor","At\u00E9 75M Kz","75M \u2013 200M Kz","Acima de 200M Kz"],
  arrendamento:["Qualquer valor","At\u00E9 600 mil Kz/m\u00EAs","600 mil \u2013 1,5M Kz/m\u00EAs","Acima de 1,5M Kz/m\u00EAs"],
  todos:["Qualquer valor","Econ\u00F3mico","Interm\u00E9dio","Premium"]
};
function actualizaPrecoLabels(){
  var op=$("#fPreco").options,l=LBL[estado.neg]||LBL.todos,k;
  for(k=0;k<4;k++)op[k].textContent=l[k];
}
function setNeg(v){
  estado.neg=v;
  $$(".stab").forEach(function(t){t.setAttribute("aria-selected",String(t.getAttribute("data-negocio")===v));});
  $$(".chip[data-neg]").forEach(function(c){c.setAttribute("aria-pressed",String(c.getAttribute("data-neg")===v));});
  actualizaPrecoLabels();render();
}
function setCat(v,vindoDoSelect){
  estado.cat=(!vindoDoSelect&&estado.cat===v)?"todas":v;
  $$(".cat").forEach(function(c){c.setAttribute("aria-pressed",String(c.getAttribute("data-cat")===estado.cat));});
  var tipos={apt:1,vivenda:1,escritorio:1,terreno:1};
  $("#fTipo").value=tipos[estado.cat]?estado.cat:"todas";
  render();
}
function setZona(z){
  estado.zona=z;
  $("#fZona").value=z==="todas"?"todas":z;
  render();
}
function irPara(id){
  var el=document.getElementById(id);
  if(!el||!el.scrollIntoView)return;
  try{el.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){}
}

/* ---------- guardados ---------- */
function toggleGuardar(ref,btn){
  if(guardados[ref]){delete guardados[ref];nGuardados--;btn.classList.remove("saved");}
  else{guardados[ref]=true;nGuardados++;btn.classList.add("saved");}
  var b=$("#savedBadge");b.textContent=nGuardados;b.hidden=nGuardados===0;
}

/* ---------- modal ---------- */
var modal=$("#modal");
function abrirModal(ref){
  var i=IMOVEIS.filter(function(x){return x.ref===ref})[0];
  if(!i)return;
  itemAberto=i;
  $("#mScene use").setAttribute("href","#"+i.cena);
  var b=$("#mBadge");
  b.textContent=i.neg==="venda"?"Venda":"Arrendamento";
  b.className="pbadge"+(i.neg==="venda"?" pbadge--venda":"");
  $("#mTitle").textContent=i.t;
  $("#mZona").textContent=i.zona+" \u00B7 "+i.sub;
  $("#mPreco").innerHTML=fmtPreco(i);
  $("#mSpecs").innerHTML=specHtml(i);
  $("#mDesc").textContent=i.desc;
  $("#mExtras").innerHTML=i.extras.map(function(e){return "<span>"+e+"</span>"}).join("");
  $("#mRef").textContent="Refer\u00EAncia "+i.ref;
  $("#mWa").href="https://wa.me/244922284999?text="+encodeURIComponent("Ol\u00E1! Tenho interesse no im\u00F3vel "+i.ref+" \u2014 "+i.t+" ("+i.zona+"). Podem dar-me mais informa\u00E7\u00F5es?");
  modal.classList.add("aberto");
  document.body.classList.add("travado");
  var f=$("#mFechar");if(f&&f.focus)f.focus();
}
function fecharModal(){
  modal.classList.remove("aberto");
  document.body.classList.remove("travado");
  itemAberto=null;
}

/* ---------- menu móvel ---------- */
var mm=$("#mmenu");
function abrirMenu(){mm.classList.add("aberto");$("#btnMenu").setAttribute("aria-expanded","true");document.body.classList.add("travado");}
function fecharMenu(){mm.classList.remove("aberto");$("#btnMenu").setAttribute("aria-expanded","false");document.body.classList.remove("travado");}

/* ---------- ligações de eventos ---------- */
grid.addEventListener("click",function(ev){
  var alvo=ev.target;
  while(alvo&&alvo!==grid&&!alvo.getAttribute("data-heart")&&!alvo.classList.contains("pcard"))alvo=alvo.parentNode;
  if(!alvo||alvo===grid)return;
  if(alvo.getAttribute&&alvo.getAttribute("data-heart")){ev.stopPropagation();toggleGuardar(alvo.getAttribute("data-heart"),alvo);return;}
  if(alvo.classList.contains("pcard"))abrirModal(alvo.getAttribute("data-ref"));
});
grid.addEventListener("keydown",function(ev){
  if((ev.key==="Enter"||ev.key===" ")&&ev.target.classList&&ev.target.classList.contains("pcard")){
    ev.preventDefault();abrirModal(ev.target.getAttribute("data-ref"));
  }
});
$$(".stab").forEach(function(t){t.addEventListener("click",function(){setNeg(t.getAttribute("data-negocio"));});});
$$(".chip[data-neg]").forEach(function(c){c.addEventListener("click",function(){setNeg(c.getAttribute("data-neg"));});});
$$(".cat").forEach(function(c){c.addEventListener("click",function(){setCat(c.getAttribute("data-cat"),false);});});
$("#fTipo").addEventListener("change",function(){setCat(this.value==="todas"?"todas":this.value,true);});
$("#fZona").addEventListener("change",function(){estado.zona=this.value;render();});
$("#fPreco").addEventListener("change",function(){estado.faixa=this.value;render();});
$("#btnProcurar").addEventListener("click",function(){render();irPara("destaques");});
btnMais.addEventListener("click",function(){estado.todos=true;render();});
$$(".spop button").forEach(function(b){b.addEventListener("click",function(){setZona(b.getAttribute("data-zona"));irPara("destaques");});});
$$(".zcard").forEach(function(z){z.addEventListener("click",function(){setZona(z.getAttribute("data-zona"));irPara("destaques");});});
$$("[data-zona-link]").forEach(function(a){a.addEventListener("click",function(){setZona(a.getAttribute("data-zona-link"));});});
$$("[data-nav-neg]").forEach(function(a){a.addEventListener("click",function(){setNeg(a.getAttribute("data-nav-neg"));});});
$$(".moeda-btn").forEach(function(b){
  b.addEventListener("click",function(){
    estado.moeda=b.getAttribute("data-moeda");
    $$(".moeda-btn").forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});
    render();
    if(itemAberto)$("#mPreco").innerHTML=fmtPreco(itemAberto);
  });
});
$("#mFechar").addEventListener("click",fecharModal);
modal.addEventListener("click",function(ev){if(ev.target===modal)fecharModal();});
$("#btnMenu").addEventListener("click",abrirMenu);
$("#btnMenuFechar").addEventListener("click",fecharMenu);
mm.addEventListener("click",function(ev){if(ev.target===mm)fecharMenu();});
$$(".mmenu-panel a").forEach(function(a){a.addEventListener("click",fecharMenu);});
document.addEventListener("keydown",function(ev){
  if(ev.key==="Escape"){
    if(modal.classList.contains("aberto"))fecharModal();
    if(mm.classList.contains("aberto"))fecharMenu();
  }
});
var sh=$(".site-head");
window.addEventListener("scroll",function(){sh.classList.toggle("scrolled",window.scrollY>6);},{passive:true});

/* contagem de imóveis por zona */
$$("[data-zcount]").forEach(function(el){
  var z=el.getAttribute("data-zcount");
  var n=IMOVEIS.filter(function(i){return i.zona===z}).length;
  el.textContent=n===1?"1 im\u00F3vel em carteira":n+" im\u00F3veis em carteira";
});

/* revelação suave (com salvaguarda para ambientes sem IntersectionObserver) */
var revs=$$("[data-reveal]");
if("IntersectionObserver" in window){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-in");io.unobserve(e.target);}});
  },{threshold:.1});
  revs.forEach(function(el,i){el.style.transitionDelay=(i%3)*60+"ms";io.observe(el);});
}else{
  revs.forEach(function(el){el.classList.add("is-in");});
}

/* arranque */
actualizaPrecoLabels();
render();
})();
