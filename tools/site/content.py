# 홈페이지 글과 사실 (네 언어) — 2026-11-19 새 디자인(달밤 오락실)
# 사실 근거: 지금까지 사이트의 각 게임 쪽 글, 게임 저장소 docs/WORKPLAN.md·games/*/STORE.md, 게임 index.html의 번역표(물고기·바다·등급)
# 규칙: 별빛 산책은 넣지 않음 · 만드는 도구 이야기는 쓰지 않음 · 사실(숫자·실제로 있는 기능)만
# 고치는 법: 글을 바꾸면 네 언어를 같이 바꾸고 `python3 tools/site/build.py`


def L(ko, ja, zh, en):
    return {'ko': ko, 'ja': ja, 'zh-TW': zh, 'en': en}


LANGS = ['ko', 'ja', 'zh-TW', 'en']
LANG_NAME = {'ko': '한국어', 'ja': '日本語', 'zh-TW': '繁體中文', 'en': 'English'}
LANG_SHORT = {'ko': 'KO', 'ja': 'JA', 'zh-TW': '繁中', 'en': 'EN'}
OG_LOCALE = {'ko': 'ko_KR', 'ja': 'ja_JP', 'zh-TW': 'zh_TW', 'en': 'en_US'}
PREFIX = {'ko': '', 'ja': 'ja/', 'zh-TW': 'zh-TW/', 'en': 'en/'}
SITE = 'https://dalnaragames.com/'
TH, IG, YT = 'https://www.threads.com/@dalnara_games', 'https://www.instagram.com/dalnara_games/', 'https://www.youtube.com/@dalnara_games'
YT_SUB = YT + '?sub_confirmation=1'
MAIL = 'dalnaragames.official@gmail.com'

