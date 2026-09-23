"use strict";
const make = (tag, text, className) => {const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const prettyDate=value=>new Date(`${value}T12:00:00`).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"});
function renderBody(body,container){for(const block of body.split(/\n\s*\n/)){if(!block.trim())continue;container.append(make(block.startsWith("## ")?"h2":block.startsWith("> ")?"blockquote":"p",block.replace(/^(## |> )/,"")));}}
const FIREBASE_CONFIG={apiKey:"AIzaSyBSjxied2PuBAYJFCSsCSfP2czlooBqbfI",authDomain:"haitish-blog-comments.firebaseapp.com",projectId:"haitish-blog-comments",storageBucket:"haitish-blog-comments.firebasestorage.app",messagingSenderId:"256826604408",appId:"1:256826604408:web:e634efafea7a803f63268d"};
let firestoreReady=null;
function loadFirestore(){
  if(!firestoreReady)firestoreReady=Promise.all([
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js")
  ]).then(([appMod,fs])=>{const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(FIREBASE_CONFIG);return{fs,db:fs.getFirestore(app)};});
  return firestoreReady;
}
async function listComments(postId){
  const{fs,db}=await loadFirestore();
  const snap=await fs.getDocs(fs.query(fs.collection(db,"comments"),fs.where("postId","==",postId)));
  return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt?.toMillis()||0)-(b.createdAt?.toMillis()||0));
}
async function submitComment(postId,body,name,email){
  const{fs,db}=await loadFirestore();
  const ref=fs.doc(fs.collection(db,"comments"));
  const batch=fs.writeBatch(db);
  batch.set(ref,{postId,body,createdAt:fs.serverTimestamp()});
  if(name.trim()||email.trim())batch.set(fs.doc(db,"commentAuthors",ref.id),{name:name.trim(),email:email.trim()});
  await batch.commit();
}
function commentWhen(c){return c.createdAt&&c.createdAt.toMillis?new Date(c.createdAt.toMillis()).toLocaleString("en",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"Just now";}
function renderComments(list,comments){
  list.replaceChildren();
  if(!comments.length){list.append(make("p","No comments yet. Be the first to leave one.","comments-empty"));return;}
  for(const c of comments){const row=make("div",undefined,"comment-row");row.append(make("span",`Anonymous / ${commentWhen(c)}`,"micro"),make("p",c.body));list.append(row);}
}
async function loadJournal(){
  const list=document.querySelector("#post-list"),story=document.querySelector("#story");if(!list&&!story)return;
  try{
    const response=await fetch("content/posts.json",{cache:"no-cache"});if(!response.ok)throw new Error("Journal unavailable");
    const posts=await response.json();posts.sort((a,b)=>b.date.localeCompare(a.date));
    if(list){const render=()=>{const query=document.querySelector("#post-search").value.trim().toLowerCase();const results=posts.filter(p=>`${p.title} ${p.excerpt} ${p.body}`.toLowerCase().includes(query));list.replaceChildren();if(!results.length){const empty=make("div",undefined,"empty");empty.append(make("h3",query?"No notes found.":"A new page, quite literally."),make("p",query?"Try another word or clear your search.":"This journal is just getting started. I'll be sharing stories and small discoveries here soon."));list.append(empty);}for(const post of results){const row=make("a",undefined,"post-row");row.href=`story.html?post=${encodeURIComponent(post.id)}`;const copy=make("div");copy.append(make("h3",post.title),make("p",post.excerpt));row.append(make("span",prettyDate(post.date),"micro"),copy,make("span","\u2197"));list.append(row);}};document.querySelector("#post-search").addEventListener("input",render);render();}
    if(story){const post=posts.find(p=>p.id===new URLSearchParams(location.search).get("post"));story.replaceChildren();if(!post){story.append(make("h1","This note isn't here."),make("p","It may have moved or hasn't been published yet."));return;}document.title=`${post.title} | Haitish Puran`;const body=make("div",undefined,"story-body");renderBody(post.body,body);if(post.image){const figure=document.createElement("figure");figure.className="story-cover";const img=document.createElement("img");img.src=post.image;img.alt="";img.loading="eager";figure.append(img);story.append(figure);}story.append(make("p",`${prettyDate(post.date)} / ${Math.max(1,Math.ceil(post.body.split(/\s+/).length/220))} MIN READ`,"micro"),make("h1",post.title),make("p",post.excerpt),body);document.querySelector("#conversation").hidden=false;
      const commentsList=document.querySelector("#comments-list");
      if(commentsList){commentsList.replaceChildren(make("p","Loading comments...","comments-empty"));listComments(post.id).then(comments=>renderComments(commentsList,comments)).catch(()=>commentsList.replaceChildren(make("p","Comments couldn't load. Please refresh in a moment.","comments-empty")));}
      const reactions=make("div",undefined,"reading-tools");
      reactions.setAttribute("role","group");reactions.setAttribute("aria-label","Your reaction");
      const reactionKey=`haitish-reaction-${post.id}`;
      let selected="";try{selected=localStorage.getItem(reactionKey)||"";}catch{}
      for(const label of ["Resonated","Made me think"]){const button=make("button",label);button.type="button";button.setAttribute("aria-pressed",String(selected===label));button.addEventListener("click",()=>{selected=selected===label?"":label;try{localStorage.setItem(reactionKey,selected);for(const item of reactions.children)item.setAttribute("aria-pressed",String(item.textContent===selected));}catch{document.querySelector("#tool-status").textContent="This browser couldn't save your reaction.";}});reactions.append(button);}
      document.querySelector("#conversation").prepend(reactions,make("p","Reactions are saved on this device only for now.","small"));
      const save=document.querySelector("#save-note"),status=document.querySelector("#tool-status"),key=`haitish-saved-${post.id}`;const setSaved=value=>{save.setAttribute("aria-pressed",String(value));save.textContent=value?"Note saved":"Save this note";};try{setSaved(localStorage.getItem(key)==="true");}catch{}
      save.addEventListener("click",()=>{try{const value=save.getAttribute("aria-pressed")!=="true";localStorage.setItem(key,String(value));setSaved(value);}catch{status.textContent="This browser couldn't save the note.";}});
      document.querySelector("#share-note").addEventListener("click",async()=>{try{if(navigator.share)await navigator.share({title:post.title,url:location.href});else{await navigator.clipboard.writeText(location.href);status.textContent="Link copied.";}}catch(e){if(e.name!=="AbortError")status.textContent="Copy the page address to share this note.";}});
      document.querySelector("#reply-form").addEventListener("submit",async event=>{
        event.preventDefault();
        const replyField=document.querySelector("#reply"),reply=replyField.value.trim(),replyStatus=document.querySelector("#reply-status"),submitBtn=event.target.querySelector("button[type=submit]");
        if(!reply)return;
        const name=document.querySelector("#reply-name").value,email=document.querySelector("#reply-email").value;
        submitBtn.disabled=true;replyStatus.textContent="Posting...";
        try{
          await submitComment(post.id,reply,name,email);
          replyField.value="";document.querySelector("#reply-name").value="";document.querySelector("#reply-email").value="";
          replyStatus.textContent="Posted. Thanks for reading.";
          if(commentsList)renderComments(commentsList,await listComments(post.id));
        }catch{replyStatus.textContent="Couldn't post your comment. Please try again in a moment.";}
        finally{submitBtn.disabled=false;}
      });
    }
  }catch{(list||story).replaceChildren(make("p","The journal couldn't load. Please refresh in a moment."));}
}
loadJournal();
const motion=matchMedia("(prefers-reduced-motion: reduce)");
if(matchMedia("(hover: hover) and (pointer: fine)").matches)document.querySelectorAll(".destination").forEach(tile=>{tile.addEventListener("pointermove",event=>{if(motion.matches)return;const r=tile.getBoundingClientRect();tile.style.setProperty("--tilt-x",`${(event.clientX-r.left-r.width/2)/r.width*5}deg`);tile.style.setProperty("--tilt-y",`${-(event.clientY-r.top-r.height/2)/r.height*5}deg`);});tile.addEventListener("pointerleave",()=>{tile.style.removeProperty("--tilt-x");tile.style.removeProperty("--tilt-y");});});
