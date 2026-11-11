# Poké Royale — servidor + APK

## 1. Servidor
1. Google Cloud Console → APIs y servicios → Credenciales → "ID de cliente de OAuth" tipo **Web**. En "Orígenes autorizados" pon la URL de tu servidor (https).
2. `npm install`
3. `GOOGLE_CLIENT_ID=tu_id.apps.googleusercontent.com TOKEN_SECRET=una_clave_larga npm start`
4. Abre http://localhost:3000 (para probar el login real necesitas https y el origen autorizado).
Despliegue: Render, Railway o Fly.io (usan https/wss). Los datos se guardan en `data.json` (en Render usa un disco persistente o cambia a una base de datos).

## 2. APK con Capacitor (necesitas Node + Android Studio)
```
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npx cap init PokeRoyale com.tuempresa.pokeroyale --web-dir=public
```
Edita `public/config.js`: `window.API_URL='https://TU-SERVIDOR';`
```
npx cap add android && npx cap sync
npx cap open android   # Build > Build APK(s)
```
**Google en el APK:** el botón web de Google no funciona dentro de un WebView. Instala un plugin de login nativo (p. ej. `@capgo/capacitor-social-login`), obtén el `idToken` y envíalo con `POST /auth/google {credential:idToken}`; guarda el `token` que devuelve en `localStorage.pr_token`. Crea además un ID de cliente tipo Android (paquete + SHA-1).

## Pendiente / límites
- El progreso (monedas, skins) lo guarda el cliente: un usuario técnico puede modificarlo. Para evitarlo, las compras y premios deben validarse en el servidor.
- Los grupos comparten posiciones; las partidas siguen simulándose en cada dispositivo (los rivales son bots).