T = {
    'site': L('달나라 게임즈', 'Dalnara Games', 'Dalnara Games', 'Dalnara Games'),
    'desc': L('1인 게임 회사 달나라 게임즈. 작품 7개(구글 플레이 비공개 테스트 4 · 만드는 중 퍼즐 3).',
              'ひとりのゲーム会社 Dalnara Games（달나라 게임즈）。作品7本（Google Play クローズドテスト4・制作中のパズル3）。',
              '一人遊戲公司 Dalnara Games（달나라 게임즈）。作品 7 款（Google Play 封閉測試 4 款・製作中的益智遊戲 3 款）。',
              'Dalnara Games (달나라 게임즈), a one-person game studio in Korea. 7 titles: 4 in Google Play closed testing, 3 puzzles in the works.'),
    'band': L('1인 게임 회사', 'ひとりのゲーム会社', '一人遊戲公司', 'One-person game studio'),
    'skip': L('본문으로 건너뛰기', '本文へ移動', '跳到主要內容', 'Skip to content'),
    'menu': L('메뉴', 'メニュー', '選單', 'Menu'),
    'close': L('닫기', '閉じる', '關閉', 'Close'),
    'menu.tip': L('↑ ↓ 로 고르고 Enter', '↑ ↓ で選んで Enter', '用 ↑ ↓ 選擇，按 Enter', 'Use ↑ ↓ and Enter'),
    'menu.here': L('이 쪽', 'このページ', '本頁', 'This page'),
    'menu.home': L('처음 쪽', 'トップページ', '首頁', 'Home'),
    'menu.top': L('첫 화면', 'トップ', '首頁畫面', 'Top'),
    'snd.on': L('소리 켬', '音 オン', '聲音 開', 'Sound on'),
    'snd.off': L('소리 끔', '音 オフ', '聲音 關', 'Sound off'),
    'mode.light': L('밝게', '明るく', '亮色', 'Light'),
    'mode.dark': L('어둡게', '暗く', '暗色', 'Dark'),
    'mode.aria': L('화면 밝기', '画面の明るさ', '畫面亮度', 'Screen brightness'),
    'lang.aria': L('언어', '言語', '語言', 'Language'),
    'new.win': L('새 창', '新しいウィンドウ', '新視窗', 'opens in a new window'),
    'jump.aria': L('바로 가기', 'ジャンプ', '快速前往', 'Jump to'),
    'sns.aria': L('SNS', 'SNS', '社群', 'Social'),
    'sns.th': L('쓰레드', 'Threads', 'Threads', 'Threads'),
    'sns.ig': L('인스타그램', 'Instagram', 'Instagram', 'Instagram'),
    'sns.yt': L('유튜브', 'YouTube', 'YouTube', 'YouTube'),
    'loading': L('불러오는 중', '読み込み中', '載入中', 'Loading'),
    'seoul': L('서울', 'ソウル', '首爾', 'Seoul'),
    'moon': L('오늘 달', '今日の月', '今天的月亮', "Tonight's moon"),
    'down': L('게임 고르기', 'ゲームを選ぶ', '選擇遊戲', 'Choose a game'),
    'pond.hint': L('옆으로 그으면 돌이 튀어요', '横にスワイプすると石がはねます', '橫向滑動，石頭就會彈跳', 'Swipe sideways to skip a stone'),
    'pond.count': L('{n}번!', '{n}回！', '{n} 次！', '{n} skips!'),
    'pond.best': L('최고 {n}번', 'ベスト {n}回', '最高 {n} 次', 'Best {n}'),
    'pond.aria': L('물수제비 놀이: 물 위를 옆으로 그으면 돌을 던지고, 누르면 물결이 생겨요',
                   '水切りあそび：水の上を横にスワイプすると石を投げ、タップすると波紋ができます',
                   '打水漂小遊戲：在水面上橫向滑動就會丟石頭，點一下會出現漣漪',
                   'Stone skipping: swipe sideways across the water to throw, tap to make ripples'),
    # 구역
    'sec.games': L('게임 고르기', 'ゲームを選ぶ', '選擇遊戲', 'Choose a game'),
    'sec.log': L('기록', '記録', '紀錄', 'Log'),
    'sec.next': L('다음 판', '次の版', '下一版', 'Next update'),
    'sec.news': L('소식', 'お知らせ', '最新消息', 'News'),
    'sec.yt': L('유튜브', 'YouTube', 'YouTube', 'YouTube'),
    'sec.bug': L('버그·의견', '不具合・ご意見', '錯誤・意見', 'Bugs & feedback'),
    # 게임 고르기
    'pk.aria': L('고른 게임. 옆으로 밀거나 ← → 로 넘겨요', '選んだゲーム。横にスワイプするか ← → で切りかえます', '選中的遊戲。左右滑動或用 ← → 切換', 'Selected game. Swipe or use ← → to switch'),
    'pk.prev': L('앞 게임', '前のゲーム', '上一款', 'Previous game'),
    'pk.next': L('다음 게임', '次のゲーム', '下一款', 'Next game'),
    'pk.cards': L('게임 {n}개', 'ゲーム{n}本', '{n} 款遊戲', '{n} games'),
    'pk.go': L('자세히', '詳しく', '詳情', 'Details'),
    'pk.later': L('퍼즐 쪽은 출시 때 생겨요.', 'パズルのページは公開のときにできます。', '益智遊戲的頁面會在上架時推出。', 'Puzzle pages will go up at launch.'),
    'st.test': L('구글 플레이 비공개 테스트 중', 'Google Playでクローズドテスト中', 'Google Play 封閉測試中', 'Closed testing on Google Play'),
    'st.test.s': L('테스트 중', 'テスト中', '測試中', 'Testing'),
    'st.soon': L('만드는 중', '制作中', '製作中', 'In the works'),
    'st.soon.s': L('만드는 중', '制作中', '製作中', 'In the works'),
    'ko.only': L('한국어 전용', '韓国語のみ', '僅限韓文', 'Korean only'),
    'media.vid': L('{g} 게임 화면', '{g}のゲーム画面', '{g} 遊戲畫面', '{g} gameplay'),
    'media.pz': L('{g} 만드는 중 화면', '{g}の制作中の画面', '{g} 製作中的畫面', '{g}, work in progress'),
    # 기록 줄
    'log.now': L('지금', 'いま', '現在', 'Now'),
    'log.now.t': L('다음 판 준비 중', '次の版を準備中', '正在準備下一版', 'Working on the next update'),
    'log.tip': L('내리면 옆으로 지나가요', '下にスクロールすると横に流れます', '往下捲動就會橫向移動', 'Scroll down to move along'),
    'log.swipe': L('옆으로 밀면 더 보여요', '横にスワイプすると続きが見えます', '左右滑動可以看更多', 'Swipe sideways to see more'),
    # 소식
    'news.lang': L('소식 언어', 'お知らせの言語', '消息語言', 'News language'),
    'news.prev': L('앞 소식', '前のお知らせ', '上一則', 'Previous post'),
    'news.next': L('다음 소식', '次のお知らせ', '下一則', 'Next post'),
    # 유튜브
    'yt.empty': L('첫 영상 준비 중', '最初の動画を準備中', '第一支影片準備中', 'First video coming soon'),
    'yt.sub': L('구독하기', 'チャンネル登録', '訂閱', 'Subscribe'),
    # 버그·의견
    'fb.h': L('버그·의견 보내기', '不具合・ご意見', '回報錯誤・意見', 'Bugs & feedback'),
    'fb.bug.t': L('버그 알려 주기', '不具合を知らせる', '回報錯誤', 'Report a bug'),
    'fb.bug.p': L('이상한 점을 찾으면 알려 주세요.', 'おかしな点を見つけたら教えてください。', '發現奇怪的地方請告訴我。', 'Spotted something odd? Let me know.'),
    'fb.bug.subj': L('[버그] ', '[不具合] ', '[錯誤] ', '[Bug] '),
    'fb.idea.t': L('게임 의견 보내기', 'ゲームへの意見', '遊戲意見', 'Game feedback'),
    'fb.idea.p': L('바라는 것, 재미있던 것, 아쉬운 것을 보내 주세요.', 'ほしいもの、楽しかったこと、物足りないことを送ってください。',
                   '想要的、好玩的、可惜的地方都歡迎寄來。', 'Tell me what you want, what was fun and what fell short.'),
    'fb.idea.subj': L('[의견] ', '[ご意見] ', '[意見] ', '[Feedback] '),
    'fb.write': L('메일 쓰기', 'メールを書く', '寫信', 'Write an email'),
    'fb.copy': L('주소 복사', 'アドレスをコピー', '複製地址', 'Copy address'),
    'fb.copied': L('복사했어요', 'コピーしました', '已複製', 'Copied'),
    'fb.picked': L('주소를 골라 두었어요. 길게 눌러 복사해 주세요', 'アドレスを選択しました。長押しでコピーしてください', '已選取地址，請長按複製', 'Address selected. Press and hold to copy'),
    'fb.contact': L('게임을 골라 문의하기', 'ゲームを選んで問い合わせる', '選擇遊戲來詢問', 'Contact about a specific game'),
    'fb.sns': L('SNS 댓글로 남겨도 돼요.', 'SNSのコメントでもOKです。', '也可以在社群留言。', 'Comments on social media work too.'),
    # 맨 아래
    'foot.h': L('만드는 과정은 SNS에 다 올려요', 'つくる様子はSNSにのせています（韓国語）', '製作過程都放在社群上（韓文）', 'I post the making-of on social media (in Korean)'),
    'foot.nav': L('안내', '案内', '說明', 'Info'),
    'doc.privacy': L('개인정보처리방침', 'プライバシーポリシー', '隱私權政策', 'Privacy Policy'),
    'doc.terms': L('이용약관', '利用規約', '服務條款', 'Terms of Service'),
    'doc.contact': L('문의', 'お問い合わせ', '聯絡我們', 'Contact'),
    # 404
    'lost.h': L('길을 잃었어요', '道に迷いました', '迷路了', 'Lost your way'),
    'lost.p': L('이 주소에는 쪽이 없어요. 돌이나 한 번 던지고 가요.', 'このアドレスにはページがありません。石でもひとつ投げていってください。',
                '這個網址沒有頁面。丟顆石頭再走吧。', "There's no page at this address. Skip a stone before you go."),
    'lost.home': L('처음으로', 'トップへ', '回首頁', 'Back home'),
    # 게임 쪽
    'g.back': L('게임 고르기', 'ゲームを選ぶ', '選擇遊戲', 'Choose a game'),
    'g.about': L('소개', '紹介', '介紹', 'About'),
    'g.how': L('조작법', 'あそび方', '玩法', 'How to play'),
    'g.fish': L('물고기 카드', '魚のカード', '魚卡', 'Fish cards'),
    'g.fish.j': L('물고기', '魚', '魚', 'Fish'),
    'g.shots': L('게임 화면', 'ゲーム画面', '遊戲畫面', 'Screens'),
    'g.shots.j': L('화면', '画面', '畫面', 'Screens'),
    'g.log': L('업데이트 기록', 'アップデート記録', '更新紀錄', 'Update log'),
    'g.log.j': L('기록', '記録', '紀錄', 'Log'),
    'g.next': L('다음 판', '次の版', '下一版', 'Next update'),
    'g.nextgame': L('다음 게임', '次のゲーム', '下一款遊戲', 'Next game'),
    'g.toall': L('게임 고르기로', 'ゲーム一覧へ', '回到遊戲列表', 'Back to all games'),
    'g.flip': L('{n} 카드 뒤집기', '{n}のカードを裏返す', '翻開{n}卡片', 'Flip the {n} card'),
    'g.sea': L('바다', '海', '海域', 'Sea'),
    'g.size': L('크기', 'サイズ', '尺寸', 'Size'),
    'g.soon': L('지금 구글 플레이에서 비공개 테스트 중이에요. 정식으로 나오면 여기에 받는 곳을 달아 둘게요.',
                'いまGoogle Playでクローズドテスト中です。正式に出たら、ここにダウンロード先をのせます。',
                '目前正在 Google Play 封閉測試中。正式上架後，會在這裡放上下載連結。',
                "It's in closed testing on Google Play right now. Once it's officially out, I'll put the download link here."),
    'g.koonly': L('지금은 한국어만 돼요', 'いまは韓国語だけです', '目前只有韓文', 'For now the game is in Korean only'),
    'g.desc': L('{g} · {one}. 구글 플레이 비공개 테스트 중.', '{g}・{one}。Google Playでクローズドテスト中。', '{g}・{one}。Google Play 封閉測試中。', '{g}: {one}. In closed testing on Google Play.'),
    'lost.title': L('길을 잃었어요', '道に迷いました', '迷路了', 'Lost your way'),
}

