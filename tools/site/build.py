#!/usr/bin/env python3
"""달나라 게임즈 홈페이지 만들기 (2026-11-19 새 디자인 '달밤 오락실', 네 언어)

쓰는 법
  python3 tools/site/build.py          # 쪽 36개(네 언어 × 첫 화면·게임 쪽 넷·문의·개인정보·약관·404) + 글꼴 + sitemap.xml
  python3 tools/site/build.py --no-news   # 소식은 지금 쪽에 들어 있는 것 그대로 두고 만들기

글은 tools/site/content.py(네 언어), 개인정보·약관·문의 본문은 tools/site/docs/<언어>/*.html(법적 문장, 손으로 고침)
모양은 assets/site/site.css, 움직임은 assets/site/site.js(+pond.js 물수제비, yt.js 유튜브 영상 목록) — 이 셋은 손으로 고침
만드는 것: 쪽 HTML · assets/site/fonts/*.woff2 + fonts.css(쪽에 나오는 글자만) · sitemap.xml · assets/news/(소식 사진, news.json)
소식: 게임 저장소의 올린 글 기록(tools/sns/posted.json)에 주소가 있는 글만 tools/news.py로 골라 넣음 — 아직 안 올라간 글은 안 들어감
"""
import hashlib, html, io, json, os, random, re, subprocess, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from content import *  # noqa

E = html.escape
AS = 'assets/site/'
NO_NEWS = '--no-news' in sys.argv


def t(k, L):
    return T[k][L]


SVG = {
    'ext': '<svg class="ext" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.5h6v6M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'prev': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'next': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'snd': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path class="w1" d="M15.5 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="w2" d="M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    'globe': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></g></svg>',
    'swipe': '<svg viewBox="0 0 30 14" aria-hidden="true"><path d="M2 7h24M20 2l6 5-6 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'down': '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M6 1.5v10M1.8 7.5L6 11.8l4.2-4.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}
# SNS 단추: 상표 그림 대신 직접 그린 선 그림(말풍선·사진기·화면)
SNS_ICO = {
    'th': '<path d="M4 5.5h16v10H11l-4.5 4v-4H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9.5h8M8 12.3h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    'ig': '<path d="M3.5 8h4l1.6-2.5h5.8L16.5 8h4v11h-17z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    'yt': '<rect x="3" y="4.5" width="18" height="12.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 8.3v5l4.3-2.5z" fill="currentColor"/><path d="M8 20h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
}
MODE_ICO = ('<svg class="ico i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round">'
            '<path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g></svg>'
            '<svg class="ico i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>')


# ── 경로 ──
def page_path(L, key):
    """쪽 열쇠 → 저장소 안 파일 경로"""
    P = PREFIX[L]
    if key == 'index':
        return P + 'index.html'
    if key in G:
        return P + key + '/index.html'
    return P + key + '.html'   # contact · privacy · terms · 404


def page_url(L, key):
    """쪽 열쇠 → 사이트 주소(폴더는 / 로 끝남)"""
    p = page_path(L, key)
    return p[:-len('index.html')] if p.endswith('index.html') else p


def rel(frm, to):
    """frm 파일(저장소 경로)에서 to(저장소 경로, 폴더면 / 로 끝남)로 가는 상대 주소"""
    if frm.endswith('404.html'):        # 404는 아무 주소에서나 뜨므로 사이트 맨 위부터
        return '/' + to
    d = os.path.dirname(frm)
    r = os.path.relpath(to or '.', d or '.').replace(os.sep, '/')
    if to.endswith('/') or to == '':
        r = r.rstrip('/') + '/'
        if r == './' or r == '/':
            r = './'
    return r


