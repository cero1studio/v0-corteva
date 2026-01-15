# Instrucciones Rápidas - Migración a NextAuth.js

## 🚀 Pasos Inmediatos

### 1. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local` con estas variables:

```bash
# NextAuth - REQUERIDO
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-generado-aqui

# Supabase (ya deberían existir)
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

**Para generar el NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Instalar y Ejecutar

```bash
# Las dependencias ya están instaladas
# Si necesitas reinstalar:
npm install

# Ejecutar en desarrollo
npm run dev
```

### 3. Probar el Login

1. Abre http://localhost:3000
2. Serás redirigido a `/login`
3. Ingresa las credenciales de un usuario existente
4. Deberías ser redirigido a tu dashboard según tu rol

### 4. Verificar Funcionalidad

✅ **Persistencia de Sesión:**
- Inicia sesión
- Recarga la página (F5)
- La sesión debe persistir sin parpadeo

✅ **Logout:**
- Haz clic en el botón de logout
- Deberías ser redirigido a `/login`
- No deberías poder acceder a rutas privadas

✅ **Protección de Rutas:**
- Sin sesión, intenta acceder a `/admin/dashboard`
- Deberías ser redirigido a `/login`

## 📝 Cambios Principales

### Para Usuarios del Sistema
- **Nada cambia**: Pueden iniciar sesión con las mismas credenciales
- **Mejor experiencia**: La sesión es más estable y rápida
- **Sin interrupciones**: Todas las funcionalidades siguen igual

### Para Desarrollo
- **Nuevo hook**: Usa `import { useAuth } from "@/hooks/useAuth"` (ya actualizado en todos los componentes)
- **Server actions**: Usa `getServerSession()` de NextAuth (ya actualizado)
- **Middleware**: Protege rutas automáticamente (ya implementado)

## ⚠️ Puntos de Atención

### Cambio de Contraseña
- Actualmente deshabilitado en `/perfil`
- Muestra mensaje: "La funcionalidad está en desarrollo"
- Requiere implementar endpoint API personalizado

### Deployment a Vercel

Cuando hagas deploy, asegúrate de configurar estas variables de entorno en Vercel:

```bash
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=<tu-secret-de-produccion>
NEXT_PUBLIC_SUPABASE_URL=<tu-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-key>
```

## 🔍 Debugging

Si encuentras problemas:

1. **Error de sesión**: Verifica que `NEXTAUTH_SECRET` esté configurado
2. **No redirige después de login**: Revisa la consola del navegador
3. **Middleware no funciona**: Verifica que `NEXTAUTH_URL` sea correcto
4. **Credenciales inválidas**: Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado

### Ver Logs
```bash
# En desarrollo, verás logs en la terminal:
npm run dev

# Busca mensajes como:
# ✅ Supabase client initialized successfully (Auth handled by NextAuth)
# ❌ Missing Supabase environment variables
```

## 📚 Documentación

- **Detalles completos**: Ver `MIGRACION_NEXTAUTH.md`
- **Plan original**: Ver `.cursor/plans/migracion_supabase_auth_a_nextauth.js_*.plan.md`
- **NextAuth Docs**: https://next-auth.js.org/

## ✅ Checklist de Prueba

- [ ] Variables de entorno configuradas
- [ ] `npm run dev` funciona sin errores
- [ ] Login exitoso con usuario existente
- [ ] Sesión persiste al recargar página
- [ ] Logout funciona correctamente
- [ ] Protección de rutas por rol funciona
- [ ] Dashboard carga correctamente
- [ ] Datos de perfil se muestran correctamente

## 🎉 ¡Listo!

Si todos los checks están marcados, la migración está funcionando correctamente y puedes hacer deploy a producción.

---

**¿Problemas?** Revisa `MIGRACION_NEXTAUTH.md` para más detalles o contacta al equipo de desarrollo.
