import { Printer, QrCode, X } from 'lucide-react';
import type { DryCleaningOrder } from '../services/dryCleaningService';

interface GarmentTag { id: string; garment: string; service: string; position: number; total: number }

export function DryCleaningGarmentTags({order,onClose,onBack}:{order:DryCleaningOrder;onClose:()=>void;onBack:()=>void}){
 const tags:GarmentTag[]=[];
 const total=order.items.reduce((sum,item)=>sum+item.quantity,0);
 let position=0;
 for(const item of order.items)for(let quantityIndex=0;quantityIndex<item.quantity;quantityIndex+=1){position+=1;tags.push({id:`${order.orderNumber}-${String(position).padStart(3,'0')}`,garment:item.garment,service:item.service,position,total});}
 return <div className="fixed inset-0 z-[85] overflow-y-auto bg-slate-950/70 p-4 print:static print:bg-white print:p-0" role="dialog" aria-modal="true" aria-labelledby="garment-tags-title"><div className="mx-auto mb-4 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-lg print:hidden"><div><p className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><QrCode size={17} className="text-teal-700"/><span id="garment-tags-title">Washable garment labels</span></p><p className="mt-1 text-xs text-slate-500">{tags.length} unique labels for order {order.orderNumber}. Each QR identifies one garment.</p></div><div className="flex gap-2"><button type="button" onClick={onBack} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Back to receipt</button><button type="button" onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white"><Printer size={15}/>Print labels</button><button type="button" onClick={onClose} aria-label="Close labels" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><X size={16}/></button></div></div>
  <div id="dry-cleaning-garment-tags" className="mx-auto grid max-w-3xl grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 lg:grid-cols-3 print:block print:max-w-none">{tags.map(tag=><article key={tag.id} className="dry-cleaning-garment-tag flex h-[30mm] w-[50mm] items-center gap-[1.5mm] overflow-hidden border border-slate-300 bg-white p-[1.5mm] font-mono text-slate-950 shadow print:break-after-page print:border-0 print:shadow-none"><QrCodeSvg value={`smartshop:dry-cleaning:${tag.id}`} label={`QR code for garment ${tag.position} of ${tag.total}`}/><div className="min-w-0 flex-1 leading-tight"><p className="text-[5.5pt] font-bold uppercase tracking-wide text-slate-500">Garment care</p><p className="mt-0.5 break-all text-[4pt] font-medium tracking-tight text-slate-600">{order.orderNumber}</p><p className="mt-0.5 text-[7pt] font-black">ITEM {tag.position}/{tag.total}</p><p className="mt-0.5 truncate text-[6.5pt] font-bold">{tag.garment}</p><p className="truncate text-[5.5pt] text-slate-600">{tag.service}</p></div></article>)}</div>{tags.length===0&&<p className="mx-auto max-w-md rounded-xl bg-white p-6 text-center text-sm text-slate-500">This order does not contain garment quantities to label.</p>}</div>;
}

function QrCodeSvg({value,label}:{value:string;label:string}){const matrix=encodeQr(value);const size=matrix.length;return <svg role="img" aria-label={label} viewBox={`-4 -4 ${size+8} ${size+8}`} className="h-[23mm] w-[23mm] shrink-0 bg-white" shapeRendering="crispEdges"><title>{value}</title><rect x={-4} y={-4} width={size+8} height={size+8} fill="white"/>{matrix.flatMap((row,y)=>row.map((dark,x)=>dark?<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="black"/>:null))}</svg>}

