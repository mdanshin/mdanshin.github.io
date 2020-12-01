---
layout: post
title:  "Установить автоответ для почтового ящика в Exchange через Powershell"
categories: [ Администрирование ]
tags: [ Exchange ]
image: assets/images/Set-MailboxAutoreply/0.jpg
author: Mikhail
---
***Часто пользователи уезжают и забывают установить автоответ на своём почтовом ящике. Вот простой способ, как это можно сделать за него, используя Exchange Management Shell.***

Всё очень просто делается при помощи команды `Set-MailboxAutoReplyConfiguration`. При помощи неё Вы можете включить или выключить автоответ для почтового ящика, установить период действия автоответа, а так же определить разный текст для внешних и внутренних получателей. Вот пример команды:

Set-MailboxAutoReplyConfiguration -Identity mdanshin -AutoReplyState Enabled -InternalMessage "Автоответ для внутренних получателей" -ExternalMessage "Автоответ для внешних получателей"

Если в примере выше, вместо `-AutoReplyState Enabled` написать `-AutoReplyState Scheduled -StartTime "7/10/2020 08:00:00" -EndTime "7/15/2020 17:00:00"`, то можно задать время действия автоответа.
