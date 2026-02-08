---
layout: post
title:  "Базовые сведения о безопасности в Windows "
title_en: "Basic Windows Security Concepts"
categories: [ Администрирование ]
tags: [microsoft, security]
image: assets\images\base_windows_security\0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
 В безопасности, на самом базовом уровне, всё сводится к *субъектам* и *объектам*. `Объект` - это то, что вы защищаете. `Субъект` - это то, от кого вы защищаете. Субъекты и объекты используются в аутентификации (authentication) - проверка кто вы; авторизации (authorization) - предоставление доступа к чему-либо и аудите (auditing) - отслеживание, кто получил доступ. Примером субъекта - служит пользователь. Объектом - файл.

Существует такое понятие как принципал безопасности (security principal). В книге Windows Server 2008 Security Resource Kit, от Microsoft Press, даётся такое определение: A security principal is anything that can be assigned a security identifier (SID) and that can be given permission to access something (Принципал безопасности - это всё, чему может быть назначен SID и предоставлены права доступа к чему-либо).
 В Windows принципалами безопасности являются Пользователи (Users), Компьютеры (Computers) и Группы (Groups). А начиная с Windows Vista принципалом безопасности так же является Служба (Service), которая теперь тоже имеет SID.

**SID** - (Security ID, идентификатор безопасности)
Числовое представление принципала безопасности.

**Access Control List (ACL)** - Список контроля доступа (ACL) - Это список записей управления доступом (access control entries, ACE). Каждый ACE в ACL идентифицирует доверенное лицо (trustee) и указывает права доступа, разрешенные или запрещенные для этого доверенного лица (trustee). Дескриптор безопасности для защищаемого объекта может содержать два типа ACL: DACL и SACL.

**SACL** - System Access Control List
Содержит ACE используемые механизмом логирования событий

**DACL** - Discretionary Access Control List
Список избирательного управления доступом. Используется для управление доступом субъектов к объектам на основе списков управления доступом или матрицы доступа. Состоит из набора ACE.

**ACE** - Access Control Entries
Запись управления доступом (ACE) является элементом в списке управления доступом (ACL). ACL может иметь ноль или более ACE. Каждый ACE контролирует или отслеживает доступ к объекту определенным доверенным лицом (субъектом).

![base windows security](\assets\images\base_windows_security\1.png)
</div>

<div data-lang="en" markdown="1">
At the most basic level, security boils down to *subjects* and *objects*. An `object` is what you protect. A `subject` is who you protect it from. Subjects and objects are used in:

- authentication — verifying who you are
- authorization — granting access to something
- auditing — tracking who accessed what

An example of a subject is a user. An example of an object is a file.

There is also the concept of a security principal. In *Windows Server 2008 Security Resource Kit* (Microsoft Press), it is defined as: “A security principal is anything that can be assigned a security identifier (SID) and that can be given permission to access something.”

In Windows, security principals include Users, Computers, and Groups. Starting with Windows Vista, a Service is also a security principal (services have SIDs too).

**SID** (Security Identifier)
The numeric identifier of a security principal.

**Access Control List (ACL)**
An ACL is a list of Access Control Entries (ACE). Each ACE identifies a trustee and specifies the access rights allowed or denied for that trustee. A security descriptor for a protected object can contain two types of ACLs: DACL and SACL.

**SACL** (System Access Control List)
Contains ACEs used by the event logging/auditing mechanism.

**DACL** (Discretionary Access Control List)
Used to control access from subjects to objects based on access control entries (or an access matrix). Consists of a set of ACEs.

**ACE** (Access Control Entry)
An ACE is an element in an ACL. An ACL can have zero or more ACEs. Each ACE controls or audits access to an object for a specific trustee (subject).

![base windows security](\assets\images\base_windows_security\1.png)
</div>
