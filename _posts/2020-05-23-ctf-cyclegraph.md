---
layout: post
title: cyclegraph
excerpt: "高校战疫网络安全分享赛-Reverse-cyclegraph"
date:   2020-05-23 14:00:00
categories: [CTF]
comments: true
---

## 解法一

1. 将文件拖到IDA中，发现输入之前有一些操作，但不影响输入，可以用OD动态调试查看。
2. 输入之后，程序将输入数据与v5和v7进行了运算，while循环i初始为5且i<21，说明flag长度为20


### IDA操作流程

1. 左侧为函数窗口，列出了程序中所有的函数。
2. 右侧较大的默认的是整个程序的执行流程图，可以使用空格键切换。
3. 左下角的图形窗口可以滚动，右侧的流程图也会随之改变。
4. 函数窗口会识别出常用函数，所以sub_开头的函数，可能是程序员自定义的，也可能是ida没有识别的。
5. shift+F12可以列出所有的字符串。
6. dataxref是数据引用的意思，即程序在何处调用了此字符串。通过双击即可跳转至目标位置。
7. ida有时无法识别出程序的子函数是什么功能而用sub_xxxx去命名，很不方便。我们可以选中目标函数名，按下n，输入新函数名即可。这时左侧的函数窗口也会随之改变。
8. ida不能智能判断数据类型，所以可以通过H键转换为十进制，通过B键转换为二进制。
9. ida将局部变量命名为var_,将参数命名为arg_。
10. F12会列出当前光标所在函数的流程图，ida会将会将条件跳转转化为真假的标注更加简洁。
11. F5反编译程序

### 汇编语言

1. jnz 不为0跳转
2.cmp