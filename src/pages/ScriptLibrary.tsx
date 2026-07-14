import { ScriptLibraryView } from "@/components/scriptLibrary/ScriptLibraryView"
import { isMgmtStaff } from "@/lib/mgmtRole"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function ScriptLibraryPage() {
  if (!isMgmtStaff()) {
    return (
      <PagePlaceholder
        title="僅限管理員與外星人"
        description="話術庫僅開放「管理員」與「外星人」角色。請於首頁切換角色，或由有權限的同事操作。"
      />
    )
  }

  return <ScriptLibraryView />
}
