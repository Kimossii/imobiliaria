/* Utilitários partilhados entre todas as páginas: formatação, cartão de imóvel,
   modal de ficha, menu móvel, cabeçalho e persistência de moeda/favoritos. */
var H4U=(function(){
"use strict";
var TAXA_EUR=1100;

function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}

/* ---------- formatação ---------- */
function fmtKz(n){return n.toLocaleString("pt-PT").replace(/[   ]/g,".")}
function fmtPreco(i,moeda){
  if(moeda==="eur"){
    var e=Math.round(i.preco/TAXA_EUR/100)*100;
    return "≈ "+fmtKz(e)+" €"+(i.neg==="arrendamento"?" <small>/mês</small>":"");
  }
  return fmtKz(i.preco)+" <small>Kz"+(i.neg==="arrendamento"?"/mês":"")+"</small>";
}
function specHtml(i){
  var s="";
  if(i.q)s+='<span><svg aria-hidden="true"><use href="#ic-bed"/></svg>'+i.q+"</span>";
  if(i.wc)s+='<span><svg aria-hidden="true"><use href="#ic-bath"/></svg>'+i.wc+"</span>";
  s+='<span><svg aria-hidden="true"><use href="#ic-area"/></svg>'+fmtKz(i.area)+" m²</span>";
  return s;
}
function mediaHtml(i){
  return i.foto?'<img src="'+i.foto+'" alt="" loading="lazy">':'<svg aria-hidden="true"><use href="#'+i.cena+'"/></svg>';
}
function cartao(i,moeda){
  var badge=i.neg==="venda"?'<span class="pbadge pbadge--venda">Venda</span>':'<span class="pbadge">Arrendamento</span>';
  var saved=Guardados.tem(i.ref)?" saved":"";
  return '<a class="pcard" href="imovel.html?ref='+encodeURIComponent(i.ref)+'" data-ref="'+i.ref+'" aria-label="Ver ficha: '+i.t+'">'
    +'<div class="pmedia">'+mediaHtml(i)+badge
    +'<button class="pheart'+saved+'" data-heart="'+i.ref+'" aria-label="Guardar imóvel"><svg aria-hidden="true"><use href="#ic-heart"/></svg></button></div>'
    +'<div class="pbody"><div class="pprice">'+fmtPreco(i,moeda)+"</div>"
    +'<h3 class="ptitle">'+i.t+"</h3>"
    +'<p class="pplace"><svg aria-hidden="true"><use href="#ic-pin"/></svg>'+i.zona+" · "+i.sub+"</p>"
    +'<div class="pspecs">'+specHtml(i)+'<span class="pref">'+i.ref+"</span></div></div></a>";
}

/* ---------- favoritos, persistidos entre páginas ---------- */
var Guardados=(function(){
  var KEY="h4u_guardados",cache=null;
  function load(){
    if(cache)return cache;
    try{cache=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){cache={};}
    return cache;
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(cache));}catch(e){}}
  function tem(ref){return !!load()[ref];}
  function alternar(ref){
    load();
    if(cache[ref])delete cache[ref];else cache[ref]=true;
    save();
    return cache[ref]===true;
  }
  function total(){return Object.keys(load()).length;}
  return {tem:tem,alternar:alternar,total:total};
})();

/* ---------- moeda seleccionada, persistida entre páginas ---------- */
var Moeda=(function(){
  var KEY="h4u_moeda";
  function get(){try{return localStorage.getItem(KEY)||"kz";}catch(e){return "kz";}}
  function set(v){try{localStorage.setItem(KEY,v);}catch(e){}}
  return {get:get,set:set};
})();

function actualizaSavedBadge(){
  var b=$("#savedBadge");if(!b)return;
  var n=Guardados.total();
  b.textContent=n;b.hidden=n===0;
}

/* ---------- chrome partilhado: menu móvel, header ao scroll, moeda no topbar ---------- */
function initChrome(aoMudarMoeda){
  var mm=$("#mmenu");
  if(mm){
    var abrirMenu=function(){mm.classList.add("aberto");$("#btnMenu").setAttribute("aria-expanded","true");document.body.classList.add("travado");};
    var fecharMenu=function(){mm.classList.remove("aberto");$("#btnMenu").setAttribute("aria-expanded","false");document.body.classList.remove("travado");};
    $("#btnMenu").addEventListener("click",abrirMenu);
    $("#btnMenuFechar").addEventListener("click",fecharMenu);
    mm.addEventListener("click",function(ev){if(ev.target===mm)fecharMenu();});
    $$(".mmenu-panel a").forEach(function(a){a.addEventListener("click",fecharMenu);});
    document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&mm.classList.contains("aberto"))fecharMenu();});
  }
  var sh=$(".site-head");
  if(sh)window.addEventListener("scroll",function(){sh.classList.toggle("scrolled",window.scrollY>6);},{passive:true});

  var moedaAtual=Moeda.get();
  $$(".moeda-btn").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-moeda")===moedaAtual));});
  $$(".moeda-btn").forEach(function(b){
    b.addEventListener("click",function(){
      Moeda.set(b.getAttribute("data-moeda"));
      $$(".moeda-btn").forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});
      if(aoMudarMoeda)aoMudarMoeda(Moeda.get());
    });
  });
  actualizaSavedBadge();
}

