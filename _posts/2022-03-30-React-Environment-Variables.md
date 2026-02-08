---
layout: post
title:  "Переменные Окружения в React App"
title_en: "Environment Variables in a React App"
categories: [ Программирование ]
tags: [ react ]
image: assets/images/react-environment-variables/0.jpeg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***В React, в коде приложения, можно использовать переменные окружения. Например, для подключения к базе данных, мы можем в коде задать адрес подключения в виде переменной, вместо того, чтобы хардкодить ссылку. При этом разные значения можно использовать во время разработки и во премя выполнения в продуктиве.***

[Adding Custom Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

НАПРИМЕР: вместо `https://some-domain.com/api/` можно было бы указать `process.env.REACT_APP_API_URL`

```jsx
// hardcoded URL
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});

// Environment variable URL
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});
```

Хранить значение этой переменно можно либо в переменной окружения операционной системы, либо в специальном `.env` файле, в корневой папке React приложения. Либо передавать во время запуска приложения:

package.json
```json
  "scripts": {
    "start": "cross-env NODE_ENV=production NODE_OPTIONS=--openssl-legacy-provider HTTPS=true PORT=443 react-scripts start",
    "dev": "cross-env NODE_ENV=development HTTPS=true PORT=443 react-scripts start",
    "build": "react-scripts build"
  },
```

Простой пример  `.env` файла:

```
REACT_APP_API_URL = http://localhost:5000/api
```

React воспринимает переменные которые начинаются на `REACT_APP`. Всё остальное он игнорирует в целях безопасности. **Во время сборки (build), в коде приложения, переменные вида `process.env.REACT_APP_API_URL` заменяются их значениями.** Файлы `.env` принято добавлять в `.gitignore`, всё с тойже целью безопасности. Поэтому, если вы соберёте ваш проект, который использует переменные окружения, но при этом не зададите их в своём окружении или в файле `.env`, то во время выполнения переменные будут иметь значение `undefined`. С такой проблемой часто можно столкнуться во время сборки проекта в CI/CD, используя докер или сторонние сервисы типа Heroku.

>Ещё раз обращаю внимание, что после сборки (npm build) или запуска (npm start) приложения, переменные окружения будут жётско прописаны в коде. И если вы измените их в файле или в окружении вашей операционной системы, то вам придётся пересобрать или перезапустить ваше приложение, соответственно.

Помимо `.env` можно использовать и другие файлы. Например, если вам нужно, чтобы в продуктиве ваше приложение собиралось с одними занчениями, а во время разработки с другими, то можно использовать `.env.development` во время разработки (npm start), а `.env.production`, во время сборки (npm build). Если все эти файлы используются одновременно, то порядок их чтения следующий - файлы слева имеют больший приоритет:

- `npm start`: `.env.development.local`, `.env.local`, `.env.development`, `.env`
- `npm run build`: `.env.production.local`, `.env.local`, `.env.production`, `.env`
- `npm test`: `.env.test.local`, `.env.test`, `.env` (обратите внимание`.env.local` отсутствует)
</div>

<div data-lang="en" markdown="1">
***In React you can use environment variables in your application code. For example, for connecting to a backend/API you can store the base URL in a variable instead of hardcoding it. This lets you use different values for development and production.***

[Adding Custom Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

EXAMPLE: instead of hardcoding `https://some-domain.com/api/`, you can use `process.env.REACT_APP_API_URL`.

```jsx
// hardcoded URL
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});

// Environment variable URL
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});
```

You can store this value either in an OS environment variable, or in a special `.env` file in the root of your React project. You can also pass it at startup time:

package.json
```json
  "scripts": {
    "start": "cross-env NODE_ENV=production NODE_OPTIONS=--openssl-legacy-provider HTTPS=true PORT=443 react-scripts start",
    "dev": "cross-env NODE_ENV=development HTTPS=true PORT=443 react-scripts start",
    "build": "react-scripts build"
  },
```

Simple example of a `.env` file:

```
REACT_APP_API_URL = http://localhost:5000/api
```

React (Create React App) only exposes variables that start with `REACT_APP` — everything else is ignored for security reasons. **During build time, variables like `process.env.REACT_APP_API_URL` are replaced with their actual values in the generated code.**

It's also common to add `.env` files to `.gitignore` for the same security reasons. So if you build a project that uses environment variables but don't define them in your environment or in a `.env` file, the variables will be `undefined` at runtime. This often happens in CI/CD builds (Docker, Heroku-like services, etc.).

> One more important point: after building (`npm run build`) or running (`npm start`) the app, environment variables are baked into the output. If you change them later, you must rebuild or restart the app accordingly.

Besides `.env`, you can use other files. For example, if you want production builds to use one set of values and development to use another, you can use `.env.development` during development (`npm start`) and `.env.production` during build (`npm run build`). If several files are present, they are loaded in this order (earlier files have higher priority):

- `npm start`: `.env.development.local`, `.env.local`, `.env.development`, `.env`
- `npm run build`: `.env.production.local`, `.env.local`, `.env.production`, `.env`
- `npm test`: `.env.test.local`, `.env.test`, `.env` (note that `.env.local` is not used)
</div>
