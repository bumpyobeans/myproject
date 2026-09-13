/* ============================================================
   범표노트 - 댓글 저장 설정 (Supabase, 02_원두추천과 같은 프로젝트 재사용)
   ------------------------------------------------------------
   * key 는 "Publishable key" 입니다. 브라우저에 공개되는 키입니다.
     note_comments 표는 누구나 남길 수 있는 공개 댓글이라
     Supabase 쪽에서 "읽기+쓰기"를 열어 두었고(docs/supabase_comments.sql),
     수정·삭제 정책은 없어 브라우저에서 고치거나 지울 수는 없습니다.
   * Secret key 는 절대 여기에 넣지 마세요.
   * 이 파일이 없거나 url 이 비어 있으면 댓글 기능만 빠지고 나머지는 정상 동작합니다.
   ============================================================ */

window.NOTE_SUPABASE = {
  url: "https://pwwerrxitfesworulijr.supabase.co",
  key: "sb_publishable_LHDeFwyie54z4Eee9B0oWQ_3G3ZwdTd"
};
