import { test, expect } from "@playwright/test";

test.describe("Phase 1 Foundation E2E Workflow", () => {
  test("executes end-to-end setup, cataloging, single-pane context, and audit verification", async ({
    page,
  }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR STACK:", err.stack || err.message));

    const statusRes = await page.request.get("/api/v1/setup/status");
    const statusData = await statusRes.json();
    const isInitialized = statusData.data?.initialized ?? false;

    if (!isInitialized) {
      await page.goto("/setup");
      await page.waitForLoadState("networkidle");
      await page.fill('input[placeholder="Acme Cloud Corp"]', "Acme Fintech");
      await page.fill('input[placeholder="acme-cloud"]', "acme-fintech");
      await page.fill('input[placeholder="Jane Doe"]', "Alice Admin");
      await page.fill('input[placeholder="admin@example.com"]', "alice@acme.local");
      await page.fill('input[placeholder="••••••••••••"]', "AdminPassword123!");
      await page.click('button:has-text("Initialize Organization")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    } else {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.fill('input[placeholder="you@company.com"]', "alice@acme.local");
      await page.fill('input[placeholder="••••••••••••"]', "AdminPassword123!");
      await page.click('button:has-text("Sign In")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    }

    await expect(page.locator("h1")).toContainText("System Overview");

    await page.goto("/teams");
    await expect(page.locator("h1")).toContainText("Teams");
    await page.click('button:has-text("+ Create Team")');
    await page.fill('input[placeholder="Payments Squad"]', "Payments Team");
    await page.fill(
      'textarea[placeholder="Owns checkout, billing, and fraud detection microservices"]',
      "Owns payment gateways and ledger"
    );
    await page.locator('.fixed form button[type="submit"]').click();
    await expect(page.locator("text=Payments Team").first()).toBeVisible({ timeout: 10000 });

    const teamManageLink = page.locator('tr:has-text("Payments Team") a:has-text("Manage")').first();
    await teamManageLink.click();
    await expect(page.locator("h1")).toContainText("Payments Team");
    await expect(page.locator("text=Team Roster")).toBeVisible();

    await page.goto("/users");
    await expect(page.locator("h1")).toContainText("User Directory");
    await expect(page.locator("text=alice@acme.local").first()).toBeVisible();

    await page.click('button:has-text("+ Add User")');
    await page.fill('input[placeholder="Alex Rivera"]', "Bob Developer");
    await page.fill('input[placeholder="alex@company.com"]', "bob@acme.local");
    await page.fill('input[placeholder="••••••••••••"]', "BobPassword123!");
    await page.locator('.fixed form button[type="submit"]').click();
    await expect(page.locator("text=bob@acme.local").first()).toBeVisible({ timeout: 10000 });

    await page.goto("/teams");
    await page.locator('tr:has-text("Payments Team") a:has-text("Manage")').first().click();
    await page.click('button:has-text("+ Add Member")');
    await page.locator(".fixed form select, form select").first().selectOption({ label: "Bob Developer (bob@acme.local)" });
    await page.locator('.fixed form button[type="submit"]').click();
    await expect(page.locator("text=bob@acme.local").first()).toBeVisible({ timeout: 10000 });

    const createProjBtn = page.locator('button:has-text("+ Create First Project")');
    if (await createProjBtn.isVisible()) {
      await createProjBtn.click();
    } else {
      await page.locator("header select").selectOption("new");
    }

    await page.fill('input[placeholder="Core Banking"]', "Core Banking");
    await page.fill(
      'textarea[placeholder="Primary ledger and transactions ecosystem"]',
      "Primary banking transactions ledger"
    );
    await page.locator('.fixed form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const projsRes = await page.request.get("/api/v1/projects");
    const projsData = await projsRes.json();
    const projsList = projsData.data || projsData;
    const project = projsList.find((p: { slug: string }) => p.slug === "core-banking") || projsList[0];
    const projectId = project.id;

    await page.goto(`/projects/${projectId}/environments`);
    await expect(page.locator("h1")).toContainText("Environment Pipeline");
    await expect(page.locator("text=Development").first()).toBeVisible();
    await expect(page.locator("text=QA").first()).toBeVisible();
    await expect(page.locator("text=UAT").first()).toBeVisible();
    await expect(page.locator("text=Production").first()).toBeVisible();

    await page.goto(`/projects/${projectId}/services`);
    await expect(page.locator("h1")).toContainText("Microservice Catalog");
    await page.click('button:has-text("+ Register Service")');
    await page.fill('input[placeholder="Payment Gateway"]', "payment-service");
    await page.locator(".fixed form select, form select").first().selectOption({ label: "Payments Team" });
    await page.fill(
      'textarea[placeholder="Handles credit cards, wire transfers, and fraud analysis"]',
      "Handles checkout payments"
    );
    await page.locator('.fixed form button[type="submit"]').click();
    await expect(page.locator("text=payment-service").first()).toBeVisible({ timeout: 10000 });

    const envsRes = await page.request.get(`/api/v1/projects/${projectId}/environments`);
    const envsData = await envsRes.json();
    const envsList = envsData.data || envsData;
    const uatEnv = envsList.find((e: { slug: string }) => e.slug === "uat") || envsList[0];

    await page.goto(`/projects/${projectId}/resources`);
    await expect(page.locator("h1")).toContainText("Infrastructure Resources");
    await page.click('button:has-text("+ Provision Resource")');
    await page.locator(".fixed form select, form select").first().selectOption(uatEnv.id);
    await page.fill('input[placeholder="Payments Postgres Database"]', "payments-db");
    await page.locator(".fixed form select").nth(2).selectOption({ label: "Payments Team" });
    await page.locator('.fixed form button[type="submit"]').click();
    await expect(page.locator("text=payments-db").first()).toBeVisible({ timeout: 10000 });

    await page.goto(`/projects/${projectId}/services/payment-service`);
    await expect(page.locator("h1")).toContainText("payment-service");
    await page.locator('button:has-text("User Acceptance Testing")').first().click();

    await page.click('button:has-text("+ Bind Resource")');
    await page.locator(".fixed form select").first().selectOption({ index: 1 });
    await page.locator('.fixed form button[type="submit"]').click();
    await expect(page.locator("text=payments-db").first()).toBeVisible({ timeout: 10000 });

    await page.goto(`/projects/${projectId}/graph`);
    await expect(page.locator("h1")).toContainText("Topology Graph");
    await page.locator('button:has-text("User Acceptance Testing")').first().click();
    await expect(page.locator("text=payment-service").first()).toBeVisible();
    await expect(page.locator("text=payments-db").first()).toBeVisible();

    await page.goto(`/projects/${projectId}/access`);
    await expect(page.locator("h1")).toContainText("Scoped Access Control (RBAC)");
    await page.locator('button:has-text("Who Has Access?")').first().click();
    await expect(page.locator("text=Inspect Scope Target").first()).toBeVisible();

    await page.goto("/audit");
    await expect(page.locator("h1")).toContainText("Immutable Audit Trail");
    await page.locator('button:has-text("Verify Hash Chain Integrity")').first().click();
    await expect(page.locator("text=Cryptographic Hash Chain Validated").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
