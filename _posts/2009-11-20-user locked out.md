---
layout: post
title:  "Решаем проблему внезапной блокировки учетной записи "
title_en: "Troubleshooting Unexpected Account Lockouts"
categories: [ Администрирование ]
tags: [ Active Directory ]
image: assets/images/user-locked-out/0.png
author: Mikhail
permalink: /2009/11/blog-post_20.html
---

<div data-lang="ru" markdown="1">
***Иногда возникают ситуации когда, при попытке входа в компьютер, пользователь получает сообщение `Unable to log you on because your account has been locked out, please contact your administrator.`***

Это уведомление, говорит о том, что акаунт заблокирован (locked). Это не тоже самое, что «отключен» (disabled). В первом случае учетная запись нейтрализуется на некоторое время, и это происходит автоматически, без участия администратора. А во втором отключается системным администратором вручную.

Оказалось, что данная тема актуальна до сих пор. И мне постоянно приходиться отвечать на вопросы, не только начинающих, но и опытных администраторов.

Сообщение о блокировке учетной записи выглядит как показано на рисунке (см. рисунок 1).

![user-locked-out/1.png](\assets\images\user-locked-out/1.png)
*Рисунок 1 - Сообщение об ошибке, которое получает пользователь с заблокированной учетной записью*

Природа этого явления заключается в том, что было предпринято несколько попыток ввода неверного пароля. В домене вы можете настроить групповую политику, которая будет регламентировать количество попыток ввода паролей и время, на которое акаунт будет заблокирован. В случае если правильный пароль не будет введен, то акаунт будет заблокирован, а пользователь получит уведомление, как показано выше, на рисунке 1.

Для того, чтобы определить политику запустите Group Policy Management Consoleю.

По умолчанию политика выглядит так, как показано на рисунке (см. Рисунок 2):

!["user-locked-out/2.png"](\assets\images\user-locked-out/2.png)
*Рисунок 2 - Политика Account Lockut Policy по умолчания*

Предположим, что вы хотите, ограничить количество неправильных вводов пароля пятью попытками, а потом блокировать акаунт на 30 минут. Для этого вам нужно отредактировать Default Domain Policy (помним, что политики паролей в доменах Win 2003 применяются к уровню ДОМЕНА)- Выберите Computer Configuration -> Windows Settings -> Security Settings -> Account Policy -> Account Lockout Policy. Затем отредактируйте параметры групповой политики. Значение параметрп Account lockout duration - определяет время, на которое акаунт будет заблокирован. Account lockout threshold – определяет количество попыток ввода, после которого акаунт будет заблокирован. И наконец последний параметр - Reset account lockout counter after – определяет время, по истечению которого будет сброшен счетчик попыток. Например, если вы определили, что после пяти попыток акаунт будет заблокирован, а сделали только две попытки входа, а потом, например ушли пить чай, то по истечении этого установленного времени счетчик обнулиться и у вас опять будет пять попыток.

Попробуйте изменить любой из параметров и система предложит вам оптимальные, с ее точки зрения, значения остальных параметров (см. Рисунок 3).

!["user-locked-out/3.png"](\assets\images\user-locked-out/3.png)
*Рисунок 3 - Значения, которые предлагает система*

Вы можете согласиться, а потом, при необходимости, изменить их по совему усморению. Например, если вы установите значение параметра Account lockout threshold соответствющее 5, а затем нажмете OK, то система предложит вам 30 минутное значение для остальных параметров. Как показано на рисунке 3.

После того, как политика будет определена Вы можете известить ваших пользователей о том, что после того как они введут неверный пароль несколько раз его учетная запись будет «заблокирована» (locked). Что бы снять блокировку нужно снять галочку «Account is locked out» в свойствах пользователя, как показано на рисунке 4.

!["user-locked-out/4.png"](\assets\images\user-locked-out/4.png)
*Рисунок 4 - «Account is locked out» в свойствах пользователя*

Иногда блокировка акаунта происходит без видимых причин. И не смотря на то, что блокировка так просто снимается, в некоторых случаях, это не решает проблему. Через некоторое время пользователь может обнаружить, что его учетная запись опять заблокирована. Причин тому может быть несколько и я опишу их далее. Иногда определить причины бывает довольно сложно. Основная сложность в определении компьютера, с которого происходят попытки ввода неверных паролей.

В журнале безопасности, для отслеживания подобных событий, существует запись с кодом 680, от источника Security, категории Account Logon.

!["user-locked-out/5.png"](\assets\images\user-locked-out/5.png)
*Рисунок 5 - Вид сообщения из Журнала Событий*

В  этой записи (см. рисунок 5) показана информация о том в какое время и с какого компьютера была предпринята попытка ввода неверного пароля. Конечно есть способ реагировать на событие немедленно. Я писал о нем в статье «Как отреагировать на событие». Если вы отслеживаете появления подобных записей и своевременно реагируете на них, то определить источник проблемы будет просто. Но, как правило, таких записей может быть ОГРОМНОЕ множество. И никто не реагирует на них немедленно, а расследует инцеденты потом. Пользователи часто ошибаются с вводом пароля. И не существует простого способа определить точное время того, когда акаунт был заблокирован. Как правило мы узнаем об этом через некоторое время, от самого пользователя.

