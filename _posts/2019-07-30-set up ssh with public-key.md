---
layout: post
title:  "Как настроить SSH аутентификацию при помощи открытого ключа"
title_en: "How to Set Up SSH Public Key Authentication"
categories: [ Администрирование ]
tags: [ ssh ]
image: assets/images/set_up_ssh_with_public_key/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Использование аутентификации с помощью открытого ключа SSH для подключения к удаленной системе является надежной и более безопасной альтернативой входу в систему с паролем учетной записи или парольной фразой. Аутентификация с открытым ключом SSH опирается на асимметричные криптографические алгоритмы, которые генерируют пару ключей, один из которых является «закрытым», а другой - «открытым». Вы храните закрытый ключ в секрете и храните его на компьютере, который используете для подключения к удаленной системе. Открытым ключём вы можете поделиться с кем угодно, не ставя под угрозу закрытый ключ; вы храните его в удаленной системе в хранилище `.ssh/authorized_keys`.***

>Рекомендую предварительно ознакомиться со статьёй [SSH - коротко о главном]({% post_url 2019-05-06-ssh base %})

# Для нетерпеливых

Коротко расскажу общий подход как настроить SSH аутентификацию при помощи открытого ключа.

Генерируем пару ключей (ниже я расскажу, как это сделать). Закрытый будем использовать на клиенте, для подключения по ssh. Открытый передаём на удалённый сервер и помещаем его в хранилище авторизованных ключей (~/.ssh/authorized_keys). 

>ВАЖНО: если на сервере не выставить разрешения `chmod 600` и `chown`, для `authorized_keys`, то авторизация работать не будет. За этим следит sshd. В этой статье я покажу как это правильно сделать.

После того как сгенерили и разместили ключи нужно на удалённом сервере отредактировать `sshd_config` - отключить авторизацию по паролю, чтобы использовать только сертификат, а также, не обязательно, но желательно, отключить PAM и разрешение входа по SSH под root-ом.

# Полный перечень команд

```bash
ssh username@servername

mkdir ~/.ssh
chmod 700 ~/.ssh

scp c:\path_to_file\.ssh\id_rsa.pub username@servername:~/.ssh/username_rsa.pub

cd ~/.ssh
cat username_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chown $USER:$USER ~/.ssh -R

`/etc/ssh/sshd_config`
RSAAuthentication yes
PasswordAuthentication no

sudo service sshd restart
```

# Теперь по порядку.

>Для работы нам понадобиться установленный OpenSSH. К сведению пользователей Windows - [OpenSSH был добавлен в Windows](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview) осенью 2018 года и включен в Windows 10 и Windows Server 2019.

## Создаём пару ключей.
На компьютере, с которого вы хотите осуществлять подключение, генерируем пару ключей (открытый (id_rsa.pub)/закрытый (id_rsa)). Для этого выполните команду

```
ssh-keygen -t rsa -b 4096
```

Программа попросит вас ввести имя файла закрытого ключа (по умолчанию id_rsa). Если не хотите ничего менять, то просто нажимайте Enter. Далее Вас попросят ввести пароль (парольную фразу). Этот шаг можно пропустить и не вводить пароль, нажав Enter. Но имейте ввиду, что в этом случае, любой, кто завладеет вашим закрытым ключом, сможет им воспользоваться. Если Вы введёте пароль, то он будет спрашиваться у Вас каждый раз при использовании закрытого ключа. Я рекомендую всегда вводить пароль, тем самым защищать свой закрытый ключ. Затем Вас попросят повторить пароль, для контроля правильности ввода. В результате программа сгенерирует пару ключей и поместит их в каталог `~/.ssh`. Результат работы программы виден на скриншоте.

![assets/images/set-up-ssh-with-public-key/1.jpg](/assets/images/set_up_ssh_with_public_key/1.jpg)

## Передаём открытый ключ на сервер
После того как Вы сгенерировали открытый и закрытый ключ Вам необходимо передать открытый ключ на сервер, к которому Вы хотите подключаться.

