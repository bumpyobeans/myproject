# Instagram 스킬 (ig-*)

`.claude/skills/ig-*` 에 설치된 스킬은
[instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill)
(MIT, commit d03c56b) 에서 가져왔다.

## 출력 언어

- 모든 ig-* 스킬의 결과(훅, 스크립트, 화면 텍스트, 캡션, 표, 요약, 질문)는
  **한국어**로 쓴다. 해시태그와 고유명사는 필요하면 원문 유지.
- 스킬 안의 영어 출력 예시(`REEL READY` 블록 등)도 항목명을 한국어로 바꿔서 보여준다.

## 파이썬 도구와 한국어

`hookscore.py`, `beats.py`, `caption.py`, `detect.py`, `humanize.py` 는 라틴 문자
단어만 센다. 한국어 텍스트를 그대로 넣으면 단어 수·길이·타이밍이 틀리게 나온다.

- 훅 점수와 비트 시트는 한국어 원고를 **같은 뜻의 영어 문장으로 옮긴 파일**에 돌리고,
  결과는 한국어 원고 옆에 한국어로 정리해서 보고한다. 이 방식이라는 것을 결과에 한 줄 밝힌다.
- 한국어 원고의 실제 길이는 대략 **초당 6~7음절**(공백 제외)로 따로 계산해서 함께 보여준다.
- 위 스크립트들은 원본 그대로 두고 수정하지 않는다.

## 파일 위치

이 저장소는 클라우드 컨테이너에서 쓰이므로 `~/.claude/instagram/` 은 세션이 끝나면 사라진다.
스킬이 `~/.claude/instagram/` 의 파일(voice.md, swipe.md, log.md)을 읽거나 쓰라고 하면
대신 이 저장소의 `.claude/instagram/` 을 쓴다. 템플릿은
`.claude/instagram/voice.template.md` 에 있다.
