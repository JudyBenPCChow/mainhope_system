/**
 * 2627 老師可開班時間 — 用 Apps Script 一鍵建立 Google Form
 * 題目文案：docs/year/2627/teacher-availability-form-questions.md
 *
 * 區序：A → B → C → D → E → F → G → H
 * 分區標題慣例：「區碼｜主題（因何來到本頁）」＋說明三段
 *
 * 用法：script.google.com 貼上 → 執行 createTeacherAvailabilityForm
 * 再執行會新建一份 Form（不覆寫舊表）
 */

function pageHelp_(why, fill, next) {
  return (
    '【您來到本頁的原因】\n' +
    why +
    '\n\n【本頁請填】\n' +
    fill +
    '\n\n【接下來】\n' +
    next
  )
}

function createTeacherAvailabilityForm() {
  var form = FormApp.create(
    '2627 常規學年（九月起）老師可開班時間調查（第一輪）'
  )

  form
    .setDescription(
      '本表用以收集 2026 年 9 月起常規小組課程之開班意向與可任教時間。\n\n' +
        '為方便仍在學之同事，本表可多次提交：您可先提交目前已確定的時間，並於稍後補上其餘時間。\n\n' +
        '•「可」＝可以編排；「較不優先」＝可以編排但請優先安排其他時段；「不可」＝請勿編排；「未確定」＝稍後再填報。請勿臆測。\n' +
        '• 時段以機構 75 分鐘校曆為準；小組課最遲一節為 19:00–20:15。週末不編排 09:00–10:15。\n' +
        '• 機構：明學教育'
    )
    .setCollectEmail(true)
    .setAllowResponseEdits(true)
    .setProgressBar(true)
    .setConfirmationMessage(
      '感謝填寫。我們將先按您已確定的日子安排第一輪時間表；標示為未確定的日子，請於時間確定後再次填寫以更新資料。'
    )

  var weekdaySlots = ['16:30–17:45', '17:45–19:00', '19:00–20:15']
  var weekendSlots = [
    '10:15–11:30',
    '11:30–12:45',
    '12:45–14:00',
    '14:00–15:15',
    '15:15–16:30',
    '16:30–17:45',
    '17:45–19:00',
    '19:00–20:15',
  ]
  var availCols = ['可', '較不優先', '不可', '未確定']
  var weekdays = [
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
    '星期日',
  ]

  var dCommon =
    '本部分將收集您已知／未知的日子。\n\n' +
    '• D2：您可以任教的日子；稍後「F｜各日可任教時段」將詢問這些日子的時段。\n' +
    '• D3：您尚未知時間表、待時間表公布後再決定的日子。\n' +
    '• D4：您何時可得知完整時間表？（例如大學選科／註冊日等）\n\n' +
    '若您已確定不欲任教某些日子（例如星期三），則 D2、D3 皆無須選取該日。\n\n' +
    '此三題有助我們預估各日大約開班情況，減少最終課室衝突或空置。'

  // ——— A ———
  form
    .addSectionHeaderItem()
    .setTitle('A｜基本資料')
    .setHelpText(
      pageHelp_(
        '問卷起始頁；所有填寫者均會見到。',
        '姓名、WhatsApp（選填）、是否已在明學任專科導師／已有合約（A3）。',
        'A3＝「是」→ B｜九月是否開班；A3＝「不是」→ C｜新老師科目與年級。'
      )
    )
  form
    .addTextItem()
    .setTitle('A1. 姓名（格式：Christine Fan）')
    .setRequired(true)
  form.addTextItem().setTitle('A2. WhatsApp').setRequired(false)
  var a3 = form
    .addMultipleChoiceItem()
    .setTitle(
      'A3. 您是否已在明學曾任專科班導師，或已有任何專科老師合約？'
    )
    .setRequired(true)

  // ——— B ———
  var pbB = form
    .addPageBreakItem()
    .setTitle('B｜九月是否開班（既有專科導師）')
    .setHelpText(
      pageHelp_(
        '您於 A3 選擇了「是（現時已為明學專科班導師）」。',
        '自 2026 年 9 月起是否願意承接常規小組課程（B1）。',
        '「願意」→ D｜時間掌握程度；「不願意／暫不承接」→ 下一頁說明後結束。'
      )
    )
  var b1 = form
    .addMultipleChoiceItem()
    .setTitle(
      'B1. 自 2026 年 9 月起，您是否願意承接明學教育常規小組課程？'
    )
    .setRequired(true)

  var pbNoTeach = form
    .addPageBreakItem()
    .setTitle('B｜暫不承接說明')
    .setHelpText(
      pageHelp_(
        '您於 B1 選擇了「不願意／暫不承接」。',
        '原因或備註（選填）。',
        '提交後結束本問卷，無需填寫其後各區。'
      )
    )
  form
    .addParagraphTextItem()
    .setTitle('B2. 若不承接，原因或備註（選填）')
    .setRequired(false)
  var pbSubmitNoTeach = form
    .addPageBreakItem()
    .setTitle('【自動跳轉】B 暫不承接 → 提交')
    .setHelpText('編輯用標記：填寫者完成上一頁後將直接提交，通常不會停留本頁。')
  pbSubmitNoTeach.setGoToPage(FormApp.PageNavigationType.SUBMIT)

  // ——— C ———
  var pbC = form
    .addPageBreakItem()
    .setTitle('C｜新老師可教授科目與年級')
    .setHelpText(
      pageHelp_(
        '您於 A3 選擇了「不是（首次入職專科班）」。既有導師不會見到本頁。',
        '可教授科目、年級，以及科目與年級限制（選填）。',
        '接著進入 D｜時間掌握程度（已知／未知日子）。'
      )
    )
  form
    .addCheckboxItem()
    .setTitle('C1. 可教授科目')
    .setChoiceValues([
      '中文',
      '英文',
      '數學',
      '科學（初中）',
      '物理',
      '化學',
      '生物',
      '其他（請於 C3 註明）',
    ])
    .setRequired(true)
  form
    .addCheckboxItem()
    .setTitle('C2. 可教授年級')
    .setChoiceValues(['中一', '中二', '中三', '中四', '中五', '中六'])
    .setRequired(true)
  form
    .addParagraphTextItem()
    .setTitle('C3. 科目與年級限制（選填；例如：只教授高中英文）')
    .setRequired(false)

  // ——— D 總覽 + D1 ———
  var pbD = form
    .addPageBreakItem()
    .setTitle('D｜時間掌握程度（已知／未知日子・總覽）')
    .setHelpText(
      pageHelp_(
        '您已表示願意開班（B1＝願意），或已完成新老師科目資料（C）。',
        '請先閱讀下方「日子說明」，再回答 D1（掌握程度）。系統會依 D1 帶您到對應的日子勾選頁。',
        '依 D1 分別進入「完全掌握／僅掌握部分／完全未掌握」其中一頁。'
      ) +
        '\n\n—— 日子說明 ——\n' +
        dCommon
    )
  var d1 = form
    .addMultipleChoiceItem()
    .setTitle('D1. 目前您對自己自九月起可任教時間的掌握程度為？')
    .setRequired(true)

  // D 完全掌握
  var pbDKnown = form
    .addPageBreakItem()
    .setTitle('D｜可任教日子（因 D1＝完全掌握）')
    .setHelpText(
      pageHelp_(
        '您於 D1 選擇了「完全掌握」。',
        'D2（可任教日子）；D4 選填。本路徑不需填 D3。',
        'E｜每周希望堂數 → F｜各日可任教時段 → G → H。'
      ) +
        '\n\n—— 日子說明 ——\n' +
        dCommon
    )
  form
    .addCheckboxItem()
    .setTitle('D2. 哪些日子您目前可以任教？')
    .setHelpText('稍後「F｜各日可任教時段」將詢問這些日子的時段。')
    .setChoiceValues(weekdays)
    .setRequired(true)
  form
    .addDateItem()
    .setTitle('D4. 您何時可得知完整時間表？（例如大學選科／註冊日等）')
    .setRequired(false)
  var pbGoEFromKnown = form
    .addPageBreakItem()
    .setTitle('【自動跳轉】D 完全掌握 → E 堂數')
    .setHelpText('編輯用標記：填寫者完成上一頁後跳至 E｜每周希望堂數。')

  // D 僅掌握部分
  var pbDPartial = form
    .addPageBreakItem()
    .setTitle('D｜已知與未知日子（因 D1＝僅掌握部分）')
    .setHelpText(
      pageHelp_(
        '您於 D1 選擇了「僅掌握部分日子」。',
        'D2（可任教）、D3（尚未確定）、D4（預計得知完整時間表之日）。同一日請勿同時出現在 D2 與 D3。',
        'E｜每周希望堂數 → F｜各日可任教時段 → G → H。'
      ) +
        '\n\n—— 日子說明 ——\n' +
        dCommon
    )
  form
    .addCheckboxItem()
    .setTitle('D2. 哪些日子您目前可以任教？')
    .setHelpText('稍後「F｜各日可任教時段」將詢問這些日子的時段。')
    .setChoiceValues(weekdays)
    .setRequired(true)
  form
    .addCheckboxItem()
    .setTitle('D3. 哪些日子您尚未知時間表，須待時間表公布後再決定？')
    .setChoiceValues(weekdays)
    .setRequired(true)
  form
    .addDateItem()
    .setTitle('D4. 您何時可得知完整時間表？（例如大學選科／註冊日等）')
    .setRequired(false)
  var pbGoEFromPartial = form
    .addPageBreakItem()
    .setTitle('【自動跳轉】D 僅掌握部分 → E 堂數')
    .setHelpText('編輯用標記：填寫者完成上一頁後跳至 E｜每周希望堂數。')

  // D 完全未掌握
  var pbDUnknown = form
    .addPageBreakItem()
    .setTitle('D｜尚未確定的日子（因 D1＝完全未掌握）')
    .setHelpText(
      pageHelp_(
        '您於 D1 選擇了「完全未掌握」。',
        'D3、D4。本路徑不需填 D2，稍後亦會略過 F（時段）。',
        'E｜每周希望堂數（略過時段版）→ G → H；時間確定後請再次提交本表以補 F。'
      ) +
        '\n\n—— 日子說明 ——\n' +
        dCommon
    )
  form
    .addCheckboxItem()
    .setTitle('D3. 哪些日子您尚未知時間表，須待時間表公布後再決定？')
    .setChoiceValues(weekdays)
    .setRequired(true)
  form
    .addDateItem()
    .setTitle('D4. 您何時可得知完整時間表？（例如大學選科／註冊日等）')
    .setRequired(false)
  var pbGoESkipF = form
    .addPageBreakItem()
    .setTitle('【自動跳轉】D 完全未掌握 → E（略過 F）')
    .setHelpText('編輯用標記：填寫者完成上一頁後跳至 E｜每周希望堂數（略過時段）。')

  // E → F
  var pbE = form
    .addPageBreakItem()
    .setTitle('E｜每周希望堂數')
    .setHelpText(
      pageHelp_(
        '您已完成 D 區日子勾選（D1＝完全掌握或僅掌握部分）。',
        '每周希望或可接受的小組課堂數上限（選填）。',
        '接著進入 F｜各日可任教時段。'
      )
    )
  addLoadSection_(form)
  var pbGoF = form
    .addPageBreakItem()
    .setTitle('【自動跳轉】E → F 時段')
    .setHelpText('編輯用標記：填寫者完成上一頁後跳至 F｜各日可任教時段。')

  // E → skip F
  var pbESkipF = form
    .addPageBreakItem()
    .setTitle('E｜每周希望堂數（本輪略過各日時段）')
    .setHelpText(
      pageHelp_(
        '您於 D1 選擇了「完全未掌握」，故本輪不詢問 F（各日可任教時段）。',
        '每周堂數上限（選填）。',
        '直接進入 G｜連堂與休息，其後為 H。請於時間確定後再次提交本表，以更新可任教時段。'
      )
    )
  addLoadSection_(form)
  var pbGoGFromSkip = form
    .addPageBreakItem()
    .setTitle('【自動跳轉】E（略過 F）→ G')
    .setHelpText('編輯用標記：填寫者完成上一頁後跳至 G｜連堂與休息。')

  // F
  var pbF = form
    .addPageBreakItem()
    .setTitle('F｜各日可任教時段')
    .setHelpText(
      pageHelp_(
        '您於 D1 並非「完全未掌握」，且已填寫可任教／未知日子。',
        '請就 D2 所選日子勾選各時段（可／較不優先／不可／未確定）。D3 日子可略過，或整日選「未確定」。平日一般自 16:30 起；週末自 10:15 起。',
        'G｜連堂與休息 → H｜學年長期事務。'
      )
    )
  for (var i = 0; i < weekdays.length; i++) {
    var day = weekdays[i]
    var slots = i < 5 ? weekdaySlots : weekendSlots
    form
      .addGridItem()
      .setTitle('F. ' + day + '可任教時段')
      .setRows(slots)
      .setColumns(availCols)
      .setRequired(false)
  }
  form
    .addParagraphTextItem()
    .setTitle('F8. 其他時段備註（選填）')
    .setRequired(false)

  // G
  var pbG = form
    .addPageBreakItem()
    .setTitle('G｜連堂與休息')
    .setHelpText(
      pageHelp_(
        '您已完成堂數（及時段，若適用）相關題目。',
        '同一日最多可連續幾堂、連堂後是否必須休息一節，以及補充說明（選填）。',
        '接著進入 H｜2627 學年已知長期事務。'
      )
    )
  form
    .addMultipleChoiceItem()
    .setTitle('G1. 同一日最多可連續任教幾堂（中間不休息）？')
    .setChoiceValues(['1 堂', '2 堂', '3 堂', '視情況而定（請於備註說明）'])
    .setRequired(true)
  form
    .addMultipleChoiceItem()
    .setTitle('G2. 連堂後是否必須休息一節（用餐／休息）？')
    .setChoiceValues([
      '是：每連續 2 堂後必須休息 1 節',
      '是：每連續 3 堂後必須休息 1 節',
      '不一定，可以連續編排',
      '其他（請於備註說明）',
    ])
    .setRequired(true)
  form
    .addParagraphTextItem()
    .setTitle('G3. 連堂／休息補充說明（選填）')
    .setRequired(false)

  // H
  var pbH = form
    .addPageBreakItem()
    .setTitle('H｜2627 學年已知長期事務')
    .setHelpText(
      pageHelp_(
        '問卷倒數區；用於預留長期離港、請假、實習、考試季等。',
        'H1（是否已有此類事項）。',
        '「有」→ H｜長期事務詳情；「沒有／尚未確定」→ H｜其他補充。'
      )
    )
  var h1 = form
    .addMultipleChoiceItem()
    .setTitle(
      'H1. 於 2627 學年（約 2026-09 至 2027-06）是否已有長期離港、請假、實習、考試季等，較可能無法任教的事項？'
    )
    .setRequired(true)

  var pbHDetail = form
    .addPageBreakItem()
    .setTitle('H｜長期事務詳情（因 H1＝有）')
    .setHelpText(
      pageHelp_(
        '您於 H1 選擇了「有」。',
        '大概時期、性質、受影響日子（H2）。',
        '接著進入 H｜其他補充。'
      )
    )
  form
    .addParagraphTextItem()
    .setTitle('H2. 如有：請說明大概時期、性質，以及受影響的日子')
    .setHelpText(
      '例如：2026 年 10 月整月實習；逢考試週平日不能任教；12 月中離港兩週'
    )
    .setRequired(true)

  var pbHOther = form
    .addPageBreakItem()
    .setTitle('H｜其他補充')
    .setHelpText(
      pageHelp_(
        '您於 H1 選擇了「沒有」或「尚未確定」，或已填完 H2。',
        '其他希望行政知悉的事項（選填）。',
        '提交問卷。'
      )
    )
  form
    .addParagraphTextItem()
    .setTitle('H3. 其他希望行政知悉的事項（選填）')
    .setRequired(false)

  // 跳題
  a3.setChoices([
    a3.createChoice('是（現時已為明學專科班導師）', pbB),
    a3.createChoice('不是（首次入職專科班）', pbC),
  ])

  b1.setChoices([
    b1.createChoice('願意', pbD),
    b1.createChoice('不願意／暫不承接', pbNoTeach),
  ])

  d1.setChoices([
    d1.createChoice('完全掌握（平日與週末均可填寫任教時段）', pbDKnown),
    d1.createChoice(
      '僅掌握部分日子（例如：星期六、日已知，平日尚未知）',
      pbDPartial
    ),
    d1.createChoice('完全未掌握（時間稍後再填報）', pbDUnknown),
  ])

  pbGoEFromKnown.setGoToPage(pbE)
  pbGoEFromPartial.setGoToPage(pbE)
  pbGoESkipF.setGoToPage(pbESkipF)
  pbGoF.setGoToPage(pbF)
  pbGoGFromSkip.setGoToPage(pbG)

  h1.setChoices([
    h1.createChoice('沒有', pbHOther),
    h1.createChoice('有', pbHDetail),
    h1.createChoice('尚未確定，稍後再填報', pbHOther),
  ])

  var url = form.getEditUrl()
  var pub = form.getPublishedUrl()
  Logger.log('編輯（修改題目用）：' + url)
  Logger.log('填寫連結（寄予老師）：' + pub)
  return { editUrl: url, publishedUrl: pub }
}

/** @param {GoogleAppsScript.Forms.Form} form */
function addLoadSection_(form) {
  form
    .addMultipleChoiceItem()
    .setTitle('E1. 每周希望或可接受的小組課堂數上限？（選填）')
    .setChoiceValues(['1–2', '3–4', '5–6', '7–8', '9 或以上', '未定'])
    .setRequired(false)
}