Пользователи *nix систем, для передачи ключа, могут использовать программу `ssh-copy-id`, которая входит в поставку OpenSSH. Она скопирует ключ и установит его, выполнив все необходимые действия.

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub remote_user@remote_host
```

>ВАЖНО: Передавать нужно именно публичный ключ! Никогда не передавайте закрытый ключ. Он всегда должен оставться только у Вас!

К сожалению `ssh-copy-id` не входит в поставку [OpenSSH для Windows](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview). Поэтому здесь я приведу ещё универсальный метод, который подходит в обоих случаях.

Для начала нам нужно подключиться к удалённому серверру, на который мы планируем, в последствии, авторизоваться с помощью открытого ключа.

```powershell
ssh username@servername
```
Если на сервере ещё нет каталога `~/.ssh`, то выполните на нём следующие команды.

```bash
mkdir ~/.ssh
chmod 700 ~/.ssh
```
Теперь на компьютере, на котором мы создавали нашу пару ключей, выполните команду, которая скопирует публичный ключ на удалённый сервер, в каталог `~/.ssh`.

```powershell
scp c:\path_to_file\.ssh\id_rsa.pub username@servername:~/.ssh/username_rsa.pub
```
Затем возвращаемся на удалённый сервер и выполняем следующие команды.

```bash
cd ~/.ssh
cat username_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chown $USER:$USER ~/.ssh -R
```

Теперь нам необходимо правильно настроить SSH на сервере. Для этого нужно отредактировать `/etc/ssh/sshd_config` следующим образом.

* RSAAuthentication yes
* PasswordAuthentication no

Для вступления изменений в силу перезапустите sshd:

```bash
sudo service ssh restart
```

Для CentOS

```bash
sudo service sshd restart
```

Теперь можно перелегиниться на сервер. В этот раз вместо пароля будет использоваться публичный ключ.

![assets/images/set-up-ssh-with-public-key/2.jpg](/assets/images/set_up_ssh_with_public_key/2.jpg)

</div>

<div data-lang="en" markdown="1">
***Using SSH public key authentication to connect to a remote system is a reliable and more secure alternative to logging in with an account password or a passphrase. SSH public key authentication is based on asymmetric cryptography that generates a key pair: one key is “private” and the other is “public”. You keep the private key secret on the computer you use to connect to the remote system. The public key can be shared with anyone without compromising the private key; you store it on the remote system in `.ssh/authorized_keys`.***

> I recommend reading [SSH: The Basics]({% post_url 2019-05-06-ssh base %}) first.

# For the impatient

Here is the general approach to setting up SSH public key authentication.

Generate a key pair (how to do it is explained below). You will use the private key on the client for SSH connections. Copy the public key to the remote server and add it to the authorized keys store (`~/.ssh/authorized_keys`).

> IMPORTANT: if you don't set permissions (`chmod 600`) and ownership (`chown`) for `authorized_keys`, authentication will not work. `sshd` enforces this. This article shows the correct commands.

After generating and placing the keys, edit `sshd_config` on the server: disable password authentication so that only keys are used. Also (optional, but recommended) disable PAM and disallow SSH login as root.

# Full command list

```bash
ssh username@servername

mkdir ~/.ssh
chmod 700 ~/.ssh

scp c:\path_to_file\.ssh\id_rsa.pub username@servername:~/.ssh/username_rsa.pub

cd ~/.ssh
cat username_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chown $USER:$USER ~/.ssh -R

`/etc/ssh/sshd_config`
RSAAuthentication yes
PasswordAuthentication no

sudo service sshd restart
```

# Now in order

> You need OpenSSH installed. For Windows users: [OpenSSH was added to Windows](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview) in late 2018 and is included in Windows 10 and Windows Server 2019.

## Generate a key pair

On the computer you will connect from, generate a key pair (public `id_rsa.pub` / private `id_rsa`) by running:

```
ssh-keygen -t rsa -b 4096
```

The tool will ask for a private key file name (default: `id_rsa`). Press Enter to accept the default.

Then it will ask for a passphrase. You can skip it by pressing Enter, but keep in mind that anyone who obtains your private key file will be able to use it. If you set a passphrase, you will be prompted for it each time the private key is used. I recommend setting a passphrase to protect your private key.

After you confirm the passphrase, the tool generates the key pair and saves it under `~/.ssh`. Example output is shown in the screenshot.

![assets/images/set-up-ssh-with-public-key/1.jpg](/assets/images/set_up_ssh_with_public_key/1.jpg)

## Copy the public key to the server

After generating the keys, you need to copy the public key to the server you want to connect to.

On *nix systems, you can use `ssh-copy-id` (included with OpenSSH). It copies the key and configures it automatically:

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub remote_user@remote_host
```

> IMPORTANT: copy only the public key! Never copy your private key. It must always stay with you.

Unfortunately, `ssh-copy-id` is not included in [OpenSSH for Windows](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview). So here is a universal method that works in both cases.

First, connect to the remote server you want to authenticate to using a public key:

```powershell
ssh username@servername
```

If the server doesn't have the `~/.ssh` directory yet, create it:

```bash
mkdir ~/.ssh
chmod 700 ~/.ssh
```

Now, on the computer where you generated the key pair, copy the public key to the remote server into `~/.ssh`:

```powershell
scp c:\path_to_file\.ssh\id_rsa.pub username@servername:~/.ssh/username_rsa.pub
```

Then go back to the remote server and run:

```bash
cd ~/.ssh
cat username_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chown $USER:$USER ~/.ssh -R
```

Now configure SSH on the server. Edit `/etc/ssh/sshd_config` and set:

* RSAAuthentication yes
* PasswordAuthentication no

Restart SSH for changes to take effect:

```bash
sudo service ssh restart
```

On CentOS:

```bash
sudo service sshd restart
```

Now you can reconnect to the server. This time, the public key will be used instead of a password.

![assets/images/set-up-ssh-with-public-key/2.jpg](/assets/images/set_up_ssh_with_public_key/2.jpg)
</div>
