# Guía de Deployment a Vercel

## 📋 Pre-Deployment Checklist

Antes de hacer deploy a Vercel, asegúrate de:

- [x] Migración de NextAuth completada
- [x] Código compila sin errores críticos
- [ ] Variables de entorno preparadas
- [ ] NEXTAUTH_SECRET generado para producción
- [ ] NEXTAUTH_URL configurado con dominio de producción

## 🔧 Configuración de Variables de Entorno en Vercel

### 1. Acceder a la Configuración

1. Ve a tu proyecto en Vercel Dashboard
2. Click en "Settings"
3. Click en "Environment Variables"

### 2. Agregar Variables Requeridas

Agrega las siguientes variables para **Production**, **Preview**, y **Development**:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=<genera-uno-nuevo-para-produccion>

# Supabase (ya deberían existir, verificar)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Generar NEXTAUTH_SECRET para Producción

**IMPORTANTE**: NO uses el mismo secret de desarrollo en producción

```bash
# Genera un nuevo secret:
openssl rand -base64 32

# O en Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Configurar NEXTAUTH_URL Correctamente

- **Production**: `https://tu-dominio-real.com`
- **Preview**: `https://tu-proyecto-git-branch.vercel.app`
- **Development**: `http://localhost:3000`

**Tip**: Vercel puede usar `VERCEL_URL` automáticamente, pero es mejor ser explícito.

## 🚀 Proceso de Deployment

### Opción 1: Deploy desde Git (Recomendado)

```bash
# 1. Commit todos los cambios
git add .
git commit -m "feat: migrar a NextAuth.js para autenticación estable"

# 2. Push a tu repositorio
git push origin main

# 3. Vercel detectará el push y hará deploy automáticamente
```

### Opción 2: Deploy Manual con Vercel CLI

```bash
# 1. Instalar Vercel CLI si no lo tienes
npm install -g vercel

# 2. Login a Vercel
vercel login

# 3. Deploy a producción
vercel --prod
```

## ✅ Post-Deployment Verification

Una vez que el deploy esté completo:

### 1. Verificar Variables de Entorno

En Vercel Dashboard:
- Settings → Environment Variables
- Confirmar que todas las variables estén presentes
- Verificar que no haya typos en los nombres

### 2. Probar el Login

1. Visita `https://tu-dominio.vercel.app`
2. Deberías ser redirigido a `/login`
3. Intenta iniciar sesión con un usuario válido
4. Verifica que seas redirigido a tu dashboard

### 3. Probar Persistencia de Sesión

1. Inicia sesión
2. Recarga la página (F5)
3. La sesión debe persistir sin problemas
4. No debería haber "parpadeo" o redirección a login

### 4. Verificar Logs

En Vercel Dashboard:
- Ve a tu proyecto
- Click en la última deployment
- Click en "Functions" o "Logs"
- Busca errores relacionados con auth

### 5. Probar Logout

1. Click en el botón de logout
2. Deberías ser redirigido a `/login`
3. Intenta acceder a una ruta privada
4. Deberías ser redirigido a `/login`

## 🔍 Troubleshooting

### Error: "NEXTAUTH_URL is not defined"

**Solución:**
- Ve a Settings → Environment Variables
- Verifica que `NEXTAUTH_URL` esté configurado
- Debe incluir el protocolo: `https://...`
- Redeploy después de agregar la variable

### Error: "Invalid credentials"

**Posibles causas:**
1. `SUPABASE_SERVICE_ROLE_KEY` no está configurada
2. La key es incorrecta
3. El usuario no existe en Supabase

**Solución:**
- Verifica las variables de Supabase en Vercel
- Confirma que la service role key sea correcta
- Prueba con un usuario que sepas que existe

### Error: "Session not persisting"

**Posibles causas:**
1. `NEXTAUTH_SECRET` no está configurado
2. Cookies bloqueadas por el navegador
3. Dominio incorrecto en `NEXTAUTH_URL`

**Solución:**
- Verifica `NEXTAUTH_SECRET` en variables de entorno
- Asegúrate de que `NEXTAUTH_URL` coincida con tu dominio real
- Revisa la configuración de cookies en tu navegador

### Error: "Middleware infinite redirect"

**Posibles causas:**
1. Token JWT corrupto
2. `NEXTAUTH_SECRET` cambió después de crear tokens
3. Problema con el matcher del middleware

**Solución:**
- Limpia las cookies del navegador
- Verifica que `NEXTAUTH_SECRET` sea consistente
- Revisa los logs del middleware en Vercel

## 📊 Monitoreo Post-Deployment

### Métricas a Vigilar

1. **Tasa de Login Exitoso**
   - Monitorea logs de errores de autenticación
   - Deberían ser mínimos si la migración fue exitosa

2. **Performance del Middleware**
   - Vercel Analytics debería mostrar tiempos rápidos
   - JWT verification es muy rápida (~1-2ms)

3. **Errores de Sesión**
   - Busca errores relacionados con "session" o "token"
   - Investiga cualquier patrón repetitivo

### Herramientas de Monitoreo

- **Vercel Analytics**: Performance general
- **Vercel Logs**: Errores y warnings
- **Browser Console**: Errores en cliente
- **Supabase Dashboard**: Queries a la base de datos

## 🔄 Rollback Plan

Si algo sale mal, puedes hacer rollback rápidamente:

### Opción 1: Rollback en Vercel Dashboard

1. Ve a Deployments
2. Encuentra el último deployment que funcionaba
3. Click en "..." → "Promote to Production"

### Opción 2: Revert Git Commit

```bash
# Ver commits recientes
git log --oneline -5

# Revertir al commit anterior a la migración
git revert <commit-hash>
git push origin main
```

## 📝 Checklist Final de Production

- [ ] Variables de entorno configuradas en Vercel
- [ ] NEXTAUTH_SECRET único para producción
- [ ] NEXTAUTH_URL con dominio correcto
- [ ] Deploy exitoso sin errores
- [ ] Login funciona correctamente
- [ ] Sesión persiste al recargar
- [ ] Logout funciona
- [ ] Protección de rutas funciona
- [ ] Datos de usuarios se cargan correctamente
- [ ] Sin errores en logs de Vercel
- [ ] Performance es buena (< 100ms para auth checks)
- [ ] Usuarios existentes pueden iniciar sesión

## 🎉 Deploy Exitoso

Si todos los checks están marcados, ¡felicitaciones! La migración a NextAuth.js está completa y funcionando en producción.

### Beneficios Confirmados

- ✅ Sesiones estables sin pérdida al recargar
- ✅ Logout funciona sin colgarse
- ✅ Sin conflictos cliente/servidor
- ✅ Performance mejorada con JWT
- ✅ Compatible con los 93 usuarios existentes
- ✅ Todas las relaciones de BD intactas

---

**Última actualización**: ${new Date().toLocaleDateString('es-ES')}
**Status**: Lista para producción ✅
