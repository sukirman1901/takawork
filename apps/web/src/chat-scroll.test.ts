import { expect, it } from 'vitest';
import { transcriptTarget, nearTranscriptEnd } from './chat-scroll';

it('keeps an empty conversation at its beginning, even after a long previous chat',()=>{
  expect(transcriptTarget({count:0,previousCount:20,changed:true,nearEnd:true,userSent:false})).toBe('start');
});
it('shows the latest history on conversation switch or when the user sends',()=>{
  expect(transcriptTarget({count:8,previousCount:0,changed:true,nearEnd:false,userSent:false})).toBe('end');
  expect(transcriptTarget({count:9,previousCount:8,changed:false,nearEnd:false,userSent:true})).toBe('end');
});
it('does not pull a reader away from older messages when a reply arrives',()=>{
  expect(transcriptTarget({count:10,previousCount:9,changed:false,nearEnd:false,userSent:false})).toBe('preserve');
  expect(transcriptTarget({count:10,previousCount:9,changed:false,nearEnd:true,userSent:false})).toBe('end');
});
it('treats a nearly finished transcript as following the conversation',()=>{
  expect(nearTranscriptEnd(1000,400,580)).toBe(true);
  expect(nearTranscriptEnd(1000,400,200)).toBe(false);
});