В решении проблемы нам может помочь утилита Microsoft Account Lockout Status, которая входит в пакет утилит Account Lockout and Management Tools. Получить этот пакет можно на сайте Microsoft. Утилита была выпущена еще в 2003 году. Удивительно, что спустя много лет она все еще востребована.

Принцип работы утилиты заключается в том, что она анализирует журналы событий на всех контроллерах домена в сети и определяет на каком контроллере произошла блокировка, в какое время, а так же предоставляет дополнительную информацию, которая может помочь нам в расследовании. Так же утилита может помочь снять блокировку с учетной записи и многое другое.

Чтобы приступить к работе с утилитой вам нужно запустиь файл LockoutStatus.exe. Когда программа запуститься выберите меню File, а затем Select Target. В появившемся диалоговом окне,

!["user-locked-out/6.png"](\assets\images\user-locked-out/6.png)
*Рисунок 6 - Окно ввода данных о пользователе, учетная запись которого блокируется>*

в поле Target User Name, введите имя пользователя, у которого возникает проблема с учетной записью, а в поле Target Domain Name, введите имя домена в котором находиться учетная запись пользователя.

Обратите внимание на галочку - «Use Alternate Credentials». В случае если программа запущена с правами обычного пользователя то установив эту галочку вы можете запустить проверку от имени другого пользователя, входящего в группу Администраторы домена. Если же вы запустили программу от имени пользователя с правами доменного администратора, то устанавливать галку не нужно.

После не продолжительного процесса сбора информации вы увидите результаты работ, в котором будет отражено на каком контроллере домена была заблокирована запись, в какое время, сколько попыток ввода неверного пароля было предпринято и т.д. Все это показано на рисунке (см. Рисунок 7).

!["user-locked-out/7.png"](\assets\images\user-locked-out/7.png)
*Рисунок 7 - результат работы программы*

Из меню этой же программы вы можете снять блокировку с учетной записи. Для этого выберите контроллер домена, нажмите правой кнопкой, и в контекстном меню нажмите Unlock Account (см. Рисунок 8).

!["user-locked-out/8.png"](\assets\images\user-locked-out/8.png)
*Рисунок 8 - Снимаем блокировку с учетной записи>*

Это изменение моментально будет реплицировано на все контроллеры домена, и пользователь может тут же повторить попытку входа. Если пользователь забыл пароль, то выбрав Reset User’s Password вы можете его сменить.

Иногда, возникают ситуации, когда после удачного входа в систему проблема возвращается. Пользователь не может получить доступ к сетевому ресурсу, не может повтороно войти в систему и т.д. Причин такому поведению может быть несколько. Я приведу лишь несколько самых популярных из них. Но помните, что универсального решения нет и каждый случай нужно расследовать индивидуально.

Например в сети может действовать злоумышленник, который пытается подобрать пароль от учетной записи пользователя. Второй распространённый вариант это использование одной учетной записи несколькими пользователями одновременно. В этом случае кто-то может постоянно вводить неверный пароль, тем самым мешать работе остальных пользователей. Начиная расследование, первое, что мы должны установить – это точное время происшествия. Установив время, мы легко сможем найти запись в журнале безопасности и понять с какого компьютера в сети производились попытки ввода неверного пароля. Как видно на рисунке 7 программа сообщает нам эти сведения. Щелкнув правой кнопки мыши по контроллеру домена и выбрав в контекстном меню Open Event Viewer (Открыть Журнал Событий). Так как мы теперь знаем точное время, когда была попытка входа, которая привела к блокировку учетной записи, мы без труда сможем найти событие и определить с какого компьютера было произведено действие повлекшее блокировку. Проблема решена – виновные наказаны!

Но кроме человеческого фактора есть еще и другие причины. Пожалуй самая распространенная причина в том, что когда вы настраиваете Назначенное Задание, которое выполняется от имени пользователя, а затем меняете пароль этого пользовател. Ваше задание все еще пытается выполнить вход со старым паролем. Естественно у него это не получается и акаунт блокируется.

Надеюсь, что после прочтения этой статьи у вас появилась ясность чем может быть вызвана проблема и как ее решить.
</div>

<div data-lang="en" markdown="1">
***Sometimes, when a user tries to log on to a computer, they get the message: `Unable to log you on because your account has been locked out, please contact your administrator.`***

This notification means the account is **locked**. This is not the same as **disabled**. A locked account is automatically “neutralized” for a period of time without administrator involvement. A disabled account is turned off manually by an administrator.

It turns out this topic is still relevant, and I still have to answer questions about it - from both new and experienced admins.

The lockout message looks like this (Figure 1):

![user-locked-out/1.png](\assets\images\user-locked-out/1.png)
*Figure 1 — Error message shown for a locked account*

