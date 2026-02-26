/**
 * Locale State — builder-i18n T1
 *
 * 언어 전환 상태 관리. 순수 함수 기반.
 * DT: locale-switcher zone의 상태 전이.
 */

export interface LocaleState {
  currentLocale: string;
  availableLocales: string[];
  dropdownOpen: boolean;
}

export function createLocaleState(
  defaultLocale: string,
  locales: string[],
): LocaleState {
  return {
    currentLocale: defaultLocale,
    availableLocales: locales,
    dropdownOpen: false,
  };
}

export function openDropdown(state: LocaleState): LocaleState {
  return { ...state, dropdownOpen: true };
}

export function closeDropdown(state: LocaleState): LocaleState {
  return { ...state, dropdownOpen: false };
}

export function setLocale(state: LocaleState, locale: string): LocaleState {
  return {
    ...state,
    currentLocale: locale,
    dropdownOpen: false, // 선택 시 닫힘
  };
}
