# 1-sensor

사용자 입력 감지 레이어.

## 폴더

- `keyboard/` — 키보드 입력 (KeyboardSensor, classify, keybindings)
- `focus/` — 포커스 이벤트 (FocusSensor: focusin, focusout, click)
- `clipboard/` — 클립보드 (ClipboardSensor: copy, cut, paste)

## 역할

DOM 이벤트를 감지하고 커맨드로 변환하여 dispatch.
순수한 sensor — state를 읽거나 쓰지 않음.
