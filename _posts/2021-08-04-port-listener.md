---
layout: post
title:  "Открыть порт на прослушивание"
title_en: "Listen on a Port (Quick Connectivity Test)"
categories: [ Администрирование ]
tags: [ Powershell ]
image: assets/images/port-listener/0.jpg
author: Mikhail
---


<div data-lang="ru" markdown="1">
***Иногда бывает так, что на сервере ещё нет службы, которая бы слушала определённый порт, но нужно проверить, что доступ к нему открыт. Убедиться, что правильно настроен firewall, сетевое оборудование и т.д.. Или бывает так, что служба есть, но не понятно, то ли доступ к порту закрыт, то ли служба не работает.***

Для решения этой задачи, нужен какой-то способ, какая-то программа, которую можно запустить и сказать ей слушать определённый порт. Чтобы проверить тем же telnet-ом, что порт открыт.

Я не нашёл ничего лучше, чем использовать Powershell. Благо делается это элементарно.

```powershell
# Сначала мы создаём слушателя (listener) и указываем, какой порт будем слушать.
# В данном случае мы указали 443-й порт.
$Listener = [System.Net.Sockets.TcpListener]443;

# Затем запускаем его.
# Он будет слушать порт и мы сможем подключиться к нему через telnet.
$Listener.Start();

# Чтобы закрыть порт останавливаем listener
$Listener.Stop();
```

Вот и всё! А как Вы решаете эти задачи? Напишите в комментариях.
</div>

<div data-lang="en" markdown="1">
***Sometimes a server doesn't have any service listening on a specific port yet, but you still need to verify that the port is reachable (firewall/network rules are correct, etc.). Or the service exists, but it's unclear whether the port is blocked or the service is down.***

To solve this, you need some simple tool that you can run and tell it to listen on a specific port so you can test connectivity (for example, with telnet).

I haven't found anything simpler than using PowerShell — it's straightforward:

```powershell
# Create a listener and specify the port.
# Here we use port 443.
$Listener = [System.Net.Sockets.TcpListener]443;

# Start listening.
$Listener.Start();

# Stop the listener (close the port).
$Listener.Stop();
```

That's it! How do you handle tasks like this? Share in the comments.
</div>
