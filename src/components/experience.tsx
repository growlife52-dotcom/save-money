'use client';
/* Native images keep the same original vector artwork available to the canvas exporter. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { categories, categorize, encodeVerdict, characterFor, getLine, judge, validatePurchase, type Verdict } from '@/lib/judge';
import { getCharacter, pickHomeCharacter, type Gesture } from '@/lib/characters';
import { createStory } from '@/lib/story';
const HISTORY_KEY = 'yattoo-history-v1';
function readHistory(): string[] {
 try { const v: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); return Array.isArray(v) ? v.filter((id): id is string => typeof id === 'string').slice(-100) : []; } catch { return []; }
}
function remember(id: string) { try { localStorage.setItem(HISTORY_KEY,JSON.stringify([...readHistory(),id].slice(-100))); } catch { /* Browsing with storage disabled still works. */ } }
export default function Experience({initialVerdict = null, initialInvalidLink = false, homeCharacterId = 'smug-thinking'}:{initialVerdict?:Verdict|null;initialInvalidLink?:boolean;homeCharacterId?:string}) {
 const [verdict,setVerdict] = useState<Verdict|null>(initialVerdict);
 const [homeId,setHomeId] = useState(homeCharacterId);
 const lastGesture = useRef<Gesture|undefined>(initialVerdict?characterFor(initialVerdict).gesture:undefined);
 const [item,setItem] = useState('');
 const [amount,setAmount] = useState('');
 const [error,setError] = useState('');
 const [invalidLink,setInvalidLink] = useState(initialInvalidLink);
 const [sheet,setSheet] = useState(false);
 const [busy,setBusy] = useState('');
 const [status,setStatus] = useState('');
 const [shareUrl,setShareUrl] = useState('');
 const [preview,setPreview] = useState('');
 const [png,setPng] = useState<Blob|null>(null);
 const [privacy,setPrivacy] = useState(false);
 const headingRef = useRef<HTMLHeadingElement>(null);
 const dialogRef = useRef<HTMLDivElement>(null);
 const shareButtonRef = useRef<HTMLButtonElement>(null);
 const focusResult = useRef(false);
 const reduce = useReducedMotion();
 useEffect(()=>{
  if (!sheet) return;
  const previousOverflow = document.body.style.overflow;
  const shareButton = shareButtonRef.current;
  document.body.style.overflow='hidden';
  dialogRef.current?.focus();
  function keydown(e: KeyboardEvent) {
   if(e.key==='Escape')setSheet(false);
   if(e.key==='Tab') {
    const nodes=dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input');
    if(!nodes?.length) return;
    const first=nodes[0], last=nodes[nodes.length-1];
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialogRef.current)){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialogRef.current)){e.preventDefault();first.focus();}
   }
  }
  document.addEventListener('keydown',keydown);
  return ()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',keydown);shareButton?.focus();};
 },[sheet]);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 function reset() {
  setHomeId(pickHomeCharacter()); setVerdict(null); setInvalidLink(false); setError(''); setStatus(''); setShareUrl(''); setPng(null); setPreview(''); setItem(''); setAmount('');
  window.history.replaceState(null,'','/'); window.scrollTo({top:0,behavior:'instant'});
 }
 function makeVerdict(purchase: string, price: number) {
  const history = readHistory();
  if (verdict) history.push(verdict.lineId);
  let previousGesture = verdict?characterFor(verdict).gesture:lastGesture.current;
  if(!previousGesture){try{const saved=localStorage.getItem('yattoo-gesture-v1');if(['base','thinking','chin-smirk','idea'].includes(saved??''))previousGesture=saved as Gesture;}catch{}}
  const result = judge(purchase,price,history,Math.random,previousGesture);
  lastGesture.current=characterFor(result).gesture;
  try{localStorage.setItem('yattoo-gesture-v1',lastGesture.current);}catch{}
  remember(result.lineId); focusResult.current=true; setVerdict(result);setShareUrl('');setPng(null);setPreview('');setStatus('');
  window.history.replaceState(null,'',`/?r=${encodeVerdict(result)}`);
  window.scrollTo({top:0,behavior:reduce?'instant':'smooth'});
 }
 function submit(e: React.FormEvent) {
  e.preventDefault(); const price = Number(amount.replaceAll(',',''));
  const message = validatePurchase(item,price); if(message){setError(message);return;}
  setError('');makeVerdict(item,price);
 }
 async function openShare() {
  if(!verdict)return;
  setSheet(true);setStatus('');
  if(png)return;
  setBusy('image');
  try{const blob=await createStory(verdict);setPng(blob);setPreview(URL.createObjectURL(blob));}
  catch(e){setStatus(e instanceof Error?e.message:'이미지 생성에 실패했어요.');}
  finally{setBusy('');}
 }
 async function savePng() {
  if(!png)return;
  const file=new File([png],'야또샀냐-소비심판.png',{type:'image/png'});
  try {
   if(navigator.canShare?.({files:[file]})) { await navigator.share({files:[file],title:'야또샀냐'});setStatus('사진에 저장한 뒤 인스타 스토리로 올려줘!'); }
   else {const a=document.createElement('a');a.href=preview;a.download=file.name;a.click();setStatus('PNG를 저장했어. 인스타 스토리에서 골라줘!');}
  } catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setStatus('저장이 안 되면 아래 이미지를 길게 눌러 저장해 줘.');}
 }
 async function copyLink() {
  if(!verdict)return;
  setBusy('link');setStatus('');
  try {
   let url=shareUrl;
   if(!url){
    const response=await fetch('/api/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(verdict)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error??'공유 링크를 만들지 못했어요.');
    url=`${window.location.origin}${data.id?`/s/${data.id}`:`/?r=${encodeVerdict(verdict)}`}`;
    setShareUrl(url);
   }
   if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(url);setStatus('링크 복사 완료. 친구한테 보내봐 ㅋㅋ');}catch{setStatus('아래 링크를 길게 눌러 복사해 줘.');}}
   else setStatus('아래 링크를 길게 눌러 복사해 줘.');
  }catch(e){setStatus(e instanceof Error?e.message:'공유 링크를 만들지 못했어요.');}
  finally{setBusy('');}
 }
 const line=verdict?getLine(verdict):null;
 const character=verdict?characterFor(verdict):getCharacter(homeId);
 return <>
  <div className="app-shell">
   <header className="header"><button className="wordmark" onClick={reset} aria-label="야또샀냐 처음으로">야또샀냐<span className="logo-dot">.</span></button><span className="header-note">너의 소비, 내가 좀 볼게</span></header>
   <main>
    <AnimatePresence mode="wait" initial={false}>
     {!verdict ? <motion.div key="home" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduce?0:.25}}>
      <section className="intro"><span className="eyebrow"><span/>오늘도 결제한 너에게</span><h1>야 너 또<br className="tiny-break"/> 뭐 샀냐<span className="accent">?</span></h1><p>일단 말해봐. 안 혼낼게 ㅋㅋ</p></section>
      <div className="character-stage"><div className="character-halo"/><img key={character.id} className={`character gesture-${character.gesture}`} src={character.src} alt={character.alt} width="600" height="600" fetchPriority="high"/><span className="character-caption">판단은 빠르게, 잔소리는 짧게.</span></div>
      <form className="purchase-form" onSubmit={submit} noValidate>
       <div className="form-heading"><span className="mini-line"/><h2>자, 어디 한번 들어보자</h2><span className="mini-line"/></div>
       <label className="input-card" htmlFor="item"><span>뭐 샀는데?</span><input id="item" name="item" value={item} onChange={e=>{setItem(e.target.value);setError('');}} maxLength={40} placeholder="예: 마라탕, 새 운동화, 아아" autoComplete="off" aria-describedby={error?'form-error':undefined} aria-invalid={!!error}/></label>
       <label className="input-card amount-card" htmlFor="amount"><span>얼마 썼는데?</span><div className="amount-field"><input id="amount" name="amount" value={amount} onChange={e=>{const raw=e.target.value.replaceAll(',','');if(/^\d{0,9}$/.test(raw))setAmount(raw?Number(raw).toLocaleString('ko-KR'):'');setError('');}} inputMode="numeric" autoComplete="off" placeholder="0" style={{width:`${Math.max(1,amount.length)}ch`}} aria-describedby={error?'form-error':undefined} aria-invalid={!!error}/><span>원</span></div></label>
       {error&&<p className="form-error" id="form-error" role="alert">{error}</p>}
       {invalidLink&&<p className="form-error" role="alert">앗, 유효하지 않은 공유 링크야. 새로 심판받아 줘!</p>}
       <button className="primary judge-button" type="submit">심판받기 <span aria-hidden="true">↗</span></button>
       <p className="fine-print">안 혼낸다는 말은 거짓말일 수 있음</p>
      </form>
     </motion.div> : <motion.div key="result" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduce?0:.3}} className="result">
      <span className="eyebrow"><span/>{categories[categorize(verdict.item)]}</span>
      <div className="result-character"><img key={`${verdict.lineId}-${character.id}`} className={`gesture-${character.gesture}`} data-character-id={character.id} src={character.src} alt={character.alt} width="600" height="600"/></div>
      <h1 className="verdict-text" ref={node=>{headingRef.current=node;if(node&&focusResult.current){node.focus({preventScroll:true});focusResult.current=false;}}} tabIndex={-1}>{line!.text.split('\n').map((text,i)=><span key={i}>{text}</span>)}</h1>
      <p className="verdict-aside">잔소리 아니고… 팩트 체크야 ㅋㅋ</p>
      <div className="receipt"><p>{verdict.item}</p><strong>{verdict.amount.toLocaleString('ko-KR')}<span>원</span></strong></div>
      <div className="result-actions"><button className="primary" ref={shareButtonRef} onClick={openShare}><UploadIcon/>스토리 박제하기<span aria-hidden="true">↗</span></button><button className="secondary" onClick={()=>makeVerdict(verdict.item,verdict.amount)}><span aria-hidden="true">↻</span>한 번 더 혼나기</button><button className="text-button" onClick={reset}>다른 거 심판받기 <span aria-hidden="true">→</span></button></div>
      <p className="fine-print">웃자고 하는 소리야. 네 행복은 네가 정해.</p>
     </motion.div>}
    </AnimatePresence>
   </main>
   <footer><span className="footer-logo">야또샀냐.</span><span>소비는 네가, 심판은 내가.</span><button className="privacy-link" onClick={()=>setPrivacy(!privacy)} aria-expanded={privacy}>입력 정보 안내</button>{privacy&&<p className="privacy-copy">소비 입력은 기본적으로 브라우저에서 처리해요. 링크 복사 시 공유 결과에 항목·금액·대사가 포함돼요. 저장소가 연결되어 있으면 해당 정보가 서버에도 저장됩니다. 개인 정보는 적지 말아 주세요.</p>}</footer>
  </div>
  <AnimatePresence>{sheet&&<motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={e=>{if(e.target===e.currentTarget)setSheet(false);}}><motion.div className="share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-title" tabIndex={-1} ref={dialogRef} initial={{y:reduce?0:60}} animate={{y:0}} exit={{y:reduce?0:60}}>
   <button className="close-button" aria-label="공유 창 닫기" onClick={()=>setSheet(false)}>×</button><div className="sheet-handle"/><h2 id="share-title">이건 스토리 각이다</h2><p className="sheet-description">혼나긴 했는데… 나만 볼 순 없지 ㅋㅋ</p>
   {preview?<img className="story-preview" src={preview} alt="캐릭터와 대사가 담긴 스토리 공유 카드" width="1080" height="1920"/>:<div className="preview-loading" role="status">{busy==='image'?'스토리 이미지 만드는 중…':'이미지를 만들지 못했어요.'}</div>}
   <p className="share-disclosure">링크를 받은 사람은 구매 항목과 금액을 볼 수 있어.</p><div className="share-actions"><button className="primary" disabled={!png||!!busy} onClick={savePng}><DownloadIcon/>PNG 저장 · 공유</button><button className="secondary" disabled={!!busy} onClick={copyLink}>{busy==='link'?'링크 만드는 중…':'결과 링크 복사하기'}</button></div>
   {shareUrl&&<input aria-label="공유 링크" className="share-url" value={shareUrl} readOnly onFocus={e=>e.target.select()}/>}
   <p className="share-status" role="status">{status}</p><p className="share-guide">이미지 저장 → 인스타그램 열기 → 스토리에 추가<br/>링크는 스토리의 ‘링크’ 스티커에 붙여 넣어줘.</p>
  </motion.div></motion.div>}</AnimatePresence>
 </>;
}
function UploadIcon(){return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>}
function DownloadIcon(){return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>}
