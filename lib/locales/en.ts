import en from "../../locales/en.json";

const merged = {
  ...en,
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
  gender: {
    any: "any",
    female: "female",
    male: "male",
  },
  capacity: {
    unlimited: "Unlimited",
  },
  place: {
    none: "No place",
  },
  expires: {
    never: "Never",
  },
};

export default merged;