FOOT_BIZ = L(
    ['달나라 게임즈(Dalnara Games) · 운영 JKCOMMERCE(제이케이 커머스)', '대표 김재경 · 사업자등록번호 874-32-01793', '서울특별시 강동구 올림픽로 820, 4층 401-328호', '© 2026 Dalnara Games'],
    ['Dalnara Games（달나라 게임즈）・運営 JKCOMMERCE', '代表 キム・ジェギョン（Jae Kyung Kim）・事業者登録番号 874-32-01793', '大韓民国 ソウル特別市 江東区 オリンピック路 820、4階 401-328号', '© 2026 Dalnara Games'],
    ['Dalnara Games（달나라 게임즈）· 營運 JKCOMMERCE', '代表 Jae Kyung Kim · 韓國營業登記號碼 874-32-01793', '大韓民國首爾特別市江東區奧林匹克路 820 號 4 樓 401-328 室', '© 2026 Dalnara Games'],
    ['Dalnara Games (달나라 게임즈) · Operated by JKCOMMERCE', 'CEO Jae Kyung Kim · Business registration no. 874-32-01793', 'Room 401-328, 4F, 820 Olympic-ro, Gangdong-gu, Seoul, Republic of Korea', '© 2026 Dalnara Games'])

MOON = L(['삭', '초승달', '상현달', '차오르는 달', '보름달', '기우는 달', '하현달', '그믐달'],
         ['新月', '三日月', '上弦の月', '満ちていく月', '満月', '欠けていく月', '下弦の月', '有明の月'],
         ['新月', '眉月', '上弦月', '盈凸月', '滿月', '虧凸月', '下弦月', '殘月'],
         ['New moon', 'Crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'])
GREET = L({'dawn': '새벽까지 깨어 계시네요', 'morning': '좋은 아침이에요', 'day': '좋은 오후예요', 'evening': '저녁 시간이에요', 'night': '밤 올빼미님 안녕하세요'},
          {'dawn': '夜明けまで起きているんですね', 'morning': 'おはようございます', 'day': 'こんにちは', 'evening': 'こんばんは', 'night': '夜ふかしさん、こんばんは'},
          {'dawn': '快天亮了還醒著呢', 'morning': '早安', 'day': '午安', 'evening': '晚上好', 'night': '夜貓子你好'},
          {'dawn': "Still up before dawn", 'morning': 'Good morning', 'day': 'Good afternoon', 'evening': 'Good evening', 'night': 'Hello, night owl'})

# ── 게임 7개 (순서 = 번호) ──
#  facts: (숫자, 칸 이름, 단위 — '{n}'이 숫자 자리, '{n}' 없으면 글만)
GAMES = [
    dict(id='hanmari', pkg='aquarium', no='01', st='test', vid=True, page=True, alts=['sea', 'catch', 'aquarium'],
         name=L('한 마리만 더', 'あと一匹だけ', '再釣一條就好', 'Just One More Fish'),
         kind=L('도트 낚시', 'ドット絵の釣り', '像素釣魚', 'Pixel fishing'),
         one=L('배 타고 물고기 낚아요', '船で海に出て魚を釣ります', '搭船出海釣魚', 'Take a boat out and fish'),
         facts=[(5, L(('바다', '{n}곳'), ('海', '{n}か所'), ('海域', '{n} 處'), ('Seas', '{n} areas'))),
                (76, L(('물고기', '{n}종'), ('魚', '{n}種'), ('魚', '{n} 種'), ('Fish', '{n} species'))),
                (4, L(('언어', '{n}개'), ('言語', '{n}言語'), ('語言', '{n} 種'), ('Languages', '{n}')))],
         extra=(0, L(('뽑기', '없음'), ('ガチャ', 'なし'), ('抽卡', '無'), ('Gacha', 'None')))),
    dict(id='tongtong', pkg='stoneskip', no='02', st='test', vid=True, page=True,
         name=L('통통 물수제비', 'ぽんぽん水切り', '跳跳打水漂', 'Bouncy Skip'),
         kind=L('3D 물수제비', '3Dの水切り', '3D 打水漂', '3D stone skipping'),
         one=L('토끼가 물수제비 떠요', 'うさぎが水切りをします', '兔子在打水漂', 'A bunny skips stones'),
         facts=[(8, L(('장소', '{n}곳'), ('場所', '{n}か所'), ('地點', '{n} 個'), ('Places', '{n}'))),
                (27, L(('돌', '{n}종'), ('石', '{n}種'), ('石頭', '{n} 種'), ('Stones', '{n} kinds'))),
                (4, L(('던지는 방식', '{n}가지'), ('投げ方', '{n}種類'), ('投法', '{n} 種'), ('Throws', '{n} styles')))],
         extra=(0, L(('뽑기', '없음'), ('ガチャ', 'なし'), ('抽卡', '無'), ('Gacha', 'None')))),
    dict(id='delivery', pkg='chicken', no='03', st='test', vid=True, page=True,
         name=L('계단의 전설', '階段の伝説', '樓梯傳說', 'Stair Legend'),
         tail=L('치킨 들고 옥상까지', 'チキンを持って屋上まで', '拎著炸雞衝頂樓', 'Chicken to the Rooftop'),
         kind=L('도트 계단 배달', 'ドット絵の階段配達', '像素樓梯外送', 'Pixel stair delivery'),
         one=L('치킨 들고 계단 올라요', 'チキンを持って階段をのぼります', '提著炸雞爬樓梯', 'Carry chicken up the stairs'),
         facts=[(17, L(('라이더', '{n}명'), ('ライダー', '{n}人'), ('外送員', '{n} 位'), ('Riders', '{n}'))),
                (7, L(('이웃', '{n}명'), ('ご近所さん', '{n}人'), ('鄰居', '{n} 位'), ('Neighbors', '{n}'))),
                (35, L(('이웃 사연', '{n}화'), ('ご近所の話', '{n}話'), ('鄰居故事', '{n} 集'), ('Neighbor stories', '{n} episodes')))],
         extra=(1, L(('언어', '{n}개'), ('言語', '{n}言語'), ('語言', '{n} 種'), ('Languages', '{n}'))), koonly=True),
    dict(id='house', pkg='house', no='04', st='test', vid=True, page=True,
         name=L('잡귀야 물러가라', '悪霊退散', '小鬼退散', 'Ghosts, Begone!'),
         tail=L('집 지키기 디펜스', 'おうちを守るディフェンス', '守護家園塔防', 'Home Defense'),
         kind=L('도트 한옥 디펜스', '韓屋のドット絵ディフェンス', '像素韓屋塔防', 'Pixel hanok defense'),
         one=L('한옥에서 잡귀 막아요', '韓屋で雑鬼をふせぎます', '在韓屋擋住小鬼', 'Keep ghosts out of a hanok'),
         facts=[(7, L(('가신', '{n}명'), ('家神', '{n}人'), ('家神', '{n} 位'), ('House gods', '{n}'))),
                (10, L(('귀신', '{n}종'), ('鬼', '{n}種'), ('鬼', '{n} 種'), ('Ghosts', '{n} kinds'))),
                (20, L(('이야기', '{n}밤'), ('お話', '{n}夜'), ('故事', '{n} 夜'), ('Story', '{n} nights')))],
         extra=(1, L(('언어', '{n}개'), ('言語', '{n}言語'), ('語言', '{n} 種'), ('Languages', '{n}'))), koonly=True),
    dict(id='wordsort', pkg='wordsort', no='05', st='soon', kosolo=True,
         name=L('낱말 서랍', '낱말 서랍', '낱말 서랍', '낱말 서랍'),
         kind=L('우리말 단어 분류 퍼즐', '韓国語の単語分けパズル', '韓文單字分類拼圖', 'Korean word-sorting puzzle'),
         one=L('섞인 낱말 카드를 맞는 서랍에 나눠 넣어요', 'まざった韓国語の単語カードを、合う引き出しに分けて入れます',
               '把混在一起的韓文單字卡，分進對的抽屜', 'Sort mixed-up Korean word cards into the right drawers'), facts=[]),
    dict(id='nonogram', pkg='nonogram', no='06', st='soon',
         name=L('칸칸 그림', 'カンカンお絵かき', '格子畫', 'Kankan Pixels'),
         kind=L('노노그램 퍼즐', 'ノノグラム', '數織像素謎題', 'Nonogram puzzle'),
         one=L('숫자를 보고 칸을 칠하면 그림이 나와요', '数字を見てマスをぬると、絵があらわれます', '看數字塗格子，就會出現圖畫', 'Fill in squares by the numbers and a picture appears'), facts=[]),
    dict(id='colorsort', pkg='colorsort', no='07', st='soon',
         name=L('젤리 팔레트', 'ゼリーパレット', '果凍調色盤', 'Jelly Palette'),
         kind=L('색 정렬 퍼즐', '色ならべパズル', '顏色排序拼圖', 'Color sort puzzle'),
         one=L('같은 색끼리 병에 모으면 그림이 칠해져요', '同じ色をびんに集めると、絵に色がつきます', '把同樣的顏色裝進同一個瓶子，圖就會上色', 'Gather each color into its own bottle and a picture gets painted'), facts=[]),
]
G = {g['id']: g for g in GAMES}

