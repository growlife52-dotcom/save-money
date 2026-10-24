import Experience from '@/components/experience';
import { decodeVerdict } from '@/lib/judge';
export default async function Home({searchParams}:{searchParams:Promise<{r?:string|string[]}>}) {
 const {r}=await searchParams;
 const encoded=typeof r==='string'?r:null;
 const verdict=encoded?decodeVerdict(encoded):null;
 return <Experience initialVerdict={verdict} initialInvalidLink={!!r&&!verdict}/>;
}