def rough_rect(seed, w=1000, h=1000, n=26, j=7):
    """먹 선으로 그린 화면 테두리(손으로 그은 듯 살짝 흔들림)"""
    rnd = random.Random(seed)
    pts = []
    for side in range(4):
        for k in range(n):
            q = k / n
            if side == 0: x, y = 14 + q * (w - 28), 14
            elif side == 1: x, y = w - 14, 14 + q * (h - 28)
            elif side == 2: x, y = w - 14 - q * (w - 28), h - 14
            else: x, y = 14, h - 14 - q * (h - 28)
            pts.append((x + rnd.uniform(-j, j) * (side % 2 == 0 and 0.3 or 1), y + rnd.uniform(-j, j) * (side % 2 == 1 and 0.3 or 1)))
    d = 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in pts) + 'Z'
    return (f'<svg class="frame" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            f'<path d="{d}" vector-effect="non-scaling-stroke"/><path class="f2" d="{d}" vector-effect="non-scaling-stroke" transform="translate(6 5)"/></svg>')


def ext(href, label, L, cls=''):
    """바깥 링크: 늘 새 창 + ↗ + 화면 읽기용 '(새 창)'"""
    c = f' class="{cls}"' if cls else ''
    return f'<a{c} href="{E(href)}" target="_blank" rel="noopener">{label}{SVG["ext"]}<span class="vh"> ({t("new.win", L)})</span></a>'


def W(s, L):
    """일본어·중국어 제목·이름: content.BR에 있으면 낱말 경계에서만 줄이 바뀌게(<wbr> + class kw). 없으면 그냥 글"""
    if L in ('ja', 'zh-TW') and s in BR:
        return '<span class="kw">' + '<wbr>'.join(E(x) for x in BR[s].split('|')) + '</span>'
    return E(s)


def gname(g, L, tag=True):
    """게임 이름(낱말 서랍은 외국어 쪽에서도 한국어 이름 그대로 + lang). 한 덩어리로(class nmw)"""
    n = g['name'][L]
    if L != 'ko' and g.get('kosolo') and tag:
        return f'<span class="kw" lang="ko">{E(n)}</span>'
    return W(n, L) if L in ('ja', 'zh-TW') else f'<span class="kw">{E(n)}</span>'



# ── 머리 ──
VER = {}


def head(L, key, path, title, desc, extra=''):
    pre = rel(path, '')
    canon, alts = '', ''
    if key != '404':
        canon = f'<link rel="canonical" href="{SITE}{page_url(L, key)}">\n'
        for l2 in LANGS:
            alts += f'<link rel="alternate" hreflang="{l2}" href="{SITE}{page_url(l2, key)}">\n'
        alts += f'<link rel="alternate" hreflang="zh-HK" href="{SITE}{page_url("zh-TW", key)}">\n'
        alts += f'<link rel="alternate" hreflang="x-default" href="{SITE}{page_url("en", key)}">\n'
    ogl = f'<meta property="og:locale" content="{OG_LOCALE[L]}">\n' + ''.join(f'<meta property="og:locale:alternate" content="{OG_LOCALE[x]}">\n' for x in LANGS if x != L)
    dn_t = {'moon': MOON[L], 'greet': GREET[L], 'copied': t('fb.copied', L), 'picked': t('fb.picked', L), 'nw': t('new.win', L)}
    robots = '<meta name="robots" content="noindex">\n' if key == '404' else ''
    follow = ' data-follow-lang' if key == 'contact' else ''
    v = VER['v']
    return f'''<!doctype html>
<html lang="{L}" data-design="site"{follow}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
{robots}<meta property="og:type" content="website">
<meta property="og:site_name" content="{E(t('site', L))}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:image" content="{SITE}assets/sea.webp">
<meta property="og:url" content="{SITE}{page_url(L, key) if key != '404' else ''}">
{ogl}<meta name="theme-color" content="#f3eee3">
<meta name="color-scheme" content="light">
{canon}{alts}<script src="{pre}lang.js?v={v}"></script>
<link rel="icon" href="{pre}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{pre}assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="{pre}assets/favicon-16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="{pre}assets/apple-touch-icon.png">
<link rel="preload" href="{pre}{AS}fonts/title.woff2?v={v}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{pre}{AS}fonts/ui.woff2?v={v}" as="font" type="font/woff2" crossorigin>
<style>@view-transition{{navigation:auto}}</style>
<link rel="stylesheet" href="{pre}{AS}fonts.css?v={v}">
<link rel="stylesheet" href="{pre}{AS}site.css?v={v}">
<script>window.DN_T={json.dumps(dn_t, ensure_ascii=False)};(function(){{var d=document.documentElement,m='light';try{{if(localStorage.getItem('dn-seen-site'))d.classList.add('seen');if(localStorage.getItem('dn-mode')==='dark')m='dark'}}catch(e){{}}
d.setAttribute('data-mode',m);var t=document.querySelector('meta[name=theme-color]');if(t)t.setAttribute('content',m==='dark'?'#15161a':'#f3eee3');
function q(v){{if(v)['ready','finished','updateCallbackDone'].forEach(function(k){{v[k]&&v[k].catch(function(){{}})}})}}
addEventListener('unhandledrejection',function(e){{var r=e.reason;if(r&&r.name==='InvalidStateError'&&/ransition/.test(r.message||''))e.preventDefault()}});
addEventListener('pageswap',function(e){{q(e.viewTransition)}});
addEventListener('pagereveal',function(e){{q(e.viewTransition);try{{var p=JSON.parse(sessionStorage.getItem('dn-vt')||'null');if(p){{d.style.setProperty('--vx',p[0]+'%');d.style.setProperty('--vy',p[1]+'%');sessionStorage.removeItem('dn-vt')}}}}catch(x){{}}}})}})()</script>{extra}
</head>
'''


def snd_btn(L):
    return (f'<button type="button" class="snd" data-sound data-on="{t("snd.on", L)}" data-off="{t("snd.off", L)}" aria-pressed="false" data-sfx="none">'
            f'{SVG["snd"]}<span class="snd-l">{t("snd.off", L)}</span></button>')


def mode_btn(L):
    a, li, da = t('mode.aria', L), t('mode.light', L), t('mode.dark', L)
    return (f'<button type="button" class="mode-b" data-mode-toggle aria-pressed="false" data-sfx="none" data-light="{li}" data-dark="{da}" data-aria="{a}" aria-label="{a}: {li}">'
            f'{MODE_ICO}<span class="mode-l">{li}</span></button>')


def lang_menu(L, key, path):
    items = ''
    for l2 in LANGS:
        href = rel(path, page_url(l2, key))
        cur = ' aria-current="true"' if l2 == L else ''
        items += f'<a href="{href}" hreflang="{l2}" lang="{l2}" data-setlang="{l2}"{cur}>{LANG_NAME[l2]}</a>'
    return (f'<div class="lang"><button type="button" class="lang-b" aria-expanded="false" aria-controls="langm" aria-label="{t("lang.aria", L)}: {LANG_NAME[L]}">'
            f'{SVG["globe"]}<span>{LANG_SHORT[L]}</span></button><div class="lang-m" id="langm" hidden>{items}</div></div>')


def sec_index(L):
    return [('games', t('sec.games', L)), ('log', t('sec.log', L)), ('next', t('sec.next', L)), ('news', t('sec.news', L)), ('yt', t('sec.yt', L)), ('bug', t('sec.bug', L))]


def sec_game(g, L):
    s = [('about', t('g.about', L)), ('how', t('g.how', L)), ('points', POINTS[g['id']][1][L])]
    if g['id'] == 'hanmari':
        s.append(('fish', t('g.fish.j', L)))
    return s + [('shots', t('g.shots.j', L)), ('hlog', t('g.log.j', L)), ('bug', t('sec.bug', L))]


def header(L, key, path):
    home = rel(path, PREFIX[L])

    def ol(secs, pre, mark=None):
        li = ''
        for i, (k, v) in enumerate(secs):
            jump = '' if pre else f' data-jump="{k}"'
            num = mark if (mark and i == 0) else f'{i + (0 if mark else 1):02d}'
            li += f'<li><a href="{pre}#{k}" data-sfx="tick"{jump}><span class="cur" aria-hidden="true">▶</span><span class="mn">{num}</span>{W(v, L)}</a></li>'
        return f'<ol>{li}</ol>'
    top = [('top', t('menu.top', L))] + sec_index(L)
    if key == 'index':
        items = ol(top, '')
    elif key in G:
        g = G[key]
        items = (f'<p class="gm-g">{t("menu.here", L)}</p>' + ol([('game', g['name'][L])] + sec_game(g, L), '', '★')
                 + f'<p class="gm-g">{t("menu.home", L)}</p>' + ol(top, home))
    else:
        items = ol(top, home)
    logo_t = f'<span class="lt"{"" if L == "ko" else " lang=\"ko\""}><span>달나라</span> <span>게임즈</span></span>'
    return f'''<a class="skip" href="#main">{t("skip", L)}</a>
<header class="top"><div class="in">
  <a class="logo" href="{home}"><img class="lg-l" src="{rel(path, AS + 'logo-ink.webp')}" alt="" width="40" height="40"><img class="lg-d" src="{rel(path, AS + 'logo-light.webp')}" alt="" width="40" height="40">{logo_t}<span class="vh"> {t("site", L) if L != "ko" else ""}</span></a>
  <div class="tools">{snd_btn(L)}{mode_btn(L)}{lang_menu(L, key, path)}<button type="button" class="menu-b" aria-expanded="false" aria-controls="gm" data-sfx="menu">{t("menu", L)}</button></div>
</div></header>
<div class="gmenu" id="gm" hidden><div class="gm-in">
  <p class="gm-h"><span>{t("menu", L)}</span><button type="button" class="gm-x" data-sfx="tick">{t("close", L)}</button></p>
  <nav aria-label="{t("menu", L)}">{items}</nav>
  <p class="gm-tip">{t("menu.tip", L)}</p>
</div></div>
'''


def sns_keys(L, cls='sns-k'):
    out = ''
    for k, href in (('th', TH), ('ig', IG), ('yt', YT)):
        out += (f'<a class="sk" href="{E(href)}" target="_blank" rel="noopener" data-sfx="go"><svg class="si" viewBox="0 0 24 24" aria-hidden="true">{SNS_ICO[k]}</svg>'
                f'<span class="sn">{E(t("sns." + k, L))}{SVG["ext"]}</span><span class="vh"> ({t("new.win", L)})</span></a>')
    return f'<nav class="{cls}" aria-label="{t("sns.aria", L)}">{out}</nav>'


def footer(L, path, bug_here=False):
    docs = ''.join(f'<a class="flink" href="{rel(path, PREFIX[L] + k + ".html")}">{t("doc." + k, L)}</a>' for k in ('privacy', 'terms', 'contact'))
    biz = ''.join(f'<span>{E(x)}</span>' for x in FOOT_BIZ[L])
    big = '달나라 게임즈'
    return f'''<footer class="foot" id="foot">
  <div class="in">
    <p class="f-h">{W(t("foot.h", L), L)}</p>
    {sns_keys(L, 'f-sns')}
    <nav class="f-links" aria-label="{t("foot.nav", L)}">{docs}<a class="flink" href="{'' if bug_here else rel(path, PREFIX[L])}#bug">{t("sec.bug", L)}</a></nav>
    <p class="f-biz">{biz}</p>
  </div>
  <p class="f-big" aria-hidden="true"><span lang="ko">{big}</span><img src="{rel(path, AS + 'seal.webp')}" alt="" width="104" height="104" loading="lazy"></p>
</footer>
'''


def scripts(path):
    v = VER['v']
    return (f'<script src="{rel(path, AS + "yt.js")}?v={v}"></script>\n<script src="{rel(path, AS + "site.js")}?v={v}"></script>\n')


POND = ''.join(f' data-{k}="{v}"' for k, v in {'ripple': '242,237,226', 'drop': '242,237,226', 'drop2': '200,64,43', 'stone': '242,237,226', 'stone2': '200,64,43', 'shade': '0,0,0', 'lw': '1.5'}.items())


def pond(L, path, cls='pond'):
    hint = t('pond.hint', L)
    return (f'<div class="{cls}" tabindex="0" role="group" aria-label="{E(t("pond.aria", L))}" '
            f'data-src="{rel(path, AS + "pond.js")}?v={VER["v"]}" data-count="{E(t("pond.count", L))}" data-best="{E(t("pond.best", L))}"{POND}>'
            f'<canvas aria-hidden="true"></canvas><p class="ph">{SVG["swipe"]}{E(hint)}</p><p class="best" hidden></p><p class="pop" aria-live="polite"></p></div>')


def jump(secs, L):
    a = ''.join(f'<a href="#{k}" data-jump="{k}" data-sfx="tick">{E(v)}</a>' for k, v in secs)
    return (f'<nav class="jump" aria-label="{t("jump.aria", L)}"><div class="jump-in">{a}</div>'
            '<span class="jump-more l" aria-hidden="true">‹</span><span class="jump-more r" aria-hidden="true">›</span></nav>')


def fact_li(n, label, fmt, count=False):
    if '{n}' not in fmt:
        return f'<li><span class="k">{E(label)}</span><b class="w">{E(fmt)}</b></li>'
    pre, _, post = fmt.partition('{n}')
    num = f'<span data-count="{n}">{n}</span>' if count else f'<span>{n}</span>'
    return (f'<li><span class="k">{E(label)}</span><b>{f"<small>{E(pre.strip())}</small>" if pre.strip() else ""}{num}'
            f'{f"<small>{E(post.strip())}</small>" if post.strip() else ""}</b></li>')


def media(g, L, path, cls='pk-media', first=True):
    if g.get('vid'):
        po = 'poster' if first else 'data-poster'
        inner = (f'<video muted playsinline loop preload="none" {po}="{rel(path, "assets/loops/" + g["id"] + ".webp")}" aria-label="{E(t("media.vid", L).format(g=g["name"][L]))}">'
                 f'<source src="{rel(path, "assets/loops/" + g["id"] + ".mp4")}" type="video/mp4"></video>')
    else:
        lg = 'ko' if g.get('kosolo') else L
        inner = (f'<img src="{rel(path, "assets/pz/" + g["id"] + "-" + lg + ".webp")}" alt="{E(t("media.pz", L).format(g=g["name"][L]))}" '
                 f'width="360" height="640" loading="lazy" decoding="async">')
    return f'<div class="{cls}">{inner}</div>'


def status(g, L, long=True):
    s = t('st.' + g['st'] + ('' if long else '.s'), L)
    if L != 'ko' and g.get('kosolo'):
        s += ' · ' + t('ko.only', L)
    return s


def status_h(g, L):
    s = t('st.' + g['st'], L)
    out = W(s, L)
    if L != 'ko' and g.get('kosolo'):
        out += ' · ' + W(t('ko.only', L), L)
    return out


def pk_card(g, i, L, path):
    return (f'<button type="button" class="pk-card st-{g["st"]}" role="tab" id="pkc-{g["id"]}" aria-controls="pkp-{g["id"]}" '
            f'aria-selected="{"true" if i == 0 else "false"}" data-i="{i}"><img src="{rel(path, "assets/icon-" + g["id"] + ".webp")}" alt="" width="96" height="96" loading="lazy">'
            f'<span class="no">{g["no"]}</span><span class="nm">{gname(g, L)}</span></button>')


def pk_panel(g, i, L, path):
    facts = ''
    if g['facts']:
        facts = '<ul class="pk-facts">' + ''.join(fact_li(n, lb[L][0], lb[L][1]) for n, lb in g['facts']) + '</ul>'
    if g.get('page'):
        act = f'<a class="pk-go" href="{rel(path, page_url(L, g["id"]))}" data-sfx="go">{t("pk.go", L)}</a>'
    else:
        act = f'<p class="pk-later">{t("pk.later", L)}</p>'
    tail = f'<span class="pk-tail">{E(g["tail"][L])}</span>' if g.get('tail') else ''
    info = (f'<p class="pk-kind"><span class="no">{g["no"]}</span>{W(g["kind"][L], L)}</p>'
            f'<h3 class="pk-name">{gname(g, L)}</h3>{tail}'
            f'<p class="pk-one">{E(g["one"][L])}</p>{facts}'
            f'<p class="pk-st st-{g["st"]}"><i aria-hidden="true"></i><span>{status_h(g, L)}</span></p>'
            f'<div class="pk-act">{act}</div>')
    return (f'<article class="pk-panel st-{g["st"]}" role="tabpanel" id="pkp-{g["id"]}" aria-labelledby="pkc-{g["id"]}" data-i="{i}"{"" if i == 0 else " hidden"}>'
            f'{media(g, L, path, first=(i == 0))}<div class="pk-info">{info}</div></article>')


def marquee():
    names = ''.join(f'<span lang="{l2}">{E(g["name"][l2])}</span>' for g in GAMES[:4] for l2 in LANGS)
    return f'<div class="marq" aria-hidden="true" data-pause-off><div class="mt">{names}{names}</div></div>'


def log_section(items, L, sid='log', title=None, game=False):
    lis = ''
    for it in items:
        if game:
            dt, h, x = it
            lis += f'<li class="hs-i"><span class="node" aria-hidden="true"></span><time>{dt}</time><b>{E(h[L])}</b><p>{E(x[L])}</p></li>'
        else:
            dt, x = it
            lis += f'<li class="hs-i"><span class="node" aria-hidden="true"></span><time>{dt}</time><p>{E(x[L])}</p></li>'
    lis += f'<li class="hs-i now"><span class="node" aria-hidden="true"></span><time>{t("log.now", L)}</time><p>{W(t("log.now.t", L), L)}</p></li>'
    return f'''<section class="log" id="{sid}" data-hscroll aria-labelledby="{sid}-h">
  <div class="hs-pin"><div class="in">
    <div class="sec-h"><h2 id="{sid}-h">{W(title or t("sec.log", L), L)}</h2><p class="yr">2026</p></div>
    <div class="hs-win"><ol class="hs-track">{lis}</ol></div>
    <p class="hs-tip t-scroll">{SVG["swipe"]}{t("log.tip", L)}</p><p class="hs-tip t-swipe">{SVG["swipe"]}{t("log.swipe", L)}</p>
  </div></div>
</section>'''


def next_card(gn, ver, items, when):
    li = ''.join(f'<li>{E(x)}</li>' for x in items)
    return (f'<article class="up rv"><p class="up-w">{E(when)}</p><h3>{gn}</h3><p class="up-v">{E(ver)}</p><ul>{li}</ul></article>')


def next_section(cards, L, sid='next'):
    return f'''<section class="next" id="{sid}" aria-labelledby="{sid}-h"><div class="in">
  <div class="sec-h"><h2 id="{sid}-h">{W(t("sec.next", L), L)}</h2></div>
  <div class="up-grid">{''.join(cards)}</div>
</div></section>'''


def fb_card(kind, cls, L):
    k = 'fb.' + kind
    href = 'mailto:' + MAIL + '?subject=' + urllib.parse.quote(t(k + '.subj', L))
    return (f'<article class="fb {cls}"><h3>{W(t(k + ".t", L), L)}</h3><p>{E(t(k + ".p", L))}</p>'
            f'<div class="fb-row"><a class="seal-btn sm" href="{E(href)}" data-sfx="go">{E(t("fb.write", L))}</a>'
            f'<button type="button" class="copy" data-copy="{MAIL}">{E(t("fb.copy", L))}</button><span class="copy-msg" aria-live="polite"></span></div></article>')


def bug_section(L, path, game=None):
    q = f'?game={G[game]["pkg"]}&amp;lang={L}' if game else f'?lang={L}'
    return f'''<section class="bug" id="bug" aria-labelledby="bug-h"><div class="in">
  <div class="sec-h"><h2 id="bug-h">{W(t("fb.h", L), L)}</h2></div>
  <div class="fb-grid">{fb_card('bug', 'b', L)}{fb_card('idea', 'i', L)}</div>
  <p class="fb-mail"><span class="mail-a" data-copy-src>{MAIL}</span></p>
  <div class="fb-more"><a class="flink" href="{rel(path, PREFIX[L] + 'contact.html')}{q}">{E(t("fb.contact", L))}</a><span class="fb-sns">{E(t("fb.sns", L))} {ext(TH, t('sns.th', L), L, 'flink')} {ext(IG, t('sns.ig', L), L, 'flink')}</span></div>
</div></section>'''


def yt_section(L, path):
    return f'''<section class="yt" id="yt" aria-labelledby="yt-h"><div class="in">
  <div class="sec-h"><h2 id="yt-h">{W(t("sec.yt", L), L)}</h2></div>
  <div class="tv">{rough_rect(21)}
    <div class="ych"><img src="{rel(path, AS + 'yt-logo.webp')}" alt="" width="56" height="56" loading="lazy"><span><b lang="ko">달나라 게임즈</b><span>@dalnara_games</span></span></div>
    <div class="yvids"><div class="yempty" role="img" aria-label="{t("yt.empty", L)}"><span class="yplay" aria-hidden="true"></span><span class="yt-e" aria-hidden="true">{W(t("yt.empty", L), L)}</span></div></div>
  </div>
  <div class="row">{ext(YT_SUB, t("yt.sub", L), L, "seal-btn")}</div>
</div></section>'''


def news_section(L, block):
    nl = ''.join(f'<button type="button" data-lang="{l2}" lang="{l2}" aria-pressed="{"true" if l2 == L else "false"}">{LANG_NAME[l2]}</button>' for l2 in LANGS)
    return f'''<section class="news" id="news" aria-labelledby="news-h">
  <div class="in"><div class="sec-h"><h2 id="news-h">{W(t("sec.news", L), L)}</h2></div></div>
  <div class="nlang" role="group" aria-label="{t("news.lang", L)}">{nl}</div>
  <div class="nwrap">
<!-- news:start -->{block}<!-- news:end -->
  </div>
  <div class="narr"><button type="button" data-dir="-1" aria-label="{t("news.prev", L)}">{SVG["prev"]}</button><button type="button" data-dir="1" aria-label="{t("news.next", L)}">{SVG["next"]}</button></div>
</section>'''


def loader(L):
    return f'''<div class="loader" id="loader" data-ms="1000" aria-hidden="true">
  <div class="ld-line"><i class="ld-bob"></i></div>
  <p class="ld-n"><span>{t("loading", L)}</span><b class="ld-c"></b></p>
  <p class="ld-t" lang="ko">달나라 게임즈</p>
</div>
'''


def doc_wrap(L, key, path, inner, title, desc, extra=''):
    body = f'''<body>
{header(L, key, path)}<main id="main" class="docpage">
<div class="in">
{inner}
</div>
</main>
{footer(L, path)}{scripts(path)}</body>
</html>
'''
    return head(L, key, path, title, desc, extra) + body


# ── 쪽 ──
def page_index(L, news_block):
    path = page_path(L, 'index')
    cards = ''.join(pk_card(g, i, L, path) for i, g in enumerate(GAMES))
    panels = ''.join(pk_panel(g, i, L, path) for i, g in enumerate(GAMES))
    h1aria = '' if L == 'ko' else f' aria-label="{E(t("site", L))} (달나라 게임즈)"'
    nx = [next_card(gname(G['hanmari'], L), NEXT['hanmari']['ver'], NEXT['hanmari']['items'][L], WHEN_NEXT[L]),
          next_card(gname(G['tongtong'], L), NEXT['tongtong']['ver'], NEXT['tongtong']['items'][L], WHEN_NEXT[L]),
          next_card(gname(G['delivery'], L) + ' · ' + gname(G['house'], L), NEXT['delivery']['ver'], NEXT['delivery']['items'][L], WHEN_NEXT[L]),
          next_card(W(PUZZLE3[L], L), NEXT['puzzle']['ver'], NEXT['puzzle']['items'][L], WHEN_TBD[L])]
    body = f'''<body>
{loader(L)}{header(L, 'index', path)}
<main id="main">
<section class="start" id="top" aria-labelledby="t1">
  <div class="in">
    <div class="screen">{rough_rect(3)}
      <div class="hud"><p class="hud-l"><span class="k">{t("seoul", L)}</span><b data-clock>--:--</b><span class="g" data-greet>{GREET[L]["day"]}</span></p>
        <p class="hud-r"><svg class="moon" data-moon="40" viewBox="-44 -44 88 88" aria-hidden="true"><circle class="dark" r="40"/><path class="lit" d=""/><circle class="rim" r="40"/></svg><span class="k">{t("moon", L)}</span><b data-moon-name>-</b></p></div>
      <p class="band"><span>{E(t("band", L))}</span></p>
      <h1 class="title" id="t1" lang="ko"{h1aria}><span class="w1">달나라</span><span class="w2">게임즈</span></h1>
      {sns_keys(L)}
      {pond(L, path)}
    </div>
    <a class="down" href="#games" data-sfx="tick">{E(t("down", L))}{SVG["down"]}</a>
  </div>
</section>

{jump(sec_index(L), L)}

<section class="select" id="games" data-picker aria-labelledby="sel-h">
  <div class="in">
    <div class="sec-h"><h2 id="sel-h">{W(t("sec.games", L), L)}</h2><p class="pk-count"><b data-pk-count>1</b><span>/ {len(GAMES)}</span></p></div>
    <div class="pk-stage" tabindex="0" aria-label="{t("pk.aria", L)}">{rough_rect(11)}{panels}</div>
    <div class="pk-bar">
      <button type="button" class="pk-step" data-pk-step="-1" aria-label="{t("pk.prev", L)}">{SVG["prev"]}</button>
      <div class="pk-cards" role="tablist" aria-label="{t("pk.cards", L).format(n=len(GAMES))}">{cards}</div>
      <button type="button" class="pk-step" data-pk-step="1" aria-label="{t("pk.next", L)}">{SVG["next"]}</button>
    </div>
  </div>
</section>

{marquee()}

{log_section(LOG, L)}

{next_section(nx, L)}

{news_section(L, news_block)}

{yt_section(L, path)}

{bug_section(L, path)}
</main>
{footer(L, path, True)}{scripts(path)}</body>
</html>
'''
    return head(L, 'index', path, t('site', L) if L == 'ko' else f'{t("site", L)} (달나라 게임즈)', t('desc', L)) + body


def page_game(gid, L):
    g = G[gid]
    path = page_path(L, gid)
    nm = g['name'][L]
    names = ''.join(f'<li lang="{l2}">{E(g["name"][l2])}</li>' for l2 in LANGS if l2 != L)
    facts = list(g['facts']) + [g['extra']]
    stats = ''.join(fact_li(n, lb[L][0], lb[L][1], '{n}' in lb[L][1]) for n, lb in facts)
    tail = f'<p class="gh-tail">{E(g["tail"][L])}</p>' if g.get('tail') else ''
    koonly = f'<p class="gh-note">{t("g.koonly", L)}</p>' if g.get('koonly') else ''
    about = ''.join(f'<p>{E(x)}</p>' for x in ABOUT[gid][L]) + f'<p>{ADS["gacha" if gid in ("hanmari", "tongtong") else "ads"][L]}</p>'
    how = ''.join(f'<li class="rv"><span class="key" aria-hidden="true">{i + 1}</span><p>{E(x)}</p></li>' for i, x in enumerate(HOW[gid][L]))
    ptitle, _, plist = POINTS[gid]
    if gid == 'hanmari':
        pts = '<ol class="sea-l">' + ''.join(f'<li class="rv"><span class="sn">{i + 1}</span><b>{E(a)}</b><p>{E(b)}</p></li>' for i, (a, b) in enumerate(plist[L])) + '</ol>'
    else:
        pts = '<ol class="pt-l">' + ''.join(f'<li class="rv"><span class="sn">{i + 1:02d}</span><div><b>{W(a, L)}</b><p>{E(b)}</p></div></li>' for i, (a, b) in enumerate(plist[L])) + '</ol>'
    fish = ''
    if gid == 'hanmari':
        cards = ''
        for f in FISH:
            fn, rar, sea = f['n'][L], RARITY[L][f['r']], SEAS[L][f['sea']]
            cards += f'''<li class="rv"><button type="button" class="hw r{f["r"]}" aria-pressed="false" aria-label="{E(t("g.flip", L).format(n=fn))}" data-sfx="flip">
  <span class="hw-in"><span class="hw-f"><span class="rar">{E(rar)}</span><img src="{rel(path, 'assets/fish/' + f['id'] + '.webp')}" alt="" width="480" height="266" loading="lazy"><b>{W(fn, L)}</b></span>
  <span class="hw-b"><span class="rar">{E(rar)}</span><b>{W(fn, L)}</b><span class="kv"><span>{t("g.sea", L)}</span>{E(sea)}</span><span class="kv"><span>{t("g.size", L)}</span>{f["sz"]}</span><span class="d">{E(f["d"][L])}</span></span></span>
</button></li>'''
        fish = f'''<section class="fishc" id="fish" aria-labelledby="fish-h"><div class="in">
  <div class="sec-h"><h2 id="fish-h">{W(t("g.fish", L), L)}</h2></div>
  <ul class="hw-row">{cards}</ul>
</div></section>

'''
    shots = ''.join(f'<li><figure><img src="{rel(path, "assets/" + k + ".webp")}" alt="{E(a[L])}" width="600" height="1040" loading="lazy" decoding="async"><figcaption>{E(c[L])}</figcaption></figure></li>'
                    for k, a, c in SHOTS[gid])
    nk = NEXT[gid]
    order = ['hanmari', 'tongtong', 'delivery', 'house']
    ng = G[order[(order.index(gid) + 1) % 4]]
    desc = t('g.desc', L).format(g=nm, one=g['one'][L])
    body = f'''<body>
{header(L, gid, path)}
<main id="main">
<section class="gh" id="game" aria-labelledby="hm-h"><div class="in">
  <a class="back" href="{rel(path, PREFIX[L])}#games" data-sfx="tick">{SVG["prev"]}{t("g.back", L)}</a>
  <div class="screen gh-s">{rough_rect(5)}
    <div class="gh-top"><p class="pk-kind"><span class="no">{g["no"]}</span>{W(g["kind"][L], L)}</p>
    <h1 class="gh-n" id="hm-h">{gname(g, L)}</h1>{tail}</div>
    {media(g, L, path, 'gh-m')}
    <div class="gh-i">
      <ul class="gh-names">{names}</ul>
      <p class="pk-st st-test"><i aria-hidden="true"></i><span>{W(t("st.test", L), L)}</span></p>
      <ul class="stats">{stats}</ul>
      {koonly}
    </div>
  </div>
  <p class="gh-soon">{t("g.soon", L)}</p>
</div></section>

{jump(sec_game(g, L), L)}

<section class="about" id="about" aria-labelledby="about-h"><div class="in">
  <div class="sec-h"><h2 id="about-h">{W(t("g.about", L), L)}</h2></div>
  <div class="about-t">{about}</div>
</div></section>

<section class="how" id="how" aria-labelledby="how-h"><div class="in">
  <div class="sec-h"><h2 id="how-h">{W(t("g.how", L), L)}</h2></div>
  <ol class="how-l">{how}</ol>
</div></section>

<section class="seas" id="points" aria-labelledby="pt-h"><div class="in">
  <div class="sec-h"><h2 id="pt-h">{W(ptitle[L], L)}</h2></div>
  {pts}
</div></section>

{fish}<section class="shots" id="shots" aria-labelledby="sh-h"><div class="in">
  <div class="sec-h"><h2 id="sh-h">{W(t("g.shots", L), L)}</h2></div>
  <ul class="sh-row">{shots}</ul>
</div></section>

{log_section(GLOG[gid], L, 'hlog', t("g.log", L), True)}

{next_section([next_card(gname(g, L), nk['ver'], nk['items'][L], WHEN_NEXT[L])], L, 'hnext')}

{bug_section(L, path, gid)}

<section class="nextg" aria-labelledby="ng-h"><div class="in">
  <h2 class="k" id="ng-h">{W(t("g.nextgame", L), L)}</h2>
  <a class="nextg-b" href="{rel(path, page_url(L, ng['id']))}" data-sfx="go"><img src="{rel(path, "assets/icon-" + ng["id"] + ".webp")}" alt="" width="96" height="96" loading="lazy"><span class="ng-t"><span class="ng-k">{W(ng["kind"][L], L)}</span><span class="ng">{gname(ng, L)}</span></span><span class="ng-go" aria-hidden="true">▶</span></a>
  <a class="ink-btn" href="{rel(path, PREFIX[L])}#games" data-sfx="tick">{SVG["prev"]}{W(t("g.toall", L), L)}</a>
</div></section>
</main>
{footer(L, path, True)}{scripts(path)}</body>
</html>
'''
    title = f'{nm} · {t("site", L)}'
    return head(L, gid, path, title, desc) + body


def page_404(L):
    path = page_path(L, '404')
    extra = ''
    if L == 'ko':   # GitHub Pages는 맨 위 404.html 하나만 띄움 → 언어 폴더 주소면 그 언어 404로
        extra = "\n<script>(function(){var m=location.pathname.match(/^\\/(ja|zh-TW|en)\\//);if(m&&!/\\/404\\.html$/.test(location.pathname))location.replace('/'+m[1]+'/404.html')})()</script>"
    body = f'''<body>
{header(L, '404', path)}
<main id="main">
<section class="lost" aria-labelledby="l-h"><div class="in">
  <div class="screen">{rough_rect(9)}
    <p class="lost-c" aria-hidden="true">404</p>
    <h1 id="l-h">{W(t("lost.h", L), L)}</h1>
    <p class="lost-p">{t("lost.p", L)}</p>
    {pond(L, path, 'pond small')}
    <a class="seal-btn big" href="{rel(path, PREFIX[L])}" data-sfx="start"><span class="blink" aria-hidden="true">▶</span> {t("lost.home", L)}</a>
  </div>
</div></section>
{bug_section(L, path)}
</main>
{footer(L, path, True)}{scripts(path)}</body>
</html>
'''
    return head(L, '404', path, f'{t("lost.title", L)} · {t("site", L)}', t('lost.p', L), extra) + body


def page_doc(L, key):
    meta = json.load(open(os.path.join(HERE, 'docs', 'meta.json'), encoding='utf-8'))[f'{L}/{key}']
    inner = open(os.path.join(HERE, 'docs', L, key + '.html'), encoding='utf-8').read().strip()
    # 본문 속 바깥 링크(구글 방침 등)도 새 창 + ↗ (글은 그대로)
    inner = re.sub(r'<a href="(https?://[^"]+)"([^>]*)>(.*?)</a>', lambda m: f'<a href="{m.group(1)}" target="_blank" rel="noopener"{re.sub(r' (target|rel)="[^"]*"', '', m.group(2))}>{m.group(3)}{SVG["ext"]}<span class="vh"> ({t("new.win", L)})</span></a>', inner, flags=re.S)
    if L in ('ja', 'zh-TW'):
        inner = re.sub(r'<(h[12])([^>]*)>([^<]*)</\1>', lambda m: f'<{m.group(1)}{m.group(2)}>{W(html.unescape(m.group(3)), L)}</{m.group(1)}>', inner)
    return doc_wrap(L, key, page_path(L, key), inner, meta['title'], meta['desc'] or meta['title'])


# ── 소식 ──
def news_blocks():
    """올라간 글만(news.py) → 네 언어 첫 화면에 넣을 목록. 못 만들면 지금 쪽의 것을 그대로"""
    keep = {}
    for L in LANGS:
        p = os.path.join(ROOT, page_path(L, 'index'))
        s = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
        m = re.search(r'<!-- news:start -->(.*?)<!-- news:end -->', s, re.S)
        keep[L] = m.group(1) if m and 'news-l' in m.group(1) else ''
    if NO_NEWS:
        return keep
    try:
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import news as NEWS
        pick, total, skipped, todo = NEWS.collect(os.path.join(NEWS.GAME, 'tools', 'sns', 'posts.json'), os.path.join(NEWS.GAME, 'tools', 'sns', 'posted.json'),
                                                  os.path.join(ROOT, 'tools', 'news_i18n.json'), 6)
    except Exception as e:   # 게임 저장소·news.py가 없는 곳(다른 기기)
        print('  소식: 새로 못 만들어서 지금 것 그대로 둠 —', e)
        return keep
    if todo:
        print('  소식 번역 필요(외국어 목록에서만 빠짐):', [it['id'] for it in todo])
    out_dir = os.path.join(ROOT, 'assets', 'news')
    os.makedirs(out_dir, exist_ok=True)
    NEWS.make_thumbs(pick, os.path.join(ROOT, 'sns', 'media'), out_dir)
    wide_thumbs(pick, os.path.join(ROOT, 'sns', 'media'), out_dir)
    used = {it.get('thumb') for it in pick}
    for f in os.listdir(out_dir):
        if f.endswith('.webp') and f not in used:
            os.remove(os.path.join(out_dir, f))
    data = {'total': total, 'items': [{'id': it['id'], 'date': it['date'], 'channel': 'threads' if it['ch'] == 'th' else 'instagram', 'link': it['link'],
                                       'thumb': it.get('thumb'), 'text': dict({'ko': it['text']}, **{l: it['tr'].get(l, '') for l in LANGS[1:]})} for it in pick]}
    json.dump(data, open(os.path.join(out_dir, 'news.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'  소식: 올라간 글 {total}개 중 {len(pick)}개 ' + ', '.join(it['id'] for it in pick) + (f' · 뺀 글 {skipped}' if skipped else ''))
    out = {}
    for L in LANGS:
        relp = rel(page_path(L, 'index'), 'assets/news').rstrip('/')
        block = '\n' + '\n'.join(NEWS.render(pick, l2, L, relp) for l2 in LANGS) + '\n'
        out[L] = re.sub(r'(<img class="nt" [^>]*?)width="120" height="150"', r'\1width="310" height="170"', block)
    return out


def wide_thumbs(pick, media_dir, out_dir):
    """소식 카드 그림은 가로(310×170) → 원본에서 무늬가 가장 많은 띠를 골라 620×340으로 덮어씀"""
    from PIL import Image, ImageFilter
    R = 310 / 170
    for it in pick:
        if not it.get('thumb') or not it.get('media'):
            continue
        src = os.path.join(media_dir, it['media'])
        if not os.path.exists(src):
            continue
        if src.endswith('.mp4'):
            tmp = os.path.join(out_dir, '_frame.png')
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', '1', '-i', src, '-frames:v', '1', tmp], check=True)
            im = Image.open(tmp).convert('RGB'); os.remove(tmp)
        else:
            im = Image.open(src).convert('RGB')
        W, H = im.size; ch = min(H, round(W / R))
        small = im.convert('L').resize((max(1, W // 4), max(1, H // 4))).filter(ImageFilter.FIND_EDGES)
        rows = [sum(small.crop((0, y, small.width, y + 1)).histogram()[k] * k for k in range(256)) for y in range(small.height)]
        best = (-1, 0)
        for y in range(0, H - ch + 1, 8):
            s = sum(rows[y // 4:(y + ch) // 4]) * (1 - 0.25 * abs((y + ch / 2) / H - 0.5))
            if s > best[0]: best = (s, y)
        im.crop((0, best[1], W, best[1] + ch)).resize((620, 340), Image.LANCZOS).save(os.path.join(out_dir, it['thumb']), 'WEBP', quality=72)


# ── 글꼴: 쪽에 나오는 글자만 ──
def build_fonts(pages):
    from fontTools.ttLib import TTFont
    from fontTools.subset import Subsetter, Options
    txt = ''.join(pages.values())
    txt = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>', ' ', txt, flags=re.S)
    txt = html.unescape(re.sub(r'<[^>]+>', ' ', txt))
    js = ''.join(open(os.path.join(ROOT, AS, f), encoding='utf-8').read() for f in ('site.js', 'pond.js'))
    for L in LANGS:
        txt += ''.join(MOON[L]) + ''.join(GREET[L].values()) + t('fb.copied', L) + t('fb.picked', L) + t('snd.on', L) + t('mode.dark', L)
    chars = set(txt) | set(js) | {chr(i) for i in range(0x20, 0x7f)} | set('·—–…「」『』‘’“”→←↑↓▶◀▸★×−~%°0123456789')
    out = os.path.join(ROOT, AS, 'fonts')
    os.makedirs(out, exist_ok=True)
    css = '/* 글꼴: 쪽에 나오는 글자만 뽑음(tools/site/build.py). 원본 tools/site/fontsrc — 송명(제목)·오빗(숫자·메뉴), 둘 다 SIL OFL */\n'
    for fam, src, name in (('DN Title', 'SongMyung-Regular.woff2', 'title'), ('DN UI', 'Orbit-Regular.woff2', 'ui')):
        f = TTFont(os.path.join(HERE, 'fontsrc', src)); have = f.getBestCmap()
        o = Options(); o.flavor = 'woff2'; o.layout_features = ['kern', 'liga']; o.hinting = False; o.desubroutinize = True; o.name_IDs = ['*']; o.notdef_outline = True
        ss = Subsetter(o); ss.populate(unicodes=[ord(c) for c in chars if ord(c) in have] + [0x20, 0xA0]); ss.subset(f)
        f.flavor = 'woff2'; f.save(os.path.join(out, name + '.woff2'))
        # 오빗은 숫자·몇 가지 기호(% + , - . / :)·화살표·도형·한글만. 로마자(M·N 모양이 독특함)·띄어쓰기·따옴표·&는 기기 산세리프(본문 글꼴, site.css --f-ui)로
        # (띄어쓰기까지 오빗이 맡으면 영어 'Write  an  email'처럼 낱말 사이가 벌어짐, 2026-11-21)
        rng = ';unicode-range:U+0025,U+002B-003A,U+00B7,U+00D7,U+2190-21FF,U+2500-25FF,U+3000-303F,U+3130-318F,U+AC00-D7A3,U+FF01-FF20' if name == 'ui' else ''
        css += "@font-face{font-family:'%s';font-weight:400;font-display:swap;src:url(fonts/%s.woff2?v=%s) format('woff2')%s}\n" % (fam, name, VER['v'], rng)
        print(f'  글꼴 {fam}: {os.path.getsize(os.path.join(out, name + ".woff2")) // 1024}KB')
    open(os.path.join(ROOT, AS, 'fonts.css'), 'w', encoding='utf-8').write(css)


def sitemap():
    keys = ['index', 'hanmari', 'tongtong', 'delivery', 'house', 'contact', 'privacy', 'terms']
    s = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    for k in keys:
        for L in LANGS:
            s += f'  <url><loc>{SITE}{page_url(L, k)}</loc>\n'
            for l2 in LANGS:
                s += f'    <xhtml:link rel="alternate" hreflang="{l2}" href="{SITE}{page_url(l2, k)}"/>\n'
            s += f'    <xhtml:link rel="alternate" hreflang="zh-HK" href="{SITE}{page_url("zh-TW", k)}"/>\n'
            s += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{page_url("en", k)}"/>\n  </url>\n'
    s += '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(s)


def main():
    h = hashlib.sha1()
    for f in ('site.css', 'site.js', 'pond.js', 'yt.js'):
        h.update(open(os.path.join(ROOT, AS, f), 'rb').read())
    h.update(open(os.path.join(ROOT, 'lang.js'), 'rb').read())
    VER['v'] = h.hexdigest()[:8]
    news = news_blocks()
    pages = {}
    for L in LANGS:
        pages[page_path(L, 'index')] = page_index(L, news[L])
        for gid in ('hanmari', 'tongtong', 'delivery', 'house'):
            pages[page_path(L, gid)] = page_game(gid, L)
        for k in ('contact', 'privacy', 'terms'):
            pages[page_path(L, k)] = page_doc(L, k)
        pages[page_path(L, '404')] = page_404(L)
    build_fonts(pages)
    for p, s in pages.items():
        fp = os.path.join(ROOT, p)
        os.makedirs(os.path.dirname(fp) or ROOT, exist_ok=True)
        open(fp, 'w', encoding='utf-8').write(s)
    sitemap()
    bad = [p for p, s in pages.items() if re.search(r'(?<![A-Za-z])AI(?![A-Za-z])|인공지능|Claude|클로드|코드 모르|코드를 모르|별빛 산책|starwalk', re.sub(r'<script.*?</script>', '', s, flags=re.S))]
    print(f'쪽 {len(pages)}개 만듦 (v={VER["v"]})' + (f' · !! 쓰면 안 되는 말이 있는 쪽: {bad}' if bad else ''))


if __name__ == '__main__':
    main()
