---
layout: post
title:  "LVM - коротко о главном"
title_en: "LVM: Quick Start"
categories: [ Администрирование ]
tags: [ Linux, LVM, CentOS ]
image: assets/images/LVM-quick-start/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Из этой статьи вы узнаете о том, как создавать тома LVM и как с ними работать. В ней дано краткое описание того, что такое LVM и рассмотрены основные приёмы работы на практическом примере. По ходу статьи мы в ручную, с нуля, разметим диск виртуальной машины для установки операционной системы CentOS 8.***

>В конце статьи вы найдёте видео, в котором показаны все действия, которые я описываю в статье, а так же финальный шаг - установка ОС.

### Что такое LVM

LVM - это менеджер логических томов (англ. logical volume manager) — подсистема, позволяющая использовать разные области одного или нескольких жёстких дисков как один логический том. Работа LVM основана на Device Mapper - это подсистема ядра Linux, которая позволяет создавать виртуальные блочные устройства. В совокупности всё это позволяет нам абстрагироватся от физических устройств и устаревших разделов жестких дисков и создать удобную логическую структуру томов, а так же:

* объединять их в группы
* изменять размер
* перемещать данные
* делать снапшоты
* зеркалировать
* шифоровать

... и многое другое. И всё это не останавливая работу системы.

>Если после прочтения этой вводной статьи Вы захотите разобраться во всех аспектах LVM, то Вам будет полезно [полное руководство по LVM от Red Hat](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/logical_volume_manager_administration/index). Все свои знания о LVM я почерпнул из этого источника. Моя статься содержит выдержки из него.

Чтобы проиллюстрировать работу LVM приведу одну простую картинку.

![LVM-quick-start/1.png](/assets/images/LVM-quick-start/1.png)

Ничего, если она покажется вам непонятной. После прочтения моей статьи вам станет всё ясно.

>Я исхожу из того, что вам уже приходилось размечать жёсткий диск на партиции, например утилитой fdisk или parted, и у вас есть понимание что это такое и для чего это нужно. И вы знаете, что такое точка монтирования, загрузочный раздел и т.п..

Во время установки ОС, разметку жесткого диска можно полностью отдать на откуп системы. Она сама сделает нужную конфигурацию на жёстком диски, создаст необходимые тома и точки монтирования. Но в целях обучения, мы сделаем это всё сами, на пустом жёстком диске. Для примера я буду использовать виртуальную машину под управлением VMware Workstation Player и операционную систему CentOS 8. Но всё тоже самое можно сделать из любого популярного дистрибутива Linux, используя любую систему виртуализации или на физическом оборудовании.

Создайте виртуальную машину и загрузитесь с установочного диска (ISO-образа). На первых же шагах установщика вызовите командную строку. Обычно, и в частности в CentOS, это делается комбинацией клавиш `Ctrl+Alt+F2`.

>ВНИМАНИЕ. ДАЛЬНЕЙШИЕ ВЫПОЛНЕНИЕ ИНСТРУКЦИЙ БУДЕТ ДЕСТРУКТИВНО ДЛЯ ДАННЫХ. ДЕЙСТВУЙТЕ С УМОМ!

Следующими командами можно увидеть какие блочные устройства доступны системе.

```bash
ls -l /dev/sd*
```

и

```bash
ls -l /dev/disk/by-id/
```

вывод этих команд показан на снимке и может отличаться в вашем случае

![LVM-quick-start/2.png](/assets/images/LVM-quick-start/2.png)

Для установки Linux на LVM том нам нужно иметь минимум 3 раздела:

1. Boot
2. Root
3. SWAP

Есть ряд причин, почему нельзя использовать LVM том в качестве загрузочного. Хотя это и работает, мы не будем так делать. Поэтому мы разобьём диск на две части - обычный раздел и LVM.

На скриншоте показана целевая конфигурация, которую мы создадим при помощи утилиты parted во время установки ОС.

![LVM-quick-start/8.png](/assets/images/LVM-quick-start/8.png)

Внутри LVM партиции мы создадим два логических тома root и SWAP.

