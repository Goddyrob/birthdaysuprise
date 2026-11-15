import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
// All persistence is isolated in memory. Never load or contact a real Supabase project.
const records=new Map(), sessions=new Map();let failSigning=false;
const stub=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');let raw='';for await(const b of req)raw+=b;
 res.setHeader('Content-Type','application/json');
 const send=(code,data)=>{res.statusCode=code;res.end(JSON.stringify(data))};
 if(u.pathname.startsWith('/storage/v1/object/sign/'))return failSigning?send(500,{message:'Test signing unavailable'}):send(200,{signedURL:'/object/sign/test-only?token=isolated'});
 if(u.pathname.startsWith('/storage/v1/object/'))return send(200,{Key:u.pathname});
 const table=u.pathname.split('/').pop();const map=table==='admin_sessions'?sessions:records;
 if(req.method==='POST'){const row=JSON.parse(raw);row.created_at||=new Date().toISOString();map.set(row.id||row.token_hash,row);return send(201,req.headers.accept?.includes('object')?row:[row])}
 let rows=[...map.values()];for(const [key,val]of u.searchParams){if(val.startsWith('eq.'))rows=rows.filter(r=>r[key]===val.slice(3));if(val.startsWith('lt.'))rows=rows.filter(r=>r[key]<val.slice(3));if(val.startsWith('gte.'))rows=rows.filter(r=>r[key]>=val.slice(4))}
 if(req.method==='DELETE'){for(const row of rows)map.delete(row.id||row.token_hash);return send(200,[])}
 res.setHeader('Content-Range',`0-${Math.max(0,rows.length-1)}/${rows.length}`);
 const selected=u.searchParams.get('select');rows=rows.map(r=>selected?.includes('preview_photo:')?{id:r.id,recipient_name:r.recipient_name,sender_name:r.sender_name,created_at:r.created_at,passcode_length:r.passcode_length,preview_photo:r.configuration.mainPhoto}:r);
 return send(200,req.headers.accept?.includes('object')?(rows[0]||null):rows);
});
await new Promise(r=>stub.listen(0,'127.0.0.1',r));
process.env.SUPABASE_URL=`http://127.0.0.1:${stub.address().port}`;
process.env.SUPABASE_SERVICE_ROLE_KEY='local-isolated-test-only';
process.env.DOTENV_CONFIG_PATH='__dearli_no_production_env__';
const bcrypt=(await import('bcryptjs')).default;
process.env.ADMIN_PASSWORD_HASH=await bcrypt.hash('local-owner-test',4);
const {default:app}=await import('../server/app.js');
const {validateConfig}=await import('../server/supabase.js');
const {audioFileError}=await import('../src/utils/mediaFiles.ts');
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
after(()=>{server.closeAllConnections();server.close();stub.closeAllConnections();stub.close()});
const origin=`http://127.0.0.1:${server.address().port}`;
const request=(url,body,headers={})=>fetch(origin+url,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
const config=()=>({recipientName:'Dearli QA recipient',senderName:'QA sender',mainPhoto:'/default-surprise.svg',passcode:'12345678',cakeHeading:'Cut the cake',cakeCelebrationText:'A little celebration',letterTitle:'QA letter',letterGreeting:'Hello',letterBody:['TEST CONTENT ONLY'],letterClosing:'With care',galleryPhotos:[],polaroidText:'QA',musicTitle:'QA'});
const png='data:image/png;base64,iVBORw0KGgo=';
let id;
test('health and mobile CORS are explicit; unrelated origins receive no permission',async()=>{
 assert.equal((await request('/api/health')).status,200);
 for(const [o,expected]of [['https://localhost','https://localhost'],['https://untrusted.invalid',null]]){const r=await fetch(origin+'/api/surprises',{method:'OPTIONS',headers:{Origin:o,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-request-id'}});assert.equal(r.headers.get('access-control-allow-origin'),expected);if(expected){assert.equal(r.status,204);assert.match(r.headers.get('access-control-allow-headers'),/X-Request-ID/i);assert.match(r.headers.get('access-control-expose-headers'),/X-Request-ID/i)}}
});
test('required personalization fields reject blank or oversized values',()=>{for(const field of ['recipientName','senderName','cakeHeading','cakeCelebrationText','letterTitle','letterGreeting','letterClosing'])for(const value of ['', ' '.repeat(3),'x'.repeat(4001)])assert.throws(()=>validateConfig({...config(),[field]:value}),{statusCode:400})});
test('passcode accepts only 4–12 digits',()=>{for(const p of ['1234','123456789012'])assert.doesNotThrow(()=>validateConfig({...config(),passcode:p}));for(const p of ['123','1234567890123','abcd','12 34',1234])assert.throws(()=>validateConfig({...config(),passcode:p}),{statusCode:400})});
test('letter and gallery limits reject malformed or excessive content',()=>{for(const patch of [{letterBody:'bad'},{letterBody:Array(13).fill('x')},{letterBody:[{}]},{galleryPhotos:Array(31).fill({})},{galleryPhotos:[null]},{galleryPhotos:[{id:'x',url:'javascript:alert(1)',caption:'x'}]}])assert.throws(()=>validateConfig({...config(),...patch}),{statusCode:400})});
test('media types, encodings and size limits reject invalid payloads',()=>{for(const src of ['javascript:alert(1)','data:text/html;base64,YQ==','data:image/png;base64,!!!!'])assert.throws(()=>validateConfig({...config(),mainPhoto:src}),{statusCode:400});assert.throws(()=>validateConfig({...config(),mainPhoto:'data:image/png;base64,'+'AAAA'.repeat(3_000_000)}),{statusCode:413})});
test('audio file validation covers empty, oversized and unsupported selections',()=>{assert.equal(audioFileError({type:'audio/wav',size:100}),null);for(const file of [{type:'text/html',size:1},{type:'audio/mpeg',size:0},{type:'audio/mpeg',size:16*1024*1024}])assert.equal(typeof audioFileError(file),'string')});
test('malformed JSON returns a safe structured error',async()=>{const r=await fetch(origin+'/api/surprises',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(r.status,400);assert.equal((await r.json()).code,'INVALID_REQUEST')});
test('creation validates through HTTP and persists only hashed passcodes',async()=>{assert.equal((await request('/api/surprises',{config:{}})).status,400);id=randomUUID();const r=await request('/api/surprises',{config:config(),creationId:id});assert.equal(r.status,201);assert.equal((await r.json()).id,id);assert.equal(records.get(id).configuration.passcode,undefined);assert.match(records.get(id).passcode_hash,/^\$2/)});
test('retrying creation ID returns the same surprise without another insert',async()=>{const size=records.size;const r=await request('/api/surprises',{config:config(),creationId:id});assert.equal(r.status,201);assert.equal((await r.json()).id,id);assert.equal(records.size,size)});
test('metadata does not expose letter, passcode hash or locked configuration',async()=>{const r=await request('/api/surprises/'+id);assert.equal(r.status,200);const json=await r.json();assert.equal(json.config,undefined);assert.equal(json.configuration,undefined);assert.equal(json.passcode_hash,undefined);assert.equal(json.passcodeLength,8)});
test('wrong passcode fails; correct passcode returns the intended letter without passcode',async()=>{assert.equal((await request('/api/surprises/'+id+'/unlock',{passcode:'0000'})).status,401);const r=await request('/api/surprises/'+id+'/unlock',{passcode:'12345678'});assert.equal(r.status,200);const json=await r.json();assert.equal(json.config.letterBody[0],'TEST CONTENT ONLY');assert.equal(json.config.passcode,'')});
test('missing and malformed surprise IDs do not expose data',async()=>{for(const key of ['not-a-uuid',randomUUID()])assert.equal((await request('/api/surprises/'+key)).status,404)});
test('media upload returns a private storage reference',async()=>{const r=await request('/api/surprises/media',{creationId:randomUUID(),files:[{key:'main',kind:'image',dataUrl:png}]});assert.equal(r.status,200);assert.match((await r.json()).media[0].reference,/^storage:/)});
test('published surprise media cannot be overwritten without authorization',async()=>{const r=await request('/api/surprises/media',{creationId:id,files:[{key:'main',kind:'image',dataUrl:png}]});assert.equal(r.status,409)});
test('foreign draft media references and wrong upload kinds are rejected',async()=>{const r=await request('/api/surprises',{creationId:randomUUID(),config:{...config(),mainPhoto:`storage:${id}/main.png`}});assert.equal(r.status,400);assert.equal((await request('/api/surprises/media',{creationId:randomUUID(),files:[{key:'main',kind:'audio',dataUrl:png}]})).status,400)});
test('expired/unavailable signed media produces a safe recoverable server error',async()=>{const row=records.get(id);const old=row.configuration.mainPhoto;row.configuration.mainPhoto=`storage:${id}/main.png`;failSigning=true;const r=await request('/api/surprises/'+id);assert.equal(r.status,502);assert.equal((await r.json()).error,'Unable to load surprise');failSigning=false;row.configuration.mainPhoto=old});
test('owner endpoints reject unauthenticated requests',async()=>{for(const p of ['session','overview','surprises','analytics','errors'])assert.equal((await request('/api/admin/'+p)).status,401)});
test('isolated owner login/session/list/analytics/logout flow',async()=>{assert.equal((await request('/api/admin/login',{password:'wrong'})).status,401);const r=await request('/api/admin/login',{password:'local-owner-test'});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];for(const p of ['session','overview','surprises','analytics','errors'])assert.equal((await request('/api/admin/'+p,undefined,{Cookie:cookie})).status,200);assert.equal((await request('/api/admin/logout',{}, {Cookie:cookie})).status,204);assert.equal((await request('/api/admin/session',undefined,{Cookie:cookie})).status,401)});
test('unlock retry limit eventually returns 429',async()=>{const missing=randomUUID();let status;for(let i=0;i<12;i++)status=(await request('/api/surprises/'+missing+'/unlock',{passcode:'0000'})).status;assert.equal(status,429)});

 test('media retries reuse content-addressed private paths',async()=>{const creationId=randomUUID();const files=[{key:'main',kind:'image',dataUrl:png}];const first=await request('/api/surprises/media',{creationId,files});const second=await request('/api/surprises/media',{creationId,files});assert.equal(first.status,200);assert.equal(second.status,200);const a=await first.json(),b=await second.json();assert.equal(a.media[0].reference,b.media[0].reference);assert.match(a.media[0].reference,/main-[0-9a-f]{24}\.png$/)});
