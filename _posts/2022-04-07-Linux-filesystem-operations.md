---
layout: post
title:  "Операции с файловой системой в Linux"
title_en: "Linux Filesystem Operations"
categories: [ Системное администрирование ]
tags: [ Linux, CentOS, LVM, How To ]
image: assets/images/linux-filesystem-operations/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Статья из серии `How To...`. В этой я собрал способы выполнить самые частые операции с файловой системой в Linux, в частности в `CentOS`. Статья может использоваться как справочник и будет дополняться. Добавляйте в закладки.***

Заходя в Windows, системный администратор может наглядно наблюдать подключенные дисковые устройства, видеть их тип, размер, свободное пространство, выполнять операции форматирования, расширения диска и т.п.. В Linux не всё так очевидно, приходится запоминать множество команд. Эта статья даёт ответы на следующие вопросы:

* [Сколько дисков в системе, как их увидеть?](#lsdev)
* [Как "разбиты" диски, сколько партиций, их тип и размер?](#partitions)
* [Сколько свободного места на дисках?](#df)
* [Как новый жесткий диск сделать доступным в системе?](#newdisk)
* [Как создать новый раздел?](#fdisk)
* [Как отформатировать раздел?](#mkfs)
* [Как смонтировать раздел?](#mount)
* [Как увидеть все смонтированные разделы и параметры монтирования?](#findmnt)
* [Как расширить пространство после увеличения размера жёсткого диска?](#resize)

* [Как разбить файловую систему во время установки ОС?](https://danshin.ms/LVM-quick-start/)

Так же вы узначете:

* [Как увеличить размер партиции](#resizepartition)
* [Как создать LVM Physical Volume](#pvcreate)
* [Как увеличить размер Physical Volume](#pvresize)
* [Как увеличить размер Virtual Group](#vgextend)
* [Как увеличить размер Logical Volume](#lvextend)
* [Как увеличить размер файловой системы](#xfs_growfs)

<a name="lsdev"></a>

# Сколько дисков в системе, как их увидеть?

Как известно, в *Linux всё есть файл*. И память, и диски - всё. Поэтому самый простой способ посмотреть устройства - это вывести содержимое каталога, где содержатся устройства. Устройства "живут" в `/dev`, а блочные, дисковые устройства называются sda, sdb и т.д., если они подключены через SCSI и hda, hdb и т.д., если через IDE. Сейчас, в век виртуализации, конечно, чаще всего можно встретить только SCSI устройства. Следующая команда выведет список всех дисков в системе:

```bash
ls -l /dev/sd*
```
```
`ls` - вывести содержимое каталога
`-l` - вывести списком
`/dev/sd*` - вывести содержимое каталога /dev, начинающееся на `sd`
```

![assets/images/linux-filesystem-operations/1.png](/assets/images/linux-filesystem-operations/1.png)

<a name="partitions"></a>

# Как "разбиты" диски, сколько партиций, их тип и размер?

Есть несколько способов увидеть эту информацию. Не прибегая ни к каким утилитам, что может быть полезно в системах с минимальным набором установленных пакетов, можно воспользоваться способом посмотреть содержимое файла `/proc/partitions`. Этот файл содержит информацию о распределённых блоках партиций. Посмотреть содержимое можно командой `cat`:

```bash
cat /proc/partitions
```

Пример этого вывода выглядит следующим образом:

![assets/images/linux-filesystem-operations/2.png](/assets/images/linux-filesystem-operations/2.png)

Больше информации о `Proc File System` (содержимом каталога /proc) можно узнать в [документации по RedHat](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/deployment_guide/s1-proc-topfiles).

Есть ещё одна утилита `fdisk`. Следующей командой, можно увидеть информацию о всех дисках и их размерах:

```bash
sudo fdisk -l
```

Более компактные сведения можно получить утилитой `parted` выполнив следующую команду:

```bash
sudo parted -l
```

![assets/images/linux-filesystem-operations/4.png](/assets/images/linux-filesystem-operations/4.png)


Ещё одним способом, является утилита `lsblk`. Она показывает информацию очень наглядно, в виде дерева.

![assets/images/linux-filesystem-operations/5.png](/assets/images/linux-filesystem-operations/5.png)

<a name="df"></a>

# Сколько свободного места на дисках?

Проще всего посмотреть свободное место на диске, воспользоваться утилитой `df`. Она выведет на экран все смонтированные файловые системы и дополнительную информацию, в частности размер. Удобнее всего воспользоваться следующей командой:

```bash
df -hT
```

```text
`df` - вывести информацию о смонтированных разделах
`-h` - вывести размер в удобочитаемом формате
`-T` - вывести информацию о типе файловой системы
```

![assets/images/linux-filesystem-operations/3.png](/assets/images/linux-filesystem-operations/3.png)

Важно отметить, что `df` показывает только смонтированные файловые системы и тольк размер самой файловой системы. А она может отличаться от размера диска или партиции. Для определния размера диска или партиции используйте `fdisk`, `parted` или `lsblk`, о которых упоминалось выше.

<a name="newdisk"></a>

# Как новый жесткий диск сделать доступным в системе?

<a name="fdisk"></a>

## Cоздать новый раздел

Для этого можно воспользоваться утилитами `fdisk` или `parted`. Покажу на примере первой.

```bash
# Запустить fdisk выбрав нужный диск
sudo fdisk /dev/sdb

n # создать новый раздел
p # выбрать тип, например primary
1 # ввести номер партиции или нажать enter, чтобы использовать предложенное значение
2048 # выбрать первый сектор или нажать enter, чтобы использовать предложенное значение
266338303 # выбрать последний сектор или нажать enter, чтобы использовать предложенное значение
w # записать изменения и выйти
```

<a name="mkfs"></a>

## Отформатировать раздел (создать файловую систему)

Cоздать файловую систему xfs на созданном разделе

```bash
sudo mkfs -t xfs /dev/sdb1
```

<a name="mount"></a>

## Смонтировать раздел

Добавить строку монтирования в файл /etc/fstab. Это можно сделать руками, воспользовавшись привычным редактором vi, vim, nano, e.t.c. Открываем фай с использованием команды sudo и добавляем новую строку в конце файла:

```bash
sudo vi /etc/fstab
```

*Пример файла /etc/fstab*
```text
/dev/mapper/cl-root     /                       xfs     defaults        0 0
UUID=15a55219-a817-4a27-b3ac-14d96296e457 /boot                   xfs     defaults        0 0
/dev/mapper/cl-home     /home                   xfs     defaults        0 0
/dev/mapper/cl-swap     none                    swap    defaults        0 0
/dev/sdb1               /mnt/dms                xfs     defaults        0 0
```

Либо можно выполнить следующую команду:

```bash
sudo bash -c 'echo "/dev/sdb1 /mnt/dms xfs defaults 0 0" >> /etc/fstab '
```

Монтировать раздел можно не только по имени. Но и по UUID, LABEL и т.д.. Чтобы увидеть UUID раздела можно воспользоваться одним из следующих способов.

```bash
sudo blkid
sudo blkid /dev/sd*

sudo lsblk -f
lsblk -o +uuid,name

ls -la /dev/disk/by-uuid/
```

У монтирования по UUID есть несколько преимуществ и недостатков.

Преимещества:
1. При изменении порядка подключения дисков, название раздела может поменятся. Например, вместо sda стать sdb. Но UUID раздела останется прежнем, т.к. он хранится в суперблоке.

> Суперблок содержит информацию, необходимую для монтирования и управления работой файловой системы. Суперблок является начальной точкой файловой системы. Он имеет размер 1024 байта и всегда располагается по смещению 1024 байта от начала файловой системы.

2. Так же UUID раздела сохраняется при отключении и переносе в другую систему.

Недостатки: 
1. UUID раздела может поменятся, например при пересоздании файловой системы.

2. В одной системе нельзя смонтировать два раздела с одинаковым UUID. Поэтому такой способ монтирования нельзя использовать с LVM снапшотами и клонированными дисками.

>UUID можно изменить командой `tune2fs -U new_uuid /dev/sdaX`

>После изменения файла /etc/fstab, настоятельно рекомендую проверить то, что описанные в нём разделы успешно монтируются. Для этого нужно выполнить команду `sudo mount -a`. Если вы не видите никакой ошибки, то смело можно перезагружаться.

<a name="findmnt"></a>

## Увидеть все смонтированные разделы и параметры монтирования

Для просмотра списка точек монтирования выполните команду:

```bash
df  -aTh
```

Чтобы найти больше информации о точках монтирования в вашей системе, выполните команду:

```bash
findmnt
```

![assets/images/linux-filesystem-operations/6.png](/assets/images/linux-filesystem-operations/6.png)


Кроме того, вы можете использовать команду cat:

```bash
cat /proc/self/mounts
```

Также вы можете использовать команду mount, как показано далее:

```bash
mount -l
```

<a name="resize"></a>

## Расширить пространство после увеличения размера жёсткого диска

Есть несколько сценариев, когда нужно увеличить размер файловой системы. 


* Вы увеличили размер виратуального диска. 
* Восстановили образ системы на диск большего размера. 
* Добавили ещё один диск в систему.


> Перед тем как выполнять какие либо манипуляции с дисками, разделами и файловой системой, настоятельно рекомендую сделать резервную копию данных.

В первых двух случаях, вам нужно:
* [Увеличить размер партиции](#resizepartition)
* [Увеличить размер Physical Volume](#pvresize) и [Logical Volume](#lvextend), в случае с LVM
* [Увеличить размер файловой системы](#xfs_growfs)

В последнем случае, вам нужно: 
* [Создать новую партицию](#fdisk)
* [Создать LVM Physical Volume](#pvcreate), [Увеличить размер Virtual Group](#vgextend) и [Logical Volume](#lvextend), в случае с LVM
* [Увеличить размер файловой системы](#xfs_growfs)

<a name="resizepartition"></a>

### Увеличить размер партиции
Для увеличения размера партиции программой `fdisk`, нужно удалить партицию и создать новую, большего размера. `НЕ ПЕРЕЖИВАЙТЕ, ДАННЫЕ НЕ ПОСТРАДАЮТ.`

Запускаете fdisk, нажимаете `d`, чтобы удалить раздел. Вводите номер раздела, например `2`. Затем нажимаете `n` и создаёте новый раздел, с тем же номером и стартовым сектором, но уже большего размера. Затем выходите командой `w`.

Для увеличения размера партиции программой `parted`, можно воспользоваться встроенным методом resizepart, либо недокументированной функцией `pretend-input-tty`, выполнив следующую команду:

```bash
sudo parted /dev/sda ---pretend-input-tty resizepart 2 100%
```

<a name="pvresize"></a>

### Увеличить размер Physical Volume

```bash
sudo pvresize /dev/sda2
```

<a name="lvextend"></a>

### Увеличить размер Logical Volume

```bash
sudo pvresize /dev/sda2
```

<a name="vgextend"></a>

### Увеличить размер Virtual Group

```bash
sudo vgextend centos /dev/sdb1
```

*где /dev/sdb1 - это название нового раздела, который мы включаем в группу.

<a name="xfs_growfs"></a>

### Увеличить размер файловой системы

```bash
sudo xfs_growfs /dev/centos/root
```

<a name="pvcreate"></a>

### Создать LVM Physical Volume

```bash
sudo pvcreate /dev/sdb1
```

Отдельного внимания заслуживает увеличение `SWAP` партиции. 

Посмотреть размер SWAP можно следующей командой:

```bash
cat /proc/swaps || free || swapon -s
```

Для её увеличения нужно отключить SWAP, создать новый и подключить его.

```bash
sudo swapoff -v /dev/centos/swap || sudo swapoff -a
sudo mkswap /dev/centos/swap
sudo swapon -va
```

# Дополнительно:

### Создание раздела утилитой fdisk, файловой системы и монтирование

[![asciicast](https://asciinema.org/a/ArHlBNmnWbizJ4ujhvs0gv5mw.svg)](https://asciinema.org/a/ArHlBNmnWbizJ4ujhvs0gv5mw)


### Создание раздела утилитой parted, файловой системы и монтирование

[![asciicast](https://asciinema.org/a/QKFwTEIqNSxVlWVIbC8KzWM5Z.svg)](https://asciinema.org/a/QKFwTEIqNSxVlWVIbC8KzWM5Z)

### LVM - коротко о главном

[https://danshin.ms/LVM-quick-start/](https://danshin.ms/LVM-quick-start/)

### Как разбить файловую систему во время установки ОС

<iframe width="560" height="315" src="https://www.youtube.com/embed/5TVakMra3qQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

</div>

<div data-lang="en" markdown="1">
***A `How To...` series post. Here I collected ways to perform the most common filesystem operations in Linux (specifically `CentOS`). The article can be used as a reference and will be updated over time — bookmark it.***

In Windows, an administrator can easily see attached disks, their types, size, free space, perform formatting, resize disks, etc. In Linux, it's not always that obvious — you need to remember commands. This article answers the following questions:

* [How many disks are in the system and how to see them?](#lsdev)
* [How are disks partitioned? How many partitions, their type and size?](#partitions)
* [How much free space is on disks?](#df)
* [How to make a new disk available in the system?](#newdisk)
* [How to create a new partition?](#fdisk)
* [How to format a partition?](#mkfs)
* [How to mount a partition?](#mount)
* [How to see all mounted filesystems and mount options?](#findmnt)
* [How to expand space after increasing a disk size?](#resize)

* [How to partition a filesystem during OS installation](https://danshin.ms/LVM-quick-start/)

You will also learn:

* [How to resize a partition](#resizepartition)
* [How to create an LVM Physical Volume](#pvcreate)
* [How to resize a Physical Volume](#pvresize)
* [How to extend a Volume Group](#vgextend)
* [How to extend a Logical Volume](#lvextend)
* [How to grow a filesystem](#xfs_growfs)

<a name="lsdev"></a>

# How many disks are in the system?

As they say, *in Linux everything is a file*. Memory, disks — everything. So one of the simplest ways to list devices is to look at the directory where device files live.

Devices are under `/dev`. Block disk devices are usually named `sda`, `sdb`, etc. (SCSI). Historically, IDE disks were `hda`, `hdb`, etc. In modern virtualized environments you typically see SCSI-style names.

The following command prints a list of disks:

```bash
ls -l /dev/sd*
```

```
`ls` - list directory contents
`-l` - long listing format
`/dev/sd*` - show device nodes in /dev that start with `sd`
```

![assets/images/linux-filesystem-operations/1.png](/assets/images/linux-filesystem-operations/1.png)

<a name="partitions"></a>

# How are disks partitioned? How many partitions, their type and size?

There are several ways to see this.

Without relying on external utilities (useful on minimal systems), you can look at `/proc/partitions`. This file contains information about partition blocks. View it with `cat`:

```bash
cat /proc/partitions
```

Example output:

![assets/images/linux-filesystem-operations/2.png](/assets/images/linux-filesystem-operations/2.png)

More about the Proc filesystem can be found in [Red Hat documentation](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/deployment_guide/s1-proc-topfiles).

Another option is `fdisk`. This command shows info about all disks and their sizes:

```bash
sudo fdisk -l
```

More compact output can be obtained with `parted`:

```bash
sudo parted -l
```

![assets/images/linux-filesystem-operations/4.png](/assets/images/linux-filesystem-operations/4.png)

Another handy tool is `lsblk`. It shows disk layout in a tree-like form.

![assets/images/linux-filesystem-operations/5.png](/assets/images/linux-filesystem-operations/5.png)

<a name="df"></a>

# How much free space is on disks?

The simplest way is `df`. It prints all mounted filesystems and additional information like size. A convenient command is:

```bash
df -hT
```

```text
`df` - show mounted filesystem usage
`-h` - human readable sizes
`-T` - show filesystem type
```

![assets/images/linux-filesystem-operations/3.png](/assets/images/linux-filesystem-operations/3.png)

Note: `df` shows only mounted filesystems and the filesystem size. This can differ from the disk/partition size. To get disk/partition size use `fdisk`, `parted` or `lsblk`.

<a name="newdisk"></a>

# How to make a new disk available in the system?

<a name="fdisk"></a>

## Create a new partition

You can use `fdisk` or `parted`. Below is an example with `fdisk`.

```bash
# Start fdisk for the target disk
sudo fdisk /dev/sdb

n # create a new partition
p # choose partition type, e.g. primary
1 # partition number or press Enter to accept default
2048 # first sector or press Enter to accept default
266338303 # last sector or press Enter to accept default
w # write changes and exit
```

<a name="mkfs"></a>

## Format the partition (create a filesystem)

Create an XFS filesystem on the new partition:

```bash
sudo mkfs -t xfs /dev/sdb1
```

<a name="mount"></a>

## Mount the partition

Add a mount entry to `/etc/fstab`. You can edit the file manually using `vi`, `vim`, `nano`, etc. Open the file with sudo and add a new line at the end:

```bash
sudo vi /etc/fstab
```

*Example `/etc/fstab`:*

```text
/dev/mapper/cl-root     /                       xfs     defaults        0 0
UUID=15a55219-a817-4a27-b3ac-14d96296e457 /boot                   xfs     defaults        0 0
/dev/mapper/cl-home     /home                   xfs     defaults        0 0
/dev/mapper/cl-swap     none                    swap    defaults        0 0
/dev/sdb1               /mnt/dms                xfs     defaults        0 0
```

Or you can run:

```bash
sudo bash -c 'echo "/dev/sdb1 /mnt/dms xfs defaults 0 0" >> /etc/fstab '
```

You can mount by device name, UUID, LABEL, etc. To see a partition UUID, use one of these:

```bash
sudo blkid
sudo blkid /dev/sd*

sudo lsblk -f
lsblk -o +uuid,name

ls -la /dev/disk/by-uuid/
```

Mounting by UUID has pros and cons.

Advantages:
1. If disk order changes, the device name can change (e.g. `sda` becomes `sdb`), but UUID remains the same because it's stored in the superblock.

> A superblock contains information needed to mount and manage the filesystem. It's the starting point of the filesystem. It is 1024 bytes in size and is located at offset 1024 bytes from the beginning of the filesystem.

2. UUID is preserved if you move the disk to another system.

Disadvantages:
1. UUID can change, for example after recreating the filesystem.

2. You can't mount two partitions with the same UUID in one system, so this method doesn't work well with LVM snapshots and cloned disks.

> UUID can be changed with `tune2fs -U new_uuid /dev/sdaX`

> After editing `/etc/fstab`, it's highly recommended to verify that everything mounts successfully: run `sudo mount -a`. If there are no errors, you can reboot.

<a name="findmnt"></a>

## See all mounted filesystems and mount options

To see a list of mount points:

```bash
df  -aTh
```

To get more detailed mount info:

```bash
findmnt
```

![assets/images/linux-filesystem-operations/6.png](/assets/images/linux-filesystem-operations/6.png)

You can also use:

```bash
cat /proc/self/mounts
```

And:

```bash
mount -l
```

<a name="resize"></a>

## Expand space after increasing disk size

There are several scenarios where you need to grow a filesystem:

* You increased the size of a virtual disk.
* You restored an image onto a larger disk.
* You added an additional disk.

> Before performing any operations on disks/partitions/filesystems, I strongly recommend taking a backup.

In the first two cases you need to:

* [Resize the partition](#resizepartition)
* [Resize the Physical Volume](#pvresize) and [Logical Volume](#lvextend) (for LVM)
* [Grow the filesystem](#xfs_growfs)

In the last case you need to:

* [Create a new partition](#fdisk)
* [Create an LVM Physical Volume](#pvcreate), [extend the Volume Group](#vgextend) and [extend the Logical Volume](#lvextend)
* [Grow the filesystem](#xfs_growfs)

<a name="resizepartition"></a>

### Resize a partition

To resize a partition with `fdisk`, you delete the partition and create a new one of a larger size. `DON'T PANIC: DATA WILL NOT BE LOST.`

Start fdisk, press `d` to delete the partition and enter the partition number (for example `2`). Then press `n` to create a new partition with the same number and the same starting sector, but with a larger end sector. Then write changes with `w`.

To resize with `parted`, you can use `resizepart` (or `---pretend-input-tty`), e.g.:

```bash
sudo parted /dev/sda ---pretend-input-tty resizepart 2 100%
```

<a name="pvresize"></a>

### Resize a Physical Volume

```bash
sudo pvresize /dev/sda2
```

<a name="lvextend"></a>

### Extend a Logical Volume

```bash
sudo pvresize /dev/sda2
```

<a name="vgextend"></a>

### Extend a Volume Group

```bash
sudo vgextend centos /dev/sdb1
```

*where `/dev/sdb1` is the new partition you add to the volume group.

<a name="xfs_growfs"></a>

### Grow the filesystem

```bash
sudo xfs_growfs /dev/centos/root
```

<a name="pvcreate"></a>

### Create an LVM Physical Volume

```bash
sudo pvcreate /dev/sdb1
```

Resizing the `SWAP` partition is a special case.

To see swap size:

```bash
cat /proc/swaps || free || swapon -s
```

To resize it, disable swap, create a new swap, and enable it:

```bash
sudo swapoff -v /dev/centos/swap || sudo swapoff -a
sudo mkswap /dev/centos/swap
sudo swapon -va
```

# Additional

### Creating a partition with fdisk, creating a filesystem, and mounting

[![asciicast](https://asciinema.org/a/ArHlBNmnWbizJ4ujhvs0gv5mw.svg)](https://asciinema.org/a/ArHlBNmnWbizJ4ujhvs0gv5mw)

### Creating a partition with parted, creating a filesystem, and mounting

[![asciicast](https://asciinema.org/a/QKFwTEIqNSxVlWVIbC8KzWM5Z.svg)](https://asciinema.org/a/QKFwTEIqNSxVlWVIbC8KzWM5Z)

### LVM: Quick Start

[https://danshin.ms/LVM-quick-start/](https://danshin.ms/LVM-quick-start/)

### How to partition a filesystem during OS installation

<iframe width="560" height="315" src="https://www.youtube.com/embed/5TVakMra3qQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
