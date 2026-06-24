아이러브밤10 관리자 포함 수정본

관리자 주소:
/admin

기본 관리자 계정:
ID: admin
PW: ilovebam10!2026

이번 수정 내용:
- 상단 로그인/관리자 로그인 버튼을 눈에 보이게 수정
- /admin 관리자 접속 버튼을 PC/모바일 상단에 자동 추가
- 깨진 이미지가 보이면 준비중 이미지로 자동 교체
- 기존 팝업레이어가 화면을 가리는 문제 숨김 처리
- PREMIUM 랜덤광고가 계속 로딩만 뜨지 않도록 기본 배너 데이터 추가
- 상단 전화문의 배너 이미지를 새로 제작하여 교체
- 로컬/Cloudtype 모두 node server.js 또는 npm start로 실행 가능

배포 후 접속:
https://www.ilovebam10.com/admin

Cloudtype 환경변수 권장:
ADMIN_PASSWORD=원하는새비밀번호
SESSION_SECRET=아무거나긴랜덤문자

주의:
관리자에서 등록한 내용은 admin-data/content.json, 업로드 이미지는 uploads/admin/에 저장됩니다.
Cloudtype 재배포 시 서버 내부 저장 파일이 초기화될 수 있으니 중요한 변경 후에는 파일을 백업하세요.
