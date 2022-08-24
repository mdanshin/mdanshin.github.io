---
layout: post
title:  "Базовые сведения о Telegram Bot API"
categories: [ Программирование ]
tags: [ Telegram, Bot, JavaScript ]
image: assets/images/Telegram-Bot-From-Scratch/0.png
author: Mikhail
---
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

Все сообщения попадают на сервера Telegram и хранятся там не более 24 часов. Чтобы получить список сообщений, нужно вызвать метод `getUpdates`, так же, как мы это делали с методом `getMe`.

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

Ниже пример кода на JavaScript. Эту функцию легко адаптировать под любые другие методы из [Telegram Bot API](https://core.telegram.org/bots/api#available-methods) и даже написать свой фреймворк.

```javascript
function getUpdates(offset) {
    const options = {
        hostname: `api.telegram.org`,
        path: `/bot${apiToken}/getUpdates`,
        method: "POST",
        headers: { 'content-type': 'application/json' },
    }

    const data = JSON.stringify({
        "offset": `${offset}`
    })

    const req = https.request(options, (response) => {

        response.on('data', (d) => {
            const data = JSON.parse(d)
            console.log(data);
        });
    });

    req.write(data);
    req.end();
}
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


<img src="../assets/images/Telegram_logo.svg.webp" alt="telegram" width="20" align="left"/>
Заходите в группу в телеграм: [t.me/danshin_ms](https://t.me/danshin_ms)