---
layout: post
title:  "Duplicate Message Detection. Решаем проблему недоставки сообщений."
categories: [ Администрирование ]
tags: [ Exchange ]
image: assets/images/duplicate-message-detection/0.jpg
author: Mikhail
---
***Сегодня коллега разбирался с недоставкой писем, а я узнал про механизм, на который раньше не обращал внимание. Оказалось, что призванный избавить нас от дубликатов, в некоторых случаях, он сам может стать проблемой.***

Пользователь пожаловался, что не получил письмо от адресата, с которым вёл переписку. Одно письмо пришло, а второе нет. Стали проверять и увидели в `message tracking log`, что от данного отправителя есть несколько записей с *EventId:* `DUPLICATEDELIVER`. 

![duplicate-message-detection/1.png](/assets/images/duplicate-message-detection/1.png)

В документации по [Message Tracking](https://docs.microsoft.com/en-us/exchange/mail-flow/transport-logs/message-tracking?view=exchserver-2019#event-types-in-the-message-tracking-log) даётся следующее описание этого события.

>Сообщение было доставлено получателю повторно. Повторная доставка сообщений может происходить в том случае, если получатель входит в несколько вложенных групп рассылки. Information Store  обнаруживает и удаляет дубликаты сообщений.

То есть мы имеем дело с неким механизмом, который отслеживает дубли и удаляет их. В нашем случае мы имели дело с разными, по содержанию, письмами, доставленными в разное время. Но одно письмо было доставлено получателю, а другое нет. Возникает вопрос - что это за механизм и как он работает, как определяет, что сообщение является дублем?

На просторах Интернет удалось найти [старый пост](https://techcommunity.microsoft.com/t5/Exchange-Team-Blog/How-does-duplicate-message-detection-work/ba-p/610180), датированный аж 2004 годом, в блоге Exchange Team (блог разработчиков Exchange Server). В этом посте рассказывается про некий механизм, под названием `Duplicate Detection`. 

Так же в [документации по Exchange Server 2007](https://docs.microsoft.com/en-us/previous-versions/office/exchange-server-2007/dd577073(v=exchg.80)) упоминается механизм `Duplicate Message Detection`. Остальные посты, попадавшиеся в Интернет, в разной степени цитируют эти два первоисточника. 

Из этой скудной, устаревшей информации стало понятно, что `Duplicate Detection` отслеживает сообщения и по полю [InternetMessageId](https://docs.microsoft.com/en-us/exchange/client-developer/web-service-reference/internetmessageid) вычисляет дубликаты. В случае, если ему, в течении часа (по умолчанию), встречаются письма с одинаковым ID, повторное письмо удаляется.

Согласно всё той же [документации](https://docs.microsoft.com/en-us/exchange/mail-flow/transport-logs/search-message-tracking-logs?view=exchserver-2019#use-the-exchange-management-shell-to-search-the-message-tracking-logs-for-message-entries-on-multiple-servers) в Message Tracking Log поле `InternetMessageId` называется `MessageId`.

Этот очень полезный механизм призван оградить получателей сообщений от дублей, в случае если он входит одновременно в несколько вложенных групп или письмо отправляется на группу и ему напрямую.

Но в нашем кейсе мы получили обратный эффект. Дело в том, что в письме, которое не было доставлено получателю, поле MessageId содержало значение `$null`.

![duplicate-message-detection/2.png](/assets/images/duplicate-message-detection/2.png)

Это значение содержалось во всех письмах от данного отправителя. Поэтому все письма, доставленные в этот час, считались дубликатами и удалялись. С одной стороны кейс решён, причина понятна, проблема на стороне отправителя. С другой стороны непонятно, откуда в поле MessageId такое странное значение - $null. Я предположил, что возможно мы имеем дело либо с некорректно работающей системой отправителя, либо это какой-то элемент безопасности, который удаляет часть данных, перед отправкой. Если кто-то знает, что это такое, то прошу написать в комментариях к этому посту.

Настроить поведение Duplicate Message Detection можно изменив значение в реестре. Ниже привожу выжимку из документации.

```
To edit the "DeliveredTo Expiration in Hours" registry value

    Start Registry Editor.

    Expand the following subkey:

    HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\MSExchangeIS\<Server_Name>\Private-<GUID>

    Right-click Private-<GUID>, point to New, and then click DWORD Value.

    Type DeliveredTo Expiration in Hours, and then press ENTER to name the new value.

    Right-click DeliveredTo Expiration in Hours, and then click Modify.

    In the Value data box, type the time, in hours, that you want to keep received message information, and then click OK.

    Expand the following subkey:

    HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\MSExchangeIS\<Server_Name>\Public-<GUID>

    Right-click Public-<GUID>, point to New, and then click DWORD Value.

    Type DeliveredTo Expiration in Hours, and then press ENTER to name the new value.

    Right-click DeliveredTo Expiration in Hours, and then click Modify.

    In the Value data box, type the time, in hours, to keep information on received messages before it is deleted, and then click OK.

    Exit Registry Editor.

To edit the "DeliveredTo Cleanup Interval in Seconds" registry value

    Start Registry editor.

    Expand the following subkey:

    HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\MSExchangeIS\<Server Name>\Private-<GUID>

    Right-click Private-<GUID>, point to New, and then click DWORD Value.

    Type DeliveredTo Cleanup Interval in Seconds, and then press ENTER to name the new value.

    Right-click DeliveredTo Cleanup Interval in Seconds, and then click Modify.

    In the Value data box, type the interval, in seconds, between each execution of DeliveredTo cleanup, and then click OK.

    Expand the following subkey:

    HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\MSExchangeIS\<Server Name>\Public<GUID>

    Right-click Public-<GUID>, point to New, and then click DWORD Value.

    Type DeliveredTo Cleanup Interval in Seconds, and then press ENTER to name the new value.

    Right-click DeliveredTo Cleanup Interval in Seconds, and then click Modify.

    In the Value data box, type the interval, in seconds, that you want to occur between each execution of DeliveredTo cleanup, and then click OK.

    Close Registry Editor.
```