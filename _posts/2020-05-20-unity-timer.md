---
layout: post
title: Unity计时器
excerpt: "由于Time.time功能较少，而游戏中常需要记录时间"
date:   2020-05-20 8:00:00
categories: [Unity]
comments: true
---

##初级实现方法

### Update帧检测

{% highlight c#%}
private void Update(){
	totalTime-=Time.deltaTime;
	if(totalTime<=0){
		//到时间的操作
	}
}
{% endhighlight %}

### 协程

{% highlight c#%}
private IEnumerator Do(){
	while(true){
		totalTime-=Time.deltaTime;
		if(totalTime<=0){
			//到时间后的操作
			yield break；
		}
	}
}
{% endhighlight %}

## 中级实现方法

为了降低耦合，使计时器可以通用化，可以建一个Timer类

{% highlight c#%}
public class Timer{
	public float Duration;
	public float LeftTime;
	private Action _updateAction;
	private Action _callAction;
	private bool _isPause;
	
	public Timer(float duration,Action updateAction=null,Action callAction=null,Action initAction=null){
		LeftTime = duration;
            		Duration = duration;
            		if (intiAction != null) intiAction.Invoke();
            		_updateAction = updateAction;
            		_callAction = callAction;
            		_isPause = false;
	}
	public void OnUpdate(float deltaTime)｛
            		LeftTime -= deltaTime;
            		if (LeftTime <= 0)｛
                		if (_callAction != null)
                    			_callAction.Invoke();
           		 ｝
            		else｛
               			 if (_updateAction != null && !_isPause)
                    			_updateAction.Invoke();  
            		｝
        	｝
        	public void SetTimerTrick(bool b)｛
            		_isPause = b;
        	｝
}
{% endhighlight %}