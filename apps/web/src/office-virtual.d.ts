declare module 'virtual:nusaiba-scene' {
  export function boot(hooks: {
    onSelect(id:string):void; bubble(agent:{data:{id:string};state:string}):string;
    motion():boolean; suspended():boolean;
  }): {
    load(data:unknown):void;
    agents:Array<{data:{id:string};timer:number;state:string;bubbleEl?:HTMLElement}>;
    start():void; camera(view:string):void; lighting(night:boolean):void;
    select(id:string|null):void; resume():void;
    board(draw:(canvas:HTMLCanvasElement)=>void):void;
  };
}
