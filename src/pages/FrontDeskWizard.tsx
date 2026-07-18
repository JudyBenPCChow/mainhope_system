import { Navigate } from "react-router-dom"

import { FrontDeskWizardView } from "@/components/frontDesk/FrontDeskWizardView"
import { getMgmtRole } from "@/lib/mgmtRole"

export default function FrontDeskWizard() {
 if (getMgmtRole() === "teacher") return <Navigate to="/Home" replace />
 return <FrontDeskWizardView />
}
