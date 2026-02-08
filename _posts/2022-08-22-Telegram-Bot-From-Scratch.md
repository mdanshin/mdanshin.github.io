---
layout: post
title:  "Базовые сведения о Telegram Bot API"
title_en: "Telegram Bot API Basics"
categories: [ Программирование ]
tags: [ Telegram, Bot, JavaScript, featured ]
image: assets/images/Telegram-Bot-From-Scratch/0.png
author: Mikhail
---

<div data-lang="ru" markdown="1">
***В этой статье я расскажу базовые сведения, которые помогут вам понять, как создать Telegram бота и взаимодействовать с ним без использования сторонних библиотек.***

Что такое Telegram Bot? Официальный сайт даёт такое определение:

> Боты — это сторонние приложения, которые работают внутри Telegram. Пользователи могут взаимодействовать с ботами, отправляя им сообщения, команды и встроенные запросы. Вы управляете своими ботами, используя HTTPS-запросы к [Telegram Bot API](https://core.telegram.org/bots/api#available-methods).

Для того, чтобы создать простейшего бота не нужно ничего, кроме самого Telegram. Пользователи смогут отправлять вашему боту сообщения через Telegram-клиента (мессенджер) или через API. А для того, чтобы взаимодействовать со своим ботом как владелец, не нужно ничего, кроме браузера (или другой программы, которая будет отправлять HTTPS-запросы). Но это будет самый простейший бот и простейшее взаимодествие. Чтобы научить ваш бот сложным вещам, чтобы автоматизировать получение и обработку сообщений, придётся немного покодить. Но это очень просто и можно использовать любой язык программирования, который вы знаете. Я покажу пример на JavaScript, вы легко его можете адаптировать под тот язык, который знаете.

# Создание (регистрация) Telegram-бота.

По сути, боты Telegram — это специальные аккаунты, для настройки которых не требуется дополнительный номер телефона. Вам нужно зарегистрировать (создать) бота, а потом пользователи смогут отправлять ему сообщения или команды, а он сможет им отвечать.

![assets/images/linux-filesystem-operations/1.png](/assets/images/Telegram-Bot-From-Scratch/1.jpg)

За регистрацию и управление ботами отвечает другой бот - BotFather. Это официальный бот от разработчиков Telegram. Сперва нужно найти его в Telegram и сообщить ему, что вы хотите зарегистрировтаь нового бота. После ответов на серию простейших вопросов вы получите Token, используя который сможете взаимодествовать со своим ботом через Bot API, как владелец. А пользователи смогут отправлять ему сообщения и команды через Telegram или API.

Найдите в своём мессенджере BotFather (https://t.me/botfather), так же как любого другого пользователя и отправте ему команду `/newbot`. Вас попросят сообщить название и имя вашего нового бота, а взамен дадут Token.

> Держите полученный Token в секрете. Любой, кто его знает, может использовать его для управления вашим ботом.

![assets/images/linux-filesystem-operations/1.png](/assets/images/Telegram-Bot-From-Scratch/2.png)

С этого момента вы можете начинать взаимодействовать с вашим ботом. Например, используя метод getMe, вы можете отправить GET запрос в [Telegram Bot API](https://core.telegram.org/bots/api#available-methods) и получить информацию о вашем боте. Вставьте в адресную строку вашего браузера следующую ссылку и перейдите по ней.

```
https://api.telegram.org/bot{TOKEN}/{METHOD_NAME}
```

где:
* TOKEN - token, который вы получили от BotFather
* METHOD_NAME - метод Bot API, которую вы хотит использовать

Например
```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getMe
```

Если вы сделали всё правильно, то в ответ вы получите JSON объект примерно такого вида:

```json
{
  "ok": true,
  "result": {
    "id": 0123456789,
    "is_bot": true,
    "first_name": "DanshinMS - тестовый бот",
    "username": "DanshinMS_bot",
    "can_join_groups": true,
    "can_read_all_group_messages": false,
    "supports_inline_queries": false
  }
}
```

`id` - это идентификатор вашего бота. Любой пользователь, чат или канал Telegram имеет подобный ID. Именно этот ID используется для взаимедойствия бота с пользователем.

значение `true` в параметре `is_bot` говорит, что тип этого пользователя `bot`.

`first_name` и `username` говорят сами за себя. Это то, что вы сообщали BotFather при регистрации бота.

`"can_join_groups": true` - говорит о том, что вашего бота можно добавлять в группы.

`"can_read_all_group_messages": false` - говорит о том, что ваш бот не может читать сообщения пользователей в группе. Вы можете изменить это значение на `True` и тогда бот сможет читать, что пишут другие пользователи.

`"supports_inline_queries": false` - говорит о том, что вашему боту нельзя отправлять команды, используя символ `@`. Вы можете изменить это значение на `True` и тогда пользователи смогу это делать.

# Чтение сообщений

Как только бот зарегистрирован, ему можно отправлять сообщения. Находите его в Telegram, нажимаете Start и отправляете сообщение.

![assets/images/linux-filesystem-operations/1.png](/assets/images/Telegram-Bot-From-Scratch/4.png)

Все сообщения попадают на сервера Telegram и хранятся там не более 24 часов. Чтобы получить список сообщений, есть два способа.

1. Вызвать метод `getUpdates`, так же, как мы это делали с методом `getMe`.
2. Настроить webHook. Про этот способ я расскажу чуть позже.

Давайте воспользуемся первым способом, вызовем метод getUpdates.

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getUpdates
```

Метод вернёт объект, похожий на этот:

```json
{
  "ok": true,
  "result": [
    {
      "update_id": 206369231,
      "message": {
        "message_id": 1,
        "from": {
          "id": 0123456789,
          "is_bot": false,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "language_code": "en"
        },
        "chat": {
          "id": 0123456789,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "type": "private"
        },
        "date": 0123456789,
        "text": "/start",
        "entities": [
          {
            "offset": 0,
            "length": 6,
            "type": "bot_command"
          }
        ]
      }
    },
    {
      "update_id": 206369232,
      "message": {
        "message_id": 2,
        "from": {
          "id": 0123456789,
          "is_bot": false,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "language_code": "en"
        },
        "chat": {
          "id": 0123456789,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "type": "private"
        },
        "date": 1661089150,
        "text": "Hello, my new bot! How are you?"
      }
    }
  ]
}
```

Поле `"text"` будет содержать тект сообщения. Теперь эти сообщения можно читать и как-то обрабатывать. А позже я покажу, как удалить уже прочитанные сообщения.

Очевидно, что получать обновления таким способом не очень удобно. Нужно каждый раз отправлять запрос к серверу телеграм и делать это нужно с очень высокой частотой. Лучше воспользоваться технологией webHook. В этом случае, при получении каких-то обновлений, Telegram сам будет их отправлять туда, куда мы скажем. С помощью метода `setWebhook` мы можем передать `url` и тогда каждый раз, как на сервер Telegram будут приходить какие-то изменения для нашего бота, Telegram сам будет их отправлять по указанному нами `url`. Естественно, что в этом случае нужно, чтобы кто-то прослушивал этот URL. Это может быть наш самописный сервис, работающий на каком-нибудь хостинге. В следующей статье я покажу как это реализовать на бесплатном хостинге. Сначала я думал взять для этого Heroku, но т.к. они [отказываются от бесплатных тарифных планов](https://danshin.ms/Heroku-Next-Chapter/), то мне ещё предстоит подобрать подходящего хостера. Так что подписывайтесь на новости или присоединяйтесь к [группе в Telegram](https://t.me/danshin_ms).

# Отправка сообщений от имени бота

Самый простой сценарий использования бота, который не требует никакого программирования и специальных программ - это отправка сообщений от имени бота.

Например, вы моежет добавить бота в группу и используя [Telegram Bot API](https://core.telegram.org/bots/api#available-methods) отправлять от его имени сообщения в эту группу. Для этого нужно воспользоваться методом `sendMessage`. Вот как это делается.

В адресной строке вашего браузера, точно так же как вы это делали с методом `getMe`, вставьте URL следующего вида:

```
https://api.telegram.org/bot{TOKEN}>/sendMessage?chat_id={CHAT_ID}&text={TEXT}

где:
* TOKEN - token, который вы получили от BotFather.
* CHAT_ID - ID пользователя, группы или канала, которому вы хотите отправить сообщение (как узнать ID см. ниже, в этой статье).
* TEXT - Текст сообщения, который вы хотите отправить.
```

Например:
```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/sendMessage?chat_id=0123456789&text=Hello World
```

Одним из практических примеров использования этого метода может быть система мониторинга или любая система, где требуется оповещение и которая может отправлять HTTPS запрос или выполнять скрипт. Например, при возникновении события, система мониторинга запускает Powershell скрип, который, в свою очередь, отправляет сообщение от имени бота. Делается это очень просто:

```Powershell
Invoke-WebRequest https://api.telegram.org/bot123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/sendMessage?chat_id=0123456789&text=Alert Message
```

# Как узнать ID?

Чтобы отправить кому-то сообщение, вам нужно знать его ID. ID так же есть и у чатов и у каналов. И их ID тоже нужно знать, чтобы иметь возможность отправлять им сообщения.

Один из способов узнать ID чата - добавить бота в чат и вызвать метод `getUpdates`:

```
https://api.telegram.org/botTOKEN/getUpdates
```

например:
```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getUpdates
```

Вы получите список накопившихся обновлений и скорее всего последним обвнолвением будет именно добавление в группу. Оно будет иметь примерно такой вид:

```json
{
    "update_id": 31405408,
    "message": {
        "message_id": 7,
        "from": {
            "id": 123456789,
            "is_bot": false,
            "first_name": "Mikhail",
            "last_name": "Danshin",
            "username": "mdanshin",
            "language_code": "en"
        },
        "chat": {
            "id": -0123456789012,
            "title": "Моя тестовая группа",
            "type": "supergroup"
        },
        "date": 123456789,
        "new_chat_participant": {
            "id": 123456789,
            "is_bot": true,
            "first_name": "DanshinMS - тестовый бот",
            "username": "DanshinMS_bot"
        },
        "new_chat_member": {
            "id": 123456789,
            "is_bot": true,
            "first_name": "DanshinMS - тестовый бот",
            "username": "DanshinMS_bot"
        },
        "new_chat_members": [
            {
                "id": 123456789,
                "is_bot": true,
                "first_name": "DanshinMS - тестовый бот",
                "username": "DanshinMS_bot"
            }
        ]
    }
}
```

Обратите внимание на объект `chat`. Его свойство `"id"` содержит отрицательное значение. Это и есть ID чата.

```json
    "chat": {
        "id": -0123456789012,
        "title": "Моя тестовая группа",
        "type": "supergroup"
    }
```

Когда пользователь будет отправлять сообщение боту, то эти сообщения тоже можно будет получить через `getUpdates` и в них тоже будут содержаться ID пользователей.

# Удаление прочитанных сообщений

Каждый раз вызывая метод `getUpdates` вы будете получать все сообщения за последние 24 часа. Чтобы удалить уже обработанные, в методе `getUpdates` нужно передать `offset` с номером обновления + 1.

Допустим вы получили от сервера объект.

```json
{ ok: true, result: [
        {
            update_id: 31405473,
            message: [Object]
        }
    ]
}
```

Вы обработали его и хотите удалить, чтобы при следующем обновлении он не приходил. Обратите внимание на поле `update_id`. Передайте в методе `getUpdates` этот id + 1 в качестве значения параметра `offset` и вы больше не увидите ни одного обновления со значением меньшем, чем то, которое вы передали.

Вот как это можно сделать:

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8?offset=31405474
```

Ниже пример кода на JavaScript + Node.js. Эту функцию легко адаптировать под любые другие методы из [Telegram Bot API](https://core.telegram.org/bots/api#available-methods) и даже написать свой фреймворк.

```javascript
const https = require("https");
const apiToken = "0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8"

function getUpdates(offset) {
    const options = {
        hostname: `api.telegram.org`,
        path: `/bot${apiToken}/getUpdates`,
        method: "POST",
        headers: { 'content-type': 'application/json' },
    }

    const bodyContent = JSON.stringify({
        "offset": `${offset}`
    })

    const req = https.request(options, (response) => {

        response.on('data', (d) => {
            const data = JSON.parse(d)
            console.log(data);
        });
    });

    req.write(bodyContent);
    req.end();
}

getUpdates("123");
```

Теперь, имея представление о том, как создавать и взаимодействовать с ботами, используя любой язык программирования, вы сможете без труда автоматизировать рутиные операции - получение новых сообщений и их обработку. Посмотрите все методы [Telegram Bot API](https://core.telegram.org/bots/api#available-methods). Их не так много и с ними можно легко разобраться.

Периодически разработчики Telegram делают что-то новое. А сообщество уже давно выпустило фреймворки, которые облегчают жизнь. Некоторые из них стали очень популярны:

## Node JS

[Node.js Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)

[telegraf.js](https://github.com/telegraf/telegraf)

## Python

[Python Telegram Bot](https://github.com/python-telegram-bot/python-telegram-bot)

## C#

[.NET Client for Telegram Bot API](https://github.com/TelegramBots/Telegram.Bot)

Читайте статью [Взаимодействие с Telegram Bot API через Postman](https://danshin.ms/postman/). В ней вы узнаете о том, как взаимодействовать с Telegram Bot API при помощи мощного инструмента разработчиков Postman.

</div>

<div data-lang="en" markdown="1">
***In this article I cover basic information that will help you understand how to create a Telegram bot and interact with it without using third-party libraries.***

What is a Telegram Bot? The official website gives the following definition:

> Bots are third-party applications that run inside Telegram. Users can interact with bots by sending them messages, commands and inline requests. You control your bots using HTTPS requests to the [Telegram Bot API](https://core.telegram.org/bots/api#available-methods).

To create a simple bot you don't need anything besides Telegram itself. Users can send messages to your bot via the Telegram client or via the API. And to interact with your bot as the owner, you only need a browser (or any other tool that can send HTTPS requests).

That approach gives you the simplest bot and the simplest interaction. If you want your bot to do more complex things and automate receiving/processing messages, you'll need to write a bit of code. It's still very easy, and you can use any programming language you know. I show examples in JavaScript — you can adapt them to your language.

# Creating (registering) a Telegram bot

Telegram bots are special accounts that don't require a phone number. You register a bot, then users can send it messages/commands and the bot can respond.

![assets/images/linux-filesystem-operations/1.png](/assets/images/Telegram-Bot-From-Scratch/1.jpg)

Registration and management of bots is handled by another bot called **BotFather** — an official bot from Telegram. First, find it in Telegram and tell it you want to create a new bot. After answering a few simple questions, you'll get a **Token**. With that token you can interact with your bot via the Bot API as the owner. Users, in turn, can talk to the bot via Telegram or the API.

Find BotFather in your messenger: https://t.me/botfather and send `/newbot`. You'll be asked for the name and username of the new bot, and you'll receive a token.

> Keep the token secret. Anyone who knows it can control your bot.

![assets/images/linux-filesystem-operations/1.png](/assets/images/Telegram-Bot-From-Scratch/2.png)

From this moment, you can start interacting with your bot. For example, using the `getMe` method you can send a GET request to the [Telegram Bot API](https://core.telegram.org/bots/api#available-methods) and get information about your bot.

Use this URL format:

```
https://api.telegram.org/bot{TOKEN}/{METHOD_NAME}
```

Where:
* `TOKEN` — the token you got from BotFather
* `METHOD_NAME` — the Bot API method you want to call

Example:

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getMe
```

If everything is correct, you'll get a JSON response like:

```json
{
  "ok": true,
  "result": {
    "id": 0123456789,
    "is_bot": true,
    "first_name": "DanshinMS - тестовый бот",
    "username": "DanshinMS_bot",
    "can_join_groups": true,
    "can_read_all_group_messages": false,
    "supports_inline_queries": false
  }
}
```

`id` is the bot identifier. Every Telegram user/chat/channel has an ID. Bots use IDs to interact with users.

`is_bot: true` means the account type is `bot`.

`first_name` and `username` are the values you provided to BotFather.

`can_join_groups: true` — the bot can be added to groups.

`can_read_all_group_messages: false` — the bot can't read all messages in groups by default. You can change this to `true` if you want the bot to read group messages.

`supports_inline_queries: false` — users can't use the bot in inline mode (with `@`). You can change this to `true` to enable inline queries.

# Reading messages

Once the bot is registered, you can send it messages. Find it in Telegram, click Start, and send a message.

![assets/images/linux-filesystem-operations/1.png](/assets/images/Telegram-Bot-From-Scratch/4.png)

All messages go to Telegram servers and are stored for up to 24 hours. There are two ways to receive messages:

1. Call the `getUpdates` method (similar to `getMe`).
2. Configure a webhook (I'll cover it a bit later).

Let's use the first method and call `getUpdates`.

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getUpdates
```

It returns an object like this:

```json
{
  "ok": true,
  "result": [
    {
      "update_id": 206369231,
      "message": {
        "message_id": 1,
        "from": {
          "id": 0123456789,
          "is_bot": false,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "language_code": "en"
        },
        "chat": {
          "id": 0123456789,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "type": "private"
        },
        "date": 0123456789,
        "text": "/start",
        "entities": [
          {
            "offset": 0,
            "length": 6,
            "type": "bot_command"
          }
        ]
      }
    },
    {
      "update_id": 206369232,
      "message": {
        "message_id": 2,
        "from": {
          "id": 0123456789,
          "is_bot": false,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "language_code": "en"
        },
        "chat": {
          "id": 0123456789,
          "first_name": "Mikhail",
          "last_name": "Danshin",
          "username": "mdanshin",
          "type": "private"
        },
        "date": 1661089150,
        "text": "Hello, my new bot! How are you?"
      }
    }
  ]
}
```

The `text` field contains the message text. Now you can read and process messages. Later I'll show how to remove already processed updates.

Obviously, polling `getUpdates` manually is not very convenient: you'd have to send requests to Telegram with a high frequency. A better approach is a webhook. In that case, Telegram sends updates to a URL you provide.

With the `setWebhook` method you can set a `url`, and Telegram will POST updates to that URL. Of course, you need a service that listens on that URL (a small app hosted somewhere). In a future article I'll show how to do it on free hosting. I initially considered Heroku, but since they are [shutting down free plans](https://danshin.ms/Heroku-Next-Chapter/), I still need to pick a suitable host. Subscribe to updates or join my [Telegram group](https://t.me/danshin_ms).

# Sending messages as a bot

The simplest bot use case (no programming required) is sending messages as the bot.

For example, you can add the bot to a group and send messages to that group via the [Telegram Bot API](https://core.telegram.org/bots/api#available-methods) on behalf of the bot.

To do that, use the `sendMessage` method. In your browser, use a URL like this:

```
https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text={TEXT}

where:
* TOKEN  - the token you got from BotFather
* CHAT_ID - the ID of a user, group or channel you want to send a message to (how to find it is ниже)
* TEXT - the message text
```

Example:

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/sendMessage?chat_id=0123456789&text=Hello%20World
```

A practical example: monitoring systems (or any system that can send an HTTPS request or run a script) can send alerts via a bot. For example, a monitoring system runs a PowerShell script that sends an alert message:

```Powershell
Invoke-WebRequest https://api.telegram.org/bot123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/sendMessage?chat_id=0123456789&text=Alert%20Message
```

# How to find the ID?

To send a message, you need the recipient ID. Chats and channels also have IDs.

One way to find a chat ID is to add the bot to the chat and call `getUpdates`:

```
https://api.telegram.org/botTOKEN/getUpdates
```

Example:

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getUpdates
```

You'll get a list of accumulated updates, and the last one is often the event of adding the bot to the group. It looks like:

```json
{
    "update_id": 31405408,
    "message": {
        "message_id": 7,
        "from": {
            "id": 123456789,
            "is_bot": false,
            "first_name": "Mikhail",
            "last_name": "Danshin",
            "username": "mdanshin",
            "language_code": "en"
        },
        "chat": {
            "id": -0123456789012,
            "title": "Моя тестовая группа",
            "type": "supergroup"
        },
        "date": 123456789,
        "new_chat_participant": {
            "id": 123456789,
            "is_bot": true,
            "first_name": "DanshinMS - тестовый бот",
            "username": "DanshinMS_bot"
        },
        "new_chat_member": {
            "id": 123456789,
            "is_bot": true,
            "first_name": "DanshinMS - тестовый бот",
            "username": "DanshinMS_bot"
        },
        "new_chat_members": [
            {
                "id": 123456789,
                "is_bot": true,
                "first_name": "DanshinMS - тестовый бот",
                "username": "DanshinMS_bot"
            }
        ]
    }
}
```

Pay attention to the `chat` object. Its `id` is negative — that's the chat ID:

```json
    "chat": {
        "id": -0123456789012,
        "title": "Моя тестовая группа",
        "type": "supergroup"
    }
```

When a user sends a message to the bot, you can also get it via `getUpdates` and it will include the user ID as well.

# Deleting processed messages

Each time you call `getUpdates` you receive all updates from the last 24 hours. To delete already processed updates, pass `offset` equal to the last `update_id` + 1.

For example, you get a response like:

```json
{ ok: true, result: [
        {
            update_id: 31405473,
            message: [Object]
        }
    ]
}
```

You processed it and want it to stop appearing. Take `update_id` and call `getUpdates` with `offset = update_id + 1`. Then you won't see updates with smaller ids.

Example:

```
https://api.telegram.org/bot0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8/getUpdates?offset=31405474
```

Below is an example in JavaScript + Node.js. It's easy to adapt this function to other [Telegram Bot API methods](https://core.telegram.org/bots/api#available-methods) — and you can even build your own minimal framework.

```javascript
const https = require("https");
const apiToken = "0123456789:AAFYNwvkDdfgHJ3jhgrs3cUH4oSOEAVSZp8"

function getUpdates(offset) {
    const options = {
        hostname: `api.telegram.org`,
        path: `/bot${apiToken}/getUpdates`,
        method: "POST",
        headers: { 'content-type': 'application/json' },
    }

    const bodyContent = JSON.stringify({
        "offset": `${offset}`
    })

    const req = https.request(options, (response) => {

        response.on('data', (d) => {
            const data = JSON.parse(d)
            console.log(data);
        });
    });

    req.write(bodyContent);
    req.end();
}

getUpdates("123");
```

Now that you understand how to create and interact with bots using any programming language, you can easily automate routine tasks: receiving new messages and processing them. Check all [Telegram Bot API methods](https://core.telegram.org/bots/api#available-methods) — there aren't many, and they're easy to learn.

Telegram developers add new things periodically, and the community has released a lot of frameworks that make life easier. Some popular ones:

## Node.js

[Node.js Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)

[telegraf.js](https://github.com/telegraf/telegraf)

## Python

[Python Telegram Bot](https://github.com/python-telegram-bot/python-telegram-bot)

## C#

[.NET Client for Telegram Bot API](https://github.com/TelegramBots/Telegram.Bot)

Also read: [Working with Telegram Bot API via Postman](https://danshin.ms/postman/) — it shows how to interact with the Bot API using the Postman developer tool.
</div>
