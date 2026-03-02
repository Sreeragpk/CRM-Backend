import {
  PrismaClient,
  DealStage,
  DealType,
  LeadSource,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  // 🧹 CLEAN DATABASE
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 👤 USERS
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@crm.com", password: hashedPassword, role: UserRole.ADMIN },
  });

  const manager = await prisma.user.create({
    data: { name: "Sarah Manager", email: "sarah@crm.com", password: hashedPassword, role: UserRole.MANAGER },
  });

  const salesRep1 = await prisma.user.create({
    data: { name: "John Sales", email: "john@crm.com", password: hashedPassword, role: UserRole.SALES_REP },
  });

  const salesRep2 = await prisma.user.create({
    data: { name: "Emily Rep", email: "emily@crm.com", password: hashedPassword, role: UserRole.SALES_REP },
  });

  // 🏢 ACCOUNTS (unchanged — your data kept)
  import { AccountType, AccountRating } from "@prisma/client";

const account1 = await prisma.account.create({
  data: {
    accountName: "Acme Corporation",
    accountOwnerId: salesRep1.id,
    accountType: AccountType.CUSTOMER_DIRECT,
    rating: AccountRating.HOT,
    phone: "+1 555-1000",
    website: "https://acme.com",
    industry: "Manufacturing",
    annualRevenue: 5000000,
    employees: 1200,
    billingCity: "New York",
    billingCountry: "USA",
    shippingCity: "New York",
    shippingCountry: "USA",
  },
});

const account2 = await prisma.account.create({
  data: {
    accountName: "Global Tech Solutions",
    accountOwnerId: salesRep2.id,
    accountType: AccountType.PROSPECT,
    rating: AccountRating.WARM,
    phone: "+1 555-2000",
    website: "https://globaltech.com",
    industry: "Software",
    employees: 350,
    billingCity: "San Francisco",
    billingCountry: "USA",
  },
});

const account3 = await prisma.account.create({
  data: {
    accountName: "Sunrise Healthcare",
    accountOwnerId: manager.id,
    accountType: AccountType.CUSTOMER_DIRECT,
    rating: AccountRating.HOT,
    phone: "+1 555-3000",
    industry: "Healthcare",
    employees: 800,
    billingCity: "Chicago",
    billingCountry: "USA",
  },
});

const account4 = await prisma.account.create({
  data: {
    accountName: "EduLearn Platform",
    accountOwnerId: salesRep1.id,
    accountType: AccountType.PROSPECT,
    rating: AccountRating.COLD,
    industry: "EdTech",
    employees: 90,
    website: "https://edulearn.com",
  },
});

const account5 = await prisma.account.create({
  data: {
    accountName: "FinanceFlow Inc",
    accountOwnerId: salesRep2.id,
    accountType: AccountType.CHANNEL_PARTNER,
    rating: AccountRating.WARM,
    industry: "FinTech",
    employees: 500,
    website: "https://financeflow.com",
  },
});

