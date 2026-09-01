---
name: git-branch-closeout
description: >-
  合入 main 之後刪 feature branch 與 worktree，並對齊本地 main。
  使用於合 PR、merge、關帳、清理 branch、刪舊 worktree、盤點未 commit／未 push、
  或使用者說收尾、清 branch、清 worktree 時。不要等使用者記得。
  Commit→PR→等 CI→合入 的整段流程用個人 skill git-ship；本 skill 只做合入後收尾。
---

# 合 PR 後收尾

使用者不會記得刪 branch。**合入 `main` 的同一輪由 agent 做完**，不要只丟一句「記得拉 main」。

熱檔（`BACKLOG.md` 索引、`dist/`、`docs/generated/`）仍跟 `.cursor/rules/feature-branch-hot-files.mdc`。日常禁令見 `.cursor/rules/git-hygiene.mdc`。

## 何時必跑

- 剛把 PR **merge 進 main**（含使用者在 GitHub 按合、或本輪 `gh pr merge`）
- 使用者說關帳、清 branch、清 worktree、有沒有未 push
- `mainhope-release-handoff` 工程完工且該題已合入 main

## 合入後清單

在**主工作樹**執行（不要在即將拆走的 worktree 裡刪自己）：

1. `git fetch origin`
2. `git checkout main && git merge --ff-only origin/main`（有未提交且會擋 checkout：先 stash 本題無關的改動，pop 回 `main`）
3. 刪遠端 head：`git push origin --delete <branch>`（已自動刪則略過）
4. 刪本地：`git branch -d <branch>`（已合但 SHA 不是祖先時用 `-D`，先確認內容已在 `origin/main`）
5. `git worktree list`：該題路徑 `git worktree remove`（dirty 且確認是過期稿才 `--force`）
6. 分題表頭狀態已關則可在 **`main`** 搬 `BACKLOG.md` 索引列（feature 分支不要搬）
7. `git worktree list` 與 `git branch` 只應留下 `main` 與**仍有未合獨特內容**的 branch

合入（commit → PR → 等 CI → merge）由個人 skill `git-ship` 執行。本 skill 在 **已合入** 後跑。`gh`：`export PATH="$HOME/.local/bin:$PATH"`。勿 `gh pr merge --admin`（除非使用者明講）。本倉未必開得 `enablePullRequestAutoMerge`，不要依賴 `--auto`。

## 盤點未合工作（不要誤報）

順序：

1. GitHub open PR（`gh pr list` 或 API）
2. 各 worktree `git status --porcelain`
3. `git ls-remote --heads origin`（本倉 `origin` 的 fetchspec 往往只有 `main`，`git branch -r` 會漏）
4. 最後才用 `origin/main..<branch>`

SHA 不在 `origin/main` 仍可能已 squash／由另一 PR 合入。核對已合 PR 或 `git cat-file -e origin/main:<關鍵檔>`。

## 不要

- 刪**仍有未合獨特內容**的 branch（先對最新 `main` 重做或開 PR）
- 把落後 `origin/main` 的舊 dirty 工作樹 commit 上去（會倒退）
- 刪 `docs/year/2627/timetable/versions/` 歷史方案檔
- 改 git config、`--force` push `main`、未獲指示的 `worktree remove --force`

## 工具

- `gh`：`~/.local/bin/gh`；未登入則 `git push`／`git ls-remote`，並在回覆寫明未能開／合 PR。
- 不要叫使用者「下次記得」；把收尾做完，回覆只報告已刪／已留的 branch。