/* ---------- modal de vista rápida (só usada em index.html) ---------- */
function initModal(){
  var modal=$("#modal");
  if(!modal)return {abrir:function(){},fechar:function(){},refrescarPreco:function(){}};
  var itemAberto=null;
  function abrir(i){
    if(!i)return;
    itemAberto=i;
    var mFoto=$("#mFoto"),mScene=$("#mScene");
    if(i.foto){mFoto.src=i.foto;mFoto.hidden=false;mScene.style.display="none";}
    else{mScene.querySelector("use").setAttribute("href","#"+i.cena);mScene.style.display="";mFoto.hidden=true;}
    var b=$("#mBadge");
    b.textContent=i.neg==="venda"?"Venda":"Arrendamento";
    b.className="pbadge"+(i.neg==="venda"?" pbadge--venda":"");
    $("#mTitle").textContent=i.t;
    $("#mZona").textContent=i.zona+" · "+i.sub;
    $("#mPreco").innerHTML=fmtPreco(i,Moeda.get());
    $("#mSpecs").innerHTML=specHtml(i);
    $("#mDesc").textContent=i.desc;
    $("#mExtras").innerHTML=i.extras.map(function(e){return "<span>"+e+"</span>"}).join("");
    $("#mRef").textContent="Referência "+i.ref;
    $("#mWa").href="https://wa.me/244922284999?text="+encodeURIComponent("Olá! Tenho interesse no imóvel "+i.ref+" — "+i.t+" ("+i.zona+"). Podem dar-me mais informações?");
    modal.classList.add("aberto");
    document.body.classList.add("travado");
    var f=$("#mFechar");if(f&&f.focus)f.focus();
  }
  function fechar(){
    modal.classList.remove("aberto");
    document.body.classList.remove("travado");
    itemAberto=null;
  }
  $("#mFechar").addEventListener("click",fechar);
  modal.addEventListener("click",function(ev){if(ev.target===modal)fechar();});
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&modal.classList.contains("aberto"))fechar();});
  return {abrir:abrir,fechar:fechar,refrescarPreco:function(){if(itemAberto)$("#mPreco").innerHTML=fmtPreco(itemAberto,Moeda.get());}};
}

/* ---------- liga cliques da grelha: guardar favorito + (opcional) vista rápida ---------- */
/* os cartões são links reais para imovel.html — funcionam sem JS, com "abrir em
   nova aba", etc. Se for passado modalApi, um clique normal (botão esquerdo,
   sem Ctrl/Cmd/Shift) abre a vista rápida em vez de navegar; Ctrl/Cmd-clique
   continua a abrir a ficha completa numa nova aba. */
function ligarGrelha(grid,modalApi){
  grid.addEventListener("click",function(ev){
    var coracao=ev.target.closest&&ev.target.closest("[data-heart]");
    if(coracao&&grid.contains(coracao)){
      ev.preventDefault();
      ev.stopPropagation();
      var ref=coracao.getAttribute("data-heart");
      var activo=Guardados.alternar(ref);
      coracao.classList.toggle("saved",activo);
      actualizaSavedBadge();
      return;
    }
    if(!modalApi)return;
    var cartaoEl=ev.target.closest&&ev.target.closest(".pcard");
    if(!cartaoEl||!grid.contains(cartaoEl))return;
    if(ev.button!==0||ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey)return;
    ev.preventDefault();
    var item=IMOVEIS.filter(function(x){return x.ref===cartaoEl.getAttribute("data-ref");})[0];
    modalApi.abrir(item);
  });
}

/* ---------- revelação suave ao scroll ---------- */
function initReveal(){
  var revs=$$("[data-reveal]");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-in");io.unobserve(e.target);}});
    },{threshold:.1});
    revs.forEach(function(el,i){el.style.transitionDelay=(i%3)*60+"ms";io.observe(el);});
  }else{
    revs.forEach(function(el){el.classList.add("is-in");});
  }
}

return {
  TAXA_EUR:TAXA_EUR,$:$,$$:$$,
  fmtKz:fmtKz,fmtPreco:fmtPreco,specHtml:specHtml,mediaHtml:mediaHtml,cartao:cartao,
  Guardados:Guardados,Moeda:Moeda,actualizaSavedBadge:actualizaSavedBadge,
  initChrome:initChrome,initModal:initModal,ligarGrelha:ligarGrelha,initReveal:initReveal
};
})();
