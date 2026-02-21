import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";
const p = new PrismaClient();
(async()=>{
  const user=await p.user.findUnique({where:{email:'admin@starringcapital.com'}});
  if(!user){console.log('NO'); return;}
  const dateFilter=subDays(new Date(),90);
  const sessions=await p.testSession.findMany({
    where:{userId:user.id,status:'COMPLETED',createdAt:{gte:dateFilter}},
    orderBy:{createdAt:'asc'},
    include:{dimensionScores:true,avatarToken:true},
  });
  const chart=sessions.map(s=>({
    createdAt:s.createdAt,
    mbti:s.mbtiType,
    ds:Object.fromEntries(s.dimensionScores.map(d=>[d.dimension,d.normalizedScore]))
  }));
  console.log('sessions',sessions.length);
  console.log(JSON.stringify(chart.slice(0,3),null,2));
  console.log(JSON.stringify(chart.slice(-3),null,2));
  await p.$disconnect();
})();
