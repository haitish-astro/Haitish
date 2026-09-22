"use strict";
const fields=["title","date","excerpt","body"];
const statusNode=document.querySelector("#draft-status");
const draftList=document.querySelector("#draft-list");
const storageKey="haitish-studio-drafts-v1";
let drafts=[],currentId=null;
try{const saved=JSON.parse(localStorage.getItem(storageKey)||"[]");if(Array.isArray(saved))drafts=saved.filter(d=>d&&typeof d.id==="string"&&fields.every(k=>typeof d[k]==="string"));}catch{statusNode.textContent="Saved drafts couldn't be loaded. You can still write and export.";}
function values(){return Object.fromEntries(fields.map(key=>[key,document.getElementById(key).value]));}
function preview(){const v=values();document.querySelector("#preview-title").textContent=v.title||"Untitled note";document.querySelector("#preview-excerpt").textContent=v.excerpt;const body=document.querySelector("#preview-body");body.replaceChildren();renderBody(v.body,body);}
function refreshList(){draftList.replaceChildren();for(const draft of drafts){const option=document.createElement("option");option.value=draft.id;option.textContent=draft.title||"Untitled note";draftList.append(option);}draftList.value=currentId;}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(drafts));statusNode.textContent="Saved on this device. Not published.";}catch{statusNode.textContent="Browser storage is unavailable. Export your draft to keep it.";}}
function save(){const draft={id:currentId,...values()};const index=drafts.findIndex(d=>d.id===currentId);if(index<0)drafts.push(draft);else drafts[index]=draft;persist();refreshList();return draft;}
function openDraft(draft){currentId=draft.id;for(const key of fields)document.getElementById(key).value=draft[key];refreshList();preview();}
function newDraft(){const now=new Date();const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;const draft={id:crypto.randomUUID(),title:"",date,excerpt:"",body:""};drafts.push(draft);openDraft(draft);persist();document.querySelector("#title").focus();}
document.querySelector("#editor").addEventListener("submit",event=>{event.preventDefault();save();});
document.querySelector("#editor").addEventListener("input",()=>{preview();save();});
document.querySelector("#new-draft").addEventListener("click",()=>{save();newDraft();});
draftList.addEventListener("change",()=>{const selected=drafts.find(d=>d.id===draftList.value);if(selected)openDraft(selected);});
document.querySelector("#export-draft").addEventListener("click",()=>{const draft=save();const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download=`${draft.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,70)||"note"}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.querySelector("#import-draft").addEventListener("change",async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1000000)throw new Error();const value=JSON.parse(await file.text());if(!fields.every(key=>typeof value[key]==="string")||!/^\d{4}-\d{2}-\d{2}$/.test(value.date))throw new Error();save();const draft={id:crypto.randomUUID(),...Object.fromEntries(fields.map(k=>[k,value[k]]))};drafts.push(draft);openDraft(draft);persist();}catch{statusNode.textContent="That file isn't a valid draft export (maximum 1 MB).";}event.target.value="";});
if(drafts.length)openDraft(drafts[0]);else newDraft();
