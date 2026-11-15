import React from 'react';
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };
const icon = (name: string, d: string) => { const Icon = ({size=24, ...props}: IconProps) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={props['aria-label'] ? undefined : true} {...props}><path d={d}/></svg>; Icon.displayName=name; return Icon; };
export const Heart=icon('Heart', 'M12 20 4.4 12.6C.6 8.8 5.8 2.5 12 8c6.2-5.5 11.4.8 7.6 4.6Z');
export const Mail=icon('Mail', 'M3 5.5h18v13H3z M3 6l9 7 9-7 M3 18l6-6 M21 18l-6-6');
export const Gift=icon('Gift', 'M3 9h18v4H3z M5 13v8h14v-8 M12 9v12 M12 9C4 9 5 1 9 4l3 5c8 0 7-8 3-5Z');
export const Music=icon('Music', 'M9 17V5l11-2v12 M9 8l11-2 M9 17c-6-3-8 5-3 4 2 0 3-2 3-4 M20 15c-6-3-8 5-3 4 2 0 3-2 3-4');
export const Key=icon('Key', 'M14 11a5 5 0 1 0-3-3 M14 5l-9 15H2v-3l3-1v-3l6-5');
export const Settings=icon('Settings', 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6');
export const Image=icon('Image', 'M3 4h18v16H3z M3 16l5-6 5 5 3-3 5 6 M16 7h.01');
export const Sparkles=icon('Sparkles', 'M12 2c0 6-4 10-10 10 6 0 10 4 10 10 0-6 4-10 10-10-6 0-10-4-10-10Z');
export const Share2=icon('Share2', 'M8 12h12 M16 8l4 4-4 4 M11 4H4v16h7');
export const Camera=icon('Camera', 'M3 7h4l2-3h6l2 3h4v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0');

export const Trash=icon('Trash', 'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7');
