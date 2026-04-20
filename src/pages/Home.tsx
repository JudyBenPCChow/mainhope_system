import { AdminDashboard } from "@/components/home/AdminDashboard"
import { AlienGodViewHome } from "@/components/home/AlienGodViewHome"
import { TeacherHomeView } from "@/components/home/TeacherHomeView"
import { DEMO_ADMIN_GREETING_NAME, DEMO_ALIEN_GREETING_NAME } from "@/lib/demoMgmtPersonas"
import { JUDY_CHU_TEACHER_ID } from "@/lib/teacherScope"
import { appendMgmtAuditLog } from "@/services/mgmtGodViewQueries"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Role = "admin" | "teacher" | "alien"

export default function Home() {
  const role = (localStorage.getItem("mgmt_role") as Role | null) ?? null

  if (role === "teacher") {
    return <TeacherHomeView />
  }

  if (role === "alien") {
    return <AlienGodViewHome />
  }

  if (role === "admin") {
    return <AdminDashboard />
  }

  const setRole = async (r: Role) => {
    localStorage.setItem("mgmt_role", r)
    if (r === "teacher") {
      localStorage.setItem("teacher_id", JUDY_CHU_TEACHER_ID)
    } else {
      localStorage.removeItem("teacher_id")
    }
    const actorLabel =
      r === "admin"
        ? `管理員（${DEMO_ADMIN_GREETING_NAME}）`
        : r === "teacher"
          ? "專班老師（Judy Chu · 演示）"
          : `外星人（${DEMO_ALIEN_GREETING_NAME}）`
    await appendMgmtAuditLog({
      actorLabel,
      role: r,
      action: "選角登入（演示）",
      path: typeof window !== "undefined" ? window.location.pathname : "/Home",
    })
    window.location.reload()
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 p-6">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          明學補習社 — 管理系統
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">請選擇進入身分（演示環境）</p>
      </div>

      {/* 管理員：獨立登入區（與外星人／老師區隔） */}
      <section
        className={cn(
          "w-full max-w-lg rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50/90 p-6 shadow-md md:p-8",
          "text-left"
        )}
        aria-labelledby="admin-login-heading"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-800/90">管理員</p>
        <h2 id="admin-login-heading" className="mt-2 text-xl font-bold text-foreground md:text-2xl">
          登入管理中心
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          以補習社<strong>日常營運</strong>管理員身分進入。演示帳將顯示「你好，{DEMO_ADMIN_GREETING_NAME}！」於首頁，並使用一般管理權限選單。
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full gap-2 bg-sky-600 hover:bg-sky-700 sm:w-auto"
          onClick={() => void setRole("admin")}
        >
          以管理員身分進入
        </Button>
      </section>

      {/* 外星人：維持原有簡潔按鈕與說明；專班老師併列於此區 */}
      <section className="w-full max-w-lg space-y-4" aria-label="其它演示身分">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          其它演示身分
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="secondary" onClick={() => void setRole("teacher")}>
            專班老師
          </Button>
          <Button type="button" variant="outline" onClick={() => void setRole("alien")}>
            外星人
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          請選擇演示角色（寫入 <code className="rounded bg-muted px-1">localStorage.mgmt_role</code>
          ）。接上 Supabase 後改為真實登入。
        </p>
      </section>
    </div>
  )
}
