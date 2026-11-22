/* 유튜브 영상 목록 — 여기 한 곳만 고치면 홈페이지 '유튜브' 칸에 나와요.
 * 영상 주소 https://www.youtube.com/watch?v=XXXXXXXXXXX 의 XXXXXXXXXXX(11글자)를 아래 [ ] 안에 넣어요.
 *   예) window.DN_YT = ['XXXXXXXXXXX'];
 *   제목·쇼츠 표시까지: window.DN_YT = [{ id: 'XXXXXXXXXXX', title: '개발 일지 1편' }, { id: 'YYYYYYYYYYY', short: true }];
 * 맨 앞 영상이 가장 위에 나와요. 비워 두면 '첫 영상 준비 중' 칸(채널 링크)이 보여요.
 * 누르면 유튜브가 새 창으로 열려요.
 */
window.DN_YT = [];
