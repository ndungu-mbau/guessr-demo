import { relations, sql } from "drizzle-orm";
import { pgTable, index, primaryKey } from "drizzle-orm/pg-core";

import type { AdapterAccount } from "next-auth/adapters";

export const users = pgTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  balance: d
    .numeric<"number">({ precision: 10, scale: 2 })
    .default(10000)
    .notNull()
    .$type<number>(),
}));

export const accounts = pgTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = pgTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = pgTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const games = pgTable("game", (t) => ({
  id: t.serial("id").primaryKey(),
  number: t.integer("number").notNull(),
  createdAt: t.timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}));

export const bets = pgTable("bet", (t) => ({
  id: t.serial("id").primaryKey(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id),
  gameId: t
    .integer("gameId")
    .notNull()
    .references(() => games.id),
  amount: t.numeric<"number">({ precision: 10, scale: 2 }).notNull(),
  threshold: t.integer("threshold").notNull(),
  isAbove: t.boolean("isAbove").notNull(),
  payout: t.numeric<"number">({ precision: 10, scale: 2 }).notNull(),
  won: t.boolean("won").notNull(),
  createdAt: t.timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  bets: many(bets),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [bets.gameId],
    references: [games.id],
  }),
}));