Итак, загрузившись с диска и перейдя в консоль наберите команду parted. А в ней напечатай `p` и нажмите `Enter`. Так мы убедимся, что имеем дело с нужным нам устройством.

![LVM-quick-start/9.png](/assets/images/LVM-quick-start/9.png)

Далее последовательность ввода команд следующая

    mklabel
    msdos
    mkpart
    p
    xfs
    1049kB
    1075MB
    mkpart
    p
    ext4
    1075MB
    -1
    set 1 boot on
    set 1 lba off
    set 2 lvm on
    set 2 lba off
    p

в результате получим 2 партиции, как показано на скриншоте.

![LVM-quick-start/10.png](/assets/images/LVM-quick-start/10.png)

Выходим из `parted` набрав команду `quit` или `q`.

Обратите внимание на то, что теперь показывает команда `ls -l /dev/sd*`:

у нас появились устройства `sda1` и `sda2` - это и есть загрузочная и LVM партиции, соответственно.

![LVM-quick-start/11.png](/assets/images/LVM-quick-start/11.png)

Для создания структуры LVM мы должны создать `физический том`, создать `виртуальную группу` томов и в ней создать `логические тома`. Читайте дальше и всё сейчас поймёте.

### Физический том (Physical volume, PV)

Физический том - это раздел диска или весь диск. Создать физический том - означает пометить раздел (или диск) как используемый для структуры LVM. 

Если для физического тома используется целое дисковое устройство, на диске не должно быть таблицы разделов.

В нашем случае у нас для LVM используется устройство `/dev/sda2`. И мы собираемся использовать всё его пространство. Пометим его как устройство LVM - то есть создадим из него физический том LVM.

Выполняем команду для создания physical volume, указывая какой диск мы помечаем как устройство LVM:

```bash
pvcreate /dev/sda2
```

Чтобы увидеть созданный physical volume используйте команду pvdisplay.

![LVM-quick-start/12.png](/assets/images/LVM-quick-start/12.png)

### Группа томов (Volume Group, VG)

Физические тома объединяются в группы, что позволяет создать единое дисковое пространство, из которого будет выделяться место для логических томов.

В пределах группы пространство разделяется на блоки фиксированного размера — экстенты. Размер экстента является минимальным размером, который может быть выделен тому. На уровне физических томов используется понятие физических экстентов.

Логическому тому будут выделяться логические экстенты, размер которых равен размеру физических экстентов. То есть размер экстентов всегда один и тот же для всех логических томов в группе. Группа томов определяет соответствие логических экстентов физическим.

Когда физические тома используются для создания группы томов, ее дисковое пространство по умолчанию делится на экстенты размером 4 МБ. Этот размер является минимальным, на которую логический том может быть увеличен или уменьшен в размере. Большое количество экстентов не повлияет на производительность ввода-вывода логического тома.

Для создания группы томов используется следующая команда:

```bash
vgcreate vg0 /dev/sda2
```
где vg0 - это название группы.

И опять же, чтобы увидеть параметры созданной группы можно воспользоваться командой `vgdisplay`.

![LVM-quick-start/13.png](/assets/images/LVM-quick-start/13.png)

### Логический Том (Logical Volume, LV)

Существует три типа логических томов: линейные, с чередованием и зеркальные.

#### Линейный том
Объединяет несколько физических томов. Например, при наличии двух дисков размером 60 гигабайт можно создать логический том размером 120 гигабайт.

#### Том с чередованием
При записи данных в логический том файловая система размещает их в физических томах в его основе. Чередование позволяет повысить производительность при выполнении большого объема последовательных операций ввода-вывода.
При чередовании данные последовательно распределяются между заранее определенным числом физических томов, поэтому операции ввода и вывода могут выполняться параллельно. В некоторых случаях производительность даже может сравниться с линейной организацией.

#### Зеркальный том
Зеркало содержит устройства с идентичными копиями данных. При записи данных на одно устройство их копия также записывается на другое, что облегчает восстановление в случае выхода из строя одного из устройств. В случае сбоя одной составляющей зеркала логический том будет преобразован в линейный и продолжит работу.

