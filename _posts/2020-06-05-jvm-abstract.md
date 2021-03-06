---
layout: post
title: jvm知识架构
excerpt: "学习jvm需要对计算机组成原理、数据结构、操作系统要有深刻了解"
date:   2020-06-05 09:00:00
categories: [JVM]
comments: true
---

## JVM概念

JVM是一种用于计算设备的规范，它是通过在物理机上仿真模拟计算机功能来实现的。

引入Java虚拟机后，Java语言在不同平台上运行时不需要重新编译。Java语言使用Java虚拟机屏蔽了平台的差异，使得Java语言编译器只需生成在Java虚拟机上运行的字节码文件，就可以在多种平台上运行，实现跨平台。

## JVM学习路线

1. 字节码文件结构
   * 能看懂jclasslib的展示结果
   * 了解类加载器子系统解析字节码文件的过程
2. 运行时数据区
   * 方法区
   * 本地方法栈
   * 虚拟机栈
   * 堆
   * 程序计数器
3. 类加载器
   * 加载阶段
   * 验证阶段
   * 准备阶段
   * 解析阶段
   * 初始化阶段
   * 使用阶段
   * 卸载阶段
4. 执行引擎
   * new一个对象的过程
   * 异常的实现原理
   * .....
5. GC算法
   * 标记-清除算法
   * 标记-整理算法
   * 分代-复制算法
6. 垃圾收集器
   * Serial
   * Parallel
   * CMS
   * GI
   * ZGC
7. OOM分析
   * 方法区溢出
   * 本地方法栈溢出
   * 虚拟机栈溢出
   * 堆溢出
   * 死锁
8. 调优工具
   * JDK自带工具
   * VisualVM
   * JConsole
   * Arthas
9. GC日志分析
   * GCViewer
   * GCEasy
10. JVM性能调优
   * 计算对象大小
   * 空对象
   * 指针压缩
   * 对象在内存中的存储
   * .......