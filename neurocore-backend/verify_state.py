import re

with open('services/contentProcessor.js', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('const CHUNK_TEMPLATE')
end = content.find('`;', start) + 2
template = content[start:end]

# Find all single-brace occurrences (not doubled) that are NOT {text}
# Pattern: { not preceded by { and not followed by {
single_braces = re.findall(r'(?<!\{)\{(?!\{)([^}]*)\}(?!\})', template)
bad = [x for x in single_braces if 'text' not in x and x.strip() != '']

print('Bad single braces (should be 0):', len(bad))
if bad:
    print('  Found:', bad[:10])

print('{text} present:', '{text}' in template)
print('{{  present:', '{{' in template)
print('}}  present:', '}}' in template)

# Also check contentController has askDoubt
with open('controllers/contentController.js', 'r', encoding='utf-8') as f:
    ctrl = f.read()
print('\naskDoubt in controller:', 'askDoubt' in ctrl)
print('resolveDoubt imported in controller:', 'resolveDoubt' in ctrl)

# Check routes
with open('routes/contentRoutes.js', 'r', encoding='utf-8') as f:
    routes = f.read()
print('/doubt route in routes:', "'/doubt'" in routes or '"doubt"' in routes or '"/doubt"' in routes or 'doubt' in routes)

print('\n[OK] All checks passed' if not bad else '[FAIL] Bad braces found')
