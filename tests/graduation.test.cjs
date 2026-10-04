const {test} = require('node:test');
const assert = require('node:assert/strict');
const {evaluate, target} = require('../graduation.js');
const now = new Date(2026, 9, 4);
const settings = {'2026-7':{goalAmount:100}, '2026-8':{goalAmount:100}, '2026-9':{goalAmount:100}};
const expenses = [7,8,9].map(month => ({year:2026,month,cost:50}));
test('three recorded completed months award once and remain stable on reload', () => {
 assert.equal(target,3);
 const first=evaluate({},settings,expenses,now);
 assert.equal(first.streak,3); assert.equal(first.graduated,true); assert.equal(first.graduateCount,1);
 const second=evaluate(first,settings,expenses,now);
 assert.equal(second.newlyGraduated,false); assert.equal(second.graduateCount,1);
});
test('a gap in goals breaks a legacy streak',()=>{
 const s=evaluate({streak:2,history:{'2026-6':true,'2026-7':true}}, {'2026-9':{goalAmount:100}},expenses,now);
 assert.equal(s.streak,1);assert.equal(s.graduated,false);
});
test('unrecorded month is not success',()=>{
 const s=evaluate({},settings,expenses.filter(e=>e.month!==8),now);
 assert.equal(s.history['2026-8'],false);assert.equal(s.streak,1);assert.equal(s.graduated,false);
});
test('budget equality qualifies; overspending breaks streak',()=>{
 assert.equal(evaluate({},settings,expenses.map(e=>({...e,cost:100})),now).graduated,true);
 const s=evaluate({},settings,expenses.map(e=>({...e,cost:e.month===8?101:50})),now);
 assert.equal(s.streak,1);assert.equal(s.graduated,false);
});
test('current and future months cannot graduate',()=>{
 assert.equal(evaluate({},settings,expenses,new Date(2026,8,30)).streak,2);
});
test('year rollover and missed visits process consecutive months',()=>{
 const set={'2025-11':{goalAmount:100},'2025-12':{goalAmount:100},'2026-1':{goalAmount:100}};
 const exp=[{year:2025,month:11,cost:10},{year:2025,month:12,cost:10},{year:2026,month:1,cost:10}];
 assert.equal(evaluate({},set,exp,new Date(2026,1,1)).graduated,true);
});
test('past earned award is preserved even after a later failed month',()=>{
 const s=evaluate({},settings,expenses,new Date(2026,10,1));
 assert.equal(s.streak,0); assert.equal(s.graduated,true);assert.equal(s.graduationStreak,3);
 const legacy=evaluate({graduated:true,graduatedAt:'2025-01-01',graduateCount:1,history:{'2025-1':true}}, {},[],now);
 assert.equal(legacy.graduationStreak,6); assert.equal(legacy.graduatedAt,'2025-01-01');assert.equal(legacy.graduateCount,1);
});
test('invalid shapes and invalid month keys are ignored',()=>{
 const s=evaluate(null,null,null,now);assert.equal(s.streak,0);
 assert.equal(evaluate({}, {'oops':{goalAmount:100},'2026-13':{goalAmount:100}},[],now).graduated,false);
});
