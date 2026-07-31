-- Converts user.role from TEXT to the Role enum.
--
-- Hand-written: the generated migration would drop and recreate the column,
-- discarding every provisioned admin. The USING clause maps the previous
-- lowercase values ('user'/'admin') onto the new labels instead.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('User', 'Admin');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "user"
    ALTER COLUMN "role" TYPE "Role"
    USING (CASE lower("role") WHEN 'admin' THEN 'Admin' ELSE 'User' END)::"Role";

ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'User';
