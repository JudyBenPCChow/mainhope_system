import { describe, expect, it } from "vitest"

import {
  expenseAttachmentValidationError,
  sanitizeExpenseAttachmentFilename,
} from "@/lib/expenseJournalAttachment"

function fakeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(Math.max(size, 1))], { type })
  return new File([blob], name, { type })
}

describe("expenseJournalAttachment", () => {
  it("accepts jpeg and pdf within 10MB", () => {
    expect(expenseAttachmentValidationError(fakeFile("a.jpg", "image/jpeg", 12))).toBeNull()
    expect(
      expenseAttachmentValidationError(fakeFile("receipt.pdf", "application/pdf", 24))
    ).toBeNull()
  })

  it("rejects oversize or unknown types", () => {
    expect(
      expenseAttachmentValidationError(fakeFile("big.jpg", "image/jpeg", 10 * 1024 * 1024 + 1))
    ).toBe("附件不可超過 10MB")
    expect(expenseAttachmentValidationError(fakeFile("x.exe", "application/octet-stream", 8))).toBe(
      "只接受 JPG、PNG 或 PDF"
    )
    expect(expenseAttachmentValidationError(fakeFile("a.webp", "image/webp", 12))).toBe(
      "只接受 JPG、PNG 或 PDF"
    )
  })

  it("strips non-ascii from storage filenames", () => {
    expect(sanitizeExpenseAttachmentFilename("receipt photo.png")).toBe("receipt_photo.png")
    expect(sanitizeExpenseAttachmentFilename("../../../etc/passwd")).toBe("passwd")
    expect(sanitizeExpenseAttachmentFilename("發票.pdf")).toBe("attachment.pdf")
  })
})
