<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripción

Backend en NestJS para el reto **Pocki Asistente Virtual**. Expone:

- **Webhook de WhatsApp Cloud API** (`POST /api/webhook/whatsapp`) para recibir mensajes.
- **Integración con OpenAI** para analizar intención del usuario y decidir si usar tools.
- **Tool de scraping de TRM** (dólar en Colombia) consultando `https://www.dolar-colombia.com/`.
- **Persistencia en PostgreSQL** de mensajes entrantes y salientes.

## Requisitos previos

- Node.js 20+
- PostgreSQL (BD creada, por ejemplo `pockibot`)
- Cuenta de Meta con **WhatsApp Cloud API** configurada.
- API key de OpenAI (modelo recomendado: `gpt-4o-mini`).

## Configuración

1. Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

2. Editar `.env` con tus valores:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `OPENAI_API_KEY`
- `WHATSAPP_VERIFY_TOKEN` (debes usar este mismo valor en la configuración del webhook en Meta)
- `WHATSAPP_TOKEN` (token de acceso de la app de Meta)
- `WHATSAPP_PHONE_NUMBER_ID` (ID del número de WhatsApp Cloud)

## Instalación

```bash
npm install
```

## Ejecutar el proyecto

```bash
# desarrollo con watch
npm run start:dev

# o modo normal
npm run start
```

La API quedará escuchando en `http://localhost:3000/api`.

### Endpoints principales

- `GET /api` → healthcheck sencillo.
- `GET /api/webhook/whatsapp` → verificación de webhook (usado por Meta).
- `POST /api/webhook/whatsapp` → recepción de mensajes de WhatsApp (payload de WhatsApp Cloud API).
- `GET /api/messages/recent/:contactNumber` → consulta de conversación reciente con un número.

### Documentación OpenAPI (Swagger)

- Una vez levantado el backend, puedes abrir la documentación interactiva en:
- `http://localhost:3000/api/docs`
- Desde ahí puedes probar los endpoints y ver los contratos de entrada/salida.

## Flujo de mensajes

1. El usuario envía un mensaje de texto al número de WhatsApp Cloud.
2. Meta llama a `POST /api/webhook/whatsapp` con el payload correspondiente.
3. El backend:
   - Guarda el mensaje en PostgreSQL.
   - Llama a OpenAI para analizar la intención.
   - Si detecta que el usuario pregunta por el dólar/TRM, ejecuta la tool de TRM (scraping).
   - Construye una respuesta final al usuario.
   - Envía la respuesta de vuelta por WhatsApp usando la Graph API.
   - Registra también el mensaje de salida en la base de datos.

## Colección de Postman

En este proyecto se incluye una colección `postman_collection.json` con:

- `GET /api` (healthcheck).
- `GET /api/webhook/whatsapp` (verificación de webhook).
- `POST /api/webhook/whatsapp` (simulación de evento de mensaje entrante).

Importa el archivo en Postman para probar localmente.

## Decisiones de arquitectura

- **NestJS + módulos**: el código se organiza por dominios (`whatsapp`, `ai`, `tools`, `messages`) para mantener una arquitectura modular y fácil de extender.
- **TypeORM + PostgreSQL**: se usa `synchronize: true` para simplificar el reto técnico (no requiere migraciones manuales).
- **OpenAI como orquestador**: un servicio (`AiService`) decide si usar tools mediante un JSON estructurado y luego ejecuta la tool de TRM cuando corresponde.
- **Tool de TRM desacoplada**: la lógica de scraping (`ToolsService`) está aislada, por lo que es sencillo añadir nuevas tools (por ejemplo, noticias de tecnología).

