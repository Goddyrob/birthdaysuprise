import React, { useEffect, useRef, useState } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { hasNativeAds, nativeAds, RewardRequest, SEAL_COLORS, unavailableAds } from '../utils/ads';
import type { SealColor } from '../utils/ads';
import { musicPlayer } from '../utils/audio';

export function CreatorReward({ color, onColor }: { color?: SealColor; onColor: (color: SealColor) => void }) {
  const [status, setStatus] = useState(unavailableAds);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [message, setMessage] = useState('');
  const runner = useRef(new RewardRequest(nativeAds));
  const ownsRequest = useRef(false);
  const alive = useRef(true);
  const intendedColor = useRef<SealColor | null>(null);
  useEffect(() => {
    alive.current = true;
    if (!hasNativeAds()) return;
    let live = true;
    const handles: PluginListenerHandle[] = [];
    const track = async (promise: Promise<PluginListenerHandle>) => { const h = await promise; if (live && alive.current) handles.push(h); else void h.remove(); };
    void nativeAds.getStatus().then(s => { if (alive.current) setStatus(s); }).catch(() => {});
    void track(nativeAds.addListener('rewardEarned', s => { if (alive.current) {setStatus(s);if(s.unlocked && intendedColor.current){onColor(intendedColor.current);intendedColor.current=null;}} }));
    void track(nativeAds.addListener('consentChanged', s => { if (alive.current) setStatus(s); }));
    void track(nativeAds.addListener('adState', s => { if (alive.current) setPhase(s.phase); }));
    return () => { live = false; alive.current = false; for (const h of handles) void h.remove(); if (ownsRequest.current) void nativeAds.cancelReward().catch(() => {}); };
  }, []);
  const watch = async () => {
    if (ownsRequest.current || busy || !adult || status.unlocked) return;
    ownsRequest.current = true; setBusy(true); setMessage('');
    // Pause creator preview music before any consent form or ad; never compete with ad audio.
    musicPlayer.pause();
    try {
      const result = await runner.current.run(adult);
      if (!alive.current || !result) return;
      setStatus(result);
      if(result.earned && intendedColor.current){onColor(intendedColor.current);intendedColor.current=null;}
      setMessage(result.earned ? 'Sage and antique gold seals are unlocked on this device.' : result.reason === 'offline' ? 'You’re offline. You can keep creating and save a draft; try the optional ad when you reconnect.' : result.reason === 'dismissed' || result.reason === 'cancelled' ? 'No reward was earned. Your surprise and draft are unchanged.' : result.reason === 'consent_unavailable' ? 'Ad consent could not be completed. You can keep creating without an ad.' : result.reason === 'already_unlocked' ? 'Your extra seal colors are already unlocked.' : 'The optional ad is unavailable. You can keep creating and try again later.');
    } catch { if (alive.current) setMessage('The optional ad is unavailable. Your draft is safe; keep creating.'); }
    finally { ownsRequest.current = false; if (alive.current) { setBusy(false); setPhase(''); } }
  };
  return <section className="creator-reward" aria-labelledby="seal-title">
    <h3 id="seal-title">Envelope seal</h3>
    <p>Choose a finishing touch before creating your link. Wine is free. {hasNativeAds() ? 'Sage and antique gold are optional extras: complete one rewarded ad to unlock both on this device.' : 'Extra rewarded colors are available in the Android app. You can create and share here with Wine.'}</p>
    <div className="seal-choices" role="group" aria-label="Envelope seal color">
      {(Object.keys(SEAL_COLORS) as SealColor[]).map(value => <button type="button" key={value} data-creation-field={value==='wine'?'sealColor':undefined} aria-label={value==='gold'?'Antique gold':value[0].toUpperCase()+value.slice(1)} aria-pressed={color === value} disabled={(busy && value!=='wine') || (!hasNativeAds() && value !== 'wine' && !status.unlocked && color!==value)} onClick={() => {if(value==='wine'||status.unlocked||color===value){intendedColor.current=null;if(value==='wine' && ownsRequest.current)void nativeAds.cancelReward().catch(()=>{});onColor(value);setMessage('');}else{intendedColor.current=value;setMessage('To choose this extra color, confirm you’re 18 or older and complete the optional rewarded ad below. Wine is available free at any time.');}}}><span className="seal-swatch" style={{ background: SEAL_COLORS[value] }} aria-hidden="true"/>{value === 'gold' ? 'Antique gold' : value[0].toUpperCase() + value.slice(1)}{value==='wine'&&<small aria-hidden="true">Free</small>}{value!=='wine'&&!status.unlocked&&color!==value&&<small aria-hidden="true">{hasNativeAds()?'Optional ad':'Android'}</small>}</button>)}
    </div>
    {hasNativeAds() && !status.unlocked && <>
      <label className="ad-adult-confirm"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} disabled={busy}/>I’m 18 or older and want to use optional rewarded ads.</label>
      <button className="reward-watch" type="button" disabled={!adult || busy || status.busy} onClick={() => void watch()}>{busy ? phase === 'showing' ? 'Ad is showing…' : 'Preparing optional ad…' : status.testMode ? 'Watch a test ad to unlock seal colors' : 'Watch an ad to unlock seal colors'}</button>
      {busy && phase !== 'showing' && <button type="button" className="reward-cancel" onClick={() => void nativeAds.cancelReward()}>Cancel ad request</button>}
    </>}
    {status.unlocked && <p className="reward-unlocked">Extra seal colors unlocked on this device.</p>}
    <p className="reward-note">Closing an ad early does not unlock colors. Creating, saving and sharing never require an ad. Recipients see no ads.</p>
    {message && <p role="status" className="reward-message">{message}</p>}
  </section>;
}

/** Kept in creator Settings on every tab, rather than inside recipient scenes. */
export function AdPrivacyOptions() {
  const [required, setRequired] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!hasNativeAds()) return;
    let live = true; let handle: PluginListenerHandle | undefined;
    void nativeAds.getStatus().then(s => { if (live) setRequired(s.privacyOptionsRequired); }).catch(() => {});
    void nativeAds.addListener('consentChanged', s => { if (live) setRequired(s.privacyOptionsRequired); }).then(h => { if (live) handle = h; else void h.remove(); });
    return () => { live = false; void handle?.remove(); };
  }, []);
  if (!hasNativeAds()) return null;
  return <section className="ad-privacy" aria-label="Advertising privacy"><p>Optional ads are provided by Google. Ad services may process device identifiers, approximate location from IP address, ad interactions and diagnostics. Dearli does not send your photos, letter, audio or passcode as ad targeting data.</p>
    {required && <button type="button" disabled={busy} onClick={async () => { if (busy) return; setBusy(true); try { const s = await nativeAds.showPrivacyOptions(); setRequired(s.privacyOptionsRequired); setMessage('Privacy choices updated.'); } catch { setMessage('Privacy choices could not be opened. Please try again later.'); } finally { setBusy(false); } }}>Ad privacy options</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
