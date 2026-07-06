// ═══════════════════════════════════════════════════════════════════
// TC-002 — Login exitoso y acceso a ruta protegida
// Autor: Lorenzo Campos
//
// Descripción:
//   El usuario se autentica con credenciales válidas (rol: SECRETARIA).
//   Después de iniciar sesión correctamente, navega a la ruta protegida
//   /SIGEI/secretaria/eventos y verifica que puede acceder sin ser
//   redirigido al login. Confirma que el token JWT generado es válido
//   y que el ProtectedRoute permite el paso a usuarios autenticados.
// ═══════════════════════════════════════════════════════════════════

import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import assert from "assert";

const BASE_URL    = "http://localhost:5173";
const LOGIN_URL   = `${BASE_URL}/SIGEI/login`;
const EVENTOS_URL = `${BASE_URL}/SIGEI/secretaria/eventos`;
const TIMEOUT     = 15000;
const sleep       = (ms) => new Promise((r) => setTimeout(r, ms));

const USUARIO  = "carmen.aguilar@sigei.gob.pe";
const PASSWORD = "89510222";

console.log("══════════════════════════════════════════════════════");
console.log("TC-002: Login exitoso y acceso a /secretaria/eventos");
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
  console.log(`[TC-002] Abriendo navegador...`);
  console.log(`[TC-002] Navegando al login: ${LOGIN_URL}`);
  await driver.get(LOGIN_URL);
  await sleep(2000);

  // Ingresa el usuario
  const inputUser = await driver.wait(
    until.elementLocated(By.css("input[autocomplete='username']")),
    TIMEOUT
  );
  await inputUser.clear();
  await inputUser.sendKeys(USUARIO);
  console.log(`[TC-002] Usuario ingresado: ${USUARIO}`);

  // Ingresa la contraseña
  const inputPass = await driver.findElement(
    By.css("input[autocomplete='current-password']")
  );
  await inputPass.clear();
  await inputPass.sendKeys(PASSWORD);
  console.log("[TC-002] Contraseña ingresada.");

  // Envía el formulario
  await driver.findElement(By.css("button[type='submit']")).click();
  console.log("[TC-002] Formulario enviado, esperando respuesta del servidor...");
  await sleep(4000);

  const urlPostLogin = await driver.getCurrentUrl();
  console.log("[TC-002] URL después del login:", urlPostLogin);

  assert.ok(
    !urlPostLogin.includes("/login"),
    `Login fallido, sigue en login: ${urlPostLogin}`
  );
  console.log("[TC-002] Login exitoso. Navegando a la ruta protegida...");

  // Navega a la ruta protegida
  await driver.get(EVENTOS_URL);
  await sleep(3000);

  const urlFinal = await driver.getCurrentUrl();
  console.log("[TC-002] URL en ruta protegida:", urlFinal);

  assert.ok(
    !urlFinal.includes("/login"),
    `Con sesión activa no debería redirigir al login, pero obtuvo: ${urlFinal}`
  );

  console.log("[TC-002] ✅ PASÓ — Usuario autenticado accede correctamente a /secretaria/eventos.");
  await sleep(2000);
  await driver.quit();
  console.log("[TC-002] Navegador cerrado.");
  process.exit(0);

} catch (e) {
  console.error(`[TC-002] ❌ FALLÓ — ${e.message}`);
  await sleep(2000);
  await driver.quit();
  console.log("[TC-002] Navegador cerrado.");
  process.exit(1);
}
