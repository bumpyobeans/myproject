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

## 캐러셀 기본 스타일

캐러셀을 만들 때는 따로 지정이 없으면 `.claude/instagram/carousel_style.md`의
"깔끔 + 사진" 스타일을 쓴다. 그리는 코드는 `carousel/carousel_kit.py`, 글꼴은 `fonts/`(Pretendard).

## "정보소개" 형식

"정보소개"라고 하면 매장 고정 게시물 3장 + 캡션 3개 세트를 만든다.
규칙은 `.claude/instagram/info_style.md`, 예시는 `수서역점_고정게시물/`, `다산점_고정게시물/`.

## "스토리 캐러셀" 형식

"스토리 캐러셀"이라고 하면 일상 사진 + 흰 박스 글로 내 이야기를 고백하듯 푸는 캐러셀을 만든다.
규칙은 `.claude/instagram/story_carousel_style.md`, 그리는 함수는 `carousel_kit.story_slide()`.

## 훅: Hook 10 아키타입

릴스·캐러셀 표지·캡션 첫 줄을 쓸 때는 `.claude/instagram/hook10.md`의 10가지 틀에서 고르고
어떤 아키타입인지 밝힌다. `/ig-reel`의 hooks.json과 함께 쓴다.