# ── 회사 기록 (2026년) ──
LOG = [
    ('11.04', L('홈페이지를 열었어요', 'ホームページを開きました', '架設了官方網站', 'Opened this website')),
    ('11.06', L('첫 게임 이름을 「한 마리만 더」로 정했어요', '最初のゲームの名前を「あと一匹だけ」に決めました', '第一款遊戲定名為「再釣一條就好」', 'Named the first game Just One More Fish')),
    ('11.09', L('두 번째 게임 이름은 「통통 물수제비」', '2作目の名前は「ぽんぽん水切り」', '第二款遊戲取名「跳跳打水漂」', 'The second game became Bouncy Skip')),
    ('11.12', L('한 마리만 더·통통 물수제비 비공개 테스트 시작', '「あと一匹だけ」「ぽんぽん水切り」クローズドテスト開始', '「再釣一條就好」「跳跳打水漂」開始封閉測試', 'Closed testing began for Just One More Fish and Bouncy Skip')),
    ('11.15', L('계단의 전설·잡귀야 물러가라 비공개 테스트 시작', '「階段の伝説」「悪霊退散」クローズドテスト開始', '「樓梯傳說」「小鬼退散」開始封閉測試', 'Closed testing began for Stair Legend and Ghosts, Begone!')),
    ('11.16', L('네 게임에 광고·결제를 붙인 판을 냈어요', '4つのゲームに広告と課金を入れた版を出しました', '四款遊戲推出加入廣告與付費的版本', 'Released all four games with ads and purchases')),
    ('11.17', L('로고를 먹 달토끼와 붉은 도장으로 바꿨어요', 'ロゴを墨の月うさぎと赤い印に変えました', '標誌換成水墨月兔和紅色印章', 'New logo: an ink moon rabbit with a red seal')),
    ('11.17', L('퍼즐 셋 이름을 정했어요', 'パズル3作の名前を決めました', '三款益智遊戲定好名字了', 'Named the three puzzle games')),
    ('11.17', L('홈페이지를 4개 언어로 열었어요', 'ホームページを4言語にしました', '網站開放四種語言', 'The website now comes in 4 languages')),
]

# ── 다음 판 (내용이 정해진 것만, 날짜는 구글 검토가 끝나야 정해져서 안 적음) ──
WHEN_NEXT = L('다음 판', '次の版', '下一版', 'Next')
WHEN_TBD = L('날짜 미정', '日付未定', '日期未定', 'Date TBD')
NEXT = {
    'hanmari': dict(ver='1.0.4', items=L(['물고기 기록 도전', '희귀 물고기 확률표'], ['魚の記録チャレンジ', 'レア魚の確率表'], ['魚類紀錄挑戰', '稀有魚機率表'], ['Fish record challenges', 'Rare fish odds table'])),
    'tongtong': dict(ver='1.0.3', items=L(['휙 던지기 끝 스핀', '결과 카드 코인 계산'], ['フリック投げの最後のスピン', '結果カードのコイン計算'], ['甩投尾端旋轉', '結算卡的金幣計算'], ['End spin on flick throws', 'Coin breakdown on the result card'])),
    'delivery': dict(ver='1.0.2', items=L(['일본어·번체 중국어·영어'], ['日本語・繁体字中国語・英語'], ['日文・繁體中文・英文'], ['Japanese, Traditional Chinese, English'])),
    'house': dict(ver='1.0.2', items=L(['일본어·번체 중국어·영어'], ['日本語・繁体字中国語・英語'], ['日文・繁體中文・英文'], ['Japanese, Traditional Chinese, English'])),
    'puzzle': dict(ver='1.0.0', items=L(['구글 플레이 비공개 테스트'], ['Google Playのクローズドテスト'], ['Google Play 封閉測試'], ['Google Play closed testing'])),
}
NEXT_ORDER = [('hanmari', None), ('tongtong', None), ('delivery+house', None), ('puzzle', None)]
PUZZLE3 = L('퍼즐 셋', 'パズル3作', '三款益智遊戲', 'The three puzzles')

