export type Expression = 'smug' | 'laugh' | 'shock' | 'approve';
export type Gesture = 'base' | 'thinking' | 'chin-smirk' | 'idea' | 'wallet' | 'boy' | 'shrug';
export const gestureNames: Record<Gesture, string> = {
 wallet: '빈 지갑을 보여주는 남자', boy: '검지를 든 남자아이', shrug: '양손을 펼친 남자',
 base: '기본 자세', thinking: '턱 괴고 고민하기', 'chin-smirk': '턱 만지며 능청 웃기', idea: '검지 들고 깨달은 표정',
};
const definitions = [
 ['smug','base'],['laugh','base'],['shock','base'],['approve','base'],
 ['smug','thinking'],['smug','chin-smirk'],['smug','idea'],
 ['laugh','chin-smirk'],['laugh','idea'],['shock','thinking'],['shock','idea'],
] as const;
const legacyCharacters = definitions.map(([expression,gesture])=>({
 id:`${expression}-${gesture}`, expression, gesture,
 src:`/judge-${gesture==='idea'?'boy':gesture==='thinking'?'wallet':gesture==='base'&&expression==='shock'?'boy':'shrug'}.svg`,
 alt:(gesture==='idea'||(gesture==='base'&&expression==='shock'))?'검지를 든 남자아이 사진':gesture==='thinking'?'빈 지갑을 보여주는 남자 사진':'양손을 펼친 남자 사진',
}));
export const judgeCharacters = [
 {id:'judge-wallet',expression:'smug',gesture:'wallet',src:'/judge-wallet.svg',alt:'빈 지갑을 보여주는 남자 사진'},
 {id:'judge-boy',expression:'smug',gesture:'boy',src:'/judge-boy.svg',alt:'검지를 들고 놀란 표정의 남자아이 사진'},
 {id:'judge-shrug',expression:'smug',gesture:'shrug',src:'/judge-shrug.svg',alt:'양손을 펼치고 어깨를 으쓱하는 남자 사진'},
] as const;
export const characters=[...legacyCharacters,...judgeCharacters];
export function getCharacter(id: string) {
 const character=characters.find(c=>c.id===id);
 if(!character)throw new Error('존재하지 않는 캐릭터');
 return character;
}
export const homeCharacters=[judgeCharacters[1]];
export function pickHomeCharacter() { return 'judge-boy'; }
