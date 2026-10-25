export interface SelectOption<T extends string=string> { value:T;label:string;disabled?:boolean }
export function moveOption(options:readonly SelectOption[],current:number,direction:1|-1) {
  for(let step=1;step<=options.length;step++){
    const index=((current+step*direction)%options.length+options.length)%options.length;
    if(!options[index].disabled)return index;
  }
  return -1;
}
export function matchOption(options:readonly SelectOption[],query:string,current:number) {
  const prefix=query.toLocaleLowerCase('id-ID');
  for(let step=1;step<=options.length;step++){
    const index=(current+step+options.length)%options.length;
    if(!options[index].disabled&&options[index].label.toLocaleLowerCase('id-ID').startsWith(prefix))return index;
  }
  return -1;
}
export function menuPosition(rect:{left:number;right:number;top:number;bottom:number;width:number},viewport:{width:number;height:number},height:number) {
  const edge=12,gap=8;
  const width=Math.min(Math.max(rect.width,200),Math.max(0,viewport.width-edge*2));
  const below=Math.max(0,viewport.height-edge-rect.bottom-gap),above=Math.max(0,rect.top-gap-edge);
  const side=below>=Math.min(height,160)||below>=above?'bottom':'top';
  const maxHeight=Math.min(height,side==='bottom'?below:above);
  return {side,width,maxHeight,left:Math.max(edge,Math.min(rect.left,viewport.width-edge-width)),top:side==='bottom'?rect.bottom+gap:rect.top-gap-maxHeight};
}
