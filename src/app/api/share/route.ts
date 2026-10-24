import { NextResponse } from 'next/server';
import { parseVerdict } from '@/lib/judge';
import { database } from '@/lib/supabase';
export async function POST(request: Request) {
 const protocol = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':','');
 const expectedOrigin = `${protocol}://${request.headers.get('host')}`;
 if (request.headers.get('origin') !== expectedOrigin) return NextResponse.json({error:'허용되지 않은 요청입니다.'},{status:403});
 if (Number(request.headers.get('content-length') ?? 0) > 4096) return NextResponse.json({error:'요청이 너무 큽니다.'},{status:413});
 let body;
 try { const raw = await request.text(); if (raw.length > 4096) return NextResponse.json({error:'요청이 너무 큽니다.'},{status:413}); body = JSON.parse(raw); }
 catch { return NextResponse.json({error:'잘못된 요청입니다.'},{status:400}); }
 const verdict = parseVerdict(body);
 if (!verdict) return NextResponse.json({error:'유효한 결과가 아닙니다.'},{status:400});
 let db;
 try { db = database(); } catch { return NextResponse.json({error:'공유 저장소 설정을 확인해 주세요.'},{status:503}); }
 if (!db) return NextResponse.json({mode:'portable'});
 const {data,error} = await db.from('shared_results').insert({verdict}).select('id').single();
 if (error) return NextResponse.json({error:'공유 저장에 실패했어요. 잠시 뒤 다시 시도해 주세요.'},{status:503});
 return NextResponse.json({id:data.id,mode:'database'});
}