The usual cause is multiple incorrect password attempts. In a domain, you can configure a Group Policy that defines how many failed attempts are allowed and how long the account is locked. If the correct password isn't entered, the account gets locked and the user sees the notification shown above.

To view or configure the policy, open the Group Policy Management Console.

By default the policy looks like this (Figure 2):

!["user-locked-out/2.png"](\assets\images\user-locked-out/2.png)
*Figure 2 — Default Account Lockout Policy*

Suppose you want to limit the number of incorrect password attempts to 5 and then lock the account for 30 minutes. To do that, edit the **Default Domain Policy** (remember: in Windows 2003 domains, password policies apply at the domain level). Go to:

`Computer Configuration -> Windows Settings -> Security Settings -> Account Policies -> Account Lockout Policy`

Then adjust the settings:

- **Account lockout duration** — how long the account remains locked
- **Account lockout threshold** — how many failed attempts trigger a lockout
- **Reset account lockout counter after** — how long until the failed-attempt counter is reset

For example: if you set the threshold to 5, but the user makes only two failed attempts and then stops (goes for tea), after the “reset counter” time expires the counter is reset and the user again has 5 attempts.

Try changing any parameter and Windows will suggest “optimal” values for the other settings (Figure 3).

!["user-locked-out/3.png"](\assets\images\user-locked-out/3.png)
*Figure 3 — Values suggested by the system*

You can accept them and then tweak as needed. For example, if you set **Account lockout threshold** to 5 and click OK, Windows often suggests 30 minutes for the other parameters (as shown in Figure 3).

After the policy is configured, you can inform users that entering a wrong password multiple times will lock their account. To unlock it, uncheck **Account is locked out** in the user properties (Figure 4).

!["user-locked-out/4.png"](\assets\images\user-locked-out/4.png)
*Figure 4 — “Account is locked out” checkbox in user properties*

Sometimes an account gets locked without an obvious reason. Even though unlocking is easy, in some cases it doesn't solve the underlying issue and the account gets locked again later. There can be many reasons. Often the hardest part is finding the computer from which the bad password attempts originate.

In the Security event log there is an event (in older systems) with code 680 from source Security / category Account Logon:

!["user-locked-out/5.png"](\assets\images\user-locked-out/5.png)
*Figure 5 — Example event log entry*

The event (Figure 5) contains info about when and from which computer a bad password attempt was made. Of course, you could react immediately (I wrote about that in a separate article), but in practice there can be a huge number of such events. Usually no one reacts instantly - incidents are investigated later, and you often learn about the lockout from the user after some time.

The Microsoft **Account Lockout Status** utility can help. It is part of the **Account Lockout and Management Tools** package (available from Microsoft). The tool was released back in 2003 — surprisingly, it is still useful.

The utility analyzes event logs on all domain controllers and determines on which DC the lockout occurred, at what time, and shows additional information to help investigate the incident. It can also unlock an account and more.

To start, run `LockoutStatus.exe`. In the program, choose **File** -> **Select Target**. In the dialog window (Figure 6):

!["user-locked-out/6.png"](\assets\images\user-locked-out/6.png)
*Figure 6 — User/domain input dialog*

Enter the affected username in **Target User Name** and the domain name in **Target Domain Name**.

Note the checkbox **Use Alternate Credentials**. If you run the tool as a regular user, check it and run the query using another account (e.g., a Domain Admin). If you're already running as a domain admin, you don't need it.

After a short data collection process, you'll see results showing which DC locked the account, when it happened, how many bad password attempts were made, etc. (Figure 7).

!["user-locked-out/7.png"](\assets\images\user-locked-out/7.png)
*Figure 7 — Tool output*

From the tool you can also unlock the account. Select a domain controller, right-click, and choose **Unlock Account** (Figure 8).

!["user-locked-out/8.png"](\assets\images\user-locked-out/8.png)
*Figure 8 — Unlocking the account*

This change is replicated to all domain controllers immediately, and the user can try logging in again right away. If the user forgot the password, you can also reset it via **Reset User’s Password**.

Sometimes the problem returns even after a successful logon: the user can't access network resources, can't log on again, etc. There can be several reasons. I'll list a few common ones, but remember: there is no universal solution, and each case must be investigated individually.

For example, there might be an attacker in the network trying to guess a user's password. Another common case is one account being used by multiple users at the same time: someone keeps entering a wrong password and locks the account for everyone.

When you start an investigation, the first thing to establish is the exact time of the lockout. With the time known, you can easily find the event and determine the source computer. As shown in Figure 7, the tool provides these details. You can right-click a domain controller and choose **Open Event Viewer**. Since you now know the exact time of the attempt that caused the lockout, you can find the event and identify the computer that triggered it.

But besides human factors there are other causes. Probably the most common is Scheduled Tasks running under a user's account: if you configure a scheduled task to run as a user and later change that user's password, the task may keep trying to log on with the old password. Naturally it fails — and the account gets locked.

I hope this article makes it clearer what can cause account lockouts and how to investigate them.
</div>
