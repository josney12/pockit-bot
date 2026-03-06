🤖 WhatsApp AI Bot – Prueba Técnica

Bot de WhatsApp con Inteligencia Artificial desarrollado para la prueba técnica de Desarrollador Fullstack.

El sistema permite recibir mensajes desde WhatsApp, procesarlos mediante OpenAI, ejecutar herramientas si es necesario y responder automáticamente al usuario.

La integración con Twilio permite recibir y enviar mensajes de WhatsApp mediante webhooks.

🎯 Objetivo del proyecto

Construir un bot capaz de:

Recibir mensajes desde WhatsApp

Analizar la intención del usuario mediante IA

Ejecutar herramientas según la intención detectada

Mantener contexto de conversación

Guardar historial de mensajes

Evitar duplicación de mensajes

🧱 Arquitectura del sistema

El sistema sigue una arquitectura modular basada en NestJS.

WhatsApp User
      │
      ▼
Twilio WhatsApp API
      │
      ▼
Webhook Controller (NestJS)
      │
      ▼
Message Processing Service
      │
      ├── OpenAI Intent Analysis
      │
      ├── Tool Execution
      │
      └── Message Storage
      │
      ▼
Database
      │
      ▼
Response → Twilio → WhatsApp User
🛠 Tecnologías utilizadas

Backend:

NestJS

TypeScript

Node.js

Servicios externos:

Twilio (WhatsApp API)

OpenAI (Análisis de intención)

Base de datos:

PostgreSQL (o la que estés usando)

Herramientas de desarrollo:

Ngrok

Postman

📂 Estructura del proyecto
src
│
├── whatsapp
│   ├── whatsapp.controller.ts
│   ├── whatsapp.service.ts
│
├── messages
│   ├── messages.controller.ts
│   ├── messages.service.ts
│
├── ai
│   └── openai.service.ts
│
├── database
│   └── entities
│
├── app.module.ts
└── main.ts
⚙️ Requisitos

Antes de ejecutar el proyecto debes tener instalado:

Node.js v18+

npm

Ngrok

cuenta en Twilio

API key de OpenAI

🚀 Instalación
1️⃣ Clonar repositorio
git clone https://github.com/usuario/whatsapp-ai-bot.git
cd whatsapp-ai-bot
2️⃣ Instalar dependencias
npm install
3️⃣ Configurar variables de entorno

Crear archivo .env

PORT=3000

OPENAI_API_KEY=your_openai_api_key

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_bot
▶️ Ejecutar la aplicación

Modo desarrollo:

npm run start:dev

Servidor disponible en:

http://localhost:3000
🌐 Exponer servidor con Ngrok

Para permitir que WhatsApp pueda enviar mensajes al backend.

ngrok http 3000

Obtendrás una URL pública:

https://xxxx.ngrok-free.app
📱 Configuración del Webhook

En la consola de Twilio configurar:

POST
https://TU_URL_NGROK/api/webhook/whatsapp/twilio

Content-Type:

application/x-www-form-urlencoded
🔗 Endpoints disponibles
📩 Webhook de WhatsApp
POST /api/webhook/whatsapp/twilio

Recibe los mensajes enviados desde WhatsApp.

Campos recibidos:

Campo	Descripción
MessageSid	ID único del mensaje
From	Número del usuario
To	Número del bot
Body	Mensaje enviado
📜 Historial de conversación
GET /api/messages/recent/:contactNumber

Ejemplo:

GET /api/messages/recent/573001234567

Respuesta:

[
  {
    "role": "user",
    "content": "Hola"
  },
  {
    "role": "assistant",
    "content": "Hola! ¿Cómo puedo ayudarte?"
  }
]
🧪 Pruebas del sistema
Saludo básico
{
  "MessageSid": "SM_TEST_001",
  "From": "whatsapp:+573001234567",
  "To": "whatsapp:+14155238886",
  "Body": "Hola! como estas?"
}
Consulta con IA
{
  "MessageSid": "SM_TEST_002",
  "From": "whatsapp:+573001234567",
  "To": "whatsapp:+14155238886",
  "Body": "cuanto esta el dolar hoy?"
}
Prueba de contexto

Primer mensaje:

{
  "MessageSid": "SM_TEST_004",
  "From": "whatsapp:+573001234567",
  "Body": "me llamo Carlos"
}

Segundo mensaje:

{
  "MessageSid": "SM_TEST_005",
  "From": "whatsapp:+573001234567",
  "Body": "recuerdas como me llamo?"
}

El bot debería responder utilizando el contexto almacenado.

🔒 Manejo de duplicación

Cada mensaje recibido incluye un identificador:

MessageSid

El sistema verifica si ese mensaje ya fue procesado.

Si el MessageSid ya existe:

El mensaje se ignora

Esto evita respuestas duplicadas.

🧠 Flujo de procesamiento del mensaje

1️⃣ Usuario envía mensaje en WhatsApp

2️⃣ Twilio envía webhook al backend

3️⃣ El backend:

valida duplicados

guarda el mensaje

envía texto a OpenAI

4️⃣ La IA determina:

intención del usuario

si debe ejecutar una herramienta

5️⃣ Se genera respuesta

6️⃣ Se guarda en base de datos

7️⃣ Se responde al usuario

📈 Posibles mejoras futuras

Integración con CRM

Soporte para múltiples herramientas

Dashboard de conversaciones

Entrenamiento de prompts personalizados

Soporte multilenguaje

métricas y analytics

👨‍💻 Autor

Josney Castillo
Desarrollador Fullstack

Tecnologías principales:

Angular

NestJS

Java

Spring Boot

PostgreSQL