# 補堂／試堂寫入 — 欄位樣板

Project：`gudmbilboyhouotilrvt`（MainHope_production）。

## 查庫通道

```bash
# service_role（MCP execute_sql 不可用時）
supabase projects api-keys --project-ref gudmbilboyhouotilrvt -o json
# REST base：.env 的 VITE_SUPABASE_URL
```

Headers：`apikey`＋`Authorization: Bearer <service_role>`；寫入加 `Prefer: return=representation`。

## 調堂：補建取消堂請假＋綁現成補堂

```sql
insert into leave_makeup_records (
  student_id, class_id, schedule_id, leave_date,
  leave_reason, makeup_type, makeup_date, makeup_schedule_id,
  status, tuition_disposition, remarks, updated_at
) values (
  '<student_id>', '<source_class_id>', '<cancelled_schedule_id>', '<leave_ymd>',
  '導師請假', '調堂', '<makeup_ymd>', '<makeup_schedule_id>',
  '已批核', '調堂', '補回取消堂', now()
);

update schedules
set teaching_notes = '補堂（{SOURCE_CODE}）：{姓名}',
    updated_at = now()
where id = '<makeup_schedule_id>';
```

## 調堂：同年級空宿主新開加堂

```sql
insert into schedules (
  class_id, teacher_id, classroom_id,
  scheduled_date, start_time, end_time,
  status, is_extra_lesson, session_number, teaching_notes
) values (
  '<host_class_id>', '<teacher_id>', '<classroom_id>',
  '<ymd>', '17:45', '19:00',
  '正常', true, <next_session>,
  '補堂（{SOURCE_CODE}）：{姓名}'
);
```

`session_number`：該宿主班 `coalesce(max(session_number),0)+1`。

## 半價試堂出單

優惠目錄（production）：`payment_discounts.name = '試堂半價（50%）'`  
（已知 id：`f1ee1000-0000-4000-8000-000000000853`；寫入前仍應查庫確認。）

| 表 | 重點 |
| --- | --- |
| `payments` | `subtotal_amount=正價`，`total_amount=半價`，`payment_discount_id=半價優惠`，`status=待收款` 或 `已收款`，`receipt_kind` 單號 `MX-RC-YYYYMMDD-####` |
| `payment_details` | `amount=正價`，`lesson_count=1`，`description` 含「試堂」 |
| `payment_discount_applications` | `amount_deducted=正價-實收`，`sort_order=0` |
| `trial_sessions` | `trial_type=半價試堂`，`payment_id` 已掛，`counts_toward_headcount` 手選 |

付款方式預設字串：

`現金`｜`轉數快`｜`信用卡`｜`支票`｜`PayMe`｜`八達通`｜`易辦事`｜`銀聯`｜`銀行轉帳`｜`內地支付寶`｜`香港支付寶`｜`微信支付`｜`其他`

## 試堂確認收款抬池

```text
student_entitlement_pools:
  course_group = trial
  namespace_key = class:{class_id}
  source_enrollment_id = null
  package_type = regular_full
  initial_lessons / remaining_lessons += lesson_count

entitlement_consumption_events:
  reason = entitlement_top_up
  delta_lessons = +lesson_count
  payment_detail_id = <detail>
  schedule_id / attendance_detail_id / declaration_id = null
```

冪等：同一 `payment_detail_id`＋`reason=entitlement_top_up` 已存在則跳過。

## 試堂改期（已取消列）

```sql
update trial_sessions
set schedule_id = '<new_schedule_id>',
    trial_date = '<new_ymd>',
    status = '已預約',
    remarks = coalesce(remarks,'') || '；由 <old_ymd> 改期（原堂導師請假）',
    updated_at = now()
where id = '<trial_id>'
  and class_id = (select class_id from schedules where id = '<new_schedule_id>');
```

新排程必須同班、未取消、非過去日；保留原 `payment_id`。

## 相關文件

- 試堂出單：`docs/playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md`
- 出單先上紙：`docs/policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md`
- 未完成補堂 PDF：skill `leave-makeup-followup`
- `makeup_of=` 標記：`.cursor/rules/makeup-of-marker.mdc`
