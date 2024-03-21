import { Values } from "@cotera/nasty";
import { db, CHANGE_ME } from "./helpers";
import { describe, test, expect } from "vitest";

describe("join", () => {
  const Users = Values([
    { id: 1, name: "Kendra" },
    { id: 2, name: "TJ" },
    { id: 3, name: "Ibby" },
    { id: 4, name: "Tom" },
    { id: 5, name: "Grant" },
  ]);

  const Preferences = Values([
    { user_id: 1, fav_color: "blue" },
    { user_id: 3, fav_color: "red" },
  ]);

  test.skip("left join two tables", async () => {
    const query = Users.leftJoin(Preferences, (user, preference) => ({
      on: CHANGE_ME(),
      select: {
        ...user.star(),
        ...preference.except("user_id"),
      },
    }));

    expect(await query.execute(db())).toEqual([
      { fav_color: "blue", id: 1, name: "Kendra" },
      { fav_color: "red", id: 3, name: "Ibby" },
    ]);
  });
});
