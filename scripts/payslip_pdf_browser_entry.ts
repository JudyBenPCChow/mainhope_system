import {
  payrollPayslipFilename,
  payrollPayslipFooter,
  buildPayrollPayslipHtml,
  renderPayrollPayslipPdfBlob,
} from "@/components/payroll/mockPayslipPdf"
import type { PayrollMonthMock, PayrollTeacherRow } from "@/lib/payroll/viewTypes"

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export async function renderPayslipPdf(month: PayrollMonthMock, teachers: PayrollTeacherRow[]): Promise<{
  filename: string
  base64: string
}> {
  const html = buildPayrollPayslipHtml(month, teachers)
  const blob = await renderPayrollPayslipPdfBlob(html, payrollPayslipFooter(month))
  return {
    filename: payrollPayslipFilename(month, teachers),
    base64: await blobToBase64(blob),
  }
}
