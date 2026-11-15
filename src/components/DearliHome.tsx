import { DeveloperCredit } from './DeveloperCredit';
import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Gift, Mail, Key, Music } from './DearliIcons';
export function DearliHome({onCreate,onDemo}:{onCreate:()=>void;onDemo:()=>void}) {
 return <section className="dearli-home">
  <header className="dearli-masthead"><a href="/" aria-label="Dearli home"><img src="/icon.svg" alt="" width="32" height="32"/>dearli<span className="brand-period">.</span></a><span>A little closer.</span></header>
  <div className="home-composition"><div className="home-copy"><p className="eyebrow">FOR ONE PERSON. FROM YOU.</p><h1>Some things<br/>deserve a<br/><em>little ceremony.</em></h1><p className="home-description">A letter, a few memories, a song that says it better. Make a surprise they can unfold, one moment at a time.</p><button className="dearli-primary" onClick={onCreate}>Make something personal <ArrowRight size={20}/></button><button className="dearli-demo" onClick={onDemo}>Open a sample surprise <ArrowUpRight size={18}/></button><p className="home-footnote"><Key size={15}/>A private link. A passcode you choose.</p></div>
  <div className="home-art" aria-hidden="true"><div className="art-caption">A NOTE FOR SOMEONE WHO MATTERS</div><svg viewBox="0 0 420 420" className="correspondence-art"><path d="M28 174 212 48l180 126v204H28Z" fill="#d5c6b0" stroke="#b5a48b"/><path d="M73 91h274v246H73Z" fill="#fffdf6" stroke="#d9cdbb"/><path d="M98 120h85 M98 138h54 M98 186h206 M98 203h174 M98 220h192" stroke="#c7bba7" strokeWidth="2"/><path d="M111 273c23-36 45 28 63-4s36-9 48-14" stroke="#722d40" strokeWidth="2" fill="none"/><path d="m28 174 184 128 180-128v204H28Z" fill="#e9ddc9" stroke="#b5a48b"/><path d="m28 378 152-120 M392 378 242 258" stroke="#c0ae93"/><circle cx="211" cy="299" r="31" fill="#722d40"/><path d="m211 313-13-13c-10-11 3-20 13-10 10-10 23-1 13 10Z" fill="none" stroke="#fff7e6" strokeWidth="2"/></svg><div className="art-number">01 / A SMALL GESTURE, KEPT FOREVER</div></div></div>
  <footer className="home-index"><span><Mail size={18}/>Words only you could write</span><span><Gift size={18}/>Moments worth keeping</span><span><Music size={18}/>A soundtrack for the two of you</span></footer>
 <DeveloperCredit /></section>;
}