Нам требуется создать два логических тома: `root` и `swap`.

Последовательно выполняем две команды:

```bash
lvcreate -L1G -n swap vg0
```
где `-L1G` - размер тома, `-n` имя тома, а `vg0` название ранее созданной группы, в которую мы помещаем том.

```bash
lvcreate -l 100%FREE -n root vg0
```

где `-l 100%FREE` означает, что мы занимаем всё оставшееся свободное место.

При этом создастся линейный том, а команда lvdisplay продемонстрирует нам параметры созданных томов.

![LVM-quick-start/14.png](/assets/images/LVM-quick-start/14.png)

Теперь мы сделали Всё, что необходимо для установки ОС. Мы создали две партиции - загрузочную и LVM. На LVM разместили логические тома swap и root, при этом объединили их одной группой. Можно возвращаться в установщик заканчивать инсталяцию ОС. Но сделать это нужно правильно. Читайте дальше как именно.

### Завершение установки ОС

Для возврата к установщику нажмите комбинацию клавиш `Ctrl+Alt+F6`, но в вашем случае консоли могут располагаться в другом порядке. Попробуйте другие комбинации начиная от F1. Дальнейшие действия плохо поддаются описанию в текстовом виде, поэтому я записал ролик, демонстрирующий весь процесс, описанный выше, а так же финальный этап установки.

<iframe width="560" height="315" src="https://www.youtube.com/embed/5TVakMra3qQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

В статье [Операции с файловой системой в Linux](https://danshin.ms/Linux-filesystem-operations) вы найдёте информацию о том, как добавлять диски в систему, как делать из них LVM тома без разбиения на партиции и использования parted. 

В дальнейших статьях я опишу как делать снапшоты и многое другое, что позволяет нам делать LVM.

На этом у меня всё, ставьте лайки, подписывайтесь на канал, жмите колокольчик! :)

</div>

<div data-lang="en" markdown="1">
***In this article you'll learn how to create LVM volumes and work with them. It includes a brief introduction to what LVM is and covers the core concepts with a practical example. Along the way, we will manually partition a disk from scratch to prepare it for installing CentOS 8.***

> At the end of the article you'll find a video that shows all steps described here, including the final step — OS installation.

### What is LVM?

LVM (Logical Volume Manager) is a subsystem that lets you treat multiple areas of one or more disks as a single logical storage pool. LVM is based on Linux Device Mapper, a kernel subsystem for creating virtual block devices.

In practice, LVM helps you abstract away physical devices and old-school disk partitions and build a convenient logical volume structure that lets you:

* group disks
* resize volumes
* move data
* create snapshots
* mirror
* encrypt

...and more — often without stopping the system.

> If after reading this intro you want to go deeper into LVM, the [Red Hat LVM Administration Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/logical_volume_manager_administration/index) is a great resource. Most of my LVM knowledge comes from it, and this post contains excerpts and practical notes.

To illustrate the LVM stack, here is a simple diagram:

![LVM-quick-start/1.png](/assets/images/LVM-quick-start/1.png)

Don't worry if it looks unclear — after the walkthrough it should make sense.

> I assume you've partitioned disks before (e.g., with `fdisk` or `parted`) and you understand concepts like mount points, boot partitions, etc.

During OS installation, you can let the installer partition disks automatically. But for learning purposes, we'll do it manually on an empty disk.

For the example I use a VM in VMware Workstation Player and CentOS 8, but you can do the same on most Linux distributions, with any virtualization system, or on physical hardware.

Create a VM and boot from the installation ISO. Early in the installer, open a shell. Typically (and in CentOS) you can do it with `Ctrl+Alt+F2`.

> WARNING: the steps below are destructive for data. Be careful.

Use these commands to see available block devices:

```bash
ls -l /dev/sd*
```

and:

```bash
ls -l /dev/disk/by-id/
```

The output is shown in the screenshot and may differ in your environment.

![LVM-quick-start/2.png](/assets/images/LVM-quick-start/2.png)

