#!/usr/bin/env python3
"""Trekker ut innholdet fra sidene til data.js, som øvingsmotoren bruker.
Kjør på nytt hver gang innholdet på en side endres:  python3 build/extract.py"""
import json, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def raw_of(path, varname='RAW'):
    s = open(os.path.join(ROOT, path), encoding='utf-8').read()
    m = re.search(r'const %s(?:_[A-Z])? = ("(?:[^"\\]|\\.)*");' % varname, s)
    if m:
        return json.loads(m.group(1))
    m = re.search(r'const %s = `([^`]*)`;' % varname, s)
    if m:
        return m.group(1)
    raise SystemExit('fant ikke %s i %s' % (varname, path))

def rows(raw, cols):
    """Leser linjer delt med |. Overskrifter starter med #, notater med >."""
    out, sec = [], ''
    for line in raw.split('\n'):
        line = line.rstrip()
        if not line: continue
        if line.startswith('@@'): continue
        if line.startswith('#'):
            sec = line.lstrip('#').strip(); continue
        if line.startswith('>'): continue
        parts = line.split('|')
        if len(parts) < 2: continue
        item = {'sec': sec}
        for i, name in enumerate(cols):
            item[name] = parts[i].strip() if i < len(parts) else ''
        out.append(item)
    return out

def blocks(raw):
    """basico.html er delt i @@NUM / @@COL / @@TID."""
    out = {}
    for chunk in raw.split('@@'):
        chunk = chunk.strip()
        if not chunk: continue
        nl = chunk.find('\n')
        out[chunk[:nl].strip()] = chunk[nl+1:]
    return out

data = {}

# ordliste: norsk|portugisisk
data['ord'] = rows(raw_of('ordliste.html'), ['no', 'pt'])

# A1 og A2: spørsmål|portugisisk|svar|svar på portugisisk
for lvl, f in (('a1', 'a1.html'), ('a2', 'a2.html')):
    data[lvl] = rows(raw_of(f), ['no', 'pt', 'ano', 'apt'])

# basico: norsk|uttale|portugisisk  (+ farge på fargeradene)
b = blocks(raw_of('basico.html'))
for key, name in (('NUM', 'tall'), ('COL', 'farger'), ('TID', 'tid')):
    data[name] = rows(b[key], ['no', 'uu', 'pt', 'sw'])

# engelsk: engelsk|portugisisk
data['en'] = rows(raw_of('english.html', 'RAW_W'), ['en', 'pt'])
data['enq'] = rows(raw_of('english.html', 'RAW_Q'), ['en', 'pt'])

# ordstillingsoppgavene som alt ligger på A1 og A2
def ex_of(path):
    s = open(os.path.join(ROOT, path), encoding='utf-8').read()
    m = re.search(r'const EX = (\[.*?\]);\n', s, re.S)
    return json.loads(m.group(1)) if m else []
data['ex_a1'] = ex_of('a1.html')
data['ex_a2'] = ex_of('a2.html')

out = 'window.DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'data.js'), 'w', encoding='utf-8').write(out)

for k, v in data.items():
    print('%-8s %4d' % (k, len(v)))
print('\ndata.js: %.0f kB' % (len(out.encode()) / 1024))
