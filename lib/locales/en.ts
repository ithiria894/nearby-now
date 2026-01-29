import en from "../../locales/en.json";

const merged = {
  ...en,
  common: {
    ...en.common,
    unknown: "Unknown",
    never: "Never",
  },
  room: {
    ...en.room,
    system: {
      left: "{{name}} left the invite",
      invite_updated: "Updated invite — {{changes}}",
      invite_closed: "Invite closed by creator",
    },
    change: {
      title: "title: {{from}} -> {{to}}",
      place: "place: {{from}} -> {{to}}",
      gender: "gender: {{from}} -> {{to}}",
      capacity: "capacity: {{from}} -> {{to}}",
      expires: {
        never: "expires: set -> never",
        datetime: "expires: {{to}}",
      },
    },
  },
  inviteForm: {
    ...en.inviteForm,
    expiry_hint_preset: "Expires {{when}}.",
  },
  gender: {
    any: "any",
    female: "female",
    male: "male",
  },
  capacity: {
    unlimited: "Unlimited",
    n: "{{n}}",
  },
  expiry: {
    none: "No expiry",
    expired: "Expired",
  },
  time: {
    in_minutes: "in {{n}} minutes",
    in_hours: "in {{h}} hours",
    in_hours_minutes: "in {{h}}h {{m}}m",
  },
  place: {
    none: "No place",
  },
  expires: {
    never: "Never",
  },
};

export default merged;
