/**
 * 다국어 필드 모델 — builder-i18n T1
 *
 * 필드 데이터가 string이면 하위 호환 (locale 무시).
 * Record<locale, string>이면 해당 locale 값을 반환.
 */

export type LocalizedField = Record<string, string>;

export interface ResolveOptions {
    field: string | LocalizedField;
    locale: string;
    defaultLocale: string;
}

export function resolveFieldValue({ field, locale }: ResolveOptions): string {
    // 하위 호환: 단일 string
    if (typeof field === "string") return field;

    // 다국어: locale에 해당하는 값, 없으면 빈 문자열
    return field[locale] ?? "";
}
