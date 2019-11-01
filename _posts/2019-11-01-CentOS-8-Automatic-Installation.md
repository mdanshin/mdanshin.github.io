---
layout: post
title:  "Автоматическая установка CentOS 8"
categories: [ Администрирование ]
tags: [ Linux ]
image: assets/images/CentOS-8-Automatic-Installation/0.jpg
author: Mikhail
---
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
sed -e 's/Volume id: //' -e 's/ /\\x20/g'
```

В результате выполнения этой команды вы увидите имя тома. В вашем случае это имя может отличаться. Оно зависит от того, какой именно ISO-образ вы используете.

```
CentOS-8-BaseOS-x86_64
```

Запишите его, оно нам потребуется в дальнейшем.

### Добавьте новый пункт в меню загрузки

```bash
#
label kickstart
  menu label ^Kickstart Installation of CentOS 7.6.1810
  kernel vmlinuz
  append initrd=initrd.img inst.stage2=hd:LABEL=CentOS-8-BaseOS-x86_64 inst.ks=cdrom:/anaconda-ks.cfg
#
```

>Установите для параметра inst.stage2 = hd: LABEL = имя тома, полученное на предыдущем шаге.

### Создайте загрузочный ISO-образ из содержимого рабочей директории

```bash
mkisofs -J -T -o /root/CentOS-8-x86_64-1905-dvd1.iso -b isolinux/isolinux.bin \
-c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table \
-R -m TRANS.TBL -graft-points -V "CentOS-8-BaseOS-x86_64" \
/root/CentOS-install/
```
>Задайте для параметра -V имя тома, полученное на предыдущем шаге.

Загрузочный образ готов. Можете использовать его для автоматической установки CentOS.