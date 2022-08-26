---
layout: post
title:  "Создание Telegram бота с нуля, без сторонних библиотек"
categories: [ Программирование ]
tags: [ Telegram, Bot, JavaScript ]
image: assets/images/Telegram-Bot-From-Scratch-practice-01/0.png
author: Mikhail
---
***В этой статье мы создадим работающего Telegram бота. С нуля, без использования сторонних библиотек и фреймворков.***

Материалы этой статьи будет проще понять, если вы читали мою предыдущую статью [Базовые сведения о Telegram Bot API](https://danshin.ms/Telegram-Bot-From-Scratch/). В ней даётся теория взаимодействия с Telegram Bot API. Рекомендую прочитать сначала её, а потом переходить к прочтению этой статьи и написанию собственного Telegram бота.

Так же рекомендую статью [Взаимодействие с Telegram Bot API через Postman](https://danshin.ms/postman/). В ней вы узнаете о том, как взаимодействовать с Telegram Bot API при помощи мощного инструмента разработчиков Postman.

# Пишем Telegram Bot

> К этому моменту у вас уже должен быть зарегистрирован Telegram Bot и вы должны иметь Token, предоставленный ботом BotFather. Если вы этого ещё не сделали, то читайте как это сделать в моей статье [Базовые сведения о Telegram Bot API](https://danshin.ms/Telegram-Bot-From-Scratch/) и создавайте бота.

В качестве языка программирования я выбрал JavaScript. Все примеры буду приводить на нём. Но всё, что я буду делать и описывать, вы легко сможете адаптировать под ваш язык программирования. Возможно, что в конце я сам сделаю такие адаптации под Python и C#. Сдесь же я буду использвоать JavaScript и Node.JS.

В качестве операционной системы я использую Linux. Но все команды операционной системы, которые я буду использовать, точно так же называются и работают в других ОС - Windows или MacOS.

В качестве IDE я использую VS Code. На мой взгляд это лучшее средство для разработки, даже больших и коммерческих проектов, не говоря уже про учебные.

> У вас уже должен быть установлен Node.JS. Его установка выходит за рамки моей статьи. На официальном сайте вы найдёте простые инструкции как установить Node.JS под [Windows](https://nodejs.org/en/download/package-manager/#windows-1) и [Linux](https://nodejs.org/en/download/package-manager/#centos-fedora-and-red-hat-enterprise-linux).

Убедитесь, что у вас установлен Node.JS выполнив команду `node --version`.

План такой:

1. Создаём простой web-сервер, который будет принимать запросы.
2. Создаём функцию приёма обновлений и ответа на них
3. Размещаем проект на GitHub и Heroku.

Теперь всё по порядку и в деталях.

## Создаём простой web-сервер на Node.JS

Для создания простейшего web-сервера подключим модуль Node.JS под названием http.

```js
const http = require('http')
```

Объявим переменную PORT, которая будет определять, на каком порту наше приложение будет прослушивать входящие соединения. Через этот порт `Telegram Bot API` будет передавать нам обновления, используя технологию `webHook`. Когда проект будет запускаться в Heroku, то значение этой переменной будет браться из окружения, которое будет определяться внутренними механизмами Heroku. Когда мы будем запускать проект локально, то будет использоваться значение 5000.

```js
const PORT = process.env.PORT || 5000
```

Создадим функцию `requestListener`, которая будет выполнятся при поступлении обращений к серверу. Сейчас она будеть только давать ответ `Hello World!` при любом обращении. В дальнейшем мы модифицируем эту функцию. Добавим события, которые будут обрабатывать входящие данные от Telegram Bot API, когда нашему боту будут что-то писать.

```js
const requestListener = function (req, res) {
    res.end('Hello, World!')
}
```

Создадим экземпляр сервера и передадим ему функцию `requestListener`.

```js
const server = http.createServer(requestListener);
```

И в завершении всего, запустим сервер.

```js
server.listen(PORT, () => console.log(`Server is running on Port ${PORT}`))
```

Вот весь код целиком:

index.js
```js
const http = require('http')

const PORT = process.env.PORT || 5000

const requestListener = function (req, res) {
    res.end('Hello, World!')
}

const server = http.createServer(requestListener);

server.listen(PORT, () => console.log(`Server is running on Port ${PORT}`))
```

чтобы запустить приложение, убедитесь что вы находитесь в папке, где лежит файл index.js и выполните команду

```bash
node index.js
```

Запустите браузер, введите в адресной строке `http://localhost:5000` и вы увидете ответ от сервера.

Обратите особое внимание на адресную строку, по которой вы переходите. Современные браузеры всегда будут пытаться перенаправлять вас по умолчанию на протокол HTTPS. Мы же используем протокол HTTP. Поэтому в адресной строке всталяйте полный путь, с указанием протокола HTTP.

> Чтобы остановить работу программы, в терминале нажмите Ctrl+C. Каждый раз при внесении изменений в код, нужно перезапускать программу. Останавливать её - `Ctrl+C` и запускать заново - `node index.js`. Есть средство, позволяющее это делать автоматически. Вы можете сами с ним разобраться. Это пакет [Nodemon](https://www.npmjs.com/package/nodemon). Я не буду описывать его в этой статье.

## Добавляем функционал отправки сообщений

Для отправки сообщений нужно вызвать метод sendMessage. Мы будем вызывть методы API, то есть отправлять HTTPS запросы к серверам Telegram. Для этого нам потребуется модуль https. Подключаем его, как это уже делали ранее, с модулем http.

Разместите в начале приложения следующую строку:

```js
const https = require('https')
```

Теперь создадим функцию, которая будет отправлять сообщения. Функция принимает два параметра - chat_id - кому отправлять сообщение и message - текс сообщения.

```js
function sendMessage(chat_id, message) {

    const options = {
        hostname: `api.telegram.org`,
        path: `/bot5703210388:AAF1rz-ibt6g1Up8g2p2FsJOAdsGpgOSrPE/sendMessage`,
        method: "POST",
        headers: {
            'content-type': 'application/json'
        }
    }

    const body = JSON.stringify({
        "chat_id": chat_id,
        "text": message
    })

    const req = https.request(options)
    req.write(body)
    req.end()
}
```

Для проверки, вызов функции можно разместить сразу после её объявления. Тогда каждый раз, при запуске приложения, она будет отправлять сообщение `Hello!` абоненту с id `206958904`.

```js
sendMessage("206958904", "Hello!")
```

К этому моменту приложение будет выглядеть так:

```js
const https = require('https')
const http = require('http')

const PORT = process.env.PORT || 5000

const requestListener = function (req, res) {
    res.end('Hello, World!')
}

const server = http.createServer(requestListener);

function sendMessage(chat_id, message) {

    const options = {
        hostname: `api.telegram.org`,
        path: `/bot5703210388:AAF1rz-ibt6g1Up8g2p2FsJOAdsGpgOSrPE/sendMessage`,
        method: "POST",
        headers: {
            'content-type': 'application/json'
        }
    }

    const body = JSON.stringify({
        "chat_id": chat_id,
        "text": message
    })

    const req = https.request(options)

    req.write(body)
    req.end()
}

sendMessage("206958904", "Hello!")

server.listen(PORT, () => console.log(`Server is running on Port ${PORT}`))
```

## Настраиваем webHook

В своей [предыдущей статье](https://danshin.ms/Telegram-Bot-From-Scratch/), в которой я рассказывал про взаимодействие с Telegram Bot API, я показывал, как получить обновления при помощи метода getUpdates. Это не удобно, потому, что нам бы пришлось с большой частотой опрашивать сервера Telegram, забирать накопившиеся обновления, а затем разбирать их на отдельные сообщения и обрабатывать. Гораздо проще воспользоваться технологией webHook, которою Telegram поддерживает и предоставляет нам функционал, который будет перенаправлять все сообщения к нашему боту на тот URL который мы укажем в его настройках. Для этого нужно:

1. Сообщить Telegram, куда отправлять обновления
2. Настроить наш сервер на прослушивание обновлений
3. Разместить приложение где-то, где Telegram сможет к нему обратиться по HTTP.