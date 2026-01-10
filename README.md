# SmartCalender

全画面の「カレンダー / 予定 / 天気 / ニュース」ダッシュボードです。設定は Cookie に保存されます。

## 起動

- 開発: `npm run dev -- --host 0.0.0.0 --port 5173`
- ビルド: `npm run build`
- プレビュー: `npm run preview`

## 設定の保存先

- Cookie キー: `smartCalenderConfig`
- 保存期間: 365 日

> 互換性のため、過去の `smartDashConfig` / `smartDashTheme` Cookie が残っている場合は初回ロード時に新しいキーへ移行されます。

## デフォルト設定（初期値）

デフォルト値の定義元は **[src/utils/config.ts](src/utils/config.ts)** の `DEFAULT_CONFIG` です。

| 項目            | キー                       |                                       デフォルト値 | 備考                                                     |
| --------------- | -------------------------- | -------------------------------------------------: | -------------------------------------------------------- |
| 地域            | `city`                     |                                            `Tokyo` | 天気（Open‑Meteo）の検索名として使用                     |
| RSS URL         | `rssUrl`                   | `https://news.web.nhk/n-data/conf/na/rss/cat0.xml` | ニュース表示に使用                                       |
| iCal カレンダー | `calendars`                |                       `[]`（ただし祝日は自動追加） | 設定画面で追加した分に加え、祝日カレンダーが常に入ります |
| テーマモード    | `themeMode`                |                                         `schedule` | `schedule`（時刻で自動切替）/ `light` / `dark`           |
| ライト開始      | `themeSchedule.lightStart` |                                            `07:00` | `schedule` のときに有効                                  |
| ダーク開始      | `themeSchedule.darkStart`  |                                            `19:00` | `schedule` のときに有効                                  |

### 祝日カレンダーについて

- 祝日は Google 公開カレンダー（日本の祝日 ICS）を自動で `calendars` に追加します。
- 設定画面では「祝日」行は表示しない（編集させない）仕様です。

## 設定スキーマ（参考）

`smartCalenderConfig` は概ね以下の形です（将来追加の可能性あり）。

```json
{
  "city": "Tokyo",
  "rssUrl": "https://news.web.nhk/n-data/conf/na/rss/cat0.xml",
  "calendars": [
    {
      "url": "https://example.com/calendar.ics",
      "color": "#60a5fa",
      "name": "Work"
    },
    { "url": "(祝日ICS)", "color": "#ef4444", "name": "祝日" }
  ],
  "themeMode": "schedule",
  "themeSchedule": {
    "lightStart": "07:00",
    "darkStart": "19:00"
  }
}
```

## 更新間隔（参考）

- iCal: 5 分ごと（壁時計に揃えて更新）
- RSS: 5 分ごと（壁時計に揃えて更新）
- 天気: 10 分ごと（壁時計に揃えて更新）
