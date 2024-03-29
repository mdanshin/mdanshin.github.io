---
layout: post
title:  "Создание простого клиент-серверного приложения на Node.js, JavaScript и React. Часть 2 - создание проекта"
categories: [ Программирование ]
tags: [ Node.js, JS, React, javascript ]
image: assets/images/MERN-for-beginners/0.jpg
author: Mikhail
---
***Я открываю цикл статей, в котором опишу процесс создания простого клиент-серверного приложения на JavaScript. Я буду показывать это на примере MERN-стека. В своё время я потратил очень много времени, чтобы разобраться в этом. Пришло время поделится накопленными знаниями.***

>В прошлой статье мы узнали, что такое MERN-стек. Какое ПО нужно для написания простого клиент-серверного приложения, где его взять, как установить. В этой статье мы создадим проект, напишем свою первую программу и запустим её. Всё будет очень просто.

# Создаём папку проект

Сразу определите для себя, где вы будете хранить свои проекты. Для простоты я буду хранить их на диске C: в папке src. Создайте там папку `MERN-client-server-app` и в ней две папки - `client` и `server`.

```powershell
cd c:\src
mkdir MERN-client-server-app
mkdir client && mkdir server
```

# Инициализация проекта

Перейдите в папку `server` и наберите команду `npm init -y`, а затем `code ..\.` Таким образом, находясь в папке server мы откроем вышестоящую папку, как папку проекта.

```powershell
cd server
npm init -y
code .
```

![MERN-for-beginners/3.png](/assets/images/MERN-for-beginners/3.png)


Обратите внимание, что после инициализации в папке server появился файл `package.json` и он уже имеет какое-то содержимое. Это очень важный файл для нашего проекта. Я не буду подробно останавливаться на нём и рассказывать про его содержимое. Изучим всё по ходу дела.

Давайте создадим главный файл нашего проекта, где будет расположен стартовый код нашего будущего серверного приложения. Создайте файл под названием `index.js`. Название файла не имеет особого значения, но это название является названием по умолчанию поэтому я выбираю именно его.

# Установка необходимых framework-ов.

Как я уже говорил, мы не будем писать на чистом javascript. Мы будем использовать framework-и, которые делают процесс написания программы проще, а код чище.

Выполните следующие команды:

```powershell
npm install express mongodb mongoose
npm install -D nodemon
```

После выполнения у вас появится папка `node_modules`, которая содержит установленные пакеты и зависимости и файл `package-lock.json`, который описвает их. 

В фале `package.json` найдите строку `"test": "echo \"Error: no test specified\" && exit 1"` и замените её на `"dev": "nodemon index.js"`.

# Написание кода

Давайте теперь напишем наш первый код. И не просто какой-то там Hello World. А сразу целое серверное приложение, которое будет отвечать на запросы браузера.

```javascript
const express = require('express')
const app = express()

app.use('/', (req,res)=>{
    res.json({
        message: "Hello World"
    })
})

app.listen(5000)
```

# Запуск программы

Всё готово к запуску. В командной строке наберите `npm run dev` и если вы всё сделали правильно, то приложение запуститься и вы не увидите никаких ошибок.

![MERN-for-beginners/4.png](/assets/images/MERN-for-beginners/4.png)

Откройте браузер и наберите в адресной строке `http://localhost:5000` и вы увидите ответ от сервера!

![MERN-for-beginners/5.png](/assets/images/MERN-for-beginners/5.png)

Поздравляю, вы только что написали своё первое серверное WEB-приложение.

>В видео я более подробно разбираю все действия. Заходите на мой канал, ставьте лайки, оставляйте комментарии.

В следующей статье мы создадим клиентское приложение, которое будет обращаться к нашему серверу, отправлять запросы и получать данные. Будет просто и интересно.