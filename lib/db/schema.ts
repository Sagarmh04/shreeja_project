import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const auditActionEnum = pgEnum("audit_action", [
  "SIGNUP",
  "LOGIN",
  "LOGOUT",
  "VIEW_RECORDS",
  "VIEW_RECORD",
  "CREATE_RECORD",
  "UPDATE_RECORD",
  "DELETE_RECORD",
  "UPLOAD_ATTACHMENT",
  "DELETE_ATTACHMENT",
  "VIEW_USERS",
  "VIEW_AUDIT_LOGS",
  "UPDATE_PROFILE",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const personalRecords = pgTable("personal_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  quickFacts: jsonb("quick_facts")
    .$type<Array<{ label: string; value: string }>>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recordAttachments = pgTable("record_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  recordId: uuid("record_id")
    .notNull()
    .references(() => personalRecords.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  mimeType: varchar("mime_type", { length: 120 }),
  sizeInBytes: text("size_in_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  actorEmail: varchar("actor_email", { length: 255 }).notNull(),
  action: auditActionEnum("action").notNull(),
  targetTable: varchar("target_table", { length: 120 }).notNull(),
  targetId: varchar("target_id", { length: 120 }),
  metadata: jsonb("metadata")
    .$type<Record<string, string | number | boolean | null>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const loginHistory = pgTable("login_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  loginAt: timestamp("login_at", { withTimezone: true }).notNull().defaultNow(),
  logoutAt: timestamp("logout_at", { withTimezone: true }),
});

export type AuditAction = (typeof auditActionEnum.enumValues)[number];
