/**
 * @os-react/internal — OS 내부 전용 export
 *
 * 이 경로의 모듈은 OS 개발/레거시 코드에서만 사용한다.
 * 앱 개발자는 defineApp → createZone → bind() API만 사용해야 한다.
 *
 * @see design-principles.md #30: defineApp = Application Context. top-down only.
 */

export { Item } from "./6-project/Item";
// Raw primitives — internal only
export { Zone } from "./6-project/Zone";
