import {
  AD_PUBLIC_CAMPUS_ADDRESS,
  AD_PUBLIC_COLLECTION_NOTICE,
  AD_PUBLIC_ENQUIRY_PHONE,
} from "@/lib/adPublicCollectionNotice"

export function AdPublicCampusAddress() {
  return (
    <p className="text-sm leading-relaxed text-foreground">
      <span className="block font-medium">校舍地址</span>
      <span className="mt-0.5 block">{AD_PUBLIC_CAMPUS_ADDRESS}</span>
    </p>
  )
}

export function AdPublicCollectionNotice() {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">收集個人資料聲明</p>
      {AD_PUBLIC_COLLECTION_NOTICE.map((paragraph) => (
        <p key={paragraph}>
          {paragraph.includes(AD_PUBLIC_ENQUIRY_PHONE) ? (
            <>
              {paragraph.split(AD_PUBLIC_ENQUIRY_PHONE)[0]}
              <a className="underline" href={`tel:+852${AD_PUBLIC_ENQUIRY_PHONE.replace("-", "")}`}>
                {AD_PUBLIC_ENQUIRY_PHONE}
              </a>
              {paragraph.split(AD_PUBLIC_ENQUIRY_PHONE)[1]}
            </>
          ) : (
            paragraph
          )}
        </p>
      ))}
    </div>
  )
}
