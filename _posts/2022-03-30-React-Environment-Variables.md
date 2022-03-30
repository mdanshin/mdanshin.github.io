---
layout: post
title:  "Переменные Окружения в React App"
categories: [ Программирование ]
tags: [ react ]
image: assets/images/react-environment-variables/0.jpeg
author: Mikhail
---
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

Хранить значение этой переменно можно либо в переменной окружения операционной системы, либо в специальном `.env` файле, в корневой папке React приложения.

Простой пример  `.env` файла:

```
REACT_APP_API_URL = http://localhost:5000/api
```

React воспринимает переменные которые начинаются на `REACT_APP`. Всё остальное он игнорирует в целях безопасности. **Во время сборки (build), в коде приложения, переменные вида `process.env.REACT_APP_API_URL` заменяются их значениями.** Файлы `.env` принято добавлять в `.gitignore`, всё с тойже целью безопасности. Поэтому, если вы соберёте ваш проект, который использует переменные окружения, но при этом не зададите их в своём окружении или в файле `.env`, то во время выполнения переменные будут иметь значение `undefined`. С такой проблемой часто можно столкнуться во время сборки проекта в CI/CD, используя докер или сторонние сервисы типа Heroku.

Помимо `.env` можно использовать и другие файлы. Например, если вам нужно, чтобы в продуктиве ваше приложение собиралось с одними занчениями, а во время разработки с другими, то можно использовать `.env.development` во время разработки (npm start), а `.env.production`, во время сборки (npm build). Если все эти файлы используются одновременно, то порядок их чтения следующий - файлы слева имеют больший приоритет:

- `npm start`: `.env.development.local`, `.env.local`, `.env.development`, `.env`
- `npm run build`: `.env.production.local`, `.env.local`, `.env.production`, `.env`
- `npm test`: `.env.test.local`, `.env.test`, `.env` (обратите внимание`.env.local` отсутствует)

Есть большая разница между тем, как работают переменные окружения в React, когда вы запускаете ваше приложение в среде разработки npm start и