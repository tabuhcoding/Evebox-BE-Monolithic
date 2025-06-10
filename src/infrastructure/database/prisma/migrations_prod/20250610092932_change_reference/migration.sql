-- DropForeignKey
ALTER TABLE "FavoriteNotiHistory" DROP CONSTRAINT "FavoriteNotiHistory_userId_fkey";

-- AddForeignKey
ALTER TABLE "FavoriteNotiHistory" ADD CONSTRAINT "FavoriteNotiHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
