---
layout: post
title:  "JWT - коротко о главном"
title_en: "JWT: Quick Start"
categories: [ Другое ]
tags: [ jwt, security ]
image: assets/images/jwt-quick-start/0.jpg
author: Mikhail
---


<div data-lang="ru" markdown="1">
***В этой статье я коротко расскажу о том, что такое JWT (JSON WEB TOKEN) и как он применяется в процессе аутентификации и авторизации***

Есть такая штука, называется JWT - JSON Web Token. По сути это способ (стандарт) обернуть данные (payload) в подписанный пакет. В основном это используется для обмена данными, например авторизационными. Рассмотрим как это работает на простом примере авторизации.

1. Пользователь аутентифицируется с использованием login/пароля (АУТЕНТИФИКАЦИЯ)
2. В ответ получает jwt - json web token. Далее по тексту jwt-токен или просто "токен".
3. Когда пользователь хочет получить доступ к ресурсу, он отправляет токен
4. Сервер проверяет валидность токена и предоставляет доступ к ресурсу (АВТОРИЗАЦИЯ)

>Важно понимать, что токен не содержит в себе никакой секретной информации. Чаще всего туда помещают информацию о пользователе (id, username, email, role). Эта информация может быть прочитана кем угодно. Подписывается токен для того, чтобы убедиться в том, что информация в токене не была подделана/изменена. Подписан токен может либо закрытым ключом, либо парой открытым/закрытым ключом.

JWT похож на SAML, но гораздо проще. На картинке ниже проиллюстрировано  то, как выглядит JWT-токен, подписанный парой ключей, открытым и закрытым. JWT токен состоит из заголовка, данных и подписи ("HEADER"+"PAYLOAD"+"SIGNATURE").

![jwt-quick-start/1.png](/assets/images/jwt-quick-start/1.png)

Как видите, структура JWT-токена очень проста. Ниже показано сравнение того, как выглядит JWT-токен и SAML-сообщение.

![jwt-quick-start/2.png](/assets/images/jwt-quick-start/2.png)

Рассмотрим принцип использования JWT, описанный в начале, более подробно, приблизив его к реальности.

>Действия, описанные далее, могут отличаться в зависимости от реализации программиста и использования разных протоколов аутентификации и авторизации. Описанная ниже логика и порядок действий даёт общее понимание того, как устроен процесс.

## 1. Пользователь аутентифицируется  с использованием логин/пароля (АУТЕНТИФИКАЦИЯ)

Если говорить про WEB, то как правило пользователь заходит на сайт (клиент) и вводит логин пароль в форму авторизации. Клиент отправляет авторизационные данные серверу аутентификации, задача которого проверить, что пользователь является тем, за кого он себя выдаёт сверив пару логин/пароль с тем, что находится в его базе данных. И в зависимости от результата проверки возвращает положительный или отрицательный ответ клиенту (web-приложению, куда пользователь ввёл логин/пароль). Этот процесс называется аутентификация. Не путать с авторизацией.

## 2. Пользователь получает JWT-токены

Если пользователь успешно прошёл процесс аутентификации, то есть ввёл действительные логин и пароль, то клиент, получив положительный ответ от сервера аутентификации запрашивает у сервера, который выдаёт токен, пару токенов - AccessToken и RefreshToken. Далее я объясню, откуда вдруг взялся RefreshToken и зачем он нужен.

Это не обязательно разные сервера. В самом простом клиент-серверном приложении, сервер и аутентифицирует, и сразу же выдаёт ключи пользователю. Так или иначе пользователь получает токен и как правило хранит его в браузере. Например, в HttpOnly-Cookie.

>Для хранения токена очень важно использование флага HttpOnly. Иначе это считается не безопасным.

## 3. Когда пользователь хочет получить доступ к ресурсу, он отправляет токен

Когда пользователь хочет получить доступ к ресурсу, он отправляет запрос на сервер и передаёт AccessToken. В случае с jwt это можно сделать с использованием схемы Bearer. Для этого в HTTP заголовке передаётся ключ "Authorization" со значением, содержащим ключевое слово "Bearer" и через пробел сам токен.

```
Authorization: Bearer <token>
```

## 4. Сервер проверяет валидность токена и предоставляет доступ к ресурсу (АВТОРИЗАЦИЯ)

После того, как сервер получил токен, он проверяет его валидность и предоставляет доступ к ресурсу. И тут кроется самое интересное. Токен может быть не валиден по разным причинам. Например, он просрочен. Дело в том, что хранить токены длительное время - это не безопасно. В зависимости от чувствительности данных, к которым предоставляется доступ, время жизни токена может быть от нескольких секунд, до нескольких минут. В случае если токен не действителен, то сервер сообщает на клиент ошибку 401 (Unauthorized Error). В таком случае клиент может попросить пользователя ещё раз ввести логин пароль. Но чтобы не делать это слишком часто, придумали RefreshToken. Время жизни RefreshToken уже гораздо больше. Например 30-60 дней.

Когда пользователь первый раз получает пару AccessToken/RefreshToken, то RefreshToken сохраняется как в базе данных на стороне сервера, вместе с id пользователя или другим уникальным идентификатором, так и на стороне клиента(пользователя). Как правило это HttpOnly-Cookie, которая хранится в браузере. Если после отправки AccessToken клиент получает ошибку 401 (Unauthorized Error), он отправляет RefreshToken на обновление токенов (/api/refresh) и после валидации RefreshToken сервер предоставляет новую пару AccessToken/RefreshToken. Клиент их сохраняет и заново отправляет AccessToken. Если на этот раз валидация прошла успешно, то сервер предоставляет доступ к запрашиваемому ресурсу.

