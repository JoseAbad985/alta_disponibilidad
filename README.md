# Alta Disponibilidad: Sistema de Mensajería Distribuido

Este README describe los pasos que debe seguir un usuario desde otra máquina para desplegar y probar la práctica completa de tolerancia a fallos.

## Requisitos Previos

- Tener instalado Docker y Docker Compose.
- Clonar este repositorio en su máquina:
git clone https://github.com/JoseAbad985/alta_disponibilidad.gitcd alta_disponibilidad
## 1. Levantar la infraestructura

Construir y arrancar todos los servicios:
docker-compose up -d --build
Verificar que todos los contenedores estén “Up (healthy)”:
docker-compose ps
## 2. Verificar el endpoint principal

Comprobar que la aplicación principal responde correctamente:
curl.exe -i http://localhost/
## 3. Simular fallos y probar tolerancia

A continuación se describen los cuatro escenarios de fallo probados.

### 3.1 Prueba 1: Failover de base de datos
Se detiene el nodo primario para verificar que la aplicación conmuta a la réplica.

1.  **Detener la base de datos primaria:**
    ```
    docker-compose stop postgresql-primary
    ```
2.  **Verificar la disponibilidad (debe dar código 200):**
    ```
    foreach ($i in 1..5) { curl.exe -s -o NUL -w "%{http_code}`n" http://localhost/ }
    ```
3.  **Restaurar el servicio:**
    ```
    docker-compose start postgresql-primary
    ```

### 3.2 Prueba 2: Caída de un Nodo de Aplicación
Se detiene una de las réplicas de la aplicación para verificar que el balanceador redirige el tráfico.

1.  **Detener una réplica de la aplicación:**
    ```
    docker-compose stop app1
    ```
2.  **Verificar la disponibilidad (debe dar código 200):**
    ```
    foreach ($i in 1..5) { curl.exe -s -o NUL -w "%{http_code}`n" http://localhost/ }
    ```
3.  **Restaurar el servicio:**
    ```
    docker-compose start app1
    ```

### 3.3 Prueba 3: Fallo de un Microservicio Individual
Se detiene un microservicio para probar el aislamiento de fallos.

1.  **Detener el microservicio de mensajes:**
    ```
    docker-compose stop message-service
    ```
2.  **Verificar el aislamiento:**
    * La ruta del servicio caído **fallará**:
        ```
        curl.exe -s -o NUL -w "Ruta /messages/: %{http_code}`n" http://localhost/messages/
        ```
    * Otras rutas como la raíz **seguirán funcionando**:
        ```
        curl.exe -s -o NUL -w "Ruta /: %{http_code}`n" http://localhost/
        ```
3.  **Restaurar el servicio:**
    ```
    docker-compose start message-service
    ```

### 3.4 Prueba 4: Caída del Balanceador de Carga
Se detiene `nginx` para probar la redundancia de la capa de aplicación.

**Nota:** Esta prueba requiere que el servicio `app1` en `docker-compose.yml` tenga los puertos expuestos:
```
ports:
  - "8081:3000"
```
Detener el balanceador de carga:
```
docker-compose stop nginx
```
Verificar el fallo y la tolerancia:La petición a través de nginx fallará:curl.exe -s -o NUL -w "Acceso por Nginx (caído): 
```
%{http_code}`n" http://localhost/
```
La petición directa a app1 funcionará:curl.exe -s -o NUL -w "Acceso directo a app1: 
```
%{http_code}`n" http://localhost:8081/
```
Restaurar el servicio:
```
docker-compose start nginx
```
### 4. LimpiezaDetener y eliminar contenedores, redes y volúmenes asociados:
```
docker-compose down --remove-orphans
```