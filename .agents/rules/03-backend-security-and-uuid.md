# ESTÁNDARES BACKEND Y PROTOCOLO DE SEGURIDAD UUID
**Módulo:** `src/backend/` & `config/`  
**Objetivo:** Seguridad de grado empresarial, PSR-12, tipado fuerte y cero fugas de información.

---

## 1. TIPADO ESTRICTO PHP 8.2+
- Todo archivo PHP debe comenzar con:
  ```php
  <?php
  declare(strict_types=1);
  ```
- Tipado exhaustivo de argumentos de métodos, propiedades de clase y valores de retorno.

---

## 2. PROTOCOLO UUID SAFETY (CERO STACK TRACES)
1. **Ocultamiento de Rutas del Servidor:**
   - Queda terminantemente prohibido exponer rutas de disco (`c:\wamp64\...`), consultas SQL crudas o stack traces en respuestas HTTP dirigidas al cliente.
2. **Generación de Incident UUID:**
   - En caso de excepción, capturar el error en `ErrorHandlerMiddleware`.
   - Registrar la traza completa internamente en `storage/logs/app.log` asociada a un identificador único `UUIDv4`.
   - Responder al cliente con un payload JSON genérico:
     ```json
     {
       "success": false,
       "error": "Error interno del servidor",
       "incident_id": "c7a8291f-8239-4d92-93ec-e837194f1092"
     }
     ```

---

## 3. PERSISTENCIA SEGURA (SQLITE)
1. **Sentencias Preparadas Obligatorias:**
   - Prohibido concatenar parámetros directamente en cadenas SQL.
   - Utilizar siempre `PDO::prepare()` con parámetros nombrados o posicionales blindados contra inyección SQL.
2. **Idempotencia:**
   - Todo script de base de datos o migración DDL debe usar `CREATE TABLE IF NOT EXISTS` o validaciones preventivas.
