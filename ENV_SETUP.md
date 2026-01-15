# Configuración de Variables de Entorno - NextAuth

## Variables Requeridas

Debes agregar estas variables a tu archivo `.env.local`:

```bash
# NextAuth Configuration - REQUERIDO
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<genera-un-secret-aleatorio>

# Supabase (ya deberían existir)
NEXT_PUBLIC_SUPABASE_URL=<tu-url-de-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

## Cómo Generar NEXTAUTH_SECRET

Ejecuta uno de estos comandos en tu terminal:

```bash
# Opción 1: Usando OpenSSL
openssl rand -base64 32

# Opción 2: Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copia el resultado y úsalo como valor de `NEXTAUTH_SECRET`.

## NEXTAUTH_URL

- **Desarrollo local**: `http://localhost:3000`
- **Producción en Vercel**: `https://tu-dominio.vercel.app` o `https://tu-dominio.com`

## Importante

⚠️ **Sin estas variables, NextAuth NO funcionará correctamente** y verás warnings como:
- `[next-auth][warn][NEXTAUTH_URL]`
- `[next-auth][warn][NO_SECRET]`

Estos warnings pueden causar que:
- El token no se cree correctamente
- La redirección después del login no funcione
- El middleware no detecte la sesión

## Verificación

Después de agregar las variables, reinicia el servidor de desarrollo:

```bash
npm run dev
```

Los warnings deberían desaparecer y el login debería funcionar correctamente.
