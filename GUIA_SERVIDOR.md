# Guía paso a paso: servidor de Poké Royale

El servidor es un programa que vive en internet y guarda tus cuentas, amigos y grupos. El juego (en el navegador o en el APK) le habla por internet.

## 1. Probarlo en tu computador (sin Google)
1. Instala Node.js (nodejs.org, versión LTS).
2. Descomprime el zip, abre una terminal dentro de la carpeta y ejecuta:
   `npm install` y luego `npm start`
3. Abre http://localhost:3000 — el juego ya corre. El botón de Google aún no aparece (falta el paso 2).

## 2. Crear tu ID de Google (para "Iniciar sesión con Google")
1. Entra a console.cloud.google.com y crea un proyecto.
2. "APIs y servicios" > "Pantalla de consentimiento de OAuth": elige Externo y completa nombre y correo.
3. "Credenciales" > "Crear credenciales" > "ID de cliente de OAuth" > tipo **Aplicación web**.
4. En "Orígenes de JavaScript autorizados" pon la URL de tu servidor (primero http://localhost:3000, luego la URL https que te dé el hosting).
5. Copia el **ID de cliente** (termina en .apps.googleusercontent.com).

## 3. Ponerlo en internet (gratis con Render)
1. Sube la carpeta a un repositorio de GitHub.
2. En render.com: New > Web Service > conecta tu repositorio.
3. Build Command: `npm install`  ·  Start Command: `npm start`
4. En "Environment" agrega: `GOOGLE_CLIENT_ID` = tu ID de cliente, y `TOKEN_SECRET` = una frase larga y aleatoria.
5. Render te da una URL tipo https://poke-royale.onrender.com. Vuelve al paso 2.4 y agrégala como origen autorizado.
6. Importante: el plan gratis borra `data.json` al reiniciarse. Para guardar cuentas de forma permanente agrega un disco persistente o cambia a una base de datos.

## 4. Convertirlo en APK (Android)
1. Instala Android Studio.
2. En la carpeta del proyecto:
   `npm i -D @capacitor/cli`
   `npm i @capacitor/core @capacitor/android`
   `npx cap init PokeRoyale com.tunombre.pokeroyale --web-dir=public`
3. Edita `public/config.js` y pon: `window.API_URL='https://TU-URL-DE-RENDER';`
4. `npx cap add android` y luego `npx cap sync`
5. `npx cap open android` > en Android Studio: Build > Build APK(s).
6. Google dentro del APK: el botón web no funciona en el WebView. Instala un plugin de login nativo (por ejemplo @capgo/capacitor-social-login), crea en Google Cloud un ID de cliente tipo **Android** (nombre de paquete + huella SHA-1), y envía el idToken a `POST /auth/google` con `{credential: idToken}`. Guarda el `token` que devuelve en `localStorage.pr_token`.

## 5. Probar amigos
Abre el juego en dos dispositivos con cuentas distintas: en AMIGOS copia el código de uno y agrégalo en el otro.

## Límites actuales
- Las partidas se simulan en cada dispositivo; los rivales son bots.
- Monedas y compras las guarda el cliente: para evitar trampas habría que validarlas en el servidor.
