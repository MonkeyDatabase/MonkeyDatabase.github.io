---
layout: post
title: 隐藏的信息
excerpt: "高校战疫网络安全分享赛-MISC-隐藏的信息解题过程"
date:   2020-04-18 18:00:00
categories: [CTF]
comments: true
---

1. Hex editor检查文件头0xffd8未发现问题
2. Hex editor检查文件尾0xffd9发现后续有TOGETYOURFLAG,尝试解压，密码错误
3. 检查是否是图种，修改后缀为zip、rar均无法解析
4. 用PS修好二维码三个定位点，成功扫描，扫描后结果为flag{this_is_also_not_flag}解压密码不在这里0.0！
5. 发现图片左下角有一些杂色，用Hex editor发现“USEBASE64”
6. Hex editor检查rar文件头0x504b0304、解压文件所需版本0x1400、通用位标记0x0000
   1. 通用位标记位全局通用位标记，作用为是否加密，如果压缩时设置了密码这里会是0x0900
   2. 猜测zip文件为伪加密
   3. 将此目录标识的0x0900，改为0x0000顺利解压
7. 解压得“隐藏的信息.wav”，是一首歌《我相信》，中间混加了关于武汉加油的音频。
8.  wav文件前几秒和后几秒钟没有声音，用Audacity频谱图结合双音多频进行译码，译码见下表
9. 对187485618521进行base64加密，得到MTg3NDg1NjE4NTIx
10. flag:flag{MTg3NDg1NjE4NTIx}


| low | high | result |
|:--------:|:-------:|:--------:|
| 700   | 1220   | 1   |
| 850   | 1330   | 8   |
| 850   | 1220   | 7   |
| 770   | 1220   | 4   |
| 850   | 1340   | 8   |
| 770   | 1350   | 5   |
| 770   | 1470   | 6   |
| 700   | 1220   | 1   |
| 820   | 1350   | 8   |
| 770   | 1330   | 5   |
| 700   | 1340   | 2   |
| 700   | 1220   | 1   |
{: rules="groups"}