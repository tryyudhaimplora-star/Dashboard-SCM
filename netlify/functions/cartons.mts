import { drizzle } from 'drizzle-orm/netlify-db';
import { skuCartons } from '../../db/schema.js';
export default async (req: Request) => {
  const db = drizzle();
  const headers = {'Cache-Control':'no-store'};
  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(skuCartons);
      return Response.json(Object.fromEntries(rows.map(r=>[r.sku,r.qtyPerCtn])),{headers});
    }
    if (req.method === 'PUT') {
      if (req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden',{status:403});
      const body = await req.json();
      if (!body || Array.isArray(body) || typeof body !== 'object') return new Response('Invalid data',{status:400});
      const rows = Object.entries(body).map(([sku,qty])=>({sku,qtyPerCtn:qty as number}));
      if(rows.some(r=>!r.sku || r.sku.length>200 || !Number.isInteger(r.qtyPerCtn) || r.qtyPerCtn<1 || r.qtyPerCtn>1000000)) return new Response('Invalid carton size',{status:400});
      await db.transaction(async tx=>{
        for(const row of rows) await tx.insert(skuCartons).values(row).onConflictDoUpdate({target:skuCartons.sku,set:{qtyPerCtn:row.qtyPerCtn}});
      });
      return Response.json({ok:true},{headers});
    }
    return new Response('Method not allowed',{status:405});
  } catch {
    return Response.json({error:'Data karton belum dapat disimpan. Coba lagi.'},{status:503,headers});
  }
};
