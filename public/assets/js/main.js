(function(){
"use strict";
var $=H4U.$,$$=H4U.$$;

var estado={neg:"venda",zona:"todas",faixa:"todas",cat:"todas",todos:false};
var grid=$("#pgrid"),btnMais=$("#btnMais");
var modalApi=H4U.initModal();
H4U.ligarGrelha(grid,modalApi);
H4U.initChrome(function(){render();modalApi.refrescarPreco();});

/* ---------- filtros ---------- */
function passaCat(i){
  switch(estado.cat){
    case "todas":return true;
    case "apt":return /^T\d/.test(i.tip);
    case "vivenda":return i.tip==="Vivenda";
    case "escritorio":return i.tip==="Escritório";
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

/* ---------- ligação para a página de listagem completa ---------- */
function urlListagem(){
  var p=new URLSearchParams();
  if(estado.neg!=="todos")p.set("negocio",estado.neg);
  if(estado.zona!=="todas")p.set("zona",estado.zona);
  var qs=p.toString();
  return "imoveis.html"+(qs?"?"+qs:"");
}

/* ---------- render ---------- */
function render(){
  var lista=filtra();
  var corte=estado.todos?lista:lista.slice(0,6);
  var moeda=H4U.Moeda.get();
  grid.innerHTML=corte.length?corte.map(function(i){return H4U.cartao(i,moeda);}).join(""):'<p class="empty">Nenhum imóvel corresponde a estes filtros. Experimente alargar a zona ou o orçamento.</p>';
  if(btnMais){
    btnMais.href=urlListagem();
    if(lista.length>6){btnMais.hidden=false;btnMais.textContent="Ver todos os "+lista.length+" imóveis";}
    else{btnMais.hidden=true;}
  }
}

/* ---------- sincronizadores ---------- */
var LBL={
  venda:["Qualquer valor","Até 75M Kz","75M – 200M Kz","Acima de 200M Kz"],
  arrendamento:["Qualquer valor","Até 600 mil Kz/mês","600 mil – 1,5M Kz/mês","Acima de 1,5M Kz/mês"],
  todos:["Qualquer valor","Económico","Intermédio","Premium"]
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

/* ---------- ligações de eventos ---------- */
$$(".stab").forEach(function(t){t.addEventListener("click",function(){setNeg(t.getAttribute("data-negocio"));});});
$$(".chip[data-neg]").forEach(function(c){c.addEventListener("click",function(){setNeg(c.getAttribute("data-neg"));});});
$$(".cat").forEach(function(c){c.addEventListener("click",function(){setCat(c.getAttribute("data-cat"),false);});});
$("#fTipo").addEventListener("change",function(){setCat(this.value==="todas"?"todas":this.value,true);});
$("#fZona").addEventListener("change",function(){estado.zona=this.value;render();});
$("#fPreco").addEventListener("change",function(){estado.faixa=this.value;render();});
$("#btnProcurar").addEventListener("click",function(){render();irPara("destaques");});
$$(".spop button").forEach(function(b){b.addEventListener("click",function(){setZona(b.getAttribute("data-zona"));irPara("destaques");});});
$$(".zcard").forEach(function(z){z.addEventListener("click",function(){setZona(z.getAttribute("data-zona"));irPara("destaques");});});
$$("[data-zona-link]").forEach(function(a){a.addEventListener("click",function(){setZona(a.getAttribute("data-zona-link"));});});

/* contagem de imóveis por zona */
$$("[data-zcount]").forEach(function(el){
  var z=el.getAttribute("data-zcount");
  var n=IMOVEIS.filter(function(i){return i.zona===z}).length;
  el.textContent=n===1?"1 imóvel em carteira":n+" imóveis em carteira";
});

H4U.initReveal();

/* arranque */
actualizaPrecoLabels();
render();
})();
