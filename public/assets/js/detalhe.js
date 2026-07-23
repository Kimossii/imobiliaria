(function(){
"use strict";
var $=H4U.$;

function paramRef(){
  var p=new URLSearchParams(location.search);
  return p.get("ref");
}
var item=IMOVEIS.filter(function(i){return i.ref===paramRef();})[0];

var elConteudo=$("#dConteudo"),elNaoEncontrado=$("#dNaoEncontrado");

if(!item){
  if(elConteudo)elConteudo.hidden=true;
  if(elNaoEncontrado)elNaoEncontrado.hidden=false;
  H4U.initChrome();
  H4U.initReveal();
  return;
}

var elSemelhantes=$("#dSemelhantes");
H4U.ligarGrelha(elSemelhantes);

function renderPreco(){
  $("#dPreco").innerHTML=H4U.fmtPreco(item,H4U.Moeda.get());
}
function renderSemelhantes(){
  var outros=IMOVEIS.filter(function(i){return i.ref!==item.ref;});
  var mesmaZona=outros.filter(function(i){return i.zona===item.zona;});
  var resto=outros.filter(function(i){return i.zona!==item.zona;});
  var lista=mesmaZona.concat(resto).slice(0,3);
  if(!lista.length){$("#dSimilaresSec").hidden=true;return;}
  elSemelhantes.innerHTML=lista.map(function(i){return H4U.cartao(i,H4U.Moeda.get());}).join("");
}

/* ---------- conteúdo estático da ficha ---------- */
document.title=item.t+" — "+item.zona+" | House4Us";
var metaDesc=$("#metaDesc");
if(metaDesc)metaDesc.setAttribute("content",item.desc.length>155?item.desc.slice(0,152)+"…":item.desc);

var crumbZona=$("#dCrumbZona");
crumbZona.textContent=item.zona;
crumbZona.href="imoveis.html?zona="+encodeURIComponent(item.zona);

var hero=$("#dHeroImg");
if(item.foto){hero.src=item.foto;}
else{hero.closest(".dhero").innerHTML+='<svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"><use href="#'+item.cena+'"/></svg>';hero.hidden=true;}
hero.alt=item.t;

var badge=$("#dBadge");
badge.textContent=item.neg==="venda"?"Venda":"Arrendamento";
badge.className="pbadge"+(item.neg==="venda"?" pbadge--venda":"");

var heart=$("#dHeart");
heart.setAttribute("data-heart",item.ref);
heart.classList.toggle("saved",H4U.Guardados.tem(item.ref));
heart.addEventListener("click",function(){
  var activo=H4U.Guardados.alternar(item.ref);
  heart.classList.toggle("saved",activo);
  H4U.actualizaSavedBadge();
});

$("#dTitle").textContent=item.t;
$("#dZona").textContent=item.zona+" · "+item.sub;
renderPreco();
$("#dSpecs").innerHTML=H4U.specHtml(item);
$("#dDesc").textContent=item.desc;
$("#dExtras").innerHTML=item.extras.map(function(e){
  return '<li><svg aria-hidden="true"><use href="#ic-check"/></svg>'+e+"</li>";
}).join("");

$("#dZonaTexto").textContent="Localização aproximada — "+item.zona+" · "+item.sub+".";
var consulta=encodeURIComponent(item.zona+", "+item.sub+", Luanda, Angola");
$("#dMapaIframe").src="https://www.google.com/maps?q="+consulta+"&output=embed";
$("#dMapaLink").href="https://www.google.com/maps/search/?api=1&query="+consulta;

$("#dRef").textContent="Referência "+item.ref;
$("#dWa").href="https://wa.me/244922284999?text="+encodeURIComponent("Olá! Tenho interesse no imóvel "+item.ref+" — "+item.t+" ("+item.zona+"). Podem dar-me mais informações?");

var btnCopiar=$("#dCopiar");
if(btnCopiar){
  btnCopiar.addEventListener("click",function(){
    if(!navigator.clipboard||!navigator.clipboard.writeText)return;
    navigator.clipboard.writeText(location.href).then(function(){
      var original=btnCopiar.textContent;
      btnCopiar.textContent="Link copiado!";
      setTimeout(function(){btnCopiar.textContent=original;},2000);
    });
  });
}

renderSemelhantes();
H4U.initChrome(function(){renderPreco();renderSemelhantes();});
H4U.initReveal();
})();
