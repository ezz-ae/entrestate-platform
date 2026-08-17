import fs from 'node:fs'
import pg from 'pg'
const env = fs.readFileSync('/Users/mahmoudezz/Documents/Entrestate/.env.local','utf8')
const url = env.split('\n').find(l=>l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).replace(/^["']|["']$/g,'')
const c = new pg.Client({connectionString:url})
await c.connect()
const q = async (t,p=[])=> (await c.query(t,p)).rows
console.log('current_schema', await q('select current_schema(), current_database()'))
console.log('shared tables', await q(`select
  to_regclass('public.freehold_site_developer_profiles')::text as dev,
  to_regclass('public.freehold_site_blog_posts')::text as blog,
  to_regclass('public.freehold_site_projects')::text as proj,
  to_regclass('public.freehold_site_area_profiles')::text as area`))
console.log('schemas', await q(`select nspname from pg_namespace where nspname not like 'pg_%' and nspname <> 'information_schema' order by 1`))
console.log('tenant rows', await q(`select to_regclass('public.saas_tenants')::text`))
