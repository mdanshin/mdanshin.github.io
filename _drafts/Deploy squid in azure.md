---
layout: post
title:  "Развёртывание и настройка Squid proxy в Azure"
categories: [ Администрирование ]
tags: [ Linux, CentOS, Squid, Azure ]
image: assets/images/Deploy-squid-in-azure/0.jpg
author: Mikhail
---
***В этой статье Вы узнаете о том, как развернуть и настроить свой proxy сервер на основе популярного продукта Squid, в облачном сервисе Microsoft Azure.***

### Создание VM
Заходим на стартовую страницу портала Azure и создаём новый ресурс нажав на `Create a resource`.

![Deploy-squid-in-azure/4.png](/assets/images/Deploy-squid-in-azure/4.png)

В строке поиска вводим `centos` и выбираем `Centos-based 7.5`. 

![Deploy-squid-in-azure/5.png](/assets/images/Deploy-squid-in-azure/5.png)

![Deploy-squid-in-azure/6.png](/assets/images/Deploy-squid-in-azure/6.png)

Далее заполняем первую форму, как показано на скриншоте ниже. Без паники. Тут всё очень просто и быстро. Почти все настройки мы оставим по умолчанию.

![Deploy-squid-in-azure/7_2.png](/assets/images/Deploy-squid-in-azure/7_2.png)

Первое, на что нужно обратить особое внимание, что в разделе `Basic` нам нужно создать ресурсную группу, в которой будут сгруппированы наши будущие ресурсы. Для этого нажимаем `Create new` и вводим любое имя группы.

![Deploy-squid-in-azure/7_1.png](/assets/images/Deploy-squid-in-azure/7_1.png)

Введите любое название вашей VM. Я назвал её `proxy`.

Один из важнейших моментов - выбор региона. Я выбрал `(US) North Central US`, чтобы иметь возможность выходить в Интернет с американский IP адресов. Но вы можете выбрать другой регион, например Европу.

Ещё один важный момент - это выбрать размер VM. Для этого нажмите `Change size`. В открывшейся форме уберите все фильтры и отсортируйте записи по цене. Для себя я выбрал размер `B1s`.

![Deploy-squid-in-azure/8_1.png](/assets/images/Deploy-squid-in-azure/8_1.png)

Закончите заполнение формы. Выберете тип аутентификации по паролю. Введите логин и пароль. И нажмите `Next: Disk >` для перехода на следующую форму.

![Deploy-squid-in-azure/9.png](/assets/images/Deploy-squid-in-azure/9.png)

Здесь я выбрал `Standard HDD`, чтобы сэкономить деньги. Переходим на следующую форму, к сетевым настройкам. 

![Deploy-squid-in-azure/10.png](/assets/images/Deploy-squid-in-azure/10.png)

Проверяем, оставляем всё по умолчанию и переходим дальше.

![Deploy-squid-in-azure/11.png](/assets/images/Deploy-squid-in-azure/11.png)

Здесь единственное, что нужно сделать - это создать `Diagnostics storage account`.

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

yum -y update

yum -y install epel-release
yum -y update
yum clean all

yum -y install squid

systemctl start squid

systemctl enable squid

systemctl status squid

Создаём нового пользователя

```bash
htdigest -c /etc/squid/user_squid proxy mdanshin
```
Делаем копию конфига

```bash
cp /etc/squid/squid.conf /etc/squid/squid.conf.bak
```
В конфиге правим вот это

```bash
vi /etc/squid/squid.conf
```

```
auth_param digest program /usr/lib64/squid/digest_file_auth -c /etc/squid/user_squid
auth_param digest children 5
auth_param digest realm proxy
acl users proxy_auth REQUIRED
http_access allow users
```