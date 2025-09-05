import { sbServer } from '@/lib/supabase/server';
export async function runScheduler(limit=5){
  const sb=sbServer(true);
  const now=new Date().toISOString();
  const { data: jobs, error }=await sb.from('scheduled_jobs').select('id,post_id,channel_id,run_at,status,attempts').lte('run_at',now).eq('status','pending').order('run_at',{ascending:true}).limit(limit);
  if(error) throw error;
  if(!jobs?.length) return {picked:0,ok:true};
  const ids=jobs.map(j=>j.id);
  await sb.from('scheduled_jobs').update({status:'processing'}).in('id',ids);
  for(const job of jobs){
    await sb.from('publish_results').insert({job_id:job.id, external_post_id:'mock_'+job.id, status:'succeeded', meta:{}});
    await sb.from('scheduled_jobs').update({status:'succeeded'}).eq('id',job.id);
  }
  return {picked:jobs.length,ok:true};
}