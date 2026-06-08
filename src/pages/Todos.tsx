import { Navigate } from "react-router-dom"

/** 舊路由相容：待辦已併入 /Calendar */
export default function TodosPage() {
 return <Navigate to="/Calendar" replace />
}
