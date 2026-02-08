---
layout: post
title:  "Установить автоответ для почтового ящика в Exchange через Powershell"
title_en: "Set Exchange Mailbox Automatic Replies via PowerShell"
categories: [ Администрирование ]
tags: [ Exchange ]
image: assets/images/Set-MailboxAutoreply/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Часто пользователи уезжают и забывают установить автоответ на своём почтовом ящике. Вот простой способ, как это можно сделать за него, используя Exchange Management Shell.***

Всё очень просто делается при помощи следующей команды:

`Set-MailboxAutoReplyConfiguration`

При помощи неё Вы можете включить или выключить автоответ для почтового ящика, установить период действия автоответа, а так же определить разный текст для внешних и внутренних получателей. Вот пример команды:

```powershell
Set-MailboxAutoReplyConfiguration -Identity mdanshin -AutoReplyState Enabled -InternalMessage "Автоответ для внутренних получателей" -ExternalMessage "Автоответ для внешних получателей"
```

где:
- Identity - это имя почтового ящика
- AutoReplyState - включить (Enabled), выключить (Disabled) или задать время действия (Scheduled)
- InternalMessage - Автоответ для внутренних получателей
- ExternalMessage - Автоответ для внешних получателей

Если в примере выше, вместо `-AutoReplyState Enabled` написать:

`-AutoReplyState Scheduled -StartTime "7/10/2020 08:00:00" -EndTime "7/15/2020 17:00:00"`

то можно задать время действия автоответа.
</div>

<div data-lang="en" markdown="1">
***Users often go on vacation and forget to enable automatic replies on their mailbox. Here's a simple way to do it for them using the Exchange Management Shell.***

You can do it with this cmdlet:

`Set-MailboxAutoReplyConfiguration`

It allows you to enable/disable automatic replies for a mailbox, set a scheduled time window, and configure different messages for internal and external recipients. Example:

```powershell
Set-MailboxAutoReplyConfiguration -Identity mdanshin -AutoReplyState Enabled -InternalMessage "Internal auto-reply" -ExternalMessage "External auto-reply"
```

Where:
- Identity — mailbox name
- AutoReplyState — enable (Enabled), disable (Disabled), or schedule (Scheduled)
- InternalMessage — auto-reply text for internal recipients
- ExternalMessage — auto-reply text for external recipients

If you replace `-AutoReplyState Enabled` with:

`-AutoReplyState Scheduled -StartTime "7/10/2020 08:00:00" -EndTime "7/15/2020 17:00:00"`

you can configure a schedule for automatic replies.
</div>
