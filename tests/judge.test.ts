import { existsSync } from 'node:fs';
import { characters, judgeCharacters, pickHomeCharacter, type Gesture } from '../src/lib/characters';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidates, categorize, decodeVerdict, encodeVerdict, characterFor, judge, parseVerdict, validatePurchase } from '../src/lib/judge';
test('Korean purchase categories and amount thresholds',()=>{
 assert.equal(categorize('아이스 아메리카노'),'cafe');
 assert.equal(categorize('마라탕 배달'),'food');
 assert.equal(categorize('새 운동화'),'fashion');
 assert.equal(categorize('닌텐도 게임'),'hobby');
 assert.equal(categorize('휴지'),'life');
 assert.equal(categorize('그냥 무언가'),'other');
 assert.equal(candidates('커피',14999)[0].id,'cafe-1');
 assert.equal(candidates('커피',15000)[0].id,'cafe-3');
});
test('every category and boundary has eligible dialogue',()=>{
 for(const item of ['밥','커피','옷','게임','휴지','무언가'])for(const amount of [1,14999,15000,29999,30000,49999,50000,99999,100000,999999999])assert.ok(candidates(item,amount).length>=2);
});
test('no repeats until pool exhausted and no immediate repeats after exhaustion',()=>{
 const history:string[]=[];
 for(let i=0;i<12;i++) {
  const result=judge('커피',5000,history,()=>0);
  assert.notEqual(result.lineId,history.at(-1));
  history.push(result.lineId);
 }
 assert.equal(new Set(history.slice(0,2)).size,2);
});
test('invalid purchases are rejected',()=>{
 for(const amount of [0,-1,NaN,Infinity,1.5,1000000000])assert.ok(validatePurchase('커피',amount));
 for(const item of ['', '  ', '가'.repeat(41)])assert.ok(validatePurchase(item,1000));
 assert.throws(()=>judge('',100));
});
test('Unicode shared results round-trip and reject altered data',()=>{
 const result=judge('커피 ☕',5000);
 assert.deepEqual(decodeVerdict(encodeVerdict(result)),result);
 assert.equal(decodeVerdict('%%%'),null);
 assert.equal(decodeVerdict('A'.repeat(2000)),null);
 assert.equal(parseVerdict({...result,amount:-1}),null);
 assert.equal(parseVerdict({...result,lineId:'fashion-1'}),null);
 assert.equal(parseVerdict({...result,version:3}),null);
});

test('v2 preserves chosen character and legacy v1 keeps the original pose',()=>{
 const result=judge('커피',5000);
 assert.equal(result.version,2);
 assert.deepEqual(parseVerdict(result),result);
 const old={version:1 as const,item:'커피',amount:5000,lineId:'cafe-1'};
 assert.deepEqual(decodeVerdict(encodeVerdict(old)),old);
 assert.equal(characterFor(old).src,'/judge-boy.svg');
 assert.equal(parseVerdict({...result,characterId:'approve-base'}),null);
 assert.equal(parseVerdict({...result,characterId:'../../anything'}),null);
 assert.equal(parseVerdict({...result,characterId:undefined}),null);
});
test('gesture selection avoids the preceding gesture across eligible lines',()=>{
 for(const item of ['밥','커피','옷','게임','휴지','무언가']) {
  let previous:Gesture|undefined;const history:string[]=[];
  for(let i=0;i<40;i++) {
   const result=judge(item,5000,history,()=> (i%10)/10,previous);
   const character=characterFor(result);
   assert.notEqual(character.gesture,previous);
   assert.ok(judgeCharacters.some(c=>c.id===character.id));
   assert.ok(existsSync('public'+character.src));
   assert.deepEqual(decodeVerdict(encodeVerdict(result)),result);
   previous=character.gesture;history.push(result.lineId);
  }
 }
 for(const c of characters)assert.ok(existsSync('public'+c.src));
});

test('home is always the second photo and every category can select all three judges',()=>{
 for(let i=0;i<10;i++)assert.equal(pickHomeCharacter(),'judge-boy');
 for(const item of ['커피','휴지','밥','게임','옷']){
  const chosen=new Set<string>();
  for(const n of [0,.4,.8]){const v=judge(item,5000,[],()=>n);chosen.add(characterFor(v).id);}
  assert.deepEqual([...chosen].sort(),judgeCharacters.map(c=>c.id).sort());
 }
});
