import { characters } from '../../src/lib/characters';
import { test, expect } from '@playwright/test';
test('mobile input, judgement, reroll, PNG export and portable sharing',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'야 너 또 뭐 샀냐?'})).toBeVisible();
 await page.getByRole('button',{name:'심판받기'}).click();
 await expect(page.locator('p[role=alert]')).toContainText('뭘 샀는지');
 const homeCharacter=await page.locator('.character').getAttribute('src');
 await page.getByLabel('뭐 샀는데?').fill('마라탕');
 await expect(page.locator('.character')).toHaveAttribute('src',homeCharacter!);
 await page.getByLabel('얼마 썼는데?').fill('18000');
 await expect(page.getByLabel('얼마 썼는데?')).toHaveValue('18,000');
 await page.getByRole('button',{name:'심판받기'}).click();
 const heading=page.locator('.verdict-text');
 await expect(heading).toBeVisible();
 const first=await heading.innerText();
 const firstCharacter=await page.locator('.result-character img').getAttribute('data-character-id');
 await expect(page.locator('.result')).toHaveCSS('opacity','1');
 await page.screenshot({path:'test-results/result-mobile.png',fullPage:true});
 await expect(page.locator('.receipt')).toContainText('18,000');
 await page.getByRole('button',{name:'한 번 더 혼나기'}).click();
 await expect(heading).not.toHaveText(first,{useInnerText:true});
 const second=await heading.innerText();
 const chosen=await page.locator('.result-character img').getAttribute('src');
 const secondCharacter=await page.locator('.result-character img').getAttribute('data-character-id');
 expect(secondCharacter!.replace(/^[^-]+-/, '')).not.toBe(firstCharacter!.replace(/^[^-]+-/, ''));
 const resultUrl=page.url();
 await page.reload();
 await expect(heading).toHaveText(second,{useInnerText:true});
 await expect(page.locator('.result-character img')).toHaveAttribute('src',chosen!);
 await page.getByRole('button',{name:'스토리 박제하기'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 const preview=page.getByAltText('캐릭터와 대사가 담긴 스토리 공유 카드');
 await expect(preview).toBeVisible();
 const dimensions=await preview.evaluate(async(el)=>{const img=el as HTMLImageElement;await img.decode();return [img.naturalWidth,img.naturalHeight];});
 expect(dimensions).toEqual([1080,1920]);
 const sameCharacter=await preview.evaluate(async(el,src)=>{
  const expected=document.createElement('canvas');expected.width=1080;expected.height=1920;
  const ctx=expected.getContext('2d')!;ctx.fillStyle='#faf9f7';ctx.fillRect(0,0,1080,1920);
  const image=new Image();image.src=src!;await image.decode();ctx.drawImage(image,110,270,860,860);
  const actual=document.createElement('canvas');actual.width=1080;actual.height=1920;
  actual.getContext('2d')!.drawImage(el as HTMLImageElement,0,0);
  const a=ctx.getImageData(110,270,860,780).data;
  const b=actual.getContext('2d')!.getImageData(110,270,860,780).data;
  return a.every((value,i)=>value===b[i]);
 },chosen);
 expect(sameCharacter).toBe(true);
 // Inspect generated PNG dimensions and persist a sample artifact.
 const png=await preview.evaluate(async(el)=>Array.from(new Uint8Array(await (await fetch((el as HTMLImageElement).src)).arrayBuffer())));
 expect(png.slice(0,8)).toEqual([137,80,78,71,13,10,26,10]);
 const downloadEvent=page.waitForEvent('download');
 await page.getByRole('button',{name:'PNG 저장 · 공유'}).click();
 const download=await downloadEvent;expect(download.suggestedFilename()).toBe('야또샀냐-소비심판.png');
 await test.info().attach('story.png',{body:Buffer.from(png),contentType:'image/png'});
 await page.getByRole('button',{name:'결과 링크 복사하기'}).click();
 await expect(page.getByLabel('공유 링크')).toBeVisible();
 const share=await page.getByLabel('공유 링크').inputValue();
 expect(share).toBe(resultUrl);
 const other=await context.newPage();await other.goto(share);
 await expect(other.locator('.verdict-text')).toHaveText(second,{useInnerText:true});
 await expect(other.locator('.receipt')).toContainText('마라탕');
 await expect(other.locator('.result-character img')).toHaveAttribute('src',chosen!);
 await other.close();
 await page.getByRole('button',{name:'공유 창 닫기'}).click();
 await expect(page.locator('.result-character img')).toHaveAttribute('src',chosen!);
 await page.getByRole('button',{name:'다른 거 심판받기'}).click();
 await expect(page.getByLabel('뭐 샀는데?')).toHaveValue('');
 await expect(page.getByLabel('얼마 썼는데?')).toHaveValue('');
 await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('mobile layouts stay within viewport and all expressions load',async({page})=>{
 for(const width of [320,375,390,430,768,1440]) {
  await page.setViewportSize({width,height:844});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 }
 for(const character of characters)expect((await page.request.get(character.src)).ok()).toBeTruthy();
 expect(await page.evaluate(async(sources)=>{for(const src of sources){const img=new Image();img.src=src;await img.decode();if(img.naturalWidth!==600||img.naturalHeight!==600)return false;}return true;},characters.map(c=>c.src))).toBe(true);
 await page.goto('/?r=not-valid');await expect(page.locator('p[role=alert]')).toContainText('유효하지 않은');
});
test('sharing rejects malformed and cross-origin requests',async({request,baseURL})=>{
 const valid={version:1,item:'커피',amount:5000,lineId:'cafe-1'};
 expect((await request.post('/api/share',{data:valid})).status()).toBe(403);
 expect((await request.post('/api/share',{headers:{origin:baseURL!},data:{...valid,amount:-1}})).status()).toBe(400);
 expect((await request.post('/api/share',{headers:{origin:baseURL!},data:valid})).status()).toBe(200);
 expect((await request.get('/s/not-a-valid-id')).status()).toBe(404);
});

test('legacy shared links use the matching photo fallback',async({page})=>{
 const old={version:1,item:'커피',amount:5000,lineId:'cafe-1'};
 const encoded=Buffer.from(JSON.stringify(old)).toString('base64url');
 await page.goto('/?r='+encoded);
 await expect(page.locator('.result-character img')).toHaveAttribute('src','/character-photo-chin-smirk.svg');
 await expect(page.locator('.verdict-text')).toBeVisible();
});
