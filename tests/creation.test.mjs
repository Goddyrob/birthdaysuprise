import {test} from 'node:test';
import assert from 'node:assert/strict';
import {creationErrors,creationChecklist,withCreatorCover} from '../shared/creationValidation.js';
import {DEFAULT_CONFIG} from '../src/data/defaultData.ts';
const complete=()=>({...DEFAULT_CONFIG,recipientName:'QA recipient',senderName:'QA sender',sealColor:'wine',mainPhoto:'data:image/png;base64,iVBORw0KGgo=',galleryPhotos:[],letterBody:['A personal message written for this isolated verification.']});
test('sample-only content cannot create a surprise',()=>{const e=creationErrors(DEFAULT_CONFIG);for(const key of ['recipientName','senderName','mainPhoto','letterBody'])assert.ok(e[key]);});
test('photos only, missing photo and missing letter are blocked independently',()=>{
 const c=complete();assert.ok(creationErrors({...DEFAULT_CONFIG,mainPhoto:c.mainPhoto}).letterBody);
 assert.ok(creationErrors({...c,mainPhoto:'/default-surprise.svg'}).mainPhoto);
 assert.ok(creationErrors({...c,letterBody:['   ']}).letterBody);
 assert.ok(creationErrors({...c,letterBody:DEFAULT_CONFIG.letterBody}).letterBody);
});
test('a complete surprise accepts optional captions and no uploaded music',()=>{const c=complete();delete c.customAudioUrl;assert.deepEqual(creationErrors(c),{});assert.deepEqual(creationChecklist(c),{details:true,photo:true,letter:true,envelope:true});});
test('owned gallery upload satisfies the photo requirement before or after upload',()=>{for(const url of [complete().mainPhoto,'storage:a0c330b4-5120-4d6a-99e9-8427dbfce98a/gallery.png'])assert.deepEqual(creationErrors({...complete(),mainPhoto:'/default-surprise.svg',galleryPhotos:[{id:'qa',url,caption:''}]}),{});});
test('whitespace, short letters, malformed codes and external demo photos fail safely',()=>{const c=complete();for(const patch of [{recipientName:'  '},{senderName:'  '},{passcode:'abcd'},{letterBody:['   tiny   ']},{mainPhoto:'https://example.com/demo.jpg'}])assert.ok(Object.keys(creationErrors({...c,...patch})).length);});
test('gallery-only creation uses the first personal photo for the public cover without changing the draft',()=>{const c={...complete(),mainPhoto:'/default-surprise.svg',galleryPhotos:[{url:complete().mainPhoto}]};assert.equal(withCreatorCover(c).mainPhoto,complete().mainPhoto);assert.equal(c.mainPhoto,'/default-surprise.svg');});
test('new links require an explicit envelope choice and free Wine satisfies it without any ad field',()=>{const c=complete();assert.ok(creationErrors({...c,sealColor:undefined}).sealColor);assert.equal(creationChecklist({...c,sealColor:undefined}).envelope,false);assert.deepEqual(creationErrors({...c,sealColor:'wine'}),{});});
