import zhHK from "../../locales/zh-HK.json";

const merged = {
  ...zhHK,
  common: {
    ...zhHK.common,
    unknown: "未知",
    never: "永不",
  },
  room: {
    ...zhHK.room,
    system: {
      left: "{{name}} 已離開邀請",
      invite_updated: "已更新邀請 — {{changes}}",
      invite_closed: "邀請已由建立者關閉",
    },
    change: {
      title: "標題：{{from}} -> {{to}}",
      place: "地點：{{from}} -> {{to}}",
      gender: "性別：{{from}} -> {{to}}",
      capacity: "人數：{{from}} -> {{to}}",
      expires: {
        never: "到期：已設定 -> 永不",
        datetime: "到期：{{to}}",
      },
    },
  },
  inviteForm: {
    ...zhHK.inviteForm,
    expiry_hint_preset: "將於 {{when}} 到期。",
  },
  gender: {
    any: "不限",
    female: "女",
    male: "男",
  },
  capacity: {
    unlimited: "不限",
    n: "{{n}}",
  },
  expiry: {
    none: "不設到期",
    expired: "已到期",
  },
  time: {
    in_minutes: "{{n}} 分鐘後",
    in_hours: "{{h}} 小時後",
    in_hours_minutes: "{{h}} 小時 {{m}} 分鐘後",
  },
  place: {
    none: "未有地點",
  },
  expires: {
    never: "永不",
  },
};

export default merged;
