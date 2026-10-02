export const AD_ENROLL_FORM_ID = "ad-enroll-form"

export function scrollToAdEnrollForm() {
  document.getElementById(AD_ENROLL_FORM_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