# ── 게임 쪽 ──
ABOUT = {
    'hanmari': L(['배 타고 바다에 나가서 물고기 낚는 게임이에요. 낚은 애들은 수족관에 넣어 두고 구경해요.',
                  '이름은 쓰레드 투표로 정했어요. 계속 낚고 싶어지는 이름이라는 댓글이 딱 하나 왔는데 그걸로 갔어요ㅋㅋ',
                  '그달에만 나오는 물고기가 12종 있고, 바다 하나를 다 모으면 트로피를 받아요. 매일 출석 도장이랑 미션도 있어요.'],
                 ['船で海に出て、魚を釣るゲームです。釣った魚は水族館に入れて、ながめられます。',
                  '韓国語の名前は、Threadsの投票で決めました。「ずっと釣りたくなる名前」というコメントがひとつだけ来たので、それに決めました（笑）',
                  'その月にしか出ない魚が12種います。海ひとつ分そろえるとトロフィーがもらえます。毎日ログインスタンプとミッションもあります。'],
                 ['這是一款搭船出海釣魚的遊戲。釣到的魚可以放進水族館慢慢看。',
                  '韓文名字是在 Threads 上投票決定的。只來了一則留言，說這是會讓人一直想釣下去的名字，所以就決定是它了哈哈',
                  '只在那個月出現的魚有 12 種，收集完一整片海域就能拿到獎盃。每天也有簽到和任務。'],
                 ['A game where you take a boat out to sea and catch fish. The ones you catch go into your aquarium so you can watch them.',
                  'The Korean name was picked by a vote on Threads. Exactly one comment came in, saying it’s a name that makes you want to keep fishing, so I went with it lol',
                  '12 kinds of fish only show up in their own month, and completing a whole sea gets you a trophy. There are daily check-in stamps and missions too.']),
    'tongtong': L(['달밤 호수에서 통통한 토끼가 물수제비 뜨는 게임이에요. 한 판이 몇 초면 끝나서 잠깐씩 하기 좋아요.',
                   '돌도 통통 튀고 토끼도 통통해서 이름이 통통 물수제비예요ㅋㅋ'],
                  ['月夜の湖で、ぽっちゃりしたうさぎが水切りをするゲームです。1回が数秒で終わるので、ちょっとずつ遊ぶのにちょうどいいです。',
                   '石もぽんぽんはねるし、うさぎのおなかもぽんぽんなので、名前が「ぽんぽん水切り」です（笑）'],
                  ['這是一款圓滾滾的兔子在月夜湖邊打水漂的遊戲。一局幾秒鐘就結束，很適合有空的時候玩一下。',
                   '石頭會跳，兔子也會跳，所以名字就叫「跳跳打水漂」哈哈'],
                  ['A chubby bunny skips stones on a moonlit lake. A round is over in a few seconds, so it’s good for a quick go now and then.',
                   'The stones bounce and the bunny looks pretty bouncy too, so I called it Bouncy Skip lol']),
    'delivery': L(['엘리베이터가 점검 중인 아파트에서 치킨 들고 계단으로 배달하는 게임이에요.',
                   '밖에서 보면 15층짜리 아파트인데 계단은 왜 끝이 없는지도 나와요ㅋㅋ'],
                  ['エレベーターが点検中のマンションで、チキンを持って階段で配達するゲームです。',
                   '外から見ると15階建てなのに、どうして階段に終わりがないのかもわかります（笑）'],
                  ['公寓的電梯正在維修，只好提著炸雞走樓梯送外送。',
                   '從外面看明明只有 15 層樓，為什麼樓梯卻走不完，遊戲裡也會揭曉哈哈'],
                  ['The elevator in the apartment building is under maintenance, so you deliver chicken by the stairs.',
                   'From outside it’s a 15-floor building, and you also find out why the stairs never end lol']),
    'house': L(['30년 동안 비어 있던 한옥 \'느티나무집\'에 가족이 이사 왔어요. 밤마다 대문으로 들어오는 잡귀를 집 지키는 신(가신)들이랑 같이 막는 게임이에요.'],
               ['30年間だれも住んでいなかった韓屋（韓国の伝統家屋）「ケヤキの家」に、家族が引っ越してきました。夜ごとに大門から入ってくる雑鬼を、家を守る神さま（家神）たちといっしょにふせぐゲームです。'],
               ['空了 30 年的韓屋（韓國傳統房子）「櫸樹老家」搬來了一家人。每天晚上都有小鬼從大門闖進來，要和守護這個家的神明（家神）一起擋住它們。'],
               ['A family has moved into Zelkova House, a hanok (traditional Korean house) that sat empty for 30 years. Every night, ghosts come in through the front gate, and you keep them out together with the gods who guard the house (gasin).']),
}
ADS = {
    'gacha': L('뽑기는 안 넣었어요. 광고는 버튼을 누를 때만 나와요.', 'ガチャは入れていません。広告はボタンを押したときだけ出ます。',
               '沒有放轉蛋。廣告只有在按下按鈕時才會出現。', 'No gacha. Ads only play when you tap a button for them.'),
    'ads': L('광고는 버튼을 누를 때만 나와요.', '広告はボタンを押したときだけ出ます。', '廣告只有在按下按鈕時才會出現。', 'Ads only play when you tap a button for them.'),
}
HOW = {
    'hanmari': L(['찌가 쑥 들어갈 때 채요', '낚을 때마다 그림 카드가 모여요', '꺼 둬도 수족관에 손님이 와요'],
                 ['ウキがぐっと沈んだら合わせます', '釣るたびに絵のカードが集まります', 'ゲームを閉じていても水族館にお客さんが来ます'],
                 ['浮標整個沉下去時揚竿', '每釣一條就多一張圖卡', '就算關掉遊戲，水族館也會有遊客'],
                 ['Set the hook when the bobber dips under', 'Every catch adds a picture card', 'Visitors come to the aquarium even while the game is closed']),
    'tongtong': L(['화면을 위로 쓸어 올리면 던져요', '돌이 물에 닿을 때 맞춰 누르면 한 번 더 튀어요', '던지는 방식은 4가지 중에 편한 걸로 골라요'],
                  ['画面を上にスワイプすると投げます', '石が水にふれるときにタップすると、もう一回はねます', '投げ方は4つの中から、やりやすいものを選べます'],
                  ['在畫面上往上滑就會丟出去', '石頭碰到水面時點一下，就會再跳一次', '丟法有 4 種，選自己順手的就好'],
                  ['Swipe up to throw', 'Tap as the stone touches the water and it skips once more', 'Pick whichever of the 4 throwing styles suits you']),
    'delivery': L(['라이더는 알아서 한 칸씩 올라가요', '계단이 꺾이는 데서 화면을 눌러요', '방향을 잘못 바꾸면 발을 헛디뎌서 끝나요'],
                  ['ライダーは自分で1段ずつのぼります', '階段が曲がるところで画面をタップします', '向きをまちがえると足をふみはずして終わりです'],
                  ['外送員會自己一階一階往上爬', '在樓梯轉彎的地方點一下畫面', '方向轉錯就會踩空，遊戲結束'],
                  ['Your rider climbs one step at a time on their own', 'Tap where the stairs turn', 'Turn the wrong way and you miss a step, and that’s the end']),
    'house': L(['마당 빈 칸에 가신을 모셔요', '가신이 알아서 귀신을 쫓아요', '귀신이 안방까지 오면 촛불이 꺼지고, 다 꺼지면 져요'],
               ['庭の空いたマスに家神をまつります', '家神が自分で鬼を追いはらいます', '鬼が奥の部屋まで来るとろうそくが消え、全部消えると負けです'],
               ['在院子的空格裡供奉家神', '家神會自己把鬼趕走', '鬼走到主臥房蠟燭就會熄滅，全部熄滅就輸了'],
               ['Place a house god on an empty spot in the yard', 'It chases ghosts away on its own', 'A ghost that reaches the main room puts out a candle. When they’re all out, you lose']),
}
# 볼거리: (제목, 바로 가기 이름, [(이름, 설명)…])
POINTS = {
    'hanmari': (L('바다 다섯 곳', '5つの海', '五片海域', 'Five seas'), L('바다', '海', '海域', 'Seas'),
                L([('연안', '항구가 보이는 얕은 바다'), ('산호초', '따뜻하고 알록달록한 바다'), ('대륙붕', '큰 물고기가 지나가는 넓은 바다'), ('해구', '빛이 닿지 않는 깊은 골짜기'), ('심연', '가장 깊은 바다')],
                  [('沿岸', '港が見える浅い海'), ('サンゴ礁', 'あたたかくてカラフルな海'), ('大陸棚', '大きな魚が行き交う広い海'), ('海溝', '光の届かない深い谷'), ('深淵', 'いちばん深い海')],
                  [('沿岸', '看得見港口的淺海'), ('珊瑚礁', '溫暖又繽紛的海'), ('大陸棚', '大魚來來去去的遼闊海域'), ('海溝', '光線照不到的深谷'), ('深淵', '最深的海')],
                  [('Coast', 'Shallow water within sight of the harbor'), ('Coral Reef', 'Warm, colorful water'), ('Shelf Sea', 'Wide open water where big fish roam'), ('Trench', 'A deep valley no light can reach'), ('Abyss', 'The deepest sea')])),
    'tongtong': (L('장소와 돌', '場所と石', '地點與石頭', 'Places & stones'), L('장소·돌', '場所・石', '地點・石頭', 'Places'),
                 L([('장소 8곳', '노을 지는 개울도 있고 눈 오는 호수도 있어요'), ('돌 27종', '물가에서 줍거나 코인으로 사요. 달항아리처럼 생긴 돌도 있어요'),
                    ('토끼 꾸미기', '목도리랑 갓을 씌울 수 있어요'), ('출석·미션·업적', '매일 출석 도장이랑 미션이 있고 업적은 30개예요')],
                   [('場所8か所', '夕焼けの小川もあれば、雪のふる湖もあります'), ('石27種', '水辺でひろうか、コインで買います。月壺（タルハンアリ）みたいな石もあります'),
                    ('うさぎのおしゃれ', 'マフラーやカッ（韓国の笠）をつけてあげられます'), ('スタンプ・ミッション・実績', '毎日スタンプとミッションがあって、実績は30個です')],
                   [('8 個地點', '有夕陽下的小溪，也有下雪的湖'), ('27 種石頭', '可以在水邊撿，或用金幣買。也有長得像月亮罐的石頭'),
                    ('打扮兔子', '可以幫兔子戴上圍巾和笠帽'), ('簽到・任務・成就', '每天都有簽到和任務，成就有 30 個')],
                   [('8 places', 'A creek at sunset, a lake in the snow and more'), ('27 stones', 'Pick them up by the water or buy them with coins. One even looks like a Korean moon jar'),
                    ('Dress up the bunny', 'Give it a scarf and a gat (a traditional Korean hat)'), ('Stamps, missions, achievements', 'Daily stamps and missions, plus 30 achievements')])),
    'delivery': (L('이웃과 라이더', 'ご近所さんとライダー', '鄰居與外送員', 'Neighbors & riders'), L('이웃·라이더', 'ご近所・ライダー', '鄰居・外送員', 'Neighbors'),
                 L([('이웃 7명', '이웃마다 사연이 5화씩 있어요. 끝까지 보면 그 이웃이 같이 배달하러 나와요'), ('라이더 17명', '고양이랑 시바도 있어요'),
                    ('라이더 이야기', '번 돈이 쌓이면 한 장씩 열려요. 마지막 장은 내 치킨집 오픈이에요'), ('100층', "닿으면 '계단의 전설' 칭호를 받아요"),
                    ('이번 주 순위', '월요일마다 새로 시작해요')],
                   [('ご近所さん7人', 'それぞれ5話ずつお話があります。最後まで見ると、その住人がいっしょに配達に出てくれます'), ('ライダー17人', 'ネコと柴犬もいます'),
                    ('ライダーの物語', 'かせいだお金がたまると1章ずつ開きます。最後の章は、自分のチキン屋さんのオープンです'), ('100階', '着くと「階段の伝説」の称号がもらえます'),
                    ('今週のランキング', '毎週月曜日に新しく始まります')],
                   [('7 位鄰居', '每位鄰居各有 5 集故事。看到最後，那位鄰居就會一起出來送外送'), ('17 位外送員', '還有貓和柴犬'),
                    ('外送員的故事', '賺的錢累積起來就會一章一章打開。最後一章是開自己的炸雞店'), ('100 樓', '爬到就能拿到「樓梯傳說」稱號'),
                    ('本週排行榜', '每週一重新開始')],
                   [('7 neighbors', 'Each has a 5-part story. See one to the end and that neighbor joins your deliveries'), ('17 riders', 'Including a cat and a Shiba'),
                    ('The rider’s story', 'Opens a chapter at a time as your earnings pile up. The last chapter is opening your own chicken shop'),
                    ('Floor 100', 'Reach it and you get the title “Stair Legend”'), ('Weekly ranking', 'Starts over every Monday')])),
    'house': (L('가신과 귀신', '家神と鬼', '家神與鬼', 'Gods & ghosts'), L('가신·귀신', '家神・鬼', '家神・鬼', 'Gods'),
              L([('가신 일곱', '부엌을 지키는 조왕신, 대문을 지키는 문신부터 삼신할머니까지 하나씩 깨어나요'), ('귀신 열 가지', '대장도 셋 있어요'),
                 ('스무 밤 이야기', '설날 밤 야광귀, 정월 대보름 부럼 같은 옛 풍속이 나와요'), ('할머니 부탁', '밤마다 세 개씩 있어요'),
                 ('오늘의 밤', '날마다 마당이랑 규칙이 바뀌어요'), ('끝없는 밤', '여섯째 밤을 깨면 열려요. 몇 떼 버텼는지로 이번 주 순위를 매겨요')],
                [('家神7人', '台所を守るかまど神、門を守る門神から、産神さままで、ひとりずつ目をさまします'), ('鬼10種類', 'ボスも3体います'),
                 ('二十夜のお話', '旧正月の夜のヤグァングィ（夜光鬼）や、小正月にナッツを割って食べるプロムのような、昔の風習が出てきます'),
                 ('おばあさんのお願い', '夜ごとに3つずつあります'), ('今日の夜', '毎日、庭とルールが変わります'),
                 ('終わらない夜', '6日目の夜をクリアすると開きます。何波たえたかで今週のランキングが決まります')],
                [('七位家神', '從守護廚房的灶神、守護大門的門神，到註生娘娘，會一位一位醒來'), ('十種鬼', '還有三個頭目'),
                 ('二十夜的故事', '會出現過年夜的夜光鬼、正月十五吃堅果（부럼）這些老習俗'), ('奶奶的請託', '每天晚上都有三個'),
                 ('今日之夜', '每天換院子和規則'), ('無盡之夜', '破完第六夜就會開放，以撐過幾波來排本週名次')],
                [('Seven house gods', 'From Jowang who guards the kitchen and Munsin who guards the gate to Samsin Halmeoni, they wake one by one'),
                 ('Ten kinds of ghosts', 'Plus three bosses'), ('Twenty nights of story', 'With old customs like the Shoe Thief on Lunar New Year’s night and cracking nuts on the first full moon'),
                 ('Grandma’s requests', 'Three every night'), ('Tonight', 'The yard and the rules change every day'),
                 ('Endless Night', 'Opens after the sixth night. The weekly ranking goes by how many waves you hold out')])),
}
# 게임 화면 3장: (그림 이름, 설명 글자(alt), 밑글)
SHOTS = {
    'hanmari': [('sea', L('바다에서 낚시하는 화면', '海で釣りをする画面', '在海上釣魚的畫面', 'Fishing out at sea'), L('바다', '海', '海', 'Out at sea')),
                ('catch', L('낚은 물고기 그림 카드', '釣った魚の絵のカード', '釣到的魚的圖卡', 'A fish picture card after a catch'), L('낚으면 이렇게 떠요', '釣るとこう出ます', '釣到時會這樣跳出來', 'What a catch looks like')),
                ('aquarium', L('장식으로 꾸민 수족관 화면', '飾りでかざった水族館の画面', '用裝飾布置好的水族館畫面', 'An aquarium dressed up with decorations'), L('수족관', '水族館', '水族館', 'Aquarium'))],
    'tongtong': [('skip-aim', L('달밤 호숫가에서 토끼가 돌을 던지려는 화면', '月夜の湖のほとりで、うさぎが石を投げようとしている画面', '月夜湖邊，兔子準備丟石頭的畫面', 'The bunny about to throw a stone by a moonlit lake'), L('달맞이 호수', '月見の湖', '賞月湖', 'Moonrise Lake')),
                 ('skip-flight', L('돌이 물 위를 튀는 화면', '石が水の上をはねている画面', '石頭在水面上彈跳的畫面', 'A stone skipping across the water'), L('네 번째 튀는 중', '4回目にはねたところ', '第四次彈跳', 'Fourth skip')),
                 ('skip-places', L('서로 다른 네 장소', 'ちがう4つの場所', '四個不同的地點', 'Four different places'), L('장소마다 달라요', '場所ごとにちがいます', '每個地點都不一樣', 'Every place is different'))],
    'delivery': [('stairs-run', L('계단이 꺾이는 곳에서 라이더가 치킨을 들고 올라가는 화면', '階段が曲がるところで、ライダーがチキンを持ってのぼる画面', '外送員在樓梯轉彎處提著炸雞往上爬的畫面', 'A rider carrying chicken up where the stairs turn'), L('꺾이면 눌러요', '曲がるときにタップ', '轉彎就點', 'Tap at the turns')),
                 ('stairs-crew', L('같이 배달할 라이더를 고르는 대기실 화면', 'いっしょに配達するライダーを選ぶ待機室の画面', '挑選一起送外送的外送員的休息室畫面', 'The lounge where you pick a rider to deliver with'), L('라이더 대기실', 'ライダー待機室', '外送員休息室', 'Rider Lounge')),
                 ('stairs-story', L("라이더 이야기 3장 '층수가 안 맞는다' 화면", 'ライダーの物語 第3章「階数が合わない」の画面', '外送員故事第 3 章〈樓層對不上〉的畫面', 'Chapter 3 of the rider’s story, “The Floors Don’t Add Up”'), L('라이더 이야기', 'ライダーの物語', '外送員的故事', 'Rider’s Story'))],
    'house': [('house-night', L('한옥 마당에 가신을 모셔 귀신을 막는 셋째 밤 화면', '韓屋の庭に家神をまつって鬼をふせぐ、3日目の夜の画面', '在韓屋院子裡供奉家神擋鬼的第三夜畫面', 'Night 3, with house gods placed in the hanok yard to stop ghosts'), L('셋째 밤', '3日目の夜', '第三夜', 'Night 3')),
              ('house-boss', L('정월 대보름 밤에 달을 물러 온 불개가 나온 화면', '小正月の夜、月をかみに来た火の犬が出てきた画面', '正月十五晚上，來咬月亮的火狗出現的畫面', 'The fire dog that came to bite the moon on the first full moon'), L('대보름엔 불개가 와요', '小正月には火の犬が来ます', '元宵夜火狗會來', 'The fire dog comes on the full moon')),
              ('house-daily', L('날마다 바뀌는 오늘의 밤과 달력 도장 화면', '毎日変わる今日の夜と、カレンダーのスタンプの画面', '每天不一樣的今日之夜和月曆印章畫面', 'Tonight, which changes every day, with calendar stamps'), L('오늘의 밤', '今日の夜', '今日之夜', 'Tonight'))],
}
# 게임별 기록: (날짜, 제목, 한 줄)
GLOG = {
    'hanmari': [('11.06', L('이름을 정했어요', '名前を決めました', '定好名字了', 'Named it'), L('쓰레드 투표로 골랐어요', 'Threadsの投票で決めました', '在 Threads 投票決定', 'Picked by a vote on Threads')),
                ('11.08', L('4개 언어', '4言語', '四種語言', '4 languages'), L('일본어·번체 중국어·영어를 넣었어요', '日本語・繁体字中国語・英語を入れました', '加入日文、繁體中文、英文', 'Added Japanese, Traditional Chinese and English')),
                ('11.12', L('비공개 테스트 시작', 'クローズドテスト開始', '開始封閉測試', 'Closed testing began'), L('1.0.1', '1.0.1', '1.0.1', '1.0.1')),
                ('11.15', L('1.0.2', '1.0.2', '1.0.2', '1.0.2'), L('광고·결제, 버그 제보 단추, 댓글로 받은 장식 둘', '広告・課金、不具合報告ボタン、コメントでもらった飾り2つ', '廣告與付費、錯誤回報按鈕、留言許願的兩個裝飾', 'Ads and purchases, a bug report button, two decorations requested in comments')),
                ('11.16', L('1.0.3', '1.0.3', '1.0.3', '1.0.3'), L('물고기가 수면·중간·바닥에서 물어요. 난파선도 생겼어요', '魚が水面・中層・底で食いつきます。沈没船もできました', '魚會在水面、中層、海底咬鉤。還多了沉船', 'Fish now bite at the surface, midwater and bottom. A shipwreck appeared too'))],
    'tongtong': [('11.09', L('이름을 정했어요', '名前を決めました', '定好名字了', 'Named it'), L('돌도 토끼도 통통해서 통통 물수제비', '石もうさぎもぽんぽんなので「ぽんぽん水切り」', '石頭會跳、兔子也會跳，所以叫跳跳打水漂', 'Bouncy stones and a bouncy bunny, so Bouncy Skip')),
                 ('11.12', L('비공개 테스트 시작', 'クローズドテスト開始', '開始封閉測試', 'Closed testing began'), L('구글 플레이', 'Google Play', 'Google Play', 'Google Play')),
                 ('11.16', L('광고·결제', '広告・課金', '廣告與付費', 'Ads & purchases'), L('광고는 버튼을 누를 때만 나와요', '広告はボタンを押したときだけ出ます', '廣告只在按下按鈕時出現', 'Ads only play when you tap a button'))],
    'delivery': [('11.15', L('비공개 테스트 시작', 'クローズドテスト開始', '開始封閉測試', 'Closed testing began'), L('1.0.0', '1.0.0', '1.0.0', '1.0.0')),
                 ('11.16', L('1.0.1', '1.0.1', '1.0.1', '1.0.1'), L('광고·결제', '広告・課金', '廣告與付費', 'Ads & purchases'))],
    'house': [('11.15', L('비공개 테스트 시작', 'クローズドテスト開始', '開始封閉測試', 'Closed testing began'), L('1.0.0', '1.0.0', '1.0.0', '1.0.0')),
              ('11.16', L('1.0.1', '1.0.1', '1.0.1', '1.0.1'), L('광고·결제', '広告・課金', '廣告與付費', 'Ads & purchases'))],
}
# 한 마리만 더 물고기 카드(게임 속 세밀화, 게임 번역표 그대로). 크기 = 게임 데이터
RARITY = L(['일반', '고급', '희귀', '영웅', '전설'], ['コモン', 'アンコモン', 'レア', 'エピック', 'レジェンド'], ['普通', '優良', '稀有', '史詩', '傳說'], ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'])
SEAS = L(['연안', '산호초', '대륙붕', '해구', '심연'], ['沿岸', 'サンゴ礁', '大陸棚', '海溝', '深淵'], ['沿岸', '珊瑚礁', '大陸棚', '海溝', '深淵'], ['Coast', 'Coral Reef', 'Shelf Sea', 'Trench', 'Abyss'])
FISH = [
    dict(id='mackerel', sea=0, r=0, sz='25~45cm', n=L('고등어', 'サバ', '鯖魚', 'Mackerel'),
         d=L('등의 물결무늬 덕분에 위에서 보면 바다색에 숨는다.', '背中の波模様のおかげで、上から見ると海の色にまぎれる。', '背上的波浪花紋，讓牠從上面看就融入海的顏色。', 'The wavy stripes on its back blend into the sea when seen from above.')),
    dict(id='octopus', sea=2, r=1, sz='40~120cm', n=L('문어', 'タコ', '章魚', 'Octopus'),
         d=L('심장이 3개이고 피는 파란색이다.', '心臓が3つあり、血は青い。', '有3顆心臟，血液是藍色的。', 'It has three hearts and blue blood.')),
    dict(id='angler', sea=3, r=2, sz='10~40cm', n=L('초롱아귀', 'チョウチンアンコウ', '燈籠鮟鱇', 'Anglerfish'),
         d=L('머리 위 초롱에서 빛을 내 먹이를 꾀어낸다.', '頭の上のちょうちんを光らせてエサをおびき寄せる。', '用頭上的燈籠發光，引誘獵物靠近。', 'The glowing lantern on its head lures in prey.')),
    dict(id='sunfish', sea=2, r=3, sz='150~330cm', n=L('개복치', 'マンボウ', '翻車魚', 'Ocean Sunfish'),
         d=L('가장 무거운 경골어류로 꼽힌다.', 'いちばん重い硬骨魚のひとつとされる。', '被認為是最重的硬骨魚之一。', 'One of the heaviest bony fish in the world.')),
    dict(id='whaleshark', sea=2, r=4, sz='600~1200cm', n=L('고래상어', 'ジンベエザメ', '鯨鯊', 'Whale Shark'),
         d=L('세상에서 가장 큰 물고기다.', '世界でいちばん大きな魚。', '世界上最大的魚。', 'The biggest fish in the world.')),
]

# ── 일본어·중국어 낱말 경계 (2026-11-21 폰 다듬기) ──
# 게임 이름·제목은 글자 중간에서 꺾이지 않고 '|' 자리에서만 줄이 바뀜(만들기가 <wbr>로 바꾸고 class="kw"로 묶음).
# 여기에 없는 글은 보통 줄바꿈. 글을 바꾸면 여기도 같이(없으면 그냥 보통 줄바꿈이라 깨지지는 않음).
# 점검(node tools/site/mobile_check.js)이 제목·이름이 글자 중간에서 꺾인 곳을 알려 주면 여기에 한 줄 더함.
BR = {s.replace('|', ''): s for s in [
    # 게임 이름
    'あと|一匹だけ', 'ぽんぽん|水切り', '階段の|伝説', '悪霊|退散', 'カンカン|お絵かき', 'ゼリー|パレット',
    '再釣|一條|就好', '跳跳|打水漂', '樓梯|傳說', '小鬼|退散', '果凍|調色盤', 'パズル|3作', '三款|益智|遊戲',
    # 게임 종류
    'ドット絵の|釣り', '3Dの|水切り', 'ドット絵の|階段|配達', '韓屋の|ドット絵|ディフェンス', '韓国語の|単語分け|パズル', '色ならべ|パズル',
    '像素|釣魚', '像素|樓梯|外送', '像素|韓屋|塔防', '韓文|單字|分類|拼圖', '數織|像素|謎題', '顏色|排序|拼圖',
    # 상태
    'Google Playで|クローズド|テスト中', 'Google Play |封閉|測試中',
    # 구역 제목
    'ゲームを|選ぶ', '選擇|遊戲', '不具合・|ご意見', '回報|錯誤・|意見', 'アップデート|記録', '更新|紀錄', '魚の|カード',
    'ゲーム|画面', '遊戲|畫面', '最初の|動画を|準備中', '第一支|影片|準備中', 'ゲーム|一覧へ', '回到|遊戲|列表', '道に|迷いました',
    '最新|消息', '次の|ゲーム', '下一款|遊戲', 'ご近所さんと|ライダー', '鄰居與|外送員', '家神と|鬼', '地點與|石頭', '場所と|石',
    '不具合を|知らせる', 'ゲームへの|意見', '次の版を|準備中', '正在|準備|下一版', '韓国語|のみ', '僅限|韓文', 'プライバシー|ポリシー', 'お問い合わせ', '利用規約', '隱私權政策', '服務條款', '聯絡我們', 'チョウチン|アンコウ', '制作中', '製作中', 'ご近所・|ライダー', '鄰居・|外送員', '地點・|石頭', '家神・鬼', '場所・石',
    'つくる様子は|SNSに|のせています|（韓国語）', '製作過程|都放在|社群上|（韓文）',
    # 볼거리 이름
    '場所|8か所', 'うさぎの|おしゃれ', 'スタンプ・|ミッション・|実績', 'ご近所さん|7人', 'ライダー|17人', 'ライダーの|物語', '今週の|ランキング',
    '二十夜の|お話', 'おばあさんの|お願い', '終わらない|夜', '打扮|兔子', '簽到・|任務・|成就', '外送員的|故事', '本週|排行榜', '七位|家神',
    '二十夜的|故事', '奶奶的|請託',
]}
