import React, {useEffect} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {Mail} from './DearliIcons';
export const FloralTransition=({isActive,onComplete}:{isActive:boolean;onComplete:()=>void})=>{const reduced=useReducedMotion();useEffect(()=>{if(!isActive)return;const timer=window.setTimeout(onComplete,reduced?0:650);return()=>clearTimeout(timer)},[isActive,onComplete,reduced]);return isActive?<motion.div className="unfold-transition" initial={{opacity:0}} animate={{opacity:1}} role="status"><Mail size={48}/><p>Something just for you.</p></motion.div>:null;};
