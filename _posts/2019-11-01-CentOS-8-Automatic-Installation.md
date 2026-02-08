---
layout: post
title:  "Автоматическая установка CentOS 8"
title_en: "Automated CentOS 8 Installation"
categories: [ Администрирование ]
tags: [ Linux ]
image: assets/images/CentOS-8-Automatic-Installation/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***В этой статье описана простая процедура создания ISO-образа, который автоматически устанавливает CentOS. Вы можете использовать эту процедуру для развертывания CentOS на нескольких машинах.***

### Эталонная установка ОС

Первым делом скачайте загрузочный образ и выполните с него эталонную установку CentOS в ручном режиме. В процессе установки будет создан т.н. файл ответов, в котором будут описаны все параметры установки. В заключении мы создадим загрузочный ISO-образ, в который поместим файл ответов, чтобы процесс установки выполнялся автоматически, без участия администратора.

После установки, поместите ISO-образ в установленную ОС в директорию `/tmp/`

Для создания загрузочного ISO-образа нам потребуется две утилиты `isoinfo` и  `mkisofs`. Если в вашей системе их нет, то вы можете получить её установив пакет `genisoimage`.

```bash
yum install genisoimage
```

### Смонтируйте образ

```bash
mount -o loop /tmp/CentOS-8-x86_64-1905-dvd1.iso /mnt/
```

### Создайте рабочую директорию и скопируйте в неё содержимое ISO

```bash
mkdir /root/CentOS-install/
shopt -s dotglob
cp -avRf /mnt/* /root/CentOS-install/
```

### Размонтируйте диск

```bash
umount /mnt/
```

### Скопируйте файл ответов, созданный в процессе установки эталонной ОС, в рабочую директорию

```bash
cp /root/anaconda-ks.cfg /root/CentOS-install/
```

### Определите имя тома установочного диска

```bash
isoinfo -d -i CentOS-8-x86_64-1905-dvd1.iso | grep "Volume id" | \
sed -e 's/Volume id: //'
```

В результате выполнения этой команды вы увидите имя тома. В вашем случае это имя может отличаться. Оно зависит от того, какой именно ISO-образ вы используете.

```
CentOS-8-BaseOS-x86_64
```

Запишите его, оно нам потребуется в дальнейшем.

### Добавьте новый пункт в меню загрузки

Добавьте новый пункт меню в загрузочный файл `/root/CentOS-install/isolinux/isolinux.cfg`, в котором используется файл Kickstart.

Например:

```bash
#
label kickstart
  menu label ^Kickstart Installation of CentOS 7.6.1810
  kernel vmlinuz
  append initrd=initrd.img inst.stage2=hd:LABEL=CentOS-8-BaseOS-x86_64 inst.ks=cdrom:/anaconda-ks.cfg
#
```

>Установите для параметра `inst.stage2 = hd: LABEL =` имя тома, полученное на предыдущем шаге.

### Создайте загрузочный ISO-образ из содержимого рабочей директории

```bash
mkisofs -J -T -o /root/CentOS-8-x86_64-1905-dvd1.iso -b isolinux/isolinux.bin \
-c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table \
-R -m TRANS.TBL -graft-points -V "CentOS-8-BaseOS-x86_64" \
/root/CentOS-install/
```
>Задайте для параметра `-V` имя тома, полученное на предыдущем шаге.

Загрузочный образ готов. Можете использовать его для автоматической установки CentOS.

Материалы для этой статьи взяты с [официального сайта CentOS](https://docs.centos.org/en-US/centos/install-guide/Simple_Installation/#sect-simple-install-kickstart).
</div>

<div data-lang="en" markdown="1">
***This article describes a simple procedure to create an ISO image that installs CentOS automatically. You can use it to deploy CentOS on multiple machines.***

### Reference install

First, download the official ISO and perform a manual (reference) installation of CentOS. During the install, the so-called “answer file” (Kickstart file) is created — it contains all installation parameters.

At the end we'll create a new bootable ISO image and include this answer file so that installation runs automatically, without administrator involvement.

After the installation, copy the original ISO into the installed OS, into `/tmp/`.

To build a bootable ISO we need two utilities: `isoinfo` and `mkisofs`. If they are not installed, install the `genisoimage` package:

```bash
yum install genisoimage
```

### Mount the ISO

```bash
mount -o loop /tmp/CentOS-8-x86_64-1905-dvd1.iso /mnt/
```

### Create a working directory and copy ISO contents

```bash
mkdir /root/CentOS-install/
shopt -s dotglob
cp -avRf /mnt/* /root/CentOS-install/
```

### Unmount

```bash
umount /mnt/
```

### Copy the Kickstart file to the working directory

Copy the answer file created during the reference installation (usually `/root/anaconda-ks.cfg`) into the working directory:

```bash
cp /root/anaconda-ks.cfg /root/CentOS-install/
```

### Get the ISO volume label

```bash
isoinfo -d -i CentOS-8-x86_64-1905-dvd1.iso | grep "Volume id" | \
sed -e 's/Volume id: //'
```

This prints the volume label. Your label may differ depending on the ISO you use, for example:

```
CentOS-8-BaseOS-x86_64
```

Write it down — we will need it later.

### Add a new boot menu entry

Add a new menu entry to `/root/CentOS-install/isolinux/isolinux.cfg` that uses the Kickstart file.

Example:

```bash
#
label kickstart
  menu label ^Kickstart Installation of CentOS 7.6.1810
  kernel vmlinuz
  append initrd=initrd.img inst.stage2=hd:LABEL=CentOS-8-BaseOS-x86_64 inst.ks=cdrom:/anaconda-ks.cfg
#
```

> Set the `inst.stage2=hd:LABEL=` value to the volume label you got in the previous step.

### Build a new bootable ISO

```bash
mkisofs -J -T -o /root/CentOS-8-x86_64-1905-dvd1.iso -b isolinux/isolinux.bin \
-c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table \
-R -m TRANS.TBL -graft-points -V "CentOS-8-BaseOS-x86_64" \
/root/CentOS-install/
```

> Set the `-V` value to the volume label you got earlier.

Done — the bootable ISO is ready. You can now use it to install CentOS automatically.

Source material: [CentOS official documentation](https://docs.centos.org/en-US/centos/install-guide/Simple_Installation/#sect-simple-install-kickstart).
</div>
