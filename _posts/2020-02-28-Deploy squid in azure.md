---
layout: post
title:  "Развёртывание и настройка Squid Proxy в Microsoft Azure"
categories: [ Администрирование ]
tags: [ Linux, CentOS, Squid, Azure ]
image: assets/images/Deploy-squid-in-azure/0.png
author: Mikhail
---
***В этой статье Вы узнаете о том, как развернуть и настроить свой proxy сервер на основе популярного продукта Squid, в облачном сервисе Microsoft Azure. Мы с нуля развернём виртуальную машину под управлением CentOS, установим все необходимые программы и настроим, и запустим наш Proxy Server под управлением Squid. А также настроим аутентификацию. Если у вас уже есть VM в Azure, то можете переходить в раздел [Обновление и установка Squid](#Обновление-и-установка-Squid).***

### Создание VM
Заходим на стартовую страницу портала Azure и создаём новый ресурс нажав на `Create a resource`.

![Deploy-squid-in-azure/4.png](/assets/images/Deploy-squid-in-azure/4.png)

В строке поиска вводим `centos` и выбираем `Centos-based 7.5`. 

![Deploy-squid-in-azure/5.png](/assets/images/Deploy-squid-in-azure/5.png)

Нажимаем `Create`

![Deploy-squid-in-azure/6.png](/assets/images/Deploy-squid-in-azure/6.png)

Далее заполняем первую форму, как показано на скриншоте ниже. Без паники. Тут всё очень просто и быстро. Почти все настройки мы оставим по умолчанию.

![Deploy-squid-in-azure/7_2.png](/assets/images/Deploy-squid-in-azure/7_2.png)

Первое, на что нужно обратить особое внимание, что в разделе `Basic` нам нужно создать ресурсную группу, в которой будут сгруппированы наши будущие ресурсы. Для этого нажимаем `Create new` и вводим любое имя группы.

![Deploy-squid-in-azure/7_1.png](/assets/images/Deploy-squid-in-azure/7_1.png)

Введите любое название вашей VM. Я назвал её `proxy`.

Один из важнейших моментов - выбор региона. Я выбрал `(US) North Central US`, чтобы иметь возможность выходить в Интернет с американских IP адресов. Но вы можете выбрать другой регион, например, Европу.

Ещё один важный момент - это выбрать размер VM. Для этого нажмите `Change size`. В открывшейся форме уберите все фильтры и отсортируйте записи по цене. Для себя я выбрал размер `B1s`.

![Deploy-squid-in-azure/8.png](/assets/images/Deploy-squid-in-azure/8.png)

![Deploy-squid-in-azure/8_1.png](/assets/images/Deploy-squid-in-azure/8_1.png)

В разделе `Inbound port rule`, выберите выпадающий список `Select inbound ports` и отметьте порт 80

![Deploy-squid-in-azure/8_2.png](/assets/images/Deploy-squid-in-azure/8_2.png)

Закончите заполнение формы. Выберете тип аутентификации по паролю. Введите логин и пароль. И нажмите `Next: Disk >` для перехода на следующую форму.

Здесь я выбрал `Standard HDD`, чтобы сэкономить деньги. Переходим на следующую форму, к сетевым настройкам. 

![Deploy-squid-in-azure/9.png](/assets/images/Deploy-squid-in-azure/9.png)

Проверяем, оставляем всё по умолчанию и переходим дальше.

![Deploy-squid-in-azure/10.png](/assets/images/Deploy-squid-in-azure/10.png)

Здесь единственное, что нужно сделать - это создать `Diagnostics storage account`.

![Deploy-squid-in-azure/11.png](/assets/images/Deploy-squid-in-azure/11.png)

![Deploy-squid-in-azure/11_1.png](/assets/images/Deploy-squid-in-azure/11_1.png)

После этого можно смело нажимать `Review + create` или пролистать оставшиеся формы до конца, оставляя все значения по умолчанию. 

![Deploy-squid-in-azure/12.png](/assets/images/Deploy-squid-in-azure/12.png)
![Deploy-squid-in-azure/13.png](/assets/images/Deploy-squid-in-azure/13.png)
![Deploy-squid-in-azure/14.png](/assets/images/Deploy-squid-in-azure/14.png)

В конце нажимаем `Create` и запасаемся терпением.

![Deploy-squid-in-azure/15.png](/assets/images/Deploy-squid-in-azure/15.png)
![Deploy-squid-in-azure/16.png](/assets/images/Deploy-squid-in-azure/16.png)

### Подключение к VM

После того как создание ресурсов будет закончено, нажмите `Go to resource`.

![Deploy-squid-in-azure/17.png](/assets/images/Deploy-squid-in-azure/17.png)

Вы попадете на экран обзора вашей VM

![Deploy-squid-in-azure/18.png](/assets/images/Deploy-squid-in-azure/18.png)

Нажмите `Connect`, выберите `SSH`, скопируйте IP адрес и запустите Powershell.

![Deploy-squid-in-azure/19.png](/assets/images/Deploy-squid-in-azure/19.png)
![Deploy-squid-in-azure/20.png](/assets/images/Deploy-squid-in-azure/20.png)

В Powershell введите следующую команду: `ssh username@ip-address`. Ответьте `yes` на вопрос о продолжении подключения, введите пароль. Вы успешно подключились к своей VM в Azure.

![Deploy-squid-in-azure/21.png](/assets/images/Deploy-squid-in-azure/21.png)

### Обновление и установка Squid

Переходим в режим sudo выполнив команду `sudo -i` и последовательно выполняем нижеприведённые команды:

```
yum -y update

yum -y install epel-release
yum -y update
yum clean all

yum -y install squid httpd-tools

systemctl start squid

systemctl enable squid

systemctl status squid
```

Создаём нового пользователя для squid и задаём наш будущий пароль, который будем вводить при авторизации на proxy, т.к. мы делаем proxy с авторизацией, а не анонимный. Желательно, чтобы логин/пароль пользователя `squid` отличался от тех, что вы задали на этапе создания VM. 

```bash
htdigest -c /etc/squid/user_squid proxy mdanshin
```

![Deploy-squid-in-azure/24.png](/assets/images/Deploy-squid-in-azure/24.png)

Делаем копию конфигурационного файла, чтобы иметь возможность восстановить его, если что-то пойдёт не так.

```bash
cp /etc/squid/squid.conf /etc/squid/squid.conf.bak
```
Открываем конфигурационный файл на редактирование.

```bash
vi /etc/squid/squid.conf
```

Проще всего удалить всё содержимое файла и вставить в него те строки, которые я привожу ниже. Но вы можете подойти к делу более основательно и самостоятельно отредактировать конфигурацию так, как Вам это нужно.

```
acl localhost src all

acl SSL_ports port 443
acl Safe_ports port 80          # http
acl Safe_ports port 21          # ftp
acl Safe_ports port 443         # https
acl Safe_ports port 70          # gopher
acl Safe_ports port 210         # wais
acl Safe_ports port 1025-65535  # unregistered ports
acl Safe_ports port 280         # http-mgmt
acl Safe_ports port 488         # gss-http
acl Safe_ports port 591         # filemaker
acl Safe_ports port 777         # multiling http

auth_param digest program /usr/lib64/squid/digest_file_auth -c /etc/squid/user_squid
auth_param digest children 5
auth_param digest realm proxy
acl users proxy_auth REQUIRED
http_access allow users
acl CONNECT method CONNECT

http_access allow localhost manager
http_access allow manager

http_access deny all

http_port 80

coredump_dir /var/spool/squid

refresh_pattern ^ftp:           1440    20%     10080
refresh_pattern ^gopher:        1440    0%      1440
refresh_pattern -i (/cgi-bin/|\?) 0     0%      0
refresh_pattern .               0       20%     4320
```

Перезапускаем squid, чтобы изменения вступили в силу.

```
systemctl restart squid
```

В заключении я бы рекомендовал полностью перезапустить VM командой `reboot`. Во-первых это позволит загрузиться с нового ядра, которое было установлено во время обновления пакетов. А во-вторых убедиться в том, что squid автоматически запускается при старте системы. Не помешает также отключить 22 порт, чтобы он не торачал наружу. Для этого используйте портал Azure, чтобы случайно не перекрыть самому себе доступ к VM.