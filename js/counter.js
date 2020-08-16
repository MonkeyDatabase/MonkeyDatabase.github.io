//初始化连接
AV.init({
  appId: "Yn5UUjgkoWbUdOYFW6sboGce-gzGzoHsz",
  appKey: "Dg9ACgUv8tGq5mEagNyphefg",
  serverURL: "https://yn5uujgk.lc-cn-n1-shared.com"
});

    // 自己创建的Class的名字
    var name = 'Counter';

    //创建记录方法
    function createRecord(Counter){
      // 设置 ACL
      var acl = new AV.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(true);
      // 获得span的所有元素
      var elements=document.getElementsByClassName('leancloud_visitors');
      // 一次创建多条记录
      var allcounter=[];
      for (var i = 0; i < elements.length ; i++) {
        // 若某span的内容不包括 '-' ，则不必创建记录
        if(elements[i].textContent.indexOf('-') == -1){
          continue;
        }

        //自动获取url
        var url = window.location.href;
        var d = new Date();
        var time =d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
        var ip =  document.getElementById("thepublicip").innerText;

        var newcounter = new Counter();
        newcounter.setACL(acl);
        newcounter.set("URL", url);
        newcounter.set("IP",ip);
        newcounter.set("Time", time);
        allcounter.push(newcounter);
      }
      AV.Object.saveAll(allcounter).then(function (todo) {
        // 成功保存记录之后
        console.log('创建访问记录成功！');
      }, function (error) {
        // 异常错误 
        console.error('创建记录失败: ' + error.message);
      });
    }

    //计数方法
    function showCount(Counter){
      var d = new Date();
      var time =d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
      var ip =  document.getElementById("thepublicip").innerText;

      //设置查询Count表
      var urlquery = new AV.Query(name);
      urlquery.startsWith("URL",window.location.href);
      var timequery = new AV.Query(name);
      timequery.startsWith("Time",time);
      var ipquery= new AV.Query(name);
      ipquery.startsWith("IP",ip);
      var query1 = AV.Query.and(urlquery,timequery);
      var query = AV.Query.and(query1,ipquery);
      
      query.count().then(function(count){
	if(count==0){
	    createRecord(Counter);
	}
	else
	     console.log('此用户今天已访问过本网页');
	});

      urlquery.count().then(function(count){
	var times = document.getElementById("thefinalcount");
	times.textContent=count;
	});
    }



   $(function() {
  var Counter = AV.Object.extend(name);
      showCount(Counter);
    });