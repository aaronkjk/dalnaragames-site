# 달나라 게임즈 웹사이트

dalnaragames.com 에 올라가는 1인 게임 회사 홈페이지예요. 2026-11-19부터 새 디자인('달밤 오락실').

- 쪽은 `python3 tools/site/build.py`로 만들어요(글 `tools/site/content.py` 네 언어, 개인정보·약관·문의 본문 `tools/site/docs/`).
- `index.html` — 첫 화면(게임 고르기·기록·다음 판·소식·유튜브·버그·의견)
- `hanmari/` · `tongtong/` · `delivery/`(계단의 전설) · `house/`(잡귀야 물러가라) — 게임마다 따로 쪽
- `contact.html` — 문의 (게임 설정의 '문의' 링크가 오는 곳, `?game=…&lang=…`)
- `privacy.html` · `terms.html` — 개인정보처리방침·이용약관 (한국어 원문, 구글 플레이 등록용)
- `404.html` — 없는 주소일 때(언어 폴더 주소면 그 언어 404로)
- `ja/` · `zh-TW/` · `en/` — 일본어·번체 중국어·영어 쪽 (한국어와 같은 구조, 방침·약관은 참고 번역)
- `lang.js` — 언어 고르기·처음 들어올 때 언어 맞추기, `sitemap.xml` — 검색용 쪽 목록
- `assets/site/` — 모양(site.css)·움직임(site.js·pond.js)·유튜브 목록(yt.js)·글꼴·로고
- `assets/loops/` 게임 카드 움직이는 화면 · `assets/news/` 소식 사진 · `assets/pz/` 퍼즐 화면 · `assets/fish/` 물고기 카드 · `assets/*.webp` 게임 화면·아이콘
- `sns/` — SNS 게시 목록(내부, 옛 도트 모양 `style.css`를 씀)
- `tools/site/check.js` — 점검(쪽 36개 × 폭 6 · 모든 링크 · 밝게/어둡게)
- `CNAME` — 사이트 주소(도메인) 연결용 파일
