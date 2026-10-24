import lines from '@/data/lines.json';
export type Expression = 'smug' | 'laugh' | 'shock' | 'approve';
export type Category = 'food' | 'cafe' | 'fashion' | 'hobby' | 'life' | 'other';
export type Verdict = { version: 1; item: string; amount: number; lineId: string };
export const categories: Record<Category, string> = { food: '먹고 마신 것', cafe: '커피와 디저트', fashion: '옷과 꾸밈', hobby: '취미와 즐거움', life: '살아가는 데 필요한 것', other: '아무튼 산 것' };
const keywords: [Category, string[]][] = [
 ['cafe', ['커피','카페','아아','라떼','스벅','스타벅스','케이크','디저트','빵','도넛','마카롱','아메리카노']],
 ['food', ['배달','치킨','피자','밥','떡볶이','마라','점심','저녁','고기','초밥','햄버거','엽떡','음식','맥주','소주','술','김밥','라면']],
 ['fashion', ['옷','신발','가방','티셔츠','바지','니트','코트','자켓','재킷','후드','운동화','화장품','립','올리브영','향수','무신사','패딩','모자']],
 ['hobby', ['게임','스팀','닌텐도','키보드','마우스','덕질','굿즈','앨범','콘서트','영화','책','카메라','피규어','레고','아이패드','에어팟']],
 ['life', ['생필품','휴지','세제','샴푸','치약','월세','전기','가스','병원','약','교통','장보기','쌀','마트','이불','수건']]
];
export function categorize(item: string): Category {
 return keywords.find(([, words]) => words.some(word => item.toLowerCase().includes(word)))?.[0] ?? 'other';
}
export function validatePurchase(item: unknown, amount: unknown): string | null {
 if (typeof item !== 'string' || !item.trim() || item.trim().length > 40) return '뭘 샀는지 40자 안으로 알려줘.';
 if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 1 || amount > 999999999) return '금액은 1원부터 999,999,999원까지 적어줘.';
 return null;
}
export function candidates(item: string, amount: number) {
 const category = categorize(item);
 return lines.filter(line => line.categories.includes(category) && amount >= line.min && amount <= line.max);
}
export function judge(item: string, amount: number, history: string[] = [], random = Math.random): Verdict {
 const error = validatePurchase(item, amount);
 if (error) throw new Error(error);
 const pool = candidates(item, amount);
 const unseen = pool.filter(line => !history.includes(line.id));
 const choices = unseen.length ? unseen : pool.filter(line => line.id !== history.at(-1));
 const available = choices.length ? choices : pool;
 const line = available[Math.min(available.length - 1, Math.floor(Math.max(0, random()) * available.length))];
 return { version: 1, item: item.trim(), amount, lineId: line.id };
}
export function getLine(verdict: Verdict) {
 const line = lines.find(line => line.id === verdict.lineId);
 if (!line) throw new Error('존재하지 않는 대사');
 return { ...line, expression: line.expression as Expression };
}
export function parseVerdict(value: unknown): Verdict | null {
 if (!value || typeof value !== 'object') return null;
 const v = value as Verdict;
 if (v.version !== 1 || validatePurchase(v.item, v.amount) || !candidates(v.item, v.amount).some(line => line.id === v.lineId)) return null;
 return { version: 1, item: v.item.trim(), amount: v.amount, lineId: v.lineId };
}
export function encodeVerdict(verdict: Verdict) {
 return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(verdict)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
}
export function decodeVerdict(encoded: string): Verdict | null {
 try {
  if (encoded.length > 1500) return null;
  return parseVerdict(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0)))));
 } catch { return null; }
}
