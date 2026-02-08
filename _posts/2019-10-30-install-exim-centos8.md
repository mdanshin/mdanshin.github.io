---
layout: post
title:  "Установка EXIM на CentOS 8 из исходников"
title_en: "Installing Exim on CentOS 8 from Source"
categories: [ Администрирование ]
tags: [ Linux ]
image: assets/images/install-exim-centos8/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Exim - это очень мощный и гибкий пересылщик сообщений (MTA). Чтобы описать все его достоинства потребуется отдельная статья. Сегодня же я хочу рассказать о своём способе установки Exim на CentOS 8 из исходников.***

Для начала нам потребуется установленная и настроенная машина под управлением CentOS 8, с доступом в интернет. В процессе установки мы скачаем исходники из репозитория проекта на GitHub-е, выполним минимальные настройки, скомпилируем и установим Exim. В этой статье я не буду вдаваться в тонкости настройки Exim. Почти все настройки мы оставим по умолчанию. Но я обязательно посвящу отдельную статью, в которой распишу все нюансы правильной конфигурации.

>На момент написания статьи, актуальная версия Exim - exim-4.93-RC1. При работе с другими версиями процесс может незначительно отличаться.

Для успешной сборки из исходных кодов нам потребуется:

* Development Tools
* pcre-devel
* libdb-devel
* openssl-devel

Для установки выполняем следующие команды:

```bash
yum group install -y 'Development Tools'
yum install -y pcre-devel libdb-devel openssl-devel
```

Затем клонируем репозиторий проекта с GitHub

```bash
git clone https://github.com/Exim/exim.git
```

Заходим в репозиторий, переходим в папку src и создаём папку Local

```bash
cd exim/src/
mkdir Local
```

Скопируем в созданную папку шаблон make-файла.

```bash
cp src/EDITME Local/Makefile
```

Отредактируем его следующим образом:

```
EXIM_USER=exim
USE_OPENSSL=yes
TLS_LIBS=-lssl -lcrypto
```

Раскомментируйте вышеуказанные строки, остальное оставьте без изменения.

После этого создадим в системе нового пользователя, от имени которого будет работать Exim, выполним сборку и установку.

```bash
adduser exim
make
make install
```

Теперь наш Exim готов к запуску. В следующей статье я расскажу, как правильно настроить Exim и как с ним работать.
</div>

<div data-lang="en" markdown="1">
***Exim is a very powerful and flexible Mail Transfer Agent (MTA). To cover all of its features would require a separate article. Today I want to show my way of installing Exim on CentOS 8 from source.***

You will need a CentOS 8 machine with Internet access. During the installation we will download sources from the project's GitHub repository, apply minimal configuration, compile, and install Exim.

This post does not go deep into Exim configuration — most settings are left as defaults. I plan to write a separate article that covers proper configuration in detail.

> At the time of writing, the current Exim version is exim-4.93-RC1. With other versions the process may differ slightly.

To build from source you will need:

* Development Tools
* pcre-devel
* libdb-devel
* openssl-devel

Install dependencies:

```bash
yum group install -y 'Development Tools'
yum install -y pcre-devel libdb-devel openssl-devel
```

Clone the project repository:

```bash
git clone https://github.com/Exim/exim.git
```

Enter the repo, go to `src`, and create `Local`:

```bash
cd exim/src/
mkdir Local
```

Copy the Makefile template into the new folder:

```bash
cp src/EDITME Local/Makefile
```

Edit it like this:

```
EXIM_USER=exim
USE_OPENSSL=yes
TLS_LIBS=-lssl -lcrypto
```

Uncomment the lines above and leave everything else unchanged.

After that, create a dedicated system user for Exim and build/install it:

```bash
adduser exim
make
make install
```

Now Exim is ready to be started. In the next article I'll explain how to configure Exim properly and how to work with it.
</div>
