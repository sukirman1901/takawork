import { expect, it } from 'vitest';
import { moveOption, matchOption, menuPosition } from './select-model';
const options=[{value:'a',label:'Engineering'},{value:'b',label:'Operasional',disabled:true},{value:'c',label:'Riset'}];
it('navigates only enabled items and wraps around',()=>{
  expect(moveOption(options,0,1)).toBe(2);
  expect(moveOption(options,2,1)).toBe(0);
  expect(moveOption(options,0,-1)).toBe(2);
  expect(moveOption([{...options[0],disabled:true}],0,1)).toBe(-1);
});
it('supports case-insensitive typeahead without selecting disabled choices',()=>{
  expect(matchOption(options,'ri',0)).toBe(2);
  expect(matchOption(options,'EN',2)).toBe(0);
  expect(matchOption(options,'op',0)).toBe(-1);
});
it('clamps a menu near the right edge and opens above a low trigger',()=>{
  const position=menuPosition({left:270,right:310,top:600,bottom:640,width:40},{width:320,height:700},220);
  expect(position.left+position.width).toBeLessThanOrEqual(308);
  expect(position.side).toBe('top');
  expect(position.top).toBeGreaterThanOrEqual(12);
  expect(position.top+position.maxHeight).toBeLessThanOrEqual(592);
});
it('opens below when there is room and never exceeds a narrow viewport',()=>{
  const position=menuPosition({left:10,right:290,top:20,bottom:60,width:280},{width:320,height:740},250);
  expect(position.side).toBe('bottom');expect(position.top).toBe(68);
  expect(position.width).toBeLessThanOrEqual(296);
});
