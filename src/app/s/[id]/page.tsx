import Link from 'next/link';
import { notFound } from 'next/navigation';
import { database } from '@/lib/supabase';
import { parseVerdict } from '@/lib/judge';
import Experience from '@/components/experience';
export const dynamic = 'force-dynamic';
export default async function Shared({params}:{params:Promise<{id:string}>}) {
 const {id} = await params;
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
 let db;
 try { db = database(); } catch { return <main className="notice"><h1>공유 저장소를 확인하고 있어요</h1><p>잠시 뒤 다시 열어 주세요.</p><Link className="primary" href="/">나도 심판받기 →</Link></main>; }
 if (!db) return <main className="notice"><h1>이 결과를 불러올 수 없어요</h1><p>공유 저장소 연결을 확인해 주세요.</p><Link className="primary" href="/">나도 심판받기 →</Link></main>;
 const {data,error} = await db.from('shared_results').select('verdict').eq('id',id).maybeSingle();
 if (error) return <main className="notice"><h1>잠깐, 연결이 끊겼나 봐</h1><p>조금 뒤에 다시 열어줘.</p><Link href="/" className="primary">나도 심판받기 →</Link></main>;
 const verdict = parseVerdict(data?.verdict);
 if (!verdict) notFound();
 return <Experience initialVerdict={verdict}/>;
}
