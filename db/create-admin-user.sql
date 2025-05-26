-- Crear un usuario administrador
-- Primero, crear el usuario en auth.users (esto normalmente lo hace Supabase Auth)
-- Luego, insertar el perfil en la tabla profiles

-- Verificar si el usuario ya existe en profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
        -- Insertar el perfil de administrador
        INSERT INTO profiles (id, full_name, role, created_at, updated_at)
        VALUES (
            '9b51ddb2-0742-42db-ad39-cb4744fba148',
            'Administrador Principal',
            'admin',
            NOW(),
            NOW()
        );
    END IF;
END $$;
