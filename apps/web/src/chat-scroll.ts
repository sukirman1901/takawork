export function nearTranscriptEnd(height:number, viewport:number, top:number) {
  return height-viewport-top<=48;
}
export function transcriptTarget({count,previousCount,changed,nearEnd,userSent}:{count:number;previousCount:number;changed:boolean;nearEnd:boolean;userSent:boolean}):'start'|'end'|'preserve' {
  if(count===0)return 'start';
  if(changed||nearEnd||(userSent&&count>previousCount))return 'end';
  return 'preserve';
}