To install Linux on an LVM setup, we typically need at least 3 volumes:

1. Boot
2. Root
3. Swap

There are reasons why using an LVM volume as a boot partition is not ideal. While it can work, we won't do it here. We'll split the disk into a regular partition for boot and an LVM partition for everything else.

The screenshot below shows the target layout we will create using `parted` during installation.

![LVM-quick-start/8.png](/assets/images/LVM-quick-start/8.png)

Inside the LVM partition we will create two logical volumes: `root` and `swap`.

Boot from the ISO, open the console, run `parted`, then type `p` and press Enter to confirm you're working with the correct device.

![LVM-quick-start/9.png](/assets/images/LVM-quick-start/9.png)

Then enter the following command sequence:

    mklabel
    msdos
    mkpart
    p
    xfs
    1049kB
    1075MB
    mkpart
    p
    ext4
    1075MB
    -1
    set 1 boot on
    set 1 lba off
    set 2 lvm on
    set 2 lba off
    p

As a result you get two partitions like in the screenshot:

![LVM-quick-start/10.png](/assets/images/LVM-quick-start/10.png)

Exit `parted` with `quit` or `q`.

Now look at `ls -l /dev/sd*`: you should see `sda1` and `sda2` — boot and LVM partitions respectively.

![LVM-quick-start/11.png](/assets/images/LVM-quick-start/11.png)

To build an LVM structure we create a **Physical Volume**, then a **Volume Group**, and then **Logical Volumes**. Let's do it.

### Physical Volume (PV)

A physical volume is a disk partition or a whole disk marked for LVM use.

If you use an entire disk device as a PV, it must not have a partition table.

In our case, the LVM partition is `/dev/sda2` and we will use all of its space. Create a PV:

```bash
pvcreate /dev/sda2
```

To view the created PV, use `pvdisplay`.

![LVM-quick-start/12.png](/assets/images/LVM-quick-start/12.png)

### Volume Group (VG)

Physical volumes are combined into a volume group - a single storage pool from which logical volumes will be allocated.

Within a VG, space is split into fixed-size blocks called extents. The extent size is the minimal allocation unit for logical volumes. By default, the extent size is 4 MB.

Create a VG with:

```bash
vgcreate vg0 /dev/sda2
```

Where `vg0` is the VG name.

To view it, use `vgdisplay`.

![LVM-quick-start/13.png](/assets/images/LVM-quick-start/13.png)

### Logical Volume (LV)

There are three logical volume types: linear, striped, and mirrored.

#### Linear LV
Combines multiple PVs sequentially. For example, with two 60 GB disks you can create a 120 GB LV.

#### Striped LV
Data is distributed across PVs in stripes, which can improve sequential I/O performance by enabling parallel reads/writes.

#### Mirrored LV
Data is duplicated across devices. Writes go to multiple copies, which helps recovery if one device fails.

We need two logical volumes: `root` and `swap`.

Run these commands:

```bash
lvcreate -L1G -n swap vg0
```

Where `-L1G` is size, `-n` is LV name, and `vg0` is the volume group.

```bash
lvcreate -l 100%FREE -n root vg0
```

Where `-l 100%FREE` means: use all remaining free space.

This creates linear LVs. `lvdisplay` shows their parameters.

![LVM-quick-start/14.png](/assets/images/LVM-quick-start/14.png)

At this point we created everything needed for OS installation: a boot partition, an LVM partition, and inside LVM — `swap` and `root` logical volumes in a single volume group.

### Finish OS installation

To return to the installer, press `Ctrl+Alt+F6` (console numbers may differ; try other Fx keys starting from F1).

The remaining steps are hard to describe in text, so I recorded a video showing the whole process including the final installation step.

<iframe width="560" height="315" src="https://www.youtube.com/embed/5TVakMra3qQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

In my post [Linux filesystem operations](https://danshin.ms/Linux-filesystem-operations) you can find more info on adding disks, creating LVM volumes without partitions, and other scenarios.

In future posts I'll describe snapshots and more features that LVM provides.

That's it — like, subscribe, hit the bell. :)
</div>
