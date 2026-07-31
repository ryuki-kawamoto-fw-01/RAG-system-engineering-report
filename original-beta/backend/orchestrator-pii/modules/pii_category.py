from azure.ai.textanalytics._generated.v2023_04_01.models._text_analytics_client_enums import (
    PiiEntityCategory,
)

# Azure指定の各カテゴリ名と日本語名のマッピング
pii_category_mapping = {
    PiiEntityCategory.PERSON.value: "個人名",
    PiiEntityCategory.PHONE_NUMBER.value: "電話番号",
    PiiEntityCategory.ADDRESS.value: "住所",
    PiiEntityCategory.EMAIL.value: "メールアドレス",
    PiiEntityCategory.IP_ADDRESS.value: "IPアドレス",
    PiiEntityCategory.AGE.value: "年齢",
    PiiEntityCategory.CREDIT_CARD_NUMBER.value: "クレジットカード",
    PiiEntityCategory.JP_BANK_ACCOUNT_NUMBER.value: "日本の銀行口座番号",
    PiiEntityCategory.JP_DRIVERS_LICENSE_NUMBER.value: "日本の運転免許証番号",
    PiiEntityCategory.JP_MY_NUMBER_CORPORATE.value: "日本のマイナンバー(企業)",
    PiiEntityCategory.JP_MY_NUMBER_PERSONAL.value: "日本のマイナンバー(個人)",
    PiiEntityCategory.JP_PASSPORT_NUMBER.value: "日本のパスポート番号",
    PiiEntityCategory.JP_RESIDENCE_CARD_NUMBER.value: "日本の住民票コード",
    PiiEntityCategory.JP_RESIDENT_REGISTRATION_NUMBER.value: "日本の在留カード番号",
    PiiEntityCategory.JP_SOCIAL_INSURANCE_NUMBER.value: "日本の社会保険番号 (SIN)",
}
