/**
 * 범표나들이 인증 사진첩 (Google Apps Script)
 *
 * - /exec                 : 인증 링크 제출 페이지 (스탬프 카드 뒷면 QR이 가리키는 주소)
 * - /exec?page=gallery    : 모인 인증 게시물 사진첩
 *
 * 제출 내역은 이 스크립트가 연결된 구글 스프레드시트의 "인증" 시트에 쌓입니다.
 * 시트의 "노출" 열을 N 으로 바꾸면 사진첩에서 숨겨집니다.
 */

var CONFIG = {
  SHEET_NAME: '인증',
  EVENT_TITLE: '10월의 범표나들이',
  // true: 제출 즉시 사진첩에 노출 / false: 시트에서 노출 열을 Y로 바꿔야 노출
  AUTO_APPROVE: true,
  STORES: ['구리갈매점', '별내점', '다산정약용도서관점', '역삼점'],
  HASHTAGS: ['#10월의범표나들이', '#범표원두', '#커피여행'],
};

var HEADERS = ['제출시각', '닉네임', '인스타그램 링크', '방문 매장', '연락처 뒷자리', '노출'];

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'submit';
  var file = page === 'gallery' ? 'Gallery' : 'Index';
  var t = HtmlService.createTemplateFromFile(file);
  t.config = CONFIG;
  t.baseUrl = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle(CONFIG.EVENT_TITLE + (page === 'gallery' ? ' 사진첩' : ' 인증'))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** 인스타그램 게시물/릴스 링크를 https://www.instagram.com/p/{코드}/ 형태로 정리. 아니면 null. */
function normalizeInstagramUrl_(raw) {
  var m = String(raw || '').trim().match(
    /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (!m) return null;
  var type = m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase();
  return 'https://www.instagram.com/' + type + '/' + m[2] + '/';
}

/** 제출 페이지에서 google.script.run 으로 호출 */
function submitEntry(form) {
  var url = normalizeInstagramUrl_(form && form.link);
  if (!url) {
    throw new Error('인스타그램 게시물 링크를 확인해주세요. (예: https://www.instagram.com/p/xxxx/)');
  }
  var nickname = String(form.nickname || '').trim().slice(0, 30);
  if (!nickname) throw new Error('닉네임을 입력해주세요.');
  var phone = String(form.phone || '').replace(/\D/g, '');
  if (phone.length !== 4) throw new Error('연락처 뒷자리 4자리를 입력해주세요.');
  var stores = [].concat(form.stores || []).filter(function (s) {
    return CONFIG.STORES.indexOf(s) !== -1;
  });
  if (stores.length < 3) throw new Error('방문한 매장을 3곳 이상 선택해주세요.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    if (last > 1) {
      var links = sheet.getRange(2, 3, last - 1, 1).getValues();
      for (var i = 0; i < links.length; i++) {
        if (links[i][0] === url) throw new Error('이미 인증된 게시물이에요. 참여해주셔서 감사합니다!');
      }
    }
    sheet.appendRow([
      new Date(),
      nickname,
      url,
      stores.join(', '),
      "'" + phone,
      CONFIG.AUTO_APPROVE ? 'Y' : 'N',
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/** 사진첩 페이지에서 호출: 노출(Y)된 인증만 최신순으로 반환 (연락처는 내보내지 않음) */
function getGalleryEntries() {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return rows
    .filter(function (r) { return String(r[5]).trim().toUpperCase() === 'Y' && r[2]; })
    .map(function (r) {
      return {
        time: r[0] instanceof Date ? r[0].getTime() : 0,
        nickname: String(r[1]),
        url: String(r[2]),
        stores: String(r[3]),
      };
    })
    .sort(function (a, b) { return b.time - a.time; });
}

/** 스프레드시트 메뉴: 추가 선물 이벤트 당첨자 추첨 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('범표나들이')
    .addItem('추가 선물 당첨자 추첨', 'drawWinners')
    .addToUi();
}

function drawWinners() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('당첨 인원', '몇 명을 추첨할까요?', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var n = parseInt(res.getResponseText(), 10);
  if (!(n > 0)) return ui.alert('숫자를 입력해주세요.');

  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return ui.alert('아직 인증이 없어요.');
  var pool = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .filter(function (r) { return String(r[5]).trim().toUpperCase() === 'Y'; });
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  var winners = pool.slice(0, n);
  var out = getOrCreate_('당첨자');
  out.clear();
  out.appendRow(['추첨시각', new Date()]);
  out.appendRow(HEADERS.slice(1, 5));
  winners.forEach(function (r) { out.appendRow([r[1], r[2], r[3], r[4]]); });
  ui.alert(winners.length + '명을 추첨해 "당첨자" 시트에 기록했어요.');
}

function getOrCreate_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
