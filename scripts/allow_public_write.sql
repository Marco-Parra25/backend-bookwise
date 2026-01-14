-- ALERTA DE SEGURIDAD: Esto permite que CUALQUIERA edite tu tabla.
-- Úsalo solo para desarrollo o carga inicial de datos.

CREATE POLICY "Enable insert for anon" ON "public"."books"
FOR INSERT TO "anon"
WITH CHECK (true);

CREATE POLICY "Enable update for anon" ON "public"."books"
FOR UPDATE TO "anon"
USING (true)
WITH CHECK (true);
