import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { matchOption, menuPosition, moveOption, type SelectOption } from './select-model';

interface Props<T extends string> {
  value:T;onValueChange(value:T):void;options:readonly SelectOption<T>[];
  label:string;id?:string;hideLabel?:boolean;variant?:'field'|'toolbar'|'plain';disabled?:boolean;
}
// Shared custom listbox: the browser only supplies top-layer positioning, not option UI.
// Keep the popup inside its form/dialog DOM so it also works with native <dialog>.
export function Select<T extends string>({value,onValueChange,options,label,id,hideLabel=false,variant='field',disabled=false}:Props<T>) {
  const generated=useId(),triggerId=id??`select-${generated}`,listId=`${triggerId}-list`;
  const trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
  const query=useRef({text:'',at:0});
  const selected=options.findIndex(o=>o.value===value);
  const locked=disabled||!options.some(o=>!o.disabled);
  function close(restore=false){if(list.current?.matches(':popover-open'))list.current.hidePopover();setOpen(false);query.current={text:'',at:0};if(restore)trigger.current?.focus({preventScroll:true});}
  function reveal(direction:1|-1=1){
    if(locked)return;
    setActive(selected>=0&&!options[selected].disabled?selected:moveOption(options,direction===1?-1:0,direction));
    setOpen(true);
  }
  function choose(index:number){
    const option=options[index];if(!option||option.disabled)return;
    onValueChange(option.value);close(true);
  }
  useLayoutEffect(()=>{
    if(!open||!list.current||!trigger.current)return;
    const popup=list.current;
    popup.showPopover();
    function position(){
      if(!trigger.current)return;
      const rect=trigger.current.getBoundingClientRect();
      if(rect.bottom<0||rect.top>innerHeight||trigger.current.closest('[inert]')){close();return;}
      const viewport={width:innerWidth,height:innerHeight};
      popup.style.width=`${menuPosition(rect,viewport,0).width}px`;
      const placement=menuPosition(rect,viewport,Math.min(popup.scrollHeight+2,300));
      popup.style.left=`${placement.left}px`;popup.style.top=`${placement.top}px`;
      popup.style.width=`${placement.width}px`;popup.style.maxHeight=`${placement.maxHeight}px`;
      popup.dataset.side=placement.side;
    }
    function outside(event:PointerEvent){if(event.target instanceof Node&&!popup.contains(event.target)&&!trigger.current?.contains(event.target))close();}
    function blur(){close();}
    position();
    document.addEventListener('pointerdown',outside,true);
    window.addEventListener('resize',position);window.addEventListener('scroll',position,true);window.addEventListener('blur',blur);
    return()=>{if(popup.matches(':popover-open'))popup.hidePopover();document.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);window.removeEventListener('blur',blur);};
  },[open,options.length]);
  useEffect(()=>{if(open)list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({block:'nearest'});},[active,open]);
  function keydown(event:KeyboardEvent<HTMLButtonElement>){
    if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close(true);return;}
    if(event.key==='Tab'){if(open)close();return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const direction=event.key==='ArrowDown'?1:-1;
      if(!open)reveal(direction);else setActive(index=>moveOption(options,index,direction));return;
    }
    if(open&&(event.key==='Home'||event.key==='End')){event.preventDefault();setActive(moveOption(options,event.key==='Home'?-1:0,event.key==='Home'?1:-1));return;}
    if(event.key==='Enter'||event.key===' '){event.preventDefault();if(open)choose(active);else reveal();return;}
    if(event.key.length===1&&!event.metaKey&&!event.ctrlKey&&!event.altKey){
      event.preventDefault();const now=Date.now(),text=now-query.current.at>700?event.key:query.current.text+event.key;
      query.current={text,at:now};
      const match=matchOption(options,text,open?active:selected);
      if(!open)reveal();if(match>=0)setActive(match);
    }
  }
  return <div className={`select-field select-${variant}`}>
    {!hideLabel&&<label htmlFor={triggerId}>{label}</label>}
    <button ref={trigger} id={triggerId} type="button" className="select-trigger" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open&&active>=0?`${listId}-${active}`:undefined} disabled={locked} onKeyDown={keydown} onClick={()=>open?close():reveal()}>
      <span className="select-value">{options[selected]?.label??'Pilih…'}</span><ChevronDown size={14} aria-hidden="true"/>
    </button>
    <div ref={list} id={listId} popover="manual" className="select-list" role="listbox" aria-label={label}>
      {options.map((option,index)=><button key={option.value} id={`${listId}-${index}`} type="button" role="option" tabIndex={-1} className={`select-option ${active===index?'is-active':''}`} data-index={index} aria-selected={option.value===value} aria-disabled={option.disabled||undefined} disabled={option.disabled} onPointerMove={()=>{if(!option.disabled)setActive(index);}} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(index)}><span>{option.label}</span>{option.value===value&&<Check size={14} aria-hidden="true"/>}</button>)}
    </div>
  </div>;
}