Если же и RefreshToken не прошёл проверку, то пользователя просят заново пройти процесс аутентификации - ввести логин/пароль и заново получить пару AccessToken/RefreshToken.

На картинке показана упрощённая схема описанного процесса.

![jwt-quick-start/1.png](/assets/images/jwt-quick-start/3.png)

Конечно схема авторизации может и должна быть гораздо сложнее. Серверное приложение может проверять статус активна или нет учётная запись. Позволяет ли роль пользователя получить доступ к ресурсу и т.д.. Должен быть механизм отзыва токенов. Но всё это относится к внутренней логике конкретного приложения.

>Помните, что Вы никогда не можете быть уверены в том, что ваш логин/пароль безопасно передаётся от браузера к клиенту и от клиента к серверу. И в том, что клиент или сервер безопасно обрабатывает и хранит ваши пароли. Поэтому так важно использовать для каждого ресурса уникальный пароль и периодические его менять.

Скоро в этом посте появится видео, в котором я покажу пример простого клиент-серверного web-приложения и наглядно продемонстрирую работу JWT.

Stay tuned...
</div>

<div data-lang="en" markdown="1">
***In this post I briefly explain what JWT (JSON Web Token) is and how it is used in authentication and authorization.***

JWT (JSON Web Token) is a standard way to wrap data (a payload) into a signed token. It is most often used to exchange authorization-related data. Let's look at a simple authorization flow:

1. A user authenticates with a login/password (AUTHENTICATION)
2. The user receives a JWT (later in the text: “JWT token” or just “token”)
3. When the user wants to access a resource, the client sends the token
4. The server validates the token and grants access to the resource (AUTHORIZATION)

> It's important to understand that a JWT does not contain secret information. Typically it contains user info (id, username, email, role). Anyone can decode and read it. The token is signed to ensure the data wasn't tampered with. A token can be signed either with a private key, or with a public/private key pair.

JWT is similar to SAML, but much simpler. The image below shows what a JWT signed with a key pair looks like. A JWT consists of a header, a payload, and a signature ("HEADER" + "PAYLOAD" + "SIGNATURE").

![jwt-quick-start/1.png](/assets/images/jwt-quick-start/1.png)

As you can see, the structure is very simple. Below is a comparison of how a JWT token and a SAML message look.

![jwt-quick-start/2.png](/assets/images/jwt-quick-start/2.png)

Now let's make the initial flow a bit more realistic.

> The exact steps can differ depending on an implementation and the authentication/authorization protocols used. The logic below is meant to provide a general understanding of how the process works.

## 1. User authenticates with login/password (AUTHENTICATION)

On the web, a user typically opens a website (client) and enters login/password in a form. The client sends the credentials to an authentication server whose job is to verify the user by checking the login/password against its database. Depending on the result, it returns success or failure to the client (the web app where the user entered the credentials). This is authentication. Don't confuse it with authorization.

## 2. User receives JWT tokens

If authentication succeeds (valid login/password), the client requests a token pair from a token issuer: an AccessToken and a RefreshToken. Below I'll explain why RefreshToken appears and what it is used for.

These are not necessarily different servers. In the simplest client-server app, the same server authenticates the user and issues tokens. In any case, the user receives a token and usually stores it in the browser (for example, in an HttpOnly cookie).

> Using the HttpOnly flag is very important for token storage. Without it, it's considered unsafe.

## 3. When the user wants to access a resource, they send the token

To access a resource, the client sends a request to the server and includes the AccessToken. With JWT, this is commonly done using the Bearer scheme: an HTTP header named `Authorization` with the keyword `Bearer` and the token separated by a space.

```
Authorization: Bearer <token>
```

## 4. Server validates the token and grants access (AUTHORIZATION)

After receiving the token, the server validates it and grants access. Here is the interesting part: a token can be invalid for different reasons (for example, it expired). Keeping access tokens for a long time is unsafe. Depending on the sensitivity of the protected data, token lifetime can be from seconds to minutes.

If the token is not valid, the server returns a 401 (Unauthorized). The client could ask the user to enter login/password again, but to avoid doing it too often, RefreshToken was introduced. Refresh tokens live much longer (for example, 30-60 days).

When a user first receives an AccessToken/RefreshToken pair, the RefreshToken is stored both on the server side (in a database, linked to the user's id or another unique identifier) and on the client side (usually as an HttpOnly cookie in the browser). If the client sends an AccessToken and gets a 401, it sends the RefreshToken to refresh the tokens (e.g., `/api/refresh`). After validating the RefreshToken, the server issues a new AccessToken/RefreshToken pair. The client saves them and retries the request with the new AccessToken.

If the RefreshToken is invalid too, the user must authenticate again (enter login/password) and obtain a new AccessToken/RefreshToken pair.

The image below shows a simplified scheme of this process.

![jwt-quick-start/1.png](/assets/images/jwt-quick-start/3.png)

Of course, real authorization logic can and should be more complex: checking whether the account is active, whether the user's role allows access, token revocation, etc. All of that depends on the internal logic of a specific application.

> Remember: you can never be 100% sure that your login/password is transmitted securely from browser to client and from client to server, or that the client/server stores and handles passwords safely. That is why it's important to use unique passwords per service and change them regularly.

Soon I'll add a video to this post where I show a simple client-server web app example and demonstrate JWT in action.

Stay tuned...
</div>
