---
layout: post
title: Java对象在堆内的内存布局
excerpt: "了解了对象的生成过程，接下来了解对象在堆内存中的布局格式，了解一个对象实际用多少空间"
date:   2020-07-19 12:51:00
categories: [JVM]
comments: true
---

## 简介

Hotspot虚拟机中，Java对象在堆内存中的存储布局可分为三个部分：

* 对象头**Header**
* 实例数据**Instance Data**
* 对齐填充**Padding**

![查看源图像](https://it.baiked.com/wp-content/uploads/2020/02/47ccb7646f5c05df4176a178577573ee08830744.png)

## 详情

### 1、对象头

Hotspot虚拟机中，对象头部分包含两类信息。

#### ① MarkWord

用于存储对象自身的运行时数据，如GC分代年龄、哈希码、锁状态标志、线程持有的锁、偏向线程ID、偏向时间戳等信息。这些运行时数据在32位和64虚拟机中分别是32位和64位，官方称其为MarkWord。

对象运行时需要存储的信息有很多，实际上超出了32、64位Bitmap结构所能记录的最大限度。但对象头中的信息是与对象本身定义的数据无关的额外存储成本，为了虚拟机的存储效率，MarkWord被设计成有动态定义的数据结构，以尽量少的存储空间记录尽可能多的信息，根据对象自身的状态复用自己的空间。

#### ② 类型指针

对象指向它的类型元数据的指针，虚拟机通过这个指针判断它是哪个类型的实例。

> 并不是所有的虚拟机实现都需要在对象头中保存类型指针，即查找对象的元数据信息不一定要通过对象本身。

> 如果对象是一个Java数组，则还需要记录数组长度

### 2、实例数据

真正用于存储Java对象自身定义的数据的区域

数据内容包括：

1. 从父类继承的字段
2. 在该类中定义的字段

数据存储数据条件**默认**优先级：

1. 数据从长到短的顺序存储，如longs/doubles、ints、shorts、bytes/booleans、oop。
2. 在满足**1**的条件下，从父类中继承的字段会在子类定义的字段的前面
3. 在满足**1**、**2**的条件下，按照字段在源码中定义的顺序进行存储 

```java
//虚拟机配置参数
+XX:FieldsAllocationStyle //用于配置字段存储顺序
+XX:CompactFields		  //用于允许子类字段插入到父类字段存储间隙中，节省存储空间
```

### 3、Padding

占位字段，Hotspot虚拟机内存管理系统要求对象起始地址必须是8B的整数倍，即任何对象的大小都应是8B的整数倍。

