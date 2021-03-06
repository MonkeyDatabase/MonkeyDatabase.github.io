---
layout: post
title: Wireshark入门(四)-捕获过滤器调试与使用
excerpt: "本文为阅读《Wirshark与Metasploit实战指南》的学习笔记。"
date:   2020-09-20 08:37:00
categories: [CyberSecurity]
comments: true
---


## 学习笔记

### 1、调试捕获过滤器


伯克利包过滤器BPF，以协议无关的形式提供指向数据链路层的原始接口，网络上所有的数据包，包括那些目的地址不是我们的包，都可以通过这种机制进行访问。

BPF以一种字符设备的形式存在，如“dev/bpf0”。在启动设备后，这些字符设备的文件描述符必须通过BIOCSETIF ioctl绑定特定的网卡。每个接口可以被多个监听器共享，而且每个文件描述符下面的过滤器所处理的数据是同样的。

每个次要设备需要单独的设备文件，如果文件已经被占用，打开文件会失败，errno被置为EBUSY。

一个分组可以通过写入BPF文件描述符来发送到网络上。

>BPF接口手册可在[FreeBSD手册](https://www.freebsd.org/cgi/man.cgi?query=bpf&manpath=FreeBSD+12.1-RELEASE)中查看

用下面这条命令可以打印出该语句编译成的处理器语言：

```powershell
#-d 打印生成的BPF代码
#-f 展示libpcap库的过滤器语法
dumpcap -f [expression] -d
```

下面以一个简单的例子进行分析：

```powershell
X:/> dumpcap -f "ether host 00:01:02:03:04:05" -d
Capturing on 'xxxxx* 12'
(000) ld       [8]
(001) jeq      #0x2030405       jt 2    jf 4
(002) ldh      [6]
(003) jeq      #0x1             jt 8    jf 4
(004) ld       [2]
(005) jeq      #0x2030405       jt 6    jf 9
(006) ldh      [0]
(007) jeq      #0x1             jt 8    jf 9
(008) ret      #262144
(009) ret      #0
```

1. 000行加载分组数据里源MAC地址后半部分的偏移量

   | 前导码            | 帧开始符          | MAC 目标地址 | MAC 源地址 | [802.1Q](https://baike.baidu.com/item/802.1Q)标签 (可选) | 以太类型 | 负载           | [冗余校验](https://baike.baidu.com/item/冗余校验) | 帧间距    |
   | ----------------- | ----------------- | ------------ | ---------- | -------------------------------------------------------- | -------- | -------------- | ------------------------------------------------- | --------- |
   | 10101010 7个octet | 10101011 1个octet | 6 octets     | 6 octets   | (4 octets)                                               | 2 octets | 46–1500 octets | 4 octets                                          | 12 octets |

   ```c
   #define ETH_ALAN 6
   struct ethhdr{
       unsigned char h_dest[ETH_ALEN]; 	//目的MAC
       unsigned char h_source[TEH_ALEN];	//源MAC
       __be16 h_proto;	//2B协议字段
}
   ```
   
   * ld：将值复制入内存
   * 8：以太网帧去掉前导码和帧开始符，MAC目的地址占6位，先比较MAC源地址的后四个字节，因为MAC地址一共占6个字节，所以还需要在字节流中向后移动2个字节，所以8是由6+2计算得到的
   * []：将该偏移内对应的值
   
2. 001行对比分组数据中的源MAC地址的后四字节与过滤器中的0x2030405进行比较，如果true则跳转到002，如果false则跳转到004

   * jeq：判断值是否相等，如果相等则跳转到某个地址，如果不想等跳转到另一个地址，相当于if的判断条件是一个==条件
   * #0x2030405：给定了过滤器所使用的值，MAC地址后四字节为0x0203040506，由于最高位为0，则可以不写
   * jt：如果判断为真，跳转到某条指令
   * jf：如果判断为假，跳转到某条指令

3. 002-003行与000-001行功能类似，只是匹配了源MAC地址的前两个字节，如果匹配正确，则源MAC符合我们捕获筛选器的条件，跳转到008，返回一个非零值，进行捕获，如果匹配失败，则继续看目的MAC地址是否符合条件

4. 004-007功能与000-003行功能类似，只是是判断目的MAC地址是否符合条件。

### 2、捕获过滤器在渗透测试中的应用

在渗透测试过程中，如果目标系统出现问题，极容易产生误解，所以可以在渗透测试过程中保持全程抓包，将本机流量进行捕获

```shell
dumpcap -f "ether host xx:xx:xx:xx:xx:xx or broadcast" -w pentest -b filesize:10000
```

* -w *filename* : 定义输出文件名
* -b *filesize*:*NUM*：每隔*NUM*kB存储为一个文件

可以把它切换到后台执行：

* Ctrl+Z：切到后台
* bg：查看后台任务
* fg *serialNum* ：将序号对应的程序切到前台


## 独立思考

### 1. ioctl是什么？

ioctl，全称Input/Output Control，是一个专门用于设备输入输出操作的**系统调用**，系统调用的功能完全取决于请求码。

```c
int ioctl(int fd,int cmd,...);
```

| 参数 | 含义                                        |
| ---- | ------------------------------------------- |
| fd   | 文件描述符                                  |
| cmd  | 用户程序对设备的控制命令                    |
| ...  | 为补充参数，该参数的有无随cmd参数的含义而定 |

### 2. ioctl有什么用？

通过ioctl用户空间可以跟设备驱动通信，对设备的一些特性进行设置。

**cmd参数格式：**

| 设备类型 | 序列号 | 方向  | 数据尺寸 |
| -------- | ------ | ----- | -------- |
| 8 bit    | 8 bit  | 2 bit | 8~14 bit |

> BPF的ioctl操作码可在[FreeBSD手册](https://www.freebsd.org/cgi/man.cgi?query=bpf&manpath=FreeBSD+12.1-RELEASE)中查看

一个BPF分组过滤器被作为字符设备，字符设备需要通过BIOCSETIF ioctl绑定到一个网络接口。

### 3. 文件描述符是什么，有什么需要注意的地方？

本质上是一个非负整数。不同进程的同一文件描述符对应的文件**不一定**相同，不同文件的不同文件描述符所指向的文件有**可能**相同。

![文件描述符的细节](https://ftp.bmp.ovh/imgs/2020/09/4ab46a3e548da69e.jpg)

### 4. 为什么BPF编译后的处理器语言中取地址没有考虑前导码和帧定界符？

| 前导码            | 帧开始符SFD       | MAC 目标地址 | MAC 源地址 | [802.1Q](https://baike.baidu.com/item/802.1Q)标签 (可选) | 长度/类型 | 负载           | [冗余校验](https://baike.baidu.com/item/冗余校验)FCS | 帧间距    |
| ----------------- | ----------------- | ------------ | ---------- | -------------------------------------------------------- | --------- | -------------- | ---------------------------------------------------- | --------- |
| 10101010 7个octet | 10101011 1个octet | 6 octets     | 6 octets   | (4 octets)                                               | 2 octets  | 41–1500 octets | 4 octets                                             | 12 octets |

这和Wireshark的抓包时机有关。



## 产生过的疑问

1. ioctl是什么？
2. ioctl有什么用？
3. 文件描述符是什么，有什么需要注意的地方？
4. 为什么BPF编译后的处理器语言中取地址没有考虑前导码和帧定界符？



