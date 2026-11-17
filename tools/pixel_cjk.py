#!/usr/bin/env python3
"""일본어·번체 중국어 쪽의 도트 글꼴 글자 만들기 → assets/fonts/pixel-cjk.woff2

왜: 맨 위·제목·버튼에 쓰는 도트 글꼴(갈무리11 굵게)에는 가나·한자가 없어요.
그래서 갈무리11 보통 굵기(SIL OFL)에서 ja/·zh-TW/ 쪽에 실제로 나오는 글자만 뽑고,
갈무리에 없는 번체 글자 몇 개는 Fusion Pixel 12px 번체(SIL OFL, Cubic 11 바탕)에서 가져와 한 파일로 합쳐요.
OFL의 '예약 이름' 걱정이 없게 글꼴 이름은 'Dalnara Pixel CJK'로 바꿔요.

언제: ja/ 나 zh-TW/ 쪽에 새 글자가 들어가면(새 게임 이름, 새 제목) 한 번 돌려요.
쓰는 법: python3 tools/pixel_cjk.py        (npm으로 글꼴 꾸러미를 임시 폴더에 받아요. 인터넷 필요)
"""
import glob, os, subprocess, sys, tarfile, tempfile

from fontTools.ttLib import TTFont, newTable
from fontTools.subset import Subsetter, Options
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'assets', 'fonts', 'pixel-cjk.woff2')
GALMURI = 'galmuri@2.40.3'
FUSION = '@vp-tw/cjk-web-fonts-fusion-pixel-font@0.0.1'
UI = '日本語繁體中文'  # 모든 쪽 언어 고르기에 나오는 글자


def cjk(c):
    o = ord(c)
    return (0x3000 <= o <= 0x30FF or 0x3400 <= o <= 0x4DBF or 0x4E00 <= o <= 0x9FFF
            or 0xF900 <= o <= 0xFAFF or 0xFF00 <= o <= 0xFFEF)


def npm_get(spec, work):
    d = os.path.join(work, spec.replace('/', '_').replace('@', '_'))
    if not os.path.isdir(d):
        os.makedirs(d)
        name = subprocess.check_output(['npm', 'pack', spec, '--silent'], cwd=d, text=True).strip().splitlines()[-1]
        with tarfile.open(os.path.join(d, name)) as t:
            t.extractall(d, filter='data')
    return os.path.join(d, 'package')


def main():
    chars = set(UI)
    for f in glob.glob(os.path.join(SITE, 'ja', '**', '*.html'), recursive=True) + \
            glob.glob(os.path.join(SITE, 'zh-TW', '**', '*.html'), recursive=True):
        chars |= {c for c in open(f, encoding='utf-8').read() if cjk(c)}
    work = os.environ.get('PIXEL_CJK_WORK') or os.path.join(tempfile.gettempdir(), 'dalnara-pixel-cjk')
    os.makedirs(work, exist_ok=True)
    gal = os.path.join(npm_get(GALMURI, work), 'dist', 'Galmuri11.ttf')
    font = TTFont(gal)
    have = font.getBestCmap()
    keep = sorted(c for c in chars if ord(c) in have)
    lack = sorted(c for c in chars if ord(c) not in have)

    opt = Options()
    opt.layout_features = []
    opt.name_IDs = ['*']
    opt.notdef_outline = True
    sub = Subsetter(opt)
    sub.populate(unicodes=[ord(c) for c in keep] + [0x20])
    sub.subset(font)

    added, still = [], []
    if lack:
        fus = os.path.join(npm_get(FUSION, work), 'dist', '12px', 'proportional', 'zh_hant')
        src = {}
        for f in sorted(glob.glob(os.path.join(fus, '*.woff2'))):
            t = TTFont(f)
            for cp, gn in t.getBestCmap().items():
                src.setdefault(cp, (t, gn))
        cmap = font['cmap']
        for c in lack:
            if ord(c) not in src:
                still.append(c)
                continue
            t, gn = src[ord(c)]
            pen = TTGlyphPen(None)
            t.getGlyphSet()[gn].draw(TransformPen(pen, (1, 0, 0, 1, 0, 100)))  # Fusion은 갈무리보다 1칸(100) 아래라서 올림
            name = 'fus_%04X' % ord(c)
            font['glyf'][name] = pen.glyph()
            font['hmtx'][name] = (t['hmtx'][gn][0], 0)
            order = font.getGlyphOrder()
            if name not in order:
                font.setGlyphOrder(order + [name])
            for tb in cmap.tables:
                if tb.isUnicode():
                    tb.cmap[ord(c)] = name
            added.append(c)
        font['maxp'].numGlyphs = len(font.getGlyphOrder())
        font['hhea'].numberOfHMetrics = len(font.getGlyphOrder())

    for rec in font['name'].names:
        if rec.nameID in (1, 4, 16, 21):
            rec.string = 'Dalnara Pixel CJK'
        elif rec.nameID == 6:
            rec.string = 'DalnaraPixelCJK'
        elif rec.nameID == 3:
            rec.string = 'Dalnara Pixel CJK (subset of Galmuri11 + Fusion Pixel 12px)'
    font.flavor = 'woff2'
    font.save(OUT)
    print(f'{os.path.relpath(OUT, SITE)}: 글자 {len(keep) + len(added)}개, {os.path.getsize(OUT):,}바이트')
    if added:
        print('Fusion Pixel에서 가져온 글자:', ''.join(added))
    if still:
        print('두 글꼴 다 없는 글자(기기 글꼴로 보임):', ''.join(still))


if __name__ == '__main__':
    main()
