import React,{useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {playPullCordSound,playLampIgniteSound} from '../utils/audio';
export const LampScene=({onComplete}:{onComplete:()=>void})=>{
 const [lit,setLit]=useState(false);const reduced=useReducedMotion();const start=useRef<number|null>(null);
 useEffect(()=>{if(!lit)return;const timer=window.setTimeout(onComplete,reduced?200:1200);return()=>clearTimeout(timer)},[lit,onComplete,reduced]);
 const turnOn=()=>{if(lit)return;playPullCordSound();playLampIgniteSound();setLit(true)};
 return <section className="dearli-scene lamp-scene"><p className="eyebrow scene-eyebrow">01 / A LITTLE LIGHT</p><div className={lit?'pendant is-lit':'pendant'}>
 <svg viewBox="0 0 300 350" aria-hidden="true"><path d="M150 0v125" stroke="#756b63" strokeWidth="2"/><path d="M100 130h100l57 120H43Z" fill="#d8c4a1" stroke="#8c7961" strokeWidth="2"/><path d="M43 250h214" stroke="#8c7961" strokeWidth="3"/><path d="M130 250c0 40 40 40 40 0" fill={lit?'#f7d886':'#fffdf8'} stroke="#8c7961" strokeWidth="2"/><path d="M200 250v66" stroke="#756b63" strokeWidth="1.5"/></svg>
 <button className="lamp-cord" onClick={turnOn} aria-label="Turn on the lamp" disabled={lit} onPointerDown={e=>{start.current=e.clientY;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={e=>{if(start.current!==null&&e.clientY-start.current>25)turnOn();start.current=null}}><span/></button></div>
 <motion.div initial={{opacity:0}} animate={{opacity:1}} className="scene-instruction"><h1>{lit?'A little brighter, with you.':'Every good story starts with a spark.'}</h1><p>{lit?'Your next moment is waiting…':'Pull the cord, or tap its handle.'}</p></motion.div></section>;
};
