import { getLine, type Verdict } from './judge';
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
 const result: string[] = [];
 for (const paragraph of text.split('\n')) {
  let current = '';
  for (const char of paragraph) {
   if (ctx.measureText(current + char).width > maxWidth && current) { result.push(current); current = char; }
   else current += char;
  }
  result.push(current);
 }
 return result;
}
export async function createStory(verdict: Verdict): Promise<Blob> {
 await document.fonts.ready;
 await document.fonts.load('800 96px "Pretendard Variable"');
 const canvas = document.createElement('canvas');
 canvas.width = 1080; canvas.height = 1920;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('이 브라우저에서는 이미지 저장을 지원하지 않아요.');
 ctx.fillStyle = '#faf9f7'; ctx.fillRect(0,0,1080,1920);
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillStyle = '#e54b3f'; ctx.font = '800 46px "Pretendard Variable", sans-serif'; ctx.fillText('야또샀냐',540,130);
 ctx.fillStyle = '#8d8a85'; ctx.font = '500 30px "Pretendard Variable", sans-serif'; ctx.fillText('소비는 네가, 심판은 내가.',540,197);
 const line = getLine(verdict);
 const img = new Image();
 img.src = `/character-${line.expression}.svg`;
 await img.decode();
 ctx.drawImage(img,110,270,860,860);
 ctx.fillStyle = '#292723'; ctx.font = '800 92px "Pretendard Variable", sans-serif';
 const textLines = wrap(ctx,line.text,930);
 const top = 1170 - (textLines.length - 2) * 45;
 textLines.forEach((text,i)=>ctx.fillText(text,540,top+i*112));
 ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(95,1490,890,170,38); ctx.fill();
 ctx.fillStyle = '#77736d'; ctx.font = '500 34px "Pretendard Variable", sans-serif';
 const item = wrap(ctx, verdict.item,760);
 const displayItem = item.length > 1 ? item[0]+'…' : item[0];
 ctx.fillText(displayItem,540,1540);
 ctx.fillStyle = '#292723'; ctx.font = '800 48px "Pretendard Variable", sans-serif';
 ctx.fillText(`${verdict.amount.toLocaleString('ko-KR')}원`,540,1605);
 ctx.fillStyle = '#aaa59c'; ctx.font = '500 28px "Pretendard Variable", sans-serif'; ctx.fillText('안 혼낸다는 말은 거짓말일 수 있음',540,1780);
 ctx.fillStyle = '#e54b3f'; ctx.font = '700 30px "Pretendard Variable", sans-serif'; ctx.fillText('너도 심판받아 봐  →  야또샀냐',540,1835);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob ? resolve(blob) : reject(new Error('이미지를 만들지 못했어요. 다시 시도해 주세요.')),'image/png'));
}
