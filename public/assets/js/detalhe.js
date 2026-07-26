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

/* ---------- galeria de fotos ---------- */
var pasta="assets/imagens/imoveis/"+item.ref+"/";
var imagens=item.foto?[item.foto].concat((item.galeria||[]).map(function(f){return pasta+f;})):[];

function renderGaleria(){
  var galeriaEl=$("#dGaleria");
  if(!imagens.length){
    galeriaEl.closest(".dgaleria-wrap").hidden=true;
    return;
  }
  var thumbs=imagens.slice(1,5);
  var restantes=imagens.length-5;
  galeriaEl.className="dgaleria dgaleria--t"+thumbs.length;
  var ONCARREGA='onload="this.classList.add(\'carregada\')" onerror="this.classList.add(\'carregada\')"';
  var html='<button type="button" class="dtile dprincipal" data-idx="0" aria-label="Ver foto 1 de '+imagens.length+'"><img src="'+imagens[0]+'" alt="'+item.t+'" loading="eager" '+ONCARREGA+'></button>';
  if(thumbs.length){
    html+='<div class="dgaleria-thumbs">';
    thumbs.forEach(function(src,i){
      var idx=i+1,ultima=i===thumbs.length-1;
      var overlay=(ultima&&restantes>0)?'<span class="dtile-mais">+'+restantes+' fotos</span>':"";
      html+='<button type="button" class="dtile dthumb" data-idx="'+idx+'" aria-label="Ver foto '+(idx+1)+' de '+imagens.length+'"><img src="'+src+'" alt="'+item.t+' — foto '+(idx+1)+'" loading="lazy" '+ONCARREGA+'>'+overlay+'</button>';
    });
    html+="</div>";
  }
  galeriaEl.innerHTML=html;
}
renderGaleria();
$("#dGaleria").addEventListener("click",function(ev){
  var tile=ev.target.closest("[data-idx]");
  if(!tile)return;
  abrirLightbox(parseInt(tile.getAttribute("data-idx"),10));
});

/* ---------- lightbox ---------- */
var lbIdx=0;
function atualizarLightbox(){
  var img=$("#dlbImg");
  img.classList.remove("carregada");
  var marcarCarregada=function(){img.classList.add("carregada");};
  img.onload=marcarCarregada;img.onerror=marcarCarregada;
  img.src=imagens[lbIdx];
  img.alt=item.t+" — foto "+(lbIdx+1);
  if(img.complete)marcarCarregada();
  $("#dlbConta").textContent=(lbIdx+1)+" / "+imagens.length;
}
function abrirLightbox(i){
  lbIdx=i;
  atualizarLightbox();
  $("#dLightbox").classList.add("aberto");
  document.body.classList.add("travado");
}
function fecharLightbox(){
  $("#dLightbox").classList.remove("aberto");
  document.body.classList.remove("travado");
}
function lbAnterior(){lbIdx=(lbIdx-1+imagens.length)%imagens.length;atualizarLightbox();}
function lbSeguinte(){lbIdx=(lbIdx+1)%imagens.length;atualizarLightbox();}
$("#dlbPrev").hidden=$("#dlbNext").hidden=imagens.length<=1;
$("#dlbFechar").addEventListener("click",fecharLightbox);
$("#dlbPrev").addEventListener("click",lbAnterior);
$("#dlbNext").addEventListener("click",lbSeguinte);
$("#dLightbox").addEventListener("click",function(ev){if(ev.target.id==="dLightbox")fecharLightbox();});
document.addEventListener("keydown",function(ev){
  if(!$("#dLightbox").classList.contains("aberto"))return;
  if(ev.key==="Escape")fecharLightbox();
  else if(ev.key==="ArrowLeft")lbAnterior();
  else if(ev.key==="ArrowRight")lbSeguinte();
});

/* ---------- tour 360° (só quando o imóvel tem sequência de fotogrametria) ---------- */
if(item.fotograma){
  (function(){
    var f=item.fotograma,pasta360=pasta+"fotograma/",frame=1;
    var btn=$("#d360Btn"),painel=$("#d360"),img=$("#d360Img"),dica=$("#d360Dica");
    function pad(n){return n<10?"00"+n:n<100?"0"+n:""+n;}
    function srcFrame(n){return pasta360+"frame-"+pad(n)+".jpg";}
    function atualizarFrame(){img.src=srcFrame(frame);}
    btn.hidden=false;
    btn.addEventListener("click",function(){
      frame=1;atualizarFrame();dica.classList.remove("escondida");
      painel.classList.add("aberto");
      document.body.classList.add("travado");
    });
    function fechar(){
      painel.classList.remove("aberto");
      document.body.classList.remove("travado");
    }
    $("#d360Fechar").addEventListener("click",fechar);
    painel.addEventListener("click",function(ev){if(ev.target===painel)fechar();});
    document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&painel.classList.contains("aberto"))fechar();});

    var arrastando=false,xInicial=0,frameInicial=1,PASSO=6;
    img.addEventListener("pointerdown",function(ev){
      arrastando=true;xInicial=ev.clientX;frameInicial=frame;
      dica.classList.add("escondida");
      img.setPointerCapture(ev.pointerId);
    });
    img.addEventListener("pointermove",function(ev){
      if(!arrastando)return;
      var deltaFrames=Math.round((ev.clientX-xInicial)/PASSO);
      var novo=((frameInicial-1+deltaFrames)%f.n+f.n)%f.n+1;
      if(novo!==frame){frame=novo;atualizarFrame();}
    });
    img.addEventListener("pointerup",function(){arrastando=false;});
    img.addEventListener("pointercancel",function(){arrastando=false;});
  })();
}

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
