# Alta Disponibilidad: Sistema de Mensajería Distribuido

Este README describe los pasos que debe seguir un usuario desde otra máquina para desplegar y probar la práctica completa de tolerancia a fallos.

## Requisitos Previos

- Tener instalado Docker y Docker Compose.
- Clonar este repositorio en su máquina:
  ```bash
  git clone https://github.com/JoseAbad985/alta_disponibilidad.git
  cd alta_disponibilidad
  ```

## 1. Levantar la infraestructura

Construir y arrancar todos los servicios:
```bash
docker-compose up -d --build
```

Verificar que todos los contenedores estén “Up (healthy)”:
```bash
docker-compose ps
```

## 2. Verificar endpoints básicos

Comprobar que cada endpoint responde HTTP 200 con JSON válido:
```bash
curl -i http://localhost/                # App principal (app1/app2)
curl -i http://localhost/auth/           # Auth Service
curl -i http://localhost/messages/       # Message Service
curl -i http://localhost/notifications/  # Notification Service
```

## 3. Simular fallos y probar tolerancia

### 3.1 Failover de base de datos
Detener el nodo primario:
```bash
docker-compose stop postgresql-primary
```
Comprobar que Auth Service sigue devolviendo 200:
```bash
for i in {1..5}; do curl -s -w "%{http_code}\n" http://localhost/auth/; done
```
Arrancar de nuevo el primario:
```bash
docker-compose start postgresql-primary
```

### 3.2 Redundancia activa-activa
Detener una réplica de la app principal:
```bash
docker-compose stop app1
```
Comprobar peticiones a la raíz mantienen 200:
```bash
for i in {1..5}; do curl -s -w "%{http_code}\n" http://localhost/; done
```
Arrancar `app1`:
```bash
docker-compose start app1
```

### 3.3 Balanceo con detección de nodos caídos
Detener el Message Service:
```bash
docker-compose stop message-service
```
Verificar que `/messages/` falla mientras el servicio esté detenido:
```bash
for i in {1..5}; do curl -s -w "%{http_code}\n" http://localhost/messages/; done
```
Reiniciar `message-service`:
```bash
docker-compose start message-service
```

### 3.4 Partición de red (degradación controlada)
Desconectar todas las apps de la red de base de datos:
```bash
docker network disconnect alta_disponibilidad_back alta_disponibilidad-app1-1
docker network disconnect alta_disponibilidad_back alta_disponibilidad-app2-1
docker network disconnect alta_disponibilidad_back alta_disponibilidad-auth-service-1
docker network disconnect alta_disponibilidad_back alta_disponibilidad-message-service-1
docker network disconnect alta_disponibilidad_back alta_disponibilidad-notification-service-1
```
Hacer peticiones a cada ruta; deben devolver errores (500/502):
```bash
for path in "/" "/auth/" "/messages/" "/notifications/"; do
  for i in {1..5}; do
    curl -s -w "${path} %{http_code}\n" http://localhost${path}
  done
done
```
Reconectar y verificar restauración:
```bash
docker network connect alta_disponibilidad_back alta_disponibilidad-app1-1
docker network connect alta_disponibilidad_back alta_disponibilidad-app2-1
docker network connect alta_disponibilidad_back alta_disponibilidad-auth-service-1
docker network connect alta_disponibilidad_back alta_disponibilidad-message-service-1
docker network connect alta_disponibilidad_back alta_disponibilidad-notification-service-1
sleep 10
curl -s -w "root: %{http_code}\n"        http://localhost/
curl -s -w "auth: %{http_code}\n"        http://localhost/auth/
curl -s -w "messages: %{http_code}\n"    http://localhost/messages/
curl -s -w "notifications: %{http_code}\n" http://localhost/notifications/
```

## 4. Limpieza

Detener y eliminar contenedores, redes y volúmenes asociados:
```bash
docker-compose down --remove-orphans
```
