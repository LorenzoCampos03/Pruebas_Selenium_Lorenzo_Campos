// ═══════════════════════════════════════════════════════════════════
// TC-001 — Acceso sin autenticación a ruta protegida
// Autor: Lorenzo Campos
//
// Descripción:
//   Se abre el navegador y se muestra la página de login.
//   Sin haber iniciado sesión, se intenta acceder directamente
//   a /SIGEI/secretaria/eventos escribiendo la ruta en el explorador.
//   El ProtectedRoute detecta la ausencia de token JWT y redirige
//   automáticamente de vuelta al /login.
//   Verifica que ninguna ruta privada sea accesible sin autenticación.
// ═══════════════════════════════════════════════════════════════════

import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import assert from "assert";

const BASE_URL    = "http://localhost:5173";
const LOGIN_URL   = `${BASE_URL}/SIGEI/login`;
const EVENTOS_URL = `${BASE_URL}/SIGEI/secretaria/eventos`;
const sleep       = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("══════════════════════════════════════════════════════");
console.log("TC-001: Acceso sin autenticación a ruta protegida");
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
  // Paso 1: Abre el navegador y muestra la página de login
  console.log("[TC-001] Abriendo navegador...");
  console.log(`[TC-001] Mostrando página de login: ${LOGIN_URL}`);
  await driver.get(LOGIN_URL);
  await sleep(3000); // Pausa para ver el login claramente

  // Paso 2: Sin loguearse, escribe la ruta protegida en el explorador
  console.log(`[TC-001] Intentando acceder a ruta protegida sin sesión: ${EVENTOS_URL}`);
  await driver.get(EVENTOS_URL);
  await sleep(3000); // Pausa para ver la redirección

  // Paso 3: Verifica que el sistema redirigió de vuelta al login
  const urlActual = await driver.getCurrentUrl();
  console.log("[TC-001] URL resultante:", urlActual);

  assert.ok(
    urlActual.includes("/login"),
    `Se esperaba redirección al /login, pero se obtuvo: ${urlActual}`
  );

  console.log("[TC-001] ✅ PASÓ — Sin token JWT el sistema redirigió al login correctamente.");
  await sleep(2000);
  await driver.quit();
  console.log("[TC-001] Navegador cerrado.");
  process.exit(0);

} catch (e) {
  console.error(`[TC-001] ❌ FALLÓ — ${e.message}`);
  await sleep(2000);
  await driver.quit();
  console.log("[TC-001] Navegador cerrado.");
  process.exit(1);
}

