-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "address" TEXT,
    "region" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Screen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "orientation" TEXT NOT NULL DEFAULT 'landscape',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Screen_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "contactEmail" TEXT,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "relatedLocationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advertiser_relatedLocationId_fkey" FOREIGN KEY ("relatedLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL,
    "internalName" TEXT NOT NULL,
    "bgUrl" TEXT,
    "logoUrl" TEXT,
    "headline" TEXT NOT NULL,
    "subtext" TEXT,
    "ctaType" TEXT NOT NULL DEFAULT 'none',
    "ctaValue" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seasonTag" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "weekSchedule" TEXT NOT NULL DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
    "promoCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ad_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adId" TEXT NOT NULL,
    "regionTarget" TEXT,
    "specificScreenId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_specificScreenId_fkey" FOREIGN KEY ("specificScreenId") REFERENCES "Screen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
