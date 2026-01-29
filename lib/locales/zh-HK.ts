import zhHK from "../../locales/zh-HK.json";

const merged = {
  ...zhHK,
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
  gender: {
    any: "不限",
    female: "女",
    male: "男",
  },
  capacity: {
    unlimited: "不限",
  },
  place: {
    none: "未有地點",
  },
  expires: {
    never: "永不",
  },
};

export default merged;
