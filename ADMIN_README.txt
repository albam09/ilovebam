아이러브밤10 관리자 모드 추가본

관리자 주소:
/admin

기본 관리자 계정:
ID: admin
PW: ilovebam10!2026

가능한 관리 기능:
1. 업소 등록/수정/삭제
2. 업소 대표 이미지 업로드
3. 공지 등록/수정/삭제
4. 사이트 제목, 설명, 대표 전화 수정
5. HTML/CSS/JS 파일 직접 편집
6. 관리자 비밀번호 변경

Cloudtype 배포 후 보안 권장 설정:
환경변수 ADMIN_PASSWORD 에 새 비밀번호를 넣으세요.
환경변수 SESSION_SECRET 에 긴 랜덤 문자열을 넣으세요.

주의:
Cloudtype에서 컨테이너가 재배포되면 관리자 화면에서 저장한 admin-data/content.json 및 uploads/admin 파일이 초기화될 수 있습니다.
장기 운영하려면 Cloudtype의 영구 저장소/볼륨 또는 외부 DB 연결이 필요합니다.