// Fixed QR Version 4-L: 78 byte capacity with 20 Reed–Solomon error-correction codewords.
function encodeQr(value:string):boolean[][]{
 const bytes=Array.from(new TextEncoder().encode(value));
 if(bytes.length>78)throw new Error('Garment label QR value is too long');
 const bits:number[]=[];const append=(number:number,length:number)=>{for(let bit=length-1;bit>=0;bit-=1)bits.push((number>>>bit)&1);};
 append(0b0100,4);append(bytes.length,8);for(const byte of bytes)append(byte,8);
 const capacity=80*8;for(let index=0;index<Math.min(4,capacity-bits.length);index+=1)bits.push(0);while(bits.length%8)bits.push(0);
 const words:number[]=[];for(let offset=0;offset<bits.length;offset+=8){let byte=0;for(let bit=0;bit<8;bit+=1)byte=(byte<<1)|bits[offset+bit]!;words.push(byte);}
 for(let pad=0;words.length<80;pad+=1)words.push(pad%2===0?0xec:0x11);
 const generator=reedSolomonGenerator(20);const remainder=[...words,...Array(20).fill(0)];
 for(let index=0;index<words.length;index+=1){const factor=remainder[index]!;if(factor)for(let term=0;term<generator.length;term+=1)remainder[index+term]^=gfMultiply(generator[term]!,factor);}
 const encoded=[...words,...remainder.slice(words.length)];const size=33;const matrix=Array.from({length:size},()=>Array<boolean>(size).fill(false));const reserved=Array.from({length:size},()=>Array<boolean>(size).fill(false));
 const set=(x:number,y:number,dark:boolean)=>{if(x>=0&&y>=0&&x<size&&y<size){matrix[y]![x]=dark;reserved[y]![x]=true;}};
 const finder=(left:number,top:number)=>{for(let dy=-1;dy<=7;dy+=1)for(let dx=-1;dx<=7;dx+=1){const inside=dx>=0&&dx<=6&&dy>=0&&dy<=6;const dark=inside&&(dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4));set(left+dx,top+dy,dark);}};
 finder(0,0);finder(size-7,0);finder(0,size-7);
 for(let coordinate=8;coordinate<size-8;coordinate+=1){if(!reserved[6]![coordinate])set(coordinate,6,coordinate%2===0);if(!reserved[coordinate]![6])set(6,coordinate,coordinate%2===0);}
 for(let dy=-2;dy<=2;dy+=1)for(let dx=-2;dx<=2;dx+=1)set(26+dx,26+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 set(8,size-8,true);
 const formatPositions:Array<[number,number]>=[];for(let y=0;y<=5;y+=1)formatPositions.push([8,y]);formatPositions.push([8,7],[8,8],[7,8]);for(let x=5;x>=0;x-=1)formatPositions.push([x,8]);for(const [x,y] of formatPositions)reserved[y]![x]=true;
 const secondFormat:Array<[number,number]>=[];for(let x=size-1;x>=size-8;x-=1)secondFormat.push([x,8]);for(let y=size-7;y<size;y+=1)secondFormat.push([8,y]);for(const [x,y] of secondFormat)reserved[y]![x]=true;
 const stream=encoded.flatMap(byte=>Array.from({length:8},(_,i)=>(byte>>(7-i))&1));let streamIndex=0;let upward=true;
 for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vertical=0;vertical<size;vertical+=1){const y=upward?size-1-vertical:vertical;for(let col=0;col<2;col+=1){const x=right-col;if(reserved[y]![x])continue;const bit=stream[streamIndex++]??0;matrix[y]![x]=Boolean(bit^(((x+y)%2===0)?1:0));}}upward=!upward;}
 let format=8<<10;for(let bit=14;bit>=10;bit-=1)if((format>>>bit)&1)format^=0x537<<(bit-10);format=((8<<10)|format)^0x5412;
 for(let index=0;index<15;index+=1){const bit=((format>>>index)&1)!==0;const [x1,y1]=formatPositions[index]!;matrix[y1]![x1]=bit;const [x2,y2]=secondFormat[index]!;matrix[y2]![x2]=bit;}
 matrix[size-8]![8]=true;
 return matrix;
}
function reedSolomonGenerator(degree:number){let polynomial=[1];for(let root=0;root<degree;root+=1){const next=Array(polynomial.length+1).fill(0);for(let index=0;index<polynomial.length;index+=1){next[index]^=polynomial[index]!;next[index+1]^=gfMultiply(polynomial[index]!,gfPower(root));}polynomial=next;}return polynomial;}
function gfPower(power:number){let value=1;for(let index=0;index<power;index+=1)value=gfMultiply(value,2);return value;}
function gfMultiply(left:number,right:number){let result=0;while(right){if(right&1)result^=left;left<<=1;if(left&0x100)left^=0x11d;right>>=1;}return result;}