const account6 = await prisma.account.create({
  data: {
    accountName: "Acme Labs (R&D Division)",
    parentAccountId: account1.id,
    accountOwnerId: salesRep1.id,
    accountType: AccountType.CUSTOMER_DIRECT,
    rating: AccountRating.HOT,
    industry: "Research",
    employees: 150,
    billingCity: "Boston",
    billingCountry: "USA",
  },
});

  // 👥 CONTACTS
  const contact1 = await prisma.contact.create({ data: { firstName: "Robert", lastName: "Johnson", email: "robert.johnson@acme.com", accountId: account1.id, contactOwnerId: salesRep1.id, createdById: salesRep1.id, modifiedById: salesRep1.id }});
  const contact2 = await prisma.contact.create({ data: { firstName: "Lisa", lastName: "Chen", email: "lisa.chen@acme.com", accountId: account1.id, contactOwnerId: salesRep1.id, createdById: salesRep1.id, modifiedById: salesRep1.id }});
  const contact3 = await prisma.contact.create({ data: { firstName: "Michael", lastName: "Williams", email: "michael.w@globaltech.com", accountId: account2.id, contactOwnerId: salesRep2.id, createdById: salesRep2.id, modifiedById: salesRep2.id }});
  const contact4 = await prisma.contact.create({ data: { firstName: "Jennifer", lastName: "Davis", email: "jennifer.d@globaltech.com", accountId: account2.id, contactOwnerId: salesRep2.id, createdById: salesRep2.id, modifiedById: salesRep2.id }});
  const contact5 = await prisma.contact.create({ data: { firstName: "Dr. Amanda", lastName: "Foster", email: "amanda.foster@sunrisehealth.com", accountId: account3.id, contactOwnerId: manager.id, createdById: manager.id, modifiedById: manager.id }});
  const contact6 = await prisma.contact.create({ data: { firstName: "David", lastName: "Park", email: "david.park@financeflow.com", accountId: account5.id, contactOwnerId: salesRep2.id, createdById: salesRep2.id, modifiedById: salesRep2.id }});
  const contact7 = await prisma.contact.create({ data: { firstName: "Karen", lastName: "Mitchell", email: "karen.m@edulearn.com", accountId: account4.id, contactOwnerId: salesRep1.id, createdById: salesRep1.id, modifiedById: salesRep1.id }});

  // 💰 DEALS — ✅ RFQ PIPELINE STAGES
  await prisma.deal.createMany({
    data: [
      { dealName: "Acme Enterprise License", stage: DealStage.NEGOTIATION, type: DealType.EXISTING_BUSINESS, leadSource: LeadSource.WEB, amount: 150000, expectedRevenue: 150000, probability: 90, closingDate: new Date("2025-03-15"), dealOwnerId: salesRep1.id, accountId: account1.id, contactId: contact1.id, createdById: salesRep1.id, modifiedById: salesRep1.id },

      { dealName: "Acme Cloud Migration", stage: DealStage.COMMERCIAL_PROPOSAL, type: DealType.NEW_BUSINESS, leadSource: LeadSource.PARTNER_REFERRAL, amount: 75000, expectedRevenue: 60000, probability: 75, closingDate: new Date("2025-04-30"), dealOwnerId: salesRep1.id, accountId: account1.id, contactId: contact2.id, createdById: salesRep1.id, modifiedById: salesRep1.id },

      { dealName: "GlobalTech Platform Deal", stage: DealStage.TECHNICAL_PROPOSAL, type: DealType.NEW_BUSINESS, leadSource: LeadSource.WEB, amount: 500000, expectedRevenue: 400000, probability: 40, closingDate: new Date("2025-06-30"), dealOwnerId: salesRep2.id, accountId: account2.id, contactId: contact3.id, createdById: salesRep2.id, modifiedById: salesRep2.id },

      { dealName: "GlobalTech Support Contract", stage: DealStage.CLOSED_WON, type: DealType.NEW_BUSINESS, leadSource: LeadSource.PHONE_INQUIRY, amount: 60000, expectedRevenue: 60000, probability: 100, closingDate: new Date("2025-03-01"), dealOwnerId: salesRep2.id, accountId: account2.id, contactId: contact4.id, createdById: salesRep2.id, modifiedById: salesRep2.id },

      { dealName: "Sunrise Health EHR System", stage: DealStage.VISIT_MEETING, type: DealType.NEW_BUSINESS, leadSource: LeadSource.PARTNER_REFERRAL, amount: 300000, expectedRevenue: 250000, probability: 60, closingDate: new Date("2025-05-15"), dealOwnerId: manager.id, accountId: account3.id, contactId: contact5.id, createdById: manager.id, modifiedById: manager.id },

      { dealName: "EduLearn LMS Integration", stage: DealStage.PREVIEW, type: DealType.NEW_BUSINESS, leadSource: LeadSource.WEB, amount: 45000, expectedRevenue: 35000, probability: 20, closingDate: new Date("2025-04-15"), dealOwnerId: salesRep1.id, accountId: account4.id, contactId: contact7.id, createdById: salesRep1.id, modifiedById: salesRep1.id },

      { dealName: "FinanceFlow API Partnership", stage: DealStage.RFQ, type: DealType.NEW_BUSINESS, leadSource: LeadSource.PARTNER_REFERRAL, amount: 200000, expectedRevenue: 180000, probability: 10, closingDate: new Date("2025-07-01"), dealOwnerId: salesRep2.id, accountId: account5.id, contactId: contact6.id, createdById: salesRep2.id, modifiedById: salesRep2.id },

      { dealName: "FinanceFlow Compliance Module", stage: DealStage.CLOSED_LOST, type: DealType.NEW_BUSINESS, leadSource: LeadSource.PURCHASED_LIST, amount: 120000, expectedRevenue: 100000, probability: 0, closingDate: new Date("2025-02-28"), dealOwnerId: salesRep2.id, accountId: account5.id, contactId: contact6.id, createdById: salesRep2.id, modifiedById: salesRep2.id },

      { dealName: "Acme Labs Research Tools", stage: DealStage.COMMERCIAL_PROPOSAL, type: DealType.NEW_BUSINESS, leadSource: LeadSource.OTHER, amount: 35000, expectedRevenue: 30000, probability: 75, closingDate: new Date("2025-03-30"), dealOwnerId: salesRep1.id, accountId: account6.id, createdById: salesRep1.id, modifiedById: salesRep1.id },

      { dealName: "Sunrise Telemedicine Platform", stage: DealStage.RFQ, type: DealType.NEW_BUSINESS, leadSource: LeadSource.WEB, amount: 180000, expectedRevenue: 160000, probability: 10, closingDate: new Date("2025-08-15"), dealOwnerId: manager.id, accountId: account3.id, contactId: contact5.id, createdById: manager.id, modifiedById: manager.id },
    ],
  });

  console.log("🎉 Seed completed successfully!");
}

main().finally(() => prisma.$disconnect());