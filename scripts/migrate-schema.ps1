# Script to migrate schema.sql to use AutoPostVN schema

$schemaFile = "supabase\schema.sql"
$content = Get-Content $schemaFile -Raw

# Replace table references
$content = $content -replace 'create table if not exists (?!\"AutoPostVN\")([a-zA-Z_]+)', 'create table if not exists "AutoPostVN".$1'

# Replace foreign key references
$content = $content -replace 'references ([a-zA-Z_]+)\(', 'references "AutoPostVN".$1('

# Replace view references
$content = $content -replace 'create or replace view ([a-zA-Z_]+)', 'create or replace view "AutoPostVN".$1'

# Replace function references in triggers
$content = $content -replace 'on ([a-zA-Z_]+) before', 'on "AutoPostVN".$1 before'
$content = $content -replace 'on ([a-zA-Z_]+) after', 'on "AutoPostVN".$1 after'

# Replace insert statements
$content = $content -replace 'insert into ([a-zA-Z_]+)', 'insert into "AutoPostVN".$1'

# Replace grant statements
$content = $content -replace 'grant .* on ([a-zA-Z_]+)', 'grant $& on "AutoPostVN".$1'

# Replace policy references
$content = $content -replace 'on ([a-zA-Z_]+) for', 'on "AutoPostVN".$1 for'
$content = $content -replace 'on ([a-zA-Z_]+) using', 'on "AutoPostVN".$1 using'

Set-Content $schemaFile $content

Write-Host "Schema updated to use AutoPostVN namespace"
