// ═══════════════════════════════════════════════════════════════════
// TC-003 — Resistencia a SQL Injection en el formulario de login
// Autor: Lorenzo Campos
//
// Descripción:
//   Se intenta vulnerar el sistema de autenticación inyectando
//   un payload SQL clásico en los campos de usuario y contraseña.
//   El sistema no debe conceder acceso bajo ninguna circunstancia
//   y el usuario debe permanecer en la página de /login.
//   Esto verifica que el backend valida correctamente las entradas
//   y es resistente al ataque OWASP A03:2021 - Injection.
// ═══════════════════════════════════════════════════════════════════

import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import assert from "assert";

const BASE_URL  = "http://localhost:5173";
const LOGIN_URL = `${BASE_URL}/SIGEI/login`;
const TIMEOUT   = 15000;
const sleep     = (ms) => new Promise((r) => setTimeout(r, ms));

// Payload de SQL Injection clásico
const SQL_PAYLOAD_USER = "' OR '1'='1' --";
const SQL_PAYLOAD_PASS = "' OR '1'='1' --";

console.log("══════════════════════════════════════════════════════");
console.log("TC-003: Resistencia a SQL Injection en el login");
console.log("══════════════════════════════════════════════════════");

const options = new chrome.Options();
options.addArguments(
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--window-size=1400,900",
  "--disable-gpu"
  // SIN --headless: el navegador se abre visible
);

const driver = await new Builder()
  .forBrowser("chrome")
  .setChromeOptions(options)
  .build();

try {
  console.log(`[TC-003] Abriendo navegador...`);
  console.log(`[TC-003] Navegando al login: ${LOGIN_URL}`);
  await driver.get(LOGIN_URL);
  await sleep(2000);

  // Ingresa el payload malicioso en el campo usuario
  const inputUser = await driver.wait(
    until.elementLocated(By.css("input[autocomplete='username']")),
    TIMEOUT
  );
  await inputUser.clear();
  await inputUser.sendKeys(SQL_PAYLOAD_USER);
  console.log(`[TC-003] Payload SQL Injection en usuario: ${SQL_PAYLOAD_USER}`);

  // Ingresa el payload malicioso en el campo contraseña
  const inputPass = await driver.findElement(
    By.css("input[autocomplete='current-password']")
  );
  await inputPass.clear();
  await inputPass.sendKeys(SQL_PAYLOAD_PASS);
  console.log(`[TC-003] Payload SQL Injection en contraseña: ${SQL_PAYLOAD_PASS}`);

  // Envía el formulario con los payloads maliciosos
  await driver.findElement(By.css("button[type='submit']")).click();
  console.log("[TC-003] Formulario enviado con payloads maliciosos, esperando respuesta...");
  await sleep(4000);

  const urlResultado = await driver.getCurrentUrl();
  console.log("[TC-003] URL resultante:", urlResultado);

  // El sistema debe mantener al usuario en /login sin conceder acceso
  assert.ok(
    urlResultado.includes("/login"),
    `SQL Injection no debería conceder acceso, pero la URL fue: ${urlResultado}`
  );

  console.log("[TC-003] ✅ PASÓ — El sistema es resistente a SQL Injection. Permanece en /login.");
  await sleep(2000);
  await driver.quit();
  console.log("[TC-003] Navegador cerrado.");
  process.exit(0);

} catch (e) {
  console.error(`[TC-003] ❌ FALLÓ — ${e.message}`);
  await sleep(2000);
  await driver.quit();
  console.log("[TC-003] Navegador cerrado.");
  process.exit(1);
}
