import React from 'react';
import { Check, Image, Key, Mail, Music } from './DearliIcons';
import { creationChecklist } from '../../shared/creationValidation.js';
import { AppConfig } from '../types';

export function CompletionChecklist({config}:{config:AppConfig}) {
 const state=creationChecklist(config);
 return <ul className="completion-checklist" aria-label="Surprise completion checklist">
  {([{key:'details',label:'Details completed',Icon:Key},{key:'photo',label:'Photo added',Icon:Image},{key:'letter',label:'Letter completed',Icon:Mail}] as const).map(({key,label,Icon})=><li key={key} data-complete={state[key]}><span className="completion-mark">{state[key]?<Check size={16}/>:<Icon size={16}/>}</span><span>{label}<span className="sr-only"> — {state[key]?'complete':'needed'}</span></span></li>)}
  <li className="completion-optional"><Music size={16}/><span>Music — optional</span></li>
 </ul>;
}
export function FieldError({name,errors}:{name:string;errors:Record<string,string>}) {
 return errors[name]?<p className="field-error" id={`error-${name}`} role="status">{errors[name]}</p>:null;
}
