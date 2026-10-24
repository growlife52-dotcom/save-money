export type Expression = 'smug' | 'laugh' | 'shock' | 'approve';
export type Gesture = 'base' | 'thinking' | 'chin-smirk' | 'idea';
export const gestureNames: Record<Gesture, string> = {
 base: '기본 자세', thinking: '턱 괴고 고민하기', 'chin-smirk': '턱 만지며 능청 웃기', idea: '검지 들고 깨달은 표정',
};
const definitions = [
 ['smug','base'],['laugh','base'],['shock','base'],['approve','base'],
 ['smug','thinking'],['smug','chin-smirk'],['smug','idea'],
 ['laugh','chin-smirk'],['laugh','idea'],['shock','thinking'],['shock','idea'],
] as const;
export const characters = definitions.map(([expression,gesture])=>({
 id:`${expression}-${gesture}`, expression, gesture,
 src:gesture==='base'?`/character-${expression}.svg`:`/character-${expression}-${gesture}.svg`,
 alt:`${gestureNames[gesture]} 자세의 ${expression==='approve'?'흐뭇한':expression==='shock'?'놀란':expression==='laugh'?'웃는':'능청스러운'} 잼민이`,
}));
export function getCharacter(id: string) {
 const character=characters.find(c=>c.id===id);
 if(!character)throw new Error('존재하지 않는 캐릭터');
 return character;
}
export const homeCharacters=characters.filter(c=>c.expression==='smug'&&c.gesture!=='base');
export function pickHomeCharacter(random=Math.random) {
 return homeCharacters[Math.min(homeCharacters.length-1,Math.floor(Math.max(0,random())*homeCharacters.length))].id;
}
