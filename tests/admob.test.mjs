import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RewardRequest} from '../src/utils/ads.ts';

const status={supported:true,unlocked:false,privacyOptionsRequired:false,canRequestAds:true,busy:false,testMode:true};
test('reward requests ignore repeated taps while the native ad is active',async()=>{
 let calls=0,finish;const request=new RewardRequest({requestReward:()=>{calls++;return new Promise(r=>finish=r)}});
 const first=request.run(true);assert.equal(await request.run(true),null);assert.equal(calls,1);
 finish({...status,earned:false,reason:'dismissed'});assert.equal((await first).earned,false);
});
test('dismissal, load failure and consent failure never acknowledge an earned reward',async()=>{
 for(const reason of ['dismissed','unavailable','consent_unavailable','cancelled']){
  const request=new RewardRequest({requestReward:async()=>({...status,earned:false,reason})});
  const result=await request.run(true);assert.equal(result.earned,false);assert.equal(result.unlocked,false);
 }
});
test('a native earned completion is acknowledged exactly once',async()=>{
 const request=new RewardRequest({requestReward:async()=>({...status,unlocked:true,earned:true,completionId:'native-completion'})});
 assert.equal((await request.run(true)).earned,true);assert.equal((await request.run(true)).earned,false);
});
test('an earned response with no native completion ID is not acknowledged',async()=>{
 const request=new RewardRequest({requestReward:async()=>({...status,earned:true})});assert.equal((await request.run(true)).earned,false);
});
test('bridge failure releases the request guard so a later retry works',async()=>{
 let first=true;const request=new RewardRequest({requestReward:async()=>{if(first){first=false;throw Error('offline')}return {...status,earned:false,reason:'dismissed'}}});
 await assert.rejects(()=>request.run(true));assert.equal((await request.run(true)).earned,false);
});
